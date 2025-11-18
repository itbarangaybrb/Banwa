function validation() {
    // =========================
    // Truck Entry form elements
    // =========================
    const requestDate = document.getElementById('requestDate');
    const dateOfWork = document.getElementById('dateOfWork');
    const nameOfHomeowner = document.getElementById('nameOfHomeowner');
    const nameOfHardware = document.getElementById('nameOfHardware');
    const fullAdress = document.getElementById('fullAdress');
    const numbersOfTrucks = document.getElementById('numbersOfTrucks');
    numbersOfTrucks.addEventListener('input', () => {
        numbersOfTrucks.value = numbersOfTrucks.value.replace(/[^0-9]/g, '');
    });
    const typeOfWheelerTruck = document.getElementById('typeOfWheelerTruck');

    // =========================
    // Function: Validate single input
    // =========================
    function validateInput(input, message = 'This field is required', rules = {}) {
        const wrapper = input.closest('.label-and-input');
        const errorEl = wrapper.querySelector('.error-msg');
        const value = input.value.trim();

        // Required check
        if (value === '') {
            input.classList.add('error');
            errorEl.textContent = message;
            return false;
        } else {
            errorEl.textContent = '';
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
            errorEl.textContent = `Maximum ${rules.maxLength} digits allowed`;
            return false;
        }

        // Passed validation
        input.classList.remove('error');
        errorEl.textContent = '';
        return true;
    }

    // =========================
    // Real-time validation Truck Entry
    // =========================
    (() => {
        const inputs = [requestDate, dateOfWork, nameOfHomeowner, nameOfHardware, fullAdress, numbersOfTrucks, typeOfWheelerTruck];

        inputs.forEach(input => {
            input.addEventListener('input', () => validateInput(input));
        });
    })();

    // =========================
    // Real-time validation for Truck Entry
    // =========================
    (() => {
        const inputs = [requestDate, dateOfWork, nameOfHomeowner, nameOfHardware, fullAdress, numbersOfTrucks, typeOfWheelerTruck];

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);

                if (input === numbersOfTrucks) {
                    const wrapper = numbersOfTrucks.closest('.label-and-input');
                    const errorEl = wrapper.querySelector('.error-msg');
                    const value = input.value.trim();

                    numbersOfTrucks.value = value.replace(/[^0-9]/g, '');

                    if (!/^[0-9]+$/.test(value)) {
                        numbersOfTrucks.classList.add('error');
                        errorEl.textContent = 'Number of trucks must be numeric';
                    } else if (value.length !== 2) {
                        numbersOfTrucks.classList.add('error');
                        errorEl.textContent = 'Number of trucks must be exactly 2 digits';
                    } else {
                        numbersOfTrucks.classList.remove('error');
                        errorEl.textContent = '';
                    }
                }
            });
        });
    })();


    // =========================
    // Entry Truck "Submit"
    // =========================
    document.getElementById('truckEntryForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const validations = [
            validateInput(requestDate, 'Request date is required'),
            validateInput(dateOfWork, 'Date of work is required'),
            validateInput(nameOfHomeowner, 'Name of homeowner is required'),
            validateInput(nameOfHardware, 'Name of hardware is required'),
            validateInput(fullAdress, 'Full address is required'),
            validateInput(numbersOfTrucks, 'Number of trucks is required', {
                pattern: /^[0-9]+$/,
                maxLength: 2,
            }),
            validateInput(typeOfWheelerTruck, 'Type of wheeler truck is required')
        ];

        if (validations.every(v => v)) {
            // Ask for confirmation first
            if (!confirm('Are you sure you want to submit this changes?')) return;

            const AllData = {
                requestDate: requestDate.value,
                dateOfWork: dateOfWork.value,
                nameOfHomeowner: nameOfHomeowner.value,
                nameOfHardware: nameOfHardware.value,
                fullAdress: fullAdress.value,
                numbersOfTrucks: numbersOfTrucks.value,
                typeOfWheelerTruck: typeOfWheelerTruck.value,
            };

            // TODO: Back-end developer, these are the data to be sent to db.
            // add here if necessary...

            console.log('Final Submission Data:', AllData);
            alert('Application submitted successfully!');
        }

    });
}

validation();