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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index                element={<Dashboard />} />
          <Route path="hopitaux"      element={<HospitalsPage />} />
          <Route path="departements"  element={<DepartementsPage />} />
          <Route path="type-services" element={<TypeServicesPage />} />
          <Route path="services"      element={<ServicesPage />} />
          <Route path="personnels"    element={<PersonnelsPage />} />
          <Route path="planning"      element={<PlanningPage />} />
          <Route path="partenaires"   element={<PartenairesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
