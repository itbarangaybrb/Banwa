/**
 * SDSS (Spatial Decision Support System) Rules Configuration
 * Barangay Blue Ridge B - Map System
 * 
 * This file contains all validation rules and spatial analysis criteria
 * for businesses, construction sites, utilities, and households.
 */

const SDSS_RULES = {
    
    // ==================== FLOOD RISK RULES ====================
    flood: {
        // Distance from flood zones (in meters)
        safe_distance: 100,
        warning_distance: 50,
        danger_distance: 10,
        
        // Risk level thresholds
        risk_levels: {
            high: {
                color: '#ff0000',
                label: 'High Risk',
                description: 'Located in high flood risk zone - immediate action required',
                recommendations: [
                    'Install flood barriers and elevation systems',
                    'Develop evacuation plan',
                    'Store important documents above flood level',
                    'Consider flood insurance'
                ]
            },
            medium: {
                color: '#ff9900',
                label: 'Medium Risk',
                description: 'Located in moderate flood risk zone - precautions needed',
                recommendations: [
                    'Monitor weather alerts during rainy season',
                    'Prepare sandbags and drainage systems',
                    'Keep emergency supplies ready'
                ]
            },
            low: {
                color: '#ffff00',
                label: 'Low Risk',
                description: 'Located in low flood risk zone - minimal concern',
                recommendations: [
                    'Maintain proper drainage around property',
                    'Stay informed during heavy rainfall',
                    'Keep gutters clear'
                ]
            },
            'very-low': {
                color: '#0066cc',
                label: 'Very Low Risk',
                description: 'Minimal flood risk - routine monitoring sufficient',
                recommendations: [
                    'General property maintenance',
                    'Stay aware during extreme weather'
                ]
            },
            safe: {
                color: '#4caf50',
                label: 'Safe',
                description: 'No flood risk detected',
                recommendations: ['Continue regular maintenance']
            }
        }
    },
    
    // ==================== FAULT LINE RULES ====================
    fault_line: {
        // Distance from fault line (in meters)
        critical_distance: 50,
        high_risk_distance: 100,
        medium_risk_distance: 200,
        
        risk_levels: {
            critical: {
                color: '#8B0000',
                label: 'Critical',
                description: 'Within critical fault line zone - construction prohibited',
                violations: [
                    'Construction within 50m of fault line is prohibited',
                    'Existing structures require seismic retrofitting',
                    'Special engineering assessment required'
                ]
            },
            high: {
                color: '#ff0000',
                label: 'High Risk',
                description: 'Near fault line - special seismic requirements',
                requirements: [
                    'Seismic design standards mandatory',
                    'Structural engineer certification required',
                    'Regular safety inspections needed'
                ]
            },
            medium: {
                color: '#ff9800',
                label: 'Medium Risk',
                description: 'Moderate distance from fault line - precautions advised',
                requirements: [
                    'Enhanced foundation design recommended',
                    'Earthquake preparedness plan required'
                ]
            },
            low: {
                color: '#4caf50',
                label: 'Low Risk',
                description: 'Safe distance from fault line',
                requirements: ['Standard building codes apply']
            }
        }
    },
    
    // ==================== BUSINESS RULES ====================
    business: {
        max_employees_per_area: {
            // Maximum employees per square meter of business area
            retail: 0.1, // 1 employee per 10 sqm
            restaurant: 0.15,
            office: 0.08,
            warehouse: 0.05,
            default: 0.1
        },
        
        required_permits: {
            high_risk: [
                'Business Permit',
                'Fire Safety Inspection Certificate',
                'Sanitary Permit',
                'Environmental Compliance Certificate',
                'Building Permit',
                'Occupancy Permit'
            ],
            medium_risk: [
                'Business Permit',
                'Fire Safety Inspection Certificate',
                'Sanitary Permit'
            ],
            low_risk: [
                'Business Permit',
                'Barangay Clearance'
            ]
        },
        
        violations: {
            no_permit: {
                severity: 'critical',
                description: 'Operating without valid business permit',
                action: 'Cease operations immediately'
            },
            flood_zone: {
                severity: 'high',
                description: 'Business located in flood hazard zone without mitigation',
                action: 'Install flood prevention measures within 30 days'
            },
            overcrowding: {
                severity: 'medium',
                description: 'Employee count exceeds safe capacity',
                action: 'Reduce staff or expand premises'
            }
        }
    },
    
    // ==================== CONSTRUCTION RULES ====================
    construction: {
        types: {
            major: {
                label: 'Major Construction',
                description: 'New building construction, additions over 50 sqm',
                required_permits: [
                    'Building Permit',
                    'Excavation Permit',
                    'Construction Safety Permit',
                    'Environmental Clearance'
                ],
                minimum_lot_area: 100, // sqm
                maximum_height: 15, // meters
                setback_requirements: {
                    front: 3,
                    side: 2,
                    rear: 2
                }
            },
            minor: {
                label: 'Minor Construction',
                description: 'Renovations, additions under 50 sqm',
                required_permits: [
                    'Building Permit',
                    'Barangay Clearance'
                ],
                minimum_lot_area: 50,
                maximum_height: 10
            },
            repair: {
                label: 'Repair/Renovation',
                description: 'Maintenance and repairs',
                required_permits: [
                    'Barangay Clearance',
                    'Repair Permit'
                ],
                restrictions: 'No structural changes allowed'
            },
            demolition: {
                label: 'Demolition',
                description: 'Building demolition',
                required_permits: [
                    'Demolition Permit',
                    'Waste Management Plan',
                    'Safety Plan'
                ],
                safety_distance: 20 // meters from adjacent properties
            }
        },
        
        violations: {
            no_permit: {
                severity: 'critical',
                description: 'Construction without valid permit',
                action: 'Stop work order - immediate compliance required',
                penalty: 'Fines and possible demolition'
            },
            flood_zone_construction: {
                severity: 'critical',
                description: 'Construction in high flood risk area',
                action: 'Requires special flood-resistant design approval',
                requirements: [
                    'Elevated foundation (minimum 1.5m above flood level)',
                    'Flood-resistant materials',
                    'Structural engineer certification'
                ]
            },
            fault_line_violation: {
                severity: 'critical',
                description: 'Construction within critical fault line zone',
                action: 'Construction prohibited - relocate project',
                legal: 'Violation of National Building Code'
            },
            inadequate_workers: {
                severity: 'medium',
                description: 'Insufficient workers for project timeline',
                action: 'Revise schedule or increase workforce'
            },
            excessive_duration: {
                severity: 'medium',
                description: 'Construction period exceeds reasonable timeframe',
                action: 'Provide justification or expedite work'
            }
        },
        
        safety_requirements: {
            minimum_workers_per_project_type: {
                major: 5,
                minor: 2,
                repair: 1,
                demolition: 3
            },
            maximum_working_days: {
                major: 365,
                minor: 90,
                repair: 30,
                demolition: 60
            }
        }
    },
    
    // ==================== UTILITY RULES ====================
    utility: {
        providers: {
            electricity: ['MERALCO'],
            water: ['Manila Water', 'Maynilad'],
            telecommunications: ['PLDT', 'Globe', 'Smart', 'Converge'],
            sewage: ['Municipal'],
            gas: ['Licensed LPG Providers']
        },
        
        violations: {
            unauthorized_provider: {
                severity: 'high',
                description: 'Work by unauthorized service provider',
                action: 'Verify credentials and permits'
            },
            unsafe_installation: {
                severity: 'critical',
                description: 'Installation violates safety standards',
                action: 'Immediate correction required'
            }
        }
    },
    
    // ==================== HOUSEHOLD RULES ====================
    household: {
        minimum_lot_area: 40, // sqm
        maximum_occupancy_per_sqm: 0.05, // 1 person per 20 sqm
        
        violations: {
            overcrowding: {
                severity: 'high',
                description: 'Household exceeds safe occupancy limits',
                action: 'Reduce occupants or expand living space'
            },
            flood_vulnerable: {
                severity: 'high',
                description: 'Household in flood zone without protection',
                action: 'Install flood mitigation measures'
            }
        }
    }
};

