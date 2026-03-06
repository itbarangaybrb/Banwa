const MAP_HANDLER_URL = '/server/handlers/map/map_handler.php';

// Map variables
const map = L.map('map').setView([14.6175, 121.0756], 17);
let constructionMarkers = [];
let businessMarkers = [];
let householdMarkers = []; // Will not be used anymore - keeping for compatibility
let utilityMarkers = [];
let incidentMarkers = [];
let housePolygonsLayer = null;
let housePolygonsData = [];
let faultLine = null;
let warningMarker = null;

// Hazard layer states
let floodLayerActive = false;
let faultLineActive = false;
let floodLayer = null;
let floodLegend = null;

// Filter state
let activeFilter = 'household';
let constructionSubFilter = 'all';
let incidentSubFilter = 'all';

// Search variables
let allMarkersData = [];
let searchResults = [];
let activeSearchMarker = null;
let searchTimeout = null;

// Modal state
let currentMarkerData = null;

// ==================== NAVIGATION BAR EXPAND/COLLAPSE WITH HOVER AND CLICK ====================

function initNavbar() {
    const sideNav = document.querySelector('.side_nav');
    const navHeader = document.querySelector('.nav_header');
    let hoverTimer;

    if (sideNav) {
        // Hover to expand temporarily
        sideNav.addEventListener('mouseenter', function () {
            clearTimeout(hoverTimer);
            // Only add hover class if not pinned
            if (!this.classList.contains('pinned')) {
                this.classList.add('expanded');
            }
        });

        sideNav.addEventListener('mouseleave', function () {
            // Small delay before collapsing to prevent accidental closes
            hoverTimer = setTimeout(() => {
                // Remove expanded class but keep pinned if it exists
                if (!this.classList.contains('pinned')) {
                    this.classList.remove('expanded');
                }
            }, 300);
        });

        // Click logo/header to toggle pin/unpin
        if (navHeader) {
            navHeader.addEventListener('click', function (e) {
                e.stopPropagation();

                if (sideNav.classList.contains('pinned')) {
                    // Unpin
                    sideNav.classList.remove('pinned');
                    sideNav.classList.remove('expanded');
                } else {
                    // Pin - remove expanded class first then add pinned
                    sideNav.classList.remove('expanded');
                    sideNav.classList.add('pinned');
                }
            });
        }

        // Close on escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sideNav.classList.contains('pinned')) {
                sideNav.classList.remove('pinned');
                sideNav.classList.remove('expanded');
            }
        });

        // On mobile, close when clicking outside
        if (window.innerWidth <= 768) {
            document.addEventListener('click', function (e) {
                if (!sideNav.contains(e.target) &&
                    !document.querySelector('.mobile-menu-btn')?.contains(e.target)) {
                    sideNav.classList.remove('active');
                    sideNav.classList.remove('expanded');
                    sideNav.classList.remove('pinned');
                }
            });
        }
    }
}

// ==================== SWEETALERT2 CUSTOM CONFIGURATION ====================
// Default SweetAlert2 configuration for consistent styling
const swalDefaultConfig = {
    confirmButtonColor: '#00247c', // Navy blue
    cancelButtonColor: '#666666',   // Gray
    background: '#ffffff',           // White
    color: '#333333',                // Dark gray for text
    iconColor: '#00247c',            // Navy blue for icons
    showCloseButton: true,
    closeButtonHtml: '&times;',
    customClass: {
        container: 'swal-navy-container',
        popup: 'swal-navy-popup',
        header: 'swal-navy-header',
        title: 'swal-navy-title',
        closeButton: 'swal-navy-close',
        icon: 'swal-navy-icon',
        content: 'swal-navy-content',
        htmlContainer: 'swal-navy-html',
        confirmButton: 'swal-navy-confirm',
        cancelButton: 'swal-navy-cancel',
        footer: 'swal-navy-footer'
    }
};

// Helper function to show SweetAlert with custom config
function showSwal(options) {
    return Swal.fire({
        ...swalDefaultConfig,
        ...options
    });
}

// Helper function to check if control is on map (Leaflet doesn't have hasControl)
function hasControl(control) {
    if (!control || !control._map) return false;
    return control._map === map;
}

// Barangay boundary — loaded from database on init
let blueRidgeGeoJSON = null;

// Tile layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 22
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    maxNativeZoom: 19,
    maxZoom: 22
});

osmLayer.addTo(map);

// Icons
const constructionIcon = L.divIcon({
    className: 'construction-marker',
    iconSize: [22, 22]
});

const businessIcon = L.divIcon({
    className: 'business-marker',
    iconSize: [22, 22]
});

const utilityIcon = L.divIcon({
    className: 'utility-marker',
    iconSize: [18, 18]
});

const incidentIcon = L.divIcon({
    className: 'incident-marker',
    iconSize: [22, 22]
});

// ==================== MODAL FUNCTIONS (SweetAlert2) ====================

// showModal and closeModal are kept as no-ops for backward compatibility
// All detail views now use SweetAlert2 directly.
function showModal(modalId) { /* replaced by showSwal detail calls */ }
function closeModal(modalId = 'detail-modal') { Swal.close(); }

// ── Shared helpers for the 4 unified report modals ──────────────────────────

/** Builds one accordion row used in all report lists */
function rptRow(id, badgeText, badgeColor, name, rightLabel, bodyHTML) {
    return `
        <div class="rpt-row" style="border-left-color:${badgeColor};">
            <div class="rpt-row-head" data-accordion-toggle="${id}">
                <div class="rpt-row-left">
                    <span class="rpt-badge" style="background:${badgeColor};">${badgeText}</span>
                    <span class="rpt-name">${name}</span>
                </div>
                <div class="rpt-row-right">
                    <span class="rpt-severity" style="color:${badgeColor};">${rightLabel}</span>
                    <span class="rpt-arrow acc-arrow">▼</span>
                </div>
            </div>
            <div class="rpt-row-body" id="${id}">${bodyHTML}</div>
        </div>`;
}

/** Builds a single warning block inside an expanded row */
function rptWarningBlock(warning) {
    const c = warning.severity === 'CRITICAL' ? '#990000'
        : warning.severity === 'HIGH' ? '#cc0000' : '#555';
    return `
        <div style="background:#f8f8f8;border-left:3px solid ${c};padding:10px 12px;border-radius:4px;margin-bottom:8px;">
            <div style="color:${c};font-weight:700;margin-bottom:4px;">⚠ ${warning.type}</div>
            <div style="color:#555;margin-bottom:6px;">${warning.description}</div>
            <div style="font-weight:700;color:#333;margin-bottom:4px;font-size:11px;">${warning.severity === 'CRITICAL' ? 'IMMEDIATE ACTIONS:' : 'REQUIRED ACTIONS:'}</div>
            <ul style="margin:0;padding-left:16px;color:#555;">
                ${warning.actions.map(a => `<li>${a}</li>`).join('')}
            </ul>
        </div>`;
}

/** Fires the unified report Swal — fixed size for all report/risk/SDSS modals */
function showReportSwal(html, onOpen) {
    showSwal({
        html,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'unified-modal-popup' },
        didOpen: (popup) => {
            attachAccordionHandler(popup);
            if (onOpen) onOpen(popup);
        }
    });
}

// ────────────────────────────────────────────────────────────────────────────

// Badge colour helpers used by detail modals
function getTypeBadgeStyle(type) {
    const styles = {
        construction: 'background:#00247c;color:#fff;',
        business: 'background:#00247c;color:#fff;',
        utility: 'background:#00247c;color:#fff;',
        household: 'background:#00247c;color:#fff;',
        incident: 'background:#cc0000;color:#fff;',
        flood: 'background:#cc0000;color:#fff;'
    };
    return styles[type] || 'background:#555555;color:#fff;';
}

function detailBadge(label, type) {
    return `<span style="padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;${getTypeBadgeStyle(type)}">${label}</span>`;
}

function detailRow(label, value) {
    return `
        <tr>
            <td style="padding:9px 12px;font-weight:600;color:#555;font-size:13px;
                       border-bottom:1px solid #f0f0f0;white-space:nowrap;width:35%;">${label}</td>
            <td style="padding:9px 12px;color:#333;font-size:13px;
                       border-bottom:1px solid #f0f0f0;">${value}</td>
        </tr>`;
}

function detailTable(rows) {
    return `<table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>`;
}

function showDetailSwal(title, badgeLabel, badgeType, tableRows) {
    showSwal({
        html: `
            <div style="text-align:left;padding:28px 32px 24px;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #f0f0f0;">
                    <h3 style="margin:0;font-size:17px;color:#00247c;flex:1;line-height:1.3;">${title}</h3>
                    ${detailBadge(badgeLabel, badgeType)}
                </div>
                ${detailTable(tableRows)}
            </div>`,
        width: 620,
        showConfirmButton: false,
        showCloseButton: true
    });
}

function displayDetailsInModal(data, type) {
    let title = '';
    let tableRows = '';

    if (type === 'construction') {
        title = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Construction Site';
        const status = data.agreed === '1' ? 'Approved' : 'Pending';
        const statusColor = data.agreed === '1' ? '#28a745' : '#ff9800';
        tableRows = [
            detailRow('Homeowner', `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}`.trim()),
            detailRow('Contact Number', data.contact_no_owner || 'Not specified'),
            detailRow('Construction Address', data.construction_address || 'Not specified'),
            detailRow('Type of Work', data.type_of_work || 'Not specified'),
            detailRow('Nature of Work', data.nature_of_work || data.nature_of_activity || 'Not specified'),
            detailRow('Contractor', data.contractor_name || 'Not specified'),
            detailRow('Contractor Contact', data.contractor_contact_number || 'Not specified'),
            detailRow('Workers', data.number_of_workers || '0'),
            detailRow('Work Period', `${formatDate(data.start_date)} → ${formatDate(data.end_date)} (${data.number_of_working_days || 0} days)`),
            detailRow('Details', data.details_of_work || 'Not specified'),
            detailRow('Status', `<span style="color:${statusColor};font-weight:bold;">${status}</span>`)
        ].join('');
        showDetailSwal(title, 'Construction', 'construction', tableRows);

    } else if (type === 'business') {
        title = data.business_name || 'Unnamed Business';
        const statusColor = data.status === 'approved' ? '#28a745' : data.status === 'disapproved' ? '#dc3545' : '#ff9800';
        tableRows = [
            detailRow('Business Name', data.business_name || 'Not specified'),
            detailRow('Business Address', data.address_of_business || 'Not specified'),
            detailRow('Business Type', data.type_of_business || 'Not specified'),
            detailRow('Nature of Business', data.nature_of_business || 'Not specified'),
            detailRow('Owner Name', `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim()),
            detailRow('Business Contact', data.telephone_no_business || 'Not specified'),
            detailRow('Owner Contact', data.telephone_no_owner || 'Not specified'),
            detailRow('Email', data.email_address || 'Not specified'),
            detailRow('Employees', data.no_of_employees || '0'),
            detailRow('Structure Type', data.type_of_structure || 'Not specified'),
            detailRow('Status', `<span style="color:${statusColor};font-weight:bold;text-transform:capitalize;">${data.status || 'Pending'}</span>`)
        ].join('');
        showDetailSwal(title, 'Business', 'business', tableRows);

    } else if (type === 'utility') {
        title = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Utility Work';
        const status = data.agreed === '1' ? 'Approved' : 'Pending';
        const statusColor = data.agreed === '1' ? '#28a745' : '#ff9800';
        tableRows = [
            detailRow('Applicant', `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''} ${data.suffix || ''}`.trim()),
            detailRow('Contact Number', data.owner_contact_no || 'Not specified'),
            detailRow('Utility Address', data.address_of_utility || 'Not specified'),
            detailRow('Provider', data.provider || 'Not specified'),
            detailRow('Nature of Work', data.nature_of_work || 'Not specified'),
            detailRow('Request Date', formatDate(data.request_date)),
            detailRow('Work Date', formatDate(data.date_of_work)),
            detailRow('Status', `<span style="color:${statusColor};font-weight:bold;">${status}</span>`)
        ].join('');
        showDetailSwal(title, 'Utility', 'utility', tableRows);

    } else if (type === 'incident') {
        title = data.incident_type || 'Incident Report';
        const statusColor = data.status === 'Resolved' ? '#28a745' : data.status === 'Under Investigation' ? '#ff9800' : '#cc0000';
        const dssColor = data.dss_status === 'High Priority' ? '#cc0000' : data.dss_status === 'Medium Priority' ? '#ff9800' : '#555';

        // Parse witnesses JSON
        let witnessRows = '';
        if (data.witness_data_json) {
            try {
                const witnesses = typeof data.witness_data_json === 'string'
                    ? JSON.parse(data.witness_data_json) : data.witness_data_json;
                if (Array.isArray(witnesses) && witnesses.length) {
                    witnessRows = witnesses.map((w, i) =>
                        detailRow(`Witness ${i + 1}`,
                            `${w.full_name || w.name || '—'}${w.contact ? ' · ' + w.contact : ''}${w.address ? ' · ' + w.address : ''}`)
                    ).join('');
                }
            } catch (e) { }
        }

        tableRows = [
            // ── Incident Info ──
            `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Incident Information</td></tr>`,
            detailRow('Incident Type', data.incident_type || 'Not specified'),
            detailRow('Date / Time', formatDate(data.incident_timestamp)),
            detailRow('Date Reported', formatDate(data.date_reported)),
            detailRow('Description', data.description || 'Not specified'),
            detailRow('Status', `<span style="color:${statusColor};font-weight:700;">${data.status || 'Pending'}</span>`),
            detailRow('DSS Status', `<span style="color:${dssColor};font-weight:700;">${data.dss_status || 'Pending Evaluation'}</span>`),
            // ── Victim ──
            `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Victim</td></tr>`,
            detailRow('Full Name', data.vic_full_name || 'Not specified'),
            detailRow('Address', data.vic_address || 'Not specified'),
            detailRow('Contact', data.vic_contact || 'Not specified'),
            detailRow('Gender', data.vic_gender || 'Not specified'),
            detailRow('Date of Birth', data.vic_dob ? formatDate(data.vic_dob) : 'Not specified'),
            detailRow('Citizenship', data.vic_citizenship || 'Not specified'),
            detailRow('Occupation', data.vic_occupation || 'Not specified'),
            // ── Suspect ──
            `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Suspect</td></tr>`,
            detailRow('Full Name', data.sus_full_name || 'Unknown'),
            detailRow('Address', data.sus_address || 'Not specified'),
            detailRow('Contact', data.sus_contact || 'Not specified'),
            detailRow('Gender', data.sus_gender || 'Not specified'),
            detailRow('Description', data.sus_description || 'Not specified'),
            // ── Reporter ──
            `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Reporter</td></tr>`,
            detailRow('Full Name', data.rp_full_name || 'Not specified'),
            detailRow('Address', data.rp_address || 'Not specified'),
            detailRow('Contact', data.rp_contact || 'Not specified'),
            detailRow('Relationship to Victim', data.rp_relationship || 'Not specified'),
            // ── Witnesses ──
            witnessRows ? `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Witnesses</td></tr>` + witnessRows : '',
            // ── Resolution ──
            `<tr><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:700;color:#00247c;text-transform:uppercase;letter-spacing:.5px;background:#f7f9ff;">Resolution</td></tr>`,
            detailRow('Resolution Details', data.resolution_details || 'Not specified'),
            detailRow('Update Comments', data.update_comments || 'Not specified'),
            data.approval_comments ? detailRow('Approval Comments', data.approval_comments) : '',
            data.disapproval_comments ? detailRow('Disapproval Comments', data.disapproval_comments) : ''
        ].join('');
        showDetailSwal(title, 'Incident', 'incident', tableRows);

    } else if (type === 'household') {
        title = data.title || 'Household Marker';
        tableRows = [
            detailRow('Title', data.title || 'Not specified'),
            detailRow('Description', data.description || 'Not specified'),
            detailRow('Location', data.location || 'Not specified'),
            detailRow('Marker Type', data.marker_type || 'household'),
            detailRow('Created By', data.created_by || 'Unknown'),
            detailRow('Created Date', formatDate(data.created_at)),
            detailRow('Coordinates', `${data.latitude || ''}, ${data.longitude || ''}`)
        ].join('');
        showDetailSwal(title, 'Household', 'household', tableRows);
    }
}

function displayFloodDetailsInModal(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    let properties = {};
    try { properties = data.properties ? JSON.parse(data.properties) : {}; }
    catch (e) { console.warn('Could not parse flood properties:', e); }

    const title = data.hazard_name || 'Flood Hazard Area';
    const tableRows = [
        detailRow('Hazard Name', data.hazard_name || 'Not specified'),
        detailRow('Risk Level', `<span style="color:${riskColor};font-weight:bold;font-size:15px;">${(data.risk_level || 'medium').toUpperCase()}</span>`),
        detailRow('Description', data.description || 'Not specified'),
        detailRow('Last Flood Date', formatDate(properties.last_flood_date) || 'Not recorded'),
        detailRow('Reported By', properties.reported_by || 'Barangay Office'),
        detailRow('Date Identified', formatDate(properties.date_identified)),
        detailRow('Safety Advice', getFloodSafetyAdvice(data.risk_level)),
        detailRow('Last Updated', formatDate(data.updated_at))
    ].join('');
    showDetailSwal(title, `${(data.risk_level || 'medium').toUpperCase()} RISK`, 'flood', tableRows);
}

function displayHouseDetailsInModal(data) {
    let coordinateInfo = 'Not available';
    if (data.coordinates) {
        try {
            const coords = JSON.parse(data.coordinates);
            coordinateInfo = `${coords.length} vertices`;
        } catch (e) { coordinateInfo = 'Invalid coordinate data'; }
    }

    const title = data.address || 'House';
    const tableRows = [
        detailRow('Address', data.address || 'Not specified'),
        detailRow('Street Name', data.street_name || 'Not specified'),
        detailRow('Area', `${data.area_sqm || '0'} sqm`),
        detailRow('Center Coordinates', `${data.center_lat || 'N/A'}, ${data.center_lng || 'N/A'}`),
        detailRow('Polygon Vertices', coordinateInfo),
        detailRow('Created', formatDate(data.created_at)),
        detailRow('Last Updated', formatDate(data.updated_at))
    ].join('');
    showDetailSwal(title, 'Household', 'household', tableRows);
}

// ==================== HAZARD LAYER TOGGLES ====================

// Toggle flood layer
function toggleFloodLayer() {
    floodLayerActive = !floodLayerActive;

    // Update button style
    const floodToggleBtn = document.getElementById('floodToggleBtn');
    if (floodToggleBtn) {
        if (floodLayerActive) {
            floodToggleBtn.classList.add('active');
            floodToggleBtn.classList.add('flood-active');
        } else {
            floodToggleBtn.classList.remove('active');
            floodToggleBtn.classList.remove('flood-active');
        }
    }

    if (floodLayerActive) {
        // Show flood layer
        if (!floodLayer) {
            loadFloodData();
        } else {
            // Check if already on map
            if (!map.hasLayer(floodLayer)) {
                floodLayer.addTo(map);
            }
        }

        // Show flood legend
        if (floodLegend && !hasControl(floodLegend)) {
            floodLegend.addTo(map);
        }
    } else {
        // Hide flood layer
        if (floodLayer && map.hasLayer(floodLayer)) {
            map.removeLayer(floodLayer);
        }

        // Hide flood legend
        removeFloodLegend();
    }
}

// Improved function to remove flood legend
function removeFloodLegend() {
    if (floodLegend) {
        try {
            // Try to remove the control from map
            if (hasControl(floodLegend)) {
                map.removeControl(floodLegend);
            }
        } catch (e) {
            console.log('Error removing flood legend via map.removeControl:', e);
            // Alternative method: remove by DOM element
            const legendElement = document.querySelector('.flood-legend');
            if (legendElement && legendElement.parentNode) {
                legendElement.parentNode.removeChild(legendElement);
            }
        }
        // Don't set floodLegend to null here - keep the object for reuse
    }
}

// Toggle fault line
function toggleFaultLine() {
    faultLineActive = !faultLineActive;

    // Update button style
    const faultToggleBtn = document.getElementById('faultToggleBtn');
    if (faultToggleBtn) {
        if (faultLineActive) {
            faultToggleBtn.classList.add('active');
            faultToggleBtn.classList.add('fault-active');
        } else {
            faultToggleBtn.classList.remove('active');
            faultToggleBtn.classList.remove('fault-active');
        }
    }

    if (faultLineActive) {
        // Show fault line
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    } else {
        // Hide fault line
        if (faultLine && map.hasLayer(faultLine)) {
            map.removeLayer(faultLine);
        }
        if (warningMarker && map.hasLayer(warningMarker)) {
            map.removeLayer(warningMarker);
        }
    }
}

// ==================== REGULAR FILTER DROPDOWN FUNCTIONS ====================

function toggleFilterDropdown(event) {
    if (event) {
        event.stopPropagation();
    }

    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');

    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdownBtn.classList.remove('active');
    } else {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        dropdown.classList.add('show');
        dropdownBtn.classList.add('active');
    }
}

function selectFilterType(type, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const dropdown = document.getElementById('filterDropdown');
    const dropdownBtn = document.getElementById('filterDropdownBtn');
    dropdown.classList.remove('show');
    dropdownBtn.classList.remove('active');

    const filterTextMap = {
        'household': 'Households',
        'business': 'Businesses',
        'construction': 'Construction',
        'utility': 'Utilities',
        'incident': 'Incidents'
    };

    document.getElementById('currentFilterText').textContent = filterTextMap[type] || 'Filter';

    const subFilters = document.getElementById('constructionSubFilters');
    const incidentSubFilters = document.getElementById('incidentSubFilters');
    if (subFilters) subFilters.style.display = type === 'construction' ? 'block' : 'none';
    if (incidentSubFilters) {
        incidentSubFilters.style.display = type === 'incident' ? 'block' : 'none';
        if (type === 'incident') loadIncidentSubFilters();
    }

    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.type === type) {
            link.classList.add('active');
        }
    });

    activateFilter(type);
}

function activateFilter(type) {
    activeFilter = type;
    updateAllVisibility();
    // Broadcast filter state for application management pages
    try {
        const activeFilters = {
            construction: activeFilter === 'construction',
            business: activeFilter === 'business',
            utilities: activeFilter === 'utility',
            household: activeFilter === 'household'
        };
        window.dispatchEvent(new CustomEvent('staffMapFilterChanged', { detail: { activeFilters } }));
    } catch (e) {
        console.warn('Failed to dispatch staffMapFilterChanged', e);
    }
}

function updateAllVisibility() {
    updateMarkerVisibility();
    updateHousePolygonVisibility();
}

// ==================== CONSTRUCTION SUB-FILTER ====================

// Map nature_of_activity values to filter types
const natureToSubtypeMap = {
    'Major Renovation': 'major',
    'Major Construction': 'major',
    'New Construction': 'major',
    'Minor Renovation': 'minor',
    'Minor Construction': 'minor',
    'Repair': 'repair',
    'Maintenance': 'repair',
    'Demolition': 'demolition',
    'Complete Demolition': 'demolition',
    'Partial Demolition': 'demolition'
};

function filterConstructionByType(subtype, event) {
    if (event) {
        event.stopPropagation();
    }

    constructionSubFilter = subtype;

    document.querySelectorAll('.sub-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const clickedBtn = event ? event.currentTarget :
        document.querySelector(`.sub-filter-btn[data-subtype="${subtype}"]`);

    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    if (activeFilter === 'construction') {
        updateMarkerVisibility();
    }
}

// Helper function to determine if a construction marker should be shown
function shouldShowConstructionMarker(marker) {
    if (constructionSubFilter === 'all') {
        return true;
    }

    // Get the nature_of_activity from marker data
    const nature = marker.nature_of_work || (marker.construction_data ?
        (marker.construction_data.nature_of_work || marker.construction_data.nature_of_activity) : '') || '';
    const mappedType = natureToSubtypeMap[nature] || 'other';

    return mappedType === constructionSubFilter;
}

function updateMarkerVisibility() {
    // Note: householdMarkers array is kept empty - only house polygons are used

    constructionMarkers.forEach(marker => {
        if (activeFilter === 'construction') {
            // Check if marker should be visible based on construction sub-filter
            const shouldShow = shouldShowConstructionMarker(marker);

            if (shouldShow && !map.hasLayer(marker)) {
                marker.addTo(map);
            } else if (!shouldShow && map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });

    businessMarkers.forEach(marker => {
        if (activeFilter === 'business') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });

    utilityMarkers.forEach(marker => {
        if (activeFilter === 'utility') {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });

    incidentMarkers.forEach(marker => {
        if (activeFilter === 'incident') {
            const show = shouldShowIncidentMarker(marker);
            if (show && !map.hasLayer(marker)) marker.addTo(map);
            else if (!show && map.hasLayer(marker)) map.removeLayer(marker);
        } else {
            if (map.hasLayer(marker)) map.removeLayer(marker);
        }
    });
}

function updateHousePolygonVisibility() {
    if (housePolygonsLayer) {
        if (activeFilter === 'household') {
            housePolygonsLayer.addTo(map);
        } else {
            map.removeLayer(housePolygonsLayer);
        }
    }
}

// ==================== NAVIGATION ACTIVE STATE ====================

function setActiveNav(element) {
    document.querySelectorAll('.nav_select, .nav_select_btn').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// ==================== MAP VIEW FUNCTIONS ====================

function toggleStreetMap() {
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

function toggleSatellite() {
    map.removeLayer(osmLayer);
    satelliteLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

function resetView() {
    map.setView([14.6175, 121.0756], 17);
    map.removeLayer(satelliteLayer);
    osmLayer.addTo(map);
    setActiveNav(event.currentTarget);
}

// ==================== SEARCH FUNCTIONS ====================

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');

    if (!searchTerm) {
        if (resultsContainer) resultsContainer.style.display = 'none';
        return;
    }

    searchResults = [];
    if (resultsContainer) resultsContainer.innerHTML = '';

    allMarkersData.forEach(marker => {
        const searchFields = [
            marker.title || '',
            marker.description || '',
            marker.location || '',
            marker.marker_type || '',
            marker.business_name || '',
            marker.homeowner_name || '',
            marker.contractor_name || '',
            marker.address_of_construction || '',
            marker.address_of_business || '',
            marker.applicant_name || '',
            marker.applicant_address || '',
            marker.hazard_name || '',
            marker.risk_level || '',
            marker.address || '',
            marker.house_number || '',
            marker.street_name || '',
            marker.nature_of_work || '',
            marker.nature_of_activity || '',
            marker.type_of_work || '',
            marker.type_of_business || '',
            marker.incident_type || '',
            marker.vic_full_name || '',
            marker.rp_full_name || '',
            marker.vic_address || ''
        ];

        let matchScore = 0;

        searchFields.forEach(field => {
            const fieldLower = field.toLowerCase();
            if (fieldLower === searchTerm) {
                matchScore += 100;
            } else if (fieldLower.startsWith(searchTerm)) {
                matchScore += 50;
            } else if (fieldLower.includes(searchTerm)) {
                matchScore += 20;
            } else if (searchTerm.length >= 3) {
                const words = searchTerm.split(' ');
                words.forEach(word => {
                    if (word.length > 2 && fieldLower.includes(word)) {
                        matchScore += 5;
                    }
                });
            }
        });

        if (matchScore > 0) {
            searchResults.push({
                marker: marker,
                score: matchScore
            });
        }
    });

    searchResults.sort((a, b) => b.score - a.score);

    if (resultsContainer) {
        if (searchResults.length > 0) {
            const topResults = searchResults.slice(0, 10);

            topResults.forEach((result, index) => {
                const marker = result.marker;
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.index = index;

                const type = marker.marker_type || marker.type ||
                    (marker.construction_id ? 'construction' :
                        marker.id ? 'business' :
                            marker.utility_id ? 'utility' :
                                marker.hazard_id ? 'flood' :
                                    marker.house_id ? 'household' : 'household');

                const title = marker.title ||
                    marker.business_name ||
                    marker.homeowner_name ||
                    marker.applicant_name ||
                    marker.hazard_name ||
                    marker.address ||
                    marker.address || 'Unnamed Marker';

                const subtitle = marker.description ||
                    marker.address_of_construction ||
                    marker.address_of_business ||
                    marker.applicant_address ||
                    marker.location ||
                    marker.street_name ||
                    (marker.risk_level ? `${marker.risk_level.toUpperCase()} Risk` : '') ||
                    '';

                const highlightedTitle = highlightText(title, searchTerm);
                const highlightedSubtitle = highlightText(subtitle.substring(0, 60), searchTerm);

                item.innerHTML = `
                    <div class="result-icon ${type === 'flood' ? 'flood-area' : type + '-marker'}"></div>
                    <div class="result-details">
                        <div class="result-title">${highlightedTitle}</div>
                        <div class="result-subtitle">${highlightedSubtitle}${subtitle.length > 60 ? '...' : ''}</div>
                    </div>
                    <span class="result-type ${type}">${type}</span>
                `;

                item.addEventListener('click', () => {
                    highlightSearchResult(marker);
                });

                resultsContainer.appendChild(item);
            });

            const countElement = document.createElement('div');
            countElement.className = 'search-count';
            countElement.textContent = `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`;
            resultsContainer.appendChild(countElement);

            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item">No results found</div>';
            resultsContainer.style.display = 'block';
        }
    }
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;

    const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(searchRegex, '<span class="highlight">$1</span>');
}

function handleSearchInput() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        performSearch();
    }, 300);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }

    // Remove active search marker
    removeActiveSearchMarker();

    // Restore visibility based on current states
    updateAllVisibility();

    // Restore flood layer if active
    if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
        floodLayer.addTo(map);
        // Also add legend
        if (floodLegend && !hasControl(floodLegend)) {
            floodLegend.addTo(map);
        }
    }

    // Restore fault line if active
    if (faultLineActive) {
        if (faultLine && !map.hasLayer(faultLine)) {
            faultLine.addTo(map);
        }
        if (warningMarker && !map.hasLayer(warningMarker)) {
            warningMarker.addTo(map);
        }
    }

    // Restore house polygons if needed
    if (activeFilter === 'household' && housePolygonsLayer) {
        if (!map.hasLayer(housePolygonsLayer)) {
            housePolygonsLayer.addTo(map);
        }
    }

    map.closePopup();
}

function removeActiveSearchMarker() {
    if (activeSearchMarker) {
        if (activeSearchMarker.marker && map.hasLayer(activeSearchMarker.marker)) {
            map.removeLayer(activeSearchMarker.marker);
        }
        if (activeSearchMarker.highlight && map.hasLayer(activeSearchMarker.highlight)) {
            map.removeLayer(activeSearchMarker.highlight);
        }
        if (activeSearchMarker.circle && map.hasLayer(activeSearchMarker.circle)) {
            map.removeLayer(activeSearchMarker.circle);
        }
        if (activeSearchMarker instanceof L.Marker ||
            activeSearchMarker instanceof L.Polygon ||
            activeSearchMarker instanceof L.GeoJSON) {
            map.removeLayer(activeSearchMarker);
        }
        activeSearchMarker = null;
    }
}

function highlightSearchResult(markerData) {
    // First, hide all current markers
    hideAllMarkers();

    // Try to find the actual marker object
    let targetMarker = null;
    const type = getMarkerTypeFromData(markerData);

    // Search in the appropriate markers array
    if (type === 'construction') {
        targetMarker = constructionMarkers.find(m =>
            m.construction_data && m.construction_data.id === markerData.id
        );
    } else if (type === 'business') {
        targetMarker = businessMarkers.find(m =>
            m.business_data && m.business_data.id === markerData.id
        );
    } else if (type === 'utility') {
        targetMarker = utilityMarkers.find(m =>
            m.utility_data && m.utility_data.id === markerData.id
        );
    } else if (type === 'incident') {
        targetMarker = incidentMarkers.find(m =>
            m.incident_data && m.incident_data.id === markerData.id
        );
    }

    if (targetMarker) {
        // We found the actual marker, highlight it
        highlightExistingMarker(targetMarker, markerData);
    } else {
        // Fallback: create a temporary highlight
        createTemporaryHighlight(markerData);
    }
}

// Helper function to get marker type from data
function getMarkerTypeFromData(markerData) {
    return markerData.marker_type || markerData.type ||
        (markerData.construction_id ? 'construction' :
            markerData.incident_type !== undefined ? 'incident' :
                markerData.id ? 'business' :
                    markerData.utility_id ? 'utility' :
                        markerData.hazard_id ? 'flood' :
                            markerData.house_id ? 'household' : 'household');
}

function highlightExistingMarker(marker, markerData) {
    const latLng = marker.getLatLng();
    removeActiveSearchMarker();

    // Single pulse ring
    const pulseRing = L.circleMarker(latLng, {
        radius: 28,
        color: '#00247c',
        weight: 3,
        fillColor: '#00247c',
        fillOpacity: 0.1,
        className: 'search-pulse-ring'
    }).addTo(map);

    activeSearchMarker = { marker, highlight: pulseRing };

    if (!map.hasLayer(marker)) marker.addTo(map);
    // L.Marker doesn't have bringToFront — use setZIndexOffset instead
    if (marker.setZIndexOffset) marker.setZIndexOffset(1000);

    map.flyTo(latLng, 19, { duration: 1.2, easeLinearity: 0.2 });

    map.once('moveend', () => {
        const type = getMarkerTypeFromData(markerData);
        let popupContent = '';
        if (type === 'construction') popupContent = createConstructionPopup(markerData);
        else if (type === 'business') popupContent = createBusinessPopup(markerData);
        else if (type === 'utility') popupContent = createUtilityPopup(markerData);
        else if (type === 'incident') popupContent = createIncidentPopup(markerData);
        else popupContent = createHousePopup(markerData);
        marker.bindPopup(popupContent, { autoPan: true }).openPopup();
    });

    updateSearchResultActiveState(markerData);
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) resultsContainer.style.display = 'none';
}

