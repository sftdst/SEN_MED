import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import HospitalsPage from './pages/hospitals/HospitalsPage'
import DepartementsPage from './pages/departements/DepartementsPage'
import TypeServicesPage from './pages/typeServices/TypeServicesPage'
import ServicesPage from './pages/services/ServicesPage'
import PersonnelsPage from './pages/personnels/PersonnelsPage'
import PlanningPage from './pages/planning/PlanningPage'
import PartenairesPage from './pages/partenaires/PartenairesPage'
import PatientsPage from './pages/patients/PatientsPage'
import VisitesPage from './pages/visites/VisitesPage'
import SalleAttentePage from './pages/salleAttente/SalleAttentePage'
import PharmaciePage from './pages/pharmacie/PharmaciePage'
import ComptabilitePage from './pages/comptabilite/ComptabilitePage'
import ConfigSystemePage from './pages/configSysteme/ConfigSystemePage'
import ConfigPageWebPage from './pages/configPageWeb/ConfigPageWebPage'
import ConfigSanitairePage from './pages/configSanitaire/ConfigSanitairePage'
import ConfigProfilsDroitsPage from './pages/configProfilsDroits/ConfigProfilsDroitsPage'
import HospitalisationPage from './pages/hospitalisation/HospitalisationPage'
import RendezVousPage from './pages/rendezvous/RendezVousPage'
import DemandesRdvPage from './pages/rendezvous/DemandesRdvPage'
import EspaceMedecinPage from './pages/espaceMedecin/EspaceMedecinPage'
import TarificationPage from './pages/tarification/TarificationPage'
import TransfertsPage from './pages/transferts/TransfertsPage'
import ConsultationPage from './pages/consultation/ConsultationPage'
import GestionCongesPage from './pages/ressourcesHumaines/GestionCongesPage'
import GestionAbsencesRetardsPage from './pages/ressourcesHumaines/GestionAbsencesRetardsPage'
import GestionContratsPage from './pages/ressourcesHumaines/GestionContratsPage'
import FormulairePage from './pages/formulaire/FormulairePage'
import DossierSoinsPage from './pages/dossierSoins/DossierSoinsPage'
import DossierSoinsDetailPage from './pages/dossierSoins/DossierSoinsDetailPage'
import ImagesNursingPage from './pages/dossierSoins/ImagesNursingPage'
import DPEPage from './pages/patients/DPEPage'
import LoginPage from './pages/auth/LoginPage'

function AppRoutes() {
  return (
    <Routes>
      {/* Page de connexion publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="hopitaux" element={<HospitalsPage />} />
        <Route path="departements" element={<DepartementsPage />} />
        <Route path="type-services" element={<TypeServicesPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="personnels" element={<PersonnelsPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="partenaires" element={<PartenairesPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="visites" element={<VisitesPage />} />
        <Route path="salle-attente" element={<SalleAttentePage />} />
        <Route path="pharmacie" element={<PharmaciePage />} />
        <Route path="comptabilite" element={<ComptabilitePage />} />
        <Route path="config-systeme" element={<ConfigSystemePage />} />
        <Route path="config-page-web" element={<ConfigPageWebPage />} />
        <Route path="config-sanitaire" element={<ConfigSanitairePage />} />
        <Route path="config-profils-droits" element={<ConfigProfilsDroitsPage />} />
        <Route path="formulaires" element={<FormulairePage />} />
        <Route path="tarification" element={<TarificationPage />} />
        <Route path="hospitalisation" element={<HospitalisationPage />} />
        <Route path="rendezvous" element={<RendezVousPage />} />
        <Route path="rendezvous/demandes" element={<DemandesRdvPage />} />
        <Route path="espace-medecin" element={<EspaceMedecinPage />} />
        <Route path="transferts" element={<TransfertsPage />} />
        <Route path="ressources-humaines/conges" element={<GestionCongesPage />} />
        <Route path="ressources-humaines/absences" element={<GestionAbsencesRetardsPage />} />
        <Route path="ressources-humaines/contrats" element={<GestionContratsPage />} />
        <Route path="dossier-soins"        element={<DossierSoinsPage />} />
        <Route path="dossier-soins/images" element={<ImagesNursingPage />} />
       </Route>

       {/* Consultation et DSI hors Layout (protégés) */}
       <Route
         path="/consultation"
         element={
           <ProtectedRoute>
             <ConsultationPage />
           </ProtectedRoute>
         }
       />
       <Route
         path="/consultation/:id"
         element={
           <ProtectedRoute>
             <ConsultationPage />
           </ProtectedRoute>
         }
       />
       <Route
         path="/dossier-soins/:id"
         element={
           <ProtectedRoute>
             <DossierSoinsDetailPage />
           </ProtectedRoute>
         }
       />
       <Route
         path="/dpe/:id"
         element={
           <ProtectedRoute>
             <DPEPage />
           </ProtectedRoute>
         }
       />

       {/* Page 404 */}
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
