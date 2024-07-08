<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once("MYDB.php");
$pdo = db_connect();

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'];

try {
    $pdo->beginTransaction();

    // 元の座標データを削除
    $stmt = $pdo->prepare("DELETE FROM click_coordinates WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $pdo->commit();

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
$pdo = null;
?>
