// =======================================
// グローバル変数の定義
// =======================================
let ctx;
let player;
let isPlaying = false;
let isCoordinateEnabled = false;
let clickCount = 0;
let userId = null;
let videoId = null;
let rightClickX = null;
let rightClickY = null;
let isRightClickComment = false;
let pendingCircle = null;
let isCircleVisible = false;
let isReplayEnabled = false;
let replayTimeouts = [];
let currentClicks = [];
let isReplayPaused = false;
let heatmapCanvas;
let isHeatmapVisible = false;
let replaySpeed = 1;
let pausedFadeIntervals = [];
let replayStartTime = 0;
let replayPauseTime = 0;
let activeFadeIntervals = [];
let commentModalBS, confirmUpdateModalBS;

// =======================================
// 初期化関数
// =======================================

/**
 * YouTube IFrame API の初期化
 */
function onYouTubeIframeAPIReady() {
    videoId = document.getElementById('player').getAttribute('data-video-id');
    fetch('./coordinate/php/get_user_id.php')
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                userId = data.user_id;
                initializePlayer(videoId);
            } else {
                console.error('User ID not found');
                alert('ユーザーIDが見つかりません。再度ログインしてください。');
            }
        })
        .catch(error => {
            console.error('Error fetching user ID:', error);
            alert('ユーザーID取得中にエラーが発生しました。');
        });
}

/**
 * プレイヤーの初期化
 * @param {string} videoId - YouTube動画ID
 */
