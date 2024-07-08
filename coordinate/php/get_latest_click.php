<?php
require_once("MYDB.php");
$pdo = db_connect();

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'];
$video_id = $data['video_id'];

try {
    $stmt = $pdo->prepare("SELECT id, x_coordinate, y_coordinate, click_time, comment FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id ORDER BY click_time DESC LIMIT 1");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();
    $latest_click = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($latest_click) {
        echo json_encode([
            "status" => "success",
            "id" => $latest_click['id'],
            "x" => $latest_click['x_coordinate'],
            "y" => $latest_click['y_coordinate'],
            "click_time" => $latest_click['click_time'],
            "comment" => $latest_click['comment']
        ]);
    } else {
        echo json_encode(["status" => "error", "error" => "No click data found"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
$pdo = null;
?>
