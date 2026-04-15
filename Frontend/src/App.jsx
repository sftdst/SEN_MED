import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
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
import ConfigSanitairePage from './pages/configSanitaire/ConfigSanitairePage'
import HospitalisationPage from './pages/hospitalisation/HospitalisationPage'
import RendezVousPage from './pages/rendezvous/RendezVousPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index                element={<Dashboard />} />
          <Route path="hopitaux"      element={<HospitalsPage />} />
          <Route path="departements"  element={<DepartementsPage />} />
          <Route path="type-services"  element={<TypeServicesPage />} />
          <Route path="services"      element={<ServicesPage />} />
          <Route path="personnels"     element={<PersonnelsPage />} />
          <Route path="planning"      element={<PlanningPage />} />
          <Route path="partenaires"   element={<PartenairesPage />} />
          <Route path="patients"      element={<PatientsPage />} />
          <Route path="visites"       element={<VisitesPage />} />
          <Route path="salle-attente" element={<SalleAttentePage />} />
          <Route path="pharmacie"           element={<PharmaciePage />} />
          <Route path="comptabilite"       element={<ComptabilitePage />} />
          <Route path="config-systeme"    element={<ConfigSystemePage />} />
          <Route path="config-sanitaire" element={<ConfigSanitairePage />} />
          <Route path="hospitalisation" element={<HospitalisationPage />} />
          <Route path="rendezvous"    element={<RendezVousPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}