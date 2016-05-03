<?php

    include_once('initialization.php');

    $userId = $_POST['userId'];


    $sql = 'SELECT * FROM activities WHERE owner_id = :owner_id ORDER BY date DESC';
    $query = $connexion->prepare($sql);
    $query->bindValue('owner_id', $userId);
    $query->execute();
    $activities_list = $query->fetchAll();

    echo json_encode($activities_list);
    

    


?>