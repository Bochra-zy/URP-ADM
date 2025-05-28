import React, { useState, useEffect } from 'react';
     import axios from 'axios';
     import { useNavigate, useParams } from 'react-router-dom';
const baseURL = process.env.REACT_APP_API_URL;

     const AnalyseCV = () => {
       const [analysis, setAnalysis] = useState({});
       const [error, setError] = useState('');
       const [nomFichier, setFilename] = useState('');
       const navigate = useNavigate();
       const { filename } = useParams();

       useEffect(() => {
         const token = localStorage.getItem('token');
         if (!token) {
           setError('Veuillez vous connecter en tant que responsable.');
           navigate('/signinresponsable');
           return;
         }

         const fetchAnalysis = async () => {
           try {
             const response = await axios.post(
               `${baseURL}/api/cv/analyze`,
               { nomFichier: filename },
               {
                 headers: { Authorization: `Bearer ${token}` },
               }
             );
             setAnalysis(response.data);
             setFilename(filename);
           } catch (err) {
             console.error('Error analyzing CV:', err.response?.data);
             if (err.response?.status === 401 || err.response?.status === 403) {
               setError('Session expirée ou accès non autorisé. Veuillez vous reconnecter.');
               localStorage.removeItem('token');
               navigate('/signinresponsable');
             } else {
               setError(err.response?.data?.error || 'Erreur lors de l\'analyse du CV');
             }
           }
         };

         fetchAnalysis();
       }, [filename, navigate]);

       return (
         <div className="container mt-5">
           <div className="card">
             <div className="card-header">
               <h5 className="card-title">Analyse du CV: {nomFichier}</h5>
             </div>
             <div className="card-body">
               {error && <div className="alert alert-danger">{error}</div>}
               {Object.keys(analysis).length === 0 ? (
                 <p>Aucune donnée d'analyse disponible.</p>
               ) : (
                 <div>
                   <h6>Résultats de l'analyse :</h6>
                   <ul className="list-group">
                     <li className="list-group-item"><strong>Domaine :</strong> {analysis.domain || 'Non spécifié'}</li>
                     <li className="list-group-item"><strong>Compétences Techniques :</strong> {analysis.hardSkills?.join(', ') || 'Aucune'}</li>
                     <li className="list-group-item"><strong>Compétences Douces :</strong> {analysis.softSkills?.join(', ') || 'Aucune'}</li>
                     <li className="list-group-item"><strong>Langues :</strong> {analysis.languages?.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') || 'Aucune'}</li>
                     <li className="list-group-item"><strong>Expérience :</strong> {analysis.experience?.map(exp => `${exp.jobTitle}: ${exp.duration}`).join('; ') || 'Non spécifiée'}</li>
                     <li className="list-group-item"><strong>Niveau d'Éducation :</strong> {analysis.education?.level || 'Non spécifié'} {analysis.education?.field && analysis.education.field !== 'Non spécifié' ? `en ${analysis.education.field}` : ''}</li>
                     <li className="list-group-item"><strong>Localisation :</strong> {analysis.location || 'Non spécifiée'}</li>
                   </ul>
                 </div>
               )}
               <button
                 className="btn btn-secondary mt-3"
                 onClick={() => navigate('/responsable/cvs')}
               >
                 Retour à la liste des CVs
               </button>
             </div>
           </div>
         </div>
       );
     };

     export default AnalyseCV;