import React, { useState , useEffect } from "react";
import { useNavigate , useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles

const SignInResponsable = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false); // État pour afficher la modale
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false); // Modale pour réinitialiser le mot de passe
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

   // Extraire le token de l'URL
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      if (token) {
        setShowResetPasswordModal(true); // Ouvre la modale de réinitialisation si un token est présent
      }
    }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/responsable/login`, {
        email,
        password,
      });

      const token = res.data.token;
      if (token) {
         localStorage.setItem("token", token);
        toast.success("Connexion réussie !", {
          position: "top-right",
          autoClose: 1000,
          onClose: () => navigate("/responsable/acceuil"), 
        });
      } else {
        setError("Aucun token reçu !");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    }
  };
  // Fonction pour gérer la demande de réinitialisation de mot de passe
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setError("");

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/responsable/forgot-password`, {
        email: resetEmail,
      });
      setResetMessage(res.data.message || "Un e-mail de réinitialisation a été envoyé !");
      setShowResetModal(true); // Fermer la modale après succès
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande de réinitialisation");
    }
  };
  // Fonction pour gérer la réinitialisation du mot de passe
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/responsable/reset-password", {
        token,
        password: newPassword,
      });
      setResetMessage(res.data.message || "Mot de passe réinitialisé avec succès !");
      setShowResetPasswordModal(false);
      navigate("/signinresponsable"); // Rediriger vers la page de connexion sans token
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation du mot de passe");
    }
  };
  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg position-absolute top-0 z-index-3 w-100 shadow-none my-3 navbar-transparent mt-4">
              <ToastContainer /> {/* Add ToastContainer */}
                <div className="container">
                    <div className="collapse navbar-collapse" id="navigation">
                        <ul className="navbar-nav ms-0">
                            <li className="nav-item">
                            <a className="nav-link me-2" href="/">
                                    <i className="fas fa-arrow-left me-2"></i>
                                    Acceuil 
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
      {/* End Navbar */}

      <main className="main-content mt-0">
        <div
          className="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg"
          style={{backgroundImage: `url(${process.env.PUBLIC_URL}/images/backgound-responsable.jpg)`,
          backgroundPosition: "top"
         }}   

        >
          <span className="mask bg-gradient-dark opacity-6"></span>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5 text-center mx-auto">
                <h1 className="text-white mb-2 mt-5">Bienvenue!</h1>
                <p
                                    className="text-white"
                                    style={{ fontSize: "1.2rem", opacity: 0.9 }}
                                >
                                    Espace Responsable de recrutement
                                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row mt-lg-n10 mt-md-n11 mt-n10 justify-content-center">
            <div className="col-xl-4 col-lg-5 col-md-7 mx-auto">
              <div className="card z-index-0">
                <div className="card-header text-center pt-4">
                  <h5>Se Connecter</h5>
                </div>
                <div className="card-body">
                  {error && <p className="text-danger">{error}</p>}
                  <form role="form" onSubmit={handleLogin}>
                    <div className="mb-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-control"
                        placeholder="Email"
                        aria-label="Email"
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control"
                        placeholder="Mot de passe "
                        aria-label="Password"
                      />
                    </div>
                    <div className="mb text-end">
                      <a
                        href="#"
                        className="text-sm text-dark"
                        onClick={() => setShowResetModal(true)}
                      >
                        Mot de passe oublié ?
                      </a>
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn bg-gradient-dark w-100 my-4 mb-2"
                      >
                        Se Connecter
                      </button>
                    </div>
                    <p className="text-sm mt-3 mb-0">
                   
                      <a href="/signupresponsable" className="text-dark font-weight-bolder">
                      Créer un nouveau compte{" "}
                      </a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modale pour le mot de passe oublié */}
      {showResetModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Réinitialiser le mot de passe</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {resetMessage && <p className="text-success">{resetMessage}</p>}
                {error && <p className="text-danger">{error}</p>}
                <form onSubmit={handlePasswordReset}>
                  <div className="mb-3">
                    <label htmlFor="resetEmail" className="form-label">
                      Entrez votre adresse e-mail
                    </label>
                    <input
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="form-control"
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button type="submit" className="btn bg-gradient-dark w-100">
                      Envoyer le lien de réinitialisation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* Modale pour réinitialiser le mot de passe */}
    {showResetPasswordModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nouveau mot de passe</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    navigate("/signincandidat"); // Supprimer le token de l'URL
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {resetMessage && <p className="text-success">{resetMessage}</p>}
                {error && <p className="text-danger">{error}</p>}
                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                      placeholder="Nouveau mot de passe"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control"
                      placeholder="Confirmer le mot de passe"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button type="submit" className="btn bg-gradient-dark w-100">
                      Réinitialiser le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignInResponsable;