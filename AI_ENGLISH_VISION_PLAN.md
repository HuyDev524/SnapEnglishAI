# AI English Vision Web — Kế hoạch 4 ngày

## Tổng quan dự án

Web app nhận diện đồ vật từ ảnh/camera, hiển thị từ vựng tiếng Anh (IPA, nghĩa tiếng Việt, câu ví dụ), lưu vào flashcard deck. Hỗ trợ online (cloud AI) và offline (COCO-SSD).

**Tech stack:** React + Vite + TailwindCSS | Node.js + Express | MongoDB Atlas | Gemini 2.5 Flash | Vercel + Render.com

---

## Ngày 1 — Backend + AI Services

### Mục tiêu
Hoàn thiện toàn bộ backend và các AI service với fallback chain đầy đủ.

### Tasks

- [x] **[]** Khởi tạo project structure: thư mục `/client` và `/server`
- [x] **[]** Tạo `server/package.json`, cài dependencies: `express`, `mongoose`, `cors`, `dotenv`, `axios`, `multer`
- [x] **[]** Viết `server/index.js`: load dotenv, kết nối MongoDB Atlas, use cors + express.json, mount routes, `GET /api/ping` → `{ status: 'ok' }`, listen on PORT
- [x] **[]** Tạo Mongoose schema `server/models/Deck.js`: `name`, `category`, `words[]` (english, ipa, vietnamese, type, example), `createdAt`, `updatedAt`
- [x] **[]** Viết `server/services/geminiService.js`:
  - `detectObjects(imageBase64, mimeType)` → gọi Gemini Vision API, trả về mảng object names
  - `getVocabulary(words[])` → gọi Gemini Text API, trả về JSON array với ipa/vietnamese/type/example
- [x] **[]** Viết `server/services/openrouterService.js`: fallback vision khi Gemini fail
- [x] **[]** Viết `server/services/groqService.js`: fallback language model
- [x] **[]** Viết `server/services/mistralService.js`: fallback language model thứ 2
- [x] **[]** Viết `server/controllers/detectController.js`: fallback chain Gemini Vision → OpenRouter → COCO-SSD (offline)
- [x] **[]** Viết `server/controllers/flashcardsController.js`: CRUD decks, merge words (dedup by `english.toLowerCase()`), dedup deck by `category.toLowerCase()`
- [x] **[]** Tạo `server/routes/detect.js` và `server/routes/flashcards.js`
- [x] **[]** Tạo `server/.env` với tất cả keys: `GEMINI_API_KEY`, `GEMINI_OCR_MODEL=gemini-2.5-flash`, `GEMINI_TEXT_MODEL=gemini-2.5-flash`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `MONGODB_URI`, `PORT=5000`
- [x] **[]** Test từng AI service riêng lẻ bằng Postman/curl trước khi wire fallback chain

---

## Ngày 2 — Frontend Core + Services

### Mục tiêu
Khởi tạo frontend, viết toàn bộ service layer và custom hooks.

### Tasks

- [x] **[]** Khởi tạo React + Vite + TailwindCSS trong `/client`
- [x] **[]** Tạo `vite.config.js`, `tailwind.config.js`, `client/.env` với `VITE_API_URL=http://localhost:5000`
- [ ] **[Frontend]** Viết `main.jsx` và `App.jsx` với React Router: route `/` → Home, route `/flashcards` → Flashcards
- [x] **[]** Viết `services/detectionService.js`: POST `/api/detect` với base64 image, xử lý response
- [x] **[]** Viết `services/vocabularyService.js`: POST `/api/vocabulary`, nhận words array
- [x] **[]** Viết `services/cocoService.js`: load COCO-SSD async, detect offline, show loading progress khi model đang tải lần đầu
- [x] **[]** Viết `services/speechService.js`: Google Translate TTS (primary) → Web Speech API (fallback)
- [x] **[]** Viết `services/flashcardService.js`: CRUD decks, dedup logic, localStorage key `aievw_decks`
- [x] **[]** Viết `services/syncService.js`: `syncToServer()` — đọc `aievw_sync_pending` từ localStorage, POST lên server, clear pending
- [x] **[]** Viết `hooks/useOnlineStatus.js`: theo dõi `navigator.onLine` + events
- [x] **[]** Viết `hooks/useCamera.js`: access camera (rear cam mặc định trên mobile), xử lý permission denied
- [x] **[]** Viết `hooks/useFlashcards.js`: state management cho decks
- [x] **[]** Tạo `data/vocabulary.json` (offline fallback — 80+ từ với ipa/vietnamese/type/example/category)
- [x] **[]** Tạo `utils/imageUtils.js`: `fileToBase64()`, `resizeImage()` (max 1024px, quality 0.85)
- [x] **[]** Tạo `utils/categoryColors.js`: `CATEGORY_COLORS` map và `getCategoryColor(category)`

