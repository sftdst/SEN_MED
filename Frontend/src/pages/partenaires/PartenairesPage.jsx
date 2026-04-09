import { useEffect, useRef, useState } from 'react'
import { partenaireApi } from '../../api'
import { colors, radius, shadows, typography, spacing } from '../../theme'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

// ── Constantes ──────────────────────────────────────────────
const TYPES_PARTENAIRE = [
  { value: '0', label: 'Assurance' },
  { value: '1', label: 'Mutuelle' },
  { value: '2', label: 'Entreprise' },
  { value: '3', label: 'Organisation' },
  { value: '4', label: 'Autre' },
]
const TYPE_LABELS = { 0: 'Assurance', 1: 'Mutuelle', 2: 'Entreprise', 3: 'Organisation', 4: 'Autre' }
const TYPE_COLORS = { 0: 'info', 1: 'success', 2: 'warning', 3: 'orange', 4: 'default' }

const EMPTY_HEADER = {
  Nom: '', pays: '', ville: '', adress: '', contact: '', mobile: '',
  bank: '', email: '', type_societe: '', numero_compte: '',
  maximum_credit: 0, date_created: '', code_societe: '', status: false, TypePart: 0,
}
const EMPTY_COV = { Nom: '', service: '', contributionCompagny: 80, contributionPatient: 20, Maximum_Credit: 0 }

// ── Formatage ────────────────────────────────────────────────
const fmt  = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR')

// ── Design tokens locaux ─────────────────────────────────────
const D = {
  cardBg:      colors.white,
  cardBorder:  colors.gray200,
  accentBleu:  colors.bleu,
  accentOrange: colors.orange,
  fieldGap:    spacing.md,
  inputPad:    '9px 12px',
  inputFont:   '13px',
  labelFont:   '11px',
  labelWeight: 700,
  sectionGap:  spacing.xl,
}

// ── Composant champ de saisie ────────────────────────────────
function Field({ label, children, error, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{
          fontSize: D.labelFont, fontWeight: D.labelWeight,
          color: error ? colors.danger : colors.gray700,
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
          {label}{required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <span style={{ fontSize: '11px', color: colors.danger, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </span>
      )}
    </div>
  )
}

function Inp({ label, name, value, onChange, disabled, type = 'text', error, required, placeholder, style = {} }) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? colors.danger : focused ? colors.bleu : colors.gray300
  return (
    <Field label={label} error={error} required={required}>
      <input
        type={type} name={name} value={value ?? ''} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${borderColor}`,
          borderRadius: radius.sm,
          padding: D.inputPad,
          fontSize: D.inputFont, color: disabled ? colors.gray500 : colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused && !disabled ? `0 0 0 3px ${colors.bleu}18` : 'none',
          ...style,
        }}
      />
    </Field>
  )
}

function Sel({ label, name, value, onChange, options, placeholder, required, error }) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? colors.danger : focused ? colors.bleu : colors.gray300
  return (
    <Field label={label} error={error} required={required}>
      <select
        name={name} value={value ?? ''} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${borderColor}`,
          borderRadius: radius.sm,
          padding: D.inputPad,
          fontSize: D.inputFont, color: colors.gray900,
          background: colors.white, outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px ${colors.bleu}18` : 'none',
          cursor: 'pointer',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

// ── Séparateur de section ────────────────────────────────────
function SectionTitle({ children, accent = colors.bleu, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
      <div style={{ width: 4, height: 20, borderRadius: 2, background: accent, flexShrink: 0 }} />
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.gray800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {children}
      </span>
    </div>
  )
}

// ── Carte de section ─────────────────────────────────────────
function SectionCard({ title, icon, accent = colors.bleu, children, style = {} }) {
  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md,
      boxShadow: shadows.sm,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        padding: `${spacing.sm} ${spacing.lg}`,
        borderBottom: `1px solid ${colors.gray100}`,
        background: colors.gray50,
        display: 'flex', alignItems: 'center', gap: spacing.sm,
      }}>
        {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
        <span style={{ fontSize: '12px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <div style={{ width: 24, height: 3, borderRadius: 2, background: accent, marginLeft: spacing.xs }} />
      </div>
      <div style={{ padding: spacing.lg }}>
        {children}
      </div>
    </div>
  )
}

// ── Barre de budget ──────────────────────────────────────────
function BudgetBar({ totalAlloue, maximum, solde }) {
  const pct    = maximum > 0 ? Math.min(100, Math.round((totalAlloue / maximum) * 100)) : 0
  const isOver = totalAlloue > maximum && maximum > 0
  const color  = pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success

  if (maximum === 0) return null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.gray50} 0%, ${colors.white} 100%)`,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md,
      padding: spacing.lg,
      boxShadow: shadows.sm,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Budget couvertures
          </span>
        </div>
        <span style={{
          fontSize: '13px', fontWeight: 700,
          color: isOver ? colors.danger : colors.gray800,
          padding: `3px 10px`,
          background: isOver ? colors.dangerBg : colors.successBg,
          borderRadius: radius.full,
        }}>
          {fmtN(totalAlloue)} / {fmtN(maximum)} FCFA
        </span>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 8, background: colors.gray200, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 4, transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color, fontWeight: 600 }}>
          {pct}% alloué{isOver && <strong style={{ color: colors.danger }}> — Dépassement du plafond !</strong>}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: solde > 0 ? colors.success : colors.danger,
        }}>
          Disponible : {fmtN(solde)} FCFA
        </span>
      </div>
    </div>
  )
}

