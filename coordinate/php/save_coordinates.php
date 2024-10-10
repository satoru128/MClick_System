<?php
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    require_once("MYDB.php");
    $pdo = db_connect();

    // JSONデータを取得
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON data");
    }

    // データの検証
    if (!isset($data['user_id'], $data['x'], $data['y'], $data['click_time'], $data['video_id'])) {
        throw new Exception("Missing required fields");
    }

    $user_id = $data['user_id'];
    $x = $data['x'];
    $y = $data['y'];
    $click_time = $data['click_time'];
    $video_id = $data['video_id'];

    // データベースに保存
    $stmt = $pdo->prepare("INSERT INTO click_coordinates (user_id, x_coordinate, y_coordinate, click_time, video_id) VALUES (:user_id, :x, :y, :click_time, :video_id)");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':x', $x, PDO::PARAM_STR);  // Changed to PARAM_STR
    $stmt->bindParam(':y', $y, PDO::PARAM_STR);  // Changed to PARAM_STR
    $stmt->bindParam(':click_time', $click_time, PDO::PARAM_STR);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();

    // 最新のクリックデータを取得
    $stmt = $pdo->prepare("SELECT * FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id ORDER BY id DESC LIMIT 1");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();
    $latest_click = $stmt->fetch(PDO::FETCH_ASSOC);

    // ログファイルに表形式で書き込む
    $log_message = "ID    User ID    X Coordinate    Y Coordinate    Click Time     Video ID     Comment\n";
    $stmt = $pdo->prepare("SELECT * FROM click_coordinates ORDER BY id ASC");
    $stmt->execute();
    $all_clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($all_clicks as $click) {
        $log_message .= sprintf("%-5s %-10s %-15s %-15s %-15s %-15s %-15s\n", 
            $click['id'], 
            $click['user_id'], 
            $click['x_coordinate'], 
            $click['y_coordinate'], 
            $click['click_time'], 
            $click['video_id'], 
            isset($click['comment']) ? $click['comment'] : "N/A"
        );
    }
    file_put_contents('now_clicks_log.txt', $log_message);

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>