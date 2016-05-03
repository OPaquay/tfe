
<?php header('Access-Control-Allow-Origin: *'); ?>

<?php

    $host = 'localhost';
    $dbname = 'dropit';
    $user = 'root';
    $password = 'root';

    session_start();
    include_once('functions.inc.php');
    include_once('config.inc.php');
    try{
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";
        $connexion = new PDO($dsn, $user, $password);
    }catch(PDOException $e){
        echo $e->getMessage();
        exit;
    }

    $errors = array();

    $username = trim(strip_tags($_POST['username']));
    $password = trim(strip_tags($_POST['password']));
    $confirm_password = trim(strip_tags($_POST['confirm-password']));

    if(strlen($username) < 3) {
        $errors['username'] = 'Votre nom d\'utilisateur doit contenir au moins 3 caractères.';
    }

    if(strlen($password) < 7) {
        $errors['password'] = 'Votre mot de passe doit contenir au moins 7 caractères.';
    } else if ($password != $confirm_password) {
        $errors['password'] = 'Les mots de passes ne correspondent pas.'
    }

    $sql = 'INSERT INTO users(username, secret) VALUES(:username, :secret)';
        $preparedStatement = $connexion->prepare($sql);
        $preparedStatement->bindValue('username', $username);
        $preparedStatement->bindValue('secret', $secret);
        $preparedStatement->execute();
    

?>




<h1>Coucou</h1>