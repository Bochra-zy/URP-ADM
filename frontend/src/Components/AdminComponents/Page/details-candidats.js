import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function DetailCandidat() {
  const [candidate, setCandidate] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    specialite: "",
    experience: "",
    status: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté");
      navigate("/signin");
      return;
    }

    const fetchCandidateProfile = async () => {
      try {
        setLoading(true);
        console.log("ID du candidat:", id);
        const res = await axios.get(`http://localhost:5000/api/auth/candidats/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCandidate(res.data);
        setFormData({
          nom: res.data.nom || "",
          prenom: res.data.prenom || "",
          email: res.data.email || "",
          password: "",
          specialite: res.data.specialite || "",
          experience: res.data.experience || "",
          status: res.data.status || "à la recherche",
        });
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error.response?.data || error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setError("Session expirée. Veuillez vous reconnecter.");
          navigate("/signin");
        } else if (error.response?.status === 404) {
          setError("Utilisateur non trouvé.");
        } else if (error.response?.status === 403) {
          setError("Accès réservé aux administrateurs.");
          navigate("/admin/candidats");
        } else {
          setError(error.response?.data?.message || "Erreur lors de la récupération du profil");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateProfile();
  }, [navigate, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.specialite) {
      setError("Nom, prénom, email et spécialité sont obligatoires.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Veuillez entrer un email valide.");
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }
    if (!['à la recherche', 'employé', 'en attente'].includes(formData.status)) {
      setError("Statut invalide.");
      return false;
    }
    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    const updatedData = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      specialite: formData.specialite,
      experience: formData.experience || null,
      status: formData.status,
    };
    if (formData.password) updatedData.password = formData.password;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const res = await axios.put(
        `http://localhost:5000/api/auth/candidats/${id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCandidate(res.data);
      setFormData((prev) => ({
        ...prev,
        password: "", // Réinitialiser le mot de passe
      }));
      setError(null);
      alert("Profil du candidat mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error.response?.data || error);
      setError(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
    }
  };

  if (loading) {
    return (
      <div className="g-sidenav-show bg-gray-100">
        <main className="main-content position-relative border-radius-lg">
          <div className="container-fluid py-6" style={{ marginLeft: "250px", width: "1286px", marginTop: "-180px" }}>
            <p>Chargement des informations du candidat...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="g-sidenav-show bg-gray-100">
        <main className="main-content position-relative border-radius-lg">
          <div className="container-fluid py-6" style={{ marginLeft: "250px", width: "1286px", marginTop: "-180px" }}>
            <div className="alert alert-danger" role="alert">
              {error}
              <br />
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => navigate("/admin/candidats")}
              >
                Retour à la liste des candidats
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
        <div className="container-fluid py-6" style={{ marginLeft: "250px", width: "1286px", marginTop: "-210px" }}>
          <div className="container-fluid py-4">
            <div className="row" style={{ marginLeft: "0px", width: "1855px", marginTop: "220px" }}>
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header pb-0">
                    <div className="d-flex align-items-center">
                      <p className="mb-0">Modifier le profil du candidat</p>
                    </div>
                  </div>
                  <div className="card-body">
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
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
                            required
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
                            required
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
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            MOT DE PASSE (laisser vide pour ne pas modifier)
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
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="experience" className="form-control-label">
                            EXPÉRIENCE
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                     
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="status" className="form-control-label">
                            STATUT
                          </label>
                          <select
                            className="form-control"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="à la recherche">À la recherche</option>
                            <option value="employé">Employé</option>
                            <option value="en attente">En attente</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => navigate("/admin/candidats")}
                      >
                        Annuler
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateProfile}
                      >
                        MODIFIER
                      </button>
                    </div>
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

export default DetailCandidat;