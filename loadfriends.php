<?php

    include_once('initialization.php');

    $userId = $_POST['userId'];


    $sql = 'SELECT users.id, users.username 
        FROM users, friendship 
        WHERE friendship.accepted = :accepted 
        AND (friendship.from_id = :from_id OR friendship.to_id = :to_id)
        AND (friendship.from_id = users.id OR friendship.to_id = users.id)';

        $query = $connexion->prepare($sql);
        $query->bindValue(':from_id', $userId);
        $query->bindValue(':to_id', $userId);
        $query->bindValue(':accepted', 1);
        $query->execute();
        $friendList = $query->fetchAll();
    
    echo json_encode($friendList);

    


?>