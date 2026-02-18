# PayTaksi Telegram (MVP) — 3 Bot + Mini App + Admin Panel

Bu paket **tam sıfırdan** hazırlanmış MVP-dir:
- ✅ 3 bot: **@PayTaksiPassenger_bot**, **@PayTaksiDriver_bot**, **@PayTaksiAdmin_bot** (siz tokenləri qoyursunuz)
- ✅ Telegram **Mini App (WebApp)**: müştəri sifariş verir, sürücü paneli var
- ✅ Admin panel (web): sürücü təsdiqi + qəbz təsdiqi + gedişlər
- ✅ Qiymət qaydası: **3.50 AZN** başlanğıc, **3 km-dən sonra hər 1 km = 0.40 AZN**
- ✅ Komissiya: sürücü hər gedişdən **10%** ödəyir (balansdan silinir)
- ✅ Balans **-15 AZN** olanda sürücü sifariş qəbul edə bilmir və səbəbi ekranda görür
- ✅ Xəritə: **OpenStreetMap + Leaflet** (pulsuz)
- ✅ Naviqasiya: **Waze link** ilə (1 klik)

> Bu MVP “bire-bir Bolt” deyil (tam Bolt funksionallığı çox böyükdür), amma sizin istədiyiniz əsas axınlar var və genişləndirmək üçün tam hazır skeletdir.

---

## 1) Botları yaratmaq (BotFather)

Telegram-da **@BotFather** açın:

### A) Passenger bot
1. `/newbot`
2. Ad: `PayTaksi Sifariş Ver`
3. Username: `PayTaksiPassenger_bot` (boşdursa)
4. Tokeni saxlayın.

### B) Driver bot
1. `/newbot`
2. Ad: `PayTaksi Sürücü Ol`
3. Username: `PayTaksiDriver_bot`
4. Tokeni saxlayın.

### C) Admin bot
1. `/newbot`
2. Ad: `PayTaksi Admin`
3. Username: `PayTaksiAdmin_bot`
4. Tokeni saxlayın.

### WebApp düyməsi (menyu)
Hər bot üçün:
- BotFather → `/mybots` → botu seç → **Bot Settings** → **Menu Button**
- URL kimi sizin Render domeniniz olacaq:
  - Passenger: `https://SIZIN-DOMEN.onrender.com/app/?bot=passenger`
  - Driver: `https://SIZIN-DOMEN.onrender.com/driver/?bot=driver`

---

## 2) GitHub-a yüklə

Bu repo struktur:
- `server/` — Node.js backend + bots + public webapp

GitHub-da yeni repo açın, sonra bu faylları push edin.

---

## 3) Render-də deploy (pulsuz)

Render → **New** → **Web Service** → GitHub reposunu seçin.

### Build / Start
- **Root Directory:** `server`
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command:** `npm start`

### Database
MVP SQLite ilə gəlir. Render-də real sistem üçün **PostgreSQL** əlavə etmək yaxşıdır:
- Render → **New** → **PostgreSQL** yaradın
- Sonra Web Service → **Environment** → `DATABASE_URL` Postgres URL-i ilə doldurun.
- Prisma datasource provider-i SQLite yazılıb. Postgres üçün:
  - `server/prisma/schema.prisma` içində `provider = "sqlite"` → `provider = "postgresql"` edin.
  - Sonra yenidən deploy.

---

## 4) .env (server/.env)

`server/.env.example` faylını `.env` edin və doldurun:

- `PUBLIC_BASE_URL` — Render domeniniz (məs: `https://paytaksi.onrender.com`)
- 3 bot token
- `JWT_SECRET` — random
- `ADMIN_PASSWORD` — admin panel parolu

Admin panel: `https://SIZIN-DOMEN/admin/`

---

## 5) Sürücü qeydiyyatı və təsdiq

1. Sürücü botuna `/start`
2. “Sürücü paneli” açılır
3. Ad/Soyad/Telefon + Avto məlumatları doldurur
4. Sənədləri şəkil olaraq yükləyir
5. Admin paneldə **Pending sürücülər** bölməsində təsdiqləyir

---

## 6) Balans artırma (qəbz)

1. Sürücü “Balans artır” bölməsində məbləğ yazır
2. Qəbz şəklini yükləyir
3. Admin paneldə **Pending top-up** bölməsində təsdiqləyir
4. Sistem balansı artırır

---

## 7) Gediş axını

1. Müştəri botundan WebApp açır
2. Xəritədə 1-ci toxunuş: götürmə, 2-ci toxunuş: gedəcəyiniz
3. Qiymət çıxır → “Sifariş ver”
4. Sürücü onlayn olanda “Sifarişlər” bölməsində görür → “Qəbul et”
5. “Gedişi bitir” basanda **iri, tünd yazı ilə** müştəridən alınacaq məbləğ göstərilir
6. Komissiya 10% sürücünün balansından silinir

---

## Qeyd (MVP məhdudiyyətləri)

- Hal-hazırda sürücüyə sifariş “ən yaxın” üzrə paylanmır (sadə şəkildə `REQUESTED` sırasından göstərilir)
- Real-time üçün WebSocket əlavə oluna bilər (Socket.IO)
- Kart-to-kart / M10 inteqrasiyası bu MVP-də “qəbz yüklə → admin təsdiq” formasındadır (real payment gateway əlavə edilə bilər)

---

## Dəyişikliklər / Gələcək patch qaydası

Siz necə istəmisiniz:
- Heç nə silinmir
- Yalnız əlavə və düzəliş edilir
- Hər düzəlişdə yalnız dəyişən faylları **ZIP** edib göndərəcəyəm.

