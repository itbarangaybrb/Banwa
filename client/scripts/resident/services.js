document.addEventListener('DOMContentLoaded', function() {
    console.log("Services JS Loaded");

    const modal = document.getElementById('guidelinesModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.getElementById('closeModal');
    const proceedBtn = document.getElementById('confirmProceed');
    const serviceLinks = document.querySelectorAll('.links');

    let pendingUrl = "";

    const guidelines = {
        business: {
            title: "Business Clearance Requirements",
            content: `<ul>
                <li>Owner personal information and contact details.</li>
                <li>Business type (Proprietorship, Partnership, Corp).</li>
                <li>Number of employees and exact location details.</li>
            </ul>`
        },
        construction: {
            title: "Construction Permit Requirements",
            content: `<ul>
                <li>Nature of activity (New, Repair, or Demolition).</li>
                <li>Contractor details and professional licenses.</li>
                <li>Timeline (Start and Completion dates).</li>
            </ul>`
        },
        utilities: {
            title: "Utility Application Requirements",
            content: `<ul>
                <li>Provider name (Meralco, Manila Water, etc.).</li>
                <li>Application type (New installation/Repair).</li>
                <li>Target date for technical inspection.</li>
            </ul>`
        },
        report: {
            title: "Incident Report Guidelines",
            content: `<p><strong>Note:</strong> False reports are punishable by law.</p>
            <ul>
                <li>Complete narrative of the event.</li>
                <li>Identification of victim/suspect if known.</li>
                <li>Accurate date and time of the incident.</li>
            </ul>`
        }
    };

    serviceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const serviceKey = this.getAttribute('data-service');
            
            if (serviceKey && guidelines[serviceKey]) {
                e.preventDefault();
                pendingUrl = this.getAttribute('href');

                modalTitle.innerText = guidelines[serviceKey].title;
                modalBody.innerHTML = guidelines[serviceKey].content;
                
                // Force display using class
                modal.classList.add('active-modal');
                console.log("Applied active-modal class to:", serviceKey);
            }
        });
    });

    const closeModal = () => {
        modal.classList.remove('active-modal');
        pendingUrl = "";
    };

    closeBtn.addEventListener('click', closeModal);
    proceedBtn.addEventListener('click', () => {
        if (pendingUrl) window.location.href = pendingUrl;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});