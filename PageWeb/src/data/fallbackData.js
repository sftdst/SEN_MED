import heroImage from '../assets/hero.png'

export const fallbackTheme = {
  app_name: 'SenMed',
  app_slogan: 'Votre sante, notre priorite',
  primary_color: '#003268',
  accent_color: '#ff7631',
  logo_url: '',
  phone: '+221 33 000 00 00',
  email: 'contact@senmed.sn',
  address: 'Dakar, Senegal',
  map_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d96629.78535158506!2d-17.4759505!3d14.7163758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDQzJzEyLjAiTiAxNzbCsDI0JzAwLjAiRQ!5e0!3m2!1sfr!2ssn!4v1234567890',
  hours: 'Lun - Sam : 08h00 - 18h00',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
}

export const fallbackSlides = [
  {
    id: 1,
    image: heroImage,
    title: 'Des soins modernes, accessibles et coordonnes',
    description: 'SenMed rassemble rendez-vous, specialistes, services et suivi patient dans une experience simple et rassurante.',
    button_label: 'Prendre rendez-vous',
    button_link: '#rendez-vous',
  },
]

export const fallbackAbout = {
  title: 'Qui sommes-nous ?',
  content: 'SenMed accompagne les structures de sante dans une prise en charge plus fluide, plus humaine et mieux organisee. Notre mission est de rapprocher les patients des bons services, au bon moment.',
  stats: [
    { value: '24/7', label: 'Orientation patient' },
    { value: '+30', label: 'Services coordonnes' },
    { value: '100%', label: 'Suivi structure' },
  ],
}

export const fallbackServices = [
  { id: 1, nom: 'Consultation generale', description: 'Une prise en charge medicale complete pour vos premiers besoins de sante.', image: '' },
  { id: 2, nom: 'Imagerie medicale', description: 'Examens et diagnostics avec un parcours patient clair et rapide.', image: '' },
  { id: 3, nom: 'Laboratoire', description: 'Analyses biologiques, resultats et suivi integres au dossier patient.', image: '' },
]

export const fallbackSpecialistes = [
  { id: 1, nom: 'Dr. Awa Ndiaye', specialite: 'Medecine generale', bio: 'Ecoute, prevention et orientation personnalisee.', photo: '' },
  { id: 2, nom: 'Dr. Mamadou Diop', specialite: 'Cardiologie', bio: 'Suivi cardiovasculaire et examens specialises.', photo: '' },
  { id: 3, nom: 'Dr. Fatou Ba', specialite: 'Pediatrie', bio: 'Accompagnement medical des enfants et adolescents.', photo: '' },
]

export const fallbackPartenaires = [
  { id: 1, nom: 'Assurance Sante Plus', logo: '', lien: '' },
  { id: 2, nom: 'Mutuelle Horizon', logo: '', lien: '' },
  { id: 3, nom: 'Clinique Partenaire', logo: '', lien: '' },
]

export const fallbackTestimonials = [
  {
    id: 1,
    nom: 'Aminata Sow',
    role: 'Patient',
    photo: '',
    texte: 'Un accueil exceptionnel et un suivi medical de grande qualite. Je recommande vivement SenMed pour toute la famille.',
    note: 5,
  },
  {
    id: 2,
    nom: 'Ibrahima Diop',
    role: 'Patient',
    photo: '',
    texte: 'La prise de rendez-vous est tres simple et le personnel est a l ecoute. Merci pour ce service precieux.',
    note: 5,
  },
  {
    id: 3,
    nom: 'Fatoumata Ba',
    role: 'Patient',
    photo: '',
    texte: 'J ai ete bien prise en charge du debut a la fin. Les docteurs sont competents et disponibles.',
    note: 4,
  },
]

export const fallbackFAQ = [
  {
    id: 1,
    question: 'Comment prendre rendez-vous chez SenMed ?',
    reponse: 'Vous pouvez prendre rendez-vous en ligne via notre site web, par telephone au +221 33 000 00 00, ou directement a l accueil de la clinique.',
  },
  {
    id: 2,
    question: 'Quels sont vos horaires d\'ouverture ?',
    reponse: 'Nous sommes ouverts du lundi au samedi de 08h00 a 18h00. Les dimanches et jours feries, seul le service des urgences est actif.',
  },
  {
    id: 3,
    question: 'Quels specialistes sont disponibles ?',
    reponse: 'SenMed regroupe des medecins generalistes, cardiologues, pediatres, gynecologues, dermatologues et bien d autres. Consultez la page Nos Specialistes pour la liste complete.',
  },
  {
    id: 4,
    question: 'Acceptez-vous les assurances sant\u00e9 ?',
    reponse: 'Oui, nous collaborons avec de nombreuses mutuelles et compagnies d assurance. Contactez-nous pour verifier votre couverture.',
  },
]
