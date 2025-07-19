import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useForm } from 'react-hook-form';
import SHA256 from 'crypto-js/sha256';
import { ethers } from 'ethers';
import '../styling/ProductForm.css';
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';
import UpdateProduct from './UpdateProduct'; // Import the new component

const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0xc65252fC5348ad0D64D7C84C29Ee76297d22B106";
const HARDCODED_SUPPLY_CHAIN_ID = "0"; // Must be a number (uint256)

const ProductForm = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const [productHash, setProductHash] = useState('');
    const [productDetails, setProductDetails] = useState(null);
    const [qrVisible, setQrVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [companyId, setCompanyId] = useState('');
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletAddress, setWalletAddress] = useState('');

    // Initialize contract and fetch company ID
    useEffect(() => {
        const init = async () => {
            try {
                if (!window.ethereum) {
                    setError("MetaMask not detected");
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

                // Fetch company ID
                const companyIdBigInt = await supplyChainContract.getCompanyIdByWallet(signer.address);
                setCompanyId(companyIdBigInt.toString());

            } catch (err) {
                console.error("Initialization error:", err);
                setError(err.message);
            }
        };

        init();
    }, []);

    const onSubmitCreateProduct = async (data) => {
        if (!contract || !companyId || companyId === "0") {
            alert("Company not registered or blockchain connection not ready");
            return;
        }

        setIsLoading(true);
        setError(null);
        setQrVisible(false); // Hide QR code from previous creation if any

        try {
            // 1. Generate product hash (off-chain reference)
            const timestamp = Date.now();
            const nonce = Math.floor(Math.random() * 1e6);
            const rawData = [
                data.productName,
                data.description,
                companyId,
                HARDCODED_SUPPLY_CHAIN_ID,
                data.productionDate,
                data.batchNumber,
                timestamp,
                nonce,
            ].join('-');

            const hash = SHA256(rawData).toString();
            setProductHash(hash);

            // 2. Save to blockchain
            const tx = await contract.createProduct(
                data.productName,
                data.description,
                data.batchNumber,
                HARDCODED_SUPPLY_CHAIN_ID,
                hash,
                Math.floor(new Date(data.productionDate).getTime() / 1000)
            );

            // Wait for transaction confirmation
            await tx.wait();

            // 3. Update UI
            setProductDetails({
                name: data.productName,
                description: data.description,
                batchNumber: data.batchNumber,
                productionDate: data.productionDate,
                companyId: companyId,
                supplyChainId: HARDCODED_SUPPLY_CHAIN_ID,
                timestamp: timestamp
            });

            setQrVisible(true);
            reset(); // Clear the create product form

        } catch (err) {
            console.error("Transaction failed:", err);
            let errorMsg = err.message;

            if (err.code === 4001) {
                errorMsg = "Transaction rejected by user";
            } else if (err.reason) {
                errorMsg = `Contract reverted: ${err.reason}`;
            }

            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="form-container">
                <div className="form-card">
                    <h2 style={{ color: 'red' }}>Error</h2>
                    <p>{error}</p>
                    {!window.ethereum && (
                        <p>Please install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a></p>
                    )}
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    if (!companyId) {
        return (
            <div className="form-container">
                <div className="form-card">
                    <h2>Loading Company Information...</h2>
                    <p>Fetching your company details from blockchain</p>
                </div>
            </div>
        );
    }

    if (companyId === "0") {
        return (
            <div className="form-container">
                <div className="form-card">
                    <h2>Company Not Registered</h2>
                    <p>Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
                    <p>Please register your company first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="form-card">
                <div className="form-header">
                    <h2>📦 Product Management</h2>
                    <p>Company ID: {companyId} | Supply Chain: {HARDCODED_SUPPLY_CHAIN_ID}</p>
                </div>

                {/* Create Product Section */}
                <form onSubmit={handleSubmit(onSubmitCreateProduct)} className="product-form">
                    <h3 className="section-title">✨ Register New Product</h3>
                    <div className="form-section">
                        <h3 className="section-title">Product Identity</h3>
                        <div className="form-group">
                            <label>Product Name*</label>
                            <input
                                {...register('productName', {
                                    required: 'Product name is required',
                                    minLength: {
                                        value: 3,
                                        message: 'Minimum 3 characters required'
                                    }
                                })}
                                placeholder="e.g., Organic Honey"
                                className={errors.productName ? 'error' : ''}
                            />
                            {errors.productName && (
                                <span className="error-message">{errors.productName.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Description*</label>
                            <textarea
                                {...register('description', {
                                    required: 'Description is required',
                                    minLength: {
                                        value: 10,
                                        message: 'Minimum 10 characters required'
                                    }
                                })}
                                rows={3}
                                placeholder="Detailed product description..."
                                className={errors.description ? 'error' : ''}
                            />
                            {errors.description && (
                                <span className="error-message">{errors.description.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title">Production Details</h3>
                        <div className="form-group">
                            <label>Batch Number*</label>
                            <input
                                {...register('batchNumber', {
                                    required: 'Batch number is required',
                                    pattern: {
                                        value: /^BATCH-\d{4}$/,
                                        message: 'Format: BATCH-XXXX (numbers)'
                                    }
                                })}
                                placeholder="BATCH-XXXX"
                            />
                            {errors.batchNumber && (
                                <span className="error-message">{errors.batchNumber.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Production Date*</label>
                            <input
                                type="date"
                                {...register('productionDate', {
                                    required: 'Production date is required',
                                    validate: {
                                        futureDate: (value) => {
                                            const selectedDate = new Date(value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0); // Normalize today's date
                                            return selectedDate <= today || 'Date cannot be in the future';
                                        }
                                    }
                                })}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {errors.productionDate && (
                                <span className="error-message">{errors.productionDate.message}</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering Product...' : 'Register Product'}
                    </button>
                </form>

                {qrVisible && productDetails && (
                    <div className="qr-section">
                        <h3 className="section-title">Product Registered Successfully 🎉</h3>

                        <div className="qr-container">
                            <QRCode
                                value={`${window.location.origin}/product/${productHash}`}
                                size={200}
                                level="H"
                                fgColor="#1a365d"
                            />
                        </div>

                        <div className="product-info">
                            <div className="info-group">
                                <h4>Product ID (Hash):</h4>
                                <p className="product-hash">{productHash}</p>
                            </div>

                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Product Name:</span>
                                    <span>{productDetails.name}</span>
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Render the UpdateProduct component */}
                <UpdateProduct
                    companyId={companyId}
                    contract={contract}
                    walletAddress={walletAddress}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setError={setError}
                    error={error}
                />
            </div>
        </div>
    );
};

export default ProductForm;