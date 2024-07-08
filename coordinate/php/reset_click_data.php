<?php
require_once(__DIR__ . "/MYDB.php");

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $input['user_id'];
    $video_id = $input['video_id'];

    try {
        $pdo = db_connect();

        // クリックデータを削除
        $stmt = $pdo->prepare("DELETE FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id");
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':video_id', $video_id, PDO::PARAM_STR);
        $stmt->execute();

        // クリックカウントをリセット
        $stmt = $pdo->prepare("UPDATE click_counts SET click_count = 0 WHERE user_id = :user_id AND video_id = :video_id");
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':video_id', $video_id, PDO::PARAM_STR);
        $stmt->execute();

        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
