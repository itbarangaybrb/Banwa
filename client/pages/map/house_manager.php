<?php
$databasePath = $_SERVER['DOCUMENT_ROOT'] . '/server/configs/database.php';
if (file_exists($databasePath)) {
    include $databasePath;
} else {
    $databasePath = __DIR__ . '/../../../server/configs/database.php';
    if (file_exists($databasePath)) include $databasePath;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>House Polygon Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg:        #0f1117;
            --surface:   #1a1d27;
            --surface2:  #22263a;
            --border:    #2e3352;
            --accent:    #4f8ef7;
            --accent2:   #7c5cfc;
            --success:   #34d399;
            --danger:    #f87171;
            --warning:   #fbbf24;
            --text:      #e8ecf4;
            --text2:     #8892aa;
            --text3:     #4a5068;
            --radius:    10px;
            --radius-lg: 16px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ── Layout ── */
        .page-wrapper {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px 24px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }

        .header-left h1 {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.3px;
            color: var(--text);
        }

        .header-left p {
            font-size: 13px;
            color: var(--text2);
            margin-top: 4px;
        }

        .header-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(79,142,247,0.12);
            border: 1px solid rgba(79,142,247,0.25);
            color: var(--accent);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .header-badge span {
            display: inline-block;
            width: 6px; height: 6px;
            background: var(--accent);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        /* ── Stats row ── */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 28px;
        }

        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 18px 20px;
        }

        .stat-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--text2);
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .stat-value {
            font-family: 'DM Mono', monospace;
            font-size: 26px;
            font-weight: 500;
            color: var(--text);
            margin-top: 6px;
            line-height: 1;
        }

        .stat-sub {
            font-size: 11px;
            color: var(--text3);
            margin-top: 4px;
        }

        /* ── Toolbar ── */
        .toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .search-wrap {
            position: relative;
            flex: 1;
            min-width: 220px;
        }

        .search-wrap svg {
            position: absolute;
            left: 12px; top: 50%;
            transform: translateY(-50%);
            color: var(--text3);
            pointer-events: none;
        }

        .search-input {
            width: 100%;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            color: var(--text);
            font-family: inherit;
            font-size: 14px;
            padding: 10px 14px 10px 38px;
            outline: none;
            transition: border-color 0.2s;
        }

        .search-input:focus {
            border-color: var(--accent);
        }

        .search-input::placeholder { color: var(--text3); }

        .filter-select {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            color: var(--text);
            font-family: inherit;
            font-size: 13px;
            padding: 10px 14px;
            outline: none;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        .filter-select:focus { border-color: var(--accent); }
        .filter-select option { background: var(--surface2); }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 10px 16px;
            border-radius: var(--radius);
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.18s ease;
            white-space: nowrap;
        }

        .btn-primary {
            background: var(--accent);
            color: #fff;
        }
        .btn-primary:hover { background: #3a7de8; transform: translateY(-1px); }

        .btn-ghost {
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text2);
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

        .btn-danger {
            background: rgba(248,113,113,0.12);
            border: 1px solid rgba(248,113,113,0.25);
            color: var(--danger);
        }
        .btn-danger:hover { background: rgba(248,113,113,0.2); }

        .btn-success {
            background: var(--success);
            color: #0a2218;
        }
        .btn-success:hover { background: #28c58a; }

        .btn-sm { padding: 6px 10px; font-size: 12px; }

        /* ── Table ── */
        .table-wrap {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead tr {
            border-bottom: 1px solid var(--border);
            background: var(--surface2);
        }

        th {
            padding: 12px 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: var(--text2);
            text-align: left;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
        }

        th:hover { color: var(--text); }

        th .sort-icon { margin-left: 4px; opacity: 0.4; }
        th.sorted     { color: var(--accent); }
        th.sorted .sort-icon { opacity: 1; }

        tbody tr {
            border-bottom: 1px solid var(--border);
            transition: background 0.15s;
        }

        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.03); }

        td {
            padding: 13px 16px;
            font-size: 13px;
            color: var(--text);
            vertical-align: middle;
        }

        .cell-id {
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            color: var(--text3);
        }

        .cell-number {
            font-family: 'DM Mono', monospace;
            font-weight: 500;
            color: var(--accent);
        }

        .cell-address { color: var(--text); max-width: 220px; }
        .cell-address .street { color: var(--text2); font-size: 12px; margin-top: 2px; }

        .cell-coords {
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            color: var(--text3);
            line-height: 1.6;
        }

        .cell-area {
            font-family: 'DM Mono', monospace;
            font-size: 12px;
        }

        .cell-date {
            font-size: 12px;
            color: var(--text3);
        }

        .has-geo {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(52,211,153,0.1);
            border: 1px solid rgba(52,211,153,0.2);
            color: var(--success);
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
        }

        .no-geo {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(248,113,113,0.08);
            border: 1px solid rgba(248,113,113,0.15);
            color: var(--danger);
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
        }

        .actions-cell {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        /* ── Empty state ── */
        .empty-state {
            padding: 60px 20px;
            text-align: center;
            color: var(--text3);
        }

        .empty-state svg { opacity: 0.2; margin-bottom: 16px; }
        .empty-state p   { font-size: 14px; }

        /* ── Pagination ── */
        .pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            border-top: 1px solid var(--border);
            background: var(--surface2);
            font-size: 13px;
            color: var(--text2);
        }

        .page-btns { display: flex; gap: 4px; }

        .page-btn {
            width: 32px; height: 32px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text2);
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s;
        }

        .page-btn:hover   { border-color: var(--accent); color: var(--accent); }
        .page-btn.active  { background: var(--accent); border-color: var(--accent); color: #fff; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Modal ── */
        .modal-overlay {
            position: fixed; inset: 0; z-index: 1000;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none;
            transition: opacity 0.2s;
        }

        .modal-overlay.open { opacity: 1; pointer-events: all; }

        .modal {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 560px;
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(16px) scale(0.98);
            transition: transform 0.2s;
            box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }

        .modal-overlay.open .modal { transform: translateY(0) scale(1); }

        .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
        }

        .modal-header h2 { font-size: 16px; font-weight: 600; }

        .modal-close {
            width: 32px; height: 32px;
            border-radius: 8px;
            background: var(--surface2);
            border: 1px solid var(--border);
            color: var(--text2);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s;
        }
        .modal-close:hover { border-color: var(--danger); color: var(--danger); }

        .modal-body { padding: 24px; }

        .modal-footer {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            padding: 16px 24px;
            border-top: 1px solid var(--border);
        }

        /* ── Form ── */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid .full { grid-column: 1 / -1; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .form-label {
            font-size: 12px;
            font-weight: 500;
            color: var(--text2);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-input, .form-textarea {
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text);
            font-family: inherit;
            font-size: 14px;
            padding: 10px 12px;
            outline: none;
            transition: border-color 0.2s;
            width: 100%;
        }

        .form-input:focus,
        .form-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,142,247,0.1); }

        .form-input::placeholder,
        .form-textarea::placeholder { color: var(--text3); }

        .form-textarea { resize: vertical; min-height: 70px; }

        .form-input[readonly] {
            color: var(--text3);
            cursor: default;
        }

        .form-hint {
            font-size: 11px;
            color: var(--text3);
            margin-top: 2px;
        }

        /* ── Confirm dialog ── */
        .confirm-modal { max-width: 420px; }

        .confirm-icon {
            width: 52px; height: 52px;
            border-radius: 14px;
            background: rgba(248,113,113,0.12);
            border: 1px solid rgba(248,113,113,0.2);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 16px;
        }

        .confirm-title { font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 8px; }
        .confirm-desc  { font-size: 13px; color: var(--text2); text-align: center; line-height: 1.5; }

        /* ── Toast ── */
        .toast-container {
            position: fixed;
            bottom: 24px; right: 24px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 12px 16px;
            font-size: 13px;
            color: var(--text);
            min-width: 260px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            animation: slideUp 0.25s ease, fadeOut 0.3s ease 3.7s forwards;
            pointer-events: all;
        }

        .toast.success { border-color: rgba(52,211,153,0.3); }
        .toast.error   { border-color: rgba(248,113,113,0.3); }
        .toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .toast.success .toast-dot { background: var(--success); }
        .toast.error   .toast-dot { background: var(--danger); }

        @keyframes slideUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut  { to   { opacity:0; transform:translateY(-8px); } }

        /* ── Loading ── */
        .loading-row td {
            padding: 48px;
            text-align: center;
            color: var(--text3);
        }

        .spinner {
            display: inline-block;
            width: 20px; height: 20px;
            border: 2px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            vertical-align: middle;
            margin-right: 8px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: var(--surface); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text3); }

        /* ── Responsive ── */
        @media (max-width: 900px) {
            .stats-row { grid-template-columns: repeat(2, 1fr); }
            td.hide-sm, th.hide-sm { display: none; }
        }
        @media (max-width: 600px) {
            .stats-row { grid-template-columns: 1fr; }
            .form-grid  { grid-template-columns: 1fr; }
            .form-grid .full { grid-column: 1; }
        }
    </style>
