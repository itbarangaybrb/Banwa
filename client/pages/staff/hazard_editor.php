<?php
// flood_editor.php
// Simple admin page - protect this with .htaccess or basic auth in production

// Include database connection with PostGIS support
include __DIR__ . '../../../../server/configs/database.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Flood Hazard Editor</title>
    
    <!-- Leaflet CSS & JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f4f4f4;
        }
        
        .editor-container {
            display: flex;
            height: 100vh;
        }
        
        .map-panel {
            flex: 3;
            position: relative;
        }
        
        #editor-map {
            width: 100%;
            height: 100%;
        }
        
        .control-panel {
            flex: 1;
            background: white;
            padding: 20px;
            overflow-y: auto;
            border-left: 2px solid #ddd;
        }
        
        .draw-tools {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .layer-control {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .draw-btn {
            padding: 10px 15px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        
        .draw-btn:hover {
            background: #0052a3;
        }
        
        .draw-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .draw-btn.danger {
            background: #dc3545;
        }
        
        .draw-btn.danger:hover {
            background: #c82333;
        }
        
        .draw-btn.warning {
            background: #ffc107;
            color: #212529;
        }
        
        .draw-btn.warning:hover {
            background: #e0a800;
        }
        
        .draw-btn.success {
            background: #28a745;
        }
        
        .draw-btn.success:hover {
            background: #218838;
        }
        
        .layer-btn {
            padding: 10px 15px;
            background: #f8f9fa;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        
        .layer-btn:hover {
            background: #e9ecef;
        }
        
        .layer-btn.active {
            background: #0066cc;
            color: white;
            border-color: #0066cc;
        }
        
        .zoom-controls {
            position: absolute;
            bottom: 30px;
            right: 20px;
            z-index: 1000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .zoom-btn {
            width: 40px;
            height: 40px;
            background: white;
            border: none;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            font-size: 18px;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .zoom-btn:hover {
            background: #f8f9fa;
        }
        
        .zoom-btn:last-child {
            border-bottom: none;
        }
        
        .history-controls {
            position: absolute;
            top: 240px;
            left: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 200px;
        }
        
        .history-buttons {
            display: flex;
            gap: 8px;
        }
        
        .history-buttons .draw-btn {
            flex: 1;
            justify-content: center;
            padding: 8px 12px;
        }
        
        .history-info {
            font-size: 12px;
            color: #666;
            text-align: center;
            margin-top: 5px;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .hazard-list {
            margin-top: 20px;
        }
        
        .hazard-item {
            background: #f8f9fa;
            padding: 12px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .hazard-item:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }
        
        .hazard-item.high {
            border-left-color: #0066cc;
        }
        
        .hazard-item.medium {
            border-left-color: #66b3ff;
        }
        
        .hazard-item.low {
            border-left-color: #cce6ff;
        }
        
        .edit-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: inherit;
        }
        
        textarea.form-control {
            min-height: 80px;
            resize: vertical;
        }
        
        .coordinates-display {
            font-family: monospace;
            font-size: 12px;
            background: #2c3e50;
            color: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            max-height: 150px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .status-message {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: 600;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        h3 {
            color: #0066cc;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #0066cc;
        }
        
        .map-scale {
            position: absolute;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            color: #333;
        }
        
        .tools-title {
            font-weight: 600;
            color: #0066cc;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .point-history {
            font-size: 11px;
            color: #888;
            margin-top: 3px;
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <!-- Left: Map Panel -->
        <div class="map-panel">
            <div id="editor-map"></div>
            
            <!-- Drawing Tools -->
            <div class="draw-tools">
                <div class="tools-title">Drawing Tools</div>
                <button class="draw-btn" onclick="startDrawing('polygon')" id="polygon-btn">
                    <i class="fas fa-draw-polygon"></i> Draw Flood Area
                </button>
                <button class="draw-btn" onclick="startDrawing('rectangle')" id="rectangle-btn">
                    <i class="fas fa-vector-square"></i> Draw Rectangle
                </button>
                <button class="draw-btn" onclick="editSelected()">
                    <i class="fas fa-edit"></i> Edit Selected
                </button>
                <button class="draw-btn danger" onclick="deleteSelected()">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="draw-btn success" onclick="saveHazard()">
                    <i class="fas fa-save"></i> Save Hazard
                </button>
            </div>
            
            <!-- History Controls -->
            <div class="history-controls">
                <div class="tools-title">Undo/Redo</div>
                <div class="history-buttons">
                    <button class="draw-btn warning" id="undo-btn" onclick="undoAction()" disabled>
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="draw-btn warning" id="redo-btn" onclick="redoAction()" disabled>
                        <i class="fas fa-redo"></i> Redo
                    </button>
                </div>
                <div class="history-info" id="history-info">
                    No actions yet
                </div>
                <div class="point-history" id="point-history">
                    Last action: None
                </div>
            </div>
            
            <!-- Layer Controls -->
            <div class="layer-control">
                <div class="tools-title">Map Layers</div>
                <button class="layer-btn active" onclick="switchLayer('street')">
                    <i class="fas fa-map"></i> Street Map
                </button>
                <button class="layer-btn" onclick="switchLayer('satellite')">
                    <i class="fas fa-satellite"></i> Satellite
                </button>
                <button class="layer-btn" onclick="switchLayer('hybrid')">
                    <i class="fas fa-layer-group"></i> Hybrid
                </button>
            </div>
            
            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomIn()">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="zoom-btn" onclick="zoomOut()">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="zoom-btn" onclick="resetView()">
                    <i class="fas fa-crosshairs"></i>
                </button>
            </div>
            
            <!-- Map Scale -->
            <div class="map-scale" id="map-scale">
                Scale: 1:1000
            </div>
        </div>
        
        <!-- Right: Control Panel -->
        <div class="control-panel">
            <h3><i class="fas fa-water"></i> Flood Hazard Editor</h3>
            <p>Draw or edit flood-prone areas on the map.</p>
            
            <!-- Status Message -->
            <div id="status-message" class="status-message" style="display: none;"></div>
            
            <!-- Edit Form -->
            <div class="edit-form">
                <h4>Hazard Properties</h4>
                
                <div class="form-group">
                    <label>Hazard Name:</label>
                    <input type="text" id="hazard-name" class="form-control" 
                           placeholder="e.g., Katipunan Avenue Low Area">
                </div>
                
                <div class="form-group">
                    <label>Risk Level:</label>
                    <select id="risk-level" class="form-control">
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="hazard-desc" class="form-control" 
                              placeholder="Describe the flood hazard..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Coordinates (GeoJSON):</label>
                    <div id="coordinates-display" class="coordinates-display">
                        Draw an area on the map...
                    </div>
                </div>
                
                <button class="draw-btn success" onclick="saveHazard()" style="width: 100%;">
                    <i class="fas fa-save"></i> Save to Database
                </button>
            </div>
            
            <!-- Existing Hazards List -->
            <div class="hazard-list">
                <h4>Existing Flood Hazards</h4>
                <div id="hazards-container">
                    <!-- Will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- Leaflet & Dependencies -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
    
    <script>
        // Global variables
        let editorMap;
        let drawControl;
        let drawnItems = L.featureGroup();
        let currentHazardId = null;
        let hazards = [];
        let baseLayers = {};
        let currentLayer = 'street';
        
        // Undo/Redo history - NEW: Track point-by-point actions
        let history = [];
        let currentHistoryIndex = -1;
        let MAX_HISTORY = 50; // Increased for point-by-point tracking
        
        // Track drawing state
        let isDrawing = false;
        let currentDrawingLayer = null;
        let currentVertices = [];
        
        // Define map bounds for Barangay Blue Ridge B
        const mapBounds = [
            [14.6100, 121.0700], // Southwest
            [14.6250, 121.0850]  // Northeast
        ];

        // Initialize editor map
        function initEditorMap() {
            // Center on Barangay Blue Ridge B
            editorMap = L.map('editor-map', {
                center: [14.6175, 121.0756],
                zoom: 17,
                maxBounds: mapBounds,
                maxBoundsViscosity: 1.0,
                zoomControl: false, // We'll use custom controls
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                boxZoom: true,
                keyboard: true
            });
            
            // Add base layers
            baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 22,
                minZoom: 15
            }).addTo(editorMap);
            
            baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, Maxar, Earthstar Geographics',
                maxZoom: 22,
                minZoom: 15
            });
            
            baseLayers.hybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
                attribution: '© Google',
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                maxZoom: 22,
                minZoom: 15
            });
            
            // Initialize draw control with custom event handling
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: {
                        allowIntersection: false,
                        shapeOptions: {
                            color: '#0066cc',
                            fillOpacity: 0.3
                        },
                        showArea: true,
                        metric: true,
                        guideLayers: true
                    },
                    rectangle: {
                        shapeOptions: {
                            color: '#0066cc',
                            fillOpacity: 0.3
                        },
                        showArea: true,
                        metric: true
                    },
                    circle: false,
                    marker: false,
                    polyline: false
                },
                edit: {
                    featureGroup: drawnItems
                }
            });
            
            editorMap.addControl(drawControl);
            drawnItems.addTo(editorMap);
            
            // Event listeners for drawing - NEW: Point-by-point tracking
            editorMap.on('draw:drawstart', function(e) {
                isDrawing = true;
                currentVertices = [];
                const layerType = e.layerType;
                console.log(`Started drawing: ${layerType}`);
                
                // Save initial state when starting to draw
                saveHistoryState('draw_start', [], `Started drawing ${layerType}`);
            });
            
            editorMap.on('draw:drawvertex', function(e) {
                if (isDrawing) {
                    // Track each vertex added
                    const vertex = e.latlng;
                    currentVertices.push([vertex.lng, vertex.lat]);
                    
                    // Save state after each vertex
                    saveHistoryState('add_vertex', {
                        vertex: [vertex.lng, vertex.lat],
                        vertices: [...currentVertices],
                        layerType: e.layerType
                    }, `Added point ${currentVertices.length}`);
                    
                    updatePointHistory(`Added point ${currentVertices.length}`);
                }
            });
            
            editorMap.on('draw:drawstop', function(e) {
                isDrawing = false;
                currentVertices = [];
                console.log('Drawing stopped');
            });
            
            editorMap.on('draw:editvertex', function(e) {
                const layers = e.layers;
                layers.eachLayer(function(layer) {
                    // Save state when a vertex is edited
                    const geoJson = layer.toGeoJSON();
                    saveHistoryState('edit_vertex', {
                        layer: layer,
                        geoJson: geoJson,
                        hazardId: layer.hazardId,
                        hazardData: layer.hazardData
                    }, 'Edited vertex');
                    
                    updateCoordinatesDisplay(layer);
                });
            });
            
            editorMap.on('draw:deletedvertex', function(e) {
                const layers = e.layers;
                layers.eachLayer(function(layer) {
                    // Save state when a vertex is deleted
                    const geoJson = layer.toGeoJSON();
                    saveHistoryState('delete_vertex', {
                        layer: layer,
                        geoJson: geoJson,
                        hazardId: layer.hazardId,
                        hazardData: layer.hazardData
                    }, 'Deleted vertex');
                    
                    updateCoordinatesDisplay(layer);
                });
            });
            
            editorMap.on(L.Draw.Event.CREATED, function(e) {
                const layer = e.layer;
                drawnItems.addLayer(layer);
                updateCoordinatesDisplay(layer);
                
                // Save final state when drawing is completed
                const geoJson = layer.toGeoJSON();
                saveHistoryState('draw_complete', {
                    layer: layer,
                    geoJson: geoJson,
                    vertices: geoJson.geometry.coordinates[0] // Polygon vertices
                }, `Completed drawing with ${geoJson.geometry.coordinates[0].length} points`);
                
                updatePointHistory(`Completed shape`);
            });
            
            editorMap.on(L.Draw.Event.EDITED, function(e) {
                const layers = e.layers;
                const editedLayers = [];
                layers.eachLayer(function(layer) {
                    updateCoordinatesDisplay(layer);
                    editedLayers.push({
                        layer: layer,
                        geoJson: layer.toGeoJSON(),
                        hazardId: layer.hazardId,
                        hazardData: layer.hazardData
                    });
                });
                
                // Save edit state
                if (editedLayers.length > 0) {
                    saveHistoryState('edit_complete', editedLayers, `Edited ${editedLayers.length} layer(s)`);
                }
            });
            
            editorMap.on(L.Draw.Event.DELETED, function(e) {
                const layers = e.layers;
                const deletedLayers = Array.from(layers.getLayers());
                
                // Save delete state
                saveHistoryState('delete_complete', deletedLayers, `Deleted ${deletedLayers.length} layer(s)`);
                
                if (deletedLayers.length > 0) {
                    updateCoordinatesDisplay(null);
                    updatePointHistory('Deleted layer(s)');
                }
            });
            
            // Also track map clicks during drawing for better UX
            editorMap.on('click', function(e) {
                if (isDrawing) {
                    console.log('Map click during drawing at:', e.latlng);
                }
            });
            
            // Update scale on zoom
            editorMap.on('zoomend', updateMapScale);
            updateMapScale();
            
            // Load existing hazards from database
            loadExistingHazards();
            
            // Initialize history with empty state
            saveHistoryState('initial', [], 'Initial state');
        }

        // Save current state to history - IMPROVED
        function saveHistoryState(action, data, description) {
            // Don't save if we're in the middle of undo/redo
            if (currentHistoryIndex < history.length - 1) {
                // We're not at the latest state, so truncate and start new branch
                history = history.slice(0, currentHistoryIndex + 1);
            }
            
            // Create history state
            const state = {
                action: action,
                timestamp: Date.now(),
                data: data,
                description: description || action,
                drawnItemsState: getDrawnItemsState(),
                formData: {
                    hazardName: document.getElementById('hazard-name').value,
                    riskLevel: document.getElementById('risk-level').value,
                    description: document.getElementById('hazard-desc').value,
                    currentHazardId: currentHazardId
                }
            };
            
            // Add to history
            history.push(state);
            
            // Limit history size
            if (history.length > MAX_HISTORY) {
                history.shift(); // Remove oldest state
            }
            
            currentHistoryIndex = history.length - 1;
            
            // Update UI
            updateUndoRedoButtons();
            updateHistoryInfo();
            
            console.log(`History saved: ${description} (${history.length} states)`);
        }

        // Get current state of drawn items
        function getDrawnItemsState() {
            const layers = drawnItems.getLayers();
            return layers.map(layer => {
                const geoJson = layer.toGeoJSON();
                return {
                    type: layer.constructor.name,
                    geoJson: geoJson,
                    hazardId: layer.hazardId,
                    hazardData: layer.hazardData,
                    options: layer.options || {
                        color: '#0066cc',
                        fillOpacity: 0.3
                    }
                };
            });
        }

        // Restore state from history - IMPROVED
        function restoreHistoryState(index) {
            if (index < 0 || index >= history.length) {
                console.error('Invalid history index:', index);
                return;
            }
            
            const state = history[index];
            console.log(`Restoring state: ${state.description}`);
            
            // Clear current drawn items
            drawnItems.clearLayers();
            
            // Restore drawn items from state
            if (state.drawnItemsState && state.drawnItemsState.length > 0) {
                state.drawnItemsState.forEach(layerState => {
                    restoreLayerFromState(layerState);
                });
            }
            
            // Restore form data if available
            if (state.formData) {
                document.getElementById('hazard-name').value = state.formData.hazardName || '';
                document.getElementById('risk-level').value = state.formData.riskLevel || 'low';
                document.getElementById('hazard-desc').value = state.formData.description || '';
                currentHazardId = state.formData.currentHazardId || null;
            }
            
            // Update coordinates display
            const layers = drawnItems.getLayers();
            if (layers.length > 0) {
                updateCoordinatesDisplay(layers[0]);
            } else {
                document.getElementById('coordinates-display').textContent = 'Draw an area on the map...';
            }
            
            currentHistoryIndex = index;
            updateUndoRedoButtons();
            updateHistoryInfo();
            
            // Update point history display
            updatePointHistory(state.description);
            
            // Show feedback
            const action = index < history.length - 1 ? 'Undo' : 'Redo';
            showStatus(`${action}: ${state.description}`, 'success');
        }

        // Restore a single layer from state
        function restoreLayerFromState(layerState) {
            if (!layerState || !layerState.geoJson) {
                console.warn('Invalid layer state:', layerState);
                return;
            }
            
            try {
                let layer;
                const geoJson = layerState.geoJson;
                
                // Create appropriate layer type
                if (layerState.type === 'Polygon' || geoJson.geometry.type === 'Polygon') {
                    layer = L.geoJSON(geoJson, {
                        style: layerState.options || {
                            color: '#0066cc',
                            fillOpacity: 0.3,
                            weight: 2
                        }
                    }).getLayers()[0];
                } else if (layerState.type === 'Rectangle' || layerState.type === 'L.Rectangle') {
                    // Handle rectangles
                    const bounds = L.geoJSON(geoJson).getBounds();
                    layer = L.rectangle(bounds, {
                        style: layerState.options || {
                            color: '#0066cc',
                            fillOpacity: 0.3,
                            weight: 2
                        }
                    });
                }
                
                if (layer) {
                    // Restore layer properties
                    layer.hazardId = layerState.hazardId;
                    layer.hazardData = layerState.hazardData;
                    
                    // Add to map
                    drawnItems.addLayer(layer);
                    
                    // Add popup for existing hazards
                    if (layerState.hazardData) {
                        layer.bindPopup(`
                            <strong>${layerState.hazardData.hazard_name}</strong><br>
                            Risk: ${layerState.hazardData.risk_level.toUpperCase()}<br>
                            ${layerState.hazardData.description || ''}
                        `);
                    }
                    
                    console.log(`Restored layer: ${layerState.type}`);
                }
            } catch (error) {
                console.error('Error restoring layer:', error, layerState);
            }
        }

        // Undo last action
        function undoAction() {
            if (currentHistoryIndex > 0) {
                restoreHistoryState(currentHistoryIndex - 1);
            }
        }

        // Redo last undone action
        function redoAction() {
            if (currentHistoryIndex < history.length - 1) {
                restoreHistoryState(currentHistoryIndex + 1);
            }
        }

        // Update undo/redo button states
        function updateUndoRedoButtons() {
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            
            undoBtn.disabled = currentHistoryIndex <= 0;
            redoBtn.disabled = currentHistoryIndex >= history.length - 1;
        }

        // Update history info display
        function updateHistoryInfo() {
            const infoEl = document.getElementById('history-info');
            infoEl.textContent = `Actions: ${currentHistoryIndex + 1}/${history.length}`;
        }

        // Update point history display
        function updatePointHistory(action) {
            const infoEl = document.getElementById('point-history');
            infoEl.textContent = `Last: ${action}`;
        }

        // Switch between map layers
        function switchLayer(layerType) {
            // Update button states
            document.querySelectorAll('.layer-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Switch layers
            if (layerType !== currentLayer) {
                baseLayers[currentLayer].remove();
                baseLayers[layerType].addTo(editorMap);
                currentLayer = layerType;
                
                // Save to history
                saveHistoryState('switch_layer', { layer: layerType }, `Switched to ${layerType} view`);
            }
        }

        // Zoom functions
        function zoomIn() {
            editorMap.zoomIn();
        }

        function zoomOut() {
            editorMap.zoomOut();
        }

        function resetView() {
            editorMap.setView([14.6175, 121.0756], 17);
        }

        // Update map scale display
        function updateMapScale() {
            const zoom = editorMap.getZoom();
            const scale = Math.round(591657550.5 / Math.pow(2, zoom));
            const scaleText = scale >= 1000 ? 
                `1:${(scale/1000).toFixed(0)}k` : 
                `1:${scale}`;
            document.getElementById('map-scale').textContent = `Scale: ${scaleText}`;
        }

        // Update coordinates display
        function updateCoordinatesDisplay(layer) {
            if (layer && layer.toGeoJSON) {
                try {
                    const geoJson = layer.toGeoJSON();
                    const coordinates = JSON.stringify(geoJson.geometry.coordinates, null, 2);
                    document.getElementById('coordinates-display').textContent = coordinates;
                    
                    // Update point count in history
                    if (geoJson.geometry.type === 'Polygon' && geoJson.geometry.coordinates[0]) {
                        const pointCount = geoJson.geometry.coordinates[0].length;
                        updatePointHistory(`${pointCount} points in shape`);
                    }
                } catch (error) {
                    console.error('Error updating coordinates:', error);
                    document.getElementById('coordinates-display').textContent = 'Error displaying coordinates';
                }
            } else {
                document.getElementById('coordinates-display').textContent = 'Draw an area on the map...';
            }
        }

        // Start drawing
        function startDrawing(type) {
            // Save state before starting to draw
            saveHistoryState('start_drawing', { type: type }, `Started ${type} drawing`);
            
            if (type === 'polygon') {
                new L.Draw.Polygon(editorMap, drawControl.options.draw.polygon).enable();
                document.getElementById('polygon-btn').classList.add('active');
                document.getElementById('rectangle-btn').classList.remove('active');
            } else if (type === 'rectangle') {
                new L.Draw.Rectangle(editorMap, drawControl.options.draw.rectangle).enable();
                document.getElementById('rectangle-btn').classList.add('active');
                document.getElementById('polygon-btn').classList.remove('active');
            }
            
            showStatus(`Drawing ${type} - click on map to add points`, 'success');
        }

        // Edit selected
        function editSelected() {
            const layers = drawnItems.getLayers();
            if (layers.length > 0) {
                // Save state before editing
                saveHistoryState('start_edit', { layers: layers }, 'Started editing');
                
                const layer = layers[0];
                editorMap.fitBounds(layer.getBounds());
                updateCoordinatesDisplay(layer);
                
                // Enable edit mode
                new L.EditToolbar.Edit(editorMap, {
                    featureGroup: drawnItems
                }).enable();
                
                showStatus('Edit mode enabled - drag points to modify shape', 'success');
            } else {
                showStatus('No area selected to edit', 'error');
            }
        }

        // Delete selected
        function deleteSelected() {
            const layers = drawnItems.getLayers();
            if (layers.length > 0) {
                // Save state before deleting
                saveHistoryState('delete_selected', { layers: Array.from(layers) }, `Deleting ${layers.length} layer(s)`);
                
                drawnItems.clearLayers();
                document.getElementById('coordinates-display').textContent = 'Draw an area on the map...';
                resetForm();
                
                showStatus(`${layers.length} layer(s) deleted`, 'success');
            } else {
                showStatus('No areas to delete', 'error');
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Don't trigger shortcuts if user is typing in form fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            // Ctrl+Z or Cmd+Z for Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undoAction();
            }
            // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redoAction();
            }
            // Ctrl+Y for Redo (Windows)
            if ((e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redoAction();
            }
            // Escape to cancel drawing
            if (e.key === 'Escape' && isDrawing) {
                e.preventDefault();
                isDrawing = false;
                currentVertices = [];
                showStatus('Drawing cancelled', 'info');
            }
        });

        // Load existing hazards from database
        async function loadExistingHazards() {
            try {
                const response = await fetch('hazard_handler.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=get_all_hazards'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    hazards = data.hazards;
                    displayHazardsList();
                    displayHazardsOnMap();
                } else {
                    showStatus('Error loading hazards: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Error loading hazards:', error);
                showStatus('Error loading hazards. Check console.', 'error');
            }
        }

        // Display hazards list in control panel
        function displayHazardsList() {
            const container = document.getElementById('hazards-container');
            container.innerHTML = '';
            
            hazards.forEach(hazard => {
                const div = document.createElement('div');
                div.className = `hazard-item ${hazard.risk_level}`;
                div.innerHTML = `
                    <strong>${hazard.hazard_name}</strong>
                    <br><small>${hazard.risk_level.toUpperCase()} Risk</small>
                    <br><small>Updated: ${new Date(hazard.updated_at).toLocaleDateString()}</small>
                `;
                div.onclick = () => editExistingHazard(hazard);
                container.appendChild(div);
            });
        }

        // Display hazards on map
        function displayHazardsOnMap() {
            hazards.forEach(hazard => {
                // Convert PostGIS geometry to GeoJSON
                const geoJson = JSON.parse(hazard.geojson);
                
                const color = hazard.risk_level === 'high' ? '#0066cc' :
                             hazard.risk_level === 'medium' ? '#66b3ff' : '#cce6ff';
                
                const layer = L.geoJSON(geoJson, {
                    style: {
                        fillColor: color,
                        fillOpacity: 0.3,
                        color: color,
                        weight: 2
                    }
                }).addTo(editorMap);
                
                // Store hazard ID on layer
                layer.hazardId = hazard.hazard_id;
                layer.hazardData = hazard;
                
                // Add to drawn items for editing
                drawnItems.addLayer(layer);
                
                // Add popup
                layer.bindPopup(`
                    <strong>${hazard.hazard_name}</strong><br>
                    Risk: ${hazard.risk_level.toUpperCase()}<br>
                    ${hazard.description || ''}
                `);
            });
            
            // Save current state to history after loading hazards
            saveHistoryState('load_hazards', Array.from(drawnItems.getLayers()), `Loaded ${hazards.length} hazards`);
        }

        // Edit existing hazard
        function editExistingHazard(hazard) {
            currentHazardId = hazard.hazard_id;
            
            // Fill form
            document.getElementById('hazard-name').value = hazard.hazard_name;
            document.getElementById('risk-level').value = hazard.risk_level;
            document.getElementById('hazard-desc').value = hazard.description || '';
            
            // Clear and select only this layer
            drawnItems.clearLayers();
            
            let foundLayer = null;
            editorMap.eachLayer(layer => {
                if (layer.hazardId === hazard.hazard_id) {
                    drawnItems.addLayer(layer);
                    editorMap.fitBounds(layer.getBounds());
                    updateCoordinatesDisplay(layer);
                    foundLayer = layer;
                }
            });
            
            if (foundLayer) {
                saveHistoryState('select_hazard', { hazard: hazard, layer: foundLayer }, `Selected: ${hazard.hazard_name}`);
                showStatus(`Editing: ${hazard.hazard_name}`, 'success');
            } else {
                showStatus('Could not find the hazard layer on map', 'error');
            }
        }

        // Save hazard to database
        async function saveHazard() {
            const layers = drawnItems.getLayers();
            if (layers.length === 0) {
                showStatus('Please draw an area on the map first.', 'error');
                return;
            }
            
            const layer = layers[0];
            const geoJson = layer.toGeoJSON();
            
            const hazardData = {
                hazard_id: currentHazardId || '',
                hazard_name: document.getElementById('hazard-name').value.trim(),
                risk_level: document.getElementById('risk-level').value,
                description: document.getElementById('hazard-desc').value.trim(),
                coordinates: JSON.stringify(geoJson.geometry.coordinates),
                geojson: JSON.stringify(geoJson)
            };
            
            if (!hazardData.hazard_name) {
                showStatus('Please enter a hazard name.', 'error');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('action', 'save_hazard');
                
                // Add all hazard data
                for (const key in hazardData) {
                    formData.append(key, hazardData[key]);
                }
                
                const response = await fetch('hazard_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus(`Hazard ${currentHazardId ? 'updated' : 'saved'} successfully!`, 'success');
                    currentHazardId = result.hazard_id;
                    
                    // Save to history
                    saveHistoryState('save_hazard', { hazardData: hazardData, result: result }, `Saved: ${hazardData.hazard_name}`);
                    
                    // Reload hazards from database
                    setTimeout(() => {
                        loadExistingHazards();
                        resetForm();
                    }, 1000);
                    
                } else {
                    showStatus('Error: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving hazard:', error);
                showStatus('Error saving hazard. Check console.', 'error');
            }
        }

        // Reset form
        function resetForm() {
            currentHazardId = null;
            document.getElementById('hazard-name').value = '';
            document.getElementById('risk-level').value = 'low';
            document.getElementById('hazard-desc').value = '';
            document.getElementById('coordinates-display').textContent = 'Draw an area on the map...';
        }

        // Show status message
        function showStatus(message, type) {
            const statusEl = document.getElementById('status-message');
            statusEl.textContent = message;
            statusEl.className = `status-message status-${type}`;
            statusEl.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initEditorMap);
    </script>
</body>
</html>