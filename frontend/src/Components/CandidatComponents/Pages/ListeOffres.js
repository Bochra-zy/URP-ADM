import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ListeOffres() {
  const [offres, setOffres] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour consulter les offres.');
      navigate('/signincandidat');
      return;
    }

    const fetchOffres = async () => {
      try {
        setLoading(true);
        console.log('Récupération des offres et demandes...');

        // Récupérer les offres et les demandes en parallèle
        const [offresResponse, demandeResponse] = await Promise.all([
          axios.get(`${baseURL}/offres/candidat`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${baseURL}/demandes/candidat`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log('Offres reçues:', offresResponse.data);
        console.log('Demandes reçues:', demandeResponse.data);

        // Gérer différentes structures possibles pour les demandes
        let demandes = [];
        if (Array.isArray(demandeResponse.data)) {
          demandes = demandeResponse.data; // Cas où l'API retourne directement un tableau
        } else if (demandeResponse.data && Array.isArray(demandeResponse.data.demandes)) {
          demandes = demandeResponse.data.demandes; // Cas où l'API retourne { demandes: [...] }
        } else {
          console.warn('Structure inattendue pour les demandes:', demandeResponse.data);
          demandes = [];
        }

        // Créer un ensemble des IDs des offres postulées
        const appliedOfferIds = new Set(
          demandes
            .filter((demande) => demande.offre?._id) // S'assurer que offre._id existe
            .map((demande) => demande.offre._id.toString())
        );
        console.log('Offres postulées (IDs):', Array.from(appliedOfferIds));

        // Ajouter hasApplied à chaque offre
        const offresWithStatus = offresResponse.data.map((offre) => {
          const hasApplied = appliedOfferIds.has(offre._id.toString());
          console.log(`Offre ${offre._id} - Titre: ${offre.titre} - hasApplied: ${hasApplied}`);
          return { ...offre, hasApplied };
        });

        setOffres(offresWithStatus);
        setError('');
      } catch (err) {
        console.error('Erreur complète:', err);
        if (err.response) {
          console.error('Détails de l\'erreur HTTP:', err.response.status, err.response.data);
          if (err.response.status === 401) {
            setError('Session expirée. Veuillez vous reconnecter.');
            localStorage.removeItem('token');
            navigate('/signincandidat');
          } else {
            setError(err.response.data?.message || 'Erreur lors de la récupération des offres');
          }
        } else if (err.request) {
          console.error('Aucune réponse du serveur:', err.request);
          setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.');
        } else {
          console.error('Erreur de configuration:', err.message);
          setError(err.message || 'Une erreur inattendue s\'est produite.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOffres();
  }, [navigate]);

  const handleApply = async (offreId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour postuler.');
      navigate('/signincandidat');
      return;
    }

    try {
      console.log(`Soumission de la candidature pour l'offre ${offreId}`);
      const response = await axios.post(
        `${baseURL}/demandes`,
        { offreId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Candidature soumise:', response.data);
      setSuccessMessage('Candidature soumise avec succès.');
      setError('');
      setOffres((prevOffres) =>
        prevOffres.map((offre) =>
          offre._id === offreId ? { ...offre, hasApplied: true } : offre
        )
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors de la soumission de la candidature:', err);
      if (err.response) {
        console.error('Détails de l\'erreur HTTP:', err.response.status, err.response.data);
        if (err.response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          navigate('/signincandidat');
        } else {
          setError(err.response.data?.message || 'Erreur lors de la soumission de la candidature');
        }
      } else if (err.request) {
        setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.');
      } else {
        setError(err.message || 'Une erreur inattendue s\'est produite.');
      }
    }
  };

  return (
    <div className="container mt-5" style={{ marginLeft: '260px', width: '1270px' }}>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Liste des offres d'emploi</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-danger">{error}</div>}
              {successMessage && <div className="alert alert-success">{successMessage}</div>}
              {offres.length === 0 && !error && (
                <p className="text-muted">Aucune offre active pour le moment.</p>
              )}
              <div className="row">
                {offres.map((offre) => (
                  <div key={offre._id} className="col-md-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">{offre.titre}</h6>
                        <p className="card-text">
                          <strong>Entreprise :</strong> {offre.responsable?.nom_entreprise || 'Non spécifiée'}<br />
                          <strong>Localisation :</strong> {offre.responsable?.adresse_entreprise || 'Non spécifiée'}<br />
                          <strong>Type de contrat :</strong> {offre.typeContrat}<br />
                          <strong>Salaire :</strong> {offre.salaire ? `${offre.salaire} TND` : 'Non spécifié'}<br />
                          <strong>Description :</strong> {offre.description}
                        </p>
                      </div>
                      <div className="card-footer">
                        <button
                          className={`btn btn-sm ${offre.hasApplied ? 'btn-secondary disabled' : 'btn-primary'}`}
                          onClick={() => handleApply(offre._id)}
                          disabled={offre.hasApplied}
                          title={offre.hasApplied ? 'Vous avez déjà postulé à cette offre' : 'Postuler à cette offre'}
                        >
                          <i className={`fas ${offre.hasApplied ? 'fa-check' : 'fa-envelope'} me-1`}></i>
                          {offre.hasApplied ? 'Candidature postulé' : 'Postuler'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListeOffres;