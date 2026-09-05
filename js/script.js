/**
 * QR Generator Pro
 * Script utama untuk fungsionalitas pembuatan QR code
 */

// Tunggu hingga DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ===== Inisialisasi QR Code Library =====
    // Fungsi untuk membuat QR code menggunakan qrcode.js
    let qrCodeInstance = null;

    /**
     * Buat QR Code baru dengan parameter yang ditentukan
     * @param {string} text - Teks yang akan dikodekan
     * @param {Object} options - Opsi QR code (ukuran, warna, dll)
     */
    function generateQRCode(text, options = {}) {
        const defaultOptions = {
            text: text || 'QR Generator Pro',
            width: 300,
            height: 300,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M, // L, M, Q, H
            quietZone: 10,
            quietZoneColor: '#ffffff',
            logo: null,
            logoWidth: 60,
            logoHeight: 60,
            logoBackgroundColor: '#ffffff',
            logoBackgroundTransparent: false
        };
        
        // Gabungkan opsi default dengan opsi yang diberikan
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Hapus instance QR code sebelumnya jika ada
        const qrContainer = document.getElementById('qr-container');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            
            try {
                // Buat instance QR code baru
                qrCodeInstance = new QRCode(qrContainer, {
                    text: mergedOptions.text,
                    width: mergedOptions.width,
                    height: mergedOptions.height,
                    colorDark: mergedOptions.colorDark,
                    colorLight: mergedOptions.colorLight,
                    correctLevel: mergedOptions.correctLevel,
                    quietZone: mergedOptions.quietZone,
                    quietZoneColor: mergedOptions.quietZoneColor,
                });
                
                // Jika ada logo, tambahkan ke QR code
                if (mergedOptions.logo) {
                    addLogoToQRCode(
                        qrCodeInstance, 
                        mergedOptions.logo,
                        mergedOptions.logoWidth,
                        mergedOptions.logoHeight,
                        mergedOptions.logoBackgroundColor,
                        mergedOptions.logoBackgroundTransparent
                    );
                }
                
                // Perbarui tampilan device dan print juga
                updateDevicePreview();
                updatePrintPreview();
                
                // Set status berhasil
                setQRStatus('success', 'QR code berhasil dibuat!');
                
                // Tampilkan notification
                showNotification('QR code berhasil dibuat!', 'success');
                
                // Update analitik QR code
                updateQRCodeAnalytics(mergedOptions.text, mergedOptions.correctLevel);
                
                return true;
            } catch (error) {
                console.error('Error generating QR code:', error);
                setQRStatus('error', 'Gagal membuat QR code: ' + error.message);
                showNotification('Gagal membuat QR code', 'error');
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Tambahkan logo ke QR code yang dibuat
     */
    function addLogoToQRCode(qrInstance, logoUrl, logoWidth, logoHeight, bgColor, transparent) {
        if (!qrInstance) return;
        
        const qrImg = document.querySelector('#qr-container img');
        if (!qrImg) return;
        
        // Tunggu hingga QR code dimuat
        qrImg.onload = function() {
            const logoImg = new Image();
            logoImg.src = logoUrl;
            
            logoImg.onload = function() {
                // Buat canvas untuk menyusun QR code dan logo
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Set ukuran canvas
                canvas.width = qrImg.width;
                canvas.height = qrImg.height;
                
                // Gambar QR code pada canvas
                context.drawImage(qrImg, 0, 0, canvas.width, canvas.height);
                
                // Hitung posisi logo (tengah)
                const logoX = (canvas.width - logoWidth) / 2;
                const logoY = (canvas.height - logoHeight) / 2;
                
                // Jika background tidak transparan, gambar background logo
                if (!transparent) {
                    context.fillStyle = bgColor;
                    context.fillRect(logoX - 5, logoY - 5, logoWidth + 10, logoHeight + 10);
                }
                
                // Gambar logo
                context.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
                
                // Ganti QR code dengan versi yang ada logonya
                qrImg.src = canvas.toDataURL('image/png');
                
                // Update preview lainnya
                updateDevicePreview();
                updatePrintPreview();
            };
            
            logoImg.onerror = function() {
                console.error('Error loading logo image');
                showNotification('Error memuat gambar logo', 'error');
            };
        };
    }
    
    /**
     * Perbarui preview QR code pada device preview
     */
    function updateDevicePreview() {
        const qrImg = document.querySelector('#qr-container img');
        const deviceContainer = document.getElementById('qr-container-device');
        
        if (qrImg && deviceContainer) {
            deviceContainer.innerHTML = '';
            const clonedImg = qrImg.cloneNode(true);
            deviceContainer.appendChild(clonedImg);
        }
    }
    
    /**
     * Perbarui preview QR code pada print preview
     */
    function updatePrintPreview() {
        const qrImg = document.querySelector('#qr-container img');
        const printContainer = document.getElementById('qr-container-print');
        
        if (qrImg && printContainer) {
            printContainer.innerHTML = '';
            const clonedImg = qrImg.cloneNode(true);
            clonedImg.style.width = '100%';
            clonedImg.style.height = 'auto';
            printContainer.appendChild(clonedImg);
        }
    }
    
    /**
     * Update analitik QR code
     */
    function updateQRCodeAnalytics(text, errorCorrectionLevel) {
        // Hitung kualitas QR code
        let readability = 0;
        let compatibility = 0;
        let sizeEfficiency = 0;
        
        // Readability berdasarkan ukuran teks dan level koreksi kesalahan
        if (text.length < 50) {
            readability = 90;
        } else if (text.length < 150) {
            readability = 75;
        } else if (text.length < 500) {
            readability = 60;
        } else {
            readability = 45;
        }
        
        // Tambah nilai readability berdasarkan level koreksi
        switch(errorCorrectionLevel) {
            case QRCode.CorrectLevel.L: readability += 0; break;
            case QRCode.CorrectLevel.M: readability += 5; break;
            case QRCode.CorrectLevel.Q: readability += 10; break;
            case QRCode.CorrectLevel.H: readability += 15; break;
        }
        
        // Pastikan nilai maksimal 100
        readability = Math.min(readability, 100);
        
        // Compatibility selalu lebih tinggi untuk QR code standar
        compatibility = 95;
        
        // Size efficiency kebalikan dari ukuran teks
        if (text.length < 50) {
            sizeEfficiency = 95;
        } else if (text.length < 150) {
            sizeEfficiency = 85;
        } else if (text.length < 500) {
            sizeEfficiency = 70;
        } else {
            sizeEfficiency = 50;
        }
        
        // Update UI metrik
        const metricItems = document.querySelectorAll('.metric-item');
        if (metricItems.length >= 3) {
            // Update Readability
            metricItems[0].querySelector('.gauge-fill').style.width = readability + '%';
            metricItems[0].querySelector('.metric-value').textContent = readability + '%';
            
            // Update Compatibility
            metricItems[1].querySelector('.gauge-fill').style.width = compatibility + '%';
            metricItems[1].querySelector('.metric-value').textContent = compatibility + '%';
            
            // Update Size Efficiency
            metricItems[2].querySelector('.gauge-fill').style.width = sizeEfficiency + '%';
            metricItems[2].querySelector('.metric-value').textContent = sizeEfficiency + '%';
        }
    }
    
    /**
     * Set status QR code
     * @param {string} status - Status (success, error, warning, info)
     * @param {string} message - Pesan status
     */
    function setQRStatus(status, message) {
        const statusIndicator = document.getElementById('qr-status-indicator');
        const statusMessage = document.getElementById('qr-status-message');
        
        if (statusIndicator && statusMessage) {
            // Reset kelas status
            statusIndicator.className = 'status-indicator';
            statusIndicator.classList.add('status-' + status);
            
            // Set pesan
            statusMessage.textContent = message;
        }
    }
    
    /**
     * Tampilkan notifikasi
     * @param {string} message - Pesan notifikasi
     * @param {string} type - Tipe notifikasi (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        const notificationBar = document.getElementById('notification-bar');
        const notificationText = document.getElementById('notification-text');
        
        if (notificationBar && notificationText) {
            // Reset kelas notifikasi
            notificationBar.className = 'notification-bar';
            notificationBar.classList.add('notification-' + type);
            
            // Set pesan
            notificationText.textContent = message;
            
            // Tampilkan notifikasi
            notificationBar.style.display = 'flex';
            
            // Hide setelah 5 detik
            setTimeout(() => {
                notificationBar.style.display = 'none';
            }, 5000);
        }
    }
    
    // ===== Tab Navigation =====
    // Handle tab navigation untuk jenis QR code
    function initTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding content
                const tabId = this.getAttribute('data-tab');
                const contentId = tabId + '-content';
                const content = document.getElementById(contentId);
                
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }
    
    // ===== Accordion =====
    // Handle accordion untuk opsi desain
    function initAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                // Toggle active class
                this.classList.toggle('active');
                
                // Toggle content visibility
                const content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }
    
    // ===== Preview Mode Toggle =====
    // Handle toggle antara mode preview
    function initPreviewModeToggle() {
        const previewButtons = document.querySelectorAll('.preview-mode-btn');
        const previewDivs = document.querySelectorAll('.qr-preview');
        
        previewButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                previewButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Hide all preview divs
                previewDivs.forEach(div => div.style.display = 'none');
                
                // Show corresponding preview
                const mode = this.getAttribute('data-mode');
                const previewDiv = document.getElementById('qr-preview-' + mode);
                
                if (previewDiv) {
                    previewDiv.style.display = 'block';
                }
            });
        });
    }
    
    // ===== Generate QR Code =====
    // Handle tombol generate QR code
    function initGenerateButton() {
        const generateBtn = document.getElementById('generate-qr-btn');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', function() {
                // Show loading
                const loadingSpinner = document.querySelector('.qr-loading-spinner');
                if (loadingSpinner) {
                    loadingSpinner.style.display = 'flex';
                }
                
                // Ambil data dari form aktif
                const activeTab = document.querySelector('.tab-button.active');
                if (!activeTab) {
                    showNotification('Pilih jenis QR code terlebih dahulu', 'error');
                    return;
                }
                
                const tabId = activeTab.getAttribute('data-tab');
                let qrText = '';
                
                // Ambil data berdasarkan jenis QR code
                switch(tabId) {
                    case 'qr-standard':
                        qrText = document.getElementById('standard-content').value || 'QR Generator Pro';
                        break;
                        
                    case 'qr-qris':
                        const merchantId = document.getElementById('qris-merchant-id').value;
                        const merchantName = document.getElementById('qris-merchant-name').value;
                        const amount = document.getElementById('qris-amount').value;
                        const qrisType = document.getElementById('qris-type').value;
                        
                        if (!merchantId || !merchantName) {
                            showNotification('ID Merchant dan Nama Merchant wajib diisi untuk QRIS', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        // Format QRIS (simplified for demo)
                        qrText = `00020101021226${merchantId}0215${merchantName}5204${amount}`;
                        break;
                        
                    case 'qr-url':
                        const url = document.getElementById('url-input').value;
                        const tracking = document.getElementById('url-tracking').value;
                        
                        if (!url) {
                            showNotification('URL wajib diisi', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        qrText = tracking ? `${url}?${tracking}` : url;
                        break;
                        
                    case 'qr-text':
                        qrText = document.getElementById('text-input').value;
                        
                        if (!qrText) {
                            showNotification('Teks wajib diisi', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        break;
                        
                    case 'qr-vcard':
                        const firstName = document.getElementById('vcard-firstname').value;
                        const lastName = document.getElementById('vcard-lastname').value;
                        const organization = document.getElementById('vcard-organization').value;
                        const phone = document.getElementById('vcard-phone').value;
                        const email = document.getElementById('vcard-email').value;
                        
                        if (!firstName || !phone) {
                            showNotification('Nama depan dan nomor telepon wajib diisi untuk vCard', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        // Format vCard
                        qrText = `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName}\nORG:${organization}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
                        break;
                        
                    case 'qr-wifi':
                        const ssid = document.getElementById('wifi-ssid').value;
                        const password = document.getElementById('wifi-password').value;
                        const encryption = document.getElementById('wifi-encryption').value;
                        const hidden = document.getElementById('wifi-hidden').checked;
                        
                        if (!ssid) {
                            showNotification('Nama WiFi (SSID) wajib diisi', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        // Format WiFi
                        qrText = `WIFI:S:${ssid};T:${encryption};P:${password};H:${hidden ? 'true' : 'false'};;`;
                        break;
                        
                    case 'qr-email':
                        const emailAddress = document.getElementById('email-address').value;
                        const subject = document.getElementById('email-subject').value;
                        const body = document.getElementById('email-body').value;
                        
                        if (!emailAddress) {
                            showNotification('Alamat email wajib diisi', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        // Format Email
                        qrText = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        break;
                        
                    case 'qr-sms':
                        const smsPhone = document.getElementById('sms-phone').value;
                        const smsMessage = document.getElementById('sms-message').value;
                        
                        if (!smsPhone) {
                            showNotification('Nomor telepon wajib diisi untuk SMS', 'error');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        
                        // Format SMS
                        qrText = `smsto:${smsPhone}:${smsMessage}`;
                        break;
                        
                    case 'qr-location':
                        const locMethod = document.getElementById('location-method').value;
                        let latitude, longitude;
                        
                        if (locMethod === 'coordinates') {
                            latitude = document.getElementById('location-latitude').value;
                            longitude = document.getElementById('location-longitude').value;
                            
                            if (!latitude || !longitude) {
                                showNotification('Latitude dan Longitude wajib diisi', 'error');
                                if (loadingSpinner) loadingSpinner.style.display = 'none';
                                return;
                            }
                            
                            // Format Geo
                            qrText = `geo:${latitude},${longitude}`;
                        } else {
                            showNotification('Fitur lokasi lainnya memerlukan geolocation API', 'warning');
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            return;
                        }
                        break;
                        
                    default:
                        qrText = 'QR Generator Pro - https://qrgeneratorpro.com';
                }
                
                // Ambil opsi desain
                const size = parseInt(document.getElementById('qr-size').value) || 300;
                const foregroundColor = document.getElementById('qr-foreground').value || '#000000';
                const backgroundColor = document.getElementById('qr-background').value || '#FFFFFF';
                const correctLevel = document.getElementById('qr-correction').value || 'M';
                
                // Map level koreksi ke nilai QRCode library
                let correctLevelValue;
                switch (correctLevel) {
                    case 'L': correctLevelValue = QRCode.CorrectLevel.L; break;
                    case 'M': correctLevelValue = QRCode.CorrectLevel.M; break;
                    case 'Q': correctLevelValue = QRCode.CorrectLevel.Q; break;
                    case 'H': correctLevelValue = QRCode.CorrectLevel.H; break;
                    default:  correctLevelValue = QRCode.CorrectLevel.M;
                }
                
                // Opsi logo jika ada
                const logoOptions = {};
                const logoPreviewContainer = document.getElementById('logo-preview-container');
                
                if (logoPreviewContainer && logoPreviewContainer.style.display !== 'none') {
                    const logoPreview = document.getElementById('logo-preview');
                    if (logoPreview && logoPreview.src) {
                        logoOptions.logo = logoPreview.src;
                        logoOptions.logoWidth = size * (parseInt(document.getElementById('qr-logo-size').value) / 100) || 60;
                        logoOptions.logoHeight = logoOptions.logoWidth;
                        logoOptions.logoBackgroundColor = document.getElementById('qr-logo-background').value || '#FFFFFF';
                        logoOptions.logoBackgroundTransparent = document.getElementById('qr-logo-shape').value === 'circle';
                    }
                }
                
                // Generate QR code dengan opsi yang dikumpulkan
                setTimeout(() => { // Simulasi delay (untuk demo)
                    const options = {
                        text: qrText,
                        width: size,
                        height: size,
                        colorDark: foregroundColor,
                        colorLight: backgroundColor,
                        correctLevel: correctLevelValue,
                        ...logoOptions
                    };
                    
                    const success = generateQRCode(qrText, options);
                    
                    // Sembunyikan loading
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'none';
                    }
                    
                    // Perbarui URL berbagi jika berhasil
                    if (success) {
                        const shareUrl = document.getElementById('share-url');
                        if (shareUrl) {
                            shareUrl.value = `https://qrgeneratorpro.com/share?data=${encodeURIComponent(qrText)}&color=${encodeURIComponent(foregroundColor)}&bg=${encodeURIComponent(backgroundColor)}`;
                        }
                    }
                }, 500);
            });
        }
    }
    
    // ===== Logo Upload =====
    // Handle upload logo
    function initLogoUpload() {
        const logoUpload = document.getElementById('qr-logo-upload');
        const logoPreviewContainer = document.getElementById('logo-preview-container');
        const logoPreview = document.getElementById('logo-preview');
        const removeLogoBtn = document.getElementById('remove-logo');
        
        if (logoUpload && logoPreviewContainer && logoPreview && removeLogoBtn) {
            logoUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                
                if (file) {
                    // Validasi jenis file
                    if (!file.type.match('image.*')) {
                        showNotification('File harus berupa gambar (JPG, PNG, GIF)', 'error');
                        return;
                    }
                    
                    // Validasi ukuran file (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                        showNotification('Ukuran gambar maksimal 2MB', 'error');
                        return;
                    }
                    
                    // Baca file sebagai data URL
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        logoPreview.src = e.target.result;
                        logoPreviewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // Remove logo
            removeLogoBtn.addEventListener('click', function() {
                logoPreview.src = '';
                logoPreviewContainer.style.display = 'none';
                logoUpload.value = '';
            });
        }
    }
    
    // ===== Color Pickers =====
    // Handle input warna dan sinkronisasi dengan input teks hex
    function initColorPickers() {
        const colorInputs = document.querySelectorAll('input[type="color"]');
        
        colorInputs.forEach(input => {
            const hexInput = document.getElementById(input.id + '-hex');
            
            if (hexInput) {
                // Update hex input ketika warna berubah
                input.addEventListener('input', function() {
                    hexInput.value = input.value;
                });
                
                // Update color input ketika hex berubah
                hexInput.addEventListener('input', function() {
                    // Validasi format hex
                    if (/^#[0-9A-F]{6}$/i.test(hexInput.value)) {
                        input.value = hexInput.value;
                    }
                });
            }
        });
    }
    
    // ===== Range Sliders =====
    // Handle slider dan update nilai yang ditampilkan
    function initRangeSliders() {
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        
        rangeInputs.forEach(input => {
            const valueSpan = document.getElementById(input.id + '-value');
            
            if (valueSpan) {
                // Update nilai yang ditampilkan saat slider bergerak
                input.addEventListener('input', function() {
                    switch (input.id) {
                        case 'qr-size':
                            valueSpan.textContent = input.value + ' x ' + input.value + ' px';
                            break;
                        case 'qr-padding':
                        case 'qr-border-width':
                            valueSpan.textContent = input.value + 'px';
                            break;
                        case 'qr-logo-size':
                            valueSpan.textContent = input.value + '%';
                            break;
                        case 'qr-animation-speed':
                            const speeds = ['Very Slow', 'Slow', 'Medium Slow', 'Medium', 'Medium Fast', 'Fast', 'Very Fast', 'Ultra Fast', 'Extreme', 'Instant'];
                            valueSpan.textContent = speeds[Math.min(parseInt(input.value) - 1, speeds.length - 1)];
                            break;
                        default:
                            valueSpan.textContent = input.value;
                    }
                });
                
                // Set nilai awal
                input.dispatchEvent(new Event('input'));
            }
        });
    }
    
    // ===== Modal Control =====
    // Handle modal open/close
    function initModals() {
        const modalTriggers = document.querySelectorAll('.modal-trigger');
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        const modalCloseBtns = document.querySelectorAll('.modal-close-btn');
        
        // Buka modal
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                
                const modalId = this.getAttribute('data-modal-id');
                const modal = document.getElementById(modalId);
                
                if (modal) {
                    modal.style.display = 'block';
                }
            });
        });
        
        // Tutup modal dengan overlay
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', function() {
                const modal = this.closest('.modal-container');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Tutup modal dengan tombol close
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal-container');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    // ===== Notification Control =====
    // Handle close notification
    function initNotifications() {
        const notificationCloseBtn = document.getElementById('notification-close');
        
        if (notificationCloseBtn) {
            notificationCloseBtn.addEventListener('click', function() {
                const notificationBar = document.getElementById('notification-bar');
                if (notificationBar) {
                    notificationBar.style.display = 'none';
                }
            });
        }
    }
    
    // ===== Template Filtering =====
    // Handle filter dan pencarian template
    function initTemplateFilters() {
        const filterButtons = document.querySelectorAll('.templates-filter .filter-btn');
        const templateCards = document.querySelectorAll('.template-card');
        const templateSearch = document.getElementById('template-search');
        const templateSearchBtn = document.getElementById('template-search-btn');
        
        // Filter berdasarkan kategori
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Filter cards
                const filter = this.getAttribute('data-filter');
                
                templateCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const categories = card.getAttribute('data-category').split(' ');
                        if (categories.includes(filter)) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
        
        // Pencarian template
        if (templateSearch && templateSearchBtn) {
            templateSearchBtn.addEventListener('click', searchTemplates);
            templateSearch.addEventListener('keyup', function(e) {if (e.key === 'Enter') {
                searchTemplates();
            }
        });
        
        function searchTemplates() {
            const searchTerm = templateSearch.value.toLowerCase();
            
            templateCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const categories = card.getAttribute('data-category').split(' ');
                
                // Cari berdasarkan judul, deskripsi, atau kategori
                if (title.includes(searchTerm) || 
                    description.includes(searchTerm) || 
                    categories.some(cat => cat.includes(searchTerm))) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    // Handle tombol template
    const useTemplateButtons = document.querySelectorAll('.use-template-btn');
    const previewTemplateButtons = document.querySelectorAll('.preview-template-btn');
    
    // Gunakan template
    useTemplateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateId = this.getAttribute('data-template-id');
            applyTemplate(templateId);
        });
    });
    
    // Preview template
    previewTemplateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateId = this.getAttribute('data-template-id');
            previewTemplate(templateId);
        });
    });
}

/**
 * Terapkan template yang dipilih
 * @param {string} templateId - ID template yang dipilih
 */
function applyTemplate(templateId) {
    // Reset form
    resetForm();
    
    // Terapkan template berdasarkan ID
    switch(templateId) {
        case 'qris-payment':
            // Pilih tab QRIS
            selectTab('qr-qris');
            
            // Set nilai default untuk QRIS
            document.getElementById('qris-merchant-name').value = 'TOKO SAMPLE';
            document.getElementById('qris-merchant-id').value = '123456789012';
            document.getElementById('qris-provider').value = 'general';
            
            // Set design QR
            document.getElementById('qr-foreground').value = '#0066CC';
            document.getElementById('qr-foreground-hex').value = '#0066CC';
            document.getElementById('qr-correction').value = 'H';
            
            showNotification('Template QRIS Payment telah diterapkan', 'success');
            break;
            
        case 'business-card':
            // Pilih tab vCard
            selectTab('qr-vcard');
            
            // Set nilai default untuk vCard
            document.getElementById('vcard-firstname').value = 'Budi';
            document.getElementById('vcard-lastname').value = 'Santoso';
            document.getElementById('vcard-organization').value = 'PT Sukses Mandiri';
            document.getElementById('vcard-title').value = 'Marketing Manager';
            document.getElementById('vcard-phone').value = '+6281234567890';
            document.getElementById('vcard-email').value = 'budi@example.com';
            document.getElementById('vcard-website').value = 'https://example.com';
            
            // Set design QR
            document.getElementById('qr-foreground').value = '#333333';
            document.getElementById('qr-foreground-hex').value = '#333333';
            document.getElementById('qr-style').value = 'classy';
            document.getElementById('qr-correction').value = 'H';
            
            showNotification('Template Business Card telah diterapkan', 'success');
            break;
            
        case 'instagram':
            // Pilih tab URL
            selectTab('qr-url');
            
            // Set nilai default untuk URL Instagram
            document.getElementById('url-input').value = 'https://instagram.com/yourusername';
            document.getElementById('url-tracking').value = 'source=qrcode';
            
            // Set design QR dengan warna khas Instagram
            document.getElementById('qr-foreground').value = '#E1306C';
            document.getElementById('qr-foreground-hex').value = '#E1306C';
            document.getElementById('qr-style').value = 'dots';
            
            showNotification('Template Instagram Profile telah diterapkan', 'success');
            break;
            
        case 'wifi':
            // Pilih tab WiFi
            selectTab('qr-wifi');
            
            // Set nilai default untuk WiFi
            document.getElementById('wifi-ssid').value = 'MyWiFiNetwork';
            document.getElementById('wifi-encryption').value = 'WPA';
            
            // Set design QR
            document.getElementById('qr-foreground').value = '#00994C';
            document.getElementById('qr-foreground-hex').value = '#00994C';
            document.getElementById('qr-style').value = 'rounded';
            
            showNotification('Template WiFi Connect telah diterapkan', 'success');
            break;
            
        case 'event':
            // Pilih tab more (karena event tidak langsung tersedia)
            selectTab('qr-more');
            
            // Nilai untuk event akan ditambahkan ketika implementasi event selesai
            showNotification('Template Event akan segera tersedia', 'info');
            break;
            
        default:
            showNotification('Template tidak ditemukan', 'error');
    }
}

/**
 * Tampilkan preview template di modal
 * @param {string} templateId - ID template yang dipilih
 */
function previewTemplate(templateId) {
    const modalTemplatePreview = document.getElementById('modal-template-preview');
    const modalTemplateName = document.getElementById('modal-template-name');
    const modalTemplateDescription = document.getElementById('modal-template-description');
    const modalTemplateFeatures = document.getElementById('modal-template-features');
    const modalUseTemplateBtn = document.getElementById('modal-use-template-btn');
    
    if (modalTemplatePreview && modalTemplateName && modalTemplateDescription && modalTemplateFeatures && modalUseTemplateBtn) {
        // Atur konten modal berdasarkan template
        switch(templateId) {
            case 'qris-payment':
                modalTemplatePreview.src = 'template-qris-payment.png';
                modalTemplateName.textContent = 'QRIS Payment';
                modalTemplateDescription.textContent = 'Template untuk pembayaran QRIS dengan logo dan instruksi yang jelas untuk pembeli.';
                modalTemplateFeatures.innerHTML = `
                    <li>Format QRIS standar BI</li>
                    <li>Desain yang menarik untuk merchant</li>
                    <li>Area logo yang optimal</li>
                    <li>Instruksi pembayaran jelas</li>
                `;
                break;
                
            case 'business-card':
                modalTemplatePreview.src = 'template-business-card.png';
                modalTemplateName.textContent = 'Business Card';
                modalTemplateDescription.textContent = 'Template untuk kartu nama digital dengan info kontak lengkap.';
                modalTemplateFeatures.innerHTML = `
                    <li>Format vCard standar</li>
                    <li>Mencakup semua info kontak penting</li>
                    <li>Desain profesional</li>
                    <li>Mudah disimpan ke kontak</li>
                `;
                break;
                
            case 'instagram':
                modalTemplatePreview.src = 'template-instagram.png';
                modalTemplateName.textContent = 'Instagram Profile';
                modalTemplateDescription.textContent = 'Template untuk profil Instagram dengan branding khas platform.';
                modalTemplateFeatures.innerHTML = `
                    <li>Warna khas Instagram</li>
                    <li>Tracking parameter untuk analitik</li>
                    <li>Desain yang menarik</li>
                    <li>Optimal untuk media sosial</li>
                `;
                break;
                
            case 'wifi':
                modalTemplatePreview.src = 'template-wifi.png';
                modalTemplateName.textContent = 'WiFi Connect';
                modalTemplateDescription.textContent = 'Template untuk memudahkan koneksi ke jaringan WiFi.';
                modalTemplateFeatures.innerHTML = `
                    <li>Terhubung otomatis ke WiFi</li>
                    <li>Mendukung semua tipe enkripsi</li>
                    <li>Bekerja di semua smartphone</li>
                    <li>Tidak perlu input password manual</li>
                `;
                break;
                
            case 'event':
                modalTemplatePreview.src = 'template-event.png';
                modalTemplateName.textContent = 'Event RSVP';
                modalTemplateDescription.textContent = 'Template untuk membagikan detail acara dan RSVP.';
                modalTemplateFeatures.innerHTML = `
                    <li>Info acara langsung ke kalender</li>
                    <li>Format waktu & lokasi standar</li>
                    <li>Link RSVP otomatis</li>
                    <li>Optimal untuk undangan digital</li>
                `;
                break;
                
            default:
                modalTemplatePreview.src = 'template-default.png';
                modalTemplateName.textContent = 'Template Tidak Ditemukan';
                modalTemplateDescription.textContent = 'Detail template tidak tersedia.';
                modalTemplateFeatures.innerHTML = '<li>Fitur tidak tersedia</li>';
        }
        
        // Set event listener untuk tombol use template di modal
        modalUseTemplateBtn.onclick = function() {
            // Tutup modal
            document.getElementById('template-preview-modal').style.display = 'none';
            
            // Terapkan template
            applyTemplate(templateId);
        };
    }
}

/**
 * Pilih tab berdasarkan ID
 * @param {string} tabId - ID tab yang akan dipilih
 */
function selectTab(tabId) {
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    
    if (tabButton) {
        tabButton.click();
    }
}

/**
 * Reset form ke nilai default
 */
function resetForm() {
    // Reset semua input teks
    const textInputs = document.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], input[type="tel"], input[type="number"], textarea');
    textInputs.forEach(input => {
        input.value = '';
    });
    
    // Reset color pickers ke default
    document.getElementById('qr-foreground').value = '#000000';
    document.getElementById('qr-foreground-hex').value = '#000000';
    document.getElementById('qr-background').value = '#FFFFFF';
    document.getElementById('qr-background-hex').value = '#FFFFFF';
    
    // Reset selects ke default
    document.getElementById('qr-correction').value = 'M';
    document.getElementById('qr-style').value = 'square';
    
    // Reset logo jika ada
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    if (logoPreviewContainer) {
        logoPreviewContainer.style.display = 'none';
    }
    const logoUpload = document.getElementById('qr-logo-upload');
    if (logoUpload) {
        logoUpload.value = '';
    }
}

// ===== Tutorial Tabs =====
// Handle tab tutorial
function initTutorialTabs() {
    const tutorialTabs = document.querySelectorAll('.tutorial-tab');
    const tutorialPanels = document.querySelectorAll('.tutorial-panel');
    
    tutorialTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tutorialTabs.forEach(t => t.classList.remove('active'));
            tutorialPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding panel
            const tutorialId = this.getAttribute('data-tutorial');
            const panel = document.getElementById('tutorial-' + tutorialId);
            
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
    
    // Load tutorial button
    const loadTutorialButtons = document.querySelectorAll('.load-tutorial-btn');
    
    loadTutorialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tutorialId = this.getAttribute('data-tutorial');
            loadTutorialContent(tutorialId);
        });
    });
}

