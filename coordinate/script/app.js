// グローバル変数の定義aaaaaaaaa
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

// YouTube IFrame API の初期化
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
    initializeControls();
}

function initializeControls() {
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
    let isUpdatingComment = false;

    playBtn.addEventListener('click', () => {
        player.playVideo();
        isPlaying = true;
        window.postMessage('play', '*');
    });

    pauseBtn.addEventListener('click', () => {
        player.pauseVideo();
        isPlaying = false;
        window.postMessage('pause', '*');
    });

    stopBtn.addEventListener('click', () => {
        player.stopVideo();
        isPlaying = false;
        window.postMessage('stop', '*');
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

    const toggleCoordinateBtn = document.getElementById('toggleCoordinateBtn');
    toggleCoordinateBtn.addEventListener('click', () => {
        if (!isCoordinateEnabled && !isReplayEnabled) {
            isCoordinateEnabled = true;
            player.pauseVideo();
            toggleCoordinateBtn.classList.add('on');
            toggleCoordinateBtn.classList.remove('off');
            toggleCoordinateBtn.textContent = "座標取得オン";
        } else if (isCoordinateEnabled) {
            isCoordinateEnabled = false;
            player.pauseVideo(); // 動画を一時停止
            toggleCoordinateBtn.classList.remove('on');
            toggleCoordinateBtn.classList.add('off');
            toggleCoordinateBtn.textContent = "座標取得オフ";
        }
    });

    const replayBtn = document.getElementById('replayBtn');
    replayBtn.addEventListener('click', () => {
        if (!isReplayEnabled && !isCoordinateEnabled) {
            isReplayEnabled = true;
            player.pauseVideo();
            player.seekTo(0);
            replayBtn.textContent = "リプレイオン";
            replayBtn.classList.add('on');
            fetchClickData();
        } else if (isReplayEnabled) {
            isReplayEnabled = false;
            player.pauseVideo();
            clearCanvas(); // キャンバスをクリアする新しい関数
            replayBtn.classList.remove('on');
            replayBtn.textContent = "リプレイオフ";
        }
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

    commentBtn.addEventListener('click', () => {
        player.pauseVideo();
        isRightClickComment = false; // コメントボタンからの通常のコメント追加であることを示す
        checkLatestComment().then(hasComment => {
            if (hasComment) {
                confirmUpdateModal.style.display = 'block';
            } else {
                commentModal.style.display = 'block';
            }
        });
    });

    confirmUpdateYes.addEventListener('click', () => {
        isUpdatingComment = true;
        confirmUpdateModal.style.display = 'none';
        commentModal.style.display = 'block';
    });

    confirmUpdateNo.addEventListener('click', () => {
        confirmUpdateModal.style.display = 'none';
        player.playVideo();
    });

    commentCancel.addEventListener('click', () => {
        commentModal.style.display = 'none';
        player.playVideo();
        commentInput.value = ''; // コメント入力欄をクリア
    });

    commentSubmit.addEventListener('click', () => {
        const comment = commentInput.value;
        if (isRightClickComment) {
            saveRightClickComment(comment);
        } else {
            saveComment(comment, isUpdatingComment);
        }
        commentModal.style.display = 'none';
        player.playVideo();
        commentInput.value = ''; // コメント入力欄をクリア
        isUpdatingComment = false;
        isRightClickComment = false;
    });

    recordScene.addEventListener('click', () => {
        handleSceneClick(userId, videoId);
        contextMenu.style.display = 'none';
        player.playVideo(); // 動画を再生
    });
    
    recordComment.addEventListener('click', () => {
        player.pauseVideo();
        commentModal.style.display = 'block';
        contextMenu.style.display = 'none';
        isRightClickComment = true; // 右クリックでのコメント追加であることを示すフラグ
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
            if (isPlaying && isCoordinateEnabled) {
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
            if (isPlaying && isCoordinateEnabled) {
                const rect = canvas.getBoundingClientRect();
                rightClickX = event.clientX - rect.left;
                rightClickY = event.clientY - rect.top;
                contextMenu.style.top = `${event.clientY}px`;
                contextMenu.style.left = `${event.clientX}px`;
                contextMenu.style.display = 'block';
                player.pauseVideo();  // 右クリック時に動画を一時停止
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

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else {
        isPlaying = false;
    }
}

function handleCanvasClick(event, userId, videoId) {
    const canvas = document.getElementById('myCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickTime = player.getCurrentTime();

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
            addCoordinateData(clickCount, clickTime, x, y); // 新しい行を追加
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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
                    fetch('./coordinate/php/update_comment.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clickData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.status === 'success') {
                            console.log('Updating comment successful');
                        } else {
                            console.error('Failed to update comment:', result.error);
                        }
                    });
                } else {
                    // 新しいコメントの保存
                    fetch('./coordinate/php/save_comment.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clickData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.status === 'success') {
                            console.log('Saving comment successful, deleting original coordinate:', data.id);
                            deleteOriginalCoordinate(data.id);
                        } else {
                            console.error('Failed to save comment:', result.error);
                        }
                    });
                }
            } else {
                console.error('Failed to get latest click');
            }
        })
        .catch(error => console.error('Error fetching latest click:', error));
    })
    .catch(error => console.error('Error fetching user ID:', error));
}

