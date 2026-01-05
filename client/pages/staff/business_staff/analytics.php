<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics</title>

    <link rel="stylesheet" href="../../../styles/staff/business_staff/analytics.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <div class="analytics-container">
        <div class="charts">
            <canvas id="businessChart1"></canvas>
        </div>
        <div class="charts">
            <canvas id="businessChart2"></canvas>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        fetch('/Banwa/client/scripts/staff/business_staff/business_handler.php?action=chart_business_type')
            .then(res => res.json())
            .then(res => {
                if (res.status !== 'success') return;

                const labels1 = res.data_by_date.map(x => x.application_date);
                const values1 = res.data_by_date.map(x => x.total);

                const labels2 = res.data_by_type.map(x => x.type_of_business);
                const values2 = res.data_by_type.map(x => x.total);
                
                // Your fixed colors
                // Will change this later to dynamic colors based on number of business types
                // - jep
                const dateColors = [
                    '#4F46E5',
                    '#2563EB',
                    '#0284C7',
                    '#0891B2',
                    '#0D9488',
                    '#14B8A6'
                ];

                const typeColors = [
                    '#F59E0B',
                    '#F97316',
                    '#EF4444',
                    '#8B5CF6',
                    '#EC4899',
                    '#84CC16'
                ];


                new Chart(document.getElementById('businessChart1'), {
                    type: 'line',
                    data: {
                        labels: labels1,
                        datasets: [{
                            label: 'Business Dates',
                            data: values1,
                            backgroundColor: dateColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });

                new Chart(document.getElementById('businessChart2'), {
                    type: 'bar',
                    data: {
                        labels: labels2,
                        datasets: [{
                            label: 'Business Types',
                            data: values2,
                            backgroundColor: typeColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            });
    </script>
</body>

</html>