document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const toggleAccount = document.getElementById('lock-account-toggle');
    const inputAccount = document.getElementById('account-input');
    
    const toggleBroker = document.getElementById('lock-broker-toggle');
    const inputBroker = document.getElementById('broker-input');
    
    const toggleExpiry = document.getElementById('lock-expiry-toggle');
    const inputExpiry = document.getElementById('expiry-input');
    
    const inputSalt = document.getElementById('salt-input');
    const btnGenerate = document.getElementById('generate-btn');
    const btnCopy = document.getElementById('copy-btn');
    const outputLicense = document.getElementById('license-output');
    const copyText = document.getElementById('copy-text');

    // Setup toggles interaction
    setupToggle(toggleAccount, inputAccount);
    setupToggle(toggleBroker, inputBroker);
    setupToggle(toggleExpiry, inputExpiry);

    function setupToggle(toggle, input) {
        toggle.addEventListener('change', () => {
            input.disabled = !toggle.checked;
            if (!toggle.checked) {
                input.value = '';
            } else {
                input.focus();
            }
        });
    }

    // Helper: SHA-256 hash using Web Crypto API
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // Helper: Base64 Encode (UTF-8 compatible)
    function base64Encode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        }));
    }

    // Generate License Action
    btnGenerate.addEventListener('click', async () => {
        // Validation
        let allowedAccount = "ANY";
        if (toggleAccount.checked) {
            const val = inputAccount.value.trim().replace(/\s+/g, '');
            if (!val) {
                alert('Silakan masukkan nomor akun atau nonaktifkan kunci nomor akun.');
                inputAccount.focus();
                return;
            }
            allowedAccount = val;
        }

        let allowedBroker = "ANY";
        if (toggleBroker.checked) {
            const val = inputBroker.value.trim();
            if (!val) {
                alert('Silakan masukkan nama broker atau nonaktifkan kunci nama broker.');
                inputBroker.focus();
                return;
            }
            allowedBroker = val;
        }

        let expiryDate = "ANY";
        if (toggleExpiry.checked) {
            const val = inputExpiry.value;
            if (!val) {
                alert('Silakan pilih tanggal kedaluwarsa atau nonaktifkan batas tanggal.');
                inputExpiry.focus();
                return;
            }
            // Convert YYYY-MM-DD to YYYY.MM.DD for MQL5 compatibility
            expiryDate = val.replace(/-/g, '.');
        }

        const secretSalt = inputSalt.value.trim();
        if (!secretSalt) {
            alert('Secret Salt (Kunci Rahasia) tidak boleh kosong.');
            inputSalt.focus();
            return;
        }

        // Show loading state
        const spinner = btnGenerate.querySelector('.spinner');
        const btnText = btnGenerate.querySelector('span:not(.spinner)');
        spinner.classList.remove('hidden');
        btnText.textContent = 'Generating...';
        btnGenerate.disabled = true;

        try {
            // Generate raw data string
            // format: Account|Broker|Expiry|SecretSalt
            const rawData = `${allowedAccount}|${allowedBroker}|${expiryDate}|${secretSalt}`;
            
            // Compute Hash
            const signature = await sha256(rawData);
            
            // Construct full license string
            // format: Account|Broker|Expiry|Signature
            const licensePlain = `${allowedAccount}|${allowedBroker}|${expiryDate}|${signature}`;
            
            // Base64 Encode
            const licenseKey = base64Encode(licensePlain);

            // Output result
            setTimeout(() => {
                outputLicense.value = licenseKey;
                btnCopy.disabled = false;
                
                // Restore button
                spinner.classList.add('hidden');
                btnText.textContent = 'Generate License Key';
                btnGenerate.disabled = false;
            }, 500); // Small delay for UX feel

        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat membuat lisensi: ' + err.message);
            spinner.classList.add('hidden');
            btnText.textContent = 'Generate License Key';
            btnGenerate.disabled = false;
        }
    });

    // Copy to Clipboard Action
    btnCopy.addEventListener('click', () => {
        if (!outputLicense.value) return;

        outputLicense.select();
        outputLicense.setSelectionRange(0, 99999); // For mobile devices

        navigator.clipboard.writeText(outputLicense.value).then(() => {
            // Success animation/feedback
            const originalIcon = btnCopy.querySelector('.btn-icon').textContent;
            btnCopy.querySelector('.btn-icon').textContent = '✔';
            copyText.textContent = 'Tersalin!';
            btnCopy.classList.add('btn-success'); // Custom style if any
            
            setTimeout(() => {
                btnCopy.querySelector('.btn-icon').textContent = originalIcon;
                copyText.textContent = 'Salin Kunci';
                btnCopy.classList.remove('btn-success');
            }, 2000);
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
            alert('Gagal menyalin ke clipboard. Silakan salin secara manual.');
        });
    });
});
