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

// ── Constantes ─────────────────────────────────────────────
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

// ── Formatage montant FCFA ─────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR')

// ── Styles partagés ────────────────────────────────────────
const S = {
  label:  { ...typography.label, color: colors.bleu, display: 'block', marginBottom: spacing.xs },
  input:  { width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.bleu}`, borderRadius: radius.sm, padding: `${spacing.xs} ${spacing.sm}`, ...typography.input, color: colors.gray900, outline: 'none' },
  inputD: { width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, padding: `${spacing.xs} ${spacing.sm}`, ...typography.input, background: colors.gray100, color: colors.gray500 },
  select: { width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.bleu}`, borderRadius: radius.sm, padding: `${spacing.xs} ${spacing.sm}`, ...typography.input, background: colors.white, color: colors.gray900, outline: 'none' },
  field:  { display: 'flex', flexDirection: 'column', gap: spacing.xs },
}

function Inp({ label, name, value, onChange, disabled, type = 'text', error, style = {} }) {
  return (
    <div style={S.field}>
      {label && <label style={{ ...S.label, color: error ? colors.danger : colors.bleu }}>{label}</label>}
      <input type={type} name={name} value={value ?? ''} onChange={onChange} disabled={disabled}
        style={{ ...(disabled ? S.inputD : S.input), borderColor: error ? colors.danger : colors.bleu, ...style }} />
      {error && <span style={{ ...typography.caption, color: colors.danger }}>{error}</span>}
    </div>
  )
}

