import { useEffect, useState, useCallback } from 'react'
import { visiteApi, personnelApi, departementApi, serviceApi, typeServiceApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers de style ─────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.4px', color: error ? colors.danger : colors.gray700,
        }}>
          {label}{required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize: 11, color: colors.danger }}>⚠ {error}</span>}
    </div>
  )
}

function Inp({ label, name, value, onChange, type = 'text', disabled, required, error, placeholder }) {
  const [f, setF] = useState(false)
  return (
    <Field label={label} required={required} error={error}>
      <input
        type={type} name={name} value={value ?? ''} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${error ? colors.danger : f ? colors.bleu : colors.gray300}`,
          borderRadius: radius.sm, padding: '8px 10px',
          fontSize: 13, color: disabled ? colors.gray500 : colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none', transition: 'border-color 0.15s',
          boxShadow: f && !disabled ? `0 0 0 3px ${colors.bleu}18` : 'none',
        }}
      />
    </Field>
  )
}

function Sel({ label, name, value, onChange, options, required, error, disabled }) {
  const [f, setF] = useState(false)
  return (
    <Field label={label} required={required} error={error}>
      <select
        name={name} value={value ?? ''} onChange={onChange} disabled={disabled}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${error ? colors.danger : f ? colors.bleu : colors.gray300}`,
          borderRadius: radius.sm, padding: '8px 10px',
          fontSize: 13, color: colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none', transition: 'border-color 0.15s', cursor: 'pointer',
          boxShadow: f ? `0 0 0 3px ${colors.bleu}18` : 'none',
        }}
      >
        <option value="">-- Sélectionner --</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  )
}

function Chk({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
      <input type="checkbox" checked={!!checked} onChange={onChange}
        style={{ width: 15, height: 15, accentColor: colors.bleu, cursor: 'pointer' }} />
      {label}
    </label>
  )
}

// ── Bande patient (entête) ────────────────────────────────────────────────────

function BandePatient({ patient }) {
  if (!patient) return null
  const age  = patient.age ?? patient.age_patient ?? '—'
  const sexe = patient.gender_id === 'M' ? 'Masculin' : patient.gender_id === 'F' ? 'Féminin' : patient.gender_id ?? '—'
  const dob  = patient.dob ? new Date(patient.dob).toLocaleDateString('fr-FR') : '—'

  return (
    <div style={{
      background: colors.bleu, color: colors.white,
      borderRadius: radius.md, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18,
    }}>
      {/* Avatar */}
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        background: colors.orange, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 700,
      }}>
        {(patient.first_name?.[0] ?? '') + (patient.last_name?.[0] ?? '')}
      </div>

      {/* Nom + DOB */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {patient.patient_name ?? `${patient.first_name} ${patient.last_name}`}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
          {dob} &nbsp;·&nbsp; {age} ans &nbsp;·&nbsp; {sexe}
        </div>
      </div>

      {/* Assureur */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Assureur</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {patient.partenaire?.nom_partenaire ?? (patient.company_id ? patient.company_id : 'Non assuré')}
        </div>
        {patient.type_couverture && (
          <div style={{
            fontSize: 11, background: colors.orange, borderRadius: 20,
            padding: '2px 10px', display: 'inline-block', marginTop: 3,
          }}>{patient.type_couverture}</div>
        )}
      </div>
    </div>
  )
}

// ── Tableau des services ──────────────────────────────────────────────────────

const EMPTY_SVC = { service_id: '', description: '', service_type_id: '', prix: '', quantite: 1, couverture_pct: 0 }

