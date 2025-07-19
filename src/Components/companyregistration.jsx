// src/pages/CompanyRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers"; // Import ethers
// import { Web3Storage } from 'web3.storage'; // REMOVED: Web3Storage import
import "../styling/company.css";

// Import your SupplyChain contract artifact
import SupplyChainArtifact from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

// Replace with the actual deployed address of your SupplyChain.sol contract
const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x7432DE22B2a94F3a8d0184815448E3Ee67E3C4D3"; // Ensure this is correct and updated

// REMOVED: WEB3_STORAGE_TOKEN constant

const CompanyRegistration = () => {
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [registrationDocument, setRegistrationDocument] = useState(null); // Keep state for file selection
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [supplyChainContract, setSupplyChainContract] = useState(null);

  useEffect(() => {
    const initEthersAndCheckRegistration = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!window.ethereum) {
          setError("MetaMask or a similar EVM wallet is not detected. Please install and connect one.");
          setLoading(false);
          return;
        }

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentWallet = accounts[0].toLowerCase();
        setWallet(currentWallet);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contractAbi = SupplyChainArtifact.abi;

        const contractInstance = new ethers.Contract(
          SUPPLY_CHAIN_CONTRACT_ADDRESS,
          contractAbi,
          signer
        );
        setSupplyChainContract(contractInstance);

        const companyIdBigInt = await contractInstance.getCompanyIdByWallet(currentWallet);
        const companyId = companyIdBigInt.toString();

        if (companyId !== "0") {
          console.log("🔁 Redirecting to dashboard as company is already registered on-chain with ID:", companyId);
          navigate("/companydashboard");
          return;
        }

        const requests = JSON.parse(localStorage.getItem("companyRegistrationStatus")) || {};
        if (requests[currentWallet] === "pending_on_chain") {
          console.log("🔁 Redirecting to dashboard as pending on-chain registration detected for:", currentWallet);
          navigate("/companydashboard");
        }

      } catch (err) {
        console.error("Error during Ethers initialization or registration check:", err);
        let errorMessage = `Failed to connect to blockchain or check status: ${err.message || err.toString()}`;
        if (err.code === 4001) {
            errorMessage = "Wallet connection rejected. Please approve the connection in MetaMask.";
        } else if (err.code === "NETWORK_ERROR") {
            errorMessage = "Network error. Please check your internet connection or selected blockchain network.";
        } else if (err.code === "CALL_EXCEPTION" && err.data === null) {
            errorMessage = "Contract call failed (missing revert data). This often means incorrect contract address, wrong network, or ABI mismatch. Check console for details.";
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initEthersAndCheckRegistration();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0].toLowerCase());
          initEthersAndCheckRegistration();
        } else {
          setWallet("");
          setSupplyChainContract(null);
          setError("Wallet disconnected. Please connect MetaMask.");
        }
      };
      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    // We still capture the file, but won't send it on-chain
    setRegistrationDocument(e.target.files[0]);
  };

  // REMOVED: uploadFileToIPFS function

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The document is required by UI, but not sent to contract
    if (!companyName || !description || !registrationDocument) {
      alert("Please fill in all fields and upload a registration document.");
      return;
    }
    if (!supplyChainContract) {
      alert("Blockchain connection not ready. Please wait or refresh.");
      return;
    }
    if (loading) {
      alert("Already checking status or submitting. Please wait.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // REMOVED: IPFS upload step

      let requests = JSON.parse(localStorage.getItem("companyRegistrationStatus")) || {};
      requests[wallet] = "pending_on_chain";
      localStorage.setItem("companyRegistrationStatus", JSON.stringify(requests));

      console.log(`Submitting company registration for ${companyName} (${wallet})...`);
      // CALL CONTRACT WITH ONLY 2 ARGUMENTS NOW
      const tx = await supplyChainContract.createCompany(companyName, description);
      console.log("Transaction sent:", tx.hash);

      await tx.wait();
      console.log("✅ Company registered on blockchain:", tx.hash);
      alert("✅ Company registration transaction sent and confirmed! Awaiting admin verification.");

      delete requests[wallet];
      localStorage.setItem("companyRegistrationStatus", JSON.stringify(requests));

      navigate("/companydashboard");
    } catch (err) {
      console.error("❌ Registration process failed:", err);
      let errorMessage = `Failed to register company: ${err.reason || err.message || err.toString()}`;
      if (err.code === 4001) {
        errorMessage = "Transaction rejected by user (e.g., in MetaMask).";
      } else if (err.data && typeof err.data === 'string' && err.data.startsWith('0x08c379a0')) {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + err.data.substring(10));
            errorMessage = `Transaction reverted: ${decoded[0]}`;
          } catch (decodeErr) {
            console.warn("Could not decode revert reason:", decodeErr);
          }
      }
      setError(errorMessage);

      let requests = JSON.parse(localStorage.getItem("companyRegistrationStatus")) || {};
      delete requests[wallet];
      localStorage.setItem("companyRegistrationStatus", JSON.stringify(requests));

    } finally {
      setLoading(false);
    }
  };

  if (loading && !supplyChainContract) {
    return (
      <div className="company-registration-container">
        <h2>Loading...</h2>
        <p>Connecting to blockchain and checking wallet status.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-registration-container">
        <h2 style={{ color: "red" }}>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="company-registration-container">
      <h2>🏢 Company Registration</h2>
      <p className="wallet-info">Connected Wallet: <strong>{wallet ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}` : 'N/A'}</strong></p>
      <form onSubmit={handleSubmit} className="company-form">
        <label>Company Name*</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
          required
        />

        <label>Description*</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your company"
          rows={4}
          required
        />

        {/* File input remains for UI, but data is not sent to contract */}
        <label>Upload Registration Document*</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          required
        />
        {registrationDocument && <p className="file-info">Selected file: {registrationDocument.name}</p>}


        <button type="submit" disabled={loading || !supplyChainContract}>
          {loading ? 'Submitting to Blockchain...' : 'Submit for Verification'}
        </button>
      </form>
      {loading && !error && <div className="loading-spinner"></div>}
    </div>
  );
};

export default CompanyRegistration;