function initializePlayer(videoId) {
    if (player) {
        player.loadVideoById(videoId);
    } else {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId,
            playerVars: {
                'controls': 0,
                'disablekb': 1,
                'modestbranding': 1,
                'rel': 0,
                'showinfo': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}
function onPlayerReady(event) {
    console.log('Player is ready');
    initializeControls();
}

/*
function initializeControls() {
    initializeCanvas();
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const muteBtn = document.getElementById('muteBtn');
    const seekBar = document.getElementById('seekBar');
    const volumeBar = document.getElementById('volumeBar');
    const rewindBtn = document.getElementById('rewindBtn');
    const skipBtn = document.getElementById('skipBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    const canvas = document.getElementById('myCanvas');
    canvas.addEventListener('click', (event) => {
        if (isCoordinateEnabled) {
            handleCanvasClick(event, userId, videoId);
        }
    });
    const clickCountDisplay = document.getElementById('clickCount');
    const resetBtn = document.getElementById('resetBtn');
    const commentBtn = document.getElementById('commentBtn');
    const commentModal = document.getElementById('commentModal');
    const commentSubmit = document.getElementById('commentSubmit');
    const commentCancel = document.getElementById('commentCancel');
    const commentInput = document.getElementById('commentInput');
    const contextMenu = document.getElementById('contextMenu');
    const recordScene = document.getElementById('recordScene');
    const recordComment = document.getElementById('recordComment');
    const recordFusen = document.getElementById('recordFusen');
    const confirmUpdateModal = document.getElementById('confirmUpdateModal');
    const confirmUpdateYes = document.getElementById('confirmUpdateYes');
    const confirmUpdateNo = document.getElementById('confirmUpdateNo');
    const mistakeBtn = document.getElementById('mistakeBtn'); 
    let isUpdatingComment = false;    
    // トグルボタンの初期化と状態管理
    const toggleCoordinateBtn = document.getElementById('toggleCoordinateBtn');
    const toggleCoordinateText = toggleCoordinateBtn.parentElement.previousElementSibling;
    const replayBtn = document.getElementById('replayBtn');
    const replayText = replayBtn.parentElement.previousElementSibling;
    const toggleCoordinateLabel = toggleCoordinateBtn.nextElementSibling;
    const replayLabel = replayBtn.nextElementSibling;

    let isCoordinateEnabled = false;
    let isReplayEnabled = false;
    let isReplayPaused = true;
    
    toggleCoordinateBtn.addEventListener('change', () => {
        if (toggleCoordinateBtn.checked) {
            if (isReplayEnabled) {
                // リプレイがオンの場合、座標取得をオンにできない
                toggleCoordinateBtn.checked = false;
                alert('リプレイモードをオフにしてから座標取得モードをオンにしてください。');
                return;
            }
            isCoordinateEnabled = true;
            player.pauseVideo();
            enableCoordinateCapture();
        } else {
            isCoordinateEnabled = false;
            player.pauseVideo();
            disableCoordinateCapture();
        }
        updateButtonStates();
    });
    
    replayBtn.addEventListener('change', () => {
        if (replayBtn.checked) {
            if (isCoordinateEnabled) {
                // 座標取得がオンの場合、リプレイをオンにできない
                replayBtn.checked = false;
                alert('座標取得モードをオフにしてからリプレイモードをオンにしてください。');
                return;
            }
            isReplayEnabled = true;
            player.pauseVideo();
            player.seekTo(0);  // 動画を最初に戻す
            fetchReplayData(videoId).then(clicks => {
                if (clicks && clicks.length > 0) {
                    prepareReplay(clicks);
                } else {
                    console.error('No replay data available');
                    alert('リプレイデータがありません。');
                    isReplayEnabled = false;
                    replayBtn.checked = false;
                    updateButtonStates();
                }
            });
        } else {
            isReplayEnabled = false;
            player.pauseVideo();
            clearCanvas();
        }
        updateButtonStates();
    });

    function updateButtonStates() {
        toggleCoordinateBtn.disabled = isReplayEnabled;
        replayBtn.disabled = isCoordinateEnabled;
        
        toggleCoordinateBtn.parentElement.classList.toggle('disabled', isReplayEnabled);
        replayBtn.parentElement.classList.toggle('disabled', isCoordinateEnabled);
        
        toggleCoordinateLabel.textContent = isCoordinateEnabled ? "座標取得：オン" : "座標取得：オフ";
        replayLabel.textContent = isReplayEnabled ? "リプレイ：オン" : "リプレイ：オフ";
    }
    
    
    function enableCoordinateCapture() {
        canvas.addEventListener('click', handleCanvasClick);
        canvas.style.cursor = 'crosshair';
    }
    
    function disableCoordinateCapture() {
        canvas.removeEventListener('click', handleCanvasClick);
        canvas.style.cursor = 'default';
    }
    
    function prepareReplay(clicks) {
        clearCanvas();
        currentClicks = clicks;
        console.log('Replay prepared with', clicks.length, 'clicks');
    }

    function ensurePlayer(action) {
        if (player && typeof player[action] === 'function') {
            return true;
        }
        console.error(`Player not initialized or ${action} not available`);
        return false;
    }

    // 再生ボタンのイベントリスナー
    playBtn.addEventListener('click', () => {
        if (ensurePlayer('playVideo')) {
            player.playVideo();
            isPlaying = true;
            window.postMessage('play', '*');
            if (isReplayEnabled && isReplayPaused) {
                resumeReplay();
            }
        }
    });

    function resumeReplay() {
        isReplayPaused = false;
        const currentTime = player.getCurrentTime();
        replayClicks(currentClicks, currentTime);
    }
    // 初期状態の設定
    toggleCoordinateBtn.checked = false;
    replayBtn.checked = false;
    updateButtonStates();

    pauseBtn.addEventListener('click', () => {
        if (ensurePlayer('pauseVideo')) {
            player.pauseVideo();
            isPlaying = false;
            window.postMessage('pause', '*');
            if (isReplayEnabled && !isReplayPaused) {
                pauseReplay();
            }
        }
    });

    stopBtn.addEventListener('click', () => {
        player.stopVideo();
        isPlaying = false;
        window.postMessage('stop', '*');
        if (isReplayEnabled) {
            clearCanvas();
            replayClicks(currentClicks, 0);
        }
    });

    muteBtn.addEventListener('click', () => {
        if (player.isMuted()) {
            player.unMute();
            muteBtn.textContent = '🔇';
            muteBtn.setAttribute('data-pressed', 'false');
        } else {
            player.mute();
            muteBtn.textContent = '🔊';
            muteBtn.setAttribute('data-pressed', 'true');
        }
    });

    rewindBtn.addEventListener('click', () => {
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(currentTime - 10, 0), true);
        if (isReplayEnabled) {
            const newTime = Math.max(currentTime - 10, 0);
            clearCanvas();
            replayClicks(currentClicks, newTime);
        }
    });

    skipBtn.addEventListener('click', () => {
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.min(currentTime + 10, player.getDuration()), true);
    });

    seekBar.addEventListener('input', () => {
        const time = player.getDuration() * (seekBar.value / 100);
        player.seekTo(time, true);
        updateDisplayTime();
    });

    volumeBar.addEventListener('input', () => {
        player.setVolume(volumeBar.value * 100);
    });

    resetBtn.addEventListener('click', () => {
        player.pauseVideo();
        resetModal.style.display = 'block';
    });

    resetConfirm.addEventListener('click', () => {
        resetClickData(userId, videoId);
        player.seekTo(0);
        player.stopVideo();
        isPlaying = false;
        resetModal.style.display = 'none'; // モーダルを閉じる
    });

    resetCancel.addEventListener('click', () => {
        player.playVideo();
        resetModal.style.display = 'none'; // モーダルを閉じる
    });
      
    commentModalBS = new bootstrap.Modal(document.getElementById('commentModal'));
    confirmUpdateModalBS = new bootstrap.Modal(document.getElementById('confirmUpdateModal'));

    function showCommentModal() {
        setTimeout(() => {
            commentModalBS.show();
        }, 300); // 300ミリ秒の遅延を追加
    }

    // コメントボタンのイベントリスナー
    commentBtn.addEventListener('click', () => {
        player.pauseVideo();
        isRightClickComment = false;
        checkLatestComment().then(hasComment => {
            if (hasComment) {
                confirmUpdateModalBS.show();
            } else {
                showCommentModal();
            }
        });
    });

    confirmUpdateYes.addEventListener('click', () => {
        isUpdatingComment = true;
        confirmUpdateModalBS.hide();
        showCommentModal();
    });

    confirmUpdateNo.addEventListener('click', () => {
        confirmUpdateModalBS.hide();
        player.playVideo();
    });

    commentCancel.addEventListener('click', () => {
        commentModalBS.hide();
        player.playVideo();
        commentInput.value = '';
    });

    commentSubmit.addEventListener('click', () => {
        const comment = commentInput.value;
        if (isRightClickComment) {
            handleRightClickComment(comment);
        } else {
            saveComment(comment, isUpdatingComment);
        }
        commentModalBS.hide();
        player.playVideo();
        commentInput.value = '';
        isUpdatingComment = false;
        isRightClickComment = false;
    });

    function showModal(modal) {
        if (modal && typeof modal.show === 'function') {
            modal.show();
            document.body.classList.add('modal-open');
        } else {
            console.error('Invalid modal object:', modal);
        }
    }

    function hideModal(modal) {
        if (modal && typeof modal.hide === 'function') {
            modal.hide();
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.parentNode.removeChild(backdrop);
            }
        } else {
            console.error('Invalid modal object:', modal);
        }
    }

    recordScene.addEventListener('click', () => {
        handleSceneClick(userId, videoId);
        contextMenu.style.display = 'none';
        player.playVideo(); // 動画を再生
    });
    
    recordComment.addEventListener('click', () => {
        player.pauseVideo();
        commentModal.style.display = 'block';
        contextMenu.style.display = 'none';
        isRightClickComment = true;
        logRightClickCoordinates(); // デバッグ用
    });

    recordFusen.addEventListener('click', () => {
        handleFusenClick(userId, videoId, rightClickX, rightClickY);
        contextMenu.style.display = 'none';
        player.playVideo(); // 動画を再生
    });

    window.addEventListener('click', (event) => {
        if (event.target === resetModal) {
            resetModal.style.display = 'none';
            player.playVideo();
        } else if (event.target !== contextMenu) {
            contextMenu.style.display = 'none';
        }
    });

    if (!canvas.hasEventListener) {
        canvas.addEventListener('click', (event) => {
            if (isCoordinateEnabled) {
                handleCanvasClick(event, userId, videoId);
                clickCount++;
                clickCountDisplay.textContent = clickCount;
    
                canvas.classList.add('border-flash');
                setTimeout(() => {
                    canvas.classList.remove('border-flash');
                }, 500);
            }
        });
    
        // 右クリックでコンテキストメニューを表示
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (isCoordinateEnabled) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;
                
                // 保存する座標はキャンバスの実際のサイズに対する比率で保存
                rightClickX = x / canvas.width;
                rightClickY = y / canvas.height;
                
                contextMenu.style.top = `${event.clientY}px`;
                contextMenu.style.left = `${event.clientX}px`;
                contextMenu.style.display = 'block';
                player.pauseVideo();
            }
        });
    
        canvas.hasEventListener = true;
    }

    function updateDisplayTime() {
        const currentTime = formatTime(player.getCurrentTime());
        const duration = formatTime(player.getDuration());
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    }
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    function clearCanvas() {
        const canvas = document.getElementById('myCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setInterval(updateDisplayTime, 1000);
}
*/

/**
 * コントロールの初期化
 */
function initializeControls() {
    initializeCanvas();
    // 各種ボタンと要素の取得
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const muteBtn = document.getElementById('muteBtn');
    const seekBar = document.getElementById('seekBar');
    const volumeBar = document.getElementById('volumeBar');
    const rewindBtn = document.getElementById('rewindBtn');
    const skipBtn = document.getElementById('skipBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    const canvas = document.getElementById('myCanvas');
    const clickCountDisplay = document.getElementById('clickCount');
    const resetBtn = document.getElementById('resetBtn');
    const commentBtn = document.getElementById('commentBtn');
    const commentModal = document.getElementById('commentModal');
    const commentSubmit = document.getElementById('commentSubmit');
    const commentCancel = document.getElementById('commentCancel');
    const commentInput = document.getElementById('commentInput');
    const contextMenu = document.getElementById('contextMenu');
    const recordScene = document.getElementById('recordScene');
    const recordComment = document.getElementById('recordComment');
    const recordFusen = document.getElementById('recordFusen');
    const confirmUpdateModal = document.getElementById('confirmUpdateModal');
    const confirmUpdateYes = document.getElementById('confirmUpdateYes');
    const confirmUpdateNo = document.getElementById('confirmUpdateNo');
    const mistakeBtn = document.getElementById('mistakeBtn');
    const toggleCoordinateBtn = document.getElementById('toggleCoordinateBtn');
    const replayBtn = document.getElementById('replayBtn');
    
    let isUpdatingComment = false;

    // イベントリスナーの設定
    playBtn.addEventListener('click', handlePlayClick);
    pauseBtn.addEventListener('click', handlePauseClick);
    stopBtn.addEventListener('click', handleStopClick);
    muteBtn.addEventListener('click', handleMuteClick);
    seekBar.addEventListener('input', handleSeekBarInput);
    volumeBar.addEventListener('input', handleVolumeBarInput);
    rewindBtn.addEventListener('click', handleRewindClick);
    skipBtn.addEventListener('click', handleSkipClick);
    resetBtn.addEventListener('click', handleResetClick);
    commentBtn.addEventListener('click', handleCommentClick);
    confirmUpdateYes.addEventListener('click', handleConfirmUpdateYes);
    confirmUpdateNo.addEventListener('click', handleConfirmUpdateNo);
    commentCancel.addEventListener('click', handleCommentCancel);
    commentSubmit.addEventListener('click', handleCommentSubmit);
    recordScene.addEventListener('click', handleRecordSceneClick);
    recordComment.addEventListener('click', handleRecordCommentClick);
    recordFusen.addEventListener('click', handleRecordFusenClick);
    toggleCoordinateBtn.addEventListener('change', handleToggleCoordinateChange);
    replayBtn.addEventListener('change', handleReplayChange);

    // キャンバスのイベントリスナー設定
    setupCanvasEventListeners(canvas);

    // 定期的な時間表示の更新
    setInterval(updateDisplayTime, 1000);

    // 初期状態の設定
    updateButtonStates();
}

// =======================================
// イベントハンドラ
// =======================================

function handlePlayClick() {
    if (ensurePlayer('playVideo')) {
        player.playVideo();
        isPlaying = true;
        window.postMessage('play', '*');
        if (isReplayEnabled && isReplayPaused) {
            resumeReplay();
        }
    }
}

function handlePauseClick() {
    if (ensurePlayer('pauseVideo')) {
        player.pauseVideo();
        isPlaying = false;
        window.postMessage('pause', '*');
        if (isReplayEnabled && !isReplayPaused) {
            pauseReplay();
        }
    }
}

function handleStopClick() {
    player.stopVideo();
    isPlaying = false;
    window.postMessage('stop', '*');
    if (isReplayEnabled) {
        clearCanvas();
        replayClicks(currentClicks, 0);
    }
}

function handleMuteClick() {
    if (player.isMuted()) {
        player.unMute();
        muteBtn.textContent = '🔇';
        muteBtn.setAttribute('data-pressed', 'false');
    } else {
        player.mute();
        muteBtn.textContent = '🔊';
        muteBtn.setAttribute('data-pressed', 'true');
    }
}

function handleSeekBarInput() {
    const time = player.getDuration() * (seekBar.value / 100);
    player.seekTo(time, true);
    updateDisplayTime();
}

function handleVolumeBarInput() {
    player.setVolume(volumeBar.value * 100);
}

function handleRewindClick() {
    const currentTime = player.getCurrentTime();
    player.seekTo(Math.max(currentTime - 10, 0), true);
    if (isReplayEnabled) {
        const newTime = Math.max(currentTime - 10, 0);
        clearCanvas();
        replayClicks(currentClicks, newTime);
    }
}

function handleSkipClick() {
    const currentTime = player.getCurrentTime();
    player.seekTo(Math.min(currentTime + 10, player.getDuration()), true);
}

function handleResetClick() {
    player.pauseVideo();
    resetModal.style.display = 'block';
}

function handleCommentClick() {
    player.pauseVideo();
    isRightClickComment = false;
    checkLatestComment().then(hasComment => {
        if (hasComment) {
            confirmUpdateModalBS.show();
        } else {
            showCommentModal();
        }
    });
}

function handleConfirmUpdateYes() {
    isUpdatingComment = true;
    confirmUpdateModalBS.hide();
    showCommentModal();
}

function handleConfirmUpdateNo() {
    confirmUpdateModalBS.hide();
    player.playVideo();
}

function handleCommentCancel() {
    commentModalBS.hide();
    player.playVideo();
    commentInput.value = '';
}

function handleCommentSubmit() {
    const comment = commentInput.value;
    if (isRightClickComment) {
        handleRightClickComment(comment);
    } else {
        saveComment(comment, isUpdatingComment);
    }
    commentModalBS.hide();
    player.playVideo();
    commentInput.value = '';
    isUpdatingComment = false;
    isRightClickComment = false;
}

function handleRecordSceneClick() {
    handleSceneClick(userId, videoId);
    contextMenu.style.display = 'none';
    player.playVideo();
}

function handleRecordCommentClick() {
    player.pauseVideo();
    commentModal.style.display = 'block';
    contextMenu.style.display = 'none';
    isRightClickComment = true;
    logRightClickCoordinates();
}

function handleRecordFusenClick() {
    handleFusenClick(userId, videoId, rightClickX, rightClickY);
    contextMenu.style.display = 'none';
    player.playVideo();
}

function handleToggleCoordinateChange() {
    if (toggleCoordinateBtn.checked) {
        if (isReplayEnabled) {
            toggleCoordinateBtn.checked = false;
            alert('リプレイモードをオフにしてから座標取得モードをオンにしてください。');
            return;
        }
        isCoordinateEnabled = true;
        player.pauseVideo();
        enableCoordinateCapture();
    } else {
        isCoordinateEnabled = false;
        player.pauseVideo();
        disableCoordinateCapture();
    }
    updateButtonStates();
}

function handleReplayChange() {
    if (replayBtn.checked) {
        if (isCoordinateEnabled) {
            replayBtn.checked = false;
            alert('座標取得モードをオフにしてからリプレイモードをオンにしてください。');
            return;
        }
        isReplayEnabled = true;
        player.pauseVideo();
        player.seekTo(0);
        fetchReplayData(videoId).then(clicks => {
            if (clicks && clicks.length > 0) {
                prepareReplay(clicks);
            } else {
                console.error('No replay data available');
                alert('リプレイデータがありません。');
                isReplayEnabled = false;
                replayBtn.checked = false;
                updateButtonStates();
            }
        });
    } else {
        isReplayEnabled = false;
        player.pauseVideo();
        clearCanvas();
    }
    updateButtonStates();
}

// ページロード時にクリック座標データを取得して表示
window.addEventListener('load', fetchClickCoordinates);

// ページロード時にクリック座標データを取得してメイン画面に表示
window.addEventListener('load', () => {
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayClickCoordinates(data.data);
            } else {
                console.error('Error fetching click coordinates:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching click coordinates:', error);
        });
});

/**
 * キャンバスの初期化
 * @returns {CanvasRenderingContext2D} キャンバスのコンテキスト
 */
function initializeCanvas() {
    const canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    return ctx;
}

// =======================================
// プレイヤー関連の関数
// =======================================

function onPlayerReady(event) {
    console.log('Player is ready');
    initializeControls();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        if (isReplayEnabled && isReplayPaused) {
            resumeReplay();
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        if (isReplayEnabled) {
            pauseReplay();
        }
    } else {
        isPlaying = false;
    }
}

function ensurePlayer(action) {
    if (player && typeof player[action] === 'function') {
        return true;
    }
    console.error(`Player not initialized or ${action} not available`);
    return false;
}

// =======================================
// 座標取得機能
// =======================================

function handleCanvasClick(event) {
    if (!isCoordinateEnabled) return;

    const canvas = document.getElementById('myCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX / canvas.width;
    const y = (event.clientY - rect.top) * scaleY / canvas.height;
    const clickTime = player.getCurrentTime();

    saveCoordinate(x, y, clickTime);
    visualizeClick(x, y);

    clickCount++;
    clickCountDisplay.textContent = clickCount;

    canvas.classList.add('border-flash');
    setTimeout(() => {
        canvas.classList.remove('border-flash');
    }, 500);
}

function saveCoordinate(x, y, clickTime) {
    fetch('./coordinate/php/save_coordinates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            x: x,
            y: y,
            click_time: clickTime,
            video_id: videoId
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Coordinates saved successfully');
            updateClickCount(userId, videoId);
            updateCoordinateTable();
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function visualizeClick(x, y) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x * canvas.width, y * canvas.height, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function enableCoordinateCapture() {
    const canvas = document.getElementById('myCanvas');
    canvas.addEventListener('click', handleCanvasClick);
    canvas.style.cursor = 'crosshair';
}

function disableCoordinateCapture() {
    const canvas = document.getElementById('myCanvas');
    canvas.removeEventListener('click', handleCanvasClick);
    canvas.style.cursor = 'default';
}

// =======================================
// リプレイ機能
// =======================================

/**
 * リプレイを開始する
 * @param {Array} clicks - リプレイするクリックデータの配列
 */
function startReplay(clicks) {
    clearCanvas();
    player.seekTo(0);
    player.playVideo();
    replayClickData(clicks);
}

/**
 * クリックデータをリプレイする
 * @param {Array} clicks - リプレイするクリックデータの配列
 */
function replayClickData(clicks) {
    clearCanvas();
    player.playVideo();

    clicks.forEach((click, index) => {
        setTimeout(() => {
            if (!isReplayPaused) {
                drawCircleWithNumberAndFade(ctx, click.x, click.y, index + 1, click);
            }
        }, click.click_time * 1000);
    });
}

/**
 * クリックイベントを再生する関数
 * @param {Array} clicks - 再生するクリックデータの配列
 * @param {number} startTime - 再生開始時間（秒）
 * @param {number} endTime - 再生終了時間（秒）
 */
function replayClicks(clicks, startTime = 0, endTime = Infinity) {
    player.setPlaybackRate(replaySpeed);
    clearCanvas();
    clearReplayIntervals();

    player.seekTo(startTime);
    player.playVideo();
    replayStartTime = Date.now();
    isReplayPaused = false;

    const filteredClicks = clicks.filter(click => 
        click.click_time >= startTime && click.click_time <= endTime
    );

    currentClicks = filteredClicks;
    
    filteredClicks.forEach((click, index) => {
        const timeout = setTimeout(() => {
            if (!isReplayPaused) {
                drawCircleWithNumberAndFade(ctx, click.x, click.y, click.id, click);
            }
        }, (click.click_time - startTime) * 1000 / replaySpeed);
        replayTimeouts.push(timeout);
    });
}

/**
 * リプレイの間隔をクリアする
 */
function clearReplayIntervals() {
    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];
    activeFadeIntervals.forEach(clearInterval);
    activeFadeIntervals = [];
}

/**
 * 円と番号を描画し、フェードアウトさせる関数
 * @param {CanvasRenderingContext2D} ctx - キャンバスのコンテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} id - クリックのID
 * @param {Object} click - クリックデータオブジェクト
 */
function drawCircleWithNumberAndFade(ctx, x, y, id, click) {
    if (!click) {
        console.error('Invalid click data:', click);
        return;
    }

    const canvas = ctx.canvas;
    const radius = 10;
    const drawX = x * canvas.width;
    const drawY = y * canvas.height;

    function draw(alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id.toString(), drawX, drawY);
        ctx.restore();
    }

    draw(1.0);

    const infoElement = createInfoElement(drawX, drawY, id, click);
    const hitArea = createHitArea(drawX, drawY, radius);

    setupMouseEvents(hitArea, infoElement);

    const fadeInterval = setupFadeOut(draw, drawX, drawY, radius, infoElement, hitArea);
    activeFadeIntervals.push(fadeInterval);
}

/**
 * 情報要素を作成する
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} id - クリックのID
 * @param {Object} click - クリックデータオブジェクト
 * @returns {HTMLElement} 作成された情報要素
 */
function createInfoElement(x, y, id, click) {
    const infoElement = document.createElement('div');
    infoElement.className = 'click-info';
    infoElement.style.position = 'absolute';
    infoElement.style.left = `${x + 15}px`;
    infoElement.style.top = `${y + 15}px`;
    infoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoElement.style.color = 'white';
    infoElement.style.padding = '5px';
    infoElement.style.borderRadius = '3px';
    infoElement.style.display = 'none';
    infoElement.style.zIndex = '1000';
    const commentText = click.comment ? click.comment : 'なし';
    infoElement.innerHTML = `
        ID: ${id}<br>
        時間: ${click.click_time.toFixed(2)}秒<br>
        コメント: ${commentText}
    `;
    document.getElementById('video-container').appendChild(infoElement);
    return infoElement;
}

/**
 * ヒットエリアを作成する
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} radius - 半径
 * @returns {HTMLElement} 作成されたヒットエリア要素
 */
function createHitArea(x, y, radius) {
    const hitArea = document.createElement('div');
    hitArea.style.position = 'absolute';
    hitArea.style.left = `${x - radius}px`;
    hitArea.style.top = `${y - radius}px`;
    hitArea.style.width = `${radius * 2}px`;
    hitArea.style.height = `${radius * 2}px`;
    hitArea.style.cursor = 'pointer';
    hitArea.style.zIndex = '999';
    document.getElementById('video-container').appendChild(hitArea);
    return hitArea;
}

/**
 * マウスイベントを設定する
 * @param {HTMLElement} hitArea - ヒットエリア要素
 * @param {HTMLElement} infoElement - 情報要素
 */
function setupMouseEvents(hitArea, infoElement) {
    hitArea.addEventListener('mouseover', () => {
        infoElement.style.display = 'block';
    });
    hitArea.addEventListener('mouseout', () => {
        infoElement.style.display = 'none';
    });
}

/**
 * フェードアウト処理を設定する
 * @param {Function} draw - 描画関数
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} radius - 半径
 * @param {HTMLElement} infoElement - 情報要素
 * @param {HTMLElement} hitArea - ヒットエリア要素
 * @returns {number} フェードアウト用のインターバルID
 */
function setupFadeOut(draw, x, y, radius, infoElement, hitArea) {
    let alpha = 1.0;
    let startTime = Date.now();
    return setInterval(() => {
        if (!isReplayPaused) {
            const elapsed = (Date.now() - startTime) / 1000;
            alpha = Math.max(0, 1 - (elapsed / 2)); // 2秒でフェードアウト

            if (alpha <= 0) {
                clearInterval(this);
                ctx.clearRect(x - radius - 1, y - radius - 1, (radius + 1) * 2, (radius + 1) * 2);
                document.getElementById('video-container').removeChild(infoElement);
                document.getElementById('video-container').removeChild(hitArea);
                const index = activeFadeIntervals.indexOf(this);
                if (index > -1) {
                    activeFadeIntervals.splice(index, 1);
                }
            } else {
                draw(alpha);
            }
        }
    }, 20);
}

/**
 * リプレイを一時停止する
 */
function pauseReplay() {
    isReplayPaused = true;
    replayPauseTime = Date.now();
    player.pauseVideo();
    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];
    activeFadeIntervals.forEach(interval => {
        clearInterval(interval);
        pausedFadeIntervals.push(interval);
    });
    activeFadeIntervals = [];
}

/**
 * リプレイを再開する
 */
function resumeReplay() {
    if (!isReplayPaused) return;

    isReplayPaused = false;
    const pauseDuration = (Date.now() - replayPauseTime) / 1000;
    replayStartTime += pauseDuration * 1000;
    player.playVideo();

    const currentTime = player.getCurrentTime();
    const remainingClicks = currentClicks.filter(click => parseFloat(click.click_time) > currentTime);
    
    replayClicks(remainingClicks, currentTime);

    pausedFadeIntervals.forEach(interval => {
        activeFadeIntervals.push(interval);
    });
    pausedFadeIntervals = [];
}

/**
 * リプレイデータを取得する
 * @param {string} videoId - ビデオID
 * @returns {Promise<Array>} クリックデータの配列を含むPromise
 */
function fetchReplayData(videoId) {
    return getUserId().then(userId => {
        console.log('Fetching replay data for video:', videoId, 'and user:', userId);
        return fetch('./coordinate/php/get_click_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId, user_id: userId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Raw replay data:', data); // デバッグ用
            if (data.status === 'success') {
                if (data.clicks.length === 0) {
                    console.log('No clicks found for this video and user');
                    return [];
                }
                return data.clicks.map(click => {
                    if (!click.x || !click.y || !click.click_time || !click.id) {
                        console.error('Invalid click data:', click);
                        return null;
                    }
                    return {
                        ...click,
                        x: parseFloat(click.x),
                        y: parseFloat(click.y),
                        click_time: parseFloat(click.click_time),
                        comment: click.comment
                    };
                }).filter(click => click !== null);
            } else {
                throw new Error(data.message);
            }
        });
    }).catch(error => {
        console.error('Error fetching replay data:', error);
        alert('リプレイデータの取得中にエラーが発生しました。エラー: ' + error.message);
        return null;
    });
}

