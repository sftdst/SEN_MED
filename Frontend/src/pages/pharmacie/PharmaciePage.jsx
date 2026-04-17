import { useState, useEffect, useMemo } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'
import { produitApi, fournisseurApi, commandeApi, approvisionnementApi, mouvementStockApi, inventaireApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

// ── Sous-menu interne ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: 'accueil',           label: 'Tableau de bord',    icon: '🏠' },
  { key: 'produits',          label: 'Liste des produits', icon: '💊' },
  { key: 'fournisseurs',      label: 'Fournisseurs',       icon: '🏭' },
  { key: 'commandes',         label: 'Commandes',          icon: '📋' },
  { key: 'approvisionnement', label: 'Approvisionnement',  icon: '🚚' },
  { key: 'ajustement',        label: 'Ajustement stock',   icon: '⚖️' },
  { key: 'sortie',            label: 'Sortie de stock',    icon: '📤' },
  { key: 'reception',         label: 'Réception',          icon: '📥' },
  { key: 'inventaire',        label: 'Inventaire',         icon: '📊' },
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
  type: '',
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
  const [activeTab,    setActiveTab]  = useState('accueil')
  const [produits,     setProduits]   = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [commandes,    setCommandes]  = useState([])
  const [approvisionnements, setApprovisionnements] = useState([])
  const [mouvements,   setMouvements] = useState([])
  const [inventaires,  setInventaires] = useState([])
  const [showModal,    setShowModal]  = useState(false)
  const [showFournisseurModal, setShowFournisseurModal] = useState(false)
  const [showCommandeModal, setShowCommandeModal] = useState(false)
  const [showMouvementModal, setShowMouvementModal] = useState(false)
  const [editingId,    setEditingId]  = useState(null)
  const [editingFournisseurId, setEditingFournisseurId] = useState(null)
  const [editingCommandeId, setEditingCommandeId] = useState(null)
  const [formData,     setFormData]   = useState(EMPTY)
  const [fournisseurForm, setFournisseurForm] = useState({
    code: '', nom: '', pays: 'Sénégal', ville: '', adresse: '', code_postal: '',
    telephone: '', email: '', site_web: '',
    nom_responsable: '', tel_responsable: '',
    monnaie: 'FCFA', swift: '', iban: '', numero_compte: '', banque: '',
    remarques: '', actif: true,
    produits: []
  })
  const [commandeForm, setCommandeForm] = useState({
    id_Rep: '', numero_commande: '', fournisseur_id: '', date_commande: '', date_livration_prevue: '',
    type_commande: '', lieu_reception: '', statut: 'en_attente', observations: '',
    montant_total: 0, produits: []
  })
  const [mouvementForm, setMouvementForm] = useState({
    item_id: '', type_mouvement: 'entree', quantite: 1, prix_unitaire: 0, motif: ''
  })
  const [loading,      setLoading]    = useState(false)
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false)
  const [loadingCommandes, setLoadingCommandes] = useState(false)
  const [loadingMouvements, setLoadingMouvements] = useState(false)
  const [loadingInventaires, setLoadingInventaires] = useState(false)
  const [saving,       setSaving]     = useState(false)
  const [search,       setSearch]     = useState('')
  const [filterStatut, setFilter]     = useState('tous')
  const [page,         setPage]       = useState(1)
  const [perPage,      setPerPage]    = useState(10)

  useEffect(() => {
    if (activeTab === 'produits' || activeTab === 'accueil') loadProduits()
    if (activeTab === 'fournisseurs') loadFournisseurs()
    if (activeTab === 'commandes') loadCommandes()
    if (activeTab === 'approvisionnement') loadApprovisionnements()
    if (activeTab === 'ajustement' || activeTab === 'sortie' || activeTab === 'reception') loadMouvements()
    if (activeTab === 'inventaire') loadInventaires()
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

  const loadFournisseurs = async () => {
    setLoadingFournisseurs(true)
    try {
      const res = await fournisseurApi.liste()
      setFournisseurs(res.data.data || [])
    } catch {
      showToast('Erreur chargement des fournisseurs', 'error')
    } finally {
      setLoadingFournisseurs(false)
    }
  }

  const loadCommandes = async () => {
    setLoadingCommandes(true)
    try {
      const res = await commandeApi.liste()
      setCommandes(res.data.data || [])
    } catch {
      showToast('Erreur chargement des commandes', 'error')
    } finally {
      setLoadingCommandes(false)
    }
  }

  const loadApprovisionnements = async () => {
    setLoadingCommandes(true)
    try {
      const res = await approvisionnementApi.liste()
      setApprovisionnements(res.data.data || [])
    } catch {
      showToast('Erreur chargement des approvisionnements', 'error')
    } finally {
      setLoadingCommandes(false)
    }
  }

  const loadMouvements = async () => {
    setLoadingMouvements(true)
    try {
      const res = await mouvementStockApi.liste()
      setMouvements(res.data.data || [])
    } catch {
      showToast('Erreur chargement des mouvements', 'error')
    } finally {
      setLoadingMouvements(false)
    }
  }

  const loadInventaires = async () => {
    setLoadingInventaires(true)
    try {
      const res = await inventaireApi.liste()
      setInventaires(res.data.data || [])
    } catch {
      showToast('Erreur chargement des inventaires', 'error')
    } finally {
      setLoadingInventaires(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY)
    setShowModal(true)
  }

  const openCreateFournisseur = async () => {
    if (produits.length === 0) {
      await loadProduits()
    }
    setEditingFournisseurId(null)
    setFournisseurForm({
      code: '', nom: '', pays: 'Sénégal', ville: '', adresse: '', code_postal: '',
      telephone: '', email: '', site_web: '',
      nom_responsable: '', tel_responsable: '',
      monnaie: 'FCFA', swift: '', iban: '', numero_compte: '', banque: '',
      remarques: '', actif: true,
      produits: []
    })
    setShowFournisseurModal(true)
  }

   const openEditFournisseur = async (f) => {
     if (produits.length === 0) {
       await loadProduits()
     }
     setEditingFournisseurId(f.id_Rep)
     setShowFournisseurModal(true)
     try {
       const res = await fournisseurApi.detail(f.id_Rep)
       const data = res.data.data
       setFournisseurForm({
         code: data.code || '', nom: data.nom || '', pays: data.pays || 'Sénégal', ville: data.ville || '', adresse: data.adresse || '', code_postal: data.code_postal || '',
         telephone: data.telephone || '', email: data.email || '', site_web: data.site_web || '',
         nom_responsable: data.nom_responsable || '', tel_responsable: data.tel_responsable || '',
         monnaie: data.monnaie || 'FCFA', swift: data.swift || '', iban: data.iban || '', numero_compte: data.numero_compte || '', banque: data.banque || '',
         remarques: data.remarques || '', actif: data.actif ?? true,
         produits: data.produits?.map(p => ({
           produit_id: p.produit_id?.toString() || p.produit?.id_Rep?.toString() || '',
           prix: p.prix || 0,
           devise: p.devise || 'FCFA',
           delai_livraison: p.delai_livraison ?? null,
           quantite_minimale: p.quantite_minimale ?? 1,
           remise: p.remise ?? 0,
         })) || []
       })
     } catch {
       showToast('Erreur chargement du fournisseur', 'error')
       setShowFournisseurModal(false)
     }
   }

  const handleFournisseurChange = (e) => {
    const { name, value, type, checked } = e.target
    setFournisseurForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleFournisseurProduitChange = (index, field, value) => {
    setFournisseurForm(prev => {
      const produits = [...prev.produits]
      produits[index] = { ...produits[index], [field]: value }
      return { ...prev, produits }
    })
  }

  const handleAddFournisseurProduit = () => {
    setFournisseurForm(prev => ({
      ...prev,
      produits: [...prev.produits, { produit_id: '', prix: 0, devise: 'FCFA', delai_livraison: null, quantite_minimale: 1, remise: 0 }]
    }))
  }

  const handleRemoveFournisseurProduit = (index) => {
    setFournisseurForm(prev => ({
      ...prev,
      produits: prev.produits.filter((_, i) => i !== index)
    }))
  }

  const handleSaveFournisseur = async () => {
    if (!fournisseurForm.code.trim()) { showToast('Le code fournisseur est obligatoire', 'error'); return }
    if (!fournisseurForm.nom.trim()) { showToast('Le nom du fournisseur est obligatoire', 'error'); return }
    setSaving(true)
    try {
      if (editingFournisseurId) {
        await fournisseurApi.modifier(editingFournisseurId, fournisseurForm)
        showToast('Fournisseur mis à jour avec succès')
      } else {
        await fournisseurApi.creer(fournisseurForm)
        showToast('Fournisseur créé avec succès')
      }
      setShowFournisseurModal(false)
      loadFournisseurs()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFournisseur = async (id) => {
    if (!window.confirm('Supprimer ce fournisseur définitivement ?')) return
    try {
      await fournisseurApi.supprimer(id)
      showToast('Fournisseur supprimé')
      loadFournisseurs()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreateCommande = async () => {
    if (produits.length === 0) {
      await loadProduits()
    }
    if (fournisseurs.length === 0) {
      setLoadingFournisseurs(true)
      try {
        const res = await fournisseurApi.liste()
        setFournisseurs(res.data.data || [])
      } catch {
        showToast('Erreur chargement des fournisseurs', 'error')
      } finally {
        setLoadingFournisseurs(false)
      }
    }
    setEditingCommandeId(null)
    const today = new Date().toISOString().split('T')[0]
    const numero = 'CMD-' + today.replace(/-/g,'') + '-' + Math.floor(1000 + Math.random()*9000)
    setCommandeForm({
      id_Rep: '', numero_commande: numero, fournisseur_id: '', date_commande: today,
      date_livration_prevue: '', type_commande: '', lieu_reception: '',
      statut: 'en_attente', observations: '', montant_total: 0, produits: []
    })
    setShowCommandeModal(true)
  }

   const openEditCommande = async (c) => {
     if (produits.length === 0) {
       await loadProduits()
     }
     if (fournisseurs.length === 0) {
       setLoadingFournisseurs(true)
       try {
         const res = await fournisseurApi.liste()
         setFournisseurs(res.data.data || [])
       } catch {
         showToast('Erreur chargement des fournisseurs', 'error')
       } finally {
         setLoadingFournisseurs(false)
       }
     }
     setEditingCommandeId(c.id_Rep)
     setShowCommandeModal(true)
     try {
       const res = await commandeApi.detail(c.id_Rep)
       const data = res.data.data
       setCommandeForm({
         id_Rep: data.id_Rep,
         numero_commande: data.numero_commande || '',
         fournisseur_id: data.fournisseur_id ? data.fournisseur_id.toString() : '',
         date_commande: data.date_commande || '',
         date_livration_prevue: data.date_livration_prevue || '',
         type_commande: data.type_commande || '',
         lieu_reception: data.lieu_reception || '',
         statut: data.statut || 'en_attente',
         observations: data.observations || '',
         montant_total: data.montant_total || 0,
         produits: data.produits?.map(p => ({
           produit_id: p.produit_id?.toString() || '',
           quantite: Number(p.quantite) || 0,
           prix_achat: Number(p.prix_achat) || 0,
           tva: Number(p.tva) || 0,
         })) || []
       })
     } catch {
       showToast('Erreur chargement de la commande', 'error')
       setShowCommandeModal(false)
     }
   }

  const handleCommandeChange = (e) => {
    const { name, value, type, checked } = e.target
    setCommandeForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSaveCommande = async () => {
    if (!commandeForm.fournisseur_id) { showToast('Veuillez sélectionner un fournisseur', 'error'); return }
    if (!commandeForm.date_commande) { showToast('La date de commande est obligatoire', 'error'); return }
    if (!commandeForm.produits || commandeForm.produits.length === 0) { showToast('Ajoutez au moins un produit à la commande', 'error'); return }
    // Validate each produit line
    for (let i = 0; i < commandeForm.produits.length; i++) {
      const p = commandeForm.produits[i]
      if (!p.produit_id) { showToast(`Ligne ${i+1}: Sélectionnez un produit`, 'error'); return }
      if (!p.quantite || p.quantite <= 0) { showToast(`Ligne ${i+1}: Quantité invalide`, 'error'); return }
      if (p.prix_achat == null || p.prix_achat < 0) { showToast(`Ligne ${i+1}: Prix invalide`, 'error'); return }
    }
    setSaving(true)
    try {
      if (editingCommandeId) {
        await commandeApi.modifier(editingCommandeId, commandeForm)
        showToast('Commande mise à jour avec succès')
      } else {
        await commandeApi.creer(commandeForm)
        showToast('Commande créée avec succès')
      }
      setShowCommandeModal(false)
      loadCommandes()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCommande = async (id) => {
    if (!window.confirm('Supprimer cette commande ?')) return
    try {
      await commandeApi.supprimer(id)
      showToast('Commande supprimée')
      loadCommandes()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreateMouvement = (type = 'entree') => {
    setMouvementForm({ item_id: '', type_mouvement: type, quantite: 1, prix_unitaire: 0, motif: '' })
    setShowMouvementModal(true)
  }

  const handleMouvementChange = (e) => {
    const { name, value } = e.target
    setMouvementForm(prev => ({ ...prev, [name]: name === 'quantite' || name === 'prix_unitaire' ? Number(value) : value }))
  }

  const handleSaveMouvement = async () => {
    if (!mouvementForm.item_id) { showToast('Sélectionnez un produit', 'error'); return }
    if (mouvementForm.quantite <= 0) { showToast('La quantité doit être positive', 'error'); return }
    setSaving(true)
    try {
      await mouvementStockApi.creer(mouvementForm)
      showToast('Mouvement enregistré')
      setShowMouvementModal(false)
      loadMouvements()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMouvement = async (id) => {
    showToast('Suppression non autorisée pour audit', 'error')
  }

  const handleCreateInventaire = async () => {
    if (!window.confirm('Démarrer un nouvel inventaire ?')) return
    setSaving(true)
    try {
      await inventaireApi.creer({ date_inventaire: new Date().toISOString().split('T')[0] })
      showToast('Inventaire créé')
      loadInventaires()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCloturerInventaire = async (id) => {
    if (!window.confirm('Clôturer cet inventaire ?')) return
    setSaving(true)
    try {
      await inventaireApi.cloturer(id, {})
      showToast('Inventaire clôturé')
      loadInventaires()
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInventaire = async (id) => {
    if (!window.confirm('Supprimer cet inventaire ?')) return
    try {
      await inventaireApi.supprimer(id)
      showToast('Inventaire supprimé')
      loadInventaires()
    } catch {
      showToast('Erreur suppression', 'error')
    }
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
      type: p.type || '',
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
        (p.voie_administration || '').toLowerCase().includes(q) ||
        (p.type || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [produits, search, filterStatut])

  const totalPages = Math.ceil(filtered.length / perPage)
  const pageItems  = filtered.slice((page - 1) * perPage, page * perPage)

  // Reset page quand filtre change
  useEffect(() => { setPage(1) }, [search, filterStatut, perPage])

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
          }}>💊</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Gestion Pharmaceutique
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {activeItem?.label ?? 'Médicaments, stocks et approvisionnements'}
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
        {activeTab === 'fournisseurs' && (
          <button onClick={openCreateFournisseur} style={{
            background: colors.orange, border: 'none', color: colors.white,
            padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouveau fournisseur
          </button>
        )}
        {activeTab === 'commandes' && (
          <button onClick={openCreateCommande} style={{
            background: colors.orange, border: 'none', color: colors.white,
            padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouvelle commande
          </button>
        )}
        {(activeTab === 'ajustement' || activeTab === 'sortie' || activeTab === 'reception') && (
          <button onClick={() => openCreateMouvement(activeTab === 'sortie' ? 'sortie' : activeTab === 'reception' ? 'entree' : 'ajustement')} style={{
            background: colors.orange, border: 'none', color: colors.white,
            padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouveau mouvement
          </button>
        )}
        {activeTab === 'inventaire' && (
          <button onClick={handleCreateInventaire} style={{
            background: colors.orange, border: 'none', color: colors.white,
            padding: '10px 20px', borderRadius: radius.md, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(255,118,49,0.4)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouvel inventaire
          </button>
        )}
      </div>

      {/* ── Corps : menu horizontal + contenu ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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

        {/* ── Zone de contenu principale ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
          {activeTab === 'fournisseurs' && (
            <FournisseursTab
              data={fournisseurs}
              loading={loadingFournisseurs}
              onEdit={openEditFournisseur}
              onDelete={handleDeleteFournisseur}
            />
          )}
          {activeTab === 'commandes' && (
            <CommandesTab
              commandes={commandes}
              loading={loadingCommandes}
              fournisseurs={fournisseurs}
              onEdit={openEditCommande}
              onDelete={handleDeleteCommande}
            />
          )}
          {activeTab === 'approvisionnement' && (
            <ApprovisionnementsTab
              approvisionnements={approvisionnements}
              loading={loadingCommandes}
              fournisseurs={fournisseurs}
            />
          )}
          {activeTab === 'ajustement' && (
            <MouvementsTab
              mouvements={mouvements}
              loading={loadingMouvements}
              produits={produits}
              typeFilter="ajustement"
              onDelete={handleDeleteMouvement}
            />
          )}
          {activeTab === 'sortie' && (
            <MouvementsTab
              mouvements={mouvements}
              loading={loadingMouvements}
              produits={produits}
              typeFilter="sortie"
              onDelete={handleDeleteMouvement}
            />
          )}
          {activeTab === 'reception' && (
            <MouvementsTab
              mouvements={mouvements}
              loading={loadingMouvements}
              produits={produits}
              typeFilter="entree"
              onDelete={handleDeleteMouvement}
            />
          )}
          {activeTab === 'inventaire' && (
            <InventairesTab
              inventaires={inventaires}
              loading={loadingInventaires}
              onCloturer={handleCloturerInventaire}
              onDelete={handleDeleteInventaire}
            />
          )}
        </div>
      </div>

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

      {/* ── Modal création / édition fournisseur ── */}
      {showFournisseurModal && (
        <FournisseurModal
          isEdit={!!editingFournisseurId}
          formData={fournisseurForm}
          onChange={handleFournisseurChange}
          onSave={handleSaveFournisseur}
          saving={saving}
          onClose={() => setShowFournisseurModal(false)}
          allProduits={produits}
        />
      )}

      {/* ── Modal création commande ── */}
      {showCommandeModal && (
        <CommandeModal
          isEdit={!!editingCommandeId}
          formData={commandeForm}
          onChange={handleCommandeChange}
          onSave={handleSaveCommande}
          saving={saving}
          onClose={() => setShowCommandeModal(false)}
          fournisseurs={fournisseurs}
          produits={produits}
        />
      )}

      {/* ── Modal création mouvement ── */}
      {showMouvementModal && (
        <MouvementModal
          formData={mouvementForm}
          onChange={handleMouvementChange}
          onSave={handleSaveMouvement}
          saving={saving}
          onClose={() => setShowMouvementModal(false)}
          produits={produits}
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
                  {['#', 'Code', 'Description', 'Voie admin.', 'Posologie', 'Type', 'Prix achat', 'Prix vente', 'Statut', 'Actions'].map(h => (
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
                    <td style={{ padding: '11px 16px', fontSize: 12 }}>
                      {p.type ? (
                        <span style={{
                          background: p.type === 'pharmaceutique' ? colors.infoBg : '#f3e5f5',
                          borderRadius: radius.full,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600,
                          color: p.type === 'pharmaceutique' ? colors.bleu : '#7b1fa2',
                        }}>{p.type === 'pharmaceutique' ? 'Pharmaceutique' : 'Laboratoire'}</span>
                      ) : '—'}
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
                  <Field label="Type">
                    <FSelect name="type" value={formData.type} onChange={onChange}>
                      <option value="">— Sélectionner —</option>
                      <option value="pharmaceutique">Pharmaceutique</option>
                      <option value="laboratoire">Laboratoire</option>
                    </FSelect>
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
function FournisseursTab({ data, loading, onEdit, onDelete }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>🏭 Fournisseurs</span>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement des fournisseurs…
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucun fournisseur enregistré</div>
          <p style={{ fontSize: 12, margin: 0 }}>Cliquez sur "+ Nouveau fournisseur" pour commencer.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Nom', 'Téléphone', 'Email', 'Ville', 'Statut', 'Actions'].map(h => (
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
              <tr key={f.id_Rep}
                style={{ borderBottom: `1px solid ${colors.gray100}` }}
                onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.bleu, fontSize: 13 }}>{f.nom}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{f.telephone || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{f.email || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray600 }}>{f.ville || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 700,
                    background: f.actif !== false ? colors.successBg : colors.dangerBg,
                    color: f.actif !== false ? colors.success : colors.danger,
                  }}>
                    {f.actif !== false ? '● Actif' : '● Inactif'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn color={colors.info} bg={colors.infoBg} title="Modifier" onClick={() => onEdit(f)}>
                      <IconEdit />
                    </ActionBtn>
                    <ActionBtn color={colors.danger} bg={colors.dangerBg} title="Supprimer" onClick={() => onDelete(f.id_Rep)}>
                      <IconTrash />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL FOURNISSEUR
// ════════════════════════════════════════════════════════════════════════════
// ── Sections du formulaire fournisseur ───────────────────────────────────────
const FOURNISSEUR_SECTIONS = [
  { key: 'info',        label: 'Informations',  icon: '🏢' },
  { key: 'coordonnees', label: 'Coordonnées',   icon: '📍' },
  { key: 'contact',     label: 'Contact',       icon: '👤' },
  { key: 'bancaire',    label: 'Bancaire',      icon: '🏦' },
  { key: 'produits',    label: 'Produits',      icon: '📦' },
  { key: 'remarques',   label: 'Remarques',     icon: '📝' },
]

// ── Tableau des produits du fournisseur ──────────────────────────────────────
function FournisseurProduitsTable({ produits, setProduits, allItems }) {
  const [editIdx, setEditIdx] = useState(null)
  const [newRow, setNewRow] = useState(null)
  const [errors, setErrors] = useState({})

  const getAvailableProducts = (currentIndex = null) => {
    return allItems.filter(item => {
      const itemId = String(item.id_Rep)
      const alreadyUsed = produits.some((p, idx) => p.produit_id === itemId && idx !== currentIndex)
      return !alreadyUsed
    })
  }

  const validateRow = (row, index) => {
    const newErrors = {}
    if (!row.produit_id) {
      newErrors.produit_id = 'Produit requis'
    }
    if (row.prix === null || row.prix === '' || isNaN(Number(row.prix))) {
      newErrors.prix = 'Prix requis'
    }
    return newErrors
  }

  const handleNewChange = (field, val) => {
    setNewRow(prev => {
      const u = { ...prev, [field]: val }
      if (field === 'quantite_minimale' || field === 'remise') {
        u[field] = val === '' ? null : Number(val)
      }
      if (field === 'delai_livraison') {
        u[field] = val === '' ? null : Number(val)
      }
      if (field === 'prix') {
        u[field] = val === '' ? 0 : Number(val)
      }
      return u
    })
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleEditChange = (index, field, val) => {
    setProduits(prev => {
      const produits = [...prev]
      const row = { ...produits[index], [field]: val }
      if (field === 'quantite_minimale' || field === 'remise') {
        row[field] = val === '' ? null : Number(val)
      }
      if (field === 'delai_livraison') {
        row[field] = val === '' ? null : Number(val)
      }
      if (field === 'prix') {
        row[field] = val === '' ? 0 : Number(val)
      }
      produits[index] = row
      return produits
    })
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleAdd = () => {
    if (!newRow?.produit_id) {
      showToast('Veuillez sélectionner un produit', 'error')
      return
    }
    if (newRow.prix === null || newRow.prix === '' || Number(newRow.prix) < 0) {
      showToast('Veuillez entrer un prix valide', 'error')
      return
    }
    setProduits(prev => [...prev, { ...newRow, _tempId: Date.now() }])
    setNewRow(null)
    setErrors({})
  }

  const handleRemove = (index) => {
    setProduits(prev => prev.filter((_, i) => i !== index))
    if (editIdx === index) setEditIdx(null)
  }

  const availableProductsForNew = getAvailableProducts()
  const tHead = {
    padding: '8px 10px', fontSize: '11px', fontWeight: 700,
    color: colors.white, background: colors.bleu,
    textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.3px',
  }
  const tCell = {
    padding: '8px 10px', fontSize: '12px',
    borderBottom: `1px solid ${colors.gray100}`, verticalAlign: 'middle',
  }
  const inpCell = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${colors.bleu}`, borderRadius: radius.sm,
    padding: '5px 8px', fontSize: '12px', outline: 'none',
  }

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md,
      boxShadow: shadows.sm,
      overflow: 'hidden',
      marginTop: spacing.md,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.orange} 0%, #e55c24 100%)`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: colors.white }}>
            Produits du fournisseur
          </span>
          {produits.length > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.2)', color: colors.white,
              borderRadius: radius.full, padding: '2px 8px', fontSize: '11px', fontWeight: 700,
            }}>
              {produits.length}
            </span>
          )}
        </div>
        <div>
          {newRow ? (
            <>
              <button onClick={() => { setNewRow(null); setErrors({}) }} style={{
                padding: '6px 14px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: radius.sm,
                background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: 6,
              }}>Annuler</button>
              <button onClick={handleAdd} style={{
                padding: '6px 14px', border: 'none', borderRadius: radius.sm,
                background: colors.white, color: colors.orange, cursor: 'pointer', fontSize: '12px', fontWeight: 700,
              }}>✓ Ajouter</button>
            </>
          ) : (
            <button onClick={() => setNewRow({ produit_id: '', prix: 0, devise: formData.monnaie || 'FCFA', delai_livraison: null, quantite_minimale: 1, remise: 0 })} style={{
              padding: '6px 14px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: radius.sm,
              background: 'rgba(255,255,255,0.1)', color: colors.white, cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}>
              + Ajouter un produit
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...tHead, width: 40, textAlign: 'center' }}>#</th>
              <th style={{ ...tHead, minWidth: 200 }}>Produit</th>
              <th style={{ ...tHead, textAlign: 'right', width: 120 }}>Prix</th>
              <th style={{ ...tHead, textAlign: 'center', width: 90 }}>Devise</th>
              <th style={{ ...tHead, textAlign: 'center', width: 100 }}>Délai (j)</th>
              <th style={{ ...tHead, textAlign: 'center', width: 100 }}>Qte min</th>
              <th style={{ ...tHead, textAlign: 'center', width: 80 }}>Remise %</th>
              <th style={{ ...tHead, textAlign: 'center', width: 60 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New row */}
            {newRow && (
              <tr style={{ background: `${colors.orange}08` }}>
                <td style={{ ...tCell, textAlign: 'center', color: colors.gray400 }}>—</td>
                <td style={tCell}>
                  <select
                    value={newRow.produit_id || ''}
                    onChange={e => handleNewChange('produit_id', e.target.value)}
                    style={{ ...inpCell, width: '100%' }}
                    autoFocus
                  >
                    <option value="">Sélectionner...</option>
                    {availableProductsForNew.map(item => (
                      <option key={item.id_Rep} value={item.id_Rep}>
                        {item.description || `Produit #${item.id_Rep}`}
                      </option>
                    ))}
                  </select>
                  {availableProductsForNew.length === 0 && (
                    <div style={{ fontSize: '10px', color: colors.danger, marginTop: 2 }}>
                      Tous les produits sont déjà ajoutés
                    </div>
                  )}
                </td>
                <td style={tCell}>
                  <input
                    type="number" min="0" step="0.01"
                    value={newRow.prix || 0}
                    onChange={e => handleNewChange('prix', e.target.value)}
                    style={{ ...inpCell, textAlign: 'right' }}
                  />
                </td>
                <td style={tCell}>
                  <select
                    value={newRow.devise || 'FCFA'}
                    onChange={e => handleNewChange('devise', e.target.value)}
                    style={{ ...inpCell, textAlign: 'center' }}
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="XOF">XOF</option>
                  </select>
                </td>
                <td style={tCell}>
                  <input
                    type="number" min="0"
                    value={newRow.delai_livraison || ''}
                    onChange={e => handleNewChange('delai_livraison', e.target.value)}
                    placeholder="—"
                    style={{ ...inpCell, textAlign: 'center' }}
                  />
                </td>
                <td style={tCell}>
                  <input
                    type="number" min="1"
                    value={newRow.quantite_minimale || 1}
                    onChange={e => handleNewChange('quantite_minimale', e.target.value)}
                    style={{ ...inpCell, textAlign: 'center' }}
                  />
                </td>
                <td style={tCell}>
                  <input
                    type="number" min="0" max="100"
                    value={newRow.remise || 0}
                    onChange={e => handleNewChange('remise', e.target.value)}
                    style={{ ...inpCell, textAlign: 'center' }}
                  />
                </td>
                <td style={{ ...tCell, textAlign: 'center' }} />
              </tr>
            )}

            {/* Existing rows */}
            {produits.length === 0 && !newRow ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: colors.gray400 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>📦</div>
                  <div style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    Aucun produit associé. Cliquez sur "+ Ajouter un produit".
                  </div>
                </td>
              </tr>
            ) : produits.map((row, i) => {
              const isEdit = editIdx === i
              const item = allItems.find(it => String(it.id_Rep) === String(row.produit_id))
              return (
                <tr
                  key={row._tempId || i}
                  style={{ background: isEdit ? `${colors.orange}08` : i % 2 === 0 ? colors.white : colors.gray50 }}
                  onClick={() => { if (!isEdit) setEditIdx(i) }}
                >
                  <td style={{ ...tCell, textAlign: 'center', fontWeight: 600, color: colors.gray500 }}>{i + 1}</td>
                  <td style={tCell}>
                    {isEdit ? (
                      <select
                        value={row.produit_id || ''}
                        onChange={e => handleEditChange(i, 'produit_id', e.target.value)}
                        style={{ ...inpCell, width: '100%' }}
                      >
                        <option value="">Sélectionner...</option>
                        {getAvailableProducts(i).map(item => (
                          <option key={item.id_Rep} value={item.id_Rep}>
                            {item.description || `Produit #${item.id_Rep}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontWeight: 600, color: colors.bleu }}>
                        {item?.description || `Produit #${row.produit_id}`}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'right' }}>
                    {isEdit ? (
                      <input
                        type="number" min="0" step="0.01"
                        value={row.prix || 0}
                        onChange={e => handleEditChange(i, 'prix', e.target.value)}
                        style={{ ...inpCell, textAlign: 'right' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: colors.gray800 }}>
                        {Number(row.prix || 0).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit ? (
                      <select value={row.devise || 'FCFA'} onChange={e => handleEditChange(i, 'devise', e.target.value)} style={{ ...inpCell, textAlign: 'center' }}>
                        <option value="FCFA">FCFA</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="XOF">XOF</option>
                      </select>
                    ) : (
                      <span style={{ color: colors.gray600 }}>{row.devise || 'FCFA'}</span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit ? (
                      <input
                        type="number" min="0"
                        value={row.delai_livraison || ''}
                        onChange={e => handleEditChange(i, 'delai_livraison', e.target.value)}
                        placeholder="—"
                        style={{ ...inpCell, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ color: colors.gray600 }}>{row.delai_livraison !== null ? row.delai_livraison + ' j' : '—'}</span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit ? (
                      <input
                        type="number" min="1"
                        value={row.quantite_minimale || 1}
                        onChange={e => handleEditChange(i, 'quantite_minimale', e.target.value)}
                        style={{ ...inpCell, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ color: colors.gray600 }}>{row.quantite_minimale || 1}</span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit ? (
                      <input
                        type="number" min="0" max="100"
                        value={row.remise || 0}
                        onChange={e => handleEditChange(i, 'remise', e.target.value)}
                        style={{ ...inpCell, textAlign: 'center' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: colors.success }}>
                        {row.remise ? row.remise + '%' : '—'}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tCell, textAlign: 'center' }}>
                    {isEdit ? (
                      <button onClick={() => setEditIdx(null)} title="Terminer" style={{
                        border: `1px solid ${colors.success}30`, borderRadius: radius.sm,
                        background: colors.successBg, color: colors.success,
                        padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                      }}>✓</button>
                    ) : (
                      <button onClick={() => setEditIdx(i)} title="Modifier" style={{
                        border: `1px solid ${colors.bleu}30`, borderRadius: radius.sm,
                        background: 'transparent', color: colors.bleu,
                        padding: '4px 8px', cursor: 'pointer', fontSize: '11px',
                      }}>✏</button>
                    )}
                    <button onClick={() => handleRemove(i)} title="Supprimer" style={{
                      border: `1px solid ${colors.danger}30`, borderRadius: radius.sm,
                      background: 'transparent', color: colors.danger,
                      padding: '4px 8px', cursor: 'pointer', fontSize: '11px', marginLeft: 4,
                    }}>✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL FOURNISSEUR AVEC ONGLETS
// ════════════════════════════════════════════════════════════════════════════
function FournisseurModal({ isEdit, formData, onChange, onSave, saving, onClose, allProduits }) {
  const [activeSection, setActiveSection] = useState('info')

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
        width: '100%', maxWidth: 960,
        maxHeight: '90vh',
        boxShadow: '0 24px 80px rgba(0,47,89,0.28)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
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
            }}>🏭</div>
            <div>
              <h2 style={{ margin: 0, color: colors.white, fontSize: 18, fontWeight: 800 }}>
                {isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                {isEdit ? 'Mise à jour des informations' : 'Renseignez les informations du fournisseur'}
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

        {/* ── Layout : sidebar + contenu ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Barre d'onglets latérale */}
          <div style={{
            width: 180, flexShrink: 0,
            borderRight: `1px solid ${colors.gray200}`,
            background: colors.gray50,
            padding: '12px 8px',
            display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            {FOURNISSEUR_SECTIONS.map(s => {
              const active = activeSection === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', border: 'none',
                    borderRadius: radius.sm, cursor: 'pointer',
                    fontWeight: active ? 700 : 500, fontSize: 12,
                    textAlign: 'left', width: '100%',
                    background: active ? colors.bleu : 'transparent',
                    color: active ? colors.white : colors.gray600,
                    transition: 'all 0.15s',
                    borderLeft: active ? `3px solid ${colors.orange}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.gray200 }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Zone de formulaire */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Section : Informations du fournisseur */}
            {activeSection === 'info' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.bleu }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Informations du fournisseur
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
                  <Field label="Code fournisseur" required>
                    <FInput name="code" value={formData.code} onChange={onChange} placeholder="Ex: FRN-001" required />
                  </Field>
                  <Field label="Nom fournisseur" required>
                    <FInput name="nom" value={formData.nom} onChange={onChange} placeholder="Nom complet *" required />
                  </Field>
                </div>
              </div>
            )}

            {/* Section : Coordonnées */}
            {activeSection === 'coordonnees' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.info }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Coordonnées
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
                  <Field label="Pays">
                    <FInput name="pays" value={formData.pays} onChange={onChange} placeholder="Sénégal" />
                  </Field>
                  <Field label="Ville">
                    <FInput name="ville" value={formData.ville} onChange={onChange} placeholder="Dakar" />
                  </Field>
                  <Field label="Adresse">
                    <FInput name="adresse" value={formData.adresse} onChange={onChange} placeholder="Rue, quartier, BP..." />
                  </Field>
                  <Field label="Code postal">
                    <FInput name="code_postal" value={formData.code_postal} onChange={onChange} placeholder="XXXXX" />
                  </Field>
                  <Field label="Téléphone">
                    <FInput name="telephone" value={formData.telephone} onChange={onChange} placeholder="+221 7X XXX XX XX" />
                  </Field>
                  <Field label="Email">
                    <FInput name="email" type="email" value={formData.email} onChange={onChange} placeholder="contact@fournisseur.sn" />
                  </Field>
                  <Field label="Site web" style={{ gridColumn: '1 / -1' }}>
                    <FInput name="site_web" value={formData.site_web} onChange={onChange} placeholder="https://..." />
                  </Field>
                </div>
              </div>
            )}

            {/* Section : Contact */}
            {activeSection === 'contact' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.warning }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Contact
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
                  <Field label="Nom du responsable">
                    <FInput name="nom_responsable" value={formData.nom_responsable} onChange={onChange} placeholder="Nom du contact" />
                  </Field>
                  <Field label="Téléphone du responsable">
                    <FInput name="tel_responsable" value={formData.tel_responsable} onChange={onChange} placeholder="+221 7X XXX XX XX" />
                  </Field>
                </div>
              </div>
            )}

            {/* Section : Informations bancaires */}
            {activeSection === 'bancaire' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.success }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Informations bancaires
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
                  <Field label="Banque">
                    <FInput name="banque" value={formData.banque} onChange={onChange} placeholder="CBAO, SGBS, BOA..." />
                  </Field>
                  <Field label="Monnaie">
                    <FSelect name="monnaie" value={formData.monnaie} onChange={onChange}>
                      <option value="FCFA">FCFA</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="XOF">XOF</option>
                    </FSelect>
                  </Field>
                  <Field label="Numéro de compte">
                    <FInput name="numero_compte" value={formData.numero_compte} onChange={onChange} placeholder="IBAN / Compte" />
                  </Field>
                  <Field label="SWIFT">
                    <FInput name="swift" value={formData.swift} onChange={onChange} placeholder="Code SWIFT" />
                  </Field>
                  <Field label="IBAN" style={{ gridColumn: '1 / -1' }}>
                    <FInput name="iban" value={formData.iban} onChange={onChange} placeholder="IBAN complet" />
                  </Field>
                </div>
                <div style={{ marginTop: spacing.md }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="actif"
                      checked={formData.actif}
                      onChange={onChange}
                      style={{ accentColor: colors.success, width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: formData.actif ? colors.success : colors.gray500 }}>
                      {formData.actif ? '✓ Actif' : 'Inactif'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Section : Produits du fournisseur */}
            {activeSection === 'produits' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.orange }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Produits du fournisseur
                  </span>
                </div>
                <FournisseurProduitsTable
                  produits={formData.produits}
                  setProduits={(produits) => onChange({ target: { name: 'produits', value: produits } })}
                  allItems={allProduits || []}
                />
              </div>
            )}

            {/* Section : Remarques */}
            {activeSection === 'remarques' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors.gray600 }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: colors.gray800 }}>
                    Remarques
                  </span>
                </div>
                <textarea
                  name="remarques"
                  value={formData.remarques || ''}
                  onChange={onChange}
                  placeholder="Observations, conditions particulières, notes..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
                    padding: '12px 14px', fontSize: 13, color: colors.gray800,
                    background: colors.white, outline: 'none', resize: 'vertical',
                    minHeight: 180,
                  }}
                />
              </div>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.gray50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '11px', color: colors.gray500 }}>
            {isEdit ? '✏️ Mode modification' : '➕ Mode création'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 22px', border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.md, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: colors.white, color: colors.gray700,
            }}>Annuler</button>
            <button onClick={onSave} disabled={saving} style={{
              padding: '10px 28px', border: 'none', borderRadius: radius.md,
              cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: 13,
              background: saving ? colors.gray400 : colors.orange,
              color: colors.white, boxShadow: saving ? 'none' : '0 4px 12px rgba(255,118,49,0.35)',
            }}>
              {saving ? '⏳ Enregistrement…' : (isEdit ? '💾 Mettre à jour' : '✅ Enregistrer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB COMMANDES
// ════════════════════════════════════════════════════════════════════════════
function CommandesTab({ commandes, loading, fournisseurs, onEdit, onDelete }) {
  const STATUT_COLORS = {
    en_attente: { bg: colors.warningBg, color: colors.warning },
    confirmee: { bg: colors.infoBg, color: colors.info },
    livree: { bg: colors.successBg, color: colors.success },
    annulee: { bg: colors.dangerBg, color: colors.danger },
  }

  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>📋 Commandes</span>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement...
        </div>
      ) : commandes.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucune commande</div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'N° Commande', 'Date', 'Fournisseur', 'Statut', 'Montant', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', borderBottom: `2px solid ${colors.gray200}`, background: colors.gray50 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commandes.map((c, i) => {
              const sc = STATUT_COLORS[c.statut] || STATUT_COLORS.en_attente
              return (
                <tr key={c.id_Rep} style={{ borderBottom: `1px solid ${colors.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.bleu, fontSize: 13 }}>{c.numero_commande}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{c.date_commande}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{c.fournisseur?.nom || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{c.statut}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.gray700 }}>{Number(c.montant_total || 0).toLocaleString('fr-FR')} F</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn color={colors.info} bg={colors.infoBg} title="Modifier" onClick={() => onEdit(c)}><IconEdit /></ActionBtn>
                      <ActionBtn color={colors.danger} bg={colors.dangerBg} title="Supprimer" onClick={() => onDelete(c.id_Rep)}><IconTrash /></ActionBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB APPROVISIONNEMENTS
// ════════════════════════════════════════════════════════════════════════════
function ApprovisionnementsTab({ approvisionnements, loading, fournisseurs }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>🚚 Approvisionnements</span>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement...
        </div>
      ) : approvisionnements.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚚</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucun approvisionnement</div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Date', 'Fournisseur', 'Type', 'Montant'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', borderBottom: `2px solid ${colors.gray200}`, background: colors.gray50 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approvisionnements.map((a, i) => (
              <tr key={a.id_Rep} style={{ borderBottom: `1px solid ${colors.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{a.date_approvisionnement}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{a.fournisseur?.nom || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.bleu }}>{a.type}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.gray700 }}>{Number(a.montant_total || 0).toLocaleString('fr-FR')} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB MOUVEMENTS (Ajustement/Sortie/Réception)
// ════════════════════════════════════════════════════════════════════════════
function MouvementsTab({ mouvements, loading, produits, typeFilter, onDelete }) {
  const filteredMouvements = typeFilter ? mouvements.filter(m => m.type_mouvement === typeFilter) : mouvements
  const TYPE_ICONS = { entree: '📥', sortie: '📤', ajustement: '⚖️', transfert: '🔄' }
  const TYPE_COLORS = { entree: colors.success, sortie: colors.danger, ajustement: colors.warning, transfert: colors.info }

  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>{TYPE_ICONS[typeFilter] || '📋'} Mouvements de stock</span>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement...
        </div>
      ) : filteredMouvements.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{TYPE_ICONS[typeFilter]}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucun mouvement</div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Date', 'Produit', 'Type', 'Quantité', 'Stock Avant', 'Stock Après', 'Motif'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', borderBottom: `2px solid ${colors.gray200}`, background: colors.gray50 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMouvements.map((m, i) => {
              const tc = TYPE_COLORS[m.type_mouvement] || colors.gray600
              return (
                <tr key={m.id_Rep} style={{ borderBottom: `1px solid ${colors.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray600 }}>{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.bleu }}>{m.item?.item_id || m.item_id}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 700, background: `${tc}15`, color: tc }}>{m.type_mouvement}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: tc }}>{m.quantite}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray600 }}>{m.stock_avant}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.gray800 }}>{m.stock_apres}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray500 }}>{m.motif || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB INVENTAIRES
// ════════════════════════════════════════════════════════════════════════════
function InventairesTab({ inventaires, loading, onCloturer, onDelete }) {
  const STATUT_COLORS = { en_cours: { bg: colors.warningBg, color: colors.warning }, termine: { bg: colors.successBg, color: colors.success } }

  return (
    <div style={{
      background: colors.white, borderRadius: radius.md,
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>📊 Inventaires</span>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement...
        </div>
      ) : inventaires.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>Aucun inventaire</div>
          <p style={{ fontSize: 12, margin: 0 }}>Cliquez sur "+ Nouvel inventaire" pour commencer.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'N° Inventaire', 'Date début', 'Date fin', 'Statut', 'Écart', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', borderBottom: `2px solid ${colors.gray200}`, background: colors.gray50 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventaires.map((inv, i) => {
              const sc = STATUT_COLORS[inv.statut] || STATUT_COLORS.en_cours
              const ecartColor = inv.ecart_total > 0 ? colors.danger : inv.ecart_total < 0 ? colors.warning : colors.success
              return (
                <tr key={inv.id_Rep} style={{ borderBottom: `1px solid ${colors.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.gray400 }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.bleu, fontSize: 13 }}>{inv.numero_inventaire}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray700 }}>{inv.date_inventaire}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.gray600 }}>{inv.date_fin || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{inv.statut}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: ecartColor }}>{inv.ecart_total || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inv.statut === 'en_cours' && (
                        <button onClick={() => onCloturer(inv.id_Rep)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: colors.successBg, color: colors.success, border: 'none', borderRadius: radius.sm, cursor: 'pointer' }}>Clôturer</button>
                      )}
                      <ActionBtn color={colors.danger} bg={colors.dangerBg} title="Supprimer" onClick={() => onDelete(inv.id_Rep)}><IconTrash /></ActionBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL COMMANDE
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// MODAL COMMANDE (ENTÊTE + DÉTAILS)
// ════════════════════════════════════════════════════════════════════════════
function CommandeModal({ isEdit, formData, onChange, onSave, saving, onClose, fournisseurs, produits }) {
  const calculateTotals = () => {
    if (!formData.produits || !Array.isArray(formData.produits)) {
      return { ht: 0, tva: 0, ttc: 0 }
    }
    let ht = 0
    let tva = 0
    formData.produits.forEach(p => {
      const qty = Number(p.quantite) || 0
      const prix = Number(p.prix_achat) || 0
      const txTva = Number(p.tva) || 0
      const ligneHT = qty * prix
      const ligneTTC = ligneHT * (1 + txTva / 100)
      ht += ligneHT
      tva += ligneTTC - ligneHT
    })
    return { ht, tva, ttc: ht + tva }
  }

  const totals = calculateTotals()

  const handleProduitChange = (index, field, value) => {
    let numVal = value
    if (field === 'quantite' || field === 'prix_achat' || field === 'tva') {
      numVal = value === '' ? 0 : Number(value)
    }
    const newProduits = [...formData.produits]
    newProduits[index] = { ...newProduits[index], [field]: numVal }
    onChange({ target: { name: 'produits', value: newProduits } })
  }

  const handleAddProduit = () => {
    const newProduits = [...formData.produits, { 
      produit_id: '', 
      quantite: 1, 
      prix_achat: 0, 
      tva: 0 
    }]
    onChange({ target: { name: 'produits', value: newProduits } })
  }

  const handleRemoveProduit = (index) => {
    const newProduits = formData.produits.filter((_, i) => i !== index)
    onChange({ target: { name: 'produits', value: newProduits } })
  }

  // Auto-generate command number for new command
  useEffect(() => {
    if (!isEdit && !formData.numero_commande) {
      const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
      const random = Math.floor(1000 + Math.random()*9000)
      onChange({ target: { name: 'numero_commande', value: `CMD-${today}-${random}` } })
    }
  }, [isEdit])

  const statuts = [
    { value: 'en_attente', label: 'En attente', color: colors.warning },
    { value: 'confirmee', label: 'Confirmée', color: colors.info },
    { value: 'livree', label: 'Livrée', color: colors.success },
    { value: 'annulee', label: 'Annulée', color: colors.danger },
  ]

  const fmt = (n) => n ? Number(n).toLocaleString('fr-FR') + ' F' : '—'

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,31,60,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, width: '100%', maxWidth: 1100, maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,47,89,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
            <div>
              <h2 style={{ margin: 0, color: colors.white, fontSize: 18, fontWeight: 800 }}>
                {isEdit ? 'Modifier la commande' : 'Nouvelle commande'}
              </h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                {isEdit ? 'Mise à jour de la commande' : 'Créer une nouvelle commande fournisseur'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: colors.white, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 20 }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Entête commande */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.gray200}`, background: colors.white }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
               <Field label="N° Commande">
                <FInput value={formData.numero_commande || ''} readOnly 
                        style={{ background: colors.gray100, cursor: 'not-allowed' }} />
              </Field>
              <Field label="Date commande" required>
                <FInput type="date" name="date_commande" value={formData.date_commande} onChange={onChange} required />
              </Field>
              <Field label="Statut">
                <select name="statut" value={formData.statut || 'en_attente'} onChange={onChange}
                        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 12px', fontSize: 13, color: colors.gray800, background: colors.white, cursor: 'pointer' }}>
                  {statuts.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Type de commande">
                <FInput name="type_commande" value={formData.type_commande || ''} onChange={onChange} placeholder="Ex: Normale, Urgente..." />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Fournisseur" required>
                <select name="fournisseur_id" value={formData.fournisseur_id || ''} onChange={onChange} required style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 12px', fontSize: 13, color: colors.gray800, background: colors.white, cursor: 'pointer' }}>
                  <option value="">Sélectionner un fournisseur...</option>
                  {fournisseurs.map(f => <option key={f.id_Rep} value={f.id_Rep}>{f.code} - {f.nom}</option>)}
                </select>
              </Field>
              <Field label="Lieu de réception">
                <FInput name="lieu_reception" value={formData.lieu_reception || ''} onChange={onChange} placeholder="Ex: Pharmacie centrale" />
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Date de livraison prévue">
                <FInput type="date" name="date_livration_prevue" value={formData.date_livration_prevue} onChange={onChange} />
              </Field>
            </div>
          </div>

          {/* Détails commande */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: colors.gray50 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>
                📦 Produits commandés
              </div>
              <button onClick={handleAddProduit} style={{
                padding: '6px 14px', border: `1px solid ${colors.bleu}40`, borderRadius: radius.sm,
                background: colors.white, color: colors.bleu, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
                + Ajouter un produit
              </button>
            </div>

            <div style={{ background: colors.white, borderRadius: radius.md, border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase' }}>N°</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', minWidth: 250 }}>Produit</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 100 }}>Qté</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 120 }}>Prix Achat</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 80 }}>TVA %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 120 }}>Montant HT</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 120 }}>Montant TTC</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.white, background: colors.bleu, textTransform: 'uppercase', width: 60 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.produits && formData.produits.length > 0 ? (
                      formData.produits.map((prod, idx) => {
                        const qty = Number(prod.quantite) || 0
                        const prix = Number(prod.prix_achat) || 0
                        const tva = Number(prod.tva) || 0
                        const montantHT = qty * prix
                        const montantTTC = montantHT * (1 + tva / 100)
                        const produitObj = produits.find(p => p.id_Rep == prod.produit_id)
                        return (
                          <tr key={idx} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                            <td style={{ padding: '10px 12px', fontSize: 13, color: colors.gray500, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <select
                                value={prod.produit_id || ''}
                                onChange={e => handleProduitChange(idx, 'produit_id', e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px 8px', fontSize: 13 }}
                              >
                                <option value="">Sélectionner...</option>
                                {produits.map(p => (
                                  <option key={p.id_Rep} value={p.id_Rep}>{p.item_id} - {p.description}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <input
                                type="number" min="0" step="1"
                                value={prod.quantite}
                                onChange={e => handleProduitChange(idx, 'quantite', e.target.value)}
                                style={{ width: 70, boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px', fontSize: 13, textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <input
                                type="number" min="0" step="0.01"
                                value={prod.prix_achat}
                                onChange={e => handleProduitChange(idx, 'prix_achat', e.target.value)}
                                style={{ width: 100, boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px', fontSize: 13, textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <input
                                type="number" min="0" max="100" step="0.01"
                                value={prod.tva}
                                onChange={e => handleProduitChange(idx, 'tva', e.target.value)}
                                style={{ width: 70, boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px', fontSize: 13, textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: colors.gray800, fontSize: 13 }}>
                              {fmt(montantHT)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: colors.bleu, fontSize: 13 }}>
                              {fmt(montantTTC)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button onClick={() => handleRemoveProduit(idx)} title="Supprimer" style={{
                                border: `1px solid ${colors.danger}40`, borderRadius: radius.sm,
                                background: 'transparent', color: colors.danger,
                                padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              }}>✕</button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: colors.gray400, fontStyle: 'italic' }}>
                          Aucun produit ajouté. Cliquez sur "+ Ajouter un produit".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totaux */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.gray200}`, background: colors.gray50 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ fontSize: 12, color: colors.gray600, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total HT</div>
                <div style={{ fontSize: 11, color: colors.gray600, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total TVA</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: colors.bleu }}>Total TTC</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800 }}>{fmt(totals.ht)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.warning }}>{fmt(totals.tva)}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.bleu }}>{fmt(totals.ttc)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${colors.gray200}`, background: colors.gray50, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: colors.gray500 }}>
            ID: {isEdit ? formData.id_Rep || '—' : 'Nouveau'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 22px', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.md, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: colors.white, color: colors.gray700 }}>Annuler</button>
            <button onClick={onSave} disabled={saving} style={{ padding: '10px 28px', border: 'none', borderRadius: radius.md, cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: 13, background: saving ? colors.gray400 : colors.orange, color: colors.white, boxShadow: saving ? 'none' : '0 4px 12px rgba(255,118,49,0.35)' }}>
              {saving ? '⏳ Enregistrement…' : (isEdit ? '💾 Mettre à jour' : '✅ Enregistrer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL MOUVEMENT DE STOCK
// ════════════════════════════════════════════════════════════════════════════
function MouvementModal({ formData, onChange, onSave, saving, onClose, produits }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,31,60,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,47,89,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
            <div>
              <h2 style={{ margin: 0, color: colors.white, fontSize: 18, fontWeight: 800 }}>Nouveau mouvement</h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Enregistrer un mouvement de stock</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: colors.white, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Produit" required>
            <select name="item_id" value={formData.item_id || ''} onChange={onChange} required style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 12px', fontSize: 13, color: colors.gray800, background: colors.white, cursor: 'pointer' }}>
              <option value="">Sélectionner un produit...</option>
              {produits.map(p => <option key={p.id_Rep} value={p.id_Rep}>{p.item_id} - {p.description}</option>)}
            </select>
          </Field>
          <Field label="Type de mouvement" required>
            <select name="type_mouvement" value={formData.type_mouvement} onChange={onChange} style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 12px', fontSize: 13, color: colors.gray800, background: colors.white, cursor: 'pointer' }}>
              <option value="entree">Entrée (Réception)</option>
              <option value="sortie">Sortie</option>
              <option value="ajustement">Ajustement</option>
              <option value="transfert">Transfert</option>
            </select>
          </Field>
          <Field label="Quantité" required>
            <FInput type="number" name="quantite" value={formData.quantite} onChange={onChange} min="1" required />
          </Field>
          <Field label="Prix unitaire (FCFA)">
            <FInput type="number" name="prix_unitaire" value={formData.prix_unitaire} onChange={onChange} min="0" />
          </Field>
          <Field label="Motif">
            <FInput name="motif" value={formData.motif} onChange={onChange} placeholder="Motif du mouvement" />
          </Field>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${colors.gray200}`, background: colors.gray50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 22px', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.md, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: colors.white, color: colors.gray700 }}>Annuler</button>
            <button onClick={onSave} disabled={saving} style={{ padding: '10px 28px', border: 'none', borderRadius: radius.md, cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: 13, background: saving ? colors.gray400 : colors.orange, color: colors.white }}>
              {saving ? '⏳ Enregistrement…' : '✅ Enregistrer'}
            </button>
          </div>
        </div>
      </div>
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
