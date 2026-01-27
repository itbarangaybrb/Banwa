from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# CONFIGURATION
API_KEY = 'K81052119188957' 
OCR_URL = 'https://api.ocr.space/parse/image'
BLUR_THRESHOLD = 100.0  # Threshold: Below 100 is likely blurry

# FINGERPRINTS: Unique keywords to identify ID types
ID_FINGERPRINTS = {
    'Quezon': ['QCITIZEN', 'LUNGSOD QUEZON', 'QUEZON CITY', 'MAYOR'],
    'National': ['PHILSYS', 'PHILIPPINE IDENTIFICATION', 'REPUBLIKA', 'PAMBANSANG'],
    'Postal': ['POSTAL ID', 'PHILIPPINE POSTAL', 'CORPORATION'],
    'Passport': ['PASSPORT', 'PASAPORTE', 'REPUBLIC OF THE PHILIPPINES']
}

def check_blur_score(file_stream):
    """Calculates image sharpness using Laplacian Variance."""
    file_bytes = np.frombuffer(file_stream.read(), np.uint8)
    file_stream.seek(0)  # Reset pointer for next read
    
    if len(file_bytes) == 0: return 0.0

    image = cv2.imdecode(file_bytes, cv2.IMREAD_GRAYSCALE)
    if image is None: return 0.0
        
    return cv2.Laplacian(image, cv2.CV_64F).var()

def detect_id_type(text_lines):
    """Scans text for keywords to auto-detect ID type."""
    full_text = " ".join(text_lines).upper()
    best_match = "Unknown"
    max_hits = 0

    for id_type, keywords in ID_FINGERPRINTS.items():
        hits = sum(1 for kw in keywords if kw in full_text)
        if hits > max_hits:
            max_hits = hits
            best_match = id_type
            
    return best_match

def parse_id_data(text_lines, id_type):
    """Extracts data based on the CONFIRMED ID type."""
    data = {"firstName": "", "lastName": "", "middleName": "", "address": ""}
    
    if id_type == 'Quezon':
        found_name = False
        
        # STRATEGY A: Look for the label "Last Name, First Name" (Strongest Signal)
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            
            # The label in your image is "Last Name, First Name, M.I."
            if "LAST NAME" in line_upper and "FIRST NAME" in line_upper:
                # The name is usually the VERY NEXT line
                if i + 1 < len(text_lines):
                    candidate = text_lines[i + 1].strip()
                    # Verify it looks like a name (Has comma, no numbers)
                    if "," in candidate and not any(char.isdigit() for char in candidate):
                        parts = candidate.split(',')
                        data['lastName'] = parts[0].strip()
                        data['firstName'] = parts[1].strip()
                        found_name = True
                        break

        # STRATEGY B: Regex Fallback (If label is blurry)
        # Look for "SURNAME, FIRSTNAME" pattern: Uppercase, Comma, No Digits, No "City"
        if not found_name:
            # Regex: Starts with letters, comma, space, letters. 
            # Excludes lines with numbers (dates/IDs) or "QUEZON" (headers/address)
            name_pattern = re.compile(r'^([A-Z\s\-\.]+),\s*([A-Z\s\-\.]+)$')
            
            for line in text_lines:
                clean_line = line.strip().upper()
                
                # Filter out obvious non-names
                if any(x in clean_line for x in ["QUEZON", "CITY", "ADDRESS", "DATE", "VALID", "CITIZEN", "RESIDENT"]):
                    continue
                if any(char.isdigit() for char in clean_line): # Names don't have numbers
                    continue
                
                match = name_pattern.search(clean_line)
                if match:
                    data['lastName'] = match.group(1).strip()
                    data['firstName'] = match.group(2).strip()
                    found_name = True
                    break

        # STRATEGY C: Address Extraction
        # Located at bottom. Contains "BLOCK", "LOT", "STREET" or "QUEZON CITY"
        # We look for lines containing digits AND address keywords
        address_parts = []
        capture_address = False
        
        for line in text_lines:
            upper_line = line.upper()
            
            address_indicators = ["QUEZON", "BLOCK", "STREET", "LOT", "ST", "BLK"]
            noise_keywords = ["BIRTH", "DATE", "NAME", "SEX", "CONTACT","CIVIL"] # Added SEX and CONTACT just in case

            upper_line = line.upper()

            # 1. Check if the line looks like an address
            if any(indicator in upper_line for indicator in address_indicators):
                # 2. Ensure it's not a label like "Last Name, First Name"
                if not any(noise in upper_line for noise in noise_keywords):
                    address_parts.append(line.strip())
        if address_parts:
            # Join them, favoring the one with "Quezon City"
            data['address'] = " ".join(address_parts)

    # === 2. PHILSYS (NATIONAL ID) ===
    elif id_type == 'National':
        for i, line in enumerate(text_lines):
            clean_line = line.lower()
            if "last name" in clean_line:
                if i + 1 < len(text_lines): data['lastName'] = text_lines[i+1]
            elif "given name" in clean_line or "mga pangalan" in clean_line:
                if i + 1 < len(text_lines): data['firstName'] = text_lines[i+1]
            elif "middle name" in clean_line or "gitnang apelyido" in clean_line:
                if i + 1 < len(text_lines): data['middleName'] = text_lines[i+1]
            elif "address" in clean_line or "tirahan" in clean_line:
                if i + 1 < len(text_lines): data['address'] = text_lines[i+1]
           
    # (Add other ID types as needed)

    return data

@app.route('/process_ocr', methods=['POST'])
def process_ocr():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    user_selected_type = request.form.get('idType')

    try:
        # 1. QUALITY CHECK (Blur)
        blur_score = check_blur_score(file)
        # Update the IMAGE_BLURRED block in ocr.py
        if blur_score < BLUR_THRESHOLD:
            return jsonify({
                "success": False,
                "error_type": "IMAGE_BLURRED",
                "error": f"Image is too blurry (Score: {int(blur_score)}). Please retake.",
                "meta": {"blur_score": blur_score, "detected_type": "N/A"} # Added meta here
            })

        # 2. OCR PROCESSING
        payload = {'apikey': API_KEY, 'language': 'eng', 'isOverlayRequired': False, 'OCREngine': 2}
        response = requests.post(OCR_URL, files={'filename': (file.filename, file.stream, file.content_type)}, data=payload)
        result = response.json()

        if result.get('OCRExitCode') != 1:
            return jsonify({"success": False, "error": "OCR Engine failed."}), 500

        raw_text = result['ParsedResults'][0]['ParsedText']
        lines = [line.strip() for line in raw_text.split('\n') if line.strip()]

        # 3. AUTO-CLASSIFICATION & VERIFICATION
        detected_type = detect_id_type(lines)

        # Strict Mismatch Check
        if detected_type != "Unknown" and detected_type != user_selected_type:
            return jsonify({
                "success": False,
                "error_type": "ID_MISMATCH",
                "error": f"Mismatch: You selected {user_selected_type}, but this looks like a {detected_type}.",
                "meta": {"detected_type": detected_type, "blur_score": blur_score}
            })

        # 4. EXTRACTION
        # Use detected type if known, otherwise fallback to user selection
        final_type = detected_type if detected_type != "Unknown" else user_selected_type
        extracted_data = parse_id_data(lines, final_type)

        return jsonify({
            "success": True, 
            "data": extracted_data,
            "meta": {
                "detected_type": detected_type,
                "blur_score": blur_score
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)