function TableServices({ lignes, onLignes, couverturePct }) {
  const [catalog, setCatalog] = useState([])
  const [typesSvc, setTypesSvc] = useState([])

  useEffect(() => {
    serviceApi.liste({ per_page: 200 }).then(r => setCatalog(r.data?.data?.data ?? [])).catch(() => {})
    typeServiceApi.liste({ per_page: 100 }).then(r => setTypesSvc(r.data?.data?.data ?? [])).catch(() => {})
  }, [])

  const add = () => onLignes([...lignes, { ...EMPTY_SVC, couverture_pct: couverturePct }])
  const remove = (i) => onLignes(lignes.filter((_, idx) => idx !== i))
  const change = (i, field, val) => {
    const updated = lignes.map((l, idx) => {
      if (idx !== i) return l
      const next = { ...l, [field]: val }
      // Si on sélectionne un service du catalogue, remplir auto
      if (field === 'service_id' && val) {
        const found = catalog.find(s => String(s.service_id ?? s.id_Rep) === String(val))
        if (found) {
          next.description    = found.service_name ?? found.description ?? ''
          next.service_type_id= found.type_service_id ?? ''
          next.prix           = found.service_price ?? found.prix ?? 0
        }
      }
      return next
    })
    onLignes(updated)
  }

  const totals = lignes.reduce((acc, l) => {
    const total   = (parseFloat(l.prix) || 0) * (parseInt(l.quantite) || 0)
    const pct     = parseFloat(l.couverture_pct) || 0
    const compagny = Math.round(total * pct / 100)
    const patient  = total - compagny
    acc.total    += total
    acc.compagny += compagny
    acc.patient  += patient
    return acc
  }, { total: 0, compagny: 0, patient: 0 })

  const fmtN = n => Number(n || 0).toLocaleString('fr-FR')

  const thStyle = {
    padding: '8px 10px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', color: colors.white,
    background: colors.bleu, textAlign: 'left', whiteSpace: 'nowrap',
  }
  const tdStyle = {
    padding: '6px 8px', borderBottom: `1px solid ${colors.gray200}`,
    fontSize: 13, verticalAlign: 'middle',
  }

  return (
    <div>
      <div style={{
        background: colors.bleu, color: colors.white,
        borderRadius: `${radius.md} ${radius.md} 0 0`,
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Service à Faire</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={add} title="Ajouter" style={{
            background: colors.orange, border: 'none', borderRadius: 6,
            width: 28, height: 28, cursor: 'pointer', color: colors.white,
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
          <button onClick={() => onLignes([])} title="Vider" style={{
            background: colors.danger, border: 'none', borderRadius: 6,
            width: 28, height: 28, cursor: 'pointer', color: colors.white,
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🗑</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: `1px solid ${colors.gray200}`, borderTop: 'none', borderRadius: `0 0 ${radius.md} ${radius.md}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>N°</th>
              <th style={thStyle}>Service</th>
              <th style={thStyle}>Type</th>
              <th style={{ ...thStyle, width: 90 }}>Prix</th>
              <th style={{ ...thStyle, width: 70 }}>Qté</th>
              <th style={{ ...thStyle, width: 100 }}>Cov%</th>
              <th style={{ ...thStyle, width: 110 }}>Mont. Compagny</th>
              <th style={{ ...thStyle, width: 110 }}>Mont. Patient</th>
              <th style={{ ...thStyle, width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: colors.gray500, padding: 24 }}>
                  Aucun service — cliquez sur + pour en ajouter
                </td>
              </tr>
            )}
            {lignes.map((l, i) => {
              const total    = (parseFloat(l.prix) || 0) * (parseInt(l.quantite) || 0)
              const pct      = parseFloat(l.couverture_pct) || 0
              const compagny = Math.round(total * pct / 100)
              const patient  = total - compagny
              const bg = i % 2 === 0 ? colors.white : colors.gray50
              return (
                <tr key={i} style={{ background: bg }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: colors.gray500 }}>{i + 1}</td>
                  <td style={tdStyle}>
                    <select value={l.service_id} onChange={e => change(i, 'service_id', e.target.value)}
                      style={{
                        width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: 4,
                        padding: '4px 6px', fontSize: 12, background: colors.white,
                      }}>
                      <option value="">-- Choisir --</option>
                      {catalog.map(s => (
                        <option key={s.service_id ?? s.id_Rep} value={s.service_id ?? s.id_Rep}>
                          {s.service_name ?? s.description}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={l.service_type_id} onChange={e => change(i, 'service_type_id', e.target.value)}
                      style={{
                        width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: 4,
                        padding: '4px 6px', fontSize: 12, background: colors.white,
                      }}>
                      <option value="">—</option>
                      {typesSvc.map(t => (
                        <option key={t.type_service_id ?? t.id_Rep} value={t.type_service_id ?? t.id_Rep}>
                          {t.type_name ?? t.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input type="number" value={l.prix} onChange={e => change(i, 'prix', e.target.value)} min={0}
                      style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: 4, padding: '4px 6px', fontSize: 12 }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" value={l.quantite} onChange={e => change(i, 'quantite', e.target.value)} min={1}
                      style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: 4, padding: '4px 6px', fontSize: 12 }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" value={l.couverture_pct} onChange={e => change(i, 'couverture_pct', e.target.value)} min={0} max={100}
                      style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: 4, padding: '4px 6px', fontSize: 12 }} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: colors.bleuMuted }}>
                    {fmtN(compagny)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: colors.warning }}>
                    {fmtN(patient)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => remove(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: colors.danger, fontSize: 16,
                    }}>×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pied totaux */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12, marginTop: 12,
      }}>
        <TotalBox label="Total à Payer" value={totals.total} color={colors.success} />
        <TotalBox label="Part Société"  value={totals.compagny} color={colors.bleuMuted} />
        <TotalBox label="Part Patient"  value={totals.patient}  color={colors.warning} />
      </div>
    </div>
  )
}

function TotalBox({ label, value, color }) {
  const fmtN = n => Number(n || 0).toLocaleString('fr-FR')
  return (
    <div style={{
      border: `1.5px solid ${color}30`, borderRadius: radius.sm,
      padding: '10px 14px', background: `${color}08`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, textAlign: 'right' }}>{fmtN(value)}</div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  consulting_doctor_id:  '',
  IDgen_mst_Departement: '',
  visit_type:            'OPD',
  visit_place:           '',
  refered_doctor:        '',
  numero_medcin:         '',
  refered_hospital:      '',
  societe:               '',
  ref_pc:                '',
  date:                  new Date().toISOString().slice(0, 10),
  Lien_Parente:          '',
  prise_en_charge:       false,
  contrat_pol:           false,
  attestation:           false,
  urgence:               false,
  Hospitaliser:          false,
}

export default function CreerVisiteModal({ patient, onClose, onSaved, onPaiement }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [lignes, setLignes] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [visiteCreee, setVisiteCreee] = useState(null)  // stocke la visite après sauvegarde

  const [medecins, setMedecins]     = useState([])
  const [depts, setDepts]           = useState([])
  const [metadata, setMetadata]     = useState({ visit_places: [], visit_types: [], liens_parente: [] })

  // Couverture du partenaire (en %)
  const couverturePct = 0 // À améliorer : charger depuis les détails partenaire

  useEffect(() => {
    personnelApi.liste({ per_page: 200 }).then(r => {
      const all = r.data?.data?.data ?? []
      setMedecins(all.filter(p => p.role === 'medecin' || p.job_title?.toLowerCase().includes('médecin') || p.job_title?.toLowerCase().includes('docteur') || p.job_title?.toLowerCase().includes('doctor')))
    }).catch(() => {})

    departementApi.liste({ per_page: 100 }).then(r => setDepts(r.data?.data?.data ?? [])).catch(() => {})

    visiteApi.metadata().then(r => setMetadata(r.data?.data ?? metadata)).catch(() => {})
  }, [])

  // Auto-remplissage département selon médecin
  useEffect(() => {
    if (form.consulting_doctor_id) {
      const med = medecins.find(m => String(m.personnel_id ?? m.id_Rep) === form.consulting_doctor_id)
      if (med?.departement_id) {
        setForm(f => ({ ...f, IDgen_mst_Departement: med.departement_id }))
      }
    }
  }, [form.consulting_doctor_id, medecins])

  const handleChange = useCallback(e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErrors(ev => ({ ...ev, [name]: null }))
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.visit_place) errs.visit_place = 'Requis'
    if (lignes.length === 0) errs.services = 'Ajoutez au moins un service'
    lignes.forEach((l, i) => {
      if (!l.service_id) errs[`svc_${i}`] = 'Service requis'
      if (!l.prix || parseFloat(l.prix) <= 0) errs[`prix_${i}`] = 'Prix invalide'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Sauvegarde la visite et retourne l'objet visite créé (ou null si erreur)
  const sauvegarderVisite = async () => {
    if (!validate()) {
      showToast('Corrigez les erreurs avant de continuer', 'error')
      return null
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        patient_pin: patient.patient_id,
        hospital_id: patient.hospital_id ?? null,
        services: lignes.map(l => ({
          service_id:      l.service_id,
          description:     l.description,
          service_type_id: l.service_type_id || null,
          prix:            parseFloat(l.prix) || 0,
          quantite:        parseInt(l.quantite) || 1,
          couverture_pct:  parseFloat(l.couverture_pct) || 0,
        })),
      }
      const res = await visiteApi.creer(payload)
      const visite = res.data.data
      showToast(`Visite créée — ${visite.bill_no}`, 'success')
      setVisiteCreee(visite)
      onSaved?.(visite)
      return visite
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur serveur'
      showToast(msg, 'error')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => sauvegarderVisite()

  const handlePaiement = async () => {
    // Si visite déjà créée → passer directement au paiement
    if (visiteCreee) {
      onPaiement?.(visiteCreee)
      return
    }
    // Sinon sauvegarder d'abord puis ouvrir paiement
    const visite = await sauvegarderVisite()
    if (visite) onPaiement?.(visite)
  }

  const medecinOpts = medecins.map(m => ({
    value: String(m.personnel_id ?? m.id_Rep),
    label: m.full_name ?? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
  }))
  const deptOpts = depts.map(d => ({
    value: String(d.departement_id ?? d.id_Rep),
    label: d.departement_name ?? d.nom ?? d.name,
  }))
  const liensOpts = (metadata.liens_parente ?? []).map(l => ({ value: l.value, label: l.label }))
  const placesOpts = (metadata.visit_places ?? []).map(l => ({ value: l.value, label: l.label }))
  const typesOpts  = (metadata.visit_types ?? []).map(l => ({ value: l.value, label: l.label }))

  return (
    /* Overlay */
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 1000, overflowY: 'auto', padding: '20px 0',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Fenêtre */}
      <div style={{
        background: colors.white, borderRadius: radius.lg,
        width: '96%', maxWidth: 1000,
        boxShadow: shadows.xl,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Barre titre */}
        <div style={{
          background: colors.bleu, color: colors.white,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
          padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>
            Création Visite
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {!visiteCreee && (
              <ActionBtn
                label={saving ? '...' : '💾 Sauvegarder'}
                onClick={handleSave}
                disabled={saving}
                color={colors.success}
              />
            )}
            {visiteCreee && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                background: `${colors.success}30`,
                color: colors.success,
                borderRadius: radius.sm,
                padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                ✔ Enregistrée
              </span>
            )}
            <ActionBtn
              label={saving ? '...' : '💳 Paiement'}
              onClick={handlePaiement}
              disabled={saving}
              color={colors.warning}
            />
            <ActionBtn label="Fermer" onClick={onClose} color={colors.gray600} />
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Bande patient */}
          <BandePatient patient={patient} />

          {/* Section Détails Visite */}
          <Section title="Détails Visites">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <Sel label="Médecin Consultant" name="consulting_doctor_id"
                value={form.consulting_doctor_id} onChange={handleChange}
                options={medecinOpts} required />
              <Sel label="Département" name="IDgen_mst_Departement"
                value={form.IDgen_mst_Departement} onChange={handleChange}
                options={deptOpts} />
              <Sel label="Type de Service" name="visit_type"
                value={form.visit_type} onChange={handleChange}
                options={typesOpts} />
              <Sel label="Lieu du RDV" name="visit_place"
                value={form.visit_place} onChange={handleChange}
                options={placesOpts} required error={errors.visit_place} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
              <Inp label="Médecin De Référence" name="refered_doctor"
                value={form.refered_doctor} onChange={handleChange} />
              <Inp label="Tel Médecin" name="numero_medcin"
                value={form.numero_medcin} onChange={handleChange} />
              <Inp label="Clinic de référence" name="refered_hospital"
                value={form.refered_hospital} onChange={handleChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
              <Inp label="Société" name="societe" value={form.societe} onChange={handleChange} />
              <Inp label="Ref PC"  name="ref_pc"  value={form.ref_pc}  onChange={handleChange} />
              <Inp label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
              <Sel label="Parenté" name="Lien_Parente"
                value={form.Lien_Parente} onChange={handleChange}
                options={liensOpts} />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
              <Chk label="Prise en Charge"     checked={form.prise_en_charge} onChange={e => setForm(f => ({ ...f, prise_en_charge: e.target.checked }))} />
              <Chk label="Contrat Police Ass." checked={form.contrat_pol}     onChange={e => setForm(f => ({ ...f, contrat_pol: e.target.checked }))} />
              <Chk label="Attestation de PC"   checked={form.attestation}     onChange={e => setForm(f => ({ ...f, attestation: e.target.checked }))} />
              <Chk label="Urgence"             checked={form.urgence}         onChange={e => setForm(f => ({ ...f, urgence: e.target.checked }))} />
              <Chk label="Hospitaliser"        checked={form.Hospitaliser}    onChange={e => setForm(f => ({ ...f, Hospitaliser: e.target.checked }))} />
            </div>
          </Section>

          {/* Tableau services */}
          {errors.services && (
            <div style={{ color: colors.danger, fontSize: 12, marginBottom: -8 }}>⚠ {errors.services}</div>
          )}
          <TableServices lignes={lignes} onLignes={setLignes} couverturePct={couverturePct} />

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      border: `1.5px solid ${colors.bleu}30`,
      borderRadius: radius.md, overflow: 'hidden',
    }}>
      <div style={{
        background: colors.bleu, color: colors.white,
        padding: '8px 16px', fontWeight: 700, fontSize: 14,
      }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function ActionBtn({ label, onClick, disabled, color }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !disabled ? `${color}dd` : color,
        color: colors.white, border: 'none',
        borderRadius: radius.sm, padding: '7px 18px',
        fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.15s',
        boxShadow: shadows.sm,
      }}>{label}</button>
  )
}
