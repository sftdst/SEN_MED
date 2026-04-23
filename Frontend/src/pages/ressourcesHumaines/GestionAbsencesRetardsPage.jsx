import { useEffect, useState } from 'react'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'

export default function GestionAbsencesRetardsPage() {
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    personnel_id: '', type: 'absence', date: '', heure_debut: '', heure_fin: '', motif: '', duree: '', status: 'en_attente'
  })

  const loadAbsences = async () => {
    setLoading(true)
    try {
      // TODO: replace with actual API
      const data = [
        { id: 1, personnel: 'M. Diop', type: 'absence', date: '2026-04-20', heure_debut: '08:00', heure_fin: '17:00', motif: 'Maladie', duree: '1 jour', status: 'approuve' },
        { id: 2, personnel: 'Mme. Fall', type: 'retard', date: '2026-04-21', heure_debut: '08:30', heure_fin: '', motif: 'Transport', duree: '30 min', status: 'en_attente' },
      ]
      const filtered = search 
        ? data.filter(a => 
            a.personnel.toLowerCase().includes(search.toLowerCase()) ||
            a.type.toLowerCase().includes(search.toLowerCase()) ||
            a.motif?.toLowerCase().includes(search.toLowerCase())
          )
        : data
      setAbsences(filtered)
    } catch {
      showToast('Erreur chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAbsences() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        // TODO: update API
        showToast('Modifié', 'success')
      } else {
        // TODO: create API
        showToast('Ajouté', 'success')
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ personnel_id: '', type: 'absence', date: '', heure_debut: '', heure_fin: '', motif: '', duree: '', status: 'en_attente' })
      loadAbsences()
    } catch {
      showToast('Erreur sauvegarde', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return
    try {
      // TODO: delete API
      showToast('Supprimé', 'success')
      loadAbsences()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ personnel_id: '', type: 'absence', date: '', heure_debut: '', heure_fin: '', motif: '', duree: '', status: 'en_attente' })
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({
      personnel_id: a.personnel_id?.toString() || '',
      type: a.type || 'absence',
      date: a.date || '',
      heure_debut: a.heure_debut || '',
      heure_fin: a.heure_fin || '',
      motif: a.motif || '',
      duree: a.duree || '',
      status: a.status || 'en_attente'
    })
    setShowModal(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.gray900 }}>Gestion absences & retards</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." />
          <Button variant="primary" onClick={openCreate}>Nouveau</Button>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Début</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Fin</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '12px 16px' }}>{a.personnel}</td>
                  <td style={{ padding: '12px 16px' }}>{a.type}</td>
                  <td style={{ padding: '12px 16px' }}>{a.date}</td>
                  <td style={{ padding: '12px 16px' }}>{a.heure_debut}</td>
                  <td style={{ padding: '12px 16px' }}>{a.heure_fin}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: a.status === 'approuve' ? colors.successBg : a.status === 'refuse' ? colors.dangerBg : colors.warningBg,
                      color: a.status === 'approuve' ? colors.success : a.status === 'refuse' ? colors.danger : colors.warning,
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(a)} style={{ marginRight: 8, padding: '6px 10px', border: `1px solid ${colors.bleu}40`, borderRadius: radius.sm, background: 'transparent', color: colors.bleu, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDelete(a.id)} style={{ padding: '6px 10px', border: `1px solid ${colors.danger}40`, borderRadius: radius.sm, background: 'transparent', color: colors.danger, cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24, width: 500, boxShadow: shadows.xl }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Modifier' : 'Nouveau'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>Type
                <select name="type" value={form.type} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }}>
                  <option value="absence">Absence</option>
                  <option value="retard">Retard</option>
                </select>
              </label>
              <label>Date<input name="date" type="date" value={form.date} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Heure début<input name="heure_debut" type="time" value={form.heure_debut} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Heure fin<input name="heure_fin" type="time" value={form.heure_fin} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Motif<input name="motif" value={form.motif} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Durée<input name="duree" value={form.duree} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} placeholder="ex: 2 jours" /></label>
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
