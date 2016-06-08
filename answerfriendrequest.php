<?php header('Access-Control-Allow-Origin: *'); ?>


<?php

    include_once('initialization.php');

    $user_id = $_POST['userId'];
    $user_username = $_POST['userUsername'];
    $requester_id = $_POST['requesterId'];
    $request_accepted = $_POST['friendrequestAccepted'];
    $activity_id = $_POST['activityId'];

    if($request_accepted == 'accepted') {
    
        $sql = 'UPDATE friendship SET accepted = :accepted WHERE from_id = :requester_id AND to_id = :user_id';
        $query = $connexion->prepare($sql);
        $query->bindValue('accepted', 1);
        $query->bindValue('requester_id', $requester_id);
        $query->bindValue('user_id', $user_id);
        $query->execute();
        
        $sql = 'UPDATE activities SET type = :type, date = now() WHERE id = :id';
        $query = $connexion->prepare($sql);
        $query->bindValue('type', 'friendrequestaccepted');
        $query->bindValue('id', $activity_id);
        $query->execute();
        
        $sql = 'INSERT INTO activities(owner_id, type, date) VALUES(:owner_id, :type, now())';
        $query = $connexion->prepare($sql);
        $query->bindValue('owner_id', $requester_id);
        $query->bindValue('type', 'friendrequestacceptedby');
        $query->execute();
        $activity_id = $connexion->lastInsertId();
        
        $sql = 'INSERT INTO activities_participants(activity_id, participant_id, participant_username) VALUES(:activity_id, :participant_id, :participant_username)';
        $query = $connexion->prepare($sql);
        $query->bindValue('activity_id', $activity_id);
        $query->bindValue('participant_id', $user_id);
        $query->bindValue('participant_username', $user_username);
        $query->execute();
        
        echo 'Invitation acceptée';
        
    } else if ($request_accepted == 'refused') {
        $sql = 'DELETE FROM activities WHERE id = :id';
        $query = $connexion->prepare($sql);
        $query->bindValue('id', $activity_id);
        $query->execute();
        
        echo 'Invitation refusée';
    }

?>