import { useState } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'

const menuItems = [
  { key: 'accueil', label: 'Accueil' },
  { key: 'fournisseur', label: 'Fournisseur' },
  { key: 'produits', label: 'Liste des produits' },
  { key: 'commande', label: 'Commande' },
  { key: 'approvisionnement', label: 'Approvisionnement' },
  { key: 'ajustement', label: 'Ajustement de stock' },
  { key: 'sortie', label: 'Sortie de stock' },
  { key: 'reception', label: 'Reception' },
  { key: 'inventaire', label: 'Inventaire' },
]

const mockData = {
  stats: {
    totalProduits: 245,
    produitsFaibleStock: 12,
    commandesEnAttente: 5,
    valeurStock: 12500000,
  },
  produits: [
    { id: 1, code: 'MED001', nom: 'Paracetamol 500mg', categorie: 'Antalgique', stock: 150, prix: 2500 },
    { id: 2, code: 'MED002', nom: 'Amoxicilline 1g', categorie: 'Antibiotique', stock: 45, prix: 4500 },
    { id: 3, code: 'MED003', nom: 'Ibuprofene 400mg', categorie: 'Anti-inflammatoire', stock: 8, prix: 3500 },
    { id: 4, code: 'MED004', nom: 'Metronidazole 500mg', categorie: 'Antibiotique', stock: 200, prix: 3800 },
    { id: 5, code: 'MED005', nom: 'Aspirine 100mg', categorie: 'Antithrombotique', stock: 5, prix: 2000 },
  ],
  fournisseurs: [
    { id: 1, nom: 'Pharma Senegal', telephone: '+221 33 123 45 67', email: 'contact@pharmasen.sn' },
    { id: 2, nom: 'West Africa Pharma', telephone: '+221 33 987 65 43', email: 'info@wap.sn' },
    { id: 3, nom: 'Senegal Medicaments', telephone: '+221 33 456 78 90', email: 'contact@senmed.sn' },
  ],
}

export default function PharmaciePage() {
  const [activeTab, setActiveTab] = useState('accueil')

  const renderContent = () => {
    switch (activeTab) {
      case 'accueil':
        return <AccueilContent data={mockData} />
      case 'fournisseur':
        return <FournisseurContent data={mockData.fournisseurs} />
      case 'produits':
        return <ProduitsContent data={mockData.produits} />
      case 'commande':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Commande</h3><p style={{color: colors.gray500}}>Gestion des commandes fournisseurs</p></div>
      case 'approvisionnement':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Approvisionnement</h3><p style={{color: colors.gray500}}>Suivi des approvisionnements</p></div>
      case 'ajustement':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Ajustement de stock</h3><p style={{color: colors.gray500}}>Gestion des ajustements</p></div>
      case 'sortie':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Sortie de stock</h3><p style={{color: colors.gray500}}>Sortie de medicaments</p></div>
      case 'reception':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Reception</h3><p style={{color: colors.gray500}}>Reception des livraisons</p></div>
      case 'inventaire':
        return <div style={styles.placeholder}><h3 style={{color: colors.gray700}}>Inventaire</h3><p style={{color: colors.gray500}}>Gestion de l'inventaire</p></div>
      default:
        return null
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion Pharmaceutique</h1>
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

function AccueilContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Tableau de bord - Pharmacie</h2>
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderLeft: '4px solid ' + colors.bleu}}>
          <div style={styles.statLabel}>Total Produits</div>
          <div style={styles.statValue}>{data.stats.totalProduits}</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid ' + colors.danger}}>
          <div style={styles.statLabel}>Faible Stock</div>
          <div style={{...styles.statValue, color: colors.danger}}>{data.stats.produitsFaibleStock}</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid ' + colors.warning}}>
          <div style={styles.statLabel}>Commandes en attente</div>
          <div style={{...styles.statValue, color: colors.warning}}>{data.stats.commandesEnAttente}</div>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid ' + colors.success}}>
          <div style={styles.statLabel}>Valeur Stock</div>
          <div style={styles.statValue}>{data.stats.valeurStock.toLocaleString()} FCA</div>
        </div>
      </div>
    </div>
  )
}

function FournisseurContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Fournisseurs</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Telephone</th>
              <th style={styles.th}>Email</th>
            </tr>
          </thead>
          <tbody>
            {data.map(f => (
              <tr key={f.id} style={styles.tr}>
                <td style={styles.td}>{f.id}</td>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{f.nom}</td>
                <td style={styles.td}>{f.telephone}</td>
                <td style={styles.td}>{f.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProduitsContent({ data }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Liste des produits</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Categorie</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Prix (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => (
              <tr key={p.id} style={styles.tr}>
                <td style={{...styles.td, fontWeight: 600, color: colors.bleu}}>{p.code}</td>
                <td style={styles.td}>{p.nom}</td>
                <td style={styles.td}>{p.categorie}</td>
                <td style={{
                  ...styles.td, 
                  color: p.stock < 10 ? colors.danger : colors.gray900, 
                  fontWeight: 600,
                  background: p.stock < 10 ? colors.dangerBg : 'transparent'
                }}>{p.stock}</td>
                <td style={styles.td}>{p.prix.toLocaleString()}</td>
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
    padding: '12px 24px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: spacing.md,
  },
  statCard: {
    background: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    boxShadow: shadows.sm,
  },
  statLabel: {
    fontSize: '12px',
    color: colors.gray500,
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: colors.gray900,
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
  placeholder: {
    textAlign: 'center',
    padding: spacing.xxl,
    color: colors.gray500,
  },
}