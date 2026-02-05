<?php
/**
 * SERVICE: Business Analytics
 * This file is a LIBRARY. It should ONLY contain the function definition.
 */

// Use a wrapper to prevent ANY possibility of redeclaration errors
if (!function_exists('handleChartBusinessType')) {
    function handleChartBusinessType($pdo) {
        try {
            // 1. Application Trends
            $sql1 = "SELECT application_date, COUNT(*) AS total FROM business_applications GROUP BY application_date ORDER BY application_date ASC";
            $stmt1 = $pdo->query($sql1);
            $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

            // 2. Business Type Distribution
            $sql2 = "SELECT type_of_business, COUNT(*) AS total FROM business_applications GROUP BY type_of_business ORDER BY total DESC";
            $stmt2 = $pdo->query($sql2);
            $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            // 3. DSS Status Breakdown
            $sql3 = "SELECT COALESCE(be.dss_status, 'Pending Evaluation') as dss_status, COUNT(*) as total 
                     FROM business_applications ba 
                     LEFT JOIN business_evaluations be ON ba.id = be.application_id 
                     GROUP BY dss_status";
            $stmt3 = $pdo->query($sql3);
            $dataByDSS = $stmt3->fetchAll(PDO::FETCH_ASSOC);

            // We return the data so the handler can choose how to output it
            return [
                "status" => "success",
                "data" => [
                    "byDate" => $dataByDate,
                    "byType" => $dataByType,
                    "byDSS" => $dataByDSS
                ]
            ];
        } catch (Exception $e) {
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }
}