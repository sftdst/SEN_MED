import { useRef } from 'react'

const fmtF = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const num  = (v) => parseFloat(v) || 0

// Génère le HTML du ticket pour impression
function buildPrintHtml(data) {
  const { patientName, billNo, billDate, services, bills, especes, carte, cheque, mobile, totalPaye, remise, totalPartenaire, dateHeure } = data

  const row = (label, value, bold = false) =>
    `<div class="row${bold ? ' bold' : ''}"><span>${label}</span><span>${value}</span></div>`

  let servicesHtml = ''
  if (services?.length) {
    servicesHtml = `<div class="section-title">SERVICES :</div>`
    services.forEach(s => {
      servicesHtml += row(
        `<span class="truncate">${s.NomDescription || 'Service'}</span>`,
        `${fmtF(s.MontantTotalFacture)} F`
      )
    })
  } else if (bills?.length) {
    servicesHtml = `<div class="section-title">FACTURES SOLDÉES :</div>`
    bills.forEach(b => {
      servicesHtml += row(
        `${b.bill_no || '—'} (${fmtD(b.bill_date)})`,
        `${fmtF(b.pending_amount)} F`
      )
    })
  }

  let modesHtml = `<div class="section-title">MODE(S) DE PAIEMENT :</div>`
  if (num(especes?.montant) > 0) modesHtml += row('Espèces', `${fmtF(especes.montant)} F`)
  if (num(carte?.montant)   > 0) modesHtml += row(`Carte (${carte.banque || '—'})`, `${fmtF(carte.montant)} F`)
  if (num(cheque?.montant)  > 0) modesHtml += row(`Chèque N°${cheque.numero || '—'}`, `${fmtF(cheque.montant)} F`)
  if (num(mobile?.montant)  > 0) modesHtml += row(`Mobile (${mobile.operateur || '—'})`, `${fmtF(mobile.montant)} F`)

  const remiseHtml = num(remise) > 0 ? row('Remise :', `-${fmtF(remise)} F`) : ''
  const partHtml   = num(totalPartenaire) > 0 ? row('Part Assureur :', `${fmtF(totalPartenaire)} F`) : ''
  const renduHtml  = num(especes?.montantRendu) > 0
    ? `<div class="row rendu"><span>Monnaie rendue :</span><span>${fmtF(especes.montantRendu)} F</span></div>` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reçu de paiement</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; font-size:12px; color:#000; width:80mm; margin:0 auto; padding:10px; }
    .header { text-align:center; border-bottom:2px dashed #000; padding-bottom:10px; margin-bottom:10px; }
    .hosp-name { font-size:20px; font-weight:bold; letter-spacing:2px; }
    .hosp-sub  { font-size:10px; color:#555; margin-top:2px; }
    .recu-title { font-size:16px; font-weight:bold; margin-top:8px; letter-spacing:3px; }
    .info-block { margin-bottom:8px; }
    .row { display:flex; justify-content:space-between; margin-bottom:3px; font-size:11px; }
    .row.bold { font-weight:bold; font-size:14px; }
    .row.rendu { font-weight:bold; color:#166534; margin-top:4px; }
    .divider-dash { border-top:1px dashed #000; margin:8px 0; }
    .divider-solid { border-top:2px dashed #000; margin:8px 0; }
    .section-title { font-weight:bold; font-size:11px; margin-bottom:4px; text-decoration:underline; }
    .section { margin-bottom:8px; }
    .truncate { max-width:170px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; display:inline-block; }
    .footer { text-align:center; font-size:10px; color:#555; border-top:2px dashed #000; padding-top:10px; margin-top:10px; line-height:1.8; }
    @media print { @page { margin:4mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="hosp-name">SENMED</div>
    <div class="hosp-sub">Plateforme Médicale de Santé</div>
    <div class="recu-title">REÇU DE PAIEMENT</div>
  </div>

  <div class="info-block">
    ${billNo ? row('<b>N° Facture :</b>', billNo) : ''}
    ${bills?.length ? row('<b>Nb Factures :</b>', `${bills.length} facture(s)`) : ''}
    ${row('<b>Date :</b>', dateHeure)}
    ${row('<b>Patient :</b>', patientName || '—')}
  </div>

  <div class="divider-dash"></div>
  <div class="section">${servicesHtml}</div>
  <div class="divider-dash"></div>
  <div class="section">${modesHtml}</div>
  <div class="divider-solid"></div>
  ${partHtml}
  ${remiseHtml}
  ${row('TOTAL PAYÉ :', `${fmtF(totalPaye)} F`, true)}
  ${renduHtml}

  <div class="footer">
    <div>✦ Merci de votre confiance ✦</div>
    <div>Ce reçu tient lieu de justificatif de paiement.</div>
    <div>Conservez ce document.</div>
  </div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RecuPaiement({ data, onClose }) {
  const previewRef = useRef(null)

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=520,height=700,scrollbars=yes')
    win.document.write(buildPrintHtml(data))
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }

  const { patientName, billNo, bills, services, especes, carte, cheque, mobile, totalPaye, remise, totalPartenaire, dateHeure } = data

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.78)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.15s ease' }}>

      <div style={{ background: '#fff', borderRadius: 10, width: 420, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

        {/* Titre */}
        <div style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🧾</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Reçu de Paiement</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={handlePrint}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              🖨️ Imprimer
            </button>
            <button onClick={onClose}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid #c62828', background: '#c62828', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>

        {/* Aperçu du ticket */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f5f5f5', display: 'flex', justifyContent: 'center' }}>
          <div ref={previewRef} style={{
            fontFamily: "'Courier New', monospace", fontSize: 12, color: '#000',
            background: '#fff', padding: 20, width: 300, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            borderRadius: 4,
          }}>
            {/* ── En-tête ── */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>SENMED</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Plateforme Médicale de Santé</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 8, letterSpacing: 3 }}>REÇU DE PAIEMENT</div>
            </div>

            {/* ── Infos ── */}
            <div style={{ marginBottom: 8 }}>
              {billNo && <Row label="N° Facture :" value={billNo} />}
              {bills?.length ? <Row label="Nb Factures :" value={`${bills.length} facture(s)`} /> : null}
              <Row label="Date :" value={dateHeure} />
              <Row label="Patient :" value={patientName || '—'} />
            </div>

            <Dash />

            {/* ── Services ou factures ── */}
            {services?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 10, textDecoration: 'underline', marginBottom: 4 }}>SERVICES :</div>
                {services.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.NomDescription || `Service ${i + 1}`}</span>
                    <span style={{ flexShrink: 0, marginLeft: 8 }}>{fmtF(s.MontantTotalFacture)} F</span>
                  </div>
                ))}
              </div>
            )}
            {bills?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 10, textDecoration: 'underline', marginBottom: 4 }}>FACTURES SOLDÉES :</div>
                {bills.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span>{b.bill_no || `Facture ${i + 1}`}</span>
                    <span>{fmtF(b.pending_amount)} F</span>
                  </div>
                ))}
              </div>
            )}

            <Dash />

            {/* ── Modes de paiement ── */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold', fontSize: 10, textDecoration: 'underline', marginBottom: 4 }}>MODE(S) DE PAIEMENT :</div>
              {num(especes?.montant) > 0 && <Row label="Espèces" value={`${fmtF(especes.montant)} F`} />}
              {num(carte?.montant)   > 0 && <Row label={`Carte (${carte.banque || '—'})`} value={`${fmtF(carte.montant)} F`} />}
              {num(cheque?.montant)  > 0 && <Row label={`Chèque N°${cheque.numero || '—'}`} value={`${fmtF(cheque.montant)} F`} />}
              {num(mobile?.montant)  > 0 && <Row label={`Mobile (${mobile.operateur || '—'})`} value={`${fmtF(mobile.montant)} F`} />}
            </div>

            <Dash solid />

            {/* ── Totaux ── */}
            {num(totalPartenaire) > 0 && <Row label="Part Assureur :" value={`${fmtF(totalPartenaire)} F`} />}
            {num(remise) > 0 && <Row label="Remise :" value={`-${fmtF(remise)} F`} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 15, marginTop: 6 }}>
              <span>TOTAL PAYÉ :</span>
              <span>{fmtF(totalPaye)} F</span>
            </div>
            {num(especes?.montantRendu) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#166534', marginTop: 4, fontSize: 12 }}>
                <span>Monnaie rendue :</span>
                <span>{fmtF(especes.montantRendu)} F</span>
              </div>
            )}

            {/* ── Pied ── */}
            <div style={{ textAlign: 'center', borderTop: '2px dashed #000', paddingTop: 10, marginTop: 12, fontSize: 10, color: '#555', lineHeight: 1.8 }}>
              <div>✦ Merci de votre confiance ✦</div>
              <div>Ce reçu tient lieu de justificatif</div>
              <div>Conservez ce document.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}

function Dash({ solid }) {
  return <div style={{ borderTop: solid ? '2px dashed #000' : '1px dashed #000', margin: '8px 0' }} />
}
