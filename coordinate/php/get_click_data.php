<?php
/**
 * リプレイ機能：クリックデータの取得
 */
require 'MYDB.php';
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $pdo = db_connect();
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['video_id']) || !isset($data['user_id'])) {
        throw new Exception('video_id or user_id is missing');
    }
    
    $video_id = $data['video_id'];
    $user_id = $data['user_id'];

    $stmt = $pdo->prepare("SELECT id, x_coordinate AS x, y_coordinate AS y, click_time, comment FROM click_coordinates WHERE video_id = :video_id AND user_id = :user_id ORDER BY click_time ASC");
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($clicks)) {
        echo json_encode(['status' => 'success', 'clicks' => [], 'message' => 'No clicks found for this video and user']);
    } else {
        echo json_encode(['status' => 'success', 'clicks' => $clicks]);
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>