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

    // NEW STRUCT: To store individual updates/states of a product
    struct ProductState {
        uint256 timestamp;
        string location; // Current location of the product
        string status;   // Current status of the product (e.g., "In Transit", "Received", "Quality Check")
        uint256 updaterCompanyId; // The company that made this specific update
    }

    // ENHANCED Product struct: Now includes a dynamic array for history
    struct Product {
        uint id;
        string name;
        string description;
        string batchId;
        uint256 creatorCompanyId;
        uint256 supplyChainId;
        uint256 productionDate; // Original production timestamp
        bool exists;
        ProductState[] history; // Array to store all historical states/updates of this product
    }

    // --- State Variables ---
    uint256 public nextCompanyId;
    uint public productCounter;
    
    // Mappings
    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public walletToCompanyId;
    mapping(uint => Product) public products; // Mapping from product ID to Product struct
    mapping(uint256 => uint[]) public productsByCompanyId;
    mapping(uint256 => uint[]) public productsBySupplyChainId;
    mapping(string => uint) public hashToProductId; // Maps product hash (string) to productId (uint)
    
    // Role management
    mapping(address => Role) public roles;
    mapping(address => bool) public invited;
    mapping(address => bool) public accepted;

    // Mapping to track if a specific company has invited a specific user
    mapping(uint256 => mapping(address => bool)) public companyHasInvitedUser;

    // --- Events ---
    event CompanyRegistered(uint256 companyId, string name, address indexed walletAddress);
    event CompanyVerified(uint256 companyId, string name, address indexed walletAddress);
    event ProductCreated(uint productId, string name, uint256 indexed creatorCompanyId, uint256 indexed supplyChainId, string productHash);
    event UserInvited(address indexed user, Role role);
    event UserAccepted(address indexed user, Role role);
    event NewSupplyChainCreated(uint256 supplyChainId, address indexed creator); // This event might be unused if no function creates supply chains explicitly
    event CompanyInvitedUser(uint256 indexed inviterCompanyId, address indexed invitedUser, Role role);
    // NEW EVENT: Emitted when a product's state (location/status) is updated
    event ProductStateUpdated(
        uint indexed productId,
        string indexed productHash,
        string newLocation,
        string newStatus,
        uint256 timestamp,
        uint256 indexed updaterCompanyId
    );

    constructor() {
        admin = msg.sender;
        roles[admin] = Role.None; // Admin typically doesn't have a specific role in the enum initially
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
        string memory _productHash, // This is the unique hash from the client
        uint256 _productionDate
    ) public onlyVerifiedCompany {
        require(hashToProductId[_productHash] == 0, "Product with this hash already exists.");
        require(bytes(_productHash).length == 64, "Invalid product hash length (must be 64 hex characters)."); // SHA256 produces 64 hex chars
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(_productionDate <= block.timestamp, "Invalid production date (cannot be in the future)");

        uint256 creatorCompanyId = walletToCompanyId[msg.sender];
        productCounter++;

        // Create the initial state for history
        ProductState memory initialState = ProductState({
            timestamp: _productionDate, // Use production date as initial timestamp
            location: "Initial Production Site", // Default initial location
            status: "Created", // Default initial status
            updaterCompanyId: creatorCompanyId
        });

        // Directly assign to storage, this is where the fix was applied
        products[productCounter].id = productCounter;
        products[productCounter].name = _name;
        products[productCounter].description = _description;
        products[productCounter].batchId = _batchId;
        products[productCounter].creatorCompanyId = creatorCompanyId;
        products[productCounter].supplyChainId = _supplyChainId;
        products[productCounter].productionDate = _productionDate;
        products[productCounter].exists = true;
        products[productCounter].history.push(initialState); // This now works because products[productCounter] is a storage reference

        hashToProductId[_productHash] = productCounter; // Map string hash to product ID

        productsByCompanyId[creatorCompanyId].push(productCounter);
        productsBySupplyChainId[_supplyChainId].push(productCounter);

        emit ProductCreated(productCounter, _name, creatorCompanyId, _supplyChainId, _productHash);
        // Also emit ProductStateUpdated for the initial state for consistent event logging
        emit ProductStateUpdated(productCounter, _productHash, initialState.location, initialState.status, initialState.timestamp, initialState.updaterCompanyId);
    }

    // NEW FUNCTION: Allows updating the state of an existing product
    function updateProduct(
        string memory _productHash,
        string memory _newLocation,
        string memory _newStatus,
        uint256 _timestamp // This timestamp should be passed from the client (JS Date.now() / 1000)
    ) public onlyVerifiedCompany {
        uint productId = hashToProductId[_productHash];
        require(productId != 0, "Product not found.");
        require(products[productId].exists, "Product does not exist.");

        uint256 updaterCompanyId = walletToCompanyId[msg.sender];
        require(updaterCompanyId != 0, "Caller is not a registered company.");
        // Consider adding more specific role checks here if only certain roles can update

        // Get a storage reference to the product
        Product storage productToUpdate = products[productId];

        // Create a new ProductState entry
        ProductState memory newState = ProductState({
            timestamp: _timestamp,
            location: _newLocation,
            status: _newStatus,
            updaterCompanyId: updaterCompanyId
        });

        // Add the new state to the product's history
        productToUpdate.history.push(newState);

        emit ProductStateUpdated(productId, _productHash, _newLocation, _newStatus, _timestamp, updaterCompanyId);
    }

    // NEW FUNCTION: To retrieve the full history of a product
    function getProductHistory(string memory _productHash) public view returns (ProductState[] memory) {
        uint productId = hashToProductId[_productHash];
        require(productId != 0, "Product not found.");
        require(products[productId].exists, "Product does not exist.");
        return products[productId].history;
    }

    // Modified getProductByHash to also return history for convenience
    function getProductByHash(string memory _productHash) public view returns (
        uint id,
        string memory name,
        string memory description,
        string memory batchId,
        uint256 creatorCompanyId,
        uint256 supplyChainId,
        uint256 productionDate,
        bool exists,
        ProductState[] memory history // Added history here
    ) {
        uint productId = hashToProductId[_productHash];
        require(productId != 0, "Product not found");
        Product memory p = products[productId]; // Use memory here as we are returning a copy
        return (
            p.id,
            p.name,
            p.description,
            p.batchId,
            p.creatorCompanyId,
            p.supplyChainId,
            p.productionDate,
            p.exists,
            p.history // Return the history array
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

    function inviteUser(address user, Role role) public onlyAdmin {
        require(roles[user] == Role.None, "User already has a role");
        require(role != Role.None, "Cannot invite to 'None' role");
        roles[user] = role;
        invited[user] = true;
        emit UserInvited(user, role);
    }

    function inviteUserByCompany(address _user, Role _role) public onlyVerifiedCompany {
        require(roles[_user] == Role.None, "User already has a role.");
        require(_role != Role.None, "Cannot invite to 'None' role.");

        uint256 inviterCompanyId = walletToCompanyId[msg.sender];
        require(!companyHasInvitedUser[inviterCompanyId][_user], "This company has already invited this user.");

        roles[_user] = _role;
        invited[_user] = true;

        companyHasInvitedUser[inviterCompanyId][_user] = true;

        emit CompanyInvitedUser(inviterCompanyId, _user, _role);
        emit UserInvited(_user, _role);
    }

    function acceptInvite() public {
        require(invited[msg.sender], "Not invited");
        require(!accepted[msg.sender], "Invite already accepted.");
        require(roles[msg.sender] != Role.None, "No role assigned for this invite.");

        accepted[msg.sender] = true;
        emit UserAccepted(msg.sender, roles[msg.sender]);
    }
}