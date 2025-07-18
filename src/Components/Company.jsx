import React, { useEffect, useState } from "react";
import "../styling/companydashboard.css";
import AdminSidebar from "../Components/AdminSidebar"; // ✅ Reuse your existing sidebar

const CompanyDashboard = () => {
  const [company, setCompany] = useState(null);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const connectedWallet = accounts[0].toLowerCase();
        setWallet(connectedWallet);

        console.log("👛 Connected Wallet:", connectedWallet);

        const requests = JSON.parse(localStorage.getItem("companyRequests")) || [];
        console.log("📦 All Company Requests from localStorage:", requests);

        const approvedCompany = requests.find(
          (req) =>
            req.wallet.toLowerCase() === connectedWallet && req.status === "approved"
        );

        console.log("✅ Approved Company Found:", approvedCompany);
        setCompany(approvedCompany);
      } catch (error) {
        console.error("❌ Error fetching wallet/account:", error);
      }
    };

    fetchCompanyData();
  }, []);

  if (!company) {
    return (
      <div className="company-dashboard-layout">
        <AdminSidebar />
        <div className="company-main-content">
          <h2>⏳ Awaiting Verification</h2>
          <p>Your company has submitted the request. Please wait for admin approval.</p>
          <p><strong>Wallet:</strong> {wallet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-dashboard-layout">
      <AdminSidebar />
      <div className="company-main-content">
        <h2>🏢 Welcome, {company.name}</h2>
        <p className="desc">{company.description}</p>
        <p><strong>Status:</strong> {company.status}</p>
        <div className="dashboard-actions">
          <button className="action-btn">📦 Create Supply Chain</button>
          <button className="action-btn">➕ Add Product</button>
          <button className="action-btn">🔍 View Products</button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
