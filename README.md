# Book Platform Extraordinaire
## Creato con castime da Marco Luigi Palma

Una piattaforma web per la generazione automatica di metadati e contenuti per libri utilizzando l'intelligenza artificiale.

## 🚀 Caratteristiche

- **Generazione Automatica di Metadati**
  - Sistema avanzato di categorizzazione BISAC
    - Navigazione gerarchica delle categorie
    - Suggerimenti automatici basati sul contenuto
  - Keywords SEO per ottimizzare la visibilità
  - Copertine generate con DALL-E
  - Quarta di copertina
  - Prefazione dettagliata
  - Sinossi completa
  - Descrizione per gli store online

- **Interfaccia Intuitiva**
  - Dashboard principale per il caricamento dei libri
  - Sidebar per la navigazione tra le sezioni del libro
  - Visualizzatore di copertine con funzionalità di download
  - Gestione della cache e dello storage
  - Sistema di notifiche per operazioni completate

## 🛠️ Tecnologie Utilizzate

### Frontend
- React.js 18
- Material-UI (MUI) v5
- React Router v6
- Axios per le chiamate API
- Context API per la gestione dello stato

### Backend
- Node.js
- Express.js
- MongoDB con Mongoose
- OpenAI API (GPT-4 e DALL-E)
- Winston per il logging
- Multer per la gestione dei file
- PDF-parse per l'estrazione del testo

## 📦 Struttura del Progetto

```
book-publishing-platform/
├── frontend/                # Applicazione React
│   ├── src/
│   │   ├── components/     # Componenti React
│   │   │   ├── book/      # Componenti specifici per i libri
│   │   │   └── layout/    # Componenti di layout
│   │   ├── context/       # Context per la gestione dello stato
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Servizi API
│   │   └── utils/         # Utility e configurazioni
│   └── public/            # Asset statici
└── backend/               # Server Node.js
    ├── controllers/       # Controller delle route
    ├── models/           # Modelli Mongoose
    ├── routes/           # Definizione delle route
    ├── services/         # Servizi (OpenAI, Storage, etc.)
    └── data/            # File di dati JSON (categorie BISAC)
```

## 🚀 Come Iniziare

1. **Clona il repository**
```bash
git clone https://github.com/tuousername/book-publishing-platform.git
```

2. **Installa le dipendenze**
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

3. **Configura le variabili d'ambiente**
```bash
# Nel backend
cd backend
cp .env.example .env
# Modifica il file .env con i tuoi valori reali:
# - MONGODB_URI: il tuo URI MongoDB
# - PORT: la porta per il server (default: 5002)
# - OPENAI_API_KEY: la tua chiave API di OpenAI
```

4. **Avvia l'applicazione**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

## 📚 Guida all'Uso

1. **Upload del Libro**
   - Carica il tuo libro in formato PDF dalla dashboard principale
   - Il sistema estrarrà automaticamente il testo per l'elaborazione

2. **Generazione dei Metadati**
   - Vai alla Task Dashboard
   - Clicca sul menù del task desiderato
   - Clicca su "Genera" per avviare la generazione

3. **Gestione delle Copertine**
   - Genera scene basate sul contenuto del libro
   - Visualizza e scarica le copertine generate
   - Rigenera singole copertine se necessario

4. **Gestione dello Storage**
   - Clicca sulla sezione Admin
   - Monitora l'utilizzo dello storage
   - Pulisci i file temporanei se necessario

## 🔒 Sicurezza

- Validazione dei file in upload
- Sanitizzazione dei dati
- Gestione sicura delle API key
- Pulizia automatica dei file temporanei

## 🤝 Contributing

Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)

## 👥 Autori

- Marco Luigi Palma - Sviluppo iniziale

## Gestione dei Metadata

Ogni libro mantiene i propri metadata in modo indipendente. I metadata includono:

```javascript
{
  categories: {
    mainCategory: {
      code: string,
      description: string,
      path: string[]
    },
    secondaryCategories: Array<{
      code: string,
      description: string,
      path: string[]
    }>
  },
  keywords: string[],
  covers: {
    scenes: Array<{
      title: string,
      description: string,
      imageUrl?: string
    }>,
    selectedScene: number | null
  },
  backCover: string,
  preface: string,
  storeDescription: string
}
```

### Principi di Gestione
- Ogni libro ha il proprio oggetto metadata indipendente
- Sistema di categorizzazione BISAC
- Navigazione gerarchica delle categorie con breadcrumb
- Gli aggiornamenti sono sempre incrementali (usando spread operator)
- I dati vengono validati prima del salvataggio
- Non si usano stati locali per i dati, solo per UI
