<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>丸山クリックシステム</title>
    <link href="./Bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="./coordinate/css/style.css">
    <script src="https://www.youtube.com/iframe_api"></script>
    <script src="./coordinate/script/app.js" defer></script>
    <!-- <script src="./coordinate/script/script.js" defer></script> -->
</head>
<body class="bg-light">
    <?php
    session_start();
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.php");
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $video_id = isset($_SESSION['video_id']) ? $_SESSION['video_id'] : 'n0tt3meYVkU';
    ?>
    <!--ナビゲーションバー-->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">丸山クリックシステム</a>
            <div class="navbar-text text-white">
                ユーザー ID：<?php echo $user_id; ?> 　|　
                VideoID：<?php echo $video_id; ?>
            </div>
            <a href="./login/logout.php" class="btn btn-outline-light">ログアウト</a>
        </div>
    </nav>
    <!--カード-->
    <div class="container-fluid mt-3">
        <div class="row">
            <div class="col-lg-8 mb-3">  <!--カラム 8/12-->
                <div class="card mb-3">
                    <!--d-flex：FlexBoxを適用．
                        justify-content-center：コンテナ内の項目を水平方向の中央に配置．
                        align-items-center    ：コンテナ内の項目を垂直方向の中央に配置-->
                    <div class="card-body d-flex justify-content-center align-items-center">
                        <div id="video-container" class="position-relative">
                            <div id="player" data-video-id="<?php echo $video_id; ?>"></div>
                            <canvas id="myCanvas" width="640" height="360" class="position-absolute top-0 start-0"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card mb-3 d-flex justify-content-center align-items-center">
                    <div class="card-body">
                        <div id="controls">
                            <div class="btn-group" role="group" aria-label="Basic outlined example">
                                <button id="playBtn" class="btn btn-outline-primary">再生</button>
                                <button id="pauseBtn" class="btn btn-outline-primary">一時停止</button>
                                <button id="stopBtn" class="btn btn-outline-primary">停止</button>
                            </div>
                            <button id="muteBtn" class="btn btn-info mx-3" data-pressed="false">🔊</button>
                            <div class="btn-group" role="group" aria-label="Basic outlined example">
                                <button id="rewindBtn" class="btn btn-outline-success" data-pressed="false">10秒巻き戻し</button>
                                <button id="skipBtn" class="btn btn-outline-success" data-pressed="false">10秒スキップ</button>
                            </div>
                            <button id="mistakeBtn" class="btn btn-danger mx-3">ミス</button>
                            <div id="comment-section">
                                <button id="commentBtn" class="btn btn-primary">コメント</button>
                            </div>    
                        </div>

                        <div class="mt-3">
                            <label for="seekBar" class="form-label d-flex">再生時間：<p id="timeDisplay">00:00 / 00:00</p></label>
                            <input type="range" class="form-range" id="seekBar" value="0" max="100" step="1">
                        </div>
                        
                        <div class="mt-3">
                            <label for="volumeBar" class="form-label">音量</label>
                            <input type="range" class="form-range" id="volumeBar" value="1" max="1" step="0.01">
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">座標取得とリプレイ</h5>
                        <div class="d-flex flex-row">
                        <div class="form-check form-switch">
                            <!-- <input class="form-check-input" type="checkbox" id="toggleCoordinateBtn"> -->
                            <input class="form-check-input" type="checkbox" id="toggleCoordinateBtn">
                            <label class="form-check-label" for="toggleCoordinateBtn">座標取得</label>
                        </div>
                        <div class="form-check form-switch ms-5">
                            <input class="form-check-input" type="checkbox" id="replayBtn">
                            <label class="form-check-label" for="replayBtn">リプレイ</label>
                        </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">クリック座標データ</h5>
                        <div id="coordinate-data">
                            <!-- ここに座標データが動的に追加 -->
                        </div>
                    </div>
                </div>

                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">その他の操作</h5>
                        <button id="exportDataBtn" class="btn btn-secondary mb-2">データをエクスポート</button>
                        <button id="toggleHeatmapBtn" class="btn btn-secondary mb-2">ヒートマップ表示/非表示</button>
                        <!-- <div id="reset-container">
                            <span>クリック回数: <span id="clickCount">0</span></span>
                            <button id="resetBtn" class="btn btn-secondary">リセット</button>
                        </div> -->
                        <a href="./coordinate/php/display_click_coordinates.php" class="btn btn-link mb-2">テーブル閲覧</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- モーダル -->
    <div class="modal fade" id="commentModal" tabindex="-1" aria-labelledby="commentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">コメント入力</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <textarea id="commentInput" class="form-control" placeholder="ここにコメント入力"></textarea>
                </div>
                <div class="modal-footer">
                    <button id="commentSubmit" class="btn btn-primary">送信</button>
                    <button id="commentCancel" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="resetModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">リセット確認</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>本当にリセットしてもよろしいですか？</p>
                </div>
                <div class="modal-footer">
                    <button id="resetConfirm" class="btn btn-danger">OK</button>
                    <button id="resetCancel" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="confirmUpdateModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">更新確認</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>コメントは入力されています。更新しますか？</p>
                </div>
                <div class="modal-footer">
                    <button id="confirmUpdateYes" class="btn btn-primary">はい</button>
                    <button id="confirmUpdateNo" class="btn btn-secondary" data-bs-dismiss="modal">いいえ</button>
                </div>
            </div>
        </div>
    </div>

    <div id="contextMenu" class="context-menu">
        <button id="recordScene" class="btn btn-sm btn-light">そのシーンを記録</button>
        <button id="recordComment" class="btn btn-sm btn-light">コメント付き座標の記録</button>
        <button id="recordFusen" class="btn btn-sm btn-light">付箋</button>
    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="./Bootstrap/js/bootstrap.bundle.min.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof bootstrap !== 'undefined') {
            window.commentModalBS = new bootstrap.Modal(document.getElementById('commentModal'), {
                backdrop: 'static',
                keyboard: false
            });
            window.confirmUpdateModalBS = new bootstrap.Modal(document.getElementById('confirmUpdateModal'), {
                backdrop: 'static',
                keyboard: false
            });
        }
    });
    </script>
</body>
</html>
