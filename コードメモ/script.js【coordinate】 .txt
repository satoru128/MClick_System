window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global error:", message, "at", source, ":", lineno, ":", colno, error);
};

window.addEventListener('load', () => {
    getUserId().then(user_id => {
        const userInfoElement = document.getElementById('user-info');
        userInfoElement.textContent = `ログインユーザーID: ${user_id}`;
        const videoInfoElement = document.getElementById('video-info');
        const videoId = getVideoId();
        videoInfoElement.textContent = `再生中のvideoId: ${videoId}`;
        getClickCount(user_id, videoId);

        const mistakeBtn = document.getElementById('mistakeBtn');
        if (mistakeBtn) {
            mistakeBtn.addEventListener('click', () => {
                if (isPlaying) {
                    handleMistake(user_id, videoId);
                }
            });
        } else {
            console.error("mistakeBtn is null");
        }

        const resetBtn = document.getElementById('resetBtn');
        const resetModal = document.getElementById('resetModal');
        const resetConfirm = document.getElementById('resetConfirm');
        const resetCancel = document.getElementById('resetCancel');

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                player.pauseVideo();
                resetModal.style.display = 'block';
            });
        } else {
            console.error("resetBtn is null");
        }

        resetConfirm.addEventListener('click', () => {
            resetClickData(user_id, videoId);
            player.seekTo(0);
            player.playVideo();
            resetModal.style.display = 'none';
        });

        resetCancel.addEventListener('click', () => {
            player.playVideo();
            resetModal.style.display = 'none';
        });

        const canvas = document.getElementById('myCanvas');
        if (canvas && !canvas.hasEventListener) {
            canvas.addEventListener('click', (event) => {
                if (isPlaying && isCoordinateEnabled) {
                    handleCanvasClick(event, user_id, videoId);
                }
            });

            canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                if (isPlaying && isCoordinateEnabled) {
                    rightClickX = event.clientX;
                    rightClickY = event.clientY;
                    contextMenu.style.top = `${rightClickY}px`;
                    contextMenu.style.left = `${rightClickX}px`;
                    contextMenu.style.display = 'block';
                    player.pauseVideo();  // 右クリック時に動画を一時停止
                }
            });

            canvas.hasEventListener = true;
        } else {
            console.error("canvas is null");
        }

        if (player && typeof player.addEventListener === 'function') {
            player.addEventListener('onStateChange', (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    isPlaying = true;
                } else {
                    isPlaying = false;
                }
            });
        } else {
            console.error("player is null or does not support addEventListener");
        }
    }).catch(error => {
        const userInfoElement = document.getElementById('user-info');
        userInfoElement.textContent = 'ユーザーIDが取得できませんでした';
        console.error('ユーザーID取得エラー:', error);
    });

    const commentBtn = document.getElementById('commentBtn');
    const commentModal = document.getElementById('commentModal');
    const commentSubmit = document.getElementById('commentSubmit');
    const commentCancel = document.getElementById('commentCancel');
    const commentInput = document.getElementById('commentInput');
    const confirmUpdateModal = document.getElementById('confirmUpdateModal');
    const confirmUpdateYes = document.getElementById('confirmUpdateYes');
    const confirmUpdateNo = document.getElementById('confirmUpdateNo');
    let isUpdatingComment = false;

    commentBtn.addEventListener('click', () => {
        player.pauseVideo();
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
        saveComment(comment, isUpdatingComment);
        commentModal.style.display = 'none';
        player.playVideo();
        commentInput.value = ''; // コメント入力欄をクリア
        isUpdatingComment = false;
    });

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
                        return fetch('./coordinate/php/update_comment.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(clickData)
                        });
                    } else {
                        return fetch('./coordinate/php/save_comment.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(clickData)
                        });
                    }
                } else {
                    console.error('Failed to get latest click');
                }
            })
            .then(response => response.json())
            .then(result => {
                if (result.status !== 'success') {
                    console.error('Failed to save comment:', result.error);
                }
            })
            .catch(error => console.error('Error saving comment:', error));
        })
        .catch(error => console.error('Error fetching user ID:', error));
    }
});

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
            player.playVideo();

            pendingCircle = {
                x: parseFloat(result.x),
                y: parseFloat(result.y),
                displayTime: clickTime
            };

            const interval = setInterval(() => {
                if (player.getCurrentTime() >= pendingCircle.displayTime && !isCircleVisible) {
                    drawRedCircleWithFade(pendingCircle.x, pendingCircle.y);
                    pendingCircle = null;
                    clearInterval(interval);
                }
            }, 100);

            getClickCount(userId, videoId);
        } else {
            console.error('Error:', result.error);
            alert('クリック座標の削除に失敗しました: ' + result.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('サーバーへのリクエスト中にエラーが発生しました');
    });
}

function drawRedCircleWithFade(x, y) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    let opacity = 1.0;
    const radius = 5;
    const fadeOutInterval = 30;
    const fadeOutSteps = 15;

    function fade() {
        if (opacity > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
            ctx.fill();
            opacity -= 1.0 / fadeOutSteps;
            setTimeout(fade, fadeOutInterval);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    fade();
}

function getVideoId() {
    const playerElement = document.getElementById('player');
    return playerElement ? playerElement.getAttribute('data-video-id') : null;
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
            video_id: videoId
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

function updateClickCount(userId, videoId) {
    fetch('./coordinate/php/update_click_count.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Click count updated successfully');
            getClickCount(userId, videoId);
        } else {
            console.error('Error updating click count:', result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function resetClickData(userId, videoId) {
    fetch('./coordinate/php/reset_click_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Click data reset successfully');
            document.getElementById('clickCount').textContent = '0';
        } else {
            console.error('Error resetting click data:', result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getClickCount(userId, videoId) {
    fetch('./coordinate/php/get_click_count.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            document.getElementById('clickCount').textContent = result.click_count;
        } else {
            console.error('Error fetching click count:', result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
