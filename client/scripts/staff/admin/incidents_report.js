 // --- Initial Setup and Utility Variables ---
    document.addEventListener('DOMContentLoaded', function() {
        // Auto-populate the Date Reported field upon page load.
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        document.getElementById('dateReported').value = formattedDate;
        
        // Add one empty witness field when the form initially loads.
        createWitnessFields(); 
    });

    const witnessesContainer = document.getElementById('witnessesContainer');
    const addWitnessBtn = document.getElementById('addWitnessBtn');
    let witnessCount = 0;
    let generatedReportHTML = ''; // Stores the final generated HTML report string

    /**
     * Converts the Markdown report into a compact HTML string with a full document 
     * structure, necessary for MSO (Microsoft Office) to correctly render it
     * instead of displaying the raw code.
     * @param {string} markdown - The Markdown formatted string from data collection.
     * @returns {string} The compact HTML formatted string with full MSO structure.
     */
    function markdownToHtml(markdown) {
        let htmlContent = markdown;

        // 1. Convert lists first: Markdown list item `- ` to HTML `<li>`
        htmlContent = htmlContent.replace(/^- (.*)$/gm, '<li>$1</li>');
        
        // Wrap blocks of list items in <ul>
        const listRegex = /((\s*<li>.*?<\/li>)+)/g;
        htmlContent = htmlContent.replace(listRegex, function(match) {
            return `<ul style="margin-left: 20px; padding-left: 0; list-style-type: disc;">${match.trim()}</ul>`;
        });

        // 2. Convert Headers (using specific styles for Word)
        htmlContent = htmlContent.replace(/^\s*###\s*(.*)$/gm, '<h3 style="color:#34495e; margin-top: 15px;">$1</h3>'); 
        htmlContent = htmlContent.replace(/^\s*##\s*(.*)$/gm, '<h2 style="color:#34495e; margin-top: 25px;">$1</h2>'); 
        htmlContent = htmlContent.replace(/^\s*#\s*(.*)$/gm, '<h1 style="color:#2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 30px;">$1</h1>'); 
        
        // 3. Convert Horizontal Rule
        htmlContent = htmlContent.replace(/---/g, '<hr style="border: none; height: 1px; background-color: #ccc; margin: 20px 0;">');
        
        // 4. Convert Bold Text
        htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 5. Convert text blocks to <p> tags
        htmlContent = htmlContent.replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines
        htmlContent = htmlContent.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines within a block with a space
        
        // Wrap final blocks (separated by \n\n) into paragraphs
        htmlContent = htmlContent.split('\n\n').map(p => {
            // Do not wrap if it's empty or already a block element (h1, hr, ul)
            if (p.trim() === '' || p.startsWith('<h') || p.startsWith('<hr') || p.startsWith('<ul')) {
                return p;
            }
            return `<p style="margin-bottom: 10px; text-indent: 0;">${p.trim().replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // 6. FINAL HTML WRAPPER (Full Document Structure for Word Compatibility)
        const finalHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
                    h1 { color:#2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 30px; }
                    h2 { color:#34495e; margin-top: 25px; }
                    h3 { color:#34495e; margin-top: 15px; }
                    hr { border: none; height: 1px; background-color: #ccc; margin: 20px 0; }
                    ul { margin-left: 20px; padding-left: 0; list-style-type: disc; }
                    p { margin-bottom: 10px; }
                    strong { font-weight: bold; }
                </style>
            </head>
            <body>
                <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                    ${htmlContent}
                </div>
            </body>
            </html>
        `;
        
        // 7. COMPACTION (CRITICAL FIX): Aggressively remove all newlines and excess spaces 
        // to prevent Word from misinterpreting the file as raw text.
        return finalHtml.trim()
            .replace(/>\s+</g, '><') 
            .replace(/\n/g, '') 
            .replace(/\s\s+/g, ' '); 
    }

    /**
     * Maps form input data into a structured Markdown string.
     * @param {object} data - The structured report data.
     * @returns {string} The Markdown formatted string.
     */
    function generateMarkdownReport(data) {
        let md = `# Incident Report Summary\n\n`;
        md += `**Date Reported:** ${data.incident.dateReported}\n\n`; 
        md += `**Incident Date/Time:** ${data.incident.timestamp}\n\n`;
        md += `---\n\n`;
        
        // 1. Reporting Person Data
        md += `## 1. Reporting Person\n\n`;
        md += `- **Full Name:** ${data.rp.fullName}\n`;
        md += `- **Address:** ${data.rp.address}\n`;
        md += `- **Contact:** ${data.rp.contact}\n`;
        md += `- **Relationship to Victim:** ${data.rp.relationship || 'N/A'}\n\n`;
        
        // 2. Victim Details Data
        md += `## 2. Victim / Complainant Details\n\n`;
        if (data.victim === 'Same as Reporting Person') {
            md += `- **Victim Status:** ${data.victim}\n\n`;
        } else {
            md += `- **Full Name:** ${data.victim.fullName || 'N/A'}\n`;
            md += `- **Address:** ${data.victim.address || 'N/A'}\n`;
            md += `- **Contact:** ${data.victim.contact || 'N/A'}\n`;
            md += `- **Citizenship:** ${data.victim.citizenship || 'N/A'}\n`;
            md += `- **Gender:** ${data.victim.gender || 'N/A'}\n`;
            md += `- **Date of Birth:** ${data.victim.dob || 'N/A'}\n`;
            md += `- **Occupation:** ${data.victim.occupation || 'N/A'}\n\n`;
        }

        // 3. Suspect Details Data
        md += `## 3. Suspect / Respondent Details\n\n`;
        md += `- **Full Name:** ${data.suspect.fullName || 'Unknown'}\n`;
        md += `- **Address:** ${data.suspect.address || 'Unknown'}\n`;
        md += `- **Contact:** ${data.suspect.contact || 'N/A'}\n`;
        md += `- **Gender:** ${data.suspect.gender || 'N/A'}\n`;
        md += `- **Physical Description:**\n${data.suspect.description || 'None provided.'}\n\n`;
        
        // 4. Witnesses Data
        md += `## 4. Witnesses\n\n`;
        if (data.witnesses.length > 0) {
            data.witnesses.forEach((w, index) => {
                md += `### Witness #${index + 1}\n\n`;
                md += `- **Full Name:** ${w.fullName}\n`;
                md += `- **Contact:** ${w.contact}\n`;
                md += `- **Address:** ${w.address}\n\n`;
            });
        } else {
            md += `No witnesses recorded.\n\n`;
        }

        // 5. Incident Details Data
        md += `## 5. Incident Details\n\n`;
        md += `- **Incident Type:** ${data.incident.type}\n\n`;
        md += `### Narrative/Description\n\n`;
        md += data.incident.description + '\n\n';
        
        return md;
    }

    // --- Dynamic Witness Functions ---
    function createWitnessFields() {
        witnessCount++;
        const container = document.createElement('div');
        container.classList.add('witness-entry');
        container.dataset.id = witnessCount;
        
        container.innerHTML = `
            <div class="witness-header">
                <h4 class="witness-title">Witness #${witnessCount}</h4>
                <button type="button" class="remove-witness" data-id="${witnessCount}">Remove</button>
            </div>
            <div class="details-container">
                <div class="form-group"><label for="witFullName_${witnessCount}">Full Name:</label><input type="text" id="witFullName_${witnessCount}" name="witnesses[${witnessCount}][fullName]" placeholder="Full Name" required></div>
                <div class="form-group"><label for="witContact_${witnessCount}">Contact Number:</label><input type="text" id="witContact_${witnessCount}" name="witnesses[${witnessCount}][contact]" placeholder="Contact Number" required></div>
                <div class="form-group full-span"><label for="witAddress_${witnessCount}">Current Address:</label><input type="text" id="witAddress_${witnessCount}" name="witnesses[${witnessCount}][address]" placeholder="Address" required></div>
            </div>
        `;
        witnessesContainer.appendChild(container);
    }
    // Event listener to add new witness fields
    addWitnessBtn.addEventListener('click', createWitnessFields);
    
    // Event listener to remove a witness field using delegation
    witnessesContainer.addEventListener('click', function(e) {
        let target = e.target.closest('.remove-witness');
        if (target) {
            const idToRemove = target.dataset.id;
            const entry = document.querySelector(`.witness-entry[data-id="${idToRemove}"]`);
            if (entry) {
                entry.remove();
            }
        }
    });

    // --- Input Logic and Toggles ---

    // Incident Type "Other" Toggle
    const incidentTypeSelect = document.getElementById('incidentType');
    const otherSpecifyContainer = document.getElementById('otherSpecifyContainer');
    const otherIncidentTypeInput = document.getElementById('otherIncidentType'); 

    incidentTypeSelect.addEventListener('change', function() {
        // Show/hide the "Please specify" field based on selection
        if (incidentTypeSelect.value === 'other') {
            otherSpecifyContainer.classList.remove('hidden');
            otherIncidentTypeInput.required = true;
        } else {
            otherSpecifyContainer.classList.add('hidden');
            otherIncidentTypeInput.required = false;
            otherIncidentTypeInput.value = '';
        }
    });

    // Victim Same as RP Toggle
    const victimSameAsRP = document.getElementById('victimSameAsRP');
    const victimDetailsContainer = document.getElementById('victimDetailsContainer');
    const victimInputs = victimDetailsContainer.querySelectorAll('input, select');
    
    victimSameAsRP.addEventListener('change', function() {
        if (this.checked) {
            // Hide victim fields and disable/clear inputs
            victimDetailsContainer.classList.add('hidden'); 
            victimInputs.forEach(input => { input.required = false; input.disabled = true; input.value = ''; });
        } else {
            // Show victim fields and re-enable inputs
            victimDetailsContainer.classList.remove('hidden'); 
            victimInputs.forEach(input => { input.disabled = false; });
        }
    });

    // --- Submission and Download Handler ---

    // Form Submission Handler
    document.getElementById('incidentForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const report = {};
        
        // Map form data to report object structure
        report.rp = { fullName: formData.get('rpFullName'), address: formData.get('rpAddress'), contact: formData.get('rpContact'), relationship: formData.get('rpRelationship') };
        report.victim = document.getElementById('victimSameAsRP').checked ? 'Same as Reporting Person' : {
            fullName: formData.get('vicFullName'), address: formData.get('vicAddress'), contact: formData.get('vicContact'), citizenship: formData.get('vicCitizenship'), gender: formData.get('vicGender'), dob: formData.get('vicDOB'), occupation: formData.get('vicOccupation'),
        };
        report.suspect = {
            fullName: formData.get('susFullName'), address: formData.get('susAddress'), contact: formData.get('susContact'), gender: formData.get('susGender'), description: formData.get('susDescription'),
        };

        // Collect dynamic witness data
        report.witnesses = [];
        const witnessEntries = witnessesContainer.querySelectorAll('.witness-entry');
        witnessEntries.forEach(entry => {
            const id = entry.dataset.id;
            if (form.querySelector(`#witFullName_${id}`)) {
                report.witnesses.push({
                    fullName: form.querySelector(`#witFullName_${id}`).value,
                    contact: form.querySelector(`#witContact_${id}`).value,
                    address: form.querySelector(`#witAddress_${id}`).value,
                });
            }
        });

        report.incident = {
            type: formData.get('incidentType') === 'other' ? formData.get('otherIncidentType') : formData.get('incidentType'),
            timestamp: formData.get('incidentTimestamp'),
            dateReported: document.getElementById('dateReported').value,
            description: formData.get('description'),
        };
        
        // 1. Generate Markdown from the collected data
        const markdownReport = generateMarkdownReport(report);
        
        // 2. Convert Markdown to structured HTML for Word download
        generatedReportHTML = markdownToHtml(markdownReport);

        // 3. Display the download button
        document.getElementById('reportOutput').classList.remove('hidden');
        document.getElementById('reportOutput').scrollIntoView({ behavior: 'smooth' });
    });

    // Download Button Click Handler
    document.getElementById('reportOutput').addEventListener('click', function(e) {
        if (e.target.id === 'downloadBtn') {
            if (!generatedReportHTML) {
                console.error("No report content generated yet.");
                return;
            }
            
            // Create a Blob with application/msword type to force Word to open it
            const blob = new Blob([generatedReportHTML], {
                type: "application/msword;charset=utf-8"
            });
            
            // Create a temporary link element to trigger the download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Set the filename with the .doc extension for maximum compatibility
            a.href = url;
            a.download = "Incident_Report_" + Date.now() + ".doc"; 
            
            // Trigger download and cleanup
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); 
        }
    });
