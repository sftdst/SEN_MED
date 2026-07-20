// Utilitaire d'impression pour les onglets comptabilité
// L'en-tête utilise les données réelles de l'hôpital (hospitalApi)

import { hospitalApi } from '../../api'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtF = (n) => Number(n ?? 0).toLocaleString('fr-FR') + ' F'
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const STORAGE_BASE = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage'

function logoSrc(path) {
  return path ? `${STORAGE_BASE}/${path}` : null
}

// Récupère le premier hôpital actif (silencieux si échec)
async function fetchHospital() {
  try {
    const res = await hospitalApi.liste({ per_page: 1, page: 1 })
    const d = res.data?.data
    const list = Array.isArray(d) ? d : (d?.data ?? [])
    return list[0] ?? null
  } catch {
    return null
  }
}

function openPrint(html) {
  const win = window.open('', '_blank', 'width=1100,height=860,scrollbars=yes,resizable=yes')
  if (!win) { alert("Autorisez les fenêtres popup dans votre navigateur pour activer l'impression."); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 700)
}

// ── Document principal ────────────────────────────────────────────────────────
function buildDoc({ prefs, hospital, title, filtersHtml, statsHtml, tableHtml, rowCount, tableAccent }) {
  const primary = prefs?.primary_color || '#002f59'
  const accent  = prefs?.accent_color  || '#ff7631'
  const hdrBg   = tableAccent || primary

  const now     = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  // ── Bloc logo / identité de l'hôpital ──────────────────────────────────────
  const src = logoSrc(hospital?.logo)
  const logoBlock = src
    ? `<img src="${src}"
          style="max-height:68px;max-width:130px;object-fit:contain;
                 border-radius:8px;background:rgba(255,255,255,.1);padding:4px;flex-shrink:0"
          alt="Logo ${esc(hospital?.hospital_name || '')}" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="52" height="52"
           style="flex-shrink:0;opacity:.92">
         <rect width="32" height="32" rx="7" fill="${accent}"/>
         <rect x="13.5" y="5.5" width="5" height="21" rx="2.5" fill="white"/>
         <rect x="5.5" y="13.5" width="21" height="5" rx="2.5" fill="white"/>
       </svg>`

  // Nom principal : hôpital en priorité, sinon app_name
  const mainName = hospital?.hospital_name || prefs?.app_name || 'SenMed'
  const subName  = hospital?.short_name    || prefs?.app_slogan || ''

  // Lignes d'info de l'hôpital
  const infoLines = []
  if (hospital?.type_cabinet) infoLines.push(
    `<div style="color:rgba(255,255,255,.62);font-size:10px;font-weight:700;
                 text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">
       ${esc(hospital.type_cabinet)}
     </div>`
  )
  const addrParts = [hospital?.adress, hospital?.postal_code, hospital?.zip_code].filter(Boolean)
  if (addrParts.length) infoLines.push(
    `<div style="color:rgba(255,255,255,.78);font-size:11px;line-height:1.5">
       📍 ${esc(addrParts.join(', '))}
     </div>`
  )
  const tel = hospital?.contact_number || hospital?.mobile_number
  if (tel) infoLines.push(
    `<div style="color:rgba(255,255,255,.78);font-size:11px;line-height:1.5">
       📞 ${esc(tel)}${hospital?.fax ? `&nbsp;&nbsp;·&nbsp;&nbsp;Fax : ${esc(hospital.fax)}` : ''}
     </div>`
  )
  if (hospital?.email_address) infoLines.push(
    `<div style="color:rgba(255,255,255,.78);font-size:11px;line-height:1.5">
       ✉&nbsp; ${esc(hospital.email_address)}
     </div>`
  )
  if (hospital?.website) infoLines.push(
    `<div style="color:rgba(255,255,255,.62);font-size:10.5px;line-height:1.5">
       🌐 ${esc(hospital.website)}
     </div>`
  )

  const css = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }
    body { font-family:'Segoe UI',Tahoma,Arial,sans-serif; font-size:11.5px; color:#1e293b; background:#eef2f7 }
    @page { size:A4 landscape; margin:9mm 12mm }
    @media print {
      body { background:#fff !important }
      .np { display:none !important }
      thead { display:table-header-group }
      tfoot { display:table-footer-group }
      tr { page-break-inside:avoid }
      * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important }
    }
    .page { background:#fff; box-shadow:0 2px 40px rgba(0,0,0,.18); max-width:1120px; margin:0 auto }

    /* Barre accent */
    .top-bar { height:5px; background:linear-gradient(90deg,${accent} 0%,${primary} 45%,${accent} 100%) }

    /* En-tête */
    .doc-header { background:linear-gradient(135deg,${primary} 0%,${primary}e8 100%);
      padding:18px 24px; display:flex; align-items:stretch; gap:0; min-height:90px }

    /* Colonne gauche : identité de l'établissement */
    .hdr-hosp { flex:1; display:flex; align-items:flex-start; gap:16px;
      padding-right:22px; border-right:1.5px solid rgba(255,255,255,.2) }
    .hosp-text { display:flex; flex-direction:column; gap:1px }
    .hosp-name { color:#fff; font-size:19px; font-weight:800; letter-spacing:-.4px; line-height:1.15; margin-bottom:2px }
    .hosp-sub  { color:rgba(255,255,255,.6); font-size:11px; font-style:italic; margin-bottom:6px }
    .hosp-info { display:flex; flex-direction:column; gap:1px; margin-top:2px }

    /* Colonne droite : titre rapport + date */
    .hdr-rpt { width:270px; padding-left:22px; display:flex; flex-direction:column;
      justify-content:center; align-items:flex-end; text-align:right }
    .rpt-title { color:#fff; font-size:16px; font-weight:700; margin-bottom:6px; letter-spacing:-.2px }
    .rpt-meta  { color:rgba(255,255,255,.72); font-size:10.5px; line-height:1.8 }
    .rpt-meta b { color:rgba(255,255,255,.95) }
    .rpt-count { margin-top:6px; display:inline-block; padding:3px 10px;
      background:rgba(255,255,255,.18); border-radius:20px;
      color:#fff; font-size:10.5px; font-weight:700 }

    /* Bande filtres */
    .filter-bar { background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:9px 24px;
      display:flex; align-items:center; gap:14px; flex-wrap:wrap }
    .fl { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8 }
    .fv { font-size:11.5px; font-weight:600; color:#334155; background:#e2e8f0; padding:2px 9px; border-radius:4px }

    /* Bande stats */
    .stats-strip { display:flex; border-bottom:2px solid #e2e8f0 }
    .sc { flex:1; padding:12px 20px; border-right:1px solid #e2e8f0 }
    .sc:last-child { border-right:none }
    .sl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; margin-bottom:3px }
    .sv { font-size:15px; font-weight:800; line-height:1.2 }

    /* En-tête tableau */
    .tbl-hdr { padding:9px 24px; background:linear-gradient(90deg,${hdrBg}14 0%,transparent 100%);
      border-bottom:1px solid #e2e8f0; display:flex; align-items:center; gap:9px }
    .tht { font-size:13px; font-weight:700; color:#1e293b }
    .thc { font-size:11px; font-weight:700; color:#64748b; background:#f1f5f9; padding:2px 9px; border-radius:20px }

    /* Tableau */
    table { width:100%; border-collapse:collapse }
    thead th { background:${hdrBg}; color:#fff; padding:8px 12px;
      font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap }
    thead th.r { text-align:right }
    thead th.c { text-align:center }
    tbody tr { border-bottom:1px solid #f1f5f9 }
    tbody tr:nth-child(even) { background:#f8fafc }
    tbody td { padding:7px 12px; vertical-align:middle }
    tbody td.r { text-align:right }
    tbody td.c { text-align:center }
    tfoot td { padding:10px 12px; font-weight:800; font-size:12px;
      background:${accent}18; border-top:2px solid ${accent}66 }
    tfoot td.r { text-align:right }

    /* Éléments */
    .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:9.5px; font-weight:700; white-space:nowrap }
    .bw { background:#fef3c7; color:#92400e }
    .bp { background:#f3e5f5; color:#6b21a8 }
    .bk { background:#dcfce7; color:#166534 }
    .bb { background:#dbeafe; color:#1e40af }
    .mono { font-family:monospace; font-size:11px; font-weight:600; color:${primary};
      background:${primary}18; padding:1px 6px; border-radius:3px }
    .avatar-cell .name { font-weight:600; color:#1e293b }
    .avatar-cell .meta { font-size:10px; color:#94a3b8; margin-top:1px }
    .amt-warn    { font-weight:700; color:#f57c00 }
    .amt-danger  { font-weight:700; color:#c62828 }
    .amt-success { font-weight:700; color:#2e7d32 }
    .amt-neutral { font-weight:700; color:#334155 }

    /* Pied de document */
    .doc-footer { padding:10px 24px; display:flex; align-items:center; justify-content:space-between;
      border-top:1.5px solid #e2e8f0; background:#f8fafc }
    .df-l { font-size:10px; color:#64748b; display:flex; align-items:center; gap:6px }
    .df-r { font-size:10px; color:#94a3b8 }

    /* Bouton imprimer */
    .pbtn { position:fixed; bottom:22px; right:22px; padding:11px 26px;
      background:${accent}; color:#fff; border:none; border-radius:10px;
      font-size:14px; font-weight:700; cursor:pointer;
      box-shadow:0 6px 20px ${accent}88; transition:opacity .15s; z-index:99 }
    .pbtn:hover { opacity:.88 }
  `

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${esc(title)} — ${esc(mainName)}</title>
<style>${css}</style>
</head>
<body>
<div class="page">

  <div class="top-bar"></div>

  <!-- ── En-tête ── -->
  <div class="doc-header">

    <!-- Identité de l'établissement -->
    <div class="hdr-hosp">
      ${logoBlock}
      <div class="hosp-text">
        <div class="hosp-name">${esc(mainName)}</div>
        ${subName ? `<div class="hosp-sub">${esc(subName)}</div>` : ''}
        <div class="hosp-info">
          ${infoLines.join('')}
        </div>
      </div>
    </div>

    <!-- Titre du rapport -->
    <div class="hdr-rpt">
      <div class="rpt-title">${esc(title)}</div>
      <div class="rpt-meta">
        Généré le <b>${dateStr}</b><br>
        à <b>${timeStr}</b>
      </div>
      ${rowCount != null
        ? `<div class="rpt-count">${rowCount} enregistrement${rowCount !== 1 ? 's' : ''}</div>`
        : ''}
    </div>

  </div>

  ${filtersHtml}
  ${statsHtml}
  ${tableHtml}

  <!-- Pied de page -->
  <div class="doc-footer">
    <div class="df-l">🔒 Document confidentiel — Usage interne exclusivement — ${esc(mainName)}</div>
    <div class="df-r">Imprimé le ${dateStr} à ${timeStr}</div>
  </div>

</div>
<button class="pbtn np" onclick="window.print()">🖨️&nbsp; Imprimer</button>
</body>
</html>`
}

// ═════════════════════════════════════════════════════════════════════════════
// FACTURES EN ATTENTE
// ═════════════════════════════════════════════════════════════════════════════
export async function printFactures(rows, totaux, prefs, filters = {}) {
  const hospital = await fetchHospital()
  const { dateDebut, dateFin, partenaireNom, search } = filters
  const primary = prefs?.primary_color || '#002f59'

  const filtersHtml = `<div class="filter-bar">
    <span class="fl">Période :</span>
    <span class="fv">${esc(fmtD(dateDebut))} → ${esc(fmtD(dateFin))}</span>
    ${partenaireNom ? `<span class="fl">Partenaire :</span><span class="fv">${esc(partenaireNom)}</span>` : ''}
    ${search        ? `<span class="fl">Recherche :</span><span class="fv">${esc(search)}</span>` : ''}
    ${!partenaireNom && !search ? '<span style="font-size:11px;color:#94a3b8">Aucun filtre avancé actif</span>' : ''}
  </div>`

  const statsHtml = totaux ? `<div class="stats-strip">
    <div class="sc"><div class="sl">Factures en attente</div><div class="sv" style="color:${primary}">${Number(totaux.nb_factures ?? 0).toLocaleString('fr-FR')}</div></div>
    <div class="sc"><div class="sl">Montant total dû</div><div class="sv amt-warn">${fmtF(totaux.total_brut)}</div></div>
    <div class="sc"><div class="sl">Part patient</div><div class="sv amt-danger">${fmtF(totaux.total_patient)}</div></div>
    <div class="sc"><div class="sl">Part partenaire</div><div class="sv amt-success">${fmtF(totaux.total_partenaire)}</div></div>
  </div>` : ''

  const tbody = rows.map((r, i) => `
    <tr>
      <td class="c" style="color:#64748b;font-weight:600">${i + 1}</td>
      <td class="avatar-cell">
        <div class="name">${esc(r.patient_name || '—')}</div>
        ${r.ssn_no ? `<div class="meta">SS : ${esc(r.ssn_no)}</div>` : ''}
      </td>
      <td>${r.partenaire_nom ? `<span class="badge bb">${esc(r.partenaire_nom)}</span>` : '<span style="color:#cbd5e1">—</span>'}</td>
      <td><span class="mono">${esc(r.bill_no || '—')}</span></td>
      <td class="c" style="color:#475569">${fmtD(r.bill_date)}</td>
      <td class="r amt-warn">${fmtF(r.montant_total)}</td>
      <td class="r amt-danger">${fmtF(r.montant_patient)}</td>
      <td class="r amt-success">${Number(r.montant_partenaire || 0) > 0 ? fmtF(r.montant_partenaire) : '<span style="color:#cbd5e1">—</span>'}</td>
    </tr>`).join('')

  const tableHtml = `
    <div class="tbl-hdr">
      <span class="tht">📋 Factures en attente de paiement</span>
      <span class="thc">${rows.length} facture${rows.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="c" style="width:40px">#</th>
          <th>Patient</th>
          <th>Partenaire / Assureur</th>
          <th>N° Facture</th>
          <th class="c">Date</th>
          <th class="r">Montant Total</th>
          <th class="r">Part Patient</th>
          <th class="r">Part Partenaire</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="color:#475569">TOTAL — ${rows.length} facture${rows.length !== 1 ? 's' : ''}</td>
          <td class="r amt-warn">${fmtF(totaux?.total_brut)}</td>
          <td class="r amt-danger">${fmtF(totaux?.total_patient)}</td>
          <td class="r amt-success">${fmtF(totaux?.total_partenaire)}</td>
        </tr>
      </tfoot>
    </table>`

  openPrint(buildDoc({ prefs, hospital, title: 'Factures en attente', filtersHtml, statsHtml, tableHtml, rowCount: rows.length }))
}

// ═════════════════════════════════════════════════════════════════════════════
// HISTORIQUE DES PAIEMENTS
// ═════════════════════════════════════════════════════════════════════════════
const STAT_HIST = {
  1: { label: 'En attente',         cls: 'bw' },
  2: { label: 'Partiellement payé', cls: 'bp' },
  3: { label: 'Payé',               cls: 'bk' },
}
const MODE_ICO = { ESPECES: '💵', CARTE: '💳', CHEQUE: '🏦', MOBILE: '📱' }

export async function printHistorique(rows, totaux, prefs, filters = {}) {
  const hospital = await fetchHospital()
  const { dateDebut, dateFin, search, billNo, statut } = filters
  const primary = prefs?.primary_color || '#002f59'
  const statutLabel = statut === '3' ? 'Payé' : statut === '2' ? 'Partiellement payé' : null

  const filtersHtml = `<div class="filter-bar">
    <span class="fl">Période :</span>
    <span class="fv">${esc(fmtD(dateDebut))} → ${esc(fmtD(dateFin))}</span>
    ${search      ? `<span class="fl">Patient :</span><span class="fv">${esc(search)}</span>` : ''}
    ${billNo      ? `<span class="fl">N° Facture :</span><span class="fv">${esc(billNo)}</span>` : ''}
    ${statutLabel ? `<span class="fl">Statut :</span><span class="fv">${esc(statutLabel)}</span>` : ''}
  </div>`

  const statsHtml = totaux ? `<div class="stats-strip">
    <div class="sc"><div class="sl">Paiements</div><div class="sv" style="color:${primary}">${Number(totaux.nb_paiements ?? 0).toLocaleString('fr-FR')}</div></div>
    <div class="sc"><div class="sl">Total facturé</div><div class="sv amt-warn">${fmtF(totaux.total_factures)}</div></div>
    <div class="sc"><div class="sl">Total encaissé</div><div class="sv amt-success">${fmtF(totaux.total_paye)}</div></div>
    <div class="sc"><div class="sl">Reste à recouvrer</div><div class="sv amt-danger">${fmtF(totaux.total_restant)}</div></div>
  </div>` : ''

  const tbody = rows.map((r, i) => {
    const st      = STAT_HIST[r.bill_status_id ?? 1] || STAT_HIST[1]
    const modes   = (r.mode_paye || '').split('+').filter(Boolean)
    const paidPct = Number(r.bill_amount) > 0
      ? Math.min(100, Math.round(Number(r.paid_amount) / Number(r.bill_amount) * 100)) : 0
    const restant = Number(r.pending_amount || 0)

    return `<tr>
      <td class="c" style="color:#64748b;font-weight:600">${i + 1}</td>
      <td class="avatar-cell">
        <div class="name">${esc(r.patient_name || '—')}</div>
        ${r.ssn_no ? `<div class="meta">SS : ${esc(r.ssn_no)}</div>` : ''}
      </td>
      <td><span class="mono">${esc(r.bill_no || '—')}</span></td>
      <td class="c" style="color:#475569">${fmtD(r.bill_date)}</td>
      <td class="r amt-neutral">${fmtF(r.bill_amount)}</td>
      <td class="r">
        <div class="amt-success">${fmtF(r.paid_amount)}</div>
        <div style="font-size:9px;color:#94a3b8;text-align:right">${paidPct}%</div>
      </td>
      <td class="r" style="font-weight:700;color:${restant > 0 ? '#f57c00' : '#2e7d32'}">${fmtF(restant)}</td>
      <td style="white-space:nowrap">${modes.length
        ? modes.map(m => `<span style="font-size:10px;margin-right:3px">${MODE_ICO[m] || ''}${esc(m)}</span>`).join('')
        : '<span style="color:#94a3b8">—</span>'}</td>
      <td class="c"><span class="badge ${st.cls}">${esc(st.label)}</span></td>
    </tr>`
  }).join('')

  const tableHtml = `
    <div class="tbl-hdr">
      <span class="tht">📜 Historique des paiements</span>
      <span class="thc">${rows.length} paiement${rows.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="c" style="width:40px">#</th>
          <th>Patient</th>
          <th>N° Facture</th>
          <th class="c">Date</th>
          <th class="r">Montant Total</th>
          <th class="r">Montant Payé</th>
          <th class="r">Restant</th>
          <th>Mode(s)</th>
          <th class="c">Statut</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="color:#475569">TOTAL — ${rows.length} paiement${rows.length !== 1 ? 's' : ''}</td>
          <td class="r amt-neutral">${fmtF(totaux?.total_factures)}</td>
          <td class="r amt-success">${fmtF(totaux?.total_paye)}</td>
          <td class="r amt-danger">${fmtF(totaux?.total_restant)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>`

  openPrint(buildDoc({ prefs, hospital, title: 'Historique des paiements', filtersHtml, statsHtml, tableHtml, rowCount: rows.length }))
}

// ═════════════════════════════════════════════════════════════════════════════
// CRÉDITS PATIENTS
// ═════════════════════════════════════════════════════════════════════════════
export async function printCreditsPatients(rows, totaux, prefs, filters = {}) {
  const hospital = await fetchHospital()
  const { dateDebut, dateFin, search } = filters

  const filtersHtml = `<div class="filter-bar">
    <span class="fl">Période :</span>
    <span class="fv">${esc(fmtD(dateDebut))} → ${esc(fmtD(dateFin))}</span>
    ${search ? `<span class="fl">Patient :</span><span class="fv">${esc(search)}</span>` : ''}
  </div>`

  const statsHtml = totaux ? `<div class="stats-strip">
    <div class="sc"><div class="sl">Patients débiteurs</div><div class="sv amt-danger">${Number(totaux.nb_patients ?? 0).toLocaleString('fr-FR')}</div></div>
    <div class="sc"><div class="sl">Factures en cours</div><div class="sv amt-warn">${Number(totaux.nb_credits ?? 0).toLocaleString('fr-FR')}</div></div>
    <div class="sc"><div class="sl">Total facturé</div><div class="sv amt-neutral">${fmtF(totaux.total_factures)}</div></div>
    <div class="sc"><div class="sl">Déjà encaissé</div><div class="sv amt-success">${fmtF(totaux.total_paye)}</div></div>
    <div class="sc"><div class="sl">Total à recouvrer</div><div class="sv amt-danger">${fmtF(totaux.total_restant)}</div></div>
  </div>` : ''

  const tbody = rows.map((r, i) => {
    const pct = Number(r.total_factures) > 0
      ? Math.min(100, Math.round(Number(r.total_paye) / Number(r.total_factures) * 100)) : 0

    return `<tr>
      <td class="c" style="color:#c62828;font-weight:700">${i + 1}</td>
      <td class="avatar-cell">
        <div class="name">${esc(r.patient_name || '—')}</div>
        <div class="meta">
          ${r.ssn_no ? `SS : ${esc(r.ssn_no)}` : `ID : ${esc(r.patient_id)}`}
          ${r.partenaire_nom ? ` · <span style="color:#1565c0">${esc(r.partenaire_nom)}</span>` : ''}
        </div>
      </td>
      <td class="c">
        <span style="display:inline-flex;align-items:center;justify-content:center;
          width:26px;height:26px;border-radius:50%;background:#fce4e4;
          color:#c62828;font-size:11px;font-weight:800">${r.nb_factures}</span>
      </td>
      <td class="c" style="color:#475569">${fmtD(r.derniere_facture)}</td>
      <td class="r amt-neutral">${fmtF(r.total_factures)}</td>
      <td class="r">
        <div class="amt-success">${fmtF(r.total_paye)}</div>
        <div style="font-size:9px;color:#94a3b8;text-align:right">${pct}%</div>
      </td>
      <td class="r">
        <span style="font-weight:900;font-size:13px;color:#c62828;
          background:#fce4e4;padding:2px 9px;border-radius:4px">${fmtF(r.total_restant)}</span>
      </td>
    </tr>`
  }).join('')

  const tableHtml = `
    <div class="tbl-hdr" style="background:linear-gradient(90deg,#c6282810 0%,transparent 100%)">
      <span class="tht" style="color:#b71c1c">💸 Crédits patients — Montants à recouvrer</span>
      <span class="thc" style="background:#fce4e4;color:#b71c1c">${rows.length} patient${rows.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="c" style="background:#c62828;width:40px">#</th>
          <th style="background:#c62828">Patient</th>
          <th class="c" style="background:#c62828;width:72px">Nb fact.</th>
          <th class="c" style="background:#c62828">Dernière fact.</th>
          <th class="r" style="background:#c62828">Total facturé</th>
          <th class="r" style="background:#c62828">Déjà payé</th>
          <th class="r" style="background:#c62828">Total restant</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
      <tfoot>
        <tr style="background:#fce4e455">
          <td colspan="4" style="color:#b71c1c">TOTAL — ${rows.length} patient${rows.length !== 1 ? 's' : ''}</td>
          <td class="r amt-neutral">${fmtF(totaux?.total_factures)}</td>
          <td class="r amt-success">${fmtF(totaux?.total_paye)}</td>
          <td class="r" style="color:#c62828;font-size:14px">${fmtF(totaux?.total_restant)}</td>
        </tr>
      </tfoot>
    </table>`

  openPrint(buildDoc({
    prefs, hospital,
    title: 'Crédits patients — Montants à recouvrer',
    filtersHtml, statsHtml, tableHtml,
    rowCount: rows.length, tableAccent: '#c62828',
  }))
}
