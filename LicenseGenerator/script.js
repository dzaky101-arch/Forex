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

    // Clean broker name (lowercase and remove non-alphanumeric chars)
    function cleanBrokerName(broker) {
        return broker.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // djb2 hash modulo 10000 to get a 4-digit checksum
    function getNumericChecksum(text) {
        let hash = 5381;
        for (let i = 0; i < text.length; i++) {
            // JavaScript bitwise operations are 32-bit signed integers
            hash = ((hash << 5) + hash) + text.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        // Get positive remainder
        let remainder = Math.abs(hash) % 10000;
        // Zero-pad to 4 digits
        return remainder.toString().padStart(4, '0');
    }

    // Generate License Action
    btnGenerate.addEventListener('click', () => {
        // 1. Account Number
        let allowedAccount = "0"; // 0 means any account
        if (toggleAccount.checked) {
            const val = inputAccount.value.trim();
            if (!val) {
                alert('Silakan masukkan nomor akun atau nonaktifkan kunci nomor akun.');
                inputAccount.focus();
                return;
            }
            if (!/^\d+$/.test(val)) {
                alert('Nomor akun hanya boleh berisi angka (tanpa spasi, koma, atau simbol).');
                inputAccount.focus();
                return;
            }
            if (val === "0") {
                alert('Nomor akun tidak boleh bernilai 0 jika dikunci.');
                inputAccount.focus();
                return;
            }
            allowedAccount = val;
        }

        // 2. Broker Name
        let allowedBroker = "ANY";
        if (toggleBroker.checked) {
            const val = inputBroker.value.trim();
            if (!val) {
                alert('Silakan masukkan nama broker atau nonaktifkan kunci nama broker.');
                inputBroker.focus();
                return;
            }
            allowedBroker = cleanBrokerName(val);
        }

        // 3. Expiration Date
        let expiryDate = "991231"; // 991231 means Lifetime
        if (toggleExpiry.checked) {
            const val = inputExpiry.value;
            if (!val) {
                alert('Silakan pilih tanggal kedaluwarsa atau nonaktifkan batas tanggal.');
                inputExpiry.focus();
                return;
            }
            // Parse YYYY-MM-DD to YYMMDD
            const parts = val.split('-');
            const yy = parts[0].slice(2, 4); // 2026 -> 26
            const mm = parts[1];
            const dd = parts[2];
            expiryDate = `${yy}${mm}${dd}`;
        }

        // 4. Secret Salt
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
            // Generate raw data string for hashing
            // format: Expiry|Account|Broker|SecretSalt
            const rawData = `${expiryDate}|${allowedAccount}|${allowedBroker}|${secretSalt}`;
            
            // Compute 4-digit Checksum
            const signature = getNumericChecksum(rawData);
            
            // Construct numeric license key
            // format: Expiry + Account + Signature
            const licenseKey = `${expiryDate}${allowedAccount}${signature}`;

            // Output result
            setTimeout(() => {
                outputLicense.value = licenseKey;
                btnCopy.disabled = false;
                
                // Restore button
                spinner.classList.add('hidden');
                btnText.textContent = 'Generate License Key';
                btnGenerate.disabled = false;
            }, 400); // Small delay for UX feel

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
        outputLicense.setSelectionRange(0, 99999);

        navigator.clipboard.writeText(outputLicense.value).then(() => {
            // Success feedback
            const originalIcon = btnCopy.querySelector('.btn-icon').textContent;
            btnCopy.querySelector('.btn-icon').textContent = '✔';
            copyText.textContent = 'Tersalin!';
            
            setTimeout(() => {
                btnCopy.querySelector('.btn-icon').textContent = originalIcon;
                copyText.textContent = 'Salin Kunci';
            }, 2000);
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
            alert('Gagal menyalin ke clipboard. Silakan salin secara manual.');
        });
    });
});
