import { registerServiceWorker } from '../../../register_sw.js';

registerServiceWorker();

// =========================
// Function: Hide/Show Panels
// =========================
function switchPanel(panelId) {
    const panels = ['utilities', 'waiver', 'summary'].map(id => document.getElementById(id))
    panels.forEach(panel => { panel.classList.toggle('hidden', panel.id !== panelId) });
}

switchPanel('utilities');

// =========================
// Utilities "Next" button click
// =========================
document.getElementById('nextToWaiver').addEventListener('click', () => {
    switchPanel('waiver');
});

// =========================
// Waiver "Next" button click
// =========================
document.getElementById('nextToSummary').addEventListener('click', () => {
    switchPanel('summary');
});

// =========================
// Back buttons
// =========================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('utilitiesBackBtn').addEventListener('click', () => {
        window.location.href = '/Banwa/client/pages/resident/services.php';
    });

    // document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('ownder'));
    document.getElementById('waiverBackBtn').addEventListener('click', () => switchPanel('utilities'));
    document.getElementById('summaryBackBtn').addEventListener('click', () => switchPanel('waiver'));
});


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
            agreed: agreeCheckBox.checked,
        };

        // TODO: Back-end developer, these are the data to be sent to db.
        // add here if necessary...

        fetch('/Banwa/server/api/resident/submit_utilities.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allData),
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => console.error(err));

        // I will remove this later, this is only for test. - jep
        // console.log('Final Submission Data:', allData);
        alert('Application submitted successfully!');
    }
}, { once: true });