function createTemporaryHighlight(markerData) {
    const type = getMarkerTypeFromData(markerData);

    if (type === 'flood') {
        showFloodAreaHighlight(markerData);
        return;
    }

    if (type === 'household' && markerData.coordinates) {
        showHousePolygonHighlight(markerData);
        return;
    }

    const lat = parseFloat(markerData.latitude || markerData.center_lat);
    const lng = parseFloat(markerData.longitude || markerData.center_lng);

    if (isNaN(lat) || isNaN(lng)) {
        showSwal({ icon: 'error', title: 'Error', text: 'Could not find location for this marker', confirmButtonColor: '#00247c' });
        return;
    }

    removeActiveSearchMarker();

    // Animated pin icon
    const markerColor = '#00247c';
    const highlightIcon = L.divIcon({
        className: '',
        html: `
            <div class="search-pin-wrapper">
                <div class="search-pin-pulse"></div>
                <div class="search-pin-dot" style="background:${markerColor};"></div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24]
    });

    activeSearchMarker = L.marker([lat, lng], { icon: highlightIcon, zIndexOffset: 1000 }).addTo(map);

    // Fly then open popup after animation
    map.flyTo([lat, lng], 19, { duration: 1.2, easeLinearity: 0.2 });

    map.once('moveend', () => {
        let popupContent = '';
        if (type === 'construction') popupContent = createConstructionPopup(markerData);
        else if (type === 'business') popupContent = createBusinessPopup(markerData);
        else if (type === 'utility') popupContent = createUtilityPopup(markerData);
        else if (type === 'incident') popupContent = createIncidentPopup(markerData);
        else popupContent = createHousePopup(markerData);
        activeSearchMarker.bindPopup(popupContent, { autoPan: true }).openPopup();
    });

    updateSearchResultActiveState(markerData);
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) resultsContainer.style.display = 'none';
}

function updateSearchResultActiveState(markerData) {
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('active');
        const resultIndex = searchResults.findIndex(result => result.marker === markerData);
        if (parseInt(item.dataset.index) === resultIndex) {
            item.classList.add('active');
        }
    });

    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function hideAllMarkers() {
    constructionMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    businessMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    utilityMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    incidentMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    if (floodLayer && map.hasLayer(floodLayer)) {
        map.removeLayer(floodLayer);
    }

    // Remove flood legend if it exists
    removeFloodLegend();

    if (faultLine && map.hasLayer(faultLine)) {
        map.removeLayer(faultLine);
    }
    if (warningMarker && map.hasLayer(warningMarker)) {
        map.removeLayer(warningMarker);
    }

    if (housePolygonsLayer && map.hasLayer(housePolygonsLayer)) {
        map.removeLayer(housePolygonsLayer);
    }

    // Remove active search marker if it exists
    removeActiveSearchMarker();
}

function showHousePolygonHighlight(houseData) {
    try {
        const coords = JSON.parse(houseData.coordinates);
        const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
        latLngCoords.push(latLngCoords[0]);

        // Remove any existing highlight
        removeActiveSearchMarker();

        const polygon = L.polygon(latLngCoords, {
            color: '#00247c',
            weight: 4,
            fillColor: '#00247c',
            fillOpacity: 0.2,
            interactive: true
        }).addTo(map);

        activeSearchMarker = polygon;

        const bounds = polygon.getBounds();
        console.log('Fitting bounds to polygon:', bounds); // Debug log

        // Force fit bounds with padding
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 20,
            duration: 1.5
        });

        // Open popup after animation finishes
        map.once('moveend', () => {
            const popupContent = createHousePopup(houseData);
            polygon.bindPopup(popupContent, { autoPan: true }).openPopup();
        });

        updateSearchResultActiveState(houseData);

        // Hide the search results container
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }

    } catch (e) {
        console.error('Error highlighting house polygon:', e);
    }
}

function showFloodAreaHighlight(hazardData) {
    try {
        loadFullFloodDetailsForHighlight(hazardData.hazard_id);
    } catch (e) {
        console.error('Error highlighting flood area:', e);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Error displaying flood hazard area',
            confirmButtonColor: '#00247c'
        });
    }
}

async function loadFullFloodDetailsForHighlight(hazardId) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_details');
        formData.append('id', hazardId);

        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success && data.data) {
            const hazard = data.data;

            if (hazard.geometry) {
                const geoJson = JSON.parse(hazard.geometry);

                const highlightStyle = getFloodAreaStyle(hazard.risk_level);
                highlightStyle.fillOpacity += 0.2;
                highlightStyle.weight += 3;
                highlightStyle.color = '#00247c';
                // no pulse animation

                activeSearchMarker = L.geoJSON(geoJson, {
                    style: highlightStyle
                }).addTo(map);

                const bounds = activeSearchMarker.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 18
                    });
                }

                const popupContent = createFloodPopup(hazard);
                activeSearchMarker.bindPopup(popupContent).openPopup();

                updateSearchResultActiveState({ hazard_id: hazardId });
            }
        }
    } catch (e) {
        console.error('Error loading flood details:', e);
    }
}

// ==================== POPUP CREATION FUNCTIONS ====================

function createConstructionPopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>Construction Site</span>
                <span class="construction-badge">Construction</span>
            </h4>
            <div class="popup-section">
                <p><strong>Homeowner:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
                <p><strong>Address:</strong> ${data.construction_address || 'Not specified'}</p>
                <p><strong>Contractor:</strong> ${data.contractor_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Work Type:</strong> ${data.type_of_work || 'Not specified'}</p>
                <p><strong>Nature:</strong> ${data.nature_of_work || data.nature_of_activity || 'Not specified'}</p>
                <p><strong>Dates:</strong> ${formatDate(data.start_date)} - ${formatDate(data.end_date)}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'construction')">
                View Full Details
            </button>
        </div>
    `;
}

function createBusinessPopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>${data.business_name || 'Business'}</span>
                <span class="business-badge">Business</span>
            </h4>
            <div class="popup-section">
                <p><strong>Address:</strong> ${data.address_of_business || 'Not specified'}</p>
                <p><strong>Type:</strong> ${data.type_of_business || 'Not specified'}</p>
                <p><strong>Owner:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
            </div>
            <div class="popup-section">
                <p><strong>Status:</strong> <span class="status-${data.status || 'pending'}">${data.status || 'Pending'}</span></p>
                <p><strong>Employees:</strong> ${data.no_of_employees || '0'}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'business')">
                View Full Details
            </button>
        </div>
    `;
}

function createUtilityPopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>Utility Work</span>
                <span class="utility-badge">Utility</span>
            </h4>
            <div class="popup-section">
                <p><strong>Applicant:</strong> ${data.first_name || ''} ${data.last_name || ''}</p>
                <p><strong>Address:</strong> ${data.address_of_utility || 'Not specified'}</p>
                <p><strong>Provider:</strong> ${data.provider || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Nature of Work:</strong> ${data.nature_of_work || 'Not specified'}</p>
                <p><strong>Work Date:</strong> ${formatDate(data.date_of_work)}</p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'utility')">
                View Full Details
            </button>
        </div>
    `;
}

function createIncidentPopup(data) {
    const statusColor = data.status === 'Resolved' ? '#28a745'
        : data.status === 'Under Investigation' ? '#ff9800' : '#cc0000';
    const dssColor = data.dss_status === 'High Priority' ? '#cc0000'
        : data.dss_status === 'Medium Priority' ? '#ff9800' : '#555';
    return `
        <div class="popup-content">
            <h4>
                <span>${data.incident_type || 'Incident'}</span>
                <span class="incident-badge">Incident</span>
            </h4>
            <div class="popup-section">
                <p><strong>Date:</strong> ${formatDate(data.incident_timestamp)}</p>
                <p><strong>Location:</strong> ${data.vic_address || data.rp_address || 'Not specified'}</p>
                <p><strong>Description:</strong> ${data.description ? data.description.substring(0, 80) + (data.description.length > 80 ? '…' : '') : 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Victim:</strong> ${data.vic_full_name || 'Not specified'}</p>
                <p><strong>Reporter:</strong> ${data.rp_full_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${data.status || 'Pending'}</span></p>
                <p><strong>DSS:</strong> <span style="color:${dssColor};font-weight:600;">${data.dss_status || 'Pending Evaluation'}</span></p>
            </div>
            <button class="view-details-btn" onclick="viewMapDetails(${data.id}, 'incident')">
                View Full Details
            </button>
        </div>
    `;
}

function createFloodPopup(data) {
    const riskColor = getFloodRiskColor(data.risk_level);
    const riskClass = `flood-risk-${data.risk_level || 'medium'}`;

    // Parse properties JSON if it exists
    let properties = {};
    try {
        properties = data.properties ? JSON.parse(data.properties) : {};
    } catch (e) {
        console.warn('Could not parse flood properties:', e);
    }

    return `
        <div class="popup-content">
            <h4>
                <span>${data.hazard_name || 'Flood Hazard Area'}</span>
                <span class="flood-risk-badge" style="background: ${riskColor};">${(data.risk_level || 'medium').toUpperCase()} RISK</span>
            </h4>
            <div class="popup-section flood-popup-section">
                <p><strong>Risk Level:</strong> <span class="${riskClass}">${(data.risk_level || 'medium').toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${data.description || 'Flood-prone area'}</p>
                <p><strong>Last Flood:</strong> ${formatDate(properties.last_flood_date) || 'Not recorded'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Safety Advice:</strong> ${getFloodSafetyAdvice(data.risk_level)}</p>
                <p><strong>Reported By:</strong> ${properties.reported_by || 'Barangay Office'}</p>
                <p><strong>Identified:</strong> ${formatDate(properties.date_identified)}</p>
            </div>
            <button class="view-details-btn" onclick="viewFloodDetails(${data.hazard_id})">
                View Flood Details
            </button>
        </div>
    `;
}

