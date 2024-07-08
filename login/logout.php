<?php
/**
 * ログアウト機能
 */
require_once(__DIR__ . "/../user_registration/php/common.php");

session_start();
session_destroy();
header("Location: login.php");
exit();
?>
