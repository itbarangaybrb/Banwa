const ANALYTICS_URL = '../../../../server/api/staff/superadmin/get_analytics.php';

let chart1Instance;
let chart2Instance;
let chart3Instance;
// let chart4Instance;

function loadAnalytics() {
    fetch(ANALYTICS_URL)
        .then(res => res.json())
        .then(res => {
            if (res.status !== 'success') return;

            const labels1 = res.data_by_date.map(x => x.created_date);
            const values1 = res.data_by_date.map(x => x.total);
            const totals1 = values1.slice();
            const percentages1 = values1.map(v => ((v / values1.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels2 = res.data_by_role.map(x => x.role_id);
            const values2 = res.data_by_role.map(x => x.total);
            const totals2 = values2.slice();
            const percentages2 = values2.map(v => ((v / values2.reduce((a, b) => a + b, 0)) * 100).toFixed(2));

            const labels3 = res.data_by_status.map(x => x.status);
            const totals3 = res.data_by_status.map(x => x.total);
            const percentages3 = res.data_by_status.map(x => x.percentage);

            // const labels4 = res.data_by_suspensions.map(x => `${x.suspend_reason} - ${x.suspend_reason_details}`);
            // const totals4 = res.data_by_suspensions.map(x => x.total);
            // const percentages4 = res.data_by_suspensions.map(x => x.percentage);

            const dateColors = [
                '#4F46E5',
                '#2563EB',
                '#0284C7',
                '#0891B2',
                '#0D9488',
                '#14B8A6',
                '#6366F1'
            ];

            const roleColors = [
                '#F59E0B',
                '#F97316',
                '#EF4444',
                '#8B5CF6',
                '#EC4899',
                '#84CC16',
                '#F43F5E',
                '#A855F7'
            ];

            const statusColors = [
                '#10B981',
                '#EF4444',
                '#F59E0B',
                '#6366F1',
                '#8B5CF6',
                '#EC4899',
                '#14B8A6'
            ];

            // const suspensionColors = [
            //     '#EF4444',  // strong red for suspended
            //     '#F97316',
            //     '#F59E0B',
            //     '#8B5CF6',
            //     '#EC4899',
            //     '#6366F1',
            //     '#10B981',
            //     '#0284C7',
            //     '#0D9488'
            // ];

            // Destroy previous charts if they exist
            if (chart1Instance) chart1Instance.destroy();
            if (chart2Instance) chart2Instance.destroy();
            if (chart3Instance) chart3Instance.destroy();
            // if (chart4Instance) chart4Instance.destroy();

            // Chart 1: Users over time
            chart1Instance =
                new Chart(
                    document.getElementById('chart1'),
                    {
                        type: 'line',
                        data: {
                            labels: labels1,
                            datasets: [{
                                label: 'Users',
                                data: values1,
                                backgroundColor: dateColors.map(c => c + '99'),
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: ctx =>
                                            `${ctx.label}: ${totals1[ctx.dataIndex]} (${percentages1[ctx.dataIndex]}%)`
                                    }
                                }
                            }
                        }
                    }
                );

            // Chart 2: Roles
            chart2Instance =
                new Chart(
                    document.getElementById('chart2'),
                    {
                        type: 'bar',
                        data: {
                            labels: labels2,
                            datasets: [{
                                label: 'Roles',
                                data: values2,
                                backgroundColor: roleColors.map(c => c + '99'),
                                borderWidth: 1,
                                borderRadius: '4'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: ctx => `${ctx.label}: ${totals2[ctx.dataIndex]} (${percentages2[ctx.dataIndex]}%)`
                                    }
                                }
                            }
                        }
                    }
                );

            // Chart 3: Status
            chart3Instance =
                new Chart(
                    document.getElementById('chart3'),
                    {
                        type: 'doughnut',
                        data: {
                            labels: labels3,
                            datasets: [{
                                label: 'Status',
                                data: totals3,
                                backgroundColor: statusColors.map(c => c + '99'),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'right', align: 'center' },
                                tooltip: {
                                    callbacks: {
                                        label: ctx => `${ctx.label}: ${totals3[ctx.dataIndex]} (${percentages3[ctx.dataIndex]}%)`
                                    }
                                }
                            }
                        }
                    }
                );

            // Chart 4: Suspensions
            // chart4Instance =
            //     new Chart(
            //         document.getElementById('chart4'),
            //         {
            //             type: 'bar',
            //             data: {
            //                 labels: labels4,
            //                 datasets: [{
            //                     label: 'Suspensions',
            //                     data: totals4,
            //                     backgroundColor: suspensionColors.map(c => c + '99'),
            //                     borderWidth: 1,
            //                     borderRadius: 4
            //                 }]
            //             },
            //             options: {
            //                 indexAxis: 'y', // makes bars horizontal
            //                 responsive: true,
            //                 maintainAspectRatio: false,
            //                 plugins: {
            //                     legend: { position: 'right', align: 'center' },
            //                     tooltip: {
            //                         callbacks: {
            //                             label: ctx => `${ctx.label}: ${totals4[ctx.dataIndex]} (${percentages4[ctx.dataIndex]}%)`
            //                         }
            //                     }
            //                 },
            //                 scales: {
            //                     x: { beginAtZero: true }
            //                 }
            //             }
            //         }
            //     );

        })
        .catch(error => console.error('Error loading analytics:', error));
}

loadAnalytics();