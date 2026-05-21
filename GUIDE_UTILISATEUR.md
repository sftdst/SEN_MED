# Guide Utilisateur — Plateforme SEN MED

> Version 2.0 · Mai 2026 · ADN Soins

---

## Table des matières

1. [Connexion et accès](#1-connexion-et-accès)
2. [Navigation générale](#2-navigation-générale)
3. [Tableau de bord](#3-tableau-de-bord)
4. [Patients](#4-patients)
5. [Visites et Consultations](#5-visites-et-consultations)
6. [Rendez-vous](#6-rendez-vous)
7. [Planning du personnel](#7-planning-du-personnel)
8. [Hospitalisation](#8-hospitalisation)
9. [Dossier de Soins Infirmiers (DSI)](#9-dossier-de-soins-infirmiers-dsi)
10. [Pharmacie](#10-pharmacie)
11. [Comptabilité et Paiements](#11-comptabilité-et-paiements)
12. [Formulaires et Certificats](#12-formulaires-et-certificats)
13. [Configuration système](#13-configuration-système)
14. [FAQ et problèmes courants](#14-faq-et-problèmes-courants)

---

## 1. Connexion et accès

### 1.1 Se connecter

1. Ouvrez le navigateur et accédez à l'adresse de l'application.
2. Saisissez votre **adresse email** et votre **mot de passe**.
3. Cliquez sur **Se connecter**.

> **Remarque :** Seuls les comptes avec le statut **Actif** peuvent se connecter. Si votre compte est désactivé, contactez l'administrateur.

### 1.2 Première connexion

Lors de votre première connexion (ou après une réinitialisation de mot de passe par un administrateur), une fenêtre s'affiche automatiquement avec deux choix :

- **Conserver** : garde le mot de passe temporaire fourni. Vous pourrez le modifier plus tard depuis votre profil.
- **Changer mon mot de passe** : saisissez le mot de passe temporaire reçu, choisissez un nouveau mot de passe (minimum 6 caractères) et confirmez-le.

### 1.3 Mot de passe oublié

1. Sur l'écran de connexion, cliquez sur **Mot de passe oublié ?**
2. Saisissez votre adresse email et cliquez sur **Envoyer**.
3. Si un compte actif existe avec cet email, un **mot de passe temporaire** vous sera envoyé par email.
4. Connectez-vous avec ce mot de passe temporaire — la fenêtre de première connexion s'affichera pour vous inviter à en définir un nouveau.

> Pour des raisons de sécurité, l'application ne confirme jamais si un email est enregistré ou non dans le système.

### 1.4 Se déconnecter

Cliquez sur votre avatar en haut à droite, puis sur **Se déconnecter**.

---

## 2. Navigation générale

### 2.1 Barre latérale (Sidebar)

La barre latérale gauche regroupe tous les modules de l'application par catégorie :

| Catégorie | Modules disponibles |
|-----------|---------------------|
| **PRINCIPAL** | Tableau de bord |
| **CLINIQUE** | Patients, Visites, Salle d'attente |
| **PLANNING** | Rendez-vous, Horaires, Calendrier |
| **SOINS** | Hospitalisations, Chambres, DSI |
| **PHARMACIE** | Produits, Fournisseurs, Commandes, Inventaire |
| **FINANCES** | Comptabilité, Paiements |
| **DOCUMENTS** | Formulaires, Certificats |
| **CONFIGURATION** | Utilisateurs, Rôles, Préférences, Mailing |

> Seuls les menus correspondant aux **permissions de votre rôle** sont visibles.

### 2.2 Réduire la sidebar

Cliquez sur le bouton **≡** dans l'en-tête pour réduire ou agrandir la barre latérale. En mode réduit, seules les icônes sont affichées.

### 2.3 Mode sombre / clair

Le thème peut être changé depuis **Configuration > Préférences**. Il est appliqué instantanément à toute l'interface.

### 2.4 Version mobile

Sur smartphone ou tablette, la barre latérale se masque automatiquement. Appuyez sur le bouton **≡** pour l'afficher.

---

## 3. Tableau de bord

Le tableau de bord affiche un résumé en temps réel de l'activité de l'établissement :

- Nombre de patients enregistrés
- Visites et rendez-vous du jour
- Taux d'occupation des lits
- Alertes de stock pharmacie
- Dernières activités

Les statistiques sont actualisées à chaque chargement de la page.

---

## 4. Patients

### 4.1 Liste des patients

Accédez à **Clinique > Patients**. Utilisez la barre de recherche pour filtrer par nom, prénom ou numéro de dossier.

### 4.2 Créer un patient

1. Cliquez sur **+ Nouveau patient**.
2. Remplissez : nom, prénom, date de naissance, sexe, contact, adresse, couverture médicale.
3. Pour les patients assurés, sélectionnez le **partenaire** et le **type de couverture**.
4. Cliquez sur **Enregistrer**.

### 4.3 Fiche patient

La fiche patient regroupe :

- **Informations générales** : identité, contacts, couvertures
- **Historique des visites**
- **Rendez-vous à venir**
- **Hospitalisations**
- **Carte patient** avec QR code (générée automatiquement)

### 4.4 Création rapide

En cas d'urgence, utilisez le bouton **Création rapide** pour enregistrer un patient avec le minimum d'informations. Les données peuvent être complétées ultérieurement.

---

## 5. Visites et Consultations

### 5.1 Créer une visite

1. Depuis la fiche patient, cliquez sur **+ Nouvelle visite**, ou accédez à **Clinique > Visites**.
2. Sélectionnez le patient, le médecin, le type de visite et la caisse.
3. Validez pour créer la visite et ouvrir la page de consultation.

### 5.2 Salle d'attente

Le module **Salle d'attente** liste les patients en attente de prise en charge. Cliquez sur **Marquer comme vu** pour retirer un patient de la file.

### 5.3 Consultation médicale

La page de consultation est divisée en onglets :

| Onglet | Contenu |
|--------|---------|
| **Vitaux** | Tension, température, poids, taille, saturation… |
| **Examen clinique** | Plaintes, antécédents, observations |
| **Diagnostics** | Codes de diagnostic |
| **Procédures** | Imagerie, bilans, actes cliniques |
| **Médicaments** | Prescriptions |
| **Ordonnance** | Aperçu et impression de l'ordonnance |
| **Facturation** | Actes facturés, montant total |

### 5.4 Ordonnance

L'ordonnance est générée automatiquement à partir des médicaments prescrits. Elle peut être imprimée directement depuis l'onglet **Ordonnance**.

---

## 6. Rendez-vous

### 6.1 Prendre un rendez-vous

1. Accédez à **Planning > Rendez-vous > + Nouveau rendez-vous**.
2. Sélectionnez le patient, le médecin, la date et le créneau.
3. Les créneaux disponibles sont calculés automatiquement selon les horaires du médecin.

### 6.2 Demandes en ligne

Les rendez-vous soumis depuis le site public apparaissent dans **Demandes en attente**. L'agent peut les **accepter** (en assignant un créneau) ou les **rejeter** avec un motif.

### 6.3 Horaires des médecins

Chaque médecin dispose d'un planning hebdomadaire défini dans **Planning > Horaires**. Des **exceptions** (absences, congés) peuvent être ajoutées pour bloquer des périodes spécifiques.

---

## 7. Planning du personnel

### 7.1 Horaires

Définissez les horaires hebdomadaires de chaque membre du personnel : jours travaillés, heures de début et de fin, durée des créneaux de consultation.

### 7.2 Exceptions

Ajoutez des exceptions pour les absences ponctuelles ou les indisponibilités. Une exception bloque la création de rendez-vous sur la période concernée.

### 7.3 Jours fériés

Le module **Jours fériés** permet d'initialiser automatiquement les jours fériés sénégalais pour une année donnée. Les membres du personnel disponibles ces jours-là peuvent le déclarer via les **disponibilités jours fériés**.

---

## 8. Hospitalisation

### 8.1 Admettre un patient

1. Accédez à **Soins > Hospitalisations > + Nouvelle admission**.
2. Sélectionnez le patient, le médecin responsable, la chambre et le lit.
3. Indiquez la date et le motif d'admission, puis validez.

### 8.2 Tableau de bord hospitalisations

Le dashboard affiche en temps réel :

- Patients hospitalisés en cours
- Durée moyenne de séjour
- Taux d'occupation des lits par service

### 8.3 Sortie de patient

Depuis la fiche d'hospitalisation, cliquez sur **Sortie du patient**. Indiquez la date et le motif (guérison, transfert, sortie contre avis médical, décès).

### 8.4 Gestion des chambres

Accédez à **Soins > Chambres** pour gérer les lits et équipements de chaque chambre. Après nettoyage, marquez une chambre comme **propre** pour la rendre disponible.

---

## 9. Dossier de Soins Infirmiers (DSI)

Le DSI regroupe toutes les informations du suivi infirmier d'un patient hospitalisé.

### 9.1 Créer un dossier

Depuis la fiche d'hospitalisation, cliquez sur **Ouvrir le DSI**. Le dossier est automatiquement lié à l'admission en cours.

### 9.2 Onglets du DSI

| Onglet | Contenu |
|--------|---------|
| **Informations** | Contacts d'urgence, intervenants de soins |
| **Traitements** | Prescriptions infirmières, posologie, horaires |
| **Diagramme de soins** | Saisie quotidienne des actes réalisés |
| **Transmissions** | Notes entre équipes soignantes |
| **Évaluations** | Échelles standardisées (douleur, escarre, chutes…) |
| **Surveillances** | Suivi de plaies et diabète avec photos |

### 9.3 Galerie d'images

Les photos de plaies et surveillances sont accessibles depuis **DSI > Images**, filtrables par patient ou par date.

---

## 10. Pharmacie

### 10.1 Catalogue de produits

Accédez à **Pharmacie > Produits** pour gérer médicaments, consommables et réactifs. Chaque produit dispose d'un seuil d'alerte de stock minimum.

### 10.2 Fournisseurs

Gérez vos fournisseurs et leurs coordonnées depuis **Pharmacie > Fournisseurs**.

### 10.3 Commandes et approvisionnements

1. Créez une commande fournisseur depuis **Pharmacie > Commandes**.
2. Sélectionnez le fournisseur et ajoutez les produits avec les quantités commandées.
3. À réception des produits, enregistrez l'**approvisionnement** pour mettre à jour le stock automatiquement.

### 10.4 Mouvements de stock

Tous les mouvements (entrées, sorties, corrections) sont tracés automatiquement. Consultez l'historique par produit depuis **Pharmacie > Mouvements**.

### 10.5 Inventaire

1. Créez un inventaire depuis **Pharmacie > Inventaires**.
2. Saisissez les quantités réelles constatées pour chaque produit.
3. **Clôturez** l'inventaire pour recalibrer les stocks officiels du système.

---

## 11. Comptabilité et Paiements

### 11.1 Factures en attente

**Comptabilité > Factures en attente** liste toutes les factures non soldées, filtrables par patient ou partenaire assureur.

### 11.2 Enregistrer un paiement

1. Cliquez sur une facture.
2. Choisissez le mode de paiement (espèces, chèque, virement, assurance).
3. Saisissez le montant encaissé et validez.

### 11.3 Crédits patients assurés

Les patients bénéficiant d'une assurance peuvent avoir des crédits préautorisés. Consultez leur solde et leurs factures depuis **Comptabilité > Crédits patients**.

### 11.4 Solde global d'un patient

Pour régler toutes les factures impayées d'un patient en une seule opération, utilisez **Solder le patient** depuis l'historique des paiements.

---

## 12. Formulaires et Certificats

### 12.1 Modèles de documents

Accédez à **Documents > Formulaires** pour créer et gérer vos templates : certificats médicaux, attestations, courriers. Les modèles utilisent des **variables dynamiques** (ex: `{{patient.nom}}`, `{{date}}`) remplacées automatiquement à la génération.

### 12.2 Générer un certificat

Depuis une consultation ou une fiche patient :

1. Cliquez sur **Générer un document**.
2. Sélectionnez le template souhaité.
3. Vérifiez l'aperçu, puis imprimez ou téléchargez en PDF.

Les certificats générés sont conservés dans l'historique du patient.

---

## 13. Configuration système

> Cette section est réservée aux utilisateurs ayant la permission **config-systeme** (rôle Administrateur).

### 13.1 Gestion des utilisateurs

Accédez à **Configuration > Utilisateurs**.

#### Créer un utilisateur

1. Cliquez sur **+ Nouvel utilisateur**.
2. Dans le champ **Nom complet**, commencez à taper le nom. Si la personne figure dans le répertoire du personnel, elle apparaît dans une liste déroulante — sélectionnez-la pour remplir automatiquement le nom, l'email et lier le compte au membre du personnel.
3. Définissez un mot de passe temporaire. L'utilisateur sera automatiquement invité à le changer lors de sa première connexion.
4. Assignez un **rôle** et choisissez le **statut** (Actif/Inactif).
5. Ajoutez optionnellement une **photo de profil**.
6. Cliquez sur **Créer l'utilisateur**.

#### Modifier un utilisateur

Cliquez sur l'icône **✎** sur la ligne de l'utilisateur. Tous les champs sont modifiables, y compris la photo.

#### Réinitialiser un mot de passe

Cliquez sur l'icône **🔑** pour définir un nouveau mot de passe temporaire. L'utilisateur sera invité à le changer à sa prochaine connexion.

#### Activer / Désactiver un compte

Cliquez sur **Désactiver** ou **Activer** sur la ligne de l'utilisateur. Un compte désactivé ne peut pas se connecter.

> Il est impossible de désactiver ou supprimer son propre compte.

### 13.2 Rôles et permissions

Accédez à **Configuration > Rôles** pour gérer les profils d'accès.

- Chaque rôle regroupe un ensemble de **permissions** (ex: `patients`, `pharmacie`, `config-systeme`).
- Chaque utilisateur est associé à un seul rôle qui détermine les modules accessibles.

### 13.3 Préférences de l'application

Accédez à **Configuration > Préférences** pour personnaliser :

- Nom et logo de l'application
- Couleur principale de l'interface
- Thème par défaut (clair / sombre)
- Coordonnées de l'établissement

### 13.4 Configuration Email (SMTP)

Accédez à **Configuration > Mailing** pour paramétrer l'envoi d'emails :

- Hôte SMTP, port, chiffrement (SSL/TLS)
- Identifiants de connexion
- Adresse et nom d'expéditeur
- Bouton **Tester** pour envoyer un email de vérification

> La configuration email est indispensable pour que la fonctionnalité **Mot de passe oublié** fonctionne correctement.

### 13.5 Page Web publique

Gérez le contenu du site public depuis **Configuration > Page Web** :

- **Diaporama** : images du carrousel d'accueil (ajout, réorganisation, activation/désactivation)
- **À propos** : présentation de l'établissement
- **Messages de contact** : consultation des messages reçus via le formulaire du site

---

## 14. FAQ et problèmes courants

**Je ne peux pas me connecter**
Vérifiez que le verrouillage majuscules (Verr. Maj) n'est pas activé. Utilisez **Mot de passe oublié ?** pour recevoir un mot de passe temporaire. Si le problème persiste, votre compte est peut-être désactivé — contactez votre administrateur.

**Je ne reçois pas l'email de mot de passe oublié**
Vérifiez votre dossier **Spam / Courrier indésirable**. Assurez-vous que l'email saisi correspond exactement à celui enregistré dans le système. L'administrateur peut également réinitialiser votre mot de passe directement depuis la gestion des utilisateurs.

**Un module n'apparaît pas dans le menu**
Votre rôle ne dispose pas de la permission pour ce module. Contactez votre administrateur pour ajuster vos droits d'accès.

**La page affiche une erreur après connexion**
Videz le cache du navigateur (Ctrl + Maj + R), puis déconnectez-vous et reconnectez-vous.

**Le stock d'un produit semble incorrect**
Consultez l'historique des **Mouvements de stock** pour identifier la source de l'écart. Un **inventaire** permet de recalibrer les quantités officielles.

**Comment imprimer une ordonnance ou un certificat ?**
Depuis la consultation ou la fiche patient, cliquez sur **Générer un document**, sélectionnez le template et utilisez la fonction d'impression du navigateur (Ctrl + P).

**La fonctionnalité Mot de passe oublié ne fonctionne pas**
La configuration SMTP n'est probablement pas renseignée. Un administrateur doit compléter **Configuration > Mailing** et tester l'envoi.

---

*Pour toute assistance technique, contactez l'équipe DST Computing.*
