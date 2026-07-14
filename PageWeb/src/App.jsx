import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  fallbackAbout, fallbackPartenaires, fallbackServices,
  fallbackSlides, fallbackSpecialistes, fallbackTheme,
  fallbackTestimonials, fallbackFAQ,
} from './data/fallbackData'
import { publicApi, storageUrl, getCachedPrefs } from './api/publicApi'

/* ─── helpers ──────────────────────────────────────────── */
function normalizeList(res, fb) {
  if (!res) return fb
  if (Array.isArray(res))       return res.length      ? res           : fb
  if (Array.isArray(res?.data)) return res.data.length ? res.data      : fb
  if (Array.isArray(res?.data?.data)) return res.data.data.length ? res.data.data : fb
  return fb
}
const initials = (n = '') => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

/* ─── hook theme : localStorage instantané + refresh API ────────────────── */
function useThemePrefs() {
  const cached = getCachedPrefs()
  const [theme, setTheme] = useState(cached ? { ...fallbackTheme, ...cached } : fallbackTheme)
  useEffect(() => {
    publicApi.preferences()
      .then(res => setTheme({ ...fallbackTheme, ...(res?.data || res) }))
      .catch(() => {})
  }, [])
  return theme
}

/* ─── cache pages actives (chargées une seule fois) ─────── */
let _pagesCache = null
let _pagesFetching = null
function useActivePages() {
  const [pages, setPages] = useState(_pagesCache || [])
  useEffect(() => {
    if (_pagesCache) { setPages(_pagesCache); return }
    if (!_pagesFetching) {
      _pagesFetching = publicApi.pages()
        .then(res => { _pagesCache = normalizeList(res, []); return _pagesCache })
        .catch(() => { _pagesCache = []; return [] })
    }
    _pagesFetching.then(p => setPages(p))
  }, [])
  return pages
}

/* ─── nav links ─────────────────────────────────────────── */
const NAV = [
  { href: '/',        label: 'Accueil' },
  { href: '/#about',  label: 'À propos' },
  {
    label: 'Services', href: '/#services',
    children: [
      { href: '/services/medecine',          label: 'Médecine' },
      { href: '/services/petite-chirurgie',  label: 'Petite chirurgie' },
      { href: '/services/femme-mere-enfant', label: 'Femme mère et enfant' },
      { href: '/services/personnes-agees',   label: 'Personnes âgées' },
      { href: '/services/laboratoire',       label: 'Laboratoire' },
      { href: '/services/pharmacie',         label: 'Pharmacie' },
    ],
  },
  {
    label: 'Ma Santé', href: '/#sante',
    children: [
      { href: '/sante/actualite',         label: 'Actualité' },
      { href: '/sante/espace-thematique', label: 'Espace thématique' },
      { href: '/sante/prevention',        label: 'Prévention et santé publique' },
    ],
  },
  {
    label: 'Pages', href: '/#partenaires',
    children: [
      { href: '/partenaires', label: 'Partenaires' },
      {
        label: 'Formations',
        children: [
          { href: '/formations/ide-sage-femme', label: 'Stagiaire IDE / Sage-Femme' },
          { href: '/formations/aide-infirmier', label: 'Aide infirmier' },
        ],
      },
      {
        label: 'Patient / Usager',
        children: [
          { href: '/patient/sejour',       label: 'Votre séjour' },
          { href: '/patient/droits',       label: 'Vos droits' },
          { href: '/patient/associations', label: 'Les associations partenaires' },
          { href: '/patient/demarches',    label: 'Vos démarches en ligne' },
        ],
      },
      {
        label: 'Payer en ligne',
        children: [
          { href: '/payer/wave',         label: 'Paiement par Wave' },
          { href: '/payer/orange-money', label: 'Orange Money' },
          { href: '/payer/especes',      label: 'Espèces' },
        ],
      },
    ],
  },
  { href: '/#contact', label: 'Contact' },
]

