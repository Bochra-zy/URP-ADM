import React from "react";
import { useNavigate } from "react-router-dom";

function AcceuilCandEntre() {
    const navigate = useNavigate(); 

    const EspaceEntreprise = () => {
        navigate("/signinResponsable");
    };

    const EspaceCandidature = () => {
        navigate("/signincandidat");
    };
    return (
        <div
            className="page-header min-vh-50 pt-2 pb-5 m-3 border-radius-lg"
                style={{backgroundImage: `url(${process.env.PUBLIC_URL}/images/background.jpg)`, }}   
        >
            <main className="main-content" style={{ width: "100%", }}>
                {/* Section d'en-tête */}
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-6 text-center mx-auto">
                                <h1 className="text-black mb-3 mt-5" style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
                                    Bienvenue !
                                </h1>
                                <p
                                    className="text-gray"
                                    style={{ fontSize: "1.2rem", opacity: 0.9 }}
                                >
                                    Choisissez votre espace pour commencer 
                                </p>
                            </div>
                        </div>
                    </div>
                {/* Section des cartes */}
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-4 col-lg-5 col-md-7 mx-auto">
                            <div
                                className="card shadow-lg"
                                style={{
                                    background: "rgba(255, 255, 255, 0.95)", // Fond blanc semi-transparent
                                    borderRadius: "15px",
                                    padding: "20px",
                                }}
                            >
                                <div className="card-body text-center">
                                    <h5
                                        className="mb-4"
                                        style={{ fontWeight: "600", color: "#344767" }}
                                    >
                                        Espace Responsable 
                                    </h5>
                                    <p className="text-muted mb-4">
                                        Pour les recruteurs et responsables d’entreprise
                                    </p>
                                    <button
                                        type="button"
                                        className="btn bg-gradient-dark w-100 mb-4"
                                        style={{
                                            padding: "12px",
                                            fontSize: "1rem",
                                            borderRadius: "10px",
                                        }}
                                        onClick={EspaceEntreprise}
                                       >
                                        Se Connecter
                                    </button>

                                    <h5
                                        className="mb-4"
                                        style={{ fontWeight: "600", color: "#344767" }}
                                    >
                                        Espace Candidat
                                    </h5>
                                    <p className="text-muted mb-4">
                                        Pour les personnes à la recherche d’un emploi
                                    </p>
                                    <button
                                        type="button"
                                        className="btn bg-gradient-dark w-100"
                                        style={{
                                            padding: "12px",
                                            fontSize: "1rem",
                                            borderRadius: "10px",
                                        }}
                                        onClick={EspaceCandidature}
                                    >
                                        Se Connecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AcceuilCandEntre;