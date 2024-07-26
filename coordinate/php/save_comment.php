<?php
require_once("MYDB.php");
$pdo = db_connect();

$data = json_decode(file_get_contents('php://input'), true);

$user_id = $data['user_id'];
$x = $data['x'];
$y = $data['y'];
$click_time = $data['click_time'];
$video_id = $data['video_id'];
$comment = isset($data['comment']) ? $data['comment'] : null;

try {
    $pdo->beginTransaction();

    // 同じ座標とclick_timeを持つ既存のデータを削除
    $stmt = $pdo->prepare("DELETE FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id AND x_coordinate = :x AND y_coordinate = :y AND click_time = :click_time");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':x', $x, PDO::PARAM_INT);
    $stmt->bindParam(':y', $y, PDO::PARAM_INT);
    $stmt->bindParam(':click_time', $click_time, PDO::PARAM_STR);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();

    // コメントを含む新しい座標データを保存
    $stmt = $pdo->prepare("INSERT INTO click_coordinates (user_id, x_coordinate, y_coordinate, click_time, video_id, comment) VALUES (:user_id, :x, :y, :click_time, :video_id, :comment)");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':x', $x, PDO::PARAM_INT);
    $stmt->bindParam(':y', $y, PDO::PARAM_INT);
    $stmt->bindParam(':click_time', $click_time, PDO::PARAM_STR);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->bindParam(':comment', $comment, PDO::PARAM_STR);
    $stmt->execute();

    $pdo->commit();

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
$pdo = null;
?>