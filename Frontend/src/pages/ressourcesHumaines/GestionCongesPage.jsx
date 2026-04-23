import { useEffect, useState } from 'react'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'

export default function GestionCongesPage() {
  const [conges, setConges] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    personnel_id: '', type_conge: '', date_debut: '', date_fin: '', motif: '', status: 'en_attente'
  })

  const loadConges = async () => {
    setLoading(true)
    try {
      // TODO: replace with actual API
      const filtered = [
        { id: 1, personnel: 'M. Diop', type_conge: 'Annuel', date_debut: '2026-04-01', date_fin: '2026-04-10', motif: 'Vacances', status: 'approuve' },
        { id: 2, personnel: 'Mme. Fall', type_conge: 'Maternite', date_debut: '2026-05-01', date_fin: '2026-07-01', motif: '', status: 'en_attente' },
      ].filter(c => 
        !search || c.personnel.toLowerCase().includes(search.toLowerCase()) ||
        c.type_conge.toLowerCase().includes(search.toLowerCase())
      )
      setConges(search ? filtered : [
        { id: 1, personnel: 'M. Diop', type_conge: 'Annuel', date_debut: '2026-04-01', date_fin: '2026-04-10', motif: 'Vacances', status: 'approuve' },
        { id: 2, personnel: 'Mme. Fall', type_conge: 'Maternite', date_debut: '2026-05-01', date_fin: '2026-07-01', motif: '', status: 'en_attente' },
      ])
    } catch {
      showToast('Erreur chargement congés', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadConges() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        // TODO: update API
        showToast('Congé modifié', 'success')
      } else {
        // TODO: create API
        showToast('Congé ajouté', 'success')
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ personnel_id: '', type_conge: '', date_debut: '', date_fin: '', motif: '', status: 'en_attente' })
      loadConges()
    } catch {
      showToast('Erreur sauvegarde', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce congé ?')) return
    try {
      // TODO: delete API
      showToast('Congé supprimé', 'success')
      loadConges()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ personnel_id: '', type_conge: '', date_debut: '', date_fin: '', motif: '', status: 'en_attente' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditingId(c.id)
    setForm({
      personnel_id: c.personnel_id?.toString() || '',
      type_conge: c.type_conge || '',
      date_debut: c.date_debut || '',
      date_fin: c.date_fin || '',
      motif: c.motif || '',
      status: c.status || 'en_attente'
    })
    setShowModal(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.gray900 }}>Gestion des congés</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un congé..." />
          <Button variant="primary" onClick={openCreate}>Nouveau congé</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>Chargement...</div>
      ) : (
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: colors.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Personnel</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Début</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Fin</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conges.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '12px 16px' }}>{c.personnel}</td>
                  <td style={{ padding: '12px 16px' }}>{c.type_conge}</td>
                  <td style={{ padding: '12px 16px' }}>{c.date_debut}</td>
                  <td style={{ padding: '12px 16px' }}>{c.date_fin}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: c.status === 'approuve' ? colors.successBg : c.status === 'refuse' ? colors.dangerBg : colors.warningBg,
                      color: c.status === 'approuve' ? colors.success : c.status === 'refuse' ? colors.danger : colors.warning,
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(c)} style={{ marginRight: 8, padding: '6px 10px', border: `1px solid ${colors.bleu}40`, borderRadius: radius.sm, background: 'transparent', color: colors.bleu, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDelete(c.id)} style={{ padding: '6px 10px', border: `1px solid ${colors.danger}40`, borderRadius: radius.sm, background: 'transparent', color: colors.danger, cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, width: 500, boxShadow: shadows.xl }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Modifier' : 'Nouveau'} congé</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>Type de congé<input name="type_conge" value={form.type_conge} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Date début<input name="date_debut" type="date" value={form.date_debut} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Date fin<input name="date_fin" type="date" value={form.date_fin} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Motif<textarea name="motif" value={form.motif} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleSave}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
