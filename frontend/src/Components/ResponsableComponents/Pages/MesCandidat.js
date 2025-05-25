import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Button } from 'react-bootstrap';
import { format } from 'date-fns';

const MesCandidat = () => {
  const [candidates, setCandidates] = useState([]);
  const [offres, setOffres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidatId: '',
    offreId: '',
    date: new Date(),
    dure: 30,
    meetingLink: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vous devez être connecté');
          navigate('/signinresponsable');
          return;
        }

        // Fetch candidates
        console.log('Appel API vers: http://localhost:5000/api/demandes/responsable');
        const candidatesRes = await axios.get('http://localhost:5000/api/demandes/responsable', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse API candidats:', candidatesRes.data);
        if (candidatesRes.data.length > 0) {
          console.log('Exemple de candidat:', candidatesRes.data[0]);
        } else {
          console.log('Aucun candidat retourné par l\'API');
        }
        setCandidates(candidatesRes.data);

        // Fetch offers
        console.log('Appel API vers: http://localhost:5000/api/offres/offRes');
        const offresRes = await axios.get('http://localhost:5000/api/offres/offRes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse API offres:', offresRes.data);
        setOffres(offresRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err.response?.data || err);
        const errorMessage = err.response?.status === 500
          ? 'Erreur serveur. Vérifiez que les données sont valides.'
          : err.response?.data?.message || 'Erreur lors du chargement des données';
        setError(errorMessage);
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/signinresponsable');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const searchLower = searchTerm.toLowerCase();
    const specialiteMatch = candidate.specialite?.toLowerCase().includes(searchLower);
    return searchLower === '' || specialiteMatch;
  });

  const handleShowDetailsModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCandidate(null);
  };

  const handleShowScheduleModal = (candidate) => {
    console.log('Candidat sélectionné pour planification:', candidate);
    console.log('Offre ID:', candidate.offre?._id);
    setSelectedCandidate(candidate);
    setFormData({
      candidatId: candidate._id,
      offreId: candidate.offre?._id || '',
      date: new Date(),
      dure: 30,
      meetingLink: '',
    });
    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setFormData({
      candidatId: '',
      offreId: '',
      date: new Date(),
      dure: 30,
      meetingLink: '',
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        navigate('/signinresponsable');
        return;
      }

      console.log('Données envoyées à /api/interview:', {
        candidatId: formData.candidatId,
        offreId: formData.offreId,
        date: formData.date,
        dure: parseInt(formData.dure),
        meetingLink: formData.meetingLink,
      });

      if (!formData.candidatId || !formData.offreId || !formData.date) {
        setError('Tous les champs requis (candidat, offre, date) doivent être remplis');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/interview',
        {
          candidatId: formData.candidatId,
          offreId: formData.offreId,
          date: formData.date,
          dure: parseInt(formData.dure),
          meetingLink: formData.meetingLink,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Entretien planifié:', response.data);
      handleCloseScheduleModal();
      alert('Entretien planifié avec succès !');
      navigate("/responsable/Interview");
    } catch (err) {
      console.error('Erreur lors de la planification de l\'entretien:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la planification de l\'entretien';
      setError(errorMessage);
      console.log('Message d\'erreur du backend:', errorMessage);
    }
  };

  const handleDownloadCV = async (nomFichier) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        navigate('/signinresponsable');
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
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/signinresponsable');
      }
    }
  };

  const handleAnalyzeCV = async (nomFichier) => {
    try {
      setAnalysisLoading(true);
      setShowAnalysisModal(true);
      setAnalysisResult(null);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        navigate('/signinresponsable');
        return;
      }

      const aiResponse = await axios.post(
        'http://localhost:5000/api/cv/analyze',
        { nomFichier },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAnalysisResult(aiResponse.data);
    } catch (err) {
      console.error('Erreur analyse CV:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse du CV');
      setAnalysisResult({ error: err.response?.data?.error || 'Erreur lors de l\'analyse du CV' });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalysisResult(null);
    setError('');
  };

  return (
    <div>
      <div className="d-flex" style={{ marginLeft: '240px' }}>
        <div className="container-fluid py-4" style={{ marginLeft: '10px' }}>
          <div className="row mt-4">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                  <h6>Liste des Candidats acceptés aux offres</h6>
                  <div className="input-group w-25">
                    <span className="input-group-text">
                      <i className="fas fa-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par spécialité"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={handleClearSearch}
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body px-0 pt-0 pb-2">
                  <div className="table-responsive p-0 pt-3">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Candidat</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Spécialité</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Expérience</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Statut</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Statut Demande</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">CV</th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="7" className="text-center">
                              Chargement des candidats...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="7" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center">
                              {searchTerm ? `Aucun candidat trouvé pour la recherche "${searchTerm}"` : 'Aucun candidat accepté trouvé. Vérifiez les demandes ou acceptez une candidature.'}
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map((candidate) => (
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
                                <p className="text-xs font-weight-bold mb-0">{candidate.specialite || '-'}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.experience || 'Non spécifiée'}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.status || '-'}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{candidate.demandeStatut || '-'}</p>
                              </td>
                              <td>
                                {candidate.cv ? (
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => handleDownloadCV(candidate.cv.nomFichier)}
                                    title="Télécharger CV"
                                  >
                                    <i className="fas fa-file-pdf text-danger fa-lg"></i>
                                  </button>
                                ) : (
                                  <p className="text-xs text-secondary mb-0">Aucun CV</p>
                                )}
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Voir détails"
                                  onClick={() => handleShowDetailsModal(candidate)}
                                >
                                  <i className="fa fa-eye" aria-hidden="true"></i>
                                </button>
                                {candidate.cv && (
                                  <button
                                    className="btn btn-link text-primary p-0 mx-2"
                                    title="Analyser CV"
                                    onClick={() => handleAnalyzeCV(candidate.cv.nomFichier)}
                                  >
                                    <i className="fas fa-brain" aria-hidden="true"></i>
                                  </button>
                                )}
                                {candidate.status !== 'employé' && (
                                  <button
                                    className="btn btn-link text-info p-0 mx-2"
                                    title="Planifier un entretien"
                                    onClick={() => handleShowScheduleModal(candidate)}
                                  >
                                    <i className="fas fa-calendar-alt" aria-hidden="true"></i>
                                  </button>
                                )}
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

      {/* Modal pour les détails du candidat */}
      {selectedCandidate && (
        <div className={`modal fade ${showDetailsModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showDetailsModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Détails du Candidat</h5>
                <button type="button" className="btn-close" onClick={handleCloseDetailsModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Nom:</strong> {selectedCandidate.nom}</p>
                    <p><strong>Prénom:</strong> {selectedCandidate.prenom}</p>
                    <p><strong>Email:</strong> {selectedCandidate.email}</p>
                    <p><strong>Spécialité:</strong> {selectedCandidate.specialite || '-'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Expérience:</strong> {selectedCandidate.experience || 'Non spécifiée'}</p>
                    <p><strong>Statut:</strong> {selectedCandidate.status || '-'}</p>
                    <p><strong>Statut de la Demande:</strong> {selectedCandidate.demandeStatut || '-'}</p>
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
                {selectedCandidate.offre && (
                  <div className="mt-4">
                    <h6>Détails de l'Offre</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Titre:</strong> {selectedCandidate.offre.titre || '-'}</p>
                        <p><strong>Type de Contrat:</strong> {selectedCandidate.offre.typeContrat || '-'}</p>
                        <p><strong>Description:</strong> {selectedCandidate.offre.description || '-'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Salaire:</strong> {selectedCandidate.offre.salaire || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCandidate.entreprise && (
                  <div className="mt-4">
                    <h6>Détails de l'Entreprise</h6>
                    <p><strong>Nom de l'entreprise:</strong> {selectedCandidate.entreprise.nom_entreprise || '-'}</p>
                    <p><strong>Adresse:</strong> {selectedCandidate.entreprise.adresse_entreprise || '-'}</p>
                    <p><strong>Téléphone:</strong> {selectedCandidate.entreprise.tel || '-'}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseDetailsModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour planifier un entretien */}
      <Modal show={showScheduleModal} onHide={handleCloseScheduleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Planifier un entretien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleSubmitSchedule}>
            <Form.Group className="mb-3">
              <Form.Label>Candidat</Form.Label>
              <Form.Select
                name="candidatId"
                value={formData.candidatId}
                onChange={handleInputChange}
                required
                disabled
              >
                <option value="">Sélectionner un candidat</option>
                {candidates.map((candidat) => (
                  <option key={candidat._id} value={candidat._id}>
                    {candidat.prenom} {candidat.nom} ({candidat.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Offre</Form.Label>
              <Form.Select
                name="offreId"
                value={formData.offreId}
                onChange={handleInputChange}
                required
                disabled
              >
                <option value="">Sélectionner une offre</option>
                {offres.map((offre) => (
                  <option key={offre._id} value={offre._id}>
                    {offre.titre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date"
                value={format(formData.date, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Durée (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="dure"
                value={formData.dure}
                onChange={handleInputChange}
                min="15"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lien de réunion (optionnel)</Form.Label>
              <Form.Control
                type="text"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleInputChange}
                placeholder="Ex: https://zoom.us/j/..."
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Planifier
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal pour l'analyse du CV */}
      {showAnalysisModal && (
        <div className={`modal fade ${showAnalysisModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showAnalysisModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Analyse du CV</h5>
                <button type="button" className="btn-close" onClick={handleCloseAnalysisModal}></button>
              </div>
              <div className="modal-body">
                {analysisLoading ? (
                  <p>Analyse en cours...</p>
                ) : analysisResult ? (
                  analysisResult.error ? (
                    <p className="text-danger">{analysisResult.error}</p>
                  ) : (
                    <div>
                      <p><strong>Domaine:</strong> {analysisResult.domain || 'Non spécifié'}</p>
                      <p><strong>Compétences Techniques:</strong> {analysisResult.hardSkills?.join(', ') || 'Aucune'}</p>
                      <p><strong>Compétences Douces:</strong> {analysisResult.softSkills?.join(', ') || 'Aucune'}</p>
                      <p><strong>Langues:</strong> {analysisResult.languages?.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') || 'Aucune'}</p>
                      <p><strong>Expérience:</strong> {analysisResult.experience?.map(exp => `${exp.jobTitle}: ${exp.duration}`).join('; ') || 'Non spécifiée'}</p>
                      <p><strong>Niveau d'Éducation:</strong> {analysisResult.education?.level || 'Non spécifié'} {analysisResult.education?.field && analysisResult.education.field !== 'Non spécifié' ? `en ${analysisResult.education.field}` : ''}</p>
                      <p><strong>Localisation:</strong> {analysisResult.location || 'Non spécifiée'}</p>
                    </div>
                  )
                ) : (
                  <p>Aucune analyse disponible.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseAnalysisModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MesCandidat;