<?php
/**
 * セッション管理
 */
    require_once(__DIR__ . "/../user_registration/php/common.php");
    session_start();

    if (!isset($_SESSION["user_id"])) {
        header("Location: login.php");
        exit();
    }
?>
