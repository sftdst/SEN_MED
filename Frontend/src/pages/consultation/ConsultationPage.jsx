import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors } from '../../theme'

// ─── Palette & tokens ─────────────────────────────────────────────────────────
const C = {
  bg:       '#f0f4f8',
  surface:  '#ffffff',
  border:   '#e2e8f0',
  borderMd: '#cbd5e1',
  text:     '#1e293b',
  textMd:   '#475569',
  textSm:   '#94a3b8',
  bleu:     colors.bleu,
  orange:   colors.orange,
  red:      '#dc2626',
  green:    '#16a34a',
  purple:   '#7c3aed',
  teal:     '#0d9488',
  indigo:   '#4f46e5',
  pink:     '#db2777',
}

const calcBMI = (p, t) => {
  const pv = parseFloat(p), tv = parseFloat(t) / 100
  if (!pv || !tv || tv <= 0) return ''
  return (pv / (tv * tv)).toFixed(1)
}

const uid = () => Math.random().toString(36).slice(2, 9)

const fToC = f => { const v = parseFloat(f); return isNaN(v) ? '' : ((v - 32) * 5 / 9).toFixed(1) }
const cToF = c => { const v = parseFloat(c); return isNaN(v) ? '' : (v * 9 / 5 + 32).toFixed(1) }

// ─── Données des pickers ───────────────────────────────────────────────────────

