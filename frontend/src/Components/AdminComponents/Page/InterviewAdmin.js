import React, { useState, useEffect } from "react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function InterviewsAdmin() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
const baseURL = process.env.REACT_APP_API_URL;

  // Fetch all interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté en tant qu'admin pour voir les entretiens");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${baseURL}/interview/interviewsADM`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erreur ${response.status}: ${errorData.message || "Erreur inconnue"}`);
        }

        const data = await response.json();
        console.log("Entretiens reçus :", data);
        setInterviews(data);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des entretiens :", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  

  // Show modal with interview details
  const handleShowModal = (interview) => {
    setSelectedInterview(interview);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInterview(null);
  };

  return (
    <div>
      <div className="d-flex">
        <div className="container-fluid py-6" style={{ marginLeft: "280px" }}>
          <div className="row mt-4">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                  <h6>Liste des entretiens</h6>
                </div>
                <div className="card-body px-0 pt-0 pb-2">
                  <div className="table-responsive p-0">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Candidat</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Offre</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Date</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Durée</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Statut</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Décision</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Responsable</th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="text-center">
                              Chargement des entretiens...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="8" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : interviews.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center">
                              Aucun entretien trouvé
                            </td>
                          </tr>
                        ) : (
                          interviews.map((interview) => (
                            <tr key={interview._id}>
                              <td>
                                <div className="d-flex px-2 py-1">
                                  <div className="d-flex flex-column justify-content-center">
                                    <h6 className="mb-0 text-sm">
                                      {interview.candidat ? `${interview.candidat.prenom} ${interview.candidat.nom}` : "Candidat inconnu"}
                                    </h6>
                                    <p className="text-xs text-secondary mb-0">
                                      {interview.candidat?.email || "Non disponible"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.offre?.titre || "Offre inconnue"}
                                </p>
                                <p className="text-xs text-secondary mb-0">
                                  {interview.offre?.typeContrat || "-"}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.date ? format(new Date(interview.date), 'dd/MM/yyyy HH:mm', { locale: fr }) : "Non disponible"}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.dure ? `${interview.dure} min` : "Non spécifié"}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.statut || "Planifié"}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.decision || "En attente"}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {interview.responsable?.nom_entreprise || (interview.responsable ? `${interview.responsable.prenom} ${interview.responsable.nom}` : "Non spécifié")}
                                </p>
                              </td>
                              <td className="align-middle text-center">
                              
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Voir détails"
                                  onClick={() => handleShowModal(interview)}
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

      {/* Bootstrap Modal */}
      {selectedInterview && (
        <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Détails de l'entretien</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Candidat :</strong> {selectedInterview.candidat ? `${selectedInterview.candidat.prenom} ${selectedInterview.candidat.nom}` : "Inconnu"}</p>
                <p><strong>Email :</strong> {selectedInterview.candidat?.email || "Non disponible"}</p>
                <p><strong>Offre :</strong> {selectedInterview.offre?.titre || "Inconnue"}</p>
                <p><strong>Type de contrat :</strong> {selectedInterview.offre?.typeContrat || "-"}</p>
                <p><strong>Date :</strong> {selectedInterview.date ? format(new Date(selectedInterview.date), 'dd/MM/yyyy HH:mm', { locale: fr }) : "Non disponible"}</p>
                <p><strong>Durée :</strong> {selectedInterview.dure ? `${selectedInterview.dure} min` : "Non spécifié"}</p>
                <p><strong>Statut :</strong> {selectedInterview.statut || "Planifié"}</p>
                <p><strong>Décision :</strong> {selectedInterview.decision || "En attente"}</p>
                <p><strong>Lien de réunion :</strong> {selectedInterview.meetingLink ? <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer">{selectedInterview.meetingLink}</a> : "Aucun lien"}</p>
                <p><strong>Responsable :</strong> {selectedInterview.responsable?.nom_entreprise || (selectedInterview.responsable ? `${selectedInterview.responsable.prenom} ${selectedInterview.responsable.nom}` : "Non spécifié")}</p>
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

export default InterviewsAdmin;