/* ─── pages config ───────────────────────────────────────── */
const PAGES_CONFIG = {
  '/services/medecine': {
    title: 'Médecine Générale', tag: 'Services médicaux', icon: '🩺',
    subtitle: 'Consultations médicales générales pour tous les patients, quel que soit l\'âge ou la situation.',
    description: 'Notre service de médecine générale assure la prise en charge globale de votre santé. Nos médecins généralistes vous reçoivent pour des consultations de routine, de suivi de maladies chroniques ou pour des problèmes aigus. Chaque patient bénéficie d\'une écoute attentive et d\'un traitement adapté à sa situation personnelle.',
    features: [
      { icon: '🔍', title: 'Diagnostic', desc: 'Évaluation médicale approfondie avec examen clinique complet et bilan orienté.' },
      { icon: '💊', title: 'Traitement', desc: 'Prescription adaptée et suivi thérapeutique personnalisé selon chaque patient.' },
      { icon: '📋', title: 'Dossier médical', desc: 'Gestion de votre dossier médical numérique centralisé pour un meilleur suivi.' },
      { icon: '🔗', title: 'Orientation', desc: 'Référencement vers les spécialistes ou services adaptés selon vos besoins.' },
    ],
    steps: [
      { num: '01', title: 'Prise de rendez-vous', desc: 'Contactez-nous par téléphone, en ligne ou en vous présentant directement à l\'accueil.' },
      { num: '02', title: 'Consultation', desc: 'Le médecin réalise un examen clinique complet et échange avec vous sur vos symptômes.' },
      { num: '03', title: 'Diagnostic & prescription', desc: 'Établissement du diagnostic et remise de l\'ordonnance ou demande d\'examens complémentaires.' },
      { num: '04', title: 'Suivi', desc: 'Programmation des consultations de suivi pour évaluer l\'évolution de votre état de santé.' },
    ],
    details: [
      { icon: '⏰', label: 'Horaires', value: 'Lun – Ven : 8h00 – 18h00 | Sam : 8h00 – 13h00' },
      { icon: '💳', label: 'Tarification', value: 'Consultations remboursables par les assurances partenaires' },
      { icon: '📋', label: 'Documents', value: 'Carte d\'identité, carnet de santé, ordonnances précédentes' },
      { icon: '🚨', label: 'Urgences', value: 'Accueil sans rendez-vous pour les urgences médicales' },
    ],
  },

  '/services/petite-chirurgie': {
    title: 'Petite Chirurgie', tag: 'Services médicaux', icon: '⚕️',
    subtitle: 'Interventions chirurgicales mineures réalisées en ambulatoire, sans hospitalisation prolongée.',
    description: 'La petite chirurgie regroupe l\'ensemble des interventions chirurgicales mineures pouvant être réalisées sous anesthésie locale, en consultation ou en hospitalisation très courte. Notre équipe chirurgicale expérimentée vous garantit une prise en charge sécurisée et un retour rapide à domicile le jour même.',
    features: [
      { icon: '🩹', title: 'Sutures', desc: 'Prise en charge des plaies et réalisation de sutures cutanées.' },
      { icon: '✂️', title: 'Ablation', desc: 'Ablation de petites lésions cutanées : kystes, lipomes, verrues.' },
      { icon: '💉', title: 'Infiltrations', desc: 'Injections locales à visée antalgique ou anti-inflammatoire.' },
      { icon: '🏥', title: 'Ambulatoire', desc: 'Retour à domicile le jour même dans la grande majorité des cas.' },
    ],
    steps: [
      { num: '01', title: 'Consultation préopératoire', desc: 'Évaluation médicale, bilan préopératoire et information complète sur l\'intervention.' },
      { num: '02', title: 'Préparation', desc: 'Instructions pré-opératoires selon le type d\'intervention (jeûne, arrêt médicaments, etc.).' },
      { num: '03', title: 'Intervention', desc: 'Réalisation du geste chirurgical sous anesthésie locale dans des conditions stériles.' },
      { num: '04', title: 'Récupération & suivi', desc: 'Surveillance post-opératoire et planification des soins de suivi à domicile.' },
    ],
    details: [
      { icon: '⏱️', label: 'Durée', value: 'La plupart des interventions durent 15 à 45 minutes' },
      { icon: '🏠', label: 'Ambulatoire', value: 'Retour à domicile le jour même de l\'intervention' },
      { icon: '📋', label: 'Prérequis', value: 'Consultation préalable obligatoire avant toute intervention' },
      { icon: '🔒', label: 'Sécurité', value: 'Bloc opératoire aux normes avec équipements stérilisés' },
    ],
  },

  '/services/femme-mere-enfant': {
    title: 'Femme, Mère et Enfant', tag: 'Services médicaux', icon: '👩‍👧',
    subtitle: 'Un accompagnement médical dédié à la santé de la femme, de la grossesse et de l\'enfant.',
    description: 'Notre pôle Femme-Mère-Enfant offre une prise en charge complète et personnalisée à chaque étape de la vie féminine et infantile. Du suivi gynécologique au suivi pédiatrique, en passant par l\'accompagnement de la grossesse et du post-partum, notre équipe pluridisciplinaire est à vos côtés avec bienveillance et professionnalisme.',
    features: [
      { icon: '🤰', title: 'Suivi de grossesse', desc: 'Consultations prénatales, échographies et préparation à l\'accouchement.' },
      { icon: '👶', title: 'Pédiatrie', desc: 'Suivi de la croissance et de la santé de l\'enfant de 0 à 15 ans.' },
      { icon: '🌸', title: 'Gynécologie', desc: 'Consultations gynécologiques, dépistage et suivi de la santé féminine.' },
      { icon: '🍼', title: 'Post-partum', desc: 'Accompagnement de la mère et du nouveau-né après la naissance.' },
    ],
    steps: [
      { num: '01', title: 'Premier contact', desc: 'Consultation initiale pour établir le bilan de santé et définir le suivi adapté à votre situation.' },
      { num: '02', title: 'Suivi personnalisé', desc: 'Consultations régulières selon un calendrier adapté (grossesse, pédiatrie, gynéco).' },
      { num: '03', title: 'Examens complémentaires', desc: 'Échographies, bilans biologiques et autres examens selon les besoins identifiés.' },
      { num: '04', title: 'Accompagnement continu', desc: 'Disponibilité de l\'équipe pour répondre à toutes vos questions entre les consultations.' },
    ],
    details: [
      { icon: '⏰', label: 'Consultations', value: 'Sur rendez-vous, du lundi au samedi' },
      { icon: '🤰', label: 'Maternité', value: 'Suivi complet de la grossesse jusqu\'à l\'accouchement' },
      { icon: '👶', label: 'Pédiatrie', value: 'Enfants de 0 à 15 ans acceptés' },
      { icon: '🌸', label: 'Gynécologie', value: 'Dépistages, contraception, ménopause' },
    ],
  },

  '/services/personnes-agees': {
    title: 'Personnes Âgées', tag: 'Services médicaux', icon: '👴',
    subtitle: 'Une prise en charge globale et bienveillante dédiée aux patients âgés et à leurs familles.',
    description: 'Notre service dédié aux personnes âgées propose une évaluation gériatrique globale et une prise en charge pluridisciplinaire. Nous plaçons la qualité de vie, le maintien de l\'autonomie et le respect de la dignité au cœur de chaque accompagnement. Notre équipe travaille en étroite collaboration avec les familles et les aidants.',
    features: [
      { icon: '❤️', title: 'Suivi gériatrique', desc: 'Évaluation globale de la santé du senior, incluant fragilité et autonomie.' },
      { icon: '💊', title: 'Polymédication', desc: 'Révision et optimisation des traitements médicamenteux complexes.' },
      { icon: '🏡', title: 'Maintien à domicile', desc: 'Coordination des soins pour favoriser le maintien au domicile.' },
      { icon: '🤝', title: 'Accompagnement', desc: 'Soutien à la famille et aux aidants dans leur rôle de soignant.' },
    ],
    steps: [
      { num: '01', title: 'Évaluation gériatrique', desc: 'Bilan complet : santé physique, cognitive, autonomie et situation sociale.' },
      { num: '02', title: 'Plan de soins', desc: 'Élaboration d\'un plan personnalisé avec l\'équipe pluridisciplinaire et la famille.' },
      { num: '03', title: 'Mise en œuvre', desc: 'Coordination des intervenants : médecins, infirmiers, kinésithérapeutes, assistante sociale.' },
      { num: '04', title: 'Réévaluation régulière', desc: 'Ajustement du plan de soins selon l\'évolution de l\'état du patient.' },
    ],
    details: [
      { icon: '🏠', label: 'Domicile', value: 'Soins et visites à domicile disponibles sur demande' },
      { icon: '👨‍👩‍👧', label: 'Famille', value: 'Rencontres et accompagnement des aidants familiaux' },
      { icon: '📋', label: 'Dossier', value: 'Dossier médical partagé avec tous les intervenants' },
      { icon: '🚑', label: 'Urgences', value: 'Ligne prioritaire pour les urgences des personnes âgées' },
    ],
  },

  '/services/laboratoire': {
    title: 'Laboratoire d\'Analyses', tag: 'Services médicaux', icon: '🔬',
    subtitle: 'Analyses biologiques et examens de laboratoire réalisés avec des équipements modernes.',
    description: 'Notre laboratoire d\'analyses médicales dispose d\'équipements de pointe et d\'une équipe de biologistes qualifiés. Nous réalisons un large spectre d\'analyses biologiques avec des délais de rendu de résultats optimisés. Vos résultats peuvent être récupérés directement ou transmis à votre médecin traitant.',
    features: [
      { icon: '🩸', title: 'Analyses de sang', desc: 'Numération, bilan biochimique, marqueurs infectieux et bien plus.' },
      { icon: '🧪', title: 'Microbiologie', desc: 'Cultures bactériennes, antibiogrammes et analyses parasitologiques.' },
      { icon: '🔬', title: 'Anatomopathologie', desc: 'Examen histologique des biopsies et prélèvements tissulaires.' },
      { icon: '⚡', title: 'Résultats rapides', desc: 'Résultats disponibles dans les meilleurs délais avec transmission au médecin.' },
    ],
    steps: [
      { num: '01', title: 'Ordonnance', desc: 'Présentez l\'ordonnance de votre médecin pour la prescription des examens.' },
      { num: '02', title: 'Prélèvement', desc: 'Réalisation du prélèvement sanguin, urinaire ou autre selon le bilan prescrit.' },
      { num: '03', title: 'Analyse', desc: 'Traitement des échantillons au laboratoire par notre équipe de biologistes.' },
      { num: '04', title: 'Résultats', desc: 'Remise des résultats au patient et/ou transmission directe au médecin prescripteur.' },
    ],
    details: [
      { icon: '⏰', label: 'Horaires prélèvements', value: 'Lun – Sam : 7h00 – 11h00 (à jeun de préférence)' },
      { icon: '⚡', label: 'Délai résultats', value: 'Biochimie : 2h | Bactériologie : 24-48h | Anapath : 5-7j' },
      { icon: '🩹', label: 'Préparation', value: 'Jeûne de 8h requis pour certains bilans (glycémie, lipides)' },
      { icon: '💳', label: 'Prise en charge', value: 'Conventionné avec les principales assurances et mutuelles' },
    ],
  },

  '/services/pharmacie': {
    title: 'Pharmacie', tag: 'Services médicaux', icon: '💊',
    subtitle: 'Pharmacie hospitalière au service des patients et des professionnels de santé.',
    description: 'Notre pharmacie assure la dispensation des médicaments prescrits avec un conseil pharmaceutique de qualité. Notre équipe de pharmaciens veille à la sécurité de vos traitements, vérifie les interactions médicamenteuses et vous guide dans la bonne utilisation de vos médicaments pour une prise en charge optimale.',
    features: [
      { icon: '💊', title: 'Dispensation', desc: 'Délivrance des médicaments prescrits avec conseil pharmaceutique personnalisé.' },
      { icon: '🏥', title: 'Pharmacie hospitalière', desc: 'Gestion des médicaments pour les patients hospitalisés.' },
      { icon: '📦', title: 'Stock et traçabilité', desc: 'Gestion rigoureuse des stocks et traçabilité complète des médicaments.' },
      { icon: '🌿', title: 'Conseil', desc: 'Conseils sur les interactions médicamenteuses et la bonne utilisation.' },
    ],
    steps: [
      { num: '01', title: 'Présentation', desc: 'Présentez votre ordonnance médicale au guichet de la pharmacie.' },
      { num: '02', title: 'Vérification', desc: 'Le pharmacien vérifie la prescription et les éventuelles interactions médicamenteuses.' },
      { num: '03', title: 'Préparation', desc: 'Préparation et conditionnement soigneux de votre traitement.' },
      { num: '04', title: 'Conseil & délivrance', desc: 'Remise des médicaments avec explications sur leur utilisation correcte et sécurisée.' },
    ],
    details: [
      { icon: '⏰', label: 'Horaires', value: 'Lun – Ven : 8h00 – 19h00 | Sam : 8h00 – 15h00' },
      { icon: '💳', label: 'Prise en charge', value: 'Conventionné avec les assurances maladie partenaires' },
      { icon: '📋', label: 'Ordonnance', value: 'Obligatoire pour les médicaments sur prescription' },
      { icon: '🌿', label: 'Conseil libre', value: 'Conseil pharmaceutique gratuit sans rendez-vous' },
    ],
  },

  '/sante/actualite': {
    title: 'Actualité Santé', tag: 'Ma Santé', icon: '📰',
    subtitle: 'Les dernières informations et nouvelles du secteur de la santé pour rester informé.',
    description: 'Restez informé des dernières actualités du monde de la santé à travers notre espace dédié. Communiqués de notre établissement, avancées médicales, campagnes de sensibilisation — retrouvez ici toutes les informations pertinentes pour prendre soin de votre santé et celle de votre famille.',
    features: [
      { icon: '📢', title: 'Communiqués', desc: 'Communiqués officiels de notre établissement sur la santé publique.' },
      { icon: '🔬', title: 'Recherche médicale', desc: 'Avancées médicales et scientifiques en lien avec nos domaines d\'expertise.' },
      { icon: '📅', title: 'Événements santé', desc: 'Campagnes de sensibilisation, journées mondiales et dépistages gratuits.' },
      { icon: '📺', title: 'Médias & presse', desc: 'Interviews, reportages et interventions de nos professionnels de santé.' },
    ],
    steps: [
      { num: '01', title: 'Nos publications', desc: 'Articles rédigés régulièrement par notre équipe médicale sur les sujets de santé actuels.' },
      { num: '02', title: 'Événements à venir', desc: 'Calendrier des journées de sensibilisation et campagnes de dépistage gratuit.' },
      { num: '03', title: 'Conseils santé', desc: 'Fiches pratiques et guides de santé rédigés par nos professionnels.' },
      { num: '04', title: 'Newsletter', desc: 'Abonnez-vous à notre newsletter pour recevoir l\'actualité santé directement.' },
    ],
    details: [
      { icon: '📅', label: 'Mise à jour', value: 'Contenu actualisé chaque semaine par notre équipe' },
      { icon: '📧', label: 'Newsletter', value: 'Inscription disponible à l\'accueil ou par email' },
      { icon: '📱', label: 'Réseaux sociaux', value: 'Suivez-nous pour ne rien manquer' },
      { icon: '✅', label: 'Sources', value: 'Informations validées par notre équipe médicale' },
    ],
  },

  '/sante/espace-thematique': {
    title: 'Espace Thématique', tag: 'Ma Santé', icon: '📚',
    subtitle: 'Ressources éducatives et thématiques pour mieux comprendre votre santé.',
    description: 'L\'espace thématique est un lieu de ressources éducatives consacré aux grandes problématiques de santé. Diabète, hypertension, santé mentale, nutrition, activité physique — chaque thème est abordé avec rigueur et accessibilité pour vous aider à mieux comprendre et gérer votre santé au quotidien.',
    features: [
      { icon: '❤️', title: 'Maladies chroniques', desc: 'Comprendre et vivre avec le diabète, l\'hypertension, l\'asthme.' },
      { icon: '🧠', title: 'Santé mentale', desc: 'Ressources sur le stress, la dépression et le bien-être psychologique.' },
      { icon: '🍎', title: 'Nutrition', desc: 'Conseils alimentaires et guides pratiques pour une alimentation équilibrée.' },
      { icon: '🏃', title: 'Sport & santé', desc: 'Bienfaits de l\'activité physique et recommandations adaptées à chacun.' },
    ],
    steps: [
      { num: '01', title: 'Comprendre', desc: 'Accédez à des fiches explicatives sur les principales maladies et conditions de santé.' },
      { num: '02', title: 'Se préparer', desc: 'Guides pratiques pour préparer vos consultations et poser les bonnes questions.' },
      { num: '03', title: 'Agir', desc: 'Plans d\'action et recommandations concrètes pour améliorer votre hygiène de vie.' },
      { num: '04', title: 'Partager', desc: 'Ressources à partager avec vos proches pour sensibiliser tout votre entourage.' },
    ],
    details: [
      { icon: '📚', label: 'Thèmes', value: 'Plus de 20 thématiques de santé couvertes' },
      { icon: '✅', label: 'Validation', value: 'Tous les contenus validés par notre équipe médicale' },
      { icon: '🌍', label: 'Accessibilité', value: 'Contenus disponibles en français et langues locales' },
      { icon: '🆓', label: 'Accès', value: 'Ressources gratuites accessibles à tous' },
    ],
  },

  '/sante/prevention': {
    title: 'Prévention et Santé Publique', tag: 'Ma Santé', icon: '🛡️',
    subtitle: 'Programmes de prévention et actions de santé publique pour protéger toute la communauté.',
    description: 'La prévention est au cœur de notre mission de santé publique. Nous déployons des programmes de vaccination, de dépistage et de sensibilisation pour prévenir les maladies avant qu\'elles ne s\'installent. Notre équipe intervient dans les écoles, les entreprises et les communautés pour promouvoir des comportements sains.',
    features: [
      { icon: '💉', title: 'Vaccination', desc: 'Programme de vaccination selon le calendrier vaccinal national mis à jour.' },
      { icon: '🔎', title: 'Dépistage', desc: 'Campagnes de dépistage précoce du cancer et des maladies chroniques.' },
      { icon: '🌍', title: 'Santé communautaire', desc: 'Actions de terrain dans les quartiers, écoles et zones rurales.' },
      { icon: '📣', title: 'Sensibilisation', desc: 'Ateliers d\'éducation à la santé ouverts à tous, animés par nos professionnels.' },
    ],
    steps: [
      { num: '01', title: 'Identification des risques', desc: 'Identification des risques sanitaires prioritaires dans la communauté desservie.' },
      { num: '02', title: 'Programme adapté', desc: 'Élaboration de programmes de prévention ciblés selon les besoins locaux.' },
      { num: '03', title: 'Actions terrain', desc: 'Déploiement des actions : campagnes, ateliers, visites en communauté.' },
      { num: '04', title: 'Évaluation', desc: 'Mesure de l\'impact et ajustement continu des programmes selon les résultats.' },
    ],
    details: [
      { icon: '💉', label: 'Vaccination', value: 'Vaccins obligatoires et recommandés disponibles' },
      { icon: '📅', label: 'Dépistage', value: 'Journées de dépistage gratuit organisées régulièrement' },
      { icon: '🏫', label: 'Interventions', value: 'Écoles, entreprises et communautés desservies' },
      { icon: '🆓', label: 'Gratuité', value: 'Certains programmes de prévention entièrement gratuits' },
    ],
  },

  '/partenaires': {
    title: 'Nos Partenaires', tag: 'Pages', icon: '🤝',
    subtitle: 'Un réseau d\'établissements, d\'assurances et d\'institutions partenaires pour un meilleur accès aux soins.',
    description: 'SEN-MED s\'appuie sur un réseau solide de partenaires institutionnels, associatifs et privés pour offrir la meilleure prise en charge possible à ses patients. Ces collaborations permettent d\'améliorer l\'accès aux soins, de renforcer la qualité des services et de proposer des solutions adaptées à chaque situation.',
    features: [
      { icon: '🏥', title: 'Établissements de santé', desc: 'Hôpitaux, cliniques et centres de santé avec lesquels nous collaborons étroitement.' },
      { icon: '🛡️', title: 'Assurances & mutuelles', desc: 'Couvertures santé acceptées pour faciliter votre prise en charge financière.' },
      { icon: '🌐', title: 'ONG & institutions', desc: 'Partenariats avec des organisations nationales et internationales.' },
      { icon: '🎓', title: 'Universités', desc: 'Collaboration active avec les facultés de médecine et instituts de formation.' },
    ],
    steps: [
      { num: '01', title: 'Assurances acceptées', desc: 'Nous travaillons avec les principales compagnies d\'assurance maladie du Sénégal.' },
      { num: '02', title: 'Référencement', desc: 'Possibilité de référencer vos patients vers nos services spécialisés.' },
      { num: '03', title: 'Formations communes', desc: 'Organisation de formations et conférences médicales en collaboration.' },
      { num: '04', title: 'Devenir partenaire', desc: 'Contactez-nous pour explorer une collaboration avec notre établissement.' },
    ],
    details: [
      { icon: '🛡️', label: 'Assurances', value: 'Conventionné avec les principales assurances maladie' },
      { icon: '🏥', label: 'Réseau', value: 'Plus de 15 établissements partenaires au Sénégal' },
      { icon: '🌍', label: 'International', value: 'Partenariats avec des ONG et institutions internationales' },
      { icon: '📞', label: 'Partenariat', value: 'Contactez-nous pour tout projet de collaboration' },
    ],
  },

  '/formations/ide-sage-femme': {
    title: 'Stagiaire IDE / Sage-Femme', tag: 'Formations', icon: '🎓',
    subtitle: 'Accueil et encadrement des stagiaires infirmiers diplômés d\'État et sages-femmes en formation.',
    description: 'Notre établissement accueille des étudiants en soins infirmiers et en maïeutique dans le cadre de leurs stages cliniques obligatoires. Les stagiaires bénéficient d\'un encadrement de qualité par des tuteurs expérimentés dans un environnement de soins diversifié et formateur, propice au développement des compétences.',
    features: [
      { icon: '📋', title: 'Dossier de stage', desc: 'Constitution du dossier de candidature pour le stage clinique.' },
      { icon: '👩‍⚕️', title: 'Encadrement tutoral', desc: 'Suivi personnalisé par des tuteurs expérimentés tout au long du stage.' },
      { icon: '📚', title: 'Objectifs pédagogiques', desc: 'Programme structuré aligné sur les compétences du référentiel de formation.' },
      { icon: '📝', title: 'Évaluation', desc: 'Évaluation formative et sommative des compétences professionnelles acquises.' },
    ],
    steps: [
      { num: '01', title: 'Candidature', desc: 'Envoyez votre dossier (lettre de motivation, convention, CV) à la direction des soins.' },
      { num: '02', title: 'Validation', desc: 'Étude de votre dossier et confirmation écrite de l\'acceptation du stage.' },
      { num: '03', title: 'Accueil', desc: 'Journée d\'intégration : présentation de l\'établissement, des équipes et du règlement.' },
      { num: '04', title: 'Stage & évaluation', desc: 'Déroulement du stage avec suivi régulier et évaluation des compétences acquises.' },
    ],
    details: [
      { icon: '📅', label: 'Durée', value: 'Stages de 4 à 16 semaines selon le niveau d\'études' },
      { icon: '📋', label: 'Dossier requis', value: 'Convention de stage, lettre de motivation, CV, carte étudiant' },
      { icon: '👩‍⚕️', label: 'Encadrant', value: 'Un tuteur référent désigné par service d\'accueil' },
      { icon: '🏥', label: 'Services', value: 'Médecine générale, maternité, urgences, laboratoire' },
    ],
  },

  '/formations/aide-infirmier': {
    title: 'Aide Infirmier', tag: 'Formations', icon: '🩺',
    subtitle: 'Formation pratique pour les aides-infirmiers en milieu hospitalier et de soins.',
    description: 'La formation d\'aide-infirmier au sein de notre établissement offre une immersion professionnelle complète dans les soins de base. Les apprenants acquièrent des compétences pratiques essentielles sous la supervision directe d\'infirmiers diplômés, dans le respect des protocoles de soins et des règles d\'hygiène hospitalière.',
    features: [
      { icon: '🛏️', title: 'Soins de base', desc: 'Apprentissage des soins d\'hygiène, de confort et de nursing du patient.' },
      { icon: '💉', title: 'Techniques de soins', desc: 'Initiation aux techniques de soins infirmiers sous supervision directe.' },
      { icon: '🤝', title: 'Relation patient', desc: 'Communication bienveillante et accompagnement humain du patient.' },
      { icon: '📜', title: 'Attestation', desc: 'Délivrance d\'une attestation officielle de formation à l\'issue du parcours.' },
    ],
    steps: [
      { num: '01', title: 'Inscription', desc: 'Déposez votre dossier de candidature à la direction des soins infirmiers.' },
      { num: '02', title: 'Entretien', desc: 'Entretien de motivation avec le responsable pédagogique de la formation.' },
      { num: '03', title: 'Formation théorique', desc: 'Modules théoriques sur l\'hygiène, la sécurité et les gestes de soins de base.' },
      { num: '04', title: 'Pratique & certification', desc: 'Mise en pratique sur le terrain et délivrance de l\'attestation de formation.' },
    ],
    details: [
      { icon: '📅', label: 'Durée', value: 'Formation de 3 à 6 mois selon le programme choisi' },
      { icon: '📋', label: 'Prérequis', value: 'BFEM minimum, bonne condition physique, sens du service' },
      { icon: '💬', label: 'Renseignements', value: 'Se renseigner auprès de la direction pour les modalités' },
      { icon: '🏅', label: 'Certification', value: 'Attestation de formation délivrée par notre établissement' },
    ],
  },

  '/patient/sejour': {
    title: 'Votre Séjour', tag: 'Patient / Usager', icon: '🏥',
    subtitle: 'Tout ce que vous devez savoir pour préparer et vivre sereinement votre séjour dans notre établissement.',
    description: 'Nous nous engageons à rendre votre séjour le plus confortable et serein possible. De l\'admission à la sortie, notre équipe est présente à chaque étape pour vous accompagner et répondre à vos besoins. Voici tout ce que vous devez savoir pour préparer votre venue et vivre votre hospitalisation dans les meilleures conditions.',
    features: [
      { icon: '📋', title: 'Admission', desc: 'Procédures d\'admission, documents requis et formalités administratives d\'entrée.' },
      { icon: '🛏️', title: 'Hébergement', desc: 'Chambres individuelles et collectives équipées pour votre confort.' },
      { icon: '🍽️', title: 'Restauration', desc: 'Menus équilibrés, régimes spéciaux et horaires de repas adaptés.' },
      { icon: '👪', title: 'Visites', desc: 'Horaires de visite, règles d\'accès et conditions d\'accompagnement.' },
    ],
    steps: [
      { num: '01', title: 'Avant votre arrivée', desc: 'Rassemblez vos documents : pièce d\'identité, ordonnances, carnet de santé, attestation assurance.' },
      { num: '02', title: 'Admission', desc: 'Accueil à la réception, formalités administratives et orientation vers votre service.' },
      { num: '03', title: 'Pendant le séjour', desc: 'Prise en charge médicale et soins infirmiers selon votre plan de traitement.' },
      { num: '04', title: 'Sortie', desc: 'Consultation de sortie, remise des documents médicaux et organisation du suivi post-hospitalier.' },
    ],
    details: [
      { icon: '⏰', label: 'Visites', value: 'Chaque jour : 10h00 – 12h00 et 16h00 – 19h00' },
      { icon: '📋', label: 'Documents requis', value: 'CNI, carnet de santé, ordonnances, attestation assurance' },
      { icon: '🍽️', label: 'Repas', value: 'Servis à 7h30, 12h30 et 19h00 chaque jour' },
      { icon: '☎️', label: 'Standard', value: 'Joignable 24h/24 pour les familles des patients hospitalisés' },
    ],
  },

  '/patient/droits': {
    title: 'Vos Droits', tag: 'Patient / Usager', icon: '⚖️',
    subtitle: 'Connaissez vos droits en tant que patient et les engagements de notre établissement.',
    description: 'En tant que patient, vous bénéficiez de droits fondamentaux que notre établissement s\'engage à respecter et à défendre. Ces droits visent à garantir votre dignité, votre autonomie et la qualité de votre prise en charge. Nous vous encourageons à les connaître et à les exercer en toute liberté.',
    features: [
      { icon: '🔒', title: 'Confidentialité', desc: 'Protection absolue de vos données médicales et de votre vie privée.' },
      { icon: '📝', title: 'Consentement éclairé', desc: 'Droit à l\'information et consentement libre avant tout acte médical.' },
      { icon: '📁', title: 'Accès au dossier', desc: 'Droit de consulter et d\'obtenir une copie de votre dossier médical.' },
      { icon: '📣', title: 'Réclamations', desc: 'Procédures pour exprimer une plainte ou une insatisfaction en toute transparence.' },
    ],
    steps: [
      { num: '01', title: 'Droit à l\'information', desc: 'Vous avez le droit d\'être informé clairement sur votre état de santé et les traitements proposés.' },
      { num: '02', title: 'Consentement libre', desc: 'Tout acte médical nécessite votre consentement libre et éclairé. Vous pouvez le retirer à tout moment.' },
      { num: '03', title: 'Confidentialité', desc: 'Vos informations médicales sont strictement confidentielles et protégées par la loi.' },
      { num: '04', title: 'Réclamation', desc: 'En cas d\'insatisfaction, vous pouvez saisir la direction ou le médiateur de l\'établissement.' },
    ],
    details: [
      { icon: '📁', label: 'Dossier médical', value: 'Demande de copie possible sous 8 jours ouvrables' },
      { icon: '🤝', label: 'Médiateur', value: 'Médiateur médical disponible pour résoudre les litiges' },
      { icon: '📝', label: 'Consentement', value: 'Formulaire de consentement remis avant toute intervention' },
      { icon: '📞', label: 'Réclamations', value: 'Direction disponible lun – ven de 9h à 17h' },
    ],
  },

  '/patient/associations': {
    title: 'Les Associations Partenaires', tag: 'Patient / Usager', icon: '🤝',
    subtitle: 'Des associations engagées à vos côtés pour vous soutenir dans votre parcours de soins.',
    description: 'Notre établissement collabore avec de nombreuses associations qui apportent un soutien précieux aux patients et à leurs familles. Qu\'il s\'agisse d\'associations de patients, de structures d\'aide sociale ou d\'organisations de solidarité, ces partenaires complètent notre action médicale pour une prise en charge véritablement globale.',
    features: [
      { icon: '❤️', title: 'Soutien aux patients', desc: 'Associations d\'aide aux malades chroniques et à leurs familles.' },
      { icon: '🌍', title: 'Solidarité', desc: 'Réseaux de solidarité pour l\'accès aux soins des populations vulnérables.' },
      { icon: '🎗️', title: 'Pathologies spécifiques', desc: 'Associations dédiées au cancer, au diabète, à la santé mentale, etc.' },
      { icon: '📞', title: 'Contacts utiles', desc: 'Annuaire des associations partenaires et leurs coordonnées complètes.' },
    ],
    steps: [
      { num: '01', title: 'Identification', desc: 'L\'équipe soignante identifie les patients pouvant bénéficier d\'un soutien associatif.' },
      { num: '02', title: 'Orientation', desc: 'Mise en relation avec l\'association la plus adaptée à votre situation.' },
      { num: '03', title: 'Accompagnement', desc: 'Les bénévoles et professionnels associatifs vous accompagnent dans vos démarches.' },
      { num: '04', title: 'Suivi coordonné', desc: 'Coordination entre l\'équipe médicale et l\'association pour un suivi cohérent.' },
    ],
    details: [
      { icon: '🏢', label: 'Espace dédié', value: 'Espace associations disponible au sein de l\'établissement' },
      { icon: '📅', label: 'Permanences', value: 'Présence de bénévoles associatifs plusieurs jours par semaine' },
      { icon: '🤝', label: 'Réseau', value: 'Plus de 10 associations partenaires actives' },
      { icon: '📞', label: 'Contact', value: 'Renseignements à l\'accueil ou auprès de l\'assistante sociale' },
    ],
  },

  '/patient/demarches': {
    title: 'Vos Démarches en Ligne', tag: 'Patient / Usager', icon: '💻',
    subtitle: 'Simplifiez vos démarches administratives et médicales depuis chez vous.',
    description: 'Notre portail de démarches en ligne vous permet d\'effectuer vos principales formalités médicales et administratives depuis votre domicile. Prise de rendez-vous, accès à vos résultats, paiement de vos factures — tout est accessible 24h/24 et 7j/7 depuis votre smartphone ou ordinateur, en toute sécurité.',
    features: [
      { icon: '📅', title: 'Prise de RDV', desc: 'Réservez votre rendez-vous en ligne rapidement et en quelques clics.' },
      { icon: '📄', title: 'Ordonnances & résultats', desc: 'Accédez à vos ordonnances et résultats d\'analyses en ligne.' },
      { icon: '💳', title: 'Paiement sécurisé', desc: 'Réglez vos factures médicales en ligne de façon sécurisée.' },
      { icon: '📂', title: 'Dossier en ligne', desc: 'Consultez et téléchargez vos documents médicaux à tout moment.' },
    ],
    steps: [
      { num: '01', title: 'Inscription', desc: 'Créez votre compte patient sur notre portail avec votre numéro de dossier médical.' },
      { num: '02', title: 'Connexion sécurisée', desc: 'Accédez à votre espace personnel via un identifiant et mot de passe sécurisés.' },
      { num: '03', title: 'Vos démarches', desc: 'Effectuez vos démarches : RDV, paiements, téléchargement de documents médicaux.' },
      { num: '04', title: 'Suivi en temps réel', desc: 'Recevez des notifications par SMS ou email pour confirmer toutes vos actions.' },
    ],
    details: [
      { icon: '⏰', label: 'Disponibilité', value: '24h/24, 7j/7 depuis tout appareil connecté' },
      { icon: '🔒', label: 'Sécurité', value: 'Connexion sécurisée SSL, données entièrement cryptées' },
      { icon: '📱', label: 'Compatible', value: 'Smartphone, tablette et ordinateur' },
      { icon: '🆘', label: 'Aide technique', value: 'Support disponible en semaine de 8h à 17h' },
    ],
  },

  '/payer/wave': {
    title: 'Paiement par Wave', tag: 'Payer en ligne', icon: '📱',
    subtitle: 'Payez vos frais médicaux rapidement et en toute sécurité via Wave Mobile Money.',
    description: 'Wave est une solution de paiement mobile simple et rapide, très répandue au Sénégal. Pour régler vos frais médicaux via Wave, il vous suffit de scanner le QR code disponible à l\'accueil ou d\'effectuer un transfert vers notre numéro Wave dédié. Le paiement est instantané, sécurisé et sans frais supplémentaires.',
    features: [
      { icon: '📱', title: 'Simple & rapide', desc: 'Scannez le QR code ou entrez le numéro pour payer en quelques secondes.' },
      { icon: '🔒', title: 'Sécurisé', desc: 'Transactions cryptées et intégralement protégées par Wave.' },
      { icon: '📩', title: 'Reçu instantané', desc: 'Confirmation et reçu de paiement envoyés immédiatement par SMS.' },
      { icon: '💰', title: 'Sans frais', desc: 'Aucun frais supplémentaire pour les paiements Wave en établissement.' },
    ],
    steps: [
      { num: '01', title: 'Ouvrez Wave', desc: 'Lancez l\'application Wave sur votre smartphone (iOS ou Android).' },
      { num: '02', title: 'Envoi d\'argent', desc: 'Appuyez sur "Envoyer" et entrez notre numéro Wave ou scannez le QR code.' },
      { num: '03', title: 'Montant', desc: 'Saisissez le montant exact de votre facture médicale.' },
      { num: '04', title: 'Confirmation', desc: 'Validez la transaction et présentez votre SMS de confirmation à l\'accueil.' },
    ],
    details: [
      { icon: '📱', label: 'Application', value: 'Wave Mobile Money (iOS et Android)' },
      { icon: '⚡', label: 'Délai', value: 'Paiement instantané, validation immédiate' },
      { icon: '💰', label: 'Frais', value: 'Aucun frais supplémentaire de notre côté' },
      { icon: '🆘', label: 'Problème', value: 'En cas d\'échec, contactez l\'accueil pour une alternative' },
    ],
    info: { label: 'Numéro Wave', value: 'Disponible à l\'accueil' },
  },

  '/payer/orange-money': {
    title: 'Orange Money', tag: 'Payer en ligne', icon: '🟠',
    subtitle: 'Réglez vos consultations et soins médicaux via Orange Money en toute simplicité.',
    description: 'Orange Money est le service de paiement mobile d\'Orange Sénégal, accessible depuis tout téléphone, même sans smartphone. Pour payer vos soins médicaux, vous pouvez utiliser l\'application Orange Money, effectuer un transfert via le menu USSD *144#, ou vous rendre chez un agent Orange Money.',
    features: [
      { icon: '📲', title: 'Paiement mobile', desc: 'Utilisez votre solde Orange Money pour régler vos soins médicaux.' },
      { icon: '🔐', title: 'Sécurisé', desc: 'Transactions sécurisées par Orange avec confirmation par code PIN.' },
      { icon: '🧾', title: 'Traçabilité', desc: 'Historique complet de vos paiements disponible dans l\'application.' },
      { icon: '🌍', title: 'Disponibilité', desc: 'Accessible depuis tout le Sénégal, 24h/24 et 7j/7.' },
    ],
    steps: [
      { num: '01', title: 'Composez *144#', desc: 'Ou ouvrez directement l\'application Orange Money sur votre téléphone.' },
      { num: '02', title: 'Paiement marchand', desc: 'Choisissez "Paiement marchand" ou "Transfert" et entrez notre numéro.' },
      { num: '03', title: 'Montant & PIN', desc: 'Entrez le montant de votre facture et confirmez avec votre code PIN secret.' },
      { num: '04', title: 'Confirmation', desc: 'Vous recevez un SMS de confirmation — présentez-le à l\'accueil.' },
    ],
    details: [
      { icon: '📞', label: 'USSD', value: 'Composez *144# depuis votre téléphone Orange' },
      { icon: '📱', label: 'Application', value: 'Orange Money disponible sur Android et iOS' },
      { icon: '⚡', label: 'Délai', value: 'Paiement traité en moins d\'une minute' },
      { icon: '🆘', label: 'Assistance', value: 'Service client Orange : composez le 888' },
    ],
    info: { label: 'Numéro Orange Money', value: 'Disponible à l\'accueil' },
  },

  '/payer/especes': {
    title: 'Paiement en Espèces', tag: 'Payer en ligne', icon: '💵',
    subtitle: 'Payez directement à la caisse de l\'établissement pour vos consultations et soins.',
    description: 'Le paiement en espèces reste disponible à notre caisse principale. Notre caissière vous accueille du lundi au vendredi et vous remet un reçu fiscal officiel pour chaque paiement effectué. Pour les hospitalisations ou les montants importants, des facilités de paiement échelonné peuvent être envisagées sur demande.',
    features: [
      { icon: '🏦', title: 'Caisse principale', desc: 'Paiement à la caisse centrale de l\'établissement, accessible en semaine.' },
      { icon: '🧾', title: 'Reçu fiscal', desc: 'Un reçu officiel est systématiquement délivré pour chaque paiement.' },
      { icon: '⏰', title: 'Horaires', desc: 'La caisse est ouverte du lundi au vendredi de 8h à 17h sans interruption.' },
      { icon: '💬', title: 'Facilités', desc: 'Paiement échelonné possible sur demande pour les montants importants.' },
    ],
    steps: [
      { num: '01', title: 'Fiche de facturation', desc: 'Après votre consultation ou soin, récupérez votre fiche de facturation.' },
      { num: '02', title: 'Caisse', desc: 'Présentez-vous à la caisse principale avec votre fiche de facturation.' },
      { num: '03', title: 'Paiement', desc: 'Réglez le montant indiqué en espèces auprès de notre caissière.' },
      { num: '04', title: 'Reçu', desc: 'Conservez précieusement votre reçu fiscal pour vos remboursements éventuels.' },
    ],
    details: [
      { icon: '⏰', label: 'Horaires caisse', value: 'Lun – Ven : 8h00 – 17h00 sans interruption' },
      { icon: '📍', label: 'Emplacement', value: 'Caisse principale à l\'entrée de l\'établissement' },
      { icon: '🧾', label: 'Justificatif', value: 'Reçu fiscal délivré pour tout paiement en espèces' },
      { icon: '💬', label: 'Facilités', value: 'Paiement échelonné possible, renseignements à l\'accueil' },
    ],
  },
}

