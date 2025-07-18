// src/Components/AddProduct.jsx
import React, { useState } from "react";
import "../styling/admin.css";

const AddProduct = () => {
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ productName, productId, description, image });
    alert("✅ Product Created Successfully!");

    // Reset
    setProductName("");
    setProductId("");
    setDescription("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="add-product-container">
      <h2>Add New Product</h2>
      <form className="add-product-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
        </div>

        <textarea
          placeholder="Product Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          required
        />

        <div className="image-upload">
          <label htmlFor="imageUpload">Upload Product Image</label>
          <input
            type="file"
            id="imageUpload"
            onChange={handleImageChange}
            accept="image/*"
            required
          />
        </div>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <button type="submit">Create Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
