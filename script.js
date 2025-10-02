// ==================== KONFIGURASI ====================
// GANTI DENGAN ID DAN URL ANDA SENDIRI
const GOOGLE_CLIENT_ID = '281913559817-4do52jugpe16jh74s3otp3o1vhugo06s.apps.googleusercontent.com';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzNCxnpRl2gmSK0vkvJ1VeJQODsea8IR9eyVRpWDYx0yf87sLDYfYi0RfnxJOs7Vh5/exec'; // Deploy Google Apps Script sebagai Web App


const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/// GANTI DENGAN:
let allSchools = []; // Array untuk menyimpan semua data sekolah dari JSON
let filteredSchools = []; // Array untuk sekolah yang sudah difilter berdasarkan lokasi

// ==================== FUNGSI LOAD DATA DARI JSON ====================
async function loadSchoolData() {
    try {
        const response = await fetch('list_sekolah.json');
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            allSchools = data.data;
            console.log(`Loaded ${allSchools.length} schools from JSON`);
        } else {
            console.error('Invalid JSON format');
            alert('Gagal memuat data sekolah. Format data tidak valid.');
        }
    } catch (error) {
        console.error('Error loading school data:', error);
        alert('Gagal memuat data sekolah. Pastikan file list_sekolah.json ada.');
    }
}

// ==================== FUNGSI FILTER SEKOLAH BERDASARKAN KABUPATEN ====================
function filterSchoolsByLocation(kabupaten) {
    if (!kabupaten) {
        filteredSchools = [];
        return;
    }
    
    // Filter sekolah berdasarkan kabupaten yang dipilih
    filteredSchools = allSchools.filter(school => {
        return school.KABUPATEN === kabupaten;
    });
    
    console.log(`Found ${filteredSchools.length} schools in ${kabupaten}`);
}

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
// ==================== UPDATE WINDOW.ONLOAD ====================
window.onload = async function() {
    // Load data sekolah dari JSON terlebih dahulu
    await loadSchoolData();
    
    // Inisialisasi Google Sign-In
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    
    google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: "outline", size: "large", type: "standard" }
    );
    
    // Event listener untuk dropdown Kabupaten/Kota
    const locationDropdown = document.getElementById('reporter-location');
    const schoolInput = document.getElementById('reporter-school');
    const schoolHint = document.getElementById('school-hint');
    
    locationDropdown.addEventListener('change', function() {
        const selectedLocation = this.value;
        
        if (selectedLocation) {
            // Filter sekolah berdasarkan lokasi
            filterSchoolsByLocation(selectedLocation);
            
            // Enable input sekolah
            schoolInput.disabled = false;
            schoolInput.placeholder = `Ketik nama sekolah di ${selectedLocation}...`;
            schoolInput.value = '';
            document.getElementById('reporter-school-address').value = '';
            
            // Update hint
            schoolHint.textContent = `${filteredSchools.length} sekolah tersedia di ${selectedLocation}`;
            schoolHint.style.color = '#28a745';
            
            // Destroy autocomplete lama jika ada
            if ($("#reporter-school").hasClass('ui-autocomplete-input')) {
                $("#reporter-school").autocomplete('destroy');
            }
            
            // Inisialisasi autocomplete dengan data yang sudah difilter
            $("#reporter-school").autocomplete({
                source: filteredSchools.map(school => school.NAMA),
                minLength: 2,
                select: function(event, ui) {
                    const selectedSchool = filteredSchools.find(school => school.NAMA === ui.item.value);
                    if (selectedSchool) {
                        // Gabungkan alamat lengkap
                        const fullAddress = `${selectedSchool['ALAMAT JALAN']}, ${selectedSchool['DESA KELURAHAN']}, ${selectedSchool.KECAMATAN}, ${selectedSchool.KABUPATEN}`;
                        document.getElementById('reporter-school-address').value = fullAddress;
                    }
                },
                open: function() {
                    $(this).autocomplete('widget').css('z-index', 1000);
                }
            });
            
        } else {
            // Disable input sekolah jika belum pilih lokasi
            schoolInput.disabled = true;
            schoolInput.placeholder = 'Pilih kabupaten/kota terlebih dahulu...';
            schoolInput.value = '';
            document.getElementById('reporter-school-address').value = '';
            schoolHint.textContent = 'Pilih Kabupaten/Kota untuk memuat daftar sekolah';
            schoolHint.style.color = '#666';
            
            // Destroy autocomplete
            if ($("#reporter-school").hasClass('ui-autocomplete-input')) {
                $("#reporter-school").autocomplete('destroy');
            }
        }
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

// Upload file ke Google Drive dengan struktur folder per tanggal
async function uploadFilesToDrive(files, formType) {
    const uploadedLinks = [];
    
    // Buat tanggal laporan dalam format YYYY-MM-DD
    const reportDate = new Date().toISOString().split('T')[0]; // Format: 2025-10-03
    
    // Tentukan nama folder berdasarkan tipe laporan
    const folderName = formType === 'kualitas-makanan' ? 'Aduan Kualitas Makanan' : 'Aduan Gangguan Kesehatan';
    
    for (const file of files) {
        try {
            // Konversi file ke Base64
            const base64Data = await fileToBase64(file);
            
            // Kirim ke Google Apps Script dengan informasi folder
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'uploadFile',
                    fileName: file.name,
                    fileData: base64Data,
                    mimeType: file.type,
                    folderName: folderName,      // Nama folder jenis aduan
                    reportDate: reportDate,       // Tanggal laporan untuk subfolder
                    formType: formType
                })
            });
            
            // Karena no-cors, kita tidak bisa baca response
            // Link akan dibuat di server-side dan dikembalikan via webhook atau log
            // Untuk sementara, simpan info file
            uploadedLinks.push({
                name: file.name,
                size: file.size,
                date: reportDate
            });
            
        } catch (error) {
            console.error('Error uploading file:', file.name, error);
            throw error;
        }
    }
    
    return uploadedLinks;
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

// ==================== TAMBAHKAN 3 FUNGSI INI DI ATAS FORM SUBMIT ====================

function showSuccessAlert() {
    Swal.fire({
        icon: 'success',
        title: 'Laporan Berhasil Dikirim!',
        html: `
            <div style="text-align: left; padding: 20px;">
                <p style="font-size: 16px; margin-bottom: 15px;">
                    <strong>Terima kasih telah melaporkan aduan melalui sistem kami.</strong>
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #666;">
                    Kami akan segera menindaklanjuti laporan Anda dan melakukan koordinasi dengan pihak terkait. 
                    Tim kami akan menghubungi Anda melalui nomor WhatsApp yang terdaftar untuk update perkembangan laporan.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Kembali ke Beranda',
        confirmButtonColor: '#28a745',
        cancelButtonText: 'Buat Laporan Lagi',
        cancelButtonColor: '#6c757d',
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'https://lapor.kawalmbg.org';
        } else {
            window.location.reload();
        }
    });
}

function showErrorAlert(errorMessage) {
    Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        html: `<p>Maaf, terjadi kesalahan saat mengirim laporan.</p>
               <p style="font-size: 12px; color: #666; margin-top: 10px;">${errorMessage}</p>`,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#dc3545'
    });
}

function showLoadingAlert() {
    Swal.fire({
        title: 'Mohon Tunggu...',
        html: 'Sedang mengirim laporan Anda...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// ==================== GANTI FORM SUBMIT KUALITAS MAKANAN ====================
formBefore.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // GANTI bagian loading - HAPUS submitButton.textContent dan disabled
    showLoadingAlert();
    
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
                // GANTI alert dengan SweetAlert
                Swal.fire({
                    icon: 'warning',
                    title: 'Gagal Upload File',
                    text: 'File tidak dapat diupload. Laporan akan dikirim tanpa file.',
                    confirmButtonText: 'Lanjutkan'
                });
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
        
        // GANTI alert dengan SweetAlert
        Swal.close();
        showSuccessAlert();
        
    } catch (error) {
        // GANTI alert dengan SweetAlert
        Swal.close();
        showErrorAlert(error.message);
        console.error('Error:', error);
    }
});

// ==================== GANTI FORM SUBMIT GANGGUAN KESEHATAN ====================
formAfter.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // GANTI bagian loading - HAPUS submitButton.textContent dan disabled
    showLoadingAlert();
    
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
                // GANTI alert dengan SweetAlert
                Swal.fire({
                    icon: 'warning',
                    title: 'Gagal Upload File',
                    text: 'File tidak dapat diupload. Laporan akan dikirim tanpa file.',
                    confirmButtonText: 'Lanjutkan'
                });
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
        
        // GANTI alert dengan SweetAlert
        Swal.close();
        showSuccessAlert();
        
    } catch (error) {
        // GANTI alert dengan SweetAlert
        Swal.close();
        showErrorAlert(error.message);
        console.error('Error:', error);
    }
});