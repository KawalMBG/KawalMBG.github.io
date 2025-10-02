// ==================== KONFIGURASI ====================
// GANTI DENGAN ID DAN URL ANDA SENDIRI
const GOOGLE_CLIENT_ID = '731188070183-ghpts2ppss378mlspma2bh3edci6eo37.apps.googleusercontent.com';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzNCxnpRl2gmSK0vkvJ1VeJQODsea8IR9eyVRpWDYx0yf87sLDYfYi0RfnxJOs7Vh5/exec'; // Deploy Google Apps Script sebagai Web App

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ==================== DATA DUMMY ====================
const schools = [
    { name: "SDN 1 Ngaliyan", address: "Jl. Beringin Raya No. 1, Ngaliyan, Kota Semarang" },
    { name: "SDN 2 Mijen", address: "Jl. Raya Mijen No. 2, Mijen, Kota Semarang" },
    { name: "SDN 3 Gunungpati", address: "Jl. Patemon No. 3, Gunungpati, Kota Semarang" },
    { name: "MIN 1 Semarang", address: "Jl. Wonodri Baru, Semarang Selatan, Kota Semarang" },
    { name: "SD Islam Al Azhar 25 Semarang", address: "Jl. Sultan Agung No. 13, Candi, Kota Semarang" },
    { name: "SD Kristen Lentera Kasih", address: "Jl. Gajahmada No. 5, Kota Semarang" },
    { name: "SD Negeri Kalibanteng Kulon 01", address: "Jl. Siliwangi No. 100, Kalibanteng Kulon, Kota Semarang" }
];

const indonesianCities = ["Kota Semarang", "Kabupaten Semarang", "Salatiga"];

// ==================== VARIABEL GLOBAL ====================
let uploadedFilesBefore = [];
let uploadedFilesAfter = [];
let userEmail = '';

// ==================== FUNGSI LOGIN GOOGLE ====================
function handleCredentialResponse(response) {
    const credential = response.credential;
    const payload = decodeJwtResponse(credential);

    // Sembunyikan welcome section, tampilkan form
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('main-form-section').style.display = 'block';
    document.body.style.alignItems = 'flex-start';

    // Isi nama pelapor otomatis
    document.getElementById('reporter-name').value = payload.name;
    document.getElementById('user-info').textContent = `Selamat datang, ${payload.name}`;
    
    // Simpan email ke variabel global (BUKAN localStorage)
    userEmail = payload.email;
}

function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
    );
    return JSON.parse(jsonPayload);
}

// ==================== INISIALISASI WINDOW ONLOAD ====================
window.onload = function() {
    // Inisialisasi Google Sign-In
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    
    google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: "outline", size: "large", type: "standard" }
    );
    
    // Inisialisasi Autocomplete untuk Nama Sekolah
    $("#reporter-school").autocomplete({
        source: schools.map(school => school.name),
        select: function(event, ui) {
            const selectedSchool = schools.find(school => school.name === ui.item.value);
            if (selectedSchool) {
                document.getElementById('reporter-school-address').value = selectedSchool.address;
            }
        }
    });

    // Inisialisasi Autocomplete untuk Lokasi
    $("#reporter-location").autocomplete({
        source: indonesianCities
    });

    // Event listener untuk validasi WhatsApp
    const whatsappInput = document.getElementById('reporter-whatsapp');
    whatsappInput.addEventListener('input', validateWhatsapp);
    
    // Event listener untuk file upload
    document.getElementById('bukti-layak').addEventListener('change', function(e) {
        handleFileSelection(e, 'before');
    });
    
    document.getElementById('bukti-setelah').addEventListener('change', function(e) {
        handleFileSelection(e, 'after');
    });
};

// ==================== VALIDASI WHATSAPP ====================
function validateWhatsapp() {
    const whatsappInput = document.getElementById('reporter-whatsapp');
    const errorMessage = document.getElementById('whatsapp-error');
    const pattern = new RegExp(whatsappInput.getAttribute('pattern'));

    if (whatsappInput.value.trim() === '') {
        errorMessage.textContent = '';
        whatsappInput.setCustomValidity('');
    } else if (!pattern.test(whatsappInput.value)) {
        errorMessage.textContent = 'Nomor Whatsapp harus 10-15 digit angka.';
        whatsappInput.setCustomValidity('Invalid');
    } else {
        errorMessage.textContent = '';
        whatsappInput.setCustomValidity('');
    }
}

// ==================== FUNGSI UPLOAD FILE ====================
function handleFileSelection(event, formType) {
    const files = Array.from(event.target.files);
    const fileListDiv = formType === 'before' ? 
        document.getElementById('file-list-before') : 
        document.getElementById('file-list-after');
    
    // Validasi ukuran file
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`Ukuran file "${file.name}" melebihi batas 1MB. Mohon unggah file yang lebih kecil.`);
            event.target.value = '';
            return;
        }
    }
    
    // Simpan file ke variabel global
    if (formType === 'before') {
        uploadedFilesBefore = files;
    } else {
        uploadedFilesAfter = files;
    }
    
    // Tampilkan daftar file yang dipilih
    fileListDiv.innerHTML = '';
    if (files.length > 0) {
        const ul = document.createElement('ul');
        ul.style.marginTop = '10px';
        ul.style.color = '#28a745';
        
        files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            ul.appendChild(li);
        });
        
        fileListDiv.appendChild(ul);
    }
}

