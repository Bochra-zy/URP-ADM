import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const baseURL = process.env.REACT_APP_API_URL;

function ProfilResponsable() {
  const [responsable, setResponsable] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    nom_entreprise:"",
    adresse_entreprise:"",
    tel:""
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/signinresponsable");
      return;
    }

    const fetchResponsableProfile = async () => {
      try {
        const res = await axios.get(`${baseURL}/auth/responsable/profil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResponsable(res.data);
        setFormData({
          nom: res.data.nom || "",
          prenom: res.data.prenom || "",
          email: res.data.email || "",
          password: "",
          nom_entreprise: res.data.nom_entreprise || "",
          adresse_entreprise: res.data.adresse_entreprise || "",
          tel: res.data.tel || "",
        });
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
        localStorage.removeItem("token");
        navigate("/signinresponsable");
      }
    };

    fetchResponsableProfile();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    const updatedData = {};
    if (formData.nom) updatedData.nom = formData.nom;
    if (formData.prenom) updatedData.prenom = formData.prenom;
    if (formData.email) updatedData.email = formData.email;
    if (formData.password) updatedData.password = formData.password;
    if (formData.nom_entreprise) updatedData.nom_entreprise = formData.nom_entreprise;
    if (formData.adresse_entreprise) updatedData.adresse_entreprise = formData.adresse_entreprise;
    if (formData.tel) updatedData.tel = formData.tel;


    try {
      const res = await axios.put(
        "/api/auth/responsable/profil",
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResponsable(res.data);
      setFormData((prev) => ({
        ...prev,
        password: "", // Réinitialiser le mot de passe après mise à jour
      }));
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error.response?.data || error);
      alert(
        "Erreur lors de la mise à jour : " +
          (error.response?.data?.message || "Vérifiez votre connexion")
      );
    }
  };

  return (
    <div className="g-sidenav-show bg-gray-100" style={{marginLeft:'100px'}}>
      <main className="main-content position-relative border-radius-lg">
        <div
          className="container-fluid py-4"
          style={{ marginLeft: "140px", width: "1286px", marginTop: "-250px" }}
        >
          <div className="card shadow-lg mx-4 card-profile-bottom">
            <div className="card-body p-3">
              <div className="row gx-4">
                <div className="col-auto">
                  <div className="avatar avatar-xl position-relative">
                    <img
                      src={`${process.env.PUBLIC_URL}/assets/img/responsable-des-ressources-humaines.png`}
                      alt="profile"
                      className="w-100 border-radius-lg shadow-sm"
                    />
                  </div>
                </div>
                <div className="col-auto my-auto">
                  <div className="h-100">
                    <h5 className="mb-1">{responsable?.nom || "Nom du responsable"}</h5>
                    <p className="mb-0 font-weight-bold text-sm">{responsable?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid py-4">
            <div className="row" style={{ marginLeft: "0px", width: "1855px" }}>
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header pb-0">
                    <div className="d-flex align-items-center">
                      <p className="mb-0">Editer Profile</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="text-uppercase text-sm"></p>
                    <hr className="horizontal dark" />
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="nom" className="form-control-label">
                            NOM
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="prenom" className="form-control-label">
                            PRENOM
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="email" className="form-control-label">
                            ADRESS EMAIL
                          </label>
                          <input
                            className="form-control"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            MOT DE PASSE
                          </label>
                          <input
                            className="form-control"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Nouveau mot de passe"
                          />
                        </div>
                        </div>
                        <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            Nom entreprise
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="nom_entreprise"
                            value={formData.nom_entreprise}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            Adresse entreprise
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="adresse_entreprise"
                            value={formData.adresse_entreprise}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="password" className="form-control-label">
                            Tel entreprise
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="tel"
                            value={formData.tel}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      </div>
                    <button
                      className="btn btn-primary btn-sm ms-auto"
                      onClick={handleUpdateProfile}
                    >
                      CHANGER
                    </button>
                    <hr className="horizontal dark" />
                  </div>
                </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilResponsable;