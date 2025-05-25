import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";

// Configure moment for French locale
import "moment/locale/fr";
moment.locale("fr");
const localizer = momentLocalizer(moment);

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function DashboardAdmin() {
  // État pour les statistiques
  const [stats, setStats] = useState({
    responsables: 0,
    offres: 0,
    candidats: 0,
    demandesAcceptees: 0,
    interviewsAccepted: 0,
    interviewsNotAccepted: 0,
  });

  // État pour les entretiens du calendrier
  const [interviews, setInterviews] = useState([]);
  // État pour les erreurs
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Récupérer les données depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté pour accéder au tableau de bord");
        navigate("/login");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [
          responsablesRes,
          offresRes,
          candidatsRes,
          demandesAccepteesRes,
          interviewsAcceptedRes,
          interviewsNotAcceptedRes,
          interviewsRes,
        ] = await Promise.all([
          axios.get("http://localhost:5000/api/stats/responsables", config),
          axios.get("http://localhost:5000/api/stats/offres", config),
          axios.get("http://localhost:5000/api/stats/candidats", config),
          axios.get("http://localhost:5000/api/stats/demandes-acceptees", config),
          axios.get("http://localhost:5000/api/stats/interviews-accepted", config),
          axios.get("http://localhost:5000/api/stats/interviews-not-accepted", config),
          axios.get("http://localhost:5000/api/stats/interviews", config),
        ]);

        setStats({
          responsables: responsablesRes.data.responsables,
          offres: offresRes.data.offres,
          candidats: candidatsRes.data.candidats,
          demandesAcceptees: demandesAccepteesRes.data.demandesAcceptees,
          interviewsAccepted: interviewsAcceptedRes.data.interviewsAccepted,
          interviewsNotAccepted: interviewsNotAcceptedRes.data.interviewsNotAccepted,
        });

        // Map interviews to calendar events
        const calendarEvents = interviewsRes.data.map((interview) => ({
          title: `${interview.candidat?.prenom || "Inconnu"} ${interview.candidat?.nom || ""} - ${interview.responsable?.nom_entreprise || interview.responsable?.prenom || "Inconnu"}`,
          start: new Date(interview.date),
          end: new Date(new Date(interview.date).getTime() + interview.dure * 60 * 1000),
          allDay: false,
          resource: interview,
        }));
        setInterviews(calendarEvents);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Session expirée ou accès non autorisé. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Erreur lors du chargement des données. Veuillez réessayer.");
        }
      }
    };
    fetchStats();
  }, [navigate]);

  // Données pour le graphique
  const chartData = {
    labels: [
      "Entreprise",
      "Offres",
      "Candidats",
      "Demandes Acceptées",
      "Entretiens Acceptés",
      "Entretiens Non Acceptés",
    ],
    datasets: [
      {
        label: "Statistiques",
        data: [
          stats.responsables,
          stats.offres,
          stats.candidats,
          stats.demandesAcceptees,
          stats.interviewsAccepted,
          stats.interviewsNotAccepted,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(255, 99, 132, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options du graphique
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Statistiques Globales",
      },
    },
  };

  // Style des événements du calendrier
  const eventStyleGetter = (event) => {
    let backgroundColor;
    switch (event.resource.decision) {
      case 'accepted':
        backgroundColor = '#28a745'; // Vert pour accepté
        break;
      case 'rejected':
        backgroundColor = '#dc3545'; // Rouge pour rejeté
        break;
      default:
        backgroundColor = '#3174ad'; // Bleu par défaut pour planifié ou autre
    }
    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '5px',
        border: 'none',
      },
    };
  };

  return (
    <div>
      <div className="d-flex">
        <div className="container-fluid py-6" style={{ marginLeft: "280px" }}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {/* Cartes de statistiques */}
          <div className="row">
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
              <div className="card">
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Entreprise</p>
                        <h5 className="font-weight-bolder">{stats.responsables}</h5>
                        <p className="mb-0">
                          <span className="text-success text-sm font-weight-bolder">+10% </span>
                          depuis hier
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-primary shadow-primary text-center rounded-circle">
                        <i className="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
              <div className="card">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Offres</p>
                        <h5 className="font-weight-bolder">{stats.offres}</h5>
                        <p className="mb-0">
                          <span className="text-success text-sm font-weight-bolder">+5% </span>
                          depuis la semaine dernière
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-danger shadow-danger text-center rounded-circle">
                        <i className="ni ni-world text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
              <div className="card">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Candidats</p>
                        <h5 className="font-weight-bolder">{stats.candidats}</h5>
                        <p className="mb-0">
                          <span className="text-success text-sm font-weight-bolder">+8% </span>
                          depuis la semaine dernière
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-success shadow-success text-center rounded-circle">
                        <i className="ni ni-paper-diploma text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
              <div className="card">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Demandes Acceptées</p>
                        <h5 className="font-weight-bolder">{stats.demandesAcceptees}</h5>
                        <p className="mb-0">
                          <span className="text-success text-sm font-weight-bolder">+3% </span>
                          depuis la semaine dernière
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-warning shadow-warning text-center rounded-circle">
                        <i className="ni ni-check-bold text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4 mt-4" style={{ marginLeft: "20%" }}>
              <div className="card">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Entretiens Acceptés</p>
                        <h5 className="font-weight-bolder">{stats.interviewsAccepted}</h5>
                        <p className="mb-0">
                          <span className="text-success text-sm font-weight-bolder">+2% </span>
                          depuis la semaine dernière
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-info shadow-info text-center rounded-circle">
                        <i className="ni ni-like-2 text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4 mt-4">
              <div className="card">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-8">
                      <div className="numbers">
                        <p className="text-sm mb-0 text-uppercase font-weight-bold">Entretiens Non Acceptés</p>
                        <h5 className="font-weight-bolder">{stats.interviewsNotAccepted}</h5>
                        <p className="mb-0">
                          <span className="text-danger text-sm font-weight-bolder">+1% </span>
                          depuis la semaine dernière
                        </p>
                      </div>
                    </div>
                    <div className="col-4 text-end">
                      <div className="icon icon-shape bg-gradient-secondary shadow-secondary text-center rounded-circle">
                        <i className="ni ni-fat-remove text-lg opacity-10" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique et Calendrier */}
          <div className="row mt-4">
            <div className="col-lg-6 mb-lg-0 mb-4">
              <div className="card z-index-2 h-100">
                <div className="card-header pb-0 pt-3 bg-transparent">
                  <h6 className="text-capitalize">Statistiques Globales</h6>
                </div>
                <div className="card-body p-3">
                  <div className="chart">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-lg-0 mb-4">
              <div className="card z-index-2 h-100">
                <div className="card-header pb-0 pt-3 bg-transparent">
                  <h6 className="text-capitalize">Calendrier des Entretiens</h6>
                </div>
                <div className="card-body p-3">
                  <Calendar
                    localizer={localizer}
                    events={interviews}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 400 }}
                    eventPropGetter={eventStyleGetter}
                    messages={{
                      next: "Suivant",
                      previous: "Précédent",
                      today: "Aujourd'hui",
                      month: "Mois",
                      week: "Semaine",
                      day: "Jour",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;