import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';
import { useNavigate } from 'react-router-dom'; // For navigating to product details
import '../styling/allproducts.css'; // New CSS file for this component

// Replace with your actual deployed contract address
const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0xc65252fC5348ad0D64D7C84C29Ee76297d22B106";

const ITEMS_PER_PAGE = 10; // Number of products to display per page

const AllProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletAddress, setWalletAddress] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        name: '',
        batchNumber: '',
        companyId: '', // Assuming you might filter by the creating company's ID
        isSold: 'all' // 'all', 'true', 'false'
    });
    const [sort, setSort] = useState({ key: 'productionDate', order: 'desc' });

    const navigate = useNavigate();

    // Helper to format timestamps from blockchain (seconds)
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(Number(timestamp) * 1000); // Convert seconds to milliseconds
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const initMetaMaskAndContract = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!window.ethereum) {
                setError("MetaMask not detected. Please install MetaMask to use this feature.");
                setLoading(false);
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const currentWallet = await signer.getAddress();
            setWalletAddress(currentWallet);

            const supplyChainContract = new ethers.Contract(
                SUPPLY_CHAIN_CONTRACT_ADDRESS,
                SupplyChainArtifact.abi,
                signer
            );
            setContract(supplyChainContract);
            return supplyChainContract; // Return for immediate use
        } catch (err) {
            console.error("MetaMask initialization error:", err);
            setError(`Failed to connect to MetaMask: ${err.message}. Please ensure MetaMask is unlocked and connected to the correct network.`);
            setLoading(false);
            return null;
        }
    }, []);

    const fetchAllProducts = useCallback(async (contractInstance) => {
        if (!contractInstance) return;

        setLoading(true);
        setError(null);
        try {
            // --- ACTUAL CONTRACT INTEGRATION STARTS HERE ---
            // You will need a function in your SupplyChain.sol contract
            // that returns an array of all product hashes or product structs.
            // Example: function getAllProductHashes() public view returns (bytes32[] memory);
            // Or: function getAllProducts() public view returns (ProductStruct[] memory);

            // For now, let's use a mock function.
            // In a real DApp, you might iterate through product IDs or hashes
            // and call getProductDetailsByHash for each.
            console.log("Fetching all products from contract...");

            // Mocking data generation
            const mockProducts = [];
            const numProducts = 25; // Simulate 25 products
            const companyNames = ["Acme Co.", "Globex Corp.", "Wayne Enterprises", "Stark Industries", "Cyberdyne Systems"];
            const productNames = ["Laptop Pro X", "Smartwatch 5", "Wireless Earbuds", "Gaming Console", "VR Headset"];
            const descriptions = ["High-performance device.", "Advanced fitness tracking.", "Crystal clear audio.", "Next-gen gaming experience.", "Immersive virtual reality."];

            for (let i = 1; i <= numProducts; i++) {
                const isSoldStatus = Math.random() < 0.3; // 30% chance of being sold
                const productHash = ethers.keccak256(ethers.toUtf8Bytes(`product_${i}_${Date.now() + i}`));
                const companyIdx = Math.floor(Math.random() * companyNames.length);
                const productIdx = Math.floor(Math.random() * productNames.length);
                const randomTimestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 365 * 24 * 60 * 60); // Up to 1 year ago

                mockProducts.push({
                    id: `PROD-${i.toString().padStart(3, '0')}`,
                    productHash: productHash,
                    name: `${productNames[productIdx]} ${i}`,
                    description: descriptions[productIdx],
                    batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
                    productionDate: randomTimestamp,
                    manufacturerInfo: companyNames[companyIdx],
                    companyId: `COMP-${companyIdx + 1}`, // Mock company ID
                    currentLocation: isSoldStatus ? "Customer's Home" : "Warehouse A",
                    isSold: isSoldStatus,
                    // You might add price, current owner, etc.
                });
            }
            setProducts(mockProducts);
            // --- ACTUAL CONTRACT INTEGRATION ENDS HERE ---

        } catch (err) {
            console.error("Error fetching products:", err);
            setError(`Failed to load products: ${err.message}. Please check network connection.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let currentContract;
        initMetaMaskAndContract().then(contractInstance => {
            currentContract = contractInstance;
            if (currentContract) {
                fetchAllProducts(currentContract);
            }
        });

        // Event listeners for account/chain changes
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                initMetaMaskAndContract().then(contractInstance => {
                    if (contractInstance) fetchAllProducts(contractInstance);
                });
            } else {
                setWalletAddress('');
                setContract(null);
                setError("Wallet disconnected. Please connect MetaMask.");
                setProducts([]);
            }
        };
        const handleChainChanged = () => window.location.reload();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [initMetaMaskAndContract, fetchAllProducts]); // Depend on memoized functions

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleSortChange = (key) => {
        setSort(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedProducts = [...products]
        .filter(product => {
            return (
                product.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                product.batchNumber.toLowerCase().includes(filters.batchNumber.toLowerCase()) &&
                product.companyId.toLowerCase().includes(filters.companyId.toLowerCase()) &&
                (filters.isSold === 'all' || product.isSold.toString() === filters.isSold)
            );
        })
        .sort((a, b) => {
            const aValue = a[sort.key];
            const bValue = b[sort.key];

            if (typeof aValue === 'string') {
                return sort.order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            // For numbers/timestamps
            return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
        });

    const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredAndSortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const viewProductDetails = (productHash) => {
        // Navigate to a product detail page, using the productHash as a parameter
        navigate(`/product/${productHash}`);
    };

    return (
        <div className="all-products-container">
            <div className="products-header">
                <h1><i className="fas fa-boxes"></i> All Registered Products</h1>
                <p className="subtitle">Explore and verify products tracked on the blockchain.</p>
                {walletAddress && (
                    <p className="wallet-display">Connected Wallet: <strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</strong></p>
                )}
            </div>

            {error && <div className="alert alert-error"><i className="fas fa-exclamation-triangle"></i> {error}</div>}

            {!walletAddress && !loading && (
                <div className="alert alert-warning">
                    <i className="fas fa-wallet"></i> Please connect your MetaMask wallet to view products.
                </div>
            )}

            {loading && walletAddress && (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading products from the blockchain...</p>
                </div>
            )}

            {!loading && walletAddress && products.length === 0 && !error && (
                <div className="alert alert-info">
                    <i className="fas fa-info-circle"></i> No products found on the blockchain.
                </div>
            )}

            {!loading && walletAddress && products.length > 0 && (
                <>
                    <div className="filters-section">
                        <h3><i className="fas fa-filter"></i> Filters & Sort</h3>
                        <div className="filter-grid">
                            <div className="filter-item">
                                <label htmlFor="filterName">Product Name:</label>
                                <input
                                    type="text"
                                    id="filterName"
                                    name="name"
                                    value={filters.name}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by name"
                                />
                            </div>
                            <div className="filter-item">
                                <label htmlFor="filterBatch">Batch Number:</label>
                                <input
                                    type="text"
                                    id="filterBatch"
                                    name="batchNumber"
                                    value={filters.batchNumber}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by batch"
                                />
                            </div>
                            <div className="filter-item">
                                <label htmlFor="filterCompany">Company ID:</label>
                                <input
                                    type="text"
                                    id="filterCompany"
                                    name="companyId"
                                    value={filters.companyId}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by company ID"
                                />
                            </div>
                            <div className="filter-item">
                                <label htmlFor="filterSold">Sold Status:</label>
                                <select
                                    id="filterSold"
                                    name="isSold"
                                    value={filters.isSold}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">All</option>
                                    <option value="true">Sold</option>
                                    <option value="false">Available</option>
                                </select>
                            </div>
                        </div>
                        <div className="sort-buttons">
                            <button
                                onClick={() => handleSortChange('name')}
                                className={sort.key === 'name' ? 'active' : ''}
                            >
                                Name {sort.key === 'name' && (sort.order === 'asc' ? '▲' : '▼')}
                            </button>
                            <button
                                onClick={() => handleSortChange('productionDate')}
                                className={sort.key === 'productionDate' ? 'active' : ''}
                            >
                                Date {sort.key === 'productionDate' && (sort.order === 'asc' ? '▲' : '▼')}
                            </button>
                            <button
                                onClick={() => handleSortChange('companyId')}
                                className={sort.key === 'companyId' ? 'active' : ''}
                            >
                                Company {sort.key === 'companyId' && (sort.order === 'asc' ? '▲' : '▼')}
                            </button>
                        </div>
                    </div>

                    <div className="products-table-responsive">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Batch No.</th>
                                    <th>Manufacturer</th>
                                    <th>Production Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map(product => (
                                        <tr key={product.productHash}>
                                            <td>{product.name}</td>
                                            <td>{product.batchNumber}</td>
                                            <td>{product.manufacturerInfo} ({product.companyId})</td>
                                            <td>{formatTimestamp(product.productionDate)}</td>
                                            <td>
                                                <span className={`status-badge ${product.isSold ? 'sold' : 'available'}`}>
                                                    {product.isSold ? 'Sold' : 'Available'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-button view-details-button"
                                                    onClick={() => viewProductDetails(product.productHash)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-results">No products match your current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredAndSortedProducts.length > ITEMS_PER_PAGE && (
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index + 1}
                                    onClick={() => handlePageChange(index + 1)}
                                    className={currentPage === index + 1 ? 'active' : ''}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AllProducts;