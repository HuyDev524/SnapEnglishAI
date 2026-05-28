# BUILD: AI English Vision Web

You are an expert fullstack developer. Build this project completely from scratch. Follow every instruction exactly. Do not skip any step. Do not ask questions — make decisions based on this document.

---

## WHAT YOU ARE BUILDING

A web app where users upload a photo or use their camera. AI detects objects in the image. The app displays English vocabulary for each detected object (IPA, Vietnamese meaning, example sentence). Users can save vocabulary into themed flashcard decks.

Works in both online mode (cloud AI) and offline mode (local browser AI).

---

## TECH STACK — USE EXACTLY THESE

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas via Mongoose |
| AI Vision | Gemini 2.5 Flash (primary) → OpenRouter (fallback) → COCO-SSD (offline) |
| AI Language | Gemini 2.5 Flash (primary) → Groq (fallback) → Mistral (fallback) → vocabulary.json (offline) |
| Speech/Pronunciation | Google Translate TTS API (primary) → Web Speech API (fallback) |
| Frontend deploy | Vercel |
| Backend deploy | Render.com |

---

## ENVIRONMENT VARIABLES

Create `.env` in `/server`:
```
GEMINI_API_KEY=
GEMINI_OCR_MODEL=gemini-2.5-flash
GEMINI_TEXT_MODEL=gemini-2.5-flash
OPENROUTER_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
MONGODB_URI=
PORT=5000
```

Create `.env` in `/client`:
```
VITE_API_URL=http://localhost:5000
```

**CRITICAL: All AI API keys are used ONLY in the backend. Frontend never calls AI APIs directly. Frontend calls `/api/*` on the backend only.**

---

## PROJECT STRUCTURE — CREATE EXACTLY THIS

```
/
├── client/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   │   └── Navbar.jsx
│   │   │   ├── ModeBanner/
│   │   │   │   └── ModeBanner.jsx
│   │   │   ├── UploadImage/
│   │   │   │   └── UploadImage.jsx
│   │   │   ├── CameraDetection/
│   │   │   │   └── CameraDetection.jsx
│   │   │   ├── BoundingBox/
│   │   │   │   └── BoundingBox.jsx
│   │   │   ├── VocabularyCard/
│   │   │   │   └── VocabularyCard.jsx
│   │   │   ├── FlashcardDeck/
│   │   │   │   ├── DeckGrid.jsx
│   │   │   │   ├── DeckCard.jsx
│   │   │   │   └── StudyMode.jsx
│   │   │   ├── ConfirmDialog/
│   │   │   │   └── ConfirmDialog.jsx
│   │   │   └── Toast/
│   │   │       └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   └── Home.jsx
│   │   │   └── Flashcards/
│   │   │       └── Flashcards.jsx
│   │   ├── services/
│   │   │   ├── detectionService.js
│   │   │   ├── vocabularyService.js
│   │   │   ├── cocoService.js
│   │   │   ├── speechService.js
│   │   │   ├── flashcardService.js
│   │   │   └── syncService.js
│   │   ├── hooks/
│   │   │   ├── useOnlineStatus.js
│   │   │   ├── useCamera.js
│   │   │   └── useFlashcards.js
│   │   ├── data/
│   │   │   └── vocabulary.json
│   │   ├── utils/
│   │   │   ├── imageUtils.js
│   │   │   └── categoryColors.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                         # Node.js + Express backend
    ├── controllers/
    │   ├── detectController.js
    │   └── flashcardsController.js
    ├── routes/
    │   ├── detect.js
    │   └── flashcards.js
    ├── models/
    │   └── Deck.js
    ├── services/
    │   ├── geminiService.js
    │   ├── openrouterService.js
    │   ├── groqService.js
    │   └── mistralService.js
    ├── index.js
    └── package.json
```

---

## STEP 1 — BUILD THE BACKEND

