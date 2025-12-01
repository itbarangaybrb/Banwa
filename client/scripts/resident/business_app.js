// =========================
// Function: Hide/Show Panels
// =========================
function switchPanel(panelId) {
    const panels = ['business', 'waiver', 'summary']
        .map(id => document.getElementById(id));
    panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== panelId));
}

function validation() {
    // =========================
    // Business/Utilities form elements
    // =========================
    const businessName = document.getElementById('businessName');
    const typeOfBusiness = document.getElementsByName('typeOfBusiness');
    const natureOfBusinessSelect = document.getElementById('natureOfBusinessSelect');
    const natureOfBusinessSpecify = document.getElementById('natureOfBusinessSpecify');
    const addressOfBusiness = document.getElementById('addressOfBusiness');
    const businessStatus = document.getElementsByName('businessStatus');
    const telephoneNoBusiness = document.getElementById('telephoneNoBusiness');
    const emailAddress = document.getElementById('emailAddress');
    const firstName = document.getElementById('firstName');
    const middleName = document.getElementById('middleName');
    const lastName = document.getElementById('lastName');
    const telephoneNoOwner = document.getElementById('telephoneNoOwner');
    const addressOwner = document.getElementById('addressOwner');
    const typeOfStructureSelect = document.getElementById('typeOfStructureSelect');
    const typeOfStructureSpecify = document.getElementById('typeOfStructureSpecify');
    const requirements = document.getElementsByName('requirements');
    const requirementUpload = document.getElementById('requirementUpload');
    const noOfEmployees = document.getElementById('noOfEmployees');

    // Waiver form elements
    const agreeCheckBox = document.getElementById('agreeCheckBox');

    // Show business panel by default
    switchPanel('business');

    // =========================
    // Hide “Others” specify input initially
    // =========================
    natureOfBusinessSpecify.closest('.label-and-input').style.display = 'none';
    typeOfStructureSpecify.closest('.label-and-input').style.display = 'none';

    // =========================
    // Function: handle "Others" selection
    // =========================
    function handleOthersSelect(selectEl, specifyEl) {
        const wrapper = specifyEl.closest('.label-and-input');
        if (selectEl.value === 'Others') {
            wrapper.style.display = 'block';
        } else {
            wrapper.style.display = 'none';
            specifyEl.value = '';
        }
    }

    natureOfBusinessSelect.addEventListener('change', () => handleOthersSelect(natureOfBusinessSelect, natureOfBusinessSpecify));
    typeOfStructureSelect.addEventListener('change', () => handleOthersSelect(typeOfStructureSelect, typeOfStructureSpecify));

    // =========================
    // Function: Validate single input
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        if (!input) return true;
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();

        if ((input.type === 'checkbox' && !value) ||
            (!input.type.includes('checkbox') && (value === '' || value === 'select'))) {
            input.classList.add('error');
            errorEl.textContent = message;
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            input.classList.add('error');
            errorEl.textContent = rules.errorMessage || 'Invalid format';
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            input.classList.add('error');
            errorEl.textContent = `Maximum ${rules.maxLength} characters allowed`;
            return false;
        }

        input.classList.remove('error');
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Function: Validate checkbox
    // =========================
    function validateCheckboxGroup(checkboxes, message) {
        const wrapper = checkboxes[0].closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        if (!Array.from(checkboxes).some(c => c.checked)) {
            errorEl.textContent = message;
            return false;
        }
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Function: Validate radio
    // =========================
    function validateRadioGroup(radios, message) {
        const wrapper = radios[0].closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        if (!Array.from(radios).some(r => r.checked)) {
            errorEl.textContent = message;
            return false;
        }
        errorEl.textContent = '';
        return true;
    }


    // =========================
    // Real-time validation
    // =========================
    (() => {
        const inputs = [
            businessName, natureOfBusinessSelect, natureOfBusinessSpecify,
            telephoneNoBusiness, emailAddress, firstName, middleName, lastName,
            telephoneNoOwner, addressOfBusiness, addressOwner, typeOfStructureSelect, typeOfStructureSpecify, noOfEmployees,
            requirementUpload
        ];

        inputs.forEach(input => {
            if (!input) return;
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, () => validateInput(input));
        });

        emailAddress.addEventListener('input', () => {
            validateInput(emailAddress, 'Email is required', {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                errorMessage: 'Please enter a valid email address'
            });
        });

        telephoneNoBusiness.addEventListener('input', () => {
            const wrapper = telephoneNoBusiness.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            telephoneNoBusiness.value = telephoneNoBusiness.value.replace(/[^0-9]/g, '');
            if (telephoneNoBusiness.value === '') {
                errorEl.textContent = 'Contact number is required';
            } else if (telephoneNoBusiness.value.length !== 11) {
                errorEl.textContent = 'Contact number must be exactly 11 digits';
            } else {
                errorEl.textContent = '';
            }
        });

        telephoneNoOwner.addEventListener('input', () => {
            const wrapper = telephoneNoOwner.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            telephoneNoOwner.value = telephoneNoOwner.value.replace(/[^0-9]/g, '');
            if (telephoneNoOwner.value === '') {
                errorEl.textContent = 'Telephone no. is required';
            } else if (telephoneNoOwner.value.length !== 11) {
                errorEl.textContent = 'Telephone no. must be exactly 11 digits';
            } else {
                errorEl.textContent = '';
            }
        });

        noOfEmployees.addEventListener('input', () => {
            const wrapper = noOfEmployees.closest('.label-and-input');
            const errorEl = wrapper.querySelector('.error-msg');
            noOfEmployees.value = noOfEmployees.value.replace(/[^0-9]/g, '');
            if (noOfEmployees.value === '') {
                errorEl.textContent = 'No. of employees is required';
            } else {
                errorEl.textContent = '';
            }
        });

        Array.from(typeOfBusiness).forEach(radio => {
            radio.addEventListener('change', () => validateRadioGroup(typeOfBusiness, 'Please select a type of business'));
        });

        Array.from(businessStatus).forEach(checkbox => {
            checkbox.addEventListener('change', () => validateCheckboxGroup(businessStatus, 'Please select business status'));
        });

        Array.from(requirements).forEach(checkbox => {
            checkbox.addEventListener('change', () => validateCheckboxGroup(requirements, 'Please select at least one requirement'));
        });

        agreeCheckBox.addEventListener('change', () => validateInput(agreeCheckBox));
    })();


    // =========================
    // Business "Next" button click
    // =========================
    document.getElementById('nextToWaiver').addEventListener('click', () => {
        const validations = [
            validateInput(businessName, 'Business Name is required'),
            validateRadioGroup(typeOfBusiness, 'Please select a type of business'),
            validateInput(natureOfBusinessSelect, 'Nature of business is required'),
            natureOfBusinessSelect.value === 'Others'
                ? validateInput(natureOfBusinessSpecify, 'Please specify the business details')
                : true,
            validateInput(addressOfBusiness, 'Please enter your business address'),
            validateCheckboxGroup(businessStatus, 'Please select business status'),
            validateInput(telephoneNoBusiness, 'Business telephone is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Business telephone must be numeric, max 11 digits'
            }),
            validateInput(emailAddress, 'Email is required', {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                errorMessage: 'Please enter a valid email address'
            }),
            validateInput(firstName, 'Owner first name is required', {
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage: 'First name must only contain letters and spaces'
            }),
            validateInput(lastName, 'Owner last name is required', {
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage: 'Last name must only contain letters and spaces'
            }),
            validateInput(telephoneNoOwner, 'Owner telephone is required', {
                pattern: /^[0-9]+$/,
                maxLength: 11,
                errorMessage: 'Owner telephone must be numeric, max 11 digits'
            }),
            validateInput(addressOwner, 'Owner address is required'),
            validateInput(typeOfStructureSelect, 'Please select a structure type'),
            typeOfStructureSelect.value === 'Others'
                ? validateInput(typeOfStructureSpecify, 'Please specify the structure details')
                : true,
            validateCheckboxGroup(requirements, 'Please select at least one requirement'),
            validateInput(requirementUpload, 'Please upload a document'),
            validateInput(noOfEmployees, 'Number of employees is required', {
                pattern: /^[0-9]{1,2}$/,
                errorMessage: 'Number of employees must be 1 or 2 digits'
            }),
        ];

        if (validations.every(v => v)) {
            document.getElementById('waiverFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value}`;
            switchPanel('waiver');
        }
    });

    // =========================
    // Waiver and Summary logic (unchanged)
    // =========================
    document.getElementById('nextToSummary').addEventListener('click', () => {
        const isValid = validateInput(agreeCheckBox, 'You must agree to proceed');

        if (isValid) {
            document.getElementById('sumBusinessName').textContent = businessName.value;
            document.getElementById('sumTypeOfBusiness').textContent = Array.from(typeOfBusiness).find(r => r.checked)?.value || '';
            document.getElementById('sumNatureOfBusiness').textContent = `${natureOfBusinessSelect.value === 'Others' ? natureOfBusinessSpecify.value : natureOfBusinessSelect.value}`.trim();
            document.getElementById('sumAddressOfBusiness').textContent = addressOfBusiness.value;
            document.getElementById('sumTelephoneBusiness').textContent = telephoneNoBusiness.value;
            document.getElementById('sumEmail').textContent = emailAddress.value;
            document.getElementById('sumFullname').textContent = `${firstName.value} ${middleName.value} ${lastName.value}`.trim();
            document.getElementById('sumTelephoneOwner').textContent = telephoneNoOwner.value;
            document.getElementById('sumAddressOwner').textContent = addressOwner.value;
            document.getElementById('sumStructureType').textContent = `${typeOfStructureSelect.value === 'Others' ? typeOfStructureSpecify.value : typeOfStructureSelect.value}`.trim();
            document.getElementById('sumRequirements').textContent = Array.from(requirements).filter(r => r.checked).map(r => r.value).join(', ');
            document.getElementById('sumEmployees').textContent = noOfEmployees.value;
            document.getElementById('sumAgreed').textContent = agreeCheckBox.checked ? 'Yes' : 'No';

            switchPanel('summary');
        }
    });

    // =========================
    // Back buttons
    // =========================
    (() => {
        document.getElementById('utilitiesBackBtn').addEventListener('click', () => switchPanel('business'));
        document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('business'));
        document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
    })();

    // =========================
    // Final form submit
    // =========================
    document.getElementById('summaryForm').addEventListener('submit', function (e) {
        e.preventDefault();

        if (confirm('Are you sure you want to submit this application?')) {
            const allData = {
                businessName: businessName.value,
                typeOfBusiness: Array.from(typeOfBusiness).find(r => r.checked)?.value || '',
                natureOfBusiness: `${natureOfBusinessSelect.value} ${natureOfBusinessSpecify.value}`.trim(),
                addressOfBusiness: Array.from(addressOfBusiness).filter(c => c.checked).map(c => c.value),
                telephoneNoBusiness: telephoneNoBusiness.value,
                emailAddress: emailAddress.value,
                ownerName: `${firstName.value} ${middleName.value} ${lastName.value}`.trim(),
                telephoneNoOwner: telephoneNoOwner.value,
                addressOwner: addressOwner.value,
                typeOfStructure: `${typeOfStructureSelect.value} ${typeOfStructureSpecify.value}`.trim(),
                requirements: Array.from(requirements).filter(r => r.checked).map(r => r.value),
                noOfEmployees: noOfEmployees.value,
                agreed: agreeCheckBox.checked
            };

            //  TODO: Back-end developer these are the data to be sent in database.
            // add here if necessary....

            console.log('Final Submission Data:', allData);
            alert('Application submitted successfully!');
        }
    }, { once: true });
}

validation();
