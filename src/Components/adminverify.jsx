import React, { useEffect, useState } from "react";

const AdminVerify = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const savedRequests = JSON.parse(localStorage.getItem("companyRequests")) || [];
    setRequests(savedRequests);
  }, []);

  const handleVerify = (index) => {
    const updated = [...requests];
    updated[index].status = "approved";
    setRequests(updated);
    localStorage.setItem("companyRequests", JSON.stringify(updated));
  };

  return (
    <div>
      <h2>Company Verification Requests</h2>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((req, index) => (
        <div key={index} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p><b>Name:</b> {req.name}</p>
          <p><b>Description:</b> {req.description}</p>
          <p><b>Status:</b> {req.status}</p>
          <p><b>Wallet:</b> {req.wallet}</p>
          {req.status === "pending" && (
            <button onClick={() => handleVerify(index)}>Approve</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminVerify;
