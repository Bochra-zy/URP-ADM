import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function Responsables() {
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchResponsables = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté");
        navigate("/signin");
        return;
      }
      const response = await axios.get("http://localhost:5000/api/auth/responsables", {
      headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Responsables récupérés:", response.data); 
      // Filtrer les responsable pour s'assurer qu'ils ont le rôle "responsable"
      const validResponsables = response.data.filter(responsable => responsable.role === "responsable");
      setResponsables(validResponsables);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des responsables:", err.response?.data || err);
      setError(err.response?.data?.message || "Erreur lors du chargement des responsables ");
      setLoading(false);
    }
  };

  // Fonction pour supprimer un responsable
  const deleteResponsable = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce responsable ?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Vous devez être connecté");
          navigate("/signin");
          return;
        }
        await axios.delete(`http://localhost:5000/api/auth/responsables/${id}`,{
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchResponsables();

       alert("responsable supprimé avec succès");
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la suppression du responsable");
      }
    }
  };

  useEffect(() => {
    fetchResponsables();
  }, []);
  useEffect(() => {
    if (location.state?.refresh) {
      fetchResponsables();
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
              <h6>Liste des Responsable d'entreprise</h6>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/admin/ajouter-responsable")}
                    title="Ajouter un responsable"
                  >
                    <i className="fa fa-plus me-2"></i>Ajouter
                  </button>
                </div>
                <div className="card-body px-0 pt-0 pb-2">
                  <div className="table-responsive p-0">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Responsable</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Nom entreprise</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Spécialité</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">adresse entreprise</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Tel</th>
                          <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Chargement des responsable...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="5" className="text-center text-danger">
                              {error}
                            </td>
                          </tr>
                        ) : responsables.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center">
                              Aucun responsable trouvé
                            </td>
                          </tr>
                        ) : (
                          responsables.map((responsable) => (
                            <tr key={responsable._id}>
                              <td>
                                <div className="d-flex px-2 py-1">
                                  <div>
                                    <img
                                      src="../assets/img/team-2.jpg"
                                      className="avatar avatar-sm me-3"
                                      alt={`${responsable.nom} ${responsable.prenom}`}
                                    />
                                  </div>
                                  <div className="d-flex flex-column justify-content-center">
                                    <h6 className="mb-0 text-sm">{`${responsable.nom} ${responsable.prenom}`}</h6>
                                    <p className="text-xs text-secondary mb-0">{responsable.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{responsable.nom_entreprise }</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{responsable.specialite}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{responsable.adresse_entreprise}</p>
                              </td>
                              <td>
                                <p className="text-xs font-weight-bold mb-0">{responsable.tel}</p>
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-link text-danger p-0 mx-2"
                                  onClick={() => deleteResponsable(responsable._id)}
                                  title="Supprimer responsable"
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                                <button
                                  className="btn btn-link text-secondary p-0 mx-2"
                                  title="Voir détails"
                                  onClick={() => {
                                    console.log("Navigation vers responsable ID:", responsable._id);
                                    navigate(`/admin/details-responsable/${responsable._id}`);
                                  }}
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
    </div>
  );
}

export default Responsables;