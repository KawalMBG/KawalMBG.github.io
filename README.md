# Formulir Komplain Program MBG (Makan Bergizi Gratis)

Sistem pelaporan berbasis web untuk monitoring Program Makan Bergizi Gratis dengan integrasi Google Drive dan Google Sheets.

## 📋 Fitur

- ✅ Login dengan Google Account
- ✅ Form dinamis (Aduan Kualitas Makanan & Gangguan Kesehatan)
- ✅ Upload file ke Google Drive (max 1MB per file)
- ✅ Penyimpanan data otomatis ke Google Sheets
- ✅ Autocomplete untuk nama sekolah dan lokasi
- ✅ Validasi form real-time
- ✅ Responsive design

## 🚀 Cara Setup

### 1. Persiapan Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Aktifkan **Google+ API** dan **Google Drive API**
4. Buat **OAuth 2.0 Client ID**:
   - Pergi ke **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **OAuth client ID**
   - Pilih **Web application**
   - Tambahkan **Authorized JavaScript origins**: `http://localhost` dan domain Anda
   - Salin **Client ID** yang didapat

### 2. Setup Google Drive

1. Buat folder di Google Drive untuk menyimpan file upload
2. Klik kanan folder → **Share** → **Get link** → Set ke "Anyone with the link can view"
3. Salin **Folder ID** dari URL (setelah `/folders/`)
   - Contoh: `https://drive.google.com/drive/folders/ABC123xyz456` → ID: `ABC123xyz456`

### 3. Setup Google Sheets

1. Buat Google Sheets baru
2. Buka **File** → **Share** → **Share with others**
3. Salin **Spreadsheet ID** dari URL
   - Contoh: `https://docs.google.com/spreadsheets/d/ABC123xyz456/edit` → ID: `ABC123xyz456`

### 4. Setup Google Apps Script

1. Buka Google Sheet yang sudah dibuat
2. Klik **Extensions** → **Apps Script**
3. Hapus code default, paste code dari file `Code.gs`
4. Ganti konfigurasi di baris atas:
   ```javascript
   const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
   const DRIVE_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";
   ```
5. Klik **Deploy** → **New deployment**
6. Pilih type: **Web app**
7. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Klik **Deploy**
9. Salin **Web app URL** yang didapat

### 5. Setup File HTML & JavaScript

1. Edit file `script.js` (Part 1):

   ```javascript
   const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE";
   const GOOGLE_APPS_SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
   ```

2. Gabungkan semua file JavaScript:

   - script.js Part 1 (Konfigurasi & Login)
   - script.js Part 2 (Upload File & Form Logic)
   - script.js Part 3 (Submit Form)

   Simpan sebagai satu file `script.js`

3. Struktur folder proyek:
   ```
   project/
   ├── index.html
   ├── script.js
   ├── style.css
   └── logo.png (opsional)
   ```

## 📝 Cara Menggabungkan File JavaScript

Buat file `script.js` dengan urutan:

```javascript
// 1. Copy semua dari script.js Part 1
// (Konfigurasi, Data Dummy, Login, Inisialisasi)

// 2. Copy semua dari script.js Part 2
// (Upload File & Form Logic)

// 3. Copy semua dari script.js Part 3
// (Submit Form)
```

## 🔧 Testing

### Test Upload File

1. Jalankan fungsi `testSaveData()` di Apps Script Editor
2. Cek apakah data masuk ke Google Sheets
3. Periksa log dengan **View** → **Logs**

### Test Form

1. Buka `index.html` di browser
2. Login dengan akun Google
3. Isi form dan upload file
4. Cek Google Sheets dan Drive

## 📂 Struktur Data Google Sheets

### Sheet: "Kualitas Makanan"

| Timestamp | Email Pelapor | Nama Pelapor | No WhatsApp | Kabupaten/Kota | Nama Sekolah | Alamat Sekolah | Keluhan Makanan | Deskripsi Keluhan | Tindak Lanjut | File Bukti |
| --------- | ------------- | ------------ | ----------- | -------------- | ------------ | -------------- | --------------- | ----------------- | ------------- | ---------- |

