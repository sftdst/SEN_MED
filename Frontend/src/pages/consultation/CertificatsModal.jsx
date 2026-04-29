import { useState, useEffect } from 'react'
import { formulaireApi, certificatGenereApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bleu:    '#1a56db',
  bleuBg:  '#eff6ff',
  border:  '#e2e8f0',
  text:    '#1e293b',
  muted:   '#64748b',
  surface: '#ffffff',
  bg:      '#f8fafc',
  green:   '#16a34a',
  greenBg: '#dcfce7',
  orange:  '#ea580c',
  red:     '#dc2626',
}

// ─── Construction de la map de variables ──────────────────────────────────────
function buildVarMap(patient, data, adtId, medecin, hopital) {
  const fmt = (d) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return d }
  }
  const fmtShort = (d) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR') }
    catch { return d }
  }
  const today = fmt(new Date())

  // Nom patient
  const nomPatient = patient?.patient_name
    || patient?.nom_complet
    || `${patient?.first_name || patient?.prenom || ''} ${patient?.last_name || patient?.nom || ''}`.trim()
    || '—'

  // Nom médecin
  const nomMedecin = medecin?.staff_name
    || `${medecin?.first_name || ''} ${medecin?.last_name || ''}`.trim()
    || patient?.medecin
    || '—'
  const drMedecin = nomMedecin !== '—' ? `Dr. ${nomMedecin}` : '—'

  // Médicaments sous forme de liste
  const medicamentsList = (data?.medicaments || []).map(m => m.medicament).filter(Boolean).join(', ') || '—'

  // Tension artérielle
  const tension = data?.taGaucheS && data?.taGaucheD
    ? `${data.taGaucheS}/${data.taGaucheD} mmHg`
    : '—'

  // Date de visite
  const dateVisite = patient?.date_visite ? fmt(patient.date_visite) : today

  return {
    // ── Patient ───────────────────────────────────────────────
    nom_patient:          nomPatient,
    prenom_patient:       patient?.first_name || patient?.prenom || '—',
    nom_famille:          patient?.last_name  || patient?.nom    || '—',
    date_naissance:       fmtShort(patient?.dob || patient?.date_naissance),
    age:                  String(patient?.age || patient?.age_patient || '—'),
    sexe:                 patient?.sexe === 'M' ? 'Masculin'
                          : patient?.sexe === 'F' ? 'Féminin'
                          : (patient?.sexe || '—'),
    telephone:            patient?.telephone || patient?.mobile_number || patient?.contact_number || '—',
    adresse:              patient?.adresse    || patient?.address || '—',
    numero_patient:       patient?.patient_id || patient?.code_patient || '—',

    // ── Visite ────────────────────────────────────────────────
    date_visite:          dateVisite,
    date_consultation:    today,
    date_du_jour:         today,
    numero_visite:        adtId ? String(adtId) : '—',

    // ── Médecin ───────────────────────────────────────────────
    medecin:              nomMedecin,
    dr_medecin:           drMedecin,
    specialite:           medecin?.specialization || '—',

    // ── Données consultation ──────────────────────────────────
    motif_consultation:   data?.motifConsultation || '—',
    motif:                data?.motifConsultation || '—',
    histoire_maladie:     data?.histoireMaladie   || '—',
    etat_general:         data?.etatGeneral        || '—',
    signes_fonctionnels:  data?.signesFonctionnels || '—',
    signes_physiques:     data?.signesPhysiques     || '—',
    diagnostic:           data?.cim1 || data?.snomed1 || data?.discussion || '—',
    diagnostic_principal: data?.cim1 || data?.snomed1 || '—',
    cim10:                data?.cim1 || '—',
    conduite_a_tenir:     data?.conduiteATenir || '—',
    traitement:           medicamentsList,
    conseils:             data?.conseils        || '—',
    prochaine_visite:     data?.prochaineVisite ? fmtShort(data.prochaineVisite) : '—',
    discussion:           data?.discussion      || '—',

    // ── Signes vitaux ─────────────────────────────────────────
    poids:                data?.poids       ? `${data.poids} kg`  : '—',
    taille:               data?.taille      ? `${data.taille} cm` : '—',
    bmi:                  data?.bmi         || '—',
    temperature:          data?.tempC       ? `${data.tempC} °C`  : '—',
    tension:              tension,
    pouls:                data?.pouls       ? `${data.pouls} bpm` : '—',
    spo2:                 data?.spo2        ? `${data.spo2} %`    : '—',
    respiration:          data?.respiration ? `${data.respiration} c/min` : '—',

    // ── Hôpital ───────────────────────────────────────────────
    nom_hopital:          hopital?.hospital_name || hopital?.short_name || '—',
    adresse_hopital:      hopital?.adress        || '—',
    telephone_hopital:    hopital?.contact_number || hopital?.mobile_number || '—',
    email_hopital:        hopital?.email_address  || '—',
    site_web:             hopital?.website        || '—',
  }
}

