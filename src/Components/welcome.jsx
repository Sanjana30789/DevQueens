// src/components/Landing.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/landing.css";
import videoBg from "../assets/supply.mp4";
import image from "../assets/unnamed.jpg";

const roleMap = {
  "0xa4c7b4bca6ded7306c3343653085d4df892fe54c": "admin",
  "0x4ac503cd0db2d943b567b9f18a18960a19792df3": "consumer"
};

const Landing = () => {
  // const [walletAddress, setWalletAddress] = useState("");
  // const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (window.ethereum) {
  //     window.ethereum.on("accountsChanged", (accounts) => {
  //       const address = accounts[0];
  //       setWalletAddress(address);
  //       const role = roleMap[address.toLowerCase()] || "unknown";

  //       if (role === "admin") {
  //         navigate("/admin");
  //       } else if (role === "consumer") {
  //         navigate("/consumer");
  //       } else {
  //         alert("Access denied. Not an authorized admin wallet.");
  //       }
  //     });
  //   }
  // }, []);

  // const connectWallet = async () => {
  //   if (loading) return;
  //   setLoading(true);

  //   try {
  //     if (window.ethereum) {
  //       await window.ethereum.request({
  //         method: "wallet_requestPermissions",
  //         params: [{ eth_accounts: {} }],
  //       });

  //       const accounts = await window.ethereum.request({
  //         method: "eth_requestAccounts",
  //       });

  //       const address = accounts[0];
  //       setWalletAddress(address);

  //       const role = roleMap[address.toLowerCase()] || "unknown";

  //       if (role === "admin") {
  //         navigate("/admin");
  //       } else if (role === "consumer") {
  //         navigate("/consumer");
  //       } else {
  //         alert("This wallet is not authorized.");
  //       }
  //     } else {
  //       alert("Please install MetaMask.");
  //     }
  //   } catch (error) {
  //     console.error("Wallet connection error:", error);
  //   } finally {
  //     setLoading(false);
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
         src={image}
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