---

## Ngày 3 — UI Components

### Mục tiêu
Xây dựng toàn bộ UI components và 2 trang chính. Mọi label/button dùng tiếng Việt.

### Tasks

- [x] **[UI]** Viết `components/Navbar/Navbar.jsx`: app name bên trái, link "Flashcards" bên phải, hỗ trợ dark mode
- [x] **[UI]** Viết `components/ModeBanner/ModeBanner.jsx`: hiển thị banner online/offline, màu khác nhau
- [x] **[UI]** Viết `components/UploadImage/UploadImage.jsx`:
  - Drag & drop hoặc click to upload
  - Validate size ≤ 10MB, hiển thị lỗi inline nếu vượt
  - Preview ảnh sau khi chọn
- [x] **[UI]** Viết `components/CameraDetection/CameraDetection.jsx`:
  - Camera sau mặc định trên mobile (`facingMode: 'environment'`)
  - Nếu permission denied: ẩn camera, hiện message + UploadImage component
- [x] **[UI]** Viết `components/BoundingBox/BoundingBox.jsx`: overlay bounding box SVG trên ảnh
- [x] **[UI]** Viết `components/VocabularyCard/VocabularyCard.jsx`:
  - Hiển thị: english word, IPA, nghĩa tiếng Việt, part of speech, example sentence, category badge
  - Nút "Nghe" với speaker icon, pulse animation khi đang phát âm
  - Nút "Lưu vào bộ thẻ" → save to deck
  - Nếu không có vocab data: hiện note "Không có dữ liệu từ vựng"
- [x] **[UI]** Viết `components/FlashcardDeck/DeckGrid.jsx`: grid hiển thị các decks với category color
- [x] **[UI]** Viết `components/FlashcardDeck/DeckCard.jsx`: card hiển thị deck info, số từ
- [x] **[UI]** Viết `components/FlashcardDeck/StudyMode.jsx`: flip animation, prev/next navigation
- [x] **[UI]** Viết `components/ConfirmDialog/ConfirmDialog.jsx`: modal xác nhận xóa deck
- [x] **[UI]** Viết `components/Toast/Toast.jsx`: toast notification với animation, auto-dismiss
- [x] **[UI]** Viết skeleton loading cards hiển thị trong khi đang detect
- [x] **[Page]** Viết `pages/Home/Home.jsx`: layout tích hợp Upload + Camera toggle + Results grid
- [x] **[Page]** Viết `pages/Flashcards/Flashcards.jsx`: DeckGrid + StudyMode

---

## Ngày 4 — Error Handling + Deploy

### Mục tiêu
Hoàn thiện xử lý lỗi, kiểm thử toàn bộ, deploy production.

### Error States cần implement

- [x] **[]** Camera permission denied → ẩn camera, hiện "Không có quyền truy cập camera. Vui lòng dùng tải ảnh lên." + UploadImage
- [x] **[]** Tất cả cloud AI fail → toast "Không thể nhận diện. Vui lòng thử lại sau." + clear loading
- [x] **[]** Không detect được object nào → empty state "Không tìm thấy đồ vật. Hãy thử ảnh rõ hơn với ánh sáng tốt hơn."
- [x] **[]** Object detect được nhưng không có trong vocabulary.json → VocabularyCard chỉ hiện english word + note "Không có dữ liệu từ vựng"
- [x] **[]** MongoDB save fail → lưu vào localStorage key `aievw_sync_pending`, toast "Đã lưu cục bộ. Sẽ đồng bộ khi có kết nối."
- [x] **[]** Ảnh > 10MB → lỗi inline dưới upload zone "Ảnh quá lớn. Kích thước tối đa là 10MB."
- [x] **[]** Backend không trả lời → auto fallback sang COCO-SSD + vocabulary.json, ModeBanner hiển thị offline

