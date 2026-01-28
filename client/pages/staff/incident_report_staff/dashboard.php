<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>

    <link rel="stylesheet" href="../../../styles/staff/incident_report_staff/main.css">
    <link rel="stylesheet" href="../../../styles/staff/analytics.css">
    <link rel="stylesheet" href="../../../styles/staff/dss.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>

<body>
    <header class="header">
        <h1 class="page-title">Dashboard</h1>
    </header>

    <aside class="aside">
        <nav class="nav">
            <ul class="list">
                <li class="items">
                    <a href="../incident_report_staff/dashboard.php" class="links">Dashboard</a>
                </li>
                <li class="items">
                    <a href="../incident_report_staff/manage.php" class="links">Manage</a>
                </li>
            </ul>
        </nav>
    </aside>

    <main class="main">
        <section class="sections">
            <div class="containers">
                <div id="map"></div>

                <div id="detail-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-title">Marker Details</h3>
                            <button class="close-modal" onclick="closeModal('detail-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="modal-content">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="analytics-container">
                    <div class="charts">
                        <canvas id="chart1"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart2"></canvas>
                    </div>
                    <div class="charts">
                        <canvas id="chart3"></canvas>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script src="../../../scripts/staff/incident_report_staff/main.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="../../../scripts/staff/map.js"></script>
</body>

</html>