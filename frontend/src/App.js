import './App.css';
import { Routes, Route } from "react-router-dom";
import AcceuilAdmin from './Components/AdminComponents/Page/AcceuilAdmin';
import SignInAdmin from './Components/AdminComponents/Page/SignInAdmin';
import DashboardAdmin from './Components/AdminComponents/Page/DashboardAdmin';
import ProfilAdmin from './Components/AdminComponents/Page/ProfilAdmin';
import ForgotPassword from './Components/AdminComponents/Page/ForgetPassword';
import ResetPassword from './Components/AdminComponents/Page/resetPassword';
import SignInCandidat from './Components/CandidatComponents/Pages/signinCandidat';
import SignUpCandidat from './Components/CandidatComponents/Pages/signupCandidat';
import AcceuilCandidat from './Components/CandidatComponents/Pages/AcceuilCandidat';
import AcceuilCandEntre from './Components/CandidatComponents/Pages/AcceuilCandEntre';
import SignInResponsable from './Components/ResponsableComponents/Pages/signinResponsable';
import SignUpResponsable from './Components/ResponsableComponents/Pages/signupResponsable';
import Candidats from './Components/AdminComponents/Page/Candidats';
import Responsables from './Components/AdminComponents/Page/Responsables';
import AjouterCandidat from './Components/AdminComponents/Page/ajouter-candidat';
import DetailCandidat from './Components/AdminComponents/Page/details-candidats';
import AjouterResponsable from './Components/AdminComponents/Page/ajouter-responsable';
import DetailsResponsable from './Components/AdminComponents/Page/details-responsable';
import AcceuilResponsable from './Components/ResponsableComponents/Pages/AcceuilResponsable';
import DashboardResponsable from './Components/ResponsableComponents/Pages/dashboardResponsable';
import OffresResponsable from './Components/ResponsableComponents/Pages/OffresResponsable';
import OffresAdmin from './Components/AdminComponents/Page/OffresAdmin';
import ProfilResponsable from './Components/ResponsableComponents/Pages/Profil';
import ProfilCandiat from './Components/CandidatComponents/Pages/Profil';
import DeposerCV from './Components/CandidatComponents/Pages/DeposerCV';
import CandidatsListe from './Components/ResponsableComponents/Pages/Candidat';
import ListeOffres from './Components/CandidatComponents/Pages/ListeOffres';
import MesCandidat from './Components/ResponsableComponents/Pages/MesCandidat';
import ConsulterDemandes from './Components/CandidatComponents/Pages/ConsulterDemandes';
import Interview from './Components/ResponsableComponents/Pages/Interview';
import CandidateInterview from './Components/CandidatComponents/Pages/InterviewCandidat';
import DashboardCandidat from './Components/CandidatComponents/Pages/dashboardCandidat';
import InterviewsAdmin from './Components/AdminComponents/Page/InterviewAdmin';
function App() {
  return (
    <div className="App">
      <Routes>
        {/* Définir log comme la page par défaut à la racine */}
        <Route path="/" element={<AcceuilCandEntre />} />
        <Route path="/signincandidat" element={<SignInCandidat />} />
        <Route path="/signupcandidat" element={<SignUpCandidat />} />

        <Route path="/signinresponsable" element={<SignInResponsable />} />
        <Route path="/signupresponsable" element={<SignUpResponsable />} />

        {/* Routes pour l'admin (accessibles après connexion) */}
        <Route path="/admin" element={<AcceuilAdmin />}>
          <Route path="acceuil" element={<DashboardAdmin />} />
          <Route path="profil" element={<ProfilAdmin />} />
          <Route path="candidats" element={<Candidats />} />
          <Route path="ajouter-candidat" element={<AjouterCandidat />} />
          <Route path="details-candidats/:id" element={<DetailCandidat />} />

          <Route path="responsables" element={<Responsables />} />
          <Route path="ajouter-responsable" element={<AjouterResponsable />} />
          <Route path="details-responsable/:id" element={<DetailsResponsable />} />
         <Route path="entretien" element={<InterviewsAdmin />} />
          <Route path="offres" element={<OffresAdmin />} />

        </Route>
        {/* Route supplémentaire pour signin si besoin */}
        <Route path="/signin" element={<SignInAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Routes pour les candidats (accessibles après connexion) */}
        <Route path="/candidat" element={<AcceuilCandidat />}>
        <Route path="profil"element={<ProfilCandiat/>}/>
        <Route path="deposerCV" element={<DeposerCV />} />
        <Route path="offres" element={<ListeOffres />} />
        <Route path="demandes"element={<ConsulterDemandes/>}/>
        <Route path="entretient"element={<CandidateInterview/>}/>
        <Route path="acceuil"element={<DashboardCandidat/>}/>

        </Route>
          <Route path="acceuil" element={<DashboardAdmin />} />
          <Route path="profil" element={<ProfilAdmin />} />

        <Route path="/responsable" element={<AcceuilResponsable />}>
        <Route path="acceuil"element={<DashboardResponsable/>}/>
        <Route path="offres"element={<OffresResponsable/>}/>
        <Route path="profil"element={<ProfilResponsable/>}/>
        <Route path="CandidatesList"element={<CandidatsListe/>}/>
        <Route path="MesCandiats"element={<MesCandidat/>}/>
        <Route path="Interview"element={<Interview/>}/>

          </Route>
      </Routes>
    </div>
  );
}

export default App;
