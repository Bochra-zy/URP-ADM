import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles

const SignInAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${baseURL}/auth/login`, {
        email,
        password,
      });

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        toast.success("Connexion réussie !", {
          position: "top-right",
          autoClose: 1000,
          onClose: () => navigate("/admin/acceuil"), 
        });
      } else {
        setError("Aucun token reçu !");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    }
  };

  return (
    <main className="main-content mt-0" style={{ backgroundColor: "white" }}>
      <ToastContainer /> {/* Add ToastContainer */}
      <section>
        <div className="page-header min-vh-100">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto">
                <div className="card card-plain">
                  <div className="card-header pb-0 text-start">
                    <h4 className="font-weight-bolder">SE CONNECTER</h4>
                    <p className="mb-0">Saisir votre email et mot de passe</p>
                  </div>
                  <div className="card-body">
                    {error && (
                      <p
                        className="text-red-500 bg-red-100 border border-red-400 text-sm p-3 rounded mb-4"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                    <form onSubmit={handleLogin}>
                      <div className="mb-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-control form-control-lg"
                          placeholder="Email"
                          aria-label="Email"
                        />
                      </div>
                      <div className="mb-3">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="form-control form-control-lg"
                          placeholder="Password"
                          aria-label="Password"
                        />
                      </div>
                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-lg btn-primary btn-lg w-100 mt-4 mb-0"
                        >
                          Se connecter
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="card-footer text-center pt-0 px-lg-2 px-1">
                    <p className="mb-4 text-sm mx-auto">
                      <Link
                        to="/forgot-password"
                        className="text-primary text-gradient font-weight-bold"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-6 d-lg-flex d-none h-100 my-auto pe-0 position-absolute top-0 end-0 text-center justify-content-center flex-column">
                <div
                  className="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                  style={{
                    backgroundImage:
                      'url("https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signin-ill.jpg")',
                    backgroundSize: "cover",
                  }}
                >
                  <span className="mask bg-gradient-primary opacity-6" />
                  <h4 className="mt-5 text-white font-weight-bolder position-relative">
                    "Bienvenue dans l'espace d'administration"
                  </h4>
                  <p className="text-white position-relative">
                    Connectez-vous pour accéder aux fonctionnalités avancées
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SignInAdmin;