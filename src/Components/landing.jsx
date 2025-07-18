// src/pages/Landing.jsx
import React, { useState ,useEffect } from "react";
import { BrowserProvider } from "ethers";
import "../styling/landing.css";
import videoBg from "../assets/supply.mp4";
import { useNavigate } from "react-router-dom";

// const roleMap = {
//   "0x3B8eF903D0DaEF0783b5A90B9e9D28EFDC9233A7": "admin",      
//   "0x4ac503CD0Db2D943B567B9F18A18960A19792dF3": "consumer",   
// };



const Landing = () => {

//     const [userRole, setUserRole] = useState("");


// useEffect(() => {
//   if (window.ethereum) {
//     window.ethereum.on("accountsChanged", (accounts) => {
//       const newAddress = accounts[0];
//       setWalletAddress(newAddress);
//       const role = roleMap[newAddress.toLowerCase()] || "unknown";
      
//       if (role === "admin") navigate("/admin");
//       else if (role === "consumer") navigate("/consumer");
//       else navigate("/");
//     });
//   }
// }, []);


    
    const navigate = useNavigate();
//   const [walletAddress, setWalletAddress] = useState("");

//  const connectWallet = async () => {
//   try {
//     if (window.ethereum) {
//       // Request permission to prompt account selection again
//       await window.ethereum.request({
//         method: "wallet_requestPermissions",
//         params: [{ eth_accounts: {} }],
//       });

//       const accounts = await window.ethereum.request({
//         method: "eth_requestAccounts",
//       });

//       const address = accounts[0];
//       setWalletAddress(address);

//       const userRole = roleMap[address.toLowerCase()] || "unknown";

//       if (userRole === "admin") {
//         navigate("/admin");
//       } else if (userRole === "consumer") {
//         navigate("/consumer");
//       } else {
//         alert("This wallet is not registered.");
//       }
//     } else {
//       alert("Please install MetaMask.");
//     }
//   } catch (error) {
//     console.error("Wallet connection error:", error);
//   }
// };



 return (
  <>
     <div className="landing">
      <video src={videoBg} autoPlay loop muted />
      <div className="overlay">
        <h1>🔗 Blockchain Supply Chain System</h1>
        <p>Track and verify every step of your supply chain with ease.</p>
        <button onClick={() => navigate("/select-role")}>Get Started</button>
      </div>
    </div>

    {/* 👇 Visible below video section */}
    <section className="info-section">
      <h2>📦 What is a Supply Chain?</h2>
      <p>
        A supply chain is the network of individuals, organizations, resources,
        activities, and technologies involved in the creation and sale of a
        product — from supplier to customer.
      </p>
    </section>

    <section className="blockchain-section">
      <h2>🔐 How Blockchain Helps?</h2>
      <p>
        Blockchain provides a decentralized, tamper-proof system that ensures
        transparency, security, and traceability across every step of the supply
        chain.
      </p>
      <img
        src="https://miro.medium.com/v2/resize:fit:1400/format:webp/1*2D3lFhefaTrB1Axr-TWlVg.png"
        alt="Blockchain Supply Chain"
        className="blockchain-diagram"
      />
    </section>

    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} SupplyChainX | Built with 💡 by Sanjana
      </p>
    </footer>
  </>
);

};

export default Landing;
