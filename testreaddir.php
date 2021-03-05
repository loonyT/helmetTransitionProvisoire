<?php

echo 'Version PHP courante : ' . phpversion();
echo ' <br> ';
var_dump(gd_info());
echo ' <br> ';

echo "Reading ";
echo dirname(__FILE__).'/fonts/';
echo '<br>';
if ($handle = opendir(dirname(__FILE__).'/fonts/')) {

    while (false !== ($entry = readdir($handle))) {

        if ($entry != "." && $entry != "..") {

            echo "$entry <br>";
        }
    }

    closedir($handle);
}

?>