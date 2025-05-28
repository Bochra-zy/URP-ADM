import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OffresAdmin() {
    const [offres, setOffres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
const baseURL = process.env.REACT_APP_API_URL;

    // Fetch all offers
    useEffect(() => {
        const fetchOffres = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Vous devez être connecté en tant qu'admin pour voir les offres");
                setLoading(false);
                navigate("/signin");
                return;
            }

            try {
                const response = await fetch(`${baseURL}/offres`, {
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
                console.log("Offres reçues :", data);
                setOffres(data);
                setLoading(false);
            } catch (error) {
                console.error("Erreur lors de la récupération des offres :", error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchOffres();
    }, [navigate]);

    // Delete an offer
    const deleteOffre = async (offreId) => {
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
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            setOffres(offres.filter((o) => o._id !== offreId));
        } catch (error) {
            console.error("Erreur lors de la suppression de l'offre :", error);
            setError(error.message);
        }
    };

    return (
        <div>
            <div className="d-flex">
                <div className="container-fluid py-6" style={{ marginLeft: "280px" }}>
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                                    <h6>Liste des offres</h6>
                                </div>
                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0">
                                        <table className="table align-items-center mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Titre</th>
                                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Nom de l’entreprise</th>
                                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Adresse de l’entreprise</th>
                                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Type de contrat</th>
                                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Statut</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">
                                                            Chargement des offres...
                                                        </td>
                                                    </tr>
                                                ) : error ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-danger">
                                                            {error}
                                                        </td>
                                                    </tr>
                                                ) : offres.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">
                                                            Aucune offre trouvée
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    offres.map((offre) => (
                                                        <tr key={offre._id}>
                                                            <td>
                                                                <div className="d-flex px-2 py-1">
                                                                    <div className="d-flex flex-column justify-content-center">
                                                                        <h6 className="mb-0 text-sm">{offre.titre}</h6>
                                                                        <p className="text-xs text-secondary mb-0">
                                                                            {offre.description.slice(0, 50)}...
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <p className="text-xs font-weight-bold mb-0">
                                                                    {offre.nom_entreprise || 'Non spécifié'}
                                                                </p>
                                                            </td>
                                                            <td>
                                                                <p className="text-xs text-secondary mb-0">
                                                                    {offre.adresse_entreprise || 'Non spécifié'}
                                                                </p>
                                                            </td>
                                                            <td>
                                                                <p className="text-xs font-weight-bold mb-0">{offre.typeContrat}</p>
                                                            </td>
                                                            <td>
                                                                <p className="text-xs font-weight-bold mb-0">{offre.statut}</p>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <button
                                                                    className={`btn btn-link text-danger p-0 mx-2 ${offre.statut === 'active' ? 'disabled' : ''}`}
                                                                    onClick={() => deleteOffre(offre._id)}
                                                                    disabled={offre.statut === 'active'}
                                                                    title={offre.statut === 'active' ? 'Suppression impossible (offre active)' : 'Supprimer offre'}
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
        </div>
    );
}

export default OffresAdmin;