// Konversi file ke Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Hapus prefix "data:*/*;base64,"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Upload file ke Google Drive via Google Apps Script
async function uploadFilesToDrive(files, formType) {
    const uploadedUrls = [];
    
    for (const file of files) {
        try {
            // Konversi file ke Base64
            const base64Data = await fileToBase64(file);
            
            // Kirim ke Google Apps Script
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Penting untuk Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'uploadFile',
                    fileName: file.name,
                    fileData: base64Data,
                    mimeType: file.type,
                    formType: formType
                })
            });
            
            // Karena mode no-cors, kita tidak bisa membaca response
            // Asumsikan berhasil jika tidak ada error
            uploadedUrls.push({
                name: file.name,
                size: file.size
            });
            
        } catch (error) {
            console.error('Error uploading file:', file.name, error);
            throw error;
        }
    }
    
    return uploadedUrls;
}

// ==================== LOGIKA FORM DINAMIS ====================
const formBefore = document.getElementById('form-before');
const formAfter = document.getElementById('form-after');
const reportTypeDropdown = document.getElementById('report-type');

reportTypeDropdown.addEventListener('change', () => {
    if (reportTypeDropdown.value === 'before') {
        formBefore.style.display = 'block';
        formAfter.style.display = 'none';
    } else if (reportTypeDropdown.value === 'after') {
        formAfter.style.display = 'block';
        formBefore.style.display = 'none';
    } else {
        formBefore.style.display = 'none';
        formAfter.style.display = 'none';
    }
});

// ==================== FUNGSI PENGUMPULAN DATA FORM ====================
function getReporterInfo() {
    const reporterInfoForm = document.getElementById('reporter-info-form');
    const formData = new FormData(reporterInfoForm);
    const data = {};
    
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    return data;
}

function getSelectedCheckboxValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    const values = [];
    
    checkboxes.forEach(checkbox => {
        values.push(checkbox.value);
    });
    
    return values;
}

// ==================== SUBMIT FORM ADUAN KUALITAS MAKANAN ====================
formBefore.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Tampilkan loading
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Mengirim...';
    submitButton.disabled = true;
    
    try {
        // Kumpulkan data reporter
        const reporterData = getReporterInfo();
        
        // Kumpulkan data form
        const keluhanMakanan = getSelectedCheckboxValues('keluhan_makanan[]');
        const deskripsiKeluhan = document.getElementById('deskripsi-layak').value;
        const tindakLanjut = document.getElementById('tindaklanjut-bersih').value;
        
        // Upload file jika ada
        let fileUrls = [];
        if (uploadedFilesBefore.length > 0) {
            try {
                fileUrls = await uploadFilesToDrive(uploadedFilesBefore, 'kualitas-makanan');
            } catch (error) {
                alert('Gagal mengupload file. Laporan akan dikirim tanpa file.');
                console.error('Upload error:', error);
            }
        }
        
        // Gabungkan semua data
        const submissionData = {
            ...reporterData,
            tipe_laporan: 'Aduan Kualitas Makanan',
            keluhan_makanan: keluhanMakanan.join(', '),
            deskripsi_keluhan: deskripsiKeluhan,
            tindak_lanjut: tindakLanjut,
            file_bukti: fileUrls.map(f => f.name).join(', '),
            timestamp: new Date().toISOString(),
            reporter_email: userEmail
        };
        
        // Kirim ke Google Sheets via Apps Script
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'submitForm',
                data: submissionData
            })
        });
        
        // Berhasil
        alert('Aduan Kualitas Makanan berhasil dikirim!');
        window.location.reload();
        
    } catch (error) {
        alert('Terjadi kesalahan saat mengirim laporan: ' + error.message);
        console.error('Error:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// ==================== SUBMIT FORM ADUAN GANGGUAN KESEHATAN ====================
formAfter.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Tampilkan loading
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Mengirim...';
    submitButton.disabled = true;
    
    try {
        // Kumpulkan data reporter
        const reporterData = getReporterInfo();
        
        // Kumpulkan data form
        const jenisInsiden = document.querySelector('input[name="jenis_insiden"]:checked').value;
        const incidentDatetime = document.getElementById('incident-datetime').value;
        const jumlahTerdampak = document.getElementById('jumlah').value;
        const kronologi = document.getElementById('kronologi').value;
        const dampak = document.getElementById('dampak').value;
        const tanggungjawab = document.getElementById('tanggungjawab').value;
        
        // Upload file jika ada
        let fileUrls = [];
        if (uploadedFilesAfter.length > 0) {
            try {
                fileUrls = await uploadFilesToDrive(uploadedFilesAfter, 'gangguan-kesehatan');
            } catch (error) {
                alert('Gagal mengupload file. Laporan akan dikirim tanpa file.');
                console.error('Upload error:', error);
            }
        }
        
        // Gabungkan semua data
        const submissionData = {
            ...reporterData,
            tipe_laporan: 'Aduan Gangguan Kesehatan',
            jenis_insiden: jenisInsiden,
            tanggal_waktu_kejadian: incidentDatetime,
            jumlah_terdampak: jumlahTerdampak,
            kronologi_kejadian: kronologi,
            dampak_korban: dampak,
            tindak_lanjut: tanggungjawab,
            file_bukti: fileUrls.map(f => f.name).join(', '),
            timestamp: new Date().toISOString(),
            reporter_email: userEmail
        };
        
        // Kirim ke Google Sheets via Apps Script
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'submitForm',
                data: submissionData
            })
        });
        
        // Berhasil
        alert('Aduan Gangguan Kesehatan berhasil dikirim!');
        window.location.reload();
        
    } catch (error) {
        alert('Terjadi kesalahan saat mengirim laporan: ' + error.message);
        console.error('Error:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});