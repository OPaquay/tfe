
<?php header('Access-Control-Allow-Origin: *'); ?>

<?php

    include_once('initialization.php');

    /*set_time_limit(0);
    ini_set('upload_max_filesize', '900M');
    ini_set('post_max_size', '900M');
    ini_set('max_input_time', 4000); // Play with the values
    ini_set('max_execution_time', 4000);*/

    $userId = $_POST['userId'];
    $new_image_name = $userId . "-profilePict.jpg";

    if($_FILES['file'] != '') {
        move_uploaded_file($_FILES["file"]["tmp_name"], "upload/".$new_image_name);
        
        $sql = 'UPDATE users SET pict_src = :pict_src WHERE id = :user_id';
        $query = $connexion->prepare($sql);
        $query->bindValue(':pict_src', $new_image_name);
        $query->bindValue(':user_id', $userId);
        $query->execute();
    } else {
        echo "File is empty";
    }

    echo $new_image_name;


?>