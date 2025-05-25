import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function Candidats() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const response = await axios.get("http://localhost:5000/api/auth/candidats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Candidats récupérés:", response.data);
      // Log the raw response to inspect structure
      console.log("Nombre de candidats bruts:", response.data.length);
      // Remove the role filter since backend should ensure role: 'candidat'
      setCandidates(response.data);
      console.log("État candidates après set:", response.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des candidats:", err.response?.data || err);
      setError(err.response?.data?.message || "Erreur lors du chargement des candidats");
      setLoading(false);
    }
  };

  const deleteCandidate = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce candidat ?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Vous devez être connecté");
          navigate("/signin");
          return;
        }
        await axios.delete(`http://localhost:5000/api/auth/candidats/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchCandidates();
        alert("Candidat supprimé avec succès");
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Erreur lors de la suppression du candidat";
        setError(errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handleDownloadCV = async (nomFichier) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/cv/download/${nomFichier}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomFichier);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du téléchargement du CV');
    }
  };

  const fetchCandidateDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/auth/candidats/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Détails du candidat:", response.data);
      setSelectedCandidate(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Erreur lors du chargement des détails du candidat:", err.response?.data || err);
      setError(err.response?.data?.message || "Erreur lors du chargement des détails du candidat");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
    setError(null);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchCandidates();
    }
  }, [location.state?.refresh]);

  return (
    <div>
      <div className="d-flex">
        <div className="container-fluid py-6" style={{ marginLeft: "280px" }}>
          <div className="row mt-4">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                  <h6>Liste des Candidats</h6>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/admin/ajouter-candidat")}
                    title="Ajouter un candidat"
                  >
                    <i className="fa fa-plus me-2"></i>Ajouter
                  </button>
                </div>
                <div className="card-body px-0 pt-0 pb-2">
                  <div className="table-responsive p-0">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Candidat</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Spécialité</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Expérience</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Statut</th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Chargement des candidats...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="5" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : candidates.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Aucun candidat trouvé
                            </td>
                          </tr>
                        ) : (
                          candidates.map((candidate) => (
                            <tr key={candidate._id}>
                              <td>
                                <div className="d-flex px-2 py-1">
                                  <div>
                                    <img
                                      src="../assets/img/team-2.jpg"
                                      className="avatar avatar-sm me-3"
                                      alt={`${candidate.nom} ${candidate.prenom}`}
                                    />
                                  </div>
                                  <div className="d-flex flex-column justify-content-center">
                                    <h6 className="mb-0 text-sm">{`${candidate.nom} ${candidate.prenom}`}</h6>
                                    <p className="text-xs text-secondary mb-0">{candidate.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.specialite}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.experience || "Non spécifiée"}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.status}</p>
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-link text-danger p-0 mx-2"
                                  onClick={() => deleteCandidate(candidate._id)}
                                  title={
                                    candidate.hasDemandes
                                      ? "Suppression impossible : le candidat a des demandes"
                                      : candidate.status === 'employé'
                                      ? "Suppression impossible : le candidat est employé"
                                      : "Supprimer candidat"
                                  }
                                  disabled={candidate.hasDemandes || candidate.status === 'employé'}
                                  style={{ opacity: candidate.hasDemandes || candidate.status === 'employé' ? 0.5 : 1 }}
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Editer"
                                  onClick={() => {
                                    console.log("Navigation vers candidat ID:", candidate._id);
                                    navigate(`/admin/details-candidats/${candidate._id}`);
                                  }}
                                >
                                  <i className="fa fa-edit" aria-hidden="true"></i>
                                </button>
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Voir détails"
                                  onClick={() => fetchCandidateDetails(candidate._id)}
                                >
                                  <i className="fa fa-eye" aria-hidden="true"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Candidate Details */}
      {selectedCandidate && (
        <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Détails du Candidat</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {error && <p className="text-danger">{error}</p>}
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Nom:</strong> {selectedCandidate.nom}</p>
                    <p><strong>Prénom:</strong> {selectedCandidate.prenom}</p>
                    <p><strong>Email:</strong> {selectedCandidate.email}</p>
                    <p><strong>Spécialité:</strong> {selectedCandidate.specialite || '-'}</p>
                    <p><strong>Téléphone:</strong> {selectedCandidate.tel || '-'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Expérience:</strong> {selectedCandidate.experience || 'Non spécifiée'}</p>
                    <p><strong>Statut:</strong> {selectedCandidate.status || '-'}</p>
                    <p>
                      <strong>CV:</strong>{' '}
                      {selectedCandidate.cv ? (
                        <button
                          className="btn btn-link p-0"
                          onClick={() => handleDownloadCV(selectedCandidate.cv.nomFichier)}
                          title="Télécharger CV"
                        >
                          <i className="fas fa-file-pdf text-danger fa-lg"></i>
                        </button>
                      ) : (
                        'Aucun CV'
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <h6>Demandes du Candidat</h6>
                  {selectedCandidate.demandes && selectedCandidate.demandes.length > 0 ? (
                    selectedCandidate.demandes.map((demande, index) => (
                      <div key={index} className="mb-3 p-3 border rounded">
                        <p><strong>Statut de la Demande:</strong> {demande.statut || '-'}</p>
                        <p><strong>Date de la Demande:</strong> {new Date(demande.dateDemande).toLocaleDateString() || '-'}</p>
                        {demande.offre && (
                          <>
                            <h6>Détails de l'Offre</h6>
                            <div className="row">
                              <div className="col-md-6">
                                <p><strong>Titre:</strong> {demande.offre.titre || '-'}</p>
                                <p><strong>Type de Contrat:</strong> {demande.offre.typeContrat || '-'}</p>
                                <p><strong>Description:</strong> {demande.offre.description || '-'}</p>
                              </div>
                              <div className="col-md-6">
                                <p><strong>Salaire:</strong> {demande.offre.salaire || '-'}</p>
                              </div>
                            </div>
                            {demande.offre.entreprise && (
                              <div className="mt-3">
                                <h6>Entreprise</h6>
                                <p><strong>Nom de l'Entreprise:</strong> {demande.offre.entreprise.nom_entreprise || '-'}</p>
                                <p><strong>Adresse de l'Entreprise:</strong> {demande.offre.entreprise.adresse_entreprise || '-'}</p>
                                <p><strong>Téléphone:</strong> {demande.offre.entreprise.tel || '-'}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>Aucune demande trouvée pour ce candidat.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Candidats;