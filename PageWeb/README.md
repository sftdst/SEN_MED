# PageWeb

Application React separee du frontend interne SenMed.

Objectif : landing page publique moderne, responsive et connectee au backend existant.

## Fonctionnalites

- Section Hero avec slider
- A propos de SenMed
- Nos Services
- Nos Specialistes
- Témoignages patients
- Nos Partenaires
- Carte Google Maps
- FAQ interactive
- Formulaire de contact fonctionnel (API)
- Bouton WhatsApp flottant
- Animations au défilement

## Commandes

```bash
npm install
npm run dev
npm run build
```

## API publique prevue

- `GET /api/v1/public/preferences`
- `GET /api/v1/public/slides`
- `GET /api/v1/public/about`
- `GET /api/v1/public/services`
- `GET /api/v1/public/specialistes`
- `GET /api/v1/public/partenaires`
- `POST /api/v1/public/contact`

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
VITE_API_URL=http://127.0.0.1:8001/api/v1
VITE_STORAGE_URL=http://127.0.0.1:8001/storage
```

Les préférences (`preferences`) peuvent inclure :
- `phone`, `email`, `address`, `hours`
- `primary_color`, `accent_color`
- `logo_url`
- `map_url` (URL d'embed Google Maps)
- `social_facebook`, `social_instagram`, `social_linkedin`

## Structure

```
src/
├── api/
│   └── publicApi.js       # Couche API publique
├── data/
│   └── fallbackData.js    # Données de repli
├── App.jsx                # Composant principal + sections
├── main.jsx               # Point d'entrée
└── styles.css             # Styles globaux + composants
```

