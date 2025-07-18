import React, { useState } from "react";
import { getContract } from "../utils/contractConfig";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [batch, setBatch] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !desc || !batch) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const contract = await getContract();
      const tx = await contract.createProduct(name, desc, batch);
      await tx.wait();
      alert("✅ Product created successfully!");
      setName("");
      setDesc("");
      setBatch("");
    } catch (err) {
      console.error("❌ Error creating product:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📦 Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Product Description" />
        <input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Batch ID" />
        <button type="submit">Create Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
