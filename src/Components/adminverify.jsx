import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Import your contract's ABI
// Make sure this path is correct and the file contains the ABI array
import SupplyChainArtifact from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json"; // Renamed to Artifact for clarity

// Replace with the actual deployed address of your SupplyChain.sol contract
const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x7432DE22B2a94F3a8d0184815448E3Ee67E3C4D3"; // <<-- UPDATE THIS WITH YOUR LATEST DEPLOYED ADDRESS

const AdminVerify = () => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAdminWallet, setConnectedAdminWallet] = useState(null); // To store the connected admin wallet

  useEffect(() => {
    const initBlockchain = async () => {
      try {
        if (!window.ethereum) {
          setError("MetaMask or a similar EVM wallet is not detected. Please install and connect one.");
          setLoading(false);
          return;
        }

        // Request account access if needed
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentConnectedWallet = accounts[0].toLowerCase();
        setConnectedAdminWallet(currentConnectedWallet); // Set the connected wallet address

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);

        const currentSigner = await web3Provider.getSigner();
        setSigner(currentSigner);

        const supplyChainContract = new ethers.Contract(
          SUPPLY_CHAIN_CONTRACT_ADDRESS,
          SupplyChainArtifact.abi, // <--- THE FIX: Access the 'abi' property
          currentSigner // Use the signer for write operations
        );
        setContract(supplyChainContract);

        // Fetch the actual admin address from the contract
        const contractAdminAddress = (await supplyChainContract.admin()).toLowerCase();

        if (currentConnectedWallet !== contractAdminAddress) {
          setError(`You are connected with wallet ${currentConnectedWallet.substring(0,6)}...${currentConnectedWallet.substring(currentConnectedWallet.length - 4)}, but only the contract admin (${contractAdminAddress.substring(0,6)}...${contractAdminAddress.substring(contractAdminAddress.length - 4)}) can verify companies.`);
          setLoading(false);
          return;
        }


        await fetchPendingCompanies(supplyChainContract);

      } catch (err) {
        console.error("Error initializing blockchain connection or fetching data:", err);
        let errorMessage = `Failed to connect to blockchain or fetch data: ${err.message || err.toString()}`;
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

    initBlockchain();

    // Event listeners for account/chain changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setConnectedAdminWallet(accounts[0].toLowerCase());
          initBlockchain(); // Re-initialize on account change
        } else {
          setConnectedAdminWallet(null);
          setContract(null);
          setError("Wallet disconnected. Please connect MetaMask.");
        }
      };
      const handleChainChanged = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []); // Empty dependency array means this effect runs once on mount

  const fetchPendingCompanies = async (contractInstance) => {
    if (!contractInstance) return; // Ensure contractInstance is valid

    try {
      setLoading(true);
      setError(null);

      const currentNextCompanyId = await contractInstance.nextCompanyId();
      const fetchedRequests = [];

      for (let i = 1; i < currentNextCompanyId; i++) {
        const [name, description, walletAddress, isVerified] = await contractInstance.getCompanyDetails(i);
        if (!isVerified) {
          fetchedRequests.push({
            companyId: i,
            name,
            description,
            wallet: walletAddress,
            status: "pending" // Status is now derived from isVerified on-chain
          });
        }
      }
      setPendingCompanies(fetchedRequests);

    } catch (err) {
      console.error("Error fetching pending companies:", err);
      setError(`Failed to fetch company data: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };


  const handleVerify = async (companyId) => {
    if (!contract || !signer) {
      alert("Blockchain connection not established. Please connect your wallet.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the verifyCompany function on your smart contract
      const transaction = await contract.verifyCompany(companyId);
      await transaction.wait(); // Wait for the transaction to be mined

      alert(`Company ID ${companyId} verified successfully on blockchain!`);

      // After successful verification, refetch the list to update the UI
      await fetchPendingCompanies(contract); // Pass the contract instance

    } catch (err) {
      console.error("Error verifying company on blockchain:", err);
      let errorMessage = `Failed to approve company: ${err.reason || err.message || err.toString()}`;
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user (e.g., in MetaMask).";
      } else if (err.data && typeof err.data === 'string' && err.data.startsWith('0x08c379a0')) {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + err.data.substring(10));
            errorMessage = `Transaction reverted: ${decoded[0]}`;
          } catch (decodeErr) {
            console.warn("Could not decode revert reason:", decodeErr);
          }
      } else if (err.message.includes("only admin")) { // Specific check for admin role
          errorMessage = "Error: Only the contract admin can verify companies. Check your connected wallet.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading blockchain connection and company requests...</div>;
  }

  if (error) {
    return <div style={{ color: "red", padding: "20px", border: "1px solid red", textAlign: "center" }}>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Company Verification Requests</h2>
      {connectedAdminWallet && (
        <p style={{ fontSize: "0.9em", color: "#555" }}>
          Connected Wallet: <strong>{connectedAdminWallet.substring(0, 6)}...{connectedAdminWallet.substring(connectedAdminWallet.length - 4)}</strong>
        </p>
      )}
      {!signer && <p style={{ color: "orange" }}>Please connect your MetaMask wallet to approve requests.</p>}
      {pendingCompanies.length === 0 && <p>No pending company verification requests.</p>}
      {pendingCompanies.map((req) => (
        <div key={req.companyId} style={{ border: "1px solid #ccc", borderRadius: "8px", margin: "10px 0", padding: "15px", backgroundColor: "#f9f9f9" }}>
          <p><b>Company ID:</b> {req.companyId}</p>
          <p><b>Name:</b> {req.name}</p>
          <p><b>Description:</b> {req.description}</p>
          <p><b>Status:</b> {req.status === "pending" ? "Pending On-Chain Verification" : "Verified (Error in display logic)"}</p>
          <p><b>Wallet:</b> {req.wallet.substring(0, 6)}...{req.wallet.substring(req.wallet.length - 4)}</p>
          {req.status === "pending" && signer && (
            <button
              onClick={() => handleVerify(req.companyId)}
              disabled={loading} // Disable button while verification is in progress
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "10px",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Approving..." : "Approve On-Chain"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminVerify;