async function loadAllMarkers() {
    clearAllMarkers();
    
    try {
        const formData = new FormData();
        formData.append('action', 'get_markers');
        
        const response = await fetch('map.php', {
            method: 'POST',
            body: formData
        });
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response:', text); // Debug log
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        if (!data.success) {
            throw new Error('Server returned error');
        }

        // Process households
        data.households.forEach(household => {
            if (household.latitude && household.longitude) {
                const marker = L.marker([parseFloat(household.latitude), parseFloat(household.longitude)], { icon: householdIcon })
                    .bindPopup(`<div><h4>${household.household_head_name}</h4><p>${household.address}</p></div>`)
                    .addTo(map);
                householdMarkers.push(marker);
            }
        });

        // Process constructions
        data.constructions.forEach(construction => {
            if (construction.latitude && construction.longitude) {
                const marker = L.marker([parseFloat(construction.latitude), parseFloat(construction.longitude)], { icon: constructionIcon })
                    .bindPopup(`<div><h4>CONSTRUCTION SITE</h4><p>${construction.homeowner_name}</p><p>${construction.permit_no}</p></div>`)
                    .addTo(map);
                constructionMarkers.push(marker);
            }
        });

        console.log(`Loaded ${householdMarkers.length} households and ${constructionMarkers.length} constructions`);

    } catch (error) {
        console.error('ERROR LOADING MARKERS:', error);
        alert('Error loading markers. Check console for details.');
    }
}