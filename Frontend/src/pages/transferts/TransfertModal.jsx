import { useState, useEffect, useRef } from 'react'
import { colors, shadows, radius, typography } from '../../theme'
import { transfertApi, patientApi, personnelApi, serviceApi, chambreApi } from '../../api'

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ ...typography.label, color: colors.gray700 }}>{label}</label>
      {children}
      {error && <span style={{ ...typography.bodySm, color: colors.danger }}>{error}</span>}
    </div>
  )
}

const iStyle = (err) => ({
  padding: '8px 12px', borderRadius: radius.sm,
  border: `1px solid ${err ? colors.danger : colors.gray300}`,
  ...typography.input, color: colors.gray900,
  outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
})

/**
 * Modal de création de transfert.
 *
 * Props :
 *   onClose()         — ferme la modale
 *   onSaved()         — callback après enregistrement réussi
 *   showToast(msg,t)  — afficher un toast
 *   defaultPatientId  — (optionnel) patient_id pré-rempli
 *   defaultPatientName— (optionnel) nom affiché dans le champ de recherche
 */
export default function TransfertModal({ onClose, onSaved, showToast, defaultPatientId = '', defaultPatientName = '' }) {
  const empty = {
    patient_id: defaultPatientId,
    type_transfert: 'INTERNE',
    date_transfert: new Date().toISOString().slice(0, 16),
    motif: '',
    ancien_medecin_id: '', nouveau_medecin_id: '',
    ancien_service_id: '', nouveau_service_id: '',
    ancienne_chambre_id: '', nouvelle_chambre_id: '',
    structure_destination: '', medecin_destination: '', commentaire: '',
  }
  const [form, setForm]       = useState(empty)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [patients, setPatients] = useState([])
  const [medecins, setMedecins] = useState([])
  const [services, setServices] = useState([])
  const [chambres, setChambres] = useState([])
  const [searchP, setSearchP] = useState(defaultPatientName)
  const timerP = useRef(null)

  useEffect(() => {
    personnelApi.liste({ staff_type: 'medecin', per_page: 100 })
      .then(r => setMedecins(r.data?.data?.data ?? []))
      .catch(() => {})
    serviceApi.liste({ per_page: 100 })
      .then(r => setServices(r.data?.data?.data ?? []))
      .catch(() => {})
    chambreApi.liste({ statut: 'Disponible', per_page: 100 })
      .then(r => setChambres(r.data?.data?.data ?? []))
      .catch(() => {})
  }, [])

  // Recherche patient (désactivée si patient pré-rempli)
  useEffect(() => {
    if (defaultPatientId) return
    clearTimeout(timerP.current)
    if (!searchP) { setPatients([]); return }
    timerP.current = setTimeout(() => {
      patientApi.liste({ search: searchP, per_page: 20 })
        .then(r => setPatients(r.data?.data?.data ?? []))
        .catch(() => {})
    }, 350)
  }, [searchP, defaultPatientId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.patient_id)     e.patient_id = 'Requis'
    if (!form.date_transfert) e.date_transfert = 'Requis'
    if (!form.motif.trim())   e.motif = 'Le motif est obligatoire'
    if (form.type_transfert === 'INTERNE') {
      if (!form.nouveau_medecin_id && !form.nouveau_service_id && !form.nouvelle_chambre_id)
        e.nouveau_medecin_id = 'Indiquez au moins un changement (médecin, service ou chambre)'
    }
    if (form.type_transfert === 'EXTERNE' && !form.structure_destination.trim())
      e.structure_destination = 'Requis'
    return e
  }

  const save = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const payload = {
        patient_id:     form.patient_id,
        type_transfert: form.type_transfert,
        date_transfert: form.date_transfert,
        motif:          form.motif,
      }
      if (form.type_transfert === 'INTERNE') {
        if (form.ancien_medecin_id)   payload.ancien_medecin_id   = Number(form.ancien_medecin_id)
        if (form.nouveau_medecin_id)  payload.nouveau_medecin_id  = Number(form.nouveau_medecin_id)
        if (form.ancien_service_id)   payload.ancien_service_id   = Number(form.ancien_service_id)
        if (form.nouveau_service_id)  payload.nouveau_service_id  = Number(form.nouveau_service_id)
        if (form.ancienne_chambre_id) payload.ancienne_chambre_id = Number(form.ancienne_chambre_id)
        if (form.nouvelle_chambre_id) payload.nouvelle_chambre_id = Number(form.nouvelle_chambre_id)
      } else {
        payload.structure_destination = form.structure_destination
        payload.medecin_destination   = form.medecin_destination
        payload.commentaire           = form.commentaire
      }
      await transfertApi.creer(payload)
      showToast('Transfert enregistré avec succès.', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message ?? "Erreur lors de l'enregistrement.", 'error')
    } finally {
      setSaving(false)
    }
  }

  const isInterne = form.type_transfert === 'INTERNE'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        width: '100%', maxWidth: 680,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: shadows.xl,
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <div>
              <div style={{ ...typography.h2, color: '#fff' }}>Nouveau transfert</div>
              {defaultPatientName && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  Patient : {defaultPatientName}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: radius.sm, cursor: 'pointer',
            fontSize: 16, color: '#fff', width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Patient (masqué si pré-rempli) */}
            {!defaultPatientId && (
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Patient *" error={errors.patient_id}>
                  <input
                    style={iStyle(errors.patient_id)}
                    placeholder="Rechercher un patient..."
                    value={searchP}
                    onChange={e => { setSearchP(e.target.value); set('patient_id', '') }}
                  />
                  {patients.length > 0 && !form.patient_id && (
                    <div style={{
                      border: `1px solid ${colors.gray300}`, borderRadius: radius.sm,
                      background: '#fff', boxShadow: shadows.md, maxHeight: 180, overflowY: 'auto',
                    }}>
                      {patients.map(p => (
                        <div
                          key={p.patient_id}
                          onClick={() => { set('patient_id', p.patient_id); setSearchP(p.patient_name); setPatients([]) }}
                          style={{ padding: '8px 12px', cursor: 'pointer', ...typography.body, borderBottom: `1px solid ${colors.gray100}` }}
                          onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <strong>{p.patient_name}</strong>
                          <span style={{ color: colors.gray500, marginLeft: 8 }}>{p.patient_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            )}

            {/* Type */}
            <Field label="Type de transfert *" error={errors.type_transfert}>
              <select style={iStyle()} value={form.type_transfert} onChange={e => set('type_transfert', e.target.value)}>
                <option value="INTERNE">🏥 Interne</option>
                <option value="EXTERNE">🌍 Externe</option>
              </select>
            </Field>

            {/* Date */}
            <Field label="Date du transfert *" error={errors.date_transfert}>
              <input type="datetime-local" style={iStyle(errors.date_transfert)}
                value={form.date_transfert} onChange={e => set('date_transfert', e.target.value)} />
            </Field>

            {/* Motif */}
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Motif *" error={errors.motif}>
                <textarea rows={3} style={{ ...iStyle(errors.motif), resize: 'vertical' }}
                  placeholder="Décrivez le motif du transfert..."
                  value={form.motif} onChange={e => set('motif', e.target.value)} />
              </Field>
            </div>

            {/* Champs INTERNE */}
            {isInterne && (<>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ background: colors.infoBg, border: `1px solid ${colors.info}`, borderRadius: radius.sm, padding: '8px 12px', ...typography.bodySm, color: colors.info }}>
                  Indiquez au moins un changement : médecin, service ou chambre.
                  {errors.nouveau_medecin_id && <span style={{ color: colors.danger, marginLeft: 8 }}>{errors.nouveau_medecin_id}</span>}
                </div>
              </div>
              <Field label="Ancien médecin">
                <select style={iStyle()} value={form.ancien_medecin_id} onChange={e => set('ancien_medecin_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {medecins.map(m => <option key={m.id} value={m.id}>{m.staff_name}</option>)}
                </select>
              </Field>
              <Field label="Nouveau médecin">
                <select style={iStyle(errors.nouveau_medecin_id)} value={form.nouveau_medecin_id} onChange={e => set('nouveau_medecin_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {medecins.map(m => <option key={m.id} value={m.id}>{m.staff_name}</option>)}
                </select>
              </Field>
              <Field label="Ancien service">
                <select style={iStyle()} value={form.ancien_service_id} onChange={e => set('ancien_service_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {services.map(s => <option key={s.id_service} value={s.id_service}>{s.short_name}</option>)}
                </select>
              </Field>
              <Field label="Nouveau service">
                <select style={iStyle()} value={form.nouveau_service_id} onChange={e => set('nouveau_service_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {services.map(s => <option key={s.id_service} value={s.id_service}>{s.short_name}</option>)}
                </select>
              </Field>
              <Field label="Ancienne chambre">
                <select style={iStyle()} value={form.ancienne_chambre_id} onChange={e => set('ancienne_chambre_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {chambres.map(c => <option key={c.id_chambre} value={c.id_chambre}>{c.nom} ({c.code_chambre})</option>)}
                </select>
              </Field>
              <Field label="Nouvelle chambre">
                <select style={iStyle()} value={form.nouvelle_chambre_id} onChange={e => set('nouvelle_chambre_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {chambres.map(c => <option key={c.id_chambre} value={c.id_chambre}>{c.nom} ({c.code_chambre})</option>)}
                </select>
              </Field>
            </>)}

            {/* Champs EXTERNE */}
            {!isInterne && (<>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ background: colors.orangeLight, border: `1px solid ${colors.orange}`, borderRadius: radius.sm, padding: '8px 12px', ...typography.bodySm, color: colors.orangeDark }}>
                  Un transfert externe clôturera automatiquement l'hospitalisation en cours lors de la validation.
                </div>
              </div>
              <Field label="Structure de destination *" error={errors.structure_destination}>
                <input style={iStyle(errors.structure_destination)} placeholder="Nom de l'hôpital / clinique..."
                  value={form.structure_destination} onChange={e => set('structure_destination', e.target.value)} />
              </Field>
              <Field label="Médecin référent (destination)">
                <input style={iStyle()} placeholder="Nom du médecin..."
                  value={form.medecin_destination} onChange={e => set('medecin_destination', e.target.value)} />
              </Field>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Commentaire">
                  <textarea rows={2} style={{ ...iStyle(), resize: 'vertical' }}
                    placeholder="Informations complémentaires..."
                    value={form.commentaire} onChange={e => set('commentaire', e.target.value)} />
                </Field>
              </div>
            </>)}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: radius.sm, cursor: 'pointer',
            background: colors.gray100, border: `1px solid ${colors.gray300}`,
            ...typography.button, color: colors.gray700,
          }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{
            padding: '8px 24px', borderRadius: radius.sm,
            cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? colors.gray400 : colors.bleu, border: 'none',
            ...typography.button, color: '#fff',
          }}>
            {saving ? 'Enregistrement...' : '✔ Enregistrer le transfert'}
          </button>
        </div>
      </div>
    </div>
  )
}
