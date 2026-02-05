<?php
require_once __DIR__ . '/../../configs/database.php';

/**
 * Decision Support System Rule Engine for utility permit application evaluation
 * Implements a Rete algorithm-based expert system to assess utility permit eligibility
 */
class DSSRuleEngine
{
    private $rules = [];
    private $workingMemory = [];
    private $conflictSet = [];

    public function __construct()
    {
        $this->loadRules();
    }

    /**
     * Loads and defines all utility permit evaluation rules into the rule base
     * Each rule contains conditions to evaluate and actions to take if conditions match
     */
    private function loadRules()
    {
        $this->rules[] = [
            'id' => 'R1',
            'name' => 'Valid Utility Location Rule',
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
            'priority' => 10
        ];

        $this->rules[] = [
            'id' => 'R2',
            'name' => 'Provider Compliance Rule',
            'conditions' => [
                'function' => function ($data) {
                    $authorizedProviders = [
                        'Meralco',
                        'Maynilad',
                        'Manila Water',
                        'Converge',
                        'PLDT',
                        'Globe',
                        'Sky Cable'
                    ];

                    $provider = trim($data['provider'] ?? '');

                    return in_array($provider, $authorizedProviders);
                }
            ],
            'action' => 'mark_authorized_provider',
            'priority' => 9
        ];

        $this->rules[] = [
            'id' => 'R3',
            'name' => 'Work Safety Rule',
            'conditions' => [
                'function' => function ($data) {
                    $hazardousWorks = [
                        'High Voltage Installation',
                        'Underground Excavation',
                        'Overhead Cable Installation',
                        'Transformer Installation',
                        'Gas Line Installation'
                    ];

                    $natureOfWork = strtolower($data['nature_of_work'] ?? '');

                    foreach ($hazardousWorks as $hazardous) {
                        if (stripos($natureOfWork, strtolower($hazardous)) !== false) {
                            $hasSafetyPlan = isset($data['safety_plan']) && $data['safety_plan'] === true;
                            $hasQualifiedPersonnel = isset($data['qualified_personnel']) && $data['qualified_personnel'] === true;
                            
                            return $hasSafetyPlan && $hasQualifiedPersonnel;
                        }
                    }
                    return true;
                }
            ],
            'action' => 'mark_safe_work',
            'priority' => 8
        ];

        $this->rules[] = [
            'id' => 'R4',
            'name' => 'Valid Contact Information Rule',
            'conditions' => [
                'function' => function ($data) {
                    $phone = $data['owner_contact_no'] ?? '';

                    $validPhone = preg_match('/^[0-9]{11}$/', $phone);
                    $validName = !empty($data['first_name'] ?? '') && !empty($data['last_name'] ?? '');

                    return $validPhone && $validName;
                }
            ],
            'action' => 'mark_valid_contact',
            'priority' => 7
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

        $criticalRules = ['R1', 'R2'];
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
            if (in_array('R1', $failedCritical) || in_array('R2', $failedCritical)) {
                $evaluationDetails['rejection_reason'] = 'Failed critical rules: ' . implode(', ', $failedCritical);
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
     * @param string $ruleId - Rule identifier (e.g., 'R1', 'R2')
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
     * @param array $applicationData - Utility permit application data to evaluate
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
                return 'Application meets all requirements for approval. All critical rules passed with sufficient overall score.';

            case 'Additional Requirements Needed':
                $failed = implode(', ', $evaluationDetails['failed_rules'] ?? []);
                return "Some requirements need attention. Failed rules: {$failed}. Please address the recommendations.";

            case 'Rejected':
                $critical = implode(', ', $evaluationDetails['failed_critical'] ?? []);
                return "Application failed critical rules: {$critical}. Cannot proceed with current information.";

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
            case 'R1':
                $evaluationDetails['recommendations'][] =
                    "Utility location appears to be outside Barangay Blue Ridge B boundaries. " .
                    "Please verify the address or consider relocating within barangay jurisdiction.";
                break;

            case 'R2':
                $evaluationDetails['recommendations'][] =
                    "Utility provider is not authorized in this area. " .
                    "Please contact the barangay office for a list of authorized utility providers.";
                break;

            case 'R3':
                $evaluationDetails['recommendations'][] =
                    "For hazardous utility work, please ensure proper safety measures are in place. " .
                    "Contact the barangay engineering office for safety requirements.";
                break;

            case 'R4':
                $evaluationDetails['recommendations'][] =
                    "Please provide valid contact information (11-digit phone number and complete name).";
                break;
        }
    }
}
?>