### App wiring

- [x] **[]** Trong `App.jsx` on mount: `fetch(VITE_API_URL + '/api/ping').catch(() => {})` để warm Render.com
- [x] **[]** Trong `App.jsx`: listener `window.addEventListener('online', handleOnline)` → gọi `syncService.syncToServer()` + toast "Đã đồng bộ dữ liệu lên cloud"

### Kiểm thử

- [x] **[]** Kiểm tra dark mode toàn bộ UI
- [x] **[]** Kiểm tra responsive trên màn hình 375px
- [x] **[]** Test fallback chain đầy đủ: Gemini → OpenRouter → COCO-SSD
- [x] **[]** Test localStorage fallback khi MongoDB fail
- [x] **[]** Test sync khi reconnect (tắt mạng → thêm word → bật mạng → verify sync)

### Deploy

- [ ] **[Deploy]** Deploy backend lên Render.com:
  - Build command: `cd server && npm install`
  - Start command: `cd server && node index.js`
  - Set tất cả env variables từ `.env`
- [ ] **[Deploy]** Deploy frontend lên Vercel:
  - Build command: `cd client && npm run build`
  - Output directory: `client/dist`
  - Set env: `VITE_API_URL=https://your-backend.onrender.com`
- [x] **[]** Smoke test production: upload ảnh → detect → xem vocab card → lưu flashcard → mở trang Flashcards → study mode

---

## Ghi chú quan trọng

1. Build backend trước, frontend sau
2. Test từng AI service riêng trước khi wire fallback chain
3. COCO-SSD load async — phải show loading progress rõ ràng lần đầu tải
4. **Không lưu ảnh vào database** — chỉ lưu vocabulary và flashcard data
5. Mọi text hiển thị cho user phải bằng tiếng Việt
6. Fallback chain phải implement đầy đủ — không được để trống bất kỳ bước nào
7. Dedup deck: so sánh `category.toLowerCase()`
8. Dedup words trong deck: so sánh `english.toLowerCase()`
9. localStorage keys: `aievw_decks` và `aievw_sync_pending`
10. Dùng `updatedAt` timestamp để resolve sync conflict — server wins
11. **CRITICAL:** Tất cả AI API keys chỉ dùng ở backend. Frontend chỉ gọi `/api/*`

---

## Cấu trúc thư mục

```
/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/Navbar.jsx
│   │   │   ├── ModeBanner/ModeBanner.jsx
│   │   │   ├── UploadImage/UploadImage.jsx
│   │   │   ├── CameraDetection/CameraDetection.jsx
│   │   │   ├── BoundingBox/BoundingBox.jsx
│   │   │   ├── VocabularyCard/VocabularyCard.jsx
│   │   │   ├── FlashcardDeck/
│   │   │   │   ├── DeckGrid.jsx
│   │   │   │   ├── DeckCard.jsx
│   │   │   │   └── StudyMode.jsx
│   │   │   ├── ConfirmDialog/ConfirmDialog.jsx
│   │   │   └── Toast/Toast.jsx
│   │   ├── pages/
│   │   │   ├── Home/Home.jsx
│   │   │   └── Flashcards/Flashcards.jsx
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
│   │   ├── data/vocabulary.json
│   │   ├── utils/
│   │   │   ├── imageUtils.js
│   │   │   └── categoryColors.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── server/
    ├── controllers/
    │   ├── detectController.js
    │   └── flashcardsController.js
    ├── routes/
    │   ├── detect.js
    │   └── flashcards.js
    ├── models/Deck.js
    ├── services/
    │   ├── geminiService.js
    │   ├── openrouterService.js
    │   ├── groqService.js
    │   └── mistralService.js
    ├── index.js
    └── package.json
```
