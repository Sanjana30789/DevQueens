// src/pages/CompanyRegistration.jsx
import React, { useState } from "react";
import "../styling/company.css";

const CompanyRegistration = () => {
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [document, setDocument] = useState(null);

  const handleFileChange = (e) => {
    setDocument(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !description || !document) {
      alert("Please fill in all fields and upload a document.");
      return;
    }

    // For now just show console
    console.log("Company Name:", companyName);
    console.log("Description:", description);
    console.log("Document File:", document);

    alert("Request submitted for verification!");
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
