import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AjouterResponsable() {
  const [newResponsable, setNewResponsable ] = useState({
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
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewResponsable({ ...newResponsable, [name]: value });
  };

  const handleAddResponsable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Token récupéré pour la requête:', token);
      if (!token) {
        setError('Vous devez être connecté pour ajouter un responsable');
        navigate('/login');
        return;
      }
      await axios.post(
        `${baseURL}/auth/new-responsable`,
        newResponsable,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Responsable ajouté avec succès");
      navigate("/admin/responsables", { state: { refresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du responsable");
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
                  <p className="mb-0">Ajouter un responsable</p>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleAddResponsable}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Nom</label>
                        <input
                          className="form-control"
                          type="text"
                          name="nom"
                          value={newResponsable.nom}
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
                          value={newResponsable.prenom}
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
                          value={newResponsable.email}
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
                          value={newResponsable.password}
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
                          value={newResponsable.specialite}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Nom de l'entreprise</label>
                        <input
                          className="form-control"
                          type="text"
                          name="nom_entreprise"
                          value={newResponsable.nom_entreprise}
                          onChange={handleInputChange}
                        />
                      </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-control-label">Adresse</label>
                        <input
                          className="form-control"
                          type="text"
                          name="adresse_entreprise"
                          value={newResponsable.adresse_entreprise}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-control-label">Téléphone</label>
                        <input
                          className="form-control"
                          type="text"
                          name="tel"
                          value={newResponsable.tel}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => navigate("/admin/responsables")}
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

export default AjouterResponsable;