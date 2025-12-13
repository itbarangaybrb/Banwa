<?php

class DSSEngine {

    private $data;
    private $status = 'Pre-Approved'; // Default state: Optimistic
    private $comments = [];
    private $reasons = [];

    // Constructor receives the $_POST data directly
    public function __construct($formData) {
        $this->data = $formData;
    }

    public function analyze() {
        // 1. ROOT NODE: Check Nature of Application
        // Your HTML uses 'New', 'Renew', 'Closure'
        $nature = $this->data['natureOfApplication'] ?? '';

        if (!$nature) {
            $this->flagReview("Nature of application is missing.", "System cannot classify application.");
            return $this->getResult();
        }

        // 2. ALPHA NODES: Route to specific rule sets
        switch ($nature) {
            case 'New':
                $this->evaluateNewBusiness();
                break;
            case 'Renew':
                $this->evaluateRenewal();
                break;
            case 'Closure':
                $this->evaluateClosure();
                break;
            default:
                $this->flagReview("Unknown Application Nature", "Value '$nature' is not defined in DSS rules.");
        }

        // 3. BETA NODE: Risk Assessment (Applies to all)
        $this->evaluateRisk();

        return $this->getResult();
    }

    // --- RULE SET: NEW BUSINESS ---
    private function evaluateNewBusiness() {
        $reqs = $this->data['requirements'] ?? []; // Array from checkboxes
        $bizType = $this->data['typeOfBusiness'] ?? '';

        // Rule A: Proof of Place (Must have TCT OR Lease Contract)
        $hasProofOfPlace = in_array('TCT', $reqs) || in_array('Lease Contract', $reqs);
        if (!$hasProofOfPlace) {
            $this->flagReview(
                "Missing Proof of Place (TCT or Lease Contract).", 
                "New Application requires location verification."
            );
        }

        // Rule B: Business Registration (Based on Type)
        if ($bizType === 'Single Proprietorship') {
            if (!in_array('DTI', $reqs)) {
                $this->flagReview("Missing DTI for Single Proprietorship.", "DTI is mandatory for Single Prop.");
            }
        } elseif ($bizType === 'Partnership' || $bizType === 'Corporation') {
            if (!in_array('SEC', $reqs)) {
                $this->flagReview("Missing SEC for Partnership/Corp.", "SEC is mandatory for this business type.");
            }
        }
    }

    // --- RULE SET: RENEWAL ---
    private function evaluateRenewal() {
        $reqs = $this->data['requirements'] ?? [];

        // Rule A: Previous Permit
        if (!in_array('Previous Business Permit', $reqs)) {
            $this->flagReview(
                "Missing Previous Business Permit.", 
                "Renewal requires evidence of prior operation."
            );
        }

        // Rule B: Valid ID
        if (!in_array('Photocopy of Valid ID of Business Owner', $reqs)) {
            $this->flagReview("Missing Owner's Valid ID.", "Identity verification required.");
        }
    }

    // --- RULE SET: CLOSURE ---
    private function evaluateClosure() {
        $reqs = $this->data['requirements'] ?? [];

        // Rule A: Affidavit
        if (!in_array('Notarized affidavit for Business Closure', $reqs)) {
            $this->flagReview(
                "Missing Notarized Affidavit of Closure.", 
                "Legal document for closure is missing."
            );
        }
    }

    // --- HEURISTIC: RISK & DATA VALIDATION ---
    private function evaluateRisk() {
        // Rule: High Impact Business Types always go to manual review
        $nature = $this->data['natureOfBusiness'] ?? '';
        $highRiskTypes = ['Manufacturing', 'Wholesale/Repacking']; // Add more as needed
        
        if (in_array($nature, $highRiskTypes)) {
            $this->flagReview(
                "High-impact business nature ($nature) detected.", 
                "Requires zoning and safety inspection."
            );
        }

        // Rule: Missing File Upload
        // Your form sends a file, but if the user bypassed it or it failed:
        if (!isset($_FILES['requirementUpload']) || $_FILES['requirementUpload']['error'] != UPLOAD_ERR_OK) {
             $this->flagReview(
                "No digital document uploaded.", 
                "System requires at least one physical file for digital records."
             );
        }
    }

    // --- UTILITIES ---
    private function flagReview($publicComment, $internalReason) {
        $this->status = 'For Manual Review';
        $this->comments[] = $publicComment;
        $this->reasons[] = $internalReason;
    }

    private function getResult() {
        return [
            'status' => $this->status,
            'approval_comments' => empty($this->comments) ? 'Application meets preliminary requirements.' : implode(' | ', $this->comments),
            'disapproval_reason' => empty($this->reasons) ? 'N/A' : implode(' | ', $this->reasons)
        ];
    }
}
?>