### Sheet: "Gangguan Kesehatan"

| Timestamp | Email Pelapor | Nama Pelapor | No WhatsApp | Kabupaten/Kota | Nama Sekolah | Alamat Sekolah | Jenis Insiden | Tanggal & Waktu Kejadian | Jumlah Terdampak | Kronologi Kejadian | Dampak pada Korban | Tindak Lanjut | File Bukti |
| --------- | ------------- | ------------ | ----------- | -------------- | ------------ | -------------- | ------------- | ------------------------ | ---------------- | ------------------ | ------------------ | ------------- | ---------- |

## 🔒 Keamanan & Privacy

- Email pengguna disimpan untuk tracking
- File di Google Drive dengan permission "Anyone with link"
- Data di Google Sheets bisa diatur aksesnya
- **PENTING**: Jangan gunakan localStorage untuk menyimpan data sensitif

## 🐛 Troubleshooting

### Error: "Unknown action"

- Pastikan `GOOGLE_APPS_SCRIPT_URL` sudah benar
- Cek apakah deployment Web App sudah aktif

### File tidak terupload

- Cek ukuran file (max 1MB)
- Pastikan `DRIVE_FOLDER_ID` sudah benar
- Periksa permission folder Drive

### Data tidak masuk ke Sheets

- Cek `SPREADSHEET_ID` sudah benar
- Pastikan Apps Script punya akses ke Sheet
- Jalankan test function di Apps Script

### Login Google tidak muncul

- Pastikan `GOOGLE_CLIENT_ID` sudah benar
- Cek Authorized JavaScript origins di Google Cloud Console
- Clear browser cache

## 📱 Deployment ke Hosting

### Option 1: GitHub Pages (Gratis)

1. Push semua file ke repository GitHub
2. Buka **Settings** → **Pages**
3. Pilih branch → **Save**
4. Akses via `https://username.github.io/repo-name`

### Option 2: Netlify (Gratis)

1. Drag & drop folder ke [Netlify Drop](https://app.netlify.com/drop)
2. Atau connect dengan GitHub repository

### Option 3: Hosting Sendiri

Upload semua file ke web hosting Anda via FTP/cPanel

## 🎨 Kustomisasi

### Menambah Data Sekolah

Edit array `schools` di `script.js`:

```javascript
const schools = [
  { name: "Nama Sekolah", address: "Alamat Lengkap" },
  // tambah sekolah lain...
];
```

### Menambah Kota/Kabupaten

Edit array `indonesianCities` di `script.js`:

```javascript
const indonesianCities = [
  "Kota Semarang",
  "Kabupaten Semarang",
  // tambah kota lain...
];
```

### Mengubah Logo

Ganti file `logo.png` dengan logo Anda

### Mengubah Warna

Edit file `style.css`:

```css
/* Primary color */
background-color: #28a745; /* hijau */

/* Accent color */
color: #007bff; /* biru */
```

## 📊 Analisis Data

Gunakan Google Sheets untuk:

- **Pivot Table**: Analisis jumlah laporan per sekolah/kota
- **Charts**: Visualisasi tren laporan
- **Filter**: Cari laporan spesifik
- **Export**: Download data dalam format Excel/CSV

## 🔄 Update & Maintenance

### Update Data Sekolah

1. Edit array `schools` di `script.js`
2. Upload ulang file

### Backup Data

1. Buka Google Sheets
2. **File** → **Download** → **Excel/CSV**
3. Simpan secara berkala

### Monitoring

- Cek Google Sheets secara rutin
- Review file di Google Drive
- Monitor kapasitas storage

## 📞 Support

Jika ada masalah:

1. Cek console browser (F12 → Console)
2. Cek log Apps Script (**View** → **Logs**)
3. Pastikan semua ID dan URL sudah benar

## 📄 Lisensi

Proyek ini dibuat untuk keperluan monitoring Program MBG.

---

**Dibuat untuk**: Program Makan Bergizi Gratis Kabupaten Semarang
**Versi**: 1.0
**Terakhir Update**: Oktober 2024
