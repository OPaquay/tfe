<?php

    include_once('initialization.php');
    include_once('passwordLib.php');

    $username = trim(strip_tags($_POST['username']));
    $password = trim(strip_tags($_POST['password']));

    $errors = array();
    $errors['type'] = "errors";
    
    if ($username == '') {
        $errors['username'] = 'Veuillez entrez votre nom d\'utilisateur';
    }

    if ($password == '') {
        $errors['password'] = 'Veuillez entrez votre mot de passe';
    }

    if (count($errors) < 2) {
        $sql = 'SELECT * FROM users WHERE username = :username';
        $query = $connexion->prepare($sql);
        $query->bindValue(':username', $username);
        $query->execute();
        $user = $query->fetch();
        if($user != '' && password_verify($password, $user['hash'])){
            $user['type'] = "connected";
            echo json_encode($user);
        } else {
            $errors['connexion'] = 'La combinaison nom d\'utilisateur/mot de passe est incorrecte.';
            echo json_encode($errors);
        }
    } else {
        echo json_encode($errors);
    }


?>