/**
 * リプレイ速度を設定する
 * @param {number} speed - 再生速度
 */
function setReplaySpeed(speed) {
    replaySpeed = speed;
    player.setPlaybackRate(speed);
}

/**
 * クリックデータをリプレイする
 * @param {Array} clicks - リプレイするクリックデータの配列
 */
function replayClickData(clicks) {
    clearCanvas();
    player.playVideo();

    clicks.forEach((click, index) => {
        setTimeout(() => {
            if (!isReplayPaused) {
                drawCircleWithNumberAndFade(ctx, click.x, click.y, index + 1, click);
            }
        }, click.click_time * 1000);
    });
}

// =======================================
// ヒートマップ機能
// =======================================

/**
 * ヒートマップを初期化する
 */
function initHeatmap() {
    heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = 640;
    heatmapCanvas.height = 360;
    heatmapCanvas.style.position = 'absolute';
    heatmapCanvas.style.top = '0';
    heatmapCanvas.style.left = '0';
    heatmapCanvas.style.pointerEvents = 'none';
    heatmapCanvas.style.display = 'none';
    document.getElementById('video-container').appendChild(heatmapCanvas);
    console.log('Heatmap canvas created:', heatmapCanvas);
}

/**
 * ヒートマップの表示/非表示を切り替える
 */
