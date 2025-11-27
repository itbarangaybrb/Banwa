<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';


$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid JSON"]);
    exit;
}

// Extract values
$fullname    = $input["fullname"];
$sex         = $input["sex"];
$contactNo   = $input["contactNo"];
$address     = $input["address"];
$idType      = $input["idType"];
$email       = $input["email"];
$password    = password_hash($input["password"], PASSWORD_DEFAULT);
$agree       = $input["agreeCheckBox"];

try {
    $stmt = $pdo->prepare("
        INSERT INTO residents (fullname, sex, contact_no, address, id_type, email, password, agree_terms)
        VALUES (:fullname, :sex, :contactNo, :address, :idType, :email, :password, :agree_terms)
    ");

    $stmt->execute([
        ":fullname"   => $fullname,
        ":sex"        => $sex,
        ":contactNo"  => $contactNo,
        ":address"    => $address,
        ":idType"     => $idType,
        ":email"      => $email,
        ":password"   => $password,
        ":agree_terms" => $agree
    ]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
