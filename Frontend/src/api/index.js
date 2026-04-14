import api from './axios'

// ── Hôpitaux ──────────────────────────────────────────────
export const hospitalApi = {
  liste:      (params) => api.get('/hospitals', { params }),
  detail:     (id)     => api.get(`/hospitals/${id}`),
  creer:      (data)   => api.post('/hospitals', data),
  modifier:   (id, data) => api.put(`/hospitals/${id}`, data),
  supprimer:  (id)     => api.delete(`/hospitals/${id}`),
}

// ── Départements ──────────────────────────────────────────
export const departementApi = {
  liste:      (params) => api.get('/departements', { params }),
  detail:     (id)     => api.get(`/departements/${id}`),
  creer:      (data)   => api.post('/departements', data),
  modifier:   (id, data) => api.put(`/departements/${id}`, data),
  supprimer:  (id)     => api.delete(`/departements/${id}`),
}

// ── Types de service ──────────────────────────────────────
export const typeServiceApi = {
  liste:      (params) => api.get('/type-services', { params }),
  detail:     (id)     => api.get(`/type-services/${id}`),
  creer:      (data)   => api.post('/type-services', data),
  modifier:   (id, data) => api.put(`/type-services/${id}`, data),
  supprimer:  (id)     => api.delete(`/type-services/${id}`),
}

// ── Services ──────────────────────────────────────────────
export const serviceApi = {
  liste:      (params) => api.get('/services', { params }),
  detail:     (id)     => api.get(`/services/${id}`),
  creer:      (data)   => api.post('/services', data),
  modifier:   (id, data) => api.put(`/services/${id}`, data),
  supprimer:  (id)     => api.delete(`/services/${id}`),
}

// ── Partenaires ───────────────────────────────────────────
export const partenaireApi = {
  liste:              (params)        => api.get('/partenaires', { params }),
  detail:             (id)            => api.get(`/partenaires/${id}`),
  creer:              (data)          => api.post('/partenaires', data),
  modifier:           (id, data)      => api.put(`/partenaires/${id}`, data),
  supprimer:          (id)            => api.delete(`/partenaires/${id}`),
  // Types de couverture
  couvertures:        (id)            => api.get(`/partenaires/${id}/couvertures`),
  ajouterCouverture:  (id, data)      => api.post(`/partenaires/${id}/couvertures`, data),
  modifierCouverture: (id, dtlId, data) => api.put(`/partenaires/${id}/couvertures/${dtlId}`, data),
  supprimerCouverture:(id, dtlId)     => api.delete(`/partenaires/${id}/couvertures/${dtlId}`),
}

// ── Planning : Horaires ───────────────────────────────────
export const horaireApi = {
  liste:          (params) => api.get('/planning/horaires', { params }),
  planningMedecin:(id)     => api.get(`/planning/horaires/medecin/${id}`),
  creer:          (data)   => api.post('/planning/horaires', data),
  modifier:       (id, data) => api.put(`/planning/horaires/${id}`, data),
  supprimer:      (id)     => api.delete(`/planning/horaires/${id}`),
}

// ── Planning : Exceptions ─────────────────────────────────
export const exceptionApi = {
  liste:    (params) => api.get('/planning/exceptions', { params }),
  creer:    (data)   => api.post('/planning/exceptions', data),
  modifier: (id, data) => api.put(`/planning/exceptions/${id}`, data),
  supprimer:(id)     => api.delete(`/planning/exceptions/${id}`),
}

// ── Planning : Jours fériés ───────────────────────────────
export const jourFerieApi = {
  liste:         (params) => api.get('/planning/jours-feries', { params }),
  creer:         (data)   => api.post('/planning/jours-feries', data),
  modifier:      (id, data) => api.put(`/planning/jours-feries/${id}`, data),
  supprimer:     (id)     => api.delete(`/planning/jours-feries/${id}`),
  initialiserSn: (annee)  => api.post('/planning/jours-feries/initialiser', { annee }),
}

// ── Planning : Disponibilités jours fériés ────────────────
export const ferieDispoApi = {
  liste:    (params) => api.get('/planning/ferie-disponibilites', { params }),
  creer:    (data)   => api.post('/planning/ferie-disponibilites', data),
  modifier: (id, data) => api.put(`/planning/ferie-disponibilites/${id}`, data),
  supprimer:(id)     => api.delete(`/planning/ferie-disponibilites/${id}`),
}

// ── Planning : Créneaux ───────────────────────────────────
export const creneauxApi = {
  duJour:   (params) => api.get('/planning/creneaux', { params }),
  semaine:  (params) => api.get('/planning/creneaux/semaine', { params }),
  synthese: (id)     => api.get(`/planning/synthese/${id}`),
}

// ── Personnel ─────────────────────────────────────────────
export const personnelApi = {
  liste:          (params) => api.get('/personnels', { params }),
  detail:         (id)     => api.get(`/personnels/${id}`),
  creer:          (data)   => api.post('/personnels', data),
  creerRapide:    (data)   => api.post('/personnels/creation-rapide', data),
  modifier:       (id, data) => api.put(`/personnels/${id}`, data),
  supprimer:      (id)     => api.delete(`/personnels/${id}`),
  metadata:       ()       => api.get('/personnels/metadata'),
}

// ── Patients ──────────────────────────────────────────────
export const patientApi = {
  liste:              (params)       => api.get('/patients', { params }),
  detail:             (id)           => api.get(`/patients/${id}`),
  creer:              (data)         => api.post('/patients', data),
  creerRapide:        (data)         => api.post('/patients/creation-rapide', data),
  modifier:           (id, data)     => api.put(`/patients/${id}`, data),
  supprimer:          (id)           => api.delete(`/patients/${id}`),
  metadata:           ()             => api.get('/patients/metadata'),
  typesCouverture:    (partenaireId) => api.get(`/patients/partenaire/${partenaireId}/couvertures`),
  genererCarte:       (id)           => api.get(`/patients/${id}/carte`),
}
