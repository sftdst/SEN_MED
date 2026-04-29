import { useEffect, useState, useRef } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import Modal from '../../components/ui/Modal'
import { personnelApi, exceptionApi } from '../../api'

export default function GestionCongesPage() {
  const [conges, setConges] = useState([])
  const [personnels, setPersonnels] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    IDMedecin: '', Type: 'conge', DateDebut: '', DateFin: '', Description: ''
  })
  const [certificatModal, setCertificatModal] = useState(null)
  const printRef = useRef(null)

  const loadPersonnels = async () => {
    try {
      const response = await personnelApi.liste({ per_page: 200 })
      const d = response.data
      let list = []
      if (d?.data?.data && Array.isArray(d.data.data)) {
        list = d.data.data
      } else if (d?.data && Array.isArray(d.data)) {
        list = d.data
      } else if (Array.isArray(d)) {
        list = d
      }
 
      console.log('Personnels extraits:', list.length, list)
 
      setPersonnels(list)
    } catch (error) {
      console.error('Erreur chargement personnels:', error)
      showToast('Erreur lors du chargement du personnel', 'error')
    }
  }

  useEffect(() => {
    loadPersonnels()
  }, [])

  const loadConges = async () => {
    setLoading(true)
    try {
      const response = await exceptionApi.liste({ Type: 'conge', per_page: 200 })
      const d = response.data
      let list = []
      if (d?.data?.data && Array.isArray(d.data.data)) {
        list = d.data.data.map(item => ({
          id: item.IDmedecin_exception,
          IDMedecin: item.IDMedecin,
          Type: item.Type,
          DateDebut: item.DateDebut?.split('T')[0] || item.DateDebut,
          DateFin: item.DateFin?.split('T')[0] || item.DateFin,
          Description: item.Description,
          personnel: item.medecin?.staff_name || item.medecin?.nom || `${item.medecin?.first_name || ''} ${item.medecin?.last_name || ''}`.trim() || 'Personnel #' + item.IDMedecin
        }))
      }
      const filtered = search
        ? list.filter(c =>
            !search || c.personnel.toLowerCase().includes(search.toLowerCase()) ||
            (c.Description || '').toLowerCase().includes(search.toLowerCase())
          )
        : list
      setConges(filtered)
    } catch (error) {
      console.error('Erreur chargement congés:', error)
      showToast('Erreur chargement congés', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConges()
  }, [search])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!form.IDMedecin) {
      showToast('Veuillez sélectionner un membre du personnel', 'error')
      return
    }
    if (!form.DateDebut || !form.DateFin) {
      showToast('Veuillez remplir toutes les dates', 'error')
      return
    }
    if (new Date(form.DateFin) < new Date(form.DateDebut)) {
      showToast('La date de fin doit être après la date de début', 'error')
      return
    }

    try {
      const payload = {
        IDMedecin: parseInt(form.IDMedecin),
        DateDebut: form.DateDebut,
        DateFin: form.DateFin,
        Type: form.Type,
        Description: form.Description,
      }
      console.log('Saving congé with payload:', payload)
      if (editingId) {
        await exceptionApi.modifier(editingId, payload)
        showToast('Congé modifié', 'success')
      } else {
        await exceptionApi.creer(payload)
        showToast('Congé ajouté', 'success')
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ IDMedecin: '', Type: 'conge', DateDebut: '', DateFin: '', Description: '' })
      loadConges()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      console.error('Response data:', error.response?.data)
      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        const messages = Object.values(errors).flat().join(', ')
        showToast(`Erreur de validation: ${messages}`, 'error')
      } else {
        showToast('Erreur lors de la sauvegarde', 'error')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce congé ?')) return
    try {
      await exceptionApi.supprimer(id)
      showToast('Congé supprimé', 'success')
      loadConges()
    } catch (error) {
      showToast('Erreur suppression', 'error')
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ IDMedecin: '', Type: 'conge', DateDebut: '', DateFin: '', Description: '' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditingId(c.id)
    setForm({
      IDMedecin: c.IDMedecin?.toString() || '',
      Type: c.Type || 'conge',
      DateDebut: c.DateDebut || '',
      DateFin: c.DateFin || '',
      Description: c.Description || '',
    })
    setShowModal(true)
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificat de Congé - ${certificatModal?.personnel}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 20px; }
            .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; }
            .header { text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0d6efd; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; }
            .content { font-size: 14px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e9ecef; }
            .label { color: #6c757d; font-weight: 600; }
            .value { color: #212529; font-weight: 500; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
            .sign-box { text-align: center; width: 45%; }
            .sign-line { border-top: 1px solid #dee2e6; margin-top: 50px; padding-top: 8px; font-size: 12px; color: #6c757d; }
            .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #adb5bd; font-style: italic; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conges.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '12px 16px' }}>{c.personnel}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.Type === 'conge' ? 'Congé' : c.Type === 'maladie' ? 'Maladie' : c.Type === 'mission' ? 'Mission' : c.Type === 'formation' ? 'Formation' : 'Autre'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{c.DateDebut}</td>
                  <td style={{ padding: '12px 16px' }}>{c.DateFin}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(c)} style={{ marginRight: 8, padding: '6px 10px', border: `1px solid ${colors.bleu}40`, borderRadius: radius.sm, background: 'transparent', color: colors.bleu, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => setCertificatModal(c)} style={{ marginRight: 8, padding: '6px 10px', border: `1px solid ${colors.orange}40`, borderRadius: radius.sm, background: 'transparent', color: colors.orange, cursor: 'pointer' }}>🖨️</button>
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
            <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Modifier' : 'Nouveau congé'}</h3>
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleSave}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Certificat de Congé */}
      <Modal
        open={!!certificatModal}
        onClose={() => setCertificatModal(null)}
        title={`📄 Certificat de Congé - ${certificatModal?.personnel}`}
        width={480}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={() => setCertificatModal(null)}>
              Fermer
            </Button>
            <Button onClick={handlePrint}>
              Imprimer le certificat
            </Button>
          </div>
        }
      >
        <div ref={printRef} style={{ padding: spacing.md }}>
          {certificatModal && (() => {
            const dateDebut = new Date(certificatModal.DateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const dateFin = new Date(certificatModal.DateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const typeLabel = certificatModal.Type === 'conge' ? 'Congé' : certificatModal.Type === 'maladie' ? 'Congé de maladie' : certificatModal.Type === 'formation' ? 'Congé de formation' : certificatModal.Type === 'mission' ? 'Mission' : 'Autorisation d\'absence'
            const motif = certificatModal.Description || typeLabel

            return (
              <div style={{
                background: 'white',
                borderRadius: radius.lg,
                overflow: 'hidden',
                fontFamily: 'Arial, sans-serif',
                boxShadow: shadows.md,
                border: `1px solid ${colors.gray200}`,
              }}>
                {/* Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${colors.bleu} 0%, #1565c0 100%)`,
                  padding: '24px',
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                  }} />
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>CERTIFICAT DE CONGÉ</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>SEN MED - Établissement de Santé</div>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', fontSize: 14 }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bénéficiaire</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: colors.bleu }}>{certificatModal.personnel}</div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nature du congé</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: colors.gray800 }}>{typeLabel}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date de début</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray900 }}>{dateDebut}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date de fin</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray900 }}>{dateFin}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motif / Description</div>
                    <div style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.6, background: colors.gray50, padding: 12, borderRadius: radius.sm, border: `1px solid ${colors.gray200}` }}>
                      {motif}
                    </div>
                  </div>

                  {/* Durée */}
                  <div style={{
                    background: colors.bleu + '08',
                    border: `1px solid ${colors.bleu}22`,
                    borderRadius: radius.sm,
                    padding: '12px 16px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 24 }}>⏱️</span>
                    <div>
                      <div style={{ fontSize: 11, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Durée totale</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.bleu }}>
                        {Math.ceil((new Date(certificatModal.DateFin) - new Date(certificatModal.DateDebut)) / (1000 * 60 * 60 * 24)) + 1} jour(s)
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                    <div className="sign-box">
                      <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 40 }}>Date d'émission</div>
                      <div className="sign-line">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div className="sign-box">
                      <div style={{ fontSize: 12, color: colors.gray500, marginBottom: 40 }}>Signature autorisée</div>
                      <div className="sign-line"></div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  background: colors.gray50,
                  borderTop: `1px solid ${colors.gray200}`,
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: 10,
                  color: colors.gray500,
                  fontStyle: 'italic',
                }}>
                  Carte de congé - SEN MED • Ce document est valide sans signature électronique
                </div>
              </div>
            )
          })()}
        </div>
      </Modal>
    </div>
  )
}
