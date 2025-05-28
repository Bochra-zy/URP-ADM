import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ConsulterDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

  const fetchDemandes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        navigate('/signin');
        return;
      }

      const response = await axios.get(`${baseURL}/demandes/candidat`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Réponse de l\'API:', response.data); // Pour débogage

      // S'assurer que response.data est un tableau
      const demandesData = Array.isArray(response.data)
        ? response.data
        : response.data.demandes || [];

      setDemandes(demandesData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des demandes:', err.response?.data || err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des demandes');
      setLoading(false);
      if (err.response?.status === 401) {
        navigate('/signin');
      }
    }
  };

  const handleViewDetails = (demande) => {
    console.log('Demande sélectionnée:', demande); // Pour débogage
    setSelectedDemande(demande);
    setShowModal(true);
  };

  const handleDeleteDemande = async (demandeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${baseURL}/demandes/${demandeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDemandes(demandes.filter((demande) => demande._id !== demandeId));
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de la demande:', err.response?.data || err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de la demande');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDemande(null);
    setError(null);
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <div>
      <div className="d-flex" style={{marginLeft:'250px'}}>
        <div className="container-fluid py-4" style={{ marginLeft: '5px' }}>
          <div className="row mt-4">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0">
                  <h6>Mes Demandes</h6>
                </div>
                <div className="card-body px-0 pt-0 pb-2">
                  <div className="table-responsive p-0">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                            Titre de l'Offre
                          </th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                            Type de Contrat
                          </th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                            Statut
                          </th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                            Date de Dépôt
                          </th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Chargement des demandes...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="5" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : !Array.isArray(demandes) || demandes.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Aucune demande trouvée
                            </td>
                          </tr>
                        ) : (
                          demandes.map((demande) => (
                            <tr key={demande._id}>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {demande.offre?.titre || 'Offre non disponible'}
                                </p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {demande.offre?.typeContrat || '-'}
                                </p>
                              </td>
                              <td>
                                <span
                                  className={`badge badge-sm ${
                                    demande.statut === 'en attente'
                                      ? 'bg-gradient-warning'
                                      : demande.statut === 'acceptée'
                                      ? 'bg-gradient-success'
                                      : 'bg-gradient-danger'
                                  }`}
                                >
                                  {demande.statut}
                                </span>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">
                                  {new Date(demande.dateDemande).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  onClick={() => handleViewDetails(demande)}
                                  title="Voir détails"
                                >
                                  <i className="fa fa-eye" aria-hidden="true"></i>
                                </button>
                                <button
                                  className="btn btn-link text-danger p-0 mx-2"
                                  onClick={() => handleDeleteDemande(demande._id)}
                                  title="Supprimer demande"
                                  disabled={demande.statut !== 'En attente'}
                                  style={{ opacity: demande.statut !== 'En attente' ? 0.5 : 1 }}
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
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

      {selectedDemande && (
  <div
    className={`modal fade ${showModal ? 'show d-block' : ''}`}
    tabIndex="-1"
    style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
  >
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Détails de la Demande</h5>
          <button type="button" className="btn-close" onClick={handleCloseModal}></button>
        </div>
        <div className="modal-body">
          {error && <p className="text-danger">{error}</p>}
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>Titre de l'Offre:</strong>{' '}
                {selectedDemande.offre?.titre || 'Non disponible'}
              </p>
              <p>
                <strong>Type de Contrat:</strong>{' '}
                {selectedDemande.offre?.typeContrat || '-'}
              </p>
              <p>
                <strong>Statut:</strong> {selectedDemande.statut}
              </p>
              <p>
                <strong>Date de Dépôt:</strong>{' '}
                {new Date(selectedDemande.dateDemande).toLocaleDateString()}
              </p>
            </div>
           
          </div>
          {selectedDemande.offre?.entreprise && (
            <div className="mt-3">
              <h6>Entreprise</h6>
              <p>
                <strong>Nom:</strong>{' '}
                {selectedDemande.offre.entreprise?.nom_entreprise || 'Non spécifié'}
              </p>
              <p>
                <strong>Adresse:</strong>{' '}
                {selectedDemande.offre.entreprise?.adresse_entreprise || 'Non spécifié'}
              </p>
              <p>
                <strong>Téléphone:</strong>{' '}
                {selectedDemande.offre.entreprise?.tel || 'Non spécifié'}
              </p>
            </div>
          )}
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

export default ConsulterDemandes;