</head>
<body>

<div class="page-wrapper">

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1>🏠 House Polygon Manager</h1>
            <p>Barangay Blue Ridge B — house_polygons table</p>
        </div>
        <div class="header-badge">
            <span></span> Live Database
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-label">Total Houses</div>
            <div class="stat-value" id="stat-total">—</div>
            <div class="stat-sub">in database</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">With Geometry</div>
            <div class="stat-value" id="stat-geo">—</div>
            <div class="stat-sub">have coordinates</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Avg Area</div>
            <div class="stat-value" id="stat-area">—</div>
            <div class="stat-sub">square metres</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Showing</div>
            <div class="stat-value" id="stat-showing">—</div>
            <div class="stat-sub">after filters</div>
        </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
        <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" class="search-input" id="search-input"
                   placeholder="Search house number, address, street…">
        </div>

        <select class="filter-select" id="filter-geo">
            <option value="">All entries</option>
            <option value="has">Has geometry</option>
            <option value="missing">Missing geometry</option>
        </select>

        <select class="filter-select" id="per-page-select">
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
        </select>

        <button class="btn btn-ghost" onclick="loadHouses()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refresh
        </button>

        <button class="btn btn-ghost" onclick="recalculateAreas()" id="recalc-btn" title="Fix all area_sqm values using the correct spherical formula">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Fix Areas
        </button>

        <button class="btn btn-primary" onclick="openAddModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add House
        </button>
    </div>

    <!-- Table -->
    <div class="table-wrap">
        <table id="houses-table">
            <thead>
                <tr>
                    <th onclick="sortBy('house_id')" id="th-house_id">
                        ID <span class="sort-icon">↕</span>
                    </th>
                    <th onclick="sortBy('house_number')" id="th-house_number">
                        No. <span class="sort-icon">↕</span>
                    </th>
                    <th onclick="sortBy('address')" id="th-address">
                        Address / Street <span class="sort-icon">↕</span>
                    </th>
                    <th class="hide-sm">Geometry</th>
                    <th class="hide-sm" onclick="sortBy('center_lat')" id="th-center_lat">
                        Centre <span class="sort-icon">↕</span>
                    </th>
                    <th onclick="sortBy('area_sqm')" id="th-area_sqm">
                        Area (m²) <span class="sort-icon">↕</span>
                    </th>
                    <th class="hide-sm" onclick="sortBy('updated_at')" id="th-updated_at">
                        Updated <span class="sort-icon">↕</span>
                    </th>
                    <th style="width:110px;">Actions</th>
                </tr>
            </thead>
            <tbody id="table-body">
                <tr class="loading-row">
                    <td colspan="8"><span class="spinner"></span> Loading houses…</td>
                </tr>
            </tbody>
        </table>

        <div class="pagination" id="pagination" style="display:none;">
            <div id="page-info">Showing 1–20 of 0</div>
            <div class="page-btns" id="page-btns"></div>
        </div>
    </div>
