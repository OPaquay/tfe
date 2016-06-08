
<?php

    include_once('initialization.php');
    include_once('functions.inc.php');
    include_once('passwordLib.php');

    $errors = array();
    $errors['type'] = "errors";

    $username = trim(strip_tags($_POST['username']));
    $password = trim(strip_tags($_POST['password']));
    $confirm_password = trim(strip_tags($_POST['confirm-password']));
    $image_URI = $_POST['imageURI'];

    if(strlen($username) < 3) {
        $errors['username'] = 'Votre nom d\'utilisateur doit contenir au moins 3 caractères.';
    } else if (loginExists($connexion, $username)) {
        $errors['username'] = 'Ce nom d\' utilisateur est déjà utilisé';
    }

    if(strlen($password) < 1) {
        $errors['password'] = 'Vous devez entrer un mot de passe';
    } else if ($password != $confirm_password) {
        $errors['confirm-password'] = 'Les mots de passes ne correspondent pas.';
    }

    if ((count($errors) < 2) && ($image_URI != '')) {
        
        $sql = 'INSERT INTO users(username, hash, secret) VALUES(:username, :hash, :secret)';
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $secret = uniqid();
        $preparedStatement = $connexion->prepare($sql);
        $preparedStatement->bindValue('username', $username);
        $preparedStatement->bindValue('hash', $hash);
        $preparedStatement->bindValue('secret', $secret);
        $preparedStatement->execute();
        
        $sql = 'SELECT * FROM users WHERE username = :username';
        $query = $connexion->prepare($sql);
        $query->bindValue(':username', $username);
        $query->execute();
        $user = $query->fetch();
        $user['type'] = "connected";
        
        $sql = 'INSERT INTO activities(owner_id, type, date) VALUES(:owner_id, :type, now())';
        $query = $connexion->prepare($sql);
        $query->bindValue(':owner_id', $user['id']);
        $query->bindValue(':type', 'inscription');
        $query->execute();
            
        echo json_encode($user);
    
    } else {
        echo json_encode($errors);
    }

?>