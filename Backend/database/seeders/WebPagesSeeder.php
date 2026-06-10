<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WebPage;

class WebPagesSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'path' => '/services/medecine', 'sort_order' => 1,
                'title' => 'Médecine Générale', 'tag' => 'Services médicaux', 'icon' => '🩺',
                'subtitle' => "Consultations médicales générales pour tous les patients, quel que soit l'âge ou la situation.",
                'description' => "Notre service de médecine générale assure la prise en charge globale de votre santé. Nos médecins généralistes vous reçoivent pour des consultations de routine, de suivi de maladies chroniques ou pour des problèmes aigus. Chaque patient bénéficie d'une écoute attentive et d'un traitement adapté à sa situation personnelle.",
                'features' => [
                    ['icon' => '🔍', 'title' => 'Diagnostic',       'desc' => "Évaluation médicale approfondie avec examen clinique complet et bilan orienté."],
                    ['icon' => '💊', 'title' => 'Traitement',        'desc' => "Prescription adaptée et suivi thérapeutique personnalisé selon chaque patient."],
                    ['icon' => '📋', 'title' => 'Dossier médical',   'desc' => "Gestion de votre dossier médical numérique centralisé pour un meilleur suivi."],
                    ['icon' => '🔗', 'title' => 'Orientation',       'desc' => "Référencement vers les spécialistes ou services adaptés selon vos besoins."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Prise de rendez-vous',       'desc' => "Contactez-nous par téléphone, en ligne ou en vous présentant directement à l'accueil."],
                    ['num' => '02', 'title' => 'Consultation',               'desc' => "Le médecin réalise un examen clinique complet et échange avec vous sur vos symptômes."],
                    ['num' => '03', 'title' => 'Diagnostic & prescription',  'desc' => "Établissement du diagnostic et remise de l'ordonnance ou demande d'examens complémentaires."],
                    ['num' => '04', 'title' => 'Suivi',                      'desc' => "Programmation des consultations de suivi pour évaluer l'évolution de votre état de santé."],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Horaires',      'value' => 'Lun – Ven : 8h00 – 18h00 | Sam : 8h00 – 13h00'],
                    ['icon' => '💳', 'label' => 'Tarification',  'value' => 'Consultations remboursables par les assurances partenaires'],
                    ['icon' => '📋', 'label' => 'Documents',     'value' => "Carte d'identité, carnet de santé, ordonnances précédentes"],
                    ['icon' => '🚨', 'label' => 'Urgences',      'value' => 'Accueil sans rendez-vous pour les urgences médicales'],
                ],
            ],
            [
                'path' => '/services/petite-chirurgie', 'sort_order' => 2,
                'title' => 'Petite Chirurgie', 'tag' => 'Services médicaux', 'icon' => '⚕️',
                'subtitle' => 'Interventions chirurgicales mineures réalisées en ambulatoire, sans hospitalisation prolongée.',
                'description' => "La petite chirurgie regroupe l'ensemble des interventions chirurgicales mineures pouvant être réalisées sous anesthésie locale. Notre équipe chirurgicale expérimentée vous garantit une prise en charge sécurisée et un retour rapide à domicile le jour même.",
                'features' => [
                    ['icon' => '🩹', 'title' => 'Sutures',       'desc' => 'Prise en charge des plaies et réalisation de sutures cutanées.'],
                    ['icon' => '✂️', 'title' => 'Ablation',       'desc' => 'Ablation de petites lésions cutanées : kystes, lipomes, verrues.'],
                    ['icon' => '💉', 'title' => 'Infiltrations',  'desc' => 'Injections locales à visée antalgique ou anti-inflammatoire.'],
                    ['icon' => '🏥', 'title' => 'Ambulatoire',    'desc' => 'Retour à domicile le jour même dans la grande majorité des cas.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Consultation préopératoire', 'desc' => "Évaluation médicale, bilan préopératoire et information complète sur l'intervention."],
                    ['num' => '02', 'title' => 'Préparation',               'desc' => 'Instructions pré-opératoires selon le type d\'intervention (jeûne, arrêt médicaments, etc.).'],
                    ['num' => '03', 'title' => 'Intervention',              'desc' => 'Réalisation du geste chirurgical sous anesthésie locale dans des conditions stériles.'],
                    ['num' => '04', 'title' => 'Récupération & suivi',      'desc' => 'Surveillance post-opératoire et planification des soins de suivi à domicile.'],
                ],
                'details' => [
                    ['icon' => '⏱️', 'label' => 'Durée',       'value' => 'La plupart des interventions durent 15 à 45 minutes'],
                    ['icon' => '🏠', 'label' => 'Ambulatoire', 'value' => "Retour à domicile le jour même de l'intervention"],
                    ['icon' => '📋', 'label' => 'Prérequis',   'value' => 'Consultation préalable obligatoire avant toute intervention'],
                    ['icon' => '🔒', 'label' => 'Sécurité',    'value' => 'Bloc opératoire aux normes avec équipements stérilisés'],
                ],
            ],
            [
                'path' => '/services/femme-mere-enfant', 'sort_order' => 3,
                'title' => 'Femme, Mère et Enfant', 'tag' => 'Services médicaux', 'icon' => '👩‍👧',
                'subtitle' => "Un accompagnement médical dédié à la santé de la femme, de la grossesse et de l'enfant.",
                'description' => "Notre pôle Femme-Mère-Enfant offre une prise en charge complète et personnalisée à chaque étape de la vie féminine et infantile. Du suivi gynécologique au suivi pédiatrique, notre équipe pluridisciplinaire est à vos côtés avec bienveillance et professionnalisme.",
                'features' => [
                    ['icon' => '🤰', 'title' => 'Suivi de grossesse', 'desc' => "Consultations prénatales, échographies et préparation à l'accouchement."],
                    ['icon' => '👶', 'title' => 'Pédiatrie',          'desc' => "Suivi de la croissance et de la santé de l'enfant de 0 à 15 ans."],
                    ['icon' => '🌸', 'title' => 'Gynécologie',        'desc' => 'Consultations gynécologiques, dépistage et suivi de la santé féminine.'],
                    ['icon' => '🍼', 'title' => 'Post-partum',        'desc' => "Accompagnement de la mère et du nouveau-né après la naissance."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Premier contact',          'desc' => 'Consultation initiale pour établir le bilan de santé et définir le suivi adapté.'],
                    ['num' => '02', 'title' => 'Suivi personnalisé',       'desc' => 'Consultations régulières selon un calendrier adapté (grossesse, pédiatrie, gynéco).'],
                    ['num' => '03', 'title' => 'Examens complémentaires',  'desc' => 'Échographies, bilans biologiques et autres examens selon les besoins identifiés.'],
                    ['num' => '04', 'title' => 'Accompagnement continu',   'desc' => "Disponibilité de l'équipe pour répondre à toutes vos questions entre les consultations."],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Consultations', 'value' => 'Sur rendez-vous, du lundi au samedi'],
                    ['icon' => '🤰', 'label' => 'Maternité',     'value' => "Suivi complet de la grossesse jusqu'à l'accouchement"],
                    ['icon' => '👶', 'label' => 'Pédiatrie',     'value' => 'Enfants de 0 à 15 ans acceptés'],
                    ['icon' => '🌸', 'label' => 'Gynécologie',   'value' => 'Dépistages, contraception, ménopause'],
                ],
            ],
            [
                'path' => '/services/personnes-agees', 'sort_order' => 4,
                'title' => 'Personnes Âgées', 'tag' => 'Services médicaux', 'icon' => '👴',
                'subtitle' => 'Une prise en charge globale et bienveillante dédiée aux patients âgés et à leurs familles.',
                'description' => "Notre service dédié aux personnes âgées propose une évaluation gériatrique globale et une prise en charge pluridisciplinaire. Nous plaçons la qualité de vie, le maintien de l'autonomie et le respect de la dignité au cœur de chaque accompagnement.",
                'features' => [
                    ['icon' => '❤️', 'title' => 'Suivi gériatrique',  'desc' => "Évaluation globale de la santé du senior, incluant fragilité et autonomie."],
                    ['icon' => '💊', 'title' => 'Polymédication',      'desc' => 'Révision et optimisation des traitements médicamenteux complexes.'],
                    ['icon' => '🏡', 'title' => 'Maintien à domicile', 'desc' => 'Coordination des soins pour favoriser le maintien au domicile.'],
                    ['icon' => '🤝', 'title' => 'Accompagnement',      'desc' => "Soutien à la famille et aux aidants dans leur rôle de soignant."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Évaluation gériatrique', 'desc' => 'Bilan complet : santé physique, cognitive, autonomie et situation sociale.'],
                    ['num' => '02', 'title' => 'Plan de soins',          'desc' => "Élaboration d'un plan personnalisé avec l'équipe pluridisciplinaire et la famille."],
                    ['num' => '03', 'title' => 'Mise en œuvre',          'desc' => 'Coordination des intervenants : médecins, infirmiers, kinésithérapeutes, assistante sociale.'],
                    ['num' => '04', 'title' => 'Réévaluation régulière', 'desc' => "Ajustement du plan de soins selon l'évolution de l'état du patient."],
                ],
                'details' => [
                    ['icon' => '🏠',     'label' => 'Domicile',  'value' => 'Soins et visites à domicile disponibles sur demande'],
                    ['icon' => '👨‍👩‍👧', 'label' => 'Famille',  'value' => 'Rencontres et accompagnement des aidants familiaux'],
                    ['icon' => '📋',     'label' => 'Dossier',   'value' => 'Dossier médical partagé avec tous les intervenants'],
                    ['icon' => '🚑',     'label' => 'Urgences',  'value' => 'Ligne prioritaire pour les urgences des personnes âgées'],
                ],
            ],
            [
                'path' => '/services/laboratoire', 'sort_order' => 5,
                'title' => "Laboratoire d'Analyses", 'tag' => 'Services médicaux', 'icon' => '🔬',
                'subtitle' => "Analyses biologiques et examens de laboratoire réalisés avec des équipements modernes.",
                'description' => "Notre laboratoire d'analyses médicales dispose d'équipements de pointe et d'une équipe de biologistes qualifiés. Nous réalisons un large spectre d'analyses biologiques avec des délais de rendu de résultats optimisés.",
                'features' => [
                    ['icon' => '🩸', 'title' => 'Analyses de sang',    'desc' => 'Numération, bilan biochimique, marqueurs infectieux et bien plus.'],
                    ['icon' => '🧪', 'title' => 'Microbiologie',        'desc' => 'Cultures bactériennes, antibiogrammes et analyses parasitologiques.'],
                    ['icon' => '🔬', 'title' => 'Anatomopathologie',    'desc' => 'Examen histologique des biopsies et prélèvements tissulaires.'],
                    ['icon' => '⚡', 'title' => 'Résultats rapides',    'desc' => 'Résultats disponibles dans les meilleurs délais avec transmission au médecin.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Ordonnance',  'desc' => "Présentez l'ordonnance de votre médecin pour la prescription des examens."],
                    ['num' => '02', 'title' => 'Prélèvement', 'desc' => 'Réalisation du prélèvement sanguin, urinaire ou autre selon le bilan prescrit.'],
                    ['num' => '03', 'title' => 'Analyse',     'desc' => 'Traitement des échantillons au laboratoire par notre équipe de biologistes.'],
                    ['num' => '04', 'title' => 'Résultats',   'desc' => "Remise des résultats au patient et/ou transmission directe au médecin prescripteur."],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Horaires prélèvements', 'value' => 'Lun – Sam : 7h00 – 11h00 (à jeun de préférence)'],
                    ['icon' => '⚡', 'label' => 'Délai résultats',       'value' => 'Biochimie : 2h | Bactériologie : 24-48h | Anapath : 5-7j'],
                    ['icon' => '🩹', 'label' => 'Préparation',          'value' => 'Jeûne de 8h requis pour certains bilans (glycémie, lipides)'],
                    ['icon' => '💳', 'label' => 'Prise en charge',       'value' => 'Conventionné avec les principales assurances et mutuelles'],
                ],
            ],
            [
                'path' => '/services/pharmacie', 'sort_order' => 6,
                'title' => 'Pharmacie', 'tag' => 'Services médicaux', 'icon' => '💊',
                'subtitle' => 'Pharmacie hospitalière au service des patients et des professionnels de santé.',
                'description' => "Notre pharmacie assure la dispensation des médicaments prescrits avec un conseil pharmaceutique de qualité. Notre équipe de pharmaciens veille à la sécurité de vos traitements et vous guide dans la bonne utilisation de vos médicaments.",
                'features' => [
                    ['icon' => '💊', 'title' => 'Dispensation',         'desc' => 'Délivrance des médicaments prescrits avec conseil pharmaceutique personnalisé.'],
                    ['icon' => '🏥', 'title' => 'Pharmacie hospitalière','desc' => 'Gestion des médicaments pour les patients hospitalisés.'],
                    ['icon' => '📦', 'title' => 'Stock et traçabilité',  'desc' => 'Gestion rigoureuse des stocks et traçabilité complète des médicaments.'],
                    ['icon' => '🌿', 'title' => 'Conseil',               'desc' => 'Conseils sur les interactions médicamenteuses et la bonne utilisation.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Présentation',      'desc' => 'Présentez votre ordonnance médicale au guichet de la pharmacie.'],
                    ['num' => '02', 'title' => 'Vérification',      'desc' => 'Le pharmacien vérifie la prescription et les éventuelles interactions médicamenteuses.'],
                    ['num' => '03', 'title' => 'Préparation',       'desc' => 'Préparation et conditionnement soigneux de votre traitement.'],
                    ['num' => '04', 'title' => 'Conseil & délivrance','desc' => 'Remise des médicaments avec explications sur leur utilisation correcte et sécurisée.'],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Horaires',       'value' => 'Lun – Ven : 8h00 – 19h00 | Sam : 8h00 – 15h00'],
                    ['icon' => '💳', 'label' => 'Prise en charge', 'value' => 'Conventionné avec les assurances maladie partenaires'],
                    ['icon' => '📋', 'label' => 'Ordonnance',     'value' => 'Obligatoire pour les médicaments sur prescription'],
                    ['icon' => '🌿', 'label' => 'Conseil libre',  'value' => 'Conseil pharmaceutique gratuit sans rendez-vous'],
                ],
            ],
            [
                'path' => '/sante/actualite', 'sort_order' => 7,
                'title' => 'Actualité Santé', 'tag' => 'Ma Santé', 'icon' => '📰',
                'subtitle' => 'Les dernières informations et nouvelles du secteur de la santé pour rester informé.',
                'description' => "Restez informé des dernières actualités du monde de la santé à travers notre espace dédié. Communiqués de notre établissement, avancées médicales, campagnes de sensibilisation — retrouvez ici toutes les informations pertinentes pour prendre soin de votre santé.",
                'features' => [
                    ['icon' => '📢', 'title' => 'Communiqués',       'desc' => "Communiqués officiels de notre établissement sur la santé publique."],
                    ['icon' => '🔬', 'title' => 'Recherche médicale', 'desc' => "Avancées médicales et scientifiques en lien avec nos domaines d'expertise."],
                    ['icon' => '📅', 'title' => 'Événements santé',   'desc' => 'Campagnes de sensibilisation, journées mondiales et dépistages gratuits.'],
                    ['icon' => '📺', 'title' => 'Médias & presse',    'desc' => 'Interviews, reportages et interventions de nos professionnels de santé.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Nos publications',    'desc' => "Articles rédigés régulièrement par notre équipe médicale sur les sujets de santé actuels."],
                    ['num' => '02', 'title' => 'Événements à venir',  'desc' => 'Calendrier des journées de sensibilisation et campagnes de dépistage gratuit.'],
                    ['num' => '03', 'title' => 'Conseils santé',      'desc' => 'Fiches pratiques et guides de santé rédigés par nos professionnels.'],
                    ['num' => '04', 'title' => 'Newsletter',          'desc' => "Abonnez-vous à notre newsletter pour recevoir l'actualité santé directement."],
                ],
                'details' => [
                    ['icon' => '📅', 'label' => 'Mise à jour',    'value' => 'Contenu actualisé chaque semaine par notre équipe'],
                    ['icon' => '📧', 'label' => 'Newsletter',     'value' => "Inscription disponible à l'accueil ou par email"],
                    ['icon' => '📱', 'label' => 'Réseaux sociaux','value' => "Suivez-nous pour ne rien manquer"],
                    ['icon' => '✅', 'label' => 'Sources',        'value' => 'Informations validées par notre équipe médicale'],
                ],
            ],
            [
                'path' => '/sante/espace-thematique', 'sort_order' => 8,
                'title' => 'Espace Thématique', 'tag' => 'Ma Santé', 'icon' => '📚',
                'subtitle' => 'Ressources éducatives et thématiques pour mieux comprendre votre santé.',
                'description' => "L'espace thématique est un lieu de ressources éducatives consacré aux grandes problématiques de santé. Diabète, hypertension, santé mentale, nutrition, activité physique — chaque thème est abordé avec rigueur et accessibilité.",
                'features' => [
                    ['icon' => '❤️', 'title' => 'Maladies chroniques', 'desc' => "Comprendre et vivre avec le diabète, l'hypertension, l'asthme."],
                    ['icon' => '🧠', 'title' => 'Santé mentale',        'desc' => 'Ressources sur le stress, la dépression et le bien-être psychologique.'],
                    ['icon' => '🍎', 'title' => 'Nutrition',            'desc' => 'Conseils alimentaires et guides pratiques pour une alimentation équilibrée.'],
                    ['icon' => '🏃', 'title' => 'Sport & santé',        'desc' => "Bienfaits de l'activité physique et recommandations adaptées à chacun."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Comprendre', 'desc' => 'Accédez à des fiches explicatives sur les principales maladies et conditions de santé.'],
                    ['num' => '02', 'title' => 'Se préparer','desc' => 'Guides pratiques pour préparer vos consultations et poser les bonnes questions.'],
                    ['num' => '03', 'title' => 'Agir',       'desc' => "Plans d'action et recommandations concrètes pour améliorer votre hygiène de vie."],
                    ['num' => '04', 'title' => 'Partager',   'desc' => 'Ressources à partager avec vos proches pour sensibiliser tout votre entourage.'],
                ],
                'details' => [
                    ['icon' => '📚', 'label' => 'Thèmes',        'value' => 'Plus de 20 thématiques de santé couvertes'],
                    ['icon' => '✅', 'label' => 'Validation',    'value' => 'Tous les contenus validés par notre équipe médicale'],
                    ['icon' => '🌍', 'label' => 'Accessibilité', 'value' => 'Contenus disponibles en français et langues locales'],
                    ['icon' => '🆓', 'label' => 'Accès',        'value' => 'Ressources gratuites accessibles à tous'],
                ],
            ],
            [
                'path' => '/sante/prevention', 'sort_order' => 9,
                'title' => 'Prévention et Santé Publique', 'tag' => 'Ma Santé', 'icon' => '🛡️',
                'subtitle' => 'Programmes de prévention et actions de santé publique pour protéger toute la communauté.',
                'description' => "La prévention est au cœur de notre mission de santé publique. Nous déployons des programmes de vaccination, de dépistage et de sensibilisation pour prévenir les maladies avant qu'elles ne s'installent.",
                'features' => [
                    ['icon' => '💉', 'title' => 'Vaccination',        'desc' => 'Programme de vaccination selon le calendrier vaccinal national mis à jour.'],
                    ['icon' => '🔎', 'title' => 'Dépistage',          'desc' => 'Campagnes de dépistage précoce du cancer et des maladies chroniques.'],
                    ['icon' => '🌍', 'title' => 'Santé communautaire', 'desc' => 'Actions de terrain dans les quartiers, écoles et zones rurales.'],
                    ['icon' => '📣', 'title' => 'Sensibilisation',     'desc' => "Ateliers d'éducation à la santé ouverts à tous, animés par nos professionnels."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Identification des risques', 'desc' => 'Identification des risques sanitaires prioritaires dans la communauté desservie.'],
                    ['num' => '02', 'title' => 'Programme adapté',           'desc' => 'Élaboration de programmes de prévention ciblés selon les besoins locaux.'],
                    ['num' => '03', 'title' => 'Actions terrain',            'desc' => 'Déploiement des actions : campagnes, ateliers, visites en communauté.'],
                    ['num' => '04', 'title' => 'Évaluation',                 'desc' => "Mesure de l'impact et ajustement continu des programmes selon les résultats."],
                ],
                'details' => [
                    ['icon' => '💉', 'label' => 'Vaccination',    'value' => 'Vaccins obligatoires et recommandés disponibles'],
                    ['icon' => '📅', 'label' => 'Dépistage',      'value' => 'Journées de dépistage gratuit organisées régulièrement'],
                    ['icon' => '🏫', 'label' => 'Interventions',  'value' => 'Écoles, entreprises et communautés desservies'],
                    ['icon' => '🆓', 'label' => 'Gratuité',       'value' => 'Certains programmes de prévention entièrement gratuits'],
                ],
            ],
            [
                'path' => '/partenaires', 'sort_order' => 10,
                'title' => 'Nos Partenaires', 'tag' => 'Pages', 'icon' => '🤝',
                'subtitle' => "Un réseau d'établissements, d'assurances et d'institutions partenaires pour un meilleur accès aux soins.",
                'description' => "SEN-MED s'appuie sur un réseau solide de partenaires institutionnels, associatifs et privés pour offrir la meilleure prise en charge possible à ses patients.",
                'features' => [
                    ['icon' => '🏥', 'title' => 'Établissements de santé', 'desc' => 'Hôpitaux, cliniques et centres de santé avec lesquels nous collaborons étroitement.'],
                    ['icon' => '🛡️', 'title' => 'Assurances & mutuelles', 'desc' => 'Couvertures santé acceptées pour faciliter votre prise en charge financière.'],
                    ['icon' => '🌐', 'title' => 'ONG & institutions',      'desc' => 'Partenariats avec des organisations nationales et internationales.'],
                    ['icon' => '🎓', 'title' => 'Universités',             'desc' => 'Collaboration active avec les facultés de médecine et instituts de formation.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Assurances acceptées', 'desc' => "Nous travaillons avec les principales compagnies d'assurance maladie du Sénégal."],
                    ['num' => '02', 'title' => 'Référencement',        'desc' => 'Possibilité de référencer vos patients vers nos services spécialisés.'],
                    ['num' => '03', 'title' => 'Formations communes',  'desc' => 'Organisation de formations et conférences médicales en collaboration.'],
                    ['num' => '04', 'title' => 'Devenir partenaire',   'desc' => "Contactez-nous pour explorer une collaboration avec notre établissement."],
                ],
                'details' => [
                    ['icon' => '🛡️', 'label' => 'Assurances',   'value' => 'Conventionné avec les principales assurances maladie'],
                    ['icon' => '🏥', 'label' => 'Réseau',        'value' => 'Plus de 15 établissements partenaires au Sénégal'],
                    ['icon' => '🌍', 'label' => 'International', 'value' => 'Partenariats avec des ONG et institutions internationales'],
                    ['icon' => '📞', 'label' => 'Partenariat',   'value' => 'Contactez-nous pour tout projet de collaboration'],
                ],
            ],
            [
                'path' => '/formations/ide-sage-femme', 'sort_order' => 11,
                'title' => 'Stagiaire IDE / Sage-Femme', 'tag' => 'Formations', 'icon' => '🎓',
                'subtitle' => "Accueil et encadrement des stagiaires infirmiers diplômés d'État et sages-femmes en formation.",
                'description' => "Notre établissement accueille des étudiants en soins infirmiers et en maïeutique dans le cadre de leurs stages cliniques obligatoires. Les stagiaires bénéficient d'un encadrement de qualité par des tuteurs expérimentés.",
                'features' => [
                    ['icon' => '📋', 'title' => 'Dossier de stage',     'desc' => 'Constitution du dossier de candidature pour le stage clinique.'],
                    ['icon' => '👩‍⚕️', 'title' => 'Encadrement tutoral', 'desc' => 'Suivi personnalisé par des tuteurs expérimentés tout au long du stage.'],
                    ['icon' => '📚', 'title' => 'Objectifs pédagogiques','desc' => 'Programme structuré aligné sur les compétences du référentiel de formation.'],
                    ['icon' => '📝', 'title' => 'Évaluation',            'desc' => 'Évaluation formative et sommative des compétences professionnelles acquises.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Candidature', 'desc' => 'Envoyez votre dossier (lettre de motivation, convention, CV) à la direction des soins.'],
                    ['num' => '02', 'title' => 'Validation',  'desc' => "Étude de votre dossier et confirmation écrite de l'acceptation du stage."],
                    ['num' => '03', 'title' => 'Accueil',     'desc' => "Journée d'intégration : présentation de l'établissement, des équipes et du règlement."],
                    ['num' => '04', 'title' => 'Stage & évaluation', 'desc' => 'Déroulement du stage avec suivi régulier et évaluation des compétences acquises.'],
                ],
                'details' => [
                    ['icon' => '📅',   'label' => 'Durée',      'value' => "Stages de 4 à 16 semaines selon le niveau d'études"],
                    ['icon' => '📋',   'label' => 'Dossier requis', 'value' => 'Convention de stage, lettre de motivation, CV, carte étudiant'],
                    ['icon' => '👩‍⚕️', 'label' => 'Encadrant',  'value' => "Un tuteur référent désigné par service d'accueil"],
                    ['icon' => '🏥',   'label' => 'Services',   'value' => 'Médecine générale, maternité, urgences, laboratoire'],
                ],
            ],
            [
                'path' => '/formations/aide-infirmier', 'sort_order' => 12,
                'title' => 'Aide Infirmier', 'tag' => 'Formations', 'icon' => '🩺',
                'subtitle' => 'Formation pratique pour les aides-infirmiers en milieu hospitalier et de soins.',
                'description' => "La formation d'aide-infirmier au sein de notre établissement offre une immersion professionnelle complète dans les soins de base. Les apprenants acquièrent des compétences pratiques essentielles sous la supervision directe d'infirmiers diplômés.",
                'features' => [
                    ['icon' => '🛏️', 'title' => 'Soins de base',      'desc' => "Apprentissage des soins d'hygiène, de confort et de nursing du patient."],
                    ['icon' => '💉', 'title' => 'Techniques de soins', 'desc' => 'Initiation aux techniques de soins infirmiers sous supervision directe.'],
                    ['icon' => '🤝', 'title' => 'Relation patient',    'desc' => 'Communication bienveillante et accompagnement humain du patient.'],
                    ['icon' => '📜', 'title' => 'Attestation',         'desc' => "Délivrance d'une attestation officielle de formation à l'issue du parcours."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Inscription',          'desc' => 'Déposez votre dossier de candidature à la direction des soins infirmiers.'],
                    ['num' => '02', 'title' => 'Entretien',            'desc' => 'Entretien de motivation avec le responsable pédagogique de la formation.'],
                    ['num' => '03', 'title' => 'Formation théorique',  'desc' => "Modules théoriques sur l'hygiène, la sécurité et les gestes de soins de base."],
                    ['num' => '04', 'title' => 'Pratique & certification', 'desc' => "Mise en pratique sur le terrain et délivrance de l'attestation de formation."],
                ],
                'details' => [
                    ['icon' => '📅', 'label' => 'Durée',         'value' => 'Formation de 3 à 6 mois selon le programme choisi'],
                    ['icon' => '📋', 'label' => 'Prérequis',     'value' => 'BFEM minimum, bonne condition physique, sens du service'],
                    ['icon' => '💬', 'label' => 'Renseignements','value' => 'Se renseigner auprès de la direction pour les modalités'],
                    ['icon' => '🏅', 'label' => 'Certification', 'value' => 'Attestation de formation délivrée par notre établissement'],
                ],
            ],
            [
                'path' => '/patient/sejour', 'sort_order' => 13,
                'title' => 'Votre Séjour', 'tag' => 'Patient / Usager', 'icon' => '🏥',
                'subtitle' => "Tout ce que vous devez savoir pour préparer et vivre sereinement votre séjour dans notre établissement.",
                'description' => "Nous nous engageons à rendre votre séjour le plus confortable et serein possible. De l'admission à la sortie, notre équipe est présente à chaque étape pour vous accompagner et répondre à vos besoins.",
                'features' => [
                    ['icon' => '📋', 'title' => 'Admission',     'desc' => "Procédures d'admission, documents requis et formalités administratives d'entrée."],
                    ['icon' => '🛏️', 'title' => 'Hébergement',   'desc' => 'Chambres individuelles et collectives équipées pour votre confort.'],
                    ['icon' => '🍽️', 'title' => 'Restauration',  'desc' => 'Menus équilibrés, régimes spéciaux et horaires de repas adaptés.'],
                    ['icon' => '👪', 'title' => 'Visites',        'desc' => "Horaires de visite, règles d'accès et conditions d'accompagnement."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Avant votre arrivée', 'desc' => "Rassemblez vos documents : pièce d'identité, ordonnances, carnet de santé, attestation assurance."],
                    ['num' => '02', 'title' => 'Admission',           'desc' => "Accueil à la réception, formalités administratives et orientation vers votre service."],
                    ['num' => '03', 'title' => 'Pendant le séjour',   'desc' => 'Prise en charge médicale et soins infirmiers selon votre plan de traitement.'],
                    ['num' => '04', 'title' => 'Sortie',              'desc' => 'Consultation de sortie, remise des documents médicaux et organisation du suivi post-hospitalier.'],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Visites',        'value' => 'Chaque jour : 10h00 – 12h00 et 16h00 – 19h00'],
                    ['icon' => '📋', 'label' => 'Documents requis','value' => 'CNI, carnet de santé, ordonnances, attestation assurance'],
                    ['icon' => '🍽️', 'label' => 'Repas',          'value' => 'Servis à 7h30, 12h30 et 19h00 chaque jour'],
                    ['icon' => '☎️', 'label' => 'Standard',        'value' => 'Joignable 24h/24 pour les familles des patients hospitalisés'],
                ],
            ],
            [
                'path' => '/patient/droits', 'sort_order' => 14,
                'title' => 'Vos Droits', 'tag' => 'Patient / Usager', 'icon' => '⚖️',
                'subtitle' => "Connaissez vos droits en tant que patient et les engagements de notre établissement.",
                'description' => "En tant que patient, vous bénéficiez de droits fondamentaux que notre établissement s'engage à respecter et à défendre. Ces droits visent à garantir votre dignité, votre autonomie et la qualité de votre prise en charge.",
                'features' => [
                    ['icon' => '🔒', 'title' => 'Confidentialité',     'desc' => 'Protection absolue de vos données médicales et de votre vie privée.'],
                    ['icon' => '📝', 'title' => 'Consentement éclairé', 'desc' => "Droit à l'information et consentement libre avant tout acte médical."],
                    ['icon' => '📁', 'title' => 'Accès au dossier',    'desc' => "Droit de consulter et d'obtenir une copie de votre dossier médical."],
                    ['icon' => '📣', 'title' => 'Réclamations',        'desc' => "Procédures pour exprimer une plainte ou une insatisfaction en toute transparence."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => "Droit à l'information", 'desc' => "Vous avez le droit d'être informé clairement sur votre état de santé et les traitements proposés."],
                    ['num' => '02', 'title' => 'Consentement libre',    'desc' => "Tout acte médical nécessite votre consentement libre et éclairé. Vous pouvez le retirer à tout moment."],
                    ['num' => '03', 'title' => 'Confidentialité',       'desc' => 'Vos informations médicales sont strictement confidentielles et protégées par la loi.'],
                    ['num' => '04', 'title' => 'Réclamation',           'desc' => "En cas d'insatisfaction, vous pouvez saisir la direction ou le médiateur de l'établissement."],
                ],
                'details' => [
                    ['icon' => '📁', 'label' => 'Dossier médical', 'value' => 'Demande de copie possible sous 8 jours ouvrables'],
                    ['icon' => '🤝', 'label' => 'Médiateur',       'value' => 'Médiateur médical disponible pour résoudre les litiges'],
                    ['icon' => '📝', 'label' => 'Consentement',    'value' => 'Formulaire de consentement remis avant toute intervention'],
                    ['icon' => '📞', 'label' => 'Réclamations',    'value' => 'Direction disponible lun – ven de 9h à 17h'],
                ],
            ],
            [
                'path' => '/patient/associations', 'sort_order' => 15,
                'title' => 'Les Associations Partenaires', 'tag' => 'Patient / Usager', 'icon' => '🤝',
                'subtitle' => "Des associations engagées à vos côtés pour vous soutenir dans votre parcours de soins.",
                'description' => "Notre établissement collabore avec de nombreuses associations qui apportent un soutien précieux aux patients et à leurs familles. Ces partenaires complètent notre action médicale pour une prise en charge véritablement globale.",
                'features' => [
                    ['icon' => '❤️', 'title' => 'Soutien aux patients',     'desc' => "Associations d'aide aux malades chroniques et à leurs familles."],
                    ['icon' => '🌍', 'title' => 'Solidarité',               'desc' => "Réseaux de solidarité pour l'accès aux soins des populations vulnérables."],
                    ['icon' => '🎗️', 'title' => 'Pathologies spécifiques',  'desc' => 'Associations dédiées au cancer, au diabète, à la santé mentale, etc.'],
                    ['icon' => '📞', 'title' => 'Contacts utiles',           'desc' => 'Annuaire des associations partenaires et leurs coordonnées complètes.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Identification',   'desc' => "L'équipe soignante identifie les patients pouvant bénéficier d'un soutien associatif."],
                    ['num' => '02', 'title' => 'Orientation',      'desc' => "Mise en relation avec l'association la plus adaptée à votre situation."],
                    ['num' => '03', 'title' => 'Accompagnement',   'desc' => 'Les bénévoles et professionnels associatifs vous accompagnent dans vos démarches.'],
                    ['num' => '04', 'title' => 'Suivi coordonné',  'desc' => "Coordination entre l'équipe médicale et l'association pour un suivi cohérent."],
                ],
                'details' => [
                    ['icon' => '🏢', 'label' => 'Espace dédié',  'value' => "Espace associations disponible au sein de l'établissement"],
                    ['icon' => '📅', 'label' => 'Permanences',   'value' => 'Présence de bénévoles associatifs plusieurs jours par semaine'],
                    ['icon' => '🤝', 'label' => 'Réseau',        'value' => 'Plus de 10 associations partenaires actives'],
                    ['icon' => '📞', 'label' => 'Contact',       'value' => "Renseignements à l'accueil ou auprès de l'assistante sociale"],
                ],
            ],
            [
                'path' => '/patient/demarches', 'sort_order' => 16,
                'title' => 'Vos Démarches en Ligne', 'tag' => 'Patient / Usager', 'icon' => '💻',
                'subtitle' => 'Simplifiez vos démarches administratives et médicales depuis chez vous.',
                'description' => "Notre portail de démarches en ligne vous permet d'effectuer vos principales formalités médicales et administratives depuis votre domicile. Prise de rendez-vous, accès à vos résultats, paiement de vos factures — tout est accessible 24h/24.",
                'features' => [
                    ['icon' => '📅', 'title' => 'Prise de RDV',            'desc' => 'Réservez votre rendez-vous en ligne rapidement et en quelques clics.'],
                    ['icon' => '📄', 'title' => 'Ordonnances & résultats', 'desc' => "Accédez à vos ordonnances et résultats d'analyses en ligne."],
                    ['icon' => '💳', 'title' => 'Paiement sécurisé',       'desc' => 'Réglez vos factures médicales en ligne de façon sécurisée.'],
                    ['icon' => '📂', 'title' => 'Dossier en ligne',        'desc' => 'Consultez et téléchargez vos documents médicaux à tout moment.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Inscription',         'desc' => 'Créez votre compte patient sur notre portail avec votre numéro de dossier médical.'],
                    ['num' => '02', 'title' => 'Connexion sécurisée', 'desc' => 'Accédez à votre espace personnel via un identifiant et mot de passe sécurisés.'],
                    ['num' => '03', 'title' => 'Vos démarches',       'desc' => "Effectuez vos démarches : RDV, paiements, téléchargement de documents médicaux."],
                    ['num' => '04', 'title' => 'Suivi en temps réel', 'desc' => 'Recevez des notifications par SMS ou email pour confirmer toutes vos actions.'],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Disponibilité', 'value' => '24h/24, 7j/7 depuis tout appareil connecté'],
                    ['icon' => '🔒', 'label' => 'Sécurité',     'value' => 'Connexion sécurisée SSL, données entièrement cryptées'],
                    ['icon' => '📱', 'label' => 'Compatible',   'value' => 'Smartphone, tablette et ordinateur'],
                    ['icon' => '🆘', 'label' => 'Aide technique','value' => 'Support disponible en semaine de 8h à 17h'],
                ],
            ],
            [
                'path' => '/payer/wave', 'sort_order' => 17,
                'title' => 'Paiement par Wave', 'tag' => 'Payer en ligne', 'icon' => '📱',
                'subtitle' => 'Payez vos frais médicaux rapidement et en toute sécurité via Wave Mobile Money.',
                'description' => "Wave est une solution de paiement mobile simple et rapide, très répandue au Sénégal. Pour régler vos frais médicaux via Wave, il vous suffit de scanner le QR code disponible à l'accueil ou d'effectuer un transfert vers notre numéro Wave dédié.",
                'features' => [
                    ['icon' => '📱', 'title' => 'Simple & rapide', 'desc' => 'Scannez le QR code ou entrez le numéro pour payer en quelques secondes.'],
                    ['icon' => '🔒', 'title' => 'Sécurisé',        'desc' => 'Transactions cryptées et intégralement protégées par Wave.'],
                    ['icon' => '📩', 'title' => 'Reçu instantané', 'desc' => 'Confirmation et reçu de paiement envoyés immédiatement par SMS.'],
                    ['icon' => '💰', 'title' => 'Sans frais',       'desc' => 'Aucun frais supplémentaire pour les paiements Wave en établissement.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Ouvrez Wave',   'desc' => "Lancez l'application Wave sur votre smartphone (iOS ou Android)."],
                    ['num' => '02', 'title' => "Envoi d'argent", 'desc' => 'Appuyez sur "Envoyer" et entrez notre numéro Wave ou scannez le QR code.'],
                    ['num' => '03', 'title' => 'Montant',       'desc' => 'Saisissez le montant exact de votre facture médicale.'],
                    ['num' => '04', 'title' => 'Confirmation',  'desc' => "Validez la transaction et présentez votre SMS de confirmation à l'accueil."],
                ],
                'details' => [
                    ['icon' => '📱', 'label' => 'Application', 'value' => 'Wave Mobile Money (iOS et Android)'],
                    ['icon' => '⚡', 'label' => 'Délai',       'value' => 'Paiement instantané, validation immédiate'],
                    ['icon' => '💰', 'label' => 'Frais',       'value' => 'Aucun frais supplémentaire de notre côté'],
                    ['icon' => '🆘', 'label' => 'Problème',    'value' => "En cas d'échec, contactez l'accueil pour une alternative"],
                ],
                'info' => ['label' => 'Numéro Wave', 'value' => "Disponible à l'accueil"],
            ],
            [
                'path' => '/payer/orange-money', 'sort_order' => 18,
                'title' => 'Orange Money', 'tag' => 'Payer en ligne', 'icon' => '🟠',
                'subtitle' => 'Réglez vos consultations et soins médicaux via Orange Money en toute simplicité.',
                'description' => "Orange Money est le service de paiement mobile d'Orange Sénégal, accessible depuis tout téléphone, même sans smartphone. Vous pouvez utiliser l'application Orange Money, effectuer un transfert via le menu USSD *144#, ou vous rendre chez un agent Orange Money.",
                'features' => [
                    ['icon' => '📲', 'title' => 'Paiement mobile', 'desc' => 'Utilisez votre solde Orange Money pour régler vos soins médicaux.'],
                    ['icon' => '🔐', 'title' => 'Sécurisé',        'desc' => 'Transactions sécurisées par Orange avec confirmation par code PIN.'],
                    ['icon' => '🧾', 'title' => 'Traçabilité',     'desc' => 'Historique complet de vos paiements disponible dans l\'application.'],
                    ['icon' => '🌍', 'title' => 'Disponibilité',   'desc' => "Accessible depuis tout le Sénégal, 24h/24 et 7j/7."],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Composez *144#',     'desc' => "Ou ouvrez directement l'application Orange Money sur votre téléphone."],
                    ['num' => '02', 'title' => 'Paiement marchand',  'desc' => 'Choisissez "Paiement marchand" ou "Transfert" et entrez notre numéro.'],
                    ['num' => '03', 'title' => 'Montant & PIN',      'desc' => 'Entrez le montant de votre facture et confirmez avec votre code PIN secret.'],
                    ['num' => '04', 'title' => 'Confirmation',       'desc' => "Vous recevez un SMS de confirmation — présentez-le à l'accueil."],
                ],
                'details' => [
                    ['icon' => '📞', 'label' => 'USSD',        'value' => 'Composez *144# depuis votre téléphone Orange'],
                    ['icon' => '📱', 'label' => 'Application', 'value' => 'Orange Money disponible sur Android et iOS'],
                    ['icon' => '⚡', 'label' => 'Délai',       'value' => "Paiement traité en moins d'une minute"],
                    ['icon' => '🆘', 'label' => 'Assistance',  'value' => 'Service client Orange : composez le 888'],
                ],
                'info' => ['label' => 'Numéro Orange Money', 'value' => "Disponible à l'accueil"],
            ],
            [
                'path' => '/payer/especes', 'sort_order' => 19,
                'title' => 'Paiement en Espèces', 'tag' => 'Payer en ligne', 'icon' => '💵',
                'subtitle' => "Payez directement à la caisse de l'établissement pour vos consultations et soins.",
                'description' => "Le paiement en espèces reste disponible à notre caisse principale. Notre caissière vous accueille du lundi au vendredi et vous remet un reçu fiscal officiel pour chaque paiement effectué. Des facilités de paiement échelonné peuvent être envisagées sur demande.",
                'features' => [
                    ['icon' => '🏦', 'title' => 'Caisse principale', 'desc' => "Paiement à la caisse centrale de l'établissement, accessible en semaine."],
                    ['icon' => '🧾', 'title' => 'Reçu fiscal',       'desc' => 'Un reçu officiel est systématiquement délivré pour chaque paiement.'],
                    ['icon' => '⏰', 'title' => 'Horaires',          'desc' => 'La caisse est ouverte du lundi au vendredi de 8h à 17h sans interruption.'],
                    ['icon' => '💬', 'title' => 'Facilités',         'desc' => 'Paiement échelonné possible sur demande pour les montants importants.'],
                ],
                'steps' => [
                    ['num' => '01', 'title' => 'Fiche de facturation', 'desc' => 'Après votre consultation ou soin, récupérez votre fiche de facturation.'],
                    ['num' => '02', 'title' => 'Caisse',              'desc' => 'Présentez-vous à la caisse principale avec votre fiche de facturation.'],
                    ['num' => '03', 'title' => 'Paiement',            'desc' => 'Réglez le montant indiqué en espèces auprès de notre caissière.'],
                    ['num' => '04', 'title' => 'Reçu',                'desc' => 'Conservez précieusement votre reçu fiscal pour vos remboursements éventuels.'],
                ],
                'details' => [
                    ['icon' => '⏰', 'label' => 'Horaires caisse', 'value' => 'Lun – Ven : 8h00 – 17h00 sans interruption'],
                    ['icon' => '📍', 'label' => 'Emplacement',    'value' => "Caisse principale à l'entrée de l'établissement"],
                    ['icon' => '🧾', 'label' => 'Justificatif',   'value' => 'Reçu fiscal délivré pour tout paiement en espèces'],
                    ['icon' => '💬', 'label' => 'Facilités',      'value' => "Paiement échelonné possible, renseignements à l'accueil"],
                ],
            ],
        ];

        foreach ($pages as $page) {
            WebPage::updateOrCreate(['path' => $page['path']], $page);
        }
    }
}
