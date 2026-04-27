import { useState } from 'react'
import { showToast } from '../../components/ui/Toast'
import { colors, radius } from '../../theme'

export function ReceptionCommandeTab({ fournisseurs, commandes, produits, hops }) {
  const [form, setForm] = useState({
    fournisseur_id: '', commande_id: '', date_reception: new Date().toISOString().split('T')[0],
    lieu_reception: '', type_reception: 'commande', status: 'brouillon', observations: ''
  })
  const [lignes, setLignes] = useState([])
  const [saving, setSaving] = useState(false)

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

  const loadCommandes = (fournisseurId) => {
    // TODO: filter commandes by fournisseur
  }

  const addLigne = () => {
    setLignes(prev => [...prev, {
      id: Date.now(), produit_id: '', numero_lot: '', date_peremption: '',
      quantite: 1, quantite_gratuit: 0, prix_achat: 0, tva: 0, remise: 0
    }])
  }

  const removeLigne = (id) => {
    setLignes(prev => prev.filter(l => l.id !== id))
  }

  const updateLigne = (id, field, value) => {
    setLignes(prev => prev.map(l => l.id === id ? {...l, [field]: value } : l))
  }

  const calcTotals = () => {
    const totalHT = lignes.reduce((sum, l) => sum + (l.quantite * l.prix_achat), 0)
    const totalRemise = lignes.reduce((sum, l) => sum + (l.quantite * l.prix_achat * l.remise / 100), 0)
    const totalTVA = lignes.reduce((sum, l) => sum + ((l.quantite * l.prix_achat) - (l.quantite * l.prix_achat * l.remise / 100)) * l.tva / 100, 0)
    const totalTTC = totalHT - totalRemise + totalTVA
    return { totalHT, totalRemise, totalTVA, totalTTC }
  }

  const { totalHT, totalRemise, totalTVA, totalTTC } = calcTotals()

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: API call to save as draft
      showToast('Brouillon enregistré', 'success')
    } catch {
      showToast('Erreur sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // TODO: API call to submit (poster)
      setForm(prev => ({...prev, status: 'poste' }))
      showToast('Réception transmise - stock mis à jour', 'success')
    } catch {
      showToast('Erreur transmission', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fff3e0', border: '2px solid #ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📥</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>Réception Commande</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#666', fontWeight: 500 }}>Gestion des réceptions de marchandises</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Imprimer</button>
          <button onClick={() => { setForm({ fournisseur_id: '', commande_id: '', date_reception: new Date().toISOString().split('T')[0], lieu_reception: '', type_reception: 'commande', status: 'brouillon', observations: '' }); setLignes([]) }} style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving || form.status === 'poste'} style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: form.status === 'poste' ? '#ccc' : '#ccc', color: '#333', cursor: saving || form.status === 'poste' ? 'default' : 'pointer', fontSize: 12, fontWeight: 700 }}>Poster</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: saving ? '#ccc' : '#ff9800', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 12, fontWeight: 700 }}>{saving ? '...' : 'Sauvegarder'}</button>
          <button onClick={() => {}} style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Fermer</button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, background: '#fff', padding: 20, borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Type */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>Type de réception</label>
          <select value={form.type_reception} onChange={e => setForm(prev => ({...prev, type_reception: e.target.value }))} style={{ width: '100%', padding: 9, border: '1.5px solid #ddd', borderRadius: '8px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="commande">Réception commande</option>
            <option value="specifique">Spécifique</option>
          </select>
        </div>

        {/* Fournisseur */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>Fournisseur</label>
          <select value={form.fournisseur_id} onChange={e => { setForm(prev => ({...prev, fournisseur_id: e.target.value, commande_id: '' })); loadCommandes(e.target.value) }} style={{ width: '100%', padding: 9, border: '1.5px solid #ddd', borderRadius: '8px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="">Sélectionner...</option>
            {fournisseurs.map(f => <option key={f.id_Rep} value={f.id_Rep}>{f.nom}</option>)}
          </select>
        </div>

        {/* N° Commande */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>N° Commande</label>
          <select value={form.commande_id} onChange={e => setForm(prev => ({...prev, commande_id: e.target.value }))} disabled={!form.fournisseur_id} style={{ width: '100%', padding: 9, border: '1.5px solid #ddd', borderRadius: '8px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="">Sélectionner...</option>
            {commandes.filter(c => c.fournisseur_id?.toString() === form.fournisseur_id).map(c => <option key={c.id_Rep} value={c.id_Rep}>{c.numero_commande}</option>)}
          </select>
        </div>

        {/* Date Réception */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>Date Réception</label>
          <input type="date" value={form.date_reception} onChange={e => setForm(prev => ({...prev, date_reception: e.target.value }))} style={{ width: '100%', padding: 9, border: '1.5px solid #ddd', borderRadius: '8px', fontSize: 13 }} />
        </div>

        {/* Lieu Réception */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>Lieu de réception</label>
          <select value={form.lieu_reception} onChange={e => setForm(prev => ({...prev, lieu_reception: e.target.value }))} style={{ width: '100%', padding: 9, border: '1.5px solid #ddd', borderRadius: '8px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="">Sélectionner...</option>
            {hops.map(h => <option key={h.id} value={h.id}>{h.nom}</option>)}
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5, display: 'block' }}>Statut</label>
          <div style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: form.status === 'poste' ? '#d32f2f' : '#1a1a1a' }}>{form.status === 'poste' ? 'Posté' : 'Brouillon'}</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0056b3' }}>📋 Lignes de réception</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addLigne} style={{ padding: '8px 16px', border: '1px solid #0056b340', borderRadius: '6px', background: 'transparent', color: '#0056b3', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Ajouter une ligne</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['N° Sr', 'Nom', 'N° Lot', 'Date Péremption', 'Qté', 'Qté Gratuit', 'Prix Achat', 'TVA %', '% Remise', 'Montant Total', 'Montant Remise', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#666', marginBottom: 6 }}>Aucune ligne</div>
                  <div style={{ fontSize: 12 }}>Cliquez sur "Ajouter une ligne" pour commencer.</div>
                </td>
              </tr>
            ) : (
              lignes.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 16px' }}>{i + 1}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <select value={l.produit_id} onChange={e => updateLigne(l.id, 'produit_id', e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}>
                      <option value="">Sélectionner...</option>
                      {produits.map(p => <option key={p.id_Rep} value={p.id_Rep}>{p.item_id} - {p.description}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px 16px' }}><input value={l.numero_lot || ''} onChange={e => updateLigne(l.id, 'numero_lot', e.target.value)} style={{ width: 80, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} /></td>
                  <td style={{ padding: '10px 16px' }}><input type="date" value={l.date_peremption || ''} onChange={e => updateLigne(l.id, 'date_peremption', e.target.value)} style={{ width: 130, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} /></td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}><input type="number" value={l.quantite} onChange={e => updateLigne(l.id, 'quantite', Number(e.target.value))} style={{ width: 60, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, textAlign: 'center' }} /></td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}><input type="number" value={l.quantite_gratuit} onChange={e => updateLigne(l.id, 'quantite_gratuit', Number(e.target.value))} style={{ width: 60, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, textAlign: 'center' }} /></td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}><input type="number" value={l.prix_achat} onChange={e => updateLigne(l.id, 'prix_achat', Number(e.target.value))} style={{ width: 80, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, textAlign: 'right' }} /></td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}><input type="number" value={l.tva} onChange={e => updateLigne(l.id, 'tva', Number(e.target.value))} style={{ width: 50, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, textAlign: 'center' }} />%</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}><input type="number" value={l.remise} onChange={e => updateLigne(l.id, 'remise', Number(e.target.value))} style={{ width: 50, padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12, textAlign: 'center' }} />%</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{fmt(l.quantite * l.prix_achat)}</td>
                  <td style={{ padding: '10px 16px', color: '#d32f2f' }}>{fmt(l.quantite * l.prix_achat * l.remise / 100)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <button onClick={() => removeLigne(l.id)} style={{ padding: '4px 8px', border: '1px solid #d32f2f40', borderRadius: 4, background: 'transparent', color: '#d32f2f', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '16px 20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Montant Total</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{fmt(totalHT)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Remise</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#d32f2f' }}>{fmt(totalRemise)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Montant TVA</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0056b3' }}>{fmt(totalTVA)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Montant TTC</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#ff9800' }}>{fmt(totalTTC)}</div>
        </div>
      </div>
    </div>
  )
}
