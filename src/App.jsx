import { Routes, Route } from "react-router-dom";
import Landing from './Components/welcome';
import AdminDashboard from "./Components/admin";
import ConsumerDashboard from "./Components/consumer";
import AddProduct from './Components/addproduct';
import QRGenerator from './Components/qrcode';
import InviteForm from './Components/invite';
import RoleSelection from './Components/roleselection';
import CompanyRegistration from './Components/companyregistration';
import AdminVerify from './Components/adminverify';
import CompanyDashboard from './Components/Company'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/select-role" element={<RoleSelection />} />
      <Route path="/consumer" element={<ConsumerDashboard />} />
       <Route path="/company-registration" element={<CompanyRegistration />} />
       <Route path="/companydashboard" element={<CompanyDashboard />} />
     

      {/* Nested Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route path="requests" element={<AdminVerify />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="qr" element={<QRGenerator />} />
        <Route path="inviteform" element={<InviteForm />} />
        
      </Route>
    </Routes>
  );
}

export default App;