/**
 * Muat konten tutorial
 * @param {string} tutorialId - ID tutorial yang akan dimuat
 */
function loadTutorialContent(tutorialId) {
    const button = document.querySelector(`.load-tutorial-btn[data-tutorial="${tutorialId}"]`);
    
    if (button) {
        // Ganti teks button dengan loading
        const originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        
        // Simulasi loading (dalam aplikasi nyata, ini akan memanggil API)
        setTimeout(() => {
            let content = '';
            
            switch(tutorialId) {
                case 'basics':
                    content = `
                        <div class="tutorial-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Apa itu QR Code?</h4>
                                <p>QR Code (Quick Response Code) adalah kode matriks dua dimensi yang dapat menyimpan berbagai jenis informasi seperti teks, URL, dan data lainnya.</p>
                                <img src="tutorial-basics-1.png" alt="Penjelasan QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Bagaimana Cara Kerjanya?</h4>
                                <p>QR code terdiri dari modul hitam yang diatur dalam pola persegi pada latar belakang putih. Saat dipindai, aplikasi QR scanner membaca pola ini untuk mengekstrak data yang disimpan.</p>
                                <img src="tutorial-basics-2.png" alt="Cara Kerja QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Jenis-jenis QR Code</h4>
                                <p>Ada berbagai jenis QR code untuk kebutuhan berbeda, seperti URL, teks, vCard (kontak), WiFi, email, SMS, lokasi, dan banyak lagi.</p>
                                <img src="tutorial-basics-3.png" alt="Jenis QR Code" class="tutorial-image">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'design':
                    content = `
                        <div class="tutorial-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Warna dan Kontras</h4>
                                <p>Pilih warna dengan kontras tinggi untuk memastikan QR code dapat dipindai dengan baik. Modul gelap pada latar belakang terang adalah yang terbaik.</p>
                                <img src="tutorial-design-1.png" alt="Warna QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Menambahkan Logo</h4>
                                <p>Anda dapat menambahkan logo ke tengah QR code untuk branding. Pastikan gunakan level koreksi kesalahan tinggi (Q atau H) dan logo tidak menutupi lebih dari 25% area QR code.</p>
                                <img src="tutorial-design-2.png" alt="Logo QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Bentuk dan Gaya</h4>
                                <p>QR code dapat disesuaikan dengan berbagai bentuk dan gaya seperti dots, rounded, atau classy, selama masih mempertahankan kemampuan untuk dipindai.</p>
                                <img src="tutorial-design-3.png" alt="Gaya QR Code" class="tutorial-image">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'advanced':
                    content = `
                        <div class="tutorial-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Level Koreksi Kesalahan</h4>
                                <p>QR code memiliki empat level koreksi kesalahan: L (7%), M (15%), Q (25%), dan H (30%). Level yang lebih tinggi memungkinkan QR code tetap berfungsi meskipun sebagian rusak atau terhalang.</p>
                                <img src="tutorial-advanced-1.png" alt="Level Koreksi QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Versi dan Kapasitas</h4>
                                <p>QR code memiliki 40 versi berbeda (1-40), dengan kapasitas data yang semakin meningkat. Versi yang lebih tinggi menghasilkan QR code yang lebih besar dengan lebih banyak modul.</p>
                                <img src="tutorial-advanced-2.png" alt="Versi QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>QR Code Dinamis</h4>
                                <p>QR code dinamis memungkinkan Anda mengubah konten yang terhubung tanpa perlu membuat QR code baru. Ini berguna untuk kampanye marketing atau konten yang sering diperbarui.</p>
                                <img src="tutorial-advanced-3.png" alt="QR Code Dinamis" class="tutorial-image">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'usage':
                    content = `
                        <div class="tutorial-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Persiapan Cetakan</h4>
                                <p>Saat mencetak QR code, pastikan ukurannya minimal 2 x 2 cm dan gunakan resolusi tinggi (300 DPI) untuk hasil terbaik.</p>
                                <img src="tutorial-usage-1.png" alt="Persiapan Cetak QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Tempat Memasang QR Code</h4>
                                <p>Pasang QR code di tempat yang mudah diakses dan memiliki pencahayaan cukup. Hindari permukaan reflektif atau bergelombang.</p>
                                <img src="tutorial-usage-2.png" alt="Penempatan QR Code" class="tutorial-image">
                            </div>
                        </div>
                        
                        <div class="tutorial-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Tracking dan Analitik</h4>
                                <p>Gunakan QR code dengan fitur tracking untuk menganalisis jumlah pemindaian, lokasi, dan waktu. Ini membantu mengukur keberhasilan kampanye marketing.</p>
                                <img src="tutorial-usage-3.png" alt="Analitik QR Code" class="tutorial-image">
                            </div>
                        </div>
                    `;
                    break;
                    
                default:
                    content = '<p>Konten tutorial tidak tersedia.</p>';
            }
            
            // Tambahkan konten ke panel
            const panel = document.getElementById('tutorial-' + tutorialId);
            
            if (panel) {
                const contentInner = panel.querySelector('.tutorial-content-inner');
                
                if (contentInner) {
                    // Hapus tombol load
                    button.remove();
                    
                    // Tambahkan konten tutorial
                    const newContent = document.createElement('div');
                    newContent.className = 'tutorial-steps';
                    newContent.innerHTML = content;
                    
                    contentInner.appendChild(newContent);
                }
            }
        }, 1000);
    }
}

// ===== Download Button =====
// Handle tombol download
function initDownloadButton() {
    const downloadConfirmBtn = document.getElementById('download-confirm');
    
    if (downloadConfirmBtn) {
        downloadConfirmBtn.addEventListener('click', function() {
            // Dapatkan format dan kualitas yang dipilih
            const formatInputs = document.querySelectorAll('input[name="download-format"]');
            let selectedFormat = 'png';
            
            formatInputs.forEach(input => {
                if (input.checked) {
                    selectedFormat = input.value;
                }
            });
            
            const quality = document.getElementById('download-quality').value || 'medium';
            const width = document.getElementById('download-width').value || 300;
            const height = document.getElementById('download-height').value || 300;
            
            // Dapatkan gambar QR code
            const qrImg = document.querySelector('#qr-container img');
            
            if (qrImg) {
                // Dalam aplikasi nyata, ini akan menggunakan canvas untuk resize dan convert ke format yang dipilih
                // Untuk demo, kita hanya unduh gambar langsung
                
                // Buat elemen anchor untuk men-trigger download
                const link = document.createElement('a');
                link.href = qrImg.src;
                link.download = `qr-code-${Date.now()}.${selectedFormat}`;
                
                // Tambahkan ke DOM dan klik
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Tutup modal
                document.getElementById('download-options-panel').style.display = 'none';
                
                // Tampilkan notifikasi
                showNotification(`QR code berhasil diunduh sebagai ${selectedFormat.toUpperCase()}`, 'success');
            } else {
                showNotification('Tidak ada QR code untuk diunduh', 'error');
            }
        });
    }
}

// ===== Share Button =====
// Handle tombol dan opsi berbagi
function initShareOptions() {
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const shareBtns = document.querySelectorAll('.share-btn');
    
    // Copy URL
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', function() {
            const shareUrl = document.getElementById('share-url');
            
            if (shareUrl && shareUrl.value) {
                // Copy to clipboard
                shareUrl.select();
                document.execCommand('copy');
                
                // Deselect
                window.getSelection().removeAllRanges();
                
                // Feedback
                showNotification('URL berhasil disalin ke clipboard', 'success');
            } else {
                showNotification('Tidak ada URL untuk disalin', 'error');
            }
        });
    }
    
    // Share to platform
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            const shareUrl = document.getElementById('share-url').value;
            
            if (!shareUrl) {
                showNotification('Generate QR code terlebih dahulu', 'error');
                return;
            }
            
            let shareLink = '';
            
            switch(platform) {
                case 'facebook':
                    shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'twitter':
                    shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('QR Code saya dari QR Generator Pro')}`;
                    break;
                case 'whatsapp':
                    shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent('QR Code saya dari QR Generator Pro: ' + shareUrl)}`;
                    break;
                case 'telegram':
                    shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('QR Code saya dari QR Generator Pro')}`;
                    break;
                case 'email':
                    shareLink = `mailto:?subject=${encodeURIComponent('QR Code dari QR Generator Pro')}&body=${encodeURIComponent('Lihat QR Code saya di: ' + shareUrl)}`;
                    break;
            }
            
            if (shareLink) {
                window.open(shareLink, '_blank');
            }
        });
    });
}

