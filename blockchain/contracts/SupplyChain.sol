// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    address public admin;

    enum Role { None, Supplier, Shipper, Retailer, DeliveryHub }

    struct Product {
        uint id;
        string name;
        string description;
        string batchId;
        address creator;
        bool exists;
    }

    uint public productCounter = 0;
    mapping(uint => Product) public products;
    mapping(address => uint[]) public productsByCompany;

    mapping(address => Role) public roles;
    mapping(address => bool) public invited;
    mapping(address => bool) public accepted;
    mapping(address => bool) public isVerifiedCompany;

    event ProductCreated(uint productId, string name, address indexed creator);
    event UserInvited(address indexed user, Role role);
    event UserAccepted(address indexed user, Role role);
    event CompanyVerified(address indexed company);

    constructor() {
        admin = msg.sender;
        roles[admin] = Role.None;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyVerifiedCompany() {
        require(isVerifiedCompany[msg.sender], "Only verified companies can create products");
        _;
    }

    function inviteUser(address user, Role role) public onlyAdmin {
        require(roles[user] == Role.None, "User already has a role");
        roles[user] = role;
        invited[user] = true;
        emit UserInvited(user, role);
    }

    function acceptInvite() public {
        require(invited[msg.sender], "You are not invited");
        accepted[msg.sender] = true;
        emit UserAccepted(msg.sender, roles[msg.sender]);
    }

    function verifyCompany(address company) public onlyAdmin {
        isVerifiedCompany[company] = true;
        emit CompanyVerified(company);
    }

    function createProduct(string memory _name, string memory _description, string memory _batchId) public onlyVerifiedCompany {
        productCounter++;
        products[productCounter] = Product(productCounter, _name, _description, _batchId, msg.sender, true);
        productsByCompany[msg.sender].push(productCounter);
        emit ProductCreated(productCounter, _name, msg.sender);
    }

    function getProduct(uint _id) public view returns (Product memory) {
        require(products[_id].exists, "Product does not exist");
        return products[_id];
    }

    function getCompanyProducts(address _company) public view returns (uint[] memory) {
        return productsByCompany[_company];
    }
}
