import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { ethers } from 'ethers';
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';
import '../styling/qrcode.css'; // Reusing your existing CSS

const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x6737b8F44193b282745aAE70944bFCa1d8B64aE2"; // Your actual deployed contract address

const QRScannerWithUpload = () => {
    const [scanResult, setScanResult] = useState('');
    const [productHash, setProductHash] = useState(null);
    const [productDetails, setProductDetails] = useState(null);
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
                await provider.send("eth_requestAccounts", []);
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
                setError(`Failed to connect to MetaMask: ${err.message}`);
            }
        };
        initMetaMask();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        setError(null);
        setScanResult('');
        setProductHash(null);
        setProductDetails(null);

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
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        setScanResult(code.data);
                        console.log("Decoded QR Data:", code.data);
                        // Extract productHash from the scanned URL
                        try {
                            const url = new URL(code.data);
                            const pathParts = url.pathname.split('/');
                            const extractedHash = pathParts[pathParts.length - 1];

                            if (extractedHash && extractedHash.length > 0) {
                                setProductHash(extractedHash);
                                console.log("Scanned Product Hash:", extractedHash);
                                fetchProductDetails(extractedHash);
                            } else {
                                setError("Invalid QR code format. Could not extract product hash.");
                            }
                        } catch (urlError) {
                            setError("QR code content is not a valid URL or product hash not found.");
                        }

                    } else {
                        setError("No QR code detected in the uploaded image.");
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
            // As discussed, replace this with your actual contract call.
            // Example if your contract has getProductByHash:
            // const details = await contract.getProductByHash(hash); // Assuming hash is bytes32 in contract
            // setProductDetails(details);

            // Mocking product details for now
            const mockDetails = {
                name: "Scanned Product Name (from file)",
                description: "Details fetched from blockchain for " + hash,
                batchNumber: "BATCH-UPLOAD",
                productionDate: new Date().toISOString().split('T')[0],
                companyId: "123",
                supplyChainId: "0"
            };
            setProductDetails(mockDetails);

        } catch (err) {
            console.error("Error fetching product details:", err);
            setError(`Failed to fetch product details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        if (!contract || !productHash) {
            alert("MetaMask not connected, or no product selected for payment.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const paymentAmount = ethers.parseEther("0.01"); // Example: 0.01 Ether

            console.log("Initiating MetaMask payment...");
            const tx = await contract.purchaseProduct(
                productHash, // The product hash to identify the item
                { value: paymentAmount }
            );

            await tx.wait();
            alert("Payment successful!");
            console.log("Payment transaction successful:", tx);
        } catch (err) {
            console.error("MetaMask payment failed:", err);
            let errorMsg = err.message;
            if (err.code === 4001) {
                errorMsg = "Transaction rejected by user.";
            } else if (err.reason) {
                errorMsg = `Contract reverted: ${err.reason}`;
            }
            setError(`Payment failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="scanner-container">
            <div className="scanner-card">
                <h2>Upload QR Code Image</h2>
                {error && <p className="error-message">{error}</p>}
                {walletAddress && <p>Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>}

                {!walletAddress && (
                    <p className="warning-message">
                        Please connect your MetaMask wallet to proceed.
                    </p>
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
                            Upload QR Code Image
                        </button>
                        <p className="upload-instructions">Click to select a QR code image from your device.</p>
                        {/* Off-screen canvas for image processing */}
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    </div>
                )}

                {scanResult && productHash && (
                    <div className="scan-result-section">
                        <h3>Scan Result:</h3>
                        <p>Raw QR Data: <code>{scanResult}</code></p>
                        <p>Extracted Product Hash: <code>{productHash}</code></p>

                        {loading && <p>Fetching product details...</p>}
                        {productDetails && (
                            <div className="product-details-display">
                                <h4>Product Information:</h4>
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
                                        <span>{new Date(productDetails.productionDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Company ID:</span>
                                        <span>{productDetails.companyId}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Supply Chain ID:</span>
                                        <span>{productDetails.supplyChainId}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={initiatePayment}
                                    className="payment-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing Payment...' : 'Initiate Payment (0.01 ETH)'}
                                </button>
                            </div>
                        )}
                        {!productDetails && !loading && (
                             <p>Product details not found or an error occurred.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerWithUpload;