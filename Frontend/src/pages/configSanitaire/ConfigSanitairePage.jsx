import { useState } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'

const menuItems = [
  { key: 'examen_clinique', label: 'Examen clinique' },
  { key: 'signe_fonctionnel', label: 'Signe fonctionnel' },
  { key: 'plan_soin', label: 'Plan de soin' },
  { key: 'imagerie', label: 'Imagerie' },
  { key: 'laboratoire', label: 'Laboratoire' },
  { key: 'examen_specialise', label: 'Examen spécialise' },
  { key: 'procedure_infirmiere', label: 'Procedure infirmiere' },
]

const mockData = {
  examenClinique: [
    { id: 1, type: 'Consultation generale', description: 'Examen clinique general', status: 'Actif' },
    { id: 2, type: 'Consultation specialisee', description: 'Examen clinique specialisé', status: 'Actif' },
    { id: 3, type: 'Urgence', description: 'Examen clinique en urgence', status: 'Actif' },
  ],
  signeFonctionnel: [
    { id: 1, nom: 'Douleur', description: 'Evaluation de la douleur', type: 'Symptome' },
    { id: 2, nom: 'Fievre', description: 'Temperature corporelle elevee', type: 'Symptome' },
    { id: 3, nom: 'Toux', description: 'Tousse persistente', type: 'Symptome' },
    { id: 4, nom: 'Fatigue', description: 'Fatigue generale', type: 'Symptome' },
  ],
  planSoin: [
    { id: 1, nom: 'Soins post-operatoire', description: 'Plan de soins post-operatoire', duree: '7 jours' },
    { id: 2, nom: 'Traitement chronic', description: 'Plan de soins pour maladie chronique', duree: '30 jours' },
    { id: 3, nom: 'Soins quotidiens', description: 'Plan de soins quotidien', duree: 'Continue' },
  ],
  imagerie: [
    { id: 1, type: 'Radiographie', description: 'Examen radiographique', disponible: true },
    { id: 2, type: 'Echographie', description: 'Examen echographique', disponible: true },
    { id: 3, type: 'Scanner', description: 'Tomographie scannee', disponible: true },
    { id: 4, type: 'IRM', description: 'Imagerie par resonance magnetique', disponible: false },
  ],
  laboratoire: [
    { id: 1, type: 'Analyse sanguine', description: 'Hematologie et biochimie', tarif: 15000 },
    { id: 2, type: 'Analyse urine', description: 'Examen cytobacteriologique', tarif: 8000 },
    { id: 3, type: 'Analyse selles', description: 'Parasitologie', tarif: 10000 },
    { id: 4, type: 'Analyse speciale', description: 'Serologie et immunologie', tarif: 25000 },
  ],
  examenSpecialise: [
    { id: 1, type: 'Cardiologie', description: 'Examen cardiologique', tarif: 35000 },
    { id: 2, type: 'Neurologie', description: 'Examen neurologique', tarif: 40000 },
    { id: 3, type: 'Dermatologie', description: 'Examen dermatologique', tarif: 20000 },
    { id: 4, type: 'Ophtalmologie', description: 'Examen ophtalmologique', tarif: 25000 },
  ],
  procedureInfirmiere: [
    { id: 1, nom: 'Injection', description: 'Injection intramusculaire/IV/SC', categorie: 'Soin curatif' },
    { id: 2, nom: 'Pansement', description: 'Pansement simple et complexe', categorie: 'Soin curatif' },
    { id: 3, nom: 'Perfusion', description: 'Pose de perfusion', categorie: 'Soin curatif' },
    { id: 4, nom: 'Surveillance', description: 'Surveillance des constantes', categorie: 'Soin preventif' },
  ],
}

export default function ConfigSanitairePage() {
  const [activeTab, setActiveTab] = useState('examen_clinique')

  const renderContent = () => {
    switch (activeTab) {
      case 'examen_clinique':
        return <ExamenCliniqueContent data={mockData.examenClinique} />
      case 'signe_fonctionnel':
        return <SigneFonctionnelContent data={mockData.signeFonctionnel} />
      case 'plan_soin':
        return <PlanSoinContent data={mockData.planSoin} />
      case 'imagerie':
        return <ImagerieContent data={mockData.imagerie} />
      case 'laboratoire':
        return <LaboratoireContent data={mockData.laboratoire} />
      case 'examen_specialise':
        return <ExamenSpecialiseContent data={mockData.examenSpecialise} />
      case 'procedure_infirmiere':
        return <ProcedureInfirmiereContent data={mockData.procedureInfirmiere} />
      default:
        return null
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Configuration Sanitaire</h1>
      </div>
      
      <div style={styles.menuBar}>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              ...styles.menuItem,
              ...(activeTab === item.key ? styles.menuItemActive : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
}

function ExamenCliniqueContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Examen clinique</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.type}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, color: colors.success}}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SigneFonctionnelContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Signe fonctionnel</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.nom}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, color: colors.warning}}>{item.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlanSoinContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Plan de soin</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Duree</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.nom}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, color: colors.success}}>{item.duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImagerieContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Imagerie</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Disponibilite</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.type}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, color: item.disponible ? colors.success : colors.danger, fontWeight: 600}}>
                  {item.disponible ? 'Disponible' : 'Non disponible'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LaboratoireContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Laboratoire</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Tarif (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.type}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.orange}}>{item.tarif.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExamenSpecialiseContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Examen specialisé</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Tarif (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.type}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.orange}}>{item.tarif.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProcedureInfirmiereContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Procedure infirmiere</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Categorie</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{item.nom}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={{...styles.td, color: colors.info}}>{item.categorie}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: spacing.lg,
    background: colors.gray50,
    minHeight: '100vh',
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: colors.bleu,
  },
  menuBar: {
    display: 'flex',
    gap: spacing.xs,
    background: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    boxShadow: shadows.sm,
    marginBottom: spacing.lg,
    overflowX: 'auto',
  },
  menuItem: {
    padding: '12px 20px',
    border: 'none',
    background: colors.gray100,
    color: colors.gray600,
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: radius.sm,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  menuItemActive: {
    background: colors.bleu,
    color: colors.white,
    fontWeight: 700,
  },
  content: {
    background: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    boxShadow: shadows.sm,
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: colors.gray900,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottom: '2px solid ' + colors.bleu,
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 12px',
    background: colors.bleu,
    color: colors.white,
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid ' + colors.gray200,
  },
  td: {
    padding: '14px 12px',
    fontSize: '13px',
    color: colors.gray800,
  },
}