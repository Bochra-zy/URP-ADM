import React, { useState, useEffect, useCallback } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

function DashboardCandidat() {
  const [demandes, setDemandes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
const baseURL = process.env.REACT_APP_API_URL;

  // Couleur et icône selon le statut de la demande
  const getStatusStyle = (statut) => {
  switch (statut) {
    case 'acceptée':
      return { backgroundColor: '#ecfdf5', icon: 'fas fa-check', iconColor: '#10b981' };
    case 'rejetée':
      return { backgroundColor: '#fee2e2', icon: 'fas fa-times', iconColor: '#ef4444' };
    case 'en attente':
    default:
      return { backgroundColor: '#f3f4f6', icon: 'fas fa-hourglass-half', iconColor: '#6b7280' };
  }
};

  // Styles intégrés directement dans le composant
  const styles = {
    calendarContainer: {
      maxWidth: '400px',
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
    console.log('Token:', token);
    if (!token) {
      setError("Veuillez vous connecter.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les demandes du candidat
        const demandesResponse = await axios.get(`${baseURL}/demandes/candidat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Demandes response:', demandesResponse.data);
        setDemandes(demandesResponse.data || []);

        // Récupérer les interviews du candidat
        const interviewsResponse = await axios.get(`${baseURL}/interview/candidat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Interviews response:', interviewsResponse.data);
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
              title: `Entretien: ${interview.offre.titre || 'Offre inconnue'}`,
              start,
              end,
              statut: interview.statut || 'planifié',
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
        console.error("Fetch error:", error.response?.data, error);
        setError(error.response?.data?.message || "Erreur lors de la récupération des données");
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
      alert(`Entretiens ce jour :\n${dayInterviews.map((i) => `${i.title} - ${format(i.start, 'HH:mm', { locale: fr })} (${i.statut})`).join('\n')}`);
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px',marginLeft:'250px' }}>
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

      {/* Erreur */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Section Mes demandes */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Mes demandes ({demandes.length})
        </h2>
        {demandes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {demandes.map((demande) => {
              const statusStyle = getStatusStyle(demande.statut);
              return (
                <div
                  key={demande._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: statusStyle.backgroundColor,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        backgroundColor: statusStyle.iconColor,
                        color: '#fff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className={statusStyle.icon}></i>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937' }}>
                        {demande.offre?.titre || "Offre inconnue"}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#4b5563' }}>
                        Statut: {demande.statut || "Inconnu"}
                      </p>
                      <p style={{ fontSize: '14px', color: '#4b5563' }}>
                        Date de candidature: {demande.createdAt ? format(new Date(demande.createdAt), 'dd/MM/yyyy', { locale: fr }) : 'Non disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#4b5563' }}>Vous n'avez soumis aucune demande.</p>
        )}
      </div>

      {/* Section Calendrier des interviews */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Mes interviews planifiées
        </h2>
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

      {/* Section Liste des interviews */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Détails des interviews ({interviews.length})
        </h2>
        {interviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {interviews.map((interview) => (
              <div
                key={interview.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: interview.statut === 'terminé' ? '#ecfdf5' : interview.statut === 'annulé' ? '#fee2e2' : '#f3f4f6',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      backgroundColor: interview.statut === 'terminé' ? '#10b981' : interview.statut === 'annulé' ? '#ef4444' : '#6b7280',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className={interview.statut === 'terminé' ? 'fas fa-check' : interview.statut === 'annulé' ? 'fas fa-times' : 'fas fa-calendar'}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937' }}>
                      {interview.offer?.titre || "Offre inconnue"}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>
                      Date: {format(interview.start, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>
                      Durée: {interview.dure} minutes
                    </p>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>
                      Lien de réunion: {interview.meetingLink ? (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                          {interview.meetingLink}
                        </a>
                      ) : (
                        'Aucun lien fourni'
                      )}
                    </p>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>
                      Statut: {interview.statut || "Inconnu"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#4b5563' }}>Aucune interview planifiée.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardCandidat;