// Konfigurasi Google Client ID Anda
// Ganti ini dengan ID klien Anda yang sebenarnya dari Google Cloud Console
const GOOGLE_CLIENT_ID = '731188070183-ghpts2ppss378mlspma2bh3edci6eo37.apps.googleusercontent.com';
// --- Bagian Login ---
function handleCredentialResponse(response) {
    const credential = response.credential;
    const payload = decodeJwtResponse(credential);

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-form-section').style.display = 'block';
    
    // Mengisi nama pelapor secara otomatis dari Google
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

// Inisialisasi Google Sign-In
window.onload = function() {
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    
    google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: "outline", size: "large", type: "standard" }
    );
    
    // Fungsi untuk mengisi dropdown sekolah
    fetchSchools();
};

// --- Logika Formulir Dinamis dan Pengiriman ---
const formBefore = document.getElementById('form-before');
const formAfter = document.getElementById('form-after');
const radioBefore = document.getElementById('report-type-before');
const radioAfter = document.getElementById('report-type-after');

// Menangani pilihan radio button
radioBefore.addEventListener('change', () => {
    formBefore.style.display = 'block';
    formAfter.style.display = 'none';
});

radioAfter.addEventListener('change', () => {
    formAfter.style.display = 'block';
    formBefore.style.display = 'none';
});

// Menangani pengiriman Form A (Sebelum)
formBefore.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => data[key] = value);

    data['reporter_name'] = document.getElementById('reporter-name').value;
    data['reporter_whatsapp'] = document.getElementById('reporter-whatsapp').value;
    data['reporter_school'] = document.getElementById('reporter-school').value;
    data['report_type'] = 'Sebelum';

    console.log("Data Form A (Sebelum) yang akan dikirim:", data);
    alert('Form A berhasil dikirim!');
    // Lanjutkan dengan pengiriman data ke backend
});

// Menangani pengiriman Form B (Sesudah)
formAfter.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    data['reporter_name'] = document.getElementById('reporter-name').value;
    data['reporter_whatsapp'] = document.getElementById('reporter-whatsapp').value;
    data['reporter_school'] = document.getElementById('reporter-school').value;
    data['report_type'] = 'Sesudah';

    console.log("Data Form B (Sesudah) yang akan dikirim:", data);
    alert('Form B berhasil dikirim!');
    // Lanjutkan dengan pengiriman data ke backend
});

// Contoh fungsi untuk mengisi dropdown sekolah (membutuhkan data dari backend)
async function fetchSchools() {
    // Contoh data dari JSON/API
    const schools = [
        { id: 1, name: "SDN 1 Semarang" },
        { id: 2, name: "SDN 2 Semarang" },
        { id: 3, name: "SDN 3 Semarang" }
    ];

    const selectElement = document.getElementById('reporter-school');
    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school.id;
        option.textContent = school.name;
        selectElement.appendChild(option);
    });
}