</div>

<!-- ── Edit / Add Modal ─────────────────────────────────────────────────────── -->
<div class="modal-overlay" id="edit-modal">
    <div class="modal">
        <div class="modal-header">
            <h2 id="modal-title">Edit House</h2>
            <button class="modal-close" onclick="closeModal('edit-modal')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="edit-house-id">
            <div class="form-grid">

                <div class="form-group">
                    <label class="form-label">House Number</label>
                    <input type="text" class="form-input" id="edit-house-number" placeholder="e.g. 42, 12-B">
                </div>

                <div class="form-group">
                    <label class="form-label">OSM ID <span style="color:var(--text3);font-size:10px;">(optional)</span></label>
                    <input type="number" class="form-input" id="edit-osm-id" placeholder="OpenStreetMap ID">
                </div>

                <div class="form-group full">
                    <label class="form-label">Street Name</label>
                    <input type="text" class="form-input" id="edit-street-name" placeholder="e.g. Sampaguita St.">
                </div>

                <div class="form-group full">
                    <label class="form-label">Full Address</label>
                    <input type="text" class="form-input" id="edit-address" placeholder="e.g. 42 Sampaguita St., Blue Ridge B, Quezon City">
                </div>

                <div class="form-group">
                    <label class="form-label">Center Latitude</label>
                    <input type="number" class="form-input" id="edit-center-lat" step="0.00000001" placeholder="14.6175…">
                    <span class="form-hint">Auto-computed from polygon</span>
                </div>

                <div class="form-group">
                    <label class="form-label">Center Longitude</label>
                    <input type="number" class="form-input" id="edit-center-lng" step="0.00000001" placeholder="121.0756…">
                    <span class="form-hint">Auto-computed from polygon</span>
                </div>

                <div class="form-group full">
                    <label class="form-label">Area (m²)</label>
                    <input type="number" class="form-input" id="edit-area-sqm" step="0.01" placeholder="0.00">
                    <span class="form-hint">Auto-computed from polygon coordinates</span>
                </div>

                <div class="form-group full">
                    <label class="form-label">
                        Coordinates (GeoJSON polygon ring)
                        <span style="color:var(--text3);font-size:10px;font-weight:400;"> — raw JSON, edit with care</span>
                    </label>
                    <textarea class="form-textarea" id="edit-coordinates" rows="5"
                              placeholder='[[[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]'></textarea>
                    <span class="form-hint">Format: <code style="background:var(--surface2);padding:1px 5px;border-radius:4px;">[ [ [lng,lat], … ] ]</code></span>
                </div>

                <div class="form-group">
                    <label class="form-label">Created</label>
                    <input type="text" class="form-input" id="edit-created-at" readonly>
                </div>

                <div class="form-group">
                    <label class="form-label">Last Updated</label>
                    <input type="text" class="form-input" id="edit-updated-at" readonly>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('edit-modal')">Cancel</button>
            <button class="btn btn-success" id="save-btn" onclick="saveHouse()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
            </button>
        </div>
    </div>
