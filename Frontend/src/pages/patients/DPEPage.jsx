import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientApi } from '../../api'
import { colors, radius, spacing, typography } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

export default function DPEPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    setLoading(true)
    try {
      const res = await patientApi.detail(id)
      setPatient(res.data.data)
    } catch (err) {
      showToast('Erreur lors du chargement du patient', 'error')
      navigate('/patients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FullPageSpinner />

  if (!patient) return null

  return (
    <div style={{ padding: spacing.lg, background: colors.gray50, minHeight: '100vh' }}>
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: spacing.xl,
        boxShadow: shadows.md,
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <h1 style={{ ...typography.h1, marginBottom: spacing.lg, color: colors.bleu }}>
          📋 Dossier Patient Électronique
        </h1>

        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{ ...typography.h2, color: colors.bleu, marginBottom: spacing.md }}>
            Informations personnelles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div><strong>Nom:</strong> {patient.patient_name}</div>
            <div><strong>Prénom:</strong> {patient.first_name}</div>
            <div><strong>Date de naissance:</strong> {patient.dob ? new Date(patient.dob).toLocaleDateString('fr-FR') : '—'}</div>
            <div><strong>Âge:</strong> {patient.age_patient} ans</div>
            <div><strong>Sexe:</strong> {patient.gender_id === 'M' ? 'Masculin' : patient.gender_id === 'F' ? 'Féminin' : 'Autre'}</div>
            <div><strong>Téléphone:</strong> {patient.mobile_number || patient.contact_number || '—'}</div>
            <div><strong>Email:</strong> {patient.email_adress || '—'}</div>
            <div><strong>Adresse:</strong> {patient.address || '—'}</div>
          </div>
        </div>

        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{ ...typography.h2, color: colors.bleu, marginBottom: spacing.md }}>
            Contact d'urgence
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div><strong>Nom:</strong> {patient.emergency_contact_name || '—'}</div>
            <div><strong>Téléphone:</strong> {patient.emergency_contact_number || '—'}</div>
          </div>
        </div>

        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{ ...typography.h2, color: colors.bleu, marginBottom: spacing.md }}>
            Assurance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div><strong>Partenaire:</strong> {patient.partenaire?.Nom || '—'}</div>
            <div><strong>Type de couverture:</strong> {patient.type_couverture || '—'}</div>
            <div><strong>Numéro de police:</strong> {patient.num_police || '—'}</div>
            <div><strong>Valide jusqu'au:</strong> {patient.validate ? new Date(patient.validate).toLocaleDateString('fr-FR') : '—'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              background: colors.gray200,
              color: colors.gray700,
              border: 'none',
              borderRadius: radius.sm,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Retour
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              background: colors.bleu,
              color: colors.white,
              border: 'none',
              borderRadius: radius.sm,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>
    </div>
  )
}