function createHousePopup(data) {
    return `
        <div class="popup-content">
            <h4>
                <span>${data.address || 'House'}</span>
                <span class="household-badge">Household</span>
            </h4>
            <div class="popup-section">
                <p><strong>Street:</strong> ${data.street_name || 'Not specified'}</p>
            </div>
            <div class="popup-section">
                <p><strong>Area:</strong> ${data.area_sqm || '0'} sqm</p>
                <p><strong>Last Updated:</strong> ${formatDate(data.updated_at)}</p>
            </div>
            <button class="view-details-btn" onclick="viewHouseDetails(${data.house_id})">
                View Full Details
            </button>
        </div>
    `;
}

// View details functions — show Swal loading, then fire detail Swal on success
async function viewMapDetails(id, type) {
    showSwal({
        title: 'Loading Details',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    try {
        const formData = new FormData();
        const actionMap = {
            construction: 'get_construction_details',
            business: 'get_business_details',
            utility: 'get_utilities_details',
            incident: 'get_incident_details'
        };
        formData.append('action', actionMap[type] || `get_${type}_details`);
        formData.append('id', id);
        const response = await fetch(`${MAP_HANDLER_URL}`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            displayDetailsInModal(data.data, type);
        } else {
            showSwal({ icon: 'error', title: 'Error', text: 'Could not load details.' });
        }
    } catch (error) {
        console.error('Error loading details:', error);
        showSwal({ icon: 'error', title: 'Error', text: 'Failed to load details.' });
    }
}

async function viewFloodDetails(id) {
    showSwal({
        title: 'Loading Details',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_details');
        formData.append('id', id);
        const response = await fetch(`${MAP_HANDLER_URL}`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            displayFloodDetailsInModal(data.data);
        } else {
            showSwal({ icon: 'error', title: 'Error', text: 'Could not load flood details.' });
        }
    } catch (error) {
        console.error('Error loading flood details:', error);
        showSwal({ icon: 'error', title: 'Error', text: 'Failed to load flood details.' });
    }
}

async function viewHouseDetails(id) {
    showSwal({
        title: 'Loading Details',
        html: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    try {
        const formData = new FormData();
        formData.append('action', 'get_house_details');
        formData.append('id', id);
        const response = await fetch(`${MAP_HANDLER_URL}`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            displayHouseDetailsInModal(data.data);
        } else {
            showSwal({ icon: 'error', title: 'Error', text: 'Could not load house details.' });
        }
    } catch (error) {
        console.error('Error loading house details:', error);
        showSwal({ icon: 'error', title: 'Error', text: 'Failed to load house details.' });
    }
}

// ==================== HELPER FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getFloodSafetyAdvice(riskLevel) {
    const advice = {
        'high': 'High flood risk. Consider elevation, flood barriers, and evacuation plan.',
        'medium': 'Moderate flood risk. Install check valves and keep drains clear.',
        'low': 'Low flood risk. Monitor weather alerts and prepare emergency kit.',
    };

    return advice[riskLevel] || 'Take necessary precautions during heavy rainfall.';
}

function getFloodRiskColor(riskLevel) {
    const colors = {
        'high': '#cc0000',
        'medium': '#555555',
        'low': '#888888',
    };
    return colors[riskLevel] || '#555555';
}

// ==================== DATA LOADING FUNCTIONS ====================

async function loadAllMarkers() {
    clearAllMarkers();

    try {
        const formData = new FormData();
        formData.append('action', 'get_all_markers');

        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('Server returned error: ' + (data.message || 'Unknown error'));
        }

        // Get flood data for search
        const floodFormData = new FormData();
        floodFormData.append('action', 'get_flood_hazards');

        const floodResponse = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: floodFormData
        });

        const floodData = await floodResponse.json();

        // Build allMarkersData for search - include houses from house polygons
        allMarkersData = [
            ...(data.markers || []).filter(m => m.type === 'construction'),
            ...(data.markers || []).filter(m => m.type === 'business'),
            ...(data.markers || []).filter(m => m.type === 'utility'),
            ...(data.markers || []).filter(m => m.type === 'incident'),
            ...(floodData.success ? (floodData.hazards || []).map(f => ({ ...f, type: 'flood' })) : [])
        ];

        // Process markers by type
        const constructionMarkersList = (data.markers || []).filter(m => m.type === 'construction');
        const businessMarkersList = (data.markers || []).filter(m => m.type === 'business');
        const utilityMarkersList = (data.markers || []).filter(m => m.type === 'utility');
        const incidentMarkersList = (data.markers || []).filter(m => m.type === 'incident');

        // Load construction markers
        constructionMarkersList.forEach(construction => {
            if (construction.latitude && construction.longitude) {
                try {
                    const lat = parseFloat(construction.latitude);
                    const lng = parseFloat(construction.longitude);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createConstructionPopup(construction);
                        const marker = L.marker([lat, lng], {
                            icon: constructionIcon,
                            title: construction.name || 'Construction Site'
                        }).bindPopup(popupContent);

                        // Store the original data with the marker
                        marker.construction_data = construction;
                        marker.nature_of_work = construction.nature_of_work || construction.nature_of_activity;

                        constructionMarkers.push(marker);
                        if (activeFilter === 'construction' && shouldShowConstructionMarker(marker)) {
                            marker.addTo(map);
                        }
                    }
                } catch (error) {
                    console.error('Error processing construction marker:', error);
                }
            }
        });

        // Load business markers
        businessMarkersList.forEach(business => {
            if (business.latitude && business.longitude) {
                try {
                    const lat = parseFloat(business.latitude);
                    const lng = parseFloat(business.longitude);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createBusinessPopup(business);
                        const marker = L.marker([lat, lng], {
                            icon: businessIcon,
                            title: business.name || 'Business'
                        }).bindPopup(popupContent);

                        // Store the original data with the marker
                        marker.business_data = business;

                        businessMarkers.push(marker);
                        if (activeFilter === 'business') {
                            marker.addTo(map);
                        }
                    }
                } catch (error) {
                    console.error('Error processing business marker:', error);
                }
            }
        });

        // Load utility markers
        utilityMarkersList.forEach(utility => {
            if (utility.latitude && utility.longitude) {
                try {
                    const lat = parseFloat(utility.latitude);
                    const lng = parseFloat(utility.longitude);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createUtilityPopup(utility);
                        const marker = L.marker([lat, lng], {
                            icon: utilityIcon,
                            title: utility.name || 'Utility Work'
                        }).bindPopup(popupContent);

                        // Store the original data with the marker
                        marker.utility_data = utility;

                        utilityMarkers.push(marker);
                        if (activeFilter === 'utility') {
                            marker.addTo(map);
                        }
                    }
                } catch (error) {
                    console.error('Error processing utility marker:', error);
                }
            }
        });

        // Load incident markers
        incidentMarkersList.forEach(incident => {
            if (incident.latitude && incident.longitude) {
                try {
                    const lat = parseFloat(incident.latitude);
                    const lng = parseFloat(incident.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const popupContent = createIncidentPopup(incident);
                        const marker = L.marker([lat, lng], {
                            icon: incidentIcon,
                            title: incident.incident_type || 'Incident'
                        }).bindPopup(popupContent);
                        marker.incident_data = incident;
                        marker.incident_type = incident.incident_type || '';
                        incidentMarkers.push(marker);
                        if (activeFilter === 'incident' && shouldShowIncidentMarker(marker)) {
                            marker.addTo(map);
                        }
                    }
                } catch (error) {
                    console.error('Error processing incident marker:', error);
                }
            }
        });

        // Load flood layer if active
        if (floodLayerActive) {
            loadFloodData();
        }

        // Load house polygons (not markers)
        loadHousePolygons();

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        showSwal({
            icon: 'error',
            title: 'Error Loading Markers',
            text: 'Please check browser console for details.',
            confirmButtonColor: '#00247c'
        });
    }
}

async function loadFloodData() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_hazards');

        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.hazards) {
            renderFloodAreas(data.hazards);
            addFloodLegend();

            // Add to map if flood layer is active
            if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) {
                floodLayer.addTo(map);
            }

            // Ensure legend is also added if active
            if (floodLayerActive && floodLegend && !hasControl(floodLegend)) {
                floodLegend.addTo(map);
            }
        } else {
            console.warn('No flood data found:', data.message);
            floodLayer = L.layerGroup();
            floodLegend = null;
        }
    } catch (error) {
        console.error('ERROR LOADING FLOOD DATA:', error);
        floodLayer = L.layerGroup();
        floodLegend = null;
    }
}

function createFloodPanes() {
    // Create dedicated Leaflet panes for each flood risk level with explicit z-index.
    // This is the only reliable way to guarantee click-through order in Leaflet:
    // low (bottom) -> medium (middle) -> high (top and always clickable).
    // Leaflet's default overlay pane sits at z-index 400.
    if (!map.getPane('floodLowPane')) {
        map.createPane('floodLowPane');
        map.getPane('floodLowPane').style.zIndex = 390;
        map.getPane('floodLowPane').style.pointerEvents = 'auto';
    }
    if (!map.getPane('floodMediumPane')) {
        map.createPane('floodMediumPane');
        map.getPane('floodMediumPane').style.zIndex = 391;
        map.getPane('floodMediumPane').style.pointerEvents = 'auto';
    }
    if (!map.getPane('floodHighPane')) {
        map.createPane('floodHighPane');
        map.getPane('floodHighPane').style.zIndex = 392;
        map.getPane('floodHighPane').style.pointerEvents = 'auto';
    }
}

function renderFloodAreas(hazards) {
    // Clear existing flood layer
    if (floodLayer) {
        map.removeLayer(floodLayer);
    }

    // Ensure dedicated panes exist for each risk level
    createFloodPanes();

    // Create new layer group
    floodLayer = L.layerGroup();

    // Map each risk level to its dedicated pane.
    // Each pane has a different z-index so HIGH is always physically on top in the DOM,
    // meaning click events reach it first regardless of geometry overlap.
    const riskPaneMap = {
        'low': 'floodLowPane',
        'medium': 'floodMediumPane',
        'high': 'floodHighPane'
    };

    hazards.forEach(hazard => {
        try {
            if (!hazard.geometry) {
                console.warn('Flood hazard missing geometry:', hazard.hazard_id);
                return;
            }

            const geoJson = JSON.parse(hazard.geometry);
            const style = getFloodAreaStyle(hazard.risk_level);
            const paneName = riskPaneMap[(hazard.risk_level || '').toLowerCase()] || 'floodLowPane';

            const layer = L.geoJSON(geoJson, {
                style: style,
                pane: paneName,
                onEachFeature: function (feature, featureLayer) {
                    featureLayer.options.pane = paneName;
                    const popupContent = createFloodPopup(hazard);
                    featureLayer.bindPopup(popupContent);

                    featureLayer.on('mouseover', function () {
                        this.setStyle({
                            fillOpacity: style.fillOpacity + 0.2,
                            weight: style.weight + 2
                        });
                    });

                    featureLayer.on('mouseout', function () {
                        this.setStyle(style);
                    });

                    featureLayer.hazardData = hazard;
                }
            });

            layer.addTo(floodLayer);

        } catch (e) {
            console.error('Error rendering flood hazard:', e, hazard);
        }
    });
}

function getFloodAreaStyle(riskLevel) {
    const styles = {
        'high': {
            fillColor: '#dc3545',
            color: '#b02030',
            fillOpacity: 0.45,
            weight: 2,
            opacity: 0.9,
            dashArray: null
        },
        'medium': {
            fillColor: '#ff9800',
            color: '#c97000',
            fillOpacity: 0.4,
            weight: 2,
            opacity: 0.85,
            dashArray: '5, 3'
        },
        'low': {
            fillColor: '#ffc107',
            color: '#c99500',
            fillOpacity: 0.35,
            weight: 1,
            opacity: 0.8,
            dashArray: '3, 3'
        },
    };

    return styles[riskLevel] || styles.medium;
}

function addFloodLegend() {
    // Remove existing legend if any
    if (floodLegend) {
        removeFloodLegend();
    }

    floodLegend = L.control({ position: 'bottomright' });

    floodLegend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend flood-legend');
        div.innerHTML = `
            <h4>Flood Risk Levels</h4>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #dc3545; opacity: 0.85;"></div>
                <span class="flood-legend-text">High Risk</span>
            </div>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #ff9800; opacity: 0.8;"></div>
                <span class="flood-legend-text">Medium Risk</span>
            </div>
            <div class="flood-legend-item">
                <div class="flood-legend-color" style="background: #ffc107; opacity: 0.75;"></div>
                <span class="flood-legend-text">Low Risk</span>
            </div>
        `;
        return div;
    };

    // Only add to map if flood layer is active
    if (floodLayerActive) {
        floodLegend.addTo(map);
    }
}

