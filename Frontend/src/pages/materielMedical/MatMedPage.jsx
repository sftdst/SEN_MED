import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'
import { matMedEquipementApi, matMedLocationApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

// ── Sous-menu interne ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: 'accueil',     label: 'Tableau de bord',    icon: '📊' },
  { key: 'equipements', label: 'Équipements',         icon: '🏥' },
  { key: 'locations',   label: 'Nouvelle location',   icon: '📋' },
  { key: 'en_cours',    label: 'Locations en cours',  icon: '🔄' },
  { key: 'historique',  label: 'Historique',          icon: '📁' },
  { key: 'reporting',   label: 'Reporting',           icon: '📈' },
]

// ── Helpers UI ───────────────────────────────────────────────────────────────
function Lbl({ children, required }) {
  return (
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700,
      color: colors.gray600, marginBottom: 5,
      textTransform: 'uppercase', letterSpacing: '0.4px',
    }}>
      {children}{required && <span style={{ color: colors.danger, marginLeft: 3 }}>*</span>}
    </label>
  )
}

function FInput({ error, style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${error ? colors.danger : focus ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, padding: '8px 12px',
        fontSize: 13, color: colors.gray800,
        background: props.readOnly || props.disabled ? colors.gray50 : colors.white,
        outline: 'none', transition: 'border-color 0.15s',
        ...style,
      }}
    />
  )
}

function FSelect({ children, error, style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${error ? colors.danger : focus ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, padding: '8px 12px',
        fontSize: 13, color: colors.gray800,
        background: colors.white, outline: 'none', cursor: 'pointer',
        transition: 'border-color 0.15s',
        ...style,
      }}
    >{children}</select>
  )
}

function FTextarea({ error, style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${error ? colors.danger : focus ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, padding: '8px 12px',
        fontSize: 13, color: colors.gray800, background: colors.white,
        outline: 'none', transition: 'border-color 0.15s', resize: 'vertical',
        minHeight: 80,
        ...style,
      }}
    />
  )
}

function Badge({ label, color = colors.bleu, bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      color, background: bg || `${color}18`,
    }}>{label}</span>
  )
}

function StatCard({ icon, label, value, color = colors.bleu }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color }}>{value ?? '-'}</div>
      </div>
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', disabled, style, small }) {
  const base = {
    padding: small ? '5px 12px' : '8px 18px',
    fontSize: small ? 12 : 13, fontWeight: 700,
    borderRadius: radius.sm, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.15s',
    ...style,
  }
  const variants = {
    primary:  { background: colors.bleu,    color: colors.white },
    danger:   { background: colors.danger,  color: colors.white },
    success:  { background: colors.success || '#16a34a', color: colors.white },
    outline:  { background: 'transparent', color: colors.bleu, border: `1.5px solid ${colors.bleu}` },
    ghost:    { background: colors.gray100, color: colors.gray700 },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

function Modal({ open, onClose, title, children, width = 640 }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.white, borderRadius: radius.lg,
        width: `min(${width}px, 95vw)`, maxHeight: '90vh',
        overflow: 'auto', boxShadow: shadows.xl,
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.gray800 }}>{title}</h3>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', fontSize: 20,
            cursor: 'pointer', color: colors.gray500, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

function FormGrid({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '16px 20px',
    }}>{children}</div>
  )
}

// ── Statut location → badge ──────────────────────────────────────────────────
function statutBadge(statut) {
  const map = {
    en_attente_diagnostic: { label: 'En attente diagnostic', color: '#92400e', bg: '#fef3c7' },
    diagnostic_initial:    { label: 'Diagnostic initial OK', color: '#1d4ed8', bg: '#dbeafe' },
    en_cours:              { label: 'En cours',              color: '#065f46', bg: '#d1fae5' },
    retour_en_cours:       { label: 'Retour en cours',       color: '#5b21b6', bg: '#ede9fe' },
    cloture:               { label: 'Clôturé',               color: colors.gray600, bg: colors.gray100 },
    en_retard:             { label: 'En retard',             color: '#991b1b', bg: '#fee2e2' },
  }
  const s = map[statut] || { label: statut, color: colors.gray600, bg: colors.gray100 }
  return <Badge label={s.label} color={s.color} bg={s.bg} />
}