### server/package.json dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "axios": "^1.6.0",
    "multer": "^1.4.5"
  }
}
```

### server/index.js
- Load dotenv
- Connect to MongoDB Atlas using `MONGODB_URI`
- Use cors, express.json
- Mount routes: `app.use('/api/detect', detectRouter)` and `app.use('/api/flashcards', flashcardsRouter)`
- Listen on `PORT`
- On startup ping: `GET /api/ping` returns `{ status: 'ok' }`

### server/models/Deck.js
Mongoose schema:
```javascript
{
  name: String,           // deck name = category name
  category: String,       // e.g. "Kitchen", "Office"
  words: [
    {
      english: String,
      ipa: String,
      vietnamese: String,
      type: String,        // "noun", "verb", etc.
      example: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## STEP 2 — BUILD AI SERVICES (BACKEND)

### server/services/geminiService.js

**detectObjects(imageBase64, mimeType):**
- Call Gemini Vision API
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_OCR_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`
- Send image as base64 inline_data
- Prompt:
```
Look at this image carefully.
List all visible objects in English as a comma-separated list.
Output object names only, nothing else.
Example: bottle, cup, laptop, keyboard, chair
```
- Return: `string[]` of labels

**generateVocabulary(labels):**
- Call Gemini text API
- Model: `gemini-1.5-flash`
- Prompt:
```
You are an English vocabulary teacher for Vietnamese learners.
Given these objects: {labels joined by comma}

Return a JSON array only. No markdown. No explanation. Just raw JSON.
[
  {
    "english": "bottle",
    "ipa": "/ˈbɒt.əl/",
    "vietnamese": "chai nước",
    "type": "noun",
    "example": "There is a bottle on the table.",
    "category": "Kitchen"
  }
]

Category must be one of: Kitchen, Office, Technology, Furniture, Nature, Animal, Vehicle, Sport, Clothing, Food, Outdoor, Person
Example sentence: simple English, max 10 words.
Vietnamese: natural everyday language.
```
- Parse JSON from response
- Return: `VocabularyItem[]`

### server/services/openrouterService.js
**detectObjects(imageBase64, mimeType):**
- Call OpenRouter API with a free vision model (use `meta-llama/llama-3.2-11b-vision-instruct:free`)
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Header: `Authorization: Bearer ${OPENROUTER_API_KEY}`
- Same prompt as Gemini vision
- Return: `string[]`

### server/services/groqService.js
**generateVocabulary(labels):**
- Call Groq API
- Model: `llama-3.1-70b-versatile`
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Same vocabulary prompt as Gemini
- Return: `VocabularyItem[]`

### server/services/mistralService.js
**generateVocabulary(labels):**
- Call Mistral API
- Model: `mistral-small-latest`
- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Same vocabulary prompt as Gemini
- Return: `VocabularyItem[]`

---

## STEP 3 — BUILD BACKEND ROUTES

### server/routes/detect.js

`POST /api/detect`
- Body: `{ imageBase64: string, mimeType: string }`
- Logic:

```
Step A — Detect objects (AI 1 fallback chain):
  Try geminiService.detectObjects()
  If fail → Try openrouterService.detectObjects()
  If fail → Return { labels: [], fallback: 'coco' }
  (frontend will use COCO-SSD if fallback === 'coco')

Step B — Generate vocabulary (AI 2 fallback chain):
  If labels empty → return early
  Try geminiService.generateVocabulary(labels)
  If fail → Try groqService.generateVocabulary(labels)
  If fail → Try mistralService.generateVocabulary(labels)
  If fail → Return { vocabulary: [], fallback: 'static' }
  (frontend will use vocabulary.json if fallback === 'static')

Return:
{
  labels: string[],
  vocabulary: VocabularyItem[],
  fallback: null | 'coco' | 'static'
}
```

### server/routes/flashcards.js

```
GET    /api/flashcards          → Return all decks
POST   /api/flashcards          → Create new deck
                                  Body: { name, category, words[] }
PUT    /api/flashcards/:id      → Add words to existing deck
                                  Body: { words[] }
DELETE /api/flashcards/:id      → Delete deck
POST   /api/flashcards/sync     → Bulk upsert from localStorage
                                  Body: { decks[] }
                                  Match by category name (case-insensitive)
                                  Use updatedAt for conflict resolution
```

---

## STEP 4 — BUILD FRONTEND SERVICES

### client/src/services/detectionService.js

```javascript
export async function detectFromImage(imageBase64, mimeType) {
  if (!navigator.onLine) {
    return { labels: [], vocabulary: [], mode: 'offline' }
  }
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  })
  const data = await res.json()
  return { ...data, mode: 'online' }
}
```

### client/src/services/cocoService.js

- Import `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd`
- Load model once and cache in module scope
- `loadModel()` — loads COCO-SSD lite, shows loading progress
- `detectFromImageElement(imgElement)` — runs detection, returns labels with confidence > 0.5
- Return format: `string[]` of labels

### client/src/services/vocabularyService.js

- `lookupStatic(labels)` — reads from imported vocabulary.json, returns VocabularyItem[] for matched labels, skips unmatched
- Export for use when backend returns `fallback: 'static'` or when offline

### client/src/services/speechService.js

Phát âm từ vựng bằng Google Translate API:

```javascript
export function speak(text) {
  // Sử dụng Google Translate API để phát âm
  const url = `https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit`
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&total=1&idx=0&textlen=${text.length}&tk=123456&client=tw-ob`
  
  const audio = new Audio(audioUrl)
  audio.play().catch(() => {
    // Fallback: dùng Web Speech API nếu Google Translate API fail
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  })
}
```

### client/src/services/flashcardService.js

```javascript
// Group vocabulary items by category
export function groupByCategory(vocabularyItems) {
  return vocabularyItems.reduce((acc, item) => {
    const cat = item.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
}

// Check which categories already exist in saved decks
export function findExistingDecks(grouped, savedDecks) {
  return Object.keys(grouped).map(category => {
    const existing = savedDecks.find(
      d => d.category.toLowerCase() === category.toLowerCase()
    )
    return { category, words: grouped[category], existing: existing || null }
  })
}

// Find new words not already in existing deck
export function findNewWords(newWords, existingWords) {
  return newWords.filter(
    nw => !existingWords.find(ew => ew.english.toLowerCase() === nw.english.toLowerCase())
  )
}
```

### client/src/services/syncService.js

```javascript
const STORAGE_KEY = 'aievw_decks'
const PENDING_KEY = 'aievw_sync_pending'

export function saveLocal(decks) { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks)) }
export function loadLocal() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
export function markPending(decks) { localStorage.setItem(PENDING_KEY, JSON.stringify(decks)) }
export function clearPending() { localStorage.removeItem(PENDING_KEY) }
export function getPending() { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') }

export async function syncToServer() {
  const pending = getPending()
  if (!pending.length || !navigator.onLine) return
  await fetch(`${import.meta.env.VITE_API_URL}/api/flashcards/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decks: pending })
  })
  clearPending()
}
```

---

## STEP 5 — BUILD HOOKS

### client/src/hooks/useOnlineStatus.js

```javascript
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}
```

### client/src/hooks/useCamera.js
- Manage camera stream with `getUserMedia({ video: { facingMode: 'environment' } })`
- Expose: `startCamera()`, `stopCamera()`, `captureSnapshot()` → returns base64 image
- Handle permission denied error gracefully

### client/src/hooks/useFlashcards.js
- Load decks from server on mount (if online), fallback to localStorage
- Expose: `decks`, `createDeck(name, category, words)`, `addWordsToDeck(deckId, words)`, `deleteDeck(id)`
- On every write: save to localStorage AND server (if online), mark pending if offline

---

## STEP 6 — BUILD COMPONENTS

### ModeBanner.jsx
- Always visible at top of screen
- Online: green dot + "Online — Full AI mode"
- Offline: gray dot + "Offline — Basic mode"
- Smoothly transitions when status changes

### UploadImage.jsx
- Drag and drop zone with dashed border
- Click to browse
- Accept: image/jpeg, image/png, image/webp
- Max size: 10MB — show error if exceeded
- Preview uploaded image
- "Detect Objects" button → triggers detection flow
- Show loading spinner during detection

### CameraDetection.jsx
- Default mode: Snapshot
- Show live video preview
- "Capture" button → freeze frame → detect
- On desktop: offer toggle to Live Mode (detect every 2000ms)
- "Stop Camera" button
- Handle permission denied: show message + "Switch to Upload" button

### BoundingBox.jsx
- Props: `imageElement`, `predictions[]` (from COCO-SSD only)
- Render canvas overlaid perfectly on image
- Each prediction: colored rect border + label text + confidence %
- Use `categoryColors.js` for consistent colors per category
- Resize canvas when window resizes

### VocabularyCard.jsx
- Props: `word` (VocabularyItem)
- Display: English word (large), IPA, Vietnamese, type badge, example sentence, category badge
- "Listen" button → calls `speechService.speak(word.english)`
- Animate Listen button while speaking
- Clean card design, works on mobile

### ConfirmDialog.jsx
- Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`
- Modal overlay (use in-flow div, not position:fixed)
- Used for: create deck confirmation, merge deck confirmation

