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
    <!-- Bootstrap CSSの読み込み -->
    <link href="./Bootstrap/css/bootstrap.min.css" rel="stylesheet">
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
        <div class="switch-container">
            <span class="switch-text">座標取得：オフ</span>
            <label class="switch">
                <input type="checkbox" id="toggleCoordinateBtn">
                <span class="slider round"></span>
            </label>
        </div>
        <div class="switch-container">
            <span class="switch-text">リプレイ：オフ</span>
            <label class="switch">
                <input type="checkbox" id="replayBtn">
                <span class="slider round"></span>
            </label>
        </div>
    </div>
    
    <div id="video-and-data-container">
        <div id="video-container">
            <div id="player" data-video-id="<?php echo $video_id; ?>"></div>
            <canvas id="myCanvas" width="640" height="360"></canvas>
        </div>
        <div id="coordinate-data-container">
            <h2>クリック座標データ</h2>
            <div id="coordinate-data">
                <!-- ここに座標データが動的に追加 -->
            </div>
        </div>
    </div>
    <div id="controls">
        <button id="playBtn" >再生</button>
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
            <button id="exportDataBtn">データをエクスポート</button>
        </div>
        
        <div id="replay-controls">
            <input type="range" id="speedControl" min="0.5" max="2" step="0.1" value="1">
            <span id="speedValue">1x</span>
            <input type="number" id="startTime" placeholder="開始時間">
            <input type="number" id="endTime" placeholder="終了時間">
            <button id="applyReplaySettings">適用</button>
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
    <button id="toggleHeatmapBtn">ヒートマップ表示/非表示</button>
    <div id="contextMenu" class="context-menu">
        <button id="recordScene">そのシーンを記録</button>
        <button id="recordComment">コメント付き座標の記録</button>
        <button id="recordFusen">付箋</button>
    </div>

    <!-- Bootstrap JSの読み込み -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="./Bootstrap/js/bootstrap.min.js"></script>
</body>
</html>
