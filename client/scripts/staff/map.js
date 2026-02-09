const MAP_HANDLER_URL = '/Banwa/server/handlers/map/map_handler.php';

const map = L.map('map').setView([14.6175, 121.0756], 17);
let constructionMarkers = [];
let businessMarkers = [];
let householdMarkers = [];
let utilityMarkers = [];
let housePolygonsLayer = null;
let housePolygonsData = [];
let faultLine = null;
let warningMarker = null;

let floodLayerActive = false;
let faultLineActive = false;
let floodLayer = null;
let floodLegend = null;

let activeFilter = 'household';
let constructionSubFilter = 'all';

let allMarkersData = [];
let searchResults = [];
let activeSearchMarker = null;
let searchTimeout = null;

const blueRidgeGeoJSON = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {"name": "Barangay Blue Ridge B"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [121.07278956348526, 14.61639406374255],
                [121.07392145567032, 14.61595803532421],
                [121.07419772320655, 14.616251316435923],
                [121.07617987565104, 14.616430399403944],
                [121.07651515177966, 14.617647640629082],
                [121.07800914220171, 14.617803363969443],
                [121.07872851395038, 14.617316502559932],
                [121.07891090415784, 14.617705811277993],
                [121.07627821129921, 14.619295958728992],
                [121.07449698388697, 14.62017411386342]
            ]]
        }
    }]
};

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

const constructionIcon = L.divIcon({ 
    className: 'construction-marker', 
    iconSize: [15, 15] 
});

const businessIcon = L.divIcon({ 
    className: 'business-marker', 
    iconSize: [15, 15] 
});

const householdIcon = L.divIcon({ 
    className: 'household-marker', 
    iconSize: [12, 12] 
});

const utilityIcon = L.divIcon({ 
    className: 'utility-marker', 
    iconSize: [12, 12] 
});

const incidentIcon = L.divIcon({ 
    className: 'incident-marker', 
    iconSize: [15, 15] 
});

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId = 'detail-modal') {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// FLOOD SUMMARY FUNCTIONS - FIXED
// ============================================

async function getHousesInFlood(riskLevel = null) {
    try {
        const formData = new FormData();
        formData.append('action', 'get_houses_in_flood');
        if (riskLevel) {
            formData.append('risk_level', riskLevel);
        }
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Houses in flood response:', data); // Debug
        
        if (data.success) {
            return data.houses || [];
        } else {
            console.error('Failed to get houses:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error getting houses in flood:', error);
        return [];
    }
}

async function getFloodHousesSummary() {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_houses_summary');
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Flood summary response:', data); // Debug
        
        if (data.success && data.summary) {
            return data.summary;
        } else {
            console.error('Failed to get summary:', data);
            return { 
                total: 0, 
                fully_affected: 0,
                partially_affected: 0,
                minimally_affected: 0,
                by_risk_level: [] 
            };
        }
    } catch (error) {
        console.error('Error getting flood summary:', error);
        return { 
            total: 0, 
            fully_affected: 0,
            partially_affected: 0,
            minimally_affected: 0,
            by_risk_level: [] 
        };
    }
}

async function getFloodWarning(riskLevel, impactLevel = 'Fully Affected') {
    try {
        const formData = new FormData();
        formData.append('action', 'get_flood_warning');
        formData.append('risk_level', riskLevel);
        formData.append('impact_level', impactLevel);
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success && data.warning) {
            return data.warning;
        } else {
            // Return default warning if backend fails
            return {
                title: `${riskLevel} Flood Risk`,
                severity: 'warning',
                message: `This area has ${riskLevel} risk of flooding.`,
                recommendations: [
                    'Monitor weather conditions',
                    'Prepare emergency supplies',
                    'Know evacuation routes'
                ]
            };
        }
    } catch (error) {
        console.error('Error getting flood warning:', error);
        return {
            title: 'Flood Risk Area',
            severity: 'warning',
            message: 'This area may be affected by flooding.',
            recommendations: ['Stay informed', 'Be prepared']
        };
    }
}

