import React , { useEffect } from "react";
import NavBar from "../CandidatLayout/NavBar";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SideBar from "../CandidatLayout/SideBar";
function AcceuilCandidat() {
  const navigate = useNavigate(); 

  // Vérifier le token au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      navigate("/signincandidat"); 
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

export default AcceuilCandidat;