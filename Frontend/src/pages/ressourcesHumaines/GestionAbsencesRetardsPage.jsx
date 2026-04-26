import { useEffect, useState } from 'react'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import { personnelApi } from '../../api'

export default function GestionAbsencesRetardsPage() {
  const [absences, setAbsences] = useState([])
  const [personnels, setPersonnels] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    IDMedecin: '', Type: 'maladie', DateDebut: '', DateFin: '', Description: '', Statut: 'en_attente'
  })

  const loadPersonnels = async () => {
    try {
      const response = await personnelApi.liste({ per_page: 200 })
      const list = Array.isArray(response.data?.data) ? response.data.data : []
      setPersonnels(list)
    } catch (error) {
      console.error('Erreur chargement personnels:', error)
    }
  }

  useEffect(() => {
    loadPersonnels()
  }, [])

  const loadAbsences = async () => {
    setLoading(true)
    try {
      // TODO: implémenter avec ExceptionController API
      const data = [
        { id: 1, IDMedecin: 1, Type: 'maladie', DateDebut: '2026-04-20', DateFin: '2026-04-22', Description: 'Grippe', Statut: 'approuve', personnel: 'M. Diop' },
        { id: 2, IDMedecin: 2, Type: 'autre', DateDebut: '2026-04-21', DateFin: '2026-04-21', Description: 'Retard', Statut: 'en_attente', personnel: 'Mme. Fall' },
      ]
      const filtered = search
        ? data.filter(a =>
            a.personnel.toLowerCase().includes(search.toLowerCase()) ||
            a.Type.toLowerCase().includes(search.toLowerCase()) ||
            a.Description?.toLowerCase().includes(search.toLowerCase())
          )
        : data
      setAbsences(filtered)
    } catch {
      showToast('Erreur chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        showToast('Modifié', 'success')
      } else {
        showToast('Ajouté', 'success')
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ IDMedecin: '', Type: 'maladie', DateDebut: '', DateFin: '', Description: '', Statut: 'en_attente' })
      loadAbsences()
    } catch {
      showToast('Erreur sauvegarde', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return
    try {
      showToast('Supprimé', 'success')
      loadAbsences()
    } catch {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ IDMedecin: '', Type: 'maladie', DateDebut: '', DateFin: '', Description: '', Statut: 'en_attente' })
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({
      IDMedecin: a.IDMedecin?.toString() || '',
      Type: a.Type || 'maladie',
      DateDebut: a.DateDebut || '',
      DateFin: a.DateFin || '',
      Description: a.Description || '',
      Statut: a.Statut || 'en_attente'
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
                  <td style={{ padding: '12px 16px' }}>
                    {a.Type === 'conge' ? 'Congé' : a.Type === 'maladie' ? 'Maladie' : a.Type === 'mission' ? 'Mission' : a.Type === 'formation' ? 'Formation' : 'Autre'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{a.DateDebut}</td>
                  <td style={{ padding: '12px 16px' }}>{a.DateFin}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: a.Statut === 'approuve' ? colors.successBg : a.Statut === 'refuse' ? colors.dangerBg : colors.warningBg,
                      color: a.Statut === 'approuve' ? colors.success : a.Statut === 'refuse' ? colors.danger : colors.warning,
                    }}>
                      {a.Statut}
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
            <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Modifier' : 'Nouvelle absence/retard'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>Personnel
                <select name="IDMedecin" value={form.IDMedecin} onChange={handleChange} required style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }}>
                  <option value="">Sélectionner un membre du personnel</option>
                  {personnels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.staff_name || p.nom || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Personnel #' + p.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>Type
                <select name="Type" value={form.Type} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }}>
                  <option value="conge">Congé</option>
                  <option value="maladie">Maladie</option>
                  <option value="mission">Mission</option>
                  <option value="formation">Formation</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <label>Date début<input name="DateDebut" type="date" value={form.DateDebut} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Date fin<input name="DateFin" type="date" value={form.DateFin} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Description<textarea name="Description" value={form.Description} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }} /></label>
              <label>Statut
                <select name="Statut" value={form.Statut} onChange={handleChange} style={{ width: '100%', padding: 8, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm }}>
                  <option value="en_attente">En attente</option>
                  <option value="approuve">Approuvé</option>
                  <option value="refuse">Refusé</option>
                </select>
              </label>
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
