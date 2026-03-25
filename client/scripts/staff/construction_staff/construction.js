import { initSocket, sockets } from '../../utils/socket.js';
import { addressCoordinates } from '../../../../server/api/resident/addresses.js';
import { archiveRecord } from '../../utils/archives.js';

// ===============================================
// 1. GLOBAL STYLE FIX (Inject this at the very top)
// ===============================================
const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    .swal2-popup {
        padding: 2.5rem 0 !important; /* Forces vertical breathing room */
        border-radius: 15px !important;
    }
    .swal2-icon {
        margin-top: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        border-width: 4px !important;
    }
    .swal2-title {
        color: #00247C !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.5rem !important;
    }
    .swal2-html-container {
        margin-bottom: 1.5rem !important;
        font-size: 1.05rem !important;
        color: #555 !important;
    }
`;
document.head.appendChild(swalStyle);

// Status templates for quick text insertion - Construction
const constructionStatusTemplates = {
    'For Payment': "Your application is approved. Please pay the assessment amount of ₱[amount] via the portal or at the Barangay Hall.",
    'Disapproved': "Your construction application was disapproved due to: [reason]. You may re-apply once requirements are met.",
    'Additional Requirements': "Some documents are unclear or missing. Please re-upload your construction plans and clearances.",
    'Approved': "Your Construction Clearance is now ready for pick-up.",
    'Complied': "Your submitted requirements have been verified."
};

// Configuration
const CONSTRUCTION_HANDLER_URL = '/server/handlers/staff/construction/construction_handler.php';
const UPLOADS_BASE_PATH = '/server/handlers/staff/construction/uploads/';
let applications = [];

// Add these with your other DOM element references
const ownerLotNo = document.getElementById('ownerLotNo');
const ownerStreet = document.getElementById('ownerStreet');
const constructionLotNo = document.getElementById('constructionLotNo');
const constructionStreet = document.getElementById('constructionStreet');
const contactNoOwner = document.getElementById('contactNoOwner');
const contractorContactNumber = document.getElementById('contractorContactNumber');
const numberOfWorkers = document.getElementById('numberOfWorkers');

// Simple address validation function for the create form
/**
 * Validates address fields and verifies existence in addressCoordinates database
 * Also automatically populates latitude/longitude if address is valid
 * @param {HTMLInputElement} lotInput - Lot number input element
 * @param {HTMLSelectElement} streetInput - Street selection element
 * @param {string} target - '1' for owner, '2' for construction
 * @returns {boolean} - Whether the address is valid and exists
 */
function validateAddress(lotInput, streetInput, target) {
    const lot = lotInput.value.trim();
    const street = streetInput.value.trim();

    if (!lot) {
        showFieldError(lotInput, 'House No. is required');
        return false;
    }

    if (!street || street === '') {
        showFieldError(streetInput, 'Street is required');
        return false;
    }

    const fullAddress = `${lot} ${street}`;
    const match = addressCoordinates.find(a => a.address === fullAddress);

    if (!match) {
        showFieldError(streetInput, 'Address does not exist in our records');
        return false;
    }

    // Clear any existing errors
    clearFieldError(lotInput);
    clearFieldError(streetInput);

    // Set latitude and longitude if target is provided
    if (target) {
        const lat = document.getElementById(`latitude${target}`);
        const lng = document.getElementById(`longitude${target}`);
        if (lat && lng) {
            lat.value = match.lat.toFixed(6);
            lng.value = match.lng.toFixed(6);
        }
    }

    return true;
}

/**
 * Shows error message for a field
 * @param {HTMLElement} field - The input/select element
 * @param {string} message - Error message to display
 */
function showFieldError(field, message) {
    const wrapper = field.closest('.form-group');
    if (!wrapper) return;

    let errorEl = wrapper.querySelector('.error-msg');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-msg';
        wrapper.appendChild(errorEl);
    }

    field.classList.add('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

/**
 * Clears error for a field
 * @param {HTMLElement} field - The input/select element
 */
function clearFieldError(field) {
    const wrapper = field.closest('.form-group');
    if (!wrapper) return;

    const errorEl = wrapper.querySelector('.error-msg');
    if (errorEl) {
        field.classList.remove('error');
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

/**
 * Calculates the number of working days between start and end dates
 * Excludes weekends (Saturday and Sunday)
 */
function calculateWorkingDays() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const workingDaysInput = document.getElementById('numberOfWorkingDays');

    if (!startDateInput || !endDateInput || !workingDaysInput) return;

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    // Clear if either date is missing
    if (!startDate || !endDate) {
        workingDaysInput.value = '';
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        workingDaysInput.value = '';
        return;
    }

    // Check if end date is before start date
    if (end < start) {
        workingDaysInput.value = '';
        Swal.fire({
            ...swalTopConfig,
            icon: 'warning',
            title: 'Invalid Date Range',
            text: 'End date cannot be before start date.',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // Calculate working days (excluding weekends)
    let workingDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
        // Get day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = currentDate.getDay();

        // If it's not Saturday (6) or Sunday (0), count it as a working day
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    workingDaysInput.value = workingDays;
}

// ===============================================
// GLOBAL SWEETALERT CONFIG - ALWAYS ON TOP
// ===============================================
const swalTopConfig = {
    target: document.body,
    backdrop: true,
    allowOutsideClick: false,
    width: '30rem',         // Slightly wider for better proportions
    padding: '0',           // Set to 0 because we will handle spacing via didOpen
    customClass: {
        container: 'sweetalert-top'
    },
    // This function runs the moment the modal opens and applies the styles
    didOpen: (modal) => {
        const icon = modal.querySelector('.swal2-icon');
        const title = modal.querySelector('.swal2-title');
        const content = modal.querySelector('.swal2-html-container');
        const actions = modal.querySelector('.swal2-actions');

        // 1. Pushes the Checkmark/Icon down from the very top
        if (icon) {
            icon.style.marginTop = '3rem';
            icon.style.marginBottom = '1rem';
        }
        // 2. Adds spacing around the "Success" text
        if (title) {
            title.style.margin = '0.5rem 0';
            title.style.fontSize = '2rem';
            title.style.color = '#00247C'; // Maintains your blue theme
        }
        // 3. Pushes the bottom text away from the edge
        if (content) {
            content.style.marginBottom = '2.5rem';
            content.style.fontSize = '1.1rem';
        }
        // 4. Ensures the button (if shown) has breathing room
        if (actions) {
            actions.style.marginTop = '0';
            actions.style.marginBottom = '2rem';
        }
    }
};



// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', function () {
    initializeSidebarNav();
});

/**
 * Initializes the sidebar navigation with tab switching functionality
 * and adds hamburger menu toggle for mobile responsiveness
 */
function initializeSidebarNav() {
    const navItems = document.querySelectorAll('.nav_select[data-tab]');
    const navLogo = document.querySelector('.nav_logo'); // Select the hamburger icon
    const sideNav = document.querySelector('.side_nav'); // Select the sidebar

    // --- NEW CLICK TOGGLE LOGIC ---
    if (navLogo && sideNav) {
        navLogo.addEventListener('click', function () {
            sideNav.classList.toggle('expanded');
            // Redraw Leaflet map after sidebar transition
            setTimeout(function () {
                if (typeof map !== 'undefined' && map) {
                    map.invalidateSize();
                }
            }, 320);
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(e, tabName);
        });
    });

    // Load initial tab
    loadAnalyticsTab();
}

/**
 * Switches between different application tabs and loads appropriate data
 * Handles tab activation and deactivation while maintaining UI state
 * 
 * @param {Event} event - The click event triggering tab switch
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(event, tabName) {
    if (event) event.preventDefault();
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav_select').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabName);
    if (target) target.classList.add('active');

    if (event) {
        const link = event.target.closest('.nav_select');
        if (link) link.classList.add('active');
    }

    // Update this to match your actual tab names
    if (tabName === 'management') {
        loadManagementTable();
    } else if (tabName === 'process') {
        loadProcessTable();
    } else if (tabName === 'summary') {
        loadSummarySelect();
    } else if (tabName === 'dashboard') {
        loadAnalyticsTab();
    }
}

/**
 * Loads the management table with applications from database
 * Serves as the main entry point for the management tab functionality
 */
function loadManagementTable() {
    loadApplicationsFromDB().finally(() => {
        // Also trigger the filter function immediately to populate the table
        filterApplications();
    });
}

/**
 * Filters and renders applications in the management table based on search criteria
 * Handles search term filtering, status filtering, and smart action button generation
 * Displays appropriate status badges and action buttons based on application state
 */
function filterApplications() {
    // 1. GET ELEMENTS - Fixed IDs
    const searchEl = document.getElementById('managementSearch');
    const tbody = document.getElementById('tableBody'); // Direct ID

    // If the table body doesn't exist, stop immediately
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    // 2. GET SEARCH VALUE
    const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';

    // Clear table body
    tbody.innerHTML = '';

    // 3. CHECK IF APPLICATIONS ARE LOADED
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color:#999;">
                    <div class="spinner"></div>Loading applications...
                </td>
            </tr>`;
        return;
    }

    // 4. FILTER LOGIC
    const filtered = applications.filter(app => {
        const natureOfActivity = (app.nature_of_activity || '').toLowerCase();
        const fullName = ((app.first_name || '') + ' ' + (app.last_name || '')).toLowerCase();
        const id = (app.id || '').toString();
        const address = (app.construction_address || '').toLowerCase();

        return natureOfActivity.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            id.includes(searchTerm) ||
            address.includes(searchTerm);
    });

    // 5. RENDER LOGIC
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color:#999;">
                    No matching applications found.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(app => {
        // A. Determine Status Color
        let badgeClass = 'pending';
        if (app.status === 'Approved') badgeClass = 'approved';
        if (app.status === 'Disapproved') badgeClass = 'disapproved';
        if (app.status === 'Paid') badgeClass = 'paid';
        if (app.status === 'For Payment') badgeClass = 'for-payment';

        // B. Determine "Smart Action" Button
        let actionBtn = '';

        if (app.status === 'Pending') {
            actionBtn = `<button class="btn-primary" onclick="openUpdateModal(${app.id})">Process</button>`;
        }
        else if (app.status === 'For Payment') {
            actionBtn = `<button class="btn-warning" onclick="openUpdateModal(${app.id})">Verify Pay</button>`;
        }
        else if (app.status === 'Paid') {
            actionBtn = `<button class="btn-success" onclick="openUpdateModal(${app.id})">Finalize</button>`;
        }
        else if (app.status === 'Approved') {
            actionBtn = `<button class="btn-info" onclick="generateConstructionPermit(${app.id})">Clearance</button>`;
        }
        else {
            actionBtn = `<button class="btn-secondary" onclick="openUpdateModal(${app.id})">Update</button>`;
        }

        // C. Build Row - Match your table headers
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.first_name ?? ''} ${app.middle_name ?? ''} ${app.last_name ?? ''} ${app.suffix ?? ''}</td>
            <td>${app.nature_of_activity || 'N/A'}</td>
            <td>${app.contractor_name || 'N/A'}</td>
            <td>${app.contractor_contact_number || 'N/A'}</td>
            <td>${app.construction_address || 'N/A'}</td>
            <td><span class="status-badge status-${badgeClass}">${app.status}</span></td>
            <td>${app.payment_status || 'Unpaid'}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button class="btn-info" onclick="viewDetails(${app.id})" title="View Details">View</button>
                    <button class="btn-secondary archive-btn" data-id="${app.id}" data-table="construction_applications">Archive</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}
