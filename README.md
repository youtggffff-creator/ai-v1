# ☀ Uchiro — ជំនួយការ AI ផ្ទាល់ខ្លួនរបស់អ្នក

Chatbot ផ្ទាល់ខ្លួន (robot/programming assistant) ដែលមាន theme premium original, ចាំ memory អចិន្ត្រៃយ៍, ស្វែងរក internet ពិត, និងបង្កើត file ស្វ័យប្រវត្តិ។

---

## ⚠️ សំខាន់ — សូមអានមុន

1. **អំពី testing:** ខ្ញុំបានពិនិត្យ syntax កូដទាំងអស់ (`node --check`) ជាប់ជោគជ័យ ប៉ុន្តែ **environment របស់ខ្ញុំគ្មាន internet access** ដូច្នេះមិនអាច `npm install` + run ពិតបានទេ។ អ្នកជាអ្នកដំបូង test — បើ error អ្វី copy message មកឲ្យខ្ញុំកែ។

2. **អំពី Theme:** អ្នកសុំ theme ស្រដៀង "Luffy Gear 5" / One Piece — ខ្ញុំ**មិនអាចប្រើ character ឬរូបភាព copyrighted** នោះទេ (វាជា IP របស់ Eiichiro Oda/Shueisha)។ ជំនួសមកវិញ ខ្ញុំបានរចនា theme **ដើមកំណើត** ដែលមានអារម្មណ៍ថាមពល "ព្រះអាទិត្យរះ" (មាស-ក្រហម-ភ្លើង, animated glow) ដែលផ្តល់អារម្មណ៍ស្រដៀងគ្នា ដោយមិនរំលោភសិទ្ធិ។

---

## មុខងារពេញលេញ

| មុខងារ | ពន្យល់ |
|---|---|
| 🧠 **Memory អចិន្ត្រៃយ៍** | Uchiro ចាំរឿងសំខាន់ៗអំពីអ្នក (ឈ្មោះ, ចំណូលចិត្ត, គម្រោង...) ស្វ័យប្រវត្តិ — មិនចាំបាច់ប្រាប់ម្តងទៀត! មើល/លុបបានក្នុង sidebar |
| 🔍 **Web search ពិត** | ស្វែងរក internet ដោយខ្លួនឯង ពេលត្រូវការព័ត៌មានថ្មីៗ |
| 📎 **File upload (រូបភាព + PDF + Text)** | ភ្ជាប់រូបភាព, PDF, ឬ file text (.txt/.csv/.md/.json) ឲ្យ Uchiro អាន/វិភាគ |
| 📄 **Smart file generation** | Uchiro ខ្លួនឯងសម្រេចចិត្តបង្កើត PDF/Word ពេលសមរម្យ (Tool Use) |
| 🧮 **Calculator** | គណនាលេខយ៉ាងជាក់លាក់ (មិនមែនប៉ាន់ស្មានក្នុងចិត្តទេ — គណនាពិត) |
| 🕐 **Date/Time** | ដឹងកាលបរិច្ឆេទ/ម៉ោងបច្ចុប្បន្នពិត សម្រាប់គណនា deadline ។ល។ |
| 💾 **Database** | ការសន្ទនា + memory រក្សាទុកអចិន្ត្រៃយ៍ក្នុង `chat.db` (SQLite) |
| 🗂 **Catalog sidebar** | ប៊ូតុងលឿនសម្រាប់ tool សំខាន់ៗ + បញ្ជី memory + បញ្ជី file |
| 🌐 **English-first, auto-Khmer AI replies** | Uchiro ឆ្លើយជាភាសាអង់គ្លេសដោយ default — ប្តូរទៅខ្មែរស្វ័យប្រវត្តិពេលអ្នកសរសេរខ្មែរ |
| 🔤 **EN/ខ្មែរ Language Toggle** | ប្តូរភាសា **UI** (ប៊ូតុង, labels) ដោយខ្លួនឯង — ចុច "EN" ឬ "ខ្មែរ" ក្នុង sidebar |
| 🔐 **Sign in with Email** | គណនីផ្ទាល់ខ្លួន — history/memory ចាំតាមគណនី មិនមែនតាម browser ទេ (ចូល device ណាក៏បាន) |
| 📱 **Mobile App (PWA)** | បើកលើ browser ទូរស័ព្ទ → "Add to Home Screen" → ដំណើរការដូច app ពិត មាន icon ស្រស់ស្អាត |
| 👑 **Founder Credit** | បង្ហាញ "Founder: KHINSOVANNOREAKYOUT" នៅផ្នែកខាងក្រោម sidebar និង login screen |
| 🎨 **Premium UI** | Theme ដើមកំណើត "ព្រះអាទិត្យរះ" — មាស/ក្រហម, animated glow, glass sidebar |

