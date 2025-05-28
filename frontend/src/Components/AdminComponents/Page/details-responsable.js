import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function DetailsResponsable() {
  const [responsable, setResponsable] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    specialite: "",
    nom_entreprise: "",
    adresse_entreprise: "",
    tel :"",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
const baseURL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token dans localStorage:", token); // Log pour déboguer
    if (!token) {
      setError("Vous devez être connecté");
      navigate("/signin");
      return;
    }

    const fetchResponsableProfile = async () => {
      try {
        setLoading(true);
        console.log("ID du responsable:", id); // Log pour déboguer
        const res = await axios.get(`${baseURL}/auth/responsables/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResponsable(res.data);
        setFormData({
          nom: res.data.nom || "",
          prenom: res.data.prenom || "",
          email: res.data.email || "",
          password: "",
          specialite: res.data.specialite || "",
          nom_entreprise: res.data.nom_entreprise || "",
          adresse_entreprise: res.data.adresse_entreprise || "",
          tel: res.data.tel || "",

        });
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error.response?.data || error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setError("Session expirée. Veuillez vous reconnecter.");
          navigate("/signin");
        } else if (error.response?.status === 404) {
          setError("Responsable non trouvé. Vérifiez l'ID ou retournez à la liste des responsables.");
        } else {
          setError(error.response?.data?.message || "Erreur lors de la récupération du profil");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResponsableProfile();
  }, [navigate, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    const updatedData = {};
    if (formData.nom) updatedData.nom = formData.nom;
    if (formData.prenom) updatedData.prenom = formData.prenom;
    if (formData.email) updatedData.email = formData.email;
    if (formData.specialite) updatedData.specialite = formData.specialite;
    if (formData.adresse_entreprise) updatedData.adresse_entreprise = formData.adresse_entreprise;
    if (formData.nom_entreprise) updatedData.nom_entreprise = formData.nom_entreprise;
    if (formData.password) updatedData.password = formData.password;
    if (formData.tel) updatedData.tel = formData.tel;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const res = await axios.put(
        `${baseURL}/auth/responsables/${id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResponsable(res.data);
      setFormData((prev) => ({
        ...prev,
        password: "", // Réinitialiser le mot de passe après mise à jour
      }));
      alert("Profil du responsable mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error.response?.data || error);
      setError(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
    }
  };

  if (loading) {
    return (
      <div className="g-sidenav-show bg-gray-100">
        <main className="main-content position-relative border-radius-lg">
          <div className="container-fluid py-4" style={{ marginLeft: "250px", width: "1286px", marginTop: "-180px" }}>
            <p>Chargement des informations du responsable...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="g-sidenav-show bg-gray-100">
        <main className="main-content position-relative border-radius-lg">
          <div className="container-fluid py-4" style={{ marginLeft: "250px", width: "1286px", marginTop: "-180px" }}>
            <div className="alert alert-danger" role="alert">
              {error}
              <br />
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => navigate("/admin/responsables")}
              >
                Retour à la liste des responsable
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="g-sidenav-show bg-gray-100">
      <main className="main-content position-relative border-radius-lg">
        <div
          className="container-fluid py-4"
          style={{ marginLeft: "250px", width: "1286px", marginTop: "-180px" }}
        >
          
          <div className="container-fluid py-4">
            <div className="row" style={{ marginLeft: "0px", width: "1855px", marginTop: "220px" }}>
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header pb-0">
                    <div className="d-flex align-items-center">
                      <p className="mb-0">Modifier le profil du responsable</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <hr className="horizontal dark" />
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="nom" className="form-control-label">
                            NOM
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="prenom" className="form-control-label">
                            PRÉNOM
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="email" className="form-control-label">
                            ADRESSE EMAIL
                          </label>
                          <input
                            className="form-control"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            MOT DE PASSE
                          </label>
                          <input
                            className="form-control"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Nouveau mot de passe"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="specialite" className="form-control-label">
                            SPÉCIALITÉ
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="specialite"
                            value={formData.specialite}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="nom_entreprise" className="form-control-label">
                            NOM ENTREPRISE
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="nom_entreprise"
                            value={formData.nom_entreprise}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="nom_entreprise" className="form-control-label">
                            ADRESSE ENTREPRISE
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="adresse_entreprise"
                            value={formData.adresse_entreprise}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                   
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => navigate("/admin/responsables")}
                      >
                        Annuler
                      </button>
                      <button
                      className="btn btn-primary"
                      onClick={handleUpdateProfile}
                    >
                      METTRE À JOUR
                    </button>
                    
                   
                    <hr className="horizontal dark" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DetailsResponsable;