async function loadHousePolygons() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses');

        const response = await fetch(`${MAP_HANDLER_URL}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success && data.houses) {
            housePolygonsData = data.houses;

            // Add houses to allMarkersData for search
            const housesForSearch = data.houses.map(house => ({
                ...house,
                type: 'household'
            }));
            allMarkersData = [...allMarkersData, ...housesForSearch];

            renderHousePolygons();
        }
    } catch (error) {
        console.error('ERROR LOADING HOUSE POLYGONS:', error);
    }
}

function renderHousePolygons() {
    if (housePolygonsLayer) {
        map.removeLayer(housePolygonsLayer);
    }

    // Create a dedicated pane for house polygons sitting above flood layers
    // but below the default overlay pane (markers, fault line etc. at 400).
    // This means flood zones are still clickable in any area not covered by a house footprint.
    if (!map.getPane('housePane')) {
        map.createPane('housePane');
        map.getPane('housePane').style.zIndex = 380;
        map.getPane('housePane').style.pointerEvents = 'auto';
    }

    housePolygonsLayer = L.layerGroup();

    housePolygonsData.forEach(house => {
        if (house.coordinates) {
            try {
                const coords = JSON.parse(house.coordinates);
                const latLngCoords = coords.map(coord => [coord[1], coord[0]]);
                latLngCoords.push(latLngCoords[0]);

                const polygon = L.polygon(latLngCoords, {
                    color: '#00247c',
                    weight: 2,
                    fillColor: '#00247c',
                    fillOpacity: 0.1,
                    interactive: true,
                    pane: 'housePane'
                });

                polygon.addTo(housePolygonsLayer);
                const popupContent = createHousePopup(house);
                polygon.bindPopup(popupContent);
                polygon.houseData = house;

            } catch (e) {
                console.error('Error parsing house coordinates:', e);
            }
        }
    });

    if (activeFilter === 'household') {
        housePolygonsLayer.addTo(map);
    }
}

function clearAllMarkers() {
    constructionMarkers.forEach(marker => map.removeLayer(marker));
    businessMarkers.forEach(marker => map.removeLayer(marker));
    utilityMarkers.forEach(marker => map.removeLayer(marker));
    incidentMarkers.forEach(marker => map.removeLayer(marker));

    if (floodLayer) {
        map.removeLayer(floodLayer);
    }

    // Remove flood legend if it exists
    removeFloodLegend();

    if (faultLine && map.hasLayer(faultLine)) {
        map.removeLayer(faultLine);
    }
    if (warningMarker && map.hasLayer(warningMarker)) {
        map.removeLayer(warningMarker);
    }

    constructionMarkers = [];
    businessMarkers = [];
    utilityMarkers = [];
    incidentMarkers = [];
    floodLayer = null;
    floodLegend = null;
}

// ==================== FLOOD ASSESSMENT FUNCTION ====================

/**
 * FIXED: Flood Risk Assessment
 * Now properly fetches data from PHP backend with percentages from low to high
 */
async function getFloodHousesSummary() {
    try {
        console.log('Fetching flood risk assessment from server...');

        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_flood_summary'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch flood assessment');
        }

        const data = result.data;

        // ── Build flood report with unified layout ──────────────────────────
        const riskColors = { low: '#ffc107', medium: '#ff9800', high: '#dc3545' };
        const impactColors = {
            'Minimally Affected': '#ffc107', 'Partially Affected': '#ff9800',
            'Fully Affected': '#dc3545', 'Affected': '#ff9800'
        };

        let bodyHTML = '';

        if (data.summary.total === 0) {
            bodyHTML = `<div style="text-align:center;padding:28px 0;">
                <div style="font-size:42px;margin-bottom:10px;">✓</div>
                <h3 style="color:#00247c;margin:0 0 6px;">No Flood Risk Detected</h3>
                <p style="color:#666;margin:0;font-size:13px;">All households are outside flood hazard zones.</p>
            </div>`;
        } else {
            // Risk-level bar rows
            const riskOrder = { low: 1, medium: 2, high: 3 };
            const sortedRisks = [...(data.summary.by_risk_level || [])].filter(r => r.risk_level)
                .sort((a, b) => (riskOrder[a.risk_level.toLowerCase()] || 9) - (riskOrder[b.risk_level.toLowerCase()] || 9));
            const riskBars = sortedRisks.map(item => {
                const c = riskColors[item.risk_level.toLowerCase()] || '#888';
                const pct = data.summary.total > 0 ? (item.count / data.summary.total * 100).toFixed(0) : 0;
                return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
                    <span style="background:${c};color:#fff;padding:3px 9px;border-radius:4px;font-size:11px;font-weight:700;min-width:62px;text-align:center;">${item.risk_level.toUpperCase()}</span>
                    <span style="font-size:17px;font-weight:700;color:${c};min-width:24px;">${item.count}</span>
                    <div style="flex:1;height:7px;background:#e8e8e8;border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:${c};"></div>
                    </div>
                    <span style="font-size:11px;color:#aaa;min-width:30px;">${pct}%</span>
                </div>`;
            }).join('');

            // Accordion house rows
            const sortedHouses = [...(data.houses || [])].sort((a, b) => (parseFloat(a.flood_coverage_percent) || 0) - (parseFloat(b.flood_coverage_percent) || 0));
            const houseRows = sortedHouses.map((h, i) => {
                const c = impactColors[h.impact_level] || '#888';
                const pct = parseFloat(h.flood_coverage_percent || 0).toFixed(1);
                const body = `
                    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:6px;">
                        <div><strong>Risk:</strong> <span style="color:${c};font-weight:700;">${(h.risk_level || 'Unknown').toUpperCase()}</span></div>
                        <div><strong>Coverage:</strong> ${pct}%</div>
                        ${h.area_sqm ? `<div><strong>Area:</strong> ${h.area_sqm} sqm</div>` : ''}
                    </div>
                    ${h.street_name ? `<div style="color:#888;margin-bottom:4px;">${h.street_name}</div>` : ''}
                    ${h.hazard_description ? `<div style="margin-top:6px;padding:7px 9px;background:#f8f8f8;border-radius:4px;"><strong>Hazard:</strong> ${h.hazard_description}</div>` : ''}`;
                return rptRow(`fh-${i}`, `${pct}%`, c, h.address || 'Address not specified', h.impact_level || '', body);
            }).join('');

            bodyHTML = `
                <div class="rpt-stats">
                    <div class="rpt-stat" style="border-left-color:#888;">
                        <div class="rpt-stat-num" style="color:#555;">${data.summary.minimally_affected}</div>
                        <div class="rpt-stat-label">Minimally Affected (1–24%)</div>
                    </div>
                    <div class="rpt-stat" style="border-left-color:#ff9800;">
                        <div class="rpt-stat-num" style="color:#e67e00;">${data.summary.partially_affected}</div>
                        <div class="rpt-stat-label">Partially Affected (25–74%)</div>
                    </div>
                    <div class="rpt-stat" style="border-left-color:#dc3545;">
                        <div class="rpt-stat-num" style="color:#dc3545;">${data.summary.fully_affected}</div>
                        <div class="rpt-stat-label">Fully Affected (75–100%)</div>
                    </div>
                </div>
                ${riskBars ? `<div style="background:#f8f9fa;border-radius:7px;padding:12px 14px;margin-bottom:14px;">
                    <div style="font-size:12px;font-weight:600;color:#00247c;margin-bottom:10px;">By Flood Risk Level</div>
                    ${riskBars}
                </div>`: ''}
                <div class="rpt-list-box">
                    <h4>Affected Households <span style="font-weight:400;color:#aaa;">(${sortedHouses.length})</span></h4>
                    <p class="rpt-list-hint">Sorted by coverage % · click a row to expand</p>
                    <div class="rpt-list-scroll">${houseRows}</div>
                </div>`;
        }

        const reportHTML = `<div class="rpt-body">
            <div class="rpt-header">
                <h3>Flood Risk Assessment</h3>
                <div class="rpt-big-num">${data.summary.total}</div>
                <div class="rpt-subtitle">Households in Flood-Prone Areas</div>
            </div>
            <div class="rpt-content">
                ${bodyHTML}
                <div class="rpt-footer">
                    <h4>Recommendations</h4>
                    <ul>
                        <li>Households in high-risk zones should prepare evacuation plans</li>
                        <li>Install flood barriers and elevate important items</li>
                        <li>Monitor weather alerts during rainy season</li>
                        <li>Contact Barangay Office for flood mitigation assistance</li>
                    </ul>
                </div>
            </div>
        </div>`;

        showReportSwal(reportHTML);

    } catch (error) {
        console.error('Error in flood assessment:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate flood risk assessment: ' + error.message
        });
    }
}

// ==================== FAULT LINE RISK ASSESSMENT FUNCTION ====================

async function showFaultLineRiskAssessment() {
    try {
        console.log('Fetching fault line risk assessment...');

        // Show loading indicator
        showSwal({
            title: 'Analyzing Fault Line Risk',
            html: 'Please wait while we assess structures near the fault line...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_fault_line_assessment'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fault line assessment result:', result);

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch fault line assessment');
        }

        const data = result.data;

        // ── Build fault line report with unified layout ──────────────────────
        const riskColors = { medium: '#ffc107', high: '#ff9800', critical: '#dc3545' };

        let bodyHTML = '';

        if (data.summary.total_at_risk === 0) {
            bodyHTML = `<div style="text-align:center;padding:28px 0;">
                <div style="font-size:42px;margin-bottom:10px;">✓</div>
                <h3 style="color:#00247c;margin:0 0 6px;">No Structures at Risk</h3>
                <p style="color:#666;margin:0;font-size:13px;">All structures are at safe distances from the fault line.</p>
            </div>`;
        } else {
            const sorted = [...(data.structures || [])].sort((a, b) => a.distance_meters - b.distance_meters);

            const rows = sorted.map((s, i) => {
                const c = riskColors[s.risk_level] || '#888';
                const barPct = Math.min(100, (s.distance_meters / 200) * 100).toFixed(0);
                const body = `
                    <div style="margin-bottom:8px;">
                        <strong>Distance:</strong> <span style="color:${c};font-weight:700;">${s.distance_meters}m</span> from fault line
                        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                            <div style="flex:1;height:6px;background:#e8e8e8;border-radius:3px;overflow:hidden;max-width:160px;">
                                <div style="height:100%;width:${barPct}%;background:${c};"></div>
                            </div>
                            <span style="font-size:11px;color:#aaa;">/ 200m</span>
                        </div>
                    </div>
                    ${s.address ? `<div style="color:#888;margin-bottom:6px;">${s.address}</div>` : ''}
                    ${s.requirements?.length ? `
                    <div style="background:#f5f5f5;border-left:3px solid #00247c;padding:10px 12px;border-radius:4px;margin-top:6px;">
                        <strong style="color:#00247c;font-size:11px;">REQUIRED ACTIONS:</strong>
                        <ul style="margin:5px 0 0;padding-left:16px;font-size:12px;color:#555;">
                            ${s.requirements.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>` : ''}`;
                return rptRow(`fs-${i}`, `${s.distance_meters}m`, c,
                    s.address || s.street_name || 'Address not specified',
                    s.risk_level.toUpperCase(), body);
            }).join('');

            bodyHTML = `
                <div class="rpt-stats">
                    <div class="rpt-stat" style="border-left-color:#ffc107;">
                        <div class="rpt-stat-num" style="color:#e6a800;">${data.summary.medium_risk}</div>
                        <div class="rpt-stat-label">Medium (100–200m)</div>
                    </div>
                    <div class="rpt-stat" style="border-left-color:#ff9800;">
                        <div class="rpt-stat-num" style="color:#e67e00;">${data.summary.high_risk}</div>
                        <div class="rpt-stat-label">High Risk (50–100m)</div>
                    </div>
                    <div class="rpt-stat" style="border-left-color:#dc3545;">
                        <div class="rpt-stat-num" style="color:#dc3545;">${data.summary.critical}</div>
                        <div class="rpt-stat-label">Critical (&lt;50m)</div>
                    </div>
                </div>
                <div class="rpt-list-box">
                    <h4>Structures at Risk <span style="font-weight:400;color:#aaa;">(${sorted.length})</span></h4>
                    <p class="rpt-list-hint">Sorted by distance · click a row to expand</p>
                    <div class="rpt-list-scroll">${rows}</div>
                </div>`;
        }

        const reportHTML = `<div class="rpt-body">
            <div class="rpt-header">
                <h3>Fault Line Risk Assessment</h3>
                <div class="rpt-big-num">${data.summary.total_at_risk}</div>
                <div class="rpt-subtitle">Structures Within Risk Zone (&lt;200m from Fault Line)</div>
            </div>
            <div class="rpt-content">
                ${bodyHTML}
                <div class="rpt-footer">
                    <h4>Legal Requirements</h4>
                    <ul>
                        <li><strong>Critical (&lt;50m):</strong> Mandatory structural engineer cert, geological survey &amp; reinforced foundation</li>
                        <li><strong>High (50–100m):</strong> Seismic design standards &amp; structural engineer certification required</li>
                        <li><strong>Medium (100–200m):</strong> Enhanced foundation recommended; standard codes with seismic provisions apply</li>
                    </ul>
                </div>
            </div>
        </div>`;

        showReportSwal(reportHTML);

    } catch (error) {
        console.error('Error in fault line assessment:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate fault line assessment: ' + error.message
        });
    }
}

// ==================== BUSINESS SDSS REPORT ====================

async function showAllBusinessesSDSSReport() {
    try {
        console.log('Fetching business SDSS report...');
        console.log('Using URL:', MAP_HANDLER_URL);

        // Show loading indicator
        showSwal({
            title: 'Generating Report',
            html: 'Please wait while we analyze business safety compliance...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'action=get_business_sdss_report'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw text was:', text);
            throw new Error('Invalid JSON response from server: ' + text.substring(0, 200));
        }

        console.log('Parsed business SDSS result:', result);

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch business SDSS report');
        }

        const data = result.data;

        // Check if data structure is correct
        if (!data || !data.summary || !data.warnings) {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid data structure received from server');
        }

        // Show report using SweetAlert2
        displayBusinessSDSSReport(data);

    } catch (error) {
        console.error('Error in business SDSS:', error);
        console.error('Error stack:', error.stack);

        showSwal({
            icon: 'error',
            title: 'Error Generating Report',
            html: `
                <div style="text-align: left;">
                    <p><strong>Failed to generate business SDSS report:</strong></p>
                    <p style="color: #cc0000; font-family: monospace; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                        ${error.message}
                    </p>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        Please check:
                    </p>
                    <ul style="text-align: left; font-size: 13px; color: #666;">
                        <li>Database connection is working</li>
                        <li>Business applications table has data with coordinates</li>
                        <li>Flood hazard data is properly configured</li>
                        <li>Check browser console for detailed error logs</li>
                    </ul>
                </div>
            `,
            width: 600
        });
    }
}

/**
 * Fixed Construction SDSS Report with better error handling
 */
async function showAllConstructionSDSSReport() {
    try {
        console.log('Fetching construction SDSS report...');
        console.log('Using URL:', MAP_HANDLER_URL);

        // Show loading indicator
        showSwal({
            title: 'Generating Report',
            html: 'Please wait while we analyze construction site safety...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'action=get_construction_sdss_report'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw text was:', text);
            throw new Error('Invalid JSON response from server: ' + text.substring(0, 200));
        }

        console.log('Parsed construction SDSS result:', result);

        if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to fetch construction SDSS report');
        }

        const data = result.data;

        // Check if data structure is correct
        if (!data || !data.summary || !data.warnings) {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid data structure received from server');
        }

        // Show report using SweetAlert2
        displayConstructionSDSSReport(data);

    } catch (error) {
        console.error('Error in construction SDSS:', error);
        console.error('Error stack:', error.stack);

        showSwal({
            icon: 'error',
            title: 'Error Generating Report',
            html: `
                <div style="text-align: left;">
                    <p><strong>Failed to generate construction SDSS report:</strong></p>
                    <p style="color: #cc0000; font-family: monospace; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                        ${error.message}
                    </p>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        Please check:
                    </p>
                    <ul style="text-align: left; font-size: 13px; color: #666;">
                        <li>Database connection is working</li>
                        <li>Construction applications table has data with coordinates</li>
                        <li>Flood hazard data is properly configured</li>
                        <li>Check browser console for detailed error logs</li>
                    </ul>
                </div>
            `,
            width: 600
        });
    }
}

