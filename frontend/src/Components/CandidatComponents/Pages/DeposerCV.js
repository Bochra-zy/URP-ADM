import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DeposerCV() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existingCV, setExistingCV] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour déposer un CV.');
      navigate('/signincandidat');
      return;
    }

    const fetchExistingCV = async () => {
      try {
        const response = await axios.get(`${baseURL}/cv/existing`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setExistingCV(response.data.cv);
      } catch (err) {
        console.error('Error fetching existing CV:', err.response?.data);
        setError(err.response?.data?.message || 'Erreur lors de la vérification du CV existant');
      }
    };

    const fetchAnalyses = async () => {
      try {
        const response = await axios.get(`${baseURL}/cv/analyses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAnalyses(response.data);
      } catch (err) {
        console.error('Error fetching CV analyses:', err.response?.data);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des analyses');
      }
    };

    fetchExistingCV();
    fetchAnalyses();
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Veuillez sélectionner un fichier PDF.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour déposer un CV.');
      navigate('/signincandidat');
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await axios.post(`${baseURL}/cv/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(existingCV ? 'CV remplacé avec succès' : 'CV déposé avec succès');
      setError('');
      setFile(null);
      const refreshCV = await axios.get(`${baseURL}/cv/existing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingCV(refreshCV.data.cv);
      // Rafraîchir les analyses après un nouvel upload
      const refreshAnalyses = await axios.get(`${baseURL}/cv/analyses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyses(refreshAnalyses.data);
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/signincandidat');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du dépôt du CV');
      }
      setMessage('');
    }
  };

  const handleDownload = async (filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour télécharger le CV.');
      navigate('/signincandidat');
      return;
    }

    try {
      const response = await axios.get(`${baseURL}/cv/download/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err.response?.data);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/signincandidat');
      } else {
        setError('Erreur lors du téléchargement du CV');
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce CV ?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour supprimer le CV.');
      navigate('/signincandidat');
      return;
    }

    try {
      await axios.delete(`${baseURL}/cv/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('CV supprimé avec succès');
      setError('');
      setExistingCV(null);
      setAnalyses([]); // Réinitialiser les analyses après suppression
    } catch (err) {
      console.error('Delete error:', err.response?.data);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        navigate('/signincandidat');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la suppression du CV');
      }
      setMessage('');
    }
  };


  return (
    <div className="container mt-4" style={{ marginLeft: '250px' }}>
      <div className="card" style={{ width: '1250px' }}>
        <div className="card-header">
          <h5 className="card-title">Déposer votre CV</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="cvFile" className="form-label">
                Sélectionner un fichier PDF
              </label>
              <input
                type="file"
                className="form-control"
                id="cvFile"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>
            {existingCV && (
              <div className="mb-3 d-flex align-items-center">
                <p className="mb-0">
                  CV actuel :{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 text-primary"
                    onClick={() => handleDownload(existingCV.nomFichier)}
                  >
                    <i className="fas fa-file-pdf fa-lg"></i>
                  </button>
                </p>
                <button
                  type="button"
                  className="btn btn-link text-danger ms-2"
                  onClick={handleDelete}
                  title="Supprimer le CV"
                >
                  <i className="fas fa-trash text-danger cursor-pointer"></i>
                </button>
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            <button type="submit" className="btn btn-primary">
              Déposer
            </button>
          </form>

          {existingCV && (
            <div className="mt-4">
              <h5 className="card-title" style={{ color: 'black' }}>
                Analyse de votre CV
              </h5>
              {analyses.length === 0 ? (
                <p>Aucune analyse effectuée sur votre CV pour le moment.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Responsable</th>
                        <th>Entreprise</th>
                        <th>Localisation</th>
                        <th>Email</th>
                        <th>Date d'analyse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((analyse) => (
                        <tr key={analyse._id}>
                          <td>
                            {analyse.responsable
                              ? `${analyse.responsable.nom || 'Non spécifié'} ${
                                  analyse.responsable.prenom || ''
                                }`
                              : 'Non spécifié'}
                          </td>
                          <td>{analyse.responsable?.nom_entreprise || 'Non spécifiée'}</td>
                          <td>{analyse.responsable?.adresse_entreprise || 'Non spécifiée'}</td>
                          <td>{analyse.responsable?.email || 'Non spécifiée'}</td>
                          <td>{new Date(analyse.dateAnalyse).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeposerCV;