<?php

$databasePath = $_SERVER['DOCUMENT_ROOT'] . '/server/configs/database.php';
if (file_exists($databasePath)) {
    include $databasePath;
} else {
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
    <title>Barangay House Polygon Editor</title>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body { font-family: 'Inter', sans-serif; background: #f4f4f4; height: 100vh; overflow: hidden; }

        .editor-container { display: flex; height: 100vh; }

        .map-panel { flex: 3; position: relative; }
        #editor-map { width: 100%; height: 100%; }

        .control-panel {
            flex: 1; background: white; padding: 20px;
            overflow-y: auto; border-left: 2px solid #ddd; min-width: 350px;
        }

        /* ── Toolbar ── */
        .toolbar {
            position: absolute; top: 20px; left: 20px; z-index: 1000;
            background: white; padding: 12px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex; gap: 10px; flex-wrap: wrap;
            max-width: 620px; min-width: 400px;
        }
        .toolbar-section {
            display: flex; flex-direction: column; gap: 8px;
            padding-right: 15px; border-right: 1px solid #eee; margin-right: 15px;
        }
        .toolbar-section:last-child { border-right: none; margin-right: 0; padding-right: 0; }
        .section-title { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .toolbar-buttons { display: flex; gap: 8px; }

        .toolbar-btn {
            padding: 8px 12px; background: #f8f9fa; color: #333;
            border: 1px solid #dee2e6; border-radius: 6px;
            cursor: pointer; font-size: 13px; font-weight: 500;
            display: flex; align-items: center; gap: 6px;
            transition: all 0.2s ease; white-space: nowrap;
        }
        .toolbar-btn:hover   { background: #e9ecef; border-color: #adb5bd; transform: translateY(-1px); }
        .toolbar-btn.active  { background: #0066cc; color: white; border-color: #0066cc; }
        .toolbar-btn.success { background: #28a745; color: white; border-color: #28a745; }
        .toolbar-btn.success:hover { background: #218838; }
        .toolbar-btn.danger  { background: #dc3545; color: white; border-color: #dc3545; }
        .toolbar-btn.danger:hover  { background: #c82333; }
        .toolbar-btn.warning { background: #ffc107; color: #212529; border-color: #ffc107; }
        .toolbar-btn.warning:hover { background: #e0a800; }
        .toolbar-btn:disabled { background: #e9ecef; color: #6c757d; border-color: #dee2e6; cursor: not-allowed; opacity: 0.6; transform: none !important; }

        .point-counter {
            position: absolute; top: 85px; left: 20px; z-index: 1000;
            background: rgba(52,152,219,0.95); color: white;
            padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: 600;
            display: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .overlap-warning {
            position: absolute; top: 125px; left: 20px; z-index: 1000;
            background: rgba(220,53,69,0.95); color: white;
            padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: 600;
            display: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .coordinates-display {
            font-family: 'Monaco','Menlo','Ubuntu Mono',monospace; font-size: 11px;
            background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px;
            max-height: 130px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
            line-height: 1.4; margin-top: 5px; border: 1px solid #333;
        }

        .layer-controls {
            position: absolute; top: 20px; right: 20px; z-index: 1000;
            background: white; padding: 12px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex; flex-direction: column; gap: 6px;
        }
        .layer-btn {
            padding: 8px 12px; background: #f8f9fa; color: #333;
            border: 1px solid #dee2e6; border-radius: 6px;
            cursor: pointer; font-size: 13px; font-weight: 500;
            display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;
        }
        .layer-btn:hover  { background: #e9ecef; }
        .layer-btn.active { background: #0066cc; color: white; border-color: #0066cc; }

        .zoom-controls {
            position: absolute; bottom: 30px; right: 20px; z-index: 1000;
            background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden; display: flex; flex-direction: column;
        }
        .zoom-btn {
            width: 40px; height: 40px; background: white; border: none;
            border-bottom: 1px solid #eee; cursor: pointer; font-size: 18px; color: #333;
            display: flex; align-items: center; justify-content: center; transition: background 0.2s;
        }
        .zoom-btn:hover { background: #f8f9fa; }
        .zoom-btn:last-child { border-bottom: none; }

        .map-scale {
            position: absolute; bottom: 20px; left: 20px; z-index: 1000;
            background: rgba(255,255,255,0.95); padding: 6px 12px; border-radius: 20px;
            font-size: 12px; font-weight: 600; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* ── Right panel ── */
        .house-list { margin-top: 20px; }
        .house-item {
            background: #f8f9fa; padding: 12px; margin: 8px 0;
            border-radius: 6px; border-left: 4px solid #0066cc;
            cursor: pointer; transition: all 0.2s ease; border: 1px solid #dee2e6;
        }
        .house-item:hover { background: #e9ecef; transform: translateX(3px); }

        .edit-form {
            background: #f8f9fa; padding: 20px; border-radius: 8px;
            margin-top: 20px; border: 1px solid #dee2e6;
        }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; font-size: 13px; }
        .form-control {
            width: 100%; padding: 10px; border: 1px solid #dee2e6; border-radius: 6px;
            font-family: inherit; font-size: 14px; transition: border-color 0.2s;
        }
        .form-control:focus { outline: none; border-color: #0066cc; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }

        .status-message {
            padding: 12px; margin: 10px 0; border-radius: 6px; text-align: center;
            font-weight: 500; font-size: 13px; display: none; border: 1px solid transparent;
        }
        .status-success { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .status-error   { background: #f8d7da; color: #721c24; border-color: #f5c6cb; }
        .status-info    { background: #d1ecf1; color: #0c5460;  border-color: #bee5eb; }
        .status-warning { background: #fff3cd; color: #856404;  border-color: #ffeaa7; }

        h3, h4 { color: #0066cc; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef; }
        h3 { font-size: 18px; } h4 { font-size: 16px; }

        .meta-badge {
            display: inline-block; background: #e9ecef; color: #495057;
            padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-top: 4px;
        }

        .instructions {
            background: #e8f4fc; padding: 15px; border-radius: 6px;
            margin: 20px 0; border-left: 4px solid #3498db; font-size: 13px; line-height: 1.5;
        }
        .instructions h5 { margin-bottom: 8px; color: #0066cc; }
        .instructions ul { padding-left: 18px; margin: 8px 0; }
        .instructions li { margin: 4px 0; }
        .instructions code { background: #dee2e6; padding: 2px 5px; border-radius: 3px; font-size: 12px; }

        /* Leaflet point markers */
        .point-marker { background: none; border: none; }
        .point-number {
            width: 20px; height: 20px; background: #0066cc; color: white;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: bold; border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
<div class="editor-container">

    <!-- ── Map Panel ── -->
    <div class="map-panel">
        <div id="editor-map"></div>

        <div class="toolbar">
            <!-- Draw -->
            <div class="toolbar-section">
                <div class="section-title">Draw</div>
                <div class="toolbar-buttons">
                    <button class="toolbar-btn" onclick="startDrawing('polygon')" id="drawPolygonBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg>
                        Draw Polygon
                    </button>
                    <button class="toolbar-btn" onclick="startDrawing('rectangle')" id="drawRectangleBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        Draw Rectangle
                    </button>
                    <button class="toolbar-btn" onclick="editSelected()" id="editBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                </div>
            </div>
            <!-- History -->
            <div class="toolbar-section">
                <div class="section-title">History</div>
                <div class="toolbar-buttons">
                    <button class="toolbar-btn warning" onclick="undoLastPoint()" id="undoBtn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                        Undo (Ctrl+Z)
                    </button>
                    <button class="toolbar-btn danger" onclick="clearDrawing()" id="clearBtn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Clear
                    </button>
                </div>
            </div>
            <!-- Actions -->
            <div class="toolbar-section">
                <div class="section-title">Actions</div>
                <div class="toolbar-buttons">
                    <button class="toolbar-btn success" onclick="saveHouse()" id="saveBtn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save House
                    </button>
                    <button class="toolbar-btn danger" onclick="deleteCurrentHouse()" id="deleteBtn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <div class="point-counter" id="pointCounter">Points: <span id="pointCount">0</span></div>
        <div class="overlap-warning" id="overlapWarning">⚠️ Overlap detected with existing house!</div>

        <div class="layer-controls">
            <button class="layer-btn active" onclick="switchLayer('street')" id="streetBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
                Street
            </button>
            <button class="layer-btn" onclick="switchLayer('satellite')" id="satelliteBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Satellite
            </button>
        </div>

        <div class="zoom-controls">
            <button class="zoom-btn" onclick="zoomIn()">+</button>
            <button class="zoom-btn" onclick="zoomOut()">−</button>
        </div>

        <div class="map-scale" id="mapScale">Scale: 1:1000</div>
    </div>

    <!-- ── Control Panel ── -->
    <div class="control-panel">
        <h3>🏠 House Polygon Editor</h3>
        <p>Draw house footprints on the map. Existing polygons are loaded from the database.</p>

        <div id="status-message" class="status-message"></div>

        <div class="edit-form">
            <h4>House Properties</h4>

            <div class="form-group">
                <label>House Number <span style="color:#999;font-weight:400;">(e.g. 42, 12-B)</span></label>
                <input type="text" id="house-number" class="form-control" placeholder="e.g. 42">
            </div>

            <div class="form-group">
                <label>Street Name</label>
                <input type="text" id="street-name" class="form-control" placeholder="e.g. Sampaguita St.">
            </div>

            <div class="form-group">
                <label>Full Address</label>
                <input type="text" id="address" class="form-control" placeholder="e.g. 42 Sampaguita St., Blue Ridge B">
            </div>

            <div class="form-group">
                <label>Coordinates <span style="color:#999;font-weight:400;">(click map to add points)</span></label>
                <div id="coordinates-display" class="coordinates-display">No points yet. Click "Draw Polygon" then click on map.</div>
            </div>

            <button class="toolbar-btn success" onclick="saveHouse()" style="width:100%;margin-top:10px;" id="saveBtn2" disabled>
                💾 Save to Database
            </button>
        </div>

        <div class="instructions">
            <h5>📋 How to draw a house polygon:</h5>
            <ul>
                <li>Click <strong>Draw Polygon</strong> or <strong>Draw Rectangle</strong></li>
                <li>Click the map to place corner points (min. 3 for polygon)</li>
                <li>Use <strong>Undo (Ctrl+Z)</strong> to remove the last point</li>
                <li>Fill in the house details above, then click <strong>Save House</strong></li>
                <li>Click any house in the list below to <strong>edit</strong> it</li>
            </ul>
            <p style="margin-top:8px;"><strong>Keyboard shortcuts:</strong></p>
            <ul>
                <li><code>Ctrl+Z</code> Undo &nbsp; <code>Esc</code> Cancel &nbsp; <code>Del</code> Clear</li>
                <li><code>Ctrl+S</code> Save &nbsp; <code>R</code> Reset view</li>
                <li><code>1</code> Polygon &nbsp; <code>2</code> Rectangle &nbsp; <code>+</code>/<code>-</code> Zoom</li>
            </ul>
        </div>

        <div class="house-list">
            <h4>Existing Houses (<span id="houseCount">0</span>)</h4>
            <div id="houses-container"></div>
        </div>
    </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    const HOUSE_HANDLER_URL = '/server/handlers/map/house_handler.php';
    const MAP_HANDLER_URL   = '/server/handlers/map/map_handler.php';

    // ── State ─────────────────────────────────────────────────────────────────
    let editorMap, boundaryLayer;
    let drawingPoints      = [];
    let isDrawing          = false;
    let currentDrawingType = null;
    let polygonLayer       = null;
    let pointMarkers       = [];
    let lineLayers         = [];
    let houses             = [];
    let existingHousesLayer = L.layerGroup();
    let currentHouseId     = null;
    let baseLayers         = {};
    let currentLayer       = 'street';

    const mapBounds = [[14.6100, 121.0700], [14.6250, 121.0850]];

    // ── Init ─────────────────────────────────────────────────────────────────
    function initEditorMap() {
        editorMap = L.map('editor-map', {
            center: [14.6175, 121.0756], zoom: 17,
            maxBounds: mapBounds, maxBoundsViscosity: 1.0,
            zoomControl: false, scrollWheelZoom: true,
            maxZoom: 22, minZoom: 15
        });

        baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 22, minZoom: 15, maxNativeZoom: 19
        }).addTo(editorMap);

        baseLayers.satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { attribution: '© Esri', maxZoom: 22, minZoom: 15, maxNativeZoom: 19 }
        );

        existingHousesLayer.addTo(editorMap);
        editorMap.on('zoomend', updateMapScale);
        updateMapScale();

        loadExistingHouses();
        loadBoundary();
        setupKeyboardShortcuts();
        showStatus('✅ Map loaded. Click "Draw Polygon" to start.', 'info');
    }

    // ── Drawing ───────────────────────────────────────────────────────────────
    function startDrawing(type) {
        if (isDrawing && currentDrawingType === type) { stopDrawing(); return; }
        if (isDrawing) stopDrawing();

        currentDrawingType = type;
        isDrawing = true;

        document.getElementById('drawPolygonBtn').classList.toggle('active',   type === 'polygon');
        document.getElementById('drawRectangleBtn').classList.toggle('active', type === 'rectangle');
        document.getElementById('editBtn').classList.remove('active');

        clearDrawingVisuals();
        document.getElementById('pointCounter').style.display = 'block';
        editorMap.on('click', handleMapClick);
        document.getElementById('undoBtn').disabled = false;
        document.getElementById('clearBtn').disabled = false;
        showStatus(`Click on the map to add ${type} points. ESC to cancel.`, 'info');
    }

    function stopDrawing() {
        isDrawing = false; currentDrawingType = null;
        editorMap.off('click', handleMapClick);
        document.getElementById('drawPolygonBtn').classList.remove('active');
        document.getElementById('drawRectangleBtn').classList.remove('active');
        updateSaveButton();
        if (drawingPoints.length < 3) {
            showStatus(`Need ${3 - drawingPoints.length} more point(s) to save.`, 'warning');
        } else {
            showStatus('Ready to save. Fill in house details.', 'info');
        }
    }

    function handleMapClick(e) {
        if (!isDrawing) return;
        drawingPoints.push([e.latlng.lat, e.latlng.lng]);

        updatePointCounter();
        updateCoordinatesDisplay();
        addPointMarker([e.latlng.lat, e.latlng.lng], drawingPoints.length);
        updateConnectingLines();

        if (currentDrawingType === 'polygon' && drawingPoints.length >= 3) drawPolygon();
        if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) {
            drawRectangle(); stopDrawing();
        }

        updateSaveButton();
        checkForOverlaps();
        showStatus(
            drawingPoints.length < 3
                ? `Point ${drawingPoints.length} added. Need ${3 - drawingPoints.length} more.`
                : `Point ${drawingPoints.length} added. Ready to save.`,
            drawingPoints.length < 3 ? 'info' : 'success'
        );
    }

    function addPointMarker(coords, num) {
        const m = L.marker(coords, {
            icon: L.divIcon({
                className: 'point-marker',
                html: `<div class="point-number">${num}</div>`,
                iconSize: [20,20], iconAnchor: [10,10]
            })
        }).addTo(editorMap);
        pointMarkers.push(m);
    }

    function updateConnectingLines() {
        lineLayers.forEach(l => editorMap.removeLayer(l)); lineLayers = [];
        for (let i = 1; i < drawingPoints.length; i++) {
            const l = L.polyline([drawingPoints[i-1], drawingPoints[i]], {
                color: '#0066cc', weight: 2, opacity: 0.7, dashArray: '5,5', interactive: false
            }).addTo(editorMap);
            lineLayers.push(l);
        }
    }

    function drawPolygon() {
        if (polygonLayer) editorMap.removeLayer(polygonLayer);
        const pts = [...drawingPoints, drawingPoints[0]];
        polygonLayer = L.polygon(pts, {
            color: '#0066cc', weight: 3, opacity: 0.9, fillColor: '#0066cc', fillOpacity: 0.25, interactive: false
        }).addTo(editorMap);
    }

    function drawRectangle() {
        if (drawingPoints.length !== 2) return;
        if (polygonLayer) editorMap.removeLayer(polygonLayer);
        polygonLayer = L.rectangle(L.latLngBounds(drawingPoints[0], drawingPoints[1]), {
            color: '#0066cc', weight: 3, opacity: 0.9, fillColor: '#0066cc', fillOpacity: 0.25, interactive: false
        }).addTo(editorMap);
    }

    // ── Undo / Clear ─────────────────────────────────────────────────────────
    function undoLastPoint() {
        if (!drawingPoints.length) return;
        drawingPoints.pop();
        if (pointMarkers.length) editorMap.removeLayer(pointMarkers.pop());
        updateConnectingLines();
        if      (currentDrawingType === 'polygon'   && drawingPoints.length >= 3) drawPolygon();
        else if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) drawRectangle();
        else if (polygonLayer) { editorMap.removeLayer(polygonLayer); polygonLayer = null; }
        updatePointCounter(); updateCoordinatesDisplay(); updateSaveButton(); checkForOverlaps();
        showStatus('↩️ Removed last point.', 'info');
    }

    function clearDrawing() {
        if (!drawingPoints.length) return;
        if (!confirm('Clear all points and start over?')) return;
        drawingPoints = [];
        clearDrawingVisuals();
        updatePointCounter(); updateCoordinatesDisplay(); updateSaveButton();
        document.getElementById('overlapWarning').style.display = 'none';
        if (isDrawing) stopDrawing();
        showStatus('🗑️ All points cleared.', 'info');
    }

    function clearDrawingVisuals() {
        pointMarkers.forEach(m => editorMap.removeLayer(m)); pointMarkers = [];
        lineLayers.forEach(l => editorMap.removeLayer(l));   lineLayers   = [];
        if (polygonLayer) { editorMap.removeLayer(polygonLayer); polygonLayer = null; }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────
    function updatePointCounter() {
        const n = drawingPoints.length;
        document.getElementById('pointCount').textContent = n;
        document.getElementById('pointCounter').style.display = n > 0 ? 'block' : 'none';
    }

    function updateCoordinatesDisplay() {
        const div = document.getElementById('coordinates-display');
        if (!drawingPoints.length) { div.textContent = 'No points yet. Click "Draw Polygon" then click on map.'; return; }
        let txt = 'Points (lat, lng):\n';
        drawingPoints.forEach((p, i) => txt += `${i+1}. ${p[0].toFixed(6)}, ${p[1].toFixed(6)}\n`);
        txt += `\nTotal: ${drawingPoints.length} points`;
        div.textContent = txt;
    }

    function updateSaveButton() {
        const ok = drawingPoints.length >= 3 || (currentDrawingType === 'rectangle' && drawingPoints.length === 2);
        document.getElementById('saveBtn').disabled  = !ok;
        document.getElementById('saveBtn2').disabled = !ok;
    }

    function checkForOverlaps() {
        if (!polygonLayer || drawingPoints.length < 3) {
            document.getElementById('overlapWarning').style.display = 'none'; return;
        }
        let overlap = false;
        const nb = polygonLayer.getBounds();
        existingHousesLayer.eachLayer(l => { if (l.getBounds && nb.intersects(l.getBounds())) overlap = true; });
        document.getElementById('overlapWarning').style.display = overlap ? 'block' : 'none';
    }

    // ── Load & display existing houses ────────────────────────────────────────
    async function loadExistingHouses() {
        try {
            const res  = await fetch(HOUSE_HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=get_all_houses'
            });
            const data = await res.json();

            if (data.success) {
                houses = data.houses;
                displayHousesList();
                displayHousesOnMap();
            } else {
                showStatus('Error loading houses: ' + data.message, 'error');
            }
        } catch (err) {
            showStatus('Error loading houses. Please try again.', 'error');
            console.error(err);
        }
    }

    function displayHousesList() {
        const container = document.getElementById('houses-container');
        document.getElementById('houseCount').textContent = houses.length;
        container.innerHTML = '';

        if (!houses.length) {
            container.innerHTML = '<p style="color:#999;font-size:13px;text-align:center;padding:20px;">No houses yet. Draw one on the map!</p>';
            return;
        }

        houses.forEach(h => {
            const div = document.createElement('div');
            div.className = 'house-item';
            div.innerHTML = `
                <strong>🏠 ${h.house_number ? '#' + h.house_number : 'House #' + h.house_id}</strong>
                ${h.street_name ? `<br><small>📍 ${h.street_name}</small>` : ''}
                ${h.address     ? `<br><small style="color:#666;">${h.address}</small>` : ''}
                ${h.area_sqm    ? `<br><span class="meta-badge">~${h.area_sqm} m²</span>` : ''}
            `;
            div.onclick = () => editExistingHouse(h);
            container.appendChild(div);
        });
    }

    function displayHousesOnMap() {
        existingHousesLayer.clearLayers();

        houses.forEach(h => {
            // coordinates is stored as a GeoJSON polygon ring: [[lng,lat],[lng,lat],...]
            // wrapped in an outer array: [ [[lng,lat],...] ]
            let coords = h.coordinates;
            if (!coords) return;

            try {
                // Normalise: if it's still a string (shouldn't be after PHP decode but just in case)
                if (typeof coords === 'string') coords = JSON.parse(coords);

                // Unwrap GeoJSON outer ring if needed
                const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0]))
                    ? coords[0]   // [[lng,lat],...]
                    : coords;     // already flat

                // Convert [lng, lat] → Leaflet [lat, lng]
                const latLngs = ring.map(c => [c[1], c[0]]);

                const layer = L.polygon(latLngs, {
                    color: '#0066cc', weight: 2, opacity: 0.9,
                    fillColor: '#3a86ff', fillOpacity: 0.25,
                    interactive: true
                }).addTo(existingHousesLayer);

                layer.houseData = h;
                layer.bindPopup(`
                    <strong>${h.house_number ? '#' + h.house_number : 'House #' + h.house_id}</strong>
                    ${h.street_name ? `<br>📍 ${h.street_name}` : ''}
                    ${h.address     ? `<br>${h.address}` : ''}
                    ${h.area_sqm    ? `<br>~${h.area_sqm} m²` : ''}
                    <br><small style="color:#999;">ID: ${h.house_id}</small>
                `);
            } catch (e) {
                console.error('Error rendering house #' + h.house_id, e);
            }
        });
    }

    // ── Edit existing house ───────────────────────────────────────────────────
    function editExistingHouse(h) {
        currentHouseId = h.house_id;

        document.getElementById('house-number').value = h.house_number  || '';
        document.getElementById('street-name').value  = h.street_name   || '';
        document.getElementById('address').value      = h.address       || '';
        document.getElementById('deleteBtn').disabled = false;

        clearDrawingVisuals();

        let coords = h.coordinates;
        if (!coords) { showStatus('No geometry for this house.', 'warning'); return; }
        if (typeof coords === 'string') coords = JSON.parse(coords);

        try {
            const ring = (Array.isArray(coords[0]) && Array.isArray(coords[0][0]))
                ? coords[0] : coords;

            // Remove closing duplicate point for drawing
            const open = (ring[0][0] === ring[ring.length-1][0] && ring[0][1] === ring[ring.length-1][1])
                ? ring.slice(0, -1) : ring;

            // Convert [lng, lat] → [lat, lng] for Leaflet / drawingPoints
            drawingPoints = open.map(c => [c[1], c[0]]);

            drawingPoints.forEach((pt, i) => addPointMarker(pt, i + 1));
            updateConnectingLines();
            drawPolygon();
            updatePointCounter();
            updateCoordinatesDisplay();
            updateSaveButton();

            if (polygonLayer) editorMap.fitBounds(polygonLayer.getBounds());
            showStatus(`✏️ Editing house #${h.house_id}`, 'success');
        } catch (e) {
            console.error('Error loading geometry', e);
            showStatus('Error loading house geometry.', 'error');
        }
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    async function saveHouse() {
        const canSave = drawingPoints.length >= 3 ||
            (currentDrawingType === 'rectangle' && drawingPoints.length === 2);
        if (!canSave) { showStatus('Need at least 3 points to save.', 'error'); return; }

        // Build GeoJSON-style coordinate ring [[lng,lat],...]
        let ring;
        if (currentDrawingType === 'rectangle' && drawingPoints.length === 2) {
            const b  = L.latLngBounds(drawingPoints[0], drawingPoints[1]);
            const sw = [b.getSouthWest().lng, b.getSouthWest().lat];
            const ne = [b.getNorthEast().lng, b.getNorthEast().lat];
            ring = [ sw, [ne[0], sw[1]], ne, [sw[0], ne[1]], sw ];
        } else {
            ring = drawingPoints.map(p => [p[1], p[0]]); // lat,lng → lng,lat
            ring.push(ring[0]); // close
        }

        const formData = new FormData();
        formData.append('action',       'save_house');
        formData.append('house_id',     currentHouseId || '');
        formData.append('house_number', document.getElementById('house-number').value.trim());
        formData.append('street_name',  document.getElementById('street-name').value.trim());
        formData.append('address',      document.getElementById('address').value.trim());
        formData.append('coordinates',  JSON.stringify(ring)); // flat ring [[lng,lat],...]

        try {
            showStatus('Saving…', 'info');
            const res    = await fetch(HOUSE_HANDLER_URL, { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                showStatus(`🏠 House ${currentHouseId ? 'updated' : 'saved'} successfully!`, 'success');
                currentHouseId = result.house_id;
                setTimeout(() => { loadExistingHouses(); resetForm(); clearDrawingVisuals(); }, 900);
            } else {
                showStatus('Error: ' + result.message, 'error');
            }
        } catch (err) {
            showStatus('Network error. Please try again.', 'error');
            console.error(err);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    async function deleteCurrentHouse() {
        if (!currentHouseId) { showStatus('No house selected.', 'warning'); return; }
        if (!confirm('Delete this house polygon? This cannot be undone.')) return;

        const fd = new FormData();
        fd.append('action',   'delete_house');
        fd.append('house_id', currentHouseId);

        try {
            showStatus('Deleting…', 'info');
            const res    = await fetch(HOUSE_HANDLER_URL, { method: 'POST', body: fd });
            const result = await res.json();

            if (result.success) {
                showStatus('🗑️ House deleted.', 'success');
                resetForm(); clearDrawingVisuals();
                setTimeout(loadExistingHouses, 800);
            } else {
                showStatus('Error: ' + result.message, 'error');
            }
        } catch (err) {
            showStatus('Network error.', 'error');
        }
    }

    // ── Reset form ────────────────────────────────────────────────────────────
    function resetForm() {
        currentHouseId = null;
        document.getElementById('house-number').value = '';
        document.getElementById('street-name').value  = '';
        document.getElementById('address').value      = '';
        document.getElementById('coordinates-display').textContent = 'No points yet. Click "Draw Polygon" then click on map.';
        document.getElementById('deleteBtn').disabled = true;
    }

    // ── Boundary ──────────────────────────────────────────────────────────────
    async function loadBoundary() {
        try {
            const fd = new FormData(); fd.append('action', 'get_boundaries');
            const res  = await fetch(MAP_HANDLER_URL, { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.success || !data.boundaries?.length) return;

            const b      = data.boundaries[0];
            const coords = typeof b.coordinates === 'string' ? JSON.parse(b.coordinates) : b.coordinates;
            const latLngs = coords.map(c => [c[1], c[0]]);

            if (!editorMap.getPane('boundaryPane')) {
                editorMap.createPane('boundaryPane');
                editorMap.getPane('boundaryPane').style.zIndex       = 300;
                editorMap.getPane('boundaryPane').style.pointerEvents = 'none';
            }
            L.polygon(latLngs, {
                color: '#00247C', weight: 3, dashArray: '6,5',
                fillColor: '#667eea', fillOpacity: 0.06,
                interactive: false, pane: 'boundaryPane'
            }).addTo(editorMap).bindPopup(`<strong>${b.name}</strong><br>Barangay Boundary`);
        } catch (e) { console.warn('Could not load boundary:', e); }
    }

    // ── Misc ──────────────────────────────────────────────────────────────────
    function switchLayer(type) {
        if (type === currentLayer) return;
        baseLayers[currentLayer].remove();
        baseLayers[type].addTo(editorMap);
        currentLayer = type;
        document.getElementById('streetBtn').classList.toggle('active',    type === 'street');
        document.getElementById('satelliteBtn').classList.toggle('active', type === 'satellite');
    }

    function zoomIn()  { editorMap.zoomIn(); }
    function zoomOut() { editorMap.zoomOut(); }
    function resetView() { editorMap.setView([14.6175, 121.0756], 17); }

    function updateMapScale() {
        const s = Math.round(591657550.5 / Math.pow(2, editorMap.getZoom()));
        document.getElementById('mapScale').textContent =
            'Scale: ' + (s >= 1000 ? `1:${(s/1000).toFixed(0)}k` : `1:${s}`);
    }

    function showStatus(msg, type) {
        const el = document.getElementById('status-message');
        el.textContent = msg; el.className = `status-message status-${type}`; el.style.display = 'block';
        if (type !== 'error') setTimeout(() => el.style.display = 'none', 5000);
    }

    function editSelected() {
        showStatus('Click a house in the list to edit it.', 'info');
        document.getElementById('editBtn').classList.add('active');
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
            if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); undoLastPoint(); }
            if (e.key==='Escape' && isDrawing) { e.preventDefault(); stopDrawing(); showStatus('Drawing cancelled.','info'); }
            if (e.key==='Delete')               { e.preventDefault(); clearDrawing(); }
            if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); saveHouse(); }
            if (e.key==='+'||e.key==='=') { e.preventDefault(); zoomIn(); }
            if (e.key==='-'||e.key==='_') { e.preventDefault(); zoomOut(); }
            if (e.key==='1') { e.preventDefault(); startDrawing('polygon'); }
            if (e.key==='2') { e.preventDefault(); startDrawing('rectangle'); }
            if (e.key==='3') { e.preventDefault(); editSelected(); }
            if (e.key==='r'||e.key==='R') { e.preventDefault(); resetView(); showStatus('View reset.','info'); }
        });
    }

    document.addEventListener('DOMContentLoaded', initEditorMap);
</script>
</body>
</html>