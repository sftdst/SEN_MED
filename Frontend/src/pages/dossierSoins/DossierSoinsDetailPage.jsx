import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { colors, radius, shadows } from '../../theme'
import api from '../../api/axios'

// ─── Constantes ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'admin',         label: 'Fiche Admin',     icon: '📋' },
  { id: 'traitements',   label: 'Traitements',     icon: '💊' },
  { id: 'diagramme',     label: 'Diagramme',       icon: '🗓' },
  { id: 'transmissions', label: 'Transmissions',   icon: '📝' },
  { id: 'plaie',         label: 'Plaie Chronique', icon: '🩹' },
  { id: 'diabete',       label: 'Diabète',         icon: '🩸' },
  { id: 'echelles',      label: 'Échelles',        icon: '📊' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const today = () => new Date().toISOString().slice(0, 10)
const inputSt = {
  padding: '8px 11px', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.md,
  fontSize: 13, color: colors.gray900, background: colors.white, outline: 'none',
  fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s',
}
const textareaSt = { ...inputSt, resize: 'vertical', minHeight: 80 }
const btnOrange = {
  background: colors.orange, color: '#fff', border: 'none', borderRadius: radius.md,
  padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnBlue = {
  background: colors.bleu, color: '#fff', border: 'none', borderRadius: radius.md,
  padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnGray = {
  background: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`,
  borderRadius: radius.md, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const [bg, border, text] = type === 'error'
    ? [colors.dangerBg, colors.danger, colors.danger]
    : [colors.successBg, colors.success, colors.success]
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, border: `1.5px solid ${border}`, color: text,
      borderRadius: radius.md, padding: '11px 18px', fontSize: 13, fontWeight: 600,
      boxShadow: shadows.lg, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{type === 'error' ? '✕' : '✓'}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, fontSize: 16, marginLeft: 4 }}>×</button>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.bleu, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 3, height: 16, background: colors.orange, borderRadius: 2 }} />
        {children}
      </h3>
      {action}
    </div>
  )
}

// ─── Badge Statut ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const cfg = statut === 'termine'
    ? { bg: colors.successBg, color: colors.success, label: 'Terminé' }
    : { bg: colors.infoBg, color: colors.info, label: 'En cours' }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, borderRadius: radius.full,
      padding: '3px 12px', fontSize: 12, fontWeight: 700,
    }}>{cfg.label}</span>
  )
}

// ─── Onglet 1: Fiche Administrative ──────────────────────────────────────────
function TabAdmin({ dossier, dossierId, showToast }) {
  const patient = dossier?.patient || {}
  const [editContacts, setEditContacts] = useState(false)
  const [contacts, setContacts] = useState([
    { nom: '', qualite: '', telephone: '', ordre: 1 },
    { nom: '', qualite: '', telephone: '', ordre: 2 },
  ])
  const [intervenants, setIntervenants] = useState([])
  const [savingContacts, setSavingContacts] = useState(false)
  const [savingIntervenants, setSavingIntervenants] = useState(false)

  const TYPES_INTERVENANTS = [
    'Médecin traitant', 'Infirmière(s)', 'Kinésithérapeute', 'Pharmacie',
    'Laboratoire', 'Spécialiste / Service hospitalier', 'Autre',
  ]

  useEffect(() => {
    if (dossier?.contacts?.length) {
      const c = [1, 2].map(o => dossier.contacts.find(x => x.ordre === o) || { nom: '', qualite: '', telephone: '', ordre: o })
      setContacts(c)
    }
    if (dossier?.intervenants?.length) {
      setIntervenants(dossier.intervenants)
    } else {
      setIntervenants(TYPES_INTERVENANTS.map((type, i) => ({ id: i, type, nom: '', telephone: '', cabinet: '' })))
    }
  }, [dossier])

  const saveContacts = async () => {
    setSavingContacts(true)
    try {
      await api.put(`/nursing-dossiers/${dossierId}/contacts`, contacts)
      showToast('Contacts enregistrés')
      setEditContacts(false)
    } catch { showToast('Erreur', 'error') }
    finally { setSavingContacts(false) }
  }

  const saveIntervenants = async () => {
    setSavingIntervenants(true)
    try {
      await api.put(`/nursing-dossiers/${dossierId}/intervenants`, intervenants)
      showToast('Intervenants enregistrés')
    } catch { showToast('Erreur', 'error') }
    finally { setSavingIntervenants(false) }
  }

  const updateIntervenant = (idx, field, value) => {
    setIntervenants(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const infoField = (label, value) => (
    <div style={{
      background: colors.gray50, borderRadius: radius.md, padding: '12px 16px',
      border: `1px solid ${colors.gray200}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray900 }}>{value || '—'}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Patient */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Informations Patient</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {infoField('Nom complet', [patient.first_name, patient.second_name, patient.last_name].filter(Boolean).join(' '))}
          {infoField('N° Patient', patient.patient_code || patient.patient_id)}
          {infoField('Date de naissance', fmt(patient.dob))}
          {infoField('Sexe', patient.gender_id === 'M' ? 'Masculin' : patient.gender_id === 'F' ? 'Féminin' : patient.gender_id || '—')}
          {infoField('Situation maritale', patient.marital_name)}
          {infoField('Nationalité', patient.nationality_id)}
          {infoField('Profession', patient.profession)}
          {infoField('Téléphone', patient.contact_number)}
          {infoField('Mobile', patient.mobile_number)}
          {infoField('Adresse', [patient.address, patient.address2, patient.city].filter(Boolean).join(', '))}
          {infoField('N° Sécurité Sociale', patient.ssn_no)}
          {infoField('Contact urgence', patient.emergency_contact_name)}
          {infoField('Tél. urgence', patient.emergency_contact_number)}
        </div>
      </div>

      {/* Contacts d'urgence */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle action={
          !editContacts
            ? <button onClick={() => setEditContacts(true)} style={{ ...btnGray, padding: '6px 14px', fontSize: 12 }}>✏️ Modifier</button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditContacts(false)} style={{ ...btnGray, padding: '6px 14px', fontSize: 12 }}>Annuler</button>
                <button onClick={saveContacts} disabled={savingContacts} style={{ ...btnOrange, padding: '6px 14px', fontSize: 12 }}>
                  {savingContacts ? '...' : 'Enregistrer'}
                </button>
              </div>
        }>Contacts d'urgence</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{
              border: `1.5px solid ${colors.gray200}`, borderRadius: radius.md, padding: 16,
              background: colors.gray50,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.bleuMuted, marginBottom: 12 }}>Contact {i + 1}</div>
              {editContacts ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Nom" value={c.nom} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, nom: e.target.value } : x))} style={inputSt} />
                  <input placeholder="Qualité / Lien" value={c.qualite} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, qualite: e.target.value } : x))} style={inputSt} />
                  <input placeholder="Téléphone" value={c.telephone} onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, telephone: e.target.value } : x))} style={inputSt} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray900 }}>{c.nom || '—'}</div>
                  <div style={{ fontSize: 12, color: colors.gray600 }}>{c.qualite || '—'}</div>
                  <div style={{ fontSize: 13, color: colors.bleu, fontWeight: 500 }}>{c.telephone || '—'}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intervenants */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle action={
          <button onClick={saveIntervenants} disabled={savingIntervenants} style={{ ...btnOrange, padding: '6px 16px', fontSize: 12 }}>
            {savingIntervenants ? '...' : '💾 Sauvegarder'}
          </button>
        }>Intervenants</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                {['Type', 'Nom', 'Téléphone', 'Cabinet'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {intervenants.map((iv, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: colors.bleu, whiteSpace: 'nowrap' }}>{iv.type}</td>
                  <td style={{ padding: '6px 12px' }}><input value={iv.nom} onChange={e => updateIntervenant(idx, 'nom', e.target.value)} placeholder="—" style={{ ...inputSt, fontSize: 12 }} /></td>
                  <td style={{ padding: '6px 12px' }}><input value={iv.telephone} onChange={e => updateIntervenant(idx, 'telephone', e.target.value)} placeholder="—" style={{ ...inputSt, fontSize: 12 }} /></td>
                  <td style={{ padding: '6px 12px' }}><input value={iv.cabinet} onChange={e => updateIntervenant(idx, 'cabinet', e.target.value)} placeholder="—" style={{ ...inputSt, fontSize: 12 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Autocomplete médicament (dropdown en position:fixed pour éviter le clipping) ─
function MedicamentAutocomplete({ value, onSelect, onClear, disabled }) {
  const [query, setQuery]       = useState(value || '')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(!!value)
  const [dropPos, setDropPos]   = useState({ top: 0, left: 0, width: 0 })
  const timerRef   = React.useRef(null)
  const inputRef   = React.useRef(null)

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.closest('[data-med-wrap]')?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reposionner si scroll/resize
  useEffect(() => {
    if (!open) return
    const reposition = () => {
      if (!inputRef.current) return
      const r = inputRef.current.getBoundingClientRect()
      // Choisir d'afficher au-dessus si pas assez de place en dessous
      const spaceBelow = window.innerHeight - r.bottom
      const spaceAbove = r.top
      const dropH = Math.min(results.length * 58, 280)
      const showAbove = spaceBelow < dropH + 8 && spaceAbove > dropH + 8
      setDropPos({
        top:    showAbove ? r.top - dropH - 4 : r.bottom + 2,
        left:   r.left,
        width:  r.width,
        above:  showAbove,
      })
    }
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => { window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition) }
  }, [open, results.length])

  useEffect(() => { setQuery(value || ''); setSelected(!!value) }, [value])

  const openDropdown = () => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setDropPos({ top: r.bottom + 2, left: r.left, width: r.width })
  }

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setSelected(false)
    if (onClear) onClear()
    clearTimeout(timerRef.current)
    if (q.length < 3) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      openDropdown()
      try {
        const res = await api.get('/pharmacie/items', { params: { q, limit: 12 } })
        const items = res.data?.data || []
        setResults(items)
        setOpen(items.length > 0)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }

  const handleSelect = (item) => {
    setQuery(item.description)
    setSelected(true)
    setOpen(false)
    setResults([])
    if (onSelect) onSelect(item)
  }

  const handleClear = () => {
    setQuery('')
    setSelected(false)
    setResults([])
    setOpen(false)
    if (onClear) onClear()
    inputRef.current?.focus()
  }

  const fmtPrix = (p) => p ? Number(p).toLocaleString('fr-FR') + ' FCFA' : ''

  return (
    <div data-med-wrap="1" style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Saisir ≥ 3 lettres du médicament..."
          autoComplete="off"
          style={{
            ...inputSt,
            paddingRight: 34,
            borderColor: selected ? '#16a34a' : open ? colors.bleu : colors.gray300,
            textDecoration: disabled ? 'line-through' : 'none',
            color: disabled ? colors.gray500 : selected ? '#0f6b35' : colors.gray900,
            background: selected ? '#f0fdf4' : disabled ? colors.gray50 : colors.white,
            transition: 'border-color .15s, background .15s',
          }}
        />
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: selected && !disabled ? 'auto' : 'none', cursor: 'pointer' }}>
          {loading
            ? <span style={{ fontSize: 12, color: colors.gray400, animation: 'spin 1s linear infinite' }}>⟳</span>
            : selected
              ? <span onClick={handleClear} style={{ fontSize: 16, color: colors.gray400, lineHeight: 1 }}>×</span>
              : query.length >= 3
                ? <span style={{ fontSize: 12, color: colors.gray400 }}>🔍</span>
                : <span style={{ fontSize: 12, color: colors.gray300 }}>💊</span>
          }
        </span>
      </div>

      {/* Dropdown rendu hors du overflow via position:fixed */}
      {open && results.length > 0 && (
        <div style={{
          position: 'fixed',
          top:   dropPos.top,
          left:  dropPos.left,
          width: dropPos.width,
          zIndex: 99999,
          background: '#fff',
          borderRadius: radius.lg,
          boxShadow: '0 12px 32px rgba(0,0,0,.18)',
          border: `2px solid ${colors.bleu}`,
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '6px 12px', background: colors.bleu, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: `${radius.lg} ${radius.lg} 0 0`, display: 'flex', alignItems: 'center', gap: 6 }}>
            💊 {results.length} médicament{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </div>
          {results.map((item, idx) => (
            <div key={item.id_Rep || idx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                borderBottom: idx < results.length - 1 ? `1px solid ${colors.gray100}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
                <div style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>
                  {[item.posologie, item.voie_administration].filter(Boolean).join(' · ') || item.item_id}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {item.PrixVente > 0
                  ? <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: radius.full, padding: '3px 10px', fontSize: 12, fontWeight: 700, display: 'block', whiteSpace: 'nowrap' }}>
                      {fmtPrix(item.PrixVente)}
                    </span>
                  : <span style={{ fontSize: 11, color: colors.gray400 }}>Prix libre</span>
                }
                <div style={{ fontSize: 10, color: colors.gray400, marginTop: 2 }}>{item.item_id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Onglet 2: Traitements ────────────────────────────────────────────────────
function TabTraitements({ dossier, dossierId, showToast }) {
  const [treatments, setTreatments] = useState([])
  const [saving, setSaving]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (dossier?.treatments) setTreatments(dossier.treatments)
  }, [dossier])

  const emptyRow = () => ({
    _new: true, _key: Date.now(),
    date_debut: today(), date_fin: '', arret: false,
    designation: '', item_id: '', item_ref: '', quantite: 1,
    prix_unitaire: 0, prix_total: 0, posologie: '',
    matin: false, midi: false, soir: false, nuit: false,
  })

  const addRow = () => setTreatments(prev => [...prev, emptyRow()])

  const update = (i, field, value) =>
    setTreatments(prev => prev.map((t, j) => j === i ? { ...t, [field]: value } : t))

  const selectMed = (i, item) =>
    setTreatments(prev => prev.map((t, j) => j === i ? {
      ...t,
      designation:   item.description,
      item_id:       item.item_id,
      item_ref:      String(item.id_Rep),
      prix_unitaire: item.PrixVente || 0,
      prix_total:    (item.PrixVente || 0) * (t.quantite || 1),
      posologie:     item.posologie || '',
    } : t))

  const clearMed = (i) =>
    setTreatments(prev => prev.map((t, j) => j === i ? {
      ...t, designation: '', item_id: '', item_ref: '', prix_unitaire: 0, prix_total: 0, posologie: '',
    } : t))

  const updateQty = (i, qty) =>
    setTreatments(prev => prev.map((t, j) => j === i ? {
      ...t, quantite: qty, prix_total: (t.prix_unitaire || 0) * qty,
    } : t))

  const saveRow = async (t, i) => {
    if (!t.designation?.trim()) { showToast('Veuillez saisir ou sélectionner un médicament', 'error'); return }
    setSaving(i)
    try {
      const payload = {
        designation: t.designation, item_id: t.item_id || null, item_ref: t.item_ref || null,
        quantite: t.quantite || 1, prix_unitaire: t.prix_unitaire || 0, posologie: t.posologie || '',
        date_debut: t.date_debut, date_fin: t.date_fin || null,
        arret: t.arret, matin: t.matin, midi: t.midi, soir: t.soir, nuit: t.nuit,
      }
      if (t._new) {
        const res = await api.post(`/nursing-dossiers/${dossierId}/treatments`, payload)
        const saved = res.data?.data || res.data
        setTreatments(prev => prev.map((x, j) => j === i ? { ...x, ...saved, _new: undefined } : x))
        const prix = saved?.prix_total || 0
        showToast(prix > 0 ? `Traitement enregistré — ${Number(prix).toLocaleString('fr-FR')} FCFA facturé` : 'Traitement enregistré')
      } else {
        const res = await api.put(`/nursing-dossiers/${dossierId}/treatments/${t.id}`, payload)
        const saved = res.data?.data || res.data
        setTreatments(prev => prev.map((x, j) => j === i ? { ...x, ...saved } : x))
        showToast('Traitement mis à jour')
      }
    } catch { showToast('Erreur lors de la sauvegarde', 'error') }
    finally { setSaving(null) }
  }

  const deleteRow = async (t, i) => {
    if (t._new) { setTreatments(prev => prev.filter((_, j) => j !== i)); return }
    if (!window.confirm('Supprimer ce traitement ?' + (t.facturation_id ? '\n⚠ La ligne de facturation sera aussi annulée.' : ''))) return
    setDeleting(i)
    try {
      await api.delete(`/nursing-dossiers/${dossierId}/treatments/${t.id}`)
      setTreatments(prev => prev.filter((_, j) => j !== i))
      showToast('Traitement supprimé')
    } catch { showToast('Erreur', 'error') }
    finally { setDeleting(null) }
  }

  // Checkbox stylisée
  const Pill = ({ label, checked, onChange, color }) => (
    <button type="button" onClick={onChange} style={{
      padding: '4px 10px', borderRadius: radius.full, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
      background: checked ? color : colors.gray100, color: checked ? '#fff' : colors.gray500,
      transition: 'all .15s', outline: 'none',
    }}>{label}</button>
  )

  const totalFacture = treatments.reduce((acc, t) => acc + ((t.prix_unitaire || 0) * (t.quantite || 1)), 0)

  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.bleu }}>
            💊 Fiche de Traitement — {dossier?.patient?.first_name} {dossier?.patient?.last_name}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: colors.gray500 }}>
            Élaborée le {fmt(dossier?.date_debut)} · Les médicaments sélectionnés sont facturés automatiquement
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {totalFacture > 0 && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: radius.md, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>💰</span>
              <div>
                <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, lineHeight: 1 }}>Total facturé</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', lineHeight: 1.4 }}>{totalFacture.toLocaleString('fr-FR')} FCFA</div>
              </div>
            </div>
          )}
          <button onClick={addRow} style={{ ...btnOrange, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Ajouter un traitement
          </button>
        </div>
      </div>

      {/* Liste des traitements en cards */}
      {treatments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: colors.gray400, fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
          Aucun traitement. Cliquez sur "+ Ajouter un traitement".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {treatments.map((t, i) => {
            const stopped   = t.arret
            const hasFac    = !!t.facturation_id && !t._new
            const prixTotal = (t.prix_unitaire || 0) * (t.quantite || 1)
            return (
              <div key={t.id || t._key} style={{
                border: `1.5px solid ${stopped ? colors.gray200 : hasFac ? '#bbf7d0' : colors.gray200}`,
                borderLeft: `4px solid ${stopped ? colors.danger : hasFac ? '#16a34a' : colors.bleu}`,
                borderRadius: radius.md,
                background: stopped ? '#fafafa' : hasFac ? '#f9fff9' : '#fff',
                opacity: stopped ? .75 : 1,
                padding: '12px 16px',
                transition: 'box-shadow .15s',
              }}>

                {/* Ligne 1 : Médicament (principale) */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  {/* Autocomplete — prend tout l'espace disponible */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                      Médicament / Traitement
                    </label>
                    <MedicamentAutocomplete
                      value={t.designation || ''}
                      disabled={stopped}
                      onSelect={(item) => selectMed(i, item)}
                      onClear={() => clearMed(i)}
                    />
                    {hasFac && (
                      <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 3, display: 'inline-block' }}>✓ Ligne facture créée</span>
                    )}
                  </div>

                  {/* Posologie */}
                  <div style={{ width: 150, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>Posologie</label>
                    <input value={t.posologie || ''} onChange={e => update(i, 'posologie', e.target.value)}
                      placeholder="1 cp matin..." style={{ ...inputSt, fontSize: 12 }} />
                  </div>

                  {/* Qté */}
                  <div style={{ width: 70, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>Qté</label>
                    <input type="number" min={1} value={t.quantite || 1}
                      onChange={e => updateQty(i, Math.max(1, +e.target.value))}
                      style={{ ...inputSt, fontSize: 13, textAlign: 'center', fontWeight: 700 }} />
                  </div>

                  {/* Prix */}
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>Prix unitaire</label>
                    <div style={{ ...inputSt, fontSize: 12, color: prixTotal > 0 ? '#15803d' : colors.gray400, fontWeight: prixTotal > 0 ? 700 : 400, background: '#f9fafb', cursor: 'default' }}>
                      {t.prix_unitaire > 0 ? Number(t.prix_unitaire).toLocaleString('fr-FR') + ' FCFA' : 'Gratuit'}
                    </div>
                  </div>

                  {/* Total */}
                  {prixTotal > 0 && (
                    <div style={{ width: 130, flexShrink: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>Total</label>
                      <div style={{ background: '#dcfce7', color: '#15803d', borderRadius: radius.md, padding: '8px 11px', fontSize: 13, fontWeight: 800, textAlign: 'right' }}>
                        {Number(prixTotal).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  )}
                </div>

                {/* Ligne 2 : Dates + Prises + Actions */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Date début */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '.4px' }}>Début</label>
                    <input type="date" value={t.date_debut || ''} onChange={e => update(i, 'date_debut', e.target.value)}
                      style={{ ...inputSt, fontSize: 12, width: 132 }} />
                  </div>

                  {/* Date fin */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '.4px' }}>Fin</label>
                    <input type="date" value={t.date_fin || ''} onChange={e => update(i, 'date_fin', e.target.value)}
                      style={{ ...inputSt, fontSize: 12, width: 132 }} />
                  </div>

                  {/* Séparateur */}
                  <div style={{ width: 1, height: 36, background: colors.gray200, flexShrink: 0 }} />

                  {/* Prises en pill-buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '.4px' }}>Prises</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['matin', 'Matin'], ['midi', 'Midi'], ['soir', 'Soir'], ['nuit', 'Nuit']].map(([field, label]) => (
                        <Pill key={field} label={label} checked={!!t[field]}
                          onChange={() => update(i, field, !t[field])} color={colors.orange} />
                      ))}
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div style={{ width: 1, height: 36, background: colors.gray200, flexShrink: 0 }} />

                  {/* Arrêt toggle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '.4px' }}>Arrêt</label>
                    <Pill label={stopped ? '⛔ Arrêté' : 'Actif'} checked={stopped}
                      onChange={() => update(i, 'arret', !stopped)} color={colors.danger} />
                  </div>

                  {/* Spacer push actions à droite */}
                  <div style={{ flex: 1 }} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveRow(t, i)} disabled={saving === i}
                      style={{ ...btnOrange, padding: '7px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: saving === i ? .6 : 1 }}>
                      {saving === i ? '⏳ Enreg...' : '💾 Enregistrer'}
                    </button>
                    <button onClick={() => deleteRow(t, i)} disabled={deleting === i}
                      style={{ background: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.danger}20`, borderRadius: radius.md, padding: '7px 12px', fontSize: 12, cursor: 'pointer', opacity: deleting === i ? .6 : 1 }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Onglet 3: Diagramme de Soins ─────────────────────────────────────────────
const SOINS_ROLE_PROPRE = ['Toilette', 'Change', 'Prévention d\'escarres', 'Douche', 'Shampooing', 'Bain de pieds', 'Selles']
const PERIODES_RP = ['Matin', 'Soir']
const PERIODES_PRESC = ['8h', '12h', '16h', '19h']

function TabDiagramme({ dossierId, showToast }) {
  const [date, setDate] = useState(today())
  const [diagram, setDiagram] = useState({})
  const [prescSoins, setPrescSoins] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchDiagram = useCallback(async () => {
    if (!date) return
    setLoading(true)
    try {
      const res = await api.get(`/nursing-dossiers/${dossierId}/care-diagram`, { params: { date } })
      const data = res.data?.data || res.data || {}
      setDiagram(data.records || {})
      if (data.prescription_soins?.length) setPrescSoins(data.prescription_soins)
    } catch { /* silence — nouvelle journée */ }
    finally { setLoading(false) }
  }, [dossierId, date])

  useEffect(() => { fetchDiagram() }, [fetchDiagram])

  const isChecked = (category, label, periode) => {
    const key = `${category}|${label}|${periode}`
    return !!diagram[key]
  }

  const toggle = async (category, label, periode) => {
    const key = `${category}|${label}|${periode}`
    const newVal = !diagram[key]
    setDiagram(prev => ({ ...prev, [key]: newVal }))
    setSaving(true)
    try {
      await api.post(`/nursing-dossiers/${dossierId}/care-records`, {
        date_soin: date, soin_category: category, soin_label: label,
        periode, realise: newVal,
      })
    } catch { setDiagram(prev => ({ ...prev, [key]: !newVal })); showToast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const addPrescSoin = () => setPrescSoins(prev => [...prev, { label: '', id: Date.now() }])
  const updatePrescSoin = (idx, val) => setPrescSoins(prev => prev.map((s, i) => i === idx ? { ...s, label: val } : s))

  const CheckSquare = ({ checked, onToggle }) => (
    <div onClick={onToggle} style={{
      width: 30, height: 30, margin: '0 auto', borderRadius: radius.sm, cursor: 'pointer',
      background: checked ? colors.success : colors.white,
      border: `2px solid ${checked ? colors.success : colors.gray300}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: checked ? '#fff' : 'transparent', fontSize: 15, fontWeight: 700,
      transition: 'all .15s',
    }}>✓</div>
  )

  const thStyle = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '.4px', textAlign: 'center', background: colors.gray50 }
  const tdStyle = { padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${colors.gray100}` }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sélecteur de date */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: '16px 24px', boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: colors.gray700 }}>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ ...inputSt, width: 180 }} />
        {loading && <span style={{ fontSize: 12, color: colors.gray500 }}>Chargement...</span>}
        {saving && <span style={{ fontSize: 12, color: colors.orange }}>Enregistrement...</span>}
      </div>

      {/* Soins Rôle Propre */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Soins Rôle Propre</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.gray200}` }}>
                <th style={{ ...thStyle, textAlign: 'left', width: '60%' }}>Soin</th>
                {PERIODES_RP.map(p => <th key={p} style={thStyle}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {SOINS_ROLE_PROPRE.map(soin => (
                <tr key={soin} style={{ borderBottom: `1px solid ${colors.gray100}` }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: colors.gray800, fontWeight: 500 }}>{soin}</td>
                  {PERIODES_RP.map(p => (
                    <td key={p} style={tdStyle}>
                      <CheckSquare checked={isChecked('role_propre', soin, p)} onToggle={() => toggle('role_propre', soin, p)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Soins sur Prescription */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle action={
          <button onClick={addPrescSoin} style={{ ...btnOrange, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>+</span> Ajouter un soin
          </button>
        }>Soins sur Prescription</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.gray200}` }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Soin</th>
                {PERIODES_PRESC.map(p => <th key={p} style={thStyle}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {prescSoins.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: colors.gray500, fontSize: 13 }}>
                  Cliquez sur "+ Ajouter un soin" pour commencer
                </td></tr>
              )}
              {prescSoins.map((soin, idx) => (
                <tr key={soin.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '6px 12px' }}>
                    <input value={soin.label} onChange={e => updatePrescSoin(idx, e.target.value)}
                      placeholder="Nom du soin..." style={{ ...inputSt, fontSize: 12 }} />
                  </td>
                  {PERIODES_PRESC.map(p => (
                    <td key={p} style={tdStyle}>
                      {soin.label
                        ? <CheckSquare checked={isChecked('prescription', soin.label, p)} onToggle={() => soin.label && toggle('prescription', soin.label, p)} />
                        : <div style={{ width: 30, height: 30, margin: '0 auto', borderRadius: radius.sm, background: colors.gray100, border: `2px solid ${colors.gray200}` }} />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Onglet 4: Transmissions ──────────────────────────────────────────────────
function TabTransmissions({ dossier, dossierId, showToast }) {
  const [subTab, setSubTab] = useState('observations')
  const [observations, setObservations] = useState([])
  const [dars, setDars] = useState([])
  const [newObs, setNewObs] = useState({ date_transmission: today(), contenu: '' })
  const [newDar, setNewDar] = useState({ date_transmission: today(), cible: '', D: '', A: '', R: '' })
  const [showObsForm, setShowObsForm] = useState(false)
  const [showDarForm, setShowDarForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const trans = dossier?.transmissions || []
    setObservations(trans.filter(t => t.type_transmission === 'observation').sort((a, b) => new Date(b.date_transmission) - new Date(a.date_transmission)))
    const darItems = trans.filter(t => t.type_transmission === 'dar')
    setDars(darItems)
  }, [dossier])

  const saveObs = async () => {
    if (!newObs.contenu.trim()) { showToast('Veuillez saisir l\'observation', 'error'); return }
    setSaving(true)
    try {
      const res = await api.post(`/nursing-dossiers/${dossierId}/transmissions`, { ...newObs, type_transmission: 'observation' })
      setObservations(prev => [res.data.data || res.data, ...prev])
      setNewObs({ date_transmission: today(), contenu: '' })
      setShowObsForm(false)
      showToast('Observation enregistrée')
    } catch { showToast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const saveDar = async () => {
    if (!newDar.cible) { showToast('Veuillez saisir la cible', 'error'); return }
    setSaving(true)
    try {
      const proms = []
      if (newDar.D) proms.push(api.post(`/nursing-dossiers/${dossierId}/transmissions`, { date_transmission: newDar.date_transmission, cible: newDar.cible, type_transmission: 'dar', dar_category: 'D', contenu: newDar.D }))
      if (newDar.A) proms.push(api.post(`/nursing-dossiers/${dossierId}/transmissions`, { date_transmission: newDar.date_transmission, cible: newDar.cible, type_transmission: 'dar', dar_category: 'A', contenu: newDar.A }))
      if (newDar.R) proms.push(api.post(`/nursing-dossiers/${dossierId}/transmissions`, { date_transmission: newDar.date_transmission, cible: newDar.cible, type_transmission: 'dar', dar_category: 'R', contenu: newDar.R }))
      const results = await Promise.all(proms)
      const newItems = results.map(r => r.data?.data || r.data)
      setDars(prev => [...prev, ...newItems])
      setNewDar({ date_transmission: today(), cible: '', D: '', A: '', R: '' })
      setShowDarForm(false)
      showToast('Transmission ciblée enregistrée')
    } catch { showToast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const deleteObs = async (obs) => {
    if (!window.confirm('Supprimer cette observation ?')) return
    try {
      await api.delete(`/nursing-dossiers/${dossierId}/transmissions/${obs.id}`)
      setObservations(prev => prev.filter(o => o.id !== obs.id))
      showToast('Supprimé')
    } catch { showToast('Erreur', 'error') }
  }

  // Grouper les DARs par cible
  const darsByCible = dars.reduce((acc, d) => {
    const key = `${d.date_transmission}|${d.cible}`
    if (!acc[key]) acc[key] = { cible: d.cible, date: d.date_transmission, items: [] }
    acc[key].items.push(d)
    return acc
  }, {})

  const DAR_COLORS = { D: colors.info, A: colors.orange, R: colors.success }
  const DAR_LABELS = { D: 'Données', A: 'Actions', R: 'Résultats' }

  const subTabStyle = (active) => ({
    padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? colors.bleu : 'transparent',
    color: active ? '#fff' : colors.gray600,
    border: 'none', borderRadius: radius.md, transition: 'all .15s',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: colors.gray100, borderRadius: radius.md, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setSubTab('observations')} style={subTabStyle(subTab === 'observations')}>Observations</button>
        <button onClick={() => setSubTab('dar')} style={subTabStyle(subTab === 'dar')}>Transmissions Ciblées (DAR)</button>
      </div>

      {subTab === 'observations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowObsForm(v => !v)} style={btnOrange}>+ Nouvelle observation</button>
          </div>

          {showObsForm && (
            <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Date</label>
                  <input type="date" value={newObs.date_transmission} onChange={e => setNewObs(p => ({ ...p, date_transmission: e.target.value }))} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Observation</label>
                  <textarea value={newObs.contenu} onChange={e => setNewObs(p => ({ ...p, contenu: e.target.value }))} placeholder="Saisir l'observation..." style={textareaSt} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowObsForm(false)} style={btnGray}>Annuler</button>
                <button onClick={saveObs} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>{saving ? '...' : 'Enregistrer'}</button>
              </div>
            </div>
          )}

          {observations.length === 0 && !showObsForm && (
            <div style={{ textAlign: 'center', padding: 40, color: colors.gray500, fontSize: 13 }}>Aucune observation enregistrée</div>
          )}
          {observations.map(obs => (
            <div key={obs.id} style={{
              background: colors.white, borderRadius: radius.md, padding: '14px 18px',
              boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
              borderLeft: `4px solid ${colors.bleu}`,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 4 }}>{fmt(obs.date_transmission)}</div>
                <div style={{ fontSize: 13, color: colors.gray900, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{obs.contenu}</div>
              </div>
              <button onClick={() => deleteObs(obs)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.gray400, fontSize: 16, flexShrink: 0 }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'dar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDarForm(v => !v)} style={btnOrange}>+ Nouvelle transmission ciblée</button>
          </div>

          {showDarForm && (
            <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Date</label>
                  <input type="date" value={newDar.date_transmission} onChange={e => setNewDar(p => ({ ...p, date_transmission: e.target.value }))} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Cible</label>
                  <input value={newDar.cible} onChange={e => setNewDar(p => ({ ...p, cible: e.target.value }))} placeholder="Ex: Douleur, Agitation, Chute..." style={inputSt} />
                </div>
              </div>
              {['D', 'A', 'R'].map(cat => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>
                    <span style={{ background: DAR_COLORS[cat], color: '#fff', borderRadius: radius.full, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{cat}</span>
                    {DAR_LABELS[cat]}
                  </label>
                  <textarea value={newDar[cat]} onChange={e => setNewDar(p => ({ ...p, [cat]: e.target.value }))} placeholder={`Saisir les ${DAR_LABELS[cat].toLowerCase()}...`} style={{ ...textareaSt, minHeight: 60 }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDarForm(false)} style={btnGray}>Annuler</button>
                <button onClick={saveDar} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>{saving ? '...' : 'Enregistrer'}</button>
              </div>
            </div>
          )}

          {Object.values(darsByCible).length === 0 && !showDarForm && (
            <div style={{ textAlign: 'center', padding: 40, color: colors.gray500, fontSize: 13 }}>Aucune transmission ciblée</div>
          )}
          {Object.values(darsByCible).sort((a, b) => new Date(b.date) - new Date(a.date)).map((group, gi) => (
            <div key={gi} style={{ background: colors.white, borderRadius: radius.lg, overflow: 'hidden', boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
              <div style={{ background: colors.bleu, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>🎯 {group.cible}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{fmt(group.date)}</span>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['D', 'A', 'R'].map(cat => {
                  const item = group.items.find(x => x.dar_category === cat)
                  if (!item) return null
                  return (
                    <div key={cat} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        background: DAR_COLORS[cat], color: '#fff', borderRadius: radius.full,
                        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                      }}>{cat}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: DAR_COLORS[cat], marginBottom: 2 }}>{DAR_LABELS[cat]}</div>
                        <div style={{ fontSize: 13, color: colors.gray800, lineHeight: 1.5 }}>{item.contenu}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Webcam Modal ─────────────────────────────────────────────────────────────
function WebcamModal({ onCapture, onClose }) {
  const videoRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const [captured, setCaptured] = useState(null)
  const [camError, setCamError] = useState(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCamError("Impossible d'accéder à la caméra. Vérifiez les permissions."))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setCaptured(canvas.toDataURL('image/jpeg', 0.85))
  }

  const confirm = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(captured)
  }

  const retake = () => setCaptured(null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a2e', borderRadius: radius.xl, padding: 24, width: '90%', maxWidth: 720, boxShadow: shadows.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📷 Capture webcam</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {camError
          ? <div style={{ color: '#f87171', textAlign: 'center', padding: 40, fontSize: 14 }}>{camError}</div>
          : captured
            ? <div style={{ textAlign: 'center' }}>
                <img src={captured} alt="capture" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: radius.md, border: '2px solid #22c55e' }} />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                  <button onClick={retake} style={{ ...btnGray, background: '#374151', color: '#fff', border: 'none' }}>↺ Reprendre</button>
                  <button onClick={confirm} style={{ ...btnOrange, background: '#22c55e' }}>✓ Utiliser cette photo</button>
                </div>
              </div>
            : <div style={{ textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: 400, borderRadius: radius.md, background: '#000' }} />
                <button onClick={capture} style={{ marginTop: 16, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 64, height: 64, fontSize: 24, cursor: 'pointer', boxShadow: '0 0 0 4px rgba(239,68,68,.3)' }}>📷</button>
              </div>
        }
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

// ─── Lightbox Modal ────────────────────────────────────────────────────────────
function LightboxModal({ images, index, onClose, onDelete }) {
  const [cur, setCur] = useState(index)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCur(c => Math.min(c + 1, images.length - 1))
      if (e.key === 'ArrowLeft')  setCur(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  const img = images[cur]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(0,0,0,.5)' }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Photo {cur + 1} / {images.length}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {onDelete && (
            <button onClick={() => onDelete(img, cur)} title="Supprimer" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: radius.md, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>🗑 Supprimer</button>
          )}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: radius.md, padding: '5px 12px', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
      </div>
      {/* Navigation */}
      {cur > 0 && (
        <button onClick={() => setCur(c => c - 1)} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer' }}>‹</button>
      )}
      <img src={img?.url || img} alt={`Photo ${cur + 1}`} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: radius.md, boxShadow: shadows.xl }} />
      {cur < images.length - 1 && (
        <button onClick={() => setCur(c => c + 1)} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer' }}>›</button>
      )}
      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, display: 'flex', gap: 8, padding: '8px 16px', background: 'rgba(0,0,0,.5)', borderRadius: radius.full }}>
          {images.map((im, i) => (
            <img key={i} src={im?.url || im} alt="" onClick={() => setCur(i)}
              style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: i === cur ? '2px solid #f97316' : '2px solid transparent', opacity: i === cur ? 1 : 0.6, transition: 'all .15s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Onglet 5: Plaie Chronique ─────────────────────────────────────────────────
function TabPlaie({ dossierId, showToast }) {
  const [suivis, setSuivis] = useState([])
  const [form, setForm] = useState({ date_surveillance: today(), surface: '', profondeur: '', douleur_type: 'I', eva: 0, observations: '' })
  const [saving, setSaving] = useState(false)
  // Images en attente (avant enregistrement)
  const [pendingImages, setPendingImages] = useState([]) // [{ preview: dataURL, base64: string }]
  const [showWebcam, setShowWebcam] = useState(false)
  const [uploadingImgFor, setUploadingImgFor] = useState(null) // { suiviId, index } pour upload sur un suivi existant
  const [lightbox, setLightbox] = useState(null) // { images: [...], index: 0, suiviId }
  const fileInputRef = React.useRef(null)
  const fileInputExistRef = React.useRef(null)

  useEffect(() => { fetchSuivis() }, [])

  const fetchSuivis = async () => {
    try {
      const res = await api.get(`/nursing-dossiers/${dossierId}/surveillances`, { params: { type: 'plaie' } })
      const items = res.data?.data || res.data || []
      setSuivis(Array.isArray(items) ? items : [])
    } catch { /* silence */ }
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/nursing-dossiers/${dossierId}/surveillances`, {
        type_surveillance: 'plaie', date_surveillance: form.date_surveillance,
        data: { surface: form.surface, profondeur: form.profondeur, douleur_type: form.douleur_type, eva: form.eva },
        observations: form.observations,
      })
      const newId = res.data?.data?.id
      // Uploader les images en attente
      if (newId && pendingImages.length > 0) {
        for (const img of pendingImages) {
          try {
            if (img.file) {
              const fd = new FormData()
              fd.append('image', img.file)
              await api.post(`/nursing-dossiers/${dossierId}/surveillances/${newId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            } else if (img.base64) {
              await api.post(`/nursing-dossiers/${dossierId}/surveillances/${newId}/images`, { image_base64: img.base64 })
            }
          } catch { /* skip image error */ }
        }
      }
      showToast('Suivi enregistré' + (pendingImages.length ? ` avec ${pendingImages.length} photo(s)` : ''))
      setForm({ date_surveillance: today(), surface: '', profondeur: '', douleur_type: 'I', eva: 0, observations: '' })
      setPendingImages([])
      fetchSuivis()
    } catch { showToast('Erreur lors de l\'enregistrement', 'error') }
    finally { setSaving(false) }
  }

  const addWebcamCapture = (base64) => {
    setShowWebcam(false)
    if (uploadingImgFor) {
      // Upload immédiat sur un suivi existant
      uploadToExisting(uploadingImgFor, null, base64)
      setUploadingImgFor(null)
    } else {
      setPendingImages(p => [...p, { preview: base64, base64 }])
    }
  }

  const addFileImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (uploadingImgFor) {
      uploadToExisting(uploadingImgFor, file, null)
      setUploadingImgFor(null)
    } else {
      setPendingImages(p => [...p, { preview, file }])
    }
    e.target.value = ''
  }

  const uploadToExisting = async (suiviId, file, base64) => {
    try {
      if (file) {
        const fd = new FormData()
        fd.append('image', file)
        await api.post(`/nursing-dossiers/${dossierId}/surveillances/${suiviId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post(`/nursing-dossiers/${dossierId}/surveillances/${suiviId}/images`, { image_base64: base64 })
      }
      showToast('Photo ajoutée')
      fetchSuivis()
    } catch { showToast('Erreur upload photo', 'error') }
  }

  const deleteImage = async (suiviId, imgPath) => {
    if (!window.confirm('Supprimer cette photo ?')) return
    try {
      await api.delete(`/nursing-dossiers/${dossierId}/surveillances/${suiviId}/images`, { data: { path: imgPath } })
      showToast('Photo supprimée')
      setLightbox(null)
      fetchSuivis()
    } catch { showToast('Erreur suppression', 'error') }
  }

  const evaColor = (v) => v <= 3 ? colors.success : v <= 6 ? colors.warning : colors.danger

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Webcam modal */}
      {showWebcam && <WebcamModal onCapture={addWebcamCapture} onClose={() => { setShowWebcam(false); setUploadingImgFor(null) }} />}
      {/* Lightbox */}
      {lightbox && (
        <LightboxModal
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onDelete={lightbox.suiviId ? (img) => deleteImage(lightbox.suiviId, img.path || img) : null}
        />
      )}

      {/* ── Formulaire nouveau suivi ── */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Nouveau suivi de plaie</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Date</label>
            <input type="date" value={form.date_surveillance} onChange={e => setForm(p => ({ ...p, date_surveillance: e.target.value }))} style={inputSt} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Surface (cm²)</label>
            <input type="number" value={form.surface} onChange={e => setForm(p => ({ ...p, surface: e.target.value }))} placeholder="0.0" style={inputSt} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Profondeur (mm)</label>
            <input type="number" value={form.profondeur} onChange={e => setForm(p => ({ ...p, profondeur: e.target.value }))} placeholder="0.0" style={inputSt} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Type de douleur</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['P', 'Permanente'], ['I', 'Intermittente'], ['CS', 'Au cours du soin']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                  <input type="radio" name="douleur" value={v} checked={form.douleur_type === v} onChange={() => setForm(p => ({ ...p, douleur_type: v }))} />
                  <span style={{ fontWeight: form.douleur_type === v ? 700 : 400 }}>{v}</span>
                  <span style={{ color: colors.gray500 }}>— {l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* EVA Slider */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 8 }}>
            EVA Douleur:
            <span style={{ background: evaColor(form.eva), color: '#fff', borderRadius: radius.full, padding: '2px 12px', fontSize: 13, fontWeight: 800 }}>{form.eva}/10</span>
          </label>
          <input type="range" min={0} max={10} value={form.eva} onChange={e => setForm(p => ({ ...p, eva: +e.target.value }))} style={{ width: '100%', maxWidth: 400, accentColor: evaColor(form.eva) }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: colors.success }}>0 — Pas de douleur</span>
            <span style={{ fontSize: 10, color: colors.danger }}>10 — Douleur maximale</span>
          </div>
          <div style={{ width: '100%', maxWidth: 400, height: 6, borderRadius: radius.full, background: `linear-gradient(to right, ${colors.success}, ${colors.warning}, ${colors.danger})`, marginTop: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: `${form.eva * 10}%`, top: 0, bottom: 0, right: 0, background: 'rgba(255,255,255,.6)' }} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Protocole / Observations</label>
          <textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} placeholder="Décrire le protocole utilisé..." style={textareaSt} />
        </div>

        {/* ── Section Photos ── */}
        <div style={{ marginTop: 18, background: '#f8fafc', border: `1.5px dashed ${colors.gray300}`, borderRadius: radius.lg, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray700 }}>📷 Photos de la plaie</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowWebcam(true)}
                style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: radius.md, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                📷 Webcam
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ background: colors.bleu || '#0f766e', color: '#fff', border: 'none', borderRadius: radius.md, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                🖼 Importer
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={addFileImage} />
            </div>
          </div>

          {pendingImages.length === 0
            ? <div style={{ textAlign: 'center', color: colors.gray400, fontSize: 12, padding: '12px 0' }}>Aucune photo ajoutée — les photos seront liées au suivi après enregistrement</div>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {pendingImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img.preview} alt={`Photo ${i + 1}`} onClick={() => setLightbox({ images: pendingImages.map(p => ({ url: p.preview })), index: i, suiviId: null })}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: radius.md, border: `2px solid ${colors.gray200}`, cursor: 'pointer' }} />
                    <button onClick={() => setPendingImages(p => p.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 11, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
          }
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>{saving ? '⏳ Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </div>

      {/* ── Tableau historique ── */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Historique des suivis</SectionTitle>
        {suivis.length === 0
          ? <div style={{ textAlign: 'center', padding: 32, color: colors.gray500, fontSize: 13 }}>Aucun suivi enregistré</div>
          : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                  {['Date', 'Surface (cm²)', 'Profondeur (mm)', 'EVA', 'Photos', 'Observations', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suivis.map((s, i) => {
                  const d = s.data || {}
                  const eva = d.eva ?? 0
                  const imgs = s.images_urls || []
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}`, background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{fmt(s.date_surveillance)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{d.surface ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{d.profondeur ?? '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: evaColor(eva) + '22', color: evaColor(eva), borderRadius: radius.full, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{eva}/10</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {imgs.length === 0
                          ? <span style={{ color: colors.gray400, fontSize: 12 }}>—</span>
                          : <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                              {imgs.slice(0, 3).map((im, j) => (
                                <img key={j} src={im.url} alt="" onClick={() => setLightbox({ images: imgs, index: j, suiviId: s.id })}
                                  style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, border: `1.5px solid ${colors.gray200}`, cursor: 'pointer', transition: 'transform .15s' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                              ))}
                              {imgs.length > 3 && (
                                <span onClick={() => setLightbox({ images: imgs, index: 3, suiviId: s.id })}
                                  style={{ width: 44, height: 36, borderRadius: 6, background: colors.gray200, color: colors.gray600, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  +{imgs.length - 3}
                                </span>
                              )}
                            </div>
                        }
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: colors.gray700, maxWidth: 180 }}>{s.observations || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button title="Photo webcam" onClick={() => { setUploadingImgFor(s.id); setShowWebcam(true) }}
                            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: radius.md, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>📷</button>
                          <button title="Importer image" onClick={() => { setUploadingImgFor(s.id); fileInputExistRef.current?.click() }}
                            style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: radius.md, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>🖼</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
        {/* Input fichier caché pour upload sur suivi existant */}
        <input ref={fileInputExistRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={addFileImage} />
      </div>
    </div>
  )
}

// ─── Onglet 6: Surveillance Diabète ──────────────────────────────────────────
function TabDiabete({ dossierId, showToast }) {
  const [suivis, setSuivis] = useState([])
  const [insuline, setInsuline] = useState('')
  const [form, setForm] = useState({
    date_surveillance: today(),
    matin: { g: '', dose: '', site: '' },
    midi: { g: '', dose: '', site: '' },
    soir: { g: '', dose: '', site: '' },
    observations: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSuivis() }, [])

  const fetchSuivis = async () => {
    try {
      const res = await api.get(`/nursing-dossiers/${dossierId}/surveillances`, { params: { type: 'diabete' } })
      const items = res.data?.data || res.data || []
      setSuivis(Array.isArray(items) ? items : [])
    } catch { /* silence */ }
  }

  const updatePeriode = (p, f, v) => setForm(prev => ({ ...prev, [p]: { ...prev[p], [f]: v } }))

  const save = async () => {
    setSaving(true)
    try {
      await api.post(`/nursing-dossiers/${dossierId}/surveillances`, {
        type_surveillance: 'diabete', date_surveillance: form.date_surveillance,
        data: {
          matin: { g: form.matin.g, dose: form.matin.dose, site: form.matin.site },
          midi: { g: form.midi.g, dose: form.midi.dose, site: form.midi.site },
          soir: { g: form.soir.g, dose: form.soir.dose, site: form.soir.site },
        },
        observations: form.observations,
      })
      showToast('Suivi enregistré')
      setForm({ date_surveillance: today(), matin: { g: '', dose: '', site: '' }, midi: { g: '', dose: '', site: '' }, soir: { g: '', dose: '', site: '' }, observations: '' })
      fetchSuivis()
    } catch { showToast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const glycemieColor = (g) => {
    const v = parseFloat(g)
    if (!v || isNaN(v)) return colors.gray700
    if (v > 1.8 || v < 0.7) return colors.danger
    return colors.success
  }

  const PeriodeSection = ({ label, p }) => (
    <div style={{ border: `1.5px solid ${colors.gray200}`, borderRadius: radius.md, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.bleuMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>Glycémie (g/L)</label>
          <input type="number" step="0.01" value={form[p].g} onChange={e => updatePeriode(p, 'g', e.target.value)} placeholder="0.00" style={{ ...inputSt, fontSize: 12 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>Dose (UI)</label>
          <input type="number" value={form[p].dose} onChange={e => updatePeriode(p, 'dose', e.target.value)} placeholder="0" style={{ ...inputSt, fontSize: 12 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>Site injection</label>
          <input value={form[p].site} onChange={e => updatePeriode(p, 'site', e.target.value)} placeholder="Ex: Abdomen G" style={{ ...inputSt, fontSize: 12 }} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Nouveau suivi diabétique</SectionTitle>

        <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Insuline utilisée</label>
            <input value={insuline} onChange={e => setInsuline(e.target.value)} placeholder="Ex: Lantus 20 UI, Novorapid..." style={inputSt} />
          </div>
          <div style={{ width: 180 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Date</label>
            <input type="date" value={form.date_surveillance} onChange={e => setForm(p => ({ ...p, date_surveillance: e.target.value }))} style={inputSt} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 16 }}>
          <PeriodeSection label="Matin" p="matin" />
          <PeriodeSection label="Midi" p="midi" />
          <PeriodeSection label="Soir" p="soir" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 5 }}>Observations</label>
          <textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} style={textareaSt} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>{saving ? '...' : 'Enregistrer'}</button>
        </div>
      </div>

      {/* Tableau historique */}
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
        <SectionTitle>Historique glycémique</SectionTitle>
        {suivis.length === 0
          ? <div style={{ textAlign: 'center', padding: 32, color: colors.gray500, fontSize: 13 }}>Aucun suivi enregistré</div>
          : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textAlign: 'left', textTransform: 'uppercase' }}>Date</th>
                  {['Matin', 'Midi', 'Soir'].map(p => (
                    <th key={p} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textAlign: 'center', textTransform: 'uppercase' }}>{p} (G/Dose/Site)</th>
                  ))}
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textAlign: 'left', textTransform: 'uppercase' }}>Observations</th>
                </tr>
              </thead>
              <tbody>
                {suivis.map((s, i) => {
                  const d = s.data || {}
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{fmt(s.date_surveillance)}</td>
                      {['matin', 'midi', 'soir'].map(p => {
                        const pdata = d[p] || {}
                        return (
                          <td key={p} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>
                            {pdata.g ? (
                              <div>
                                <span style={{ fontWeight: 700, color: glycemieColor(pdata.g) }}>{pdata.g} g/L</span>
                                {pdata.dose && <span style={{ color: colors.gray600 }}> / {pdata.dose} UI</span>}
                                {pdata.site && <div style={{ fontSize: 11, color: colors.gray500 }}>{pdata.site}</div>}
                              </div>
                            ) : '—'}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 12px', fontSize: 12, color: colors.gray700, maxWidth: 180 }}>{s.observations || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  )
}

// ─── Onglet 7: Échelles ───────────────────────────────────────────────────────
const CHUTE_ITEMS = [
  'Age > 80 ans', 'Sexe féminin', 'Aide à la marche', 'Assistance activités de base',
  'Déficit musculo-squelettique', 'Problèmes aux pieds', 'Perte équilibre / locomotion',
  'Désorientation / changement direction', 'Nécessité de s\'arrêter pour parler',
  'Troubles cognitifs / Alzheimer', 'Dépression', 'Troubles de la vue',
  'Incontinence / nycturie', 'Consommation d\'alcool', 'Vertiges',
  'Problèmes de santé chroniques', 'Faible IMC', 'Maladie aiguë',
  'Parkinson / arthrose / ostéoporose / AVC', 'Sédatifs ou > 4 médicaments',
]

const DOLOPLUS_ITEMS = [
  {
    section: 'Somatique', color: colors.info,
    items: [
      { label: 'Plaintes somatiques', opts: ['Aucune', 'À la sollicitation', 'Spontanées occasionnelles', 'Spontanées continues'] },
      { label: 'Positions antalgiques au repos', opts: ['Aucune', 'Occasionnelle', 'Permanente efficace', 'Permanente inefficace'] },
      { label: 'Protection zones douloureuses', opts: ['Aucune', 'À la sollicitation sans gêne', 'À la sollicitation avec gêne', 'Au repos spontanément'] },
      { label: 'Mimique', opts: ['Habituelle', 'Exprime douleur à la sollicitation', 'Exprime douleur sans sollicitation', 'Inexpressive permanente'] },
      { label: 'Sommeil', opts: ['Habituel', 'Difficultés d\'endormissement', 'Réveils fréquents', 'Insomnie'] },
    ],
  },
  {
    section: 'Psycho-moteur', color: colors.orange,
    items: [
      { label: 'Toilette / habillage', opts: ['Inchangé', 'Peu diminué avec douleur', 'Très diminué avec gêne', 'Impossible'] },
      { label: 'Mouvements', opts: ['Inchangé', 'Actifs limités', 'Actifs et passifs limités', 'Impossibles'] },
    ],
  },
  {
    section: 'Psychosocial', color: colors.success,
    items: [
      { label: 'Communication', opts: ['Inchangée', 'Intensifiée', 'Diminuée', 'Absente'] },
      { label: 'Vie sociale', opts: ['Habituelle', 'À la sollicitation uniquement', 'Refus partiel', 'Refus total'] },
      { label: 'Troubles du comportement', opts: ['Habituel', 'À la sollicitation itératif', 'À la sollicitation permanent', 'Permanent'] },
    ],
  },
]

const NORTON_ITEMS = [
  { label: 'État général', opts: [{ v: 4, l: 'Bon' }, { v: 3, l: 'Moyen' }, { v: 2, l: 'Mauvais' }, { v: 1, l: 'Très mauvais' }] },
  { label: 'État mental', opts: [{ v: 4, l: 'Bon' }, { v: 3, l: 'Apathique' }, { v: 2, l: 'Confus' }, { v: 1, l: 'Inconscient' }] },
  { label: 'Activité', opts: [{ v: 4, l: 'Sans aide' }, { v: 3, l: 'Marche avec aide' }, { v: 2, l: 'Assis au fauteuil' }, { v: 1, l: 'Totalement alité' }] },
  { label: 'Mobilité', opts: [{ v: 4, l: 'Totale' }, { v: 3, l: 'Diminuée' }, { v: 2, l: 'Très limitée' }, { v: 1, l: 'Immobile' }] },
  { label: 'Incontinence', opts: [{ v: 4, l: 'Aucune' }, { v: 3, l: 'Occasionnelle' }, { v: 2, l: 'Urinaire ou fécale' }, { v: 1, l: 'Urinaire et fécale' }] },
]

const MNA_ITEMS = [
  { section: 'Indices anthropométriques', color: colors.bleu, items: [
    { label: 'IMC (kg/m²)', opts: [{ v: 0, l: '< 19' }, { v: 1, l: '19–21' }, { v: 2, l: '21–23' }, { v: 3, l: '≥ 23' }] },
    { label: 'Perte de poids (3 mois)', opts: [{ v: 0, l: '> 3 kg' }, { v: 1, l: 'Inconnue' }, { v: 2, l: '1–3 kg' }, { v: 3, l: 'Aucune' }] },
    { label: 'Périmètre brachial (cm)', opts: [{ v: 0, l: '< 21' }, { v: 0.5, l: '21–22' }, { v: 1, l: '≥ 22' }] },
    { label: 'Périmètre du mollet (cm)', opts: [{ v: 0, l: '< 31' }, { v: 1, l: '≥ 31' }] },
  ]},
  { section: 'Évaluation globale', color: colors.info, items: [
    { label: 'Vie autonome', opts: [{ v: 0, l: 'Non' }, { v: 1, l: 'Oui' }] },
    { label: 'Prend > 3 médicaments/j', opts: [{ v: 0, l: 'Oui' }, { v: 1, l: 'Non' }] },
    { label: 'Maladie ou stress aigu', opts: [{ v: 0, l: 'Oui' }, { v: 2, l: 'Non' }] },
    { label: 'Mobilité', opts: [{ v: 0, l: 'Alité/fauteuil' }, { v: 1, l: 'Se lève/intérieur' }, { v: 2, l: 'Extérieur' }] },
    { label: 'Problèmes neuro-psychologiques', opts: [{ v: 0, l: 'Démence/dépression sévère' }, { v: 1, l: 'Démence légère' }, { v: 2, l: 'Aucun' }] },
    { label: 'Lésions cutanées ou escarres', opts: [{ v: 0, l: 'Oui' }, { v: 1, l: 'Non' }] },
  ]},
  { section: 'Indices diététiques', color: colors.warning, items: [
    { label: 'Nombre repas complets/j', opts: [{ v: 0, l: '1 repas' }, { v: 1, l: '2 repas' }, { v: 2, l: '3 repas' }] },
    { label: 'Consomme produits laitiers', opts: [{ v: 0, l: 'Non' }, { v: 0.5, l: '1 oui' }, { v: 1, l: '2+ oui' }] },
    { label: 'Légumineuses ou oeufs (2+/sem)', opts: [{ v: 0, l: 'Non' }, { v: 0.5, l: 'Oui' }] },
    { label: 'Viande, poisson, volaille', opts: [{ v: 0, l: 'Non' }, { v: 1, l: 'Oui' }] },
    { label: 'Fruits ou légumes (2+/j)', opts: [{ v: 0, l: 'Non' }, { v: 1, l: 'Oui' }] },
    { label: 'Diminution appétit', opts: [{ v: 0, l: 'Anorexie sévère' }, { v: 1, l: 'Légère' }, { v: 2, l: 'Aucune' }] },
    { label: 'Eau/boissons/j', opts: [{ v: 0, l: '< 3 verres' }, { v: 0.5, l: '3–5 verres' }, { v: 1, l: '> 5 verres' }] },
  ]},
  { section: 'Évaluation subjective', color: colors.success, items: [
    { label: 'Nutrition par rapport aux pairs', opts: [{ v: 0, l: 'Moins bien nourri' }, { v: 1, l: 'Ne sait pas' }, { v: 2, l: 'Aussi bien' }] },
    { label: 'État nutritionnel auto-évalué', opts: [{ v: 0, l: 'Malnutrition' }, { v: 1, l: 'Incertain' }, { v: 2, l: 'Pas de problème' }] },
  ]},
]

function TabEchelles({ dossierId, showToast }) {
  const [subTab, setSubTab] = useState('chute')
  const [assessments, setAssessments] = useState([])

  // Chute
  const [chuteItems, setChuteItems] = useState(Array(20).fill(false))
  // Doloplus
  const [doloplusVals, setDoloplusVals] = useState(() => DOLOPLUS_ITEMS.flatMap(s => s.items.map(() => 0)))
  // Norton
  const [nortonVals, setNortonVals] = useState(Array(5).fill(4))
  // MNA
  const [mnaVals, setMnaVals] = useState(() => MNA_ITEMS.flatMap(s => s.items.map(() => null)))
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAssessments() }, [])

  const fetchAssessments = async () => {
    try {
      const res = await api.get(`/nursing-dossiers/${dossierId}/assessments`)
      setAssessments(res.data?.data || res.data || [])
    } catch { /* silence */ }
  }

  const chuteScore = chuteItems.filter(Boolean).length
  const chuteInterp = chuteScore <= 7 ? { label: 'Peu ou pas de risques', color: colors.success } : chuteScore <= 15 ? { label: 'Risque important', color: colors.warning } : { label: 'Risque majeur', color: colors.danger }

  const doloplusScore = doloplusVals.reduce((a, b) => a + b, 0)
  const doloplusInterp = doloplusScore < 5 ? { label: 'Douleur peu probable', color: colors.success } : { label: 'Douleur probable', color: colors.danger }

  const nortonScore = nortonVals.reduce((a, b) => a + b, 0)
  const nortonInterp = nortonScore > 14 ? { label: 'Sans risque d\'escarres', color: colors.success } : { label: 'Risque d\'escarres', color: colors.danger }

  const mnaScore = mnaVals.reduce((a, b) => a != null && b != null ? a + b : (a ?? 0) + (b ?? 0), 0)
  const mnaInterp = mnaScore >= 24 ? { label: 'État nutritionnel satisfaisant', color: colors.success } : mnaScore >= 17 ? { label: 'Risque de malnutrition', color: colors.warning } : { label: 'Mauvais état nutritionnel', color: colors.danger }

  const save = async (type, score, scoreMax, reponses, interp) => {
    setSaving(true)
    try {
      await api.post(`/nursing-dossiers/${dossierId}/assessments`, {
        type_echelle: type, date_evaluation: today(), reponses, score, score_max: scoreMax,
      })
      showToast('Évaluation enregistrée')
      fetchAssessments()
    } catch { showToast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const filteredAssessments = assessments.filter(a => a.type_echelle === subTab)

  const ScoreBadge = ({ score, max, color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: color + '12', borderRadius: radius.md, border: `1.5px solid ${color}30`, marginBottom: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{score}<span style={{ fontSize: 14, fontWeight: 500, color: colors.gray500 }}>/{max}</span></div>
      <div>
        <div style={{ fontSize: 11, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>Score total</div>
        <div style={{ fontWeight: 700, color, fontSize: 14 }}>{label}</div>
      </div>
    </div>
  )

  const subTabStyle = (active) => ({
    padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
    background: active ? colors.orange : 'transparent', color: active ? '#fff' : colors.gray600,
    border: `1px solid ${active ? colors.orange : colors.gray300}`, borderRadius: radius.md, transition: 'all .15s',
  })

  const AssessmentHistory = () => (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, marginTop: 20 }}>
      <SectionTitle>Historique des évaluations</SectionTitle>
      {filteredAssessments.length === 0
        ? <div style={{ textAlign: 'center', padding: 24, color: colors.gray500, fontSize: 13 }}>Aucune évaluation enregistrée</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
              {['Date', 'Score', 'Interprétation'].map(h => (
                <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: colors.gray500, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.sort((a, b) => new Date(b.date_evaluation) - new Date(a.date_evaluation)).map((a, i) => {
              let interp = { label: '—', color: colors.gray500 }
              const sc = a.score ?? 0
              const mx = a.score_max ?? 20
              if (subTab === 'chute') interp = sc <= 7 ? { label: 'Peu ou pas de risques', color: colors.success } : sc <= 15 ? { label: 'Risque important', color: colors.warning } : { label: 'Risque majeur', color: colors.danger }
              if (subTab === 'norton') interp = sc > 14 ? { label: 'Sans risque', color: colors.success } : { label: 'Risque d\'escarres', color: colors.danger }
              if (subTab === 'mna') interp = sc >= 24 ? { label: 'Satisfaisant', color: colors.success } : sc >= 17 ? { label: 'Risque malnutrition', color: colors.warning } : { label: 'Mauvais état nutritionnel', color: colors.danger }
              if (subTab === 'doloplus') interp = sc < 5 ? { label: 'Peu probable', color: colors.success } : { label: 'Douleur probable', color: colors.danger }
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{fmt(a.date_evaluation)}</td>
                  <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: interp.color }}>{sc}/{mx}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ background: interp.color + '18', color: interp.color, borderRadius: radius.full, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{interp.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      }
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ id: 'chute', label: 'Risque de Chute' }, { id: 'doloplus', label: 'DOLOPLUS-2' }, { id: 'norton', label: 'Norton' }, { id: 'mna', label: 'MNA' }].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={subTabStyle(subTab === t.id)}>{t.label}</button>
        ))}
      </div>

      {/* CHUTE */}
      {subTab === 'chute' && (
        <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
          <SectionTitle>Grille d'évaluation du risque de chute (/20)</SectionTitle>
          <ScoreBadge score={chuteScore} max={20} color={chuteInterp.color} label={chuteInterp.label} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8, marginBottom: 20 }}>
            {CHUTE_ITEMS.map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: radius.sm, cursor: 'pointer', background: chuteItems[i] ? colors.warningBg : colors.gray50, border: `1px solid ${chuteItems[i] ? colors.warning : colors.gray200}`, transition: 'all .15s' }}>
                <input type="checkbox" checked={chuteItems[i]} onChange={e => setChuteItems(prev => prev.map((v, j) => j === i ? e.target.checked : v))} style={{ accentColor: colors.orange, width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: colors.gray800, fontWeight: chuteItems[i] ? 600 : 400 }}>{item}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => save('chute', chuteScore, 20, { items: chuteItems })} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>
              {saving ? '...' : 'Enregistrer l\'évaluation'}
            </button>
          </div>
          <AssessmentHistory />
        </div>
      )}

      {/* DOLOPLUS */}
      {subTab === 'doloplus' && (
        <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
          <SectionTitle>DOLOPLUS-2 — Évaluation comportementale de la douleur (/30)</SectionTitle>
          <ScoreBadge score={doloplusScore} max={30} color={doloplusInterp.color} label={doloplusInterp.label} />
          {(() => {
            let globalIdx = 0
            return DOLOPLUS_ITEMS.map((section) => (
              <div key={section.section} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: section.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: section.color }} />
                  {section.section}
                </div>
                {section.items.map((item) => {
                  const idx = globalIdx++
                  return (
                    <div key={item.label} style={{ marginBottom: 10, padding: '12px 14px', background: colors.gray50, borderRadius: radius.md, border: `1px solid ${colors.gray200}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800, marginBottom: 8 }}>{item.label}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.opts.map((opt, score) => (
                          <label key={score} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', cursor: 'pointer',
                            borderRadius: radius.sm, fontSize: 12,
                            background: doloplusVals[idx] === score ? section.color + '18' : 'transparent',
                            border: `1px solid ${doloplusVals[idx] === score ? section.color : colors.gray300}`,
                            fontWeight: doloplusVals[idx] === score ? 600 : 400,
                            color: doloplusVals[idx] === score ? section.color : colors.gray700,
                            transition: 'all .15s',
                          }}>
                            <input type="radio" name={`dolop-${idx}`} checked={doloplusVals[idx] === score} onChange={() => setDoloplusVals(prev => prev.map((v, j) => j === idx ? score : v))} style={{ display: 'none' }} />
                            <span style={{ fontWeight: 700, minWidth: 14 }}>{score}</span>— {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          })()}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => save('doloplus', doloplusScore, 30, { vals: doloplusVals })} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>
              {saving ? '...' : 'Enregistrer l\'évaluation'}
            </button>
          </div>
          <AssessmentHistory />
        </div>
      )}

      {/* NORTON */}
      {subTab === 'norton' && (
        <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
          <SectionTitle>Échelle de Norton — Risque d'escarres (/20)</SectionTitle>
          <ScoreBadge score={nortonScore} max={20} color={nortonInterp.color} label={nortonInterp.label} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {NORTON_ITEMS.map((item, idx) => (
              <div key={item.label} style={{ padding: '14px 16px', background: colors.gray50, borderRadius: radius.md, border: `1px solid ${colors.gray200}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800, marginBottom: 10 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {item.opts.map(opt => (
                    <label key={opt.v} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', cursor: 'pointer',
                      borderRadius: radius.sm, fontSize: 12, transition: 'all .15s',
                      background: nortonVals[idx] === opt.v ? colors.bleu : 'transparent',
                      border: `1px solid ${nortonVals[idx] === opt.v ? colors.bleu : colors.gray300}`,
                      color: nortonVals[idx] === opt.v ? '#fff' : colors.gray700,
                      fontWeight: nortonVals[idx] === opt.v ? 600 : 400,
                    }}>
                      <input type="radio" name={`norton-${idx}`} checked={nortonVals[idx] === opt.v} onChange={() => setNortonVals(prev => prev.map((v, j) => j === idx ? opt.v : v))} style={{ display: 'none' }} />
                      <span style={{ fontWeight: 700, minWidth: 14 }}>{opt.v}</span>— {opt.l}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => save('norton', nortonScore, 20, { vals: nortonVals })} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>
              {saving ? '...' : 'Enregistrer l\'évaluation'}
            </button>
          </div>
          <AssessmentHistory />
        </div>
      )}

      {/* MNA */}
      {subTab === 'mna' && (
        <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}` }}>
          <SectionTitle>MNA — Mini Nutritional Assessment (/30)</SectionTitle>
          <ScoreBadge score={mnaScore} max={30} color={mnaInterp.color} label={mnaInterp.label} />
          {(() => {
            let globalIdx = 0
            return MNA_ITEMS.map(section => (
              <div key={section.section} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: section.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: section.color }} />
                  {section.section}
                </div>
                {section.items.map(item => {
                  const idx = globalIdx++
                  return (
                    <div key={item.label} style={{ marginBottom: 10, padding: '12px 14px', background: colors.gray50, borderRadius: radius.md, border: `1px solid ${colors.gray200}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800, marginBottom: 8 }}>{item.label}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.opts.map(opt => (
                          <label key={opt.v} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', cursor: 'pointer',
                            borderRadius: radius.sm, fontSize: 12, transition: 'all .15s',
                            background: mnaVals[idx] === opt.v ? section.color + '18' : 'transparent',
                            border: `1px solid ${mnaVals[idx] === opt.v ? section.color : colors.gray300}`,
                            color: mnaVals[idx] === opt.v ? section.color : colors.gray700,
                            fontWeight: mnaVals[idx] === opt.v ? 600 : 400,
                          }}>
                            <input type="radio" name={`mna-${idx}`} checked={mnaVals[idx] === opt.v} onChange={() => setMnaVals(prev => prev.map((v, j) => j === idx ? opt.v : v))} style={{ display: 'none' }} />
                            <span style={{ fontWeight: 700, minWidth: 14 }}>{opt.v}</span>— {opt.l}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          })()}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => save('mna', mnaScore, 30, { vals: mnaVals })} disabled={saving} style={{ ...btnOrange, opacity: saving ? .6 : 1 }}>
              {saving ? '...' : 'Enregistrer l\'évaluation'}
            </button>
          </div>
          <AssessmentHistory />
        </div>
      )}
    </div>
  )
}

// ─── Vue Impression ────────────────────────────────────────────────────────────
function PrintView({ dossier }) {
  const patient    = dossier?.patient    || {}
  const contacts   = dossier?.contacts   || []
  const intervenants = dossier?.intervenants || []
  const treatments = dossier?.treatments || []
  const transmissions = dossier?.transmissions || []
  const careRecords = dossier?.careRecords || dossier?.care_records || []
  const assessments = dossier?.assessments || []
  const surveillances = dossier?.surveillances || []

  const observations = transmissions.filter(t => t.type_transmission === 'observation')
  const dars         = transmissions.filter(t => t.type_transmission === 'dar')
  const plaies       = surveillances.filter(s => s.type_surveillance === 'plaie')
  const diabetes     = surveillances.filter(s => s.type_surveillance === 'diabete')

  const patientNom = [patient.first_name, patient.second_name, patient.last_name].filter(Boolean).join(' ')
  const fmtP = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  // Regroupe les careRecords par date
  const sortedDates = [...new Set(careRecords.map(r => r.date_soin))].sort()

  // Styles print
  const tblStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 11 }
  const thBlue   = { border: '1px solid #002f59', background: '#002f59', color: '#fff', padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11 }
  const thOrange = { ...thBlue, background: '#e0621f' }
  const thTeal   = { ...thBlue, background: '#006064' }
  const thGreen  = { ...thBlue, background: '#2e7d32' }
  const tdE = (i) => ({ border: '1px solid #ddd', padding: '5px 9px', fontSize: 11, background: i % 2 === 0 ? '#fff' : '#f4f7fb' })
  const tdC = (i) => ({ ...tdE(i), textAlign: 'center' })

  const SecHeader = ({ num, icon, label, color = '#002f59' }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: color, color: '#fff',
      padding: '7px 14px', marginTop: 28, marginBottom: 12,
      fontSize: 13, fontWeight: 800, letterSpacing: '.3px',
      borderLeft: '6px solid #e0621f',
      pageBreakBefore: num > 1 ? 'auto' : 'avoid',
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {num}. {label}
    </div>
  )

  const InfoRow = ({ label, value, alt }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', background: alt ? '#f4f7fb' : '#fff' }}>
      <div style={{ width: 180, flexShrink: 0, padding: '5px 10px', fontWeight: 700, fontSize: 11, color: '#002f59', borderRight: '1px solid #e0e0e0' }}>{label}</div>
      <div style={{ padding: '5px 10px', fontSize: 11, flex: 1 }}>{value || '—'}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1a1a1a', background: '#fff', padding: '20px 24px' }}>

      {/* ── En-tête cabinet ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: '3px solid #002f59', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, background: '#002f59', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff' }}>S</div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#002f59', lineHeight: 1 }}>Sen<span style={{ color: '#e0621f' }}>Med</span></div>
            <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>Système de Soins Médicaux</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#002f59', textTransform: 'uppercase', letterSpacing: '.5px' }}>Dossier de Soins Infirmiers</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Date d'impression : <strong>{new Date().toLocaleDateString('fr-FR')}</strong></div>
          <div style={{ fontSize: 11, color: '#666' }}>N° Dossier : <strong>#{dossier.id}</strong></div>
          <div style={{ fontSize: 11, color: '#666' }}>Statut : <strong style={{ color: dossier.statut === 'termine' ? '#27ae60' : '#e67e22' }}>{dossier.statut === 'termine' ? 'Terminé' : 'En cours'}</strong></div>
        </div>
      </div>

      {/* ── Bandeau patient ── */}
      <div style={{ background: '#002f59', color: '#fff', borderRadius: 6, padding: '12px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '.3px' }}>{patientNom || '—'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 3 }}>
            N° Patient : {patient.patient_code || patient.patient_id || '—'}
            {patient.dob ? ` · Né(e) le ${fmtP(patient.dob)}` : ''}
            {patient.gender_id ? ` · ${patient.gender_id === 'M' ? 'Masculin' : patient.gender_id === 'F' ? 'Féminin' : patient.gender_id}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 11 }}>
          {[['Début', dossier.date_debut], ['Fin', dossier.date_fin]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtP(val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════ SECTION 1 ════════════════ */}
      <SecHeader num={1} icon="📋" label="FICHE ADMINISTRATIVE" />
      <div style={{ border: '1px solid #ddd', marginBottom: 16 }}>
        {[
          ['Nom complet',             patientNom],
          ['N° Patient',              patient.patient_code || patient.patient_id],
          ['Date de naissance',       fmtP(patient.dob)],
          ['Sexe',                    patient.gender_id === 'M' ? 'Masculin' : patient.gender_id === 'F' ? 'Féminin' : patient.gender_id],
          ['Situation maritale',      patient.marital_name],
          ['Nationalité',             patient.nationality_id],
          ['Profession',              patient.profession],
          ['Téléphone',               patient.contact_number],
          ['Mobile',                  patient.mobile_number],
          ['Adresse',                 [patient.address, patient.address2, patient.city].filter(Boolean).join(', ')],
          ['N° Sécurité Sociale',     patient.ssn_no],
          ['Contact d\'urgence',      patient.emergency_contact_name ? `${patient.emergency_contact_name}  —  ${patient.emergency_contact_number || ''}` : ''],
        ].map(([lbl, val], i) => <InfoRow key={lbl} label={lbl} value={val} alt={i % 2 !== 0} />)}
      </div>

      {/* Contacts urgence DSI */}
      {contacts.filter(c => c.nom).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#002f59', marginBottom: 6 }}>Contacts d'urgence (DSI) :</div>
          <table style={tblStyle}>
            <thead><tr>{['#', 'Nom', 'Qualité / Lien', 'Téléphone'].map(h => <th key={h} style={thBlue}>{h}</th>)}</tr></thead>
            <tbody>
              {contacts.filter(c => c.nom).map((c, i) => (
                <tr key={i}>
                  <td style={tdE(i)}>Contact {c.ordre || i + 1}</td>
                  <td style={tdE(i)}><strong>{c.nom}</strong></td>
                  <td style={tdE(i)}>{c.qualite || '—'}</td>
                  <td style={tdE(i)}>{c.telephone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Intervenants */}
      {intervenants.filter(iv => iv.nom).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#002f59', marginBottom: 6 }}>Intervenants :</div>
          <table style={tblStyle}>
            <thead><tr>{['Type', 'Nom', 'Téléphone', 'Cabinet'].map(h => <th key={h} style={thBlue}>{h}</th>)}</tr></thead>
            <tbody>
              {intervenants.filter(iv => iv.nom).map((iv, i) => (
                <tr key={i}>
                  <td style={{ ...tdE(i), fontWeight: 700, color: '#002f59' }}>{iv.type}</td>
                  <td style={tdE(i)}>{iv.nom}</td>
                  <td style={tdE(i)}>{iv.telephone || '—'}</td>
                  <td style={tdE(i)}>{iv.cabinet || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════ SECTION 2 ════════════════ */}
      <SecHeader num={2} icon="💊" label="FICHE DE TRAITEMENT" color="#1a5276" />
      {treatments.length === 0 ? (
        <p style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginBottom: 14 }}>Aucun traitement enregistré.</p>
      ) : (
        <>
          <table style={tblStyle}>
            <thead>
              <tr>
                {['Date début', 'Date fin', 'Médicament / Traitement', 'Posologie', 'Qté', 'Prix unit.', 'Total', 'M', 'Mi', 'S', 'N', 'Arrêt'].map(h => (
                  <th key={h} style={{ ...thBlue, background: '#1a5276' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treatments.map((t, i) => {
                const prixTotal = (t.prix_unitaire || 0) * (t.quantite || 1)
                return (
                  <tr key={t.id || i} style={{ opacity: t.arret ? .7 : 1 }}>
                    <td style={tdE(i)}>{fmtP(t.date_debut)}</td>
                    <td style={tdE(i)}>{fmtP(t.date_fin) || '—'}</td>
                    <td style={{ ...tdE(i), fontWeight: 700, textDecoration: t.arret ? 'line-through' : 'none', color: t.arret ? '#999' : '#002f59' }}>
                      {t.designation || t.traitement || '—'}
                    </td>
                    <td style={{ ...tdE(i), fontSize: 10, color: '#555' }}>{t.posologie || '—'}</td>
                    <td style={tdC(i)}>{t.quantite || 1}</td>
                    <td style={{ ...tdC(i), fontSize: 10 }}>{t.prix_unitaire > 0 ? Number(t.prix_unitaire).toLocaleString('fr-FR') : '—'}</td>
                    <td style={{ ...tdC(i), fontWeight: 700, color: prixTotal > 0 ? '#15803d' : '#999' }}>
                      {prixTotal > 0 ? Number(prixTotal).toLocaleString('fr-FR') : '—'}
                    </td>
                    {['matin', 'midi', 'soir', 'nuit'].map(p => (
                      <td key={p} style={{ ...tdC(i), color: t[p] ? '#27ae60' : '#ddd', fontWeight: 800, fontSize: 13 }}>{t[p] ? '✓' : '·'}</td>
                    ))}
                    <td style={{ ...tdC(i), color: t.arret ? '#e74c3c' : '#ccc', fontWeight: 700, fontSize: 10 }}>{t.arret ? 'ARRÊTÉ' : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Totaux facturation */}
          {treatments.some(t => (t.prix_unitaire || 0) > 0) && (() => {
            const total = treatments.reduce((acc, t) => acc + (t.prix_unitaire || 0) * (t.quantite || 1), 0)
            return (
              <div style={{ textAlign: 'right', marginBottom: 12, fontSize: 11 }}>
                <span style={{ background: '#1a5276', color: '#fff', borderRadius: 4, padding: '4px 14px', fontWeight: 700 }}>
                  Total médicaments : {total.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )
          })()}
        </>
      )}

      {/* ════════════════ SECTION 3 ════════════════ */}
      {careRecords.length > 0 && (
        <>
          <SecHeader num={3} icon="🗓" label="DIAGRAMME DE SOINS" color="#00695c" />
          {sortedDates.map(date => {
            const rp   = careRecords.filter(r => r.date_soin === date && r.soin_category === 'role_propre')
            const prsc = careRecords.filter(r => r.date_soin === date && r.soin_category === 'prescription')
            const rpLabels   = [...new Set(rp.map(r => r.soin_label))]
            const rpPeriodes = [...new Set(rp.map(r => r.periode))]
            const prLabels   = [...new Set(prsc.map(r => r.soin_label))]
            const prPeriodes = [...new Set(prsc.map(r => r.periode))]
            return (
              <div key={date} style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
                <div style={{ background: '#e8f0f8', borderLeft: '4px solid #002f59', padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#002f59', marginBottom: 8 }}>
                  Date : {fmtP(date)}
                </div>
                {rpLabels.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#00695c', marginBottom: 4 }}>Soins Rôle Propre</div>
                    <table style={tblStyle}>
                      <thead><tr>
                        <th style={thTeal}>Soin</th>
                        {rpPeriodes.map(p => <th key={p} style={{ ...thTeal, textAlign: 'center', width: 60 }}>{p}</th>)}
                      </tr></thead>
                      <tbody>
                        {rpLabels.map((lbl, i) => (
                          <tr key={lbl}>
                            <td style={tdE(i)}>{lbl}</td>
                            {rpPeriodes.map(p => {
                              const done = rp.find(r => r.soin_label === lbl && r.periode === p)?.realise
                              return <td key={p} style={{ ...tdC(i), color: done ? '#27ae60' : '#ccc', fontWeight: 800 }}>{done ? '✓' : '—'}</td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {prLabels.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e0621f', marginBottom: 4 }}>Soins sur Prescription</div>
                    <table style={tblStyle}>
                      <thead><tr>
                        <th style={thOrange}>Soin</th>
                        {prPeriodes.map(p => <th key={p} style={{ ...thOrange, textAlign: 'center', width: 50 }}>{p}</th>)}
                      </tr></thead>
                      <tbody>
                        {prLabels.map((lbl, i) => (
                          <tr key={lbl}>
                            <td style={tdE(i)}>{lbl}</td>
                            {prPeriodes.map(p => {
                              const done = prsc.find(r => r.soin_label === lbl && r.periode === p)?.realise
                              return <td key={p} style={{ ...tdC(i), color: done ? '#27ae60' : '#ccc', fontWeight: 800 }}>{done ? '✓' : '—'}</td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ════════════════ SECTION 4 ════════════════ */}
      {transmissions.length > 0 && (
        <>
          <SecHeader num={4} icon="📝" label="TRANSMISSIONS INFIRMIÈRES" color="#4a148c" />
          {observations.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a148c', marginBottom: 6 }}>Observations :</div>
              <table style={tblStyle}>
                <thead><tr>
                  <th style={{ ...thBlue, background: '#4a148c', width: 90 }}>Date</th>
                  <th style={{ ...thBlue, background: '#4a148c' }}>Observation</th>
                </tr></thead>
                <tbody>
                  {observations.map((o, i) => (
                    <tr key={o.id || i}>
                      <td style={{ ...tdE(i), fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtP(o.date_transmission)}</td>
                      <td style={{ ...tdE(i), whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{o.contenu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {dars.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a148c', marginBottom: 6 }}>Transmissions Ciblées (DAR) :</div>
              <table style={tblStyle}>
                <thead><tr>
                  <th style={{ ...thBlue, background: '#4a148c', width: 80 }}>Date</th>
                  <th style={{ ...thBlue, background: '#4a148c', width: 110 }}>Cible</th>
                  <th style={{ ...thBlue, background: '#4a148c', width: 32, textAlign: 'center' }}>D/A/R</th>
                  <th style={{ ...thBlue, background: '#4a148c' }}>Contenu</th>
                </tr></thead>
                <tbody>
                  {dars.map((d, i) => {
                    const colMap = { D: '#1565c0', A: '#e0621f', R: '#2e7d32' }
                    return (
                      <tr key={d.id || i}>
                        <td style={{ ...tdE(i), fontSize: 10, whiteSpace: 'nowrap' }}>{fmtP(d.date_transmission)}</td>
                        <td style={{ ...tdE(i), fontWeight: 700 }}>{d.cible}</td>
                        <td style={{ ...tdC(i), fontWeight: 900, color: colMap[d.dar_category] || '#333' }}>{d.dar_category}</td>
                        <td style={{ ...tdE(i), whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{d.contenu}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════ SECTION 5 ════════════════ */}
      {plaies.length > 0 && (
        <>
          <SecHeader num={5} icon="🩹" label="SURVEILLANCE PLAIE CHRONIQUE" color="#b71c1c" />
          <table style={tblStyle}>
            <thead><tr>
              {['Date', 'Surface (cm²)', 'Profondeur (mm)', 'Type douleur', 'EVA /10', 'Photo', 'Observations'].map(h => (
                <th key={h} style={{ ...thBlue, background: '#b71c1c' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {plaies.map((s, i) => {
                const d = s.data || {}
                const eva = d.eva ?? 0
                const evaColor = eva <= 3 ? '#27ae60' : eva <= 6 ? '#e67e22' : '#e74c3c'
                const imgs = s.images_urls || []
                const firstImg = imgs[0]
                return (
                  <tr key={s.id || i}>
                    <td style={tdE(i)}>{fmtP(s.date_surveillance)}</td>
                    <td style={tdC(i)}>{d.surface ?? '—'}</td>
                    <td style={tdC(i)}>{d.profondeur ?? '—'}</td>
                    <td style={tdC(i)}>{d.douleur_type ?? '—'}</td>
                    <td style={{ ...tdC(i), fontWeight: 800, color: evaColor }}>{eva}/10</td>
                    <td style={{ ...tdC(i), padding: '4px 6px' }}>
                      {firstImg
                        ? <div>
                            <img src={firstImg.url} alt="plaie" style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', display: 'block', margin: '0 auto' }} />
                            {imgs.length > 1 && <div style={{ fontSize: 9, color: '#666', textAlign: 'center', marginTop: 2 }}>+{imgs.length - 1} photo(s)</div>}
                          </div>
                        : <span style={{ color: '#999', fontSize: 10 }}>—</span>
                      }
                    </td>
                    <td style={tdE(i)}>{s.observations || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Galerie complète des photos si plusieurs suivis ont des photos */}
          {plaies.some(s => (s.images_urls || []).length > 0) && (
            <div style={{ marginBottom: 14, pageBreakInside: 'avoid' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b71c1c', marginBottom: 8, borderBottom: '1px solid #f5c6cb', paddingBottom: 4 }}>ÉVOLUTION PHOTOGRAPHIQUE DE LA PLAIE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {plaies.filter(s => (s.images_urls || []).length > 0).map((s, si) =>
                  (s.images_urls || []).map((im, ii) => (
                    <div key={`${si}-${ii}`} style={{ textAlign: 'center' }}>
                      <img src={im.url} alt={`J${si + 1}-P${ii + 1}`} style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #e0c2c2', display: 'block' }} />
                      <div style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{fmtP(s.date_surveillance)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════ SECTION 6 ════════════════ */}
      {diabetes.length > 0 && (
        <>
          <SecHeader num={6} icon="🩸" label="SURVEILLANCE DIABÉTIQUE" color="#880e4f" />
          <table style={tblStyle}>
            <thead><tr>
              <th style={{ ...thBlue, background: '#880e4f' }}>Date</th>
              {['Matin', 'Midi', 'Soir'].map(p => (
                <th key={p} style={{ ...thBlue, background: '#880e4f', textAlign: 'center' }}>{p} (Glyc. / Dose / Site)</th>
              ))}
              <th style={{ ...thBlue, background: '#880e4f' }}>Observations</th>
            </tr></thead>
            <tbody>
              {diabetes.map((s, i) => {
                const d = s.data || {}
                const cell = (p) => {
                  const pd = d[p] || {}
                  if (!pd.g) return '—'
                  const g = parseFloat(pd.g)
                  const gColor = (!isNaN(g) && (g > 1.8 || g < 0.7)) ? '#e74c3c' : '#27ae60'
                  return (
                    <span>
                      <span style={{ fontWeight: 700, color: gColor }}>{pd.g} g/L</span>
                      {pd.dose ? <span style={{ color: '#555' }}> / {pd.dose} UI</span> : ''}
                      {pd.site ? <span style={{ color: '#888' }}> / {pd.site}</span> : ''}
                    </span>
                  )
                }
                return (
                  <tr key={s.id || i}>
                    <td style={{ ...tdE(i), fontWeight: 600 }}>{fmtP(s.date_surveillance)}</td>
                    <td style={tdC(i)}>{cell('matin')}</td>
                    <td style={tdC(i)}>{cell('midi')}</td>
                    <td style={tdC(i)}>{cell('soir')}</td>
                    <td style={tdE(i)}>{s.observations || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ════════════════ SECTION 7 ════════════════ */}
      {assessments.length > 0 && (
        <>
          <SecHeader num={7} icon="📊" label="ÉCHELLES D'ÉVALUATION" color="#1b5e20" />
          <table style={tblStyle}>
            <thead><tr>
              {['Échelle', 'Date', 'Score', 'Interprétation'].map(h => (
                <th key={h} style={thGreen}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {assessments.map((a, i) => {
                const labels = { chute: 'Risque de Chute (/20)', doloplus: 'DOLOPLUS-2 (/30)', norton: 'Norton – Escarres (/20)', mna: 'MNA – Nutrition (/30)' }
                const pct = a.score_max > 0 ? Math.round((a.score / a.score_max) * 100) : 0
                const scoreColor = pct <= 40 ? '#27ae60' : pct <= 70 ? '#e67e22' : '#e74c3c'
                return (
                  <tr key={a.id || i}>
                    <td style={{ ...tdE(i), fontWeight: 700 }}>{labels[a.type_echelle] || a.type_echelle}</td>
                    <td style={tdE(i)}>{fmtP(a.date_evaluation)}</td>
                    <td style={{ ...tdC(i), fontWeight: 900, fontSize: 13, color: scoreColor }}>{a.score}<span style={{ fontSize: 10, fontWeight: 400, color: '#888' }}>/{a.score_max}</span></td>
                    <td style={tdE(i)}>{a.interpretation || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ── Signatures ── */}
      <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #002f59', paddingTop: 24 }}>
        {[
          'Signature de l\'infirmier(ère) responsable',
          'Visa du médecin',
          'Cachet du service',
        ].map(lbl => (
          <div key={lbl} style={{ textAlign: 'center', width: '30%' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#002f59', marginBottom: 36 }}>{lbl}</div>
            <div style={{ borderBottom: '1px solid #555', width: '85%', margin: '0 auto' }} />
          </div>
        ))}
      </div>

      {/* ── Pied de page ── */}
      <div style={{ marginTop: 18, textAlign: 'center', fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 8 }}>
        Document généré par SenMed — Système de Gestion de Soins Infirmiers — {new Date().toLocaleString('fr-FR')}
      </div>
    </div>
  )
}

// ─── Contenu principal (partagé modal + page standalone) ─────────────────────
function DossierSoinsContent({ dossierId, onClose, isModal = false }) {
  const [activeTab, setActiveTab] = useState('admin')
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [terminating, setTerminating] = useState(false)

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), [])

  const fetchDossier = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/nursing-dossiers/${dossierId}`)
      setDossier(res.data?.data || res.data)
    } catch (e) {
      showToast('Erreur de chargement du dossier', 'error')
    } finally { setLoading(false) }
  }, [dossierId, showToast])

  useEffect(() => { fetchDossier() }, [fetchDossier])

  const handleTerminer = async () => {
    if (!window.confirm('Terminer ce dossier de soins ?')) return
    setTerminating(true)
    try {
      await api.put(`/nursing-dossiers/${dossierId}`, { statut: 'termine', date_fin: today() })
      showToast('Dossier terminé avec succès')
      fetchDossier()
    } catch { showToast('Erreur', 'error') }
    finally { setTerminating(false) }
  }

  const patient = dossier?.patient || {}
  const patientNom = `${patient.first_name || ''} ${patient.last_name || ''}`.trim()

  return (
    <div style={{ minHeight: '100vh', background: colors.gray50, fontFamily: 'inherit' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .dsi-tab:hover { background: rgba(255,255,255,.15) !important; }
        .dsi-tab-active { background: rgba(255,255,255,.18) !important; border-bottom: 3px solid ${colors.orange} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${colors.orange} !important; box-shadow: 0 0 0 3px var(--app-accent-18, #ff763118) !important; outline: none; }
        @media screen { .dsi-print-view { display: none; } }
        @media print {
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          @page { margin: 1.2cm; size: A4 portrait; }
          body > * { display: none !important; }
          .dsi-print-view { display: block !important; position: fixed; inset: 0; background: #fff; overflow: visible; z-index: 99999; }
          .dsi-print-area, .dsi-no-print { display: none !important; }
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header sticky ── */}
      <div className="dsi-print-header" style={{
        position: 'sticky', top: 0, zIndex: isModal ? 5 : 100,
        background: colors.bleu, boxShadow: shadows.lg,
      }}>
        {/* Ligne 1: nav + patient info */}
        <div style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
          <button onClick={onClose} className="dsi-no-print"
            style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: radius.md, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
            {isModal ? '× Fermer' : '← Retour à la liste'}
          </button>

          {loading ? (
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>Chargement...</div>
          ) : dossier ? (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{patientNom || '—'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>N° {patient.patient_code || patient.patient_id || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>Période</div>
                  <div>{fmt(dossier.date_debut)} → {fmt(dossier.date_fin)}</div>
                </div>
                <div style={{
                  background: dossier.statut === 'termine' ? colors.successBg : 'rgba(255,255,255,.15)',
                  color: dossier.statut === 'termine' ? colors.success : '#fff',
                  borderRadius: radius.full, padding: '4px 14px', fontSize: 12, fontWeight: 700,
                  border: `1px solid ${dossier.statut === 'termine' ? colors.success : 'rgba(255,255,255,.3)'}`,
                }}>
                  {dossier.statut === 'termine' ? 'Terminé' : 'En cours'}
                </div>
                {dossier.statut === 'en_cours' && (
                  <button onClick={handleTerminer} disabled={terminating} className="dsi-no-print"
                    style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: radius.md, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: terminating ? .6 : 1, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
                    onMouseLeave={e => e.currentTarget.style.background = colors.orange}>
                    {terminating ? '...' : 'Terminer le dossier'}
                  </button>
                )}
                <button onClick={() => window.print()} className="dsi-no-print"
                  title="Imprimer le dossier"
                  style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: radius.md, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
                  🖨️ Imprimer
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: colors.danger, fontSize: 13 }}>Dossier introuvable</div>
          )}
        </div>

        {/* Ligne 2: onglets */}
        <div style={{ display: 'flex', paddingLeft: 16, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`dsi-tab${activeTab === tab.id ? ' dsi-tab-active' : ''}`}
              style={{
                background: 'transparent', border: 'none', borderBottom: '3px solid transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,.65)',
                padding: '12px 20px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0,
              }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="dsi-print-area" style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn .3s ease' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: colors.gray500 }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Chargement du dossier...</div>
          </div>
        ) : !dossier ? (
          <div style={{ textAlign: 'center', padding: 80, color: colors.danger }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Dossier introuvable</div>
          </div>
        ) : (
          <div key={activeTab} style={{ animation: 'fadeIn .2s ease' }}>
            {activeTab === 'admin' && <TabAdmin dossier={dossier} dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'traitements' && <TabTraitements dossier={dossier} dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'diagramme' && <TabDiagramme dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'transmissions' && <TabTransmissions dossier={dossier} dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'plaie' && <TabPlaie dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'diabete' && <TabDiabete dossierId={dossierId} showToast={showToast} />}
            {activeTab === 'echelles' && <TabEchelles dossierId={dossierId} showToast={showToast} />}
          </div>
        )}
      </div>

      {/* ── Vue impression (cachée à l'écran, visible à l'impression) ── */}
      {dossier && (
        <div className="dsi-print-view">
          <PrintView dossier={dossier} />
        </div>
      )}
    </div>
  )
}

// ─── Modal (intégré dans la page avec sidebar visible) ────────────────────────
export function DossierSoinsModal({ dossierId, onClose }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Fond semi-transparent — z-index < sidebar (100) */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 98 }}
        onClick={onClose}
      />
      {/* Panneau modal — couvre la zone de contenu à droite de la sidebar */}
      <div style={{
        position: 'fixed', top: 0, bottom: 0, left: 240, right: 0,
        zIndex: 99, background: colors.gray50, overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
      }}>
        <DossierSoinsContent dossierId={dossierId} onClose={onClose} isModal />
      </div>
    </>
  )
}

// ─── Page standalone (accès direct par URL) ───────────────────────────────────
export default function DossierSoinsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  return <DossierSoinsContent dossierId={id} onClose={() => navigate('/dossier-soins')} isModal={false} />
}
