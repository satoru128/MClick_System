<?php
/**
 * セッションの開始とユーザーIDのチェック
 */
    session_start();
    if (!isset($_SESSION['user_id'])) {
        header('Location: login.html');
        exit();
    }
?>