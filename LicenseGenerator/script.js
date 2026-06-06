document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputAccount = document.getElementById('account-input');
    const inputSalt = document.getElementById('salt-input');
    const btnGenerate = document.getElementById('generate-btn');
    const btnCopy = document.getElementById('copy-btn');
    const outputLicense = document.getElementById('license-output');
    const copyText = document.getElementById('copy-text');

    // djb2 hash modulo 90000 + 10000 to get a 5-digit number (10000 - 99999)
    function get5DigitChecksum(text) {
        let hash = 5381;
        for (let i = 0; i < text.length; i++) {
            // JavaScript bitwise operations are 32-bit signed integers
            hash = ((hash << 5) + hash) + text.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        // Get positive remainder mapped to range 10000 - 99999
        let remainder = Math.abs(hash) % 90000 + 10000;
        return remainder.toString();
    }

    // Generate License Action
    btnGenerate.addEventListener('click', () => {
        const allowedAccount = inputAccount.value.trim();
        const secretSalt = inputSalt.value.trim();

        // Validation
        if (!allowedAccount) {
            alert('Silakan masukkan nomor akun trading klien.');
            inputAccount.focus();
            return;
        }

        if (!/^\d+$/.test(allowedAccount)) {
            alert('Nomor akun hanya boleh berisi angka (tanpa spasi, huruf, atau simbol).');
            inputAccount.focus();
            return;
        }

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
            // Generate raw data string for hashing: AccountNumber + SecretSalt
            const rawData = `${allowedAccount}${secretSalt}`;
            
            // Compute 5-digit Checksum
            const licenseKey = get5DigitChecksum(rawData);

            // Output result
            setTimeout(() => {
                outputLicense.value = licenseKey;
                btnCopy.disabled = false;
                
                // Restore button
                spinner.classList.add('hidden');
                btnText.textContent = 'Generate 5-Digit Key';
                btnGenerate.disabled = false;
            }, 300); // Small delay for UX feel

        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat membuat lisensi: ' + err.message);
            spinner.classList.add('hidden');
            btnText.textContent = 'Generate 5-Digit Key';
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