function Sel({ label, name, value, onChange, options, placeholder = '' }) {
  return (
    <div style={S.field}>
      {label && <label style={S.label}>{label}</label>}
      <select name={name} value={value ?? ''} onChange={onChange} style={S.select}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// BARRE DE BUDGET
// ══════════════════════════════════════════════════════════
function BudgetBar({ totalAlloue, maximum, solde }) {
  const pct     = maximum > 0 ? Math.min(100, Math.round((totalAlloue / maximum) * 100)) : 0
  const isOver  = totalAlloue > maximum && maximum > 0
  const color   = pct >= 90 ? colors.danger : pct >= 70 ? colors.orange : colors.success

  return (
    <div style={{ background: colors.gray50, border: `1px solid ${colors.gray200}`, borderRadius: radius.sm, padding: spacing.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs, ...typography.bodySm }}>
        <span style={{ fontWeight: 700, color: colors.bleu }}>Budget couvertures</span>
        <span style={{ fontWeight: 700, color: isOver ? colors.danger : colors.gray700 }}>
          {fmtN(totalAlloue)} / {fmtN(maximum)} FCFA
        </span>
      </div>
      {/* Barre de progression */}
      <div style={{ height: 6, background: colors.gray200, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.xs }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', ...typography.caption }}>
        <span style={{ color }}>
          {pct}% utilisé
          {isOver && <strong style={{ color: colors.danger }}> — DÉPASSEMENT !</strong>}
        </span>
        <span style={{ color: solde > 0 ? colors.success : colors.danger, fontWeight: 600 }}>
          Disponible : {fmtN(solde)} FCFA
        </span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION ENTÊTE (fidèle à l'image)
// ══════════════════════════════════════════════════════════
function EnteteForm({ form, onChange, errors = {} }) {
  return (
    <div style={{ border: `2px solid ${colors.bleu}`, borderRadius: radius.sm, overflow: 'hidden' }}>
      <div style={{ background: colors.bleu, color: colors.white, padding: `${spacing.sm} ${spacing.md}`, ...typography.h3 }}>
        Entête
      </div>
      <div style={{ padding: spacing.md, background: colors.white, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {/* Ligne 1 : ID · Nom · CODE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 2.2fr 1fr', gap: spacing.sm }}>
          <Inp label="ID" name="id_gen_partenaire" value={form.id_gen_partenaire || '(auto)'} disabled />
          <Inp label="Nom" name="Nom" value={form.Nom} onChange={onChange} error={errors.Nom?.[0]} />
          <Inp label="CODE" name="code_societe" value={form.code_societe} onChange={onChange} error={errors.code_societe?.[0]} />
        </div>

        {/* Ligne 2 : Pays · Ville · Adresse */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: spacing.sm }}>
          <Sel label="Pays" name="pays" value={form.pays} onChange={onChange} options={[
            { value: 'Sénégal', label: 'Sénégal' }, { value: 'Mali', label: 'Mali' },
            { value: "Côte d'Ivoire", label: "Côte d'Ivoire" }, { value: 'Mauritanie', label: 'Mauritanie' },
            { value: 'Guinée', label: 'Guinée' }, { value: 'France', label: 'France' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Sel label="Ville" name="ville" value={form.ville} onChange={onChange} options={[
            { value: 'Dakar', label: 'Dakar' }, { value: 'Thiès', label: 'Thiès' },
            { value: 'Saint-Louis', label: 'Saint-Louis' }, { value: 'Ziguinchor', label: 'Ziguinchor' },
            { value: 'Kaolack', label: 'Kaolack' }, { value: 'Touba', label: 'Touba' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Inp label="Adresse" name="adress" value={form.adress} onChange={onChange} />
        </div>

        {/* Ligne 3 : Contact · Telephone · Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.sm }}>
          <Inp label="Contact" name="contact" value={form.contact} onChange={onChange} />
          <Inp label="Telephone" name="mobile" value={form.mobile} onChange={onChange} />
          <Inp label="Email" name="email" value={form.email} onChange={onChange} type="email" error={errors.email?.[0]} />
        </div>

        {/* Ligne 4 : Type Société · Banque · Numéro Compte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.sm }}>
          <Inp label="Type de Société" name="type_societe" value={form.type_societe} onChange={onChange} />
          <Sel label="Banque" name="bank" value={form.bank} onChange={onChange} options={[
            { value: 'CBAO', label: 'CBAO' }, { value: 'SGBS', label: 'SGBS' },
            { value: 'BHS', label: 'BHS' }, { value: 'BOA', label: 'BOA' },
            { value: 'ECOBANK', label: 'ECOBANK' }, { value: 'UBA', label: 'UBA' },
            { value: 'BICIS', label: 'BICIS' }, { value: 'BNDE', label: 'BNDE' },
            { value: 'Autre', label: 'Autre' },
          ]} />
          <Inp label="Numéro Compte" name="numero_compte" value={form.numero_compte} onChange={onChange} />
        </div>

        {/* Ligne 5 : Maximum Crédit · Type Partenaire · Actif */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: spacing.sm, alignItems: 'end' }}>
          <Inp label="Maximum Crédit (FCFA)" name="maximum_credit" value={form.maximum_credit} onChange={onChange}
            type="number" error={errors.maximum_credit?.[0]} />
          <Sel label="Type Partenaire" name="TypePart" value={String(form.TypePart ?? 0)} onChange={onChange}
            options={TYPES_PARTENAIRE} />
          <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, ...typography.label, color: colors.bleu, cursor: 'pointer', paddingBottom: spacing.xs }}>
            <input
              type="checkbox"
              checked={form.status === true || form.status === 'true' || form.status === 1}
              onChange={e => onChange({ target: { name: 'status', value: e.target.checked } })}
              style={{ width: 14, height: 14, accentColor: colors.bleu }}
            />
            Actif
          </label>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TABLEAU TYPE DE COUVERTURE
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
      totalAlloue: r.data.total_alloue  || 0,
      maximum:     r.data.maximum_credit || 0,
      solde:       r.data.solde_disponible || 0,
    })
  }

  const soldeApresAjout = (montant) => budget.solde - (montant || 0)

  // ── Ajouter ──────────────────────────────────────────────
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
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error')
    } finally { setSaving(false) }
  }

  // ── Modifier ──────────────────────────────────────────────
  const handleModifier = async () => {
    if (!editRow) return
    const total = (+editRow.contributionCompagny || 0) + (+editRow.contributionPatient || 0)
    if (total !== 100) { showToast(`Part Compagnie + Part Patient = ${total}% (doit être 100%).`, 'error'); return }
    setSaving(true)
    try {
      await partenaireApi.modifierCouverture(partenaire.id_Rep, editRow.id_Rep, editRow)
      showToast('Type de couverture modifié.'); setEditRow(null); setSelectedId(null); await reload()
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error')
    } finally { setSaving(false) }
  }

  // ── Supprimer ─────────────────────────────────────────────
  const handleSupprimer = async () => {
    setSaving(true)
    try {
      await partenaireApi.supprimerCouverture(partenaire.id_Rep, selectedId)
      showToast('Type de couverture supprimé.'); setConfirm(false); setSelectedId(null); setEditRow(null); await reload()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
    finally { setSaving(false) }
  }

  // ── Sélection / édition ───────────────────────────────────
  const selectRow = (row) => {
    if (newRow) return
    if (selectedId === row.id_Rep && editRow === null) {
      setEditRow({ ...row })
    } else if (selectedId !== row.id_Rep) {
      setSelectedId(row.id_Rep); setEditRow(null)
    }
  }

  const onEditChange = (field, val) => {
    setEditRow(r => {
      const u = { ...r, [field]: val }
      if (field === 'contributionCompagny') u.contributionPatient  = 100 - +val
      if (field === 'contributionPatient')  u.contributionCompagny = 100 - +val
      return u
    })
  }

  const onNewChange = (field, val) => {
    setNewRow(r => {
      const u = { ...r, [field]: val }
      if (field === 'contributionCompagny') u.contributionPatient  = 100 - +val
      if (field === 'contributionPatient')  u.contributionCompagny = 100 - +val
      return u
    })
  }

  const inpSt  = { width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.bleu}`, borderRadius: 3, padding: '3px 6px', fontSize: 12 }
  const cellSt = { padding: '7px 8px', borderBottom: `1px solid ${colors.gray100}`, fontSize: 13, verticalAlign: 'middle' }
  const headSt = { padding: '9px 8px', fontSize: 12, fontWeight: 700, color: colors.white, background: colors.bleu, textAlign: 'left' }

  const selectedRow = couvertures.find(c => c.id_Rep === selectedId)

  const montantNewRow  = +(newRow?.Maximum_Credit  || 0)
  const montantEditRow = +(editRow?.Maximum_Credit || 0)
  const ancienMontant  = couvertures.find(c => c.id_Rep === editRow?.id_Rep)?.Maximum_Credit || 0
  const soldeNewRow    = budget.solde - montantNewRow
  const soldeEditRow   = budget.solde + ancienMontant - montantEditRow

  return (
    <div style={{ border: `2px solid ${colors.bleu}`, borderRadius: radius.sm, overflow: 'hidden' }}>
      {/* ── Barre titre ───────────────────────────────────── */}
      <div style={{
        background: colors.bleu, color: colors.white, padding: '7px 12px', fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Type de couverture</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {newRow ? (
            <>
              <BtnBar onClick={() => setNewRow(null)} v="gray">Annuler</BtnBar>
              <BtnBar onClick={handleAjouter} disabled={saving} v="white">{saving ? '...' : '✓ Enregistrer'}</BtnBar>
            </>
          ) : editRow ? (
            <>
              <BtnBar onClick={() => { setEditRow(null); setSelectedId(null) }} v="gray">Annuler</BtnBar>
              <BtnBar onClick={handleModifier} disabled={saving} v="white">{saving ? '...' : '✓ Mettre à jour'}</BtnBar>
            </>
          ) : (
            <>
              <BtnBar onClick={() => { setNewRow({ ...EMPTY_COV }); setSelectedId(null); setEditRow(null) }} v="white">
                Ajouter
              </BtnBar>
              <BtnBar
                onClick={() => selectedId ? setConfirm(true) : showToast('Sélectionnez d\'abord une ligne.', 'error')}
                v="orange"
              >
                Supprimer
              </BtnBar>
            </>
          )}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div style={{ background: colors.white, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...headSt, width: 44, textAlign: 'center' }}>N°#</th>
              <th style={headSt}>Nom</th>
              <th style={headSt}>Service</th>
              <th style={{ ...headSt, textAlign: 'right', width: 150 }}>Maximum Crédit</th>
              <th style={{ ...headSt, textAlign: 'center', width: 120 }}>Part Compagnie %</th>
              <th style={{ ...headSt, textAlign: 'center', width: 110 }}>Part Patient %</th>
            </tr>
          </thead>
          <tbody>
            {/* Ligne d'ajout */}
            {newRow && (
              <tr style={{ background: `${colors.bleu}10` }}>
                <td style={{ ...cellSt, textAlign: 'center', color: colors.gray400 }}>—</td>
                <td style={cellSt}><input style={inpSt} value={newRow.Nom} onChange={e => onNewChange('Nom', e.target.value)} placeholder="Nom du type *" /></td>
                <td style={cellSt}><input style={inpSt} value={newRow.service} onChange={e => onNewChange('service', e.target.value)} placeholder="Service concerné" /></td>
                <td style={cellSt}>
                  <input style={{ ...inpSt, textAlign: 'right', borderColor: montantNewRow > budget.solde && budget.maximum > 0 ? colors.danger : colors.bleu }}
                    type="number" min="0" value={newRow.Maximum_Credit}
                    onChange={e => onNewChange('Maximum_Credit', e.target.value)} />
                  {budget.maximum > 0 && (
                    <div style={{ fontSize: 10, color: soldeNewRow >= 0 ? colors.success : colors.danger, marginTop: 2 }}>
                      Reste après : {fmtN(soldeNewRow)} FCFA
                    </div>
                  )}
                </td>
                <td style={cellSt}>
                  <input style={{ ...inpSt, textAlign: 'center' }} type="number" min="0" max="100"
                    value={newRow.contributionCompagny} onChange={e => onNewChange('contributionCompagny', e.target.value)} />
                </td>
                <td style={cellSt}>
                  <input style={{ ...inpSt, textAlign: 'center' }} type="number" min="0" max="100"
                    value={newRow.contributionPatient} onChange={e => onNewChange('contributionPatient', e.target.value)} />
                </td>
              </tr>
            )}

            {/* Lignes existantes */}
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: colors.gray400 }}>Chargement...</td></tr>
            ) : couvertures.length === 0 && !newRow ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: colors.gray400, fontStyle: 'italic' }}>
                  Aucun type de couverture. Cliquez sur "Ajouter".
                </td>
              </tr>
            ) : couvertures.map((row, i) => {
              const isSel  = selectedId === row.id_Rep
              const isEdit = editRow?.id_Rep === row.id_Rep
              const bg = isEdit ? `${colors.bleu}12` : isSel ? `${colors.orange}15` : i % 2 === 0 ? colors.white : colors.gray50

              return (
                <tr
                  key={row.id_Rep}
                  onClick={() => selectRow(row)}
                  onDoubleClick={() => { setSelectedId(row.id_Rep); setEditRow({ ...row }) }}
                  title="Clic = sélectionner · Double-clic = modifier"
                  style={{ background: bg, cursor: 'pointer' }}
                >
                  <td style={{ ...cellSt, textAlign: 'center', fontWeight: 600, color: colors.gray500, borderLeft: isSel ? `3px solid ${colors.orange}` : '3px solid transparent' }}>
                    {i + 1}
                  </td>
                  <td style={cellSt}>
                    {isEdit
                      ? <input style={inpSt} value={editRow.Nom} onChange={e => onEditChange('Nom', e.target.value)} />
                      : <span style={{ fontWeight: 600, color: colors.bleu }}>{row.Nom}</span>}
                  </td>
                  <td style={cellSt}>
                    {isEdit
                      ? <input style={inpSt} value={editRow.service || ''} onChange={e => onEditChange('service', e.target.value)} />
                      : row.service || '—'}
                  </td>
                  <td style={{ ...cellSt, textAlign: 'right' }}>
                    {isEdit ? (
                      <div>
                        <input style={{ ...inpSt, textAlign: 'right', borderColor: soldeEditRow < 0 && budget.maximum > 0 ? colors.danger : colors.bleu }}
                          type="number" min="0" value={editRow.Maximum_Credit}
                          onChange={e => onEditChange('Maximum_Credit', e.target.value)} />
                        {budget.maximum > 0 && (
                          <div style={{ fontSize: 10, color: soldeEditRow >= 0 ? colors.success : colors.danger, marginTop: 2 }}>
                            Reste après : {fmtN(soldeEditRow)} FCFA
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{fmtN(row.Maximum_Credit)} FCFA</span>
                    )}
                  </td>
                  <td style={{ ...cellSt, textAlign: 'center' }}>
                    {isEdit
                      ? <input style={{ ...inpSt, textAlign: 'center' }} type="number" min="0" max="100"
                          value={editRow.contributionCompagny} onChange={e => onEditChange('contributionCompagny', e.target.value)} />
                      : <PctBadge value={row.contributionCompagny} color={colors.bleu} />}
                  </td>
                  <td style={{ ...cellSt, textAlign: 'center' }}>
                    {isEdit
                      ? <input style={{ ...inpSt, textAlign: 'center' }} type="number" min="0" max="100"
                          value={editRow.contributionPatient} onChange={e => onEditChange('contributionPatient', e.target.value)} />
                      : <PctBadge value={row.contributionPatient} color={colors.orange} />}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Ligne totaux */}
          {couvertures.length > 0 && !newRow && !editRow && (
            <tfoot>
              <tr style={{ background: colors.bleu, color: colors.white }}>
                <td colSpan={3} style={{ padding: '7px 8px', fontSize: 12, fontWeight: 700 }}>
                  TOTAL — {couvertures.length} type(s) de couverture
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontSize: 12 }}>
                  {fmtN(budget.totalAlloue)} FCFA
                </td>
                <td colSpan={2} style={{ padding: '7px 8px', textAlign: 'center', fontSize: 11 }}>
                  Plafond : {fmtN(budget.maximum)} FCFA
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Aide */}
      {couvertures.length > 0 && !newRow && !editRow && (
        <div style={{ background: colors.gray50, padding: '5px 12px', fontSize: 11, color: colors.gray400, borderTop: `1px solid ${colors.gray200}` }}>
          {selectedRow
            ? <span style={{ color: colors.bleu }}>Sélectionné : <strong>{selectedRow.Nom}</strong> — double-clic pour modifier</span>
            : 'Cliquez sur une ligne pour la sélectionner · Double-clic pour modifier'}
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={handleSupprimer}
        message={`Supprimer le type de couverture "${couvertures.find(c => c.id_Rep === selectedId)?.Nom}" ?`}
      />
    </div>
  )
}

function PctBadge({ value, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12,
      background: `${color}18`, color, fontWeight: 700, fontSize: 12,
    }}>
      {value}%
    </span>
  )
}

function BtnBar({ onClick, disabled, v, children }) {
  const bg = v === 'white' ? colors.white : v === 'orange' ? colors.orange : colors.gray500
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg, color: v === 'white' ? colors.bleu : colors.white,
      border: 'none', borderRadius: 3, padding: '4px 14px',
      fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
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

  // ── Chargement liste ──────────────────────────────────
  const loadPartenaires = () => {
    setLoadingList(true)
    const params = {}
    if (search)          params.search   = search
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

  // ── Gestion des modals ─────────────────────────────
  const openViewModal = async (part) => {
    setSelected(part)
    setForm({ ...EMPTY_HEADER, ...part })
    setModalView(true)
    // Charger les couvertures pour la vue détaillée
    setLoadingCov(true)
    try {
      const r = await partenaireApi.couvertures(part.id_Rep)
      setCouvertures(r.data.data || [])
      setBudget({
        totalAlloue: r.data.total_alloue     || 0,
        maximum:     r.data.maximum_credit   || 0,
        solde:       r.data.solde_disponible || 0,
      })
    } catch (err) {
      showToast('Erreur lors du chargement des couvertures.', 'error')
    } finally {
      setLoadingCov(false)
    }
  }

  const openEditModal = async (part) => {
    setSelected(part)
    setForm({ ...EMPTY_HEADER, ...part })
    setFormErrors({})
    setModalEdit(true)
    // Charger les couvertures pour l'édition
    setLoadingCov(true)
    try {
      const r = await partenaireApi.couvertures(part.id_Rep)
      setCouvertures(r.data.data || [])
      setBudget({
        totalAlloue: r.data.total_alloue     || 0,
        maximum:     r.data.maximum_credit   || 0,
        solde:       r.data.solde_disponible || 0,
      })
    } catch (err) {
      showToast('Erreur lors du chargement des couvertures.', 'error')
    } finally {
      setLoadingCov(false)
    }
  }

  const closeModals = () => {
    setModalView(false)
    setModalEdit(false)
    setModalNew(false)
    setSelected(null)
    setCouvertures([])
    setForm(EMPTY_HEADER)
    setBudget({ totalAlloue: 0, maximum: 0, solde: 0 })
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Sauvegarder partenaire ────────────────────────────
  const handleSave = async () => {
    setSaving(true); setFormErrors({})
    try {
      if (selected) {
        const r = await partenaireApi.modifier(selected.id_Rep, form)
        const upd = r.data.data
        showToast('Partenaire mis à jour.')
        closeModals()
      } else {
        const r = await partenaireApi.creer(form)
        showToast('Partenaire créé.')
        closeModals()
      }
      loadPartenaires()
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
        title="Partenaires & Types de couverture"
        subtitle="Assurances, mutuelles, entreprises partenaires"
        actions={
          <Button onClick={() => { setModalNew(true); setForm(EMPTY_HEADER); setFormErrors({}) }} icon="➕">
            Nouveau partenaire
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── LISTE ─────────────────────────────────────── */}
        <div>
          <div style={{
            background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
            padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 120, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px 10px', fontSize: 13, outline: 'none' }} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px 10px', fontSize: 13, background: colors.white, outline: 'none' }}>
              <option value="">Tous les types</option>
              {TYPES_PARTENAIRE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {loadingList ? <FullPageSpinner /> : (
            <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
              {partenaires.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: colors.gray400 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
                  Aucun partenaire trouvé.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', ...typography.body }}>
                    <thead>
                      <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>N°</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>Partenaire</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>Statut</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>Budget</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center', fontWeight: 700, color: colors.bleu, ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partenaires.map((p, i) => {
                        const isActive = selected?.id_Rep === p.id_Rep
                        const alloue = p.types_couverture_sum_maximum_credit || 0
                        const pct = p.maximum_credit > 0 ? Math.min(100, Math.round((alloue / p.maximum_credit) * 100)) : 0
                        const barColor = pct >= 90 ? colors.danger : pct >= 70 ? colors.orange : colors.success
                        const rowBg = isActive ? `${colors.bleu}08` : i % 2 === 0 ? colors.white : colors.gray50

                        return (
                          <tr
                            key={p.id_Rep}
                            style={{
                              background: rowBg,
                              borderBottom: `1px solid ${colors.gray100}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.background = `${colors.bleu}05`
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = rowBg
                            }}
                          >
                            {/* Numéro */}
                            <td style={{
                              padding: spacing.md,
                              textAlign: 'center',
                              fontWeight: 600,
                              color: colors.gray600,
                              borderLeft: isActive ? `4px solid ${colors.orange}` : '4px solid transparent'
                            }}>
                              {i + 1}
                            </td>

                            {/* Informations principales */}
                            <td style={{ padding: spacing.md }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: radius.sm, flexShrink: 0,
                                  background: isActive ? colors.orange : colors.bleu, color: colors.white,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: 14, boxShadow: shadows.sm
                                }}>
                                  {(p.Nom || '?')[0].toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{
                                    fontWeight: 700,
                                    color: colors.bleu,
                                    ...typography.body,
                                    marginBottom: spacing.xs,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {p.Nom}
                                  </div>
                                  <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ ...typography.caption, color: colors.gray500 }}>
                                      {p.ville}, {p.pays}
                                    </span>
                                    <span style={{ ...typography.caption, color: colors.gray400 }}>•</span>
                                    <span style={{ ...typography.caption, color: colors.gray500 }}>
                                      {p.types_couverture_count} couverture{p.types_couverture_count !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Type de partenaire */}
                            <td style={{ padding: spacing.md }}>
                              <Badge
                                variant={TYPE_COLORS[p.TypePart] ?? 'default'}
                                style={{
                                  ...typography.caption,
                                  padding: `${spacing.xs} ${spacing.sm}`,
                                  borderRadius: radius.sm,
                                  fontWeight: 600
                                }}
                              >
                                {TYPE_LABELS[p.TypePart] ?? '—'}
                              </Badge>
                            </td>

                            {/* Statut */}
                            <td style={{ padding: spacing.md, textAlign: 'center' }}>
                              <StatusBadge
                                active={p.status}
                                style={{
                                  ...typography.caption,
                                  padding: `${spacing.xs} ${spacing.sm}`,
                                  borderRadius: radius.sm
                                }}
                              />
                            </td>

                            {/* Budget */}
                            <td style={{ padding: spacing.md, textAlign: 'right' }}>
                              {p.maximum_credit > 0 ? (
                                <div style={{ minWidth: 100 }}>
                                  <div style={{
                                    ...typography.bodySm,
                                    fontWeight: 600,
                                    color: colors.gray700,
                                    marginBottom: spacing.xs
                                  }}>
                                    {fmtN(alloue)} / {fmtN(p.maximum_credit)} FCFA
                                  </div>
                                  <div style={{
                                    height: 5,
                                    background: colors.gray200,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    marginBottom: spacing.xs
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${pct}%`,
                                      background: barColor,
                                      borderRadius: 3,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                  <div style={{
                                    ...typography.caption,
                                    color: barColor,
                                    fontWeight: 600
                                  }}>
                                    {pct}% utilisé
                                  </div>
                                </div>
                              ) : (
                                <span style={{ ...typography.caption, color: colors.gray400 }}>
                                  Non défini
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: spacing.md, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openViewModal(p)
                                  }}
                                  style={{
                                    padding: `${spacing.xs} ${spacing.sm}`,
                                    ...typography.button,
                                    borderRadius: radius.sm,
                                    background: colors.blue50,
                                    color: colors.bleu,
                                    border: `1px solid ${colors.bleu}30`,
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.xs
                                  }}
                                  title="Voir les détails"
                                >
                                  👁️ Voir
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(p)
                                  }}
                                  style={{
                                    padding: `${spacing.xs} ${spacing.sm}`,
                                    ...typography.button,
                                    borderRadius: radius.sm,
                                    background: colors.orange50,
                                    color: colors.orange,
                                    border: `1px solid ${colors.orange}30`,
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.xs
                                  }}
                                  title="Modifier le partenaire"
                                >
                                  ✏️ Modifier
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelected(p)
                                    setConfirmDel(true)
                                  }}
                                  style={{
                                    padding: `${spacing.xs} ${spacing.sm}`,
                                    ...typography.button,
                                    borderRadius: radius.sm,
                                    background: colors.danger50,
                                    color: colors.danger,
                                    border: `1px solid ${colors.danger}30`,
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.xs
                                  }}
                                  title="Supprimer le partenaire"
                                >
                                  🗑️ Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau partenaire */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="➕ Nouveau partenaire" width={760}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalNew(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Création...' : 'Créer le partenaire'}</Button>
          </>
        }
      >
        <EnteteForm form={form} onChange={handleChange} errors={formErrors} />
      </Modal>

      {/* Modal voir partenaire */}
      <Modal open={modalView} onClose={closeModals} title={`👁️ Détails du partenaire: ${selected?.Nom}`} width={850}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={closeModals}>Fermer</Button>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button variant="danger" onClick={() => { setModalView(false); setConfirmDel(true) }}>
                🗑️ Supprimer
              </Button>
              <Button variant="primary" onClick={() => { setModalView(false); openEditModal(selected) }}>
                ✏️ Modifier
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Informations principales en lecture seule */}
          <div style={{ border: `2px solid ${colors.bleu}`, borderRadius: radius.sm, overflow: 'hidden' }}>
            <div style={{ background: colors.bleu, color: colors.white, padding: `${spacing.sm} ${spacing.md}`, ...typography.h3 }}>
              Informations générales
            </div>
            <div style={{ padding: spacing.md, background: colors.white, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <div><strong>ID:</strong> {selected?.id_gen_partenaire}</div>
                <div><strong>Nom:</strong> {selected?.Nom}</div>
                <div><strong>Type:</strong> <Badge variant={TYPE_COLORS[selected?.TypePart] ?? 'default'}>{TYPE_LABELS[selected?.TypePart] ?? '—'}</Badge></div>
                <div><strong>Statut:</strong> <StatusBadge active={selected?.status} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <div><strong>Localisation:</strong> {selected?.ville}, {selected?.pays}</div>
                <div><strong>Adresse:</strong> {selected?.adress}</div>
                <div><strong>Contact:</strong> {selected?.contact}</div>
                <div><strong>Téléphone:</strong> {selected?.mobile}</div>
              </div>
            </div>
          </div>

          {/* Informations financières */}
          <div style={{ border: `2px solid ${colors.success}`, borderRadius: radius.sm, overflow: 'hidden' }}>
            <div style={{ background: colors.success, color: colors.white, padding: `${spacing.sm} ${spacing.md}`, ...typography.h3 }}>
              Informations financières
            </div>
            <div style={{ padding: spacing.md, background: colors.white }}>
              <BudgetBar
                totalAlloue={budget.totalAlloue}
                maximum={budget.maximum}
                solde={budget.solde}
              />
            </div>
          </div>

          {/* Types de couverture */}
          <div style={{ border: `2px solid ${colors.orange}`, borderRadius: radius.sm, overflow: 'hidden' }}>
            <div style={{ background: colors.orange, color: colors.white, padding: `${spacing.sm} ${spacing.md}`, ...typography.h3 }}>
              Types de couverture ({couvertures.length})
            </div>
            <div style={{ padding: spacing.md, background: colors.white }}>
              {loadingCov ? (
                <FullPageSpinner />
              ) : couvertures.length === 0 ? (
                <div style={{ textAlign: 'center', color: colors.gray400, padding: spacing.lg }}>
                  Aucun type de couverture défini
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', ...typography.body }}>
                    <thead>
                      <tr style={{ background: colors.gray50 }}>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left', fontWeight: 600, color: colors.bleu }}>Nom</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left', fontWeight: 600, color: colors.bleu }}>Service</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right', fontWeight: 600, color: colors.bleu }}>Maximum</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center', fontWeight: 600, color: colors.bleu }}>Part Compagnie</th>
                        <th style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center', fontWeight: 600, color: colors.bleu }}>Part Patient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couvertures.map((cov, i) => (
                        <tr key={cov.id_Rep} style={{ background: i % 2 === 0 ? colors.white : colors.gray50 }}>
                          <td style={{ padding: `${spacing.sm} ${spacing.md}`, fontWeight: 600, color: colors.bleu }}>{cov.Nom}</td>
                          <td style={{ padding: `${spacing.sm} ${spacing.md}` }}>{cov.service || '—'}</td>
                          <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'right', fontWeight: 600 }}>{fmtN(cov.Maximum_Credit)}</td>
                          <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center' }}>{cov.contributionCompagny}%</td>
                          <td style={{ padding: `${spacing.sm} ${spacing.md}`, textAlign: 'center' }}>{cov.contributionPatient}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal modifier partenaire */}
      <Modal open={modalEdit} onClose={closeModals} title={`✏️ Modifier le partenaire: ${selected?.Nom}`} width={900}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={closeModals}>Annuler</Button>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button variant="danger" onClick={() => { setModalEdit(false); setConfirmDel(true) }}>
                🗑️ Supprimer
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : '💾 Enregistrer'}
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Formulaire d'édition */}
          <EnteteForm form={form} onChange={handleChange} errors={formErrors} />

          {/* Barre de budget */}
          <BudgetBar
            totalAlloue={budget.totalAlloue}
            maximum={budget.maximum}
            solde={budget.solde}
          />

          {/* Gestion des couvertures */}
          <CouvertureTable
            partenaire={selected}
            couvertures={couvertures}
            setCouvertures={setCouvertures}
            budget={budget}
            setBudget={setBudget}
            loading={loadingCov}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel} onCancel={() => setConfirmDel(false)} onConfirm={handleDelete}
        message={`Supprimer "${selected?.Nom}" et tous ses types de couverture ?`}
      />
    </div>
  )
}