const MEDICAMENTS_LIST = [
  { category: 'Analgésiques / Antipyrétiques', display: 'Paracétamol 500mg',            row: { medicament: 'Paracétamol 500mg',            remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Paracétamol 1000mg',           row: { medicament: 'Paracétamol 1000mg',           remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Ibuprofène 200mg',             row: { medicament: 'Ibuprofène 200mg',             remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Ibuprofène 400mg',             row: { medicament: 'Ibuprofène 400mg',             remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Ibuprofène 600mg',             row: { medicament: 'Ibuprofène 600mg',             remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Diclofénac 50mg',              row: { medicament: 'Diclofénac 50mg',              remarques: '', generique: true } },
  { category: 'Analgésiques / Antipyrétiques', display: 'Tramadol 50mg',                row: { medicament: 'Tramadol 50mg',                remarques: '', generique: false } },
  { category: 'Antibiotiques',                 display: 'Amoxicilline 250mg',            row: { medicament: 'Amoxicilline 250mg',            remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Amoxicilline 500mg',            row: { medicament: 'Amoxicilline 500mg',            remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Amoxicilline 1g',               row: { medicament: 'Amoxicilline 1g',               remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Amoxicilline + Ac. clavulanique 500mg', row: { medicament: 'Amoxicilline + Ac. clavulanique 500mg', remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Cotrimoxazole 480mg',           row: { medicament: 'Cotrimoxazole 480mg',           remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Métronidazole 250mg',           row: { medicament: 'Métronidazole 250mg',           remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Métronidazole 500mg',           row: { medicament: 'Métronidazole 500mg',           remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Ciprofloxacine 500mg',          row: { medicament: 'Ciprofloxacine 500mg',          remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Doxycycline 100mg',             row: { medicament: 'Doxycycline 100mg',             remarques: '', generique: true } },
  { category: 'Antibiotiques',                 display: 'Érythromycine 500mg',           row: { medicament: 'Érythromycine 500mg',           remarques: '', generique: true } },
  { category: 'Antipaludéens',                 display: 'Artémether-Luméfantrine (Coartem)', row: { medicament: 'Artémether-Luméfantrine (Coartem)', remarques: '', generique: false } },
  { category: 'Antipaludéens',                 display: 'Sulfadoxine-Pyriméthamine (Fansidar)', row: { medicament: 'Sulfadoxine-Pyriméthamine (Fansidar)', remarques: '', generique: false } },
  { category: 'Antipaludéens',                 display: 'Chloroquine 100mg',             row: { medicament: 'Chloroquine 100mg',             remarques: '', generique: true } },
  { category: 'Antipaludéens',                 display: 'Quinine 300mg',                 row: { medicament: 'Quinine 300mg',                 remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Amlodipine 5mg',                row: { medicament: 'Amlodipine 5mg',                remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Amlodipine 10mg',               row: { medicament: 'Amlodipine 10mg',               remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Captopril 25mg',                row: { medicament: 'Captopril 25mg',                remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Énalapril 10mg',                row: { medicament: 'Énalapril 10mg',                remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Furosémide 40mg',               row: { medicament: 'Furosémide 40mg',               remarques: '', generique: true } },
  { category: 'Antihypertenseurs',             display: 'Hydrochlorothiazide 25mg',      row: { medicament: 'Hydrochlorothiazide 25mg',      remarques: '', generique: true } },
  { category: 'Antidiabétiques',               display: 'Metformine 500mg',              row: { medicament: 'Metformine 500mg',              remarques: '', generique: true } },
  { category: 'Antidiabétiques',               display: 'Metformine 850mg',              row: { medicament: 'Metformine 850mg',              remarques: '', generique: true } },
  { category: 'Antidiabétiques',               display: 'Glibenclamide 5mg',             row: { medicament: 'Glibenclamide 5mg',             remarques: '', generique: true } },
  { category: 'Antidiabétiques',               display: 'Insuline NPH',                  row: { medicament: 'Insuline NPH',                  remarques: '', generique: false } },
  { category: 'Antidiabétiques',               display: 'Insuline Rapide',               row: { medicament: 'Insuline Rapide',               remarques: '', generique: false } },
  { category: 'Gastro-entérologie',            display: 'Oméprazole 20mg',               row: { medicament: 'Oméprazole 20mg',               remarques: '', generique: true } },
  { category: 'Gastro-entérologie',            display: 'Oméprazole 40mg',               row: { medicament: 'Oméprazole 40mg',               remarques: '', generique: true } },
  { category: 'Gastro-entérologie',            display: 'Métoclopramide 10mg',           row: { medicament: 'Métoclopramide 10mg',           remarques: '', generique: true } },
  { category: 'Antiépileptiques',              display: 'Phénobarbital 100mg',           row: { medicament: 'Phénobarbital 100mg',           remarques: '', generique: true } },
  { category: 'Antiépileptiques',              display: 'Carbamazépine 200mg',           row: { medicament: 'Carbamazépine 200mg',           remarques: '', generique: true } },
  { category: 'Antiépileptiques',              display: 'Valproate de sodium 500mg',     row: { medicament: 'Valproate de sodium 500mg',     remarques: '', generique: true } },
  { category: 'Antiépileptiques',              display: 'Diazépam 5mg',                  row: { medicament: 'Diazépam 5mg',                  remarques: '', generique: true } },
  { category: 'Antifongiques & Antiparasitaires', display: 'Fluconazole 150mg',          row: { medicament: 'Fluconazole 150mg',             remarques: '', generique: true } },
  { category: 'Antifongiques & Antiparasitaires', display: 'Albendazole 400mg',          row: { medicament: 'Albendazole 400mg',             remarques: '', generique: true } },
  { category: 'Corticoïdes',                   display: 'Prednisolone 5mg',              row: { medicament: 'Prednisolone 5mg',              remarques: '', generique: true } },
  { category: 'Corticoïdes',                   display: 'Dexaméthasone 0.5mg',           row: { medicament: 'Dexaméthasone 0.5mg',           remarques: '', generique: true } },
  { category: 'Respiratoire',                  display: 'Salbutamol (Ventolin)',          row: { medicament: 'Salbutamol (Ventolin)',          remarques: '', generique: false } },
  { category: 'Respiratoire',                  display: 'Béclométasone',                  row: { medicament: 'Béclométasone',                 remarques: '', generique: false } },
  { category: 'Compléments & Vitamines',       display: 'Sulfate ferreux',               row: { medicament: 'Sulfate ferreux',               remarques: '', generique: true } },
  { category: 'Compléments & Vitamines',       display: 'Acide folique 5mg',             row: { medicament: 'Acide folique 5mg',             remarques: '', generique: true } },
  { category: 'Compléments & Vitamines',       display: 'Vitamine C 500mg',              row: { medicament: 'Vitamine C 500mg',              remarques: '', generique: true } },
  { category: 'Compléments & Vitamines',       display: 'Zinc 20mg',                     row: { medicament: 'Zinc 20mg',                     remarques: '', generique: true } },
]

const LABO_LIST = [
  { category: 'Hématologie',         display: 'NFS (Numération Formule Sanguine)', row: { laboratoire: 'NFS',                 remarques: '' } },
  { category: 'Hématologie',         display: 'VS (Vitesse de Sédimentation)',     row: { laboratoire: 'VS',                  remarques: '' } },
  { category: 'Hématologie',         display: 'TP/INR (Coagulation)',              row: { laboratoire: 'TP/INR',              remarques: '' } },
  { category: 'Hématologie',         display: 'Groupe sanguin + Rhésus',           row: { laboratoire: 'Groupe sanguin + Rh', remarques: '' } },
  { category: 'Biochimie',           display: 'Glycémie à jeun',                   row: { laboratoire: 'Glycémie à jeun',     remarques: '' } },
  { category: 'Biochimie',           display: 'HbA1c',                             row: { laboratoire: 'HbA1c',               remarques: '' } },
  { category: 'Biochimie',           display: 'Créatinine',                        row: { laboratoire: 'Créatinine',          remarques: '' } },
  { category: 'Biochimie',           display: 'Urée',                              row: { laboratoire: 'Urée',                remarques: '' } },
  { category: 'Biochimie',           display: 'ASAT / ALAT (Transaminases)',       row: { laboratoire: 'ASAT / ALAT',         remarques: '' } },
  { category: 'Biochimie',           display: 'Bilirubine totale / directe',       row: { laboratoire: 'Bilirubine',          remarques: '' } },
  { category: 'Biochimie',           display: 'Albumine',                          row: { laboratoire: 'Albumine',            remarques: '' } },
  { category: 'Biochimie',           display: 'Ionogramme sanguin (Na, K, Cl)',    row: { laboratoire: 'Ionogramme sanguin',  remarques: '' } },
  { category: 'Biochimie',           display: 'CRP (Protéine C Réactive)',         row: { laboratoire: 'CRP',                 remarques: '' } },
  { category: 'Biochimie',           display: 'Bilan lipidique (Chol. LDL HDL)',   row: { laboratoire: 'Bilan lipidique',     remarques: '' } },
  { category: 'Biochimie',           display: 'Triglycérides',                     row: { laboratoire: 'Triglycérides',       remarques: '' } },
  { category: 'Biochimie',           display: 'Acide urique',                      row: { laboratoire: 'Acide urique',        remarques: '' } },
  { category: 'Biochimie',           display: 'PSA (Prostatic Specific Antigen)',  row: { laboratoire: 'PSA',                 remarques: '' } },
  { category: 'Bactériologie',       display: 'ECBU',                              row: { laboratoire: 'ECBU',                remarques: '' } },
  { category: 'Bactériologie',       display: 'Hémoculture',                       row: { laboratoire: 'Hémoculture',         remarques: '' } },
  { category: 'Bactériologie',       display: 'BAAR / Crachat BK',                 row: { laboratoire: 'BAAR / Crachat BK',   remarques: '' } },
  { category: 'Bactériologie',       display: 'Widal (Typhoïde)',                  row: { laboratoire: 'Widal',               remarques: '' } },
  { category: 'Sérologie / Virologie', display: 'GE / TDR Paludisme',             row: { laboratoire: 'GE/TDR Paludisme',    remarques: '' } },
  { category: 'Sérologie / Virologie', display: 'Test VIH',                       row: { laboratoire: 'Test VIH',            remarques: '' } },
  { category: 'Sérologie / Virologie', display: 'AgHBs (Hépatite B)',              row: { laboratoire: 'AgHBs',               remarques: '' } },
  { category: 'Sérologie / Virologie', display: 'Ac Anti-VHC (Hépatite C)',        row: { laboratoire: 'Ac Anti-VHC',         remarques: '' } },
  { category: 'Sérologie / Virologie', display: 'TPHA/RPR (Syphilis)',             row: { laboratoire: 'TPHA/RPR',            remarques: '' } },
  { category: 'Urologie',            display: 'Protéinurie (BU)',                  row: { laboratoire: 'Protéinurie (BU)',    remarques: '' } },
]

const IMAGERIE_LIST = [
  { category: 'Radiologie conventionnelle', display: 'Radiographie thoracique (face)',  row: { imagerie: 'Rx thoracique (face)',     remarques: '' } },
  { category: 'Radiologie conventionnelle', display: 'Radiographie abdominale (ASP)',   row: { imagerie: 'Rx abdominale (ASP)',      remarques: '' } },
  { category: 'Radiologie conventionnelle', display: 'Radiographie du bassin',          row: { imagerie: 'Rx bassin',                remarques: '' } },
  { category: 'Radiologie conventionnelle', display: 'Radiographie colonne vertébrale', row: { imagerie: 'Rx colonne vertébrale',    remarques: '' } },
  { category: 'Radiologie conventionnelle', display: 'Radiographie membres',            row: { imagerie: 'Rx membres',               remarques: '' } },
  { category: 'Échographie',               display: 'Échographie abdominale',           row: { imagerie: 'Écho abdominale',          remarques: '' } },
  { category: 'Échographie',               display: 'Échographie pelvienne',            row: { imagerie: 'Écho pelvienne',           remarques: '' } },
  { category: 'Échographie',               display: 'Échographie obstétricale',         row: { imagerie: 'Écho obstétricale',        remarques: '' } },
  { category: 'Échographie',               display: 'Échographie cardiaque (ETT)',      row: { imagerie: 'ETT (Écho cardiaque)',     remarques: '' } },
  { category: 'Échographie',               display: 'Échographie thyroïde',             row: { imagerie: 'Écho thyroïde',            remarques: '' } },
  { category: 'Échographie',               display: 'Écho-doppler vasculaire',          row: { imagerie: 'Écho-doppler vasculaire',  remarques: '' } },
  { category: 'Scanner (TDM)',             display: 'Scanner crânien sans injection',   row: { imagerie: 'TDM crânien (sans PDC)',   remarques: '' } },
  { category: 'Scanner (TDM)',             display: 'Scanner crânien avec injection',   row: { imagerie: 'TDM crânien (avec PDC)',   remarques: '' } },
  { category: 'Scanner (TDM)',             display: 'Scanner thoracique',               row: { imagerie: 'TDM thoracique',           remarques: '' } },
  { category: 'Scanner (TDM)',             display: 'Scanner abdomino-pelvien',         row: { imagerie: 'TDM abdomino-pelvien',     remarques: '' } },
  { category: 'IRM',                       display: 'IRM cérébrale',                   row: { imagerie: 'IRM cérébrale',            remarques: '' } },
  { category: 'IRM',                       display: 'IRM rachis',                      row: { imagerie: 'IRM rachis',               remarques: '' } },
  { category: 'IRM',                       display: 'IRM articulaire',                 row: { imagerie: 'IRM articulaire',          remarques: '' } },
  { category: 'Autres',                    display: 'Mammographie',                    row: { imagerie: 'Mammographie',             remarques: '' } },
  { category: 'Autres',                    display: 'Panoramique dentaire',            row: { imagerie: 'Panoramique dentaire',     remarques: '' } },
]

const BILANS_LIST = [
  { category: 'Cardiologie',       display: 'ECG (Électrocardiogramme)',      row: { type_bilan: 'ECG',                    remarques: '' } },
  { category: 'Cardiologie',       display: 'Holter ECG 24h',                 row: { type_bilan: 'Holter ECG 24h',         remarques: '' } },
  { category: 'Neurologie',        display: 'EEG (Électroencéphalogramme)',   row: { type_bilan: 'EEG',                    remarques: '' } },
  { category: 'Neurologie',        display: 'Ponction lombaire',              row: { type_bilan: 'Ponction lombaire',      remarques: '' } },
  { category: 'Ophtalmologie',     display: "Fond d'œil",                    row: { type_bilan: "Fond d'œil",             remarques: '' } },
  { category: 'Ophtalmologie',     display: 'Acuité visuelle',               row: { type_bilan: 'Acuité visuelle',        remarques: '' } },
  { category: 'Ophtalmologie',     display: 'Tonométrie (tonus oculaire)',    row: { type_bilan: 'Tonométrie',             remarques: '' } },
  { category: 'Pneumologie',       display: 'Spirométrie (EFR)',              row: { type_bilan: 'Spirométrie (EFR)',      remarques: '' } },
  { category: 'Pneumologie',       display: 'Peak Flow',                     row: { type_bilan: 'Peak Flow',              remarques: '' } },
  { category: 'Gastroentérologie', display: 'Fibroscopie gastrique (FOGD)',   row: { type_bilan: 'FOGD',                   remarques: '' } },
  { category: 'Gastroentérologie', display: 'Coloscopie',                    row: { type_bilan: 'Coloscopie',             remarques: '' } },
  { category: 'Anatomopathologie', display: 'Biopsie cutanée',               row: { type_bilan: 'Biopsie cutanée',        remarques: '' } },
  { category: 'Anatomopathologie', display: 'Biopsie rénale',                row: { type_bilan: 'Biopsie rénale',         remarques: '' } },
  { category: 'Anatomopathologie', display: 'Biopsie hépatique',             row: { type_bilan: 'Biopsie hépatique',      remarques: '' } },
  { category: 'Anatomopathologie', display: 'Frottis cervico-vaginal (FCV)', row: { type_bilan: 'FCV',                    remarques: '' } },
  { category: 'ORL',               display: 'Audiogramme',                   row: { type_bilan: 'Audiogramme',            remarques: '' } },
  { category: 'ORL',               display: 'Tympanogramme',                 row: { type_bilan: 'Tympanogramme',          remarques: '' } },
]

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: 10,
      ...style,
    }}>{children}</div>
  )
}

function CardHead({ title, icon, accent, extra }) {
  return (
    <div style={{
      padding: '9px 14px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: `linear-gradient(to right, ${accent}12, ${accent}04)`,
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>
      {extra}
    </div>
  )
}

function CardBody({ children, pad = '12px 14px' }) {
  return <div style={{ padding: pad }}>{children}</div>
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.textSm, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  )
}

function Inp({ value, onChange, placeholder, type = 'text', unit, disabled, small }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value ?? ''} placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${focus ? C.bleu : C.border}`,
          borderRadius: 7,
          padding: unit ? (small ? '4px 28px 4px 8px' : '6px 30px 6px 9px') : (small ? '4px 8px' : '6px 9px'),
          fontSize: small ? 11 : 12,
          color: C.text,
          background: disabled ? '#f8fafc' : C.surface,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focus ? `0 0 0 3px ${C.bleu}18` : 'none',
        }}
      />
      {unit && (
        <span style={{
          position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, color: C.textSm, fontWeight: 700, pointerEvents: 'none',
        }}>{unit}</span>
      )}
    </div>
  )
}

function Txt({ value, onChange, rows = 3, placeholder }) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      value={value ?? ''} rows={rows} placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${focus ? C.bleu : C.border}`,
        borderRadius: 7, padding: '7px 10px',
        fontSize: 12, color: C.text,
        resize: 'vertical', fontFamily: 'inherit',
        outline: 'none', lineHeight: 1.55,
        background: C.surface,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: focus ? `0 0 0 3px ${C.bleu}18` : 'none',
      }}
    />
  )
}

function Sel({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', border: `1.5px solid ${C.border}`,
        borderRadius: 7, padding: '6px 9px', fontSize: 12,
        color: C.text, background: C.surface, cursor: 'pointer', outline: 'none',
      }}
    >
      <option value="">— Sélectionner —</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )
}

// ─── Table éditable ────────────────────────────────────────────────────────────

function ETable({ rows, cols, onAdd, onRemove, onChange, empty, extraButtons }) {
  return (
    <div>
      <div style={{ borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <colgroup>
            {cols.map(c => <col key={c.k} style={{ width: c.w }} />)}
            <col style={{ width: 26 }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {cols.map(c => (
                <th key={c.k} style={{
                  padding: '6px 8px', textAlign: 'left',
                  fontSize: 9, fontWeight: 700, color: C.textMd,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  borderBottom: `1px solid ${C.border}`,
                }}>{c.l}</th>
              ))}
              <th style={{ borderBottom: `1px solid ${C.border}` }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} style={{ padding: '10px 8px', textAlign: 'center', color: C.textSm, fontSize: 11, fontStyle: 'italic' }}>
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                {cols.map(c => (
                  <td key={c.k} style={{ padding: '3px 4px' }}>
                    {c.t === 'check' ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input type="checkbox" checked={!!row[c.k]}
                          onChange={e => onChange(i, c.k, e.target.checked)}
                          style={{ width: 13, height: 13, cursor: 'pointer', accentColor: C.bleu }} />
                      </div>
                    ) : (
                      <input
                        type="text" value={row[c.k] ?? ''}
                        placeholder={c.p ?? ''}
                        onChange={e => onChange(i, c.k, e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: `1px solid ${C.border}`, borderRadius: 5,
                          padding: '4px 7px', fontSize: 11, outline: 'none',
                          background: C.surface, color: C.text,
                        }}
                        onFocus={e => e.target.style.borderColor = C.bleu}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    )}
                  </td>
                ))}
                <td style={{ padding: '3px 3px', textAlign: 'center' }}>
                  <button onClick={() => onRemove(i)} style={{
                    width: 20, height: 20, border: 'none', borderRadius: 5,
                    background: '#fee2e2', color: C.red,
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Barre de boutons */}
      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={onAdd} style={{
          border: `1.5px dashed ${C.bleu}60`,
          borderRadius: 6, padding: '4px 12px',
          background: `${C.bleu}08`, color: C.bleu,
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'background 0.15s',
        }}
          onMouseOver={e => e.currentTarget.style.background = `${C.bleu}14`}
          onMouseOut={e => e.currentTarget.style.background = `${C.bleu}08`}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Ajouter
        </button>
        {extraButtons}
      </div>
    </div>
  )
}

// ─── Modal Résultat ────────────────────────────────────────────────────────────

function ResultatModal({ title, icon, accent, rows, labelKey, onUpdate, onClose }) {
  const [local, setLocal] = useState(() => rows.map(r => ({ ...r })))

  const upd = (i, val) => {
    const next = [...local]
    next[i] = { ...next[i], remarques: val }
    setLocal(next)
  }

  const handleSave = () => { onUpdate(local); onClose() }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 14, width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(to right, ${accent}14, ${accent}04)`, borderLeft: `4px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: accent }}>Résultats — {title}</div>
              <div style={{ fontSize: 10, color: C.textSm }}>{rows.length} examen(s) prescrit(s)</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMd }}>×</button>
        </div>

        {/* Corps */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px' }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textSm, fontSize: 12, fontStyle: 'italic', padding: '24px 0' }}>
              Aucun examen prescrit. Ajoutez des examens avant de saisir les résultats.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {local.map((row, i) => (
                <div key={row.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {/* Nom examen */}
                  <div style={{ padding: '8px 12px', background: `${accent}0c`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{row[labelKey] || `Examen ${i + 1}`}</span>
                    {row.remarques && (
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: C.green, background: '#f0fdf4', borderRadius: 10, padding: '2px 8px', border: `1px solid #bbf7d0` }}>✓ Renseigné</span>
                    )}
                  </div>
                  {/* Champ résultat */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textSm, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Résultat / Compte-rendu</div>
                    <textarea
                      value={row.remarques ?? ''}
                      rows={3}
                      placeholder="Saisir les valeurs, l'interprétation ou le compte-rendu…"
                      onChange={e => upd(i, e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: `1.5px solid ${C.border}`, borderRadius: 7,
                        padding: '7px 10px', fontSize: 12, color: C.text,
                        resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                        lineHeight: 1.55,
                      }}
                      onFocus={e => e.target.style.borderColor = accent}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#f8fafc' }}>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 18px', fontSize: 12, cursor: 'pointer', background: C.surface, color: C.textMd, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSave} style={{ border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: 12, cursor: 'pointer', background: accent, color: '#fff', fontWeight: 700, boxShadow: `0 2px 8px ${accent}40` }}>
            ✓ Enregistrer les résultats
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Impression bilan ──────────────────────────────────────────────────────────

function imprimerBilan({ title, rows, labelKey, patientName, date }) {
  const html = `
    <!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; font-size: 13px; color: #1e293b; }
      h1   { font-size: 17px; margin: 0 0 4px; }
      .sub { font-size: 11px; color: #64748b; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th   { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #e2e8f0; }
      td   { padding: 9px 10px; border: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      .sign { margin-top: 40px; display: flex; justify-content: flex-end; }
      .sign-box { border-top: 1px solid #94a3b8; width: 200px; text-align: center; padding-top: 8px; font-size: 11px; color: #64748b; }
      @media print { body { padding: 10px; } }
    </style>
    </head><body>
    <h1>📋 ${title}</h1>
    <div class="sub">
      Patient : <strong>${patientName}</strong> &nbsp;|&nbsp; Date : <strong>${date}</strong>
    </div>
    <table>
      <thead><tr><th>#</th><th>Examen prescrit</th><th>Résultat / Compte-rendu</th></tr></thead>
      <tbody>
        ${rows.length === 0
          ? `<tr><td colspan="3" style="text-align:center;color:#94a3b8;font-style:italic">Aucun examen</td></tr>`
          : rows.map((r, i) => `
            <tr>
              <td style="width:32px;text-align:center;font-weight:700">${i + 1}</td>
              <td style="font-weight:600">${r[labelKey] || '—'}</td>
              <td style="min-width:200px">${r.remarques || '<span style="color:#94a3b8;font-style:italic">En attente</span>'}</td>
            </tr>`).join('')
        }
      </tbody>
    </table>
    <div class="sign"><div class="sign-box">Signature du médecin</div></div>
    </body></html>
  `
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal({ title, icon, accent, items, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const filtered = items.filter(it =>
    it.display.toLowerCase().includes(q.toLowerCase()) ||
    (it.category || '').toLowerCase().includes(q.toLowerCase())
  )
  const grouped = filtered.reduce((acc, it) => {
    const cat = it.category || 'Autres'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(it)
    return acc
  }, {})

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 14, width: 500, maxHeight: '78vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(to right, ${accent}14, ${accent}04)`, borderLeft: `3px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: accent }}>{title}</div>
              <div style={{ fontSize: 10, color: C.textSm }}>{items.length} éléments disponibles</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMd }}>×</button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher…"
              style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.bleu}`, borderRadius: 8, padding: '8px 10px 8px 34px', fontSize: 13, outline: 'none', boxShadow: `0 0 0 3px ${C.bleu}18` }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {Object.keys(grouped).length === 0 && (
            <div style={{ padding: '30px 14px', textAlign: 'center', color: C.textSm, fontSize: 12, fontStyle: 'italic' }}>Aucun résultat pour « {q} »</div>
          )}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div style={{ padding: '6px 14px 4px', fontSize: 9, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', background: `${accent}08`, borderBottom: `1px solid ${C.border}` }}>
                {cat}
              </div>
              {catItems.map((it, i) => (
                <div
                  key={i}
                  onClick={() => { onSelect(it.row); onClose() }}
                  style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}88`, display: 'flex', alignItems: 'center', gap: 9, transition: 'background 0.1s' }}
                  onMouseOver={e => e.currentTarget.style.background = `${accent}0d`}
                  onMouseOut={e => e.currentTarget.style.background = ''}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{it.display}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function makeOps(data, key, cols, onChange) {
  return {
    rows: data[key] ?? [],
    cols,
    onAdd: () => {
      const row = { id: uid() }
      cols.forEach(c => { row[c.k] = c.t === 'check' ? false : '' })
      onChange({ ...data, [key]: [...(data[key] ?? []), row] })
    },
    onRemove: i => onChange({ ...data, [key]: (data[key] ?? []).filter((_, j) => j !== i) }),
    onChange: (i, f, v) => {
      const r = [...(data[key] ?? [])]
      r[i] = { ...r[i], [f]: v }
      onChange({ ...data, [key]: r })
    },
  }
}

// ─── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onSave, onClose, saving, saved }) {
  const groups = [
    { items: [{ l: 'Ordonnance', ic: '📄' }, { l: 'CF', ic: '📋' }, { l: 'FJ', ic: '📅' }, { l: 'PMT', ic: '💊' }, { l: 'TRF', ic: '🔄' }] },
    { items: [{ l: 'BDD', ic: '🗄️' }, { l: 'Matrix', ic: '📊' }, { l: 'Rapport', ic: '📑' }, { l: 'Kit', ic: '🧰' }] },
    { items: [{ l: 'Consultations', ic: '🗂️' }, { l: 'Image', ic: '🖼️' }, { l: 'P S', ic: '📝' }, { l: 'S.Vitaux', ic: '❤️' }] },
  ]

  return (
    <div style={{
      background: C.bleu,
      padding: '0 14px',
      height: 46,
      display: 'flex', alignItems: 'center', gap: 8,
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,47,89,0.25)',
      position: 'sticky', top: 0, zIndex: 300,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 12 }}>C</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>Consultation</span>
      </div>

      {/* Groupes */}
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.12)' }}>
          {g.items.map(btn => (
            <button key={btn.l} title={btn.l} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: 'rgba(255,255,255,0.85)', padding: '4px 8px',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 3,
              transition: 'background 0.12s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <span style={{ fontSize: 11 }}>{btn.ic}</span>
              <span>{btn.l}</span>
            </button>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {saved && (
        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>✓</span> Sauvegardé
        </span>
      )}

      <button onClick={onSave} disabled={saving} style={{
        background: C.orange, border: 'none', borderRadius: 8,
        color: '#fff', padding: '7px 18px',
        fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        boxShadow: '0 2px 8px rgba(255,118,49,0.4)',
        opacity: saving ? 0.7 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
      }}
        onMouseOver={e => !saving && (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseOut={e => e.currentTarget.style.transform = 'none'}
      >
        💾 {saving ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>

      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8, color: 'rgba(255,255,255,0.85)', padding: '7px 14px',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.12s',
      }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(220,38,38,0.35)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >✕ Fermer</button>
    </div>
  )
}

// ─── Carte patient ─────────────────────────────────────────────────────────────

function PatientCard({ p }) {
  const name = p.nom_complet || `${p.prenom || p.first_name || ''} ${p.nom || p.last_name || ''}`.trim() || 'Patient'
  const initials = name.split(' ').filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase()
  const age = (() => {
    if (p.age_display) return p.age_display
    if (!p.date_naissance) return '—'
    const d = Math.floor((Date.now() - new Date(p.date_naissance)) / 86400000)
    if (d < 1) return '0 jour'
    if (d < 30) return `${d} j.`
    if (d < 365) return `${Math.floor(d / 30)} mois`
    return `${Math.floor(d / 365)} ans`
  })()
  const sexe = p.sexe === 'M' || p.genre === 'M' ? '♂ Masculin' : p.sexe === 'F' || p.genre === 'F' ? '♀ Féminin' : '—'

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.bleu} 0%, #1e4d8c 100%)`,
        padding: '14px',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 3, lineHeight: 1.2 }}>{name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>🎂 {age}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{sexe}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#fff',
            background: 'rgba(255,255,255,0.15)', borderRadius: 20,
            padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4,
          }}>📅 Visite : {fmtDate(p.date_visite)}</span>
          {p.code_patient && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#fff',
              background: C.orange, borderRadius: 20, padding: '3px 10px',
            }}>#{p.code_patient}</span>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── COLONNE GAUCHE ────────────────────────────────────────────────────────────

function ColonneGauche({ data, onChange }) {
  const upd = (f, v) => onChange({ ...data, [f]: v })
  const atcds = [
    { k: 'atcdChirurgicaux', l: 'ATCD Chirurgicaux', ic: '🔪' },
    { k: 'atcdMedicaux',     l: 'ATCD Médicaux',     ic: '💊' },
    { k: 'histoireSociale',  l: 'Histoire Sociale',  ic: '👥' },
    { k: 'atcdFamiliaux',    l: 'ATCD Familiaux',    ic: '👨‍👩‍👧' },
    { k: 'allergies',        l: 'Allergies & Réactions', ic: '⚠️' },
  ]

  return (
    <Card>
      <CardHead title="Antécédents" icon="📚" accent={C.purple} />
      <CardBody>
        {atcds.map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <Label>{f.ic} {f.l}</Label>
            <Txt value={data[f.k]} onChange={v => upd(f.k, v)} rows={2} placeholder="…" />
          </div>
        ))}

        <div style={{ marginTop: 4 }}>
          <Label>💊 Traitement habituel / en cours</Label>
          <ETable
            empty="Aucun traitement"
            {...makeOps(data, 'traitementHabituel', [
              { k: 'medicament', l: 'Médicament', p: 'Nom…' },
              { k: 'remarques',  l: 'Posologie',  p: 'Dose, durée…' },
            ], onChange)}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <Label>💉 Vaccinations</Label>
          <Txt value={data.vaccinations} onChange={v => upd('vaccinations', v)} rows={2} placeholder="Historique vaccinal…" />
        </div>
      </CardBody>
    </Card>
  )
}

// ─── COLONNE CENTRALE ──────────────────────────────────────────────────────────

function SignesVitaux({ data, onChange }) {
  const upd = (f, v) => {
    const next = { ...data, [f]: v }
    if (f === 'poids' || f === 'taille') next.bmi = calcBMI(next.poids, next.taille)
    if (f === 'tempF') next.tempC = fToC(v)
    if (f === 'tempC') next.tempF = cToF(v)
    onChange(next)
  }

  const bmi = parseFloat(data.bmi)
  const bmiMeta = !bmi ? { color: C.textSm, bg: '#f1f5f9', label: '—' }
    : bmi < 18.5 ? { color: '#2563eb', bg: '#eff6ff', label: 'Maigreur' }
    : bmi < 25   ? { color: C.green,   bg: '#f0fdf4', label: 'Normal ✓' }
    : bmi < 30   ? { color: '#d97706', bg: '#fffbeb', label: 'Surpoids' }
    :              { color: C.red,     bg: '#fef2f2', label: 'Obésité' }

  const fields = [
    { k: 'tempF',     l: 'Temp °F', u: '°F' },
    { k: 'tempC',     l: 'Temp °C', u: '°C' },
    { k: 'taGaucheS', l: 'TA G.(S)', u: 'mmHg' },
    { k: 'taGaucheD', l: 'TA G.(D)', u: 'mmHg' },
    { k: 'taDroiteS', l: 'TA D.(S)', u: 'mmHg' },
    { k: 'taDroiteD', l: 'TA D.(D)', u: 'mmHg' },
    { k: 'pouls',     l: 'Pouls',   u: '/mn' },
    { k: 'respiration', l: 'Resp.',  u: '/mn' },
    { k: 'spo2',      l: 'SpO2',    u: '%' },
    { k: 'taille',    l: 'Taille',  u: 'cm' },
    { k: 'poids',     l: 'Poids',   u: 'kg' },
  ]

  return (
    <Card>
      <CardHead title="Signes Vitaux" icon="❤️" accent={C.red} />
      <CardBody>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 1.2fr', gap: 8 }}>
          {fields.map(f => (
            <div key={f.k}>
              <Label>{f.l}</Label>
              <Inp value={data[f.k]} onChange={v => upd(f.k, v)} unit={f.u} small />
            </div>
          ))}
          {/* BMI */}
          <div>
            <Label>IMC/BMI</Label>
            <div style={{
              border: `1.5px solid ${bmiMeta.color}40`,
              borderRadius: 7,
              background: bmiMeta.bg,
              padding: '4px 7px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: 32, justifyContent: 'center',
            }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: bmiMeta.color, lineHeight: 1 }}>
                {data.bmi || '—'}
              </span>
              {bmi > 0 && (
                <span style={{ fontSize: 8, color: bmiMeta.color, fontWeight: 700, marginTop: 1 }}>
                  {bmiMeta.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function DetailsConsultation({ data, onChange }) {
  const upd = (f, v) => onChange({ ...data, [f]: v })
  return (
    <Card>
      <CardHead title="Détails de la Consultation" icon="🩺" accent={C.bleu} />
      <CardBody>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <Label>🔍 Motif de consultation (signe principal)</Label>
            <Inp value={data.motifConsultation} onChange={v => upd('motifConsultation', v)} placeholder="Signe principal…" />
          </div>
          <div>
            <Label>📌 Événement</Label>
            <Inp value={data.evenement} onChange={v => upd('evenement', v)} placeholder="Événement déclencheur…" />
          </div>
        </div>
        <Label>📖 Histoire de la maladie actuelle</Label>
        <Txt value={data.histoireMaladie} onChange={v => upd('histoireMaladie', v)} rows={5}
          placeholder="Décrivez l'histoire de la maladie actuelle, la chronologie des symptômes, les facteurs aggravants et soulageants…" />
      </CardBody>
    </Card>
  )
}

function ExamenPhysique({ data, onChange }) {
  const upd = (f, v) => onChange({ ...data, [f]: v })
  return (
    <Card>
      <CardHead title="Examen Physique" icon="🔬" accent={C.indigo} />
      <CardBody>
        <div style={{ marginBottom: 10 }}>
          <Label>🏥 État général</Label>
          <Sel value={data.etatGeneral} onChange={v => upd('etatGeneral', v)} options={[
            { v: 'bon',      l: '✅ Bon état général' },
            { v: 'moyen',    l: '🟡 État moyen' },
            { v: 'altere',   l: '🟠 État altéré' },
            { v: 'critique', l: '🔴 État critique' },
            { v: 'comateux', l: '⚫ Comateux' },
          ]} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <Label>🩹 Signes Fonctionnels</Label>
            <Txt value={data.signesFonctionnels} onChange={v => upd('signesFonctionnels', v)} rows={2} placeholder="Douleurs, malaises…" />
          </div>
          <div>
            <Label>🔭 Signes Physiques</Label>
            <Txt value={data.signesPhysiques} onChange={v => upd('signesPhysiques', v)} rows={2} placeholder="Auscultation, palpation…" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <Label>💡 Discussion / Diagnostics potentiels</Label>
          <Txt value={data.discussion} onChange={v => upd('discussion', v)} rows={3} placeholder="Hypothèses diagnostiques, diagnostic différentiel…" />
        </div>
        <div>
          <Label>🎯 Conduite à tenir</Label>
          <Txt value={data.conduiteATenir} onChange={v => upd('conduiteATenir', v)} rows={2} placeholder="Décision thérapeutique, orientation…" />
        </div>
      </CardBody>
    </Card>
  )
}

function SuiviSection({ data, onChange }) {
  const upd = (f, v) => onChange({ ...data, [f]: v })
  const jours = data.prochaineVisite
    ? Math.max(0, Math.ceil((new Date(data.prochaineVisite) - Date.now()) / 86400000))
    : null

  return (
    <Card>
      <CardHead title="Suivi & Classification" icon="📅" accent={C.teal} />
      <CardBody>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', marginBottom: 12 }}>
          <div>
            <Label>📆 Prochaine visite / Suivi</Label>
            <Inp type="date" value={data.prochaineVisite} onChange={v => upd('prochaineVisite', v)} />
          </div>
          {jours !== null && (
            <div style={{
              padding: '6px 12px', borderRadius: 8, background: jours < 0 ? '#fef2f2' : '#f0fdf4',
              color: jours < 0 ? C.red : C.green, fontWeight: 700, fontSize: 12,
              border: `1px solid ${jours < 0 ? '#fecaca' : '#bbf7d0'}`,
            }}>
              {jours < 0 ? `${Math.abs(jours)} j. dépassé` : `Dans ${jours} j.`}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>🔖 SNOMED</Label>
            <div style={{ display: 'flex', gap: 5 }}>
              <Inp value={data.snomed1} onChange={v => upd('snomed1', v)} placeholder="Code…" />
              <Inp value={data.snomed2} onChange={v => upd('snomed2', v)} placeholder="Libellé…" />
            </div>
          </div>
          <div>
            <Label>📊 CIM (Classification)</Label>
            <div style={{ display: 'flex', gap: 5 }}>
              <Inp value={data.cim1} onChange={v => upd('cim1', v)} placeholder="Code…" />
              <Inp value={data.cim2} onChange={v => upd('cim2', v)} placeholder="Libellé…" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

// ─── COLONNE DROITE ────────────────────────────────────────────────────────────

function ColonneDroite({ data, onChange, patient }) {
  const upd = (f, v) => onChange({ ...data, [f]: v })
  const [picker,   setPicker]   = useState(null)
  const [resultat, setResultat] = useState(null) // { key, title, icon, accent, labelKey }

  const patientName = patient
    ? (patient.nom_complet || `${patient.prenom || ''} ${patient.nom || ''}`.trim() || 'Patient')
    : 'Patient'
  const dateImpression = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const withPicker = (key, cols, pickerTitle, pickerIcon, pickerAccent, pickerItems) => {
    const ops = makeOps(data, key, cols, onChange)
    return {
      ...ops,
      onAdd: () => setPicker({ key, title: pickerTitle, icon: pickerIcon, accent: pickerAccent, items: pickerItems }),
    }
  }

  const handleSelect = row => {
    const newRow = { id: uid(), ...row }
    onChange({ ...data, [picker.key]: [...(data[picker.key] ?? []), newRow] })
    setPicker(null)
  }

  // Boutons Résultat + Imprimer pour une section bilan
  const bilanButtons = (key, title, icon, accent, labelKey) => (
    <>
      <button
        onClick={() => setResultat({ key, title, icon, accent, labelKey })}
        style={{
          border: `1.5px solid ${C.green}60`, borderRadius: 6, padding: '4px 11px',
          background: `${C.green}0a`, color: C.green,
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = `${C.green}18`}
        onMouseOut={e => e.currentTarget.style.background = `${C.green}0a`}
        title="Saisir / voir les résultats"
      >
        <span style={{ fontSize: 12 }}>📋</span> Résultat
      </button>
      <button
        onClick={() => imprimerBilan({
          title,
          rows: data[key] ?? [],
          labelKey,
          patientName,
          date: dateImpression,
        })}
        style={{
          border: `1.5px solid ${accent}60`, borderRadius: 6, padding: '4px 11px',
          background: `${accent}0a`, color: accent,
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = `${accent}18`}
        onMouseOut={e => e.currentTarget.style.background = `${accent}0a`}
        title="Imprimer la fiche"
      >
        <span style={{ fontSize: 12 }}>🖨️</span> Imprimer
      </button>
    </>
  )

  return (
    <>
      {picker && (
        <PickerModal
          title={picker.title} icon={picker.icon} accent={picker.accent} items={picker.items}
          onSelect={handleSelect} onClose={() => setPicker(null)}
        />
      )}

      {resultat && (
        <ResultatModal
          title={resultat.title}
          icon={resultat.icon}
          accent={resultat.accent}
          labelKey={resultat.labelKey}
          rows={data[resultat.key] ?? []}
          onUpdate={updatedRows => onChange({ ...data, [resultat.key]: updatedRows })}
          onClose={() => setResultat(null)}
        />
      )}

      {/* ── BILANS ── */}
      <div style={{ fontSize: 9, fontWeight: 800, color: C.textSm, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>
        ▸ BILANS
      </div>

      <Card>
        <CardHead title="Laboratoire" icon="🧪" accent={C.pink} />
        <CardBody>
          <ETable
            empty="Aucun examen"
            {...withPicker('laboratoire', [
              { k: 'laboratoire', l: 'Examen', p: 'Biologie…' },
              { k: 'remarques',   l: 'Résultats', p: 'Valeurs…' },
            ], 'Laboratoire', '🧪', C.pink, LABO_LIST)}
            extraButtons={bilanButtons('laboratoire', 'Laboratoire', '🧪', C.pink, 'laboratoire')}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Imagerie" icon="🖼️" accent={C.purple} />
        <CardBody>
          <ETable
            empty="Aucun examen"
            {...withPicker('imagerie', [
              { k: 'imagerie',  l: 'Examen', p: 'Rx, écho…' },
              { k: 'remarques', l: 'Résultats', p: 'C.R…' },
            ], 'Imagerie', '🖼️', C.purple, IMAGERIE_LIST)}
            extraButtons={bilanButtons('imagerie', 'Imagerie', '🖼️', C.purple, 'imagerie')}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Bilans Spéciaux" icon="⚗️" accent={C.teal} />
        <CardBody>
          <ETable
            empty="Aucun bilan"
            {...withPicker('bilansSpeciaux', [
              { k: 'type_bilan', l: 'Type', p: 'ECG, EEG…' },
              { k: 'remarques',  l: 'Résultats', p: '…' },
            ], 'Bilans Spéciaux', '⚗️', C.teal, BILANS_LIST)}
            extraButtons={bilanButtons('bilansSpeciaux', 'Bilans Spéciaux', '⚗️', C.teal, 'type_bilan')}
          />
        </CardBody>
      </Card>

      {/* ── TRAITEMENT ── */}
      <div style={{ fontSize: 9, fontWeight: 800, color: C.textSm, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2, marginTop: 4 }}>
        ▸ TRAITEMENT
      </div>

      <Card>
        <CardHead title="Médicaments" icon="💊" accent={C.orange} />
        <CardBody>
          <ETable empty="Aucun médicament" {...withPicker('medicaments', [
            { k: 'medicament', l: 'Médicament', p: 'Nom…' },
            { k: 'remarques',  l: 'Posologie / Rem.', p: 'Dose, durée…' },
            { k: 'generique',  l: 'Gén.', t: 'check', w: '38px' },
          ], 'Médicaments', '💊', C.orange, MEDICAMENTS_LIST)} />
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Procédures" icon="⚙️" accent={C.green} />
        <CardBody>
          <ETable empty="Aucune procédure" {...makeOps(data, 'procedures', [
            { k: 'nom_procedure', l: 'Procédure', p: 'Acte…' },
            { k: 'remarques',     l: 'Remarques', p: 'Détails…' },
          ], onChange)} />
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Conseils" icon="💬" accent="#64748b" />
        <CardBody>
          <Txt value={data.conseils} onChange={v => upd('conseils', v)} rows={4}
            placeholder="Recommandations, régime, activité physique, mode de vie…" />
        </CardBody>
      </Card>
    </>
  )
}

// ─── État initial ──────────────────────────────────────────────────────────────

const INIT = {
  tempF: '', tempC: '', taGaucheS: '', taGaucheD: '', taDroiteS: '', taDroiteD: '',
  pouls: '', respiration: '', spo2: '', taille: '', poids: '', bmi: '',
  motifConsultation: '', evenement: '', histoireMaladie: '',
  etatGeneral: '', signesFonctionnels: '', signesPhysiques: '', discussion: '', conduiteATenir: '',
  prochaineVisite: '', snomed1: '', snomed2: '', cim1: '', cim2: '',
  atcdChirurgicaux: '', atcdMedicaux: '', histoireSociale: '', atcdFamiliaux: '',
  allergies: '', vaccinations: '',
  traitementHabituel: [], laboratoire: [], imagerie: [], bilansSpeciaux: [],
  medicaments: [], procedures: [], conseils: '',
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function ConsultationPage({ patient: propPatient, onClose: propOnClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const patient = propPatient || location.state?.patient || {
    prenom: 'BASSIROU', nom: 'CISS',
    date_naissance: new Date(Date.now() - 86400000 * 2).toISOString(),
    sexe: 'M', date_visite: new Date().toISOString(),
  }

  const [data,   setData]   = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const onChange = useCallback(d => setData(d), [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600)) // TODO: appel API
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const handleClose = () => propOnClose ? propOnClose() : navigate(-1)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      <Toolbar onSave={handleSave} onClose={handleClose} saving={saving} saved={saved} />

      {/* 3 colonnes scrollables */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr 1fr',
        gap: 0,
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* ── Gauche ── */}
        <div style={{
          overflowY: 'auto', padding: '12px 6px 12px 12px',
          borderRight: `1px solid ${C.border}`,
          background: '#f8fafc',
        }}>
          <PatientCard p={patient} />
          <ColonneGauche data={data} onChange={onChange} />
        </div>

        {/* ── Centre ── */}
        <div style={{
          overflowY: 'auto', padding: '12px 10px',
          background: C.bg,
        }}>
          <SignesVitaux data={data} onChange={onChange} />
          <DetailsConsultation data={data} onChange={onChange} />
          <ExamenPhysique data={data} onChange={onChange} />
          <SuiviSection data={data} onChange={onChange} />
        </div>

        {/* ── Droite ── */}
        <div style={{
          overflowY: 'auto', padding: '12px 12px 12px 6px',
          borderLeft: `1px solid ${C.border}`,
          background: '#f8fafc',
        }}>
          <ColonneDroite data={data} onChange={onChange} patient={patient} />
        </div>

      </div>
    </div>
  )
}