/* ─── stats strip data ──────────────────────────────────────────────────────── */
const KEY_STATS = [
  { icon: '🕐', value: '24/7',  label: 'Disponibilité patient' },
  { icon: '⚕️', value: '+30',   label: 'Services médicaux' },
  { icon: '👨‍⚕️', value: '+50',   label: 'Professionnels de santé' },
  { icon: '✅', value: '100%',  label: 'Suivi structuré numérique' },
]

/* ─── service icons SVG ─────────────────────────────────── */
const SVC_ICONS = [
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 9H17v1.5c0 .83-.67 1.5-1.5 1.5S14 11.33 14 10.5 14.67 9 15.5 9z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 15H7v-1.5c0-.83.67-1.5 1.5-1.5S10 12.67 10 13.5 9.33 15 8.5 15z"/></svg>,
]

/* ─── arrow icons ───────────────────────────────────────── */
const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IcoPrev = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)
const IcoNext = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

/* ─── RDV Modal ─────────────────────────────────────────── */
function RdvModal({ open, onClose, specialistes, initialDoctor }) {
  const [step, setStep]     = useState('form')
  const [errMsg, setErrMsg] = useState('')
  const [ref, setRef]       = useState('')
  const [form, setForm]     = useState({
    consulting_doctor_id: '',
    appointment_date: '',
    nom_patient: '',
    telephone: '',
    email: '',
    remarks: '',
  })

  useEffect(() => {
    if (open) {
      setStep('form'); setErrMsg(''); setRef('')
      setForm(f => ({ ...f, consulting_doctor_id: String(initialDoctor?.id ?? '') }))
    }
  }, [open, initialDoctor?.id])

  if (!open) return null

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const today = new Date().toISOString().split('T')[0]

  const submit = async e => {
    e.preventDefault()
    setStep('sending'); setErrMsg('')
    try {
      const res = await publicApi.appointment(form)
      setRef(res.reference || '')
      setStep('success')
    } catch (e) {
      setErrMsg(e?.message || "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.")
      setStep('error')
    }
  }

  return (
    <div className="rdv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rdv-modal">
        <div className="rdv-modal-header">
          <div>
            <h2>Demande de rendez-vous</h2>
            <p>Remplissez le formulaire, nous vous confirmons sous 24h</p>
          </div>
          <button className="rdv-modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {step === 'success' ? (
          <div className="rdv-success">
            <div className="rdv-success-icon">✓</div>
            <h3>Demande enregistrée !</h3>
            <p>Notre équipe vous contactera pour confirmer votre créneau.</p>
            {ref && <div className="rdv-ref">Référence : <strong>{ref}</strong></div>}
            <button className="rdv-btn-primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form className="rdv-form" onSubmit={submit}>
            <div className="rdv-section">
              <div className="rdv-section-title">
                <span className="rdv-section-icon">🗓️</span>
                <h3>Informations du rendez-vous</h3>
              </div>
              <div className="rdv-fields">
                <div className="rdv-field">
                  <label>Date souhaitée *</label>
                  <input type="date" name="appointment_date" value={form.appointment_date} onChange={ch} min={today} required />
                </div>
                <div className="rdv-field rdv-field-full">
                  <label>Motif de la consultation</label>
                  <textarea name="remarks" value={form.remarks} onChange={ch} placeholder="Décrivez brièvement le motif de votre consultation…" rows={3} />
                </div>
              </div>
            </div>

            <div className="rdv-section">
              <div className="rdv-section-title">
                <span className="rdv-section-icon">👤</span>
                <h3>Informations du patient</h3>
              </div>
              <div className="rdv-fields">
                <div className="rdv-field">
                  <label>Nom complet *</label>
                  <input type="text" name="nom_patient" value={form.nom_patient} onChange={ch} placeholder="Prénom Nom" required />
                </div>
                <div className="rdv-field">
                  <label>Téléphone *</label>
                  <input type="tel" name="telephone" value={form.telephone} onChange={ch} placeholder="+221 XX XXX XX XX" required />
                </div>
                <div className="rdv-field rdv-field-full">
                  <label>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={ch} placeholder="votre@email.com" required />
                </div>
              </div>
            </div>

            {step === 'error' && <div className="rdv-error">{errMsg}</div>}

            <div className="rdv-actions">
              <button type="button" className="rdv-btn-ghost" onClick={onClose}>Annuler</button>
              <button type="submit" className="rdv-btn-primary" disabled={step === 'sending'}>
                {step === 'sending'
                  ? <><span className="spin-sm" /> Envoi en cours…</>
                  : <>Envoyer la demande <Arrow /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ─── pagination bar ────────────────────────────────────── */
function PaginationBar({ page, total, onPrev, onNext, onDot }) {
  if (total <= 1) return null
  return (
    <div className="pg-bar">
      <button className="pg-btn" onClick={onPrev} disabled={page === 0}>
        <IcoPrev /> Précédent
      </button>
      <div className="pg-dots">
        {Array.from({ length: Math.min(total, 10) }, (_, i) => (
          <span key={i} className={`pg-dot${i === page ? ' active' : ''}`} onClick={() => onDot(i)} />
        ))}
      </div>
      <span className="pg-info">{page + 1} / {total}</span>
      <button className="pg-btn" onClick={onNext} disabled={page >= total - 1}>
        Suivant <IcoNext />
      </button>
    </div>
  )
}

/* ─── pin / phone / mail icons ──────────────────────────── */
const IcoPin   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-5.8-8-12a8 8 0 0116 0c0 6.2-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></svg>
const IcoPhone = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
const IcoMail  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>

/* ══════════════════════════════════════════════════════════
   HEADER  (shared across all pages)
══════════════════════════════════════════════════════════ */
function Header({ theme, onRdv }) {
  const navigate = useNavigate()
  const [open, setOpen]               = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [activeDD, setActiveDD]       = useState(null)
  const [mobileDD, setMobileDD]       = useState(null)
  const [activeNested, setActiveNested] = useState(null)
  const [mobileNested, setMobileNested] = useState(null)

  const activePages = useActivePages()
  const activePathSet = useMemo(() => new Set(activePages.map(p => p.path)), [activePages])

  // Filtre récursif : retire les liens de pages inactives
  const filterNavItems = useCallback((items) =>
    items.reduce((acc, item) => {
      if (!item.children) {
        // Lien direct : toujours montrer les ancres (#) et les liens non-pages
        const isPageLink = item.href && item.href.length > 1 && item.href.startsWith('/') && !item.href.startsWith('/#')
        if (!isPageLink || activePathSet.size === 0 || activePathSet.has(item.href)) acc.push(item)
      } else {
        const filtered = filterNavItems(item.children)
        if (filtered.length > 0) acc.push({ ...item, children: filtered })
      }
      return acc
    }, [])
  , [activePathSet])

  const filteredNav = useMemo(() => filterNavItems(NAV), [filterNavItems])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const close = () => {
    setOpen(false); setActiveDD(null); setMobileDD(null)
    setActiveNested(null); setMobileNested(null)
  }

  const go = (href) => {
    if (!href.includes('#')) {
      navigate(href)
    } else {
      const anchor = '#' + href.split('#').pop()
      if (window.location.pathname === '/') {
        document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        navigate('/')
        setTimeout(() => document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250)
      }
    }
    close()
  }

  const ChevronDown = ({ isOpen }) => (
    <svg className={`nav-dd-arrow${isOpen ? ' open' : ''}`}
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
  const ChevronRight = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ flexShrink: 0 }}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <a className="brand" href="/" onClick={e => { e.preventDefault(); go('/') }}>
        {theme.logo_url
          ? <img className="brand-logo" src={storageUrl(theme.logo_url)} alt={theme.app_name} />
          : <span className="brand-mark">{(theme.app_name || 'S')[0]}</span>}
        <span>
          <span className="brand-name">{theme.app_name}</span>
          <span className="brand-tagline">{theme.app_slogan}</span>
        </span>
      </a>

      <nav className={open ? 'main-nav open' : 'main-nav'}>
        {filteredNav.map(({ href, label, children }) =>
          children ? (
            <div key={label} className="nav-dd-wrap"
              onMouseEnter={() => setActiveDD(label)}
              onMouseLeave={() => { setActiveDD(null); setActiveNested(null) }}
            >
              <button className="nav-dd-trigger"
                onClick={() => setMobileDD(mobileDD === label ? null : label)}>
                {label}
                <ChevronDown isOpen={activeDD === label || mobileDD === label} />
              </button>
              <div className={`nav-dd-menu${activeDD === label || mobileDD === label ? ' visible' : ''}`}>
                {children.map(c =>
                  c.children ? (
                    <div key={c.label} className="nav-dd-nested-wrap"
                      onMouseEnter={() => setActiveNested(c.label)}
                      onMouseLeave={() => setActiveNested(null)}
                    >
                      <button className="nav-dd-nested-trigger"
                        onClick={() => setMobileNested(mobileNested === c.label ? null : c.label)}>
                        {c.label}
                        <ChevronRight />
                      </button>
                      <div className={`nav-dd-nested-menu${activeNested === c.label || mobileNested === c.label ? ' visible' : ''}`}>
                        {c.children.map(nc => (
                          <a key={nc.label} href={nc.href} onClick={e => { e.preventDefault(); go(nc.href) }}>
                            {nc.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <a key={c.label} href={c.href} onClick={e => { e.preventDefault(); go(c.href) }}>
                      {c.label}
                    </a>
                  )
                )}
              </div>
            </div>
          ) : (
            <a key={href} href={href} onClick={e => { e.preventDefault(); go(href) }}>{label}</a>
          )
        )}
        <button className="nav-cta" onClick={() => { onRdv(); close() }}>
          Prendre RDV
        </button>
      </nav>

      <button className="nav-toggle" onClick={() => setOpen(v => !v)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </header>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
function Hero({ slides, theme, onRdv }) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx] || fallbackSlides[0]
  const bg    = slide.image || storageUrl(slide.image_url || slide.banner_url || '')

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <section id="accueil" className="hero">
      <div className="hero-bg">
        {bg ? <img src={bg} alt="" /> : <div className="hero-bg-gradient" />}
      </div>
      <div className="hero-overlay" />
      <div className="hero-deco hero-deco-1" />
      <div className="hero-deco hero-deco-2" />
      <svg className="hero-cross" style={{ top: 120, right: '10%', width: 180, height: 180 }} viewBox="0 0 80 80" fill="white">
        <rect x="30" y="0" width="20" height="80" rx="4"/>
        <rect x="0" y="30" width="80" height="20" rx="4"/>
      </svg>
      <svg className="hero-cross" style={{ bottom: 100, left: '5%', width: 100, height: 100 }} viewBox="0 0 80 80" fill="white">
        <rect x="30" y="0" width="20" height="80" rx="4"/>
        <rect x="0" y="30" width="80" height="20" rx="4"/>
      </svg>
      <div className="hero-content">
        <div style={{ animation: 'fadeUp .7s ease' }}>
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            {theme.app_slogan || 'Votre santé, notre priorité'}
          </div>
          <h1>{slide.title}</h1>
          <p className="hero-subtitle">{slide.description}</p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={() => onRdv()}>
              {slide.button_label || 'Prendre rendez-vous'} <Arrow />
            </button>
            <a className="btn btn-ghost-white" href="/#services">Nos services</a>
          </div>
        </div>
        <div className="rdv-card" id="rendez-vous">
          <span className="rdv-label">Prise en charge rapide</span>
          <h3>Un parcours simple pour trouver le bon service</h3>
          <button className="rdv-link" onClick={() => onRdv()}>Prendre RDV <Arrow /></button>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button key={i} className={i === idx ? 'active' : ''} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
      <div className="hero-bar">
        {theme.phone && <span>📞 {theme.phone}</span>}
        {theme.hours && <span>🕐 {theme.hours}</span>}
      </div>
    </section>
  )
}

/* ── Animated counter ───────────────────────────────────── */
function AnimatedNumber({ value }) {
  const ref = useRef(null)
  const [v, setV] = useState(() => String(value).replace(/\d+/, '0'))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const str = String(value)
      const m = str.match(/^([+\s]*)(\d+)(.*?)$/)
      if (!m) { setV(str); return }
      const [, pre, digits, suf] = m
      const target = parseInt(digits, 10)
      const dur = 1400
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1)
        const ease = 1 - (1 - p) ** 3
        setV(`${pre}${Math.round(ease * target)}${suf}`)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  return <strong ref={ref}>{v}</strong>
}

/* ══════════════════════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════════════════════ */
function StatsStrip() {
  return (
    <div className="stats-strip">
      <div className="container">
        <div className="stats-strip-inner">
          {KEY_STATS.map((s, i) => (
            <div className="stats-strip-item" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="stats-strip-icon">{s.icon}</div>
              <div>
                <AnimatedNumber value={s.value} />
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ABOUT
══════════════════════════════════════════════════════════ */
function About({ about }) {
  const stats = about.stats || fallbackAbout.stats
  return (
    <section id="about" className="about-section animate-on-scroll">
      <div className="about-deco" />
      <div className="container">
        <div className="about-grid">
          <div>
            <span className="tag">Institution</span>
            <h2 className="h2">{about.title}</h2>
            <p className="about-body">{about.content}</p>
            <a className="about-cta" href="/#contact">Nous contacter <Arrow /></a>
          </div>
          <div className="about-stats">
            {stats.map((s, i) => (
              <div className="stat-box" key={s.label || i}>
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   SERVICES  (paginated · 5 par page)
══════════════════════════════════════════════════════════ */
function Services({ services }) {
  const PER = 5
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [services.length])

  const total   = Math.ceil(services.length / PER)
  const visible = services.slice(page * PER, page * PER + PER)

  return (
    <section id="services" className="services-section animate-on-scroll">
      <div className="services-deco-1" />
      <div className="services-deco-2" />
      <div className="container">
        <div className="section-header">
          <span className="tag">Expertise médicale</span>
          <h2 className="h2 center">Nos Services</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Des services médicaux organisés pour accompagner chaque patient depuis l'accueil jusqu'au suivi.
          </p>
        </div>
        <div key={`svc-${page}`} className="svc-row">
          {visible.map((s, i) => {
            const absIdx = page * PER + i
            return (
              <article className="svc-card" key={s.id || absIdx}>
                <div className="svc-top">
                  <span className="svc-num">{String(absIdx + 1).padStart(2, '0')}</span>
                  <div className="svc-icon-wrap">
                    {SVC_ICONS[absIdx % SVC_ICONS.length]}
                  </div>
                </div>
                <h3>{s.nom || s.name || s.libelle}</h3>
                <p>{s.description || s.description_courte || 'Prise en charge médicale disponible.'}</p>
                <a className="svc-link" href="/#contact">En savoir plus <Arrow /></a>
              </article>
            )
          })}
        </div>
        <PaginationBar
          page={page} total={total}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          onDot={setPage}
        />
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   MA SANTÉ  (paginated · 5 par page)
══════════════════════════════════════════════════════════ */
function Specialistes({ specialistes, onRdv }) {
  const PER = 5
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [specialistes.length])

  const total   = Math.ceil(specialistes.length / PER)
  const visible = specialistes.slice(page * PER, page * PER + PER)

  return (
    <section id="sante" className="specialists-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Santé & Prévention</span>
          <h2 className="h2 center">Ma Santé</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Actualités, espaces thématiques et prévention pour prendre soin de votre santé au quotidien.
          </p>
        </div>
        <div key={`doc-${page}`} className="doc-row">
          {visible.map((doc, i) => {
            const nom   = doc.nom       || doc.staff_name || doc.name || 'Médecin'
            const spec  = doc.specialite || doc.speciality || 'Spécialiste'
            const photo = doc.photo ? storageUrl(doc.photo) : null
            return (
              <article className="doc-card" key={doc.id || i}>
                <div className="doc-avatar">
                  {photo
                    ? <img src={photo} alt={nom} onError={e => { e.target.style.display = 'none' }} />
                    : <span className="doc-initials">{initials(nom)}</span>}
                </div>
                <h3>Dr. {nom}</h3>
                <span className="doc-spec">{spec}</span>
                <button className="doc-rdv" onClick={() => onRdv({ id: doc.id, nom })}>
                  Prendre RDV <Arrow />
                </button>
              </article>
            )
          })}
        </div>
        <PaginationBar
          page={page} total={total}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          onDot={setPage}
        />
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════ */
function Testimonials({ testimonials }) {
  if (!testimonials?.length) return null
  return (
    <section id="temoignages" className="testimonials-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Ils nous font confiance</span>
          <h2 className="h2 center">Avis Patients</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Découvrez les témoignages de nos patients satisfaits.
          </p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => {
            const photo = t.photo ? storageUrl(t.photo) : null
            return (
              <article className="testi-card" key={t.id || i}>
                <div className="testi-stars">{'★'.repeat(t.note || 5)}{'☆'.repeat(5 - (t.note || 5))}</div>
                <p className="testi-text">{t.texte}</p>
                <div className="testi-author">
                  {photo
                    ? <img src={photo} alt={t.nom} />
                    : <div className="testi-avatar">{initials(t.nom)}</div>}
                  <div>
                    <div className="testi-name">{t.nom}</div>
                    <div className="testi-role">{t.role || 'Patient'}</div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   PARTNERS
══════════════════════════════════════════════════════════ */
function Partenaires({ partenaires }) {
  return (
    <section id="partenaires" className="partners-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Réseau de confiance</span>
          <h2 className="h2 center">Nos Partenaires</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Un réseau d'établissements et d'assurances partenaires pour faciliter votre accès aux soins.
          </p>
        </div>
        <div className="partners-grid">
          {partenaires.map((p, i) => {
            const nom  = p.nom || p.Nom || 'Partenaire'
            const logo = p.logo ? storageUrl(p.logo) : null
            return (
              <a className="partner-card" key={p.id || i}
                href={p.lien || '/#contact'}
                onClick={!p.lien ? e => e.preventDefault() : undefined}
              >
                {logo
                  ? <div className="partner-logo-box"><img src={logo} alt={nom} /></div>
                  : <div className="partner-initials">{initials(nom)}</div>}
                <h3>{nom}</h3>
                <div className="partner-divider" />
                <div className="partner-meta">
                  {(p.adress || p.address) && (
                    <div className="partner-meta-row"><IcoPin /><span>{p.adress || p.address}</span></div>
                  )}
                  {(p.mobile || p.contact) && (
                    <div className="partner-meta-row"><IcoPhone /><span>{p.mobile || p.contact}</span></div>
                  )}
                  {p.email && (
                    <div className="partner-meta-row"><IcoMail /><span>{p.email}</span></div>
                  )}
                  {!p.adress && !p.address && !p.mobile && !p.contact && !p.email && (
                    <div className="partner-meta-row" style={{ fontStyle: 'italic', fontSize: 13 }}>
                      <span>Partenaire de santé</span>
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   SYNTHESIS (tour d'horizon de toutes les pages)
══════════════════════════════════════════════════════════ */
const SYNTHESIS_CATS = [
  {
    label: 'Services médicaux', icon: '⚕️', count: 6,
    items: [
      { href: '/services/medecine',          label: 'Médecine générale',     icon: '🩺' },
      { href: '/services/petite-chirurgie',  label: 'Petite chirurgie',      icon: '✂️' },
      { href: '/services/femme-mere-enfant', label: 'Femme, Mère & Enfant',  icon: '👩‍👧' },
      { href: '/services/personnes-agees',   label: 'Personnes âgées',       icon: '👴' },
      { href: '/services/laboratoire',       label: 'Laboratoire',           icon: '🔬' },
      { href: '/services/pharmacie',         label: 'Pharmacie',             icon: '💊' },
    ],
  },
  {
    label: 'Ma Santé', icon: '🛡️', count: 3,
    items: [
      { href: '/sante/actualite',         label: 'Actualité santé',           icon: '📰' },
      { href: '/sante/espace-thematique', label: 'Espace thématique',         icon: '📚' },
      { href: '/sante/prevention',        label: 'Prévention & santé publique', icon: '🛡️' },
    ],
  },
  {
    label: 'Patient / Usager', icon: '👤', count: 4,
    items: [
      { href: '/patient/sejour',       label: 'Votre séjour',             icon: '🏥' },
      { href: '/patient/droits',       label: 'Vos droits',               icon: '⚖️' },
      { href: '/patient/associations', label: 'Associations partenaires', icon: '🤝' },
      { href: '/patient/demarches',    label: 'Démarches en ligne',       icon: '💻' },
    ],
  },
  {
    label: 'Formations', icon: '🎓', count: 2,
    items: [
      { href: '/formations/ide-sage-femme', label: 'Stagiaire IDE / Sage-Femme', icon: '🎓' },
      { href: '/formations/aide-infirmier', label: 'Aide infirmier',             icon: '🩺' },
    ],
  },
  {
    label: 'Payer en ligne', icon: '💳', count: 3,
    items: [
      { href: '/payer/wave',         label: 'Paiement par Wave', icon: '📱' },
      { href: '/payer/orange-money', label: 'Orange Money',      icon: '🟠' },
      { href: '/payer/especes',      label: 'Espèces',           icon: '💵' },
    ],
  },
]

const TAG_ICONS = {
  'Services médicaux': '⚕️',
  'Ma Santé':          '🛡️',
  'Patient / Usager':  '👤',
  'Formations':        '🎓',
  'Payer en ligne':    '💳',
  'Pages':             '📄',
}

function SynthesisSection() {
  const navigate   = useNavigate()
  const activePages = useActivePages()

  const cats = useMemo(() => {
    if (!activePages.length) return SYNTHESIS_CATS
    const groups = {}
    activePages.forEach(p => {
      const key = p.tag || 'Autres'
      if (!groups[key]) groups[key] = { label: key, icon: TAG_ICONS[key] || '📄', items: [] }
      groups[key].items.push({ href: p.path, label: p.title, icon: p.icon || '📄' })
    })
    return Object.values(groups).map(g => ({ ...g, count: g.items.length }))
  }, [activePages])

  return (
    <section id="explorer" className="synthesis-section animate-on-scroll">
      <div className="synthesis-deco-1" />
      <div className="synthesis-deco-2" />
      <div className="container">
        <div className="section-header synth-header">
          <span className="tag white">Tour d'horizon</span>
          <h2 className="h2 light">Tout ce que nous vous proposons</h2>
          <p className="lead light center" style={{ marginTop: 12 }}>
            Explorez l'ensemble de nos services, ressources et informations disponibles pour vous accompagner.
          </p>
        </div>
        <div className="synthesis-grid">
          {cats.map((cat, ci) => (
            <div className={`synthesis-cat stagger-${ci + 1}`} key={ci}>
              <div className="synthesis-cat-header">
                <span className="synthesis-cat-icon">{cat.icon}</span>
                <h3>{cat.label}</h3>
                <span className="synthesis-cat-count">{cat.count}</span>
              </div>
              <ul className="synthesis-list">
                {cat.items.map((item, ii) => (
                  <li key={ii}>
                    <a href={item.href} className="synthesis-link"
                      onClick={e => { e.preventDefault(); navigate(item.href) }}>
                      <span className="synthesis-link-icon">{item.icon}</span>
                      <span className="synthesis-link-label">{item.label}</span>
                      <span className="synthesis-link-arrow">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   MAP
══════════════════════════════════════════════════════════ */
function MapSection({ theme }) {
  if (!theme.map_url) return null
  return (
    <div className="map-section">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="tag">Localisation</span>
          <h2 className="h2 center" style={{ fontSize: 30 }}>Retrouvez-nous</h2>
        </div>
        <div className="map-embed">
          <iframe src={theme.map_url} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FAQ
══════════════════════════════════════════════════════════ */
function FAQ({ faq }) {
  if (!faq?.length) return null
  return (
    <section id="faq" className="faq-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Questions fréquentes</span>
          <h2 className="h2 center">FAQ</h2>
          <p className="lead center" style={{ marginTop: 12 }}>Réponses aux questions les plus posées par nos patients.</p>
        </div>
        <div className="faq-list">
          {faq.map((item, i) => (
            <details className="faq-item" key={item.id || i}>
              <summary>{item.question}<span className="faq-toggle">+</span></summary>
              <p>{item.reponse}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   CONTACT
══════════════════════════════════════════════════════════ */
function Contact({ theme }) {
  const [form, setForm]     = useState({ nom: '', telephone: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [err, setErr]       = useState('')

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setStatus('sending'); setErr('')
    try {
      await publicApi.contact(form)
      setStatus('success')
      setForm({ nom: '', telephone: '', email: '', message: '' })
    } catch {
      setStatus('error'); setErr('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  const DETAILS = [
    { icon: '📞', lbl: 'Téléphone', val: theme.phone },
    { icon: '✉️', lbl: 'Email',     val: theme.email },
    { icon: '📍', lbl: 'Adresse',   val: theme.address },
    { icon: '🕐', lbl: 'Horaires',  val: theme.hours },
  ].filter(d => d.val)

  return (
    <section id="contact" className="contact-section">
      <div className="contact-deco-1" /><div className="contact-deco-2" />
      <div className="container">
        <div className="contact-grid">
          <div>
            <span className="tag accent">Contactez-nous</span>
            <h2 className="h2 light">Nous sommes là pour vous</h2>
            <p className="contact-subtitle">
              Prenez contact avec notre équipe pour toute question ou pour planifier votre consultation.
            </p>
            <div className="contact-details">
              {DETAILS.map(d => (
                <div className="contact-item" key={d.lbl}>
                  <div className="contact-icon">{d.icon}</div>
                  <div>
                    <span className="contact-lbl">{d.lbl}</span>
                    <span className="contact-val">{d.val}</span>
                  </div>
                </div>
              ))}
            </div>
            {theme.map_url && (
              <a className="contact-map-btn" href={theme.map_url} target="_blank" rel="noopener noreferrer">
                📍 Voir sur la carte <Arrow />
              </a>
            )}
          </div>
          <div className="form-panel">
            {status === 'success' ? (
              <div className="form-success">
                <div className="success-icon">✓</div>
                <h4>Message envoyé !</h4>
                <p>Notre équipe vous contactera dans les plus brefs délais.</p>
                <button className="btn-reset" onClick={() => setStatus('idle')}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3>Envoyez-nous un message</h3>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Nom complet *</label>
                    <input className="f-input" name="nom" value={form.nom} onChange={ch} placeholder="Votre nom" required />
                  </div>
                  <div className="form-field">
                    <label>Téléphone</label>
                    <input className="f-input" name="telephone" value={form.telephone} onChange={ch} placeholder="+221 XX XXX XX XX" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input className="f-input" name="email" type="email" value={form.email} onChange={ch} placeholder="votre@email.com" />
                </div>
                <div className="form-field">
                  <label>Message *</label>
                  <textarea className="f-textarea" name="message" value={form.message} onChange={ch} placeholder="Décrivez votre demande…" required rows={5} />
                </div>
                {status === 'error' && <div className="f-error">{err}</div>}
                <button type="submit" className="f-submit" disabled={status === 'sending'}>
                  {status === 'sending'
                    ? <><span className="spin-sm" />Envoi en cours…</>
                    : <>Envoyer le message <Arrow /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   FOOTER  (shared)
══════════════════════════════════════════════════════════ */
function Footer({ theme }) {
  const yr = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>{theme.app_name}</strong>
            <p>{theme.app_slogan}. Une plateforme médicale au service de vos structures de santé.</p>
            {(theme.social_facebook || theme.social_instagram || theme.social_linkedin) && (
              <div className="footer-social">
                {theme.social_facebook  && <a href={theme.social_facebook}  target="_blank" rel="noopener noreferrer">FB</a>}
                {theme.social_instagram && <a href={theme.social_instagram} target="_blank" rel="noopener noreferrer">IG</a>}
                {theme.social_linkedin  && <a href={theme.social_linkedin}  target="_blank" rel="noopener noreferrer">LN</a>}
              </div>
            )}
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="/">Accueil</a>
            <a href="/#about">À propos</a>
            <a href="/#services">Nos services</a>
            <a href="/#sante">Ma Santé</a>
            <a href="/#contact">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Nos services</h4>
            <a href="/services/medecine">Médecine</a>
            <a href="/services/petite-chirurgie">Petite chirurgie</a>
            <a href="/services/femme-mere-enfant">Femme mère et enfant</a>
            <a href="/services/laboratoire">Laboratoire</a>
            <a href="/services/pharmacie">Pharmacie</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <address>
              {theme.phone   && <span>📞 {theme.phone}</span>}
              {theme.email   && <span>✉️ {theme.email}</span>}
              {theme.address && <span>📍 {theme.address}</span>}
              {theme.hours   && <span>🕐 {theme.hours}</span>}
            </address>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {yr} {theme.app_name} — Tous droits réservés</span>
          <span>Développé par DST Computing</span>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════
   WHATSAPP
══════════════════════════════════════════════════════════ */
function WhatsApp({ phone }) {
  if (!phone) return null
  return (
    <a className="whatsapp-btn" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div className="skeleton-section">
      <div className="container">
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SUB PAGE  (template générique pour toutes les pages internes)
══════════════════════════════════════════════════════════ */
function SubPage() {
  const navigate = useNavigate()
  const path = window.location.pathname
  const staticConfig = PAGES_CONFIG[path]

  const theme = useThemePrefs()
  const [config,  setConfig]  = useState(staticConfig || null)
  const [pageLoading, setPageLoading] = useState(!staticConfig)
  const [rdvOpen, setRdvOpen] = useState(false)
  const [rdvDoctor, setRdvDoctor] = useState(null)
  const openRdv = (doc = null) => { setRdvDoctor(doc); setRdvOpen(true) }

  useEffect(() => {
    setPageLoading(true)
    publicApi.page(path)
      .then(res => {
        const data = res?.data || res
        if (data && data.title) setConfig(data)
        else if (staticConfig) setConfig(staticConfig)
      })
      .catch(() => { if (staticConfig) setConfig(staticConfig) })
      .finally(() => setPageLoading(false))
    window.scrollTo(0, 0)
  }, [path])

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header theme={theme} onRdv={openRdv} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="skeleton-section"><div className="container"><div className="skeleton-grid">
            <div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" />
          </div></div></div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header theme={theme} onRdv={openRdv} />
        <div className="inner-not-found">
          <div className="container">
            <span style={{ fontSize: 64 }}>🏥</span>
            <h1>Page introuvable</h1>
            <p>Cette page n'existe pas encore.</p>
            <button className="btn btn-accent" onClick={() => navigate('/')}>
              Retour à l'accueil <Arrow />
            </button>
          </div>
        </div>
        <Footer theme={theme} />
      </div>
    )
  }

  const cssVars = {
    '--primary':       theme.primary_color || fallbackTheme.primary_color,
    '--accent':        theme.accent_color  || fallbackTheme.accent_color,
    '--primary-dark':  theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, black)` : '#001f42',
    '--primary-light': theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, white)` : '#0050a0',
    '--accent-dark':   theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  82%, black)` : '#e05e1a',
    '--accent-light':  theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  70%, white)` : '#ff9a6b',
  }

  return (
    <div style={cssVars}>
      <Header theme={theme} onRdv={openRdv} />

      {/* Hero banner */}
      <div className="inner-hero">
        <div className="inner-hero-deco-1" />
        <div className="inner-hero-deco-2" />
        <div className="container">
          <button className="inner-back" onClick={() => navigate(-1)}>
            ← Retour
          </button>
          <span className="tag white">{config.tag}</span>
          <div className="inner-hero-icon">{config.icon}</div>
          <h1 className="inner-hero-title">{config.title}</h1>
          <p className="inner-hero-sub">{config.subtitle}</p>
          <button className="btn btn-accent" onClick={() => openRdv()}>
            Prendre rendez-vous <Arrow />
          </button>
        </div>
      </div>

      {/* Intro description */}
      {config.description && (
        <div className="inner-intro">
          <div className="container">
            <p>{config.description}</p>
          </div>
        </div>
      )}

      {/* Features grid */}
      {config.features && (
        <section className="inner-features">
          <div className="container">
            <div className="section-header">
              <span className="tag">Nos prestations</span>
              <h2 className="h2 center">Ce que nous proposons</h2>
            </div>
            <div className="inner-features-grid">
              {config.features.map((f, i) => (
                <div className="inner-feature-card" key={i}>
                  <div className="inner-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Steps / process */}
      {config.steps && (
        <section className="inner-steps">
          <div className="container">
            <div className="section-header">
              <span className="tag">Déroulement</span>
              <h2 className="h2 center">Comment ça se passe</h2>
            </div>
            <div className="inner-steps-grid">
              {config.steps.map((s, i) => (
                <div className="inner-step-card" key={i}>
                  <div className="inner-step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Practical details */}
      {config.details && (
        <section className="inner-details">
          <div className="container">
            <div className="section-header">
              <span className="tag">Pratique</span>
              <h2 className="h2 center">Informations pratiques</h2>
            </div>
            <div className="inner-details-grid">
              {config.details.map((d, i) => (
                <div className="inner-detail-card" key={i}>
                  <span className="inner-detail-icon">{d.icon}</span>
                  <div className="inner-detail-body">
                    <strong>{d.label}</strong>
                    <span>{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Extra info block (e.g. payment number) */}
      {config.info && (
        <div className="inner-info-block">
          <div className="container">
            <div className="inner-info-card">
              <span className="inner-info-label">{config.info.label}</span>
              <span className="inner-info-value">{config.info.value}</span>
            </div>
          </div>
        </div>
      )}

      {/* CTA + Contact */}
      <div className="inner-cta">
        <div className="container">
          <h2>Des questions ? Contactez-nous</h2>
          <p>Notre équipe est disponible pour répondre à toutes vos questions.</p>
          <div className="inner-cta-btns">
            <button className="btn btn-accent" onClick={() => openRdv()}>
              Prendre RDV <Arrow />
            </button>
            <button className="btn btn-ghost-white" onClick={() => navigate('/#contact')}>
              Nous écrire <Arrow />
            </button>
          </div>
        </div>
      </div>

      <Footer theme={theme} />
      <WhatsApp phone={theme.phone} />
      <RdvModal
        open={rdvOpen}
        onClose={() => setRdvOpen(false)}
        specialistes={[]}
        initialDoctor={rdvDoctor}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════ */
function HomePage() {
  const theme = useThemePrefs()
  const [slides,       setSlides]       = useState(fallbackSlides)
  const [about,        setAbout]        = useState(fallbackAbout)
  const [services,     setServices]     = useState(fallbackServices)
  const [specialistes, setSpecialistes] = useState(fallbackSpecialistes)
  const [partenaires,  setPartenaires]  = useState(fallbackPartenaires)
  const [testimonials, setTestimonials] = useState(fallbackTestimonials)
  const [faq,          setFaq]          = useState(fallbackFAQ)
  const [loading,      setLoading]      = useState(true)
  const [rdvOpen,      setRdvOpen]      = useState(false)
  const [rdvDoctor,    setRdvDoctor]    = useState(null)
  const openRdv = (doc = null) => { setRdvDoctor(doc); setRdvOpen(true) }

  useEffect(() => {
    Promise.allSettled([
      publicApi.slides(),
      publicApi.about(),
      publicApi.services(),
      publicApi.specialistes(),
      publicApi.partenaires(),
      publicApi.testimonials(),
      publicApi.faq(),
    ]).then(([s, a, sv, sp, par, testi, faqRes]) => {
      if (s.status     === 'fulfilled') setSlides(normalizeList(s.value,      fallbackSlides))
      if (a.status     === 'fulfilled') setAbout({ ...fallbackAbout,          ...(a.value?.data     || a.value) })
      if (sv.status    === 'fulfilled') setServices(normalizeList(sv.value,    fallbackServices))
      if (sp.status    === 'fulfilled') setSpecialistes(normalizeList(sp.value, fallbackSpecialistes))
      if (par.status   === 'fulfilled') setPartenaires(normalizeList(par.value, fallbackPartenaires))
      if (testi.status === 'fulfilled') setTestimonials(normalizeList(testi.value, fallbackTestimonials))
      if (faqRes.status === 'fulfilled') setFaq(normalizeList(faqRes.value,   fallbackFAQ))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.07 }
    )
    const t = setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el))
    }, 120)
    return () => { clearTimeout(t); obs.disconnect() }
  }, [loading])

  const cssVars = useMemo(() => ({
    '--primary':       theme.primary_color || fallbackTheme.primary_color,
    '--accent':        theme.accent_color  || fallbackTheme.accent_color,
    '--primary-dark':  theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, black)` : '#001f42',
    '--primary-light': theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, white)` : '#0050a0',
    '--accent-dark':   theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  82%, black)` : '#e05e1a',
    '--accent-light':  theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  70%, white)` : '#ff9a6b',
  }), [theme])

  return (
    <div style={cssVars}>
      <Header theme={theme} onRdv={openRdv} />
      <main>
        <Hero slides={slides.length ? slides : fallbackSlides} theme={theme} onRdv={openRdv} />
        <StatsStrip />
        {loading ? (
          <><Skeleton /><Skeleton /><Skeleton /></>
        ) : (
          <>
            <About         about={about} />
            <Services      services={services} />
            <Specialistes  specialistes={specialistes} onRdv={openRdv} />
            <SynthesisSection />
            <Testimonials  testimonials={testimonials} />
            <Partenaires   partenaires={partenaires} />
            <MapSection    theme={theme} />
            <FAQ           faq={faq} />
            <Contact       theme={theme} />
          </>
        )}
      </main>
      <Footer theme={theme} />
      <WhatsApp phone={theme.phone} />
      <RdvModal
        open={rdvOpen}
        onClose={() => setRdvOpen(false)}
        specialistes={specialistes}
        initialDoctor={rdvDoctor}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   APP ROOT  (router)
══════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Services */}
      <Route path="/services/medecine"          element={<SubPage />} />
      <Route path="/services/petite-chirurgie"  element={<SubPage />} />
      <Route path="/services/femme-mere-enfant" element={<SubPage />} />
      <Route path="/services/personnes-agees"   element={<SubPage />} />
      <Route path="/services/laboratoire"       element={<SubPage />} />
      <Route path="/services/pharmacie"         element={<SubPage />} />
      {/* Ma Santé */}
      <Route path="/sante/actualite"            element={<SubPage />} />
      <Route path="/sante/espace-thematique"    element={<SubPage />} />
      <Route path="/sante/prevention"           element={<SubPage />} />
      {/* Pages */}
      <Route path="/partenaires"                element={<SubPage />} />
      <Route path="/formations/ide-sage-femme"  element={<SubPage />} />
      <Route path="/formations/aide-infirmier"  element={<SubPage />} />
      {/* Patient / Usager */}
      <Route path="/patient/sejour"             element={<SubPage />} />
      <Route path="/patient/droits"             element={<SubPage />} />
      <Route path="/patient/associations"       element={<SubPage />} />
      <Route path="/patient/demarches"          element={<SubPage />} />
      {/* Payer en ligne */}
      <Route path="/payer/wave"                 element={<SubPage />} />
      <Route path="/payer/orange-money"         element={<SubPage />} />
      <Route path="/payer/especes"              element={<SubPage />} />
      {/* 404 fallback */}
      <Route path="*"                           element={<SubPage />} />
    </Routes>
  )
}
