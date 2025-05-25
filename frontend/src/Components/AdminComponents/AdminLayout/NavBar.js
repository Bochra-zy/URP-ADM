import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom"; 

function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className=" right-0 z-50"
    style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: "60px",
      }}>
      <div className="bg-dark position-absolute w-100" style={{ height: "60px", zIndex: 999 }}></div>
      <nav
        className="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl"
        id="navbarBlur"
        data-scroll="false"
        style={{ zIndex: 1000, position: "relative" }}
      >
        <div className="container-fluid py-1 px-3">
          <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
            <div className="ms-md-auto pe-md-3 d-flex align-items-center">
              <div className="input-group">
                <span className="input-group-text text-body">
                  <i className="fas fa-search" aria-hidden="true" />
                </span>
                <input type="text" className="form-control" placeholder="Type here..." />
              </div>
            </div>
            <ul className="navbar-nav justify-content-end">
            <li className="nav-item px-3 d-flex align-items-center">
                <NavLink
                to="/admin/profil"
                className="nav-link text-white p-0">
                  <i className="fa fa-cog fixed-plugin-button-nav cursor-pointer" />
                </NavLink>
              </li>
              <li
                className="nav-item d-flex align-items-center"
                onClick={handleLogout}
                style={{ cursor: "pointer", pointerEvents: "auto" }}
              >
                <a
                  href="#"
                  className="nav-link text-white font-weight-bold px-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span className="d-sm-inline d-none"> </span>
                </a>
              </li>
              
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;