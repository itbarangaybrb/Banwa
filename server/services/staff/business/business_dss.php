<?php

/**
 * Decision Support System Rule Engine for business permit application evaluation
 * Implements a Rete algorithm-based expert system to assess permit eligibility
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
     * Loads and defines all business permit evaluation rules into the rule base
     * Each rule contains conditions to evaluate and actions to take if conditions match
     */
    private function loadRules()
    {
        $this->rules[] = [
            'id' => 'R1',
            'name' => 'Complete Requirements Rule',
            'conditions' => [
                'function' => function ($data) {
                    $requiredReqs = $this->getRequiredRequirements(
                        $data['nature_of_application'] ?? '',
                        $data['type_of_business'] ?? ''
                    );
                    $submittedReqs = $data['requirements'] ?? [];
                    $missing = array_diff($requiredReqs, $submittedReqs);

                    error_log("R1 Check - Required: " . json_encode($requiredReqs));
                    error_log("R1 Check - Submitted: " . json_encode($submittedReqs));
                    error_log("R1 Check - Missing: " . json_encode($missing));

                    return empty($missing);
                }
            ],
            'action' => 'mark_pre_approval',
            'priority' => 10
        ];

        $this->rules[] = [
            'id' => 'R2',
            'name' => 'Valid Business Location Rule',
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
            'id' => 'R3',
            'name' => 'Business Type Compliance Rule',
            'conditions' => [
                'function' => function ($data) {
                    $restrictedBusinesses = [
                        'Gambling',
                        'Adult Entertainment',
                        'Firearms',
                        'Hazardous Materials',
                        'Illegal Substances'
                    ];

                    $businessNature = strtolower($data['nature_of_business'] ?? '');
                    $specify = strtolower($data['nature_of_business_specify'] ?? '');

                    foreach ($restrictedBusinesses as $restricted) {
                        if (
                            stripos($businessNature, strtolower($restricted)) !== false ||
                            stripos($specify, strtolower($restricted)) !== false
                        ) {
                            return false;
                        }
                    }
                    return true;
                }
            ],
            'action' => 'mark_compliant_business',
            'priority' => 8
        ];

        $this->rules[] = [
            'id' => 'R4',
            'name' => 'Structure Safety Rule',
            'conditions' => [
                'function' => function ($data) {
                    $unsafeStructures = ['Informal Settlement', 'Makeshift', 'Temporary Shack'];
                    $structureType = $data['type_of_structure'] ?? '';

                    foreach ($unsafeStructures as $unsafe) {
                        if (stripos($structureType, $unsafe) !== false) {
                            return false;
                        }
                    }
                    return true;
                }
            ],
            'action' => 'mark_safe_structure',
            'priority' => 7
        ];

        $this->rules[] = [
            'id' => 'R5',
            'name' => 'Employee Capacity Rule',
            'conditions' => [
                'function' => function ($data) {
                    $employees = intval($data['no_of_employees'] ?? 0);
                    $structureType = $data['type_of_structure'] ?? '';

                    $capacityLimits = [
                        'Residence' => 5,
                        'Store' => 10,
                        'Office' => 20,
                        'Warehouse' => 15,
                        'Factory' => 50,
                        'default' => 10
                    ];

                    $limit = $capacityLimits[$structureType] ?? $capacityLimits['default'];
                    return $employees <= $limit;
                }
            ],
            'action' => 'mark_valid_capacity',
            'priority' => 6
        ];

        $this->rules[] = [
            'id' => 'R6',
            'name' => 'Valid Contact Information Rule',
            'conditions' => [
                'function' => function ($data) {
                    $phone = $data['telephone_no_business'] ?? '';
                    $email = $data['email_address'] ?? '';

                    $validPhone = preg_match('/^[0-9]{11}$/', $phone);
                    $validEmail = filter_var($email, FILTER_VALIDATE_EMAIL);

                    return $validPhone && $validEmail;
                }
            ],
            'action' => 'mark_valid_contact',
            'priority' => 5
        ];

        $this->rules[] = [
            'id' => 'R7',
            'name' => 'Uploaded Requirements Must Exactly Match Selected Requirements',
            'conditions' => [
                'function' => function ($data) {

                    $selected = $data['selected_requirements'] ?? [];
                    $uploadedRaw = $data['requirements'] ?? [];

                    if (!is_array($selected) || !is_array($uploadedRaw)) {
                        return false;
                    }

                    // Normalize uploaded OCR results
                    $uploaded = [];
                    foreach ($uploadedRaw as $doc) {
                        $normalized = $this->normalizeDocumentType($doc);
                        if ($normalized !== null) {
                            $uploaded[] = $normalized;
                        }
                    }

                    $selected = array_unique($selected);
                    $uploaded = array_unique($uploaded);

                    sort($selected);
                    sort($uploaded);

                    // STRICT bidirectional comparison
                    return $selected === $uploaded;
                }
            ],
            'action' => 'mark_requirements_verified',
            'priority' => 12
        ];
    }

    /**
     * Determines required documents based on application type and business structure
     * @param string $applicationType - Type of application (New, Renew, Closure)
     * @param string $businessType - Business legal structure (Corporation, Partnership, etc.)
     * @return array - List of required document types
     */
    private function getRequiredRequirements($applicationType, $businessType)
    {
        $requirements = [];

        switch ($applicationType) {
            case 'New':
                $requirements[] = 'SEC';
                $requirements[] = 'DTI';
                $requirements[] = 'TCT';
                $requirements[] = 'Lease Contract';
                break;
            case 'Renew':
                $requirements[] = 'Previous Business Permit';
                break;
            case 'Closure':
                $requirements[] = 'Notarized affidavit for Business Closure';
                break;
        }

        if ($businessType === 'Corporation') {
            $requirements[] = 'Articles of Incorporation';
            $requirements[] = 'Corporate Secretary Certificate';
        } elseif ($businessType === 'Partnership') {
            $requirements[] = 'Partnership Agreement';
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

        $criticalRules = ['R1', 'R2', 'R3', 'R4'];
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
            if (in_array('R2', $failedCritical) || in_array('R3', $failedCritical)) {
                $evaluationDetails['rejection_reason'] = 'Failed critical rules: ' . implode(', ', $failedCritical);
                return 'Rejected';
            } else {
                return 'Additional Requirements Needed';
            }
        }

        $passingPercentage = 80;
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
     * @param array $applicationData - Business permit application data to evaluate
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
        if (isset($data['business_status']) && is_string($data['business_status'])) {
            $data['business_status'] = json_decode($data['business_status'], true);
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
                $required = $this->getRequiredRequirements(
                    $data['nature_of_application'] ?? '',
                    $data['type_of_business'] ?? ''
                );
                $submitted = $data['requirements'] ?? [];
                $missing = array_diff($required, $submitted);

                if (!empty($missing)) {
                    $evaluationDetails['recommendations'][] =
                        "Please submit the following missing requirements: " .
                        implode(', ', $missing);
                }
                break;

            case 'R2':
                $evaluationDetails['recommendations'][] =
                    "Business location appears to be outside Barangay Blue Ridge B boundaries. " .
                    "Please verify the address or consider relocating within barangay jurisdiction.";
                break;

            case 'R3':
                $evaluationDetails['recommendations'][] =
                    "Business type may be restricted in this area. " .
                    "Please contact the barangay office for clarification on permitted business types.";
                break;

            case 'R4':
                $evaluationDetails['recommendations'][] =
                    "The business structure type may not meet safety standards. " .
                    "Consider upgrading to a permanent, safe structure.";
                break;

            case 'R5':
                $evaluationDetails['recommendations'][] =
                    "Number of employees exceeds the recommended capacity for this structure type. " .
                    "Consider reducing staff or upgrading to a larger facility.";
                break;

            case 'R6':
                $evaluationDetails['recommendations'][] =
                    "Please provide valid contact information (11-digit phone number and valid email address).";
                break;

            case 'R7':
                $selected = $data['selected_requirements'] ?? [];
                $uploaded = $data['requirements'] ?? [];
                $missing = [];

                foreach ($selected as $req) {
                    $found = false;
                    foreach ($uploaded as $up) {
                        similar_text(strtolower($req), strtolower($up), $percentMatch);
                        if ($percentMatch >= 70) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) $missing[] = $req;
                }

                if (!empty($missing)) {
                    $evaluationDetails['recommendations'][] =
                        "The uploaded documents do not match the selected requirements. Missing or mismatched: " .
                        implode(', ', $missing) . ". Staff review recommended.";
                }
                break;
        }
    }

    /**
     * Normalizes a raw document text string into a standardized document type.
     *
     * This method is typically used for OCR or user-submitted document labels.
     * It performs a case-insensitive keyword match against a predefined mapping
     * of known document identifiers and returns a canonical document name.
     *
     * Example:
     *  - "Securities and Exchange Commission Certificate" → "SEC"
     *  - "DTI Registration" → "DTI"
     *
     * If no known keyword is detected, the function returns null.
     *
     * @param string $text Raw document text or OCR-extracted content.
     * @return string|null Normalized document type if matched, otherwise null.
     */
    private function normalizeDocumentType($text)
    {
        $text = strtolower($text);

        $map = [
            'sec' => 'SEC',
            'securities and exchange commission' => 'SEC',
            'dti' => 'DTI',
            'department of trade and industry' => 'DTI',
            'tct' => 'TCT',
            'lease contract' => 'Lease Contract',
        ];

        foreach ($map as $keyword => $normalized) {
            if (strpos($text, $keyword) !== false) {
                return $normalized;
            }
        }

        return null;
    }
}

