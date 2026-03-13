// ───────────────────────────────────────────────────────────────
// Services Page – Modal Guidelines & Confirmation Flow
// ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // ── DOM References ─────────────────────────────────────────────
    const modal = document.getElementById('guidelinesModal');
    const modalTitle = document.getElementById('modalTitle');
    const disclaimer = document.getElementById('disclaimer');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.getElementById('closeModal');
    const proceedBtn = document.getElementById('confirmProceed');

    // All service links that trigger the guidelines modal
    const serviceLinks = document.querySelectorAll('.links');

    // Stores the target URL when user confirms they want to proceed
    let pendingUrl = '';

    // ── Static Guidelines Content per Service ──────────────────────
    /**
     * Object mapping service keys to modal title & content.
     * Used to dynamically populate the modal based on clicked link.
     */
    const guidelines = {
        business: {
            title: "Business Clearance Requirements",
            disclaimer: `
                    <div class="disclaimer">
                        <div class="disclaimer-icon">🕒</div>
                        <p>
                            <strong>Processing Time:</strong> Business clearance applications typically take a few working days 
                            to process after submission. Thank you for your patience.
                        </p>
                    </div>
                `,
            content: `
                <ul>
                    <li>Owner personal information and contact details.</li>
                    <li>Business type (Proprietorship, Partnership, Corporation).</li>
                    <li>Number of employees and exact location details.</li>
                </ul>`
        },
        construction: {
            title: "Construction Clearance Requirements",
            disclaimer: `
                    <div class="disclaimer">
                        <div class="disclaimer-icon">🕒</div>
                        <p>
                            <strong>Processing Time:</strong> Construction Clearance applications typically take a few working days 
                            to process after submission. Thank you for your patience.
                        </p>
                    </div>
                `,
            content: `
                <ul>
                    <li>Nature of activity (New construction, Repair, or Demolition).</li>
                    <li>Contractor details and professional licenses.</li>
                    <li>Timeline (Estimated start and completion dates).</li>
                </ul>`
        },
        utilities: {
            title: "Utility Application Requirements",
            disclaimer: `
                    <div class="disclaimer">
                        <div class="disclaimer-icon">🕒</div>
                        <p>
                            <strong>Processing Time:</strong> Utilities Clearance applications typically take a few working days 
                            to process after submission. Thank you for your patience.
                        </p>
                    </div>
                `,
            content: `
                <ul>
                    <li>Provider name (Meralco, Manila Water, etc.).</li>
                    <li>Application type (New installation / Repair).</li>
                    <li>Target date for technical inspection.</li>
                </ul>`
        },
        report: {
            title: "Incident Report Guidelines",
            disclaimer: `
                    <div class="disclaimer">
                        <div class="disclaimer-icon">🕒</div>
                        <p>
                            <strong>Processing Time:</strong> Incident Reports typically take a few working days 
                            to process after submission. Thank you for your patience.
                        </p>
                    </div>
                `,
            content: `
                <p><strong>Important:</strong> Submitting false reports is punishable by law.</p>
                <ul>
                    <li>Complete narrative description of the event.</li>
                    <li>Identification of victim(s) and/or suspect(s), if known.</li>
                    <li>Accurate date, time, and location of the incident.</li>
                </ul>`
        }
    };

    // ── Open Modal on Service Link Click ───────────────────────────
    serviceLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const serviceKey = this.getAttribute('data-service');

            // Only proceed if this link has a recognized service key
            if (serviceKey && guidelines[serviceKey]) {
                // Prevent immediate navigation
                e.preventDefault();

                // Store the real destination URL for later
                pendingUrl = this.getAttribute('href');

                // Populate modal with relevant guidelines
                modalTitle.textContent = guidelines[serviceKey].title;
                disclaimer.innerHTML = guidelines[serviceKey].disclaimer;
                modalBody.innerHTML = guidelines[serviceKey].content;

                // Show the modal using class (assumes CSS handles visibility/animation)
                modal.classList.add('active-modal');
            }
            // If no guidelines defined, link will navigate normally (no modal)
        });
    });

    // ── Modal Close Handlers ───────────────────────────────────────
    /**
     * Closes the modal and clears any pending navigation
     */
    const closeModal = () => {
        modal.classList.remove('active-modal');
        pendingUrl = ''; // Reset so accidental proceed doesn't happen
    };

    // Close via X button
    closeBtn.addEventListener('click', closeModal);

    // Close when clicking outside modal content (backdrop)
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ── Proceed to Destination ─────────────────────────────────────
    proceedBtn.addEventListener('click', () => {
        // Only navigate if user confirmed and we have a valid URL
        if (pendingUrl) {
            window.location.href = pendingUrl;
        }
    });
});