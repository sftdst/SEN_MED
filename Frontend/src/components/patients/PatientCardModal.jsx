import { useEffect, useState, useRef } from 'react'
import { patientApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { QRCodeSVG } from 'qrcode.react'

export default function PatientCardModal({ open, onClose, patient }) {
  const [carte, setCarte] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef(null)

  useEffect(() => {
    if (open && patient) {
      loadCarte()
    }
  }, [open, patient])

  const loadCarte = async () => {
    setLoading(true)
    try {
      const res = await patientApi.genererCarte(patient.id_Rep)
      setCarte(res.data.data)
    } catch (err) {
      showToast('Erreur lors de la génération de la carte.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Carte Patient - ${carte?.nom}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Carte d'Identité Patient"
      width={420}
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button onClick={handlePrint} disabled={loading || !carte}>
            Imprimer la carte
          </Button>
        </div>
      }
    >
      {loading ? (
        <FullPageSpinner />
      ) : !carte ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>
          Erreur de chargement des données.
        </div>
      ) : (
        <div ref={printRef} style={{ padding: spacing.md }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
            borderRadius: radius.lg,
            padding: spacing.lg,
            color: colors.white,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: shadows.lg,
          }}>
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />

            <div style={{ display: 'flex', gap: spacing.md, position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  width: 90,
                  height: 110,
                  borderRadius: radius.md,
                  background: colors.gray200,
                  border: '3px solid white',
                  overflow: 'hidden',
                  marginBottom: spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {carte.photo ? (
                    <img src={carte.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 40, color: colors.gray400 }}>👤</span>
                  )}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Carte N°
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: spacing.xs }}>
                  {carte.carte_numero}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
                  {carte.nom}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {carte.prenom} {carte.nom_famille}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  background: colors.white, 
                  padding: spacing.xs, 
                  borderRadius: radius.sm,
                }}>
                  <QRCodeSVG 
                    value={JSON.stringify({
                      carte_numero: carte.carte_numero,
                      patient_id: carte.patient_id,
                      nom: carte.nom,
                      date_naissance: carte.date_naissance,
                      telephone: carte.telephone,
                      adresse: carte.adresse,
                      ville: carte.ville,
                      assurance: carte.assurance,
                      couverture: carte.couverture,
                      num_police: carte.num_police,
                      validite: carte.validite,
                    })} 
                    size={90}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
