<?php header('Access-Control-Allow-Origin: *'); ?>


<?php

    include_once('initialization.php');

    $user_id = $_POST['userId'];

    $sql = 'SELECT * FROM messages WHERE from_user_id = :user_id';
    $query = $connexion->prepare($sql);
    $query->bindValue('user_id', $user_id);
    $query->execute();
    $sendedMessages = $query->fetchAll();

    echo json_encode($sendedMessages);

?>