/**
 * Fetches construction applications from the server API
 * Updates the global applications array with retrieved data
 * 
 * @returns {Promise} Promise resolving to the applications array
 */
function loadApplicationsFromDB() {
    return fetch(`${CONSTRUCTION_HANDLER_URL}?action=fetch`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                applications = (data.data || []).filter(app => !app.is_archived);
            }
            return applications;
        })
        .catch(error => {
            console.error('Error fetching applications:', error);
            applications = [];
            return applications;
        });
}

/**
 * Refreshes the currently active tab's content with latest application data.
 * Triggered by WebSocket construction updates.
 * 
 * Uses `isRefreshing` flag to prevent concurrent refreshes.
 * 
 * @see {@link loadApplicationsFromDB} - Fetches fresh data
 */
let isRefreshing = false;
function refreshActiveTab() {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || isRefreshing) return;

    const activeTabId = activeTab.id;
    isRefreshing = true;

    const finish = () => { isRefreshing = false; };

    if (activeTabId === 'management') {
        loadApplicationsFromDB().finally(() => { filterApplications(); finish(); });
    } else if (activeTabId === 'process') {
        loadApplicationsFromDB().finally(() => { loadProcessTable(); finish(); });
    } else if (activeTabId === 'summary') {
        loadApplicationsFromDB().finally(() => { loadSummarySelect(); finish(); });
    } else if (activeTabId === 'dashboard') {
        loadApplicationsFromDB().finally(() => { loadAnalyticsTab(); finish(); });
    } else if (activeTabId === 'archives') {

    } else {
        finish();
    }
}


/**
 * Loads applications into the process table with actionable statuses
 * Filters out excluded statuses and shows appropriate action buttons based on current status
 */
