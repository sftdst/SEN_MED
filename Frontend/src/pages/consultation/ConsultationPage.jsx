import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors } from '../../theme'
import { consultationApi, visiteApi, paiementApi } from '../../api'
import TransfertModal from '../transferts/TransfertModal'
import FicheAttModal from '../espaceMedecin/FicheAttModal'
import { showToast } from '../../components/ui/Toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

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

// ─── Modal Ordonnance Libre ────────────────────────────────────────────────────

function OrdonnanceModal({ patient, adtId, onClose }) {
  const editorRef        = useRef(null)
  const [isEmpty,        setIsEmpty]        = useState(true)
  const [loadingOrdo,    setLoadingOrdo]    = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [savedBadge,     setSavedBadge]     = useState(false)
  const [medecinInfo,    setMedecinInfo]    = useState(null)  // médecin de l'ordonnance existante
  const [existingStatut, setExistingStatut] = useState(null)

  const patientName = patient?.nom_complet
    || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
    || 'Patient'
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Chargement de l'ordonnance existante ──────────────────────────────────
  useEffect(() => {
    if (!adtId) return
    setLoadingOrdo(true)
    consultationApi.getOrdonnance(adtId)
      .then(r => {
        // Médecin de la visite (toujours présent, même sans ordonnance)
        const medecinVisite = r.data?.medecin_visite || null
        setMedecinInfo(medecinVisite)

        const ordo = r.data?.data
        if (ordo && editorRef.current) {
          editorRef.current.innerHTML = ordo.contenu_html || ''
          setIsEmpty(!ordo.contenu_html || ordo.contenu_html.trim() === '' || ordo.contenu_html === '<br>')
          setExistingStatut(ordo.statut || null)
        }
      })
      .catch(() => {/* pas d'ordonnance → éditeur vierge */})
      .finally(() => setLoadingOrdo(false))
  }, [adtId])

  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  // ── Valider (sauvegarde API) ──────────────────────────────────────────────
  const handleValider = async () => {
    if (!adtId) { onClose(); return }
    const html  = editorRef.current?.innerHTML || ''
    const texte = editorRef.current?.innerText  || ''
    setSaving(true)
    try {
      const r = await consultationApi.saveOrdonnance(adtId, {
        contenu_html:  html,
        contenu_texte: texte,
        statut:        'validee',
      })
      // Conserver le médecin de la visite (déjà chargé), ou prendre celui retourné
      setMedecinInfo(prev => prev || r.data?.data?.medecin || null)
      setExistingStatut('validee')
      setSavedBadge(true)
      setTimeout(() => setSavedBadge(false), 3000)
    } catch {
      /* erreur silencieuse — ne pas fermer */
    } finally {
      setSaving(false)
    }
  }

  // ── Impression ────────────────────────────────────────────────────────────
  const imprimer = () => {
    const content = editorRef.current?.innerHTML || '<em style="color:#94a3b8">Aucune prescription rédigée</em>'
    const medecinNom = medecinInfo
      ? (medecinInfo.staff_name || `${medecinInfo.first_name || ''} ${medecinInfo.last_name || ''}`.trim())
      : ''
    const medecinSpec = medecinInfo?.specialization || ''
    const win = window.open('', '_blank', 'width=820,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
      <title>Ordonnance — ${patientName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 32px 40px; font-size: 13px; color: #1e293b; }
        .header { border-bottom: 2px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #1e3a5f; letter-spacing: 0.03em; }
        .clinic-sub  { font-size: 11px; color: #64748b; margin-top: 2px; }
        .medecin     { font-size: 12px; color: #475569; margin-top: 4px; }
        .patient-box { background: #f8fafc; border-left: 4px solid #1e3a5f; padding: 8px 14px; margin-bottom: 20px; border-radius: 0 6px 6px 0; }
        .patient-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
        .patient-name  { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 2px; }
        .content { min-height: 340px; line-height: 1.9; font-size: 13px; }
        .rp { font-size: 18px; font-weight: bold; margin-bottom: 14px; color: #1e3a5f; }
        .sign { margin-top: 60px; display: flex; justify-content: flex-end; }
        .sign-box { border-top: 1px solid #94a3b8; width: 240px; text-align: center; padding-top: 10px; font-size: 11px; color: #64748b; }
        @media print { body { padding: 16px 24px; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="clinic-name">SEN_MED</div>
          <div class="clinic-sub">Ordonnance Médicale</div>
          ${medecinNom ? `<div class="medecin">Dr. ${medecinNom}${medecinSpec ? ' — ' + medecinSpec : ''}</div>` : ''}
        </div>
        <div style="text-align:right;font-size:12px;color:#475569">Date : <strong>${today}</strong></div>
      </div>
      <div class="patient-box">
        <div class="patient-label">Patient</div>
        <div class="patient-name">${patientName}</div>
      </div>
      <div class="rp">℞</div>
      <div class="content">${content}</div>
      <div class="sign"><div class="sign-box">Cachet &amp; Signature du médecin</div></div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  const btnBase = {
    border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 9px',
    background: C.surface, cursor: 'pointer', fontSize: 12, color: C.text,
    fontWeight: 600, minWidth: 30, transition: 'background 0.12s',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 14, width: 740, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.45)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(to right, ${C.bleu}14, ${C.bleu}04)`, borderLeft: `4px solid ${C.bleu}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.bleu, display: 'flex', alignItems: 'center', gap: 8 }}>
                Ordonnance Libre
                {existingStatut === 'validee' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: C.green, border: `1px solid #bbf7d0` }}>✓ Validée</span>
                )}
                {existingStatut === 'brouillon' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fffbeb', color: '#d97706', border: `1px solid #fde68a` }}>Brouillon</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: C.textSm }}>
                Patient : {patientName} — {today}
                {medecinInfo && (
                  <span style={{ marginLeft: 8, color: C.bleu }}>
                    · Dr. {medecinInfo.staff_name || `${medecinInfo.first_name || ''} ${medecinInfo.last_name || ''}`.trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMd }}>×</button>
        </div>

        {/* Barre de formatage */}
        <div style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 4, background: '#f8fafc', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { cmd: 'bold',      icon: <strong style={{ fontFamily: 'serif' }}>G</strong>, title: 'Gras' },
            { cmd: 'italic',    icon: <em style={{ fontFamily: 'serif' }}>I</em>,          title: 'Italique' },
            { cmd: 'underline', icon: <u>S</u>,                                             title: 'Souligné' },
          ].map(b => (
            <button key={b.cmd} onMouseDown={e => { e.preventDefault(); execCmd(b.cmd) }} title={b.title}
              style={btnBase}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = C.surface}
            >{b.icon}</button>
          ))}
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 3px' }} />
          {[
            { cmd: 'insertUnorderedList', icon: '☰', title: 'Liste à puces' },
            { cmd: 'insertOrderedList',   icon: '1.', title: 'Liste numérotée' },
          ].map(b => (
            <button key={b.cmd} onMouseDown={e => { e.preventDefault(); execCmd(b.cmd) }} title={b.title}
              style={{ ...btnBase, fontSize: 11 }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = C.surface}
            >{b.icon}</button>
          ))}
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 3px' }} />
          <span style={{ fontSize: 10, color: C.textSm, fontWeight: 600 }}>Taille :</span>
          {[['Petit', '1'], ['Normal', '3'], ['Grand', '4'], ['Titre', '5']].map(([label, sz]) => (
            <button key={sz} onMouseDown={e => { e.preventDefault(); execCmd('fontSize', sz) }} title={label}
              style={{ ...btnBase, fontSize: 10, padding: '3px 6px', minWidth: 'auto' }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = C.surface}
            >{label}</button>
          ))}
        </div>

        {/* Zone d'écriture */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#e8edf3', position: 'relative' }}>
          {loadingOrdo && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
              <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${C.bleu}30`, borderTopColor: C.bleu, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
          <div style={{ background: '#fff', minHeight: 400, borderRadius: 4, padding: '28px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', border: `1px solid ${C.border}`, position: 'relative' }}>
            {/* En-tête de page */}
            <div style={{ borderBottom: `2px solid ${C.bleu}`, paddingBottom: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.bleu, fontFamily: 'Georgia, serif' }}>SEN_MED</div>
                <div style={{ fontSize: 10, color: C.textSm, marginTop: 2 }}>Ordonnance Médicale</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.textSm }}>Date : <strong>{today}</strong></div>
                <div style={{ fontSize: 11, color: C.text, marginTop: 3 }}>Patient : <strong>{patientName}</strong></div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.bleu, marginBottom: 12, fontFamily: 'Georgia, serif' }}>℞</div>
            {/* Éditeur */}
            <div style={{ position: 'relative' }}>
              {isEmpty && !loadingOrdo && (
                <div style={{ position: 'absolute', top: 0, left: 0, color: C.textSm, fontSize: 13, pointerEvents: 'none', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.8 }}>
                  Rédigez vos prescriptions ici…<br/>
                  <span style={{ fontSize: 11 }}>Ex : Paracétamol 1g — 1 cp × 3/j pendant 5 jours</span>
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={e => setIsEmpty(e.currentTarget.textContent.trim() === '')}
                style={{ minHeight: 280, outline: 'none', fontSize: 13, lineHeight: 1.8, color: C.text, fontFamily: 'Georgia, serif' }}
              />
            </div>
          </div>
        </div>

        {/* Pied */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div>
            {savedBadge && (
              <span style={{ fontSize: 12, color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✓</span> Ordonnance enregistrée
              </span>
            )}
            {!adtId && (
              <span style={{ fontSize: 11, color: '#d97706' }}>⚠️ Aucun adt_id — sauvegarde désactivée</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 20px', fontSize: 12, cursor: 'pointer', background: C.surface, color: C.textMd, fontWeight: 600 }}>
              Fermer
            </button>
            <button onClick={handleValider} disabled={saving || !adtId} style={{ border: 'none', borderRadius: 8, padding: '8px 22px', fontSize: 12, cursor: saving || !adtId ? 'not-allowed' : 'pointer', background: C.green, color: '#fff', fontWeight: 700, opacity: saving || !adtId ? 0.6 : 1, boxShadow: `0 2px 8px ${C.green}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? '⏳ Sauvegarde…' : '✓ Valider'}
            </button>
            <button onClick={imprimer} style={{ border: 'none', borderRadius: 8, padding: '8px 22px', fontSize: 12, cursor: 'pointer', background: C.bleu, color: '#fff', fontWeight: 700, boxShadow: `0 2px 8px ${C.bleu}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🖨️</span> Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Facture de la Visite (PMT) ─────────────────────────────────────────

function PaiementModal({ patient, adtId, onClose }) {
  const [factures, setFactures] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const patientName = patient?.nom_complet
    || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
    || 'Patient'

  useEffect(() => {
    if (!adtId) { setLoading(false); return }
    consultationApi.getFactures(adtId)
      .then(r => {
        const list = r.data?.data || []
        setFactures(Array.isArray(list) ? list : [])
      })
      .catch(() => setError('Impossible de charger la facture.'))
      .finally(() => setLoading(false))
  }, [adtId])

  const fmtMnt = v => (v != null && !isNaN(parseFloat(v))) ? `${Number(v).toLocaleString('fr-FR')} F` : '—'
  const fmtD   = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const statusBadge = (statusId, label) => {
    const id = parseInt(statusId)
    const cfg = id === 3
      ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
      : id === 2
      ? { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
      : { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
        {label || 'En attente'}
      </span>
    )
  }

  const svcBadge = statut => {
    const s = (statut || '').toUpperCase()
    const paid = s === 'PAYE' || s === 'PARTIELLEMENT_PAYE'
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: paid ? '#f0fdf4' : '#fffbeb', color: paid ? '#16a34a' : '#d97706', border: `1px solid ${paid ? '#bbf7d0' : '#fde68a'}` }}>
        {s === 'PAYE' ? 'Payé' : s === 'PARTIELLEMENT_PAYE' ? 'Partiel' : 'En attente'}
      </span>
    )
  }

  // Totaux consolidés sur toutes les factures
  const totaux = factures.reduce((acc, f) => ({
    brut:    acc.brut    + parseFloat(f.bill_amount   || 0),
    paye:    acc.paye    + parseFloat(f.paid_amount   || 0),
    restant: acc.restant + parseFloat(f.pending_amount|| 0),
  }), { brut: 0, paye: 0, restant: 0 })

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 14, width: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(to right, ${C.green}14, ${C.green}04)`, borderLeft: `4px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 22 }}>🧾</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.green }}>Facture de la Visite</div>
              <div style={{ fontSize: 10, color: C.textSm }}>{patientName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!loading && !error && factures.length > 0 && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{fmtMnt(totaux.brut)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payé</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{fmtMnt(totaux.paye)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Restant</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: totaux.restant > 0 ? '#d97706' : C.green }}>{fmtMnt(totaux.restant)}</div>
                </div>
              </div>
            )}
            <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMd }}>×</button>
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C.textSm, fontSize: 12 }}>
              <div style={{ display: 'inline-block', width: 20, height: 20, border: `2px solid ${C.green}40`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 8 }} />
              <div>Chargement de la facture…</div>
            </div>
          )}
          {error && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: C.red, fontSize: 12 }}>⚠️ {error}</div>
          )}
          {!loading && !error && factures.length === 0 && (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: C.textSm, fontSize: 12, fontStyle: 'italic' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
              {adtId ? 'Aucune facture trouvée pour cette visite.' : 'Visite non identifiée — aucune facture disponible.'}
            </div>
          )}

          {!loading && !error && factures.map((f, fi) => (
            <div key={f.bill_hd_id || fi} style={{ margin: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>

              {/* En-tête facture */}
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: C.indigo, background: `${C.indigo}10`, border: `1px solid ${C.indigo}20`, borderRadius: 6, padding: '2px 8px' }}>
                    {f.bill_no || `#${f.bill_hd_id}`}
                  </span>
                  <span style={{ fontSize: 11, color: C.textSm }}>{fmtD(f.bill_date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {f.mode_paye && (
                    <span style={{ fontSize: 10, color: C.textMd, background: '#f1f5f9', border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 7px' }}>
                      {f.mode_paye}
                    </span>
                  )}
                  {statusBadge(f.bill_status_id, f.status_label)}
                </div>
              </div>

              {/* Lignes de service */}
              {f.services && f.services.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Description', 'Prix', 'Part patient', 'Part partenaire', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.textMd, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {f.services.map((s, si) => (
                      <tr key={s.IDgen_mst_facture || si} style={{ borderBottom: `1px solid ${C.border}`, background: si % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: C.text }}>{s.NomDescription || '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: C.textMd, whiteSpace: 'nowrap' }}>{fmtMnt(s.MontantTotalFacture)}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{fmtMnt(s.patient_payable)}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: C.textMd, whiteSpace: 'nowrap' }}>{fmtMnt(s.MontantPartenaire)}</td>
                        <td style={{ padding: '8px 12px' }}>{svcBadge(s.StatutPaiement)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Récapitulatif facture */}
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Montant total</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmtMnt(f.bill_amount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payé</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{fmtMnt(f.paid_amount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: C.textSm, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Restant</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: parseFloat(f.pending_amount) > 0 ? '#d97706' : C.green }}>{fmtMnt(f.pending_amount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 22px', fontSize: 12, cursor: 'pointer', background: C.surface, color: C.textMd, fontWeight: 600 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Historique des Consultations ───────────────────────────────────────

function HistoriqueConsultationsModal({ patient, onClose }) {
  const [visites,  setVisites]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const patientId   = patient?.patient_id || patient?.id || patient?.code_patient
  const patientName = patient?.nom_complet
    || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
    || 'Patient'

  useEffect(() => {
    if (!patientId) { setLoading(false); return }
    visiteApi.liste({ patient_pin: patientId, per_page: 30 })
      .then(r => {
        const list = r.data?.data?.data || r.data?.data || r.data || []
        setVisites(Array.isArray(list) ? list : [])
      })
      .catch(() => setError('Impossible de charger l\'historique.'))
      .finally(() => setLoading(false))
  }, [patientId])

  const fmtD = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtMnt = v => (v != null && !isNaN(parseFloat(v))) ? `${Number(v).toLocaleString('fr-FR')} F` : '—'

  const medecinNom = v => {
    const m = v.medecin
    if (!m) return '—'
    return m.staff_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || '—'
  }

  const statutBadge = v => {
    const vu = v.doctor_seen === 1 || v.doctor_seen === '1'
    const cfg = vu
      ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Terminé' }
      : { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: 'En attente' }
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 14, width: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(to right, ${C.indigo}14, ${C.indigo}04)`, borderLeft: `4px solid ${C.indigo}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 22 }}>🗂️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.indigo }}>Historique des Consultations</div>
              <div style={{ fontSize: 10, color: C.textSm }}>
                {patientName} — {!loading && !error ? `${visites.length} visite(s)` : ''}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMd }}>×</button>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C.textSm, fontSize: 12 }}>
              <div style={{ display: 'inline-block', width: 20, height: 20, border: `2px solid ${C.indigo}40`, borderTopColor: C.indigo, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 8 }} />
              <div>Chargement de l'historique…</div>
            </div>
          )}
          {error && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: C.red, fontSize: 12 }}>⚠️ {error}</div>
          )}
          {!loading && !error && visites.length === 0 && (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: C.textSm, fontSize: 12, fontStyle: 'italic' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
              Aucune consultation enregistrée pour ce patient.
            </div>
          )}
          {!loading && !error && visites.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Date', 'Médecin', 'Montant', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMd, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visites.map((v, i) => (
                  <tr key={v.adt_id || v.id || i}
                    style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : '#fafbfc', transition: 'background 0.1s' }}
                    onMouseOver={e => e.currentTarget.style.background = `${C.indigo}08`}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? C.surface : '#fafbfc'}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 12, color: C.text, whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {fmtD(v.visit_datetime || v.date_visite || v.created_at)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: C.textMd }}>
                      {medecinNom(v)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: v.Total_a_payer > 0 ? C.green : C.textMd }}>
                      {fmtMnt(v.Total_a_payer ?? v.montant_total)}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {statutBadge(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 22px', fontSize: 12, cursor: 'pointer', background: C.surface, color: C.textMd, fontWeight: 600 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MatrixModal ───────────────────────────────────────────────────────────────

const NAV = '#0f2942'

function MatrixModal({ patient, adtId, onClose }) {
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [allVisites, setAllVisites] = useState([])
  const [patientInfo,setPatientInfo]= useState(null)
  const [selected,   setSelected]   = useState([])

  const patientId = patient?.patient_id || patient?.id || patient?.code_patient

  useEffect(() => {
    if (!patientId) { setLoading(false); setError('ID patient introuvable'); return }
    consultationApi.getMatrix(patientId)
      .then(r => {
        const d = r.data?.data
        if (d) {
          setPatientInfo(d.patient)
          const vis = d.visites || []
          setAllVisites(vis)
          // Auto-sélectionner les 2 premières visites
          setSelected(vis.slice(0, 2).map(v => v.adt_id))
        }
      })
      .catch(() => setError('Impossible de charger les données Matrix.'))
      .finally(() => setLoading(false))
  }, [patientId])

  const toggleSelect = id =>
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= 5 ? prev : [...prev, id]
    )

  const selectedVisites = allVisites.filter(v => selected.includes(v.adt_id))

  // ── Helpers ──────────────────────────────────────────────────────────────
  const nomComplet = patient?.nom_complet
    || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
    || 'Patient'
  const initiales  = nomComplet.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const dob        = patientInfo?.dob || patient?.date_naissance
  const age        = dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) : null

  const getMedecin = v => {
    if (!v.medecin) return '—'
    return v.medecin.staff_name
      || `${v.medecin.first_name || ''} ${v.medecin.last_name || ''}`.trim()
      || '—'
  }
  const fmtD = d => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  // Histoire sociale (depuis la première visite qui la renseigne)
  const histoireSociale = allVisites.find(v => v.histoire_sociale)?.histoire_sociale || ''

  // ── Définition des lignes de la matrix ───────────────────────────────────
  const MATRIX_ROWS = [
    {
      label: 'Docteur',
      render: v => getMedecin(v),
      minH: 44,
    },
    {
      label: 'Consultation',
      render: v => fmtD(v.date_visite),
      minH: 44,
    },
    {
      label: 'Détails',
      render: v => {
        const parts = []
        if (v.motif)            parts.push(`Motif : ${v.motif}`)
        if (v.histoire_maladie) parts.push(v.histoire_maladie)
        return parts.join('\n\n') || '—'
      },
      minH: 90,
    },
    {
      label: 'Résultat de laboratoire',
      render: v => v.lab_procedures?.length
        ? v.lab_procedures.map(l => `• ${l.lab_test_name}${l.result ? ` : ${l.result}` : ''}`).join('\n')
        : '—',
      minH: 90,
    },
    {
      label: 'Plan de gestion',
      render: v => v.conduite_a_tenir || '—',
      minH: 90,
    },
    {
      label: 'Examen clinique',
      render: v => {
        const parts = [v.etat_general, v.signes_physiques].filter(Boolean)
        return parts.join('\n\n') || '—'
      },
      minH: 90,
    },
    {
      label: 'Diagnostic',
      render: v => {
        const parts = []
        if (v.discussion) parts.push(v.discussion)
        if (v.cim) {
          try {
            const c = JSON.parse(v.cim)
            if (c.code || c.label) parts.push(`CIM : ${[c.code, c.label].filter(Boolean).join(' ')}`)
          } catch {}
        }
        return parts.join('\n\n') || '—'
      },
      minH: 90,
    },
    {
      label: 'BILANS',
      render: v => {
        const all = [...(v.bilans || []), ...(v.imagerie || [])]
        return all.length
          ? all.map(b => `• ${b.procedure_name}${b.result ? ` : ${b.result}` : ''}`).join('\n')
          : '—'
      },
      minH: 90,
    },
    {
      label: 'Treatment',
      render: v => v.medications?.length
        ? v.medications.map(m =>
            `• ${m.item_name}${m.dosage ? ` — ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}`
          ).join('\n')
        : '—',
      minH: 90,
    },
  ]

  // ── Couleurs d'en-tête de colonne alternées ───────────────────────────────
  const COL_COLORS = [
    { bg: '#eff6ff', border: '#bfdbfe', text: NAV },
    { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
    { bg: '#fef3c7', border: '#fde68a', text: '#78350f' },
    { bg: '#fdf4ff', border: '#e9d5ff', text: '#581c87' },
    { bg: '#fff1f2', border: '#fecdd3', text: '#881337' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: 'rgba(10,18,36,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '96vw', height: '93vh',
        background: '#fff',
        borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 90px rgba(0,0,0,0.5)',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: NAV,
          padding: '0 22px',
          height: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: C.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📊</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em' }}>
              Rapport Matrix
            </span>
            {!loading && !error && (
              <span style={{
                marginLeft: 6,
                fontSize: 11, color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '2px 10px',
              }}>
                {allVisites.length} visite(s) — {selectedVisites.length} sélectionnée(s)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              color: '#fff', padding: '7px 22px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(220,38,38,0.4)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            ✕ Fermer
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: C.textMd, fontSize: 13 }}>
            <span style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #e2e8f0', borderTopColor: NAV, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Chargement des données Matrix…
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.red, fontSize: 13 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            {error}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ════ PANNEAU GAUCHE ════ */}
            <div style={{
              width: 292, flexShrink: 0,
              borderRight: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column',
              background: '#f8fafc',
              overflowY: 'auto',
            }}>

              {/* Avatar + Nom + Âge + Infos */}
              <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${NAV} 0%, #1e4d8c 100%)`,
                    border: '3px solid #cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '0.05em',
                    boxShadow: '0 4px 14px rgba(15,41,66,0.28)',
                  }}>
                    {initiales}
                  </div>
                  {/* Nom */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontWeight: 800, fontSize: 13, color: NAV,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      lineHeight: 1.3,
                    }}>
                      {nomComplet}
                    </div>
                    {age !== null && (
                      <div style={{
                        marginTop: 4,
                        display: 'inline-block',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: C.orange, borderRadius: 20, padding: '2px 12px',
                      }}>
                        {age} ans
                      </div>
                    )}
                  </div>
                </div>

                {/* Infos détaillées */}
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {patientInfo?.gender_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: C.textSm, fontWeight: 600 }}>Sexe</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {patientInfo.gender_id === 1 ? '♂ Masculin' : patientInfo.gender_id === 2 ? '♀ Féminin' : '—'}
                      </span>
                    </div>
                  )}
                  {dob && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: C.textSm, fontWeight: 600 }}>Naissance</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{fmtD(dob)}</span>
                    </div>
                  )}
                  {(patientInfo?.patient_id || patientId) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: C.textSm, fontWeight: 600 }}>Code patient</span>
                      <span style={{ color: NAV, fontWeight: 700, fontFamily: 'monospace', fontSize: 10 }}>
                        #{patientInfo?.patient_id || patientId}
                      </span>
                    </div>
                  )}
                  {(patientInfo?.contact_number || patientInfo?.mobile_number) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0' }}>
                      <span style={{ color: C.textSm, fontWeight: 600 }}>Téléphone</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {patientInfo.mobile_number || patientInfo.contact_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique des visites */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: NAV,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>📅</span> Historique des visites
                </div>

                {allVisites.length === 0 ? (
                  <div style={{ fontSize: 11, color: C.textSm, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Aucune visite trouvée
                  </div>
                ) : (
                  <>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#e8eef5' }}>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: NAV, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Date de visite
                            </th>
                            <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 9, fontWeight: 700, color: NAV, textTransform: 'uppercase', letterSpacing: '0.05em', width: 88 }}>
                              Sélectionner
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allVisites.map((v, i) => {
                            const isSel     = selected.includes(v.adt_id)
                            const isCurrent = String(v.adt_id) === String(adtId)
                            return (
                              <tr
                                key={v.adt_id}
                                onClick={() => toggleSelect(v.adt_id)}
                                style={{
                                  background: isSel ? '#dbeafe' : i % 2 === 0 ? '#fff' : '#f8fafc',
                                  borderTop: i > 0 ? '1px solid #e2e8f0' : 'none',
                                  cursor: 'pointer',
                                  transition: 'background 0.12s',
                                }}
                                onMouseOver={e => !isSel && (e.currentTarget.style.background = '#f0f7ff')}
                                onMouseOut={e => !isSel && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8fafc')}
                              >
                                <td style={{ padding: '8px 10px', fontSize: 11, color: isSel ? NAV : C.text, fontWeight: isSel ? 700 : 500 }}>
                                  {fmtD(v.date_visite)}
                                  {isCurrent && (
                                    <span style={{
                                      marginLeft: 6, fontSize: 9,
                                      background: C.orange, color: '#fff',
                                      borderRadius: 4, padding: '1px 5px', fontWeight: 700,
                                    }}>
                                      Actuelle
                                    </span>
                                  )}
                                  {v.doctor_seen === 1 && (
                                    <span style={{
                                      marginLeft: 4, fontSize: 9,
                                      background: '#dcfce7', color: '#15803d',
                                      borderRadius: 4, padding: '1px 4px',
                                    }}>✓</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => toggleSelect(v.adt_id)}
                                    onClick={e => e.stopPropagation()}
                                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: NAV }}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: C.textSm, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontStyle: 'italic' }}>Max 5 sélectionnées</span>
                      <span style={{ fontWeight: 600, color: selected.length > 0 ? NAV : C.textSm }}>
                        {selected.length} / 5
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Histoire du patient */}
              <div style={{ padding: '14px 16px', flex: 1 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: NAV,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>📖</span> Histoire du patient
                </div>
                <div style={{
                  border: '1px solid #cbd5e1', borderRadius: 8,
                  padding: '10px 12px', minHeight: 130,
                  background: '#fff',
                  fontSize: 12, color: C.text, lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}>
                  {histoireSociale
                    ? histoireSociale
                    : <span style={{ color: C.textSm, fontStyle: 'italic' }}>Aucune histoire sociale enregistrée.</span>
                  }
                </div>
              </div>
            </div>

            {/* ════ PANNEAU DROIT — MATRIX GRID ════ */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              {selectedVisites.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', gap: 12,
                  color: C.textSm, fontSize: 13,
                }}>
                  <div style={{ fontSize: 40 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>Sélectionnez au moins une visite dans le panneau gauche.</div>
                  <div style={{ fontSize: 11, color: C.textSm }}>Cochez les visites à comparer — jusqu'à 5 simultanément.</div>
                </div>
              ) : (
                <table style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  minWidth: 200 + selectedVisites.length * 260,
                  tableLayout: 'fixed',
                }}>
                  <colgroup>
                    <col style={{ width: 170 }} />
                    {selectedVisites.map(v => <col key={v.adt_id} style={{ width: `${Math.max(260, Math.floor((100 - 25) / selectedVisites.length))}px` }} />)}
                  </colgroup>

                  {/* En-têtes colonnes */}
                  <thead>
                    <tr>
                      {/* Cellule coin */}
                      <th style={{
                        background: NAV,
                        borderBottom: '2px solid #0a1f3a',
                        borderRight: '1px solid #1e3d5c',
                        padding: '10px 14px',
                        textAlign: 'left',
                        position: 'sticky', top: 0, left: 0, zIndex: 10,
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Informations
                        </span>
                      </th>
                      {selectedVisites.map((v, ci) => {
                        const cc = COL_COLORS[ci % COL_COLORS.length]
                        return (
                          <th key={v.adt_id} style={{
                            background: cc.bg,
                            borderBottom: `2px solid ${cc.border}`,
                            borderRight: ci < selectedVisites.length - 1 ? `1px solid ${cc.border}` : 'none',
                            padding: '10px 16px',
                            textAlign: 'left',
                            position: 'sticky', top: 0, zIndex: 5,
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: cc.text }}>
                              {fmtD(v.date_visite)}
                            </div>
                            <div style={{ fontSize: 11, color: cc.text, opacity: 0.75, marginTop: 2, fontWeight: 500 }}>
                              {getMedecin(v)}
                            </div>
                            {String(v.adt_id) === String(adtId) && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{ fontSize: 9, background: C.orange, color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                                  Visite actuelle
                                </span>
                              </div>
                            )}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>

                  {/* Lignes de données */}
                  <tbody>
                    {MATRIX_ROWS.map((row, ri) => (
                      <tr key={row.label}>
                        {/* Label */}
                        <td style={{
                          padding: '11px 14px',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          fontWeight: 700, fontSize: 11, color: NAV,
                          verticalAlign: 'top',
                          background: ri % 2 === 0 ? '#f0f4f9' : '#e8eef5',
                          position: 'sticky', left: 0, zIndex: 2,
                          lineHeight: 1.4,
                          whiteSpace: 'nowrap',
                        }}>
                          {row.label}
                        </td>
                        {/* Cellules de données */}
                        {selectedVisites.map((v, ci) => {
                          const content = row.render(v)
                          const isEmpty = !content || content === '—'
                          const cc = COL_COLORS[ci % COL_COLORS.length]
                          return (
                            <td key={v.adt_id} style={{
                              padding: '11px 16px',
                              borderBottom: '1px solid #e2e8f0',
                              borderRight: ci < selectedVisites.length - 1 ? '1px solid #e2e8f0' : 'none',
                              fontSize: 12,
                              color: isEmpty ? '#94a3b8' : '#1e293b',
                              fontStyle: isEmpty ? 'italic' : 'normal',
                              verticalAlign: 'top',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.6,
                              minHeight: row.minH,
                              background: ri % 2 === 0 ? '#fff' : '#fafbfc',
                              borderLeft: `3px solid ${isEmpty ? '#e2e8f0' : cc.border}`,
                            }}>
                              {content}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── VitauxModal ─────────────────────────────────────────────────────────────

const VS_STATUS = (field, val) => {
  const v = parseFloat(val)
  if (val === '' || val == null || isNaN(v)) return 'none'
  switch (field) {
    case 'tempF': return v >= 97   && v <= 99    ? 'ok' : v > 99    && v <= 102  ? 'warn' : 'crit'
    case 'tempC': return v >= 36.1 && v <= 37.2  ? 'ok' : v > 37.2  && v <= 38.9 ? 'warn' : 'crit'
    case 'pouls': return v >= 60   && v <= 100   ? 'ok' : v >= 40   && v <= 130  ? 'warn' : 'crit'
    case 'tas':   return v >= 90   && v <= 139   ? 'ok' : v >= 80   && v <= 159  ? 'warn' : 'crit'
    case 'tad':   return v >= 60   && v <= 89    ? 'ok' : v >= 50   && v <= 99   ? 'warn' : 'crit'
    case 'spo2':  return v >= 95                  ? 'ok' : v >= 90                ? 'warn' : 'crit'
    case 'resp':  return v >= 12   && v <= 20    ? 'ok' : v >= 10   && v <= 29   ? 'warn' : 'crit'
    case 'imc':   return v >= 18.5 && v < 25     ? 'ok' : v >= 17   && v < 30    ? 'warn' : 'crit'
    default: return 'none'
  }
}
const VS_CLR = { none: '#94a3b8', ok: '#16a34a', warn: '#9333ea', crit: '#dc2626' }
const VS_BG  = { none: '#ffffff', ok: '#f0fdf4', warn: '#fdf4ff', crit: '#fef2f2' }
const VS_BRD = { none: '#e2e8f0', ok: '#86efac', warn: '#d8b4fe', crit: '#fca5a5' }

const VITAL_LINES = [
  { key: 'Temp(°F)', color: '#f472b6', width: 2,   dash: '',      label: 'Temp(°F)' },
  { key: 'TA(S)G',   color: '#3b82f6', width: 2.5, dash: '',      label: 'TA(S)' },
  { key: 'TA(D)G',   color: '#60a5fa', width: 2,   dash: '6 3',   label: 'TA(D)' },
  { key: 'TA(S)D',   color: '#f97316', width: 2.5, dash: '',      label: 'TA(S)' },
  { key: 'TA(D)D',   color: '#fbbf24', width: 2,   dash: '6 3',   label: 'TA(D)' },
  { key: 'SPO2',     color: '#10b981', width: 2.5, dash: '',      label: 'SPO2' },
  { key: 'Pouls',    color: '#ef4444', width: 2,   dash: '',      label: 'Pouls(/mn)' },
]

const EMPTY_VS_FORM = {
  tempF: '', tempC: '', pouls: '',
  tasg: '', tadg: '', tasd: '', tadd: '',
  hauteur: '', poids: '', imc: '',
  spo2: '', respiration: '',
}

const VS_HDR_COLS = [
  'Date et heure',
  'Température(°F)',
  'Rythme cardiaque(/mn)',
  'Bras Gauche BP(S)',
  'Bras Gauche BP(D)',
  'Bras Droite BP(S)',
  'Bras Droite BP(D)',
  'Respiration',
  'Taille',
  'Poids',
  'IMC',
  'SPO2',
]

function VInput({ label, icon, field, value, onChange, readOnly, step }) {
  const st = readOnly ? 'none' : VS_STATUS(field, value)
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span>{label}</span>
      </div>
      <input
        type="number"
        step={step || 'any'}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '8px 12px',
          border: `2px solid ${VS_BRD[st]}`,
          borderRadius: 8,
          background: readOnly ? '#f1f5f9' : VS_BG[st],
          fontSize: 14, fontWeight: 700,
          color: st === 'none' ? '#334155' : VS_CLR[st],
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s, color 0.2s',
          cursor: readOnly ? 'default' : 'text',
        }}
      />
    </div>
  )
}

function VitauxModal({ patient, adtId, onClose }) {
  const [form,    setForm]    = useState(EMPTY_VS_FORM)
  const [vitaux,  setVitaux]  = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!adtId) { setLoading(false); return }
    consultationApi.vitaux(adtId)
      .then(r => setVitaux(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [adtId])

  const upd = patch => setForm(f => ({ ...f, ...patch }))

  const onTempF = v => upd({ tempF: v, tempC: v === '' ? '' : fToC(v) })
  const onTempC = v => upd({ tempC: v, tempF: v === '' ? '' : cToF(v) })
  const onPoids = v => upd({ poids: v, imc: calcBMI(v, form.hauteur) })
  const onHaut  = v => upd({ hauteur: v, imc: calcBMI(form.poids, v) })

  const handleSave = async (andClose = false) => {
    setSaving(true)
    try {
      const res = await consultationApi.storeVital(adtId, {
        temperature_f:   form.tempF      ? +form.tempF      : null,
        temperature_c:   form.tempC      ? +form.tempC      : null,
        pulse:           form.pouls      ? +form.pouls      : null,
        respiration:     form.respiration? +form.respiration: null,
        bp_systolic_l:   form.tasg       ? +form.tasg       : null,
        bp_diastolic_l:  form.tadg       ? +form.tadg       : null,
        bp_systolic_r:   form.tasd       ? +form.tasd       : null,
        bp_diastolic_r:  form.tadd       ? +form.tadd       : null,
        weights:         form.poids      ? +form.poids      : null,
        height:          form.hauteur    ? +form.hauteur    : null,
        bmi:             form.imc        ? +form.imc        : null,
        spo_2:           form.spo2       ? +form.spo2       : null,
      })
      const entry = res.data?.data
      if (entry) setVitaux(v => [entry, ...v])
      setForm(EMPTY_VS_FORM)
      showToast('Signes vitaux enregistrés', 'success')
      if (andClose) onClose()
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Patient info
  const nom      = patient?.nom_complet || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
  const initials = nom.split(' ').filter(Boolean).slice(0, 2).map(s => (s[0] || '').toUpperCase()).join('')
  const dob      = patient?.date_naissance || patient?.dob
  const age      = dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 864e5)) : null

  // Chart data (chronological order)
  const chartData = [...vitaux].reverse().map((v, i) => ({
    time:        v.created_dttm
      ? new Date(v.created_dttm).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : `#${i + 1}`,
    'Temp(°F)': v.temperature_f  != null ? +v.temperature_f  : undefined,
    'TA(S)G':   v.bp_systolic_l  != null ? +v.bp_systolic_l  : undefined,
    'TA(D)G':   v.bp_diastolic_l != null ? +v.bp_diastolic_l : undefined,
    'TA(S)D':   v.bp_systolic_r  != null ? +v.bp_systolic_r  : undefined,
    'TA(D)D':   v.bp_diastolic_r != null ? +v.bp_diastolic_r : undefined,
    'SPO2':     v.spo_2          != null ? +v.spo_2          : undefined,
    'Pouls':    v.pulse          != null ? +v.pulse          : undefined,
  }))

  const fmtDate = dttm => dttm
    ? new Date(dttm).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'
  const fmtVal = v => v != null ? Number(v).toFixed(2).replace(/\.?0+$/, '') : '—'

  const getRowCells = v => [
    { val: fmtDate(v.created_dttm),  field: null,    raw: null },
    { val: fmtVal(v.temperature_f),  field: 'tempF', raw: v.temperature_f },
    { val: fmtVal(v.pulse),          field: 'pouls', raw: v.pulse },
    { val: fmtVal(v.bp_systolic_l),  field: 'tas',   raw: v.bp_systolic_l },
    { val: fmtVal(v.bp_diastolic_l), field: 'tad',   raw: v.bp_diastolic_l },
    { val: fmtVal(v.bp_systolic_r),  field: 'tas',   raw: v.bp_systolic_r },
    { val: fmtVal(v.bp_diastolic_r), field: 'tad',   raw: v.bp_diastolic_r },
    { val: fmtVal(v.respiration),    field: 'resp',  raw: v.respiration },
    { val: fmtVal(v.height),         field: null,    raw: null },
    { val: fmtVal(v.weights),        field: null,    raw: null },
    { val: fmtVal(v.bmi),            field: 'imc',   raw: v.bmi },
    { val: fmtVal(v.spo_2),          field: 'spo2',  raw: v.spo_2 },
  ]

  const HDR_BTN_STYLE = (variant) => ({
    padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
    border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.3)' : 'none',
    background: variant === 'orange' ? C.orange : variant === 'red' ? '#dc2626' : 'rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: '#f0f4f8', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: NAV, padding: '0 18px', height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>❤️</div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, flex: 1 }}>Signes vitaux</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button style={HDR_BTN_STYLE('ghost')}>Plan de Surveillance</button>
          <button style={HDR_BTN_STYLE()} onClick={() => setForm(EMPTY_VS_FORM)}>Nouveau</button>
          <button style={HDR_BTN_STYLE()} onClick={() => setForm(EMPTY_VS_FORM)}>Annuler</button>
          <button style={HDR_BTN_STYLE()}>Impression</button>
          <button style={{ ...HDR_BTN_STYLE('orange'), opacity: saving ? 0.65 : 1 }}
            onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
          <button style={{ ...HDR_BTN_STYLE('orange'), opacity: saving ? 0.65 : 1 }}
            onClick={() => handleSave(true)} disabled={saving}>
            Sauver et Fermer
          </button>
          <button style={HDR_BTN_STYLE('red')} onClick={onClose}>✕ Fermer</button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── PANNEAU GAUCHE : carte patient ─────────────────────────────── */}
        <div style={{
          width: 195, flexShrink: 0,
          background: '#fff', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '30px 14px 20px', gap: 16,
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${NAV} 0%, #1e5a9e 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 28, fontWeight: 800,
            boxShadow: '0 6px 22px rgba(15,41,66,0.35)',
          }}>
            {initials || '?'}
          </div>

          {/* Nom + âge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.4 }}>
              {nom || '—'}
            </div>
            {age !== null && (
              <div style={{ marginTop: 8, display: 'inline-block', background: C.orange, color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 800 }}>
                {age} ans
              </div>
            )}
          </div>

          {/* Détails */}
          <div style={{ width: '100%', background: '#f8fafc', borderRadius: 10, padding: '10px 12px', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Sexe',  patient?.sexe || patient?.gender || '—'],
              ['Code',  patient?.patient_id || patient?.code_patient || '—'],
              ['Tél.',  patient?.telephone  || patient?.phone        || '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{lbl}</span>
                <span style={{ color: '#334155', fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Compteur mesures */}
          <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: NAV, lineHeight: 1 }}>{vitaux.length}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>mesure{vitaux.length !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>cette visite</div>
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* LIGNE DU HAUT : formulaire + graphique */}
          <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>

            {/* ── FORMULAIRE ─────────────────────────────────────────────── */}
            <div style={{
              flex: '0 0 520px',
              background: '#fff', borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              padding: 22, boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontWeight: 700, color: NAV, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, borderBottom: `3px solid ${C.orange}`, paddingBottom: 10 }}>
                <span>📋</span> Signes Vitaux
              </div>

              {/* Température + Pouls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
                <VInput label="Température (°F)" icon="🌡️" field="tempF" value={form.tempF} onChange={onTempF} step="0.1" />
                <VInput label="Température (°C)" icon="🌡️" field="tempC" value={form.tempC} onChange={onTempC} step="0.1" />
                <VInput label="Pouls (/mn)"       icon="💓" field="pouls" value={form.pouls} onChange={v => upd({ pouls: v })} />
              </div>

              {/* Bras gauche */}
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 16px', marginBottom: 12, border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>🩺 Bras Gauche — Left Arm</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <VInput label="TA(S) Systolique"  field="tas" value={form.tasg} onChange={v => upd({ tasg: v })} />
                  <VInput label="TA(D) Diastolique" field="tad" value={form.tadg} onChange={v => upd({ tadg: v })} />
                </div>
              </div>

              {/* Bras droit */}
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 16px', marginBottom: 18, border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', marginBottom: 10 }}>🩺 Bras Droit — Right Arm</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <VInput label="TA(S) Systolique"  field="tas" value={form.tasd} onChange={v => upd({ tasd: v })} />
                  <VInput label="TA(D) Diastolique" field="tad" value={form.tadd} onChange={v => upd({ tadd: v })} />
                </div>
              </div>

              {/* Anthropométrie */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                <VInput label="Hauteur (cm)"  icon="📏" field="none" value={form.hauteur}  onChange={onHaut}  />
                <VInput label="Poids (kg)"    icon="⚖️" field="none" value={form.poids}    onChange={onPoids} />
                <VInput label="IMC (calculé)" icon="🧮" field="imc"  value={form.imc}      readOnly />
              </div>

              {/* SPO2 + Respiration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                <VInput label="SPO2 (%)"          icon="💧" field="spo2" value={form.spo2}        onChange={v => upd({ spo2: v })} />
                <VInput label="Respiration (/mn)" icon="🫁" field="resp" value={form.respiration} onChange={v => upd({ respiration: v })} />
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                {[['Normal','#16a34a'], ['Sérieux','#9333ea'], ['Critique','#dc2626']].map(([lbl, col]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}60` }} />
                    <span style={{ color: col }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── GRAPHIQUE ──────────────────────────────────────────────── */}
            <div style={{
              flex: 1,
              background: '#fff', borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              padding: '18px 18px 12px', boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
              minHeight: 350, display: 'flex', flexDirection: 'column',
            }}>
              {/* Titre */}
              <div style={{ fontWeight: 700, color: NAV, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, borderBottom: `3px solid ${C.orange}`, paddingBottom: 10 }}>
                <span>📈</span> Graphique
                {vitaux.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    {vitaux.length} prise{vitaux.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {chartData.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8' }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <rect width="56" height="56" rx="14" fill="#f1f5f9"/>
                    <polyline points="10,38 18,28 26,32 34,20 44,26" stroke="#cbd5e1" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="38" r="2.5" fill="#cbd5e1"/>
                    <circle cx="18" cy="28" r="2.5" fill="#cbd5e1"/>
                    <circle cx="26" cy="32" r="2.5" fill="#cbd5e1"/>
                    <circle cx="34" cy="20" r="2.5" fill="#cbd5e1"/>
                    <circle cx="44" cy="26" r="2.5" fill="#cbd5e1"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Aucune donnée à afficher</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Enregistrez une première mesure pour voir les courbes</div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Légende manuelle groupée */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 11 }}>
                    {/* Temp + Pouls + SPO2 */}
                    {[
                      { key: 'Temp(°F)', color: '#f472b6', dash: false },
                      { key: 'SPO2',     color: '#10b981', dash: false },
                      { key: 'Pouls',    color: '#ef4444', dash: false },
                    ].map(l => (
                      <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: l.color + '18', marginRight: 2 }}>
                        <span style={{ display: 'inline-block', width: 18, height: 2.5, background: l.color, borderRadius: 2 }} />
                        <span style={{ color: l.color, fontWeight: 700 }}>{l.key}</span>
                      </span>
                    ))}
                    <span style={{ color: '#94a3b8', margin: '0 4px' }}>|</span>
                    {/* Bras Gauche group */}
                    <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, marginRight: 2 }}>Bras Gauche</span>
                    {[
                      { key: 'TA(S)G', color: '#3b82f6', dash: false, label: 'TA(S)' },
                      { key: 'TA(D)G', color: '#60a5fa', dash: true,  label: 'TA(D)' },
                    ].map(l => (
                      <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: l.color + '18', marginRight: 2 }}>
                        <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={l.color} strokeWidth="2.5" strokeDasharray={l.dash ? '4 2' : ''} strokeLinecap="round"/></svg>
                        <span style={{ color: l.color, fontWeight: 700 }}>{l.label}</span>
                      </span>
                    ))}
                    <span style={{ color: '#94a3b8', margin: '0 4px' }}>|</span>
                    {/* Bras Droit group */}
                    <span style={{ fontSize: 10, color: '#ea580c', fontWeight: 700, marginRight: 2 }}>Bras Droit</span>
                    {[
                      { key: 'TA(S)D', color: '#f97316', dash: false, label: 'TA(S)' },
                      { key: 'TA(D)D', color: '#fbbf24', dash: true,  label: 'TA(D)' },
                    ].map(l => (
                      <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: l.color + '18', marginRight: 2 }}>
                        <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={l.color} strokeWidth="2.5" strokeDasharray={l.dash ? '4 2' : ''} strokeLinecap="round"/></svg>
                        <span style={{ color: l.color, fontWeight: 700 }}>{l.label}</span>
                      </span>
                    ))}
                  </div>

                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: -14, bottom: 0 }}>
                      <defs>
                        {VITAL_LINES.map(l => (
                          <filter key={l.key} id={`glow-${l.key.replace(/[^a-z0-9]/gi, '')}`}>
                            <feGaussianBlur stdDeviation="2" result="blur"/>
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        ))}
                      </defs>

                      <CartesianGrid
                        horizontal={true} vertical={false}
                        stroke="#e8edf4" strokeDasharray="4 4"
                      />

                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />

                      {/* Ligne de référence seuil SPO2 normal */}
                      <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 4" strokeOpacity={0.4}
                        label={{ value: 'SPO2 min', position: 'insideTopRight', fontSize: 9, fill: '#10b981', opacity: 0.7 }}
                      />
                      {/* Ligne TA systolique normale haute */}
                      <ReferenceLine y={140} stroke="#3b82f6" strokeDasharray="3 4" strokeOpacity={0.3}
                        label={{ value: 'TA seuil', position: 'insideTopRight', fontSize: 9, fill: '#3b82f6', opacity: 0.6 }}
                      />

                      <Tooltip
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 3' }}
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 8px 28px rgba(15,41,66,0.14)',
                          padding: '10px 14px',
                          fontSize: 11,
                        }}
                        labelStyle={{ fontWeight: 800, color: NAV, marginBottom: 6, fontSize: 12 }}
                        formatter={(val, name) => {
                          if (val == null) return [null, name]
                          const line = VITAL_LINES.find(l => l.key === name)
                          return [
                            <span style={{ fontWeight: 700, color: line?.color || '#334155' }}>
                              {Number(val).toFixed(1)}
                            </span>,
                            name,
                          ]
                        }}
                        itemStyle={{ color: '#475569', padding: '1px 0' }}
                      />

                      {/* Pas de légende recharts native — on utilise la légende manuelle ci-dessus */}
                      <Legend wrapperStyle={{ display: 'none' }} />

                      {VITAL_LINES.map(l => (
                        <Line
                          key={l.key}
                          type="natural"
                          dataKey={l.key}
                          stroke={l.color}
                          strokeWidth={l.width}
                          strokeDasharray={l.dash}
                          dot={(props) => {
                            const { cx, cy } = props
                            if (cx == null || cy == null) return null
                            return (
                              <circle
                                key={`dot-${props.index}`}
                                cx={cx} cy={cy} r={4}
                                fill="#fff"
                                stroke={l.color}
                                strokeWidth={2}
                              />
                            )
                          }}
                          activeDot={{ r: 7, fill: l.color, stroke: '#fff', strokeWidth: 2.5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── TABLEAU HISTORIQUE ─────────────────────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #dde3ec', boxShadow: '0 2px 14px rgba(0,0,0,0.06)', overflow: 'hidden', flexShrink: 0 }}>

            {/* Titre */}
            <div style={{ padding: '11px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, color: NAV, fontSize: 13 }}>— Valeurs des signes vitaux</span>
              {vitaux.length > 0 && (
                <span style={{ marginLeft: 'auto', background: NAV, color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
                  {vitaux.length} prise{vitaux.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Table à hauteur fixe avec scroll interne */}
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 220 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f0f4f8' }}>
                    {VS_HDR_COLS.map(h => (
                      <th key={h} style={{
                        padding: '9px 16px', textAlign: 'center',
                        fontWeight: 700, color: NAV, fontSize: 11,
                        borderBottom: '2px solid #dde3ec',
                        whiteSpace: 'nowrap',
                        position: 'sticky', top: 0, background: '#f0f4f8', zIndex: 2,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={VS_HDR_COLS.length} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontStyle: 'italic' }}>
                        Chargement...
                      </td>
                    </tr>
                  ) : vitaux.length === 0 ? (
                    /* Lignes vides visuelles quand pas de données (comme dans l'image) */
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ background: i % 2 ? '#f8fafc' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                        {VS_HDR_COLS.map((_, ci) => (
                          <td key={ci} style={{ padding: '11px 16px', textAlign: 'center', color: '#cbd5e1' }}>
                            {i === 0 && ci === 0 ? <span style={{ fontStyle: 'italic', fontSize: 11 }}>Aucune prise enregistrée</span> : ''}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <>
                      {vitaux.map((v, i) => {
                        const cells = getRowCells(v)
                        return (
                          <tr key={v.vital_sign_id || i} style={{ background: i % 2 ? '#f8fafc' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                            {cells.map((cell, ci) => {
                              const st = cell.field ? VS_STATUS(cell.field, cell.raw) : 'none'
                              return (
                                <td key={ci} style={{
                                  padding: '9px 16px', textAlign: 'center', whiteSpace: 'nowrap',
                                  fontWeight: st !== 'none' ? 700 : 500,
                                  color: st !== 'none' ? VS_CLR[st] : ci === 0 ? '#334155' : '#475569',
                                }}>
                                  {cell.val}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                      {/* Lignes vides de remplissage si moins de 5 entrées */}
                      {vitaux.length < 5 && Array.from({ length: 5 - vitaux.length }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ background: (vitaux.length + i) % 2 ? '#f8fafc' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                          {VS_HDR_COLS.map((_, ci) => (
                            <td key={ci} style={{ padding: '11px 16px' }}></td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Toolbar ───────────────────────────────────────────────────────────────────

// Actions avec leur clé d'action correspondante (null = pas encore implémenté)
const TOOLBAR_GROUPS = [
  { items: [
    { l: 'Ordonnance',    ic: '📄', action: 'ordonnance',     active: true  },
    { l: 'CF',            ic: '📋', action: null,              active: false },
    { l: 'FJ',            ic: '📎', action: 'fiches',           active: true  },
    { l: 'PMT',           ic: '💳', action: 'paiement',        active: true  },
    { l: 'TRF',           ic: '🔄', action: 'transfert',       active: true  },
  ]},
  { items: [
    { l: 'BDD',    ic: '🗄️', action: null, active: false },
    { l: 'Matrix', ic: '📊', action: 'matrix', active: true },
    { l: 'Rapport',ic: '📑', action: null, active: false },
    { l: 'Kit',    ic: '🧰', action: null, active: false },
  ]},
  { items: [
    { l: 'Consultations', ic: '🗂️', action: 'historique',  active: true  },
    { l: 'Image',         ic: '🖼️', action: null,           active: false },
    { l: 'P S',           ic: '📝', action: null,           active: false },
    { l: 'S.Vitaux',      ic: '❤️', action: 'vitaux',        active: true  },
  ]},
]

function Toolbar({ onSave, onClose, saving, saved, onAction }) {
  const groups = TOOLBAR_GROUPS

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
            <button
              key={btn.l}
              title={btn.active ? btn.l : `${btn.l} (bientôt disponible)`}
              onClick={() => btn.active && onAction && onAction(btn.action)}
              style={{
                background: btn.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: btn.active ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, color: btn.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                padding: '4px 8px',
                fontSize: 10, fontWeight: 600,
                cursor: btn.active ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 3,
                transition: 'background 0.12s',
              }}
              onMouseOver={e => btn.active && (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseOut={e => btn.active && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
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

// ─── Template IDs pour les notes structurées ──────────────────────────────────
// adt_notes (champs cliniques consultation) : 101–115
// patient_notes (antécédents persistants)  : 201–210
const TID = {
  motifConsultation: 101,
  evenement:         102,
  histoireMaladie:   103,
  etatGeneral:       104,
  signesFonctionnels:105,
  signesPhysiques:   106,
  discussion:        107,
  conduiteATenir:    108,
  prochaineVisite:   109,
  snomed:            110,  // JSON {code, label}
  cim:               111,  // JSON {code, label}
  conseils:          112,
  atcdChirurgicaux:  201,
  atcdMedicaux:      202,
  histoireSociale:   203,
  atcdFamiliaux:     204,
  allergies:         205,
  vaccinations:      206,
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

// ─── Conversion API → état formulaire ────────────────────────────────────────

function apiToForm(apiData) {
  if (!apiData) return INIT
  const form = { ...INIT }

  // Signes vitaux
  const vs = apiData.objvitalsigns
  if (vs) {
    form.tempF      = vs.temperature_f ?? ''
    form.tempC      = vs.temperature_c ?? ''
    form.taGaucheS  = vs.bp_systolic_l ?? ''
    form.taGaucheD  = vs.bp_diastolic_l ?? ''
    form.taDroiteS  = vs.bp_systolic_r ?? ''
    form.taDroiteD  = vs.bp_diastolic_r ?? ''
    form.pouls      = vs.pulse         ?? ''
    form.respiration= vs.respiration   ?? ''
    form.spo2       = vs.spo_2         ?? ''
    form.taille     = vs.height        ?? ''
    form.poids      = vs.weights       ?? ''
    form.bmi        = vs.bmi           ?? ''
  }

  // Notes ADT (champs cliniques)
  const adtMap = {}
  ;(apiData.objadtnotes ?? []).forEach(n => { adtMap[n.adt_note_template_id] = n.adt_notes })
  form.motifConsultation  = adtMap[TID.motifConsultation]  ?? ''
  form.evenement          = adtMap[TID.evenement]          ?? ''
  form.histoireMaladie    = adtMap[TID.histoireMaladie]    ?? ''
  form.etatGeneral        = adtMap[TID.etatGeneral]        ?? ''
  form.signesFonctionnels = adtMap[TID.signesFonctionnels] ?? ''
  form.signesPhysiques    = adtMap[TID.signesPhysiques]    ?? ''
  form.discussion         = adtMap[TID.discussion]         ?? ''
  form.conduiteATenir     = adtMap[TID.conduiteATenir]     ?? ''
  form.prochaineVisite    = adtMap[TID.prochaineVisite]    ?? ''
  form.conseils           = adtMap[TID.conseils]           ?? ''
  try {
    if (adtMap[TID.snomed]) { const s = JSON.parse(adtMap[TID.snomed]); form.snomed1 = s.code ?? ''; form.snomed2 = s.label ?? '' }
    if (adtMap[TID.cim])    { const c = JSON.parse(adtMap[TID.cim]);    form.cim1    = c.code ?? ''; form.cim2    = c.label ?? '' }
  } catch {}

  // Notes patient (antécédents)
  const patMap = {}
  ;(apiData.objpatientnotes ?? []).forEach(n => { patMap[n.adt_note_template_id] = n.patient_notes })
  form.atcdChirurgicaux = patMap[TID.atcdChirurgicaux] ?? ''
  form.atcdMedicaux     = patMap[TID.atcdMedicaux]     ?? ''
  form.histoireSociale  = patMap[TID.histoireSociale]  ?? ''
  form.atcdFamiliaux    = patMap[TID.atcdFamiliaux]    ?? ''
  form.allergies        = patMap[TID.allergies]        ?? ''
  form.vaccinations     = patMap[TID.vaccinations]     ?? ''

  // Médicaments
  form.medicaments = (apiData.objmedication_v ?? []).map(m => ({
    id:         uid(),
    medicament: m.item_name    ?? '',
    remarques:  m.doctor_notes ?? '',
    generique:  false,
  }))

  // Traitement habituel (long term)
  form.traitementHabituel = (apiData.objlongtermmedication ?? []).map(m => ({
    id:         uid(),
    medicament: m.item_name    ?? '',
    remarques:  m.doctor_notes ?? '',
  }))

  // Procédures → split par procedure_type
  const procs = apiData.objprocedures_v ?? []
  form.imagerie = procs
    .filter(p => p.procedure_type === 'IMAGERIE')
    .map(p => ({ id: uid(), imagerie: p.procedure_name ?? '', remarques: p.result ?? '' }))
  form.bilansSpeciaux = procs
    .filter(p => p.procedure_type === 'BILAN')
    .map(p => ({ id: uid(), type_bilan: p.procedure_name ?? '', remarques: p.result ?? '' }))
  form.procedures = procs
    .filter(p => p.procedure_type === 'CLINIQUE' || !['IMAGERIE','BILAN','LAB'].includes(p.procedure_type))
    .map(p => ({ id: uid(), nom_procedure: p.procedure_name ?? '', remarques: p.description ?? '' }))

  // Examens labo
  form.laboratoire = (apiData.objlabprocedures_v ?? []).map(l => ({
    id:          uid(),
    laboratoire: l.lab_test_name ?? '',
    remarques:   l.result        ?? '',
  }))

  return form
}

// ─── Conversion état formulaire → payload API ────────────────────────────────

function formToApi(data) {
  const adtNotes = []
  const patNotes = []

  const addAdt = (templateId, value) => {
    if (value && String(value).trim()) adtNotes.push({ adt_notes: String(value).trim(), adt_note_template_id: templateId })
  }
  const addPat = (templateId, value) => {
    if (value && String(value).trim()) patNotes.push({ patient_notes: String(value).trim(), adt_note_template_id: templateId })
  }

  addAdt(TID.motifConsultation,  data.motifConsultation)
  addAdt(TID.evenement,          data.evenement)
  addAdt(TID.histoireMaladie,    data.histoireMaladie)
  addAdt(TID.etatGeneral,        data.etatGeneral)
  addAdt(TID.signesFonctionnels, data.signesFonctionnels)
  addAdt(TID.signesPhysiques,    data.signesPhysiques)
  addAdt(TID.discussion,         data.discussion)
  addAdt(TID.conduiteATenir,     data.conduiteATenir)
  addAdt(TID.prochaineVisite,    data.prochaineVisite)
  addAdt(TID.conseils,           data.conseils)
  if (data.snomed1 || data.snomed2) addAdt(TID.snomed, JSON.stringify({ code: data.snomed1, label: data.snomed2 }))
  if (data.cim1    || data.cim2)    addAdt(TID.cim,    JSON.stringify({ code: data.cim1,    label: data.cim2    }))

  addPat(TID.atcdChirurgicaux, data.atcdChirurgicaux)
  addPat(TID.atcdMedicaux,     data.atcdMedicaux)
  addPat(TID.histoireSociale,  data.histoireSociale)
  addPat(TID.atcdFamiliaux,    data.atcdFamiliaux)
  addPat(TID.allergies,        data.allergies)
  addPat(TID.vaccinations,     data.vaccinations)

  // Médicaments prescription
  const medications = (data.medicaments ?? [])
    .filter(m => m.medicament?.trim())
    .map(m => ({ item_name: m.medicament.trim(), doctor_notes: m.remarques ?? '' }))

  // Traitement habituel → long_term_meds
  const longTermMeds = (data.traitementHabituel ?? [])
    .filter(m => m.medicament?.trim())
    .map(m => ({ item_name: m.medicament.trim(), doctor_notes: m.remarques ?? '' }))

  // Imagerie → procedures avec type IMAGERIE
  const procsImagerie = (data.imagerie ?? [])
    .filter(p => p.imagerie?.trim())
    .map(p => ({ procedure_name: p.imagerie.trim(), procedure_type: 'IMAGERIE', result: p.remarques ?? '' }))

  // Bilans spéciaux → procedures avec type BILAN
  const procsBilan = (data.bilansSpeciaux ?? [])
    .filter(p => p.type_bilan?.trim())
    .map(p => ({ procedure_name: p.type_bilan.trim(), procedure_type: 'BILAN', result: p.remarques ?? '' }))

  // Procédures cliniques libres
  const procsCliniques = (data.procedures ?? [])
    .filter(p => p.nom_procedure?.trim())
    .map(p => ({ procedure_name: p.nom_procedure.trim(), procedure_type: 'CLINIQUE', description: p.remarques ?? '' }))

  const procedures = [...procsImagerie, ...procsBilan, ...procsCliniques]

  // Examens labo
  const labProcedures = (data.laboratoire ?? [])
    .filter(l => l.laboratoire?.trim())
    .map(l => ({ lab_test_name: l.laboratoire.trim(), result: l.remarques ?? '' }))

  // Signes vitaux
  const vitalsigns = {
    temperature_f:  data.tempF       || null,
    temperature_c:  data.tempC       || null,
    bp_systolic_l:  data.taGaucheS   || null,
    bp_diastolic_l: data.taGaucheD   || null,
    bp_systolic_r:  data.taDroiteS   || null,
    bp_diastolic_r: data.taDroiteD   || null,
    pulse:          data.pouls        || null,
    respiration:    data.respiration  || null,
    spo_2:          data.spo2         || null,
    height:         data.taille       || null,
    weights:        data.poids        || null,
    bmi:            data.bmi          || null,
  }
  // Ne pas envoyer si tous les champs sont vides
  const hasVitaux = Object.values(vitalsigns).some(v => v !== null && v !== '')

  return {
    vitalsigns:    hasVitaux ? vitalsigns : undefined,
    adt_notes:     adtNotes,
    patient_notes: patNotes,
    medications,
    procedures,
    lab_procedures: labProcedures,
    long_term_meds: longTermMeds,
  }
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

  // adt_id : depuis la navigation ou le patient passé en prop
  const adtId = location.state?.adt_id || propPatient?.adt_id || patient?.adt_id || null

  const [data,    setData]    = useState(INIT)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  // ── Modaux toolbar ────────────────────────────────────────────────────────
  const [showOrdonnance,  setShowOrdonnance]  = useState(false)
  const [showPaiement,    setShowPaiement]    = useState(false)
  const [showHistorique,  setShowHistorique]  = useState(false)
  const [showTransfert,   setShowTransfert]   = useState(false)
  const [showFiches,      setShowFiches]      = useState(false)
  const [showMatrix,      setShowMatrix]      = useState(false)
  const [showVitaux,      setShowVitaux]      = useState(false)

  const handleAction = action => {
    if (action === 'ordonnance') setShowOrdonnance(true)
    if (action === 'paiement')   setShowPaiement(true)
    if (action === 'historique') setShowHistorique(true)
    if (action === 'transfert')  setShowTransfert(true)
    if (action === 'fiches')     setShowFiches(true)
    if (action === 'matrix')     setShowMatrix(true)
    if (action === 'vitaux')     setShowVitaux(true)
  }

  const onChange = useCallback(d => setData(d), [])

  // ── Chargement des données existantes au montage ──────────────────────────
  useEffect(() => {
    if (!adtId) return
    setLoading(true)
    consultationApi.charger(adtId)
      .then(r => {
        const apiData = r.data?.data
        if (apiData) setData(apiToForm(apiData))
      })
      .catch(() => {/* pas encore de consultation = formulaire vierge */})
      .finally(() => setLoading(false))
  }, [adtId])

  // ── Sauvegarde vers l'API ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!adtId) {
      setSaveErr("Aucune visite sélectionnée (adt_id manquant). Veuillez ouvrir la consultation depuis la salle d'attente.")
      return
    }
    setSaving(true)
    setSaveErr(null)
    try {
      const payload = formToApi(data)
      await consultationApi.sauvegarder(adtId, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde'
      setSaveErr(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => propOnClose ? propOnClose() : navigate(-1)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      <Toolbar onSave={handleSave} onClose={handleClose} saving={saving} saved={saved} onAction={handleAction} />

      {/* ── Modaux Toolbar ── */}
      {showOrdonnance && (
        <OrdonnanceModal patient={patient} adtId={adtId} onClose={() => setShowOrdonnance(false)} />
      )}
      {showPaiement && (
        <PaiementModal patient={patient} adtId={adtId} onClose={() => setShowPaiement(false)} />
      )}
      {showHistorique && (
        <HistoriqueConsultationsModal patient={patient} onClose={() => setShowHistorique(false)} />
      )}
      {showTransfert && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowTransfert(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <TransfertModal
              onClose={() => setShowTransfert(false)}
              onSaved={() => setShowTransfert(false)}
              showToast={showToast}
              defaultPatientId={patient?.patient_id || patient?.id || ''}
              defaultPatientName={
                patient?.nom_complet
                || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
              }
            />
          </div>
        </div>
      )}

      {showFiches && (
        <FicheAttModal
          onClose={() => setShowFiches(false)}
          showToast={showToast}
          patientId={patient?.patient_id || patient?.id || patient?.code_patient || ''}
          patientName={
            patient?.nom_complet
            || `${patient?.prenom || patient?.first_name || ''} ${patient?.nom || patient?.last_name || ''}`.trim()
            || 'Patient'
          }
          adtId={adtId}
        />
      )}

      {showMatrix && (
        <MatrixModal
          patient={patient}
          adtId={adtId}
          onClose={() => setShowMatrix(false)}
        />
      )}

      {showVitaux && (
        <VitauxModal
          patient={patient}
          adtId={adtId}
          onClose={() => setShowVitaux(false)}
        />
      )}

      {/* Bandeau d'erreur */}
      {saveErr && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#dc2626' }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{saveErr}</span>
          <button onClick={() => setSaveErr(null)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Bandeau chargement */}
      {loading && (
        <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '6px 20px', fontSize: 12, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #93c5fd', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Chargement de la consultation…
        </div>
      )}

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
