// src/Components/QRGenerator.jsx
import React, { useState } from "react";
import QRCode from "react-qr-code";
import "../styling/admin.css";

const QRGenerator = () => {
  const [productId, setProductId] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!productId.trim()) return;
    setShowQR(true);
  };

  const qrValue = `https://yourapp.com/track/${productId}`;

  return (
    <div className="qr-generator">
      <h2>🔳 QR Code Generator</h2>

      <form onSubmit={handleGenerate}>
        <input
          type="text"
          placeholder="Enter Product ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        />
        <button type="submit">Generate QR</button>
      </form>

      {showQR && (
        <div className="qr-preview">
          <p>QR Code for Product ID: <strong>{productId}</strong></p>
          <QRCode value={qrValue} size={200} />
          <p className="qr-url">{qrValue}</p>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
