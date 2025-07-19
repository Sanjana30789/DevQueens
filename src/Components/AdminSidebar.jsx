// src/components/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "../styling/admin.css";

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <NavLink to="/admin/add-product">Add Product</NavLink>
        <NavLink to="/admin/qr">QR Scanner</NavLink>
        <NavLink to="/admin/products">All Products</NavLink>
        <NavLink to="/admin/update-products">Update Product</NavLink>
        <NavLink to="/admin/history">Track History</NavLink>
        <NavLink to="/admin/inviteform">Invite Roles</NavLink>
        <NavLink to="/admin/requests">📋 Company Requests</NavLink>

        <NavLink to="/">Logout</NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
