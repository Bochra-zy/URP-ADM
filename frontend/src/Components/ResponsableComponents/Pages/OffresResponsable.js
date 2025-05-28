import React, { useState, useEffect } from "react";
import axios from 'axios';
const baseURL = process.env.REACT_APP_API_URL;

function OffresResponsable() {
    const [offres, setOffres] = useState([]);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDemandesModal, setShowDemandesModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [selectedOffre, setSelectedOffre] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [interviewDecision, setInterviewDecision] = useState({}); // État pour suivre la décision d'interview
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [formData, setFormData] = useState({
        titre: "",
        description: "",
        typeContrat: "CDI",
        salaire: "",
        statut: "active",
    });
    const [formError, setFormError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingDemandes, setLoadingDemandes] = useState({});

    // Récupérer les offres
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Vous devez être connecté en tant que responsable pour voir les offres");
            return;
        }

        fetch(`${baseURL}/offres/offRes`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(`Erreur ${response.status}: ${errorData.message || "Erreur inconnue"}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log("Offres reçues :", data);
                setOffres(data);
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération des offres :", error);
                setError(error.message);
            });
    }, []);

    // Récupérer les demandes pour une offre spécifique et vérifier les décisions d'interview
   const fetchDemandes = async (offreId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${baseURL}/demandes/offre/${offreId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    const data = await response.json();
    console.log("Demandes reçues :", data);

    data.forEach((demande) => {
      console.log(`Demande ${demande._id}:`, {
        statut: demande.statut || 'undefined',
        cvNomFichier: demande.cvNomFichier || 'missing',
        candidat: demande.candidat,
        allFields: Object.keys(demande),
      });
    });

    const decisionChecks = await Promise.all(
      data.map(async (demande) => {
        try {
          const decisionResponse = await axios.get(
            `${baseURL}/interview/check-rejection/${demande.candidat._id}/${offreId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return { demandeId: demande._id, decision: decisionResponse.data.decision };
        } catch (err) {
          console.error(`Erreur lors de la vérification de la décision pour la demande ${demande._id}:`, err);
          return { demandeId: demande._id, decision: 'none' };
        }
      })
    );

    const decisionMap = decisionChecks.reduce((acc, { demandeId, decision }) => {
      acc[demandeId] = decision;
      return acc;
    }, {});
    setInterviewDecision(decisionMap);

    setDemandes(data);
    setShowDemandesModal(true);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes :", error);
    setError(error.message);
  }
};
    // Télécharger le CV
    const handleDownloadCV = async (nomFichier) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Vous devez être connecté');
                return;
            }

            const response = await axios.get(`${baseURL}/cv/download/${nomFichier}`, {
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
            console.error('Erreur lors du téléchargement du CV:', err);
            setError(err.response?.data?.message || 'Erreur lors du téléchargement du CV');
        }
    };

    // Analyser le CV
    const handleAnalyzeCV = async (nomFichier) => {
        try {
            setAnalysisLoading(true);
            setShowAnalysisModal(true);
            setAnalysisResult(null);
            setAnalysisError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setAnalysisError('Vous devez être connecté');
                return;
            }

            const aiResponse = await axios.post(
                `${baseURL}/cv/analyze`,
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
            console.error('Erreur lors de l\'analyse du CV:', err);
            setAnalysisError(err.response?.data?.error || 'Erreur lors de l\'analyse du CV');
            setAnalysisResult({ error: err.response?.data?.error || 'Erreur lors de l\'analyse du CV' });
        } finally {
            setAnalysisLoading(false);
        }
    };

    // Mettre à jour le statut d'une demande
    const handleUpdateDemandeStatut = async (demandeId, newStatut) => {
        if (!window.confirm(`Voulez-vous vraiment ${newStatut === 'acceptée' ? 'accepter' : 'rejeter'} cette candidature ?`)) {
            return;
        }

        setLoadingDemandes((prev) => ({ ...prev, [demandeId]: true }));
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            console.log(`Envoi de la requête PATCH pour demande ${demandeId} avec statut ${newStatut}`);

            const response = await axios.patch(
                `${baseURL}/demandes/${demandeId}/statut`,
                { statut: newStatut },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Réponse du serveur:', response.data);

            setDemandes((prevDemandes) =>
                prevDemandes.map((demande) => {
                    if (demande._id === demandeId) {
                        console.log(`Mise à jour du statut de la demande ${demandeId} à ${newStatut}`);
                        return { ...demande, statut: newStatut };
                    }
                    return demande;
                })
            );

            // Re-vérifier les décisions après mise à jour du statut
            await fetchDemandes(selectedOffre._id);
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut de la demande:', err);
            const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du statut de la demande';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoadingDemandes((prev) => ({ ...prev, [demandeId]: false }));
        }
    };

    const handleCloseAnalysisModal = () => {
        setShowAnalysisModal(false);
        setAnalysisResult(null);
        setAnalysisError('');
    };

    // Gérer l'ouverture/fermeture des modals
    const handleShowAddModal = () => setShowAddModal(true);
    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setFormError(null);
        setFormData({
            titre: "",
            description: "",
            typeContrat: "CDI",
            salaire: "",
            statut: "active",
        });
    };

    const handleShowEditModal = (offre) => {
        setSelectedOffre(offre);
        setFormData({
            titre: offre.titre,
            description: offre.description,
            typeContrat: offre.typeContrat,
            salaire: offre.salaire || "",
            statut: offre.statut,
        });
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedOffre(null);
        setFormError(null);
        setFormData({
            titre: "",
            description: "",
            typeContrat: "CDI",
            salaire: "",
            statut: "active",
        });
    };

    const handleCloseDemandesModal = () => {
        setShowDemandesModal(false);
        setDemandes([]);
        setInterviewDecision({}); // Réinitialiser les décisions
        setError(null);
    };

    // Gérer les changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Gérer le changement dans le champ de recherche
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filtrer et trier les offres
    const filteredOffres = offres
        .filter((offre) => {
            const searchLower = searchTerm.toLowerCase();
            const titreMatch = offre.titre.toLowerCase().includes(searchLower);
            const descriptionMatch = offre.description.toLowerCase().includes(searchLower);
            const dateMatch = new Date(offre.dateCreation).toLocaleDateString().includes(searchLower);
            return titreMatch || descriptionMatch || dateMatch;
        })
        .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    // Soumettre le formulaire d'ajout
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!formData.titre.trim() || !formData.description.trim()) {
            setFormError("Le titre et la description sont requis");
            return;
        }

        try {
            const response = await fetch(`${baseURL}/offres/ajoutoffre`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de l'ajout de l'offre");
            }

            const newOffre = await response.json();
            setOffres([...offres, newOffre.offre]);
            handleCloseAddModal();
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'offre :", error);
            setFormError(error.message);
        }
    };

    // Soumettre le formulaire de modification
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!formData.titre.trim() || !formData.description.trim()) {
            setFormError("Le titre et la description sont requis");
            return;
        }

        try {
            const response = await fetch(`${baseURL}/offres/${selectedOffre._id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la mise à jour de l'offre");
            }

            const updatedOffre = await response.json();
            setOffres(offres.map((o) => (o._id === selectedOffre._id ? updatedOffre.offre : o)));
            handleCloseEditModal();
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'offre :", error);
            setFormError(error.message);
        }
    };

    // Changer le statut de l'offre
    const handleChangeStatut = async (offreId, currentStatut) => {
        const token = localStorage.getItem("token");
        const statuts = ["active", "inactif", "clôturé"];
        const nextStatutIndex = (statuts.indexOf(currentStatut) + 1) % statuts.length;
        const nextStatut = statuts[nextStatutIndex];

        try {
            const response = await fetch(`${baseURL}/offres/${offreId}/statut`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ statut: nextStatut }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors du changement de statut");
            }

            const updatedOffre = await response.json();
            setOffres(offres.map((o) => (o._id === offreId ? updatedOffre.offre : o)));
        } catch (error) {
            console.error("Erreur lors du changement de statut :", error);
            setError(error.message);
        }
    };

    // Supprimer une offre
    const handleDeleteOffre = async (offreId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette offre ?")) {
            return;
        }

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${baseURL}/offres/${offreId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                let errorMessage = "Erreur inconnue";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Erreur ${response.status}`;
                } catch (jsonError) {
                    errorMessage = `Erreur ${response.status}: Réponse non-JSON reçue`;
                }
                throw new Error(errorMessage);
            }

            setOffres(offres.filter((o) => o._id !== offreId));
        } catch (error) {
            console.error("Erreur lors de la suppression de l'offre :", error);
            setError(error.message);
        }
    };

    return (
        <div className="container-fluid px-4 mt-4">
            <div className="h-100 mb-4" style={{ marginLeft: "240px" }}>
                <div className="card h-100 mb-4">
                    <div className="card-header pb-0 px-3">
                        <div className="row align-items-center">
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="fas fa-search" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Rechercher par titre, description ou date"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                            </div>
                            <div className="col-md-8 d-flex justify-content-end align-items-center">
                                <i
                                    className="fas fa-plus-circle text-success fs-5 cursor-pointer me-3"
                                    title="Ajouter une offre"
                                    style={{ cursor: "pointer" }}
                                    onClick={handleShowAddModal}
                                />
                                <i className="far fa-calendar-alt me-2" />
                                <small>{new Date().toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                    <div className="card-body pt-4 p-3">
                        {error ? (
                            <p className="text-danger">{error}</p>
                        ) : filteredOffres.length > 0 ? (
                            <>
                                <h6 className="text-uppercase text-body text-xs font-weight-bolder mb-3">Offres Récentes</h6>
                                <ul className="list-group">
                                    {filteredOffres.map((offre) => (
                                        <li
                                            key={offre._id}
                                            className="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
                                        >
                                            <div className="d-flex flex-column">
                                                <div className="d-flex align-items-center">
                                                    <button
                                                        className={`btn btn-icon-only btn-rounded btn-outline-${offre.statut === "active" ? "success" : "dark"
                                                            } mb-0 me-3 btn-sm d-flex align-items-center justify-content-center`}
                                                    >
                                                        <i className={`fas fa-${offre.statut === "active" ? "arrow-up" : "exclamation"}`} />
                                                    </button>
                                                    <h6 className="mb-0 text-dark text-sm">{offre.titre}</h6>
                                                </div>
                                                <span className="text-xs mt-2">
                                                    {offre.description} , Créée le:{" "}
                                                    {new Date(offre.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center text-sm font-weight-bold">
                                                <span
                                                    className={`${offre.statut === "active" ? "text-success text-gradient" : "text-dark"
                                                        } cursor-pointer me-2`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleChangeStatut(offre._id, offre.statut)}
                                                >
                                                    {offre.statut === "active" ? "Active" : offre.statut}
                                                </span>
                                                <i
                                                    className="fas fa-eye text-primary cursor-pointer me-2"
                                                    title="Voir/Modifier l'offre"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleShowEditModal(offre)}
                                                />
                                                <i
                                                    className="fas fa-users text-info cursor-pointer me-2"
                                                    title="Voir les candidatures"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        setSelectedOffre(offre);
                                                        fetchDemandes(offre._id);
                                                    }}
                                                />
                                                <i
                                                    className="fas fa-trash text-danger cursor-pointer"
                                                    title="Supprimer l'offre"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleDeleteOffre(offre._id)}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p>Aucune offre trouvée pour la recherche </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal pour ajouter une offre */}
            <div className={`modal fade ${showAddModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showAddModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Ajouter une nouvelle offre</h5>
                            <button type="button" className="btn-close" onClick={handleCloseAddModal}></button>
                        </div>
                        <div className="modal-body">
                            {formError && <p className="text-danger">{formError}</p>}
                            <form onSubmit={handleAddSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="titre" className="form-label">Titre</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="titre"
                                        name="titre"
                                        value={formData.titre}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="typeContrat" className="form-label">Type de contrat</label>
                                    <select
                                        className="form-control"
                                        id="typeContrat"
                                        name="typeContrat"
                                        value={formData.typeContrat}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                        <option value="Stage">Stage</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Alternance">Alternance</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="salaire" className="form-label">Salaire (optionnel)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="salaire"
                                        name="salaire"
                                        value={formData.salaire}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="statut" className="form-label">Statut</label>
                                    <select
                                        className="form-control"
                                        id="statut"
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactif">Inactif</option>
                                        <option value="clôturé">Clôturé</option>
                                    </select>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal pour modifier une offre */}
            <div className={`modal fade ${showEditModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showEditModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Détails et modification de l'offre</h5>
                            <button type="button" className="btn-close" onClick={handleCloseEditModal}></button>
                        </div>
                        <div className="modal-body">
                            {formError && <p className="text-danger">{formError}</p>}
                            {selectedOffre && (
                                <form onSubmit={handleEditSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="titre" className="form-label">Titre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="titre"
                                            name="titre"
                                            value={formData.titre}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="typeContrat" className="form-label">Type de contrat</label>
                                        <select
                                            className="form-control"
                                            id="typeContrat"
                                            name="typeContrat"
                                            value={formData.typeContrat}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="Stage">Stage</option>
                                            <option value="Freelance">Freelance</option>
                                            <option value="Alternance">Alternance</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="salaire" className="form-label">Salaire (optionnel)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="salaire"
                                            name="salaire"
                                            value={formData.salaire}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>
                                            Annuler
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Modifier
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal pour afficher les candidatures */}
           <div className={`modal fade ${showDemandesModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showDemandesModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
  <div className="modal-dialog modal-lg">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Candidatures pour l'offre : {selectedOffre?.titre || "Inconnue"}</h5>
        <button type="button" className="btn-close" onClick={handleCloseDemandesModal}></button>
      </div>
      <div className="modal-body">
        {error ? (
          <p className="text-danger">{error}</p>
        ) : demandes.length > 0 ? (
          <ul className="list-group">
            {demandes.map((demande) => (
              <li key={demande._id} className="list-group-item">
                <p>
                  <strong>Candidat :</strong>{" "}
                  {demande.candidat ? `${demande.candidat.prenom} ${demande.candidat.nom} (${demande.candidat.email})` : "Candidat introuvable"}<br />
                  <strong>Statut :</strong> {demande.statut || 'Non défini'}<br />
                  {interviewDecision[demande._id] === 'accepted' && (
                    <strong className="text-success">Interview acceptée</strong>
                  )}
                  {interviewDecision[demande._id] === 'rejected' && (
                    <strong className="text-danger">Interview refusée</strong>
                  )}<br />
                  <strong>CV :</strong>{" "}
                  {demande.cvNomFichier ? (
                    <span>
                      <button
                        className="btn btn-link p-0 text-primary"
                        onClick={() => handleDownloadCV(demande.cvNomFichier)}
                        title="Télécharger CV"
                      >
                        <i className="fas fa-file-pdf text-danger fa-lg"></i>
                      </button>
                      <button
                        className="btn btn-link p-0 mx-2 text-info"
                        onClick={() => handleAnalyzeCV(demande.cvNomFichier)}
                        title="Analyser CV"
                      >
                        <i className="fas fa-brain"></i>
                      </button>
                    </span>
                  ) : (
                    "CV introuvable"
                  )}<br />
                  <strong>Date :</strong> {new Date(demande.dateDemande).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleUpdateDemandeStatut(demande._id, 'acceptée')}
                    disabled={
                      demande.statut !== 'en attente' ||
                      loadingDemandes[demande._id] ||
                      interviewDecision[demande._id] === 'accepted' ||
                      interviewDecision[demande._id] === 'rejected'
                    }
                    title={
                      interviewDecision[demande._id] === 'accepted'
                        ? "Candidature déjà acceptée après interview"
                        : interviewDecision[demande._id] === 'rejected'
                        ? "Candidature refusée après interview"
                        : ""
                    }
                  >
                    {loadingDemandes[demande._id] && demande.statut === 'en attente' ? 'Chargement...' : 'Accepter'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleUpdateDemandeStatut(demande._id, 'rejetée')}
                    disabled={
                      demande.statut !== 'en attente' ||
                      loadingDemandes[demande._id] ||
                      interviewDecision[demande._id] === 'accepted' ||
                      interviewDecision[demande._id] === 'rejected'
                    }
                    title={
                      interviewDecision[demande._id] === 'accepted'
                        ? "Candidature déjà acceptée après interview"
                        : interviewDecision[demande._id] === 'rejected'
                        ? "Candidature refusée après interview"
                        : ""
                    }
                  >
                    {loadingDemandes[demande._id] && demande.statut === 'en attente' ? 'Chargement...' : 'Rejeter'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune candidature pour cette offre.</p>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={handleCloseDemandesModal}>
          Fermer
        </button>
      </div>
    </div>
  </div>
</div>

            {/* Modal pour les résultats de l'analyse du CV */}
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
                                        <p><strong>Domaine :</strong> {analysisResult.domain || 'Non spécifié'}</p>
                                        <p><strong>Compétences Techniques :</strong> {analysisResult.hardSkills?.join(', ') || 'Aucune'}</p>
                                        <p><strong>Compétences Douces :</strong> {analysisResult.softSkills?.join(', ') || 'Aucune'}</p>
                                        <p><strong>Langues :</strong> {analysisResult.languages?.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') || 'Aucune'}</p>
                                        <p><strong>Expérience :</strong> {analysisResult.experience?.map(exp => `${exp.jobTitle}: ${exp.duration}`).join('; ') || 'Non spécifiée'}</p>
                                        <p><strong>Niveau d'Éducation :</strong> {analysisResult.education?.level || 'Non spécifié'} {analysisResult.education?.field && analysisResult.education.field !== 'Non spécifié' ? `en ${analysisResult.education.field}` : ''}</p>
                                        <p><strong>Localisation :</strong> {analysisResult.location || 'Non spécifiée'}</p>
                                    </div>
                                )
                            ) : (
                                <p>Aucune analyse disponible.</p>
                            )}
                            {analysisError && <p className="text-danger">{analysisError}</p>}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseAnalysisModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OffresResponsable;