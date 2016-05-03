<?php

    include_once('initialization.php');

    $friendToAdd = $_POST['friendToAdd'];
    $userId = $_POST['userId'];
    $username = $_POST['username'];

    $sql = 'INSERT INTO friendship(from_id, to_id, date) VALUES(:from_id, :to_id, now())';
    $preparedStatement = $connexion->prepare($sql);
    $preparedStatement->bindValue('from_id', $userId);
    $preparedStatement->bindValue('to_id', $friendToAdd);
    $preparedStatement->execute();

    $sql = 'INSERT INTO activities(owner_id, type, date) VALUES(:owner_id, :type, now())';
    $query = $connexion->prepare($sql);
    $query->bindValue('owner_id', $friendToAdd);
    $query->bindValue('type', 'friendrequest');
    $query->execute();
    $activity_id = $connexion->lastInsertId();

    $sql = 'INSERT INTO activities_participants(activity_id, participant_id, participant_username) VALUES(:activity_id, :participant_id, :participant_username)';
    $query = $connexion->prepare($sql);
    $query->bindValue('activity_id', $activity_id);
    $query->bindValue('participant_id', $userId);
    $query->bindValue('participant_username', $username);
    $query->execute();

    echo 'Demande envoyée';

?>