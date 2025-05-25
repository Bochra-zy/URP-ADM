import React , { useEffect } from "react";
import SideBar from "../AdminLayout/SideBar";
import NavBar from "../AdminLayout/NavBar";
import Footer from "../AdminLayout/Footer";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
function AcceuilAdmin() {
  const navigate = useNavigate(); 

  // Vérifier le token au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      navigate("/signin"); 
    }
  }, [navigate]);
  return (
    <div>
      <SideBar />
      <div className="content">
        <NavBar />
        <Outlet />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1050 }}>
  <Footer />
       
      </div>
    </div>
  );
}

export default AcceuilAdmin;