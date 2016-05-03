<?php header('Access-Control-Allow-Origin: *'); ?>


<?php

    include_once('initialization.php');

    $user_id = $_POST['userId'];
    $user_username = $_POST['userUsername'];
    $message_id = $_POST['messageId'];
    $from_user_id = $_POST['fromUserId'];
    $from_user_username = $_POST['fromUsername'];
    $founded_activity_id = $_POST['foundedActivityId'];
        
    $sql = 'UPDATE messages_recipient SET received = :received WHERE message_id = :message_id AND to_user_id = :user_id';
    $query = $connexion->prepare($sql);
    $query->bindValue('received', 1);
    $query->bindValue('message_id', $message_id);
    $query->bindValue('user_id', $user_id);
    $query->execute();

    $sql = 'INSERT INTO activities(owner_id, type, date) VALUES(:owner_id, :type, now())';
    $query = $connexion->prepare($sql);
    $query->bindValue('owner_id', $user_id);
    $query->bindValue('type', 'messageFounded');
    $query->execute();
    $activity_id = $connexion->lastInsertId();

    $sql = 'INSERT INTO activities_participants(activity_id, participant_id, participant_username) VALUES(:activity_id, :participant_id, :participant_username)';
    $query = $connexion->prepare($sql);
    $query->bindValue('activity_id', $activity_id);
    $query->bindValue('participant_id', $from_user_id);
    $query->bindValue('participant_username', $from_user_username);
    $query->execute();

    if ($founded_activity_id == 0) {
        $sql = 'INSERT INTO activities(owner_id, type, date) VALUES(:owner_id, :type, now())';
        $query = $connexion->prepare($sql);
        $query->bindValue('owner_id', $from_user_id);
        $query->bindValue('type', 'messageFoundedBy');
        $query->execute();
        $founded_activity_id = $connexion->lastInsertId();
        
        $sql = 'UPDATE messages SET foundedActivityId = :activityId WHERE id = :message_id';
        $query = $connexion->prepare($sql);
        $query->bindValue('activityId', $founded_activity_id);
        $query->bindValue('message_id', $message_id);
        $query->execute();
    }

    $sql = 'INSERT INTO activities_participants(activity_id, participant_id, participant_username) VALUES(:activity_id, :participant_id, :participant_username)';
    $query = $connexion->prepare($sql);
    $query->bindValue('activity_id', $founded_activity_id);
    $query->bindValue('participant_id', $user_id);
    $query->bindValue('participant_username', $user_username);
    $query->execute();
        
    echo ('Message reçu');

?>