### DeckGrid.jsx
- Grid of DeckCard components
- Empty state: "No flashcard decks yet. Detect some objects to get started."

### DeckCard.jsx
- Props: `deck`
- Show: category name, word count, last updated date
- Click → open StudyMode
- Delete button with confirmation

### StudyMode.jsx
- Full screen overlay (in-flow)
- Swipeable card stack on mobile, keyboard navigable on desktop
- Card front: English word + category badge
- Card back (flip animation): IPA + Vietnamese + example + Listen button
- Progress indicator: "3 / 8"
- "Done" button to close

### Toast.jsx
- Bottom-right notifications
- Types: success (green), error (red), info (blue)
- Auto-dismiss after 3 seconds
- Stack multiple toasts

---

## STEP 7 — BUILD PAGES

### Home.jsx (main page)

Layout:
```
Navbar
ModeBanner
──────────────────
Tab: [Upload Image] [Use Camera]
──────────────────
[Upload or Camera component]
──────────────────
[Detection Results]
  - List of VocabularyCards
  - "View Flashcards" button (if words detected)
──────────────────
[Flashcard Deck prompts if new categories found]
```

Detection flow on Home:
```
User submits image/snapshot
  ↓
Set loading = true, show spinner
  ↓
IF online:
  Call detectionService.detectFromImage(base64, mimeType)
  IF response.fallback === 'static' → call vocabularyService.lookupStatic(labels)
  IF response.fallback === 'coco' → show message "Using local AI, limited detection"
ELSE (offline):
  Call cocoService.detectFromImageElement(imgElement)
  Call vocabularyService.lookupStatic(labels)
  ↓
Set loading = false
Show VocabularyCards
Run flashcard grouping logic
Show ConfirmDialogs for each new category
```

