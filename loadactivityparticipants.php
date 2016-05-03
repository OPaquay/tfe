<?php

    include_once('initialization.php');

    $activityId = $_POST['activityId'];


    $sql = 'SELECT * FROM activities_participants WHERE activity_id = :activity_id';
    $query = $connexion->prepare($sql);
    $query->bindValue('activity_id', $activityId);
    $query->execute();
    $activity_participants = $query->fetchAll();

    echo json_encode($activity_participants);
    

?>