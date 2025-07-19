import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import "../styling/companydashboard.css";
import AdminSidebar from "../Components/AdminSidebar";

import SupplyChainArtifact from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

const SUPPLY_CHAIN_CONTRACT_ADDRESS = "0x7432DE22B2a94F3a8d0184815448E3Ee67E3C4D3"; // Double-check this address!

const CompanyDashboard = () => {
  const [companyDetails, setCompanyDetails] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [createdProductIds, setCreatedProductIds] = useState([]);

  // Use useCallback to memoize this function, preventing unnecessary re-creations
  const fetchCompanyDetails = useCallback(async (contractInstance, currentWallet) => {
    console.log("DEBUG: fetchCompanyDetails called with contractInstance:", !!contractInstance, "wallet:", currentWallet);
    if (!contractInstance || !currentWallet) {
      setLoading(false); // Ensure loading is false if prerequisites are missing
      console.log("DEBUG: fetchCompanyDetails - missing contract or wallet, returning.");
      return;
    }

    try {
      setLoading(true); // Always set loading true at the start of a fetch operation
      setError(null);

      console.log("DEBUG: Calling getCompanyIdByWallet for", currentWallet);
      const companyIdBigInt = await contractInstance.getCompanyIdByWallet(currentWallet);
      const companyId = companyIdBigInt.toString();
      console.log("DEBUG: Received companyIdBigInt:", companyIdBigInt.toString());


      if (companyId === "0") {
        setCompanyDetails({ status: "unregistered" });
        console.log("DEBUG: No company registered for this wallet (ID is 0).");
        return;
      }

      console.log("DEBUG: Company found with ID:", companyId, ". Fetching full details.");
      const [name, description, walletAddrFromContract, isVerified] = await contractInstance.getCompanyDetails(companyIdBigInt);

      const newCompanyDetails = {
        companyId: companyId,
        name,
        description,
        wallet: walletAddrFromContract.toLowerCase(),
        isVerified
      };
      setCompanyDetails(newCompanyDetails);
      console.log("DEBUG: Fetched Company Details:", newCompanyDetails);


      // Optional: Fetch existing products for the company on load
      if (isVerified && companyId !== "0") {
        console.log("DEBUG: Fetching existing products for company ID:", companyId);
        const productIds = await contractInstance.getCompanyProducts(companyIdBigInt);
        setCreatedProductIds(productIds.map(id => id.toString())); // Convert BigInt to string
        console.log("DEBUG: Existing Product IDs:", productIds.map(id => id.toString()));
      }

    } catch (err) {
      console.error("❌ Error fetching company details in fetchCompanyDetails:", err);
      let errorMessage = `Failed to fetch company details: ${err.message || err.toString()}`;
      if (err.code === 4001) {
          errorMessage = "Wallet connection rejected. Please approve the connection in MetaMask.";
      } else if (err.code === "NETWORK_ERROR") {
          errorMessage = "Network error. Please check your internet connection or selected blockchain network.";
      } else if (err.code === "CALL_EXCEPTION") {
          if (err.data === null || err.message.includes("missing revert data")) {
             errorMessage = "Contract call failed. This often means incorrect contract address, wrong network, or ABI mismatch. Check console for details.";
          } else if (err.reason) {
              errorMessage = `Contract reverted: ${err.reason}`;
          }
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Always set loading false after operation completes or errors
    }
  }, []); // Dependencies for useCallback: none, as it only uses its arguments

  useEffect(() => {
    let supplyChainContractInstance = null; // Renamed to avoid confusion with `contract` state

    const handleAccountsChanged = (accounts) => {
      console.log("DEBUG: accountsChanged event detected.", accounts);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0].toLowerCase());
        initBlockchain(); // Re-init everything to get a new signer and refetch data
      } else {
        setWalletAddress("");
        setCompanyDetails(null);
        setContract(null);
        setError("Wallet disconnected. Please connect MetaMask.");
      }
    };

    const handleChainChanged = () => {
      console.log("DEBUG: chainChanged event detected. Reloading page.");
      window.location.reload(); // Simple refresh on chain change
    };

    const initBlockchain = async () => {
      console.log("DEBUG: initBlockchain called.");
      try {
        setLoading(true); // Start loading immediately
        setError(null);

        if (!window.ethereum) {
          setError("MetaMask or a similar EVM wallet is not detected. Please install and connect one.");
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const connectedWallet = accounts[0].toLowerCase();
        setWalletAddress(connectedWallet);
        console.log("DEBUG: Wallet connected:", connectedWallet);


        const contractAbi = SupplyChainArtifact.abi;

        supplyChainContractInstance = new ethers.Contract( // Assign to the local variable
          SUPPLY_CHAIN_CONTRACT_ADDRESS,
          contractAbi,
          signer
        );
        setContract(supplyChainContractInstance); // Set the state variable
        console.log("DEBUG: Contract instance created.");


        await fetchCompanyDetails(supplyChainContractInstance, connectedWallet); // Initial fetch


        // --- Event Listener for CompanyVerified ---
        supplyChainContractInstance.on("CompanyVerified", async (_companyId, _name, _walletAddress) => {
          console.log(`DEBUG: CompanyVerified event received for ID: ${_companyId.toString()}, Name: ${_name}, Wallet: ${_walletAddress}`);
          if (_walletAddress.toLowerCase() === connectedWallet) {
            console.log("DEBUG: Re-fetching details for current company due to verification event.");
            await fetchCompanyDetails(supplyChainContractInstance, connectedWallet);
            alert(`Your company (${_name}) has been verified by the admin!`);
          }
        });

        // --- Event Listener for ProductCreated ---
        supplyChainContractInstance.on("ProductCreated", async (_productId, _name, _creatorCompanyId, _supplyChainId) => {
          // Check if this product was created by the currently connected company
          // IMPORTANT: Access current state from the latest `companyDetails` using a functional update or by ensuring dependency
          // For events, it's safer to use the actual ID from the event if possible, or trigger a re-fetch.
          // Since companyDetails is in dependency array of useEffect, it should be reasonably fresh on re-renders.
          const currentCompanyId = companyDetails?.companyId;
          const eventCompanyId = _creatorCompanyId.toString();

          console.log(`DEBUG: ProductCreated event received for ID: ${_productId.toString()}`);
          if (currentCompanyId && eventCompanyId === currentCompanyId) {
            console.log("--- New Product Created for this Company! ---");
            console.log(`Product ID: ${_productId.toString()}`); // Console log the product ID here!
            console.log(`Product Name: ${_name}`);
            console.log(`Creator Company ID: ${eventCompanyId}`);
            console.log(`Supply Chain ID: ${_supplyChainId.toString()}`);

            setCreatedProductIds(prevIds => {
                const newId = _productId.toString();
                if (!prevIds.includes(newId)) {
                    return [...prevIds, newId];
                }
                return prevIds;
            });
          }
        });

      } catch (err) {
        console.error("❌ Error during initial blockchain setup in initBlockchain:", err);
        let errorMessage = `Failed to load dashboard: ${err.message || err.toString()}`;
        if (err.code === 4001) {
            errorMessage = "Wallet connection rejected. Please approve the connection in MetaMask.";
        } else if (err.code === "NETWORK_ERROR") {
            errorMessage = "Network error. Please check your internet connection or selected blockchain network.";
        } else if (err.code === "CALL_EXCEPTION") {
            if (err.data === null || err.message.includes("missing revert data")) {
                errorMessage = "Contract call failed. This often means incorrect contract address, wrong network, or ABI mismatch. Check console for details.";
            } else if (err.reason) {
                errorMessage = `Contract reverted: ${err.reason}`;
            }
        }
        setError(errorMessage);
      } finally {
        setLoading(false); // Always set loading false after operation completes or errors
      }
    };

    initBlockchain();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // --- Cleanup function for useEffect ---
    return () => {
      console.log("DEBUG: Cleaning up useEffect listeners.");
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      if (supplyChainContractInstance) {
        console.log("DEBUG: Removing contract event listeners.");
        supplyChainContractInstance.off("CompanyVerified");
        supplyChainContractInstance.off("ProductCreated");
      }
    };
  }, [fetchCompanyDetails, companyDetails?.companyId]); // Add companyDetails.companyId to dependencies

  // --- Conditional Rendering ---
  if (loading) {
    return (
      <div className="company-dashboard-layout">
        <AdminSidebar />
        <div className="company-main-content">
          <h2>Loading Company Dashboard...</h2>
          <p>Please ensure MetaMask is connected to the correct network.</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-dashboard-layout">
        <AdminSidebar />
        <div className="company-main-content">
          <h2 style={{ color: "red" }}>Error:</h2>
          <p>{error}</p>
          <p>Please refresh the page or check your wallet connection and selected network.</p>
          {!window.ethereum && <p>If MetaMask is not installed, please get it from <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">metamask.io</a>.</p>}
          <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer' }}>Reload Page</button>
        </div>
      </div>
    );
  }

  if (companyDetails && companyDetails.status === "unregistered") {
    return (
      <div className="company-dashboard-layout">
        <AdminSidebar />
        <div className="company-main-content">
          <h2>🚫 Company Not Registered</h2>
          <p>This wallet address (<strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</strong>) is not registered as a company on the blockchain.</p>
          <p>Please register your company first.</p>
        </div>
      </div>
    );
  }

  if (companyDetails && !companyDetails.isVerified) {
    return (
      <div className="company-dashboard-layout">
        <AdminSidebar />
        <div className="company-main-content">
          <h2>⏳ Awaiting Admin Verification</h2>
          <p>Your company **({companyDetails.name} - ID: {companyDetails.companyId})** has registered but is awaiting verification by the admin.</p>
          <p>You will gain full access to the dashboard once verified.</p>
          <p><strong>Wallet:</strong> {companyDetails.wallet.substring(0, 6)}...{companyDetails.wallet.substring(companyDetails.wallet.length - 4)}</p>
          <p style={{marginTop: '20px', fontSize: '0.9em', color: '#888'}}>
            Please wait for the admin to approve your registration. This page will update automatically once verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-dashboard-layout">
      <AdminSidebar />
      <div className="company-main-content">
        <h2>🏢 Welcome, {companyDetails.name}!</h2>
        <p className="desc">{companyDetails.description}</p>
        <p><strong>Company ID:</strong> {companyDetails.companyId}</p>
        <p><strong>Status:</strong> <span style={{ color: "green", fontWeight: "bold" }}>Verified</span></p>
        <p><strong>Wallet:</strong> {companyDetails.wallet.substring(0, 6)}...{companyDetails.wallet.substring(companyDetails.wallet.length - 4)}</p>

        <div className="dashboard-actions">
          <button className="action-btn">📦 Create Supply Chain</button>
          <button className="action-btn">➕ Add Product</button>
          <button className="action-btn">🔍 View My Products</button>
        </div>

        {createdProductIds.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h3>Products Owned by Your Company:</h3>
                <ul>
                    {createdProductIds.map(id => (
                        <li key={id}>Product ID: {id}</li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;