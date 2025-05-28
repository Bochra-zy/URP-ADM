import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${baseURL}/auth/forgot-password`, {
        email,
      });
      setMessage(res.data.message); 
      setTimeout(() => navigate("/signin"), 3000); 
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande");
    }
  };

  return (
    <main className="main-content mt-0" style={{ backgroundColor: "white" }}>
      <section>
        <div className="page-header min-vh-100">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto">
                <div className="card card-plain">
                  <div className="card-header pb-0 text-start">
                    <h4 className="font-weight-bolder">MOT DE PASSE OUBLIÉ</h4>
                    <p className="mb-0">Entrez votre email pour réinitialiser votre mot de passe</p>
                  </div>
                  <div className="card-body">
                    {message && <p className="text-success">{message}</p>}
                    {error && <p className="text-danger">{error}</p>}
                    <form onSubmit={handleForgotPassword}>
                      <div className="mb-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-control form-control-lg"
                          placeholder="Email"
                          aria-label="Email"
                          required
                        />
                      </div>
                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-lg btn-primary btn-lg w-100 mt-4 mb-0"
                        >
                          Envoyer
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="card-footer text-center pt-0 px-lg-2 px-1">
                    <p className="mb-4 text-sm mx-auto">
                      <a href="/signin" className="text-primary text-gradient font-weight-bold">
                        Retour à la connexion
                      </a>
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
                    "Réinitialisez votre mot de passe"
                  </h4>
                  <p className="text-white position-relative">
                    Un lien sera envoyé à votre email
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

export default ForgotPassword;