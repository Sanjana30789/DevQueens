// src/pages/AdminDashboard.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../Components/AdminSidebar";
import "../styling/admin.css";

const AdminDashboard = () => {
  
  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar on the left */}
      <AdminSidebar />

      {/* Right side content */}
      <div className="admin-main-content">
        <Outlet /> {/* Dynamic content will be rendered here */}
      </div>

      
    </div>
  );
};

export default AdminDashboard;
