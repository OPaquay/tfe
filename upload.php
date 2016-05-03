
<?php header('Access-Control-Allow-Origin: *'); ?>

<?php
    $uploads_dir = 'http://www.oliviapaquay.be/dropit/upload/';

    move_uploaded_file($_FILES["file"]["tmp_name"], $uploads_dir . $_FILES["file"]['name']);


?>