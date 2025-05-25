import { Chart } from "chart.js/auto";
import React, { useState, useEffect, useCallback } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

function StatisticsCharts({ stats }) {
  useEffect(() => {
    const ctxDonut = document.getElementById("interviewsChart").getContext("2d");
    const interviewsChart = new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Acceptées", "Rejetées", "En attente"],
        datasets: [
          {
            data: [
              stats.acceptedInterviews,
              stats.rejectedInterviews,
              stats.pendingInterviews,
            ],
            backgroundColor: ["#10B981", "#EF4444", "#6B7280"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top", labels: { font: { size: 10 } } },
          title: { display: true, text: "Statut des Interviews", font: { size: 12 } },
        },
      },
    });

    return () => {
      interviewsChart.destroy();
    };
  }, [stats]);

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "1rem", overflowX: "auto", marginLeft: "20%" }}>
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <canvas id="interviewsChart"></canvas>
      </div>
      <div className="bg-white p-5 rounded-lg shadow-sm min-w-[200px]">
        <h3 className="text-xs font-semibold text-gray-800 mb-1">Statistiques</h3>
        <div className="flex flex-col space-y-0.5 text-[10px] text-gray-600">
          <p><span className="font-medium">Interviews totales:</span> {stats.totalInterviews}</p>
          <p><span className="font-medium">Interviews acceptées:</span> {stats.acceptedInterviews}</p>
          <p><span className="font-medium">Interviews rejetées:</span> {stats.rejectedInterviews}</p>
          <p><span className="font-medium">Interviews en attente:</span> {stats.pendingInterviews}</p>
          <p><span className="font-medium">Taux d'acceptation:</span> {stats.acceptedPercentage}%</p>
          <p><span className="font-medium">Nombre total d'offres:</span> {stats.offres.length}</p>
          <p><span className="font-medium">Candidats ayant postulé:</span> {stats.totalCandidatesApplied}</p>
          <p><span className="font-medium">Candidats acceptés:</span> {stats.acceptedCandidates}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardResponsable() {
  const [stats, setStats] = useState({
    totalInterviews: 0,
    acceptedInterviews: 0,
    rejectedInterviews: 0,
    pendingInterviews: 0,
    acceptedPercentage: 0,
    offres: [],
    demandes: [],
    totalCandidatesApplied: 0,
    acceptedCandidates: 0,
  });
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Styles intégrés directement dans le composant
  const styles = {
    calendarContainer: {
      maxWidth: '300px',
      margin: '0 auto',
    },
    calendar: {
      border: 'none',
      fontSize: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    tile: {
      padding: '8px',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
    },
    todayTile: {
      backgroundColor: '#e0f7fa',
      color: '#000',
    },
    interviewTile: {
      backgroundColor: '#007bff',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '4px',
    },
    interviewTileHover: {
      backgroundColor: '#0056b3',
    },
    activeTile: {
      backgroundColor: '#e0f7fa',
      color: '#000',
    },
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Veuillez vous connecter.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les statistiques
        const statsResponse = await fetch("http://localhost:5000/api/interview/statistiques/responsable", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          throw new Error(`Erreur ${statsResponse.status}: ${errorData.message || "Erreur inconnue"}`);
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Récupérer les interviews planifiées
        const interviewsResponse = await axios.get('http://localhost:5000/api/interview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formattedInterviews = interviewsResponse.data
          .map((interview) => {
            if (!interview.candidat || !interview.offre) {
              console.warn('Missing candidat or offre:', interview);
              return null;
            }
            const start = new Date(interview.date);
            const end = new Date(start.getTime() + (interview.dure || 30) * 60 * 1000);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              console.warn('Invalid interview date:', interview);
              return null;
            }
            return {
              id: interview._id,
              title: `Entretien: ${interview.candidat.prenom || 'Inconnu'} ${interview.candidat.nom || 'Inconnu'} - ${interview.offre.titre || 'Offre inconnue'}`,
              start,
              end,
              statut: interview.statut,
              candidate: interview.candidat,
              offer: interview.offre,
              dure: interview.dure,
              meetingLink: interview.meetingLink,
            };
          })
          .filter((event) => event !== null);
        setInterviews(formattedInterviews);

        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour colorer les jours avec interviews
  const tileClassName = useCallback(
    ({ date, view, activeStartDate }) => {
      if (view === 'month') {
        const dayStr = format(date, 'yyyy-MM-dd');
        const hasInterview = interviews.some(
          (interview) => format(interview.start, 'yyyy-MM-dd') === dayStr
        );
        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const isActive = format(date, 'yyyy-MM-dd') === format(activeStartDate, 'yyyy-MM-dd');

        if (hasInterview) return 'interview-tile';
        if (isToday) return 'today-tile';
        if (isActive) return 'active-tile';
        return 'default-tile';
      }
      return null;
    },
    [interviews]
  );

  // Gestionnaire pour afficher les détails des interviews au clic sur une date
  const handleDayClick = (date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayInterviews = interviews.filter(
      (interview) => format(interview.start, 'yyyy-MM-dd') === dayStr
    );
    if (dayInterviews.length > 0) {
      alert(`Interviews planifiées ce jour :\n${dayInterviews.map((i) => i.title).join('\n')}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '64px', height: '64px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' ,marginLeft:'190px'}}>
      {/* Inline style pour l'animation du spinner et le calendrier */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .default-tile { padding: ${styles.tile.padding}; border-radius: ${styles.tile.borderRadius}; }
          .today-tile { background-color: ${styles.todayTile.backgroundColor}; color: ${styles.todayTile.color}; padding: ${styles.tile.padding}; border-radius: ${styles.tile.borderRadius}; }
          .interview-tile { background-color: ${styles.interviewTile.backgroundColor}; color: ${styles.interviewTile.color}; font-weight: ${styles.interviewTile.fontWeight}; padding: ${styles.tile.padding}; border-radius: ${styles.tile.borderRadius}; }
          .interview-tile:hover { background-color: ${styles.interviewTileHover.backgroundColor}; }
          .active-tile { background-color: ${styles.activeTile.backgroundColor}; color: ${styles.activeTile.color}; padding: ${styles.tile.padding}; border-radius: ${styles.tile.borderRadius}; }
        `}
      </style>

      {/* Statistiques avec Chart.js */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Statistiques</h2>
        <StatisticsCharts stats={stats} />
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Section Calendrier des interviews planifiées */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px',marginLeft:'100px' ,width:'500px'}}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Interviews planifiées</h2>
        <div style={styles.calendarContainer}>
          <Calendar
            value={new Date()}
            tileClassName={tileClassName}
            locale="fr-FR"
            onClickDay={handleDayClick}
            style={styles.calendar}
          />
        </div>
      </div>

     
    </div>
  );
}

export default DashboardResponsable;