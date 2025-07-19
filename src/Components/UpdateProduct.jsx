import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers'; // Keep ethers for potential real connection
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';
import '../styling/updateproduct.css';

// Replace with your actual deployed contract address
const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x7432DE22B2a94F3a8d0184815448E3Ee67E3C4D3";

const UpdateProduct = () => {
    const { productHash } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletAddress, setWalletAddress] = useState(''); // Will be '0xDummyAddress' for mock
    const [productDetails, setProductDetails] = useState(null);
    const [productHistory, setProductHistory] = useState([]);

    const [companyDetails, setCompanyDetails] = useState(null);
    const [currentWalletRole, setCurrentWalletRole] = useState(0);

    // Form states for updates
    const [eventType, setEventType] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Helper to map numeric role to string name for display
    const getRoleName = (roleValue) => {
        const roleNames = {
            0: 'None',
            1: 'Supplier',
            2: 'Shipper',
            3: 'Retailer',
            4: 'Delivery Hub'
        };
        return roleNames[roleValue] || 'Unknown';
    };

    // Helper to format timestamps
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    // --- Hardcoded Dummy Data ---
    const loadDummyData = useCallback(() => {
        // Ensure dummyProductHash for consistency
        let effectiveDummyHash = productHash;
        if (!effectiveDummyHash || !(effectiveDummyHash.length === 64 || (effectiveDummyHash.length === 66 && effectiveDummyHash.startsWith('0x')))) {
             effectiveDummyHash = "0xc1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"; // Default dummy hash
        } else if (effectiveDummyHash.length === 64) {
             effectiveDummyHash = '0x' + effectiveDummyHash; // Add 0x if not present for dummy consistency
        }

        const now = Math.floor(Date.now() / 1000);

        setWalletAddress("0xDummyShipperWalletAddress1234567890");
        setCurrentWalletRole(2); // Simulate a Shipper role
        setCompanyDetails({
            companyId: "789",
            name: "Dummy Logistics Co.",
            description: "A mock shipping company.",
            wallet: "0xDummyShipperWalletAddress1234567890",
            isVerified: true
        });

        setProductDetails({
            id: "PROD-001",
            name: "Organic Coffee Beans (Brazil)",
            description: "Premium single-origin organic coffee beans from a sustainable farm in Brazil.",
            batchId: "COFFEE-BR-2025-07-A",
            creatorCompanyId: "123", // Dummy Supplier Company ID
            supplyChainId: "CHAIN-XYZ",
            productionDate: now - (30 * 24 * 60 * 60), // 30 days ago
            exists: true,
            productHash: effectiveDummyHash // Use the effective hash
        });

        setProductHistory([
            {
                timestamp: now - (29 * 24 * 60 * 60),
                actorWallet: "0xDummySupplierWalletAddress",
                actorCompanyId: 123,
                eventType: "Harvested & Processed",
                location: "Farm Fazenda Nova, Minas Gerais, Brazil",
                notes: "Beans harvested, washed, and dried."
            },
            {
                timestamp: now - (28 * 24 * 60 * 60),
                actorWallet: "0xDummySupplierWalletAddress",
                actorCompanyId: 123,
                eventType: "Quality Check",
                location: "Supplier Warehouse, Sao Paulo, Brazil",
                notes: "Passed aroma and moisture tests."
            },
            {
                timestamp: now - (27 * 24 * 60 * 60),
                actorWallet: "0xDummySupplierWalletAddress",
                actorCompanyId: 123,
                eventType: "Packaged",
                location: "Supplier Warehouse, Sao Paulo, Brazil",
                notes: "Packaged in vacuum-sealed bags."
            },
            {
                timestamp: now - (26 * 24 * 60 * 60),
                actorWallet: "0xDummyShipperWalletAddress1234567890",
                actorCompanyId: 789, // Shipper company ID
                eventType: "Shipped",
                location: "Port of Santos, Brazil",
                notes: "Departed via cargo ship 'Ocean Explorer', container OE-9876."
            },
            {
                timestamp: now - (10 * 24 * 60 * 60),
                actorWallet: "0xDummyShipperWalletAddress1234567890",
                actorCompanyId: 789,
                eventType: "Customs Cleared",
                location: "Port of Mumbai, India",
                notes: "Cleared Indian customs inspection."
            }
        ]);
        setLoading(false);
    }, [productHash]);

    const initBlockchainAndFetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Standardize productHash for internal use: ensure it has the '0x' prefix
        let formattedProductHash = productHash;
        if (productHash && productHash.length === 64) {
            formattedProductHash = '0x' + productHash;
        }

        try {
            if (!window.ethereum) {
                setError("MetaMask not detected. Loading dummy data for demonstration.");
                loadDummyData();
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

            // Fetch current user's role and company details
            const roleBigInt = await supplyChainContract.roles(currentWallet);
            const roleValue = Number(roleBigInt);
            setCurrentWalletRole(roleValue);

            const companyIdBigInt = await supplyChainContract.getCompanyIdByWallet(currentWallet);
            const companyId = companyIdBigInt.toString();
            if (companyId !== "0") {
                const [name, description, walletAddrFromContract, isVerified] = await supplyChainContract.getCompanyDetails(companyIdBigInt);
                setCompanyDetails({ companyId, name, description, wallet: walletAddrFromContract, isVerified });
            } else {
                setCompanyDetails({ status: "unregistered" });
            }

            // Fetch product details - now validating the formattedProductHash
            // Assuming your contract functions (getProductByHash, getProductHistory) expect a bytes32,
            // which ethers.js handles by expecting a '0x' prefixed 64-char hex string.
            if (formattedProductHash && formattedProductHash.length === 66 && formattedProductHash.startsWith('0x')) {
                try {
                    const [
                        id,
                        name,
                        description,
                        batchId,
                        creatorCompanyId,
                        supplyChainId,
                        productionDate,
                        exists
                    ] = await supplyChainContract.getProductByHash(formattedProductHash);

                    setProductDetails({
                        id: id.toString(),
                        name,
                        description,
                        batchId,
                        creatorCompanyId: creatorCompanyId.toString(),
                        supplyChainId: supplyChainId.toString(),
                        productionDate: Number(productionDate),
                        exists,
                        productHash: formattedProductHash // Store the 0x prefixed hash
                    });

                    // Fetch product history
                    const history = await supplyChainContract.getProductHistory(formattedProductHash);
                    setProductHistory(history.map(event => ({
                        timestamp: Number(event.timestamp),
                        actorWallet: event.actorWallet,
                        actorCompanyId: Number(event.actorCompanyId),
                        eventType: event.eventType,
                        location: event.location,
                        notes: event.notes
                    })));

                } catch (productErr) {
                    console.error("Error fetching product details or history:", productErr);
                    // Check for specific error indicating product not found (e.g., revert reason)
                    let specificErrorMessage = "Product not found or error fetching details from blockchain.";
                    if (productErr.reason) { // Ethers.js often provides a 'reason' for reverts
                        specificErrorMessage = `Blockchain revert: ${productErr.reason}`;
                    } else if (productErr.data && typeof productErr.data === 'string' && productErr.data.startsWith('0x08c379a0')) {
                        try {
                            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + productErr.data.substring(10));
                            specificErrorMessage = `Blockchain revert: ${decoded[0]}`;
                        } catch (decodeErr) {
                            console.warn("Could not decode revert reason:", decodeErr);
                        }
                    } else if (productErr.message) {
                        specificErrorMessage = `Blockchain error: ${productErr.message}`;
                    }

                    setError(`${specificErrorMessage}. Loading dummy data as fallback.`);
                    loadDummyData(); // Fallback to dummy data on product fetch error
                }
            } else {
                setError("Invalid product hash format provided in URL (expected 64 hex chars, optionally with '0x' prefix). Loading dummy data.");
                loadDummyData(); // Fallback to dummy data on invalid hash format
            }

        } catch (err) {
            console.error("Initialization or data fetch error:", err);
            let errorMessage = `Failed to load page: ${err.message || err.toString()}`;
            if (err.code === 4001) {
                errorMessage = "Wallet connection rejected. Please approve in MetaMask.";
            } else if (err.code === "NETWORK_ERROR") {
                errorMessage = "Network error. Check connection/network.";
            } else {
                errorMessage = `Blockchain error: ${errorMessage}.`;
            }
            setError(`${errorMessage} Loading dummy data as fallback.`);
            loadDummyData(); // Fallback to dummy data on any blockchain error
        } finally {
            // setLoading(false); // Handled by loadDummyData or specific error/success paths
        }
    }, [productHash, loadDummyData]);

    useEffect(() => {
        initBlockchainAndFetchData();

        const handleAccountsChanged = () => initBlockchainAndFetchData();
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
    }, [initBlockchainAndFetchData]);

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        // For dummy data, just simulate a successful update
        if (!contract) { // If contract is null, we're likely in dummy data mode
            setLoading(true);
            setError(null);
            setTimeout(() => {
                const now = Math.floor(Date.now() / 1000);
                const newEvent = {
                    timestamp: now,
                    actorWallet: walletAddress,
                    actorCompanyId: companyDetails.companyId,
                    eventType: eventType,
                    location: location,
                    notes: notes
                };
                setProductHistory(prevHistory => [...prevHistory, newEvent]);
                alert("✅ (Dummy) Product updated successfully!");
                setEventType('');
                setLocation('');
                setNotes('');
                setLoading(false);
            }, 1500); // Simulate network delay
            return;
        }

        // --- Real Blockchain Interaction ---
        if (!productDetails || !companyDetails || !companyDetails.isVerified) {
            setError("Cannot update: Not connected, product not loaded, or company not verified.");
            return;
        }
        if (!eventType || !location) {
            setError("Event Type and Location are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Ensure productHash passed to contract has the '0x' prefix
            const hashToPass = productDetails.productHash; // Use the already standardized hash from state

            const tx = await contract.recordProductEvent(
                hashToPass, // Use the 0x prefixed hash
                eventType,
                location,
                notes
            );
            await tx.wait();

            alert("✅ Product updated successfully on blockchain!");
            await initBlockchainAndFetchData(); // Re-fetch data
            setEventType('');
            setLocation('');
            setNotes('');

        } catch (err) {
            console.error("Error updating product:", err);
            let errorMessage = `Failed to update product: ${err.message || err.toString()}`;
            if (err.code === 4001) {
                errorMessage = "Transaction rejected by user.";
            } else if (err.reason) {
                errorMessage = `Contract reverted: ${err.reason}`;
            } else if (err.data && typeof err.data === 'string' && err.data.startsWith('0x08c379a0')) {
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + err.data.substring(10));
                    errorMessage = `Transaction reverted: ${decoded[0]}`;
                } catch (decodeErr) {
                    console.warn("Could not decode revert reason:", decodeErr);
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Conditional rendering based on loading, error, and user/product status
    if (loading) {
        return (
            <div className="update-product-container loading-state">
                <h2>Loading Product & User Status...</h2>
                <p>Please ensure MetaMask is connected, or dummy data will load.</p>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error && !contract) { // Display dummy data message only if real connection fails
        return (
            <div className="update-product-container connect-wallet-state">
                <h2>Demonstration Mode</h2>
                <p>{error}</p>
                <p>The page is currently displaying hardcoded dummy data for demonstration purposes.</p>
                <p>To use real blockchain functionality, please ensure MetaMask is installed, unlocked, and connected to the correct network, then refresh the page.</p>
                <button onClick={() => window.location.reload()}>Try Connecting to MetaMask</button>
            </div>
        );
    }

    if (error) { // Display a general error if MetaMask connected but still issues
        return (
            <div className="update-product-container error-state">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
        );
    }

    if (!walletAddress) {
        return (
            <div className="update-product-container connect-wallet-state">
                <h2>Connect Your Wallet</h2>
                <p>Please connect your MetaMask wallet to view and update product details.</p>
            </div>
        );
    }

    if (!productDetails || !productDetails.exists) {
        return (
            <div className="update-product-container info-state">
                <h2>Product Not Found</h2>
                <p>The product with hash <code>{productHash}</code> does not exist on the blockchain or in dummy data.</p>
                <button onClick={() => navigate('/products')}>View All Products</button>
            </div>
        );
    }

    if (!companyDetails || companyDetails.status === "unregistered") {
        return (
            <div className="update-product-container unauthorized-state">
                <h2>Unauthorized</h2>
                <p>Your wallet is not registered as a company. Only registered companies can update product details.</p>
                <button onClick={() => navigate('/register')}>Register Your Company</button>
            </div>
        );
    }

    if (!companyDetails.isVerified) {
        return (
            <div className="update-product-container unauthorized-state">
                <h2>Unauthorized</h2>
                <p>Your company **({companyDetails.name})** is not yet verified by the admin. You cannot update product details.</p>
                <p>Please wait for admin verification.</p>
            
            </div>
        );
    }

    let availableEventTypes = [];
    switch (currentWalletRole) {
        case 1: // Supplier
            availableEventTypes = ['Quality Check', 'Packaged', 'Ready for Shipment'];
            break;
        case 2: // Shipper
            availableEventTypes = ['Shipped', 'In Transit', 'Customs Cleared', 'Arrived at Hub'];
            break;
        case 3: // Retailer
            availableEventTypes = ['Received at Retail', 'Stocked', 'Sold to Customer'];
            break;
        case 4: // Delivery Hub
            availableEventTypes = ['Received at Hub', 'Out for Delivery', 'Delivered'];
            break;
        default:
            availableEventTypes = [];
    }

    if (availableEventTypes.length === 0) {
        return (
            <div className="update-product-container unauthorized-state">
                <h2>Access Denied</h2>
                <p>Your current role ({getRoleName(currentWalletRole)}) does not have permissions to update products.</p>
                <p>Please contact your administrator if you believe this is an error.</p>
            </div>
        );
    }

    return (
        <div className="update-product-container">
            <div className="update-header">
                <h1><i className="fas fa-edit"></i> Update Product Status</h1>
                <p className="subtitle">Product Hash: <code className="product-hash-display">{productHash}</code></p>
                <p className="user-info">
                    Connected as: <strong>{companyDetails.name} (ID: {companyDetails.companyId})</strong> | Role: <strong>{getRoleName(currentWalletRole)}</strong>
                </p>
            </div>

            <div className="product-summary-card">
                <h3>Current Product: {productDetails.name}</h3>
                <p><strong>Batch:</strong> {productDetails.batchId}</p>
                <p><strong>Description:</strong> {productDetails.description}</p>
                <p><strong>Production Date:</strong> {formatTimestamp(productDetails.productionDate)}</p>
            </div>

            <div className="update-form-section">
                <h3><i className="fas fa-plus-circle"></i> Add New Event/State</h3>
                <form onSubmit={handleUpdateSubmit} className="update-form">
                    <label htmlFor="eventType">Event Type*</label>
                    <select
                        id="eventType"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Select an Event Type</option>
                        {availableEventTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <label htmlFor="location">Location*</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Warehouse A, City, Country"
                        required
                        disabled={loading}
                    />

                    <label htmlFor="notes">Notes (Optional)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional details or comments..."
                        rows="3"
                        disabled={loading}
                    ></textarea>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : `Record Event on ${contract ? 'Blockchain' : 'Dummy Data'}`}
                    </button>
                </form>
            </div>

            <div className="product-history-section">
                <h3><i className="fas fa-history"></i> Product History Timeline</h3>
                {productHistory.length > 0 ? (
                    <div className="timeline">
                        {productHistory.map((event, index) => (
                            <div className="timeline-item" key={index}>
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <h4>{event.eventType}</h4>
                                    <p><strong>Actor:</strong> {event.actorCompanyId !== 0 ? `Company ID ${event.actorCompanyId}` : (event.actorWallet ? event.actorWallet.substring(0, 10) + '...' : 'N/A')}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                    <p><strong>Timestamp:</strong> {formatTimestamp(event.timestamp)}</p>
                                    {event.notes && <p><strong>Notes:</strong> {event.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-history-message">No history recorded for this product yet.</p>
                )}
            </div>
        </div>
    );
};

export default UpdateProduct;