</div>

<!-- ── Delete Confirm Modal ──────────────────────────────────────────────────── -->
<div class="modal-overlay" id="delete-modal">
    <div class="modal confirm-modal">
        <div class="modal-body" style="padding:32px 24px 24px;">
            <div class="confirm-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </div>
            <div class="confirm-title">Delete this house?</div>
            <div class="confirm-desc" id="delete-desc">
                This will permanently remove the house polygon from the database. This action cannot be undone.
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('delete-modal')">Cancel</button>
            <button class="btn btn-danger" id="confirm-delete-btn" onclick="confirmDelete()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
            </button>
        </div>
    </div>
</div>

<!-- Toast container -->
<div class="toast-container" id="toast-container"></div>

<script>
    const HANDLER_URL = '/server/handlers/map/house_handler.php';

    // ── State ─────────────────────────────────────────────────────────────────
    let allHouses      = [];
    let filteredHouses = [];
    let currentPage    = 1;
    let perPage        = 20;
    let sortCol        = 'house_id';
    let sortDir        = 'asc';
    let deleteTargetId = null;

    // ── Boot ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        loadHouses();

        document.getElementById('search-input').addEventListener('input',   applyFilters);
        document.getElementById('filter-geo').addEventListener('change',    applyFilters);
        document.getElementById('per-page-select').addEventListener('change', e => {
            perPage = parseInt(e.target.value);
            currentPage = 1;
            renderTable();
        });
    });

    // ── Load ─────────────────────────────────────────────────────────────────
    async function loadHouses() {
        document.getElementById('table-body').innerHTML =
            '<tr class="loading-row"><td colspan="8"><span class="spinner"></span> Loading…</td></tr>';

        try {
            const res  = await fetch(HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=get_all_houses'
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message);

            allHouses = data.houses;
            applyFilters();
            updateStats();

        } catch (err) {
            document.getElementById('table-body').innerHTML =
                `<tr class="loading-row"><td colspan="8" style="color:var(--danger)">⚠ ${err.message}</td></tr>`;
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    function updateStats() {
        const total   = allHouses.length;
        const withGeo = allHouses.filter(h => h.coordinates && h.coordinates.length).length;
        const areas   = allHouses.map(h => parseFloat(h.area_sqm)).filter(a => a > 0);
        const avgArea = areas.length ? Math.round(areas.reduce((a,b)=>a+b,0) / areas.length) : 0;

        document.getElementById('stat-total').textContent   = total;
        document.getElementById('stat-geo').textContent     = withGeo;
        document.getElementById('stat-area').textContent    = avgArea || '—';
        document.getElementById('stat-showing').textContent = filteredHouses.length;
    }

    // ── Filter + Sort ─────────────────────────────────────────────────────────
    function applyFilters() {
        const q      = document.getElementById('search-input').value.toLowerCase().trim();
        const geoFlt = document.getElementById('filter-geo').value;

        filteredHouses = allHouses.filter(h => {
            // text search
            const haystack = [h.house_id, h.house_number, h.address, h.street_name, h.osm_id]
                .join(' ').toLowerCase();
            if (q && !haystack.includes(q)) return false;

            // geo filter
            const hasGeo = h.coordinates && Array.isArray(h.coordinates) && h.coordinates.length > 0;
            if (geoFlt === 'has'     && !hasGeo) return false;
            if (geoFlt === 'missing' &&  hasGeo) return false;

            return true;
        });

        sortHouses();
        currentPage = 1;
        renderTable();
        document.getElementById('stat-showing').textContent = filteredHouses.length;
    }

    function sortBy(col) {
        if (sortCol === col) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortCol = col; sortDir = 'asc';
        }
        sortHouses();
        renderTable();
        updateSortHeaders();
    }

    function sortHouses() {
        filteredHouses.sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (av === null || av === undefined) av = '';
            if (bv === null || bv === undefined) bv = '';
            if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) {
                av = parseFloat(av); bv = parseFloat(bv);
            } else {
                av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
            }
            if (av < bv) return sortDir === 'asc' ? -1 :  1;
            if (av > bv) return sortDir === 'asc' ?  1 : -1;
            return 0;
        });
    }

    function updateSortHeaders() {
        document.querySelectorAll('th[id^="th-"]').forEach(th => {
            th.classList.remove('sorted');
            th.querySelector('.sort-icon').textContent = '↕';
        });
        const active = document.getElementById('th-' + sortCol);
        if (active) {
            active.classList.add('sorted');
            active.querySelector('.sort-icon').textContent = sortDir === 'asc' ? '↑' : '↓';
        }
    }

    // ── Render table ──────────────────────────────────────────────────────────
    function renderTable() {
        const tbody  = document.getElementById('table-body');
        const total  = filteredHouses.length;
        const start  = (currentPage - 1) * perPage;
        const end    = Math.min(start + perPage, total);
        const slice  = filteredHouses.slice(start, end);

        if (!slice.length) {
            tbody.innerHTML = `
                <tr><td colspan="8">
                    <div class="empty-state">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <p>No houses match your search.</p>
                    </div>
                </td></tr>`;
            document.getElementById('pagination').style.display = 'none';
            return;
        }

        tbody.innerHTML = slice.map(h => {
            const hasGeo = h.coordinates && Array.isArray(h.coordinates) && h.coordinates.length > 0;
            const updDate = h.updated_at ? new Date(h.updated_at).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'}) : '—';

            return `
            <tr>
                <td class="cell-id">${h.house_id}</td>
                <td class="cell-number">${h.house_number || '<span style="color:var(--text3)">—</span>'}</td>
                <td class="cell-address">
                    <div>${h.address || '<span style="color:var(--text3);font-size:12px;">No address</span>'}</div>
                    ${h.street_name ? `<div class="street">${h.street_name}</div>` : ''}
                </td>
                <td class="hide-sm">
                    ${hasGeo
                        ? `<span class="has-geo"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg> Yes</span>`
                        : `<span class="no-geo">None</span>`}
                </td>
                <td class="cell-coords hide-sm">
                    ${(h.center_lat && h.center_lng)
                        ? `${parseFloat(h.center_lat).toFixed(5)}<br>${parseFloat(h.center_lng).toFixed(5)}`
                        : '<span style="color:var(--text3)">—</span>'}
                </td>
                <td class="cell-area">
                    ${h.area_sqm ? parseFloat(h.area_sqm).toLocaleString() : '<span style="color:var(--text3)">—</span>'}
                </td>
                <td class="cell-date hide-sm">${updDate}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-ghost btn-sm" title="Edit" onclick='openEditModal(${JSON.stringify(h)})'>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-danger btn-sm" title="Delete" onclick="openDeleteModal(${h.house_id}, '${(h.house_number || h.address || 'House #' + h.house_id).replace(/'/g,"\\'")}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Pagination
        const pageCount = Math.ceil(total / perPage);
        document.getElementById('pagination').style.display = 'flex';
        document.getElementById('page-info').textContent =
            `Showing ${start+1}–${end} of ${total}`;

        renderPageButtons(pageCount);
    }

    function renderPageButtons(pageCount) {
        const container = document.getElementById('page-btns');
        if (pageCount <= 1) { container.innerHTML = ''; return; }

        let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹</button>`;

        const range = getPageRange(currentPage, pageCount);
        range.forEach(p => {
            if (p === '…') {
                html += `<button class="page-btn" disabled>…</button>`;
            } else {
                html += `<button class="page-btn ${p===currentPage?'active':''}" onclick="goPage(${p})">${p}</button>`;
            }
        });

        html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===pageCount?'disabled':''}>›</button>`;
        container.innerHTML = html;
    }

    function getPageRange(cur, total) {
        if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
        if (cur <= 4)   return [1,2,3,4,5,'…',total];
        if (cur >= total-3) return [1,'…',total-4,total-3,total-2,total-1,total];
        return [1,'…',cur-1,cur,cur+1,'…',total];
    }

    function goPage(p) {
        const pageCount = Math.ceil(filteredHouses.length / perPage);
        if (p < 1 || p > pageCount) return;
        currentPage = p;
        renderTable();
        window.scrollTo({top:0, behavior:'smooth'});
    }

    // ── Modal helpers ─────────────────────────────────────────────────────────
    function openModal(id)  { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    // ── Add Modal ─────────────────────────────────────────────────────────────
    function openAddModal() {
        document.getElementById('modal-title').textContent = 'Add House';
        document.getElementById('edit-house-id').value     = '';
        document.getElementById('edit-house-number').value = '';
        document.getElementById('edit-osm-id').value       = '';
        document.getElementById('edit-street-name').value  = '';
        document.getElementById('edit-address').value      = '';
        document.getElementById('edit-center-lat').value   = '';
        document.getElementById('edit-center-lng').value   = '';
        document.getElementById('edit-area-sqm').value     = '';
        document.getElementById('edit-coordinates').value  = '';
        document.getElementById('edit-created-at').value   = 'Will be set on save';
        document.getElementById('edit-updated-at').value   = 'Will be set on save';
        document.getElementById('save-btn').textContent    = 'Add House';
        openModal('edit-modal');
    }

    // ── Edit Modal ────────────────────────────────────────────────────────────
    function openEditModal(h) {
        document.getElementById('modal-title').textContent    = `Edit House #${h.house_id}`;
        document.getElementById('edit-house-id').value        = h.house_id;
        document.getElementById('edit-house-number').value    = h.house_number  || '';
        document.getElementById('edit-osm-id').value          = h.osm_id        || '';
        document.getElementById('edit-street-name').value     = h.street_name   || '';
        document.getElementById('edit-address').value         = h.address       || '';
        document.getElementById('edit-center-lat').value      = h.center_lat    || '';
        document.getElementById('edit-center-lng').value      = h.center_lng    || '';
        document.getElementById('edit-area-sqm').value        = h.area_sqm      || '';
        document.getElementById('edit-created-at').value      = h.created_at
            ? new Date(h.created_at).toLocaleString('en-PH') : '';
        document.getElementById('edit-updated-at').value      = h.updated_at
            ? new Date(h.updated_at).toLocaleString('en-PH') : '';

        // Pretty-print coordinates JSON
        const coords = h.coordinates;
        document.getElementById('edit-coordinates').value = coords
            ? JSON.stringify(coords, null, 2) : '';

        document.getElementById('save-btn').innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg> Save Changes`;

        openModal('edit-modal');
    }

    // ── Save (insert / update) ────────────────────────────────────────────────
    async function saveHouse() {
        const houseId    = document.getElementById('edit-house-id').value.trim();
        const coordsRaw  = document.getElementById('edit-coordinates').value.trim();

        // Validate coordinates JSON if provided
        let coordsParsed = null;
        if (coordsRaw) {
            try {
                coordsParsed = JSON.parse(coordsRaw);
            } catch {
                showToast('Coordinates field contains invalid JSON.', 'error');
                document.getElementById('edit-coordinates').focus();
                return;
            }
        }

        const formData = new FormData();
        formData.append('action',       houseId ? 'save_house' : 'save_house');
        formData.append('house_id',     houseId);
        formData.append('house_number', document.getElementById('edit-house-number').value.trim());
        formData.append('osm_id',       document.getElementById('edit-osm-id').value.trim());
        formData.append('street_name',  document.getElementById('edit-street-name').value.trim());
        formData.append('address',      document.getElementById('edit-address').value.trim());
        formData.append('center_lat',   document.getElementById('edit-center-lat').value.trim());
        formData.append('center_lng',   document.getElementById('edit-center-lng').value.trim());
        formData.append('area_sqm',     document.getElementById('edit-area-sqm').value.trim());
        formData.append('coordinates',  coordsRaw ? JSON.stringify(coordsParsed) : '');

        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
            const res    = await fetch(HANDLER_URL, { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                showToast(houseId ? 'House updated successfully.' : 'House added successfully.', 'success');
                closeModal('edit-modal');
                await loadHouses();
            } else {
                showToast('Error: ' + result.message, 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    function openDeleteModal(id, label) {
        deleteTargetId = id;
        document.getElementById('delete-desc').textContent =
            `House "${label}" (ID: ${id}) will be permanently deleted. This cannot be undone.`;
        openModal('delete-modal');
    }

    async function confirmDelete() {
        if (!deleteTargetId) return;

        const btn = document.getElementById('confirm-delete-btn');
        btn.disabled = true; btn.textContent = 'Deleting…';

        const fd = new FormData();
        fd.append('action',   'delete_house');
        fd.append('house_id', deleteTargetId);

        try {
            const res    = await fetch(HANDLER_URL, { method: 'POST', body: fd });
            const result = await res.json();

            if (result.success) {
                showToast('House deleted.', 'success');
                closeModal('delete-modal');
                deleteTargetId = null;
                await loadHouses();
            } else {
                showToast('Error: ' + result.message, 'error');
            }
        } catch (err) {
            showToast('Network error.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Delete';
        }
    }

    // ── Toast ─────────────────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4200);
    }

    // ── Recalculate all areas ─────────────────────────────────────────────────
    async function recalculateAreas() {
        if (!confirm('Recalculate area_sqm and centroid for ALL houses with coordinates?\nThis will fix the 0.03–0.05 values in the database.')) return;

        const btn = document.getElementById('recalc-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Fixing…';

        try {
            const res    = await fetch(HANDLER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=recalculate_areas'
            });
            const result = await res.json();

            if (result.success) {
                showToast(`✅ ${result.message}`, 'success');
                await loadHouses();
            } else {
                showToast('Error: ' + result.message, 'error');
            }
        } catch (err) {
            showToast('Network error.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Fix Areas`;
        }
    }

    // Keyboard shortcut: Esc closes modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        }
    });
</script>
</body>
</html>