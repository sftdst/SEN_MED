# Guide Technique & Utilisateur — SenMed

> **Plateforme de gestion médicale intégrée**  
> Version : 1.0 — Avril 2026  
> Développé par : **DST Computing**

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Architecture technique](#2-architecture-technique)
3. [Installation & démarrage](#3-installation--démarrage)
4. [Navigation dans l'application](#4-navigation-dans-lapplication)
5. [Module Accueil & Tableau de bord](#5-module-accueil--tableau-de-bord)
6. [Module Patients](#6-module-patients)
7. [Module Visites](#7-module-visites)
8. [Module Salle d'attente](#8-module-salle-dattente)
9. [Module Consultation](#9-module-consultation)
10. [Module Hospitalisation](#10-module-hospitalisation)
11. [Module Transferts](#11-module-transferts)
12. [Module Rendez-vous](#12-module-rendez-vous)
13. [Module Espace Médecin](#13-module-espace-médecin)
14. [Module Pharmacie](#14-module-pharmacie)
15. [Module Comptabilité & Paiements](#15-module-comptabilité--paiements)
16. [Module Ressources Humaines](#16-module-ressources-humaines)
17. [Module Configuration](#17-module-configuration)
18. [Module Formulaires (Modèles de documents)](#18-module-formulaires-modèles-de-documents)
19. [Structure de la base de données](#19-structure-de-la-base-de-données)
20. [API Backend — Référence rapide](#20-api-backend--référence-rapide)

---

## 1. Présentation générale

**SenMed** est une plateforme de gestion médicale complète conçue pour les établissements de santé (cliniques, hôpitaux, centres de santé). Elle centralise l'ensemble des flux administratifs, cliniques et financiers dans une interface web unifiée.

### Fonctionnalités couvertes

| Domaine | Fonctionnalités |
|---------|----------------|
| **Clinique** | Patients, visites, consultations, signes vitaux, prescriptions, examens |
| **Hospitalisation** | Gestion des chambres, admissions, sorties, transferts |
| **Rendez-vous** | Planning médecin, créneaux, réservations |
| **Pharmacie** | Stock, commandes, fournisseurs, approvisionnements, inventaires |
| **Comptabilité** | Facturation automatique, paiements, crédits patients, partenaires |
| **Ressources humaines** | Personnel, congés, absences, contrats |
| **Configuration** | Paramétrage système, tarification, formulaires de documents |

---

## 2. Architecture technique

### Stack Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 19.2 | Framework UI |
| **React Router DOM** | 7.14 | Navigation SPA |
| **Vite** | 8.0 | Build & serveur dev |
| **Axios** | 1.14 | Appels API HTTP |
| **Recharts** | 3.8 | Graphiques & courbes |
| **React Big Calendar** | 1.19 | Planning |
| **QRCode.react** | 4.2 | Génération QR code |
| **date-fns** | 4.1 | Manipulation des dates |

### Stack Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Laravel** | 12.0 | Framework API REST |
| **PHP** | 8.2+ | Langage serveur |
| **Laravel Sanctum** | 4.0 | Authentification API (Bearer token) |
| **MySQL / MariaDB** | — | Base de données relationnelle |
| **L5-Swagger** | — | Documentation API auto |
| **Laravel Sail** | — | Environnement Docker |

### Structure des dossiers

```
SEN_MED/
├── Frontend/               # Application React
│   └── src/
│       ├── pages/          # Composants page (un dossier par module)
│       ├── components/     # Composants réutilisables (Layout, Sidebar…)
│       ├── api/            # Couche API (axios + endpoints)
│       ├── App.jsx         # Routeur principal
│       └── theme.js        # Charte graphique (couleurs, espacements)
│
├── Backend/                # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # 28 contrôleurs REST
│   │   └── Models/                 # Modèles Eloquent
│   ├── database/
│   │   └── migrations/             # 50+ tables
│   └── routes/api.php              # Définition des routes API v1
│
└── MOBILE/                 # Application mobile Flutter (iOS / Android)
```

### Communication Frontend ↔ Backend

```
Frontend (React)  ──[HTTP/JSON]──▶  API Laravel  ──▶  MySQL
                  ◀──[JSON]───────
```

- **Base URL dev :** `http://localhost:8000/api/v1`
- **Authentification :** Bearer Token (stocké dans `localStorage.senmed_token`)
- **Format :** JSON (`Content-Type: application/json`)
- **Timeout par défaut :** 10 secondes

---

## 3. Installation & démarrage

### Prérequis

- PHP 8.2+ & Composer
- Node.js 18+ & npm
- MySQL 8.0+ ou MariaDB 10.6+

### Backend (Laravel)

```bash
cd Backend

# 1. Installer les dépendances
composer install

# 2. Copier et configurer l'environnement
cp .env.example .env
# Éditer .env : DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 3. Générer la clé d'application
php artisan key:generate

# 4. Exécuter les migrations (crée toutes les tables + données initiales)
php artisan migrate

# 5. Démarrer le serveur
php artisan serve
# → disponible sur http://localhost:8000
```

### Frontend (React)

```bash
cd Frontend

# 1. Installer les dépendances
npm install

# 2. Démarrer en développement
npm run dev
# → disponible sur http://localhost:5173

# 3. Build production
npm run build
```

---

## 4. Navigation dans l'application

La barre latérale (sidebar) est organisée en **5 groupes** repliables :

### ACCUEIL
| Menu | Route | Description |
|------|-------|-------------|
| Tableau de bord | `/` | Vue synthétique de l'activité |
| Patients | `/patients` | Gestion du dossier patient |
| Visites | `/visites` | Suivi des visites en cours |
| Salle d'attente | `/salle-attente` | File d'attente temps réel |
| Hospitalisation | `/hospitalisation` | Gestion des chambres & admissions |
| Transferts | `/transferts` | Transferts inter-services |
| Espace médical | `/planning` | Planning médecin |
| Gestion des RDV | `/rendezvous` | Rendez-vous patients |

### ESPACE MÉDECIN
| Menu | Route | Description |
|------|-------|-------------|
| Tableau de bord | `/espace-medecin` | Dashboard médecin |

### GESTION PHARMACEUTIQUE
| Menu | Route | Description |
|------|-------|-------------|
| Pharmacie | `/pharmacie` | Stock, commandes, inventaires |

### COMPTABILITÉ
| Menu | Route | Description |
|------|-------|-------------|
| Comptabilité | `/comptabilite` | Factures, paiements, crédits |

### ADMINISTRATION
| Menu | Route | Description |
|------|-------|-------------|
| Utilisateurs | `/personnels` | Gestion du personnel |
| Départements | `/departements` | Organigramme |
| Types de service | `/type-services` | Catégories de services |
| Services | `/services` | Services de l'établissement |
| Hôpitaux | `/hopitaux` | Gestion des établissements |
| Partenaires | `/partenaires` | Mutuelles, assurances |

### RESSOURCES HUMAINES
| Menu | Route | Description |
|------|-------|-------------|
| Gestion personnel | `/personnels` | Fiches du personnel |
| Gestion congés | `/ressources-humaines/conges` | Demandes et suivi congés |
| Absences & retards | `/ressources-humaines/absences` | Pointage absences |
| Gestion contrats | `/ressources-humaines/contrats` | Contrats de travail |

### CONFIGURATION
| Menu | Route | Description |
|------|-------|-------------|
| Configuration système | `/config-systeme` | Paramètres généraux |
| Config. sanitaire | `/config-sanitaire` | Paramètres cliniques |
| **Formulaires** | `/formulaires` | Modèles de documents & certificats |
| Tarification | `/tarification` | Grilles tarifaires |

---

## 5. Module Accueil & Tableau de bord

Le tableau de bord centralise les indicateurs clés de l'établissement :
- Nombre de patients du jour
- Visites en attente en salle d'attente
- Taux d'occupation des chambres
- Alertes stock pharmacie

---

## 6. Module Patients

### Accéder à un patient
1. Cliquer sur **Patients** dans la sidebar
2. Rechercher par nom, prénom, code patient ou téléphone
3. Cliquer sur la ligne du patient pour accéder à son dossier

### Créer un patient
- **Création rapide** (accueil/réception) : champs minimaux (nom, prénom, date de naissance, sexe, téléphone)
- **Création complète** : informations civiles, couverture sociale, partenaire/mutuelle, contacts d'urgence

### Informations disponibles dans le dossier patient
- Identité complète + photo QR code
- Historique des visites
- Historique des rendez-vous
- Couverture sociale (partenaire + type de couverture)

### Carte patient
- Bouton **Générer la carte** : produit une carte avec QR code intégrant l'identifiant unique du patient

---

## 7. Module Visites

Une **visite** représente un passage du patient dans l'établissement (consultation, urgence, suivi...).

### Créer une visite
1. Aller dans **Visites** → **Nouvelle visite**
2. Sélectionner le patient (existant ou créer)
3. Choisir le type de visite, le service, le médecin
4. Valider → le patient apparaît en **Salle d'attente**

### Statuts d'une visite
| Statut | Description |
|--------|-------------|
| En attente | Patient dans la salle d'attente |
| En cours | Patient vu par le médecin |
| Terminée | Consultation complétée |
| Facturée | Facture générée |

---

## 8. Module Salle d'attente

Vue temps réel de tous les patients en attente de prise en charge.

- Affiche le patient, l'heure d'arrivée, le motif, le médecin assigné
- Bouton **Marquer comme vu** → passe la visite en statut "En cours" et ouvre la consultation
- Tri par heure d'arrivée (FIFO)

---

## 9. Module Consultation

> La page de consultation s'ouvre en **plein écran** (hors barre latérale) pour maximiser l'espace de travail.

### Accéder à une consultation
- Depuis la Salle d'attente → cliquer **Marquer comme vu**
- Depuis la liste des Visites → cliquer sur une visite active

### Barre d'outils de consultation

La barre supérieure contient des boutons d'accès rapide aux différentes sections :

| Bouton | Fonction |
|--------|----------|
| **Notes** | Notes cliniques libres (ADT Notes) |
| **S.Vitaux** | Saisie et suivi des signes vitaux |
| **Médicaments** | Prescriptions de la visite |
| **Procédures** | Actes et procédures cliniques |
| **Labo** | Examens de laboratoire |
| **Ordonnance** | Rédaction de l'ordonnance |
| **Matrice** | Comparatif multi-visites du patient |

### Signes vitaux (S.Vitaux)

Formulaire de saisie avec :
- **Température** en °F avec conversion automatique en °C (et vice-versa)
- **Tension artérielle** : bras gauche et bras droit (systolique / diastolique)
- **Pouls**, **SPO2**, **Respiration**
- **Taille** + **Poids** → **IMC calculé automatiquement**
- Indicateurs colorés : 🟢 Normal · 🟣 Avertissement · 🔴 Critique

Les mesures sont sauvegardées avec **date et heure** et affichées dans un **tableau** (toutes les prises de la visite courante) et un **graphique courbes** avec :
- Courbes lissées (Bézier naturel)
- Lignes de référence clinique (SPO2 ≥ 95, TA ≤ 140)
- Légende groupée (Bras Gauche / Bras Droite)

### Facturation automatique
À la validation de la consultation, une facture est **automatiquement générée** selon la tarification du médecin et les actes réalisés.

---

## 10. Module Hospitalisation

### Gestion des chambres
- Vue **dashboard** : chambres disponibles, occupées, à nettoyer
- Chaque chambre a un **type** (standard, privée, réanimation...), un **nombre de lits**, et des **équipements** associés

### Admettre un patient
1. Aller dans **Hospitalisation** → **Nouvelle admission**
2. Sélectionner le patient, le médecin responsable, la chambre
3. Indiquer le motif d'admission et la date d'entrée prévue
4. Valider → la chambre passe en statut **Occupée**

### Sortie de patient
- Bouton **Sortie** sur la fiche d'hospitalisation
- Saisir la date/heure de sortie et le type de sortie (guéri, transféré, à la demande...)
- La chambre repasse en statut **À nettoyer** puis **Disponible**

---

## 11. Module Transferts

Gestion des transferts de patients entre services ou établissements.

### Workflow d'un transfert
```
Créé  →  En attente de validation  →  Validé  →  Effectué
                                   ↘  Annulé
```

- **Créer un transfert** : sélectionner le patient, service/établissement d'origine et destination, motif
- **Valider** : bouton Valider sur la fiche de transfert
- **Annuler** : possible tant que le transfert n'est pas effectué

---

## 12. Module Rendez-vous

### Prendre un rendez-vous
1. Aller dans **Gestion des RDV** → **Nouveau RDV**
2. Sélectionner le patient, le médecin, la spécialité
3. Consulter les **créneaux disponibles** (calculés automatiquement selon le planning du médecin)
4. Choisir la date et l'heure → confirmer

### Planning médecin
- Chaque médecin a un **planning hebdomadaire** (jours, heures d'ouverture)
- Les **absences** et **jours fériés** sont pris en compte
- Sénégal : les jours fériés officiels peuvent être **initialisés automatiquement**

---

## 13. Module Espace Médecin

Tableau de bord dédié au médecin connecté :
- Ses rendez-vous du jour
- Ses patients en attente
- Ses consultations récentes
- Accès rapide à une consultation depuis la fiche

---

## 14. Module Pharmacie

### Gestion du stock

| Section | Description |
|---------|-------------|
| **Articles** | Catalogue des produits (médicaments, consommables) |
| **Fournisseurs** | Répertoire des fournisseurs avec leurs produits |
| **Commandes** | Suivi des bons de commande (en attente, validée, reçue) |
| **Approvisionnements** | Réceptions de marchandises |
| **Mouvements** | Historique des entrées/sorties de stock |
| **Inventaires** | Inventaires périodiques avec clôture |

### Alertes stock
Les articles en dessous du **seuil minimum** sont signalés automatiquement.

### Workflow commande
```
Brouillon  →  Envoyée au fournisseur  →  Partiellement reçue  →  Reçue
                                      ↘  Annulée
```

---

## 15. Module Comptabilité & Paiements

### Facturation
- Les factures sont **générées automatiquement** à la fin d'une consultation ou d'une hospitalisation
- Elles incluent les actes, procédures, médicaments et frais de chambre

### Paiement d'une facture
1. Aller dans **Comptabilité** → onglet **Factures en attente**
2. Sélectionner la facture
3. Choisir le mode de paiement (espèces, virement, assurance...)
4. Valider → un **reçu** est généré

### Crédits patients
- Si un patient a un solde créditeur, il est visible dans l'onglet **Crédits**
- Possible de **solder tous les crédits** d'un patient en une opération

### Partenaires & tiers payant
- Les patients couverts par une mutuelle/assurance ont leur **part partenaire** automatiquement calculée selon le type de couverture

---

## 16. Module Ressources Humaines

### Personnel
- Fiche complète : informations civiles, poste, département, service, contrat
- **Création rapide** disponible pour une prise en charge immédiate

### Congés
- Soumission d'une demande de congé (date début/fin, type)
- Workflow de validation (en attente → approuvé / refusé)
- Calcul automatique du nombre de jours

### Absences & retards
- Enregistrement manuel ou automatique
- Historique par employé et par période

### Contrats
- Suivi des contrats (CDD, CDI, stage...)
- Alertes sur les contrats arrivant à échéance

---

## 17. Module Configuration

### Configuration système (`/config-systeme`)
Paramètres généraux de l'établissement :
- Informations de l'hôpital (nom, adresse, logo)
- Paramètres d'affichage
- Gestion des utilisateurs et droits d'accès

### Config. sanitaire (`/config-sanitaire`)
Paramètres cliniques :
- Types d'examens cliniques
- Signes fonctionnels
- Plans de soins
- Imagerie médicale disponible
- Types d'analyses de laboratoire

### Tarification (`/tarification`)
- Grilles tarifaires par médecin, spécialité, acte
- Résolution automatique du tarif lors de la facturation

---

## 18. Module Formulaires (Modèles de documents)

Ce module permet de **créer et gérer des modèles de certificats** et documents médicaux délivrés aux patients.

### Interface — 3 colonnes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Nouveau]  [Sauvegarder]  [Supprimer]               Barre d'actions       │
├──────────────────┬───────────────────────────────────┬──────────────────────┤
│  Modèles de doc. │  Description | En-tête            │  Liste des variables │
│  ─────────────── │  ──────────────────────────────── │  ──────────────────  │
│  🔍 Recherche    │  Éditeur WYSIWYG avec toolbar      │  adresse_du_patient  │
│  ─────────────── │  (Police, Taille, Gras, Italique,  │  age_du_patient      │
│  Certificat acc. │   Souligné, Barré, Couleurs,       │  date_edition        │
│  Certificat décès│   Alignements, Listes, Lien)       │  doctor              │
│  Sick Leave      │                                    │  ...                 │
│  ...             │                                    │  [+ Ajouter]         │
└──────────────────┴───────────────────────────────────┴──────────────────────┘
```

### Créer un modèle de document
1. Cliquer **Nouveau** dans la barre du haut
2. Saisir la **Description** (nom du modèle) et **l'En-tête** (titre qui apparaîtra sur le document imprimé)
3. Rédiger le contenu dans l'éditeur en utilisant la barre d'outils de mise en forme
4. Insérer des variables dynamiques (voir ci-dessous)
5. Cliquer **Sauvegarder**

### Utiliser les variables dynamiques

Les variables permettent de **personnaliser automatiquement** le document lors de sa génération pour un patient.

**3 façons d'insérer une variable :**

| Méthode | Comment |
|---------|---------|
| **Clic simple** | Cliquer sur la variable dans la liste de droite → insérée à la position du curseur |
| **Glisser-déposer** | Faire glisser la variable depuis la liste droite vers l'endroit voulu dans l'éditeur |
| **Manuel** | Taper directement `{{nom_variable}}` dans le texte |

**Format de remplacement :** `{{nom_variable}}` → valeur réelle lors de la génération

**Exemple de contenu :**
```
Je soussigné, {{doctor}}, certifie avoir examiné ce jour {{civilite_du_patient}}
{{nom_du_patient}} {{prenom_du_patient}}, né(e) le {{date_de_naissance_du_patient}},
demeurant à {{adresse_du_patient}}.

Fait à {{adresse_hopital}}, le {{date_edition}}.
```

### Variables système disponibles (pré-définies)

| Variable | Valeur remplacée |
|----------|-----------------|
| `{{nom_du_patient}}` | Nom de famille du patient |
| `{{prenom_du_patient}}` | Prénom du patient |
| `{{age_du_patient}}` | Âge du patient |
| `{{date_de_naissance_du_patient}}` | Date de naissance |
| `{{adresse_du_patient}}` | Adresse du patient |
| `{{sexe_du_patient}}` | Sexe |
| `{{civilite_du_patient}}` | M. / Mme |
| `{{telephone_du_patient}}` | Téléphone |
| `{{emploi_du_patient}}` | Profession |
| `{{doctor}}` | Médecin traitant |
| `{{civilite_du_praticien}}` | Civilité du médecin |
| `{{diagnostic}}` | Diagnostic de la visite |
| `{{date_visite}}` | Date de la consultation |
| `{{date_edition}}` | Date d'édition du document |
| `{{nom_hopital}}` | Nom de l'établissement |
| `{{adresse_hopital}}` | Adresse de l'établissement |
| `{{date_du_service}}` | Date du service |

> Les variables système (en bleu) ne peuvent pas être supprimées.

### Ajouter une variable personnalisée
1. Cliquer **+ Ajouter une variable** dans la colonne droite
2. Saisir le **nom technique** (minuscules, chiffres, underscores uniquement)  
   Ex : `duree_arret_travail`
3. Saisir le **libellé** affiché dans la liste  
   Ex : *Durée de l'arrêt de travail*
4. Valider → la variable est disponible immédiatement

### Modifier un modèle existant
1. Cliquer sur le modèle dans la liste gauche
2. Le contenu se charge dans l'éditeur
3. Modifier puis **Sauvegarder** (bouton devient orange si des modifications non sauvegardées sont détectées)

### Supprimer un modèle
1. Sélectionner le modèle dans la liste
2. Cliquer **Supprimer** dans la barre du haut
3. Confirmer la suppression

---

## 19. Structure de la base de données

### Schéma des tables principales

```
Tables Organisation
─────────────────────────────
gen_mst_hospital              Établissements de santé
gen_mst_departement           Départements
gen_mst_type_service          Types de service
gen_mst_service               Services
hr_mst_user                   Personnel / Utilisateurs

Tables Planification
─────────────────────────────
medecin_horaire               Planning hebdomadaire médecin
medecin_exception             Absences/exceptions
jours_feries                  Jours fériés (Sénégal)
app_txn_appointments          Rendez-vous

Tables Patients & Clinique
─────────────────────────────
gen_mst_patient               Dossier patient
gen_mst_partenaire_header     Partenaires (mutuelles, assurances)
gen_mst_partenaire_dtl        Types de couverture
clinic_txn_adt                Visites / admissions
clinic_txn_adt_notes          Notes de consultation
clinic_txn_patient_notes      Notes patient
clinic_txn_vital_sign         Signes vitaux (par prise)
clinic_txn_medication         Prescriptions médicaments
clinic_txn_procedures         Procédures cliniques
lab_txn_procedures            Examens laboratoire
clinic_txn_ordonnances        Ordonnances
clinic_txn_long_term_medication Traitements chroniques

Tables Hospitalisation
─────────────────────────────
hosp_chambres                 Chambres
hosp_equipements              Équipements
hosp_chambre_equipements      Équipements par chambre
hosp_hospitalisations         Admissions en hospitalisation
hosp_fiches_att               Fiches d'attachement (examens, photos)
hosp_transferts               Transferts inter-services

Tables Facturation
─────────────────────────────
bill_txn_bill_hd              En-têtes de factures
bill_txn_bill_details         Lignes de facturation
bill_txn_patient_payments     Paiements patients
gen_mst_medcin_tarif          Tarification médecins

Tables Pharmacie
─────────────────────────────
ph_mst_item                   Articles (médicaments, consommables)
ph_mst_fournisseur            Fournisseurs
ph_mst_commande               Bons de commande
ph_mst_approvisionnement      Réceptions
ph_mst_stock                  Stock par article
ph_mst_mouvement_stock        Mouvements de stock
ph_mst_inventaire             Inventaires
ph_mst_inventaire_detail      Détail des inventaires

Tables Formulaires
─────────────────────────────
doc_templates                 Modèles de documents (HTML avec {{variables}})
template_variables            Variables (système + personnalisées)
```

---

## 20. API Backend — Référence rapide

Toutes les routes sont préfixées par `/api/v1/`.

### Patients
```
GET    /patients              Liste des patients
POST   /patients              Créer un patient complet
POST   /patients/creation-rapide  Création rapide
GET    /patients/{id}         Détail d'un patient
PUT    /patients/{id}         Modifier
DELETE /patients/{id}         Supprimer
GET    /patients/{id}/carte   Générer la carte QR
```

### Visites
```
GET    /visites               Liste des visites
POST   /visites               Créer une visite
GET    /visites/{id}          Détail d'une visite
GET    /salle-attente         File d'attente
PATCH  /salle-attente/{id}/marquer-vu  Marquer comme vu
```

### Consultation
```
GET    /consultations/{visite}              Fiche complète
POST   /consultations/{visite}/sauvegarder  Sauvegarder
GET    /consultations/{visite}/vitalsigns   Signes vitaux
POST   /consultations/{visite}/vitalsigns   Ajouter une prise
GET    /consultations/{visite}/medications  Prescriptions
POST   /consultations/{visite}/medications  Ajouter
GET    /consultations/{visite}/ordonnance   Ordonnance
POST   /consultations/{visite}/ordonnance   Sauvegarder ordonnance
GET    /consultations/{visite}/factures     Factures de la visite
GET    /patients/{id}/matrix                Matrice comparatif visites
```

### Formulaires & Variables
```
GET    /formulaires                    Liste des modèles
POST   /formulaires                    Créer un modèle
GET    /formulaires/{id}               Détail
PUT    /formulaires/{id}               Modifier
DELETE /formulaires/{id}               Supprimer
GET    /formulaires/variables          Liste des variables
POST   /formulaires/variables          Créer une variable personnalisée
PUT    /formulaires/variables/{id}     Modifier le libellé
DELETE /formulaires/variables/{id}     Supprimer (personnalisées uniquement)
```

### Pharmacie
```
GET    /pharmacie/items               Catalogue articles
POST   /pharmacie/commandes           Nouvelle commande
GET    /pharmacie/inventaires         Inventaires
POST   /pharmacie/inventaires/{id}/cloturer  Clôturer un inventaire
```

### Paiements
```
GET    /paiements/historique          Historique paiements
POST   /paiements/{billId}/payer      Enregistrer un paiement
POST   /paiements/patient/{id}/solder Solder tous les crédits
```

---

## Charte graphique

| Élément | Valeur |
|---------|--------|
| Couleur principale (Navy) | `#002f59` |
| Couleur accent (Orange) | `#ff7631` |
| Fond général | `#f4f6fa` |
| Texte principal | `#1e293b` |
| Texte secondaire | `#64748b` |
| Police | System UI / sans-serif |
| Rayon des cartes | `10px` |

---

## Support & Contact

Pour toute question ou anomalie, contacter l'équipe technique :

> **DST Computing**  
> Développement de solutions numériques pour la santé  
> Plateforme SenMed — v1.0

---

*Document généré le 28 avril 2026*
