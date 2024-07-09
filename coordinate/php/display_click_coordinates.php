<?php
require_once("MYDB.php");
$pdo = db_connect();

try {
    $stmt = $pdo->prepare("SELECT * FROM click_coordinates");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
    exit();
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Click Coordinates</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Click Coordinates</h1>
    <table>
        <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>X Coordinate</th>
            <th>Y Coordinate</th>
            <th>Click Time</th>
            <th>Video ID</th>
            <th>Comment</th>
        </tr>
        <?php foreach ($results as $row): ?>
            <tr>
                <td><?php echo htmlspecialchars($row['id']); ?></td>
                <td><?php echo htmlspecialchars($row['user_id']); ?></td>
                <td><?php echo htmlspecialchars($row['x_coordinate']); ?></td>
                <td><?php echo htmlspecialchars($row['y_coordinate']); ?></td>
                <td><?php echo htmlspecialchars($row['click_time']); ?></td>
                <td><?php echo htmlspecialchars($row['video_id']); ?></td>
                <td><?php echo htmlspecialchars($row['comment']); ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
