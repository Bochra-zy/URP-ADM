import React from "react";

function Footer() {
  return (
    <footer className="footer pt-3" style={{ position: "relative", zIndex: 2000 }}>
      <div className="container-fluid">
        <div className="row align-items-center justify-content-lg-between">
          <div className="col-lg-6 mb-lg-0 mb-4">
            <div className="copyright text-center text-sm text-muted text-lg-start">
             
            </div>
          </div>
          <div className="col-lg-6">
            <ul className="nav nav-footer justify-content-center justify-content-lg-end">
            <li className="nav-item">
                <a href="" className="nav-link text-muted" target="_blank">
                Fait avec ❤️ à Tunis
                </a>
              </li>
             
              <li className="nav-item">
                <a href="" className="nav-link text-muted" target="_blank">
                © 2025
                </a>
              </li>
              
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;