---

## ⚠️ ស្មោះត្រង់អំពី "Mobile App"

អ្នកសុំ mobile app — ខ្ញុំបានធ្វើជា **PWA (Progressive Web App)**៖
- ✅ **អាចធ្វើបាន:** User បើក website លើ browser ទូរស័ព្ទ → ចុច "Add to Home Screen" → មាន icon លើ home screen ដូច app ពិត, ដំណើរការ full-screen, smooth
- ❌ **មិនអាចធ្វើបាន (ក្នុង project នេះ):** App ពិតសម្រាប់ដាក់ក្នុង App Store/Play Store — នេះត្រូវការ Xcode/Android Studio, គណនី developer ($99/ឆ្នាំ Apple, $25 Google), និងការ review ដោយ Apple/Google ដែលហួសពីអ្វីដែលកូដ project មួយអាចផ្តល់បាន

---

## Tools ទាំង ៥ ដែល Uchiro អាចហៅដោយខ្លួនឯង

| Tool | Uchiro ហៅពេលណា |
|---|---|
| `create_document` | User ចង់បាន report/letter/contract ជា file PDF ឬ Word |
| `web_search` | ត្រូវការព័ត៌មានថ្មីៗ ដែល Claude មិនដឹង (ព័ត៌មាន, តម្លៃ, events) |
| `remember_fact` | User ប្រាប់ព័ត៌មានផ្ទាល់ខ្លួន (ឈ្មោះ, ចំណូលចិត្ត, គម្រោង) |
| `calculate` | ត្រូវការគណនាលេខឲ្យបានត្រឹមត្រូវ 100% |
| `get_datetime` | ត្រូវការដឹងកាលបរិច្ឆេទ/ម៉ោងបច្ចុប្បន្ន |

---

## ជំហានទី ១ — ដំឡើង