/**
 * Triggers DSS re-evaluation for an application after updates
 * Fetches application data, runs through DSS rule engine, and updates evaluation records
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application to re-evaluate
 */
function triggerDSSevaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM business_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE business_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO business_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        }

        $updateAppStmt = $pdo->prepare("
            UPDATE business_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateAppStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE business_applications 
                SET dss_status = 'Evaluation Error'
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $applicationId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created application
 * This ensures all applications have a DSS evaluation record even before evaluation
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the newly created application
 */
function createInitialDSSEvaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :app_id");
        $stmt->execute([':app_id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);

        $sql = "INSERT INTO business_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE business_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation: " . $e->getMessage());

        $sql = "INSERT INTO business_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, 'Evaluation Error', '{}', NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':app_id' => $applicationId]);
    }
}

/**
 * Extracts summary statistics from DSS evaluation details
 * Provides score, probability, and rule pass/fail counts for frontend display
 * 
 * @param array $evaluationDetails DSS evaluation details array
 * @return array Summary statistics including score, probability, and counts
 */
function getDSSSummary($evaluationDetails)
{
    if (!$evaluationDetails || !is_array($evaluationDetails)) {
        return [
            'score' => 0,
            'max_score' => 6,
            'probability' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => []
        ];
    }

    return [
        'score' => $evaluationDetails['score'] ?? 0,
        'max_score' => $evaluationDetails['max_score'] ?? 6,
        'probability' => $evaluationDetails['approval_probability'] ?? 0,
        'passed_count' => count($evaluationDetails['passed_rules'] ?? []),
        'failed_count' => count($evaluationDetails['failed_rules'] ?? []),
        'passed_rules' => $evaluationDetails['passed_rules'] ?? [],
        'failed_rules' => $evaluationDetails['failed_rules'] ?? [],
        'recommendations' => $evaluationDetails['recommendations'] ?? []
    ];
}

