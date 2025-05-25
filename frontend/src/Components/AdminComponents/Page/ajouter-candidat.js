import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AjouterCandidat() {
  const [newCandidate, setNewCandidate] = useState({
    nom: "",
    prenom: "",
    email: "",
    specialite: "",
    experience: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCandidate({ ...newCandidate, [name]: value });
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Token récupéré pour la requête:', token);
      if (!token) {
        setError('Vous devez être connecté pour ajouter un candidat');
        navigate('/login');
        return;
      }
      await axios.post(
        "http://localhost:5000/api/auth/new-candidats",
        newCandidate,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Candidat ajouté avec succès");
      navigate("/admin/candidats", { state: { refresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du candidat");
      console.error('Erreur lors de l\'ajout:', err.response?.data);
    }
  };

  return (
    <div className="g-sidenav-show bg-gray-100">
      <main className="main-content position-relative border-radius-lg">
        <div className="container-fluid py-7">
          <div className="row" style={{ marginLeft: "270px", width: "1855px" }}>
            <div className="col-md-8">
              <div className="card">
                <div className="card-header pb-0">
                  <p className="mb-0">Ajouter un Candidat</p>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleAddCandidate}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Nom</label>
                        <input
                          className="form-control"
                          type="text"
                          name="nom"
                          value={newCandidate.nom}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Prénom</label>
                        <input
                          className="form-control"
                          type="text"
                          name="prenom"
                          value={newCandidate.prenom}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Email</label>
                        <input
                          className="form-control"
                          type="email"
                          name="email"
                          value={newCandidate.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Mot de passe</label>
                        <input
                          className="form-control"
                          type="password"
                          name="password"
                          value={newCandidate.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Spécialité</label>
                        <input
                          className="form-control"
                          type="text"
                          name="specialite"
                          value={newCandidate.specialite}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Expérience</label>
                        <input
                          className="form-control"
                          type="text"
                          name="experience"
                          value={newCandidate.experience}
                          onChange={handleInputChange}
                        />
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
                      <button type="submit" className="btn btn-primary">
                        Ajouter
                      </button>
                    </div>
                  </form>
                  <hr className="horizontal dark mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AjouterCandidat;