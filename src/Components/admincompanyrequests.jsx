// src/pages/AdminCompanyRequests.jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers"; // Import ethers
import "../styling/admin.css";

// Import your SupplyChain contract artifact
import SupplyChainArtifact from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

// Replace with the actual deployed address of your SupplyChain.sol contract
// !!! IMPORTANT: This MUST be the same address you deployed your contract to !!!
const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x9c3A2B154B534aF1C6925A119Cba00C3cc6251Ca"; // <<-- UPDATE THIS WITH YOUR LATEST DEPLOYED ADDRESS

const AdminCompanyRequests = () => {
  const [unverifiedCompanies, setUnverifiedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplyChainContract, setSupplyChainContract] = useState(null);
  const [adminWallet, setAdminWallet] = useState(null); // To store the connected admin wallet

  useEffect(() => {
    const initEthersAndFetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!window.ethereum) {
          setError("MetaMask or a similar EVM wallet is not detected. Please install and connect one.");
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const connectedAddress = (await signer.getAddress()).toLowerCase();

        const contractAbi = SupplyChainArtifact.abi;
        const contractInstance = new ethers.Contract(
          SUPPLY_CHAIN_CONTRACT_ADDRESS,
          contractAbi,
          signer
        );
        setSupplyChainContract(contractInstance);
        setAdminWallet(connectedAddress); // Assuming the connected wallet is intended to be the admin

        // Fetch the actual admin address from the contract
        const contractAdminAddress = (await contractInstance.admin()).toLowerCase();

        if (connectedAddress !== contractAdminAddress) {
          setError(`You are connected with wallet ${connectedAddress.substring(0,6)}...${connectedAddress.substring(connectedAddress.length - 4)}, but only the contract admin (${contractAdminAddress.substring(0,6)}...${contractAdminAddress.substring(contractAdminAddress.length - 4)}) can verify companies.`);
          setLoading(false);
          return;
        }


        // --- Logic to fetch all companies and filter for unverified ---
        // You'll need a way to get all registered company IDs.
        // The contract doesn't expose a direct array of all company IDs.
        // A common pattern is to iterate from 1 up to `nextCompanyId - 1`.
        const nextCompanyIdBigInt = await contractInstance.nextCompanyId();
        const totalCompanies = parseInt(nextCompanyIdBigInt.toString()) - 1; // Total registered companies

        const companies = [];
        for (let i = 1; i <= totalCompanies; i++) {
          try {
            const [name, description, walletAddress, isVerified] = await contractInstance.getCompanyDetails(i);
            // Only add if not verified
            if (!isVerified) {
              companies.push({
                companyId: i,
                name,
                description,
                wallet: walletAddress.toLowerCase(),
                isVerified,
              });
            }
          } catch (fetchErr) {
            console.warn(`Could not fetch details for company ID ${i}:`, fetchErr.message);
            // This can happen if a company ID was skipped or deleted (unlikely in this contract)
          }
        }
        setUnverifiedCompanies(companies);

      } catch (err) {
        console.error("Error during admin requests initialization:", err);
        let errorMessage = `Failed to load requests: ${err.message || err.toString()}`;
        if (err.code === 4001) {
            errorMessage = "Wallet connection rejected. Please approve the connection in MetaMask.";
        } else if (err.code === "NETWORK_ERROR") {
            errorMessage = "Network error. Please check your internet connection or selected blockchain network.";
        } else if (err.code === "CALL_EXCEPTION") {
            errorMessage = "Contract call failed. Check if contract address, network, or ABI are correct. Is the contract deployed?";
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initEthersAndFetchRequests();

    // Event listeners for account/chain changes
    if (window.ethereum) {
      const handleAccountsChanged = () => initEthersAndFetchRequests();
      const handleChainChanged = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }

  }, [adminWallet]); // Re-run effect if adminWallet changes (e.g., connected account changes)

  const handleVerify = async (companyId) => {
    if (!supplyChainContract) {
      alert("Blockchain connection not ready.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log(`Sending verification transaction for company ID: ${companyId}`);
      const tx = await supplyChainContract.verifyCompany(companyId);
      console.log("Transaction sent:", tx.hash);

      await tx.wait(); // Wait for the transaction to be mined
      console.log("✅ Company verified on blockchain:", tx.hash);
      alert(`✅ Company ID ${companyId} verified successfully!`);

      // Refresh the list of unverified companies
      // You could update state directly or refetch. Refetching is safer for demo.
      window.location.reload(); // Simple refresh for now

    } catch (err) {
      console.error("❌ Verification failed:", err);
      let errorMessage = `Failed to verify company: ${err.reason || err.message || err.toString()}`;
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user (e.g., in MetaMask).";
      } else if (err.data && typeof err.data === 'string' && err.data.startsWith('0x08c379a0')) {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + err.data.substring(10));
            errorMessage = `Transaction reverted: ${decoded[0]}`;
          } catch (decodeErr) {
            console.warn("Could not decode revert reason:", decodeErr);
          }
      } else if (err.message.includes("only admin")) {
          errorMessage = "Error: Only the contract admin can verify companies. Check your connected wallet.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="admin-requests-container">
        <h2>Loading Company Requests...</h2>
        <p>Connecting to blockchain and fetching data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-requests-container">
        <h2 style={{ color: "red" }}>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-requests-container">
      <h2>🏢 Company Verification Requests</h2>

      {unverifiedCompanies.length === 0 ? (
        <p>No unverified company requests at this time.</p>
      ) : (
        <table className="request-table">
          <thead>
            <tr>
              <th>ID</th> {/* Added Company ID */}
              <th>Company Name</th>
              <th>Description</th>
              <th>Wallet Address</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unverifiedCompanies.map((req) => (
              <tr key={req.companyId}>
                <td>{req.companyId}</td> {/* Display Company ID */}
                <td>{req.name}</td>
                <td>{req.description}</td>
                <td>{req.wallet.substring(0, 6)}...{req.wallet.substring(req.wallet.length - 4)}</td>
                <td>{req.isVerified ? "Verified" : "Pending"}</td>
                <td>
                  <button
                    onClick={() => handleVerify(req.companyId)}
                    disabled={loading || req.isVerified} // Disable if already verified or loading
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {loading && !error && <div className="loading-spinner"></div>}
    </div>
  );
};

export default AdminCompanyRequests;