/**
 * Returns a summary object for a given DSS status with message, and color
 * Used for frontend display of evaluation status
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'Pre-Approved' => [
            'message' => 'Application meets all requirements for pre-approval',
            'color' => 'green'
        ],
        'Additional Requirements Needed' => [
            'message' => 'Some requirements need attention before approval',
            'color' => 'orange'
        ],
        'Rejected' => [
            'message' => 'Application does not meet basic requirements',
            'color' => 'red'
        ],
        'Pending Evaluation' => [
            'message' => 'Awaiting DSS evaluation',
            'color' => 'blue'
        ],
        'Evaluation Error' => [
            'message' => 'Evaluation encountered an error',
            'color' => 'gray'
        ]
    ];

    return $summaries[$dssStatus] ?? [
        'message' => 'Evaluation status unknown',
        'color' => 'gray'
    ];
}

/**
 * Logs DSS evaluation results to a file for analytics and auditing purposes
 * 
 * @param int $applicationId ID of the evaluated application
 * @param array $evaluationResult Complete evaluation result from DSS engine
 */
function logEvaluation($applicationId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/dss_evaluations.log';
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'application_id' => $applicationId,
            'dss_status' => $evaluationResult['status'],
            'score' => $evaluationResult['evaluation_details']['score'] ?? 0,
            'max_score' => $evaluationResult['evaluation_details']['max_score'] ?? 0,
            'probability' => $evaluationResult['evaluation_details']['approval_probability'] ?? 0,
            'passed_rules' => count($evaluationResult['evaluation_details']['passed_rules'] ?? []),
            'failed_rules' => count($evaluationResult['evaluation_details']['failed_rules'] ?? [])
        ];

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}
