import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CandidatsListe = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchSpecialite, setSearchSpecialite] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        navigate('/signinresponsable');
        return;
      }

      const res = await axios.get('http://localhost:5000/api/auth/candidat/candidatesCV', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data);
      setFilteredCandidates(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des candidats');
      setLoading(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/signinresponsable');
      }
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [navigate]);

  useEffect(() => {
    const allowedStatuses = ['à la recherche', 'en formation', 'refusé'];
    const filtered = candidates.filter((candidate) => {
      const matchesSpecialite = searchSpecialite.trim() === '' ||
        candidate.specialite?.toLowerCase().includes(searchSpecialite.toLowerCase());
      const matchesStatus = allowedStatuses.includes(candidate.status?.toLowerCase());
      return matchesSpecialite && matchesStatus;
    });
    setFilteredCandidates(filtered);
  }, [searchSpecialite, candidates]);

  const handleSearchChange = (e) => {
    setSearchSpecialite(e.target.value);
  };

  const handleShowModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
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

    if (!nomFichier || !nomFichier.endsWith('.pdf')) {
      setError('Nom de fichier invalide ou non PDF');
      return;
    }

    console.log('Envoi de la requête pour analyser le CV:', nomFichier);
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
    console.error('Erreur lors de l\'analyse du CV:', err.response?.data || err);
    const errorMessage = err.response?.data?.message || 'Erreur lors de l\'analyse du CV. Vérifiez que le fichier existe.';
    setError(errorMessage);
    setAnalysisResult({ error: errorMessage });
  } finally {
    setAnalysisLoading(false);
  }
};

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalysisResult(null);
    setError('');
  };

  // Rest of the component remains unchanged...
  // Include the JSX return statement from your original CandidatsListe.js
  return (
    <div>
      <div className="d-flex " style={{ marginLeft: '240px' }}>
        <div className="container-fluid py-4" style={{ marginLeft: '10px' }}>
          <div className="row mt-4">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                  <h6>Liste des Candidats à la recherche d'emploi</h6>
                  <div className="input-group w-25">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par spécialité..."
                      value={searchSpecialite}
                      onChange={handleSearchChange}
                    />
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
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">CV</th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              Chargement des candidats...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="6" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              Aucun candidat trouvé
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
                                {candidate.cv && candidate.cv.nomFichier ? (
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => handleDownloadCV(candidate.cv.nomFichier)}
                                    title="Télécharger CV"
                                  >
                                    <i className="fas fa-file-pdf text-danger fa-lg"></i>
                                  </button>
                                ) : (
                                  <p className="text-xs text-secondary mb-0">{candidate.cv ? "CV non disponible" : "Aucun CV"}</p>
                                )}
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Voir détails"
                                  onClick={() => handleShowModal(candidate)}
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

      {/* Modal for CV Analysis Results */}
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

export default CandidatsListe;