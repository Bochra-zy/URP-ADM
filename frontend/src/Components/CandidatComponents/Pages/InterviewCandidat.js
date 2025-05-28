import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'fr-FR': fr },
});

function CandidateInterview() {
  const [interviews, setInterviews] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [error, setError] = useState(null);
const baseURL = process.env.REACT_APP_API_URL;

  // Fetch interviews for the logged-in candidate
  const fetchInterviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }

    try {
      const response = await axios.get(`${baseURL}/interview/candidat`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedInterviews = response.data
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
            title: `Entretien: ${interview.offre.titre}`,
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
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des entretiens');
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Handle clicking an interview to show details
  const handleSelectEvent = (event) => {
    setSelectedInterview(event);
    setShowDetailModal(true);
  };

  // Customize event appearance
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor:
        event.statut === 'terminé' ? '#28a745' :
        event.statut === 'annulé' ? '#dc3545' : '#007bff',
      color: 'white',
      borderRadius: '5px',
      border: 'none',
    };
    return { style };
  };

  // Custom event component with eye icon
  const CustomEvent = ({ event }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{event.title}</span>
      <i
        className="fas fa-eye text-white cursor-pointer me-2"
        onClick={() => handleSelectEvent(event)}
      ></i>
    </div>
  );

  return (
    <div className="container-fluid px-4 mt-4"style={{marginLeft:'230px'}}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' ,marginRight:'240px'}}> 
        Mes Entretiens
      </h2>
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}
      <div className="calendar-container" style={{  height: '500px', width: '1250px' }}>
        <Calendar
          localizer={localizer}
          events={interviews}
          startAccessor="start"
          endAccessor="end"
          style={{ margin: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEvent }}
          messages={{
            today: 'Aujourd’hui',
            previous: 'Précédent',
            next: 'Suivant',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
          }}
          defaultView="week"
          views={['month', 'week', 'day', 'agenda']}
          step={30}
          timeslots={2}
        />
      </div>

      {/* Modal for viewing interview details */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'entretien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInterview && (
            <div style={{ fontSize: '14px', color: '#1f2937' }}>
              <p>
                <strong>Offre:</strong> {selectedInterview.offer.titre}
              </p>
              <p>
                <strong>Date:</strong> {format(selectedInterview.start, 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
              <p>
                <strong>Durée:</strong> {selectedInterview.dure} minutes
              </p>
              <p>
                <strong>Lien de réunion:</strong>{' '}
                {selectedInterview.meetingLink ? (
                  <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer">
                    {selectedInterview.meetingLink}
                  </a>
                ) : (
                  'Aucun lien fourni'
                )}
              </p>
              <p>
                <strong>Statut:</strong> {selectedInterview.statut}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CandidateInterview;