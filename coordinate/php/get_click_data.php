<?php
require 'MYDB.php';

header('Content-Type: application/json');

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['video_id'])) {
            throw new Exception("Invalid input");
        }
        $video_id = $data['video_id'];
        
        $conn = connect_db();
        
        if (!$conn) {
            throw new Exception("Database connection failed: " . mysqli_connect_error());
        }
        
        $sql = "SELECT id, x_coordinate AS x, y_coordinate AS y, click_time FROM click_coordinates WHERE video_id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare statement failed: " . $conn->error);
        }
        
        $stmt->bind_param("s", $video_id);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        if (!$result) {
            throw new Exception("Getting result set failed: " . $stmt->error);
        }
        
        $clicks = array();
        while ($row = $result->fetch_assoc()) {
            $clicks[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'clicks' => $clicks]);
        
        $stmt->close();
        $conn->close();
    } else {
        throw new Exception('Invalid request method');
    }
} catch (Exception $e) {
    error_log($e->getMessage()); // エラーメッセージをログに出力
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
