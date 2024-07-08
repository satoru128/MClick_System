<?php
/**
 * セッションからユーザーIDを取得し、返す。
 */
    session_start();
    if (isset($_SESSION['user_id'])) {
        echo json_encode(["user_id" => $_SESSION['user_id']]);
    } else {
        echo json_encode(["user_id" => null, "status" => "error", "error" => "User ID is missing"]);
    }
?>