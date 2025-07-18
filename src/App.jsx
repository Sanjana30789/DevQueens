import { useState } from 'react'
import Landing from './Components/welcome';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./Components/admin";
import ConsumerDashboard from "./Components/consumer";
import AddProduct from './Components/addproduct'
import QRGenerator from './Components/qrcode'
import InviteForm from './Components/invite'
import RoleSelection from './Components/roleselection'
import CompanyRegistration from './Components/companyregistration'

function App() {
  const [count, setCount] = useState(0)

  return (
      <Routes>
        <Route path="/" element={<Landing />} />
         {/* <Route path="/admin" element={<AdminDashboard />}>
        <Route path="add-product" element={<AddProduct />} />
        <Route path="qr" element={<QRGenerator />} />
        <Route path="inviteform" element={<InviteForm />} />

      </Route> */}

      <Route path="/select-role" element={<RoleSelection />} />
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/consumer" element={<ConsumerDashboard />} />
 <Route path="/company-registration" element={<CompanyRegistration />} /> 
<Route/>

        <Route path="/consumer" element={<ConsumerDashboard />} />
      </Routes>
  )
}

export default App
