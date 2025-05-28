import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
const baseURL = process.env.REACT_APP_API_URL;

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'fr-FR': fr },
});

function Interview() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [offres, setOffres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [formData, setFormData] = useState({
    candidatId: '',
    offreId: '',
    date: new Date(),
    dure: 30,
    meetingLink: '',
  });
  const [editFormData, setEditFormData] = useState({
    candidatId: '',
    offreId: '',
    date: new Date(),
    dure: 30,
    meetingLink: '',
    statut: 'planifié',
  });
  const [error, setError] = useState(null);

  // Fonction pour récupérer les données
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }

    try {
      const [interviewsResponse, candidatesResponse, offresResponse] = await Promise.all([
        axios.get(`${baseURL}/interview`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/auth/responsable/candidats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/offres/offRes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const formattedInterviews = interviewsResponse.data
        .map((interview) => {
          const start = new Date(interview.date);
          const end = new Date(start.getTime() + (interview.dure || 30) * 60 * 1000);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn('Invalid interview date:', interview);
            return null;
          }
          return {
            id: interview._id,
            title: `Entretien: ${interview.candidat.prenom} ${interview.candidat.nom} - ${interview.offre.titre}`,
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
      setCandidates(candidatesResponse.data);
      setOffres(offresResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des données');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectSlot = ({ start }) => {
    setFormData({ ...formData, date: start });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedInterview(event);
    setEditFormData({
      candidatId: event.candidate._id,
      offreId: event.offer._id,
      date: event.start,
      dure: event.dure,
      meetingLink: event.meetingLink,
      statut: event.statut,
    });
    setShowDetailModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: name === 'date' ? new Date(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError(null);

    try {
      await axios.post(`${baseURL}/interview`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchData();

      setShowModal(false);
      setFormData({
        candidatId: '',
        offreId: '',
        date: new Date(),
        dure: 30,
        meetingLink: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la planification de l’entretien');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError(null);

    try {
      await axios.put(
        `${baseURL}/interview/${selectedInterview.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchData();

      setShowEditModal(false);
      setShowDetailModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification de l’entretien');
    }
  };

  const handleStatusChange = async (statut) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }
    try {
      await axios.put(
        `${baseURL}/interview/${selectedInterview.id}/status`,
        { status: statut },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleAcceptAsEmployee = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }
    try {
      await axios.put(
        `${baseURL}/interview/${selectedInterview.id}/accept`,
        { decision: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’acceptation du candidat');
    }
  };

  const handleRejectCandidate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }
    try {
      await axios.put(
        `${baseURL}/interview/${selectedInterview.id}/reject`,
        { decision: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du refus du candidat');
    }
  };

  // Personnaliser l'affichage des événements
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor:
        event.statut === 'terminé' ? '#28a745' : event.statut === 'annulé' ? '#dc3545' : '#007bff',
      color: 'white',
      borderRadius: '5px',
      border: 'none',
    };
    return { style };
  };

  // Composant personnalisé pour afficher l'icône "œil"
  const CustomEvent = ({ event }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{event.title}</span>
      <i
        className="fas fa-eye text-primary cursor-pointer me-2"
        onClick={() => handleSelectEvent(event)}
      ></i>
    </div>
  );

  return (
    <div className="container-fluid px-4 mt-4"style={{marginLeft:'250px'}}>
      <h2 style={{marginRight:'240px'}}>Mes entretiens</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="calendar-container" style={{ height: '500px', width: '1250px' }}>
        <Calendar
          localizer={localizer}
          events={interviews}
          startAccessor="start"
          endAccessor="end"
          style={{ margin: '20px' }}
          selectable
          onSelectSlot={handleSelectSlot}
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

      {/* Modal pour planifier un entretien */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Planifier un entretien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Candidat</Form.Label>
              <Form.Select
                name="candidatId"
                value={formData.candidatId}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionner un candidat</option>
                {candidates.map((candidat) => (
                  <option key={candidat._id} value={candidat._id}>
                    {candidat.prenom} {candidat.nom} ({candidat.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Offre</Form.Label>
              <Form.Select
                name="offreId"
                value={formData.offreId}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionner une offre</option>
                {offres.map((offre) => (
                  <option key={offre._id} value={offre._id}>
                    {offre.titre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date"
                value={format(formData.date, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Durée (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="dure"
                value={formData.dure}
                onChange={handleInputChange}
                min="15"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lien de réunion (optionnel)</Form.Label>
              <Form.Control
                type="text"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleInputChange}
                placeholder="Ex: https://zoom.us/j/..."
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Planifier
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal pour afficher les détails de l'entretien */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'entretien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInterview && (
            <div>
              <p>
                <strong>Candidat:</strong> {selectedInterview.candidate.prenom}{' '}
                {selectedInterview.candidate.nom}
              </p>
              <p>
                <strong>Offre:</strong> {selectedInterview.offer.titre}
              </p>
              <p>
                <strong>Date:</strong> {format(selectedInterview.start, 'dd/MM/yyyy HH:mm')}
              </p>
              <p>
                <strong>Durée:</strong> {selectedInterview.dure} minutes
              </p>
              <p>
                <strong>Lien de réunion:</strong>{' '}
                {selectedInterview.meetingLink || 'Aucun lien fourni'}
              </p>
              <p>
                <strong>Statut:</strong> {selectedInterview.statut}
              </p>
              <div>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => handleStatusChange('terminé')}
                  disabled={selectedInterview.statut === 'terminé'}
                >
                  Marquer comme terminé
                </Button>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => setShowEditModal(true)}
                >
                  Modifier
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange('annulé')}
                  disabled={selectedInterview.statut === 'annulé'}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={handleAcceptAsEmployee}
                  disabled={selectedInterview.statut !== 'terminé'}
                >
                  Accepter comme employé
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRejectCandidate}
                  disabled={selectedInterview.statut !== 'terminé'}
                >
                  Rejeter candidat
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour modifier un entretien */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier un entretien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Candidat</Form.Label>
              <Form.Select
                name="candidatId"
                value={editFormData.candidatId}
                onChange={handleEditInputChange}
                required
              >
                <option value="">Sélectionner un candidat</option>
                {candidates.map((candidat) => (
                  <option key={candidat._id} value={candidat._id}>
                    {candidat.prenom} {candidat.nom} ({candidat.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Offre</Form.Label>
              <Form.Select
                name="offreId"
                value={editFormData.offreId}
                onChange={handleEditInputChange}
                required
              >
                <option value="">Sélectionner une offre</option>
                {offres.map((offre) => (
                  <option key={offre._id} value={offre._id}>
                    {offre.titre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date"
                value={format(editFormData.date, "yyyy-MM-dd'T'HH:mm")}
                onChange={handleEditInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Durée (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="dure"
                value={editFormData.dure}
                onChange={handleEditInputChange}
                min="15"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lien de réunion (optionnel)</Form.Label>
              <Form.Control
                type="text"
                name="meetingLink"
                value={editFormData.meetingLink}
                onChange={handleEditInputChange}
                placeholder="Ex: https://zoom.us/j/..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                name="statut"
                value={editFormData.statut}
                onChange={handleEditInputChange}
                required
              >
                <option value="planifié">Planifié</option>
                <option value="terminé">Terminé</option>
                <option value="annulé">Annulé</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Interview;