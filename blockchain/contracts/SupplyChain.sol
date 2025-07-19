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

    // NEW: Mapping to track if a specific company has invited a specific user
    mapping(uint256 => mapping(address => bool)) public companyHasInvitedUser;

    // --- Events ---
    event CompanyRegistered(uint256 companyId, string name, address indexed walletAddress);
    event CompanyVerified(uint256 companyId, string name, address indexed walletAddress);
    event ProductCreated(uint productId, string name, uint256 indexed creatorCompanyId, uint256 indexed supplyChainId, string productHash);
    event UserInvited(address indexed user, Role role); // Existing event
    event UserAccepted(address indexed user, Role role);
    event NewSupplyChainCreated(uint256 supplyChainId, address indexed creator);
    // NEW: Event for when a company invites a user
    event CompanyInvitedUser(uint256 indexed inviterCompanyId, address indexed invitedUser, Role role);

    constructor() {
        admin = msg.sender;
        roles[admin] = Role.None; // Admin typically doesn't have a specific role in the enum initially, unless defined.
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
        // Added this require to ensure product hash uniqueness. If you removed it, consider adding it back!
        require(hashToProductId[_productHash] == 0, "Product with this hash already exists."); 
        require(bytes(_productHash).length == 64, "Invalid product hash length (must be 64 characters)");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(_productionDate <= block.timestamp, "Invalid production date (cannot be in the future)");

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

    // --- Role Management Functions (Admin and Company) ---

    // Original invite function, accessible only by the admin
    function inviteUser(address user, Role role) public onlyAdmin {
        require(roles[user] == Role.None, "User already has a role");
        require(role != Role.None, "Cannot invite to 'None' role"); // Added check
        roles[user] = role;
        invited[user] = true;
        emit UserInvited(user, role);
    }

    // NEW: Function to allow a verified company to invite a user to a specific role
    function inviteUserByCompany(address _user, Role _role) public onlyVerifiedCompany {
        // Ensure the invited user does not already have a role
        require(roles[_user] == Role.None, "User already has a role.");
        
        // Disallow inviting Role.None (0)
        require(_role != Role.None, "Cannot invite to 'None' role.");

        // Optionally, prevent a company from inviting itself to a new role (e.g., if it's already a verified company)
        // require(_user != msg.sender, "Cannot invite yourself.");

        // Prevent the same company from inviting the same user multiple times
        uint256 inviterCompanyId = walletToCompanyId[msg.sender];
        require(!companyHasInvitedUser[inviterCompanyId][_user], "This company has already invited this user.");

        roles[_user] = _role;       // Assign the role
        invited[_user] = true;      // Mark as invited, so they can accept

        // Record that this company has invited this user
        companyHasInvitedUser[inviterCompanyId][_user] = true;

        emit CompanyInvitedUser(inviterCompanyId, _user, _role); // Emit the new event
        emit UserInvited(_user, _role); // Also emit the general UserInvited event
    }

    function acceptInvite() public {
        require(invited[msg.sender], "Not invited");
        // Ensure they haven't already accepted an invite and have an assigned role
        require(!accepted[msg.sender], "Invite already accepted."); // Added check
        require(roles[msg.sender] != Role.None, "No role assigned for this invite."); // Added check

        accepted[msg.sender] = true;
        emit UserAccepted(msg.sender, roles[msg.sender]);
    }
}