/**
 * SDSS Validation Functions
 */
const SDSS_VALIDATORS = {
    
    /**
     * Check if a point is within a flood zone
     */
    checkFloodRisk: function(lat, lng, floodLayer) {
        if (!floodLayer) return { risk: 'safe', inZone: false };
        
        const point = L.latLng(lat, lng);
        let floodRisk = 'safe';
        let inZone = false;
        let hazardData = null;
        
        floodLayer.eachLayer(layer => {
            if (layer.getBounds && layer.getBounds().contains(point)) {
                inZone = true;
                if (layer.hazardData) {
                    floodRisk = layer.hazardData.risk_level || 'low';
                    hazardData = layer.hazardData;
                }
            }
        });
        
        return {
            risk: floodRisk,
            inZone: inZone,
            data: hazardData,
            info: SDSS_RULES.flood.risk_levels[floodRisk] || SDSS_RULES.flood.risk_levels.safe
        };
    },
    
    /**
     * Check distance from fault line
     */
    checkFaultLineProximity: function(lat, lng, faultLine, map) {
        if (!faultLine) return { risk: 'low', distance: null };
        
        const point = L.latLng(lat, lng);
        const distance = map.distance(point, faultLine.getLatLng());
        
        let risk = 'low';
        if (distance < SDSS_RULES.fault_line.critical_distance) {
            risk = 'critical';
        } else if (distance < SDSS_RULES.fault_line.high_risk_distance) {
            risk = 'high';
        } else if (distance < SDSS_RULES.fault_line.medium_risk_distance) {
            risk = 'medium';
        }
        
        return {
            risk: risk,
            distance: Math.round(distance),
            info: SDSS_RULES.fault_line.risk_levels[risk]
        };
    },
    
    /**
     * Validate business compliance
     */
    validateBusiness: function(business, floodRisk, faultLineRisk) {
        const violations = [];
        const warnings = [];
        
        // Check flood zone compliance
        if (floodRisk.risk === 'high' || floodRisk.risk === 'medium') {
            violations.push({
                rule: 'flood_zone',
                severity: floodRisk.risk === 'high' ? 'critical' : 'high',
                description: `Business in ${floodRisk.risk} flood risk zone`,
                recommendation: floodRisk.info.recommendations
            });
        }
        
        // Check fault line proximity
        if (faultLineRisk.risk === 'critical' || faultLineRisk.risk === 'high') {
            violations.push({
                rule: 'fault_line',
                severity: 'critical',
                description: `Business within ${faultLineRisk.distance}m of fault line`,
                recommendation: faultLineRisk.info.requirements || faultLineRisk.info.violations
            });
        }
        
        // Check employee count (if area data available)
        if (business.no_of_employees && business.no_of_employees > 50) {
            warnings.push({
                rule: 'high_occupancy',
                severity: 'medium',
                description: 'High employee count - ensure adequate space and safety measures'
            });
        }
        
        return {
            violations: violations,
            warnings: warnings,
            compliant: violations.length === 0,
            risk_score: this.calculateRiskScore(violations, warnings)
        };
    },
    
    /**
     * Validate construction compliance
     */
    validateConstruction: function(construction, floodRisk, faultLineRisk) {
        const violations = [];
        const warnings = [];
        
        // Check fault line - CRITICAL violation
        if (faultLineRisk.risk === 'critical') {
            violations.push({
                rule: 'fault_line_violation',
                severity: 'critical',
                description: SDSS_RULES.construction.violations.fault_line_violation.description,
                action: SDSS_RULES.construction.violations.fault_line_violation.action,
                legal: SDSS_RULES.construction.violations.fault_line_violation.legal
            });
        }
        
        // Check flood zone construction
        if (floodRisk.risk === 'high') {
            violations.push({
                rule: 'flood_zone_construction',
                severity: 'critical',
                description: SDSS_RULES.construction.violations.flood_zone_construction.description,
                action: SDSS_RULES.construction.violations.flood_zone_construction.action,
                requirements: SDSS_RULES.construction.violations.flood_zone_construction.requirements
            });
        }
        
        // Check construction type and workers
        const typeOfWork = (construction.type_of_work || '').toLowerCase();
        let projectType = 'minor';
        
        if (typeOfWork.includes('major')) projectType = 'major';
        else if (typeOfWork.includes('repair')) projectType = 'repair';
        else if (typeOfWork.includes('demolition')) projectType = 'demolition';
        
        const minWorkers = SDSS_RULES.construction.safety_requirements.minimum_workers_per_project_type[projectType];
        const maxDays = SDSS_RULES.construction.safety_requirements.maximum_working_days[projectType];
        
        if (construction.number_of_workers < minWorkers) {
            warnings.push({
                rule: 'inadequate_workers',
                severity: 'medium',
                description: `${projectType} construction requires minimum ${minWorkers} workers (current: ${construction.number_of_workers})`,
                action: SDSS_RULES.construction.violations.inadequate_workers.action
            });
        }
        
        if (construction.number_of_working_days > maxDays) {
            warnings.push({
                rule: 'excessive_duration',
                severity: 'medium',
                description: `Construction period (${construction.number_of_working_days} days) exceeds recommended maximum (${maxDays} days)`,
                action: SDSS_RULES.construction.violations.excessive_duration.action
            });
        }
        
        return {
            violations: violations,
            warnings: warnings,
            compliant: violations.length === 0,
            project_type: projectType,
            risk_score: this.calculateRiskScore(violations, warnings)
        };
    },
    
    /**
     * Calculate risk score based on violations and warnings
     */
    calculateRiskScore: function(violations, warnings) {
        let score = 0;
        
        violations.forEach(v => {
            if (v.severity === 'critical') score += 10;
            else if (v.severity === 'high') score += 7;
            else if (v.severity === 'medium') score += 4;
        });
        
        warnings.forEach(w => {
            if (w.severity === 'high') score += 3;
            else if (w.severity === 'medium') score += 2;
            else score += 1;
        });
        
        return score;
    }
};

// Export for use in main map.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SDSS_RULES, SDSS_VALIDATORS };
}
