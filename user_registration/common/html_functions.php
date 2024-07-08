<link rel="stylesheet" href="style.css">
<?php
/**
 * HTML出力に関する関数を定義 
 */

//  HTML上部を表示する
function show_top($heading="登録情報一覧") {
    echo <<<USERS_LIST
    <html>
        <head>
            <title>{$heading}</title>
            <link rel="stylesheet"  href="styles.css">
        </head>
    <body>
        <h1>{$heading}</h1>
    USERS_LIST;
}

//  HTML下部を表示する
function show_bottom($return_top=false) {
    //  $return_topがtrueなら、トップに戻るリンクを付ける
    if ($return_top == true) {
        echo <<<BACK_TOP
            <br>
            <a href="index.php">登録情報一覧へ</a>
        BACK_TOP;
    }
    echo <<<BOTTOM
        </body>
    </html>
    BOTTOM;
}

//  登録フォームの表示
function show_input() {
    $error = get_error();
    show_edit_input_common("", "", "", "", "create", "登録");    
}

//  削除フォームの表示
function show_delete($member) {
    if($member != null) {
        show_user($member);
    }
    $error = get_error();
    echo <<<DELETE
        <form action="post_data.php" method="post">
            <p>この情報を削除しますか？</p>
            <p>{$error}</p> 
            <input type="hidden" name="user_id" value="{$member["user_id"]}"/>
            <input type="hidden" name="data" value="delete"/>
            <br>
            <br>
            <input type="submit" value="削除" class="button-link">
        </form>
    DELETE;        
}

//  更新フォームの表示
function show_update($name, $user_id, $password, $old_user_id) {
    show_edit_input_common($name, $user_id, $password, $old_user_id, "update", "更新");
}

//  挿入フォーム・更新フォームの表示
function show_edit_input_common($name, $user_id, $password, $old_user_id, $data, $button) {
    $error = get_error();
    //  フォームの上部を表示
    echo <<<INPUT_TOP
    <form action="post_data.php" method="post" onsubmit="return validateForm()">
        <p>名前：<br>
        <input type="text" name="name" placeholder="例）山田太郎" value="{$name}">
        </p>
        <p>id：<br>
        <input type="text" name="user_id" placeholder="例）1111" value="{$user_id}" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください">
        </p>
        <p>パスワード：<br>
        <input type="password" name="password" placeholder="例）2222" value="{$password}" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください">
        </p>
        <p>パスワードの確認：<br>
        <input type="password" name="password_confirm" placeholder="例）2222" pattern="[0-9]{4}" title="4文字の半角、数字で入力してください">
        </p>
    INPUT_TOP;
    
    //  フォームの下部を表示
    echo <<<INPUT_BOTTOM
        <p>{$error}</p>
        <input type="hidden" name="old_user_id" value="{$old_user_id}">
        <input type="hidden" name="data" value="{$data}">
        <br>
        <br>
        <input type="submit" value="{$button}">
    </form>
    <!-- ログイン画面へのリンク -->
    <p>すでにアカウントをお持ちの場合は、<a href="../../login/login.php">ログイン</a>してください。</p>

    INPUT_BOTTOM;        
}

//  登録情報一覧を表示する
function show_user_list($members) {
    //  テーブルのトップを表示
    echo <<<TABLE_TOP
    <table border="1" style="border-collapse:collapse">
        <tr>
            <th>名前</th><th width="100px">id</th><th>パスワード</th><th>登録情報</th>
        </tr>
    TABLE_TOP;
    
    //foreach：要素を順番に処理するためのループ構文（$members配列の要素を順番に処理）
    //as &loop：代入先
    foreach($members as $loop) {
        // パスワードを隠す
        $hidden_password = str_repeat('*', strlen($loop["password"]));
        //  ヒアドキュメントでデータを表示
        echo <<<END
        <tr align="center">    
            <td>{$loop["name"]}</td>
            <td>{$loop["user_id"]}</td>
            <td>{$hidden_password}</td>
            <input type="hidden" name="user_id" value="{$loop["user_id"]}">
            <td>
                <form action="check_password.php" method="post" style="display:inline;">
                    <input type="hidden" name="user_id" value="{$loop["user_id"]}">
                    <input type="password" name="password" placeholder="パスワードを入力">
                    <input type="submit" value="編集" class="button-link">
                </form>
            </td>
        </tr>
        END;
    }
    //  テーブルの下部分の表示
    echo <<<TABLE_BOTTOM
    </table>
    <br>
    <!-- ログイン画面へのリンク -->
    <p>すでにアカウントをお持ちの場合は、<a href="../../login/login.php">ログイン</a>してください。</p>

    TABLE_BOTTOM;
}

//  特定の登録情報を表示する
function show_user($member) {
    // パスワードを隠す
    //$hidden_password = str_repeat('*', strlen($member["password"]));
    //<td>{$hidden_password}</td> に書き換える。
    
    //  テーブルのトップを表示
    echo <<<USER
    <table border="1" style="border-collapse:collapse">
        <tr>
            <th>名前</th><th width="100px">id</th><th>パスワード</th>
        </tr>
        <tr align="center">
            <td>{$member["name"]}</td>
            <td>{$member["user_id"]}</td>
            <td>{$member["password"]}</td>
        </tr>
    </table>
    <br>
    USER;
}

//  選択編集画面の操作の一覧の表示
function show_operations($user_id) {
    echo <<<OPERATIONS
    <a href="user_update.php?user_id={$user_id}" class="button-link">情報の更新</a>
    <br>
    <a href="user_delete.php?user_id={$user_id}" class="button-link">情報の削除</a>
    <br>
    OPERATIONS;
}
?>

