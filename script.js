// Ganti ini dengan ID klien Anda yang sebenarnya dari Google Cloud Console
const GOOGLE_CLIENT_ID = '731188070183-ghpts2ppss378mlspma2bh3edci6eo37.apps.googleusercontent.com';

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxMJS9vGbWNnhYg-sk7cHXe-iQfsRDptIZBtaFiLouetnUXFVDV75BJwQsuDmsDqlxADQ/exec';

// --- Data Dummy untuk Autocomplete dan Alamat Sekolah ---
const schools = [
    { name: "SDN 1 Ngaliyan", address: "Jl. Beringin Raya No. 1, Ngaliyan, Kota Semarang" },
    { name: "SDN 2 Mijen", address: "Jl. Raya Mijen No. 2, Mijen, Kota Semarang" },
    { name: "SDN 3 Gunungpati", address: "Jl. Patemon No. 3, Gunungpati, Kota Semarang" },
    { name: "MIN 1 Semarang", address: "Jl. Wonodri Baru, Semarang Selatan, Kota Semarang" },
    { name: "SD Islam Al Azhar 25 Semarang", address: "Jl. Sultan Agung No. 13, Candi, Kota Semarang" },
    { name: "SD Kristen Lentera Kasih", address: "Jl. Gajahmada No. 5, Kota Semarang" },
    { name: "SD Negeri Kalibanteng Kulon 01", address: "Jl. Siliwangi No. 100, Kalibanteng Kulon, Kota Semarang" }
];

// --- Data Dummy untuk Kota (untuk fitur Autocomplete Lokasi) ---
const indonesianCities = [
    "Kota Semarang",
    "Kabupaten Semarang",
    "Salatiga"
];

// --- Bagian Login dan Inisialisasi ---
function handleCredentialResponse(response) {
    const credential = response.credential;
    const payload = decodeJwtResponse(credential);

    // Menyembunyikan halaman sambutan dan menampilkan formulir utama
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('main-form-section').style.display = 'block';

    // Mengubah tata letak body agar form dapat di-scroll
    document.body.style.alignItems = 'flex-start';

    // Mengisi nama pelapor secara otomatis dari akun Google
    document.getElementById('reporter-name').value = payload.name;
    document.getElementById('user-info').textContent = `Selamat datang, ${payload.name}`;
    localStorage.setItem('userEmail', payload.email);
}

function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

window.onload = function() {
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

    // Panggil fungsi validasi setiap kali input WhatsApp berubah
    const whatsappInput = document.getElementById('reporter-whatsapp');
    whatsappInput.addEventListener('input', validateWhatsapp);
};

// --- Fungsi Validasi Real-time ---
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

// --- Logika Formulir Dinamis dan Pengiriman ---
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

function validateFiles(files) {
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`Ukuran file "${file.name}" melebihi batas 1MB. Mohon unggah file yang lebih kecil.`);
            return false;
        }
    }
    return true;
}

formBefore.addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('bukti-layak');
    if (!validateFiles(fileInput.files)) {
        return;
    }
    
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        if (key === 'keluhan_makanan[]') {
            if (!data['keluhan_makanan']) {
                data['keluhan_makanan'] = [];
            }
            data['keluhan_makanan'].push(value);
        } else {
            data[key] = value;
        }
    });
    
    // Menggabungkan data dari form identitas
    const reporterInfoForm = document.getElementById('reporter-info-form');
    const reporterFormData = new FormData(reporterInfoForm);
    reporterFormData.forEach((value, key) => data[key] = value);

    // Kirim data ke Google Apps Script
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(result => {
        if (result.result === 'success') {
            alert('Form A berhasil dikirim!');
            window.location.reload(); // Muat ulang halaman setelah berhasil
        } else {
            alert('Terjadi kesalahan: ' + result.message);
        }
    })
    .catch(error => {
        alert('Terjadi kesalahan saat mengirim laporan.');
        console.error('Error:', error);
    });
});

formAfter.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('bukti-setelah');
    if (!validateFiles(fileInput.files)) {
        return;
    }
    
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    const reporterInfoForm = document.getElementById('reporter-info-form');
    const reporterFormData = new FormData(reporterInfoForm);
    reporterFormData.forEach((value, key) => data[key] = value);

    // Menambahkan data tanggal dan waktu kejadian dari Form B
    data['incident_datetime'] = document.getElementById('incident-datetime').value;

    // Kirim data ke Google Apps Script
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(result => {
        if (result.result === 'success') {
            alert('Form B berhasil dikirim!');
            window.location.reload();
        } else {
            alert('Terjadi kesalahan: ' + result.message);
        }
    })
    .catch(error => {
        alert('Terjadi kesalahan saat mengirim laporan.');
        console.error('Error:', error);
    });
});