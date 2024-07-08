<?php
    /**
     * 処理に必要な共通ファイル
     */
    require_once(__DIR__ . '/../common/html_functions.php');
    require_once(__DIR__ . '/../common/dbmanager.php');
    require_once(__DIR__ . '/../common/data_check.php');

    // エラーの取得関数
    function get_error() {
        $error = "";
        if (isset($_GET["error"])) {
            $error = $_GET["error"];
        }
        return $error;
    }

    $dbm = new DBManager();
?>
