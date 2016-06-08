<?php

    include_once('initialization.php');
    
    $contacts = json_decode($_POST['user_contacts']);
    $contacts_signin = array();

    foreach ($contacts as $contact) {
        $contact_founded = false;
        $phoneNumbers = $contact->phoneNumber;
        foreach ($phoneNumbers as $phoneNumber){
            if($phoneNumber->type == 'mobile' && $contact_founded == false){
                $numberToCheck = $phoneNumber->value;
                $sql = 'SELECT id, username FROM users WHERE mobile = :mobile';
                $query = $connexion->prepare($sql);
                $query->bindValue('mobile', $numberToCheck);
                $query->execute();
                $user_info = $query->fetch();
                
                if ($user_info != '') {
                    $contact_founded = true;
                    $user_info["contactName"] = $contact->name;
                    array_push($contacts_signin, $user_info);
                }
            }
        }
    }

    echo json_encode($contacts_signin);

?>