// ===== Print Button =====
// Handle tombol print
function initPrintButton() {
    const printBtn = document.getElementById('print-qr-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const qrImg = document.querySelector('#qr-container img');
            
            if (qrImg) {
                // Buat halaman print baru
                const printWindow = window.open('', '_blank');
                
                // Buat konten halaman
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>QR Code - Print</title>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                padding: 20px;
                                font-family: Arial, sans-serif;
                            }
                            .qr-container {
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .qr-container img {
                                max-width: 100%;
                                height: auto;
                            }
                            .qr-info {
                                margin-top: 20px;
                                text-align: center;
                                font-size: 14px;
                                color: #666;
                            }
                            @media print {
                                .no-print {
                                    display: none;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            <h1>QR Code</h1>
                            <img src="${qrImg.src}" alt="QR Code">
                        </div>
                        <div class="qr-info">
                            <p>Dibuat dengan QR Generator Pro - https://qrgeneratorpro.com</p>
                            <p>${new Date().toLocaleString()}</p>
                        </div>
                        <div class="no-print">
                            <button onclick="window.print()">Print</button>
                        </div>
                    </body>
                    </html>
                `);
                
                // Tutup dokumen
                printWindow.document.close();
                
                // Buka print dialog
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                }, 500);
            } else {
                showNotification('Tidak ada QR code untuk dicetak', 'error');
            }
        });
    }
}

// ===== Save Button =====
// Handle tombol simpan QR code
function initSaveButton() {
    const saveConfirmBtn = document.getElementById('confirm-save-qr');
    
    if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', function() {
            const qrName = document.getElementById('save-qr-name').value;
            const qrFolder = document.getElementById('save-qr-folder').value;
            const qrTags = document.getElementById('save-qr-tags').value;
            
            if (!qrName) {
                showNotification('Nama QR code wajib diisi', 'error');
                return;
            }
            
            // Untuk demo, kita hanya simulasikan penyimpanan
            // Dalam aplikasi nyata, ini akan menyimpan ke database atau localStorage
            
            setTimeout(() => {
                // Tutup modal
                document.getElementById('save-qr-modal').style.display = 'none';
                
                // Tampilkan notifikasi
                showNotification(`QR code "${qrName}" berhasil disimpan`, 'success');
            }, 500);
        });
    }
}
// ===== Theme Switch =====
    // Handle switch tema terang/gelap
    function initThemeSwitch() {
        const themeCheckbox = document.getElementById('theme-checkbox');
        
        if (themeCheckbox) {
            // Periksa preferensi tema dari localStorage
            const savedTheme = localStorage.getItem('theme');
            
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                themeCheckbox.checked = true;
            }
            
            // Listen untuk perubahan tema
            themeCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('theme', 'light');
                }
            });
        }
    }
    
    // ===== Mobile Menu =====
    // Handle menu mobile
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const mainNavigation = document.getElementById('main-navigation');
        
        if (menuToggle && mainNavigation) {
            menuToggle.addEventListener('change', function() {
                if (this.checked) {
                    mainNavigation.classList.add('show');
                } else {
                    mainNavigation.classList.remove('show');
                }
            });
            
            // Tutup menu ketika link di klik
            const navLinks = document.querySelectorAll('.nav-link');
            
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    menuToggle.checked = false;
                    mainNavigation.classList.remove('show');
                });
            });
        }
    }
    
    // ===== Feature Filter =====
    // Handle filter fitur
    function initFeatureFilter() {
        const filterButtons = document.querySelectorAll('.features-filter .filter-btn');
        const featureCards = document.querySelectorAll('.feature-card');
        
        // Filter berdasarkan kategori
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Filter cards
                const filter = this.getAttribute('data-filter');
                
                featureCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const categories = (card.getAttribute('data-category') || '').split(' ');
                        if (categories.includes(filter)) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }
    
    // ===== Show More Features =====
    // Handle tombol Show More Features
    function initShowMoreFeatures() {
        const showMoreBtn = document.getElementById('show-more-features');
        const moreFeatures = document.getElementById('more-features');
        
        if (showMoreBtn && moreFeatures) {
            showMoreBtn.addEventListener('click', function() {
                if (moreFeatures.style.display === 'none' || moreFeatures.style.display === '') {
                    moreFeatures.style.display = 'flex';
                    this.textContent = 'Sembunyikan Fitur';
                } else {
                    moreFeatures.style.display = 'none';
                    this.textContent = 'Lihat Semua Fitur';
                }
            });
        }
    }
    
    // ===== Show More vCard Fields =====
    // Handle tombol Show More vCard Fields
    function initVCardToggle() {
        const vCardToggleBtn = document.getElementById('vcard-toggle-more');
        const vCardMoreFields = document.getElementById('vcard-more-fields');
        
        if (vCardToggleBtn && vCardMoreFields) {
            vCardToggleBtn.addEventListener('click', function() {
                if (vCardMoreFields.style.display === 'none' || vCardMoreFields.style.display === '') {
                    vCardMoreFields.style.display = 'block';
                    this.textContent = 'Sembunyikan Lainnya';
                } else {
                    vCardMoreFields.style.display = 'none';
                    this.textContent = 'Tampilkan Lainnya';
                }
            });
        }
    }
    
    // ===== Show Advanced Settings =====
    // Handle tombol Show Advanced Settings
    function initAdvancedSettings() {
        const advancedToggleBtn = document.querySelector('.toggle-advanced-btn');
        const advancedSettings = document.querySelector('.advanced-settings');
        
        if (advancedToggleBtn && advancedSettings) {
            advancedToggleBtn.addEventListener('click', function() {
                if (advancedSettings.style.display === 'none' || advancedSettings.style.display === '') {
                    advancedSettings.style.display = 'block';
                    this.textContent = 'Sembunyikan Pengaturan Lanjutan';
                } else {
                    advancedSettings.style.display = 'none';
                    this.textContent = 'Pengaturan Lanjutan';
                }
            });
        }
    }
    
    // ===== Load More Templates =====
    // Handle tombol Load More Templates
    function initLoadMoreTemplates() {
        const loadMoreBtn = document.getElementById('load-more-templates');
        
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                // Simulasi loading templates tambahan
                this.textContent = 'Loading...';
                this.disabled = true;
                
                setTimeout(() => {
                    // Tambahkan template baru
                    const templatesGrid = document.querySelector('.templates-grid');
                    
                    if (templatesGrid) {
                        // Template baru yang akan ditambahkan
                        const newTemplates = `
                            <div class="template-card" data-category="social">
                                <div class="template-card-preview">
                                    <img src="template-youtube.png" alt="YouTube Template">
                                </div>
                                <div class="template-card-info">
                                    <h3>YouTube Channel</h3>
                                    <p>Template channel YouTube</p>
                                    <div class="template-card-actions">
                                        <button class="btn btn-sm btn-primary use-template-btn" data-template-id="youtube">Gunakan</button>
                                        <button class="btn btn-sm btn-secondary preview-template-btn modal-trigger" data-modal-id="template-preview-modal" data-template-id="youtube">Preview</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="template-card" data-category="business">
                                <div class="template-card-preview">
                                    <img src="template-menu.png" alt="Restaurant Menu Template">
                                </div>
                                <div class="template-card-info">
                                    <h3>Restaurant Menu</h3>
                                    <p>Template menu restoran</p>
                                    <div class="template-card-actions">
                                        <button class="btn btn-sm btn-primary use-template-btn" data-template-id="menu">Gunakan</button>
                                        <button class="btn btn-sm btn-secondary preview-template-btn modal-trigger" data-modal-id="template-preview-modal" data-template-id="menu">Preview</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="template-card" data-category="personal social">
                                <div class="template-card-preview">
                                    <img src="template-portfolio.png" alt="Portfolio Template">
                                </div>
                                <div class="template-card-info">
                                    <h3>Portfolio</h3>
                                    <p>Template portofolio pribadi</p>
                                    <div class="template-card-actions">
                                        <button class="btn btn-sm btn-primary use-template-btn" data-template-id="portfolio">Gunakan</button>
                                        <button class="btn btn-sm btn-secondary preview-template-btn modal-trigger" data-modal-id="template-preview-modal" data-template-id="portfolio">Preview</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="template-card" data-category="business marketing">
                                <div class="template-card-preview">
                                    <img src="template-coupon.png" alt="Coupon Template">
                                </div>
                                <div class="template-card-info">
                                    <h3>Discount Coupon</h3>
                                    <p>Template kupon diskon</p>
                                    <div class="template-card-actions">
                                        <button class="btn btn-sm btn-primary use-template-btn" data-template-id="coupon">Gunakan</button>
                                        <button class="btn btn-sm btn-secondary preview-template-btn modal-trigger" data-modal-id="template-preview-modal" data-template-id="coupon">Preview</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Tambahkan template ke grid
                        templatesGrid.innerHTML += newTemplates;
                        
                        // Reinisialisasi event listener untuk template baru
                        initTemplateFilters();
                        
                        // Update pagination
                        const paginationInfo = document.querySelector('.pagination-info');
                        if (paginationInfo) {
                            paginationInfo.textContent = 'Halaman 2 dari 3';
                        }
                        
                        // Update tombol
                        this.textContent = 'Muat Lebih Banyak Template';
                        this.disabled = false;
                        
                        // Jika sudah mencapai batas template, sembunyikan tombol
                        const templateCards = document.querySelectorAll('.template-card');
                        if (templateCards.length >= 12) {
                            this.style.display = 'none';
                            showNotification('Semua template telah dimuat', 'info');
                        }
                    }
                }, 1000);
            });
        }
    }
    
    // ===== Testimonial Slider =====
    // Handle testimonial slider
    function initTestimonialSlider() {
        const testimonialSlide = document.querySelector('.testimonial-slide');
        const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
        const testimonialPrev = document.querySelector('.testimonial-prev');
        const testimonialNext = document.querySelector('.testimonial-next');
        
        if (testimonialSlide && testimonialDots.length > 0) {
            let currentSlide = 0;
            const testimonials = [
                {
                    content: 'QR Generator Pro sangat membantu bisnis saya. Pelanggan selalu mengomentari betapa menariknya QR code kami dengan logo yang disesuaikan.',
                    author: 'Ahmad Riyadi',
                    position: 'Pemilik Kafe',
                    image: 'testimonial-1.jpg'
                },
                {
                    content: 'Sebagai desainer, saya menghargai kemampuan untuk menyesuaikan setiap aspek QR code. Klien saya sangat senang dengan hasilnya dan QR code bekerja dengan sempurna di semua perangkat.',
                    author: 'Siti Rahmawati',
                    position: 'Desainer Grafis',
                    image: 'testimonial-2.jpg'
                },
                {
                    content: 'Fitur analitik memungkinkan saya melacak berapa kali QR code dipindai. Ini membantu dalam mengukur efektivitas kampanye marketing kami.',
                    author: 'Budi Santoso',
                    position: 'Marketing Manager',
                    image: 'testimonial-3.jpg'
                },
                {
                    content: 'Antarmuka yang mudah digunakan dan banyaknya pilihan kustomisasi membuat proses pembuatan QR code menjadi menyenangkan. Sangat direkomendasikan!',
                    author: 'Dewi Lestari',
                    position: 'Blogger Kuliner',
                    image: 'testimonial-4.jpg'
                }
            ];
            
            // Fungsi untuk menampilkan slide
            function showSlide(index) {
                // Update slide content
                testimonialSlide.innerHTML = `
                    <div class="testimonial-content">
                        <p>"${testimonials[index].content}"</p>
                    </div>
                    <div class="testimonial-author">
                        <img src="${testimonials[index].image}" alt="${testimonials[index].author}" class="author-image">
                        <div class="author-info">
                            <h4>${testimonials[index].author}</h4>
                            <p>${testimonials[index].position}</p>
                        </div>
                    </div>
                `;
                
                // Update active dot
                testimonialDots.forEach((dot, i) => {
                    if (i === index) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
                
                // Update current slide
                currentSlide = index;
            }
            
            // Event untuk dot
            testimonialDots.forEach((dot, i) => {
                dot.addEventListener('click', function() {
                    showSlide(i);
                });
            });
            
            // Event untuk prev/next
            if (testimonialPrev && testimonialNext) {
                testimonialPrev.addEventListener('click', function() {
                    const prevSlide = (currentSlide - 1 + testimonials.length) % testimonials.length;
                    showSlide(prevSlide);
                });
                
                testimonialNext.addEventListener('click', function() {
                    const nextSlide = (currentSlide + 1) % testimonials.length;
                    showSlide(nextSlide);
                });
            }
            
            // Auto slide setiap 5 detik
            setInterval(() => {
                const nextSlide = (currentSlide + 1) % testimonials.length;
                showSlide(nextSlide);
            }, 5000);
        }
    }
    
    // ===== Contact Form =====
    // Handle form kontak
    function initContactForm() {
        const contactForm = document.getElementById('contact-form');
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Ambil nilai form
                const name = document.getElementById('contact-name').value;
                const email = document.getElementById('contact-email').value;
                const subject = document.getElementById('contact-subject').value;
                const message = document.getElementById('contact-message').value;
                
                // Validasi sederhana
                if (!name || !email || !message) {
                    showNotification('Nama, email, dan pesan wajib diisi', 'error');
                    return;
                }
                
                // Simulasi pengiriman pesan
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Mengirim...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    // Reset form
                    contactForm.reset();
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    // Notifikasi sukses
                    showNotification('Pesan Anda telah terkirim. Kami akan menghubungi Anda segera.', 'success');
                }, 1500);
            });
        }
    }
    
    // ===== Back to Top Button =====
    // Handle tombol Back to Top
    function initBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        
        if (backToTopBtn) {
            // Tampilkan/sembunyikan tombol berdasarkan scroll
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTopBtn.style.display = 'flex';
                } else {
                    backToTopBtn.style.display = 'none';
                }
            });
            
            // Scroll ke atas ketika diklik
            backToTopBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    // ===== Smooth Scroll =====
    // Handle smooth scroll untuk link
    function initSmoothScroll() {
        const scrollLinks = document.querySelectorAll('a[href^="#"]:not(.modal-trigger)');
        
        scrollLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Hanya tangani link internal
                if (this.getAttribute('href').startsWith('#') && !this.classList.contains('modal-trigger')) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href');
                    
                    // Scroll ke element jika ada
                    if (targetId !== '#') {
                        const targetElement = document.querySelector(targetId);
                        
                        if (targetElement) {
                            window.scrollTo({
                                top: targetElement.offsetTop - 100, // Offset untuk header
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            });
        });
    }
    
    // ===== Help Accordion =====
    // Handle accordion untuk konten bantuan
    function initHelpAccordion() {
        const helpTopics = document.querySelectorAll('.help-topic h4');
        
        helpTopics.forEach(topic => {
            topic.addEventListener('click', function() {
                // Toggle active class
                this.classList.toggle('active');
                
                // Toggle content visibility
                const content = this.nextElementSibling;
                
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }
    
    // ===== Help Search =====
    // Handle pencarian di bantuan
    function initHelpSearch() {
        const helpSearch = document.getElementById('help-search');
        const helpSearchBtn = document.getElementById('help-search-btn');
        
        if (helpSearch && helpSearchBtn) {
            helpSearchBtn.addEventListener('click', searchHelp);
            helpSearch.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchHelp();
                }
            });
            
            function searchHelp() {
                const searchTerm = helpSearch.value.toLowerCase();
                const helpTopics = document.querySelectorAll('.help-topic');
                
                if (!searchTerm) {
                    // Jika pencarian kosong, tampilkan semua topic
                    helpTopics.forEach(topic => {
                        topic.style.display = 'block';
                    });
                    return;
                }
                
                helpTopics.forEach(topic => {
                    const title = topic.querySelector('h4').textContent.toLowerCase();
                    const content = topic.querySelector('.help-topic-content').textContent.toLowerCase();
                    
                    // Tampilkan topic jika judul atau konten mengandung kata kunci pencarian
                    if (title.includes(searchTerm) || content.includes(searchTerm)) {
                        topic.style.display = 'block';
                        
                        // Buka accordion untuk hasil pencarian
                        const topicContent = topic.querySelector('.help-topic-content');
                        const topicHeader = topic.querySelector('h4');
                        
                        topicHeader.classList.add('active');
                        topicContent.style.maxHeight = topicContent.scrollHeight + 'px';
                    } else {
                        topic.style.display = 'none';
                    }
                });
            }
        }
    }
    
    // ===== Password Toggle =====
    // Handle toggle tampilkan/sembunyikan password
    function initPasswordToggle() {
        const passwordToggles = document.querySelectorAll('.password-toggle input[type="checkbox"]');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const passwordField = this.closest('.form-group').querySelector('input[type="password"]');
                
                if (passwordField) {
                    if (this.checked) {
                        passwordField.type = 'text';
                    } else {
                        passwordField.type = 'password';
                    }
                }
            });
        });
    }
    
    // ===== Scanner Modal =====
    // Handle scanner di modal
    function initScanner() {
        const testScanBtn = document.getElementById('test-scan-btn');
        
        if (testScanBtn) {
            testScanBtn.addEventListener('click', function() {
                // Dalam aplikasi nyata, ini akan mengakses kamera dan memindai QR code
                // Untuk demo, kita hanya simulasikan pemindaian
                
                const scannerVideo = document.getElementById('scanner-video');
                const scannerResult = document.getElementById('scanner-result-content');
                
                if (scannerVideo && scannerResult) {
                    // Tampilkan placeholder loading
                    scannerResult.innerHTML = '<p class="placeholder-text">Memulai scanner...</p>';
                    
                    // Simulasi akses kamera (dalam aplikasi nyata, ini akan menggunakan WebRTC)
                    setTimeout(() => {
                        // Tampilkan hasil pemindaian simulasi
                        const qrImg = document.querySelector('#qr-container img');
                        
                        if (qrImg) {
                            scannerResult.innerHTML = `
                                <div class="scan-result">
                                    <div class="scan-result-type">
                                        <span class="result-label">Tipe:</span>
                                        <span class="result-value">URL</span>
                                    </div>
                                    <div class="scan-result-content">
                                        <span class="result-label">Konten:</span>
                                        <span class="result-value">https://qrgeneratorpro.com</span>
                                    </div>
                                    <div class="scan-result-time">
                                        <span class="result-label">Waktu:</span>
                                        <span class="result-value">${new Date().toLocaleTimeString()}</span>
                                    </div>
                                    <div class="scan-result-actions">
                                        <button class="btn btn-sm btn-primary">Buka URL</button>
                                        <button class="btn btn-sm btn-secondary">Salin Konten</button>
                                    </div>
                                </div>
                            `;
                        } else {
                            scannerResult.innerHTML = '<p class="placeholder-text">Tidak ada QR code untuk dipindai. Buat QR code terlebih dahulu.</p>';
                        }
                    }, 1500);
                }
            });
        }
    }
    
    // ===== Language Selector =====
    // Handle pemilih bahasa
    function initLanguageSelector() {
        const languageSelect = document.getElementById('language-select');
        
        if (languageSelect) {
            languageSelect.addEventListener('change', function() {
                const selectedLanguage = this.value;
                
                // Dalam aplikasi nyata, ini akan mengubah bahasa UI
                // Untuk demo, kita hanya tampilkan notifikasi
                showNotification(`Bahasa diubah ke: ${selectedLanguage}`, 'info');
            });
        }
    }
    
    // ===== Initialization =====
    // Panggil semua fungsi inisialisasi
    function initApp() {
        // Init UI components
        initTabNavigation();
        initAccordion();
        initPreviewModeToggle();
        initGenerateButton();
        initLogoUpload();
        initColorPickers();
        initRangeSliders();
        initModals();
        initNotifications();
        initTemplateFilters();
        initTutorialTabs();
        initDownloadButton();
        initShareOptions();
        initPrintButton();
        initSaveButton();
        initThemeSwitch();
        initMobileMenu();
        initFeatureFilter();
        initShowMoreFeatures();
        initVCardToggle();
        initAdvancedSettings();
        initLoadMoreTemplates();
        initTestimonialSlider();
        initContactForm();
        initBackToTop();
        initSmoothScroll();
        initHelpAccordion();
        initHelpSearch();
        initPasswordToggle();
        initScanner();
        initLanguageSelector();
        
        // Generate contoh QR code
        setTimeout(() => {
            generateQRCode('https://qrgeneratorpro.com', {
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }, 1000);
    }
    
    // Init app setelah DOM dimuat
    initApp();
});