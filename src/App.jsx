import { Routes, Route } from "react-router-dom";
import Landing from './Components/welcome';
import AdminDashboard from "./Components/admin";
import ConsumerDashboard from "./Components/consumer";
import AddProduct from './Components/addproduct';
import QRScanner from './Components/qrcode';
import InviteForm from './Components/invite';
import RoleSelection from './Components/roleselection';
import CompanyRegistration from './Components/companyregistration';
import AdminVerify from './Components/adminverify';
import CompanyDashboard from './Components/Company';
import ProductForm from "./Components/ProductForm";
import AllProducts from "./Components/allproducts";
import UpdateProduct from "./Components/UpdateProduct";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/select-role" element={<RoleSelection />} />
      <Route path="/consumer" element={<ConsumerDashboard />} />
       <Route path="/company-registration" element={<CompanyRegistration />} />
       <Route path="/companydashboard" element={<CompanyDashboard />} />
       <Route path="/product/:productHash" element={<QRScanner />} />
     

      {/* Nested Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route path="requests" element={<AdminVerify />} />
        <Route path="add-product" element={<ProductForm />} />
        <Route path="inviteform" element={<InviteForm />} />
        <Route path = "qr" element={<QRScanner/>}/>
        <Route path="products" element={<AllProducts />} />
        <Route path="update-products" element={<UpdateProduct/>}/>
        
      </Route>
    </Routes>
  );
}

export default App;