async function showImprovedFloodSummary() {
    Swal.fire({
        title: 'Analyzing Flood Risk...',
        html: 'Checking houses in flood areas and calculating precise coverage...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const summary = await getFloodHousesSummary();
        console.log('Summary data:', summary); // Debug
        
        if (!summary || summary.total === 0) {
            Swal.fire({
                icon: 'success',
                title: 'No Houses in Flood Areas',
                html: `
                    <div style="text-align: left; padding: 20px;">
                        <p style="color: #28a745; font-size: 16px; margin-bottom: 15px;">
                            ✓ Great news! No houses are currently located within identified flood hazard areas.
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <strong>Stay Prepared:</strong>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                                <li>Continue monitoring weather updates</li>
                                <li>Maintain clear drainage systems</li>
                                <li>Keep emergency contact numbers ready</li>
                            </ul>
                        </div>
                    </div>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            });
            return;
        }
        
        let summaryHTML = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 25px; border-radius: 12px; 
                            margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🏘️ Flood Risk Assessment Report
                    </h3>
                    <div style="font-size: 42px; font-weight: bold; margin: 10px 0;">
                        ${summary.total}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                        ${summary.total === 1 ? 'House' : 'Houses'} Affected by Flooding
                    </div>
                    
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 28px; font-weight: bold;">${summary.fully_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Fully Affected<br/>(≥75% coverage)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 28px; font-weight: bold;">${summary.partially_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Partially Affected<br/>(25-74% coverage)</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-width: 120px;">
                            <div style="font-size: 28px; font-weight: bold;">${summary.minimally_affected || 0}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Minimally Affected<br/>(<25% coverage)</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
        `;
        
        // Process each risk level
        const riskLevels = summary.by_risk_level || [];
        
        if (riskLevels.length === 0) {
            // Fallback: get all houses manually
            const allHouses = await getHousesInFlood();
            if (allHouses.length > 0) {
                const riskGroups = {};
                allHouses.forEach(house => {
                    const level = house.risk_level || 'Unknown';
                    if (!riskGroups[level]) {
                        riskGroups[level] = [];
                    }
                    riskGroups[level].push(house);
                });
                
                for (const [riskLevel, houses] of Object.entries(riskGroups)) {
                    summaryHTML += await buildRiskLevelSection(riskLevel, houses);
                }
            }
        } else {
            // Use by_risk_level from summary
            for (const levelData of riskLevels) {
                const riskLevel = levelData.risk_level || 'Unknown';
                const count = levelData.count || levelData.house_count || 0;
                
                if (count > 0) {
                    // Get houses for this risk level
                    const houses = await getHousesInFlood(riskLevel);
                    summaryHTML += await buildRiskLevelSection(riskLevel, houses);
                }
            }
        }
        
        summaryHTML += `
                </div>
                
                <div style="background: #f8f9fa; 
                            padding: 20px; 
                            border-radius: 10px; 
                            text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        For emergency assistance, contact:
                    </p>
                    <div style="font-weight: bold; color: #333; font-size: 16px;">
                        Barangay Blue Ridge B Emergency Hotline
                    </div>
                    <div style="margin-top: 15px;">
                        <button onclick="Swal.close();" 
                                style="padding: 10px 30px; background: #667eea; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: summaryHTML,
            width: 900,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('Error in showImprovedFloodSummary:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Flood Summary',
            html: `
                <p>Failed to load flood summary data.</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Error: ${error.message}
                </p>
                <p style="font-size: 12px; color: #666;">
                    Please check console for details.
                </p>
            `,
            confirmButtonText: 'OK'
        });
    }
}

async function buildRiskLevelSection(riskLevel, houses) {
    const warning = await getFloodWarning(riskLevel);
    const count = houses.length;
    
    // Count impact levels
    let fullyCount = 0, partiallyCount = 0, minimallyCount = 0;
    houses.forEach(house => {
        const coverage = parseFloat(house.flood_coverage_percent || 0);
        if (coverage >= 75) fullyCount++;
        else if (coverage >= 25) partiallyCount++;
        else minimallyCount++;
    });
    
    let colorScheme = {};
    switch(riskLevel.toLowerCase()) {
        case 'high':
            colorScheme = { bg: '#fee', border: '#dc3545', text: '#dc3545', icon: '🚨' };
            break;
        case 'medium':
            colorScheme = { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' };
            break;
        case 'low':
            colorScheme = { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ️' };
            break;
        default:
            colorScheme = { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '✓' };
    }
    
    return `
        <div style="background: ${colorScheme.bg}; 
                    border: 2px solid ${colorScheme.border}; 
                    border-radius: 10px; 
                    padding: 20px; 
                    margin-bottom: 15px;">
            
            <div style="display: flex; justify-content: space-between; 
                        align-items: center; margin-bottom: 15px; 
                        padding-bottom: 10px; border-bottom: 2px solid ${colorScheme.border};">
                <h4 style="margin: 0; color: ${colorScheme.text}; font-size: 18px;">
                    ${colorScheme.icon} ${riskLevel.toUpperCase()} Risk Zone
                </h4>
                <span style="background: ${colorScheme.border}; 
                             color: white; 
                             padding: 5px 15px; 
                             border-radius: 20px; 
                             font-weight: bold;">
                    ${count} ${count === 1 ? 'House' : 'Houses'}
                </span>
            </div>
            
            <div style="background: white; 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin-bottom: 15px;
                        border-left: 4px solid ${colorScheme.border};">
                <p style="margin: 0 0 10px 0; color: ${colorScheme.text}; font-weight: 600;">
                    ${warning.message}
                </p>
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 10px 0;">
                    <strong style="display: block; margin-bottom: 8px; font-size: 13px; color: #333;">
                        Precise Impact Breakdown:
                    </strong>
                    <div style="display: flex; gap: 15px; font-size: 13px; flex-wrap: wrap;">
                        <span style="background: white; padding: 5px 10px; border-radius: 4px;">
                            🔴 <strong>Fully:</strong> ${fullyCount} (≥75%)
                        </span>
                        <span style="background: white; padding: 5px 10px; border-radius: 4px;">
                            🟡 <strong>Partially:</strong> ${partiallyCount} (25-74%)
                        </span>
                        <span style="background: white; padding: 5px 10px; border-radius: 4px;">
                            🟢 <strong>Minimally:</strong> ${minimallyCount} (<25%)
                        </span>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <strong style="color: ${colorScheme.text}; display: block; margin-bottom: 8px;">
                        Safety Recommendations:
                    </strong>
                    <ul style="margin: 0; padding-left: 20px; color: #555;">
                        ${warning.recommendations.map(rec => 
                            `<li style="margin-bottom: 5px;">${rec}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
            
            <div style="background: white; 
                        padding: 15px; 
                        border-radius: 8px;">
                <strong style="display: block; margin-bottom: 10px; color: #333;">
                    📍 Affected Houses (with precise coverage):
                </strong>
                <div style="max-height: 300px; 
                            overflow-y: auto; 
                            padding-right: 10px;">
                    ${houses.map((house, index) => {
                        const coverage = parseFloat(house.flood_coverage_percent || 100);
                        let coverageColor = '#28a745';
                        let coverageIcon = '🟢';
                        let impactText = 'Minimally';
                        
                        if (coverage >= 75) {
                            coverageColor = '#dc3545';
                            coverageIcon = '🔴';
                            impactText = 'Fully';
                        } else if (coverage >= 25) {
                            coverageColor = '#ffc107';
                            coverageIcon = '🟡';
                            impactText = 'Partially';
                        }
                        
                        const safeAddress = (house.address || `House #${house.house_id}`).replace(/'/g, "\\'");
                        const lat = house.center_lat || 0;
                        const lng = house.center_lng || 0;
                        
                        return `
                        <div style="padding: 12px; 
                                    margin-bottom: 8px; 
                                    background: #f8f9fa; 
                                    border-radius: 6px; 
                                    border-left: 4px solid ${coverageColor};
                                    cursor: pointer;
                                    transition: all 0.2s;"
                             onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(5px)'"
                             onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)'"
                             onclick="zoomToHouse(${lat}, ${lng}, '${safeAddress}', ${coverage})">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px; word-break: break-word;">
                                        ${house.address || `House #${house.house_id}`}
                                    </div>
                                    <div style="font-size: 11px; color: #666;">
                                        ${coverageIcon} ${impactText} Affected • Click to view on map
                                    </div>
                                </div>
                                <div style="background: ${coverageColor}; 
                                            color: white; 
                                            padding: 6px 14px; 
                                            border-radius: 15px; 
                                            font-weight: bold;
                                            font-size: 14px;
                                            flex-shrink: 0;">
                                    ${coverage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
    `;
}

function zoomToHouse(lat, lng, address, coverage = 0) {
    Swal.close();
    
    if (!lat || !lng) {
        console.error('Invalid coordinates:', lat, lng);
        return;
    }
    
    map.setView([lat, lng], 19, {
        animate: true,
        duration: 1.5
    });
    
    if (window.tempHouseMarker) {
        map.removeLayer(window.tempHouseMarker);
    }
    
    let markerColor = '#28a745';
    let impactText = 'Minimally Affected';
    
    if (coverage >= 75) {
        markerColor = '#dc3545';
        impactText = 'Fully Affected';
    } else if (coverage >= 25) {
        markerColor = '#ffc107';
        impactText = 'Partially Affected';
    }
    
    window.tempHouseMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'pulse-marker',
            html: `<div class="pulse" style="background: ${markerColor};"></div>`,
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    window.tempHouseMarker.bindPopup(`
        <div style="padding: 12px; min-width: 220px;">
            <strong style="font-size: 15px; display: block; margin-bottom: 10px;">
                ${address}
            </strong>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #666; font-size: 13px;">Precise Flood Coverage:</span>
                    <strong style="color: ${markerColor}; font-size: 18px;">${coverage.toFixed(1)}%</strong>
                </div>
            </div>
            <div style="color: ${markerColor}; font-weight: 600; font-size: 13px; text-align: center;">
                ⚠️ ${impactText}
            </div>
        </div>
    `).openPopup();
    
    setTimeout(() => {
        if (window.tempHouseMarker) {
            map.removeLayer(window.tempHouseMarker);
            window.tempHouseMarker = null;
        }
    }, 15000);
}

// ============================================
// SDSS FUNCTIONS - FIXED
// ============================================

function getStatusColor(status, isBackground = false) {
    const colors = {
        'APPROVE': isBackground ? '#d4edda' : '#28a745',
        'APPROVE_WITH_CONDITIONS': isBackground ? '#fff3cd' : '#ffc107',
        'DENY': isBackground ? '#f8d7da' : '#dc3545',
        'MITIGATION_REQUIRED': isBackground ? '#f8d7da' : '#dc3545'
    };
    return colors[status] || (isBackground ? '#e9ecef' : '#6c757d');
}

function getStatusIcon(status) {
    const icons = {
        'APPROVE': '✅',
        'APPROVE_WITH_CONDITIONS': '⚠️',
        'DENY': '❌',
        'MITIGATION_REQUIRED': '🛑'
    };
    return icons[status] || '?';
}

async function runBusinessSDSS(businessId) {
    try {
        const formData = new FormData();
        formData.append('action', 'sdss_evaluate_business');
        formData.append('business_id', businessId);
        
        Swal.fire({
            title: 'Running SDSS Analysis...',
            html: 'Evaluating business location against flood hazard areas...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Business SDSS response:', data); // Debug
        
        if (!data.success) {
            throw new Error(data.message || 'Evaluation failed');
        }
        
        const evaluation = data.evaluation;
        
        let htmlContent = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        📊 Business SDSS Evaluation
                    </h3>
                    <h4 style="margin: 0; font-size: 18px; opacity: 0.9;">
                        ${evaluation.business_name || 'Business Application'}
                    </h4>
                    ${evaluation.address ? `<div style="margin-top: 8px; font-size: 14px; opacity: 0.8;">${evaluation.address}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 13px; opacity: 0.7;">
                        Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                        📊 Evaluation Summary
                    </h5>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #17a2b8;">${evaluation.summary.total_rules_checked}</div>
                            <div style="font-size: 12px; color: #666;">Rules Checked</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: ${evaluation.summary.rules_triggered > 0 ? '#ffc107' : '#28a745'}">${evaluation.summary.rules_triggered}</div>
                            <div style="font-size: 12px; color: #666;">Issues Found</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${evaluation.summary.critical_issues || 0}</div>
                            <div style="font-size: 12px; color: #666;">Critical</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #ffc107;">${evaluation.summary.warnings || 0}</div>
                            <div style="font-size: 12px; color: #666;">Warnings</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 15px; border-radius: 8px; 
                                background: ${getStatusColor(evaluation.summary.overall_status, true)};
                                border: 2px solid ${getStatusColor(evaluation.summary.overall_status)};">
                        <h4 style="margin: 0; color: ${getStatusColor(evaluation.summary.overall_status)}; font-size: 18px;">
                            ${getStatusIcon(evaluation.summary.overall_status)} 
                            ${evaluation.summary.overall_status.replace(/_/g, ' ')}
                        </h4>
                    </div>
                </div>
        `;
        
        // Display rules if any
        if (evaluation.rules && evaluation.rules.length > 0) {
            htmlContent += `
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 15px 0; color: #333;">Detected Issues:</h5>
            `;
            
            evaluation.rules.forEach(rule => {
                const severityColor = rule.severity === 'critical' ? '#dc3545' : 
                                     rule.severity === 'warning' ? '#ffc107' : '#17a2b8';
                const severityBg = rule.severity === 'critical' ? '#f8d7da' : 
                                  rule.severity === 'warning' ? '#fff3cd' : '#d1ecf1';
                                  
                htmlContent += `
                    <div style="background: ${severityBg}; 
                                padding: 15px; 
                                border-radius: 8px; 
                                border-left: 4px solid ${severityColor};
                                margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <h6 style="margin: 0; color: #333; font-size: 15px;">
                                ${rule.severity === 'critical' ? '🚨' : rule.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                ${rule.rule_name}
                            </h6>
                            <span style="background: ${severityColor}; 
                                         color: white; 
                                         padding: 3px 10px; 
                                         border-radius: 12px; 
                                         font-size: 11px;
                                         font-weight: bold;">
                                ${rule.severity.toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                            ${rule.message}
                        </p>
                        ${rule.details ? `
                            <div style="background: white; padding: 10px; border-radius: 5px; font-size: 13px;">
                                <strong>Details:</strong><br/>
                                <div style="margin-top: 5px; color: #666;">
                                    ${rule.details.hazard_name ? `<div><strong>Hazard:</strong> ${rule.details.hazard_name}</div>` : ''}
                                    ${rule.details.risk_level ? `<div><strong>Risk Level:</strong> <span style="color: ${severityColor}; font-weight: bold;">${rule.details.risk_level.toUpperCase()}</span></div>` : ''}
                                    ${rule.details.coverage_percent ? `<div><strong>Coverage:</strong> ${rule.details.coverage_percent}%</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        ${rule.recommendation ? `
                            <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; font-size: 13px;">
                                <strong>Recommendation:</strong><br/>
                                ${rule.recommendation}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            htmlContent += `</div>`;
        } else {
            htmlContent += `
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                    <h5 style="margin: 0; color: #155724;">
                        ✅ No Issues Detected
                    </h5>
                    <p style="margin: 10px 0 0 0; color: #155724;">
                        This business location meets all SDSS requirements. No flood hazards detected.
                    </p>
                </div>
            `;
        }
        
        htmlContent += `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <button onclick="Swal.close();" 
                            style="padding: 12px 30px; background: #667eea; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: htmlContent,
            width: 850,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('SDSS evaluation error:', error);
        Swal.fire({
            icon: 'error',
            title: 'SDSS Evaluation Failed',
            html: `
                <p>${error.message || 'An error occurred during evaluation.'}</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Please check the console for details.
                </p>
            `,
            confirmButtonText: 'OK'
        });
    }
}

async function runConstructionSDSS(constructionId) {
    try {
        const formData = new FormData();
        formData.append('action', 'sdss_evaluate_construction');
        formData.append('construction_id', constructionId);
        
        Swal.fire({
            title: 'Running SDSS Analysis...',
            html: 'Evaluating construction site against flood hazard areas...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        
        const response = await fetch(MAP_HANDLER_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Construction SDSS response:', data); // Debug
        
        if (!data.success) {
            throw new Error(data.message || 'Evaluation failed');
        }
        
        const evaluation = data.evaluation;
        
        let htmlContent = `
            <div style="max-width: 800px; text-align: left;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                            color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 24px;">
                        🏗️ Construction SDSS Evaluation
                    </h3>
                    <h4 style="margin: 0; font-size: 16px; opacity: 0.9;">
                        ${evaluation.address || 'Construction Site'}
                    </h4>
                    ${evaluation.nature_of_work ? `<div style="margin-top: 8px; font-size: 14px; opacity: 0.8;">${evaluation.nature_of_work}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 13px; opacity: 0.7;">
                        Evaluated: ${new Date(evaluation.evaluated_at).toLocaleString()}
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                        📊 Evaluation Summary
                    </h5>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #17a2b8;">${evaluation.summary.total_rules_checked}</div>
                            <div style="font-size: 12px; color: #666;">Rules Checked</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: ${evaluation.summary.rules_triggered > 0 ? '#ffc107' : '#28a745'}">${evaluation.summary.rules_triggered}</div>
                            <div style="font-size: 12px; color: #666;">Issues Found</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${evaluation.summary.critical_issues || 0}</div>
                            <div style="font-size: 12px; color: #666;">Critical</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="font-size: 28px; font-weight: bold; color: #ffc107;">${evaluation.summary.warnings || 0}</div>
                            <div style="font-size: 12px; color: #666;">Warnings</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 15px; border-radius: 8px; 
                                background: ${getStatusColor(evaluation.summary.overall_status, true)};
                                border: 2px solid ${getStatusColor(evaluation.summary.overall_status)};">
                        <h4 style="margin: 0; color: ${getStatusColor(evaluation.summary.overall_status)}; font-size: 18px;">
                            ${getStatusIcon(evaluation.summary.overall_status)} 
                            ${evaluation.summary.overall_status.replace(/_/g, ' ')}
                        </h4>
                    </div>
                </div>
        `;
        
        // Display rules if any
        if (evaluation.rules && evaluation.rules.length > 0) {
            htmlContent += `
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 15px 0; color: #333;">Detected Issues:</h5>
            `;
            
            evaluation.rules.forEach(rule => {
                const severityColor = rule.severity === 'critical' ? '#dc3545' : 
                                     rule.severity === 'warning' ? '#ffc107' : '#17a2b8';
                const severityBg = rule.severity === 'critical' ? '#f8d7da' : 
                                  rule.severity === 'warning' ? '#fff3cd' : '#d1ecf1';
                                  
                htmlContent += `
                    <div style="background: ${severityBg}; 
                                padding: 15px; 
                                border-radius: 8px; 
                                border-left: 4px solid ${severityColor};
                                margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <h6 style="margin: 0; color: #333; font-size: 15px;">
                                ${rule.severity === 'critical' ? '🚨' : rule.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                ${rule.rule_name}
                            </h6>
                            <span style="background: ${severityColor}; 
                                         color: white; 
                                         padding: 3px 10px; 
                                         border-radius: 12px; 
                                         font-size: 11px;
                                         font-weight: bold;">
                                ${rule.severity.toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                            ${rule.message}
                        </p>
                        ${rule.details ? `
                            <div style="background: white; padding: 10px; border-radius: 5px; font-size: 13px;">
                                <strong>Details:</strong><br/>
                                <div style="margin-top: 5px; color: #666;">
                                    ${rule.details.hazard_name ? `<div><strong>Hazard:</strong> ${rule.details.hazard_name}</div>` : ''}
                                    ${rule.details.risk_level ? `<div><strong>Risk Level:</strong> <span style="color: ${severityColor}; font-weight: bold;">${rule.details.risk_level.toUpperCase()}</span></div>` : ''}
                                    ${rule.details.coverage_percent ? `<div><strong>Coverage:</strong> ${rule.details.coverage_percent}%</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        ${rule.recommendation ? `
                            <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; font-size: 13px;">
                                <strong>Recommendation:</strong><br/>
                                ${rule.recommendation}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            htmlContent += `</div>`;
        } else {
            htmlContent += `
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                    <h5 style="margin: 0; color: #155724;">
                        ✅ No Issues Detected
                    </h5>
                    <p style="margin: 10px 0 0 0; color: #155724;">
                        This construction site meets all SDSS requirements. No flood hazards detected.
                    </p>
                </div>
            `;
        }
        
        htmlContent += `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <button onclick="Swal.close();" 
                            style="padding: 12px 30px; background: #f5576c; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '',
            html: htmlContent,
            width: 850,
            showConfirmButton: false,
            showCloseButton: true
        });
        
    } catch (error) {
        console.error('SDSS evaluation error:', error);
        Swal.fire({
            icon: 'error',
            title: 'SDSS Evaluation Failed',
            html: `
                <p>${error.message || 'An error occurred during evaluation.'}</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Please check the console for details.
                </p>
            `,
            confirmButtonText: 'OK'
        });
    }
}

// Export functions for use
window.showImprovedFloodSummary = showImprovedFloodSummary;
window.zoomToHouse = zoomToHouse;
window.runBusinessSDSS = runBusinessSDSS;
window.runConstructionSDSS = runConstructionSDSS;
window.getStatusColor = getStatusColor;
window.getStatusIcon = getStatusIcon;