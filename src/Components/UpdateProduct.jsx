import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import '../styling/ProductForm.css'; // Assuming shared styling
import SupplyChainArtifact from '../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json';

const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0xc65252fC5348ad0D64D7C84C29Ee76297d22B106"; // Your deployed contract address

const UpdateProduct = ({ companyId, contract, walletAddress, isLoading, setIsLoading, setError, error }) => {
    const { register: registerUpdate, handleSubmit: handleSubmitUpdate, reset: resetUpdate, formState: { errors: errorsUpdate } } = useForm();
    const [productHistory, setProductHistory] = useState([]);
    const [searchProductHash, setSearchProductHash] = useState('');
    const [currentFetchedProductHash, setCurrentFetchedProductHash] = useState(''); // To display history for which product

    const onSubmitUpdateProduct = async (data) => {
        if (!contract || !companyId || companyId === "0") {
            setError("Company not registered or blockchain connection not ready.");
            return;
        }
        if (!data.productHashToUpdate) {
            setError("Product Hash is required for update.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setProductHistory([]); // Clear previous history on update attempt

        try {
            const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
            const tx = await contract.updateProduct(
                data.productHashToUpdate,
                data.newLocation || "", // Pass empty string if undefined
                data.newStatus || "",   // Pass empty string if undefined
                timestamp
            );

            await tx.wait();

            alert("Product updated successfully!");
            // Optionally, fetch history after successful update
            await fetchProductHistory(data.productHashToUpdate);
            resetUpdate(); // Clear the update product form

        } catch (err) {
            console.error("Update transaction failed:", err);
            let errorMsg = err.message;
            if (err.code === 4001) {
                errorMsg = "Transaction rejected by user.";
            } else if (err.reason) {
                errorMsg = `Contract reverted: ${err.reason}.`;
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProductHistory = async (hash) => {
        if (!contract || !hash) return;

        setIsLoading(true);
        setError(null);
        setProductHistory([]); // Clear previous history
        setCurrentFetchedProductHash('');

        try {
            const history = await contract.getProductHistory(hash);
            const formattedHistory = history.map(item => ({
                location: item.location,
                status: item.status,
                // Ensure timestamp is BigInt and convert to Number before multiplying
                timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
                updaterCompanyId: item.updaterCompanyId.toString()
            }));
            setProductHistory(formattedHistory);
            setCurrentFetchedProductHash(hash); // Set the hash for which history is displayed
        } catch (err) {
            console.error("Failed to fetch product history:", err);
            setError("Failed to fetch product history. Make sure the product hash is correct and the product exists.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-card"> {/* Reuse the form-card styling */}
            {/* Update Product Section */}
            <hr />
            <form onSubmit={handleSubmitUpdate(onSubmitUpdateProduct)} className="product-form">
                <h3 className="section-title">🔄 Update Product Status</h3>
                <div className="form-section">
                    <div className="form-group">
                        <label>Product Hash to Update*</label>
                        <input
                            {...registerUpdate('productHashToUpdate', {
                                required: 'Product hash is required for update',
                                pattern: {
                                    value: /^[0-9a-fA-F]{64}$/, // SHA256 hash pattern
                                    message: 'Invalid product hash format'
                                }
                            })}
                            placeholder="Enter product hash (64 characters)"
                            className={errorsUpdate.productHashToUpdate ? 'error' : ''}
                        />
                        {errorsUpdate.productHashToUpdate && (
                            <span className="error-message">{errorsUpdate.productHashToUpdate.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>New Location</label>
                        <input
                            {...registerUpdate('newLocation')}
                            placeholder="e.g., Warehouse B, In Transit"
                        />
                    </div>

                    <div className="form-group">
                        <label>New Status</label>
                        <input
                            {...registerUpdate('newStatus')}
                            placeholder="e.g., Shipped, Received, QA Check"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Updating Product...' : 'Update Product'}
                </button>
            </form>

            {/* View Product History Section */}
            <hr />
            <div className="form-section">
                <h3 className="section-title">📜 View Product History</h3>
                <div className="form-group">
                    <label>Product Hash</label>
                    <input
                        type="text"
                        value={searchProductHash}
                        onChange={(e) => setSearchProductHash(e.target.value)}
                        placeholder="Enter product hash to view history"
                    />
                    <button
                        className="submit-button"
                        onClick={() => fetchProductHistory(searchProductHash)}
                        disabled={isLoading}
                        style={{ marginTop: '10px' }}
                    >
                        {isLoading ? 'Fetching History...' : 'Fetch History'}
                    </button>
                </div>

                {productHistory.length > 0 && (
                    <div className="history-section">
                        <h4>History for Product ID: {currentFetchedProductHash}</h4>
                        <ul className="history-list">
                            {productHistory.map((entry, index) => (
                                <li key={index} className="history-item">
                                    <strong>Timestamp:</strong> {entry.timestamp}<br />
                                    <strong>Location:</strong> {entry.location || 'N/A'}<br />
                                    <strong>Status:</strong> {entry.status || 'N/A'}<br />
                                    <strong>Updater Company ID:</strong> {entry.updaterCompanyId}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {productHistory.length === 0 && currentFetchedProductHash && !isLoading && !error && (
                    <p>No history found for this product hash or product does not exist.</p>
                )}
            </div>
        </div>
    );
};

export default UpdateProduct;