### Flashcards.jsx
- Show DeckGrid with all saved decks
- "Back to Detect" button

---

## STEP 8 — DATA FILE

### client/src/data/vocabulary.json

Include entries for ALL 80 COCO-SSD classes plus common extras. Use this exact format for every entry:

```json
{
  "person": { "ipa": "/ˈpɜː.sən/", "vietnamese": "người", "type": "noun", "example": "There is a person at the door.", "category": "Person" },
  "bicycle": { "ipa": "/ˈbaɪ.sɪ.kəl/", "vietnamese": "xe đạp", "type": "noun", "example": "She rides her bicycle to school.", "category": "Vehicle" },
  "car": { "ipa": "/kɑː/", "vietnamese": "ô tô", "type": "noun", "example": "He drives a red car.", "category": "Vehicle" },
  "motorcycle": { "ipa": "/ˈməʊ.tə.saɪ.kəl/", "vietnamese": "xe máy", "type": "noun", "example": "The motorcycle is very fast.", "category": "Vehicle" },
  "airplane": { "ipa": "/ˈeə.pleɪn/", "vietnamese": "máy bay", "type": "noun", "example": "The airplane flies high.", "category": "Vehicle" },
  "bus": { "ipa": "/bʌs/", "vietnamese": "xe buýt", "type": "noun", "example": "I take the bus to work.", "category": "Vehicle" },
  "train": { "ipa": "/treɪn/", "vietnamese": "tàu hỏa", "type": "noun", "example": "The train arrives at 8 AM.", "category": "Vehicle" },
  "truck": { "ipa": "/trʌk/", "vietnamese": "xe tải", "type": "noun", "example": "The truck carries heavy goods.", "category": "Vehicle" },
  "boat": { "ipa": "/bəʊt/", "vietnamese": "thuyền", "type": "noun", "example": "We sailed on a small boat.", "category": "Vehicle" },
  "traffic light": { "ipa": "/ˈtræf.ɪk laɪt/", "vietnamese": "đèn giao thông", "type": "noun", "example": "Stop at the red traffic light.", "category": "Outdoor" },
  "fire hydrant": { "ipa": "/ˈfaɪər ˌhaɪ.drənt/", "vietnamese": "cột chữa cháy", "type": "noun", "example": "The fire hydrant is on the corner.", "category": "Outdoor" },
  "stop sign": { "ipa": "/stɒp saɪn/", "vietnamese": "biển báo dừng", "type": "noun", "example": "There is a stop sign ahead.", "category": "Outdoor" },
  "parking meter": { "ipa": "/ˈpɑː.kɪŋ ˌmiː.tər/", "vietnamese": "đồng hồ đỗ xe", "type": "noun", "example": "Put coins in the parking meter.", "category": "Outdoor" },
  "bench": { "ipa": "/bentʃ/", "vietnamese": "ghế băng", "type": "noun", "example": "Let us sit on the bench.", "category": "Furniture" },
  "bird": { "ipa": "/bɜːd/", "vietnamese": "con chim", "type": "noun", "example": "A bird is singing in the tree.", "category": "Animal" },
  "cat": { "ipa": "/kæt/", "vietnamese": "con mèo", "type": "noun", "example": "My cat loves to sleep.", "category": "Animal" },
  "dog": { "ipa": "/dɒɡ/", "vietnamese": "con chó", "type": "noun", "example": "The dog wags its tail.", "category": "Animal" },
  "horse": { "ipa": "/hɔːs/", "vietnamese": "con ngựa", "type": "noun", "example": "The horse runs fast.", "category": "Animal" },
  "sheep": { "ipa": "/ʃiːp/", "vietnamese": "con cừu", "type": "noun", "example": "The sheep graze on the hill.", "category": "Animal" },
  "cow": { "ipa": "/kaʊ/", "vietnamese": "con bò", "type": "noun", "example": "The cow gives us milk.", "category": "Animal" },
  "elephant": { "ipa": "/ˈel.ɪ.fənt/", "vietnamese": "con voi", "type": "noun", "example": "The elephant has a long trunk.", "category": "Animal" },
  "bear": { "ipa": "/beər/", "vietnamese": "con gấu", "type": "noun", "example": "A bear lives in the forest.", "category": "Animal" },
  "zebra": { "ipa": "/ˈziː.brə/", "vietnamese": "ngựa vằn", "type": "noun", "example": "The zebra has black stripes.", "category": "Animal" },
  "giraffe": { "ipa": "/dʒɪˈrɑːf/", "vietnamese": "hươu cao cổ", "type": "noun", "example": "The giraffe has a long neck.", "category": "Animal" },
  "backpack": { "ipa": "/ˈbæk.pæk/", "vietnamese": "ba lô", "type": "noun", "example": "He carries a backpack to school.", "category": "Clothing" },
  "umbrella": { "ipa": "/ʌmˈbrel.ə/", "vietnamese": "ô dù", "type": "noun", "example": "Take an umbrella, it may rain.", "category": "Clothing" },
  "handbag": { "ipa": "/ˈhænd.bæɡ/", "vietnamese": "túi xách tay", "type": "noun", "example": "She keeps her phone in her handbag.", "category": "Clothing" },
  "tie": { "ipa": "/taɪ/", "vietnamese": "cà vạt", "type": "noun", "example": "He wears a tie to the office.", "category": "Clothing" },
  "suitcase": { "ipa": "/ˈsuːt.keɪs/", "vietnamese": "vali", "type": "noun", "example": "Pack your clothes in the suitcase.", "category": "Clothing" },
  "frisbee": { "ipa": "/ˈfrɪz.bi/", "vietnamese": "đĩa ném", "type": "noun", "example": "They throw a frisbee at the beach.", "category": "Sport" },
  "skis": { "ipa": "/skiːz/", "vietnamese": "ván trượt tuyết", "type": "noun", "example": "He puts on his skis.", "category": "Sport" },
  "snowboard": { "ipa": "/ˈsnəʊ.bɔːd/", "vietnamese": "ván trượt tuyết đứng", "type": "noun", "example": "She learned to snowboard.", "category": "Sport" },
  "sports ball": { "ipa": "/spɔːts bɔːl/", "vietnamese": "bóng thể thao", "type": "noun", "example": "Kick the sports ball into the goal.", "category": "Sport" },
  "kite": { "ipa": "/kaɪt/", "vietnamese": "con diều", "type": "noun", "example": "The children fly a kite.", "category": "Sport" },
  "baseball bat": { "ipa": "/ˈbeɪs.bɔːl bæt/", "vietnamese": "gậy bóng chày", "type": "noun", "example": "He swings the baseball bat.", "category": "Sport" },
  "baseball glove": { "ipa": "/ˈbeɪs.bɔːl ɡlʌv/", "vietnamese": "găng tay bóng chày", "type": "noun", "example": "Wear a baseball glove to catch.", "category": "Sport" },
  "skateboard": { "ipa": "/ˈskeɪt.bɔːd/", "vietnamese": "ván trượt", "type": "noun", "example": "He rides a skateboard.", "category": "Sport" },
  "surfboard": { "ipa": "/ˈsɜːf.bɔːd/", "vietnamese": "ván lướt sóng", "type": "noun", "example": "She stands on her surfboard.", "category": "Sport" },
  "tennis racket": { "ipa": "/ˈten.ɪs ˈræk.ɪt/", "vietnamese": "vợt tennis", "type": "noun", "example": "He hits the ball with a tennis racket.", "category": "Sport" },
  "bottle": { "ipa": "/ˈbɒt.əl/", "vietnamese": "chai nước", "type": "noun", "example": "There is a bottle on the table.", "category": "Kitchen" },
  "wine glass": { "ipa": "/waɪn ɡlɑːs/", "vietnamese": "ly rượu vang", "type": "noun", "example": "She drinks from a wine glass.", "category": "Kitchen" },
  "cup": { "ipa": "/kʌp/", "vietnamese": "cái cốc", "type": "noun", "example": "She drinks tea from a cup.", "category": "Kitchen" },
  "fork": { "ipa": "/fɔːk/", "vietnamese": "cái nĩa", "type": "noun", "example": "Use a fork to eat salad.", "category": "Kitchen" },
  "knife": { "ipa": "/naɪf/", "vietnamese": "con dao", "type": "noun", "example": "He cuts the bread with a knife.", "category": "Kitchen" },
  "spoon": { "ipa": "/spuːn/", "vietnamese": "cái thìa", "type": "noun", "example": "Stir the soup with a spoon.", "category": "Kitchen" },
  "bowl": { "ipa": "/bəʊl/", "vietnamese": "cái bát", "type": "noun", "example": "She eats rice from a bowl.", "category": "Kitchen" },
  "banana": { "ipa": "/bəˈnɑː.nə/", "vietnamese": "quả chuối", "type": "noun", "example": "He eats a banana for breakfast.", "category": "Food" },
  "apple": { "ipa": "/ˈæp.əl/", "vietnamese": "quả táo", "type": "noun", "example": "She eats an apple every day.", "category": "Food" },
  "sandwich": { "ipa": "/ˈsænd.wɪdʒ/", "vietnamese": "bánh mì kẹp", "type": "noun", "example": "He made a sandwich for lunch.", "category": "Food" },
  "orange": { "ipa": "/ˈɒr.ɪndʒ/", "vietnamese": "quả cam", "type": "noun", "example": "She peels an orange.", "category": "Food" },
  "broccoli": { "ipa": "/ˈbrɒk.ə.li/", "vietnamese": "bông cải xanh", "type": "noun", "example": "Broccoli is a healthy vegetable.", "category": "Food" },
  "carrot": { "ipa": "/ˈkær.ət/", "vietnamese": "củ cà rốt", "type": "noun", "example": "Rabbits love to eat carrots.", "category": "Food" },
  "hot dog": { "ipa": "/hɒt dɒɡ/", "vietnamese": "xúc xích kẹp bánh", "type": "noun", "example": "He eats a hot dog at the game.", "category": "Food" },
  "pizza": { "ipa": "/ˈpiːt.sə/", "vietnamese": "bánh pizza", "type": "noun", "example": "We order pizza on Fridays.", "category": "Food" },
  "donut": { "ipa": "/ˈdəʊ.nʌt/", "vietnamese": "bánh donut", "type": "noun", "example": "She eats a donut for breakfast.", "category": "Food" },
  "cake": { "ipa": "/keɪk/", "vietnamese": "bánh kem", "type": "noun", "example": "They cut the birthday cake.", "category": "Food" },
  "chair": { "ipa": "/tʃeər/", "vietnamese": "cái ghế", "type": "noun", "example": "Please sit on the chair.", "category": "Furniture" },
  "couch": { "ipa": "/kaʊtʃ/", "vietnamese": "ghế sofa", "type": "noun", "example": "He relaxes on the couch.", "category": "Furniture" },
  "potted plant": { "ipa": "/ˈpɒt.ɪd plɑːnt/", "vietnamese": "cây trồng chậu", "type": "noun", "example": "She waters the potted plant.", "category": "Nature" },
  "bed": { "ipa": "/bed/", "vietnamese": "cái giường", "type": "noun", "example": "He sleeps on a comfortable bed.", "category": "Furniture" },
  "dining table": { "ipa": "/ˈdaɪ.nɪŋ ˈteɪ.bəl/", "vietnamese": "bàn ăn", "type": "noun", "example": "The family eats at the dining table.", "category": "Furniture" },
  "toilet": { "ipa": "/ˈtɔɪ.lət/", "vietnamese": "bồn cầu", "type": "noun", "example": "The toilet is in the bathroom.", "category": "Furniture" },
  "tv": { "ipa": "/ˌtiːˈviː/", "vietnamese": "tivi", "type": "noun", "example": "We watch tv every evening.", "category": "Technology" },
  "laptop": { "ipa": "/ˈlæp.tɒp/", "vietnamese": "máy tính xách tay", "type": "noun", "example": "He works on his laptop.", "category": "Technology" },
  "mouse": { "ipa": "/maʊs/", "vietnamese": "con chuột máy tính", "type": "noun", "example": "Move the mouse to click.", "category": "Technology" },
  "remote": { "ipa": "/rɪˈməʊt/", "vietnamese": "điều khiển từ xa", "type": "noun", "example": "Use the remote to change channels.", "category": "Technology" },
  "keyboard": { "ipa": "/ˈkiː.bɔːd/", "vietnamese": "bàn phím", "type": "noun", "example": "I use the keyboard to type.", "category": "Technology" },
  "cell phone": { "ipa": "/sel fəʊn/", "vietnamese": "điện thoại di động", "type": "noun", "example": "She talks on her cell phone.", "category": "Technology" },
  "microwave": { "ipa": "/ˈmaɪ.krə.weɪv/", "vietnamese": "lò vi sóng", "type": "noun", "example": "Heat the food in the microwave.", "category": "Kitchen" },
  "oven": { "ipa": "/ˈʌv.ən/", "vietnamese": "lò nướng", "type": "noun", "example": "Bake the cake in the oven.", "category": "Kitchen" },
  "toaster": { "ipa": "/ˈtəʊ.stər/", "vietnamese": "máy nướng bánh mì", "type": "noun", "example": "Toast the bread in the toaster.", "category": "Kitchen" },
  "sink": { "ipa": "/sɪŋk/", "vietnamese": "bồn rửa tay", "type": "noun", "example": "Wash your hands in the sink.", "category": "Kitchen" },
  "refrigerator": { "ipa": "/rɪˈfrɪdʒ.ər.eɪ.tər/", "vietnamese": "tủ lạnh", "type": "noun", "example": "Keep the milk in the refrigerator.", "category": "Kitchen" },
  "book": { "ipa": "/bʊk/", "vietnamese": "quyển sách", "type": "noun", "example": "She reads a book every night.", "category": "Office" },
  "clock": { "ipa": "/klɒk/", "vietnamese": "đồng hồ treo tường", "type": "noun", "example": "The clock shows 3 PM.", "category": "Furniture" },
  "vase": { "ipa": "/vɑːz/", "vietnamese": "bình hoa", "type": "noun", "example": "She puts flowers in the vase.", "category": "Furniture" },
  "scissors": { "ipa": "/ˈsɪz.əz/", "vietnamese": "cái kéo", "type": "noun", "example": "Cut the paper with scissors.", "category": "Office" },
  "teddy bear": { "ipa": "/ˈted.i beər/", "vietnamese": "gấu bông", "type": "noun", "example": "The child hugs the teddy bear.", "category": "Furniture" },
  "hair drier": { "ipa": "/heər ˈdraɪ.ər/", "vietnamese": "máy sấy tóc", "type": "noun", "example": "She uses a hair drier after shower.", "category": "Furniture" },
  "toothbrush": { "ipa": "/ˈtuːθ.brʌʃ/", "vietnamese": "bàn chải đánh răng", "type": "noun", "example": "Brush your teeth with a toothbrush.", "category": "Furniture" }
}
```

