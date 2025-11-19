// =========================
// Function: Hide/Show Panels
// =========================
function switchPanel(panelId) {
    // =========================
    // Panels elements
    // =========================
    const utilities = document.getElementById('utilities');
    const waiver = document.getElementById('waiver');
    const summary = document.getElementById('summary');

    const panels = [utilities, waiver, summary];
    panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== panelId);
    });
}

function validation() {
    // =========================
    // Utilities form elements
    // =========================
    const requestDate = document.getElementById('requestDate');
    const dateOfWork = document.getElementById('dateOfWork');
    const fullnameUtilities = document.getElementById('fullnameUtilities');
    const contactNo = document.getElementById('contactNo');
    const address = document.getElementById('address');
    const provider = document.getElementById('provider');
    const natureOfWork = document.getElementById('natureOfWork');

    // =========================
    // Waiver form elements
    // =========================
    const agreeCheckBox = document.getElementById('agreeCheckBox');

    // Show utilities panel by default
    switchPanel('utilities');

    // =========================
    // Function: Validate single input
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        // Required check
        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            errorEl.textContent = message;
            return false;
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        // Max length validation
        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        // Passed validation
        input.classList.remove('error');
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Real-time validation
    // =========================
    (() => {
        const inputs = [requestDate, dateOfWork, fullnameUtilities, contactNo, address, provider, natureOfWork];

        inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', () => validateInput(input));
            } else {
                input.addEventListener('input', () => validateInput(input));
            }

        });

        contactNo.addEventListener('input', () => {
            const wrapper = contactNo.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            const value = contactNo.value;

            // Remove any non-numeric characters (optional, you can comment out if you want them to see invalid input)
            contactNo.value = value.replace(/[^0-9]/g, '');

            // Real-time validation feedback
            if (value === '') {
                contactNo.classList.add('error');
                errorEl.textContent = 'Contact number is required';
            } else if (!/^[0-9]+$/.test(value)) {
                contactNo.classList.add('error');
                errorEl.textContent = 'Contact number must be numeric';
            } else if (value.length !== 11) {
                contactNo.classList.add('error');
                errorEl.textContent = 'Contact number must be exactly 11 digits';
            } else {
                contactNo.classList.remove('error');
                errorEl.textContent = '';
            }
        });

        agreeCheckBox.addEventListener('change', () => validateInput(agreeCheckBox));
    })();

    // =========================
    // Utilities "Next" button click
    // =========================
    document.getElementById('nextToWaiver').addEventListener('click', () => {
        const validations = [
            validateInput(requestDate, 'Request date is required'),
            validateInput(dateOfWork, 'Date of work is required'),
            validateInput(fullnameUtilities, 'Fullname is required', {
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage: 'Fullname must only contain letters and spaces'
            }),
            validateInput(contactNo, 'Contact number is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Contact number must be numeric, max 11 digits'
            }),
            validateInput(address, 'Address is required'),
            validateInput(provider, 'Provider is required'),
            validateInput(natureOfWork, 'Nature of work is required')
        ];

        if (validations.every(v => v)) {
            document.getElementById('waiverFullname').textContent = fullnameUtilities.value;

            switchPanel('waiver');
        }
    });

    // =========================
    // Waiver "Next" button click
    // =========================
    document.getElementById('nextToSummary').addEventListener('click', () => {
        const isValid = validateInput(agreeCheckBox, 'You must agree to proceed');

        if (isValid) {
            document.getElementById('sumRequestDate').textContent = requestDate.value;
            document.getElementById('sumDateOfWork').textContent = dateOfWork.value;
            document.getElementById('sumFullname').textContent = fullnameUtilities.value;
            document.getElementById('sumContactNo').textContent = contactNo.value;
            document.getElementById('sumAddress').textContent = address.value;
            document.getElementById('sumProvider').textContent = provider.value;
            document.getElementById('sumNatureOfWork').textContent = natureOfWork.value;
            document.getElementById('sumAgreed').textContent = agreeCheckBox.checked ? 'Yes' : 'No';

            switchPanel('summary');
        }
    });

    // =========================
    // Back buttons
    // =========================
    (() => {
        document.getElementById('utilitiesBackBtn').addEventListener('click', () => switchPanel('utilities'));
        document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('utilities'));
        document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
    })();

    // =========================
    // Final form submit
    // =========================
    document.getElementById('summaryForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // TODO: Front-end developer, will change this into modal
        // once the designs is fully completed.
        if (confirm('Are you sure you want to submit this application?')) {
            const allData = {
                requestDate: requestDate.value,
                dateOfWork: dateOfWork.value,
                fullname: fullnameUtilities.value,
                contactNo: contactNo.value,
                address: address.value,
                provider: provider.value,
                natureOfWork: natureOfWork.value,
                agreed: agreeCheckBox.checked
            };

            // TODO: Back-end developer, these are the data to be sent to db.
            // add here if necessary...

            console.log('Final Submission Data:', allData);
            alert('Application submitted successfully!');
        }
    }, { once: true });
}

validation();
