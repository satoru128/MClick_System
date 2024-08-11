<?php
/**
 * ログアウト機能
 */
require_once(__DIR__ . "/../user_registration/php/common.php");
session_start();
// セッション変数を全て解除
$_SESSION = array();
// セッションクッキーを削除
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
// セッションを破棄
session_destroy();
// ログインページにリダイレクト
header("Location: login.php?message=" . urlencode("ログアウトしました"));
exit();
?>