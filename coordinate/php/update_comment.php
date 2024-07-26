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

    // 重複データを削除
    $stmt = $pdo->prepare("DELETE FROM click_coordinates WHERE user_id = :user_id AND video_id = :video_id AND x_coordinate = :x AND y_coordinate = :y AND click_time = :click_time AND comment IS NULL");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':x', $x, PDO::PARAM_INT);
    $stmt->bindParam(':y', $y, PDO::PARAM_INT);
    $stmt->bindParam(':click_time', $click_time, PDO::PARAM_STR);
    $stmt->bindParam(':video_id', $video_id, PDO::PARAM_STR);
    $stmt->execute();

    // 最新の座標データにコメントを追加または更新
    $stmt = $pdo->prepare("UPDATE click_coordinates SET comment = :comment WHERE user_id = :user_id AND video_id = :video_id AND x_coordinate = :x AND y_coordinate = :y AND click_time = :click_time");
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