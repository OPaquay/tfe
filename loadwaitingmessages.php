<?php

    include_once('initialization.php');

    $user_id = $_POST['userId'];


    $sql = 'SELECT messages.* FROM messages, messages_recipient WHERE messages_recipient.message_id = messages.id AND messages_recipient.received = 0 AND to_user_id = :user_id';
    $query = $connexion->prepare($sql);
    $query->bindValue('user_id', $user_id);
    $query->execute();
    $waiting_messages = $query->fetchAll();

    echo json_encode($waiting_messages);
    

?>