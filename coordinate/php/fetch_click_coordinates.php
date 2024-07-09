<?php
/**
 * メイン画面：クリック座標データの描画
 */
require_once("MYDB.php");
$pdo = db_connect();

header('Content-Type: application/json');

try {
    // Time順にデータを取得
    $stmt = $pdo->prepare("SELECT * FROM click_coordinates ORDER BY click_time ASC");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'data' => $results]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
