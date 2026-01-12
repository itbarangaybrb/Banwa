from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re

app = Flask(__name__)
CORS(app)  # Allow your PHP/JS frontend to talk to this Python backend

# OCR.SPACE CONFIGURATION
API_KEY = 'K81052119188957'  # Replace with your real API key
OCR_URL = 'https://api.ocr.space/parse/image'

def clean_text(text):
    """Removes unwanted characters and whitespace."""
    return text.strip().replace(':', '').replace('.', '')

def parse_id_data(text_lines, id_type):
    data = {"firstName": "", "lastName": "", "middleName": "", "address": ""}
    

# ==========================================
    # 1. QUEZON CITY ID (QCitizen) - UPDATED
    # ==========================================
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

    # # === 1. QUEZON CITY ID (QCitizen) ===
    # if id_type == 'Quezon':
    #     name_parts = []
    #     for i, line in enumerate(text_lines):
    #         clean_line = line.strip()
    #         if not clean_line: continue
            
    #         # --- Address Detection (Heuristic) ---
    #         # Look for "ADDRESS" keyword and grab the next lines
    #         if 'ADDRESS' in clean_line.upper() and not data['address']:
    #             addr_lines = []
    #             for j in range(1, 4): # Check next 3 lines
    #                 if i+j < len(text_lines):
    #                     next_line = text_lines[i+j].strip()
    #                     # Stop if we hit another keyword or empty line
    #                     keywords = ["NO.", "ID NO", "DATE", "BIRTH", "GENDER"]
    #                     if not next_line or any(kw in next_line.upper() for kw in keywords):
    #                         break
    #                     addr_lines.append(next_line)
    #             if addr_lines:
    #                 data['address'] = ", ".join(addr_lines)
            
    #         # --- Name Detection ---
    #         # If last name is already found, skip name processing
    #         if data['lastName']: continue

    #         # Format A: Single line with comma "LASTNAME, FIRSTNAME MIDDLENAME"
    #         if ',' in clean_line and clean_line.isupper() and "QUEZON" not in clean_line.upper():
    #             parts = clean_line.split(',')
    #             data['lastName'] = clean_text(parts[0])
    #             if len(parts) > 1:
    #                 # Split the part after comma by spaces
    #                 names_part = parts[1].strip().split(' ')
    #                 if len(names_part) > 0:
    #                     # First word is First Name
    #                     data['firstName'] = names_part[0]
    #                     # Everything else is Middle Name
    #                     if len(names_part) > 1:
    #                         data['middleName'] = " ".join(names_part[1:])
    #             # Name found, clear any pending multiline parts
    #             name_parts = [] 
    #             continue

    #         # Format B: Multi-line name accumulation
    #         # Look for consecutive uppercase lines that aren't common headers.
    #         is_uppercase = clean_line.isupper() and len(clean_line) > 2
    #         keywords = ["REPUBLIC", "PILIPINAS", "QUEZON", "CITY", "LUNGSOD", "ADDRESS", "TIRAHAN", "NO.", "ID", "DATE", "BIRTH", "SIGNATURE", "QCITIZEN", "VALID", "CERTIFY"]
    #         is_not_keyword = all(kw not in clean_line.upper() for kw in keywords)
            
    #         if is_uppercase and is_not_keyword:
    #             name_parts.append(clean_line)
    #         else:
    #             # A non-name line broke the sequence. Process what we have.
    #             if name_parts and not data['lastName']:
    #                 # Heuristic: If 2+ lines, Line 1 is Last Name, Line 2 is First + Middle
    #                 if len(name_parts) >= 2:
    #                     data['lastName'] = clean_text(name_parts[0])
    #                     rest_of_name = " ".join(name_parts[1:])
    #                     names_split = rest_of_name.split(' ')
    #                     if len(names_split) > 0:
    #                         data['firstName'] = names_split[0]
    #                         if len(names_split) > 1:
    #                             data['middleName'] = " ".join(names_split[1:])
    #                 name_parts = [] # Reset

    #     # Catch-all: if loop finished and we have unprocessed name parts
    #     if name_parts and not data['lastName']:
    #          if len(name_parts) >= 2:
    #             data['lastName'] = clean_text(name_parts[0])
    #             rest_of_name = " ".join(name_parts[1:])
    #             names_split = rest_of_name.split(' ')
    #             if len(names_split) > 0:
    #                 data['firstName'] = names_split[0]
    #                 if len(names_split) > 1:
    #                     data['middleName'] = " ".join(names_split[1:])

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

    # === 3. PASSPORT ===
    elif id_type == 'Passport':
        for i, line in enumerate(text_lines):
            if "Surname" in line or "Apelyido" in line:
                 if i + 1 < len(text_lines): data['lastName'] = text_lines[i+1]
            elif "Given name" in line or "Pangalan" in line:
                 if i + 1 < len(text_lines): data['firstName'] = text_lines[i+1]
            elif "Middle name" in line:
                 if i + 1 < len(text_lines): data['middleName'] = text_lines[i+1]

    # === 4. POSTAL ID ===
    elif id_type == 'Postal':
        for i, line in enumerate(text_lines):
            if "Address" in line:
                if i + 1 < len(text_lines): data['address'] = text_lines[i+1]
            # Heuristic for "FIRST MIDDLE LAST"
            if line.isupper() and len(line) > 5 and "REPUBLIC" not in line and "POSTAL" not in line:
                 parts = line.split(' ')
                 if len(parts) >= 3:
                     data['lastName'] = parts[-1]
                     data['firstName'] = parts[0]
                     data['middleName'] = " ".join(parts[1:-1])

    return data

@app.route('/process_ocr', methods=['POST'])
def process_ocr():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    id_type = request.form.get('idType', 'National')

    try:
        payload = {
            'apikey': API_KEY,
            'language': 'eng',
            'isOverlayRequired': False,
            'OCREngine': 2 
        }
        
        response = requests.post(
            OCR_URL,
            files={'filename': (file.filename, file.stream, file.content_type)},
            data=payload
        )
        result = response.json()

        if result.get('OCRExitCode') == 1:
            raw_text = result['ParsedResults'][0]['ParsedText']
            lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
            
            extracted_data = parse_id_data(lines, id_type)
            
            return jsonify({
                "success": True, 
                "data": extracted_data,
                "raw": raw_text
            })
        else:
            return jsonify({"success": False, "error": "OCR API failed to read image"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)