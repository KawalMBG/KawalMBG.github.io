// Konfigurasi Google Client ID Anda
// Ganti ini dengan ID klien Anda yang sebenarnya dari Google Cloud Console
const GOOGLE_CLIENT_ID = '368211286575-49heor3jndm49qvkjv710btp422deia9.apps.googleusercontent.com';

function handleCredentialResponse(response) {
    // Tangani token kredensial yang dikembalikan oleh Google
    const credential = response.credential;
    console.log("Token ID Google: " + credential);
    
    // Decode JWT token untuk mendapatkan data pengguna
    const payload = decodeJwtResponse(credential);
    console.log("Data Pengguna:", payload);

    // Tampilkan formulir dan sembunyikan tombol login
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('report-form-section').style.display = 'block';

    // Tampilkan nama pengguna di formulir
    document.getElementById('user-info').textContent = `Selamat datang, ${payload.name}`;

    // Anda bisa menyimpan email atau data lain jika perlu
    // localStorage.setItem('userEmail', payload.email);
}

// Fungsi helper untuk decode JWT
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
    
    // Render tombol login
    google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: "outline", size: "large", type: "standard" }
    );
};

// Logika untuk menangani pengiriman formulir
document.getElementById('report-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah form untuk refresh halaman

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    // Tambahkan data pengguna dari payload JWT
    // Anda bisa menyimpannya di localStorage setelah login untuk digunakan di sini
    // data['reporter_email'] = localStorage.getItem('userEmail');

    // Di sini adalah bagian di mana Anda akan mengirim data 'data' ke backend API
    console.log("Data yang akan dikirim:", data);
    alert('Formulir berhasil dikirim! Data akan diproses.');

    // Contoh: Kirim data ke Google Apps Script atau serverless function
    // fetch('URL_API_BACKEND_ANDA', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(data),
    // })
    // .then(response => response.json())
    // .then(result => {
    //     console.log('Sukses:', result);
    //     alert('Laporan Anda berhasil dikirim!');
    //     this.reset();
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    //     alert('Terjadi kesalahan saat mengirim laporan.');
    // });
});
