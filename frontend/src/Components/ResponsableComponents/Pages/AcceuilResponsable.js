import React , { useEffect } from "react";
import NavBar from "../ResponsableLayout/NavBar";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../ResponsableLayout/SideBar";
function AcceuilResponsable() {
  const navigate = useNavigate(); 

  // Vérifier le token au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      navigate("/signinresponsable"); 
    }
  }, [navigate]);
  return (
    <div>
            <SideBar />
      <div className="content">
        <NavBar />
        <Outlet />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 2000 }}>
       
      </div>
    </div>
    
  );
}

export default AcceuilResponsable;