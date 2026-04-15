import { useState, useEffect, useMemo } from 'react'
import { colors, radius, shadows } from '../../theme'
import { produitApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

// ── Menu items ───────────────────────────────────────────────────────────────
const menuItems = [
  { key: 'accueil',           label: 'Accueil',             icon: '🏠' },
  { key: 'produits',          label: 'Liste des produits',  icon: '💊' },
  { key: 'fournisseur',       label: 'Fournisseurs',        icon: '🏭' },
  { key: 'commande',          label: 'Commandes',           icon: '📋' },
  { key: 'approvisionnement', label: 'Approvisionnement',   icon: '🚚' },
  { key: 'ajustement',        label: 'Ajustement de stock', icon: '⚖️' },
  { key: 'sortie',            label: 'Sortie de stock',     icon: '📤' },
  { key: 'reception',         label: 'Réception',           icon: '📥' },
  { key: 'inventaire',        label: 'Inventaire',          icon: '📊' },
]

const mockFournisseurs = [
  { id: 1, nom: 'Pharma Senegal',      telephone: '+221 33 123 45 67', email: 'contact@pharmasen.sn' },
  { id: 2, nom: 'West Africa Pharma',  telephone: '+221 33 987 65 43', email: 'info@wap.sn' },
  { id: 3, nom: 'Senegal Medicaments', telephone: '+221 33 456 78 90', email: 'contact@senmed.sn' },
]

// ── Formulaire vide ──────────────────────────────────────────────────────────
const EMPTY = {
  item_id: '', description: '', days: '', default_qty: '', duration: '',
  duration_type: '', food_type: '', vidal_id: '', code_CpHa_id: '',
  posologie: '', renew: 0, subustitution: 0, for_all_prescription: 0,
  ucd: '', voie_administration: '', remarques: '', preference_substitution: '',
  midi: '', soir: '', couche: '', qty_vrac: 0, dddadulte: 0, dddpediatr: 0,
  max_prise: 0, matin: '', prixcAchat: 0, PrixVente: 0,
}

// ── Sections du formulaire ───────────────────────────────────────────────────
const FORM_SECTIONS = [
  { key: 'identite',       label: 'Identification',  icon: '🏷️' },
  { key: 'administration', label: 'Administration',  icon: '💉' },
  { key: 'horaires',       label: 'Prises',          icon: '⏰' },
  { key: 'dosages',        label: 'Dosages',         icon: '⚗️' },
  { key: 'prix',           label: 'Prix & Options',  icon: '💰' },
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
        boxShadow: focus ? `0 0 0 3px ${colors.bleu}18` : 'none',
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
        boxShadow: focus ? `0 0 0 3px ${colors.bleu}18` : 'none',
        ...style,
      }}
    >{children}</select>
  )
}

function FCheck({ label, name, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer', padding: '10px 14px',
      border: `1.5px solid ${checked ? colors.bleu : colors.gray200}`,
      borderRadius: radius.sm,
      background: checked ? `${colors.bleu}08` : colors.white,
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        border: `2px solid ${checked ? colors.bleu : colors.gray300}`,
        background: checked ? colors.bleu : colors.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: colors.white, fontSize: 11, fontWeight: 800 }}>✓</span>}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange}
        style={{ display: 'none' }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: checked ? colors.bleu : colors.gray700 }}>
        {label}
      </span>
    </label>
  )
}

// ── Icônes SVG ───────────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)

function ActionBtn({ color, bg, title, onClick, children }) {
  const [h, setH] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, border: `1.5px solid ${color}33`,
        borderRadius: radius.sm, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: h ? color : bg, color: h ? colors.white : color,
        transition: 'all 0.15s',
      }}
    >{children}</button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════
