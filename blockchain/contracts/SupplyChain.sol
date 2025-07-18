// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    address public admin;

    enum Role { None, Supplier, Shipper, Retailer, DeliveryHub }

    mapping(address => Role) public roles;
    mapping(address => bool) public invited;
    mapping(address => bool) public accepted;

    event UserInvited(address indexed user, Role role);
    event UserAccepted(address indexed user, Role role);

    constructor() {
        admin = msg.sender;
        roles[admin] = Role.None; // admin doesn't need a role
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyInvited() {
        require(invited[msg.sender], "You are not invited");
        _;
    }

    function inviteUser(address user, Role role) public onlyAdmin {
        require(roles[user] == Role.None, "User already has a role");
        roles[user] = role;
        invited[user] = true;
        emit UserInvited(user, role);
    }

    function acceptInvite() public onlyInvited {
        accepted[msg.sender] = true;
        emit UserAccepted(msg.sender, roles[msg.sender]);
    }

    function getUserRole(address user) public view returns (Role) {
        return roles[user];
    }

    function isAccepted(address user) public view returns (bool) {
        return accepted[user];
    }

    function isInvited(address user) public view returns (bool) {
        return invited[user];
    }
}