---

## STEP 9 — UTILITY FILES

### client/src/utils/imageUtils.js

```javascript
// Convert File to base64 string
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Resize image if too large before sending to API
export function resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob), file.type, 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}
```

### client/src/utils/categoryColors.js

```javascript
export const CATEGORY_COLORS = {
  Kitchen:    '#F97316',
  Office:     '#3B82F6',
  Technology: '#8B5CF6',
  Furniture:  '#10B981',
  Nature:     '#22C55E',
  Animal:     '#EAB308',
  Vehicle:    '#06B6D4',
  Sport:      '#EF4444',
  Clothing:   '#EC4899',
  Food:       '#F59E0B',
  Outdoor:    '#64748B',
  Person:     '#6366F1',
  General:    '#94A3B8'
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General
}
```

---

## ERROR STATES — IMPLEMENT ALL OF THESE

| Trigger | UI Action |
|---|---|
| Camera permission denied | Hide camera view, show message "Camera access denied. Please use image upload instead.", show UploadImage component |
| All cloud AI APIs fail | Show toast error "AI detection unavailable. Try again later." Clear loading state. |
| No objects detected | Show empty state: "No objects found. Try a clearer photo with better lighting." |
| Object detected but not in vocabulary.json | Show VocabularyCard with English word only, no IPA/Vietnamese, show note "No vocabulary data available" |
| MongoDB save fails | Save to localStorage, show toast "Saved locally. Will sync when connected." |
| Image too large (>10MB) | Show inline error under upload zone: "Image too large. Maximum size is 10MB." |
| Backend unreachable | Auto fallback to COCO-SSD + vocabulary.json, show ModeBanner as offline |

