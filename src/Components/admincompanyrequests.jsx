// src/pages/AdminCompanyRequests.jsx
import React, { useEffect, useState } from "react";
import "../styling/admin.css";

const AdminCompanyRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const storedRequests = JSON.parse(localStorage.getItem("companyRequests")) || [];
    setRequests(storedRequests);
  }, []);

  const handleVerify = (index) => {
    const updated = [...requests];
    updated[index].status = "verified";
    setRequests(updated);
    localStorage.setItem("companyRequests", JSON.stringify(updated));
    alert("✅ Company verified!");
  };

  return (
    <div>
      <h2>🏢 Company Verification Requests</h2>

      {requests.length === 0 ? (
        <p>No company requests yet.</p>
      ) : (
        <table className="request-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Company</th>
              <th>Description</th>
              <th>Wallet</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{req.name}</td>
                <td>{req.description}</td>
                <td>{req.wallet}</td>
                <td>{req.status}</td>
                <td>
                  {req.status === "pending" ? (
                    <button onClick={() => handleVerify(i)}>Verify</button>
                  ) : (
                    "✅ Verified"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminCompanyRequests;
