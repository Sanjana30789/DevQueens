import React, { useState, useEffect, useCallback } from "react";
import "../styling/InviteForm.css";
// Assuming getContract is updated to work with the new contract address if it changes
import { getContract } from "../utils/contractConfig"; // Adjust path if necessary
import { ethers } from "ethers";

// It's better to get the contract address from a central config or environment variables
// rather than hardcoding in multiple places.
// For now, let's assume getContract() handles this.

const InviteForm = () => {
    const [role, setRole] = useState("");
    const [addressToInvite, setAddressToInvite] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null); // To store current company's details
    const [currentWalletAddress, setCurrentWalletAddress] = useState("");

    // This function will fetch the current wallet's company details
    const fetchCurrentCompanyDetails = useCallback(async (contractInstance, walletAddr) => {
        if (!contractInstance || !walletAddr) return;

        try {
            const companyIdBigInt = await contractInstance.getCompanyIdByWallet(walletAddr);
            const companyId = companyIdBigInt.toString();

            if (companyId === "0") {
                setCompanyDetails({ status: "unregistered" });
                return;
            }

            const [name, description, walletAddrFromContract, isVerified] = await contractInstance.getCompanyDetails(companyIdBigInt);
            setCompanyDetails({
                companyId: companyId,
                name,
                description,
                wallet: walletAddrFromContract.toLowerCase(),
                isVerified
            });
        } catch (err) {
            console.error("Error fetching current company details:", err);
            setError(`Failed to fetch your company details: ${err.message}`);
        }
    }, []); // No dependencies, as it uses arguments

    // Initialize contract and fetch company details
    useEffect(() => {
        const init = async () => {
            try {
                if (!window.ethereum) {
                    setError("MetaMask not detected. Please install it.");
                    return;
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const walletAddr = await signer.getAddress();
                setCurrentWalletAddress(walletAddr);

                const supplyChainContract = await getContract(); // Your utility function
                setContract(supplyChainContract);

                await fetchCurrentCompanyDetails(supplyChainContract, walletAddr);

                // Listen for CompanyVerified event to update status if admin verifies
                supplyChainContract.on("CompanyVerified", (_companyId, _name, _walletAddress) => {
                    if (_walletAddress.toLowerCase() === walletAddr.toLowerCase()) {
                        console.log(`Your company (${_name}) has been verified! Re-fetching details.`);
                        fetchCurrentCompanyDetails(supplyChainContract, walletAddr);
                        alert(`Your company (${_name}) has been verified by the admin!`);
                    }
                });

            } catch (err) {
                console.error("Initialization error:", err);
                setError(`Failed to initialize: ${err.message}`);
            }
        };

        init();

        // Cleanup function for event listener
        return () => {
            if (contract) { // Use the state `contract` which holds the instance
                contract.off("CompanyVerified");
            }
        };
    }, [fetchCurrentCompanyDetails]); // Dependency: fetchCurrentCompanyDetails

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!contract || !companyDetails) {
            setError("Blockchain connection not ready or company details not loaded.");
            return;
        }

        if (companyDetails.status === "unregistered") {
            setError("Your wallet is not registered as a company.");
            return;
        }

        if (!companyDetails.isVerified) {
            setError("Your company is not yet verified by the admin. You cannot send invites.");
            return;
        }

        if (!addressToInvite || !role) {
            setError("Both wallet address and role are required.");
            return;
        }

        if (!ethers.isAddress(addressToInvite)) {
            setError("Invalid Ethereum address format.");
            return;
        }
        
        // Prevent a company from inviting itself
        if (addressToInvite.toLowerCase() === currentWalletAddress.toLowerCase()) {
            setError("A company cannot invite its own wallet address.");
            return;
        }


        setIsLoading(true);
        setError(null);

        try {
            // Call the new contract function
            const tx = await contract.inviteUserByCompany(addressToInvite, parseInt(role));
            await tx.wait();

            // Save invite to localStorage (optional)
            const invites = JSON.parse(localStorage.getItem("invites") || "[]");
            // Mapping numeric role back to its name for localStorage if you want
            const roleNames = { 1: "Supplier", 2: "Shipper", 3: "Retailer", 4: "Delivery Hub" };
            invites.push({
                address: addressToInvite,
                role: parseInt(role),
                roleName: roleNames[parseInt(role)],
                invitedByCompanyId: companyDetails.companyId,
                invitedByCompanyName: companyDetails.name,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem("invites", JSON.stringify(invites));

            alert("✅ Invite sent successfully!");
            setAddressToInvite("");
            setRole("");

        } catch (err) {
            console.error("❌ Error sending invite:", err);
            let errorMessage = "Failed to send invite.";

            if (err.code === 4001) {
                errorMessage = "Transaction rejected by user.";
            } else if (err.reason) {
                errorMessage = `Contract Reverted: ${err.reason}`;
            } else if (err.data && err.data.message) {
                errorMessage = `Contract Error: ${err.data.message}`;
            } else if (err.message.includes("User already has a role")) {
                errorMessage = "This user already has a role assigned.";
            } else if (err.message.includes("This company has already invited this user.")) {
                errorMessage = "You have already invited this user.";
            } else {
                errorMessage = err.message || "An unknown error occurred.";
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="invite-container error-state">
                <h2>Error</h2>
                <p style={{ color: 'red' }}>{error}</p>
                {!window.ethereum && (
                    <p>Please install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a>.</p>
                )}
                <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
        );
    }

    if (!contract || !companyDetails) {
        return (
            <div className="invite-container">
                <h2>Loading Company Information...</h2>
                <p>Please wait while we connect to the network and verify your company status.</p>
            </div>
        );
    }

    if (companyDetails.status === "unregistered") {
        return (
            <div className="invite-container unauthorized-state">
                <h2>🚫 Company Not Registered</h2>
                <p>Your wallet address (<strong>{currentWalletAddress.substring(0, 6)}...{currentWalletAddress.substring(currentWalletAddress.length - 4)}</strong>) is not registered as a company.</p>
                <p>Please register your company first to invite partners.</p>
            </div>
        );
    }

    if (!companyDetails.isVerified) {
        return (
            <div className="invite-container unauthorized-state">
                <h2>⏳ Awaiting Admin Verification</h2>
                <p>Your company **({companyDetails.name} - ID: {companyDetails.companyId})** is registered but not yet verified by the admin.</p>
                <p>You need to be a verified company to send invites.</p>
                <p><strong>Wallet:</strong> {companyDetails.wallet.substring(0, 6)}...{companyDetails.wallet.substring(companyDetails.wallet.length - 4)}</p>
            </div>
        );
    }

    return (
        <div className="invite-container">
            <h2>Invite a New Supply Chain Partner</h2>
            <p className="subtitle">As **{companyDetails.name} (ID: {companyDetails.companyId})**, you can invite new users to a specific role.</p>
            <form onSubmit={handleSubmit} className="invite-form">
                <label htmlFor="walletAddress">Partner's Wallet Address</label>
                <input
                    id="walletAddress"
                    type="text"
                    placeholder="0x..."
                    value={addressToInvite}
                    onChange={(e) => setAddressToInvite(e.target.value)}
                    disabled={isLoading}
                />

                <label htmlFor="roleSelect">Assign Role</label>
                <select
                    id="roleSelect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">Select Role</option>
                    {/* Exclude 'None' (0) as it's not a role to assign via invite */}
                    <option value="1">Supplier</option>
                    <option value="2">Shipper</option>
                    <option value="3">Retailer</option>
                    <option value="4">Delivery Hub</option>
                </select>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending Invite..." : "Send Invite"}
                </button>
            </form>
            {error && <p className="form-error-message" style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default InviteForm;