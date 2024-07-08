<?php
require_once(__DIR__ . "/MYDB.php");

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $input['user_id'];
    $video_id = $input['video_id'];

    try {
        $pdo = db_connect();
        $stmt = $pdo->prepare("SELECT click_count FROM click_counts WHERE user_id = :user_id AND video_id = :video_id");
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':video_id', $video_id, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            echo json_encode(['status' => 'success', 'click_count' => $row['click_count']]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No data found']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