---

## UI REQUIREMENTS

- Vietnamese language for all UI labels and buttons
- Mobile-first layout, works on 375px screen width
- Rear camera by default on mobile
- Dark mode support
- Smooth animations on card flip, deck open, toast appear
- Show skeleton loading cards while detecting
- Category badges use colors from `categoryColors.js`
- "Listen" button shows speaker icon, pulses while speaking
- Navbar: app name left, link to Flashcards page right

---

## BACKEND WAKE-UP ON APP LOAD

In `App.jsx` on mount, send a ping to keep Render.com backend warm:
```javascript
useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/ping`).catch(() => {})
}, [])
```

---

## SYNC ON RECONNECT

In `App.jsx`, listen for online event and auto-sync:
```javascript
useEffect(() => {
  const handleOnline = async () => {
    await syncService.syncToServer()
    showToast('Đã đồng bộ dữ liệu lên cloud', 'success')
  }
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}, [])
```

---

## DEPLOYMENT CHECKLIST

### Vercel (frontend)
- Set environment variable: `VITE_API_URL=https://your-backend.onrender.com`
- Build command: `cd client && npm run build`
- Output directory: `client/dist`

### Render.com (backend)
- Build command: `cd server && npm install`
- Start command: `cd server && node index.js`
- Set all environment variables from `.env`

---

## FINAL NOTES FOR AGENT

1. Build backend first, then frontend
2. Test each AI service individually before wiring fallback chain
3. COCO-SSD model loads async — show clear loading progress on first load
4. Never store images in database — only store vocabulary and flashcard data
5. All user-facing text must be in Vietnamese
6. Implement the full fallback chain — never leave a step empty
7. Flashcard deduplication: match by `category.toLowerCase()` only
8. When merging decks: only add words that do not already exist (match by `english.toLowerCase()`)
9. localStorage keys: `aievw_decks` and `aievw_sync_pending`
10. Use `updatedAt` timestamp on MongoDB documents for sync conflict resolution — server wins