/**
 * Display Business SDSS Report (same as before but with null checks)
 */
function displayBusinessSDSSReport(data) {
    if (!data || !data.summary || !data.warnings) {
        console.error('Invalid data structure:', data);
        showSwal({ icon: 'error', title: 'Error', text: 'Invalid data structure received' });
        return;
    }

    const { summary, warnings } = data;

    // ── Zero warnings: clean all-clear modal ────────────────────────────────
    if (warnings.length === 0) {
        showReportSwal(`<div class="rpt-body">
            <div class="rpt-header">
                <h3>Business Safety Compliance</h3>
                <div class="rpt-big-num">✓</div>
                <div class="rpt-subtitle">All ${summary.total} businesses are compliant — no violations detected</div>
            </div>
            <div class="rpt-content" style="text-align:center;padding-top:10px;">
                <p style="color:#555;font-size:13px;">No action required at this time.</p>
            </div>
        </div>`);
        return;
    }

    // ── Categorise ───────────────────────────────────────────────────────────
    const critical = warnings.filter(w => w.warnings?.some(x => x.severity === 'CRITICAL'));
    const high = warnings.filter(w => w.warnings?.some(x => x.severity === 'HIGH') && !critical.includes(w));
    const medium = warnings.filter(w => w.warnings?.some(x => x.severity === 'MEDIUM') && !critical.includes(w) && !high.includes(w));
    const sorted = [...medium, ...high, ...critical];

    // ── Build accordion rows ─────────────────────────────────────────────────
    const rows = sorted.map((item, idx) => {
        if (!item?.business || !item?.warnings) return '';
        const biz = item.business;
        const hasCritical = item.warnings.some(w => w.severity === 'CRITICAL');
        const hasHigh = item.warnings.some(w => w.severity === 'HIGH');
        const sev = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM';
        const c = sev === 'CRITICAL' ? '#990000' : sev === 'HIGH' ? '#cc0000' : '#555';

        const body = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:10px;font-size:12px;color:#555;">
                <div><strong>Address:</strong> ${biz.address_of_business || '—'}</div>
                <div><strong>Type:</strong> ${biz.type_of_business || '—'}</div>
                <div><strong>Employees:</strong> ${biz.no_of_employees || '—'}</div>
            </div>
            ${item.warnings.map(w => rptWarningBlock(w)).join('')}`;

        return rptRow(`biz-${idx}`, sev, c, biz.business_name || 'Unnamed Business',
            `${item.warnings.length} warning${item.warnings.length !== 1 ? 's' : ''}`, body);
    }).join('');

    const reportHTML = `<div class="rpt-body">
        <div class="rpt-header">
            <h3>Business Safety Compliance Report</h3>
            <div class="rpt-big-num">${warnings.length}</div>
            <div class="rpt-subtitle">${warnings.length === 1 ? 'Business' : 'Businesses'} with Safety Warnings · out of ${summary.total} analyzed</div>
            <div class="rpt-chips">
                <div class="rpt-chip"><span class="rpt-chip-num">${medium.length}</span><span class="rpt-chip-label">Medium</span></div>
                <div class="rpt-chip"><span class="rpt-chip-num">${high.length}</span><span class="rpt-chip-label">High</span></div>
                <div class="rpt-chip"><span class="rpt-chip-num">${critical.length}</span><span class="rpt-chip-label">Critical</span></div>
            </div>
        </div>
        <div class="rpt-content">
            <p class="rpt-list-hint" style="margin-bottom:10px;">Click a row to expand warnings &amp; required actions</p>
            ${rows}
            <div class="rpt-footer" style="text-align:center;border-left:none;background:#f8f9fa;margin-top:14px;">
                <p style="margin:0 0 4px;color:#666;font-size:12px;">For permits &amp; compliance:</p>
                <strong style="color:#00247c;">Barangay Blue Ridge B — Business Permits Office</strong>
            </div>
        </div>
    </div>`;

    showReportSwal(reportHTML);
}

/**
 * Display Construction SDSS Report (same as before but with null checks)
 */
function displayConstructionSDSSReport(data) {
    if (!data || !data.summary || !data.warnings) {
        console.error('Invalid data structure:', data);
        showSwal({ icon: 'error', title: 'Error', text: 'Invalid data structure received' });
        return;
    }

    const { summary, warnings } = data;

    // ── Zero warnings ────────────────────────────────────────────────────────
    if (warnings.length === 0) {
        showReportSwal(`<div class="rpt-body">
            <div class="rpt-header">
                <h3>Construction Site Safety</h3>
                <div class="rpt-big-num">✓</div>
                <div class="rpt-subtitle">All ${summary.total} sites are compliant — no violations detected</div>
            </div>
            <div class="rpt-content" style="text-align:center;padding-top:10px;">
                <p style="color:#555;font-size:13px;">No action required at this time.</p>
            </div>
        </div>`);
        return;
    }

    // ── Categorise ───────────────────────────────────────────────────────────
    const critical = warnings.filter(w => w.warnings?.some(x => x.severity === 'CRITICAL'));
    const high = warnings.filter(w => w.warnings?.some(x => x.severity === 'HIGH') && !critical.includes(w));
    const medium = warnings.filter(w => w.warnings?.some(x => x.severity === 'MEDIUM') && !critical.includes(w) && !high.includes(w));
    const sorted = [...medium, ...high, ...critical];

    // ── Build accordion rows ─────────────────────────────────────────────────
    const rows = sorted.map((item, idx) => {
        if (!item?.construction || !item?.warnings) return '';
        const site = item.construction;
        const hasCritical = item.warnings.some(w => w.severity === 'CRITICAL');
        const hasHigh = item.warnings.some(w => w.severity === 'HIGH');
        const sev = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM';
        const c = sev === 'CRITICAL' ? '#990000' : sev === 'HIGH' ? '#cc0000' : '#555';
        const owner = [site.first_name, site.last_name].filter(Boolean).join(' ') || 'Unknown Owner';

        const body = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:10px;font-size:12px;color:#555;">
                <div><strong>Address:</strong> ${site.construction_address || '—'}</div>
                <div><strong>Type of Work:</strong> ${site.type_of_work || '—'}</div>
                <div><strong>Activity:</strong> <span style="color:#00247c;font-weight:600;">${site.nature_of_activity || '—'}</span></div>
                <div><strong>Workers:</strong> ${site.number_of_workers || '—'}</div>
            </div>
            ${item.warnings.map(w => rptWarningBlock(w)).join('')}`;

        return rptRow(`con-${idx}`, sev, c, owner,
            `${item.warnings.length} warning${item.warnings.length !== 1 ? 's' : ''}`, body);
    }).join('');

    const reportHTML = `<div class="rpt-body">
        <div class="rpt-header">
            <h3>Construction Site Safety Report</h3>
            <div class="rpt-big-num">${warnings.length}</div>
            <div class="rpt-subtitle">${warnings.length === 1 ? 'Site' : 'Sites'} with Safety Warnings · out of ${summary.total} analyzed</div>
            <div class="rpt-chips">
                <div class="rpt-chip"><span class="rpt-chip-num">${medium.length}</span><span class="rpt-chip-label">Medium</span></div>
                <div class="rpt-chip"><span class="rpt-chip-num">${high.length}</span><span class="rpt-chip-label">High</span></div>
                <div class="rpt-chip"><span class="rpt-chip-num">${critical.length}</span><span class="rpt-chip-label">Critical</span></div>
            </div>
        </div>
        <div class="rpt-content">
            <p class="rpt-list-hint" style="margin-bottom:10px;">Click a row to expand warnings &amp; required actions</p>
            ${rows}
            <div class="rpt-footer" style="text-align:center;border-left:none;background:#f8f9fa;margin-top:14px;">
                <p style="margin:0 0 4px;color:#666;font-size:12px;">For permits &amp; compliance:</p>
                <strong style="color:#00247c;">Barangay Blue Ridge B — Engineering Office</strong>
            </div>
        </div>
    </div>`;

    showReportSwal(reportHTML);
}


// ==================== INCIDENT SUB-FILTER ====================

// Track whether sub-filter panel is expanded
let incidentFiltersExpanded = false;

async function loadIncidentSubFilters() {
    const panel = document.getElementById('incidentSubFilters');
    if (!panel) return;

    const typeIcons = {
        'theft': 'fas fa-user-secret',
        'assault': 'fas fa-fist-raised',
        'vandalism': 'fas fa-spray-can',
        'disturbance': 'fas fa-volume-up',
        'robbery': 'fas fa-mask',
        'drug': 'fas fa-pills',
        'trespassing': 'fas fa-door-open',
        'fraud': 'fas fa-file-contract',
        'harassment': 'fas fa-comment-slash',
        'fire': 'fas fa-fire'
    };

    let types = [];
    try {
        const fd = new FormData();
        fd.append('action', 'get_incident_types');
        const res = await fetch(MAP_HANDLER_URL, { method: 'POST', body: fd });
        const data = await res.json();
        types = data.success ? (data.types || []) : [];
    } catch (e) {
        console.warn('Could not load incident types:', e);
    }

    // Build type buttons for the expanded section
    const typeButtons = types.map(type => {
        const key = type.toLowerCase().split(' ')[0];
        const icon = Object.entries(typeIcons).find(([k]) => key.includes(k))?.[1] || 'fas fa-exclamation-circle';
        return `<button class="sub-filter-btn" data-incident-subtype="${type}"
            onclick="filterIncidentByType(this.dataset.incidentSubtype, event)">
            <i class="${icon}"></i><span>${type}</span>
        </button>`;
    }).join('');

    const currentLabel = incidentSubFilter === 'all' ? 'All types' : incidentSubFilter;

    panel.innerHTML = `
        <div class="sub-filters-bar">
            <button class="sub-filter-btn active" data-incident-subtype="all"
                onclick="filterIncidentByType('all', event)">
                <i class="fas fa-layer-group"></i><span>All</span>
            </button>
            <span class="sub-filter-active-label" id="incidentActiveLabel">
                ${incidentSubFilter !== 'all' ? '<strong>' + incidentSubFilter + '</strong>' : 'Showing all types'}
            </span>
            <button class="sub-filter-toggle-btn" id="incidentToggleBtn"
                onclick="toggleIncidentFilters()" title="Show / hide incident types">
                <i class="fas fa-filter"></i> Types
                <span class="toggle-arrow">▾</span>
            </button>
        </div>
        <div class="sub-filter-expanded" id="incidentTypeList">
            ${typeButtons}
        </div>`;

    // Restore expanded state if it was open
    if (incidentFiltersExpanded) {
        document.getElementById('incidentTypeList').classList.add('open');
        document.getElementById('incidentToggleBtn').classList.add('open');
    }
}

function toggleIncidentFilters() {
    const list = document.getElementById('incidentTypeList');
    const btn = document.getElementById('incidentToggleBtn');
    if (!list || !btn) return;
    incidentFiltersExpanded = !incidentFiltersExpanded;
    list.classList.toggle('open', incidentFiltersExpanded);
    btn.classList.toggle('open', incidentFiltersExpanded);
}


