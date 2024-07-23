// グローバル変数の定義
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
        if (isReplayEnabled && isReplayPaused) {
            resumeReplay();
        }
    });

    pauseBtn.addEventListener('click', () => {
        player.pauseVideo();
        isPlaying = false;
        window.postMessage('pause', '*');
        if (isReplayEnabled && !isReplayPaused) {
            pauseReplay();
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
            replayBtn.textContent = "リプレイオン";
            replayBtn.classList.add('on');
            fetchReplayData(videoId).then(clicks => {
                if (clicks && clicks.length > 0) {
                    replayClicks(clicks);
                } else {
                    console.error('No replay data available');
                    alert('リプレイデータがありません。');
                    isReplayEnabled = false;
                    replayBtn.classList.remove('on');
                    replayBtn.textContent = "リプレイオフ";
                }
            });
        } else if (isReplayEnabled) {
            isReplayEnabled = false;
            player.pauseVideo();
            clearCanvas();
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

function displayClickCoordinates(coordinates) {
    const container = document.getElementById('coordinate-data');
    container.innerHTML = ''; // 以前の内容をクリア

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
            row.appendChild(cell);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
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

function handleCanvasClick(event, userId, videoId) {
    const canvas = document.getElementById('myCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickTime = player.getCurrentTime();

    // 保存する座標はキャンバスの実際のサイズに対する比率で保存
    const saveX = x / canvas.clientWidth;
    const saveY = y / canvas.clientHeight;

    // サーバーにデータを送信
    fetch('./coordinate/php/save_coordinates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            x: saveX,
            y: saveY,
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

function updateCoordinateTable() {
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const container = document.getElementById('coordinate-data');
                const table = container.querySelector('table') || document.createElement('table');
                const newRow = document.createElement('tr');
                const latestCoord = data.data[data.data.length - 1];
                
                [latestCoord.id, latestCoord.x_coordinate, latestCoord.y_coordinate, parseFloat(latestCoord.click_time).toFixed(3), latestCoord.comment].forEach(text => {
                    const cell = document.createElement('td');
                    cell.textContent = text;
                    newRow.appendChild(cell);
                });
                
                table.appendChild(newRow);
                if (!container.contains(table)) {
                    container.appendChild(table);
                }
            } else {
                console.error('Error fetching click coordinates:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function fetchClickCoordinates() {
    console.log('Fetching click coordinates...'); // デバッグ用
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            console.log('Data fetched:', data); // デバッグ用
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
                            updateCoordinateTable();
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
                            console.log('Saving comment successful');
                            deleteOriginalCoordinate(data.id);
                            updateCoordinateTable();
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

// リプレイデータを取得する関数
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
                // データの形式を確認し、必要なプロパティが存在することを確認
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
                        comment: click.comment // コメント情報を含める
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

function setReplaySpeed(speed) {
    replaySpeed = speed;
}

// クリックイベントを再生する関数
function replayClicks(clicks, startTime = 0, endTime = Infinity) {
    clearCanvas();
    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];
    activeFadeIntervals.forEach(clearInterval);
    activeFadeIntervals = [];

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

function displayClicks(clicks) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    clicks.forEach(click => {
        ctx.beginPath();
        ctx.arc(click.x, click.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
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

    player.playVideo(); // 動画を再生開始

    clicks.forEach((click, index) => {
        setTimeout(() => {
            drawCircleWithNumber(ctx, click.x, click.y, index + 1);
        }, click.click_time * 1000);
    });
}

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

function hideClickInfo() {
    const tooltip = document.querySelector('.click-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function drawCircleWithNumberAndFade(ctx, x, y, id, click) {
    // 無効なクリックデータのチェック
    if (!click) {
        console.error('Invalid click data:', click);
        return;
    }
    const canvas = ctx.canvas;
    const radius = 10;
    
    // 描画座標の設定
    const drawX = x;
    const drawY = y;
    // 描画関数の定義
    function draw(alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        // 赤い円を描画
        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        // IDを白色で円の中央に描画
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id.toString(), drawX, drawY);
        
        ctx.restore();
    }
    // 初期描画
    draw(1.0);

    // 詳細情報表示用の要素を作成
    const infoElement = document.createElement('div');
    infoElement.className = 'click-info';
    infoElement.style.position = 'absolute';
    infoElement.style.left = `${drawX + 15}px`;
    infoElement.style.top = `${drawY + 15}px`;
    infoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoElement.style.color = 'white';
    infoElement.style.padding = '5px';
    infoElement.style.borderRadius = '3px';
    infoElement.style.display = 'none';
    infoElement.style.zIndex = '1000';
    // コメントの有無を確認
    const commentText = click.comment ? click.comment : 'なし';
    infoElement.innerHTML = `
        ID: ${id}<br>
        時間: ${click.click_time.toFixed(2)}秒<br>
        コメント: ${commentText}
    `;
    document.getElementById('video-container').appendChild(infoElement);

    // マウスオーバー用のヒットエリアを作成
    const hitArea = document.createElement('div');
    hitArea.style.position = 'absolute';
    hitArea.style.left = `${drawX - radius}px`;
    hitArea.style.top = `${drawY - radius}px`;
    hitArea.style.width = `${radius * 2}px`;
    hitArea.style.height = `${radius * 2}px`;
    hitArea.style.cursor = 'pointer';
    hitArea.style.zIndex = '999';
    document.getElementById('video-container').appendChild(hitArea);

    // マウスオーバーイベントの設定
    hitArea.addEventListener('mouseover', () => {
        infoElement.style.display = 'block';
    });

    hitArea.addEventListener('mouseout', () => {
        infoElement.style.display = 'none';
    });

    // フェードアウト処理
    let alpha = 1.0;
    let startTime = Date.now();
    const fadeInterval = setInterval(() => {
        if (!isReplayPaused) {
            const elapsed = (Date.now() - startTime) / 1000;
            alpha = Math.max(0, 1 - (elapsed / 2)); // 2秒でフェードアウト

            if (alpha <= 0) {
                clearInterval(fadeInterval);
                ctx.clearRect(drawX - radius - 1, drawY - radius - 1, (radius + 1) * 2, (radius + 1) * 2);
                document.getElementById('video-container').removeChild(infoElement);
                document.getElementById('video-container').removeChild(hitArea);
                const index = activeFadeIntervals.indexOf(fadeInterval);
                if (index > -1) {
                    activeFadeIntervals.splice(index, 1);
                }
            } else {
                draw(alpha);
            }
        }
    }, 20);

    activeFadeIntervals.push(fadeInterval);
}

function clearCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//データのエクスポート
document.getElementById('exportDataBtn').addEventListener('click', exportData);
function exportData() {
    fetch('./coordinate/php/fetch_click_coordinates.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // BOMを追加してUTF-8で正しく開けるようにする
                const BOM = "\uFEFF";
                const csvContent = BOM + "ID\tX\tY\tTime\tComment\n"
                    + data.data.map(e => `${e.id}\t${e.x_coordinate}\t${e.y_coordinate}\t${e.click_time}\t${e.comment}`).join("\n");

                const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "click_data.tsv");
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

//ヒートマップ
document.getElementById('toggleHeatmapBtn').addEventListener('click', toggleHeatmap);
window.addEventListener('load', initHeatmap);
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

function createHeatmapData(clicks) {
    return clicks.map(click => ({
        x: parseFloat(click.x_coordinate) * heatmapCanvas.width,
        y: parseFloat(click.y_coordinate) * heatmapCanvas.height,
        value: 1
    }));
}

document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initHeatmap();
});

document.getElementById('speedControl').addEventListener('input', function() {
    const speed = parseFloat(this.value);
    setReplaySpeed(speed);
    document.getElementById('speedValue').textContent = speed.toFixed(1) + 'x';
});

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