import React, { useState } from "react";
import { NavLink } from "react-router-dom";

function SideBar() {
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div>
      {/* Sidebar */}
      <aside
        className={`sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-4 
        }`}
        id="sidenav-main"
      style={{
        zIndex: 1050,
        opacity: 1
      }}
      >
        <div className="sidenav-header">
          {/* Logo ou titre de la sidebar */}
          <a className="navbar-brand m-0">
            <img
              src="../logo19.png"
              width="26px"
              height="26px"
              className="navbar-brand-img h-100"
              alt="main_logo"
            />
            <span
              className={`ms-1 font-weight-bold ${isSidebarExpanded ? "" : "d-none"}`}
            >
              Dashboard
            </span>
          </a>
        </div>
        
        <hr className="horizontal dark mt-0" />

        {/* Menu de la sidebar */}
        <div className="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink
                to="/admin/acceuil"
                exact
                className="nav-link"
                activeClassName="active"  // La classe active sera appliquée automatiquement
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/acceuil.png"
                    style={{ width: "20px", height: "20px" }}
                    alt="acceuil-icon"
                  />
                </div>
               <span className="nav-link-text ms-1">Acceuil</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/candidats"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/people.png"
                    style={{ width: "23px", height: "23px" }}
                    alt="people-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Candidats</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/entretien"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/entretient.png"
                    style={{ width: "20px", height: "20px" }}
                    alt="entretient-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Entretiens</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/responsables"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/building.png"
                    style={{ width: "20px", height: "20px" }}
                    alt="building-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Responsable de recrutement</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/offres"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/offer.png"
                    style={{ width: "20px", height: "20px" }}
                    alt="offer-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Offer</span>}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/profil"
                className="nav-link"
                activeClassName="active"
              >
                <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                  <img
                    src="/assets/img/icons/avatar.png"
                    style={{ width: "20px", height: "20px" }}
                    alt="avatar-icon"
                  />
                </div>
                {isSidebarExpanded && <span className="nav-link-text ms-1">Profil</span>}
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default SideBar;
