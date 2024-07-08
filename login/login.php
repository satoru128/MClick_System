<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ログイン画面</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>ログイン</h1>

    <?php
        require_once(__DIR__ . "/../user_registration/php/common.php");
        if (isset($_GET["error"])) {
            echo "<p style='color:red;'>{$_GET["error"]}</p>";
        }
    ?>

    <form action="login_process.php" method="post">
        <p>ID：<br>
        <input type="text" name="user_id" placeholder="例）1111" required>
        </p>
        <p>パスワード：<br>
        <input type="password" name="password" placeholder="例）2222" required>
        </p>
        <p>視聴したい動画を選択してください：<br>
        <select id="videoSelection" name="video_id">
            <option value="n0tt3meYVkU">動画1</option>
            <option value="dwk2DTGHjc4">動画2</option>
            <!-- ここに他の動画IDを追加 -->
        </select>
        </p>
        <input type="submit" value="ログイン">
    </form>
    <p><a href="../user_registration/php/user_input.php">新規登録</a></p>
</body>
</html>