function filterIncidentByType(subtype, event) {
    if (event) event.stopPropagation();
    incidentSubFilter = subtype;
    document.querySelectorAll('[data-incident-subtype]').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = event ? event.currentTarget
        : document.querySelector(`[data-incident-subtype="${subtype}"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
    // Update active label
    const label = document.getElementById('incidentActiveLabel');
    if (label) label.innerHTML = subtype === 'all' ? 'Showing all types' : `<strong>${subtype}</strong>`;
    if (activeFilter === 'incident') updateMarkerVisibility();
}

function shouldShowIncidentMarker(marker) {
    if (incidentSubFilter === 'all') return true;
    const type = (marker.incident_type ||
        (marker.incident_data ? marker.incident_data.incident_type : '') || '').toLowerCase();
    return type === incidentSubFilter.toLowerCase();
}

// ==================== INCIDENT SUMMARY REPORT ====================

async function showIncidentSummaryReport() {
    showSwal({
        title: 'Loading Incident Report',
        html: 'Analyzing incident data...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const formData = new FormData();
        formData.append('action', 'get_all_incidents');
        const response = await fetch(MAP_HANDLER_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (!data.success) throw new Error('Failed to load incident data');

        const incidents = data.incidents || [];
        const geotagged = incidents.filter(i => i.latitude && i.longitude).length;

        if (incidents.length === 0) {
            showReportSwal(`<div class="rpt-body">
                <div class="rpt-header">
                    <h3>Incident Report Summary</h3>
                    <div class="rpt-big-num">0</div>
                    <div class="rpt-subtitle">No incident reports on record</div>
                </div>
                <div class="rpt-content" style="text-align:center;padding-top:10px;">
                    <p style="color:#555;font-size:13px;">No incidents with location data found.</p>
                </div>
            </div>`);
            return;
        }

        // Group by type
        const byType = {};
        incidents.forEach(inc => {
            const t = inc.incident_type || 'Other';
            byType[t] = (byType[t] || 0) + 1;
        });

        // Group by status
        const pending = incidents.filter(i => (i.status || 'Pending') === 'Pending').length;
        const investigating = incidents.filter(i => i.status === 'Under Investigation').length;
        const resolved = incidents.filter(i => i.status === 'Resolved').length;

        // Type breakdown bars
        const typeColors = ['#cc0000', '#e65c00', '#c0392b', '#8e44ad', '#2980b9', '#16a085', '#27ae60', '#f39c12'];
        const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
        const typeBars = sortedTypes.map(([type, count], i) => {
            const color = typeColors[i % typeColors.length];
            const pct = ((count / incidents.length) * 100).toFixed(0);
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="min-width:130px;font-size:12px;font-weight:600;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${type}">${type}</span>
                <span style="font-size:16px;font-weight:700;color:${color};min-width:24px;">${count}</span>
                <div style="flex:1;height:8px;background:#e8e8e8;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;"></div>
                </div>
                <span style="font-size:11px;color:#aaa;min-width:34px;">${pct}%</span>
            </div>`;
        }).join('');

        // Accordion rows — most recent first
        const sorted = [...incidents].sort((a, b) =>
            new Date(b.incident_timestamp || b.date_reported || 0) -
            new Date(a.incident_timestamp || a.date_reported || 0));

        const rows = sorted.map((inc, i) => {
            const sColor = inc.status === 'Resolved' ? '#28a745'
                : inc.status === 'Under Investigation' ? '#ff9800' : '#cc0000';
            const body = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;font-size:12px;color:#555;margin-bottom:8px;">
                    <div><strong>Victim:</strong> ${inc.vic_full_name || '—'}</div>
                    <div><strong>Reporter:</strong> ${inc.rp_full_name || '—'}</div>
                    <div><strong>Location:</strong> ${inc.vic_address || inc.rp_address || '—'}</div>
                    <div><strong>Date:</strong> ${formatDate(inc.incident_timestamp)}</div>
                    <div><strong>DSS:</strong> ${inc.dss_status || 'Pending'}</div>
                    <div><strong>Status:</strong> <span style="color:${sColor};font-weight:700;">${inc.status || 'Pending'}</span></div>
                </div>
                ${inc.description ? `<div style="background:#f8f8f8;border-left:3px solid #cc0000;padding:8px 10px;border-radius:4px;font-size:12px;color:#555;">${inc.description}</div>` : ''}`;
            return rptRow(`inc-${i}`, inc.incident_type || 'Incident', '#cc0000',
                inc.vic_full_name || inc.rp_full_name || 'Unknown',
                inc.status || 'Pending', body);
        }).join('');

        const reportHTML = `<div class="rpt-body">
            <div class="rpt-header">
                <h3>Incident Report Summary</h3>
                <div class="rpt-big-num">${incidents.length}</div>
                <div class="rpt-subtitle">Total Incidents on Record <span style="font-size:12px;font-weight:400;opacity:.7;">(${geotagged} with map location)</span></div>
                <div class="rpt-chips">
                    <div class="rpt-chip"><span class="rpt-chip-num">${pending}</span><span class="rpt-chip-label">Pending</span></div>
                    <div class="rpt-chip"><span class="rpt-chip-num">${investigating}</span><span class="rpt-chip-label">Investigating</span></div>
                    <div class="rpt-chip"><span class="rpt-chip-num">${resolved}</span><span class="rpt-chip-label">Resolved</span></div>
                </div>
            </div>
            <div class="rpt-content">
                <div style="background:#f8f9fa;border-radius:7px;padding:12px 14px;margin-bottom:14px;">
                    <div style="font-size:12px;font-weight:600;color:#00247c;margin-bottom:10px;">By Incident Type</div>
                    ${typeBars}
                </div>
                <div class="rpt-list-box">
                    <h4>All Incidents <span style="font-weight:400;color:#aaa;">(${sorted.length})</span></h4>
                    <p class="rpt-list-hint">Most recent first · click a row to expand</p>
                    <div class="rpt-list-scroll">${rows}</div>
                </div>
                <div class="rpt-footer">
                    <h4>Recommendations</h4>
                    <ul>
                        <li>Increase patrol frequency in areas with repeat incidents</li>
                        <li>Coordinate with PNP for all unresolved high-priority cases</li>
                        <li>Conduct community awareness programs for the most common incident types</li>
                        <li>Follow up on all "Under Investigation" cases within 30 days</li>
                    </ul>
                </div>
            </div>
        </div>`;

        showReportSwal(reportHTML);

    } catch (error) {
        showSwal({ icon: 'error', title: 'Error', text: 'Failed to generate incident report: ' + error.message });
    }
}

// ==================== EVENT LISTENERS ====================

// Shared helper: wires accordion toggle for any SweetAlert popup with data-accordion-toggle elements
function attachAccordionHandler(popup) {
    popup.addEventListener('click', (e) => {
        const header = e.target.closest('[data-accordion-toggle]');
        if (header) {
            const uid = header.dataset.accordionToggle;
            const body = document.getElementById(uid);
            const arrow = header.querySelector('.acc-arrow');
            if (body) {
                const open = body.style.display !== 'none';
                body.style.display = open ? 'none' : 'block';
                if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize navbar with hover and click functionality
    initNavbar();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);

        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        document.addEventListener('click', function (e) {
            const resultsContainer = document.getElementById('search-results');
            const searchBox = document.querySelector('.gm-search-box') || document.querySelector('.map-overlay--search');

            if (resultsContainer &&
                !resultsContainer.contains(e.target) &&
                e.target !== searchInput &&
                (!searchBox || !searchBox.contains(e.target))) {

                resultsContainer.style.display = 'none';
            }
        });

        searchInput.addEventListener('focus', function () {
            if (this.value.trim() !== '') {
                performSearch();
            }
        });
    }

    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('filterDropdown');
        const dropdownBtn = document.getElementById('filterDropdownBtn');

        if (dropdown && dropdownBtn &&
            !dropdown.contains(e.target) &&
            !dropdownBtn.contains(e.target)) {
            dropdown.classList.remove('show');
            dropdownBtn.classList.remove('active');
        }
    });

    // SweetAlert2 handles its own backdrop click and Escape key natively.
    // No additional listeners needed for modal close.

    const householdLink = document.querySelector('.dropdown-content a[data-type="household"]');
    if (householdLink) {
        householdLink.classList.add('active');
    }
});

// ==================== MAP INITIALIZATION ====================

map.whenReady(async function () {
    // Create a dedicated pane for the boundary polygon that sits BELOW all flood panes.
    // pointerEvents: 'none' ensures the boundary fill never intercepts clicks meant for
    // flood zones, markers, or other interactive layers drawn above it.
    if (!map.getPane('boundaryPane')) {
        map.createPane('boundaryPane');
        map.getPane('boundaryPane').style.zIndex = 300;
        map.getPane('boundaryPane').style.pointerEvents = 'none';
    }

    // Load boundary from database
    try {
        const fd = new FormData();
        fd.append('action', 'get_boundaries');
        const res = await fetch(MAP_HANDLER_URL, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.boundaries && data.boundaries.length > 0) {
            const b = data.boundaries[0];
            const coords = typeof b.coordinates === 'string'
                ? JSON.parse(b.coordinates)
                : b.coordinates;
            blueRidgeGeoJSON = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: { name: b.name },
                    geometry: { type: 'Polygon', coordinates: [coords] }
                }]
            };
        }
    } catch (e) {
        console.warn('Could not load boundary from DB:', e);
    }

    // Draw boundary polygon if available
    if (blueRidgeGeoJSON) {
        L.geoJSON(blueRidgeGeoJSON, {
            style: {
                color: '#00247C',
                weight: 3,
                fillColor: '#667eea',
                fillOpacity: 0.1,
                dashArray: '5, 5'
            },
            pane: 'boundaryPane'
        }).addTo(map);
    }

    // ============= ADD FAULT LINE (CORRECTED COORDINATES) =============
    const faultLineCoordinates = [
        [14.6175408, 121.0765329],
        [14.6177993, 121.0765362],
        [14.6180432, 121.0765517],
        [14.6182482, 121.0765671],
        [14.6185088, 121.0765914],
        [14.6188121, 121.0766554],
        [14.6190770, 121.0767448]
    ];

    // Create fault line with correct coordinates
    faultLine = L.polyline(faultLineCoordinates, {
        color: '#cc0000',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
    });

    faultLine.bindPopup(`
        <div style="max-width: 300px;">
            <h4 style="color: #cc0000; margin-bottom: 10px;">
                FAULT LINE
            </h4>
            <p><strong>Seismic Hazard Zone</strong></p>
            <p>This area has been identified as having potential seismic activity.</p>
            <p style="font-size: 0.9em; color: #666;">
                Construction and development in this area should follow earthquake-resistant guidelines.
            </p>
        </div>
    `);

    faultLine.on('mouseover', function () {
        this.setStyle({
            weight: 6,
            opacity: 1,
            color: '#cc0000'
        });
    });

    faultLine.on('mouseout', function () {
        this.setStyle({
            weight: 4,
            opacity: 0.8,
            color: '#ff0000'
        });
    });

    // Create warning marker at the midpoint of the fault line
    const midIndex = Math.floor(faultLineCoordinates.length / 2);
    const warningPoint = faultLineCoordinates[midIndex];

    const warningIcon = L.divIcon({
        className: 'fault-warning-marker',
        html: `<div style="
            position: relative;
            width: 30px;
            height: 30px;
        ">
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(180, 0, 0, 0.3);
                border-radius: 50%;
                animation: pulse-fault 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 5px;
                left: 5px;
                width: 20px;
                height: 20px;
                background: rgba(180, 0, 0, 0.9);
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-exclamation" style="color: white; font-size: 10px;"></i>
            </div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Add CSS animation for fault line warning marker
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-fault {
            0% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.4;
            }
            100% {
                transform: scale(1);
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(style);

    warningMarker = L.marker(warningPoint, {
        icon: warningIcon,
        title: 'Fault Line Warning'
    });

    warningMarker.bindPopup(`
        <div style="max-width: 250px;">
            <h4 style="color: #cc0000; margin-bottom: 8px;">
                EARTHQUAKE RISK AREA
            </h4>
            <p><strong>Fault Line Detected</strong></p>
            <p>Special precautions required for construction and development.</p>
            <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
                Ensure structures meet seismic design standards.
            </p>
        </div>
    `);

    // Set up soft boundary
    setupSoftBoundary();

    // Load all data
    loadAllMarkers();
    initDateTime();
    setupMobileMenuClose();
});

// ==================== BOUNDARY FUNCTIONS ====================

function setupSoftBoundary() {
    // Always enforce zoom limits regardless of whether boundary is loaded
    map.setMinZoom(18);
    map.setMaxZoom(20);

    if (!blueRidgeGeoJSON) {
        console.warn('No boundary loaded — pan lock skipped');
        addBoundaryNotification();
        return;
    }
    const bounds = L.geoJSON(blueRidgeGeoJSON).getBounds();
    const softBounds = bounds.pad(0.15);
    const warningBounds = bounds.pad(0.05);
    const maxBounds = bounds.pad(0.25);

    map.setMaxBounds(maxBounds);

    let boundaryTimeout;

    map.on('move', function () {
        clearTimeout(boundaryTimeout);

        const currentCenter = map.getCenter();

        if (!warningBounds.contains(currentCenter)) {
            showBoundaryMessage("You're leaving Barangay Blue Ridge B");

            if (!softBounds.contains(currentCenter)) {
                boundaryTimeout = setTimeout(function () {
                    let snappedLat = currentCenter.lat;
                    let snappedLng = currentCenter.lng;

                    if (snappedLat > warningBounds.getNorth()) snappedLat = warningBounds.getNorth();
                    if (snappedLat < warningBounds.getSouth()) snappedLat = warningBounds.getSouth();
                    if (snappedLng > warningBounds.getEast()) snappedLng = warningBounds.getEast();
                    if (snappedLng < warningBounds.getWest()) snappedLng = warningBounds.getWest();

                    const snappedCenter = L.latLng(snappedLat, snappedLng);

                    map.flyTo(snappedCenter, map.getZoom(), {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                }, 1000);
            }
        }
    });

    map.on('moveend', function () {
        const currentCenter = map.getCenter();

        if (!softBounds.contains(currentCenter)) {
            let snappedLat = currentCenter.lat;
            let snappedLng = currentCenter.lng;

            if (snappedLat > softBounds.getNorth()) snappedLat = softBounds.getNorth();
            if (snappedLat < softBounds.getSouth()) snappedLat = softBounds.getSouth();
            if (snappedLng > softBounds.getEast()) snappedLng = softBounds.getEast();
            if (snappedLng < softBounds.getWest()) snappedLng = softBounds.getWest();

            const snappedCenter = L.latLng(snappedLat, snappedLng);

            if (!bounds.contains(currentCenter)) {
                map.panTo(snappedCenter, {
                    animate: true,
                    duration: 0.5
                });
            }
        }
    });

    addBoundaryNotification();
}

function showBoundaryMessage(message = "Returning to Barangay Blue Ridge B") {
    const notification = document.getElementById('boundary-notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('visible');

        setTimeout(() => {
            notification.classList.remove('visible');
        }, 3000);
    }
}

function addBoundaryNotification() {
    const existing = document.getElementById('boundary-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'boundary-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00247c;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: "Inter", sans-serif;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 300px;
        text-align: center;
        border-left: 4px solid #ffffff;
        pointer-events: none;
    `;

    document.body.appendChild(notification);

    const style = document.createElement('style');
    style.textContent = `
        #boundary-notification.visible {
            transform: translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// ==================== MOBILE MENU FUNCTIONS ====================

function toggleMobileMenu() {
    const sideNav = document.querySelector('.side_nav');
    sideNav.classList.toggle('active');

    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (!dateTimeElement) return;

    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
}

function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupMobileMenuClose() {
    document.addEventListener('click', function (e) {
        const sideNav = document.querySelector('.side_nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

        if (window.getComputedStyle(mobileMenuBtn).display !== 'none') {
            if (sideNav.classList.contains('active') &&
                !sideNav.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                sideNav.classList.remove('active');
            }
        }
    });
}

// ==================== DEBUG FUNCTION ====================

function debugFloodState() {
    console.log('Flood Layer Active:', floodLayerActive);
    console.log('Flood Layer exists:', !!floodLayer);
    console.log('Flood Layer on map:', floodLayer ? map.hasLayer(floodLayer) : false);
    console.log('Flood Legend exists:', !!floodLegend);
    console.log('Flood Legend on map:', floodLegend ? hasControl(floodLegend) : false);

    // Check DOM for legend
    const legendElement = document.querySelector('.flood-legend');
    console.log('Flood Legend in DOM:', !!legendElement);
}

// ==================== SDSS RULES SUMMARY REPORT ====================

/**
 * Show SDSS Rules Summary Report
 */
async function showSDSSRulesReport() {
    try {
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_sdss_rules_summary'
        });

        const result = await response.json();

        if (result.status === 'success') {
            displaySDSSRulesReport(result.data);
        } else {
            showSwal({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Failed to load SDSS rules summary',
                confirmButtonColor: '#00247c'
            });
        }
    } catch (error) {
        console.error('Error fetching SDSS rules summary:', error);
        showSwal({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch SDSS rules summary',
            confirmButtonColor: '#00247c'
        });
    }
}

/**
 * Display SDSS Rules Summary Report
 */
function displaySDSSRulesReport(data) {
    const { summary, rules } = data;

    // Group rules by category
    const floodRules = [];
    const seismicRules = [];
    const constructionRules = [];
    const businessRules = [];

    for (const [key, rule] of Object.entries(rules)) {
        if (rule.category === 'Flood Hazard') floodRules.push({ key, ...rule });
        else if (rule.category === 'Seismic Hazard') seismicRules.push({ key, ...rule });
        else if (rule.category === 'Construction Safety') constructionRules.push({ key, ...rule });
        else if (rule.category === 'Business Safety') businessRules.push({ key, ...rule });
    }

    const renderCategory = (title, icon, rulesArr, totalHouses) => {
        if (rulesArr.length === 0) return '';
        return `
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 18px 20px; margin-bottom: 16px;">
                <h4 style="color: #00247c; margin: 0 0 4px 0; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${icon}"></i> ${title}
                </h4>
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #aaa;">Click any rule to expand details.</p>
                <div style="display: grid; gap: 8px;">
                    ${rulesArr.map((rule, i) => createRuleCard(rule, totalHouses, `${title.replace(/\s/g, '')}-${i}`)).join('')}
                </div>
            </div>
        `;
    };

    // Build HTML content
    let htmlContent = `
        <div class="rpt-body">
            <!-- Summary Section -->
            <div class="rpt-header">
                <h3><i class="fas fa-list-check" style="margin-right:8px;"></i>SDSS Rules Summary Report</h3>
                <div class="rpt-chips">
                    <div class="rpt-chip">
                        <span class="rpt-chip-num">${summary.total_houses}</span>
                        <span class="rpt-chip-label">Total Houses</span>
                    </div>
                    <div class="rpt-chip">
                        <span class="rpt-chip-num">${summary.total_rule_violations}</span>
                        <span class="rpt-chip-label">Total Violations</span>
                    </div>
                    <div class="rpt-chip">
                        <span class="rpt-chip-num">${summary.rules_evaluated}</span>
                        <span class="rpt-chip-label">Rules Evaluated</span>
                    </div>
                </div>
            </div>
            <div class="rpt-content">
                <div class="rpt-footer" style="margin-bottom:16px;">
                    <i class="fas fa-info-circle"></i>
                    <strong>Note:</strong> A house may violate multiple rules simultaneously. Total violations may exceed total houses.
                </div>

                ${renderCategory('Flood Hazard Rules', 'fa-water', floodRules, summary.total_houses)}
                ${renderCategory('Seismic Hazard Rules (Fault Line)', 'fa-exclamation-triangle', seismicRules, summary.total_houses)}
                ${renderCategory('Construction Safety Rules', 'fa-hard-hat', constructionRules, summary.total_houses)}
                ${renderCategory('Business Safety Rules', 'fa-building', businessRules, summary.total_houses)}
            </div>
        </div>
    `;

    Swal.fire({
        ...swalDefaultConfig,
        html: htmlContent,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: { popup: 'unified-modal-popup' },
        didOpen: (popup) => {
            attachAccordionHandler(popup);
            popup.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-rule-key]');
                if (btn) {
                    e.stopPropagation();
                    // Close SDSS rules modal first, then open affected records
                    Swal.close();
                    setTimeout(() => showRuleAffectedData(btn.dataset.ruleKey, btn.dataset.ruleName, true), 200);
                }
            });
        }
    });
}

/**
 * Create a collapsible rule card HTML
 */
function createRuleCard(rule, totalHouses, cardId) {
    const severityColors = {
        'CRITICAL': { bg: '#f5f5f5', border: '#990000', text: '#990000' },
        'HIGH': { bg: '#f5f5f5', border: '#cc0000', text: '#cc0000' },
        'MEDIUM': { bg: '#f5f5f5', border: '#555555', text: '#555555' }
    };

    const colors = severityColors[rule.severity] || severityColors['MEDIUM'];
    const pct = totalHouses > 0 ? ((rule.count / totalHouses) * 100).toFixed(1) : '0.0';
    const uid = `rule-${cardId}-${rule.key || Math.random().toString(36).slice(2)}`;
    const safeKey = rule.key || '';

    return `
        <div style="border: 2px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
            <div data-accordion-toggle="${uid}"
                 style="display: flex; justify-content: space-between; align-items: center;
                        padding: 14px 18px; cursor: pointer; background: ${colors.bg}; user-select: none;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <div style="background: white; border-radius: 50%; width: 48px; height: 48px; flex-shrink: 0;
                                display: flex; flex-direction: column; align-items: center; justify-content: center;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.12); border: 2px solid ${colors.border};">
                        <span style="font-size: 18px; font-weight: bold; color: ${colors.text}; line-height: 1;">${rule.count}</span>
                        <span style="font-size: 9px; color: #888; text-transform: uppercase;">Found</span>
                    </div>
                    <div style="min-width: 0;">
                        <div style="font-weight: 600; font-size: 14px; color: #333;">${rule.name}</div>
                        <span style="background: ${colors.text}; color: white; padding: 2px 7px; 
                                     border-radius: 10px; font-size: 11px; font-weight: 600;">${rule.severity}</span>
                    </div>
                </div>
                <span class="acc-arrow" style="transition: transform 0.2s; display: inline-block; color: #999; flex-shrink: 0; margin-left: 10px;">▼</span>
            </div>
            <div id="${uid}" style="display: none; padding: 16px 18px; background: white; border-top: 1px solid ${colors.border}40;">
                <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">${rule.description}</p>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #666; margin-bottom: 12px;">
                    <span>${rule.count > 0 ? `${pct}% of total houses affected` : 'No violations detected'}</span>
                    ${rule.count > 0 ? `
                    <div style="flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; max-width: 150px;">
                        <div style="height: 100%; width: ${Math.min(100, parseFloat(pct))}%; background: ${colors.border};"></div>
                    </div>` : ''}
                </div>
                ${rule.count > 0 && safeKey ? `
                <button data-rule-key="${safeKey}" data-rule-name="${rule.name.replace(/"/g, '&quot;')}"
                        style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
                               background: #00247c; color: white; border: none; border-radius: 6px;
                               font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;">
                    <i class="fas fa-list"></i> View ${rule.count} Affected Record${rule.count !== 1 ? 's' : ''}
                </button>` : ''}
            </div>
        </div>
    `;
}

