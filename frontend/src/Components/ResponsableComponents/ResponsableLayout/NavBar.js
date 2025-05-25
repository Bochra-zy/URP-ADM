import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";

function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ nom: "", prenom: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("http://localhost:5000/api/auth/responsable/profil", {
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
          navigate("/signinresponsable");
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Logout clicked");
    localStorage.removeItem("token");
    navigate("/signinresponsable");
  };

  return (
    <>
      <style>
        {`
          .navbar-nav .dropdown-menu {
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            z-index: 2000; /* Ensure dropdown is above other elements */
            min-width: 150px; /* Ensure enough width for content */
          }
          .navbar-nav .dropdown-item {
            color: #333;
            padding: 8px 16px; /* Add padding for better spacing */
          }
          .navbar-nav .dropdown-item:hover {
            background-color: #f0f0f0;
          }
          .navbar {
            position: relative; /* Ensure dropdown positions relative to navbar */
          }
        `}
      </style>
      <nav
        className="navbar navbar-expand-lg navbar-dark z-index-3 py-3"
        style={{
          background: "linear-gradient(90deg, rgb(150, 208, 249), rgb(130, 191, 203))",
        }}
      >
        <div className="container" style={{ marginLeft: "auto", marginRight: "20px" }}>
          <div
            className="collapse navbar-collapse w-100 pt-2 pb-2 py-lg-0"
            id="navigation"
          >
            <ul className="navbar-nav ms-auto">
              <li className="nav-item mx-2 dropdown">
                <a
                  className="nav-link ps-2 d-flex justify-content-between cursor-pointer align-items-center"
                  href="#"
                  id="profileDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-user me-1" style={{ color: "white" }}></i>
                  {loading ? (
                    <span className="text-white">Chargement...</span>
                  ) : error ? (
                    <span className="text-white">Erreur</span>
                  ) : (
                    <span className="text-white">
                      {user.prenom} {user.nom}
                    </span>
                  )}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                  <li>
                    <NavLink
                      to="/responsable/profil"
                      className="dropdown-item"
                      onClick={() => console.log("Profile clicked")}
                    >
                      Profil
                    </NavLink>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;