function deleteOriginalCoordinate(coordinateId) {
    console.log('Deleting coordinate with ID:', coordinateId);
    fetch('./coordinate/php/delete_coordinate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coordinateId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Original coordinate deleted successfully');
        } else {
            console.error('Failed to delete original coordinate:', result.error);
        }
    })
    .catch(error => console.error('Error deleting original coordinate:', error));
}

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
            if (result.status !== 'success') {
                console.error('Failed to save right-click comment:', result.error);
            }
        })
        .catch(error => console.error('Error saving right-click comment:', error));
    })
    .catch(error => console.error('Error fetching user ID:', error));
}

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

// ミスボタンのイベントリスナー
document.getElementById('mistakeBtn').addEventListener('click', () => {
    handleMistake(userId, videoId);
});

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
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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

function fetchClickData() {
    const videoId = document.getElementById('player').getAttribute('data-video-id');
    console.log('Fetching click data for video ID:', videoId); // デバッグ用ログ

    fetch('./coordinate/php/get_click_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId })
    })
    .then(response => {
        console.log('Response status:', response.status); // デバッグ用ログ
        return response.json();
    })
    .then(data => {
        console.log('Received click data:', data); // デバッグ用ログ
        if (data.status === 'success') {
            player.seekTo(0);
            if (isReplayEnabled) {
                replayClickData(data.clicks);
            }
            displayClickData(data.clicks);
        } else {
            console.error('Error fetching click data:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

function displayClickData(clicks) {
    const coordinateData = document.getElementById('coordinate-data');
    coordinateData.innerHTML = ''; // 既存のデータをクリア
    clicks.forEach((click, index) => {
        addCoordinateData(index + 1, click.click_time, click.x, click.y);
    });
}

function addCoordinateData(number, time, x, y) {
    const coordinateData = document.getElementById('coordinate-data');
    const item = document.createElement('div');
    item.className = 'coordinate-item';
    item.textContent = `${number}. ${time.toFixed(2)}秒 - (${x}, ${y})`;
    coordinateData.appendChild(item);

    // 自動スクロール
    coordinateData.scrollTop = coordinateData.scrollHeight;
}

function replayClickData(clicks) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    clicks.forEach((click, index) => {
        setTimeout(() => {
            drawCircleWithNumber(ctx, click.x, click.y, index + 1);
        }, click.click_time * 1000);
    });
}

function drawCircleWithNumber(ctx, x, y, number) {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), x, y);
}

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
        } else {
            console.error('Error:', result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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

function clearCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}