// ─── Remplacement des {{variables}} dans le HTML ──────────────────────────────
function applyVariables(html, varMap) {
  if (!html) return ''
  return Object.entries(varMap).reduce((acc, [key, val]) => {
    return acc.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val ?? '—')
  }, html)
}

// ─── Génération du HTML d'impression ─────────────────────────────────────────
function buildPrintHTML(template, renderedContent, patient, medecin, hopital, adtId) {
  const nomPatient = patient?.patient_name
    || patient?.nom_complet
    || `${patient?.first_name || patient?.prenom || ''} ${patient?.last_name || patient?.nom || ''}`.trim()
    || '—'

  const nomMedecin = medecin?.staff_name
    || `${medecin?.first_name || ''} ${medecin?.last_name || ''}`.trim()
    || patient?.medecin || '—'

  const drMedecin = nomMedecin !== '—' ? `Dr. ${nomMedecin}` : '—'
  const specialite = medecin?.specialization || ''

  const hopitalNom  = hopital?.hospital_name || hopital?.short_name || 'Établissement de santé'
  const hopitalAddr = hopital?.adress || ''
  const hopitalTel  = hopital?.contact_number || hopital?.mobile_number || ''
  const hopitalEmail= hopital?.email_address || ''
  const hopitalLogo = hopital?.logo ? `data:image/png;base64,${hopital.logo}` : null

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateVisite = patient?.date_visite
    ? new Date(patient.date_visite).toLocaleDateString('fr-FR')
    : today

  const dob = patient?.dob || patient?.date_naissance
  const dobFmt = dob ? new Date(dob).toLocaleDateString('fr-FR') : '—'
  const age = patient?.age || patient?.age_patient || '—'
  const sexe = patient?.sexe === 'M' ? 'Masculin' : patient?.sexe === 'F' ? 'Féminin' : (patient?.sexe || '—')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${template.description}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #1e293b;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 15mm 20mm 20mm;
      display: flex;
      flex-direction: column;
    }

    /* ── En-tête hôpital ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #1a56db;
      padding-bottom: 12px;
      margin-bottom: 14px;
      gap: 16px;
    }
    .header-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .header-logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      background: #e0e7ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      flex-shrink: 0;
    }
    .header-info {
      flex: 1;
      text-align: center;
    }
    .header-info h1 {
      font-size: 18pt;
      font-weight: 700;
      color: #1a56db;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-info p {
      font-size: 9.5pt;
      color: #475569;
      margin-top: 3px;
      line-height: 1.5;
    }
    .header-date {
      text-align: right;
      font-size: 9.5pt;
      color: #475569;
      flex-shrink: 0;
    }

    /* ── Bandeau patient ── */
    .patient-band {
      background: #f0f4ff;
      border: 1px solid #c7d7fe;
      border-radius: 8px;
      padding: 10px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px 20px;
      margin-bottom: 16px;
      font-size: 10pt;
    }
    .patient-band-title {
      grid-column: 1 / -1;
      font-weight: 700;
      font-size: 10.5pt;
      color: #1a56db;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #c7d7fe;
      padding-bottom: 5px;
      margin-bottom: 4px;
    }
    .patient-band-item label {
      font-weight: 700;
      color: #475569;
      font-size: 9pt;
    }
    .patient-band-item span {
      display: block;
      color: #1e293b;
      font-weight: 600;
    }

    /* ── Titre du certificat ── */
    .cert-title {
      text-align: center;
      font-size: 16pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #1e293b;
      margin: 16px 0;
      text-decoration: underline;
      text-decoration-color: #1a56db;
      text-underline-offset: 5px;
    }

    /* ── Corps du certificat ── */
    .cert-body {
      flex: 1;
      font-size: 12pt;
      line-height: 1.8;
      color: #1e293b;
      margin-bottom: 24px;
    }
    .cert-body p { margin-bottom: 10px; }

    /* ── Signature ── */
    .signature {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .signature-block {
      text-align: center;
      min-width: 200px;
    }
    .signature-block .sig-label {
      font-size: 10pt;
      color: #475569;
      margin-bottom: 40px;
    }
    .signature-block .sig-name {
      font-weight: 700;
      font-size: 11pt;
      border-top: 1px solid #1e293b;
      padding-top: 6px;
    }
    .signature-block .sig-spec {
      font-size: 9.5pt;
      color: #475569;
      font-style: italic;
    }

    /* ── Pied de page ── */
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 10mm 15mm 15mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- En-tête hôpital -->
  <div class="header">
    ${hopitalLogo
      ? `<img class="header-logo" src="${hopitalLogo}" alt="Logo" />`
      : `<div class="header-logo-placeholder">🏥</div>`
    }
    <div class="header-info">
      <h1>${hopitalNom}</h1>
      <p>${[hopitalAddr, hopitalTel ? 'Tél: ' + hopitalTel : '', hopitalEmail].filter(Boolean).join('  •  ')}</p>
    </div>
    <div class="header-date">
      <div style="font-weight:700;">Date</div>
      <div>${today}</div>
      ${adtId ? `<div style="margin-top:6px;font-size:8.5pt;">Visite N° ${adtId}</div>` : ''}
    </div>
  </div>

  <!-- Bandeau patient -->
  <div class="patient-band">
    <div class="patient-band-title">Informations du patient</div>
    <div class="patient-band-item"><label>Nom complet</label><span>${nomPatient}</span></div>
    <div class="patient-band-item"><label>Date de naissance</label><span>${dobFmt}</span></div>
    <div class="patient-band-item"><label>Âge</label><span>${age} ans</span></div>
    <div class="patient-band-item"><label>Sexe</label><span>${sexe}</span></div>
    <div class="patient-band-item"><label>N° Patient</label><span>${patient?.patient_id || patient?.code_patient || '—'}</span></div>
    <div class="patient-band-item"><label>Date de visite</label><span>${dateVisite}</span></div>
  </div>

  <!-- Titre certificat -->
  <div class="cert-title">${template.description}</div>

  <!-- Corps (contenu avec variables remplacées) -->
  <div class="cert-body">${renderedContent}</div>

  <!-- Signature médecin -->
  <div class="signature">
    <div class="signature-block">
      <div class="sig-label">Le médecin traitant</div>
      <div class="sig-name">${drMedecin}</div>
      ${specialite ? `<div class="sig-spec">${specialite}</div>` : ''}
    </div>
  </div>

  <!-- Pied de page -->
  <div class="footer">
    Document généré le ${today} — ${hopitalNom}
  </div>

</div>
</body>
</html>`
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CertificatsModal({ open, onClose, patient, data, adtId, medecin, hopital }) {
  const [view,       setView]       = useState('list')   // 'list' | 'preview'
  const [templates,  setTemplates]  = useState([])
  const [historique, setHistorique] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState(null)     // template choisi
  const [rendered,   setRendered]   = useState('')       // HTML avec variables remplacées
  const [printed,    setPrinted]    = useState(false)    // certificat déjà imprimé (pour save)
  const [saving,     setSaving]     = useState(false)

  // ── Chargement des templates et historique ────────────────────────────────
  useEffect(() => {
    if (!open) { setView('list'); setSelected(null); setPrinted(false); return }
    setLoading(true)
    const calls = [formulaireApi.liste()]
    if (adtId) calls.push(certificatGenereApi.parVisite(adtId))
    Promise.all(calls)
      .then(([tRes, hRes]) => {
        setTemplates(Array.isArray(tRes?.data) ? tRes.data : [])
        setHistorique(Array.isArray(hRes?.data) ? hRes.data : [])
      })
      .catch(() => showToast('Erreur lors du chargement des modèles', 'error'))
      .finally(() => setLoading(false))
  }, [open, adtId])

  if (!open) return null

  // ── Générer le certificat ────────────────────────────────────────────────
  const handleGenerer = (template) => {
    const varMap = buildVarMap(patient, data, adtId, medecin, hopital)
    const html   = applyVariables(template.content || '', varMap)
    setSelected(template)
    setRendered(html)
    setPrinted(false)
    setView('preview')
  }

  // ── Imprimer ─────────────────────────────────────────────────────────────
  const handleImprimer = async () => {
    const html = buildPrintHTML(selected, rendered, patient, medecin, hopital, adtId)
    const win  = window.open('', '_blank', 'width=900,height=700')
    if (!win) { showToast("Impossible d'ouvrir la fenêtre d'impression", 'error'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)

    // Enregistrer la trace (une seule fois par aperçu)
    if (!printed && adtId) {
      setPrinted(true)
      setSaving(true)
      try {
        const cert = await certificatGenereApi.enregistrer({
          adt_id:        adtId,
          template_id:   selected.id,
          template_name: selected.description,
        })
        setHistorique(prev => [cert.data, ...prev])
      } catch {
        // Échec silencieux — l'impression est déjà faite
      } finally {
        setSaving(false)
      }
    }
  }

  // ── Format date historique ────────────────────────────────────────────────
  const fmtDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return d }
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: view === 'preview' ? 820 : 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── En-tête modal ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          background: C.bleuBg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {view === 'preview' && (
              <button
                onClick={() => setView('list')}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: C.bleu, fontSize: 20, padding: '0 4px',
                  display: 'flex', alignItems: 'center',
                }}
                title="Retour à la liste"
              >←</button>
            )}
            <span style={{ fontSize: 18 }}>📋</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
                {view === 'list' ? 'Génération de certificats' : `Aperçu — ${selected?.description}`}
              </div>
              {patient && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  Patient : {patient?.patient_name || patient?.nom_complet || `${patient?.prenom || ''} ${patient?.nom || ''}`.trim() || '—'}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: C.muted, lineHeight: 1 }}
          >×</button>
        </div>

        {/* ── Corps ── */}
        {view === 'list' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Section : Modèles disponibles ── */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>📄</span> Modèles de certificats disponibles
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', color: C.muted, padding: '32px 0' }}>Chargement…</div>
              ) : templates.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: C.muted, padding: '32px 16px',
                  background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun modèle configuré</div>
                  <div style={{ fontSize: 12 }}>Créez des modèles dans la section <strong>Formulaires</strong></div>
                </div>
              ) : (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}` }}>Nom du modèle</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}` }}>En-tête</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}`, width: 120 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t, i) => (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? C.surface : C.bg, transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bleuBg}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.bg}
                        >
                          <td style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ fontWeight: 600, color: C.text }}>{t.description || 'Sans titre'}</div>
                          </td>
                          <td style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>
                            {t.header
                              ? <span style={{ background: C.bleuBg, color: C.bleu, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>Oui</span>
                              : <span style={{ color: C.muted, fontSize: 11 }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                            <button
                              onClick={() => handleGenerer(t)}
                              style={{
                                background: C.bleu, color: '#fff',
                                border: 'none', borderRadius: 7,
                                padding: '7px 16px', fontWeight: 700, fontSize: 12,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              ⚡ Générer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Section : Historique ── */}
            {historique.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>🗂️</span> Certificats déjà générés pour cette visite
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}` }}>Modèle</th>
                        <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}` }}>Généré le</th>
                        <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}`, width: 120 }}>Réimprimer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historique.map((h, i) => {
                        const tpl = templates.find(t => t.id === h.template_id)
                        return (
                          <tr key={h.id} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                            <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.text }}>{h.template_name}</td>
                            <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, color: C.muted }}>{fmtDate(h.generated_at || h.created_at)}</td>
                            <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                              {tpl ? (
                                <button
                                  onClick={() => handleGenerer(tpl)}
                                  style={{
                                    background: C.greenBg, color: C.green,
                                    border: `1px solid #86efac`, borderRadius: 7,
                                    padding: '5px 12px', fontWeight: 700, fontSize: 11,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                                  }}
                                >🖨️ Réimprimer</button>
                              ) : (
                                <span style={{ color: C.muted, fontSize: 11 }}>Modèle supprimé</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ── VUE APERÇU ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Zone d'aperçu scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

              {/* Mini en-tête hôpital */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: '3px solid #1a56db', paddingBottom: 12, marginBottom: 14,
              }}>
                {hopital?.logo
                  ? <img src={`data:image/png;base64,${hopital.logo}`} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6 }} />
                  : <div style={{ width: 60, height: 60, background: C.bleuBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏥</div>
                }
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.bleu, textTransform: 'uppercase' }}>
                    {hopital?.hospital_name || hopital?.short_name || 'Établissement de santé'}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {[hopital?.adress, hopital?.contact_number ? 'Tél: ' + hopital.contact_number : null, hopital?.email_address].filter(Boolean).join('  •  ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: C.muted, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700 }}>Date</div>
                  <div>{new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              {/* Bandeau patient */}
              <div style={{
                background: '#f0f4ff', border: '1px solid #c7d7fe', borderRadius: 8,
                padding: '10px 14px', marginBottom: 14,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px',
              }}>
                <div style={{ gridColumn: '1/-1', fontWeight: 800, fontSize: 11, color: C.bleu, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #c7d7fe', paddingBottom: 5, marginBottom: 4 }}>
                  Informations du patient
                </div>
                {[
                  ['Nom complet', patient?.patient_name || patient?.nom_complet || `${patient?.prenom || ''} ${patient?.nom || ''}`.trim() || '—'],
                  ['Date de naissance', (() => { try { return new Date(patient?.dob || patient?.date_naissance).toLocaleDateString('fr-FR') } catch { return '—' } })()],
                  ['Âge', `${patient?.age || patient?.age_patient || '—'} ans`],
                  ['Sexe', patient?.sexe === 'M' ? 'Masculin' : patient?.sexe === 'F' ? 'Féminin' : (patient?.sexe || '—')],
                  ['N° Patient', patient?.patient_id || patient?.code_patient || '—'],
                  ['Date de visite', patient?.date_visite ? new Date(patient.date_visite).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{lbl}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Titre certificat */}
              <div style={{
                textAlign: 'center', fontWeight: 800, fontSize: 15,
                textTransform: 'uppercase', letterSpacing: '2px', color: C.text,
                margin: '14px 0', textDecoration: 'underline', textDecorationColor: C.bleu,
                textUnderlineOffset: 4,
              }}>
                {selected?.description}
              </div>

              {/* Contenu rendu */}
              <div
                style={{
                  fontFamily: "'Times New Roman', serif", fontSize: 13, lineHeight: 1.9, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px',
                  minHeight: 200, background: C.surface,
                }}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />

              {/* Zone signature */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ textAlign: 'center', minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 32 }}>Le médecin traitant</div>
                  <div style={{ fontWeight: 700, fontSize: 13, borderTop: `1px solid ${C.text}`, paddingTop: 6 }}>
                    {medecin
                      ? `Dr. ${medecin.staff_name || `${medecin.first_name || ''} ${medecin.last_name || ''}`.trim()}`
                      : (patient?.medecin ? `Dr. ${patient.medecin}` : '—')
                    }
                  </div>
                  {medecin?.specialization && (
                    <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{medecin.specialization}</div>
                  )}
                </div>
              </div>

            </div>

            {/* Barre d'actions fixe */}
            <div style={{
              padding: '14px 24px', borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: C.bg, flexShrink: 0,
            }}>
              <button
                onClick={() => setView('list')}
                style={{
                  border: `1px solid ${C.border}`, background: C.surface, color: C.muted,
                  borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}
              >← Retour à la liste</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {printed && !saving && (
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Enregistré dans l'historique
                  </span>
                )}
                <button
                  onClick={handleImprimer}
                  disabled={saving}
                  style={{
                    background: C.bleu, color: '#fff',
                    border: 'none', borderRadius: 8,
                    padding: '9px 24px', fontWeight: 700, fontSize: 13,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
                  }}
                >
                  🖨️ {printed ? 'Réimprimer' : 'Imprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
