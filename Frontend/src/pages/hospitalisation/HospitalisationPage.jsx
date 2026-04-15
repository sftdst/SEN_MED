import { useCallback, useEffect, useRef, useState } from 'react'
import { chambreApi, equipementApi, hospitalisationApi, patientApi, personnelApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtN   = n  => Number(n  || 0).toLocaleString('fr-FR')
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const today   = () => new Date().toISOString().slice(0, 10)

// ── Couleurs statut chambre ───────────────────────────────────────────────────
const STATUT_COLOR = {
  'Disponible':  { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32', dot: '#2e7d32' },
  'Occupée':     { bg: '#fdecea', border: '#c62828', text: '#c62828', dot: '#c62828' },
  'Maintenance': { bg: '#fff3e0', border: '#f57c00', text: '#f57c00', dot: '#f57c00' },
  'À nettoyer':  { bg: '#e3f2fd', border: '#1565c0', text: '#1565c0', dot: '#1565c0' },
}

const TYPE_ICON = {
  'Standard':    '🛏',
  'VIP':         '⭐',
  'Réanimation': '💊',
  'Maternité':   '👶',
  'Pédiatrie':   '🧒',
  'Urgence':     '🚨',
}

// ── Composants UI ─────────────────────────────────────────────────────────────

function Inp({ label, name, value, onChange, type = 'text', required, error, placeholder, disabled }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: error ? colors.danger : colors.gray700 }}>
        {label}{required && <span style={{ color: colors.danger }}> *</span>}
      </label>}
      <input type={type} name={name} value={value ?? ''} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        disabled={disabled} placeholder={placeholder}
        style={{
          border: `1.5px solid ${error ? colors.danger : f ? colors.bleu : colors.gray300}`,
          borderRadius: radius.sm, padding: '8px 10px', fontSize: 13,
          color: disabled ? colors.gray500 : colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none', width: '100%', boxSizing: 'border-box',
          boxShadow: f && !disabled ? `0 0 0 3px ${colors.bleu}18` : 'none',
        }} />
      {error && <span style={{ fontSize: 11, color: colors.danger }}>⚠ {error}</span>}
    </div>
  )
}

function Sel({ label, name, value, onChange, options, required, error, disabled }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: error ? colors.danger : colors.gray700 }}>
        {label}{required && <span style={{ color: colors.danger }}> *</span>}
      </label>}
      <select name={name} value={value ?? ''} onChange={onChange} disabled={disabled}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          border: `1.5px solid ${error ? colors.danger : f ? colors.bleu : colors.gray300}`,
          borderRadius: radius.sm, padding: '8px 10px', fontSize: 13,
          color: colors.gray900, background: disabled ? colors.gray100 : colors.white,
          outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer',
        }}>
        <option value="">— Sélectionner —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: 11, color: colors.danger }}>⚠ {error}</span>}
    </div>
  )
}

function Btn({ children, onClick, color = colors.bleu, disabled, small, outline }) {
  const [h, setH] = useState(false)
  const bg = outline ? 'transparent' : h && !disabled ? `${color}dd` : color
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: bg, color: outline ? color : colors.white,
        border: `1.5px solid ${color}`,
        borderRadius: radius.sm, padding: small ? '5px 12px' : '8px 18px',
        fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', boxShadow: outline ? 'none' : shadows.sm,
      }}>
      {children}
    </button>
  )
}