export default function PharmaciePage() {
  const [activeTab,   setActiveTab]  = useState('accueil')
  const [produits,    setProduits]   = useState([])
  const [showModal,   setShowModal]  = useState(false)
  const [editingId,   setEditingId]  = useState(null)
  const [formData,    setFormData]   = useState(EMPTY)
  const [loading,     setLoading]    = useState(false)
  const [saving,      setSaving]     = useState(false)
  const [search,      setSearch]     = useState('')
  const [filterStatut,setFilter]     = useState('tous')
  const [page,        setPage]       = useState(1)
  const [perPage,     setPerPage]    = useState(10)

  useEffect(() => {
    if (activeTab === 'produits') loadProduits()
  }, [activeTab])

  const loadProduits = async () => {
    setLoading(true)
    try {
      const res = await produitApi.liste()
      setProduits(res.data.data || [])
    } catch {
      showToast('Erreur chargement des produits', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditingId(p.id_Rep)
    setFormData({
      item_id: p.item_id || '', description: p.description || '',
      days: p.days || '', default_qty: p.default_qty || '',
      duration: p.duration || '', duration_type: p.duration_type || '',
      food_type: p.food_type || '', vidal_id: p.vidal_id || '',
      code_CpHa_id: p.code_CpHa_id || '', posologie: p.posologie || '',
      renew: p.renew || 0, subustitution: p.subustitution || 0,
      for_all_prescription: p.for_all_prescription || 0,
      ucd: p.ucd || '', voie_administration: p.voie_administration || '',
      remarques: p.remarques || '', preference_substitution: p.preference_substitution || '',
      midi: p.midi || '', soir: p.soir || '', couche: p.couche || '',
      qty_vrac: p.qty_vrac || 0, dddadulte: p.dddadulte || 0,
      dddpediatr: p.dddpediatr || 0, max_prise: p.max_prise || 0,
      matin: p.matin || '', prixcAchat: p.prixcAchat || 0, PrixVente: p.PrixVente || 0,
    })
    setShowModal(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }))
  }

  const toInt = (v) => v !== '' && v !== null ? parseInt(v) : null

  const handleSave = async () => {
    if (!formData.item_id.trim()) { showToast('Le code produit est obligatoire', 'error'); return }
    setSaving(true)
    const payload = {
      ...formData,
      days: toInt(formData.days), default_qty: toInt(formData.default_qty),
      duration: toInt(formData.duration),
      renew: formData.renew ? 1 : 0,
      subustitution: formData.subustitution ? 1 : 0,
      for_all_prescription: formData.for_all_prescription ? 1 : 0,
      qty_vrac: toInt(formData.qty_vrac) || 0,
      dddadulte: toInt(formData.dddadulte) || 0,
      dddpediatr: toInt(formData.dddpediatr) || 0,
      max_prise: toInt(formData.max_prise) || 0,
      prixcAchat: toInt(formData.prixcAchat) || 0,
      PrixVente: toInt(formData.PrixVente) || 0,
    }
    try {
      if (editingId) {
        await produitApi.modifier(editingId, payload)
        showToast('Produit mis à jour avec succès')
      } else {
        await produitApi.creer(payload)
        showToast('Produit créé avec succès')
      }
      setShowModal(false)
      loadProduits()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit définitivement ?')) return
    try {
      await produitApi.supprimer(id)
      showToast('Produit supprimé')
      loadProduits()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const handleDeactivate = async (id) => {
    try {
      await produitApi.modifier(id, { status_id: 0 })
      showToast('Produit désactivé')
      loadProduits()
    } catch {
      showToast('Erreur désactivation', 'error')
    }
  }

  // ── Filtrage & pagination ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...produits]
    if (filterStatut === 'actif')   list = list.filter(p => p.status_id !== 0)
    if (filterStatut === 'inactif') list = list.filter(p => p.status_id === 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        (p.item_id || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.voie_administration || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [produits, search, filterStatut])

  const totalPages = Math.ceil(filtered.length / perPage)
  const pageItems  = filtered.slice((page - 1) * perPage, page * perPage)

  // Reset page quand filtre change
  useEffect(() => { setPage(1) }, [search, filterStatut, perPage])

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
          }}>💊</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Gestion Pharmaceutique
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Médicaments, stocks et approvisionnements
            </p>
          </div>
        </div>
        {activeTab === 'produits' && (
          <button onClick={openCreate} style={{
            background: colors.orange, border: 'none', color: colors.white,
            padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouveau produit
          </button>
        )}
      </div>

      {/* ── Barre de navigation ── */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        padding: '8px 12px', boxShadow: shadows.sm,
        border: `1px solid ${colors.gray200}`,
        display: 'flex', gap: 4, overflowX: 'auto', flexWrap: 'wrap',
      }}>
        {menuItems.map(item => (
          <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
            padding: '8px 16px', border: 'none', borderRadius: radius.sm,
            cursor: 'pointer', fontWeight: 600, fontSize: 12,
            whiteSpace: 'nowrap', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
            background: activeTab === item.key ? colors.bleu : 'transparent',
            color: activeTab === item.key ? colors.white : colors.gray600,
          }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      {activeTab === 'accueil' && <AccueilTab produits={produits} />}
      {activeTab === 'produits' && (
        <ProduitsTab
          produits={pageItems}
          totalProduits={filtered.length}
          allCount={produits.length}
          loading={loading}
          page={page} totalPages={totalPages}
          perPage={perPage} setPerPage={setPerPage}
          setPage={setPage}
          search={search} setSearch={setSearch}
          filterStatut={filterStatut} setFilter={setFilter}
          onEdit={openEdit} onDelete={handleDelete} onDeactivate={handleDeactivate}
        />
      )}
      {activeTab === 'fournisseur' && <FournisseursTab data={mockFournisseurs} />}
      {['commande','approvisionnement','ajustement','sortie','reception','inventaire'].includes(activeTab) && (
        <PlaceholderTab item={menuItems.find(m => m.key === activeTab)} />
      )}

      {/* ── Modal création / édition ── */}
      {showModal && (
        <ProduitModal
          isEdit={!!editingId}
          formData={formData}
          onChange={handleChange}
          onSave={handleSave}
          saving={saving}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB ACCUEIL
// ════════════════════════════════════════════════════════════════════════════
function AccueilTab({ produits }) {
  const actifs    = produits.filter(p => p.status_id !== 0).length
  const valTotale = produits.reduce((s, p) => s + (Number(p.PrixVente) || 0), 0)

  const cards = [
    { label: 'Total produits',  val: produits.length,                                    icon: '💊', color: colors.bleu,    bg: colors.infoBg    },
    { label: 'Produits actifs', val: actifs,                                              icon: '✅', color: colors.success, bg: colors.successBg },
    { label: 'Produits inactifs',val: produits.length - actifs,                           icon: '⛔', color: colors.danger,  bg: colors.dangerBg  },
    { label: 'Valeur stock',    val: valTotale.toLocaleString('fr-FR') + ' F',            icon: '💰', color: colors.warning, bg: colors.warningBg },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: colors.white, borderRadius: radius.md,
            padding: '20px 24px', boxShadow: shadows.sm,
            border: `1px solid ${colors.gray200}`,
            borderLeft: `4px solid ${c.color}`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: radius.md,
              background: c.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: colors.white, borderRadius: radius.md, padding: 32,
        boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
        textAlign: 'center', color: colors.gray500,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Naviguez dans le menu ci-dessus pour gérer les produits, fournisseurs et stocks.
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB PRODUITS
// ════════════════════════════════════════════════════════════════════════════
function ProduitsTab({
  produits, totalProduits, allCount, loading,
  page, totalPages, perPage, setPerPage, setPage,
  search, setSearch, filterStatut, setFilter,
  onEdit, onDelete, onDeactivate,
}) {
  const fmtPrix = (v) => v ? Number(v).toLocaleString('fr-FR') + ' F' : '—'

  // Pages à afficher (max 5 autour de la courante)
  const pageNums = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const delta = 2
    const range = []
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }
    const pages = [1]
    if (range[0] > 2) pages.push('...')
    pages.push(...range)
    if (range[range.length - 1] < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }, [page, totalPages])

  const debut = (page - 1) * perPage + 1
  const fin   = Math.min(page * perPage, totalProduits)

  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
      overflow: 'hidden',
    }}>
      {/* ── Barre de recherche & filtres ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.gray200}`,
        background: colors.gray50,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Titre + compteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <span style={{ fontSize: 16 }}>💊</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>Liste des produits</span>
          <span style={{
            background: colors.infoBg, color: colors.info,
            borderRadius: radius.full, padding: '2px 10px',
            fontSize: 11, fontWeight: 700,
          }}>{allCount}</span>
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: colors.gray400, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher (code, description…)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '8px 12px 8px 34px', fontSize: 13, color: colors.gray800,
              background: colors.white, outline: 'none', transition: 'border 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.gray400, fontSize: 14, lineHeight: 1,
            }}>×</button>
          )}
        </div>

        {/* Filtre statut */}
        <div style={{ display: 'flex', borderRadius: radius.sm, overflow: 'hidden', border: `1.5px solid ${colors.gray300}` }}>
          {[
            { key: 'tous',    label: 'Tous'    },
            { key: 'actif',   label: 'Actifs'  },
            { key: 'inactif', label: 'Inactifs' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: filterStatut === f.key ? colors.bleu : colors.white,
              color: filterStatut === f.key ? colors.white : colors.gray600,
              transition: 'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Lignes par page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: colors.gray500, whiteSpace: 'nowrap' }}>Lignes :</span>
          <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '6px 10px', fontSize: 12, color: colors.gray700,
            background: colors.white, cursor: 'pointer', outline: 'none',
          }}>
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Corps ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement des produits…
        </div>
      ) : produits.length === 0 && allCount === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucun produit enregistré</div>
          <p style={{ fontSize: 12, margin: 0 }}>Cliquez sur "+ Nouveau produit" pour commencer.</p>
        </div>
      ) : totalProduits === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray600 }}>Aucun résultat pour « {search} »</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Code', 'Description', 'Voie admin.', 'Posologie', 'Prix achat', 'Prix vente', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: colors.gray600,
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                      borderBottom: `2px solid ${colors.gray200}`,
                      background: colors.gray50,
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produits.map((p, i) => (
                  <tr key={p.id_Rep}
                    style={{ borderBottom: `1px solid ${colors.gray100}` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontSize: 12, color: colors.gray400, textAlign: 'center', width: 40 }}>
                      {(page - 1) * perPage + i + 1}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontWeight: 700, fontSize: 12, color: colors.bleu,
                        background: colors.infoBg, padding: '3px 8px',
                        borderRadius: radius.sm, fontFamily: 'monospace',
                      }}>{p.item_id}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: colors.gray800, fontWeight: 500, maxWidth: 220 }}>
                      <span style={{
                        display: 'block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={p.description}>
                        {p.description || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: colors.gray600 }}>
                      {p.voie_administration ? (
                        <span style={{
                          background: colors.gray100, borderRadius: radius.full,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600,
                          color: colors.gray700,
                        }}>{p.voie_administration}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: colors.gray600 }}>
                      {p.posologie || '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: colors.gray700 }}>
                      {fmtPrix(p.prixcAchat)}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 800, color: colors.success }}>
                      {fmtPrix(p.PrixVente)}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 700,
                        background: p.status_id !== 0 ? colors.successBg : colors.dangerBg,
                        color: p.status_id !== 0 ? colors.success : colors.danger,
                      }}>
                        {p.status_id !== 0 ? '● Actif' : '● Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <ActionBtn color={colors.info} bg={colors.infoBg} title="Modifier" onClick={() => onEdit(p)}>
                          <IconEdit />
                        </ActionBtn>
                        <ActionBtn color={colors.warning} bg={colors.warningBg} title="Désactiver" onClick={() => onDeactivate(p.id_Rep)}>
                          <IconOff />
                        </ActionBtn>
                        <ActionBtn color={colors.danger} bg={colors.dangerBg} title="Supprimer" onClick={() => onDelete(p.id_Rep)}>
                          <IconTrash />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${colors.gray200}`,
            background: colors.gray50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <span style={{ fontSize: 13, color: colors.gray500 }}>
              Affichage <strong style={{ color: colors.gray700 }}>{debut}–{fin}</strong> sur{' '}
              <strong style={{ color: colors.gray700 }}>{totalProduits}</strong> résultat{totalProduits > 1 ? 's' : ''}
              {search && <span style={{ color: colors.orange }}> · filtrés</span>}
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {/* Précédent */}
                <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</PagBtn>

                {pageNums.map((n, i) =>
                  n === '...' ? (
                    <span key={`dots-${i}`} style={{ padding: '0 6px', color: colors.gray400, fontSize: 14 }}>…</span>
                  ) : (
                    <PagBtn key={n} onClick={() => setPage(n)} active={page === n}>{n}</PagBtn>
                  )
                )}

                {/* Suivant */}
                <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</PagBtn>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PagBtn({ onClick, disabled, active, children }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        minWidth: 34, height: 34, padding: '0 6px',
        border: `1.5px solid ${active ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, cursor: disabled ? 'default' : 'pointer',
        fontSize: 13, fontWeight: active ? 800 : 600,
        background: active ? colors.bleu : h && !disabled ? colors.bleu : colors.white,
        color: active || (h && !disabled) ? colors.white : disabled ? colors.gray300 : colors.gray700,
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{children}</button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL CRÉATION / ÉDITION — Centré avec onglets
// ════════════════════════════════════════════════════════════════════════════
function ProduitModal({ isEdit, formData, onChange, onSave, saving, onClose }) {
  const [activeSection, setActiveSection] = useState('identite')

  const set = (name, val) => onChange({ target: { name, value: val, type: 'text' } })
  const setChk = (name, val) => onChange({ target: { name, value: val ? 1 : 0, type: 'checkbox', checked: !!val } })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,31,60,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fdIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fdIn   { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
      `}</style>

      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        width: '100%', maxWidth: 820,
        maxHeight: '92vh',
        boxShadow: '0 24px 80px rgba(0,47,89,0.28)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── En-tête modal ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>💊</div>
            <div>
              <h2 style={{ margin: 0, color: colors.white, fontSize: 18, fontWeight: 800 }}>
                {isEdit ? 'Modifier le produit' : 'Nouveau médicament'}
              </h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                {isEdit ? 'Mettre à jour les informations du médicament' : 'Renseigner les informations du nouveau médicament'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: colors.white,
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >×</button>
        </div>

        {/* ── Corps : onglets + formulaire ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Barre d'onglets latérale */}
          <div style={{
            width: 175, flexShrink: 0,
            borderRight: `1px solid ${colors.gray200}`,
            background: colors.gray50,
            padding: '16px 10px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {FORM_SECTIONS.map(s => {
              const active = activeSection === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: 'none',
                    borderRadius: radius.sm, cursor: 'pointer',
                    fontWeight: active ? 700 : 500, fontSize: 13,
                    textAlign: 'left', width: '100%',
                    background: active ? colors.bleu : 'transparent',
                    color: active ? colors.white : colors.gray600,
                    transition: 'all 0.15s',
                    borderLeft: active ? `3px solid ${colors.orange}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.gray200 }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              )
            })}

            {/* Résumé prix dans la sidebar */}
            {(formData.prixcAchat > 0 || formData.PrixVente > 0) && (
              <div style={{
                marginTop: 'auto', padding: '12px 14px',
                background: colors.white, borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`,
              }}>
                <div style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Aperçu prix</div>
                <div style={{ fontSize: 11, color: colors.gray600, marginBottom: 4 }}>
                  Achat : <strong>{Number(formData.prixcAchat || 0).toLocaleString('fr-FR')} F</strong>
                </div>
                <div style={{ fontSize: 11, color: colors.success }}>
                  Vente : <strong>{Number(formData.PrixVente || 0).toLocaleString('fr-FR')} F</strong>
                </div>
                {formData.prixcAchat > 0 && formData.PrixVente > 0 && (
                  <div style={{
                    marginTop: 6, fontSize: 11, fontWeight: 700,
                    color: formData.PrixVente >= formData.prixcAchat ? colors.success : colors.danger,
                  }}>
                    Marge : {(Number(formData.PrixVente || 0) - Number(formData.prixcAchat || 0)).toLocaleString('fr-FR')} F
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone de formulaire */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Section : Identification */}
            {activeSection === 'identite' && (
              <FormSection title="Identification du produit" icon="🏷️">
                <Grid cols={2}>
                  <Field label="Code produit" required>
                    <FInput name="item_id" value={formData.item_id} onChange={onChange}
                      placeholder="Ex : MED-001" required disabled={isEdit} />
                    {isEdit && <small style={{ color: colors.gray400, fontSize: 10, marginTop: 3, display: 'block' }}>
                      Le code ne peut pas être modifié
                    </small>}
                  </Field>
                  <Field label="Code Vidal">
                    <FInput name="vidal_id" value={formData.vidal_id} onChange={onChange} placeholder="Code Vidal" />
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Désignation / Nom du médicament">
                      <FInput name="description" value={formData.description} onChange={onChange}
                        placeholder="Ex : Paracétamol 500 mg comprimé" />
                    </Field>
                  </div>
                  <Field label="Code CpHa">
                    <FInput name="code_CpHa_id" value={formData.code_CpHa_id} onChange={onChange} placeholder="Code CpHa" />
                  </Field>
                  <Field label="Code UCD">
                    <FInput name="ucd" value={formData.ucd} onChange={onChange} placeholder="Code UCD" />
                  </Field>
                </Grid>
              </FormSection>
            )}

            {/* Section : Administration */}
            {activeSection === 'administration' && (
              <FormSection title="Administration et posologie" icon="💉">
                <Grid cols={2}>
                  <Field label="Voie d'administration">
                    <FSelect name="voie_administration" value={formData.voie_administration} onChange={onChange}>
                      <option value="">— Sélectionner —</option>
                      {['Orale','Intraveineuse','Intramusculaire','Sous-cutanée','Rectale','Inhalation','Transdermique','Oculaire','Auriculaire','Nasale','Locale'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </FSelect>
                  </Field>
                  <Field label="Prise alimentaire">
                    <FSelect name="food_type" value={formData.food_type} onChange={onChange}>
                      <option value="">— Sélectionner —</option>
                      <option value="avant">Avant repas</option>
                      <option value="pendant">Pendant repas</option>
                      <option value="apres">Après repas</option>
                      <option value="indifferent">Indifférent</option>
                    </FSelect>
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Posologie détaillée">
                      <FInput name="posologie" value={formData.posologie} onChange={onChange}
                        placeholder="Ex : 1 comprimé 3 fois par jour pendant 7 jours" />
                    </Field>
                  </div>
                  <Field label="Durée traitement (jours)">
                    <FInput type="number" name="days" value={formData.days} onChange={onChange} min="0" placeholder="0" />
                  </Field>
                  <Field label="Durée type">
                    <FSelect name="duration_type" value={formData.duration_type} onChange={onChange}>
                      <option value="">— Sélectionner —</option>
                      <option value="jour">Jour</option>
                      <option value="semaine">Semaine</option>
                      <option value="mois">Mois</option>
                      <option value="annee">Année</option>
                    </FSelect>
                  </Field>
                  <Field label="Préférence substitution">
                    <FInput name="preference_substitution" value={formData.preference_substitution} onChange={onChange} />
                  </Field>
                  <Field label="Remarques">
                    <FInput name="remarques" value={formData.remarques} onChange={onChange} placeholder="Observations particulières…" />
                  </Field>
                </Grid>
              </FormSection>
            )}

            {/* Section : Horaires de prise */}
            {activeSection === 'horaires' && (
              <FormSection title="Horaires de prise" icon="⏰">
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
                }}>
                  {[
                    { name: 'matin',  label: 'Matin',   icon: '🌅', placeholder: 'Ex : 08h00' },
                    { name: 'midi',   label: 'Midi',    icon: '☀️',  placeholder: 'Ex : 12h30' },
                    { name: 'soir',   label: 'Soir',    icon: '🌆', placeholder: 'Ex : 20h00' },
                    { name: 'couche', label: 'Coucher', icon: '🌙', placeholder: 'Au coucher' },
                  ].map(f => (
                    <div key={f.name} style={{
                      border: `1.5px solid ${colors.gray200}`,
                      borderRadius: radius.md, padding: '14px 16px',
                      background: colors.gray50,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{f.icon}</span>
                        <Lbl>{f.label}</Lbl>
                      </div>
                      <FInput name={f.name} value={formData[f.name]} onChange={onChange}
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Field label="Quantité par défaut">
                    <FInput type="number" name="default_qty" value={formData.default_qty} onChange={onChange} min="0" placeholder="0" />
                  </Field>
                </div>
              </FormSection>
            )}

            {/* Section : Dosages */}
            {activeSection === 'dosages' && (
              <FormSection title="Paramètres de dosage" icon="⚗️">
                <Grid cols={2}>
                  {[
                    { name: 'dddadulte',  label: 'DDD Adulte',      placeholder: '0' },
                    { name: 'dddpediatr', label: 'DDD Pédiatrique', placeholder: '0' },
                    { name: 'max_prise',  label: 'Dose max / jour',  placeholder: '0' },
                    { name: 'qty_vrac',   label: 'Quantité vrac',   placeholder: '0' },
                    { name: 'duration',   label: 'Durée (valeur)',   placeholder: '0' },
                    { name: 'renew',      label: null },
                  ].filter(f => f.label !== null).map(f => (
                    <Field key={f.name} label={f.label}>
                      <FInput type="number" name={f.name} value={formData[f.name]} onChange={onChange}
                        min="0" placeholder={f.placeholder} />
                    </Field>
                  ))}
                </Grid>
              </FormSection>
            )}

            {/* Section : Prix & Options */}
            {activeSection === 'prix' && (
              <>
                <FormSection title="Tarification" icon="💰">
                  <Grid cols={2}>
                    <Field label="Prix d'achat (F CFA)">
                      <FInput type="number" name="prixcAchat" value={formData.prixcAchat} onChange={onChange} min="0" placeholder="0" />
                    </Field>
                    <Field label="Prix de vente (F CFA)">
                      <FInput type="number" name="PrixVente" value={formData.PrixVente} onChange={onChange} min="0" placeholder="0" />
                    </Field>
                  </Grid>
                  {formData.prixcAchat > 0 && formData.PrixVente > 0 && (
                    <div style={{
                      marginTop: 14, padding: '12px 16px',
                      background: Number(formData.PrixVente) >= Number(formData.prixcAchat) ? colors.successBg : colors.dangerBg,
                      borderRadius: radius.sm,
                      border: `1px solid ${Number(formData.PrixVente) >= Number(formData.prixcAchat) ? colors.success : colors.danger}33`,
                      display: 'flex', gap: 24,
                    }}>
                      <span style={{ fontSize: 12, color: colors.gray700 }}>
                        Marge brute :{' '}
                        <strong style={{ color: Number(formData.PrixVente) >= Number(formData.prixcAchat) ? colors.success : colors.danger }}>
                          {(Number(formData.PrixVente || 0) - Number(formData.prixcAchat || 0)).toLocaleString('fr-FR')} F
                        </strong>
                      </span>
                      {Number(formData.prixcAchat) > 0 && (
                        <span style={{ fontSize: 12, color: colors.gray700 }}>
                          Taux :{' '}
                          <strong style={{ color: Number(formData.PrixVente) >= Number(formData.prixcAchat) ? colors.success : colors.danger }}>
                            {((Number(formData.PrixVente || 0) - Number(formData.prixcAchat || 0)) / Number(formData.prixcAchat) * 100).toFixed(1)} %
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </FormSection>

                <FormSection title="Options de prescription" icon="⚙️">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <FCheck
                      name="renew"
                      label="Médicament renouvelable"
                      checked={formData.renew === 1}
                      onChange={onChange}
                    />
                    <FCheck
                      name="subustitution"
                      label="Substitution autorisée"
                      checked={formData.subustitution === 1}
                      onChange={onChange}
                    />
                    <FCheck
                      name="for_all_prescription"
                      label="Disponible pour toutes prescriptions"
                      checked={formData.for_all_prescription === 1}
                      onChange={onChange}
                    />
                  </div>
                </FormSection>
              </>
            )}

            {/* Navigation inter-sections */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 8, borderTop: `1px solid ${colors.gray100}`,
            }}>
              {(() => {
                const idx = FORM_SECTIONS.findIndex(s => s.key === activeSection)
                const prev = FORM_SECTIONS[idx - 1]
                const next = FORM_SECTIONS[idx + 1]
                return (
                  <>
                    <button
                      onClick={() => prev && setActiveSection(prev.key)}
                      disabled={!prev}
                      style={{
                        padding: '8px 16px', border: `1.5px solid ${colors.gray300}`,
                        borderRadius: radius.sm, cursor: prev ? 'pointer' : 'default',
                        fontSize: 12, fontWeight: 600, background: colors.white,
                        color: prev ? colors.gray700 : colors.gray300, transition: 'all 0.15s',
                      }}
                    >
                      ‹ {prev ? prev.label : ''}
                    </button>
                    <button
                      onClick={() => next && setActiveSection(next.key)}
                      disabled={!next}
                      style={{
                        padding: '8px 16px', border: `1.5px solid ${colors.gray300}`,
                        borderRadius: radius.sm, cursor: next ? 'pointer' : 'default',
                        fontSize: 12, fontWeight: 600, background: colors.white,
                        color: next ? colors.gray700 : colors.gray300, transition: 'all 0.15s',
                      }}
                    >
                      {next ? next.label : ''} ›
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* ── Pied modal ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.gray50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: 12,
        }}>
          {/* Indicateur progression sections */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {FORM_SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                title={s.label}
                style={{
                  width: activeSection === s.key ? 24 : 8,
                  height: 8, borderRadius: 4,
                  border: 'none', cursor: 'pointer', padding: 0,
                  background: activeSection === s.key ? colors.bleu : colors.gray300,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 22px', border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.md, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: colors.white, color: colors.gray700, transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = colors.gray100}
              onMouseLeave={e => e.currentTarget.style.background = colors.white}
            >Annuler</button>

            <button onClick={onSave} disabled={saving} style={{
              padding: '10px 28px', border: 'none', borderRadius: radius.md,
              cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: 13,
              background: saving ? colors.gray400 : colors.orange,
              color: colors.white, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: saving ? 'none' : '0 4px 12px rgba(255,118,49,0.35)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => !saving && (e.currentTarget.style.background = colors.orangeDark)}
              onMouseLeave={e => !saving && (e.currentTarget.style.background = colors.orange)}
            >
              {saving ? '⏳ Enregistrement…' : (isEdit ? '💾 Mettre à jour' : '✅ Enregistrer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Composants helpers formulaire ────────────────────────────────────────────

function FormSection({ title, icon, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', marginBottom: 18,
        background: `linear-gradient(90deg, ${colors.bleu}0d, transparent)`,
        borderLeft: `3px solid ${colors.bleu}`,
        borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.bleu }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <Lbl required={required}>{label}</Lbl>}
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB FOURNISSEURS
// ════════════════════════════════════════════════════════════════════════════
function FournisseursTab({ data }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>🏭 Fournisseurs</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['#', 'Nom', 'Téléphone', 'Email'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: 'left', fontSize: 11,
                fontWeight: 700, color: colors.gray600,
                textTransform: 'uppercase', letterSpacing: '0.4px',
                borderBottom: `2px solid ${colors.gray200}`,
                background: colors.gray50,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((f, i) => (
            <tr key={f.id}
              style={{ borderBottom: `1px solid ${colors.gray100}` }}
              onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
              <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.bleu, fontSize: 13 }}>{f.nom}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{f.telephone}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{f.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER TABS
// ════════════════════════════════════════════════════════════════════════════
function PlaceholderTab({ item }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md, padding: 56,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{item?.icon || '🚧'}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: colors.gray700, marginBottom: 8 }}>{item?.label}</div>
      <p style={{ fontSize: 13, color: colors.gray500, margin: 0 }}>
        Cette section est en cours de développement.
      </p>
    </div>
  )
}
