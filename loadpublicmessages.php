<?php

    include_once('initialization.php');

    $sql = 'SELECT * FROM messages WHERE public_message = :public_message';
    $query = $connexion->prepare($sql);
    $query->bindValue('public_message', 1);
    $query->execute();
    $public_messages = $query->fetchAll();

    foreach ($public_messages as &$message) {
        $message_sender_id = $message['from_user_id'];
        
        $sql = 'SELECT username FROM users WHERE id = :from_user_id';
        $query = $connexion->prepare($sql);
        $query->bindValue('from_user_id', $message_sender_id);
        $query->execute();
        $message['from_user_username'] = $query->fetch();
    }

    echo json_encode($public_messages);

?>