function fmt(n) {
  return new Intl.NumberFormat('fr-SN').format(n ?? 0) + ' FCFA'
}

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Tableau de bord
// ════════════════════════════════════════════════════════════════════════════
function TabDashboard({ onNav }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    matMedEquipementApi.stats()
      .then(r => setStats(r.data.data))
      .catch(() => showToast('Erreur chargement stats', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>Chargement...</div>

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, marginBottom: 24 }}>
        Tableau de bord — Matériel Médical
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="🏥" label="Équipements enregistrés" value={stats?.total_equipements} color={colors.bleu} />
        <StatCard icon="✅" label="Stock disponible" value={stats?.stock_disponible} color="#16a34a" />
        <StatCard icon="🔄" label="En location" value={stats?.stock_en_location} color="#d97706" />
        <StatCard icon="📋" label="Dossiers en cours" value={stats?.locations_en_cours} color="#7c3aed" />
        <StatCard icon="⚠️" label="En retard" value={stats?.locations_en_retard} color={colors.danger} />
        <StatCard icon="💰" label="CA du mois" value={fmt(stats?.ca_mensuel)} color="#0e7490" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          background: colors.white, borderRadius: radius.md,
          boxShadow: shadows.sm, padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: colors.gray700 }}>Actions rapides</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn onClick={() => onNav('equipements')}>+ Ajouter un équipement</Btn>
            <Btn onClick={() => onNav('locations')} variant="outline">+ Créer une location</Btn>
            <Btn onClick={() => onNav('en_cours')} variant="ghost">Voir les locations en cours</Btn>
          </div>
        </div>
        <div style={{
          background: colors.white, borderRadius: radius.md,
          boxShadow: shadows.sm, padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: colors.gray700 }}>Rappels importants</h3>
          {(stats?.locations_en_retard > 0) ? (
            <div style={{
              background: '#fee2e2', borderRadius: radius.sm, padding: '12px 16px',
              color: '#991b1b', fontSize: 13, fontWeight: 600,
            }}>
              ⚠️ {stats.locations_en_retard} location(s) en retard — vérifier les retours.
            </div>
          ) : (
            <div style={{
              background: '#d1fae5', borderRadius: radius.sm, padding: '12px 16px',
              color: '#065f46', fontSize: 13, fontWeight: 600,
            }}>
              ✅ Aucun retard signalé.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Équipements
// ════════════════════════════════════════════════════════════════════════════
const EMPTY_EQUIPEMENT = {
  nom: '', categorie: '', description: '',
  numero_serie: '', modele: '', reference: '',
  nom_fournisseur: '', prix_achat: 0, prix_location: 0,
  stock_disponible: 0, statut: 'actif',
}

function TabEquipements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'creer' | 'modifier' | 'detail'
  const [form, setForm] = useState(EMPTY_EQUIPEMENT)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  const charger = useCallback((q = '') => {
    setLoading(true)
    matMedEquipementApi.liste({ q, per_page: 100 })
      .then(r => setItems(r.data.data))
      .catch(() => showToast('Erreur chargement équipements', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  const ouvrirCreer = () => { setForm(EMPTY_EQUIPEMENT); setModal('creer') }
  const ouvrirModifier = (item) => { setForm({ ...item }); setSelected(item); setModal('modifier') }
  const ouvrirDetail = (item) => { setSelected(item); setModal('detail') }

  const sauvegarder = async () => {
    if (!form.nom.trim()) { showToast('Le nom est obligatoire', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'creer') {
        await matMedEquipementApi.creer(form)
        showToast('Équipement créé avec succès', 'success')
      } else {
        await matMedEquipementApi.modifier(selected.id, form)
        showToast('Équipement mis à jour', 'success')
      }
      setModal(null)
      charger(search)
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async (item) => {
    if (!window.confirm(`Supprimer « ${item.nom} » ?`)) return
    try {
      await matMedEquipementApi.supprimer(item.id)
      showToast('Équipement supprimé', 'success')
      charger(search)
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur suppression', 'error')
    }
  }

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, margin: 0 }}>Équipements médicaux</h2>
        <Btn onClick={ouvrirCreer}>+ Ajouter un équipement</Btn>
      </div>

      {/* Barre recherche */}
      <div style={{ marginBottom: 16 }}>
        <FInput
          placeholder="Rechercher par nom, modèle, référence, N° série..."
          value={search}
          onChange={e => { setSearch(e.target.value); charger(e.target.value) }}
          style={{ maxWidth: 420 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
              {['Nom', 'Catégorie', 'Modèle / Réf.', 'Fournisseur', 'Dispo.', 'En loc.', 'Prix loc.', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: colors.gray600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Aucun équipement trouvé</td></tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: colors.gray800 }}>
                  <span onClick={() => ouvrirDetail(item)} style={{ cursor: 'pointer', color: colors.bleu }}>{item.nom}</span>
                </td>
                <td style={{ padding: '10px 14px', color: colors.gray600 }}>{item.categorie || '-'}</td>
                <td style={{ padding: '10px 14px', color: colors.gray600 }}>
                  {item.modele && <div style={{ fontWeight: 600 }}>{item.modele}</div>}
                  {item.reference && <div style={{ fontSize: 11, color: colors.gray400 }}>{item.reference}</div>}
                </td>
                <td style={{ padding: '10px 14px', color: colors.gray600 }}>{item.nom_fournisseur || '-'}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: item.stock_disponible > 0 ? '#16a34a' : colors.danger }}>
                  {item.stock_disponible}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#d97706' }}>{item.stock_en_location}</td>
                <td style={{ padding: '10px 14px' }}>{fmt(item.prix_location)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge
                    label={item.statut === 'actif' ? 'Actif' : 'Inactif'}
                    color={item.statut === 'actif' ? '#16a34a' : colors.gray500}
                    bg={item.statut === 'actif' ? '#d1fae5' : colors.gray100}
                  />
                </td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  <Btn small variant="outline" onClick={() => ouvrirModifier(item)} style={{ marginRight: 6 }}>Modifier</Btn>
                  <Btn small variant="danger" onClick={() => supprimer(item)}>Suppr.</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Créer / Modifier */}
      <Modal
        open={modal === 'creer' || modal === 'modifier'}
        onClose={() => setModal(null)}
        title={modal === 'creer' ? 'Nouvel équipement' : `Modifier — ${selected?.nom}`}
        width={700}
      >
        <FormGrid>
          <div style={{ gridColumn: '1 / -1' }}>
            <Lbl required>Nom de l'équipement</Lbl>
            <FInput value={form.nom} onChange={e => onChange('nom', e.target.value)} placeholder="Ex: Fauteuil roulant" />
          </div>
          <div>
            <Lbl>Catégorie</Lbl>
            <FInput value={form.categorie} onChange={e => onChange('categorie', e.target.value)} placeholder="Ex: Mobilité, Respiratoire..." />
          </div>
          <div>
            <Lbl>Fournisseur</Lbl>
            <FInput value={form.nom_fournisseur} onChange={e => onChange('nom_fournisseur', e.target.value)} />
          </div>
          <div>
            <Lbl>N° de série</Lbl>
            <FInput value={form.numero_serie} onChange={e => onChange('numero_serie', e.target.value)} />
          </div>
          <div>
            <Lbl>Modèle</Lbl>
            <FInput value={form.modele} onChange={e => onChange('modele', e.target.value)} />
          </div>
          <div>
            <Lbl>Référence constructeur</Lbl>
            <FInput value={form.reference} onChange={e => onChange('reference', e.target.value)} />
          </div>
          <div>
            <Lbl>Statut</Lbl>
            <FSelect value={form.statut} onChange={e => onChange('statut', e.target.value)}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </FSelect>
          </div>
          <div>
            <Lbl>Prix d'achat (FCFA)</Lbl>
            <FInput type="number" min="0" value={form.prix_achat} onChange={e => onChange('prix_achat', e.target.value)} />
          </div>
          <div>
            <Lbl required>Prix de location (FCFA/jour)</Lbl>
            <FInput type="number" min="0" value={form.prix_location} onChange={e => onChange('prix_location', e.target.value)} />
          </div>
          <div>
            <Lbl>Stock disponible</Lbl>
            <FInput type="number" min="0" value={form.stock_disponible} onChange={e => onChange('stock_disponible', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Lbl>Description</Lbl>
            <FTextarea value={form.description || ''} onChange={e => onChange('description', e.target.value)} placeholder="Description de l'équipement..." />
          </div>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Annuler</Btn>
          <Btn onClick={sauvegarder} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Btn>
        </div>
      </Modal>

      {/* Modal Détail */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={`Détail — ${selected?.nom}`} width={600}>
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: 13 }}>
            {[
              ['N° de série', selected.numero_serie],
              ['Modèle', selected.modele],
              ['Référence', selected.reference],
              ['Fournisseur', selected.nom_fournisseur],
              ['Catégorie', selected.categorie],
              ['Statut', selected.statut],
              ['Prix achat', fmt(selected.prix_achat)],
              ['Prix location', fmt(selected.prix_location)],
              ['Stock disponible', selected.stock_disponible],
              ['En location', selected.stock_en_location],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 600, color: colors.gray800 }}>{v || '-'}</div>
              </div>
            ))}
            {selected.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 2 }}>Description</div>
                <div style={{ color: colors.gray700 }}>{selected.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ── Documents contractuels ───────────────────────────────────────────────────
function ContratDocuments({ dossier }) {
  const ouvrirPDF = (e) => {
    e.preventDefault()
    e.stopPropagation()
    fetch('/conditions-generales-location.pdf')
      .then(r => {
        if (!r.ok) throw new Error('Fichier non trouvé')
        return r.blob()
      })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const tab = window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 30000)
        if (!tab) showToast('Autorisez les popups pour ce site dans votre navigateur', 'error')
      })
      .catch(() => showToast('Impossible d\'ouvrir le PDF', 'error'))
  }

  const telechargerDocx = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Fetch → blob → URL objet : méthode la plus fiable pour forcer le téléchargement
    fetch(encodeURI('/contrat location materiel medical ndv.docx'))
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const lien = document.createElement('a')
        lien.href = url
        lien.download = 'contrat-location-materiel-medical.docx'
        document.body.appendChild(lien)
        lien.click()
        setTimeout(() => { document.body.removeChild(lien); URL.revokeObjectURL(url) }, 300)
      })
      .catch(() => {
        // Fallback : ouvrir dans un nouvel onglet
        window.open(encodeURI('/contrat location materiel medical ndv.docx'), '_blank', 'noopener,noreferrer')
      })
  }

  return (
    <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>📄</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: colors.gray800 }}>Documents contractuels</div>
          <div style={{ fontSize: 12, color: colors.gray500 }}>
            {dossier ? `Dossier ${dossier.numero_dossier} — ${dossier.client_nom} ${dossier.client_prenom}` : 'À faire signer et imprimer par le client'}
          </div>
        </div>
      </div>

      <div style={{ background: '#fef9ec', border: '1px solid #fcd34d', borderRadius: radius.sm, padding: '12px 16px', fontSize: 13, color: '#92400e', marginBottom: 24 }}>
        ⚠️ Ces deux documents doivent être <strong>signés par le client</strong> avant la remise du matériel, puis <strong>imprimés en deux exemplaires</strong> (un pour le client, un pour le dossier).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* PDF */}
        <div style={{
          border: `2px solid ${colors.gray200}`, borderRadius: radius.md, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>📕</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray800, marginBottom: 4 }}>
              Conditions générales de location
            </div>
            <div style={{ fontSize: 12, color: colors.gray500 }}>Format PDF — à afficher et imprimer</div>
          </div>
          <button
            type="button"
            onClick={ouvrirPDF}
            style={{
              background: '#dc2626', color: colors.white, border: 'none',
              padding: '10px 16px', borderRadius: radius.sm, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, width: '100%',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
          >
            📖 Ouvrir &amp; Imprimer le PDF
          </button>
        </div>

        {/* DOCX */}
        <div style={{
          border: `2px solid ${colors.gray200}`, borderRadius: radius.md, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>📘</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray800, marginBottom: 4 }}>
              Contrat de location matériel
            </div>
            <div style={{ fontSize: 12, color: colors.gray500 }}>Format Word — à compléter et imprimer</div>
          </div>
          <button
            type="button"
            onClick={telechargerDocx}
            style={{
              background: '#1d4ed8', color: colors.white, border: 'none',
              padding: '10px 16px', borderRadius: radius.sm, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, width: '100%',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e3a8a'}
            onMouseLeave={e => e.currentTarget.style.background = '#1d4ed8'}
          >
            ⬇️ Télécharger le contrat Word
          </button>
        </div>
      </div>
    </div>
  )
}

// TAB: Nouvelle location (Étapes 1→3)
// ════════════════════════════════════════════════════════════════════════════
const EMPTY_LOC = {
  date_location: new Date().toISOString().slice(0, 10),
  date_retour_prevue: '',
  client_nom: '', client_prenom: '', client_telephone: '', client_piece_identite: '',
}

function TabNouvellLocation({ onSuccess }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_LOC)
  const [lignes, setLignes] = useState([{ equipement_id: '', quantite: 1, prix_unitaire_location: '', equipement: null }])
  const [equipements, setEquipements] = useState([])
  const [dossier, setDossier] = useState(null)
  const [diag, setDiag] = useState({ etat_general: 'bon', observations: '', signataire: '' })
  const [acompteRef, setAcompteRef] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    matMedEquipementApi.liste({ disponibles_seulement: true, per_page: 200 })
      .then(r => setEquipements(r.data.data))
  }, [])

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addLigne = () => setLignes(l => [...l, { equipement_id: '', quantite: 1, prix_unitaire_location: '', equipement: null }])
  const removeLigne = (i) => setLignes(l => l.filter((_, idx) => idx !== i))
  const updateLigne = (i, k, v) => setLignes(l => l.map((x, idx) => {
    if (idx !== i) return x
    if (k === 'equipement_id') {
      const eq = equipements.find(e => String(e.id) === String(v))
      return { ...x, equipement_id: v, prix_unitaire_location: eq ? eq.prix_location : '', equipement: eq || null }
    }
    return { ...x, [k]: v }
  }))

  const montantTotal = lignes.reduce((s, l) => s + (parseFloat(l.prix_unitaire_location) || 0) * (parseInt(l.quantite) || 0), 0)
  const acompte = Math.round(montantTotal * 0.5 * 100) / 100
  const reliquat = Math.round((montantTotal - acompte) * 100) / 100

  // Étape 1 : Créer le dossier
  const creerDossier = async () => {
    if (!form.client_nom.trim() || !form.client_prenom.trim()) { showToast('Nom et prénom obligatoires', 'error'); return }
    if (!form.date_retour_prevue) { showToast('Date de retour prévue obligatoire', 'error'); return }
    if (lignes.some(l => !l.equipement_id)) { showToast('Sélectionnez un équipement pour chaque ligne', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        lignes: lignes.map(l => ({
          equipement_id: parseInt(l.equipement_id),
          quantite: parseInt(l.quantite),
          prix_unitaire_location: parseFloat(l.prix_unitaire_location) || 0,
        })),
      }
      const r = await matMedLocationApi.creer(payload)
      setDossier(r.data.data)
      setStep(2)
      showToast('Dossier créé. Effectuez le diagnostic initial.', 'success')
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur création dossier', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Étape 2 : Diagnostic initial
  const soumettreDiag = async () => {
    if (!diag.etat_general) { showToast('État général obligatoire', 'error'); return }
    setSaving(true)
    try {
      await matMedLocationApi.ajouterDiagnostic(dossier.id, { ...diag, type_diagnostic: 'initial' })
      setStep(3)
      showToast('Diagnostic initial enregistré.', 'success')
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur diagnostic', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Étape 3 : Encaissement acompte
  const encaisserAcompte = async () => {
    setSaving(true)
    try {
      await matMedLocationApi.encaisserAcompte(dossier.id, { reference: acompteRef })
      showToast('Acompte encaissé ! Matériel remis au client.', 'success')
      setStep(4)  // → étape 4 : contrats à signer
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur encaissement', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Étape 4 : Terminer et reset
  const terminer = () => {
    setStep(1)
    setForm(EMPTY_LOC)
    setLignes([{ equipement_id: '', quantite: 1, prix_unitaire_location: '', equipement: null }])
    setDossier(null)
    onSuccess && onSuccess()
  }

  const stepStyle = (n) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '50%',
    fontWeight: 800, fontSize: 14,
    background: step >= n ? colors.bleu : colors.gray200,
    color: step >= n ? colors.white : colors.gray500,
  })

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, marginBottom: 20 }}>Créer un dossier de location</h2>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          [1, 'Dossier & matériel'],
          [2, 'Diagnostic initial'],
          [3, 'Acompte (50%)'],
          [4, 'Contrats'],
        ].map(([n, label], i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={stepStyle(n)}>{n === 4 && step === 4 ? '✓' : n}</div>
            <span style={{ fontSize: 13, fontWeight: step === n ? 700 : 400, color: step >= n ? colors.bleu : colors.gray400 }}>{label}</span>
            {i < arr.length - 1 && <div style={{ width: 40, height: 2, background: step > n ? colors.bleu : colors.gray200 }} />}
          </div>
        ))}
      </div>

      {/* Étape 1 */}
      {step === 1 && (
        <div>
          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: colors.gray700 }}>Informations client</h3>
            <FormGrid>
              <div>
                <Lbl required>Nom</Lbl>
                <FInput value={form.client_nom} onChange={e => onChange('client_nom', e.target.value)} />
              </div>
              <div>
                <Lbl required>Prénom</Lbl>
                <FInput value={form.client_prenom} onChange={e => onChange('client_prenom', e.target.value)} />
              </div>
              <div>
                <Lbl>Téléphone</Lbl>
                <FInput value={form.client_telephone} onChange={e => onChange('client_telephone', e.target.value)} />
              </div>
              <div>
                <Lbl>Pièce d'identité</Lbl>
                <FInput value={form.client_piece_identite} onChange={e => onChange('client_piece_identite', e.target.value)} placeholder="CIN, Passeport..." />
              </div>
              <div>
                <Lbl required>Date de location</Lbl>
                <FInput type="date" value={form.date_location} onChange={e => onChange('date_location', e.target.value)} />
              </div>
              <div>
                <Lbl required>Date de retour prévue</Lbl>
                <FInput type="date" value={form.date_retour_prevue} onChange={e => onChange('date_retour_prevue', e.target.value)} min={form.date_location} />
              </div>
            </FormGrid>
          </div>

          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.gray700, margin: 0 }}>Matériels à louer</h3>
              <Btn small onClick={addLigne}>+ Ajouter une ligne</Btn>
            </div>
            {lignes.map((ligne, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                <div>
                  <Lbl required>Équipement</Lbl>
                  <FSelect value={ligne.equipement_id} onChange={e => updateLigne(i, 'equipement_id', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {equipements.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nom} (dispo: {eq.stock_disponible})</option>
                    ))}
                  </FSelect>
                </div>
                <div>
                  <Lbl required>Qté</Lbl>
                  <FInput type="number" min="1" value={ligne.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} />
                </div>
                <div>
                  <Lbl>Prix unit. location (FCFA)</Lbl>
                  <FInput type="number" min="0" value={ligne.prix_unitaire_location} onChange={e => updateLigne(i, 'prix_unitaire_location', e.target.value)} placeholder={ligne.equipement?.prix_location || 0} />
                </div>
                <div style={{ paddingBottom: 2 }}>
                  {lignes.length > 1 && (
                    <Btn small variant="danger" onClick={() => removeLigne(i)}>✕</Btn>
                  )}
                </div>
              </div>
            ))}

            {/* Récapitulatif montants */}
            <div style={{ background: colors.gray50, borderRadius: radius.sm, padding: '12px 16px', marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Montant total</span>
                <strong>{fmt(montantTotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Acompte (50%)</span>
                <strong style={{ color: '#d97706' }}>{fmt(acompte)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Reliquat (50%)</span>
                <strong style={{ color: colors.bleu }}>{fmt(reliquat)}</strong>
              </div>
            </div>
          </div>

          <Btn onClick={creerDossier} disabled={saving}>{saving ? 'Création...' : 'Créer le dossier →'}</Btn>
        </div>
      )}

      {/* Étape 2 — Diagnostic initial */}
      {step === 2 && dossier && (
        <div>
          <div style={{ background: '#fef3c7', borderRadius: radius.sm, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            ⚠️ Le diagnostic initial est obligatoire avant la validation de la location.
          </div>
          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: colors.gray700 }}>
              Diagnostic initial — Dossier {dossier.numero_dossier}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <Lbl required>État général du matériel</Lbl>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {['bon', 'moyen', 'mauvais'].map(e => (
                  <label key={e} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '8px 16px', borderRadius: radius.sm,
                    border: `2px solid ${diag.etat_general === e ? colors.bleu : colors.gray200}`,
                    background: diag.etat_general === e ? `${colors.bleu}12` : colors.white,
                    fontWeight: 600, textTransform: 'capitalize', fontSize: 13,
                  }}>
                    <input type="radio" name="etat" value={e} checked={diag.etat_general === e}
                      onChange={() => setDiag(d => ({ ...d, etat_general: e }))}
                      style={{ accentColor: colors.bleu }} />
                    {e === 'bon' ? '✅ Bon' : e === 'moyen' ? '⚠️ Moyen' : '❌ Mauvais'}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Lbl>Observations</Lbl>
              <FTextarea value={diag.observations} onChange={e => setDiag(d => ({ ...d, observations: e.target.value }))} placeholder="Décrire l'état détaillé du matériel..." />
            </div>
            <div>
              <Lbl>Signataire (agent responsable)</Lbl>
              <FInput value={diag.signataire} onChange={e => setDiag(d => ({ ...d, signataire: e.target.value }))} />
            </div>
          </div>
          <Btn onClick={soumettreDiag} disabled={saving}>{saving ? 'Enregistrement...' : 'Valider le diagnostic →'}</Btn>
        </div>
      )}

      {/* Étape 3 — Acompte */}
      {step === 3 && dossier && (
        <div>
          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: colors.gray700 }}>
              Encaissement de l'acompte — {dossier.numero_dossier}
            </h3>
            <div style={{ background: colors.gray50, borderRadius: radius.sm, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span>Montant total</span><strong>{fmt(dossier.montant_total)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                <span style={{ color: '#d97706' }}>Acompte à encaisser (50%)</span>
                <strong style={{ color: '#d97706' }}>{fmt(dossier.acompte)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8, color: colors.gray500 }}>
                <span>Reliquat dû au retour</span><span>{fmt(dossier.reliquat)}</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Lbl>Référence de paiement</Lbl>
              <FInput value={acompteRef} onChange={e => setAcompteRef(e.target.value)} placeholder="N° reçu, référence bancaire..." />
            </div>
            <div style={{ background: '#dbeafe', borderRadius: radius.sm, padding: '12px 16px', fontSize: 13, color: '#1d4ed8', marginBottom: 20 }}>
              ℹ️ Après encaissement de l'acompte, le stock sera automatiquement mis à jour et le matériel pourra être remis au client.
            </div>
          </div>
          <Btn onClick={encaisserAcompte} disabled={saving} variant="success">
            {saving ? 'Enregistrement...' : '✅ Confirmer l\'encaissement de l\'acompte'}
          </Btn>
        </div>
      )}

      {/* Étape 4 — Documents contractuels */}
      {step === 4 && dossier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: radius.sm, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>Location confirmée — {dossier.numero_dossier}</div>
              <div style={{ fontSize: 12, color: '#166534' }}>
                Acompte encaissé. Le matériel peut être remis à {dossier.client_nom} {dossier.client_prenom}.
              </div>
            </div>
          </div>

          <ContratDocuments dossier={dossier} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="success" onClick={terminer}>
              ✔ Terminer et créer une nouvelle location
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Locations en cours
// ════════════════════════════════════════════════════════════════════════════
function TabEnCours() {
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [modalDiag, setModalDiag] = useState(false)
  const [modalCloture, setModalCloture] = useState(false)
  const [diag, setDiag] = useState({ etat_general: 'bon', observations: '', signataire: '' })
  const [cloture, setCloture] = useState({ penalite: 0, reference: '', notes: '' })
  const [modalContrats, setModalContrats] = useState(false)
  const [saving, setSaving] = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    const params = { per_page: 100 }
    if (filtre) params.statut = filtre
    if (search) params.q = search
    matMedLocationApi.liste(params)
      .then(r => setDossiers(r.data.data))
      .catch(() => showToast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [filtre, search])

  useEffect(() => { charger() }, [charger])

  const voirDetail = async (d) => {
    setSelected(d)
    setModalContrats(false)
    try {
      const r = await matMedLocationApi.detail(d.id)
      setDetail(r.data.data)
    } catch { showToast('Erreur chargement détail', 'error') }
  }

  const soumettreDiagRetour = async () => {
    setSaving(true)
    try {
      await matMedLocationApi.ajouterDiagnostic(selected.id, { ...diag, type_diagnostic: 'retour' })
      showToast('Diagnostic retour enregistré', 'success')
      setModalDiag(false)
      charger()
      voirDetail(selected)
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setSaving(false) }
  }

  const cloturerDossier = async () => {
    setSaving(true)
    try {
      await matMedLocationApi.cloturer(selected.id, cloture)
      showToast('Dossier clôturé avec succès', 'success')
      setModalCloture(false)
      setDetail(null); setSelected(null)
      charger()
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur clôture', 'error')
    } finally { setSaving(false) }
  }

  const statutsFiltres = [
    { value: '', label: 'Tous' },
    { value: 'en_attente_diagnostic', label: 'En attente diag.' },
    { value: 'diagnostic_initial', label: 'Diagnostic OK' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'retour_en_cours', label: 'Retour en cours' },
    { value: 'en_retard', label: 'En retard' },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, marginBottom: 20 }}>Locations en cours</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <FInput placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <FSelect value={filtre} onChange={e => setFiltre(e.target.value)} style={{ maxWidth: 200 }}>
          {statutsFiltres.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </FSelect>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1.3fr' : '1fr', gap: 20 }}>
        {/* Liste */}
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
                {['N° Dossier', 'Client', 'Retour prévu', 'Total', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Chargement...</td></tr>
              ) : dossiers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Aucun dossier</td></tr>
              ) : dossiers.map(d => (
                <tr key={d.id}
                  onClick={() => voirDetail(d)}
                  style={{
                    borderBottom: `1px solid ${colors.gray100}`,
                    cursor: 'pointer',
                    background: selected?.id === d.id ? `${colors.bleu}08` : undefined,
                  }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: colors.bleu }}>{d.numero_dossier}</td>
                  <td style={{ padding: '10px 14px' }}>{d.client_nom} {d.client_prenom}</td>
                  <td style={{ padding: '10px 14px', color: d.statut === 'en_retard' ? colors.danger : colors.gray700 }}>
                    {fmtDate(d.date_retour_prevue)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{fmt(d.montant_total)}</td>
                  <td style={{ padding: '10px 14px' }}>{statutBadge(d.statut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Détail */}
        {detail && (
          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: colors.bleu }}>{detail.numero_dossier}</div>
                <div style={{ fontSize: 13, color: colors.gray600 }}>{detail.client_nom} {detail.client_prenom}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(detail.statut === 'en_cours' || detail.statut === 'en_retard') && (
                  <Btn small onClick={() => setModalDiag(true)}>Diagnostic retour</Btn>
                )}
                {detail.statut === 'retour_en_cours' && (
                  <Btn small variant="success" onClick={() => setModalCloture(true)}>Clôturer</Btn>
                )}
                <Btn small variant="ghost" onClick={() => setModalContrats(true)}>📄 Contrats</Btn>
                <Btn small variant="ghost" onClick={() => { setDetail(null); setSelected(null) }}>✕</Btn>
              </div>
            </div>

            {/* Infos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12, marginBottom: 16 }}>
              {[
                ['Téléphone', detail.client_telephone],
                ['Pièce ID', detail.client_piece_identite],
                ['Date location', fmtDate(detail.date_location)],
                ['Retour prévu', fmtDate(detail.date_retour_prevue)],
                ['Retour effectif', fmtDate(detail.date_retour_effective)],
                ['Statut', detail.statut],
              ].map(([k, v]) => v ? (
                <div key={k}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray400 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: colors.gray700 }}>{v}</div>
                </div>
              ) : null)}
            </div>

            {/* Matériels */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 8 }}>MATÉRIELS LOUÉS</div>
              {detail.lignes?.map(l => (
                <div key={l.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 10px', background: colors.gray50, borderRadius: radius.sm, marginBottom: 6, fontSize: 12,
                }}>
                  <span>{l.equipement_nom} {l.modele ? `(${l.modele})` : ''} × {l.quantite}</span>
                  <strong>{fmt(l.montant_ligne)}</strong>
                </div>
              ))}
            </div>

            {/* Montants */}
            <div style={{ background: colors.gray50, borderRadius: radius.sm, padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Total</span><strong>{fmt(detail.montant_total)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#16a34a' }}><span>Acompte versé (50%)</span><strong>{fmt(detail.acompte)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}><span>Reliquat restant</span><strong>{fmt(detail.reliquat)}</strong></div>
              {detail.penalite > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.danger, marginTop: 4 }}><span>Pénalité</span><strong>{fmt(detail.penalite)}</strong></div>
              )}
            </div>

            {/* Diagnostics */}
            {detail.diagnostics?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 8 }}>DIAGNOSTICS</div>
                {detail.diagnostics.map(d => (
                  <div key={d.id} style={{ background: colors.gray50, borderRadius: radius.sm, padding: '10px 14px', marginBottom: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {d.type_diagnostic === 'initial' ? '🔍 Diagnostic initial' : '🔄 Diagnostic retour'}
                      <span style={{ marginLeft: 8, fontWeight: 400, color: colors.gray400 }}>{fmtDate(d.date_diagnostic)}</span>
                    </div>
                    <div>État : <strong style={{ textTransform: 'capitalize' }}>{d.etat_general}</strong></div>
                    {d.observations && <div style={{ color: colors.gray600, marginTop: 4 }}>{d.observations}</div>}
                    {d.signataire && <div style={{ color: colors.gray400, marginTop: 2 }}>Signataire : {d.signataire}</div>}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal diagnostic retour */}
      <Modal open={modalDiag} onClose={() => setModalDiag(false)} title="Diagnostic de retour">
        <div style={{ marginBottom: 16 }}>
          <Lbl required>État général à la restitution</Lbl>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {['bon', 'moyen', 'mauvais'].map(e => (
              <label key={e} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '8px 14px', borderRadius: radius.sm,
                border: `2px solid ${diag.etat_general === e ? colors.bleu : colors.gray200}`,
                background: diag.etat_general === e ? `${colors.bleu}12` : colors.white,
                fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
              }}>
                <input type="radio" name="etatRetour" value={e} checked={diag.etat_general === e}
                  onChange={() => setDiag(d => ({ ...d, etat_general: e }))} style={{ accentColor: colors.bleu }} />
                {e === 'bon' ? '✅ Bon' : e === 'moyen' ? '⚠️ Moyen' : '❌ Mauvais'}
              </label>
            ))}
          </div>
        </div>

        {/* Comparaison */}
        {detail?.diagnostics?.find(d => d.type_diagnostic === 'initial') && (
          <div style={{ background: '#dbeafe', borderRadius: radius.sm, padding: '10px 14px', fontSize: 12, marginBottom: 16, color: '#1e40af' }}>
            État initial : <strong style={{ textTransform: 'capitalize' }}>{detail.diagnostics.find(d => d.type_diagnostic === 'initial')?.etat_general}</strong>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Lbl>Observations / dommages constatés</Lbl>
          <FTextarea value={diag.observations} onChange={e => setDiag(d => ({ ...d, observations: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Lbl>Signataire</Lbl>
          <FInput value={diag.signataire} onChange={e => setDiag(d => ({ ...d, signataire: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModalDiag(false)}>Annuler</Btn>
          <Btn onClick={soumettreDiagRetour} disabled={saving}>{saving ? 'Enregistrement...' : 'Valider le diagnostic'}</Btn>
        </div>
      </Modal>

      {/* Modal clôture */}
      <Modal open={modalCloture} onClose={() => setModalCloture(false)} title="Clôturer le dossier">
        {detail && (
          <div>
            <div style={{ background: colors.gray50, borderRadius: radius.sm, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Reliquat à encaisser</span><strong>{fmt(detail.reliquat)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.danger }}>Pénalité (si dommages)</span>
                <strong style={{ color: colors.danger }}>{fmt(cloture.penalite)}</strong>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Lbl>Pénalité pour dommages (FCFA)</Lbl>
              <FInput type="number" min="0" value={cloture.penalite} onChange={e => setCloture(c => ({ ...c, penalite: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Lbl>Référence de paiement</Lbl>
              <FInput value={cloture.reference} onChange={e => setCloture(c => ({ ...c, reference: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Lbl>Notes</Lbl>
              <FTextarea value={cloture.notes} onChange={e => setCloture(c => ({ ...c, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setModalCloture(false)}>Annuler</Btn>
              <Btn variant="success" onClick={cloturerDossier} disabled={saving}>
                {saving ? 'Clôture...' : `✅ Encaisser ${fmt(parseFloat(detail.reliquat) + parseFloat(cloture.penalite || 0))} et clôturer`}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal documents contractuels */}
      <Modal
        open={modalContrats}
        onClose={() => setModalContrats(false)}
        title={`Documents contractuels — ${detail?.numero_dossier ?? ''}`}
        width={700}
      >
        {detail && <ContratDocuments dossier={detail} />}
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Historique (clôturés)
// ════════════════════════════════════════════════════════════════════════════
function TabHistorique() {
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    matMedLocationApi.liste({ statut: 'cloture', q: search, per_page: 100 })
      .then(r => setDossiers(r.data.data))
      .catch(() => showToast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { charger() }, [charger])

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, marginBottom: 20 }}>Historique des locations</h2>
      <div style={{ marginBottom: 16 }}>
        <FInput placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
              {['N° Dossier', 'Client', 'Période', 'Retour effectif', 'Total', 'Pénalité'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Chargement...</td></tr>
            ) : dossiers.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Aucun dossier clôturé</td></tr>
            ) : dossiers.map(d => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: colors.gray700 }}>{d.numero_dossier}</td>
                <td style={{ padding: '10px 14px' }}>{d.client_nom} {d.client_prenom}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: colors.gray500 }}>
                  {fmtDate(d.date_location)} → {fmtDate(d.date_retour_prevue)}
                </td>
                <td style={{ padding: '10px 14px' }}>{fmtDate(d.date_retour_effective)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700 }}>{fmt(d.montant_total)}</td>
                <td style={{ padding: '10px 14px', color: d.penalite > 0 ? colors.danger : colors.gray400, fontWeight: d.penalite > 0 ? 700 : 400 }}>
                  {d.penalite > 0 ? fmt(d.penalite) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Reporting
// ════════════════════════════════════════════════════════════════════════════
function TabReporting() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const [dateDebut, setDateDebut] = useState(firstDay)
  const [dateFin, setDateFin] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const charger = () => {
    setLoading(true)
    matMedLocationApi.reporting({ date_debut: dateDebut, date_fin: dateFin })
      .then(r => setData(r.data.data))
      .catch(() => showToast('Erreur reporting', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  const caTotal = data?.ca_par_type?.reduce((s, x) => s + parseFloat(x.total), 0) || 0

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, marginBottom: 20 }}>Reporting financier</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <Lbl>Date début</Lbl>
          <FInput type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ width: 160 }} />
        </div>
        <div>
          <Lbl>Date fin</Lbl>
          <FInput type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ width: 160 }} />
        </div>
        <Btn onClick={charger} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</Btn>
      </div>

      {data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon="💰" label="CA de la période" value={fmt(caTotal)} color="#0e7490" />
            <StatCard icon="✅" label="Dossiers clôturés" value={data.dossiers_clotures} color="#16a34a" />
            <StatCard icon="🔄" label="Dossiers en cours" value={data.dossiers_en_cours} color="#7c3aed" />
            <StatCard icon="⚠️" label="En retard" value={data.dossiers_en_retard} color={colors.danger} />
          </div>

          <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: colors.gray700 }}>Détail des encaissements</h3>
            {data.ca_par_type?.length === 0 ? (
              <div style={{ color: colors.gray400, textAlign: 'center', padding: 20 }}>Aucun encaissement sur cette période</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
                    {['Type', 'Nombre', 'Montant total'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.ca_par_type.map(row => (
                    <tr key={row.type_paiement} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                      <td style={{ padding: '10px 14px', textTransform: 'capitalize', fontWeight: 600 }}>
                        {row.type_paiement === 'acompte' ? '💳 Acompte (50%)' : row.type_paiement === 'reliquat' ? '✅ Reliquat (50%)' : '⚠️ Pénalité'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{row.nb}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{fmt(row.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: colors.gray50, fontWeight: 800 }}>
                    <td colSpan={2} style={{ padding: '10px 14px' }}>Total</td>
                    <td style={{ padding: '10px 14px', color: colors.bleu }}>{fmt(caTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function MatMedPage() {
  const [activeTab, setActiveTab] = useState('accueil')
  const activeItem = MENU_ITEMS.find(m => m.key === activeTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header gradient ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, boxShadow: shadows.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🏥</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Matériel Médical
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {activeItem?.label ?? 'Équipements, locations et reporting'}
            </p>
          </div>
        </div>
        {activeTab === 'equipements' && (
          <button
            onClick={() => {/* openCreateEquipement géré dans TabEquipements */}}
            style={{
              background: colors.orange, border: 'none', color: colors.white,
              padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark || '#e05a1a'}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouvel équipement
          </button>
        )}
        {activeTab === 'locations' && (
          <button
            onClick={() => {/* formulaire intégré dans TabNouvellLocation */}}
            style={{
              background: colors.orange, border: 'none', color: colors.white,
              padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark || '#e05a1a'}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouvelle location
          </button>
        )}
      </div>

      {/* ── Menu horizontal ── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        background: colors.bleu,
        borderRadius: radius.lg,
        padding: '12px 16px',
        boxShadow: shadows.md,
      }}>
        {MENU_ITEMS.map(item => {
          const active = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                borderRadius: 20,
                border: 'none', cursor: 'pointer',
                background: active ? colors.orange : 'rgba(255,255,255,0.1)',
                color: colors.white,
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === 'accueil'     && <TabDashboard onNav={setActiveTab} />}
        {activeTab === 'equipements' && <TabEquipements />}
        {activeTab === 'locations'   && <TabNouvellLocation onSuccess={() => setActiveTab('en_cours')} />}
        {activeTab === 'en_cours'    && <TabEnCours />}
        {activeTab === 'historique'  && <TabHistorique />}
        {activeTab === 'reporting'   && <TabReporting />}
      </div>
    </div>
  )
}