function toggleHeatmap() {
    isHeatmapVisible = !isHeatmapVisible;
    heatmapCanvas.style.display = isHeatmapVisible ? 'block' : 'none';
    console.log('Heatmap visibility:', isHeatmapVisible);
    if (isHeatmapVisible) {
        console.log('Drawing heatmap');
        drawHeatmap();
    } else {
        console.log('Hiding heatmap');
    }
}

/**
 * ヒートマップを描画する
 */
function drawHeatmap() {
    console.log('drawHeatmap called');
    const ctx = heatmapCanvas.getContext('2d');
    ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched heatmap data:', data);
            if (data.status === 'success' && data.data.length > 0) {
                const heatmapData = createHeatmapData(data.data);
                console.log('Created heatmap data:', heatmapData);
                drawHeatmapPoints(ctx, heatmapData);
            } else {
                console.log('No data available for heatmap');
            }
        })
        .catch(error => {
            console.error('Error fetching data for heatmap:', error);
        });
}

/**
 * ヒートマップのポイントを描画する
 * @param {CanvasRenderingContext2D} ctx - キャンバスのコンテキスト
 * @param {Array} data - ヒートマップデータの配列
 */
function drawHeatmapPoints(ctx, data) {
    console.log('Drawing heatmap points:', data);
    data.forEach(point => {
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(point.x, point.y, 30, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    });
}

/**
 * クリックデータからヒートマップデータを作成する
 * @param {Array} clicks - クリックデータの配列
 * @returns {Array} ヒートマップデータの配列
 */
function createHeatmapData(clicks) {
    return clicks.map(click => ({
        x: parseFloat(click.x_coordinate) * heatmapCanvas.width,
        y: parseFloat(click.y_coordinate) * heatmapCanvas.height,
        value: 1
    }));
}

// =======================================
// データエクスポート機能
// =======================================

/**
 * クリックデータをCSVファイルとしてエクスポートする
 */
function exportData() {
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const BOM = "\uFEFF";
                const csvContent = BOM + "ID,X,Y,Time,Comment\n"
                    + data.data.map(e => `${e.id},${e.x_coordinate},${e.y_coordinate},${e.click_time},"${e.comment}"`).join("\n");

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "click_data.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                console.error('Error fetching click coordinates:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// =======================================
// ユーティリティ関数
// =======================================

/**
 * ユーザーIDを取得する
 * @returns {Promise<string>} ユーザーIDを含むPromise
 */
function getUserId() {
    return new Promise((resolve, reject) => {
        fetch('./coordinate/php/get_user_id.php')
            .then(response => response.json())
            .then(data => {
                if (data.user_id) {
                    resolve(data.user_id);
                } else {
                    reject('User ID not found');
                }
            })
            .catch(error => {
                reject('Error fetching user ID:', error);
            });
    });
}

// =======================================
// その他のユーティリティ関数
// =======================================

/**
 * キャンバスをクリアする
 */
function clearCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * ボタンの状態を更新する
 */
function updateButtonStates() {
    toggleCoordinateBtn.disabled = isReplayEnabled;
    replayBtn.disabled = isCoordinateEnabled;
    
    toggleCoordinateBtn.parentElement.classList.toggle('disabled', isReplayEnabled);
    replayBtn.parentElement.classList.toggle('disabled', isCoordinateEnabled);
    
    toggleCoordinateBtn.nextElementSibling.textContent = isCoordinateEnabled ? "座標取得：オン" : "座標取得：オフ";
    replayBtn.nextElementSibling.textContent = isReplayEnabled ? "リプレイ：オン" : "リプレイ：オフ";
}

/**
 * 時間を表示用にフォーマットする
 * @param {number} seconds - 秒数
 * @returns {string} フォーマットされた時間文字列
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * 表示時間を更新する
 */
function updateDisplayTime() {
    const currentTime = formatTime(player.getCurrentTime());
    const duration = formatTime(player.getDuration());
    timeDisplay.textContent = `${currentTime} / ${duration}`;
}

/**
 * クリック座標データを取得して表示する
 */
function fetchClickCoordinates() {
    console.log('Fetching click coordinates...');
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            console.log('Data fetched:', data);
            if (data.status === 'success') {
                displayClickCoordinates(data.data);
            } else {
                console.error('Error fetching click coordinates:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching click coordinates:', error);
        });
}

/**
 * クリック座標データを表示する
 * @param {Array} coordinates - 座標データの配列
 */
function displayClickCoordinates(coordinates) {
    const container = document.getElementById('coordinate-data');
    container.innerHTML = '';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headers = ['ID', 'X', 'Y', 'Time', 'Comment'];
    
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        header.style.border = '1px solid #ddd';
        header.style.padding = '5px';
        header.style.textAlign = 'center';
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    coordinates.forEach(coord => {
        const row = document.createElement('tr');
        const cellData = [
            coord.id,
            coord.x_coordinate,
            coord.y_coordinate,
            parseFloat(coord.click_time).toFixed(3),
            coord.comment
        ];
        cellData.forEach(text => {
            const cell = document.createElement('td');
            cell.textContent = text;
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '5px';
            row.appendChild(cell);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
}

/**
 * クリック座標テーブルを更新
 */
function updateCoordinateTable() {
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const container = document.getElementById('coordinate-data');
                container.innerHTML = ''; // 既存のコンテンツをクリア
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';

                // テーブルヘッダーの追加
                const headerRow = document.createElement('tr');
                ['ID', 'X', 'Y', 'Time', 'Comment'].forEach(headerText => {
                    const header = document.createElement('th');
                    header.textContent = headerText;
                    header.style.border = '1px solid #ddd';
                    header.style.padding = '5px';
                    header.style.textAlign = 'center';
                    headerRow.appendChild(header);
                });
                table.appendChild(headerRow);

                // クリック時間でデータをソート
                data.data.sort((a, b) => parseFloat(a.click_time) - parseFloat(b.click_time));

                // テーブル行の追加
                data.data.forEach(coord => {
                    const row = document.createElement('tr');
                    [coord.id, coord.x_coordinate, coord.y_coordinate, parseFloat(coord.click_time).toFixed(3), coord.comment].forEach(text => {
                        const cell = document.createElement('td');
                        cell.textContent = text;
                        cell.style.border = '1px solid #ddd';
                        cell.style.padding = '5px';
                        row.appendChild(cell);
                    });
                    table.appendChild(row);
                });

                container.appendChild(table);
            } else {
                console.error('Error fetching click coordinates:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * 赤い円を描画する
 * @param {number} x - X座標
 * @param {number} y - Y座標
 */
function drawRedCircle(x, y) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    ctx.beginPath();
    ctx.arc(scaledX, scaledY, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
}

/**
 * クリックデータをリセットする
 * @param {string} userId - ユーザーID
 * @param {string} videoId - ビデオID
 */
function resetClickData(userId, videoId) {
    fetch('./coordinate/php/reset_click_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, video_id: videoId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Click data reset successfully');
            clickCount = 0;
            document.getElementById('clickCount').textContent = clickCount;
            updateCoordinateTable(); // テーブルを更新
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * クリック数を更新する
 * @param {string} userId - ユーザーID
 * @param {string} videoId - ビデオID
 */
function updateClickCount(userId, videoId) {
    fetch('./coordinate/php/update_click_count.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, video_id: videoId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Click count updated successfully');
            clickCount = result.click_count;
            document.getElementById('clickCount').textContent = clickCount;
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * すべてのクリックを表示する
 * @param {Array} clicks - 表示するクリックデータの配列
 */
function displayClicks(clicks) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    clicks.forEach(click => {
        ctx.beginPath();
        ctx.arc(click.x * canvas.width, click.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    });
}

/**
 * 座標データを追加して表示する
 * @param {number} number - クリック番号
 * @param {number} time - クリック時間（秒）
 * @param {number} x - X座標
 * @param {number} y - Y座標
 */
function addCoordinateData(number, time, x, y) {
    const coordinateData = document.getElementById('coordinate-data');
    const item = document.createElement('div');
    item.className = 'coordinate-item';
    item.textContent = `${number}. ${time.toFixed(2)}秒 - (${x}, ${y})`;
    coordinateData.appendChild(item);

    // 自動スクロール
    coordinateData.scrollTop = coordinateData.scrollHeight;

}

/**
 * クリック情報のツールチップを表示する
 * @param {Event} event - マウスイベント
 * @param {Object} click - クリックデータオブジェクト
 */
function showClickInfo(event, click) {
    const tooltip = document.createElement('div');
    tooltip.className = 'click-tooltip';
    tooltip.innerHTML = `
        時間: ${click.click_time.toFixed(2)}秒<br>
        コメント: ${click.comment || 'なし'}
    `;
    document.body.appendChild(tooltip);

    const x = event.pageX + 10;
    const y = event.pageY + 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';

}

/**
 * クリック情報のツールチップを非表示にする
 */
function hideClickInfo() {
    const tooltip = document.querySelector('.click-tooltip');
    if (tooltip) {
        tooltip.remove();
    }

}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initHeatmap();
});

document.getElementById('toggleHeatmapBtn').addEventListener('click', toggleHeatmap);
document.getElementById('exportDataBtn').addEventListener('click', exportData);

// 速度コントロールの設定
document.getElementById('speedControl').addEventListener('input', function() {
    const speed = parseFloat(this.value);
    setReplaySpeed(speed);
    document.getElementById('speedValue').textContent = speed.toFixed(1) + 'x';
});

// リプレイ設定の適用
document.getElementById('applyReplaySettings').addEventListener('click', function() {
    const startTime = parseFloat(document.getElementById('startTime').value) || 0;
    const endTime = parseFloat(document.getElementById('endTime').value) || Infinity;
    fetchReplayData(videoId).then(clicks => {
        if (clicks && clicks.length > 0) {
            replayClicks(clicks, startTime, endTime);
        } else {
            console.error('No replay data available');
            alert('リプレイデータがありません。');
        }
    });
});

/**
 * 右クリックコメントを処理する
 * @param {string} comment - 入力されたコメント
 */
function handleRightClickComment(comment) {
    const clickTime = player.getCurrentTime();

    fetch('./coordinate/php/save_coordinates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            x: rightClickX,
            y: rightClickY,
            click_time: clickTime,
            video_id: videoId,
            comment: comment
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Right-click comment saved successfully');
            updateCoordinateTable();
            updateClickCount(userId, videoId);
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 右クリック座標をログに出力する
 */
function logRightClickCoordinates() {
    console.log(`Right-click coordinates: (${rightClickX}, ${rightClickY})`);
}

// =======================================
// ユーザーインタラクションとデータ保存
// =======================================

/**
 * シーンクリックを処理する
 * @param {string} userId - ユーザーID
 * @param {string} videoId - ビデオID
 */
function handleSceneClick(userId, videoId) {
    const clickTime = player.getCurrentTime();

    fetch('./coordinate/php/save_coordinates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            x: '-',
            y: '-',
            click_time: clickTime,
            video_id: videoId,
            comment: 'Scene recorded'
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Scene saved successfully');
            updateCoordinateTable(); // テーブルを更新
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 付箋クリックを処理する
 * @param {string} userId - ユーザーID
 * @param {string} videoId - ビデオID
 * @param {number} x - X座標
 * @param {number} y - Y座標
 */
function handleFusenClick(userId, videoId, x, y) {
    const clickTime = player.getCurrentTime();

    fetch('./coordinate/php/save_coordinates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            x: x,
            y: y,
            click_time: clickTime,
            video_id: videoId,
            comment: '付箋'
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            console.log('Fusen saved successfully');
            updateCoordinateTable(); // テーブルを更新
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * コメントを保存または更新する
 * @param {string} comment - 保存または更新するコメント
 * @param {boolean} isUpdating - 更新モードかどうか
 */
function saveComment(comment, isUpdating) {
    getUserId().then(userId => {
        fetch('./coordinate/php/get_latest_click.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, video_id: videoId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const clickData = {
                    user_id: userId,
                    video_id: videoId,
                    x: data.x,
                    y: data.y,
                    click_time: data.click_time,
                    comment: comment
                };
                if (isUpdating) {
                    // コメントの更新
                    updateExistingComment(clickData);
                } else {
                    // 新しいコメントの保存
                    saveNewComment(clickData, data.id);
                }
            } else {
                console.error('Failed to get latest click');
            }
        })
        .catch(error => console.error('Error fetching latest click:', error));
    })
    .catch(error => console.error('Error fetching user ID:', error));
}

/**
 * 既存のコメントを更新
 * @param {Object} clickData - 更新するクリックデータ
 */
function updateExistingComment(clickData) {
    fetch('./coordinate/php/update_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Updating comment successful');
            updateCoordinateTable();
        } else {
            console.error('Failed to update comment:', result.error);
        }
    });
}

/**
 * 新しいコメントを保存
 * @param {Object} clickData - 保存するクリックデータ
 * @param {string} originalId - 元の座標データのID
 */
function saveNewComment(clickData, originalId) {
    fetch('./coordinate/php/save_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Saving comment successful');
            deleteOriginalCoordinate(originalId);
            updateCoordinateTable();
        } else {
            console.error('Failed to save comment:', result.error);
        }
    });
}

/**
 * 元の座標データを削除
 * @param {string} coordinateId - 削除する座標データのID
 */
function deleteOriginalCoordinate(coordinateId) {
    // この関数の実装をここに追加
    // 座標データを削除するAPIを呼び出す
}

/**
 * 右クリックコメントを保存する
 * @param {string} comment - 保存するコメント
 */
function saveRightClickComment(comment) {
    getUserId().then(userId => {
        const clickData = {
            user_id: userId,
            video_id: videoId,
            x: rightClickX,
            y: rightClickY,
            click_time: player.getCurrentTime(),
            comment: comment
        };
        fetch('./coordinate/php/save_comment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clickData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                console.log('Saving right-click comment successful');
                updateCoordinateTable();
            } else {
                console.error('Failed to save right-click comment:', result.error);
            }
        })
        .catch(error => console.error('Error saving right-click comment:', error));
    })
    .catch(error => console.error('Error fetching user ID:', error));
}

/**
 * 最新のコメントをチェックする
 * @returns {Promise<boolean>} コメントが存在するかどうかを示すPromise
 */
function checkLatestComment() {
    return new Promise((resolve, reject) => {
        getUserId().then(userId => {
            fetch('./coordinate/php/get_latest_click.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, video_id: videoId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.comment) {
                    resolve(true);  // コメントが既にある場合
                } else {
                    resolve(false);  // コメントがない場合
                }
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
}

// =======================================
// エラー処理と修正
// =======================================

/**
 * ミスクリックを処理する
 * @param {string} userId - ユーザーID
 * @param {string} videoId - ビデオID
 */
function handleMistake(userId, videoId) {
    fetch('./coordinate/php/delete_latest_click.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === "success") {
            const clickTime = parseFloat(result.click_time);
            const seekTime = Math.max(clickTime - 1, 0);
            player.seekTo(seekTime, true);
            setTimeout(() => {
                drawRedCircle(result.x, result.y);
            }, 1000);
            clickCount--;
            clickCountDisplay.textContent = clickCount;
            updateCoordinateTable(); // テーブルを更新
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



// YouTubeプレーヤーの準備ができたときに呼び出される関数
function onYouTubeIframeAPIReady() {
    videoId = document.getElementById('player').getAttribute('data-video-id');
    fetch('./coordinate/php/get_user_id.php')
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                userId = data.user_id;
                initializePlayer(videoId);
            } else {
                console.error('User ID not found');
                alert('ユーザーIDが見つかりません。再度ログインしてください。');
            }
        })
        .catch(error => {
            console.error('Error fetching user ID:', error);
            alert('ユーザーID取得中にエラーが発生しました。');
        });
}

// グローバルエラーハンドリング
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, source, lineno, colno, error);
    alert('エラーが発生しました。詳細はコンソールを確認してください。');
    return true;
};

// アプリケーションの初期化
function initApp() {
    // ここに追加の初期化コードを記述
    console.log('Application initialized');
}

// DOMContentLoadedイベントで初期化を行う
document.addEventListener('DOMContentLoaded', initApp);

// モーダルの初期化（Bootstrapを使用している場合）
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