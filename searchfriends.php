<?php

    include_once('initialization.php');

    $friendToSearch = trim(strip_tags($_POST['friendToSearch']));

    $sql = 'SELECT username, id FROM users WHERE username LIKE :username';
    $query = $connexion->prepare($sql);
    $query->bindValue(':username', ($friendToSearch . '%'));
    $query->execute();
    $userList = $query->fetchAll();
    echo json_encode($userList);
    

?>