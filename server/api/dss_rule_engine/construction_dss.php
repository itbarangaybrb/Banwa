<?php
require_once __DIR__ . '/../../configs/database.php';

/**
 * Decision Support System Rule Engine for construction permit application evaluation
 * Implements a Rete algorithm-based expert system to assess construction permit eligibility
 */
class ConstructionDSSRuleEngine
{
    private $rules = [];
    private $workingMemory = [];
    private $conflictSet = [];

    public function __construct()
    {
        $this->loadRules();
    }

    /**
     * Loads and defines all construction permit evaluation rules into the rule base
     * Each rule contains conditions to evaluate and actions to take if conditions match
     */
    private function loadRules()
    {
        $this->rules[] = [
            'id' => 'CR1',
            'name' => 'File Upload Rule',
            'conditions' => [
                'function' => function ($data) {
                    // Check if file was uploaded
                    $hasFileUpload = !empty($data['requirement_upload'] ?? '');
                    error_log("CR1 Check - Has file upload: " . ($hasFileUpload ? 'Yes' : 'No'));
                    return $hasFileUpload;
                }
            ],
            'action' => 'mark_pre_approval',
            'priority' => 10
        ];

        $this->rules[] = [
            'id' => 'CR2',
            'name' => 'Valid Construction Location Rule',
            'conditions' => [
                'function' => function ($data) {
                    $lat = $data['latitude'] ?? null;
                    $lng = $data['longitude'] ?? null;

                    if (!$lat || !$lng) return false;

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
            'priority' => 9
        ];

        $this->rules[] = [
            'id' => 'CR3',
            'name' => 'Construction Safety Compliance Rule',
            'conditions' => [
                'function' => function ($data) {
                    $restrictedActivities = [
                        'Mining',
                        'Blasting',
                        'Nuclear Facility',
                        'Hazardous Waste Disposal'
                    ];

                    $constructionActivity = strtolower($data['nature_of_activity'] ?? '');
                    $details = strtolower($data['details_of_work'] ?? '');

                    foreach ($restrictedActivities as $restricted) {
                        if (
                            stripos($constructionActivity, strtolower($restricted)) !== false ||
                            stripos($details, strtolower($restricted)) !== false
                        ) {
                            return false;
                        }
                    }
                    return true;
                }
            ],
            'action' => 'mark_compliant_construction',
            'priority' => 8
        ];

        $this->rules[] = [
            'id' => 'CR4',
            'name' => 'Contractor Qualification Rule',
            'conditions' => [
                'function' => function ($data) {
                    $contractorName = trim($data['contractor_name'] ?? '');
                    $contractorContact = trim($data['contractor_contact_number'] ?? '');

                    if (empty($contractorName) || empty($contractorContact)) {
                        return false;
                    }

                    $validContractor = !empty($contractorName) && strlen($contractorName) >= 3;
                    $validContact = preg_match('/^[0-9]{11}$/', $contractorContact);

                    return $validContractor && $validContact;
                }
            ],
            'action' => 'mark_qualified_contractor',
            'priority' => 7
        ];

        $this->rules[] = [
            'id' => 'CR5',
            'name' => 'Schedule Validation Rule',
            'conditions' => [
                'function' => function ($data) {
                    $startDate = $data['start_date'] ?? null;
                    $endDate = $data['end_date'] ?? null;
                    $workingDays = intval($data['number_of_working_days'] ?? 0);
                    $workers = intval($data['number_of_workers'] ?? 0);

                    if (!$startDate || !$endDate || $workingDays <= 0 || $workers <= 0) {
                        return false;
                    }

                    try {
                        $start = new DateTime($startDate);
                        $end = new DateTime($endDate);
                        $today = new DateTime();

                        if ($start < $today) {
                            return false;
                        }

                        $interval = $start->diff($end);
                        $totalDays = $interval->days + 1;

                        if ($totalDays < $workingDays) {
                            return false;
                        }

                        $maxDurationByWorkers = [
                            1 => 30,
                            5 => 60,
                            10 => 90,
                            20 => 180,
                            'default' => 365
                        ];

                        $maxDuration = $maxDurationByWorkers['default'];
                        foreach ($maxDurationByWorkers as $workerLimit => $duration) {
                            if ($workers <= $workerLimit && $workerLimit !== 'default') {
                                $maxDuration = $duration;
                                break;
                            }
                        }

                        return $totalDays <= $maxDuration;
                    } catch (Exception $e) {
                        return false;
                    }
                }
            ],
            'action' => 'mark_valid_schedule',
            'priority' => 6
        ];

        $this->rules[] = [
            'id' => 'CR6',
            'name' => 'Owner Agreement Rule',
            'conditions' => [
                'function' => function ($data) {
                    $agreed = $data['agreed'] ?? 0;
                    $ownerName = trim($data['first_name'] ?? '') . ' ' . trim($data['last_name'] ?? '');
                    $ownerContact = $data['contact_no_owner'] ?? '';

                    $validOwner = !empty(trim($ownerName)) && strlen($ownerName) > 3;
                    $validContact = !empty($ownerContact) && preg_match('/^[0-9]{11}$/', $ownerContact);

                    return ($agreed == 1) && $validOwner && $validContact;
                }
            ],
            'action' => 'mark_owner_agreement',
            'priority' => 5
        ];

        $this->rules[] = [
            'id' => 'CR7',
            'name' => 'Environmental Impact Rule',
            'conditions' => [
                'function' => function ($data) {
                    $activity = strtolower($data['nature_of_activity'] ?? '');
                    $typeOfWork = strtolower($data['type_of_work'] ?? '');
                    $workers = intval($data['number_of_workers'] ?? 0);

                    $highImpactActivities = [
                        'excavation',
                        'demolition',
                        'land clearing',
                        'quarrying',
                        'mining'
                    ];

                    $hasHighImpact = false;
                    foreach ($highImpactActivities as $impactActivity) {
                        if (
                            stripos($activity, $impactActivity) !== false ||
                            stripos($typeOfWork, $impactActivity) !== false
                        ) {
                            $hasHighImpact = true;
                            break;
                        }
                    }

                    if (!$hasHighImpact) {
                        return true;
                    }

                    $hasEnvironmentalPlan = false;
                    $requirements = $data['requirements'] ?? [];
                    if (is_array($requirements)) {
                        $environmentalDocs = [
                            'Environmental Impact Assessment',
                            'Environmental Certificate',
                            'Waste Management Plan',
                            'Environmental Compliance Certificate'
                        ];

                        foreach ($environmentalDocs as $doc) {
                            if (in_array($doc, $requirements)) {
                                $hasEnvironmentalPlan = true;
                                break;
                            }
                        }
                    }

                    if ($hasHighImpact && $workers > 10 && !$hasEnvironmentalPlan) {
                        return false;
                    }

                    return true;
                }
            ],
            'action' => 'mark_environmental_compliance',
            'priority' => 4
        ];
    }

    /**
     * Determines required documents based on construction activity and work type
     * @param string $activity - Nature of construction activity
     * @param string $workType - Type of construction work
     * @return array - List of required document types
     */
    private function getRequiredRequirements($activity, $workType)
    {
        $requirements = [];

        $activity = strtolower($activity);
        $workType = strtolower($workType);

        // Base requirements for all construction
        $requirements[] = 'Building Plan';
        $requirements[] = 'Contractor License';
        $requirements[] = 'Barangay Clearance';

        // Activity-specific requirements
        if (strpos($activity, 'residential') !== false) {
            $requirements[] = 'Homeowner\'s Association Approval';
        }

        if (strpos($activity, 'commercial') !== false) {
            $requirements[] = 'Business Permit';
            $requirements[] = 'Fire Safety Certificate';
        }

        if (strpos($activity, 'industrial') !== false) {
            $requirements[] = 'Environmental Compliance Certificate';
            $requirements[] = 'Safety Inspection Certificate';
        }

        // Work type specific requirements
        if (strpos($workType, 'new') !== false) {
            $requirements[] = 'Structural Design';
            $requirements[] = 'Soil Test Report';
        }

        if (strpos($workType, 'demolition') !== false) {
            $requirements[] = 'Demolition Plan';
            $requirements[] = 'Safety Plan';
            $requirements[] = 'Waste Disposal Plan';
        }

        if (strpos($workType, 'excavation') !== false) {
            $requirements[] = 'Excavation Permit';
            $requirements[] = 'Geotechnical Report';
        }

        if (strpos($workType, 'renovation') !== false) {
            $requirements[] = 'Existing Structure Assessment';
        }

        // Additional requirements for large projects
        if (strpos($activity, 'large') !== false || strpos($workType, 'major') !== false) {
            $requirements[] = 'Traffic Management Plan';
            $requirements[] = 'Community Consultation Report';
        }

        return array_unique($requirements);
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
     * @param array $data - Application data to evaluate against rules
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
                        'priority' => $rule['priority']
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
     * @return string - Final application status: 'Pre-Approved', 'Rejected', or 'Additional Requirements Needed'
     */
    private function execute($selectedRule, &$evaluationDetails)
    {
        if (!$selectedRule) {
            return 'Rejected';
        }

        $rule = $selectedRule['rule'];
        $evaluationDetails['triggered_rule'] = $rule['name'];
        $evaluationDetails['rule_id'] = $rule['id'];

        $passedRules = $evaluationDetails['passed_rules'] ?? [];
        $failedRules = $evaluationDetails['failed_rules'] ?? [];
        $score = $evaluationDetails['score'] ?? 0;
        $maxScore = $evaluationDetails['max_score'] ?? count($this->rules);

        $criticalRules = ['CR1', 'CR2', 'CR3', 'CR4'];
        $passedCritical = [];
        $failedCritical = [];

        foreach ($criticalRules as $critRuleId) {
            $critRuleName = $this->getRuleNameById($critRuleId);
            if (in_array($critRuleName, $passedRules)) {
                $passedCritical[] = $critRuleId;
            } else {
                $failedCritical[] = $critRuleId;
            }
        }

        $evaluationDetails['passed_critical'] = $passedCritical;
        $evaluationDetails['failed_critical'] = $failedCritical;

        if (count($failedCritical) > 0) {
            if (in_array('CR2', $failedCritical) || in_array('CR3', $failedCritical)) {
                $evaluationDetails['rejection_reason'] = 'Failed critical safety/location rules: ' . implode(', ', $failedCritical);
                return 'Rejected';
            } else {
                return 'Additional Requirements Needed';
            }
        }

        $passingPercentage = 75;
        $currentPercentage = ($score / $maxScore) * 100;

        if ($currentPercentage >= $passingPercentage) {
            return 'Pre-Approved';
        } else {
            return 'Additional Requirements Needed';
        }
    }

    /**
     * Retrieves rule name by its identifier for reference purposes
     * @param string $ruleId - Rule identifier (e.g., 'CR1', 'CR2')
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
     * @param array $applicationData - Construction permit application data to evaluate
     * @return array - Complete evaluation result with status, details, and timestamp
     */
    public function evaluateApplication($applicationData)
    {
        $evaluationDetails = [
            'passed_rules' => [],
            'failed_rules' => [],
            'failed_rules_details' => [],
            'recommendations' => [],
            'score' => 0,
            'max_score' => count($this->rules)
        ];

        $data = $applicationData;

        if (isset($data['requirements']) && is_string($data['requirements'])) {
            $data['requirements'] = json_decode($data['requirements'], true);
        }

        // Handle agreed field conversion
        if (isset($data['agreed']) && !is_numeric($data['agreed'])) {
            $data['agreed'] = ($data['agreed'] == true || $data['agreed'] === 'true' || $data['agreed'] == 1) ? 1 : 0;
        }

        $this->match($data);

        foreach ($this->rules as $rule) {
            try {
                $result = $rule['conditions']['function']($data);
                if ($result) {
                    $evaluationDetails['passed_rules'][] = $rule['name'];
                    $evaluationDetails['score']++;
                } else {
                    $evaluationDetails['failed_rules'][] = $rule['name'];
                    $evaluationDetails['failed_rules_details'][$rule['id']] = $rule['name'];
                    $this->generateRecommendation($rule['id'], $data, $evaluationDetails);
                }
            } catch (Exception $e) {
                $evaluationDetails['failed_rules'][] = $rule['name'] . " (Evaluation Error)";
                $evaluationDetails['failed_rules_details'][$rule['id']] = "Evaluation Error";
                error_log("Rule evaluation error for {$rule['id']}: " . $e->getMessage());
            }
        }

        $selectedRule = $this->select();
        $status = $this->execute($selectedRule, $evaluationDetails);

        $evaluationDetails['approval_probability'] =
            round(($evaluationDetails['score'] / $evaluationDetails['max_score']) * 100, 2);

        $evaluationDetails['status_explanation'] = $this->getStatusExplanation($status, $evaluationDetails);

        return [
            'status' => $status,
            'evaluation_details' => $evaluationDetails,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Generates human-readable explanation of the evaluation status
     * @param string $status - Application status from evaluation
     * @param array $evaluationDetails - Detailed evaluation results
     * @return string - Clear explanation of what the status means
     */
    private function getStatusExplanation($status, $evaluationDetails)
    {
        switch ($status) {
            case 'Pre-Approved':
                return 'Construction permit meets all safety and regulatory requirements. All critical rules passed with sufficient overall score.';

            case 'Additional Requirements Needed':
                $failed = implode(', ', $evaluationDetails['failed_rules'] ?? []);
                return "Some safety or documentation requirements need attention. Failed rules: {$failed}. Please address the recommendations.";

            case 'Rejected':
                $critical = implode(', ', $evaluationDetails['failed_critical'] ?? []);
                return "Application failed critical safety or location rules: {$critical}. Cannot proceed with current information.";

            default:
                return 'Status evaluation completed.';
        }
    }

    /**
     * Generates specific recommendations for applicants based on which rules failed
     * Provides actionable guidance to address deficiencies in the application
     * @param string $ruleId - Identifier of the failed rule
     * @param array $data - Application data for context-aware recommendations
     * @param array &$evaluationDetails - Reference to evaluation results to add recommendations
     */
    private function generateRecommendation($ruleId, $data, &$evaluationDetails)
    {
        switch ($ruleId) {
            case 'CR1':
                $required = $this->getRequiredRequirements(
                    $data['nature_of_activity'] ?? '',
                    $data['type_of_work'] ?? ''
                );
                $submitted = $data['requirements'] ?? [];
                $missing = array_diff($required, $submitted);

                if (!empty($missing)) {
                    $evaluationDetails['recommendations'][] =
                        "Please submit the following missing construction documents: " .
                        implode(', ', $missing);
                }
                break;

            case 'CR2':
                $evaluationDetails['recommendations'][] =
                    "Construction site appears to be outside Barangay Blue Ridge B boundaries. " .
                    "Please verify the address or consider relocating within barangay jurisdiction.";
                break;

            case 'CR3':
                $activity = $data['nature_of_activity'] ?? '';
                $evaluationDetails['recommendations'][] =
                    "Construction activity '{$activity}' may require special permits or may be restricted. " .
                    "Please contact the barangay engineering office for clarification.";
                break;

            case 'CR4':
                $evaluationDetails['recommendations'][] =
                    "Contractor information is incomplete or invalid. " .
                    "Please provide valid contractor name (minimum 3 characters) and 11-digit contact number.";
                break;

            case 'CR5':
                $startDate = $data['start_date'] ?? '';
                $endDate = $data['end_date'] ?? '';
                $workers = $data['number_of_workers'] ?? 0;

                $evaluationDetails['recommendations'][] =
                    "Construction schedule validation failed. " .
                    "Please ensure: 1) Start date is in the future, 2) End date is after start date, " .
                    "3) Working days fit within schedule, 4) Duration is appropriate for {$workers} workers.";
                break;

            case 'CR6':
                $evaluationDetails['recommendations'][] =
                    "Owner agreement or information is incomplete. " .
                    "Please ensure: 1) Check agreement box, 2) Provide valid owner name, " .
                    "3) Provide valid 11-digit contact number.";
                break;

            case 'CR7':
                $activity = $data['nature_of_activity'] ?? '';
                $evaluationDetails['recommendations'][] =
                    "Construction activity '{$activity}' may have environmental impact. " .
                    "Please submit Environmental Impact Assessment or Waste Management Plan.";
                break;
        }
    }
}