function Modal({ open, onClose, title, children, width = 600 }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 20, overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: colors.white, borderRadius: radius.lg,
        width: '100%', maxWidth: width, boxShadow: shadows.xl,
      }}>
        <div style={{
          background: colors.bleu, color: colors.white,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
          padding: '13px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', color: colors.white, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color = colors.bleu, sub }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      padding: '16px 20px', boxShadow: shadows.sm,
      borderLeft: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: 14, flex: 1,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 12, color: colors.gray600, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Carte chambre ─────────────────────────────────────────────────────────────

function ChambreCard({ chambre, onEdit, onAdmettre, onPropre, onEquipements }) {
  const sc = STATUT_COLOR[chambre.statut] ?? STATUT_COLOR['Disponible']
  const hospEnCours = chambre.hospitalisation_en_cours?.[0]
  const patient = hospEnCours?.patient

  return (
    <div style={{
      background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
      border: `2px solid ${sc.border}30`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header coloré */}
      <div style={{ background: sc.bg, padding: '12px 14px', borderBottom: `1px solid ${sc.border}30` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{TYPE_ICON[chambre.type] ?? '🛏'}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: colors.bleu }}>{chambre.code_chambre}</span>
            </div>
            <div style={{ fontSize: 12, color: colors.gray700, marginTop: 2 }}>{chambre.nom}</div>
          </div>
          <span style={{
            background: sc.border, color: colors.white,
            borderRadius: radius.full, padding: '3px 10px', fontSize: 10, fontWeight: 700,
          }}>
            <span style={{ marginRight: 4 }}>●</span>{chambre.statut}
          </span>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <InfoRow label="Type"  value={chambre.type} />
          <InfoRow label="Lits"  value={chambre.capacite} />
          <InfoRow label="Prix/j" value={`${fmtN(chambre.prix_journalier)} F`} />
          <InfoRow label="Équipements" value={chambre.equipements?.length ?? 0} />
        </div>

        {/* Patient en cours */}
        {patient && (
          <div style={{
            background: `${colors.danger}10`, border: `1px solid ${colors.danger}30`,
            borderRadius: radius.sm, padding: '8px 10px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: colors.danger, textTransform: 'uppercase', marginBottom: 3 }}>Patient admis</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.gray800 }}>
              {patient.patient_name ?? `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim()}
            </div>
            <div style={{ fontSize: 11, color: colors.gray500 }}>
              Depuis le {fmtDate(hospEnCours.date_entree)}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${colors.gray200}`,
        display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Btn small outline color={colors.bleu} onClick={() => onEdit(chambre)}>✏ Modifier</Btn>
        <Btn small outline color={colors.bleuMuted} onClick={() => onEquipements(chambre)}>🔧</Btn>
        {chambre.statut === 'Disponible' && (
          <Btn small color={colors.success} onClick={() => onAdmettre(chambre)}>+ Admettre</Btn>
        )}
        {chambre.statut === 'À nettoyer' && (
          <Btn small color={colors.info} onClick={() => onPropre(chambre)}>✅ Propre</Btn>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800 }}>{value}</div>
    </div>
  )
}

// ── Modal Chambre (créer/modifier) ────────────────────────────────────────────

const EMPTY_CHAMBRE = { code_chambre: '', nom: '', type: 'Standard', prix_journalier: '', capacite: 1, statut: 'Disponible', description: '' }

function ChambreModal({ open, onClose, chambre, onSaved }) {
  const [form, setForm]     = useState(EMPTY_CHAMBRE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(chambre ? { ...chambre } : EMPTY_CHAMBRE)
    setErrors({})
  }, [chambre, open])

  const change = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(ev => ({ ...ev, [name]: null }))
  }

  const save = async () => {
    const errs = {}
    if (!form.code_chambre) errs.code_chambre = 'Requis'
    if (!form.nom)          errs.nom          = 'Requis'
    if (!form.prix_journalier || parseFloat(form.prix_journalier) < 0) errs.prix_journalier = 'Invalide'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      if (chambre) {
        await chambreApi.modifier(chambre.id_chambre, form)
        showToast('Chambre mise à jour', 'success')
      } else {
        await chambreApi.creer(form)
        showToast('Chambre créée', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur'
      showToast(msg, 'error')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setSaving(false)
    }
  }

  const TYPES   = ['Standard', 'VIP', 'Réanimation', 'Maternité', 'Pédiatrie', 'Urgence']
  const STATUTS = ['Disponible', 'Maintenance', 'À nettoyer']

  return (
    <Modal open={open} onClose={onClose} title={chambre ? `Modifier — ${chambre.code_chambre}` : 'Nouvelle chambre'} width={540}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Inp label="Code" name="code_chambre" value={form.code_chambre} onChange={change} required error={errors.code_chambre} placeholder="CH001" />
        <Inp label="Nom" name="nom" value={form.nom} onChange={change} required error={errors.nom} placeholder="Chambre VIP 1" />
        <Sel label="Type" name="type" value={form.type} onChange={change} options={TYPES.map(t => ({ value: t, label: `${TYPE_ICON[t] ?? ''} ${t}` }))} />
        <Inp label="Prix / jour (F CFA)" name="prix_journalier" type="number" value={form.prix_journalier} onChange={change} required error={errors.prix_journalier} />
        <Inp label="Capacité (lits)" name="capacite" type="number" value={form.capacite} onChange={change} />
        <Sel label="Statut" name="statut" value={form.statut} onChange={change} options={STATUTS.map(s => ({ value: s, label: s }))} />
      </div>
      <div style={{ marginTop: 14 }}>
        <Inp label="Description" name="description" value={form.description} onChange={change} placeholder="Détails de la chambre…" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <Btn outline color={colors.gray600} onClick={onClose}>Annuler</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? '...' : chambre ? '💾 Mettre à jour' : '➕ Créer'}</Btn>
      </div>
    </Modal>
  )
}

// ── Modal Admission ───────────────────────────────────────────────────────────

function AdmissionModal({ open, onClose, chambre, onSaved }) {
  const [form, setForm]     = useState({ patient_id: '', medecin_id: '', date_entree: today(), date_sortie_prevue: '', motif: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [patients, setPatients]   = useState([])
  const [medecins, setMedecins]   = useState([])
  const [searchP, setSearchP]     = useState('')
  const timerP = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm({ patient_id: '', medecin_id: '', date_entree: today(), date_sortie_prevue: '', motif: '' })
    setErrors({})
    personnelApi.liste({ per_page: 200, staff_type: 'medecin' }).then(r => setMedecins(r.data?.data?.data ?? [])).catch(() => {})
  }, [open])

  useEffect(() => {
    clearTimeout(timerP.current)
    if (!searchP) { setPatients([]); return }
    timerP.current = setTimeout(() => {
      patientApi.liste({ search: searchP, per_page: 20 }).then(r => setPatients(r.data?.data?.data ?? [])).catch(() => {})
    }, 350)
  }, [searchP])

  const change = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(ev => ({ ...ev, [name]: null }))
  }

  const save = async () => {
    const errs = {}
    if (!form.patient_id) errs.patient_id = 'Requis'
    if (!form.date_entree) errs.date_entree = 'Requis'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await hospitalisationApi.admettre({ ...form, id_chambre: chambre.id_chambre })
      showToast(`Patient admis en chambre ${chambre.code_chambre}`, 'success')
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  const patientsOpts = patients.map(p => ({
    value: p.patient_id,
    label: `${p.patient_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()} — ${p.patient_id}`,
  }))

  const medecinOpts = medecins.map(m => ({
    value: String(m.id),
    label: m.staff_name ?? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
  }))

  return (
    <Modal open={open} onClose={onClose} title={`Admission — ${chambre?.code_chambre}`} width={520}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Rechercher un patient</div>
        <input value={searchP} onChange={e => setSearchP(e.target.value)} placeholder="Nom ou ID patient…"
          style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 10px', fontSize: 13, outline: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Sel label="Patient" name="patient_id" value={form.patient_id} onChange={change} options={patientsOpts} required error={errors.patient_id} />
        <Sel label="Médecin" name="medecin_id" value={form.medecin_id} onChange={change} options={medecinOpts} />
        <Inp label="Date d'entrée" name="date_entree" type="date" value={form.date_entree} onChange={change} required error={errors.date_entree} />
        <Inp label="Date sortie prévue" name="date_sortie_prevue" type="date" value={form.date_sortie_prevue} onChange={change} />
      </div>
      <div style={{ marginTop: 14 }}>
        <Inp label="Motif d'hospitalisation" name="motif" value={form.motif} onChange={change} placeholder="Motif…" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <Btn outline color={colors.gray600} onClick={onClose}>Annuler</Btn>
        <Btn color={colors.success} onClick={save} disabled={saving}>{saving ? '...' : '🏥 Admettre'}</Btn>
      </div>
    </Modal>
  )
}

// ── Modal Sortie ──────────────────────────────────────────────────────────────

function SortieModal({ open, onClose, hospitalisation, onSaved }) {
  const [form, setForm]     = useState({ date_sortie_reelle: today(), montant_soins: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({ date_sortie_reelle: today(), montant_soins: 0 })
  }, [open])

  const nbJours = () => {
    if (!hospitalisation) return 0
    const d1 = new Date(hospitalisation.date_entree)
    const d2 = new Date(form.date_sortie_reelle || today())
    return Math.max(1, Math.round((d2 - d1) / 86400000))
  }

  const montantHeb = () => nbJours() * parseFloat(hospitalisation?.chambre?.prix_journalier ?? 0)
  const montantTotal = () => montantHeb() + parseFloat(form.montant_soins || 0)

  const save = async () => {
    setSaving(true)
    try {
      await hospitalisationApi.sortie(hospitalisation.id_hospitalisation, form)
      showToast('Sortie enregistrée. Facture générée.', 'success')
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  const patient = hospitalisation?.patient
  const nomPatient = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()

  return (
    <Modal open={open} onClose={onClose} title="Enregistrer la sortie" width={480}>
      {hospitalisation && (
        <div style={{ background: colors.bleu + '10', border: `1px solid ${colors.bleu}30`, borderRadius: radius.sm, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: colors.bleu }}>{nomPatient}</div>
          <div style={{ fontSize: 12, color: colors.gray600 }}>
            {hospitalisation.chambre?.code_chambre} · Entré le {fmtDate(hospitalisation.date_entree)}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Inp label="Date de sortie" name="date_sortie_reelle" type="date" value={form.date_sortie_reelle} onChange={e => setForm(f => ({ ...f, date_sortie_reelle: e.target.value }))} required />
        <Inp label="Frais de soins (F CFA)" name="montant_soins" type="number" value={form.montant_soins} onChange={e => setForm(f => ({ ...f, montant_soins: e.target.value }))} />
      </div>
      {/* Récapitulatif facture */}
      <div style={{ marginTop: 16, background: colors.gray50, borderRadius: radius.sm, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Nb jours"   value={nbJours()} />
        <MiniStat label="Hébergement" value={`${fmtN(montantHeb())} F`} />
        <MiniStat label="Total" value={`${fmtN(montantTotal())} F`} color={colors.success} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <Btn outline color={colors.gray600} onClick={onClose}>Annuler</Btn>
        <Btn color={colors.warning} onClick={save} disabled={saving}>{saving ? '...' : '🚪 Sortie + Facture'}</Btn>
      </div>
    </Modal>
  )
}

function MiniStat({ label, value, color = colors.bleu }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

// ── Modal Équipements d'une chambre ───────────────────────────────────────────

function EquipementsModal({ open, onClose, chambre, onSaved }) {
  const [catalogue, setCatalogue] = useState([])
  const [form, setForm]           = useState({ id_equipement: '', quantite: 1, etat: 'Fonctionnel' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (open) {
      equipementApi.liste().then(r => setCatalogue(r.data?.data ?? [])).catch(() => {})
    }
  }, [open])

  const ajouter = async () => {
    if (!form.id_equipement) return
    setSaving(true)
    try {
      await chambreApi.ajouterEquipement(chambre.id_chambre, form)
      showToast('Équipement ajouté', 'success')
      onSaved()
      setForm({ id_equipement: '', quantite: 1, etat: 'Fonctionnel' })
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  const retirer = async (eqId) => {
    try {
      await chambreApi.retirerEquipement(chambre.id_chambre, eqId)
      showToast('Équipement retiré', 'success')
      onSaved()
    } catch {
      showToast('Erreur', 'error')
    }
  }

  const existants = chambre?.equipements ?? []
  const catalogueOpts = catalogue.map(e => ({ value: e.id_equipement, label: e.nom }))

  return (
    <Modal open={open} onClose={onClose} title={`Équipements — ${chambre?.code_chambre}`} width={500}>
      {/* Liste existants */}
      {existants.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', marginBottom: 8 }}>Équipements actuels</div>
          {existants.map(eq => (
            <div key={eq.id_equipement} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: radius.sm, background: colors.gray50,
              marginBottom: 6, border: `1px solid ${colors.gray200}`,
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{eq.nom}</span>
                <span style={{ fontSize: 11, color: colors.gray500, marginLeft: 8 }}>
                  x{eq.pivot?.quantite ?? 1} · {eq.pivot?.etat ?? 'Fonctionnel'}
                </span>
              </div>
              <button onClick={() => retirer(eq.id_equipement)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: colors.gray500, padding: '12px 0', marginBottom: 12 }}>Aucun équipement</div>
      )}

      {/* Ajouter */}
      <div style={{ borderTop: `1px solid ${colors.gray200}`, paddingTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', marginBottom: 8 }}>Ajouter un équipement</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
          <Sel label="Équipement" name="id_equipement" value={form.id_equipement}
            onChange={e => setForm(f => ({ ...f, id_equipement: e.target.value }))}
            options={catalogueOpts} />
          <Inp label="Qté" name="quantite" type="number" value={form.quantite}
            onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} />
          <Sel label="État" name="etat" value={form.etat}
            onChange={e => setForm(f => ({ ...f, etat: e.target.value }))}
            options={[{ value: 'Fonctionnel', label: 'Fonctionnel' }, { value: 'En panne', label: 'En panne' }]} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Btn onClick={ajouter} disabled={saving || !form.id_equipement} small>➕ Ajouter</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

const TABS = ['Chambres', 'Hospitalisations', 'Historique']

export default function HospitalisationPage() {
  const [tab, setTab]               = useState(0)
  const [chambres, setChambres]     = useState([])
  const [hosp, setHosp]             = useState([])
  const [stats, setStats]           = useState(null)
  const [dashboard, setDashboard]   = useState(null)
  const [loading, setLoading]       = useState(false)

  // Filtres chambres
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [searchCh,     setSearchCh]     = useState('')

  // Filtres hosps
  const [filterHStatut, setFilterHStatut] = useState('En cours')
  const [searchH, setSearchH]             = useState('')

  // Modaux
  const [modalChambre,    setModalChambre]    = useState(false)
  const [modalAdmission,  setModalAdmission]  = useState(false)
  const [modalSortie,     setModalSortie]     = useState(false)
  const [modalEquip,      setModalEquip]      = useState(false)
  const [selectedChambre, setSelectedChambre] = useState(null)
  const [selectedHosp,    setSelectedHosp]    = useState(null)

  const timer = useRef(null)

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => { if (tab === 0) loadChambres() }, [tab, filterStatut, filterType])
  useEffect(() => { if (tab >= 1) loadHosp() }, [tab, filterHStatut])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (tab === 0) loadChambres()
      else loadHosp()
    }, 400)
  }, [searchCh, searchH])

  const loadDashboard = async () => {
    try {
      const [c, h] = await Promise.all([chambreApi.dashboard(), hospitalisationApi.dashboard()])
      setStats(c.data?.data)
      setDashboard(h.data?.data)
    } catch {}
  }

  const loadChambres = async () => {
    setLoading(true)
    try {
      const r = await chambreApi.liste({ per_page: 100, statut: filterStatut || undefined, type: filterType || undefined, search: searchCh || undefined })
      setChambres(r.data?.data?.data ?? [])
      if (r.data?.meta?.stats) setStats(r.data.meta.stats)
    } catch { showToast('Erreur chargement chambres', 'error') }
    finally { setLoading(false) }
  }

  const loadHosp = async () => {
    setLoading(true)
    try {
      const statut = tab === 1 ? 'En cours' : (filterHStatut || undefined)
      const r = await hospitalisationApi.liste({ per_page: 50, statut, search: searchH || undefined })
      setHosp(r.data?.data?.data ?? [])
    } catch { showToast('Erreur chargement hospitalisations', 'error') }
    finally { setLoading(false) }
  }

  const reload = () => { loadDashboard(); if (tab === 0) loadChambres(); else loadHosp() }

  const handlePropre = async (ch) => {
    try {
      await chambreApi.marquerPropre(ch.id_chambre)
      showToast('Chambre disponible', 'success')
      reload()
    } catch (err) { showToast(err.response?.data?.message ?? 'Erreur', 'error') }
  }

  const thStyle = { padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: colors.white, background: colors.bleu, textAlign: 'left', whiteSpace: 'nowrap' }
  const tdStyle = (i) => ({ padding: '10px 14px', fontSize: 13, borderBottom: `1px solid ${colors.gray200}`, background: i % 2 === 0 ? colors.white : colors.gray50 })

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: colors.gray50 }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.bleu, margin: 0 }}>🏨 Hospitalisation</h1>
        <p style={{ fontSize: 13, color: colors.gray600, margin: '4px 0 0' }}>Gestion des chambres, admissions et facturation</p>
      </div>

      {/* ── Statistiques ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="🟢" label="Disponibles"   value={stats?.disponibles ?? 0}  color={colors.success} />
        <StatCard icon="🔴" label="Occupées"       value={stats?.occupees ?? 0}     color={colors.danger} />
        <StatCard icon="🟡" label="Maintenance"    value={stats?.maintenance ?? 0}  color={colors.warning} />
        <StatCard icon="🔵" label="À nettoyer"     value={stats?.a_nettoyer ?? 0}   color={colors.info} />
        <StatCard icon="📊" label="Taux d'occupation" value={`${dashboard?.taux_occupation ?? 0}%`} color={colors.bleu}
          sub={`${dashboard?.chambres_occupees ?? 0}/${dashboard?.chambres_total ?? 0} chambres`} />
        <StatCard icon="💰" label="Revenus du mois" value={`${fmtN(dashboard?.revenus_mois ?? 0)} F`} color={colors.success} />
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: `2px solid ${colors.gray200}` }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 22px', fontSize: 13, fontWeight: 700,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === i ? colors.bleu : colors.gray500,
            borderBottom: tab === i ? `2px solid ${colors.bleu}` : '2px solid transparent',
            marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* ── Contenu ── */}
      <div style={{ background: colors.white, borderRadius: `0 0 ${radius.md} ${radius.md}`, padding: 20, boxShadow: shadows.sm }}>

        {/* ════ TAB CHAMBRES ════ */}
        {tab === 0 && (
          <>
            {/* Barre outils */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={searchCh} onChange={e => setSearchCh(e.target.value)} placeholder="🔍 Rechercher…"
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 12px', fontSize: 13, outline: 'none', width: 200 }} />
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                <option value="">Tous les statuts</option>
                {['Disponible', 'Occupée', 'Maintenance', 'À nettoyer'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                <option value="">Tous les types</option>
                {['Standard', 'VIP', 'Réanimation', 'Maternité', 'Pédiatrie', 'Urgence'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ marginLeft: 'auto' }}>
                <Btn onClick={() => { setSelectedChambre(null); setModalChambre(true) }}>➕ Nouvelle chambre</Btn>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>⏳ Chargement…</div>
            ) : chambres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏨</div>
                <div style={{ fontWeight: 600 }}>Aucune chambre trouvée</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {chambres.map(ch => (
                  <ChambreCard key={ch.id_chambre} chambre={ch}
                    onEdit={(c)          => { setSelectedChambre(c); setModalChambre(true) }}
                    onAdmettre={(c)      => { setSelectedChambre(c); setModalAdmission(true) }}
                    onPropre={(c)        => handlePropre(c)}
                    onEquipements={(c)   => { setSelectedChambre(c); setModalEquip(true) }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ════ TAB HOSPITALISATIONS EN COURS ════ */}
        {tab === 1 && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
              <input value={searchH} onChange={e => setSearchH(e.target.value)} placeholder="🔍 Rechercher patient…"
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 12px', fontSize: 13, outline: 'none', width: 220 }} />
              <span style={{ fontSize: 12, color: colors.gray500 }}>{hosp.length} hospitalisation(s) en cours</span>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>⏳ Chargement…</div>
            : hosp.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🛏</div>
                <div style={{ fontWeight: 600 }}>Aucune hospitalisation en cours</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Patient</th>
                      <th style={thStyle}>Chambre</th>
                      <th style={thStyle}>Date entrée</th>
                      <th style={thStyle}>Sortie prévue</th>
                      <th style={thStyle}>Jours</th>
                      <th style={thStyle}>Montant prévi.</th>
                      <th style={thStyle}>Motif</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosp.map((h, i) => {
                      const patient  = h.patient
                      const nom      = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()
                      const d1       = new Date(h.date_entree)
                      const d2       = h.date_sortie_prevue ? new Date(h.date_sortie_prevue) : new Date()
                      const jours    = Math.max(1, Math.round((d2 - d1) / 86400000))
                      const montant  = jours * parseFloat(h.chambre?.prix_journalier ?? 0)
                      return (
                        <tr key={h.id_hospitalisation}>
                          <td style={tdStyle(i)}>
                            <div style={{ fontWeight: 700, color: colors.bleu }}>{nom}</div>
                            <div style={{ fontSize: 11, color: colors.gray500 }}>{patient?.patient_id}</div>
                          </td>
                          <td style={tdStyle(i)}>
                            <span style={{ fontWeight: 600 }}>{h.chambre?.code_chambre}</span>
                            <div style={{ fontSize: 11, color: colors.gray500 }}>{h.chambre?.type}</div>
                          </td>
                          <td style={tdStyle(i)}>{fmtDate(h.date_entree)}</td>
                          <td style={tdStyle(i)}>{fmtDate(h.date_sortie_prevue)}</td>
                          <td style={{ ...tdStyle(i), fontWeight: 700, color: colors.bleu, textAlign: 'center' }}>{jours}j</td>
                          <td style={{ ...tdStyle(i), fontWeight: 700, textAlign: 'right' }}>{fmtN(montant)} F</td>
                          <td style={{ ...tdStyle(i), maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.gray600 }}>
                            {h.motif || '—'}
                          </td>
                          <td style={{ ...tdStyle(i), textAlign: 'center' }}>
                            <Btn small color={colors.warning} onClick={() => { setSelectedHosp(h); setModalSortie(true) }}>
                              🚪 Sortie
                            </Btn>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ════ TAB HISTORIQUE ════ */}
        {tab === 2 && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={searchH} onChange={e => setSearchH(e.target.value)} placeholder="🔍 Rechercher…"
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 12px', fontSize: 13, outline: 'none', width: 220 }} />
              <select value={filterHStatut} onChange={e => { setFilterHStatut(e.target.value); loadHosp() }}
                style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                <option value="">Tous</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>⏳ Chargement…</div>
            : hosp.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 600 }}>Aucun historique</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Patient</th>
                      <th style={thStyle}>Chambre</th>
                      <th style={thStyle}>Entrée</th>
                      <th style={thStyle}>Sortie</th>
                      <th style={thStyle}>Jours</th>
                      <th style={thStyle}>Montant</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Statut</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosp.map((h, i) => {
                      const patient = h.patient
                      const nom     = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()
                      const SC      = { 'En cours': colors.warning, 'Terminée': colors.success, 'Annulée': colors.danger }
                      const PC      = { 'EN_ATTENTE': colors.warning, 'PARTIEL': colors.info, 'PAYE': colors.success }
                      return (
                        <tr key={h.id_hospitalisation}>
                          <td style={tdStyle(i)}>
                            <div style={{ fontWeight: 700 }}>{nom}</div>
                            <div style={{ fontSize: 11, color: colors.gray500 }}>{patient?.patient_id}</div>
                          </td>
                          <td style={tdStyle(i)}>{h.chambre?.code_chambre} <span style={{ fontSize: 11, color: colors.gray500 }}>({h.chambre?.type})</span></td>
                          <td style={tdStyle(i)}>{fmtDate(h.date_entree)}</td>
                          <td style={tdStyle(i)}>{fmtDate(h.date_sortie_reelle ?? h.date_sortie_prevue)}</td>
                          <td style={{ ...tdStyle(i), textAlign: 'center', fontWeight: 700 }}>{h.nb_jours ?? '—'}</td>
                          <td style={{ ...tdStyle(i), textAlign: 'right', fontWeight: 700 }}>{fmtN(h.facture?.montant_total ?? h.montant_total ?? 0)} F</td>
                          <td style={{ ...tdStyle(i), textAlign: 'center' }}>
                            <span style={{ background: `${SC[h.statut] ?? colors.gray500}20`, color: SC[h.statut] ?? colors.gray500, borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                              {h.statut}
                            </span>
                          </td>
                          <td style={{ ...tdStyle(i), textAlign: 'center' }}>
                            {h.facture ? (
                              <span style={{ background: `${PC[h.facture.statut_paiement] ?? colors.gray400}20`, color: PC[h.facture.statut_paiement] ?? colors.gray600, borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                                {h.facture.statut_paiement}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modaux ── */}
      <ChambreModal open={modalChambre} onClose={() => setModalChambre(false)} chambre={selectedChambre} onSaved={reload} />

      <AdmissionModal open={modalAdmission} onClose={() => setModalAdmission(false)} chambre={selectedChambre} onSaved={reload} />

      <SortieModal open={modalSortie} onClose={() => setModalSortie(false)} hospitalisation={selectedHosp} onSaved={reload} />

      {selectedChambre && (
        <EquipementsModal open={modalEquip} onClose={() => setModalEquip(false)} chambre={selectedChambre} onSaved={() => { reload(); chambreApi.detail(selectedChambre.id_chambre).then(r => setSelectedChambre(r.data?.data)) }} />
      )}
    </div>
  )
}
