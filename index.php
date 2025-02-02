<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>丸山クリックシステム</title>
    <link rel="stylesheet" href="./coordinate/css/style.css">
    <script src="https://www.youtube.com/iframe_api"></script>
    <script src="./coordinate/script/app.js" defer></script>
    <script src="./coordinate/script/script.js" defer></script>
</head>
<body>
    <?php
    session_start();
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.php");
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $video_id = isset($_SESSION['video_id']) ? $_SESSION['video_id'] : 'n0tt3meYVkU'; // デフォルトの動画IDを設定
    ?>
    <div id="toggle-coordinate-container">
        <button id="toggleCoordinateBtn" class="off">座標取得オフ</button>
        <button id="replayBtn" class="off">リプレイオフ</button>
    </div>
    
    <div id="video-and-data-container">
        <div id="video-container">
            <div id="player" data-video-id="<?php echo $video_id; ?>"></div>
            <canvas id="myCanvas"></canvas>
        </div>
        <div id="coordinate-data-container">
            <h3>クリック座標データ</h3>
            <div id="coordinate-data">
                <!-- ここに座標データが動的に追加されます -->
            </div>
        </div>
    </div>
    <div id="controls">
        <button id="playBtn">再生</button>
        <button id="pauseBtn">一時停止</button>
        <button id="stopBtn">停止</button>
        <button id="muteBtn" data-pressed="false">🔊</button>
        <button id="rewindBtn" data-pressed="false">10秒巻き戻し</button>
        <button id="skipBtn" data-pressed="false">10秒スキップ</button>
        <button id="mistakeBtn">ミス</button>
        <button> <a href="./coordinate/php/display_click_coordinates.php">テーブル閲覧</a></button>

        <div id="comment-section">
            <button id="commentBtn">コメント</button>
            <div id="commentModal" class="modal">
                <div class="modal-content">
                    <textarea id="commentInput" placeholder="ここにコメント入力"></textarea>
                    <br>
                    <button id="commentSubmit">送信</button>
                    <button id="commentCancel">キャンセル</button>
                </div>
            </div>
        </div>

        <div id="reset-container">
            <span>クリック回数: <span id="clickCount">0</span></span>
            <button id="resetBtn">リセット</button>
        </div>
        <div id="resetModal" class="modal">
            <div class="modal-content">
                <p>本当にリセットしてもよろしいですか？</p>
                <button id="resetConfirm">OK</button>
                <button id="resetCancel">CANCEL</button>
            </div>
        </div>
        <div id="confirmUpdateModal" class="modal">
            <div class="modal-content">
                <p>コメントは入力されています．更新しますか？</p>
                <button id="confirmUpdateYes">はい</button>
                <button id="confirmUpdateNo">いいえ</button>
            </div>
        </div>

        <p>シークバー<input type="range" id="seekBar" value="0" max="100" step="1"></p>
        <p id="timeDisplay">00:00 / 00:00</p>
        <p>音量<input type="range" id="volumeBar" value="1" max="1" step="0.01"></p>
    </div>
    <div id="info-container">
        <div id="user-info">ログインユーザーID: <?php echo $user_id; ?></div>
        <div id="video-info">再生中のvideoId: <?php echo $video_id; ?></div>
    </div>
    <div id="logout-controls">
        <a href="./login/logout.php">ログアウト</a>
    </div>
    <div id="contextMenu" class="context-menu">
        <button id="recordScene">そのシーンを記録</button>
        <button id="recordComment">コメント付き座標の記録</button>
        <button id="recordFusen">付箋</button>
    </div>
</body>
</html>