/**
 * Fetch and display the records affected by a specific rule
 */
// Track highlighted affected polygons
let affectedHighlightLayers = [];

function clearAffectedHighlights() {
    affectedHighlightLayers.forEach(l => { if (map.hasLayer(l)) map.removeLayer(l); });
    affectedHighlightLayers = [];
}

async function showRuleAffectedData(ruleKey, ruleName, fromSDSS = false) {
    // Remove any existing affected panel
    const oldPanel = document.getElementById('affected-side-panel');
    if (oldPanel) oldPanel.remove();

    // Build panel immediately with loading state
    const panel = document.createElement('div');
    panel.id = 'affected-side-panel';
    panel.className = 'affected-side-panel';

    const restoreMap = () => {
        clearAffectedHighlights();
        updateAllVisibility();
        if (floodLayerActive && floodLayer && !map.hasLayer(floodLayer)) floodLayer.addTo(map);
        if (faultLineActive) {
            if (faultLine && !map.hasLayer(faultLine)) faultLine.addTo(map);
            if (warningMarker && !map.hasLayer(warningMarker)) warningMarker.addTo(map);
        }
    };

    const closePanel = () => {
        panel.classList.remove('open');
        setTimeout(() => { if (panel.parentNode) panel.remove(); }, 300);
        restoreMap();
    };

    const backBtn = fromSDSS ? `
        <button id="affected-back-btn"
            style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;
                   background:#f0f4ff;color:#00247c;border:1.5px solid #00247c;
                   border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
                   font-family:inherit;margin-bottom:0;width:100%;">
            <i class="fas fa-arrow-left"></i> Back to SDSS Rules
        </button>` : '';

    panel.innerHTML = `
        <div class="affected-panel-header">
            <button class="affected-panel-close" id="affected-panel-close-btn">&times;</button>
            <div style="font-size:11px;opacity:0.75;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Affected Records</div>
            <h3 style="margin:0 0 ${fromSDSS ? '10px' : '0'};font-size:15px;font-weight:700;padding-right:28px;">${ruleName}</h3>
            ${backBtn}
        </div>
        <div class="affected-panel-body" id="affected-panel-body">
            <div style="padding:28px;text-align:center;color:#888;font-size:13px;">Loading...</div>
        </div>
    `;
    document.body.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('open'));

    document.getElementById('affected-panel-close-btn').onclick = closePanel;
    if (fromSDSS) {
        document.getElementById('affected-back-btn').onclick = () => {
            closePanel();
            setTimeout(() => showSDSSRulesReport(), 320);
        };
    }
    document.addEventListener('keydown', function escH(e) {
        if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', escH); }
    });

    try {
        const formData = new FormData();
        formData.append('action', 'get_rule_affected_data');
        formData.append('rule_key', ruleKey);
        const response = await fetch(MAP_HANDLER_URL, { method: 'POST', body: formData });
        const result = await response.json();

        const bodyEl = document.getElementById('affected-panel-body');
        if (!bodyEl) return;

        if (!result.success) {
            bodyEl.innerHTML = `<div style="padding:20px;color:#cc0000;font-size:13px;">Error: ${result.message || 'Failed to load data'}</div>`;
            return;
        }

        const records = result.records || [];

        // ── Highlight matching polygons/markers on map ──────────────────────
        clearAffectedHighlights();
        hideAllMarkers();

        records.forEach(r => {
            if (r.type === 'household') {
                const houseData = housePolygonsData.find(h => String(h.house_id) === String(r.id));
                if (houseData && houseData.coordinates) {
                    try {
                        const coords = JSON.parse(houseData.coordinates);
                        const latLngs = coords.map(c => [c[1], c[0]]);
                        latLngs.push(latLngs[0]);
                        const poly = L.polygon(latLngs, {
                            color: '#dc3545', weight: 3,
                            fillColor: '#dc3545', fillOpacity: 0.35,
                            interactive: true, pane: 'housePane'
                        }).addTo(map);
                        poly.bindPopup(`<div class="popup-content"><h4><span>${r.name}</span><span class="household-badge" style="background:#dc3545;">Affected</span></h4><div class="popup-section"><p><strong>Address:</strong> ${r.address}</p><p><strong>Detail:</strong> ${r.detail}</p></div></div>`);
                        affectedHighlightLayers.push(poly);
                        return;
                    } catch (e) { console.warn('Polygon parse error', e); }
                }
                const lat = parseFloat(r.lat || r.center_lat), lng = parseFloat(r.lng || r.center_lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const m = L.circleMarker([lat, lng], { radius: 12, color: '#dc3545', weight: 2.5, fillColor: '#dc3545', fillOpacity: 0.45 }).addTo(map);
                    m.bindPopup(`<div class="popup-content"><h4><span>${r.name}</span><span class="household-badge" style="background:#dc3545;">Affected</span></h4><div class="popup-section"><p><strong>Address:</strong> ${r.address}</p><p><strong>Detail:</strong> ${r.detail}</p></div></div>`);
                    affectedHighlightLayers.push(m);
                }
            } else {
                const lat = parseFloat(r.lat || r.latitude), lng = parseFloat(r.lng || r.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const m = L.circleMarker([lat, lng], { radius: 12, color: '#dc3545', weight: 2.5, fillColor: '#dc3545', fillOpacity: 0.45 }).addTo(map);
                    m.bindPopup(`<div class="popup-content"><h4><span>${r.name}</span><span class="construction-badge" style="background:#dc3545;">Affected</span></h4><div class="popup-section"><p><strong>Address:</strong> ${r.address}</p><p><strong>Detail:</strong> ${r.detail}</p></div></div>`);
                    affectedHighlightLayers.push(m);
                }
            }
        });

        if (affectedHighlightLayers.length > 0) {
            const grp = L.featureGroup(affectedHighlightLayers);
            if (grp.getBounds().isValid()) {
                map.fitBounds(grp.getBounds(), { padding: [40, 40], maxZoom: 19 });
            }
        }

        // ── Build record list ───────────────────────────────────────────────
        if (records.length === 0) {
            bodyEl.innerHTML = `<div style="padding:28px;text-align:center;color:#888;font-size:13px;">No affected records found for this rule.</div>`;
            return;
        }

        const rows = records.map(r => `
            <div class="affected-record-row" onclick="(function(){
                const d=${JSON.stringify(r)};
                if(d.type==='household') viewHouseDetails(d.id);
                else viewMapDetails(d.id,d.type);
            })()">
                <div class="affected-record-name">${r.name}</div>
                <div class="affected-record-addr">${r.address}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                    <span class="affected-record-detail">${r.detail}</span>
                    <span class="affected-record-type">${r.type}</span>
                </div>
            </div>`).join('');

        bodyEl.innerHTML = `
            <div class="affected-panel-count">${records.length} record${records.length !== 1 ? 's' : ''} highlighted on map</div>
            <div class="affected-panel-hint">Click a row to view full details</div>
            <div class="affected-records-list">${rows}</div>
        `;

    } catch (e) {
        const bodyEl = document.getElementById('affected-panel-body');
        if (bodyEl) bodyEl.innerHTML = `<div style="padding:20px;color:#cc0000;font-size:13px;">Failed to fetch affected records.</div>`;
    }
}

// Make functions globally available
window.getFloodHousesSummary = getFloodHousesSummary;
window.showFaultLineRiskAssessment = showFaultLineRiskAssessment;
window.showAllBusinessesSDSSReport = showAllBusinessesSDSSReport;
window.showAllConstructionSDSSReport = showAllConstructionSDSSReport;
window.displayBusinessSDSSReport = displayBusinessSDSSReport;
window.displayConstructionSDSSReport = displayConstructionSDSSReport;
window.showSDSSRulesReport = showSDSSRulesReport;
window.showRuleAffectedData = showRuleAffectedData;
window.clearAffectedHighlights = clearAffectedHighlights;
window.showIncidentSummaryReport = showIncidentSummaryReport;
window.filterIncidentByType = filterIncidentByType;
window.loadIncidentSubFilters = loadIncidentSubFilters;

// Popup detail button handlers - must be on window so Leaflet popup onclick attributes can reach them
window.viewMapDetails = viewMapDetails;
window.viewFloodDetails = viewFloodDetails;
window.viewHouseDetails = viewHouseDetails;
window.closeModal = closeModal;