# 🚀 FB Bulk Poster Pro v2.1

ระบบโพสต์เพจ Facebook แบบ Bulk สูงสุด 50 โพสต์ — Web App บน GitHub Pages

🔗 **เข้าใช้งาน:** [https://themton.github.io/postfb/](https://themton.github.io/postfb/)

---

## ✨ คุณสมบัติ

- **โพสต์ทีละ 50 โพสต์** พร้อมรูปภาพ/วิดีโอ
- **อัพโหลดรูป/วิดีโอจากเครื่อง** — Drag & Drop, Preview thumbnail
- **URL สื่อ** — รองรับทั้งไฟล์จากเครื่องและ URL
- **ดึงชื่อเพจอัตโนมัติ** จาก Facebook Token
- **ฐานข้อมูล Google Sheets** — เก็บกลุ่ม, แคปชั่น, URL สื่อ, ประวัติ
- **Apps Script สร้าง Sheet อัตโนมัติ** — รันครั้งเดียวจบ
- **สุ่มแคปชั่น** / ตามลำดับ / แคปชั่นเดียว
- **กลุ่มสินค้าแยกเพจ** พร้อมสีบ่งบอก
- **Deploy อัตโนมัติ** ผ่าน GitHub Actions

---

## 📦 วิธีติดตั้ง

### ขั้นตอนที่ 1: เปิด GitHub Pages

1. ไปที่ **Settings** → **Pages**
2. Source: เลือก **GitHub Actions**
3. รอ deploy เสร็จ (ดูที่ Actions tab)
4. เข้าใช้งานที่ `https://themton.github.io/postfb/`

### ขั้นตอนที่ 2: สร้าง Google Sheets (Apps Script)

1. สร้าง Google Spreadsheet ใหม่
2. ไปที่ **Extensions** → **Apps Script**
3. ลบโค้ดเดิม → **วางโค้ดจากไฟล์** `apps-script/Code.gs`
4. กด **Run** → เลือก `setupAll` → อนุญาต Permission
5. ระบบจะสร้าง 5 sheets อัตโนมัติ + แสดง Spreadsheet ID

### ขั้นตอนที่ 3: รับ Google OAuth Token

1. ไปที่ [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. เลือก **Google Sheets API v4** → `https://www.googleapis.com/auth/spreadsheets`
3. คลิก **Authorize APIs** → เลือกบัญชี Google
4. คลิก **Exchange authorization code for tokens**
5. คัดลอก **Access Token**

### ขั้นตอนที่ 4: รับ Facebook User Token

1. ไปที่ [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. เลือก Permissions: `pages_manage_posts`, `pages_read_engagement`, `publish_video`
3. คลิก **Generate Access Token** → คัดลอก Token

### ขั้นตอนที่ 5: ตั้งค่าในเว็บ

1. เปิดเว็บ → คลิก **"ไปตั้งค่า"**
2. วาง **Facebook User Token**
3. วาง **Spreadsheet ID** + **Google OAuth Token**
4. คลิก **"บันทึกตั้งค่า"**

---

## 📖 วิธีใช้งาน

### สร้างกลุ่มสินค้า
1. เมนู **"กลุ่มสินค้า"** → **"เพิ่มกลุ่ม"**
2. คลิก **"โหลดเพจ"** → เลือกเพจ (ชื่อ + Token กรอกอัตโนมัติ)
3. ตั้งชื่อกลุ่ม → บันทึก

### เพิ่มแคปชั่น
1. เมนู **"แคปชั่น"** → เลือกกลุ่ม
2. พิมพ์แคปชั่น (คั่นด้วย `---`) หรืออัพโหลด `.txt`
3. บันทึก → เก็บใน Google Sheets

### อัพโหลดสื่อ
1. เมนู **"สื่อ / Media"**
2. **แท็บ "อัพโหลดจากเครื่อง"** → ลากไฟล์มาวาง หรือคลิกเลือก
3. **แท็บ "URL"** → วาง URL รูป/วิดีโอ
4. รองรับ: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM

### สร้างโพสต์
1. เมนู **"สร้างโพสต์"** → เลือกกลุ่ม
2. ตั้งจำนวน (1-50), โหมดแคปชั่น, หน่วงเวลา
3. คลิก **"เริ่มโพสต์"** → ดูผลลัพธ์ real-time

---

## 📊 โครงสร้างข้อมูล

| ที่เก็บ | ข้อมูล |
|---------|--------|
| Google Sheets: `groups` | กลุ่มสินค้า + Page Token |
| Google Sheets: `captions` | แคปชั่นทั้งหมด |
| Google Sheets: `media` | URL สื่อ |
| Google Sheets: `activity` | ประวัติการโพสต์ |
| IndexedDB (เบราว์เซอร์) | ไฟล์รูป/วิดีโอที่อัพโหลด |

---

## 📁 โครงสร้างโปรเจค

```
postfb/
├── .github/workflows/deploy.yml  ← GitHub Actions auto-deploy
├── apps-script/Code.gs           ← Apps Script สร้าง Sheet อัตโนมัติ
├── src/
│   ├── main.jsx                  ← Entry point
│   ├── App.jsx                   ← Main application
│   └── services/
│       ├── facebook.js           ← Facebook API + file upload
│       └── googleSheets.js       ← Google Sheets database
├── index.html
├── vite.config.js
└── package.json
```

## 🛠 Tech Stack

- **React 18** + **Vite**
- **Google Sheets API v4** (ฐานข้อมูล)
- **Facebook Graph API v19.0** (โพสต์ + ดึงเพจ)
- **IndexedDB** (เก็บไฟล์ในเบราว์เซอร์)
- **GitHub Pages** + **GitHub Actions** (hosting + CI/CD)
- **Google Apps Script** (สร้าง Sheet อัตโนมัติ)

---

## ⚠️ ข้อควรระวัง

- Facebook Token ต้อง renew เป็นระยะ
- Google OAuth Token หมดอายุใน 1 ชม. จาก Playground
- ควรตั้งหน่วงเวลาอย่างน้อย 30 วินาที (Rate Limit)
- อย่า commit Token ลง source code
