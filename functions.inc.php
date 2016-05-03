<?php

function loginExists($connexion, $username){
  $query = $connexion->prepare('SELECT COUNT(*) AS total FROM users WHERE username = :username');
  $query->bindValue(':username', $username);
  $query->execute();
  if($result = $query->fetch()){
    return !empty($result['total']);
  }
  return false;
}

?>