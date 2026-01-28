<?php
require_once __DIR__ . '/../../configs/database.php';

/**
 * Decision Support System Rule Engine for incident report evaluation
 * Implements a Rete algorithm-based expert system to assess incident report priority and validity
 */
class IncidentReportDSS
{
    private $rules = [];
    private $workingMemory = [];
    private $conflictSet = [];

    public function __construct()
    {
        $this->loadRules();
    }

    /**
     * Loads and defines all incident report evaluation rules into the rule base
     * Each rule contains conditions to evaluate and actions to take if conditions match
     */
    private function loadRules()
    {
        // Rule 1: Incident Severity Assessment
        $this->rules[] = [
            'id' => 'IR1',
            'name' => 'Incident Severity Rule',
            'conditions' => [
                'function' => function ($data) {
                    $incidentType = $data['incident_type'] ?? '';
                    $description = strtolower($data['description'] ?? '');
                    
                    // High severity incidents
                    $highSeverityKeywords = [
                        'assault', 'robbery', 'burglary', 'arson', 'violence', 'attack',
                        'weapon', 'knife', 'gun', 'rape', 'molestation', 'abuse',
                        'serious injury', 'hospitalization', 'ambulance', 'emergency',
                        'life-threatening', 'critical condition'
                    ];
                    
                    // Medium severity incidents
                    $mediumSeverityKeywords = [
                        'theft', 'larceny', 'vandalism', 'property damage',
                        'harassment', 'threat', 'intimidation', 'stalking',
                        'noise', 'disturbance', 'altercation', 'fight',
                        'minor injury', 'first aid', 'bruise', 'scratch'
                    ];
                    
                    // Check for high severity keywords in description
                    foreach ($highSeverityKeywords as $keyword) {
                        if (strpos($description, $keyword) !== false) {
                            return 'high';
                        }
                    }
                    
                    // Check for medium severity keywords
                    foreach ($mediumSeverityKeywords as $keyword) {
                        if (strpos($description, $keyword) !== false) {
                            return 'medium';
                        }
                    }
                    
                    // Check incident type categories
                    $highSeverityTypes = [
                        'Serious Crime',
                        'Violence Against Woman and their Children',
                        'Public Safety and Emergencies'
                    ];
                    
                    $mediumSeverityTypes = [
                        'Minor Offenses Against Persons/Safety',
                        'Minor Offenses Against Honor/Property'
                    ];
                    
                    if (in_array($incidentType, $highSeverityTypes)) {
                        return 'high';
                    } elseif (in_array($incidentType, $mediumSeverityTypes)) {
                        return 'medium';
                    }
                    
                    return 'low';
                }
            ],
            'action' => 'determine_priority',
            'priority' => 10
        ];

        // Rule 2: Timeliness of Report
        $this->rules[] = [
            'id' => 'IR2',
            'name' => 'Timeliness Rule',
            'conditions' => [
                'function' => function ($data) {
                    $incidentTimestamp = $data['incident_timestamp'] ?? null;
                    
                    if (!$incidentTimestamp) return false;
                    
                    $incidentTime = strtotime($incidentTimestamp);
                    $currentTime = time();
                    $reportTime = strtotime($data['created_at'] ?? date('Y-m-d H:i:s'));
                    
                    // Calculate hours since incident
                    $hoursSinceIncident = ($reportTime - $incidentTime) / 3600;
                    
                    if ($hoursSinceIncident <= 24) {
                        return 'timely'; // Reported within 24 hours
                    } elseif ($hoursSinceIncident <= 72) {
                        return 'moderate'; // Reported within 72 hours
                    } else {
                        return 'delayed'; // Reported after 72 hours
                    }
                }
            ],
            'action' => 'assess_timeliness',
            'priority' => 9
        ];

        // Rule 3: Location Validity
        $this->rules[] = [
            'id' => 'IR3',
            'name' => 'Location Validity Rule',
            'conditions' => [
                'function' => function ($data) {
                    $lat = $data['incident_latitude'] ?? null;
                    $lng = $data['incident_longitude'] ?? null;
                    
                    if (!$lat || !$lng) {
                        // Try to validate based on address if coordinates not available
                        $address = $data['incident_address'] ?? '';
                        $validStreets = [
                            'Comets Loop', 'Colonel Bonny Serrano Ave.', 'Crest line St',
                            'Evening Glow Rd', 'Highland Dr', 'Hillside Dr', 'Milkyway Dr',
                            'Moonlight Loop', 'Promenade Ln', 'Rajah Matanda Street',
                            'Riverview Dr', 'Starline Rd', 'Twin Peaks Dr', 'Union Lane'
                        ];
                        
                        foreach ($validStreets as $street) {
                            if (stripos($address, $street) !== false) {
                                return true;
                            }
                        }
                        return false;
                    }

                    // Define barangay boundaries
                    $barangayPolygon = [
                        [14.61639406374255, 121.07278956348526],
                        [14.61595803532421, 121.07392145567032],
                        [14.616251316435923, 121.07419772320655],
                        [14.616430399403944, 121.07617987565104],
                        [14.617647640629082, 121.07651515177966],
                        [14.617803363969443, 121.07800914220171],
                        [14.617316502559932, 121.07872851395038],
                        [14.617705811277993, 121.07891090415784],
                        [14.62017411386342, 121.07449698388697]
                    ];

                    return $this->isPointInPolygon($lat, $lng, $barangayPolygon);
                }
            ],
            'action' => 'mark_valid_location',
            'priority' => 8
        ];

        // Rule 4: Report Completeness
        $this->rules[] = [
            'id' => 'IR4',
            'name' => 'Completeness Rule',
            'conditions' => [
                'function' => function ($data) {
                    $requiredFields = [
                        'reporting_person_name',
                        'reporting_person_contact',
                        'victim_name',
                        'victim_contact',
                        'incident_type',
                        'incident_timestamp',
                        'incident_address',
                        'description'
                    ];
                    
                    $completenessScore = 0;
                    $totalFields = count($requiredFields);
                    
                    foreach ($requiredFields as $field) {
                        if (!empty($data[$field] ?? '')) {
                            $completenessScore++;
                        }
                    }
                    
                    $completionRate = ($completenessScore / $totalFields) * 100;
                    
                    if ($completionRate >= 90) {
                        return 'complete';
                    } elseif ($completionRate >= 70) {
                        return 'partial';
                    } else {
                        return 'incomplete';
                    }
                }
            ],
            'action' => 'assess_completeness',
            'priority' => 7
        ];

        // Rule 5: Witness Credibility
        $this->rules[] = [
            'id' => 'IR5',
            'name' => 'Witness Credibility Rule',
            'conditions' => [
                'function' => function ($data) {
                    // This would typically check against a database of witnesses
                    // For now, we'll use a simplified check based on witness information completeness
                    
                    // Check if witness information exists
                    $hasWitnesses = !empty($data['witnesses']) || 
                                   (!empty($data['witness_name'] ?? '') && !empty($data['witness_contact'] ?? ''));
                    
                    if (!$hasWitnesses) {
                        return 'no_witnesses';
                    }
                    
                    // Check witness information completeness
                    $witnessFields = ['witness_name', 'witness_contact'];
                    $completeWitnessInfo = true;
                    
                    foreach ($witnessFields as $field) {
                        if (empty($data[$field] ?? '')) {
                            $completeWitnessInfo = false;
                            break;
                        }
                    }
                    
                    if ($completeWitnessInfo) {
                        return 'reliable';
                    } else {
                        return 'partial_info';
                    }
                }
            ],
            'action' => 'assess_witness_credibility',
            'priority' => 6
        ];

        // Rule 6: Suspect Information Quality
        $this->rules[] = [
            'id' => 'IR6',
            'name' => 'Suspect Information Rule',
            'conditions' => [
                'function' => function ($data) {
                    $suspectName = $data['suspect_name'] ?? '';
                    $suspectDescription = $data['suspect_description'] ?? '';
                    
                    if (empty($suspectName) && empty($suspectDescription)) {
                        return 'no_suspect_info';
                    }
                    
                    $infoQualityScore = 0;
                    
                    if (!empty($suspectName)) {
                        $infoQualityScore += 3; // Name is valuable info
                    }
                    
                    if (!empty($suspectDescription)) {
                        $descriptionLength = strlen($suspectDescription);
                        if ($descriptionLength > 100) {
                            $infoQualityScore += 5; // Detailed description
                        } elseif ($descriptionLength > 50) {
                            $infoQualityScore += 3; // Moderate description
                        } else {
                            $infoQualityScore += 1; // Brief description
                        }
                    }
                    
                    if ($infoQualityScore >= 5) {
                        return 'good_quality';
                    } elseif ($infoQualityScore >= 3) {
                        return 'moderate_quality';
                    } else {
                        return 'poor_quality';
                    }
                }
            ],
            'action' => 'assess_suspect_info',
            'priority' => 5
        ];
    }