### ត្រូវការ
- **Node.js** (https://nodejs.org)
- **VS Code**
- API Key ពី Anthropic

### ជំហាន

1. Extract file zip → បើក folder ក្នុង VS Code
2. Terminal → `npm install` (ចាំបន្តិច ព្រោះ `better-sqlite3` ត្រូវ compile)
3. ចម្លង `.env.example` → ប្តូរឈ្មោះទៅ `.env` → ដាក់ API key
4. `npm start`
5. បើក `http://localhost:3000`
6. ចុច **"Sign Up"** → ដាក់ឈ្មោះ + email + password → បង្កើតគណនីដំបូង
7. ចាប់ផ្តើម chat!

### ដំឡើងលើទូរស័ព្ទ (Mobile App feel)

1. Deploy ទៅ Railway/Render ជាមុនសិន (ត្រូវការ HTTPS ដើម្បី PWA ដំណើរការត្រឹមត្រូវ — local `http://localhost` មិន install បានលើទូរស័ព្ទទេ)
2. បើក URL នោះលើ browser ទូរស័ព្ទ (Chrome/Safari)
3. ចុច menu (⋮ ឬ Share) → **"Add to Home Screen"**
4. Uchiro នឹងលេចឡើងជា icon ដូច app ពិត — ចុចបើក full-screen, smooth

---

## របៀបសាកល្បង feature នីមួយៗ

**Memory:**
```
ឈ្មោះខ្ញុំគឺ Dara ហើយខ្ញុំកំពុងសាងសង់ store លក់ស្បែកជើង
```
→ Uchiro គួរហៅ `remember_fact` ស្វ័យប្រវត្តិ → badge "🧠 ចាំរួច" លេចឡើង → មើលក្នុង sidebar "អ្វីដែល Uchiro ចាំ"
→ សាកជជែកបន្តសួរ "តើខ្ញុំឈ្មោះអី?" — Uchiro គួរនឹកឃើញ

**Web Search:**
```
តម្លៃមាសថ្ងៃនេះប៉ុន្មាន?
```

**File Generation (ដោយមិនប្រើពាក្យ "pdf" ត្រង់ៗ):**
```
សរសេរផែនការអាជីវកម្មខ្លីមួយសម្រាប់ store ខ្ញុំ
```
→ File លេចក្នុង sidebar "File ដែលបានបង្កើត" ភ្លាមៗ

**Image/File Upload:**
ចុច 📎 → ជ្រើសរូបភាព, PDF, ឬ .txt/.csv → សួរអំពីវា (ឧទាហរណ៍ "summarize this")

**Calculator:**
```
Calculate 15% tip on $84.50
```

**English → Khmer auto-switch:**
- វាយ "What can you do?" → Uchiro ឆ្លើយជាអង់គ្លេស
- វាយ "តើអ្នកអាចធ្វើអ្វីខ្លះ?" → Uchiro ឆ្លើយជាខ្មែរ

---

## រចនាសម្ព័ន្ធ Project

```
ai-chatbot-store/
├── server.js          ← Backend (Tool Use: create_document, web_search, remember_fact)
├── db.js               ← Database (messages + memory tables)
├── chat.db               ← បង្កើតស្វ័យប្រវត្តិពេល run លើកដំបូង
├── package.json
├── .env
├── public/
│   ├── index.html          ← Sidebar + Chat UI
│   ├── style.css             ← Premium "ព្រះអាទិត្យរះ" theme
│   ├── script.js               ← Frontend logic (memory panel, files panel, catalog)
│   └── downloads/                ← File ដែលបង្កើត
```

---

## ជំហានទី ២ — Deploy ទៅ Railway (24/7)

⚠️ **Database Warning:** SQLite (`chat.db`) លើ Railway free tier disk **មិនអចិន្ត្រៃយ៍ទេ** — memory/history អាចបាត់ពេល redeploy។ សម្រាប់ production ពិត ត្រូវប្តូរទៅ Railway PostgreSQL (built-in) — ប្រាប់ខ្ញុំបើចង់ឲ្យខ្ញុំធ្វើការប្តូរនេះ។

1. Push ទៅ GitHub
2. Railway → New Project → Deploy from GitHub
3. Environment Variables → `ANTHROPIC_API_KEY`
4. Deploy

---

## បញ្ហាទូទៅ

| បញ្ហា | ដំណោះស្រាយ |
|---|---|
| `npm install` អាក់ `better-sqlite3` | Windows: `npm install --global windows-build-tools`; Mac: `xcode-select --install` |
| Font មិនបង្ហាញត្រឹមត្រូវ | ត្រូវការ internet ដើម្បីទាញ Google Fonts (Anton, Manrope) — ដំណើរការធម្មតាពេល deploy ពិត |
| Memory មិនចាំ | ត្រូវប្រាកដថា `sessionId` ដដែលក្នុង browser (កុំសម្អាត localStorage) |
| Error ផ្សេងទៀត | Copy error message ពេញលេញមកឲ្យខ្ញុំ |
