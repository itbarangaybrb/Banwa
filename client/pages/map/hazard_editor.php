<?php

$databasePath = $_SERVER['DOCUMENT_ROOT'] . '/server/configs/database.php';
if (file_exists($databasePath)) {
    include $databasePath;
} else {
    // Try relative path
    $databasePath = __DIR__ . '/../../../server/configs/database.php';
    if (file_exists($databasePath)) {
        include $databasePath;
    }
}
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
            height: 100vh;
            overflow: hidden;
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
            min-width: 350px;
        }
        
        /* Toolbar - Similar to house editor */
        .toolbar {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            max-width: 600px;
            min-width: 400px;
        }
        
        .toolbar-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-right: 15px;
            border-right: 1px solid #eee;
            margin-right: 15px;
        }
        
        .toolbar-section:last-child {
            border-right: none;
            margin-right: 0;
            padding-right: 0;
        }
        
        .section-title {
            font-size: 11px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        
        .toolbar-buttons {
            display: flex;
            gap: 8px;
        }
        
        .toolbar-btn {
            padding: 8px 12px;
            background: #f8f9fa;
            color: #333;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .toolbar-btn:hover {
            background: #e9ecef;
            border-color: #adb5bd;
            transform: translateY(-1px);
        }
        
        .toolbar-btn.active {
            background: #0066cc;
            color: white;
            border-color: #0066cc;
            box-shadow: 0 2px 4px rgba(0,102,204,0.2);
        }
        
        .toolbar-btn.success {
            background: #28a745;
            color: white;
            border-color: #28a745;
        }
        
        .toolbar-btn.success:hover {
            background: #218838;
            border-color: #1e7e34;
        }
        
        .toolbar-btn.danger {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        .toolbar-btn.danger:hover {
            background: #c82333;
            border-color: #bd2130;
        }
        
        .toolbar-btn.warning {
            background: #ffc107;
            color: #212529;
            border-color: #ffc107;
        }
        
        .toolbar-btn.warning:hover {
            background: #e0a800;
            border-color: #d39e00;
        }
        
        .toolbar-btn:disabled {
            background: #e9ecef;
            color: #6c757d;
            border-color: #dee2e6;
            cursor: not-allowed;
            opacity: 0.6;
            transform: none !important;
        }
        
        .point-counter {
            position: absolute;
            top: 85px;
            left: 20px;
            z-index: 1000;
            background: rgba(52, 152, 219, 0.95);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }
        
        .coordinates-display {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 11px;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 12px;
            border-radius: 6px;
            max-height: 150px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.4;
            margin-top: 5px;
            border: 1px solid #333;
        }
        
        .layer-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .layer-btn {
            padding: 8px 12px;
            background: #f8f9fa;
            color: #333;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        
        .layer-btn:hover {
            background: #e9ecef;
            border-color: #adb5bd;
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
            transition: background 0.2s ease;
        }
        
        .zoom-btn:hover {
            background: #f8f9fa;
        }
        
        .zoom-btn:last-child {
            border-bottom: none;
        }
        
        .map-scale {
            position: absolute;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
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
            transition: all 0.2s ease;
            border: 1px solid #dee2e6;
        }
        
        .hazard-item:hover {
            background: #e9ecef;
            transform: translateX(3px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .hazard-item.high {
            border-left-color: #dc3545;
        }
        
        .hazard-item.medium {
            border-left-color: #ffc107;
        }
        
        .hazard-item.low {
            border-left-color: #28a745;
        }
        
        .edit-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #dee2e6;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
            font-size: 13px;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-family: inherit;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
        }
        
        textarea.form-control {
            min-height: 80px;
            resize: vertical;
        }
        
        select.form-control {
            cursor: pointer;
        }
        
        .status-message {
            padding: 12px;
            margin: 10px 0;
            border-radius: 6px;
            text-align: center;
            font-weight: 500;
            font-size: 13px;
            display: none;
            border: 1px solid transparent;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border-color: #c3e6cb;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
        }
        
        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border-color: #bee5eb;
        }
        
        .status-warning {
            background: #fff3cd;
            color: #856404;
            border-color: #ffeaa7;
        }
        
        h3, h4 {
            color: #0066cc;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        
        h3 {
            font-size: 18px;
        }
        
        h4 {
            font-size: 16px;
        }
        
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 13px;
            color: #856404;
        }
        
        .instructions {
            background: #e8f4fc;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .instructions h5 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .instructions ul {
            padding-left: 20px;
            margin: 10px 0;
        }
        
        .instructions li {
            margin-bottom: 5px;
        }
        
        .instructions code {
            background: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
        
        /* Point markers styling */
        .leaflet-div-icon {
            background: transparent;
            border: none;
        }
        
        .point-number {
            background: #0066cc;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 2px solid white;
        }
        
        .point-line {
            position: absolute;
            background: #0066cc;
            height: 2px;
            pointer-events: none;
            z-index: 500;
        }
        
        .overlap-warning {
            position: absolute;
            top: 120px;
            left: 20px;
            z-index: 1000;
            background: rgba(220, 53, 69, 0.95);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            display: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <!-- Left: Map Panel -->
        <div class="map-panel">
            <div id="editor-map"></div>
            
            <!-- Main Toolbar (Navigation-style) -->
            <div class="toolbar">
                <!-- Drawing Section -->
                <div class="toolbar-section">
                    <div class="section-title">Drawing</div>
                    <div class="toolbar-buttons">
                        <button class="toolbar-btn" onclick="startDrawing('polygon')" id="drawPolygonBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
                            </svg>
                            Draw Polygon
                        </button>
                        <button class="toolbar-btn" onclick="startDrawing('rectangle')" id="drawRectangleBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            Draw Rectangle
                        </button>
                        <button class="toolbar-btn" onclick="editSelected()" id="editBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                    </div>
                </div>
                
                <!-- History Section -->
                <div class="toolbar-section">
                    <div class="section-title">History</div>
                    <div class="toolbar-buttons">
                        <button class="toolbar-btn warning" onclick="undoLastPoint()" id="undoBtn" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 7v6h6"/>
                                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                            </svg>
                            Undo (Ctrl+Z)
                        </button>
                        <button class="toolbar-btn danger" onclick="clearDrawing()" id="clearBtn" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Clear
                        </button>
                    </div>
                </div>
                
                <!-- Save Section -->
                <div class="toolbar-section">
                    <div class="section-title">Actions</div>
                    <div class="toolbar-buttons">
                        <button class="toolbar-btn success" onclick="saveHazard()" id="saveBtn" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Save Hazard
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Point Counter -->
            <div class="point-counter" id="pointCounter">
                Points: <span id="pointCount">0</span>
            </div>
            
            <!-- Overlap Warning -->
            <div class="overlap-warning" id="overlapWarning">
                ⚠️ Overlap detected with existing hazard!
            </div>
            
            <!-- Layer Controls -->
            <div class="layer-controls">
                <button class="layer-btn active" onclick="switchLayer('street')" id="streetBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12h4l3-9 4 18 3-9h4"/>
                    </svg>
                    Street
                </button>
                <button class="layer-btn" onclick="switchLayer('satellite')" id="satelliteBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Satellite
                </button>
            </div>
            
            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomIn()">+</button>
                <button class="zoom-btn" onclick="zoomOut()">−</button>
            </div>
            
            <!-- Map Scale -->
            <div class="map-scale" id="mapScale">
                Scale: 1:1000
            </div>
        </div>
        
        <!-- Right: Control Panel -->
        <div class="control-panel">
            <h3>🌊 Flood Hazard Editor</h3>
            <p>Draw flood hazard areas on the map. Existing hazards are shown in color.</p>
            
            <!-- Status Message -->
            <div id="status-message" class="status-message"></div>
            
            <!-- Warning Box -->
            <div class="warning-box">
                <strong>⚠️ Important:</strong> Avoid overlapping with existing hazards. Check coordinates carefully.
            </div>
            
            <!-- Edit Form -->
            <div class="edit-form">
                <h4>Hazard Properties</h4>
                
                <div class="form-group">
                    <label>Hazard Name *</label>
                    <input type="text" id="hazard-name" class="form-control" 
                           placeholder="e.g., Katipunan Avenue Flood Zone" required>
                </div>
                
                <div class="form-group">
                    <label>Risk Level *</label>
                    <select id="risk-level" class="form-control">
                        <option value="low">Low Risk (Green)</option>
                        <option value="medium">Medium Risk (Yellow)</option>
                        <option value="high">High Risk (Red)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="hazard-desc" class="form-control" 
                              placeholder="Describe the flood hazard area..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Coordinates (click on map to add points)</label>
                    <div id="coordinates-display" class="coordinates-display">
                        No points yet. Click "Draw Polygon" then click on map.
                    </div>
                </div>
                
                <button class="toolbar-btn success" onclick="saveHazard()" style="width: 100%; margin-top: 10px;" id="saveBtn2" disabled>
                    💾 Save to Database
                </button>
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
                <h5>📋 How to Draw a Hazard Area:</h5>
                <ul>
                    <li>Click <strong>"Draw Polygon"</strong> or <strong>"Draw Rectangle"</strong></li>
                    <li>Click on the map to add points (minimum 3 points for polygon)</li>
                    <li>Use <strong>"Undo (Ctrl+Z)"</strong> to remove last point</li>
                    <li>Fill in hazard properties on the right</li>
                    <li>Click <strong>"Save Hazard"</strong> when ready</li>
                </ul>
                <p><strong>Keyboard Shortcuts:</strong></p>
                <ul>
                    <li><code>Ctrl+Z</code> - Undo last point</li>
                    <li><code>Esc</code> - Cancel drawing</li>
                    <li><code>Delete</code> - Clear all points</li>
                    <li><code>Ctrl+S</code> - Save hazard</li>
                </ul>
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
    
    <script>

        const HAZARD_HANDLER_URL = '/Banwa/server/handlers/map/hazard_handler.php';
        const MAP_HANDLER_URL    = '/Banwa/server/handlers/map/map_handler.php';

        // Global variables
        let editorMap;
        let drawingPoints = [];
        let isDrawing = false;
        let currentDrawingType = null;
        let polygonLayer = null;
        let pointMarkers = [];
        let lineLayers = [];
        let hazards = [];
        let existingHazardsLayer = L.layerGroup();
        let boundaryLayer = null;
        let currentHazardId = null;
        let baseLayers = {};
        let currentLayer = 'street';
        
        // Define map bounds for Barangay Blue Ridge B
        const mapBounds = [
            [14.6100, 121.0700], // Southwest
            [14.6250, 121.0850]  // Northeast
        ];

        // Initialize editor map with DEEP ZOOM
        function initEditorMap() {
            // Center on Barangay Blue Ridge B
            editorMap = L.map('editor-map', {
                center: [14.6175, 121.0756],
                zoom: 17,
                maxBounds: mapBounds,
                maxBoundsViscosity: 1.0,
                zoomControl: false,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                boxZoom: true,
                keyboard: true,
                maxZoom: 22,  // Increased from 19 to 22 for deeper zoom
                minZoom: 15
            });
            
            // Add base layers with DEEP ZOOM support
            baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 22,  // Match map maxZoom
                minZoom: 15,
                maxNativeZoom: 19
            }).addTo(editorMap);
            
            baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, Maxar, Earthstar Geographics',
                maxZoom: 22,  // Match map maxZoom
                minZoom: 15,
                maxNativeZoom: 19
            });
            
            // Add layers to map
            existingHazardsLayer.addTo(editorMap);
            
            // Update scale on zoom
            editorMap.on('zoomend', updateMapScale);
            updateMapScale();
            
            // Load existing hazards from database
            loadExistingHazards();
            
            // Load barangay boundary from database
            loadBoundary();
            
            // Set up keyboard shortcuts
            setupKeyboardShortcuts();
            
            showStatus('✅ Map loaded. Click "Draw Polygon" to start drawing.', 'info');
        }

        // Start drawing
        function startDrawing(type) {
            if (isDrawing && currentDrawingType === type) {
                stopDrawing();
                return;
            }
            
            // Stop any existing drawing
            if (isDrawing) {
                stopDrawing();
            }
            
            currentDrawingType = type;
            isDrawing = true;
            
            // Update button states
            if (type === 'polygon') {
                document.getElementById('drawPolygonBtn').classList.add('active');
                document.getElementById('drawRectangleBtn').classList.remove('active');
                document.getElementById('editBtn').classList.remove('active');
            } else if (type === 'rectangle') {
                document.getElementById('drawRectangleBtn').classList.add('active');
                document.getElementById('drawPolygonBtn').classList.remove('active');
                document.getElementById('editBtn').classList.remove('active');
            }
            
            // Clear any existing drawing
            clearDrawingVisuals();
            
            // Show point counter
            document.getElementById('pointCounter').style.display = 'block';
            
            // Set up click handler for manual point drawing
            editorMap.on('click', handleMapClick);
            
            // Enable buttons
            document.getElementById('undoBtn').disabled = false;
            document.getElementById('clearBtn').disabled = false;
            
            showStatus(`Click on map to add points for ${type}. Press ESC to cancel.`, 'info');
        }

        // Stop drawing
        function stopDrawing() {
            isDrawing = false;
            currentDrawingType = null;
            
            // Remove click handler
            editorMap.off('click', handleMapClick);
            
            // Update button states
            document.getElementById('drawPolygonBtn').classList.remove('active');
            document.getElementById('drawRectangleBtn').classList.remove('active');
            
            // Update save button state
            updateSaveButton();
            
            // Show instruction if not enough points
            if (drawingPoints.length < 3) {
                showStatus(`Need ${3 - drawingPoints.length} more points to save.`, 'warning');
            } else {
                showStatus('Ready to save. Fill in hazard properties.', 'info');
            }
        }

        // Handle map clicks during drawing
        function handleMapClick(e) {
            if (!isDrawing) return;
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Add point to array
            drawingPoints.push([lat, lng]);
            
            // Update displays
            updatePointCounter();
            updateCoordinatesDisplay();
            
            // Add point marker
            addPointMarker([lat, lng], drawingPoints.length);
            
            // Draw lines between points
            updateConnectingLines();
            
            // Draw/update polygon if we have enough points
            if (currentDrawingType === 'polygon' && drawingPoints.length >= 3) {
                drawPolygon();
            } else if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) {
                drawRectangle();
            }
            
            // Update UI
            updateSaveButton();
            
            // Check for overlaps with existing hazards
            checkForOverlaps();
            
            // Show status
            if (currentDrawingType === 'polygon') {
                if (drawingPoints.length < 3) {
                    showStatus(`Added point ${drawingPoints.length}. Need ${3 - drawingPoints.length} more points.`, 'info');
                } else {
                    showStatus(`Added point ${drawingPoints.length}. Ready to save.`, 'success');
                }
            } else if (currentDrawingType === 'rectangle') {
                if (drawingPoints.length < 2) {
                    showStatus('Click again to set opposite corner for rectangle.', 'info');
                } else {
                    showStatus('Rectangle complete. Ready to save.', 'success');
                    stopDrawing(); // Auto-stop for rectangle
                }
            }
        }

        // Add a point marker with number
        function addPointMarker(coords, number) {
            const marker = L.marker(coords, {
                icon: L.divIcon({
                    className: 'point-marker',
                    html: `<div class="point-number">${number}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(editorMap);
            
            pointMarkers.push(marker);
        }

        // Draw connecting lines between points
        function updateConnectingLines() {
            // Clear existing lines
            lineLayers.forEach(layer => editorMap.removeLayer(layer));
            lineLayers = [];
            
            // Draw lines between consecutive points
            for (let i = 1; i < drawingPoints.length; i++) {
                const line = L.polyline([drawingPoints[i-1], drawingPoints[i]], {
                    color: '#0066cc',
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '5, 5',
                    interactive: false
                }).addTo(editorMap);
                
                lineLayers.push(line);
            }
        }

        // Draw polygon from points
        function drawPolygon() {
            // Remove existing polygon
            if (polygonLayer) {
                editorMap.removeLayer(polygonLayer);
            }
            
            // Create polygon (close it by adding first point at end)
            const polygonCoords = [...drawingPoints];
            if (drawingPoints.length >= 3) {
                polygonCoords.push(drawingPoints[0]);
            }
            
            // Get current risk level color
            const riskLevel = document.getElementById('risk-level').value;
            const color = getRiskColor(riskLevel);
            
            polygonLayer = L.polygon(polygonCoords, {
                color: color,
                weight: 3,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.3,
                interactive: false
            }).addTo(editorMap);
        }

        // Draw rectangle from two points
        function drawRectangle() {
            if (drawingPoints.length !== 2) return;
            
            // Remove existing polygon
            if (polygonLayer) {
                editorMap.removeLayer(polygonLayer);
            }
            
            const bounds = L.latLngBounds(drawingPoints[0], drawingPoints[1]);
            
            // Get current risk level color
            const riskLevel = document.getElementById('risk-level').value;
            const color = getRiskColor(riskLevel);
            
            polygonLayer = L.rectangle(bounds, {
                color: color,
                weight: 3,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.3,
                interactive: false
            }).addTo(editorMap);
        }

        // Get color based on risk level
        function getRiskColor(riskLevel) {
            switch(riskLevel) {
                case 'high': return '#dc3545';
                case 'medium': return '#ffc107';
                case 'low': return '#28a745';
                default: return '#0066cc';
            }
        }

        // Undo last point
        function undoLastPoint() {
            if (drawingPoints.length > 0) {
                // Remove last point from array
                drawingPoints.pop();
                
                // Remove last marker
                if (pointMarkers.length > 0) {
                    const lastMarker = pointMarkers.pop();
                    editorMap.removeLayer(lastMarker);
                }
                
                // Update connecting lines
                updateConnectingLines();
                
                // Redraw polygon/rectangle if we still have enough points
                if (currentDrawingType === 'polygon' && drawingPoints.length >= 3) {
                    drawPolygon();
                } else if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) {
                    drawRectangle();
                } else if (polygonLayer) {
                    editorMap.removeLayer(polygonLayer);
                    polygonLayer = null;
                }
                
                // Update displays
                updatePointCounter();
                updateCoordinatesDisplay();
                updateSaveButton();
                checkForOverlaps();
                
                showStatus('↩️ Removed last point.', 'info');
            }
        }

        // Clear all drawing
        function clearDrawing() {
            if (drawingPoints.length === 0) return;
            
            if (confirm('Clear all points and start over?')) {
                drawingPoints = [];
                clearDrawingVisuals();
                
                // Update displays
                updatePointCounter();
                updateCoordinatesDisplay();
                updateSaveButton();
                document.getElementById('overlapWarning').style.display = 'none';
                
                // Stop drawing if active
                if (isDrawing) {
                    stopDrawing();
                }
                
                showStatus('🗑️ All points cleared.', 'info');
            }
        }

        // Clear drawing visuals from map
        function clearDrawingVisuals() {
            // Clear point markers
            pointMarkers.forEach(marker => editorMap.removeLayer(marker));
            pointMarkers = [];
            
            // Clear lines
            lineLayers.forEach(line => editorMap.removeLayer(line));
            lineLayers = [];
            
            // Clear polygon
            if (polygonLayer) {
                editorMap.removeLayer(polygonLayer);
                polygonLayer = null;
            }
        }

        // Update point counter
        function updatePointCounter() {
            const count = drawingPoints.length;
            document.getElementById('pointCount').textContent = count;
            
            if (count > 0) {
                document.getElementById('pointCounter').style.display = 'block';
            } else {
                document.getElementById('pointCounter').style.display = 'none';
            }
        }

        // Update coordinates display
        function updateCoordinatesDisplay() {
            const coordsDiv = document.getElementById('coordinates-display');
            
            if (drawingPoints.length === 0) {
                coordsDiv.textContent = 'No points yet. Click "Draw Polygon" then click on map.';
                return;
            }
            
            let text = 'Points (lat, lng):\n';
            drawingPoints.forEach((point, index) => {
                text += `${index + 1}. ${point[0].toFixed(6)}, ${point[1].toFixed(6)}\n`;
            });
            text += `\nTotal: ${drawingPoints.length} points`;
            
            coordsDiv.textContent = text;
        }

        // Update save button state
        function updateSaveButton() {
            const canSave = drawingPoints.length >= 3 || 
                           (currentDrawingType === 'rectangle' && drawingPoints.length === 2);
            
            document.getElementById('saveBtn').disabled = !canSave;
            document.getElementById('saveBtn2').disabled = !canSave;
        }

        // Check for overlaps with existing hazards
        function checkForOverlaps() {
            if (!polygonLayer || drawingPoints.length < 3) {
                document.getElementById('overlapWarning').style.display = 'none';
                return;
            }
            
            const newPolygon = polygonLayer.toGeoJSON();
            let hasOverlap = false;
            
            // Check against existing hazards
            hazards.forEach(hazard => {
                if (hazard.geojson) {
                    try {
                        const hazardGeoJson = JSON.parse(hazard.geojson);
                        // Simple bounding box check first
                        const newBounds = polygonLayer.getBounds();
                        
                        // For now, just show warning if bounds intersect
                        existingHazardsLayer.eachLayer(function(layer) {
                            if (layer.getBounds && newBounds.intersects(layer.getBounds())) {
                                hasOverlap = true;
                            }
                        });
                    } catch (e) {
                        console.error('Error checking overlap:', e);
                    }
                }
            });
            
            if (hasOverlap) {
                document.getElementById('overlapWarning').style.display = 'block';
            } else {
                document.getElementById('overlapWarning').style.display = 'none';
            }
        }

        // Switch between map layers
        function switchLayer(layerType) {
            if (layerType === currentLayer) return;
            
            // Remove current layer
            baseLayers[currentLayer].remove();
            
            // Add new layer
            baseLayers[layerType].addTo(editorMap);
            currentLayer = layerType;
            
            // Update button states
            document.getElementById('streetBtn').classList.remove('active');
            document.getElementById('satelliteBtn').classList.remove('active');
            document.getElementById(layerType + 'Btn').classList.add('active');
        }

        // Zoom functions
        function zoomIn() {
            editorMap.zoomIn();
        }

        function zoomOut() {
            editorMap.zoomOut();
        }

        // Reset view to default
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
            document.getElementById('mapScale').textContent = `Scale: ${scaleText}`;
        }

        // Setup keyboard shortcuts
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                // Don't trigger if typing in form fields
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                    return;
                }
                
                // Ctrl+Z for Undo
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undoLastPoint();
                }
                
                // Escape to cancel drawing
                if (e.key === 'Escape' && isDrawing) {
                    e.preventDefault();
                    stopDrawing();
                    showStatus('Drawing cancelled.', 'info');
                }
                
                // Delete to clear
                if (e.key === 'Delete') {
                    e.preventDefault();
                    clearDrawing();
                }
                
                // Ctrl+S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    saveHazard();
                }
                
                // Zoom shortcuts
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    zoomIn();
                }
                if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    zoomOut();
                }
                
                // Number keys for drawing tools
                if (e.key === '1') {
                    e.preventDefault();
                    startDrawing('polygon');
                }
                if (e.key === '2') {
                    e.preventDefault();
                    startDrawing('rectangle');
                }
                if (e.key === '3') {
                    e.preventDefault();
                    editSelected();
                }
                
                // Reset view with R key
                if (e.key === 'r' || e.key === 'R') {
                    e.preventDefault();
                    resetView();
                    showStatus('View reset to default.', 'info');
                }
            });
        }

        // Edit selected hazard
        function editSelected() {
            showStatus('Edit mode: Select a hazard from the list on the right.', 'info');
            document.getElementById('editBtn').classList.add('active');
        }

        // Load barangay boundary from database and draw it on the map
        async function loadBoundary() {
            try {
                const fd = new FormData();
                fd.append('action', 'get_boundaries');
                const res  = await fetch(MAP_HANDLER_URL, { method: 'POST', body: fd });
                const data = await res.json();

                if (!data.success || !data.boundaries || !data.boundaries.length) return;

                const b      = data.boundaries[0];
                const coords = typeof b.coordinates === 'string'
                    ? JSON.parse(b.coordinates)
                    : b.coordinates;

                // coords are stored as [lng, lat] — convert to Leaflet [lat, lng]
                const latLngs = coords.map(c => [c[1], c[0]]);

                // Create a non-interactive pane so the boundary never steals clicks
                if (!editorMap.getPane('boundaryPane')) {
                    editorMap.createPane('boundaryPane');
                    editorMap.getPane('boundaryPane').style.zIndex    = 300;
                    editorMap.getPane('boundaryPane').style.pointerEvents = 'none';
                }

                boundaryLayer = L.polygon(latLngs, {
                    color:       '#00247C',
                    weight:      3,
                    dashArray:   '6, 5',
                    fillColor:   '#667eea',
                    fillOpacity: 0.08,
                    interactive: false,
                    pane:        'boundaryPane'
                }).addTo(editorMap);

                boundaryLayer.bindPopup(`<strong>${b.name}</strong><br>Barangay Boundary`);

            } catch (e) {
                console.warn('Could not load boundary:', e);
            }
        }

        // Load existing hazards from database
        async function loadExistingHazards() {
            try {
                const response = await fetch(HAZARD_HANDLER_URL, {
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
                showStatus('Error loading hazards. Please try again.', 'error');
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
            existingHazardsLayer.clearLayers();
            
            hazards.forEach(hazard => {
                if (hazard.geojson) {
                    try {
                        const geoJson = JSON.parse(hazard.geojson);
                        const color = getRiskColor(hazard.risk_level);
                        
                        const layer = L.geoJSON(geoJson, {
                            style: {
                                fillColor: color,
                                fillOpacity: 0.3,
                                color: color,
                                weight: 2
                            },
                            interactive: false,
                        }).addTo(existingHazardsLayer);
                        
                        // Store hazard data on layer
                        layer.hazardData = hazard;
                        
                        // Add popup
                        layer.bindPopup(`
                            <strong>${hazard.hazard_name}</strong><br>
                            Risk: ${hazard.risk_level.toUpperCase()}<br>
                            ${hazard.description || ''}
                        `);
                    } catch (e) {
                        console.error('Error parsing hazard geojson:', e);
                    }
                }
            });
        }

        // Edit existing hazard
        function editExistingHazard(hazard) {
            currentHazardId = hazard.hazard_id;
            
            // Fill form
            document.getElementById('hazard-name').value = hazard.hazard_name;
            document.getElementById('risk-level').value = hazard.risk_level;
            document.getElementById('hazard-desc').value = hazard.description || '';
            
            // Clear drawing and load hazard geometry
            clearDrawing();
            
            // Parse and load the hazard geometry as drawing points
            if (hazard.geojson) {
                try {
                    const geoJson = JSON.parse(hazard.geojson);
                    if (geoJson.geometry.type === 'Polygon' && geoJson.geometry.coordinates[0]) {
                        // Convert [lng, lat] to [lat, lng] for drawing
                        drawingPoints = geoJson.geometry.coordinates[0]
                            .slice(0, -1) // Remove closing point
                            .map(coord => [coord[1], coord[0]]); // Swap lat/lng
                        
                        // Update visuals
                        drawingPoints.forEach((point, index) => {
                            addPointMarker(point, index + 1);
                        });
                        
                        updateConnectingLines();
                        drawPolygon();
                        
                        // Update displays
                        updatePointCounter();
                        updateCoordinatesDisplay();
                        updateSaveButton();
                        
                        // Pan to hazard
                        if (polygonLayer) {
                            editorMap.fitBounds(polygonLayer.getBounds());
                        }
                        
                        showStatus(`Editing: ${hazard.hazard_name}`, 'success');
                    }
                } catch (e) {
                    console.error('Error loading hazard geometry:', e);
                    showStatus('Error loading hazard geometry', 'error');
                }
            }
        }

        // Save hazard to database
        async function saveHazard() {
            // Validation
            if (drawingPoints.length < 3 && !(currentDrawingType === 'rectangle' && drawingPoints.length === 2)) {
                showStatus('Need at least 3 points for polygon or 2 points for rectangle.', 'error');
                return;
            }
            
            const hazardName = document.getElementById('hazard-name').value.trim();
            if (!hazardName) {
                showStatus('Please enter a hazard name.', 'error');
                document.getElementById('hazard-name').focus();
                return;
            }
            
            // Prepare data
            let geoJson;
            let coordinates;
            
            if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) {
                // Rectangle
                const bounds = L.latLngBounds(drawingPoints[0], drawingPoints[1]);
                const corner1 = [bounds.getSouthWest().lng, bounds.getSouthWest().lat];
                const corner2 = [bounds.getNorthEast().lng, bounds.getNorthEast().lat];
                
                geoJson = {
                    type: "Polygon",
                    coordinates: [[
                        corner1,
                        [corner2[0], corner1[1]],
                        corner2,
                        [corner1[0], corner2[1]],
                        corner1 // Close polygon
                    ]]
                };
                coordinates = geoJson.coordinates;
            } else {
                // Polygon
                // Convert [lat, lng] to [lng, lat] for GeoJSON
                const coords = drawingPoints.map(point => [point[1], point[0]]);
                coords.push(coords[0]); // Close polygon
                
                geoJson = {
                    type: "Polygon",
                    coordinates: [coords]
                };
                coordinates = geoJson.coordinates;
            }
            
            const hazardData = {
                hazard_id: currentHazardId || '',
                hazard_name: hazardName,
                risk_level: document.getElementById('risk-level').value,
                description: document.getElementById('hazard-desc').value.trim(),
                coordinates: JSON.stringify(coordinates),
                geojson: JSON.stringify(geoJson)
            };
            
            try {
                const formData = new FormData();
                formData.append('action', 'save_hazard');
                
                // Add all hazard data
                for (const key in hazardData) {
                    formData.append(key, hazardData[key]);
                }
                
                showStatus('Saving hazard...', 'info');
                
                const response = await fetch(HAZARD_HANDLER_URL, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus(`Hazard ${currentHazardId ? 'updated' : 'saved'} successfully!`, 'success');
                    currentHazardId = result.hazard_id;
                    
                    // Reload hazards from database
                    setTimeout(() => {
                        loadExistingHazards();
                        resetForm();
                        clearDrawing();
                    }, 1000);
                    
                } else {
                    showStatus('Error: ' + result.message, 'error');
                }
            } catch (error) {
                showStatus('Error saving hazard. Please try again.', 'error');
            }
        }

        // Reset form
        function resetForm() {
            currentHazardId = null;
            document.getElementById('hazard-name').value = '';
            document.getElementById('risk-level').value = 'low';
            document.getElementById('hazard-desc').value = '';
            document.getElementById('coordinates-display').textContent = 'No points yet. Click "Draw Polygon" then click on map.';
        }

        // Show status message
        function showStatus(message, type) {
            const statusEl = document.getElementById('status-message');
            statusEl.textContent = message;
            statusEl.className = `status-message status-${type}`;
            statusEl.style.display = 'block';
            
            // Auto-hide after 5 seconds (except errors)
            if (type !== 'error') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 5000);
            }
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initEditorMap);
    </script>
</body>
</html>