function loadProcessTable() {
    loadApplicationsFromDB().finally(() => {
        const tbody = document.getElementById('processTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const excludedStatuses = ['Cancelled', 'Archived'];

        const actionable = applications.filter(app => {
            return !excludedStatuses.includes(app.status);
        });

        if (actionable.length === 0) {
            // Fixed colspan from 5 to 6 to match the number of <td> elements
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No applications to process.</td></tr>';
            return;
        }

        actionable.forEach(app => {
            let btnText = "Update";
            let btnClass = "secondary";
            let buttonsHtml = "";

            // 1. Determine primary action button based on status
            if (app.status === 'Pending') {
                btnClass = "primary";
            } else if (app.status === 'Complied') {
                btnText = "Finalize Approval";
                btnClass = "success";
            } else if (app.status === 'Approved' || app.status === 'Completed') {
                btnText = "View Details";
                btnClass = "info";
            }

            // 2. Build the primary update/action button
            buttonsHtml += `<button class="btn-${btnClass}" onclick="openUpdateModal(${app.id})">${btnText}</button>`;

            // 3. Conditionally add the "Clearance" button for valid statuses
            // Add or remove statuses in this array based on your specific workflow
            if (['Complied', 'Approved', 'Completed'].includes(app.status)) {
                buttonsHtml += `
                    <button class="btn-primary" onclick="generateConstructionPermit(${app.id})" style="margin-left: 5px;">
                        Clearance
                    </button>
                `;
            }

            // 4. Inject into the table row
            tbody.innerHTML += `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.nature_of_work || 'N/A'}</td>
                    <td>${app.first_name ?? ''} ${app.middle_name ?? ''} ${app.last_name ?? ''} ${app.suffix ?? ''}</td>
                    <td>${app.provider}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
                    <td>${buttonsHtml}</td>
                </tr>
            `;
        });
    });
}

// Generate Construction Clearance Function
function generateConstructionPermit(appId) {
    // 1. Check if 'applications' exists to prevent crash
    if (typeof applications === 'undefined') {
        console.error("The 'applications' array is not defined.");
        return;
    }

    const app = applications.find(a => a.id == appId);

    if (!app) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Not Found',
                text: `Application data not found for ID: ${appId}`
            });
        } else {
            alert(`Application data not found for ID: ${appId}`);
        }
        return;
    }

    const grantee_name = `${app.first_name || ''} ${app.middle_name || ''} ${app.last_name || ''}`.trim() || "N/A";
    const address = app.construction_address || 'N/A'; // Fixed here
    const contractorName = app.contractor_name || 'N/A';
    const or_number = app.or_number || 'N/A';

    // Uses the helper function defined above
    const date_issued = app.payment_date || app.application_date || getCurrentDateString();

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d) ? "N/A" : d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    };

    const validityStart = formatDate(app.start_date); // Fixed here
    const validityEnd = formatDate(app.end_date);     // Fixed here //Conditional with the extra days if needed: app.end_date ? formatDate(app.end_date) : "N/A";

    const currentYear = new Date().getFullYear();
    const permitNumber = `BRB-CP-${currentYear}-${String(app.id).padStart(4, '0')}`;
    const date = new Date(date_issued);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const yearIssued = date.getFullYear();

    const CAPTAIN_NAME = "SESSAN CASTRO-LEE";
    const SECRETARY_NAME = "ROVIE ROSE B. BAYLON";

    const KAGAWAD_1 = "KATHERINE T. DE JESUS";
    const KAGAWAD_2 = "MARGARETTE K. DE JESUS";
    const KAGAWAD_3 = "ANA FRANCESCA L. MARISTELA";
    const KAGAWAD_4 = "AUGUSTO D. ILAGAN";
    const KAGAWAD_5 = "NATALIA L. MARISTELA";
    const KAGAWAD_6 = "MODESTO CARLO M. RUIZ JR.";

    const nature = (app.nature_of_activity || '').toLowerCase();
    const isMajor = nature.includes('major') ? 'checked' : '';
    const isMinor = nature.includes('minor') ? 'checked' : '';
    const isRepair = nature.includes('repair') ? 'checked' : '';
    const isDemolition = nature.includes('demolition') ? 'checked' : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Construction Clearance - ${grantee_name}</title>
        <style>
            body { font-family: "Times New Roman", serif; margin:0; padding:20px; background:#f4f4f4; }
            .document-container { width: 8.5in; min-height: 11in; margin:0 auto; background:white; padding:45px 50px; box-shadow:0 0 20px rgba(0,0,0,0.1); position:relative; }
            header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
            .logo img { width:105px; }
            .header-center { text-align:center; flex:1; padding:0 20px; }
            .header-center h1 { font-size:23px; margin:6px 0 3px; text-transform:uppercase; letter-spacing:1px; }
            .header-center h2 { font-size:15px; margin:0; font-weight:bold; }
            .clearance-no { text-align:right; font-size:13.5px; font-weight:bold; }
            .doc-title { text-align:center; font-size:27px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin:35px 0 40px 0; }
            .content-wrapper { display:grid; grid-template-columns:235px 1fr; gap:35px; }
            .sidebar { background:#b8bad9; padding:20px 18px; border:1.5px solid #b8bad9; font-size:13px; line-height:1.65; }
            .main-body { font-size:15.2px; line-height:1.75; }
            .fill-line { border-bottom:1px solid #000; display:inline-block; min-width:200px; text-align:center; font-weight: bold; }
            .checkbox-group { margin:10px 0 10px 40px; display: grid; grid-template-columns: 1fr 1fr; }
            .checkbox-option { margin:5px 0; font-weight:600; text-transform: uppercase; }
            .checkbox-option::before { content:"☐ "; }
            .checkbox-option.checked::before { content:"☑ "; }
            .validity-box { border: 1.5px solid #000; padding: 10px; margin: 15px 0; background: #fafafa; }
            .signature-area { margin-top:70px; display:flex; justify-content:space-between; }
            .signature-block { width:46%; text-align:center; }
            .signature-line { border-bottom:1px solid black; margin:8px auto 4px auto; width:90%; padding-top:25px; font-weight:bold; text-transform:uppercase; }
            .seal-note { text-align:center; margin-top:55px; font-size:12.8px; font-style:italic; color:#222; }
            @media print { body { background:white; padding:0; } .document-container { box-shadow:none; padding:40px 48px; } }
        </style>
    </head>
    <body>
        <div class="document-container">
            <header>
                <div class="logo"><img class="logo" src="../../../img/banwalogo.png" alt="BANWA Logo"></div>
                <div class="header-center">
                    <div>Republic of the Philippines</div>
                    <div>Quezon City • District III</div>
                    <h1>BARANGAY BLUE RIDGE B</h1>
                    <h2>OFFICE OF THE PUNONG BARANGAY</h2>
                </div>
                <div class="clearance-no">Permit No.<br><span style="font-size:15.5px;">${permitNumber}</span></div>
            </header>

            <div class="doc-title">Construction Clearance</div>

            <div class="content-wrapper">
                <div class="sidebar">
                    <strong>HON. ${CAPTAIN_NAME}</strong><br><span>Punong Barangay</span><br><br>
                    <strong>KAGAWADS</strong>
                    <br>HON. ${KAGAWAD_1}<br>HON. ${KAGAWAD_2}<br>HON. ${KAGAWAD_3}<br>HON. ${KAGAWAD_4}<br>HON. ${KAGAWAD_5}<br>HON. ${KAGAWAD_6}<br><br>
                    <strong>MR. ${SECRETARY_NAME}</strong><br><span>Barangay Secretary</span>
                </div>

                <div class="main-body">
                    <strong>TO WHOM IT MAY CONCERN:</strong><br><br>
                    <p>Permission is granted to <span class="fill-line">${grantee_name}</span> for construction works at <span class="fill-line">${address}</span>.</p>
                    <p>Contractor: <span class="fill-line">${contractorName}</span></p>

                    <strong>Scope of Works:</strong>
                    <div class="checkbox-group">
                        <div class="checkbox-option ${isMajor}">MAJOR</div><div class="checkbox-option ${isRepair}">REPAIR</div>
                        <div class="checkbox-option ${isMinor}">MINOR</div><div class="checkbox-option ${isDemolition}">DEMOLITION</div>
                    </div>

                    <div class="validity-box">
                        <strong>VALIDITY PERIOD:</strong><br>
                        This permit is valid from <strong>${validityStart}</strong> until <strong>${validityEnd}</strong>. Any extension requires a new application.
                    </div>

                    <div style="text-align:center; margin-top:25px;">
                        Issued this <span class="fill-line" style="min-width:40px;">${day}</span> day of <span class="fill-line" style="min-width:100px;">${month}</span>, ${yearIssued}.
                    </div>

                    <div style="margin-top:20px;">
                        OR No.: <span class="fill-line" style="min-width:150px;">${or_number}</span>
                    </div>
                </div>
            </div>

            <div class="signature-area">
                <div class="signature-block">
                    <div>Attested by:</div><div class="signature-line">${SECRETARY_NAME}</div><div>Barangay Secretary</div>
                </div>
                <div class="signature-block">
                    <div>Approved by:</div><div class="signature-line">${CAPTAIN_NAME}</div><div>Punong Barangay</div>
                </div>
            </div>
            <div class="seal-note">*** THIS DOCUMENT IS NOT VALID WITHOUT THE OFFICIAL DRY SEAL ***</div>
        </div>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();

    // This triggers the print dialog as soon as the content is loaded
    w.focus(); // Necessary for some browsers to focus the print dialog

    // Use a slight timeout to ensure styles and images (like your logo) are rendered
    setTimeout(() => {
        w.print();

        // Optional: Uncomment the line below if you want the window to close 
        // automatically after the user clicks 'Print' or 'Cancel'
        // w.close(); 
    }, 500);
}

// Ensure global scope (Alias both names just in case)
window.generateConstructionPermit = generateConstructionPermit;
window.generateConstructionClearance = generateConstructionPermit;

let chart1Instance;
let chart2Instance;
let chart3Instance;

/**
 * Loads analytics data and renders charts for construction application statistics
 * Creates three charts: timeline chart, construction type distribution, and DSS status distribution
 */
function loadAnalyticsTab() {
    fetch(`${CONSTRUCTION_HANDLER_URL}?action=chart_construction_type`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.application_date);
            const values1 = res.data_by_date.map(x => x.total);
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_type.map(x => x.nature_of_activity);
            const values2 = res.data_by_type.map(x => x.total);
            const totals2 = values2.slice();
            const percentages2 = res.data_by_type.map(x => x.percentage);

            const labels3 = res.data_by_dss.map(x => x.dss_status);
            const totals3 = res.data_by_dss.map(x => x.total);
            const percentages3 = res.data_by_dss.map(x => x.percentage);

            const dateColors = ['#4F46E5', '#2563EB', '#0284C7', '#0891B2', '#0D9488', '#14B8A6'];
            const typeColors = ['#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#84CC16'];
            const dssColors = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'];

            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();
            if (chart3Instance) chart3Instance.destroy();

            chart1Instance = new Chart(document.getElementById('chart1'), {
                type: 'line',
                data: {
                    labels: labels1,
                    datasets: [{
                        label: 'Construction Applications',
                        data: values1,
                        backgroundColor: dateColors,
                        borderWidth: 2,
                        tension: 0.4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals1[context.dataIndex];
                                    const percent = percentages1[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });

            chart2Instance = new Chart(document.getElementById('chart2'), {
                type: 'bar',
                data: {
                    labels: labels2,
                    datasets: [{
                        label: 'Construction Types',
                        data: values2,
                        backgroundColor: typeColors,
                        borderWidth: 1,
                        borderRadius: '4',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals2[context.dataIndex];
                                    const percent = percentages2[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });

            chart3Instance = new Chart(document.getElementById('chart3'), {
                type: 'doughnut',
                data: {
                    labels: labels3,
                    datasets: [{
                        label: 'DST Status Distribution',
                        data: totals3,
                        backgroundColor: dssColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            align: 'center'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = totals3[context.dataIndex];
                                    const percent = percentages3[context.dataIndex];
                                    return `${context.label}: ${total} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading analytics:', error);
        });
}

/**
 * Applies pre-defined text prompts to the update comments textarea
 * Used for quick insertion of common status update messages
 * 
 * @param {string} text - The text prompt to insert into the comments field
 */
function applyPrompt(text) {
    const textarea = document.getElementById('updateComments');
    if (textarea) {
        textarea.value = text;
        textarea.focus();
    }
}

/**
 * Opens the update modal for a specific application and loads current data
 * Includes Evaluation Results display and status tracking
 * 
 * @param {number} appId - The application ID to open in the update modal
 */
function openUpdateModal(appId) {
    // Find the specific application from our global array
    const app = applications.find(a => a.id == appId);

    if (!app) {
        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Not Found', text: 'Application data not found.' });
        return;
    }

    // Fill the hidden ID field and the visible "Current Status" text
    document.getElementById('updateAppId').value = app.id;
    document.getElementById('displayCurrentStatus').value = app.status;

    // Reset the form fields
    document.getElementById('newStatus').value = "";
    document.getElementById('updateComments').value = "";
    document.getElementById('assessmentAmount').value = "";
    document.getElementById('amountFieldGroup').classList.add('hidden');

    // Clear previous DSS content
    const existingDSSSection = document.getElementById('dssEvaluationSection');
    if (existingDSSSection) existingDSSSection.remove();

    // Insert a basic/loading DSS section immediately
    addBasicDSSSection(app);

    // Fetch DSS evaluation details and replace basic section when available
    fetchDSSEvaluation(appId, app);

    // Show the modal
    document.getElementById('updateModal').classList.add('active');
}

/**
 * Fetches DSS evaluation details from the server for a specific application
 * Handles both successful and failed fetch scenarios
 * 
 * @param {number} appId - The application ID to fetch evaluation for
 * @param {Object} app - The application object containing basic application data
 */
function fetchDSSEvaluation(appId, app) {
    // console.debug('fetchDSSEvaluation ->', CONSTRUCTION_HANDLER_URL, appId);
    fetch(`${CONSTRUCTION_HANDLER_URL}?action=get_evaluation&application_id=${encodeURIComponent(appId)}`, {
        cache: 'no-store',
        credentials: 'include'
    })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            // console.debug('DSS response for', appId, data);
            const existing = document.getElementById('dssEvaluationSection');
            if (data && data.status === 'success' && data.evaluation) {
                if (existing) existing.remove();
                addDSSSectionToModal(data.evaluation, app);
            } else {
                if (existing) existing.querySelector('.dss-loading')?.remove();
                const msg = (data && data.message) ? data.message : 'Detailed evaluation not available.';
                if (existing) {
                    const note = document.createElement('div');
                    note.className = 'dss-error-msg';
                    note.textContent = msg;
                    existing.appendChild(note);
                } else {
                    addBasicDSSSection(app);
                    const created = document.getElementById('dssEvaluationSection');
                    if (created) {
                        const note = document.createElement('div');
                        note.className = 'dss-error-msg';
                        note.textContent = msg;
                        created.appendChild(note);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching DSS evaluation:', error);
            const existing = document.getElementById('dssEvaluationSection');
            if (existing) existing.querySelector('.dss-loading')?.remove();
            const errMsg = error && error.message ? error.message : 'Failed to load evaluation.';
            if (existing) {
                const note = document.createElement('div');
                note.className = 'dss-error-msg';
                note.textContent = errMsg;
                existing.appendChild(note);
            } else {
                addBasicDSSSection(app);
                const created = document.getElementById('dssEvaluationSection');
                if (created) {
                    const note = document.createElement('div');
                    note.className = 'dss-error-msg';
                    note.textContent = errMsg;
                    created.appendChild(note);
                }
            }
        });
}

/**
 * Creates and inserts a detailed DSS evaluation section into the update modal
 * Displays evaluation scores, status, rule results, and recommendations
 * 
 * @param {Object} evaluation - The DSS evaluation data object
 * @param {Object} app - The application object for context
 */
function addDSSSectionToModal(evaluation, app) {
    const updateForm = document.getElementById('updateForm');

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const details = evaluation.evaluation_details || {};
    const dssStatus = evaluation.dss_status || 'Pending Evaluation';
    const score = details.score || 0;
    const maxScore = details.max_score || 6;
    const probability = typeof details.approval_probability === 'number' ? details.approval_probability : (parseFloat(details.approval_probability) || 0);
    const passedRules = details.passed_rules || [];
    const failedRules = details.failed_rules || [];
    const recommendations = details.recommendations || [];

    let statusColor, statusBg;
    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
    }

    dssSection.innerHTML = `
    <div class="dss-evaluation-section">
        <div class="dss-header">
            <h3>Evaluation Result</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg}; padding: 8px 12px;">
                ${dssStatus}
            </span>
        </div>
        
        <div class="dss-score-summary">
            <div class="dss-score">
                <strong>Score</strong>
                <span>${score}/${maxScore}</span>
            </div>
            <div class="dss-probability">
                <strong>Approval Probability</strong>
                <span>${probability.toFixed(2)}%</span>
            </div>
        </div>
        
        <div class="dss-progress-container">
            <div class="dss-progress-label">
                <span>Approval Progress</span>
                <span class="dss-progress-percentage">${probability}%</span>
            </div>
            <div class="dss-progress-bar">
                <div class="dss-progress-fill" style="width: ${Math.max(0, Math.min(100, probability))}%"></div>
            </div>
        </div>
        
        <div class="dss-rules-summary">
            <div class="dss-rules-column">
                <h4>Passed Rules (${passedRules.length})</h4>
                ${passedRules.length > 0 ?
            `<ul class="dss-rules-list passed">${passedRules.map(rule => `<li>${rule}</li>`).join('')}</ul>` :
            `<p style="color:#999; font-size:13px; margin:0; padding:8px 0;">No rules passed</p>`
        }
            </div>
            
            <div class="dss-rules-column">
                <h4>Failed Rules (${failedRules.length})</h4>
                ${failedRules.length > 0 ?
            `<ul class="dss-rules-list failed">${failedRules.map(rule => `<li>${rule}</li>`).join('')}</ul>` :
            `<p style="color:#999; font-size:13px; margin:0; padding:8px 0;">No rules failed</p>`
        }
            </div>
        </div>
        
        ${recommendations.length > 0 ? `
            <div class="dss-recommendations">
                <h4>Recommendations</h4>
                <ul class="dss-recommendations-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${evaluation.evaluated_at ? `
            <div class="dss-timestamp">
                Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
            </div>
        ` : ''}
    </div>
`;

    updateForm.insertBefore(dssSection, updateForm.firstChild);
}

/**
 * Creates a basic DSS section when detailed evaluation data is unavailable
 * Provides minimal DSS status display as fallback
 * 
 * @param {Object} app - The application object containing basic DSS status
 */
function addBasicDSSSection(app) {
    const updateForm = document.getElementById('updateForm');

    const dssSection = document.createElement('div');
    dssSection.id = 'dssEvaluationSection';
    dssSection.className = 'dss-evaluation-section';

    const dssStatus = app.dss_status || 'Pending Evaluation';
    let statusColor, statusBg;

    switch (dssStatus) {
        case 'Pre-Approved':
            statusColor = '#155724';
            statusBg = '#d4edda';
            break;
        case 'Additional Requirements Needed':
            statusColor = '#856404';
            statusBg = '#fff3cd';
            break;
        case 'Rejected':
            statusColor = '#721c24';
            statusBg = '#f8d7da';
            break;
        default:
            statusColor = '#0c5460';
            statusBg = '#d1ecf1';
    }

    dssSection.innerHTML = `
        <div class="dss-header">
            <h3>DSS Evaluation</h3>
            <span class="dss-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${dssStatus}
            </span>
        </div>
        <p class="dss-loading">Loading detailed evaluation...</p>
    `;

    updateForm.insertBefore(dssSection, updateForm.firstChild);
}

/**
 * Toggles visibility of the payment amount field based on status selection
 * Only shows amount field when "For Payment" status is selected
 */
function toggleAmountField() {
    const statusSelect = document.getElementById('newStatus');
    const amountGroup = document.getElementById('amountFieldGroup');
    const amountInput = document.getElementById('assessmentAmount');

    // Only show the payment amount field if "For Payment" is selected
    if (statusSelect.value === 'For Payment') {
        amountGroup.classList.remove('hidden');
        amountInput.setAttribute('required', 'required');
    } else {
        amountGroup.classList.add('hidden');
        amountInput.removeAttribute('required');
    }
}

/**
 * Submits application status update to the server via API
 * Handles form data submission and displays success/error messages
 * 
 * @param {Event} event - The form submission event
 */
function submitUpdate(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('updateForm'));
    formData.append('action', 'update_status');

    fetch(`${CONSTRUCTION_HANDLER_URL}`, { method: 'POST', body: formData, credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                //Closes Update Button after successful update
                document.getElementById('updateModal').classList.remove('active');
                document.body.style.overflow = 'auto';
                Swal.fire({
                    ...swalTopConfig,
                    icon: 'success',
                    title: 'Success',
                    text: 'Application updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });

                loadManagementTable();
                loadProcessTable();
                try { new BroadcastChannel('barangay_status_update').postMessage('status_update'); } catch (e) { }
            } else {
                Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Update Failed', text: data.message || 'An unknown error occurred.' });
            }
        })
        .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error', text: 'Please check your connection.' }));
}

/**
 * Displays detailed application information in a modal view.
 * Fetches fresh data and renders styled document previews and OCR result lists.
 * @param {number} appId - The application ID to view details for
 */
async function viewDetails(appId) {
    // 1. Show modal with loading state immediately
    openModal('detailsModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 15px; color: #666; font-weight: 500;">Loading application details and OCR results...</p>
        </div>`;

    try {
        // 2. Fetch the specific details from the server
        const response = await fetch(`${CONSTRUCTION_HANDLER_URL}?action=get_application_details&application_id=${appId}`, { credentials: 'include' });
        const data = await response.json();

        if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch details');

        const app = data.application;

        // === 3. AGGRESSIVE FILE EXTRACTION ===
        // Merged logic to handle all possible formats from the DB
        let files = [];
        const possibleFields = [app.requirement_upload_json, app.requirement_upload, app.documents, app.files];

        for (let field of possibleFields) {
            if (!field) continue;
            if (Array.isArray(field)) {
                files = field;
                break;
            }
            if (typeof field === 'string' && field.trim() !== '') {
                try {
                    const parsed = JSON.parse(field);
                    files = Array.isArray(parsed) ? parsed : [parsed];
                    break;
                } catch (e) {
                    // Fallback if it's just a single filename string
                    if (field.includes('.')) {
                        files = [{ filename: field }];
                        break;
                    }
                }
            }
        }

        const ocrRuns = Array.isArray(app.ocr_results) ? app.ocr_results : [];
        const constructionAddress = app.construction_address || 'Not specified';

        // Status Styling
        let statusColor = '#6c757d', statusBg = '#e2e3e5';
        switch (app.status) {
            case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
            case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
            case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
            case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
        }

        // === 4. GENERATE DOCUMENTS HTML ===
        let documentsHtml = '';
        if (files.length > 0) {
            documentsHtml = files.map(file => {
                const fileName = file.filename || file.name || "Document";
                const ext = fileName.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
                const isPdf = ext === 'pdf';
                const url = file.file_url || (UPLOADS_BASE_PATH + fileName);

                let previewContent = '';
                if (isImage) {
                    // Integrated the 'onerror' fallback here
                    previewContent = `
                        <img src="${url}" alt="Preview" style="width:100%; height:160px; object-fit:contain; background:#e9ecef; border-radius:4px; border:1px solid #dee2e6; cursor:pointer;" 
                             onclick="window.open('${url}')"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'height:160px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;\'><i class=\'fas fa-image-slash fa-3x\' style=\'color:#adb5bd;\'></i><span style=\'font-size:11px; color:#999; margin-top:5px;\'>Image Not Found</span></div>';">`;
                } else if (isPdf) {
                    previewContent = `<div style="height:160px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;"><i class="fas fa-file-pdf fa-4x" style="color:#dc3545;"></i><span style="font-size:12px; margin-top:5px; color:#666;">PDF Document</span></div>`;
                } else {
                    previewContent = `<div style="height:160px; display:flex; justify-content:center; align-items:center; background:#f4f4f4; border-radius:4px; border:1px solid #dee2e6;"><i class="fas fa-file-alt fa-4x" style="color:#6c757d;"></i></div>`;
                }

                return `
                    <div style="background:#f8f9fa; border:1px dashed #ced4da; padding:15px; border-radius:8px; margin-bottom:20px; text-align:center;">
                        <h4 style="margin:0 0 10px 0; color:#19316b; font-size:14px; overflow-wrap: break-word;">${fileName}</h4>
                        <div style="margin-bottom:12px;">${previewContent}</div>
                        <a href="${url}" target="_blank" class="btn-primary" style="display:inline-block; padding:8px 20px; text-decoration:none; font-size:13px; border-radius:4px; background-color: #19316b; color: white;">
                            <i class="fas fa-expand"></i> View Full File
                        </a>
                    </div>`;
            }).join('');
        } else {
            documentsHtml = `<div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ccc;">No documents uploaded yet.</div>`;
        }

        // === 5. GENERATE OCR RESULTS HTML ===
        let ocrHtml = `<h3 style="color: #777; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px;">OCR RESULTS (${ocrRuns.length} RUNS)</h3>`;

        if (ocrRuns.length > 0) {
            // FIX: Added overflow-x: hidden to prevent container breaking
            ocrHtml += `<div style="max-height: 400px; overflow-y: auto; overflow-x: hidden; padding-right: 5px;">`;
            ocrHtml += ocrRuns.map((run, idx) => {
                const isLatest = idx === 0;
                const runDate = new Date(run.created_at).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                });

                let parsedOCR = { text: 'No text content', detected: [] };
                try {
                    parsedOCR = typeof run.ocr_result === 'string' ? JSON.parse(run.ocr_result) : run.ocr_result || {};
                } catch (e) { }

                return `
                    <details ${isLatest ? 'open' : ''} style="margin-bottom: 10px; border: 1px solid ${isLatest ? '#bbdefb' : '#e9ecef'}; border-radius: 6px; background:${isLatest ? '#f0f7ff' : '#f8f9fa'}; overflow:hidden;">
                        <summary style="padding: 12px 15px; cursor: pointer; font-size: 13px; font-weight: 600; outline: none; display: flex; align-items: center; overflow-wrap: break-word; word-break: break-word;">
                            <i class="fas fa-play" style="font-size: 10px; margin-right: 10px; color: ${isLatest ? '#1976d2' : '#999'};"></i>
                            Run: ${runDate} ${isLatest ? '<span style="color:#1976d2; margin-left:8px;">(Latest)</span>' : ''}
                        </summary>
                        <div style="padding: 15px; background: #fff; border-top: 1px solid #eee; font-size: 13px;">
                            <div style="margin-bottom:8px;"><strong>File:</strong> <a href="${run.file_url}" target="_blank" style="color:#1976d2;">${run.filename || 'View Source'}</a></div>
                            <div style="margin-bottom:8px;"><strong>Detected:</strong> <span style="color:#28a745;">${(parsedOCR.detected || []).join(', ') || 'None'}</span></div>
                            <div style="background:#2c3e50; color:#ecf0f1; padding:12px; border-radius:4px; font-family:monospace; white-space:pre-wrap; max-height:150px; overflow-y:auto; word-break: break-word;">${parsedOCR.text}</div>
                        </div>
                    </details>`;
            }).join('');
            ocrHtml += `</div>`;
        } else {
            ocrHtml += `<div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">No OCR runs found.</div>`;
        }

        ocrHtml += `
            <div style="margin-top: 15px; text-align: right;">
                <button class="btn-secondary" onclick="reRunOCR(${app.id})" style="padding: 8px 16px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Re-run OCR Analysis
                </button>
            </div>`;

        // === 6. FINAL HTML ASSEMBLY ===
        modalBody.innerHTML = `
            <div class="details-container" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="details-header-card" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div class="details-title">
                        <h2 style="margin: 0; color: #19316b;">${app.nature_of_activity || 'Application'}</h2>
                        <div class="details-id" style="color: #777; font-size: 14px;">Application ID: #${app.id}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:${statusBg}; color:${statusColor}; padding:6px 12px; border-radius:20px; font-weight:bold; text-transform:uppercase; font-size:12px;">
                            ${app.status}
                        </span>
                        <div style="font-size:12px; color:#666; margin-top:5px;">Date: ${app.application_date || app.created_at}</div>
                    </div>
                </div>

                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="col-left" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h3 style="margin-top:0; color: #19316b; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Construction Information</h3>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Nature:</span> <span>${app.nature_of_activity}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Contractor:</span> <span>${app.contractor_name || 'N/A'}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Type of Work:</span> <span>${app.type_of_work}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Address:</span> <span>${constructionAddress}</span></div>
                        </div>

                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h3 style="margin-top:0; color: #19316b; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Owner Details</h3>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Name:</span> <span>${app.first_name} ${app.middle_name || ''} ${app.last_name}  ${app.suffix || ''}</span></div>
                            <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Contact:</span> <span>${app.contact_no_owner}</span></div>
                        </div>

                        <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h2 style="margin-top: 0; color: #555; font-size: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; text-transform:uppercase;">Documents & Files</h2>
                            ${documentsHtml}
                        </div>
                    </div>

                    <div class="col-right" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            ${ocrHtml}
                        </div>

                        <div class="detail-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #17a2b8;">
                            <h3 style="margin-top:0; font-size:16px;">Assessment</h3>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size:14px;"><span style="font-weight: 600; color: #555;">Amount Due:</span> <span style="color:#0c5460; font-weight:bold;">₱${app.amount_due || '0.00'}</span></div>
                            <div style="display: flex; justify-content: space-between; font-size:14px;"><span style="font-weight: 600; color: #555;">Payment Status:</span> <span>${app.payment_status || 'Unpaid'}</span></div>
                        </div>
                    </div>
                </div>
            </div>`;

    } catch (error) {
        console.error('View Details Error:', error);
        modalBody.innerHTML = `<div style="text-align:center; padding:40px;"><p style="color:red;">${error.message}</p></div>`;
    }
}


/**
 * Loads application options into the summary select dropdown
 * Populates the dropdown with application IDs and construction activities
 */
function loadSummarySelect() {
    loadApplicationsFromDB().finally(() => {
        const select = document.getElementById('summaryApplicationSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Application --</option>';
        applications.forEach(app => {
            select.innerHTML += `<option value="${app.id}">ID: ${app.id} - ${app.nature_of_activity}</option>`;
        });
    });
}

/**
 * Updates the summary display with detailed application information
 * Generates a professional report view with formatted data and action buttons
 */
function updateSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    const summaryOutput = document.getElementById('summaryOutput');

    if (!appId) {
        summaryOutput.innerHTML = `
            <div class="placeholder-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Select a construction application from the list above to view the full report.</p>
            </div>`;
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // Get Status Colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Parse Requirements Checklist
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')
        : '<li style="background:#fff3cd; color:#856404;">No checklist items logged</li>';

    // Parse Uploaded File
    let firstUploaded = null;
    if (app.requirement_upload_json) {
        if (Array.isArray(app.requirement_upload_json) && app.requirement_upload_json.length) firstUploaded = app.requirement_upload_json[0];
        else {
            try { const parsed = JSON.parse(app.requirement_upload_json); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; } catch (e) { }
        }
    }
    if (!firstUploaded && app.requirement_upload) {
        try { const parsed = JSON.parse(app.requirement_upload); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; else firstUploaded = app.requirement_upload; } catch (e) { firstUploaded = app.requirement_upload; }
    }

    const fileUploadText = firstUploaded
        ? `<div style="margin-top: 10px; font-size: 14px;"><span class="info-label" style="display:inline;">Uploaded File:</span> <a href="${UPLOADS_BASE_PATH}${firstUploaded}" target="_blank" style="color:#00247C; text-decoration: underline; font-weight: 500;">View Document</a></div>`
        : '<div style="margin-top: 10px; font-size: 14px; color:#666;"><span class="info-label" style="display:inline;">Uploaded File:</span> No file uploaded</div>';

    // Format Dates and Financials
    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due
        ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : '₱0.00';

    const paymentStatus = app.payment_status || 'Unpaid';
    const constructionAddress = app.construction_address || 'Not specified';

    // Generate On-Screen HTML
    summaryOutput.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Construction Clearance Profile</h1>
                <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
            </div>
            <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                ${app.status}
            </div>
        </div>

        <div class="report-grid">
            <div class="report-column">
                <div class="report-section">
                    <h3>Construction Details</h3>
                    <div class="info-row"><span class="info-label">Activity</span> <span class="info-value">${app.nature_of_activity}</span></div>
                    <div class="info-row"><span class="info-label">Type of Work</span> <span class="info-value">${app.type_of_work}</span></div>
                    <div class="info-row"><span class="info-label">Address</span> <span class="info-value" style="max-width: 200px; text-align:right;">${constructionAddress}</span></div>
                    <div class="info-row"><span class="info-label">Work Details</span> <span class="info-value">${app.details_of_work || 'N/A'}</span></div>
                </div>

                <div class="report-section">
                    <h3>Ownership</h3>
                    <div class="info-row"><span class="info-label">Owner Name</span> <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name} ${app.suffix || ''}</span></div>
                    <div class="info-row"><span class="info-label">Contact</span> <span class="info-value">${app.contact_no_owner}</span></div>
                    <div class="info-row"><span class="info-label">Owner Address</span> <span class="info-value">${app.address_owner}</span></div>
                </div>
            </div>

            <div class="report-column">
                <div class="report-section">
                    <h3>Schedule & Workforce</h3>
                    <div class="info-row"><span class="info-label">Timeline</span> <span class="info-value">${app.start_date} to ${app.end_date}</span></div>
                    <div class="info-row"><span class="info-label">Working Days</span> <span class="info-value">${app.number_of_working_days}</span></div>
                    <div class="info-row"><span class="info-label">Workers</span> <span class="info-value">${app.number_of_workers}</span></div>
                    <div style="margin-top:15px;">
                        <span class="info-label" style="display:block; margin-bottom:5px;">Submitted Requirements:</span>
                        <ul class="doc-list">${requirementsHtml}</ul>
                        ${fileUploadText}
                    </div>
                </div>

                <div class="financial-box">
                    <h3 style="border:none; margin:0 0 10px 0;">Financial Status</h3>
                    <div class="info-row"><span class="info-label">Payment Status</span> <span class="info-value">${paymentStatus}</span></div>
                    <div class="info-row"><span class="info-label">OR Number</span> <span class="info-value">${app.or_number || '--'}</span></div>
                    <div class="financial-total">
                        <span>Total Assessment</span>
                        <span>${amountDue}</span>
                    </div>
                </div>
            </div>
        </div>

        ${app.approval_comments ? `
        <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
            <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
            <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
        </div>` : ''}

        <div class="report-actions">
            <button class="btn-secondary" onclick="downloadSummary(${app.id})"><i class="fas fa-download"></i> Download</button>
            <button class="btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print</button>
        </div>
    `;
}

/**
 * Archives an application by sending a request to the server
 * Requires user confirmation before proceeding with archival
 * 
 * @param {number} appId - The application ID to archive
 */
function archiveApplication(appId) {
    Swal.fire({
        ...swalTopConfig,
        title: 'Are you sure?',
        text: "You want to archive this application? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, archive it!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${CONSTRUCTION_HANDLER_URL}?action=archive&id=${appId}`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            ...swalTopConfig,
                            title: 'Archived!',
                            text: 'Application has been archived successfully.',
                            icon: 'success',
                            timer: 2500,
                            showConfirmButton: false
                        });
                        loadManagementTable();
                    } else {
                        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Error', text: data.message || 'Failed to archive.' });
                    }
                })
                .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error' }));
        }
    });
}
// function archiveApplication(appId) {
//     Swal.fire({
//         title: 'Are you sure?',
//         text: "You want to archive this application? This action cannot be undone.",
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#d33',
//         cancelButtonColor: '#3085d6',
//         confirmButtonText: 'Yes, archive it!'
//     }).then((result) => {
//         if (result.isConfirmed) {
//             fetch(`${CONSTRUCTION_HANDLER_URL}?action=archive&id=${appId}`)
//                 .then(res => res.json())
//                 .then(data => {
//                     if (data.status === 'success') {
//                         Swal.fire({
//                             title: 'Archived!',
//                             text: 'Application has been archived successfully.',
//                             icon: 'success',
//                             timer: 2500
//                         });
//                         loadManagementTable();
//                     } else {
//                         Swal.fire('Error', data.message || 'Failed to archive.', 'error');
//                     }
//                 })
//                 .catch(err => {
//                     console.error('Archive error:', err);
//                     Swal.fire('Error', 'Network error occurred.', 'error');
//                 });
//         }
//     });
// }

/**
 * Opens a modal dialog by adding the 'active' class
 * Disables body scrolling to prevent background interaction
 * 
 * @param {string} modalId - The ID of the modal element to open
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}


/**
 * Closes a modal dialog by removing the 'active' class
 * Restores body scrolling to allow background interaction**/
document.addEventListener('click', function (e) {
    // X buttons
    if (e.target.classList.contains('close-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Cancel buttons
    if (e.target.classList.contains('cancel-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ESC key support
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

/**
 * Displays a temporary alert message to the user
 * Supports different alert types (success, danger, etc.) with automatic dismissal
 * 
 * @param {string} message - The alert message to display
 * @param {string} type - The alert type (success, danger, warning, info)
 */
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} active`;
    alertDiv.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('active');
    }, 4000);
}


/**
 * Prints the current summary report to a new window
 * Creates a print-friendly version of the summary content with proper structure
 */
function printSummary() {
    const appId = document.getElementById('summaryApplicationSelect').value;
    if (!appId) {
        Swal.fire({ ...swalTopConfig, icon: 'warning', title: 'No Application Selected', text: 'Please select an application to print.' });
        return;
    }

    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // Get status colors
    let statusColor = '#6c757d';
    let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    // Parse requirements
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')
        : '<li style="background:#fff3cd; color:#856404;">No documents logged</li>';

    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due
        ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        : '₱0.00';

    const paymentStatus = app.payment_status || 'Unpaid';

    // Create print-specific HTML
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Construction Application Summary - #${app.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="../../../styles/staff/construction_staff/construction.css">
            <style>
                /* Set half-inch margins for the printed page */
                @media print {
                    @page { margin: 0.5in; }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="report-header">
                    <div class="report-title">
                        <h1>Construction Clearance Profile</h1>
                        <div class="report-meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </div>
                    <div class="report-status-badge" style="color: ${statusColor}; background: ${statusBg};">
                        ${app.status}
                    </div>
                </div>

                <div class="report-grid">
                    <div class="report-column">
                        <div class="report-section">
                            <h3>Construction Details</h3>
                            <div class="info-row">
                                <span class="info-label">Activity</span>
                                <span class="info-value">${app.nature_of_activity}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Type of Work</span>
                                <span class="info-value">${app.type_of_work}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address</span>
                                <span class="info-value">${app.construction_address}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Work Details</span>
                                <span class="info-value">${app.details_of_work || 'N/A'}</span>
                            </div>
                        </div>

                        <div class="report-section">
                            <h3>Ownership</h3>
                            <div class="info-row">
                                <span class="info-label">Owner Name</span>
                                <span class="info-value">${app.first_name} ${app.middle_name || ''} ${app.last_name} ${app.suffix || ''}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Contact</span>
                                <span class="info-value">${app.contact_no_owner}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Owner Address</span>
                                <span class="info-value">${app.address_owner}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-column">
                        <div class="report-section">
                            <h3>Schedule & Workforce</h3>
                            <div class="info-row">
                                <span class="info-label">Start Date</span>
                                <span class="info-value">${app.start_date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">End Date</span>
                                <span class="info-value">${app.end_date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Working Days</span>
                                <span class="info-value">${app.number_of_working_days}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Workers</span>
                                <span class="info-value">${app.number_of_workers}</span>
                            </div>
                            <div style="margin-top:15px;">
                                <span class="info-label" style="display:block; margin-bottom:5px;">Submitted Requirements:</span>
                                <ul class="doc-list">${requirementsHtml}</ul>
                            </div>
                        </div>

                        <div class="financial-box">
                            <h3 style="border:none; margin:0 0 10px 0;">Financial Status</h3>
                            <div class="info-row">
                                <span class="info-label">Payment Status</span>
                                <span class="info-value">${paymentStatus}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">OR Number</span>
                                <span class="info-value">${app.or_number || '--'}</span>
                            </div>
                            <div class="financial-total">
                                <span>Total Assessment</span>
                                <span>${amountDue}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${app.approval_comments ? `
                <div class="report-section" style="background:#f8f9fa; padding:15px; border-radius:5px;">
                    <h3 style="border:none; margin-bottom:5px;">Official Remarks</h3>
                    <p style="margin:0; font-style:italic; color:#555;">"${app.approval_comments}"</p>
                </div>` : ''}

                <div class="footer-note">
                    <p>Document generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p>Barangay Construction Management System</p>
                </div>
            </div>
            
            <script>
                // Auto-print when page loads, do NOT close window
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    printWindow.document.write(printHTML);
    printWindow.document.close();
}

/**
 * Downloads a summary report as a Word document
 * Generates HTML content with embedded styles (using tables for MS Word) and triggers file download
 * * @param {number} appId - The application ID to download summary for
 */
function downloadSummary(appId) {
    const app = applications.find(a => a.id == appId);
    if (!app) return;

    // --- DATA PARSING ---
    const constructionAddress = app.construction_address || 'Not specified';

    // Parse requirements
    let reqs = app.requirements;
    if (typeof reqs === 'string') {
        try { reqs = JSON.parse(reqs); } catch (e) { reqs = []; }
    }
    const requirementsHtml = (Array.isArray(reqs) && reqs.length > 0)
        ? reqs.map(r => `<li style="margin-bottom: 4px;">&#10003; ${r}</li>`).join('')
        : '<li style="color:#856404;">No documents logged</li>';

    // Parse uploaded file
    let firstUploaded = null;
    if (app.requirement_upload_json) {
        if (Array.isArray(app.requirement_upload_json) && app.requirement_upload_json.length) firstUploaded = app.requirement_upload_json[0];
        else {
            try { const parsed = JSON.parse(app.requirement_upload_json); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; } catch (e) { }
        }
    }
    if (!firstUploaded && app.requirement_upload) {
        try { const parsed = JSON.parse(app.requirement_upload); if (Array.isArray(parsed) && parsed.length) firstUploaded = parsed[0]; else firstUploaded = app.requirement_upload; } catch (e) { firstUploaded = app.requirement_upload; }
    }

    const fileUploadText = firstUploaded
        ? `<div style="margin-top: 10px;"><strong>Uploaded File:</strong> <a href="${UPLOADS_BASE_PATH}${firstUploaded}" style="color:#00247C; text-decoration: underline;">View Document (${firstUploaded})</a></div>`
        : '<div style="margin-top: 10px; color:#666;"><strong>Uploaded File:</strong> No file uploaded</div>';

    // Parse Colors & Financials
    let statusColor = '#6c757d'; let statusBg = '#e2e3e5';
    switch (app.status) {
        case 'Approved': statusColor = '#155724'; statusBg = '#d4edda'; break;
        case 'For Payment': statusColor = '#856404'; statusBg = '#fff3cd'; break;
        case 'Paid': statusColor = '#0c5460'; statusBg = '#d1ecf1'; break;
        case 'Disapproved': statusColor = '#721c24'; statusBg = '#f8d7da'; break;
    }

    const dateApplied = new Date(app.application_date || app.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const amountDue = app.amount_due ? parseFloat(app.amount_due).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : '₱0.00';
    const paymentStatus = app.payment_status || 'Unpaid';

    // Parse Comments
    let commentsHtml = '';
    if (app.status === 'Approved' && app.approval_comments) {
        commentsHtml = `<div style="background:#d4edda; border:1px solid #c3e6cb; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#155724; font-size:14pt;">Official Remarks (Approval)</h3>
            <p style="margin:0; font-style:italic;">"${app.approval_comments}"</p>
        </div>`;
    } else if (app.status === 'Disapproved' && app.disapproval_reason) {
        commentsHtml = `<div style="background:#f8d7da; border:1px solid #f5c6cb; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#721c24; font-size:14pt;">Disapproval Reason</h3>
            <p style="margin:0; font-style:italic;">"${app.disapproval_reason}"</p>
        </div>`;
    } else if (app.approval_comments) {
        commentsHtml = `<div style="background:#f8f9fa; border:1px solid #ddd; padding:15px; border-radius:5px; margin-top:20px;">
            <h3 style="margin-top:0; color:#333; font-size:14pt;">Official Remarks</h3>
            <p style="margin:0; font-style:italic;">"${app.approval_comments}"</p>
        </div>`;
    }

    // --- HTML CONSTRUCTION FOR MS WORD ---
    // Using tables ensures the two-column layout works when downloaded and opened in Word.
    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <title>Construction Application Summary - #${app.id}</title>
            <style>
                @page { margin: 0.5in; }
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.4; color: #333; }
                .header-table { width: 100%; border-bottom: 2px solid #00247C; padding-bottom: 10px; margin-bottom: 20px; }
                .title { font-size: 24pt; color: #00247C; margin: 0; font-weight: bold; }
                .meta { color: #666; font-size: 11pt; }
                .badge { background: ${statusBg}; color: ${statusColor}; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11pt; text-align: center; border: 1px solid ${statusColor}; }
                .section-title { font-size: 14pt; color: #00247C; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; }
                .card { background: #fdfdfd; border: 1px solid #e2e2e2; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
                .label { color: #666; font-size: 9pt; text-transform: uppercase; margin-bottom: 2px; display: block; }
                .value { font-size: 11pt; font-weight: bold; margin-top: 0; margin-bottom: 12px; display: block; color: #222; }
                .footer { text-align: center; font-size: 9pt; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <table class="header-table" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="70%">
                        <h1 class="title">Construction Clearance Profile</h1>
                        <div class="meta">Application ID: #${app.id} &bull; Date: ${dateApplied}</div>
                    </td>
                    <td width="30%" align="right" valign="middle">
                        <span class="badge">${app.status}</span>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="10" cellspacing="0" border="0">
                <tr>
                    <td width="50%" valign="top" style="padding-left: 0;">
                        <div class="card">
                            <h3 class="section-title">Construction Details</h3>
                            
                            <span class="label">Activity / Type</span>
                            <span class="value">${app.nature_of_activity} &bull; ${app.type_of_work}</span>
                            
                            <span class="label">Address</span>
                            <span class="value">${constructionAddress}</span>
                            
                            <span class="label">Work Details</span>
                            <span class="value">${app.details_of_work || 'N/A'}</span>
                        </div>

                        <div class="card">
                            <h3 class="section-title">Ownership</h3>
                            
                            <span class="label">Owner Name</span>
                            <span class="value">${app.first_name} ${app.middle_name || ''} ${app.last_name} ${app.suffix || ''}</span>
                            
                            <span class="label">Owner Contact</span>
                            <span class="value">${app.contact_no_owner}</span>

                            <span class="label">Owner Address</span>
                            <span class="value">${app.address_owner}</span>
                        </div>
                    </td>
                    <td width="50%" valign="top" style="padding-right: 0;">
                        <div class="card">
                            <h3 class="section-title">Schedule & Workforce</h3>
                            
                            <span class="label">Timeline</span>
                            <span class="value">${app.start_date} to ${app.end_date} (${app.number_of_working_days} working days)</span>
                            
                            <span class="label">Number of Workers</span>
                            <span class="value">${app.number_of_workers}</span>
                            
                            <span class="label">Submitted Requirements</span>
                            <ul style="margin-top: 5px; padding-left: 20px; font-size: 10pt; color: #222;">
                                ${requirementsHtml}
                            </ul>
                            ${fileUploadText}
                        </div>

                        <div class="card">
                            <h3 class="section-title">Financial Status</h3>
                            
                            <span class="label">Payment Status</span>
                            <span class="value">${paymentStatus}</span>
                            
                            <span class="label">OR Number</span>
                            <span class="value">${app.or_number || '--'}</span>
                            
                            <span class="label">Total Assessment</span>
                            <span class="value" style="color: #00247C;">${amountDue}</span>
                        </div>
                    </td>
                </tr>
            </table>

            ${commentsHtml}

            <div class="footer">
                Document generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br>
                Barangay Construction Management System
            </div>
        </body>
        </html>
    `;

    // Trigger Download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Construction_Application_${app.id}_Summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Creates a new construction application
 * Handles form submission with proper file uploads and address concatenation
 * 
 * @param {Event} event - The form submission event
 */
function createApplication(event) {
    event.preventDefault();

    // Validate both addresses with the new validateAddress function
    const isOwnerAddressValid = ownerLotNo && ownerStreet ?
        validateAddress(ownerLotNo, ownerStreet, '1') : true;
    const isConstructionAddressValid = constructionLotNo && constructionStreet ?
        validateAddress(constructionLotNo, constructionStreet, '2') : true;

    if (!isOwnerAddressValid || !isConstructionAddressValid) {
        // Scroll to the first invalid field
        if (!isOwnerAddressValid) {
            ownerLotNo?.focus();
        } else if (!isConstructionAddressValid) {
            constructionLotNo?.focus();
        }
        return;
    }

    // Get confirmation from user first
    Swal.fire({
        title: 'Create Application?',
        text: 'Are you sure you want to create this application?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00247C',
        cancelButtonColor: '#ad2c2c',
        confirmButtonText: 'Yes, create it!',
        cancelButtonText: 'Cancel',
        customClass: {
            popup: 'modal-content',
            confirmButton: 'btn-proceed',
            cancelButton: 'btn-cancel'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const form = document.getElementById('createForm');
            const formData = new FormData();

            // 1. ADD THE ACTION
            formData.append('action', 'create');

            // Get current user ID from session
            formData.append('supabase_user_id', 'staff_' + Date.now());

            // 2. CAPTURE DATA - With proper null/empty handling
            // Owner Details - Use empty string for optional fields
            const firstName = form.querySelector('[name="firstName"]');
            const middleName = form.querySelector('[name="middleName"]');
            const lastName = form.querySelector('[name="lastName"]');
            const suffix = form.querySelector('[name="suffix"]');
            const contactNoOwner = form.querySelector('[name="contactNoOwner"]');
            const ownerLotNo = form.querySelector('[name="ownerLotNo"]');
            const ownerStreet = form.querySelector('[name="ownerStreet"]');

            if (firstName) formData.append('firstName', firstName.value);
            // IMPORTANT: Use empty string for optional fields, not null or undefined
            formData.append('middleName', middleName ? (middleName.value || '') : '');
            if (lastName) formData.append('lastName', lastName.value);
            formData.append('suffix', suffix ? (suffix.value || '') : '');
            if (contactNoOwner) formData.append('contactNoOwner', contactNoOwner.value);

            // Add owner lot and street
            if (ownerLotNo) formData.append('ownerLotNo', ownerLotNo.value);
            if (ownerStreet) formData.append('ownerStreet', ownerStreet.value);

            // Combine owner address for display/storage
            const ownerAddress = `${ownerLotNo ? ownerLotNo.value : ''} ${ownerStreet ? ownerStreet.value : ''}`.trim();
            formData.append('addressOwner', ownerAddress);

            // Construction Details
            const constructionLotNo = form.querySelector('[name="constructionLotNo"]');
            const constructionStreet = form.querySelector('[name="constructionStreet"]');
            const typeOfWork = form.querySelector('[name="typeOfWork"]');
            const natureOfActivity = form.querySelector('[name="natureOfActivity"]');
            const detailsOfWork = form.querySelector('[name="detailsOfWork"]');
            const startDate = form.querySelector('[name="startDate"]');
            const endDate = form.querySelector('[name="endDate"]');
            const numberOfWorkingDays = form.querySelector('[name="numberOfWorkingDays"]');
            const numberOfWorkers = form.querySelector('[name="numberOfWorkers"]');
            const contractorName = form.querySelector('[name="contractorName"]');
            const contractorContactNumber = form.querySelector('[name="contractorContactNumber"]');
            const applicationMethod = form.querySelector('[name="applicationMethod"]');

            if (typeOfWork) formData.append('typeOfWork', typeOfWork.value);
            if (natureOfActivity) formData.append('natureOfActivity', natureOfActivity.value);
            if (detailsOfWork) formData.append('detailsOfWork', detailsOfWork.value);
            if (startDate) formData.append('startDate', startDate.value);
            if (endDate) formData.append('endDate', endDate.value);
            // Use empty string for optional numeric fields
            formData.append('numberOfWorkingDays', numberOfWorkingDays ? (numberOfWorkingDays.value || '') : '');
            formData.append('numberOfWorkers', numberOfWorkers ? (numberOfWorkers.value || '') : '');
            formData.append('contractorName', contractorName ? (contractorName.value || '') : '');
            formData.append('contractorContactNumber', contractorContactNumber ? (contractorContactNumber.value || '') : '');
            if (applicationMethod) formData.append('applicationMethod', applicationMethod.value || '');

            // Add construction lot and street
            if (constructionLotNo) formData.append('constructionLotNo', constructionLotNo.value);
            if (constructionStreet) formData.append('constructionStreet', constructionStreet.value);

            // Construction address for display
            const constructionAddress = `${constructionLotNo ? constructionLotNo.value : ''} ${constructionStreet ? constructionStreet.value : ''}`.trim();
            formData.append('constructionAddress', constructionAddress);

            // Coordinates (for construction location)
            const latitudeEl = form.querySelector('[name="latitude2"]');
            const longitudeEl = form.querySelector('[name="longitude2"]');
            formData.append('latitude2', latitudeEl ? (latitudeEl.value || '') : '');
            formData.append('longitude2', longitudeEl ? (longitudeEl.value || '') : '');

            // Agreement
            formData.append('agreed', '1');

            // Application Date
            formData.append('applicationDate', getCurrentDateString());

            // Handle file upload
            const requirementUploadInput = form.querySelector('[name="requirementUpload"]');
            if (requirementUploadInput && requirementUploadInput.files.length > 0) {
                for (let i = 0; i < requirementUploadInput.files.length; i++) {
                    formData.append('requirementUpload[]', requirementUploadInput.files[i]);
                }
                // console.log(`[UPLOAD SUCCESS] Sending ${requirementUploadInput.files.length} file(s) for construction`);
            } else {
                console.warn('[UPLOAD WARNING] No file selected!');
            }

            // Show loading state
            Swal.fire({
                title: 'Submitting...',
                text: 'Please wait while we create the application.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 3. SEND TO BACKEND
            fetch(CONSTRUCTION_HANDLER_URL, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Application created successfully! Reference ID: ' + data.id,
                            confirmButtonText: 'OK',
                            color: '#363636',
                            confirmButtonColor: '#00247C',
                            customClass: {
                                popup: 'modal-content',
                                confirmButton: 'btn-proceed',
                            }
                        }).then(() => {
                            // Reset form
                            form.reset();

                            // Refresh applications list
                            loadApplicationsFromDB().then(() => {
                                // Switch to management tab
                                switchTab(null, 'management');
                            });
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Error: ' + (data.message || 'Failed to create application'),
                            confirmButtonText: 'OK',
                            color: '#363636',
                            confirmButtonColor: '#00247C',
                            customClass: {
                                popup: 'modal-content',
                                confirmButton: 'btn-proceed',
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'Network error occurred. Please try again.',
                        confirmButtonText: 'OK',
                        color: '#363636',
                        confirmButtonColor: '#00247C',
                        customClass: {
                            popup: 'modal-content',
                            confirmButton: 'btn-proceed',
                        }
                    });
                });
        }
    });
}

/**
 * Filters applications in review table
 */
function filterReviewApplications() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Returns the current date as a formatted string (YYYY-MM-DD)
 * Used for date input field population
 * 
 * @returns {string} Current date in YYYY-MM-DD format
 */
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Updates the application date input field with the current date
 * Called on page load and periodically to keep date current
 */
function updateApplicationDate() {
    const dateInput = document.getElementById('applicationDate');
    if (dateInput) {
        dateInput.value = getCurrentDateString();
    }
}

function reRunOCR(appId) {
    Swal.fire({
        ...swalTopConfig,
        title: 'Re-run OCR Analysis?',
        text: 'This will re-process all uploaded documents. Continue?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Re-run',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(CONSTRUCTION_HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=re_run_ocr&id=' + encodeURIComponent(appId),
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            ...swalTopConfig,
                            icon: 'success',
                            title: 'Queued!',
                            text: 'OCR re-run has been queued successfully.',
                            timer: 2500
                        });
                        viewDetails(appId);
                    } else {
                        Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Failed', text: data.message || 'Failed to queue OCR re-run.' });
                    }
                })
                .catch(() => Swal.fire({ ...swalTopConfig, icon: 'error', title: 'Network Error' }));
        }
    });
}

/**
 * Toggles visibility of file upload inputs based on application method selection
 * Hides the file upload fields when "In Person" is selected, shows them when "Online" is selected
 */
function toggleFileUploads() {
    const applicationMethod = document.getElementById('applicationMethod');
    const requirementUpload = document.getElementById('requirementUpload')?.closest('.form-group');
    const additionalFiles = document.getElementById('additionalFiles')?.closest('.form-group');

    if (!applicationMethod || !requirementUpload || !additionalFiles) return;

    // Check if "In Person" is selected OR if no value is selected (default to showing)
    if (applicationMethod.value === 'In Person') {
        // Hide file upload inputs
        requirementUpload.style.display = 'none';
        additionalFiles.style.display = 'none';

        // Remove required attribute from file input when hidden
        const fileInput = document.getElementById('requirementUpload');
        if (fileInput) {
            fileInput.removeAttribute('required');
        }
    } else {
        // Show file upload inputs (for 'Online' or default)
        requirementUpload.style.display = 'block';
        additionalFiles.style.display = 'block';

        // Add required attribute back when visible
        const fileInput = document.getElementById('requirementUpload');
        if (fileInput) {
            fileInput.setAttribute('required', 'required');
        }
    }
}

/**
 * Toggles visibility of the application method field based on nature of activity selection
 * Hides the field and clears its value when 'Demolition' is selected, as submission
 * method is not applicable for demolition work. Also re-triggers file upload visibility.
 */
function toggleApplicationMethod() {
    const natureOfActivity = document.getElementById('natureOfActivity');
    const applicationMethodWrapper = document.getElementById('applicationMethod')?.closest('.form-group');

    if (!natureOfActivity || !applicationMethodWrapper) return;

    if (natureOfActivity.value === 'Demolition') {
        applicationMethodWrapper.style.display = 'none';
        const applicationMethod = document.getElementById('applicationMethod');
        if (applicationMethod) applicationMethod.value = '';
    } else {
        applicationMethodWrapper.style.display = 'block';
    }

    toggleFileUploads();
}

/**
 * Shows or hides "specify" text fields based on "Others" selection in dropdowns
 * @param {HTMLSelectElement} selectEl - The primary select element
 * @param {HTMLInputElement} specifyEl - The text input for specifying "Other" option
 */
function handleOthersSelect(selectEl, specifyEl) {
    if (!selectEl || !specifyEl) return;

    const wrapper = specifyEl.closest('.form-group');
    if (!wrapper) return;

    if (selectEl.value === 'Other') {
        wrapper.style.display = 'block';
        specifyEl.setAttribute('required', 'required');
    } else {
        wrapper.style.display = 'none';
        specifyEl.value = '';
        specifyEl.removeAttribute('required');
    }
}

/**
 * Fetch audit logs from the server
 * Clears and re-renders the entire audit table
 *
 * @async
 * @returns {Promise<void>}
 */
async function fetchAuditLogs() {
    try {
        const resp = await fetch('/server/api/shared/get_audit_logs.php', {
            credentials: 'include',
            cache: 'no-store'
        });

        if (!resp.ok) {
            console.error('Audit log fetch failed:', resp.status, resp.statusText);
            return;
        }

        const logs = await resp.json();

        if (!Array.isArray(logs)) {
            console.error('Invalid audit log response:', logs);
            return;
        }

        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No audit logs found.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.id ?? '—'}</td>
                <td>${log.action ?? '—'}</td>
                <td>${log.record_id ?? '—'}</td>
                <td>${log.full_name ?? '—'}</td>
                <td>${log.created_at ?? '—'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Failed to fetch audit logs:', err);
    }
}

/**
 * Append a new audit log row to the top of the audit table
 * Prevents duplicate rows based on log ID
 *
 * @param {Object} log - Audit log object
 * @param {number|string} log.id - Unique log identifier
 * @returns {void}
 */
function appendAuditRow(log) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (document.getElementById(`audit-${log.id}`)) return; // skip if already exists

    const tr = document.createElement('tr');
    tr.id = `audit-${log.id}`;

    tr.innerHTML = `
        <td>${log.id ?? '—'}</td>
        <td>${log.action ?? '—'}</td>
        <td>${log.record_id ?? '—'}</td>
        <td>${log.full_name ?? '—'}</td>
        <td>${log.created_at ?? '—'}</td>
    `;

    tbody.prepend(tr);
}

// Wait for the DOM content to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    fetchAuditLogs();
    updateApplicationDate();
    setInterval(updateApplicationDate, 60000);

    initSocket("main", "https://banwa.onrender.com", (data) => {
        switch (data.type) {
            case "construction_applications_update":
                refreshActiveTab();
                break;
            case "new_audit_log":
                if (data.payload) appendAuditRow(data.payload);
                else fetchAuditLogs();
                break;
        }
    });

    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', createApplication);
    }

    // Add working days calculation listeners
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', calculateWorkingDays);
        endDateInput.addEventListener('change', calculateWorkingDays);

        // Also calculate when user types (for better UX)
        startDateInput.addEventListener('input', calculateWorkingDays);
        endDateInput.addEventListener('input', calculateWorkingDays);
    }

    // Event listener for status change to update textarea with templates
    const statusSelect = document.getElementById('newStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            const status = this.value;
            const commentBox = document.getElementById('updateComments');
            const amountGroup = document.getElementById('amountFieldGroup');
            const amountInput = document.getElementById('assessmentAmount');

            // Handle Amount Field Visibility
            if (amountGroup) {
                if (status === 'For Payment') {
                    amountGroup.classList.remove('hidden');
                    if (amountInput) amountInput.setAttribute('required', 'required');
                } else {
                    amountGroup.classList.add('hidden');
                    if (amountInput) amountInput.removeAttribute('required');
                }
            }

            // Auto-fill Comments
            if (constructionStatusTemplates[status] && commentBox) {
                commentBox.value = constructionStatusTemplates[status];
            } else if (commentBox) {
                // Optional: Clear the box if a status without a template is selected
                commentBox.value = "";
            }
        });
    }


    const applicationMethod = document.getElementById('applicationMethod');
    if (applicationMethod) {
        applicationMethod.addEventListener('change', toggleFileUploads);
    }

    const natureOfActivity = document.getElementById('natureOfActivity');
    if (natureOfActivity) {
        natureOfActivity.addEventListener('change', toggleApplicationMethod);
    }

    const typeOfWork = document.getElementById('typeOfWork');
    const detailsOfWork = document.getElementById('detailsOfWork');
    if (typeOfWork && detailsOfWork) {
        typeOfWork.addEventListener('change', () => handleOthersSelect(typeOfWork, detailsOfWork));
        handleOthersSelect(typeOfWork, detailsOfWork);
    }
});
// CLOSE MODAL ON OUTSIDE CLICK
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.classList.remove('active');
        }
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('archive-btn')) return;

    const tableName = e.target.dataset.table;
    if (tableName !== 'construction_applications') return;

    e.preventDefault();
    const appId = e.target.dataset.id;

    if (!appId || appId === 'undefined') {
        console.error('Invalid application ID:', appId);
        Swal.fire({
            ...swalTopConfig,
            icon: 'error',
            title: 'Error',
            text: 'Invalid application ID. Please try again.'
        });
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: 'This application will be archived.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, archive it',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            popup: 'archive-swal2-popup'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await archiveRecord('construction_applications', appId);

            // Remove the row immediately from the UI
            const row = e.target.closest('tr');
            if (row) row.remove();

            // Refresh both tables to ensure consistency
            loadManagementTable();
            loadProcessTable();
        }
    });
});

// Enhanced styles - SweetAlert2 forced to front layer
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .hidden { display: none !important; }
        
        /* FORCE SWEETALERT TO ALWAYS BE ON TOP OF MODALS */
        .swal2-container,
        .sweetalert-top {
            z-index: 2147483647 !important;
        }
        .swal2-popup {
            z-index: 2147483647 !important;
        }
        .swal2-backdrop {
            z-index: 2147483646 !important;
        }
    </style>
`);
// Center SweetAlert text
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .swal2-title, .swal2-html-container { text-align: center !important; }
        .swal2-popup { text-align: center !important; }
    </style>
`);

document.addEventListener('DOMContentLoaded', function () {
    const navLogo = document.querySelector('.nav_logo');
    const sideNav = document.querySelector('.side_nav');

    navLogo.addEventListener('click', () => {
        sideNav.classList.toggle('expanded');
    });

    if (ownerLotNo && ownerStreet) {
        [ownerLotNo, ownerStreet].forEach(el => {
            el.addEventListener('blur', () => {
                if (ownerLotNo.value && ownerStreet.value) {
                    validateAddress(ownerLotNo, ownerStreet, '1');
                }
            });
            el.addEventListener('input', () => clearFieldError(el));
            el.addEventListener('change', () => clearFieldError(el));
        });
    }

    // Address validation for construction address
    if (constructionLotNo && constructionStreet) {
        [constructionLotNo, constructionStreet].forEach(el => {
            el.addEventListener('blur', () => {
                if (constructionLotNo.value && constructionStreet.value) {
                    validateAddress(constructionLotNo, constructionStreet, '2');
                }
            });
            el.addEventListener('input', () => clearFieldError(el));
            el.addEventListener('change', () => clearFieldError(el));
        });
    }

    // Input sanitization for numeric fields (remove non-digit characters)
    [contactNoOwner, contractorContactNumber, constructionLotNo, numberOfWorkers, ownerLotNo].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                el.value = el.value.replace(/\D/g, '');
                clearFieldError(el);
            });
        }
    });

    const applicationMethod = document.getElementById('applicationMethod');
    if (applicationMethod) {
        applicationMethod.addEventListener('change', toggleFileUploads);
        toggleFileUploads();
    }
});

// ===============================================
// EXPOSE ALL FUNCTIONS TO GLOBAL SCOPE
// ===============================================
window.generateConstructionPermit = generateConstructionPermit;
window.generateConstructionClearance = generateConstructionPermit;
window.generateConstructionPermit = generateConstructionPermit;
window.generateConstructionClearance = generateConstructionPermit;
window.filterApplications = filterApplications;
window.createApplication = createApplication;
window.openUpdateModal = openUpdateModal;
window.viewDetails = viewDetails;
window.submitUpdate = submitUpdate;
window.toggleAmountField = toggleAmountField;
window.applyPrompt = applyPrompt;
window.loadSummarySelect = loadSummarySelect;
window.updateSummary = updateSummary;
window.downloadSummary = downloadSummary;
window.printSummary = printSummary;
window.archiveApplication = archiveApplication;
window.reRunOCR = reRunOCR;

window.toggleFileUploads = toggleFileUploads;
window.toggleApplicationMethod = toggleApplicationMethod;
window.handleOthersSelect = handleOthersSelect;
// ==================== MAP LOCATION PICKER ====================

function openMapPicker(target) {
    const existing = document.querySelector('.dynamic-map-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal dynamic-map-modal';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:900px;width:100%;height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
            <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;flex-shrink:0;">
                <h2 style="margin:0;font-size:17px;">Select Construction Site Location</h2>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="picker-street-btn" type="button" style="background:#00247c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;">Street</button>
                    <button id="picker-satellite-btn" type="button" style="background:white;color:#555;border:1px solid #ccc;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;">Satellite</button>
                    <button type="button" class="close-btn" onclick="this.closest('.dynamic-map-modal').remove()" style="margin-left:8px;">&times;</button>
                </div>
            </div>
            <div id="dynamic-map-container" style="flex:1;width:100%;min-height:0;"></div>
        </div>`;
    document.body.appendChild(modal);
    initializeMapPicker('dynamic-map-container', target);
}

async function initializeMapPicker(containerId, target) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container._leaflet_id) { container._leaflet_id = null; container.innerHTML = ''; }

    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' });
    const satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' });
    const map = L.map(containerId).setView([14.6175, 121.0756], 17);
    osmTile.addTo(map);

    const POLY = { street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.12, weight: 2 }, satellite: { color: '#fff', fillColor: '#fff', fillOpacity: 0.15, weight: 2 } };
    const BOUND = { street: { color: '#00247c', fillColor: '#00247c', fillOpacity: 0.08, dashArray: '8,6', weight: 2 }, satellite: { color: '#fff', fillColor: '#000', fillOpacity: 0, dashArray: '8,6', weight: 2 } };
    let housePolygons = [], boundaryLayers = [], selectedMarker = null;

    const streetBtn = document.getElementById('picker-street-btn');
    const satBtn = document.getElementById('picker-satellite-btn');
    if (streetBtn && satBtn) {
        streetBtn.onclick = () => { map.removeLayer(satTile); osmTile.addTo(map); housePolygons.forEach(p => p.setStyle(POLY.street)); boundaryLayers.forEach(b => b.setStyle(BOUND.street)); streetBtn.style.cssText = 'background:#00247c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;'; satBtn.style.cssText = 'background:white;color:#555;border:1px solid #ccc;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;'; };
        satBtn.onclick = () => { map.removeLayer(osmTile); satTile.addTo(map); housePolygons.forEach(p => p.setStyle(POLY.satellite)); boundaryLayers.forEach(b => b.setStyle(BOUND.satellite)); satBtn.style.cssText = 'background:#00247c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;'; streetBtn.style.cssText = 'background:white;color:#555;border:1px solid #ccc;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;'; };
    }

    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6), lng = e.latlng.lng.toFixed(6);
        if (selectedMarker) map.removeLayer(selectedMarker);
        selectedMarker = L.marker([lat, lng]).addTo(map).bindPopup('<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;">Selected Location</div>').openPopup();
        document.getElementById('latitude2').value = lat;
        document.getElementById('longitude2').value = lng;
        const disp = document.getElementById('constructionLocationDisplay');
        if (disp) disp.value = `${lat}, ${lng}`;
        const modal = document.querySelector('.dynamic-map-modal');
        if (modal) modal.remove();
    });

    try {
        const bRes = await fetch('/server/handlers/map/map_handler.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_boundaries' });
        const bData = await bRes.json();
        if (bData.success && bData.boundaries) bData.boundaries.forEach(b => { try { const coords = JSON.parse(b.coordinates); const ll = coords.map(c => Array.isArray(c) ? [c[1], c[0]] : [c.lat, c.lng]); boundaryLayers.push(L.polygon(ll, BOUND.street).addTo(map)); } catch (e) { } });
    } catch (e) { }

    try {
        const hRes = await fetch('/server/handlers/map/map_handler.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=get_houses' });
        const hData = await hRes.json();
        if (hData.success && hData.houses) {
            hData.houses.forEach(house => {
                if (!house.coordinates) return;
                try {
                    const coords = JSON.parse(house.coordinates);
                    const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) ? coords[0] : coords;
                    const ll = ring.map(c => [c[1], c[0]]);
                    const poly = L.polygon(ll, { ...POLY.street, interactive: true });
                    housePolygons.push(poly);
                    const isLandmark = house.address && !/^\d/.test(house.address.trim());
                    const title = isLandmark ? (house.address || 'Landmark') : ('House #' + (house.house_number || '—'));
                    poly.bindPopup('', { maxWidth: 260 });
                    poly.on('click', function (e) {
                        L.DomEvent.stopPropagation(e);
                        const lat = house.center_lat ? parseFloat(house.center_lat).toFixed(6) : e.latlng.lat.toFixed(6);
                        const lng = house.center_lng ? parseFloat(house.center_lng).toFixed(6) : e.latlng.lng.toFixed(6);
                        const formattedAddress = house.address || ((house.house_number ? 'House/Unit ' + house.house_number + ', ' : '') + (house.street_name ? house.street_name + ', ' : '') + 'Brgy. Blue Ridge B, Quezon City').trim();
                        const addrSafe = formattedAddress.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                        const popupHtml =
                            '<div style="font-family:Inter,sans-serif;min-width:210px;">' +
                            '<div style="background:#00247c;color:white;padding:9px 12px;margin:-8px -12px 10px;border-radius:6px 6px 0 0;">' +
                            '<div style="font-weight:700;font-size:13px;">' + title + '</div>' +
                            (house.street_name ? '<div style="font-size:11px;opacity:.85;">' + house.street_name + '</div>' : '') +
                            '</div>' +
                            (house.address ? '<p style="margin:0 0 5px;font-size:12px;"><strong style="color:#00247c;">Address:</strong> ' + house.address + '</p>' : '') +
                            (house.street_name ? '<p style="margin:0 0 5px;font-size:12px;"><strong style="color:#00247c;">Street:</strong> ' + house.street_name + '</p>' : '') +
                            '<p style="margin:0 0 10px;font-size:11px;color:#888;">' + lat + ', ' + lng + '</p>' +
                            '<button onclick="(function(){' +
                            'document.getElementById(\'latitude2\').value=\'' + lat + '\';' +
                            'document.getElementById(\'longitude2\').value=\'' + lng + '\';' +
                            'var d=document.getElementById(\'constructionLocationDisplay\');if(d)d.value=\'' + addrSafe + '\';' +
                            'var m=document.querySelector(\'.dynamic-map-modal\');if(m)m.remove();' +
                            '})()" style="width:100%;background:#00247c;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:13px;">&#10003; Select This Location</button>' +
                            '</div>';
                        poly.setPopupContent(popupHtml);
                        poly.openPopup();
                    });
                    poly.addTo(map);
                } catch (e) { }
            });
        }
    } catch (e) { }

    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);
}

window.openMapPicker = openMapPicker;