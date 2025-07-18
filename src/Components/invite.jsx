import React, { useState } from "react";
import "../styling/InviteForm.css"; // 👈 Link the CSS
import { getContract } from "../utils/contractConfig";
import { ethers } from "ethers";


const InviteForm = () => {
  const [role, setRole] = useState("");
  const [address,setAddress] = useState("");

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!address || !role) {
    alert("Both address and role are required");
    return;
  }

  try {
    const contract = await getContract();
    const tx = await contract.inviteUser(address, parseInt(role));
    await tx.wait();

    // Save invite to localStorage
    const invites = JSON.parse(localStorage.getItem("invites")) || [];
    invites.push({ address, role, timestamp: new Date().toISOString() });
    localStorage.setItem("invites", JSON.stringify(invites));

    alert("✅ Invite sent!");
  } catch (error) {
    console.error("❌ Error sending invite:", error);
  }
};



  return (
    <div className="invite-container">
      <h2>Invite a New Participant</h2>
      <form onSubmit={handleSubmit} className="invite-form">
        <label>Wallet Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="">Select Role</option>
  <option value="1">Supplier</option>
  <option value="2">Shipper</option>
  <option value="3">Retailer</option>
  <option value="4">Delivery Hub</option>
</select>


        <button type="submit">Send Invite</button>
      </form>
    </div>
  );
};

export default InviteForm;