    /**
     * Determines if a geographical point is within a polygon using ray casting algorithm
     * @param float $lat - Latitude coordinate of the point
     * @param float $lng - Longitude coordinate of the point
     * @param array $polygon - Array of [lat,lng] points defining polygon vertices
     * @return bool - True if point is inside polygon, false otherwise
     */
    private function isPointInPolygon($lat, $lng, $polygon)
    {
        $x = $lng;
        $y = $lat;
        $inside = false;

        $n = count($polygon);
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $xi = $polygon[$i][1];
            $yi = $polygon[$i][0];
            $xj = $polygon[$j][1];
            $yj = $polygon[$j][0];

            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);

            if ($intersect) $inside = !$inside;
        }

        return $inside;
    }

    /**
     * Rete Algorithm Phase 1: Match - Evaluates all rules against working memory
     * Identifies which rules have their conditions satisfied by current data
     * @param array $data - Report data to evaluate against rules
     */
    private function match($data)
    {
        $this->conflictSet = [];
        $this->workingMemory = $data;

        foreach ($this->rules as $rule) {
            try {
                $conditionResult = $rule['conditions']['function']($data);

                if ($conditionResult) {
                    $this->conflictSet[] = [
                        'rule' => $rule,
                        'priority' => $rule['priority'],
                        'result' => $conditionResult
                    ];
                }
            } catch (Exception $e) {
                continue;
            }
        }

        usort($this->conflictSet, function ($a, $b) {
            return $b['priority'] - $a['priority'];
        });
    }

    /**
     * Rete Algorithm Phase 2: Select - Chooses the highest priority rule from conflict set
     * Uses priority-based conflict resolution strategy
     * @return array|null - Selected rule or null if no rules match
     */
    private function select()
    {
        return !empty($this->conflictSet) ? $this->conflictSet[0] : null;
    }

    /**
     * Rete Algorithm Phase 3: Execute - Executes action of selected rule and determines final status
     * @param array|null $selectedRule - Rule selected from conflict resolution
     * @param array &$evaluationDetails - Reference to evaluation results for updating
     * @return string - Final report priority: 'High Priority', 'Medium Priority', or 'Low Priority'
     */
    private function execute($selectedRule, &$evaluationDetails)
    {
        if (!$selectedRule) {
            return 'Low Priority';
        }

        $rule = $selectedRule['rule'];
        $evaluationDetails['triggered_rule'] = $rule['name'];
        $evaluationDetails['rule_id'] = $rule['id'];
        $evaluationDetails['rule_result'] = $selectedRule['result'];

        // Calculate overall urgency score
        $urgencyScore = $this->calculateUrgencyScore($evaluationDetails);
        $evaluationDetails['urgency_score'] = $urgencyScore;

        // Determine priority based on urgency score
        if ($urgencyScore >= 80) {
            return 'High Priority';
        } elseif ($urgencyScore >= 50) {
            return 'Medium Priority';
        } else {
            return 'Low Priority';
        }
    }

    /**
     * Calculates an urgency score based on evaluation results
     * @param array $evaluationDetails - Detailed evaluation results
     * @return int - Urgency score from 0-100
     */
    private function calculateUrgencyScore($evaluationDetails)
    {
        $score = 0;
        
        // Severity weight: 40%
        if (in_array('Incident Severity Rule', $evaluationDetails['passed_rules'] ?? [])) {
            $severityResult = $evaluationDetails['rule_results']['IR1'] ?? 'low';
            if ($severityResult === 'high') $score += 40;
            elseif ($severityResult === 'medium') $score += 25;
            else $score += 10;
        }
        
        // Timeliness weight: 20%
        if (in_array('Timeliness Rule', $evaluationDetails['passed_rules'] ?? [])) {
            $timelinessResult = $evaluationDetails['rule_results']['IR2'] ?? 'delayed';
            if ($timelinessResult === 'timely') $score += 20;
            elseif ($timelinessResult === 'moderate') $score += 12;
            else $score += 5;
        }
        
        // Location validity weight: 15%
        if (in_array('Location Validity Rule', $evaluationDetails['passed_rules'] ?? [])) {
            $score += 15;
        }
        
        // Completeness weight: 15%
        if (in_array('Completeness Rule', $evaluationDetails['passed_rules'] ?? [])) {
            $completenessResult = $evaluationDetails['rule_results']['IR4'] ?? 'incomplete';
            if ($completenessResult === 'complete') $score += 15;
            elseif ($completenessResult === 'partial') $score += 8;
            else $score += 2;
        }
        
        // Witness credibility weight: 10%
        if (in_array('Witness Credibility Rule', $evaluationDetails['passed_rules'] ?? [])) {
            $witnessResult = $evaluationDetails['rule_results']['IR5'] ?? 'no_witnesses';
            if ($witnessResult === 'reliable') $score += 10;
            elseif ($witnessResult === 'partial_info') $score += 5;
            else $score += 0;
        }
        
        return min(100, $score);
    }

    /**
     * Retrieves rule name by its identifier for reference purposes
     * @param string $ruleId - Rule identifier (e.g., 'IR1', 'IR2')
     * @return string - Rule name or empty string if not found
     */
    private function getRuleNameById($ruleId)
    {
        foreach ($this->rules as $rule) {
            if ($rule['id'] === $ruleId) {
                return $rule['name'];
            }
        }
        return '';
    }

    /**
     * Main evaluation function orchestrating the complete Rete algorithm process
     * @param array $reportData - Incident report data to evaluate
     * @return array - Complete evaluation result with status, details, and timestamp
     */
    public function evaluateReport($reportData)
    {
        $evaluationDetails = [
            'passed_rules' => [],
            'failed_rules' => [],
            'failed_rules_details' => [],
            'rule_results' => [],
            'recommendations' => [],
            'score' => 0,
            'max_score' => count($this->rules),
            'priority_level' => 'Low',
            'urgency_score' => 0
        ];

        $data = $reportData;

        $this->match($data);

        // Evaluate each rule individually
        foreach ($this->rules as $rule) {
            try {
                $result = $rule['conditions']['function']($data);
                
                if ($result && $result !== false) {
                    $evaluationDetails['passed_rules'][] = $rule['name'];
                    $evaluationDetails['rule_results'][$rule['id']] = $result;
                    $evaluationDetails['score']++;
                } else {
                    $evaluationDetails['failed_rules'][] = $rule['name'];
                    $evaluationDetails['failed_rules_details'][$rule['id']] = $rule['name'];
                    $this->generateRecommendation($rule['id'], $data, $evaluationDetails);
                }
            } catch (Exception $e) {
                $evaluationDetails['failed_rules'][] = $rule['name'] . " (Evaluation Error)";
                $evaluationDetails['failed_rules_details'][$rule['id']] = "Evaluation Error";
                $evaluationDetails['rule_results'][$rule['id']] = 'error';
            }
        }

        $selectedRule = $this->select();
        $priorityLevel = $this->execute($selectedRule, $evaluationDetails);

        // Update evaluation details with priority information
        $evaluationDetails['priority_level'] = $priorityLevel;
        $evaluationDetails['status_explanation'] = $this->getStatusExplanation($priorityLevel, $evaluationDetails);

        return [
            'status' => $priorityLevel,
            'evaluation_details' => $evaluationDetails,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Generates human-readable explanation of the evaluation status
     * @param string $priorityLevel - Report priority from evaluation
     * @param array $evaluationDetails - Detailed evaluation results
     * @return string - Clear explanation of what the priority means
     */
    private function getStatusExplanation($priorityLevel, $evaluationDetails)
    {
        $urgencyScore = $evaluationDetails['urgency_score'] ?? 0;
        $failedRules = implode(', ', $evaluationDetails['failed_rules'] ?? []);
        
        switch ($priorityLevel) {
            case 'High Priority':
                return "Report requires immediate attention. Urgency score: {$urgencyScore}/100. " .
                       "This incident involves serious matters that need prompt response from barangay officials.";

            case 'Medium Priority':
                return "Report needs attention within 24 hours. Urgency score: {$urgencyScore}/100. " .
                       "Some follow-up actions required. " . 
                       (empty($failedRules) ? '' : "Areas needing improvement: {$failedRules}.");

            case 'Low Priority':
                return "Report can be addressed within 48 hours. Urgency score: {$urgencyScore}/100. " .
                       "This is a routine incident that requires standard processing. " .
                       (empty($failedRules) ? '' : "Recommendations: Please address the following: {$failedRules}.");

            default:
                return 'Priority evaluation completed.';
        }
    }

    /**
     * Generates specific recommendations based on which rules failed
     * Provides actionable guidance to improve report quality
     * @param string $ruleId - Identifier of the failed rule
     * @param array $data - Report data for context-aware recommendations
     * @param array &$evaluationDetails - Reference to evaluation results to add recommendations
     */
    private function generateRecommendation($ruleId, $data, &$evaluationDetails)
    {
        switch ($ruleId) {
            case 'IR1':
                $evaluationDetails['recommendations'][] =
                    "Provide more specific details about the incident severity. " .
                    "Include information about injuries, damages, or threats involved.";
                break;

            case 'IR2':
                $incidentTime = $data['incident_timestamp'] ?? 'unknown';
                $evaluationDetails['recommendations'][] =
                    "This report was filed with significant delay. " .
                    "Please note that timely reporting (within 24 hours) improves investigation effectiveness. " .
                    "Incident occurred on: {$incidentTime}";
                break;

            case 'IR3':
                $evaluationDetails['recommendations'][] =
                    "Incident location appears to be outside Barangay Blue Ridge B boundaries or is unclear. " .
                    "Please verify the exact location or provide specific landmarks to help responders.";
                break;

            case 'IR4':
                $evaluationDetails['recommendations'][] =
                    "Some required information is missing from the report. " .
                    "Please ensure all fields are completed, especially: victim information, incident details, and contact information.";
                break;

            case 'IR5':
                $evaluationDetails['recommendations'][] =
                    "No witness information provided, or witness details are incomplete. " .
                    "If there were witnesses, please provide their names and contact information to support the report.";
                break;

            case 'IR6':
                $evaluationDetails['recommendations'][] =
                    "Suspect information is limited or missing. " .
                    "If the suspect is known, provide as much detail as possible about their appearance, clothing, and last known location.";
                break;
        }
    }
    
    /**
     * Special function to handle witness data if passed separately
     * This can be used when witnesses are provided as separate data
     * @param array $witnesses - Array of witness information
     * @return array - Processed witness information for evaluation
     */
    public function processWitnessData($witnesses)
    {
        $processed = [
            'has_witnesses' => !empty($witnesses),
            'witness_count' => is_array($witnesses) ? count($witnesses) : 0,
            'witnesses_complete' => 0,
            'witnesses' => []
        ];
        
        if (!empty($witnesses) && is_array($witnesses)) {
            foreach ($witnesses as $witness) {
                $complete = !empty($witness['witness_name'] ?? '') && !empty($witness['witness_contact'] ?? '');
                if ($complete) {
                    $processed['witnesses_complete']++;
                }
                $processed['witnesses'][] = $witness;
            }
        }
        
        return $processed;
    }
}
?>