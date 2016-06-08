<?php

    include_once('initialization.php');

    $activity_id = intval($_POST['activityId']);

    $sql = 'DELETE FROM activities WHERE id = :id';
    $query = $connexion->prepare($sql);
    $query->bindValue(':id', $activity_id);
    $query->execute();

    $sql = 'DELETE FROM activities_participants WHERE activity_id = :activity_id';
    $query = $connexion->prepare($sql);
    $query->bindValue(':activity_id', $activity_id);
    $query->execute();

    
?>