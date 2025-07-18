// src/components/Landing.jsx
import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import "../styling/landing.css";
import videoBg from "../assets/supply.mp4";
import image from "../assets/unnamed.jpg";



const Landing = () => {
  const navigate = useNavigate();
  
 return (
   <>
      <div className="landing">
       <video src={videoBg} autoPlay loop muted />
       <div className="overlay">
         <h1>🔗 Blockchain Supply Chain System</h1>
         <p>Track and verify every step of your supply chain with ease.</p>
         <button onClick={() => navigate("/select-role")}>Get Started</button>
       </div>
     </div>
 
  
   <section className="info-section" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)" }}>
  <div className="content-wrapper">
    <div className="text-content animate-slide-left">
      <h2>📦 What is a Supply Chain?</h2>
      <p>
        A supply chain is the comprehensive network of individuals, organizations, 
        resources, activities, and technologies involved in the creation and 
        distribution of a product — from raw material suppliers to end customers.
      </p>
      <p className="additional-text">
        Modern supply chains span continents and involve complex logistics. 
        Traditional systems often suffer from opacity, inefficiency, and vulnerability 
        to fraud. This is where blockchain technology revolutionizes the process.
      </p>
      <div className="feature-list">
        <div className="feature-item" style={{ background: "rgba(255,255,255,0.7)" }}>
          <span className="feature-icon">🌐</span>
          <span>Global network visibility</span>
        </div>
        <div className="feature-item" style={{ background: "rgba(255,255,255,0.7)" }}>
          <span className="feature-icon">⏱️</span>
          <span>Real-time tracking</span>
        </div>
        <div className="feature-item" style={{ background: "rgba(255,255,255,0.7)" }}>
          <span className="feature-icon">🔍</span>
          <span>End-to-end transparency</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="blockchain-section" style={{ background: "linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)" }}>
  <div className="content-wrapper reverse">
    <div className="text-content animate-slide-right">
      <h2>🔐 How Blockchain Helps?</h2>
      <p>
        Blockchain technology provides a decentralized, immutable ledger system 
        that ensures complete transparency, enhanced security, and verifiable 
        traceability across every step of the supply chain.
      </p>
      <p className="additional-text">
        Each transaction or movement is recorded as a block in the chain, creating 
        an unforgeable history of the product's journey. This eliminates disputes, 
        reduces fraud, and builds trust among all stakeholders.
      </p>
      <ul className="benefits-list">
        <li>✔️ Tamper-proof record keeping</li>
        <li>✔️ Smart contract automation</li>
        <li>✔️ Reduced paperwork and errors</li>
        <li>✔️ Instant verification of authenticity</li>
      </ul>
    </div>
    <div className="image-container animate-fade-in">
      <img
        src={image}
        alt="Blockchain Supply Chain"
        className="blockchain-diagram"
        style={{ border: "8px solid white", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
      />
      <div className="image-caption" style={{ color: "#2c3e50" }}>
        Blockchain ensures every step is recorded and verifiable
      </div>
    </div>
  </div>
</section>
 
     <footer className="footer">
       <p>
         &copy; {new Date().getFullYear()} SupplyChainX | Built with 💡 by DevQueens
       </p>
     </footer>
   </>
 );
};

export default Landing;
