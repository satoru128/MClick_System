<?php
/**
 * 最新のクリック座標を削除し、そのクリック時間を返す
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once("MYDB.php");
$pdo = db_connect();

// JSONデータを取得
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["status" => "error", "error" => "Invalid JSON data"]);
    exit();
}

$user_id = $data['user_id'] ?? null;
$video_id = $data['video_id'] ?? null;

if ($user_id === null || $video_id === null) {
    echo json_encode(["status" => "error", "error" => "User ID or Video ID is missing"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, x_coordinate, y_coordinate, click_time FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id ORDER BY id DESC LIMIT 1");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();
    $latest_click = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($latest_click) {
        $click_time = $latest_click['click_time'];
        $x = $latest_click['x_coordinate'];
        $y = $latest_click['y_coordinate'];

        $stmt = $pdo->prepare("DELETE FROM click_coordinates WHERE id = :id");
        $stmt->bindParam(':id', $latest_click['id'], PDO::PARAM_INT);
        $stmt->execute();

        $stmt = $pdo->prepare("SELECT x_coordinate, y_coordinate, click_time FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
        $stmt->execute();
        $remaining_clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $log_message = sprintf("List of current click coordinates for User ID: %s, Video ID: %s\n", $user_id, $video_id);
        foreach ($remaining_clicks as $click) {
            $log_message .= sprintf("X: %d, Y: %d, Click Time: %f\n", $click['x_coordinate'], $click['y_coordinate'], $click['click_time']);
        }
        file_put_contents('now_clicks_log.txt', $log_message);

        echo json_encode(["status" => "success", "click_time" => $click_time, "x" => $x, "y" => $y]);
    } else {
        echo json_encode(["status" => "error", "error" => "No click coordinates found"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}

// クリックカウントを1減らす
$stmt = $pdo->prepare("UPDATE click_counts SET click_count = GREATEST(click_count - 1, 0) WHERE user_id = :user_id AND video_id = :video_id");
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
$stmt->execute();

$pdo = null;
?>
