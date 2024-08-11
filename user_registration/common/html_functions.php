<?php
/**
 * HTML出力に関する関数を定義 
 */

//  HTML上部を表示する
function show_top($heading="登録情報一覧") {
    echo <<<USERS_LIST
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{$heading}</title>
        <!-- Bootstrap CSSの読み込み -->
        <link href="/../Bootstrap/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="styles.css">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h1 class="card-title text-center mb-4">{$heading}</h1>
    USERS_LIST;
}

//  HTML下部を表示する
function show_bottom($return_top=false) {
    if ($return_top == true) {
        echo '<p class="text-center mt-3"><a href="index.php" class="btn btn-secondary">登録情報一覧へ</a></p>';
    }
    echo <<<BOTTOM
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Bootstrap JSの読み込み -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="/../Bootstrap/js/bootstrap.min.js"></script>
    </body>
    </html>
    BOTTOM;
}

//  登録フォームの表示
function show_input() {
    $error = get_error();
    if ($error) {
        echo "<div class='alert alert-danger'>{$error}</div>";
    }
    show_edit_input_common("", "", "", "", "create", "登録");    
}

//  挿入フォーム・更新フォームの表示
function show_edit_input_common($name, $user_id, $password, $old_user_id, $data, $button) {
    echo <<<INPUT_FORM
    <form action="post_data.php" method="post" onsubmit="return validateForm()">
        <div class="mb-3">
            <label for="name" class="form-label">名前：</label>
            <input type="text" class="form-control" id="name" name="name" placeholder="例）山田太郎" value="{$name}" required>
        </div>
        <div class="mb-3">
            <label for="user_id" class="form-label">ID：</label>
            <input type="text" class="form-control" id="user_id" name="user_id" placeholder="例）1111" value="{$user_id}" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください" required>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">パスワード：</label>
            <input type="password" class="form-control" id="password" name="password" placeholder="例）2222" value="{$password}" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください" required>
        </div>
        <div class="mb-3">
            <label for="password_confirm" class="form-label">パスワードの確認：</label>
            <input type="password" class="form-control" id="password_confirm" name="password_confirm" placeholder="例）2222" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください" required>
        </div>
        <input type="hidden" name="old_user_id" value="{$old_user_id}">
        <input type="hidden" name="data" value="{$data}">
        <div class="d-grid">
            <button type="submit" class="btn btn-primary">{$button}</button>
        </div>
    </form>
    <p class="text-center mt-3">
        <a href="../../login/login.php" class="text-decoration-none">ログイン画面へ</a>
    </p>
    INPUT_FORM;        
}

//  削除フォームの表示
function show_delete($member) {
    if($member != null) {
        show_user($member);
    }
    $error = get_error();
    if ($error) {
        echo "<div class='alert alert-danger'>{$error}</div>";
    }
    echo <<<DELETE
    <form action="post_data.php" method="post" class="mt-4">
        <p class="lead text-center">この情報を削除しますか？</p>
        <input type="hidden" name="user_id" value="{$member["user_id"]}"/>
        <input type="hidden" name="data" value="delete"/>
        <div class="d-grid">
            <button type="submit" class="btn btn-danger">削除</button>
        </div>
    </form>
    DELETE;        
}

//  登録情報一覧を表示する
function show_user_list($members) {
    echo '<div class="table-responsive">';
    echo '<table class="table table-striped">';
    echo '<thead><tr><th>名前</th><th>ID</th><th>パスワード</th><th>操作</th></tr></thead><tbody>';
    
    foreach($members as $loop) {
        $hidden_password = str_repeat('*', strlen($loop["password"]));
        echo <<<END
        <tr>    
            <td>{$loop["name"]}</td>
            <td>{$loop["user_id"]}</td>
            <td>{$hidden_password}</td>
            <td>
                <form action="check_password.php" method="post">
                    <input type="hidden" name="user_id" value="{$loop["user_id"]}">
                    <div class="input-group">
                        <input type="password" class="form-control" name="password" placeholder="パスワード">
                        <button type="submit" class="btn btn-outline-primary">編集</button>
                    </div>
                </form>
            </td>
        </tr>
        END;
    }
    echo '</tbody></table></div>';
    echo '<p class="text-center mt-3"><a href="../../login/login.php" class="text-decoration-none">ログイン画面へ</a></p>';
}

//  特定の登録情報を表示する
function show_user($member) {
    echo '<div class="table-responsive mb-4">';
    echo '<table class="table table-bordered">';
    echo '<thead><tr><th>名前</th><th>ID</th><th>パスワード</th></tr></thead>';
    echo "<tbody><tr><td>{$member["name"]}</td><td>{$member["user_id"]}</td><td>{$member["password"]}</td></tr></tbody>";
    echo '</table></div>';
}

//  選択編集画面の操作の一覧の表示
function show_operations($user_id) {
    echo <<<OPERATIONS
    <div class="d-grid gap-2">
        <a href="user_update.php?user_id={$user_id}" class="btn btn-primary">情報の更新</a>
        <a href="user_delete.php?user_id={$user_id}" class="btn btn-danger">情報の削除</a>
    </div>
    OPERATIONS;
}
?>