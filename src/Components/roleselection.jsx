// src/pages/RoleSelection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styling/RoleSelection.css";

const RoleSelection = () => {
  const navigate = useNavigate();

 const ADMIN_ADDRESS = "0xa4C7b4bca6dED7306c3343653085d4Df892FE54c".toLowerCase();

const connectWallet = async (role) => {
  if (!window.ethereum) {
    alert("MetaMask not detected. Please install it.");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0].toLowerCase();
    console.log("🔗 Connected Address:", address);

    // Role-specific logic
    if (role === "admin") {
      if (address === ADMIN_ADDRESS) {
        localStorage.setItem("walletAddress", address);
        localStorage.setItem("userRole", role);
        navigate("/admin");
      } else {
        alert("❌ Access Denied. This wallet is not authorized as admin.");
      }
    } else {
      // for customer or company
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("userRole", role);

      if (role === "customer") navigate("/consumer");
      else if (role === "company") navigate("/company-registration");
    }
  } catch (err) {
    console.error("❌ MetaMask connection error:", err);
    alert("Connection failed. Please try again.");
  }
};

  return (
    <div className="role-selection">
      <h2>Choose Your Role</h2>
      <button onClick={() => connectWallet("admin")}>🔐 Admin</button>
      <button onClick={() => connectWallet("customer")}>👤 Customer</button>
      <button onClick={() => connectWallet("company")}>🏢 Company</button>
    </div>
  );
};

export default RoleSelection;
