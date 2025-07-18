// src/pages/CompanyRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/company.css";

const CompanyRegistration = () => {
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [document, setDocument] = useState(null);
  const [wallet, setWallet] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingRequest = async () => {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentWallet = accounts[0].toLowerCase();
      setWallet(currentWallet);

      const requests = JSON.parse(localStorage.getItem("companyRequests")) || [];
      const existing = requests.find(req => req.wallet.toLowerCase() === currentWallet);

      if (existing) {
        console.log("🔁 Redirecting to dashboard as request exists for:", currentWallet);
        navigate("/companydashboard");
      }
    };

    checkExistingRequest();
  }, []);

  const handleFileChange = (e) => {
    setDocument(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!companyName || !description || !document) {
      alert("Please fill in all fields and upload a document.");
      return;
    }

    const companyRequest = {
      name: companyName,
      description,
      status: "pending",
      wallet: wallet,
    };

    let requests = JSON.parse(localStorage.getItem("companyRequests")) || [];
    requests.push(companyRequest);
    localStorage.setItem("companyRequests", JSON.stringify(requests));

    alert("✅ Request submitted for verification!");
    navigate("/companydashboard");
  };

  return (
    <div className="company-registration-container">
      <h2>🏢 Company Registration</h2>
      <form onSubmit={handleSubmit} className="company-form">
        <label>Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your company"
        />

        <label>Upload Registration Document</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        <button type="submit">Submit for Verification</button>
      </form>
    </div>
  );
};

export default CompanyRegistration;
