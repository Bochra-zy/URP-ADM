import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

function SideBar() {
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);
  const [user, setUser] = useState({ nom: "", prenom: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get(`${baseURL}/auth/candidat/profil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/signincandidat");
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = (event) => {
    event.preventDefault();
    event.stopPropagation();
    localStorage.removeItem("token");
    toast.success("Déconnexion réussie !", {
      position: "top-right",
      autoClose: 2000,
    });
    navigate("/signincandidat");
  };

  return (
    <div>
      <style>
        {`
          .sidenav-header {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            justify-content: flex-start; /* Align content to the left */
          }
          .sidenav-header .navbar-brand {
            display: flex;
            align-items: center;
            gap: 10px; /* Space between image, name, and Dashboard */
          }
          .sidenav-header .user-name {
            font-size: 0.9rem;
            color: #333;
            font-weight: 500;
          }
        `}
      </style>
      <aside
        className={`sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-0 fixed-start ms-0`}
        id="sidenav-main"
        style={{
          zIndex: 1050,
          opacity: 1,
          
        }}
      >
        <div className="sidenav-header" style={{ marginLeft:'-30px'}}>
          <a className="navbar-brand m-0">
            <img
              src={`${process.env.PUBLIC_URL}/assets/img/candidat.png`}
              width="30px"
              height="30px"
              className="avatar avatar-sm"
              alt="profile"
            />
            {loading ? (
              <span className="ms-1 font-weight-bold">Chargement...</span>
            ) : error ? (
              <span className="ms-1 font-weight-bold">Erreur</span>
            ) : (
              <span className="ms-1 font-weight-bold">
                {user.prenom} {user.nom}
              </span>
            )}
          </a>
        </div>

        <hr className="horizontal dark mt-0" />

        <div className="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink
                to="/candidat/acceuil"
                exact
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/bouton-daccueil.png"
                    style={{ width: "30px", height: "30px" }}
                    alt="acceuil-icon"
                  />
                </div>
                <span className="nav-link-text ms-1">Acceuil</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/candidat/deposerCV"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/cv (1).png"
                    style={{ width: "30px", height: "30px" }}
                    alt="offre"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Déposer CV</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                 to="/candidat/entretient"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/planification-du-temps.png"
                    style={{ width: "30px", height: "30px" }}
                    alt="entretient-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Mes Entretiens</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/candidat/demandes"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/liste-de-controle.png"
                    style={{ width: "30px", height: "30px" }}
                    alt="building-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Mes demandes</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                 to="/candidat/offres"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/recherche-demploi.png"
                    style={{ width: "30px", height: "30px" }}
                    alt="offer-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Les Offres</span>}
              </NavLink>
            </li>
          </ul>
        </div>
        <hr className="horizontal dark mt-8" />
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink
             to="/candidat/profil"
              exact
              className="nav-link"
              activeClassName="active"
            >
              <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                <img
                  src="/assets/img/icons/profil.png"
                  style={{ width: "30px", height: "30px" }}
                  alt="acceuil-icon"
                />
              </div>
              <span className="nav-link-text ms-1">Profil</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{ background: "none", border: "none", textAlign: "left" }}
            >
              <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                <img
                  src="/assets/img/icons/se-deconnecter.png"
                  style={{ width: "20px", height: "20px" }}
                  alt="logout-icon"
                />
              </div>
              <span className="nav-link-text ms-1">Déconnecter</span>
            </button>
          </li>
        </ul>
      </aside>
    </div>
  );
}

export default SideBar;