<?php

    include_once('initialization.php');

    $user_id = $_POST['user-id'];
    $message_tag = trim(strip_tags($_POST['message-tag']));
    $message_content = trim(strip_tags($_POST['message-content']));
    $message_lat = $_POST['message-lat'];
    $message_lng = $_POST['message-lng'];
    $message_recipient;
    $message_public;

    $errors = array();
    $errors['type'] = 'errors';

    if(isset($_POST['message-public'])) {
        $message_public = 1;
    } else {
        $message_public = 0;
    }

    if(isset($_POST['message-recipient'])) {
        $message_recipient = $_POST['message-recipient'];
    } else if ($message_public == 0 && !isset($_POST['message-recipient'])){
        $errors['recipient'] = 'Veuillez choisir un/des destinataire(s) ou laissez votre message public';
    }

    if($message_tag == '') {
        $errors['tag'] = 'Veuillez entrer un tag pour votre message';
    }

    if($message_content == ''){
        $errors['content'] = 'Votre message est vide !';
    }

    if(count($errors) < 2) {
        $sql = 'INSERT INTO messages(from_user_id, message_content, tag, message_lat, message_lng, message_date, public_message) 
        VALUES(:from_user_id, :message_content, :tag, :message_lat, :message_lng, now(), :public_message)';
        $preparedStatement = $connexion->prepare($sql);
        $preparedStatement->bindValue('from_user_id', $user_id);
        $preparedStatement->bindValue('message_content', $message_content);
        $preparedStatement->bindValue('tag', $message_tag);
        $preparedStatement->bindValue('message_lat', $message_lat);
        $preparedStatement->bindValue('message_lng', $message_lng);
        $preparedStatement->bindValue('public_message', $message_public);
        $preparedStatement->execute();            
        $message_id = $connexion->lastInsertId();

        foreach($message_recipient as $recipient) {
            $recipient_id = intval($recipient);
            $sql = 'INSERT INTO messages_recipient(message_id, to_user_id) VALUES(:message_id, :to_user_id)';
            $preparedStatement = $connexion->prepare($sql);
            $preparedStatement->bindValue('message_id', $message_id);
            $preparedStatement->bindValue('to_user_id', $recipient_id);
            $preparedStatement->execute();
        }
        
        
        $sql = 'SELECT * FROM messages WHERE id = :id';
        $query = $connexion->prepare($sql);
        $query->bindValue('id', $message_id);
        $query->execute();
        $sendedMessage = $query->fetch();
        
        $sendedMessage['type'] = "sendedMessage";
        echo json_encode($sendedMessage);
        
    } else {
        echo json_encode($errors);
    }
    
        

?>