import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { ethers } from 'ethers';
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';
import '../styling/qrcode.css'; // Ensure this CSS file exists and is robust

const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0xc65252fC5348ad0D64D7C84C29Ee76297d22B106"; // Your actual deployed contract address

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
    // Assuming timestamp is in seconds (from blockchain) or milliseconds (JS Date)
    const date = new Date(Number(timestamp) * 1000); // Convert seconds to milliseconds
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

const QRScannerWithUpload = () => {
    const [scanResult, setScanResult] = useState('');
    const [productHash, setProductHash] = useState(null);
    const [productDetails, setProductDetails] = useState(null); // This will hold rich product data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletAddress, setWalletAddress] = useState('');

    const fileInputRef = useRef(null); // Ref for the file input
    const canvasRef = useRef(null); // Ref for an off-screen canvas for image processing

    useEffect(() => {
        const initMetaMask = async () => {
            try {
                if (!window.ethereum) {
                    setError("MetaMask not detected. Please install MetaMask to use this feature.");
                    return;
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []); // Request accounts explicitly
                const signer = await provider.getSigner();
                setWalletAddress(await signer.getAddress());

                const supplyChainContract = new ethers.Contract(
                    SUPPLY_CHAIN_CONTRACT_ADDRESS,
                    SupplyChainArtifact.abi,
                    signer
                );
                setContract(supplyChainContract);

            } catch (err) {
                console.error("MetaMask initialization error:", err);
                setError(`Failed to connect to MetaMask: ${err.message}. Please refresh.`);
            }
        };
        initMetaMask();

        // Add event listeners for account and chain changes
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                    // Re-initialize contract if needed, or just update address
                    // For simplicity, we'll re-run initMetaMask which also gets the contract again
                    initMetaMask();
                } else {
                    setWalletAddress('');
                    setContract(null);
                    setError("Wallet disconnected. Please connect MetaMask.");
                }
            };
            const handleChainChanged = () => {
                window.location.reload(); // Reload on chain change to ensure correct network
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                // Cleanup listeners
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        setError(null);
        setScanResult('');
        setProductHash(null);
        setProductDetails(null); // Clear previous details

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                // Set canvas dimensions to match image
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                try {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert", // Often helps with color/inverted QRs
                    });

                    if (code) {
                        setScanResult(code.data);
                        console.log("Decoded QR Data:", code.data);
                        // Extract productHash from the scanned URL
                        try {
                            const url = new URL(code.data);
                            const pathParts = url.pathname.split('/');
                            // Assumes the product hash is the last part of the URL path
                            const extractedHash = pathParts[pathParts.length - 1];

                            if (extractedHash && extractedHash.length > 0) {
                                setProductHash(extractedHash);
                                console.log("Scanned Product Hash:", extractedHash);
                                fetchProductDetails(extractedHash); // Fetch details on successful scan
                            } else {
                                setError("Invalid QR code format. Could not extract product hash from URL.");
                            }
                        } catch (urlError) {
                            setError("QR code content is not a valid URL or product hash not found. Please ensure it's a URL ending with the product hash.");
                        }

                    } else {
                        setError("No QR code detected in the uploaded image. Please try a clearer image.");
                    }
                } catch (decodeError) {
                    console.error("Error decoding QR code:", decodeError);
                    setError("Error processing image for QR code: " + decodeError.message);
                }
            };
            img.onerror = () => {
                setError("Failed to load image. Please ensure it's a valid image file.");
            };
            img.src = imageDataUrl;
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    };

    const fetchProductDetails = async (hash) => {
        if (!contract) {
            setError("Blockchain contract not initialized. Please connect MetaMask.");
            return;
        }

        setLoading(true);
        setError(null);
        setProductDetails(null);

        try {
            // --- REPLACE THIS MOCK DATA WITH YOUR ACTUAL CONTRACT CALL ---
            // Example:
            // const details = await contract.getProductDetailsByHash(hash);
            // const events = await contract.getProductHistory(hash); // Assuming a function to get history

            // For now, let's use rich hardcoded mock data:
            const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds
            const mockDetails = {
                id: hash.substring(0, 10) + '...', // Shortened ID for display
                name: "Premium Organic Coffee Beans",
                description: "Single-origin Arabica beans, ethically sourced from Brazil. Roasted to perfection for a rich, aromatic flavor.",
                batchNumber: "BN-COFFEE-20240718-001",
                productionDate: currentTime - (30 * 24 * 60 * 60), // 30 days ago
                manufacturerInfo: "Green Valley Farms Ltd.",
                manufacturerAddress: "0xABC...123",
                currentLocation: "Retail Store A, New York",
                isSold: false,
                // Supply Chain Events (mocked timestamps for demonstration)
                events: [
                    {
                        type: "Manufactured",
                        actor: "Green Valley Farms Ltd.",
                        location: "Minas Gerais, Brazil",
                        timestamp: currentTime - (30 * 24 * 60 * 60), // 30 days ago
                        txHash: "0x1a2b3c4d5e..."
                    },
                    {
                        type: "Shipped from Origin",
                        actor: "Global Logistics Co.",
                        location: "Port of Santos, Brazil",
                        timestamp: currentTime - (28 * 24 * 60 * 60), // 28 days ago
                        txHash: "0x2b3c4d5e6f..."
                    },
                    {
                        type: "Received by Importer",
                        actor: "International Foods Inc.",
                        location: "Port of New York, USA",
                        timestamp: currentTime - (15 * 24 * 60 * 60), // 15 days ago
                        txHash: "0x3c4d5e6f7a..."
                    },
                    {
                        type: "Distributed to Retailer",
                        actor: "Local Distributor LLC",
                        location: "New York Warehouse",
                        timestamp: currentTime - (7 * 24 * 60 * 60), // 7 days ago
                        txHash: "0x4d5e6f7a8b..."
                    },
                    {
                        type: "Arrived at Retail Store",
                        actor: "Retail Store A",
                        location: "New York City",
                        timestamp: currentTime - (2 * 24 * 60 * 60), // 2 days ago
                        txHash: "0x5e6f7a8b9c..."
                    }
                ]
            };
            setProductDetails(mockDetails);

            // If fetching from contract, structure data like this:
            /*
            const [
                name,
                description,
                batchNumber,
                productionDate, // timestamp
                manufacturer,   // address or company ID
                currentOwner,   // address or company ID
                location,       // string
                isSold,         // boolean
                // Add any other relevant fields
            ] = await contract.getProductDetailsByHash(hash);

            const fetchedEvents = await contract.getProductHistory(hash); // Assumes this returns an array of structs/tuples

            setProductDetails({
                id: hash,
                name,
                description,
                batchNumber,
                productionDate: productionDate.toNumber(), // Convert BigNumber/BigInt to number
                manufacturerInfo: manufacturer, // You might need to fetch company name from ID
                currentLocation: location,
                isSold,
                events: fetchedEvents.map(event => ({
                    type: event.eventType, // Or map enum to string
                    actor: event.actor, // Or fetch company name
                    location: event.location,
                    timestamp: event.timestamp.toNumber(),
                    txHash: event.txHash
                }))
            });
            */

        } catch (err) {
            console.error("Error fetching product details:", err);
            setError(`Failed to fetch product details. This product may not exist on chain or there was a network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        if (!contract || !productHash || !productDetails) {
            alert("MetaMask not connected, or no product selected for payment.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Example: You might get the product's price from `productDetails` or another contract function
            // For now, hardcode a small amount for testing.
            const paymentAmount = ethers.parseEther("0.01"); // Example: 0.01 Ether

            console.log("Initiating MetaMask payment for product hash:", productHash);

            // You'll need a function like `purchaseProduct` in your SupplyChain.sol contract
            // that accepts the product hash and a value.
            const tx = await contract.purchaseProduct(
                productHash, // The product hash to identify the item
                { value: paymentAmount }
            );

            alert("Please confirm the transaction in MetaMask.");
            await tx.wait(); // Wait for the transaction to be mined

            alert("Payment successful! The product ownership should now be transferred on-chain.");
            console.log("Payment transaction successful:", tx);

            // You might want to re-fetch product details to show updated ownership
            fetchProductDetails(productHash); // Re-fetch to update status

        } catch (err) {
            console.error("MetaMask payment failed:", err);
            let errorMsg = err.message;
            if (err.code === 4001) {
                errorMsg = "Transaction rejected by user.";
            } else if (err.reason) { // Ethers.js v5 has .reason for contract reverts
                errorMsg = `Contract reverted: ${err.reason}`;
            } else if (err.data && typeof err.data === 'string' && err.data.startsWith('0x08c379a0')) {
                // Ethers.js v6 often puts revert reason in err.data for reverted transactions
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + err.data.substring(10));
                    errorMsg = `Transaction reverted: ${decoded[0]}`;
                } catch (decodeErr) {
                    console.warn("Could not decode revert reason:", decodeErr);
                }
            }
            setError(`Payment failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="scanner-page-container">
            <div className="scanner-card">
                <h2>Product Traceability via QR Code</h2>
                <p className="description-text">
                    Scan a product's QR code image to view its complete supply chain history and verify its authenticity on the blockchain.
                </p>

                {error && <p className="error-message">{error}</p>}
                {walletAddress && <p className="wallet-display">Connected Wallet: <strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</strong></p>}

                {!walletAddress && (
                    <div className="warning-box">
                        <p>
                            <i className="fas fa-wallet"></i> Please connect your MetaMask wallet to interact with the blockchain.
                        </p>
                    </div>
                )}

                {walletAddress && (
                    <div className="file-upload-section">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }} // Hide default input
                        />
                        <button
                            className="upload-button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={loading}
                        >
                            <i className="fas fa-qrcode"></i> {loading ? 'Scanning...' : 'Upload QR Code Image'}
                        </button>
                        <p className="upload-instructions">Click the button above to select a QR code image from your device.</p>
                        {/* Off-screen canvas for image processing */}
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    </div>
                )}

                {loading && !error && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Scanning QR code and fetching details from blockchain...</p>
                    </div>
                )}

                {productDetails && (
                    <div className="product-info-section">
                        <h3><i className="fas fa-box-open"></i> Product Details</h3>
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">Product Name:</span>
                                <span>{productDetails.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Description:</span>
                                <span>{productDetails.description}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Batch Number:</span>
                                <span>{productDetails.batchNumber}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Production Date:</span>
                                <span>{formatTimestamp(productDetails.productionDate)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Manufacturer:</span>
                                <span>{productDetails.manufacturerInfo}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Manufacturer Address:</span>
                                <span>{productDetails.manufacturerAddress}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Current Location:</span>
                                <span>{productDetails.currentLocation}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Sold Status:</span>
                                <span>{productDetails.isSold ? 'Sold' : 'Available'}</span>
                            </div>
                            <div className="detail-item full-width">
                                <span className="detail-label">Product Hash:</span>
                                <code className="code-block">{productHash}</code>
                            </div>
                        </div>

                        <h3><i className="fas fa-history"></i> Supply Chain History</h3>
                        <div className="timeline">
                            {productDetails.events.length > 0 ? (
                                productDetails.events.map((event, index) => (
                                    <div className="timeline-item" key={index}>
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <h4>{event.type}</h4>
                                            <p><strong>Actor:</strong> {event.actor}</p>
                                            <p><strong>Location:</strong> {event.location}</p>
                                            <p><strong>Timestamp:</strong> {formatTimestamp(event.timestamp)}</p>
                                            {event.txHash && (
                                                <p className="tx-hash">
                                                    <strong>Tx Hash:</strong> <a href={`https://sepolia.etherscan.io/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer">
                                                        {event.txHash.substring(0, 10)}...{event.txHash.substring(event.txHash.length - 8)} <i className="fas fa-external-link-alt"></i>
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-history-message">No detailed history available for this product yet.</p>
                            )}
                        </div>

                        <div className="payment-section">
                            <button
                                onClick={initiatePayment}
                                className="payment-button"
                                disabled={loading || productDetails.isSold} // Disable if already sold
                            >
                                {productDetails.isSold ? 'Product Already Sold' : (loading ? 'Processing Payment...' : 'Purchase Product (0.01 ETH)')}
                            </button>
                        </div>
                    </div>
                )}

                {!productDetails && scanResult && !loading && !error && (
                    <div className="info-message">
                        <p>Successfully scanned QR code, but product details could not be retrieved. It might not be registered on the blockchain.</p>
                    </div>
                )}

                {!scanResult && walletAddress && !loading && (
                     <div className="info-message">
                         <p>Please upload a QR code image to begin tracing a product.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default QRScannerWithUpload;