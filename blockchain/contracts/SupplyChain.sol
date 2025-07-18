// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    address public admin;

    // Enum for roles within the supply chain
    enum Role { None, Supplier, Shipper, Retailer, DeliveryHub }

    // Struct for Company details
    struct Company {
        uint256 companyId;
        string name;
        string description;
        address walletAddress;
        bool isVerified;
    }

    // Enhanced Product struct with more details
    struct Product {
        uint id;
        string name;
        string description;
        string batchId;
        uint256 creatorCompanyId;
        uint256 supplyChainId;
        uint256 productionDate; // Added timestamp
        bool exists;
    }

    // --- State Variables ---
    uint256 public nextCompanyId;
    uint public productCounter;
    
    // Mappings
    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public walletToCompanyId;
    mapping(uint => Product) public products;
    mapping(uint256 => uint[]) public productsByCompanyId;
    mapping(uint256 => uint[]) public productsBySupplyChainId;
    mapping(string => uint) public hashToProductId; // New mapping for hash lookup
    
    // Role management
    mapping(address => Role) public roles;
    mapping(address => bool) public invited;
    mapping(address => bool) public accepted;

    // --- Events ---
    event CompanyRegistered(uint256 companyId, string name, address indexed walletAddress);
    event CompanyVerified(uint256 companyId, string name, address indexed walletAddress);
    event ProductCreated(uint productId, string name, uint256 indexed creatorCompanyId, uint256 indexed supplyChainId, string productHash);
    event UserInvited(address indexed user, Role role);
    event UserAccepted(address indexed user, Role role);
    event NewSupplyChainCreated(uint256 supplyChainId, address indexed creator);

    constructor() {
        admin = msg.sender;
        roles[admin] = Role.None;
        nextCompanyId = 1;
        productCounter = 0;
    }

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredCompany() {
        require(walletToCompanyId[msg.sender] != 0, "Caller is not a registered company.");
        _;
    }

    modifier onlyVerifiedCompany() {
        uint256 companyId = walletToCompanyId[msg.sender];
        require(companyId != 0, "Caller is not a registered company.");
        require(companies[companyId].isVerified, "Caller's company is not verified.");
        _;
    }

    // --- Company Management Functions ---
    function createCompany(string memory _name, string memory _description) public {
        require(walletToCompanyId[msg.sender] == 0, "Wallet already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 newCompanyId = nextCompanyId++;
        companies[newCompanyId] = Company({
            companyId: newCompanyId,
            name: _name,
            description: _description,
            walletAddress: msg.sender,
            isVerified: false
        });
        walletToCompanyId[msg.sender] = newCompanyId;
        emit CompanyRegistered(newCompanyId, _name, msg.sender);
    }

    function verifyCompany(uint256 _companyId) public onlyAdmin {
        require(_companyId > 0 && _companyId < nextCompanyId, "Invalid company ID");
        Company storage company = companies[_companyId];
        require(!company.isVerified, "Company already verified");

        company.isVerified = true;
        emit CompanyVerified(_companyId, company.name, company.walletAddress);
    }

    function getCompanyDetails(uint256 _companyId) public view returns (string memory, string memory, address, bool) {
        require(_companyId > 0 && _companyId < nextCompanyId, "Invalid company ID");
        Company storage company = companies[_companyId];
        return (company.name, company.description, company.walletAddress, company.isVerified);
    }

    function getCompanyIdByWallet(address _walletAddress) public view returns (uint256) {
        return walletToCompanyId[_walletAddress];
    }

    // --- Product Management Functions ---
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _batchId,
        uint256 _supplyChainId,
        string memory _productHash,
        uint256 _productionDate
    ) public onlyVerifiedCompany {
        require(bytes(_productHash).length == 64, "Invalid product hash");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(_productionDate <= block.timestamp, "Invalid production date");

        uint256 creatorCompanyId = walletToCompanyId[msg.sender];
        productCounter++;

        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            description: _description,
            batchId: _batchId,
            creatorCompanyId: creatorCompanyId,
            supplyChainId: _supplyChainId,
            productionDate: _productionDate,
            exists: true
        });

        // Store hash mapping
        hashToProductId[_productHash] = productCounter;

        productsByCompanyId[creatorCompanyId].push(productCounter);
        productsBySupplyChainId[_supplyChainId].push(productCounter);

        emit ProductCreated(productCounter, _name, creatorCompanyId, _supplyChainId, _productHash);
    }

    // New function to get product by hash
    function getProductByHash(string memory _productHash) public view returns (
        uint id,
        string memory name,
        string memory description,
        string memory batchId,
        uint256 creatorCompanyId,
        uint256 supplyChainId,
        uint256 productionDate,
        bool exists
    ) {
        uint productId = hashToProductId[_productHash];
        require(productId != 0, "Product not found");
        Product memory p = products[productId];
        return (
            p.id,
            p.name,
            p.description,
            p.batchId,
            p.creatorCompanyId,
            p.supplyChainId,
            p.productionDate,
            p.exists
        );
    }

    function getProduct(uint _id) public view returns (Product memory) {
        require(products[_id].exists, "Product does not exist");
        return products[_id];
    }

    function getCompanyProducts(uint256 _companyId) public view returns (uint[] memory) {
        require(_companyId > 0 && _companyId < nextCompanyId, "Invalid company ID");
        return productsByCompanyId[_companyId];
    }

    function getSupplyChainProducts(uint256 _supplyChainId) public view returns (uint[] memory) {
        return productsBySupplyChainId[_supplyChainId];
    }

    // --- Role Management Functions ---
    function inviteUser(address user, Role role) public onlyAdmin {
        require(roles[user] == Role.None, "User already has a role");
        roles[user] = role;
        invited[user] = true;
        emit UserInvited(user, role);
    }

    function acceptInvite() public {
        require(invited[msg.sender], "Not invited");
        accepted[msg.sender] = true;
        emit UserAccepted(msg.sender, roles[msg.sender]);
    }
}