// ── Formulaire entête ────────────────────────────────────────
function EnteteForm({ form, onChange, errors = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {/* Identité */}
      <div>
        <SectionTitle icon="🏢" accent={colors.bleu}>Identité</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1fr', gap: D.fieldGap }}>
          <Inp label="Identifiant" name="id_gen_partenaire" value={form.id_gen_partenaire || 'Auto'} disabled />
          <Inp label="Raison sociale" name="Nom" value={form.Nom} onChange={onChange} error={errors.Nom?.[0]} required placeholder="Nom complet du partenaire" />
          <Inp label="Code" name="code_societe" value={form.code_societe} onChange={onChange} error={errors.code_societe?.[0]} placeholder="Ex : PRTV-001" />
        </div>
      </div>

      {/* Localisation */}
      <div>
        <SectionTitle icon="📍" accent={colors.bleuMuted}>Localisation</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: D.fieldGap }}>
          <Sel label="Pays" name="pays" value={form.pays} onChange={onChange} placeholder="Sélectionner..." options={[
            { value: 'Sénégal', label: 'Sénégal' }, { value: 'Mali', label: 'Mali' },
            { value: "Côte d'Ivoire", label: "Côte d'Ivoire" }, { value: 'Mauritanie', label: 'Mauritanie' },
            { value: 'Guinée', label: 'Guinée' }, { value: 'France', label: 'France' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Sel label="Ville" name="ville" value={form.ville} onChange={onChange} placeholder="Sélectionner..." options={[
            { value: 'Dakar', label: 'Dakar' }, { value: 'Thiès', label: 'Thiès' },
            { value: 'Saint-Louis', label: 'Saint-Louis' }, { value: 'Ziguinchor', label: 'Ziguinchor' },
            { value: 'Kaolack', label: 'Kaolack' }, { value: 'Touba', label: 'Touba' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Inp label="Adresse complète" name="adress" value={form.adress} onChange={onChange} placeholder="Rue, quartier, BP..." />
        </div>
      </div>

      {/* Contact */}
      <div>
        <SectionTitle icon="📞" accent={colors.info}>Contact</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: D.fieldGap }}>
          <Inp label="Personne de contact" name="contact" value={form.contact} onChange={onChange} placeholder="Nom du responsable" />
          <Inp label="Téléphone / Mobile" name="mobile" value={form.mobile} onChange={onChange} placeholder="+221 7X XXX XX XX" />
          <Inp label="Adresse e-mail" name="email" value={form.email} onChange={onChange} type="email" error={errors.email?.[0]} placeholder="contact@societe.sn" />
        </div>
      </div>

      {/* Finance & Paramétrage */}
      <div>
        <SectionTitle icon="🏦" accent={colors.success}>Finance & Paramétrage</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: D.fieldGap, marginBottom: D.fieldGap }}>
          <Inp label="Type de société" name="type_societe" value={form.type_societe} onChange={onChange} placeholder="SA, SARL, GIE..." />
          <Sel label="Banque domiciliataire" name="bank" value={form.bank} onChange={onChange} placeholder="Sélectionner..." options={[
            { value: 'CBAO', label: 'CBAO' }, { value: 'SGBS', label: 'SGBS' },
            { value: 'BHS', label: 'BHS' }, { value: 'BOA', label: 'BOA' },
            { value: 'ECOBANK', label: 'ECOBANK' }, { value: 'UBA', label: 'UBA' },
            { value: 'BICIS', label: 'BICIS' }, { value: 'BNDE', label: 'BNDE' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Inp label="Numéro de compte" name="numero_compte" value={form.numero_compte} onChange={onChange} placeholder="IBAN / Compte bancaire" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr auto', gap: D.fieldGap, alignItems: 'end' }}>
          <Inp
            label="Plafond de crédit (FCFA)" name="maximum_credit"
            value={form.maximum_credit} onChange={onChange}
            type="number" error={errors.maximum_credit?.[0]}
            placeholder="0"
          />
          <Sel
            label="Catégorie de partenaire" name="TypePart"
            value={String(form.TypePart ?? 0)} onChange={onChange}
            options={TYPES_PARTENAIRE}
          />
          {/* Toggle Actif */}
          <div style={{ paddingBottom: '2px' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: spacing.sm,
              cursor: 'pointer',
              padding: `9px 14px`,
              border: `1.5px solid ${form.status === true || form.status === 'true' || form.status === 1 ? colors.success : colors.gray300}`,
              borderRadius: radius.sm,
              background: form.status === true || form.status === 'true' || form.status === 1 ? colors.successBg : colors.white,
              transition: 'all 0.2s',
              userSelect: 'none',
              fontSize: '13px', fontWeight: 600,
              color: form.status === true || form.status === 'true' || form.status === 1 ? colors.success : colors.gray500,
            }}>
              <input
                type="checkbox"
                checked={form.status === true || form.status === 'true' || form.status === 1}
                onChange={e => onChange({ target: { name: 'status', value: e.target.checked } })}
                style={{ accentColor: colors.success, width: 15, height: 15 }}
              />
              {form.status === true || form.status === 'true' || form.status === 1 ? '✓ Actif' : 'Inactif'}
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Info ligne (modal vue) ───────────────────────────────────
function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon && `${icon} `}{label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: colors.gray900 }}>
        {value || <span style={{ color: colors.gray400, fontStyle: 'italic' }}>—</span>}
      </span>
    </div>
  )
}

// ── Bouton de la barre de couverture ─────────────────────────
function BtnBar({ onClick, disabled, variant = 'default', children }) {
  const styles = {
    default: { bg: 'rgba(255,255,255,0.15)', color: colors.white, border: '1px solid rgba(255,255,255,0.3)' },
    primary: { bg: colors.white, color: colors.bleu, border: '1px solid rgba(255,255,255,0.8)' },
    danger:  { bg: colors.danger, color: colors.white, border: '1px solid transparent' },
    warning: { bg: colors.warning, color: colors.white, border: '1px solid transparent' },
  }
  const s = styles[variant] || styles.default
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: s.bg, color: s.color, border: s.border,
      borderRadius: radius.sm, padding: '6px 14px',
      fontSize: '12px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      display: 'flex', alignItems: 'center', gap: '5px',
      transition: 'opacity 0.15s',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

// ── Badge pourcentage ────────────────────────────────────────
function PctBadge({ value, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '3px 10px', borderRadius: radius.full,
      background: `${color}15`, color, fontWeight: 700, fontSize: '12px',
      border: `1px solid ${color}30`,
    }}>
      {value}%
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// TABLEAU COUVERTURES
// ══════════════════════════════════════════════════════════
function CouvertureTable({ partenaire, couvertures, setCouvertures, budget, setBudget, loading }) {
  const [selectedId, setSelectedId] = useState(null)
  const [editRow,    setEditRow]    = useState(null)
  const [newRow,     setNewRow]     = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [confirm,    setConfirm]    = useState(false)

  useEffect(() => { setSelectedId(null); setEditRow(null); setNewRow(null) }, [partenaire?.id_Rep])

  const reload = async () => {
    const r = await partenaireApi.couvertures(partenaire.id_Rep)
    setCouvertures(r.data.data || [])
    setBudget({
      totalAlloue: r.data.total_alloue    || 0,
      maximum:     r.data.maximum_credit  || 0,
      solde:       r.data.solde_disponible || 0,
    })
  }

  const handleAjouter = async () => {
    if (!newRow?.Nom?.trim()) { showToast('Le nom est obligatoire.', 'error'); return }
    const total = (+newRow.contributionCompagny || 0) + (+newRow.contributionPatient || 0)
    if (total !== 100) { showToast(`Part Compagnie + Part Patient = ${total}% (doit être 100%).`, 'error'); return }
    const montant = +newRow.Maximum_Credit || 0
    if (budget.maximum > 0 && montant > budget.solde) {
      showToast(`Dépassement du plafond. Disponible : ${fmtN(budget.solde)} FCFA.`, 'error'); return
    }
    setSaving(true)
    try {
      await partenaireApi.ajouterCouverture(partenaire.id_Rep, newRow)
      showToast('Type de couverture ajouté.'); setNewRow(null); await reload()
    } catch (err) { showToast(err.response?.data?.message || 'Erreur.', 'error') }
    finally { setSaving(false) }
  }

  const handleModifier = async () => {
    if (!editRow) return
    const total = (+editRow.contributionCompagny || 0) + (+editRow.contributionPatient || 0)
    if (total !== 100) { showToast(`Part Compagnie + Part Patient = ${total}% (doit être 100%).`, 'error'); return }
    setSaving(true)
    try {
      await partenaireApi.modifierCouverture(partenaire.id_Rep, editRow.id_Rep, editRow)
      showToast('Couverture mise à jour.'); setEditRow(null); setSelectedId(null); await reload()
    } catch (err) { showToast(err.response?.data?.message || 'Erreur.', 'error') }
    finally { setSaving(false) }
  }

  const handleSupprimer = async () => {
    setSaving(true)
    try {
      await partenaireApi.supprimerCouverture(partenaire.id_Rep, selectedId)
      showToast('Couverture supprimée.'); setConfirm(false); setSelectedId(null); setEditRow(null); await reload()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
    finally { setSaving(false) }
  }

  const selectRow = (row) => {
    if (newRow) return
    if (selectedId === row.id_Rep && editRow === null) {
      setEditRow({ ...row })
    } else if (selectedId !== row.id_Rep) {
      setSelectedId(row.id_Rep); setEditRow(null)
    }
  }

  const onEditChange = (field, val) => setEditRow(r => {
    const u = { ...r, [field]: val }
    if (field === 'contributionCompagny') u.contributionPatient  = 100 - +val
    if (field === 'contributionPatient')  u.contributionCompagny = 100 - +val
    return u
  })

  const onNewChange = (field, val) => setNewRow(r => {
    const u = { ...r, [field]: val }
    if (field === 'contributionCompagny') u.contributionPatient  = 100 - +val
    if (field === 'contributionPatient')  u.contributionCompagny = 100 - +val
    return u
  })

  const ancienMontant = couvertures.find(c => c.id_Rep === editRow?.id_Rep)?.Maximum_Credit || 0
  const montantNewRow  = +(newRow?.Maximum_Credit  || 0)
  const montantEditRow = +(editRow?.Maximum_Credit || 0)
  const soldeNewRow    = budget.solde - montantNewRow
  const soldeEditRow   = budget.solde + ancienMontant - montantEditRow
  const selectedRow    = couvertures.find(c => c.id_Rep === selectedId)

  // Styles inline de la table
  const tHead = {
    padding: '10px 12px', fontSize: '11px', fontWeight: 700,
    color: colors.white, background: colors.bleu,
    textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  }
  const tCell = {
    padding: '9px 12px', fontSize: '13px',
    borderBottom: `1px solid ${colors.gray100}`, verticalAlign: 'middle',
  }
  const inpCell = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${colors.bleu}`, borderRadius: radius.sm,
    padding: '6px 9px', fontSize: '12px', outline: 'none',
  }

  const isEditing = !!editRow || !!newRow

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md,
      boxShadow: shadows.sm,
      overflow: 'hidden',
    }}>
      {/* Barre titre avec actions */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #004080 100%)`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: spacing.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: colors.white }}>
            Types de couverture
          </span>
          {couvertures.length > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.2)', color: colors.white,
              borderRadius: radius.full, padding: '2px 8px', fontSize: '11px', fontWeight: 700,
            }}>
              {couvertures.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {newRow ? (
            <>
              <BtnBar onClick={() => setNewRow(null)}>Annuler</BtnBar>
              <BtnBar onClick={handleAjouter} disabled={saving} variant="primary">
                {saving ? 'Enregistrement...' : '✓ Enregistrer'}
              </BtnBar>
            </>
          ) : editRow ? (
            <>
              <BtnBar onClick={() => { setEditRow(null); setSelectedId(null) }}>Annuler</BtnBar>
              <BtnBar onClick={handleModifier} disabled={saving} variant="primary">
                {saving ? 'Mise à jour...' : '✓ Mettre à jour'}
              </BtnBar>
            </>
          ) : (
            <>
              <BtnBar
                onClick={() => { setNewRow({ ...EMPTY_COV }); setSelectedId(null); setEditRow(null) }}
                variant="primary"
              >
                + Ajouter
              </BtnBar>
              {selectedId && (
                <BtnBar onClick={() => setConfirm(true)} variant="danger">
                  Supprimer
                </BtnBar>
              )}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...tHead, width: 40, textAlign: 'center' }}>#</th>
              <th style={tHead}>Désignation</th>
              <th style={tHead}>Service</th>
              <th style={{ ...tHead, textAlign: 'right', width: 160 }}>Plafond</th>
              <th style={{ ...tHead, textAlign: 'center', width: 130 }}>Part Compagnie</th>
              <th style={{ ...tHead, textAlign: 'center', width: 120 }}>Part Patient</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne d'ajout */}
            {newRow && (
              <tr style={{ background: `${colors.bleu}08` }}>
                <td style={{ ...tCell, textAlign: 'center', color: colors.gray400, fontWeight: 600 }}>—</td>
                <td style={tCell}>
                  <input style={inpCell} value={newRow.Nom} placeholder="Nom du type *"
                    onChange={e => onNewChange('Nom', e.target.value)} autoFocus />
                </td>
                <td style={tCell}>
                  <input style={inpCell} value={newRow.service} placeholder="Service concerné"
                    onChange={e => onNewChange('service', e.target.value)} />
                </td>
                <td style={tCell}>
                  <input
                    style={{ ...inpCell, textAlign: 'right', borderColor: montantNewRow > budget.solde && budget.maximum > 0 ? colors.danger : colors.bleu }}
                    type="number" min="0" value={newRow.Maximum_Credit}
                    onChange={e => onNewChange('Maximum_Credit', e.target.value)}
                  />
                  {budget.maximum > 0 && (
                    <div style={{ fontSize: '10px', marginTop: 3, color: soldeNewRow >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>
                      Restant : {fmtN(soldeNewRow)} FCFA
                    </div>
                  )}
                </td>
                <td style={{ ...tCell, textAlign: 'center' }}>
                  <input style={{ ...inpCell, textAlign: 'center' }} type="number" min="0" max="100"
                    value={newRow.contributionCompagny} onChange={e => onNewChange('contributionCompagny', e.target.value)} />
                </td>
                <td style={{ ...tCell, textAlign: 'center' }}>
                  <input style={{ ...inpCell, textAlign: 'center' }} type="number" min="0" max="100"
                    value={newRow.contributionPatient} onChange={e => onNewChange('contributionPatient', e.target.value)} />
                </td>
              </tr>
            )}

            {/* Lignes existantes */}
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: colors.gray400 }}>
                  <FullPageSpinner />
                </td>
              </tr>
            ) : couvertures.length === 0 && !newRow ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: colors.gray400 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: '13px', fontStyle: 'italic' }}>
                    Aucun type de couverture. Cliquez sur <strong>+ Ajouter</strong> pour en créer un.
                  </div>
                </td>
              </tr>
            ) : couvertures.map((row, i) => {
              const isSel  = selectedId === row.id_Rep
              const isEdit = editRow?.id_Rep === row.id_Rep
              const bg = isEdit
                ? `${colors.bleu}0d`
                : isSel
                  ? `${colors.orange}12`
                  : i % 2 === 0 ? colors.white : colors.gray50

              return (
                <tr
                  key={row.id_Rep}
                  onClick={() => selectRow(row)}
                  onDoubleClick={() => { setSelectedId(row.id_Rep); setEditRow({ ...row }) }}
                  title="Clic = sélectionner · Double-clic = modifier"
                  style={{ background: bg, cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  <td style={{
                    ...tCell, textAlign: 'center', fontWeight: 700, color: colors.gray500,
                    borderLeft: isSel ? `3px solid ${colors.orange}` : isEdit ? `3px solid ${colors.bleu}` : '3px solid transparent',
                    width: 40,
                  }}>
                    {i + 1}
                  </td>
                  <td style={tCell}>
                    {isEdit
                      ? <input style={inpCell} value={editRow.Nom} onChange={e => onEditChange('Nom', e.target.value)} autoFocus />
                      : <span style={{ fontWeight: 600, color: colors.bleu }}>{row.Nom}</span>}
                  </td>
                  <td style={{ ...tCell, color: colors.gray600 }}>
                    {isEdit
                      ? <input style={inpCell} value={editRow.service || ''} onChange={e => onEditChange('service', e.target.value)} />
                      : row.service || <span style={{ color: colors.gray400, fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ ...tCell, textAlign: 'right' }}>
                    {isEdit ? (
                      <div>
                        <input
                          style={{ ...inpCell, textAlign: 'right', borderColor: soldeEditRow < 0 && budget.maximum > 0 ? colors.danger : colors.bleu }}
                          type="number" min="0" value={editRow.Maximum_Credit}
                          onChange={e => onEditChange('Maximum_Credit', e.target.value)}
                        />
                        {budget.maximum > 0 && (
                          <div style={{ fontSize: '10px', marginTop: 3, color: soldeEditRow >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>
                            Restant : {fmtN(soldeEditRow)} FCFA
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, color: colors.gray800 }}>
                        {fmtN(row.Maximum_Credit)} <span style={{ fontSize: '10px', color: colors.gray500, fontWeight: 500 }}>FCFA</span>
                      </span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit
                      ? <input style={{ ...inpCell, textAlign: 'center' }} type="number" min="0" max="100"
                          value={editRow.contributionCompagny} onChange={e => onEditChange('contributionCompagny', e.target.value)} />
                      : <PctBadge value={row.contributionCompagny} color={colors.bleu} />}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit
                      ? <input style={{ ...inpCell, textAlign: 'center' }} type="number" min="0" max="100"
                          value={editRow.contributionPatient} onChange={e => onEditChange('contributionPatient', e.target.value)} />
                      : <PctBadge value={row.contributionPatient} color={colors.orange} />}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Pied de tableau avec totaux */}
          {couvertures.length > 0 && !isEditing && (
            <tfoot>
              <tr style={{ background: colors.gray50, borderTop: `2px solid ${colors.gray200}` }}>
                <td colSpan={3} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: colors.gray700 }}>
                  Total — {couvertures.length} type{couvertures.length > 1 ? 's' : ''} de couverture
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: colors.bleu }}>
                  {fmtN(budget.totalAlloue)} <span style={{ fontSize: '10px', color: colors.gray500, fontWeight: 500 }}>FCFA</span>
                </td>
                <td colSpan={2} style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: colors.gray600 }}>
                  Plafond : {fmtN(budget.maximum)} FCFA
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Aide contextuelle */}
      {couvertures.length > 0 && !isEditing && (
        <div style={{
          padding: '6px 14px', fontSize: '11px',
          color: selectedRow ? colors.bleu : colors.gray400,
          borderTop: `1px solid ${colors.gray100}`,
          background: colors.gray50,
        }}>
          {selectedRow
            ? <>Sélectionné : <strong>{selectedRow.Nom}</strong> — double-clic pour modifier · cliquez sur <strong>Supprimer</strong> pour retirer</>
            : 'Cliquez sur une ligne pour la sélectionner · Double-clic pour modifier directement'}
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={handleSupprimer}
        message={`Supprimer le type de couverture "${selectedRow?.Nom}" ? Cette action est irréversible.`}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function PartenairesPage() {
  const [partenaires, setPartenaires] = useState([])
  const [selected,    setSelected]    = useState(null)
  const [couvertures, setCouvertures] = useState([])
  const [budget,      setBudget]      = useState({ totalAlloue: 0, maximum: 0, solde: 0 })
  const [loadingList, setLoadingList] = useState(true)
  const [loadingCov,  setLoadingCov]  = useState(false)
  const [search,      setSearch]      = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [form,        setForm]        = useState(EMPTY_HEADER)
  const [formErrors,  setFormErrors]  = useState({})
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [modalNew,    setModalNew]    = useState(false)
  const [modalView,   setModalView]   = useState(false)
  const [modalEdit,   setModalEdit]   = useState(false)
  const timer = useRef(null)

  const loadPartenaires = () => {
    setLoadingList(true)
    const params = {}
    if (search)           params.search   = search
    if (filterType !== '') params.TypePart = filterType
    partenaireApi.liste(params)
      .then(r => setPartenaires(r.data.data || []))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(loadPartenaires, 300)
    return () => clearTimeout(timer.current)
  }, [search, filterType])

  const loadCouvertures = async (part) => {
    setLoadingCov(true)
    try {
      const r = await partenaireApi.couvertures(part.id_Rep)
      setCouvertures(r.data.data || [])
      setBudget({
        totalAlloue: r.data.total_alloue      || 0,
        maximum:     r.data.maximum_credit    || 0,
        solde:       r.data.solde_disponible  || 0,
      })
    } catch { showToast('Erreur lors du chargement des couvertures.', 'error') }
    finally { setLoadingCov(false) }
  }

  const openViewModal = async (part) => {
    setSelected(part); setForm({ ...EMPTY_HEADER, ...part }); setModalView(true)
    await loadCouvertures(part)
  }

  const openEditModal = async (part) => {
    setSelected(part); setForm({ ...EMPTY_HEADER, ...part }); setFormErrors({}); setModalEdit(true)
    await loadCouvertures(part)
  }

  const closeModals = () => {
    setModalView(false); setModalEdit(false); setModalNew(false)
    setSelected(null); setCouvertures([])
    setForm(EMPTY_HEADER); setBudget({ totalAlloue: 0, maximum: 0, solde: 0 })
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setFormErrors({})
    try {
      if (selected) {
        await partenaireApi.modifier(selected.id_Rep, form)
        showToast('Partenaire mis à jour avec succès.')
      } else {
        await partenaireApi.creer(form)
        showToast('Nouveau partenaire créé.')
      }
      closeModals(); loadPartenaires()
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      showToast(err.response?.data?.message || 'Erreur de validation.', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await partenaireApi.supprimer(selected.id_Rep)
      showToast('Partenaire supprimé.'); setConfirmDel(false); closeModals(); loadPartenaires()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  return (
    <div>
      <PageHeader
        title="Partenaires & Couvertures"
        subtitle="Gestion des assurances, mutuelles et entreprises partenaires"
        actions={
          <Button onClick={() => { setModalNew(true); setForm(EMPTY_HEADER); setFormErrors({}) }} icon="➕">
            Nouveau partenaire
          </Button>
        }
      />

      {/* ── FILTRES ──────────────────────────────────────── */}
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.md,
        boxShadow: shadows.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        marginBottom: spacing.lg,
        display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            placeholder="Rechercher un partenaire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '8px 10px 8px 32px', fontSize: '13px', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '8px 12px', fontSize: '13px', background: colors.white,
            outline: 'none', cursor: 'pointer', color: colors.gray700,
          }}
        >
          <option value="">Tous les types</option>
          {TYPES_PARTENAIRE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {(search || filterType) && (
          <button
            onClick={() => { setSearch(''); setFilterType('') }}
            style={{
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '8px 12px', fontSize: '12px', background: colors.white,
              cursor: 'pointer', color: colors.gray600, fontWeight: 600,
            }}
          >
            Effacer
          </button>
        )}
      </div>

      {/* ── LISTE ────────────────────────────────────────── */}
      {loadingList ? <FullPageSpinner /> : (
        <div style={{
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md,
          boxShadow: shadows.sm,
          overflow: 'hidden',
        }}>
          {partenaires.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>
                Aucun partenaire trouvé
              </div>
              <div style={{ fontSize: '12px' }}>
                {search || filterType ? 'Modifiez vos critères de recherche.' : 'Créez votre premier partenaire.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                    {['#', 'Partenaire', 'Catégorie', 'Statut', 'Utilisation budget', 'Actions'].map((h, i) => (
                      <th key={i} style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        textAlign: i === 0 ? 'center' : i >= 4 ? 'right' : 'left',
                        fontSize: '11px', fontWeight: 700, color: colors.bleu,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partenaires.map((p, i) => {
                    const isActive = selected?.id_Rep === p.id_Rep
                    const alloue   = p.types_couverture_sum_maximum_credit || 0
                    const pct      = p.maximum_credit > 0 ? Math.min(100, Math.round((alloue / p.maximum_credit) * 100)) : 0
                    const barColor = pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success
                    const rowBg    = isActive ? `${colors.bleu}06` : i % 2 === 0 ? colors.white : colors.gray50

                    return (
                      <tr
                        key={p.id_Rep}
                        style={{ background: rowBg, borderBottom: `1px solid ${colors.gray100}` }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${colors.bleu}04` }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = rowBg }}
                      >
                        {/* N° */}
                        <td style={{
                          padding: spacing.md, textAlign: 'center',
                          fontWeight: 600, color: colors.gray500, fontSize: '12px',
                          borderLeft: isActive ? `3px solid ${colors.orange}` : '3px solid transparent',
                          width: 44,
                        }}>
                          {i + 1}
                        </td>

                        {/* Partenaire */}
                        <td style={{ padding: spacing.md }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: radius.sm, flexShrink: 0,
                              background: isActive
                                ? `linear-gradient(135deg, ${colors.orange}, ${colors.orangeDark})`
                                : `linear-gradient(135deg, ${colors.bleu}, #004080)`,
                              color: colors.white,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '15px', boxShadow: shadows.sm,
                            }}>
                              {(p.Nom || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: colors.gray900, fontSize: '13px', marginBottom: 2 }}>
                                {p.Nom}
                              </div>
                              <div style={{ fontSize: '11px', color: colors.gray500 }}>
                                {[p.ville, p.pays].filter(Boolean).join(', ')}
                                {p.types_couverture_count > 0 && (
                                  <span style={{ marginLeft: 8, color: colors.bleuMuted, fontWeight: 600 }}>
                                    · {p.types_couverture_count} couverture{p.types_couverture_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Catégorie */}
                        <td style={{ padding: spacing.md }}>
                          <Badge variant={TYPE_COLORS[p.TypePart] ?? 'default'}>
                            {TYPE_LABELS[p.TypePart] ?? '—'}
                          </Badge>
                        </td>

                        {/* Statut */}
                        <td style={{ padding: spacing.md }}>
                          <StatusBadge active={p.status} />
                        </td>

                        {/* Budget */}
                        <td style={{ padding: spacing.md, textAlign: 'right', minWidth: 160 }}>
                          {p.maximum_credit > 0 ? (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.gray700, marginBottom: 4 }}>
                                {fmtN(alloue)} / {fmtN(p.maximum_credit)} FCFA
                              </div>
                              <div style={{ height: 5, background: colors.gray200, borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                              </div>
                              <div style={{ fontSize: '11px', color: barColor, fontWeight: 600 }}>
                                {pct}% alloué
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: colors.gray400, fontStyle: 'italic' }}>Non défini</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: spacing.md, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'flex-end' }}>
                            <ActionBtn
                              onClick={e => { e.stopPropagation(); openViewModal(p) }}
                              color={colors.bleu} bg={`${colors.bleu}12`} title="Voir les détails"
                            >
                              Voir
                            </ActionBtn>
                            <ActionBtn
                              onClick={e => { e.stopPropagation(); openEditModal(p) }}
                              color={colors.warning} bg={`${colors.warning}12`} title="Modifier"
                            >
                              Modifier
                            </ActionBtn>
                            <ActionBtn
                              onClick={e => { e.stopPropagation(); setSelected(p); setConfirmDel(true) }}
                              color={colors.danger} bg={`${colors.danger}10`} title="Supprimer"
                            >
                              Supprimer
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: `${spacing.sm} ${spacing.lg}`, borderTop: `1px solid ${colors.gray100}`, background: colors.gray50, fontSize: '11px', color: colors.gray500 }}>
                {partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''} affiché{partenaires.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL NOUVEAU PARTENAIRE ─────────────────────── */}
      <Modal
        open={modalNew}
        onClose={() => setModalNew(false)}
        title="Nouveau partenaire"
        width={800}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalNew(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Création en cours...' : 'Créer le partenaire'}
            </Button>
          </>
        }
      >
        <EnteteForm form={form} onChange={handleChange} errors={formErrors} />
      </Modal>

      {/* ── MODAL DÉTAILS ───────────────────────────────── */}
      <Modal
        open={modalView}
        onClose={closeModals}
        title={`Détails — ${selected?.Nom}`}
        width={900}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={closeModals}>Fermer</Button>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button variant="danger" onClick={() => { setModalView(false); setConfirmDel(true) }}>Supprimer</Button>
              <Button onClick={() => { setModalView(false); openEditModal(selected) }}>Modifier</Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>

          {/* En-tête partenaire */}
          <div style={{
            display: 'flex', gap: spacing.lg, alignItems: 'center',
            padding: spacing.lg,
            background: `linear-gradient(135deg, ${colors.bleu} 0%, #004080 100%)`,
            borderRadius: radius.md, color: colors.white,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: radius.md, flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '24px',
            }}>
              {(selected?.Nom || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: 4 }}>{selected?.Nom}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                <span>{TYPE_LABELS[selected?.TypePart] ?? '—'}</span>
                <span>·</span>
                <span>{[selected?.ville, selected?.pays].filter(Boolean).join(', ')}</span>
                {selected?.code_societe && <><span>·</span><span>Code : {selected.code_societe}</span></>}
              </div>
            </div>
            <StatusBadge active={selected?.status} />
          </div>

          {/* Informations en deux colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <SectionCard title="Coordonnées" icon="📋" accent={colors.bleu}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                <InfoRow label="Contact" value={selected?.contact} icon="👤" />
                <InfoRow label="Téléphone" value={selected?.mobile} icon="📱" />
                <InfoRow label="Email" value={selected?.email} icon="✉️" />
                <InfoRow label="Adresse" value={selected?.adress} icon="📍" />
              </div>
            </SectionCard>
            <SectionCard title="Données financières" icon="🏦" accent={colors.success}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                <InfoRow label="Banque" value={selected?.bank} icon="🏦" />
                <InfoRow label="N° Compte" value={selected?.numero_compte} icon="💳" />
                <InfoRow label="Type société" value={selected?.type_societe} icon="🏢" />
                <InfoRow label="Plafond crédit" value={selected?.maximum_credit ? fmt(selected.maximum_credit) : undefined} icon="💰" />
              </div>
            </SectionCard>
          </div>

          {/* Budget */}
          {budget.maximum > 0 && (
            <BudgetBar totalAlloue={budget.totalAlloue} maximum={budget.maximum} solde={budget.solde} />
          )}

          {/* Couvertures en lecture seule */}
          <SectionCard title={`Types de couverture (${couvertures.length})`} icon="🛡️" accent={colors.orange}>
            {loadingCov ? (
              <FullPageSpinner />
            ) : couvertures.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.gray400, padding: spacing.lg, fontStyle: 'italic' }}>
                Aucun type de couverture défini pour ce partenaire.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.gray200}` }}>
                      {['Désignation', 'Service', 'Plafond', 'Part Compagnie', 'Part Patient'].map((h, i) => (
                        <th key={i} style={{
                          padding: `${spacing.sm} ${spacing.md}`, fontSize: '11px', fontWeight: 700,
                          color: colors.bleu, textTransform: 'uppercase', letterSpacing: '0.4px',
                          textAlign: i >= 2 ? 'right' : 'left',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {couvertures.map((cov, i) => (
                      <tr key={cov.id_Rep} style={{ background: i % 2 === 0 ? colors.white : colors.gray50 }}>
                        <td style={{ padding: `${spacing.sm} ${spacing.md}`, fontWeight: 600, color: colors.bleu }}>{cov.Nom}</td>
                        <td style={{ padding: `${spacing.sm} ${spacing.md}`, color: colors.gray600, fontSize: '12px' }}>{cov.service || '—'}</td>
                        <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right', fontWeight: 700 }}>{fmtN(cov.Maximum_Credit)} FCFA</td>
                        <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right' }}><PctBadge value={cov.contributionCompagny} color={colors.bleu} /></td>
                        <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right' }}><PctBadge value={cov.contributionPatient} color={colors.orange} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </Modal>

      {/* ── MODAL MODIFIER ──────────────────────────────── */}
      <Modal
        open={modalEdit}
        onClose={closeModals}
        title={`Modifier — ${selected?.Nom}`}
        width={950}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={closeModals}>Annuler</Button>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button variant="danger" onClick={() => { setModalEdit(false); setConfirmDel(true) }}>Supprimer</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <EnteteForm form={form} onChange={handleChange} errors={formErrors} />

          {budget.maximum > 0 && (
            <BudgetBar totalAlloue={budget.totalAlloue} maximum={budget.maximum} solde={budget.solde} />
          )}

          <div>
            <SectionTitle icon="🛡️" accent={colors.orange}>Gestion des types de couverture</SectionTitle>
            <CouvertureTable
              partenaire={selected}
              couvertures={couvertures}
              setCouvertures={setCouvertures}
              budget={budget}
              setBudget={setBudget}
              loading={loadingCov}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        onCancel={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        message={`Supprimer "${selected?.Nom}" et tous ses types de couverture ? Cette action est irréversible.`}
      />
    </div>
  )
}

// ── Bouton action compact ────────────────────────────────────
function ActionBtn({ onClick, color, bg, title, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${color}30`,
        borderRadius: radius.sm,
        padding: '5px 10px',
        fontSize: '11px', fontWeight: 600,
        cursor: 'pointer',
        background: hovered ? `${color}20` : bg,
        color,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
