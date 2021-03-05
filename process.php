<?php

session_start();

// Configure your Subject Prefix and Recipient here
$subjectPrefix = '[Contact via website]';
$emailTo       = 'info@express-desk.com';
$errors = array(); // array to hold validation errors
$data   = array(); // array to pass back data

$to    = "info@express-desk.com";

function clean_text($string)
{
 $string = trim($string);
 $string = stripslashes($string);
 $string = htmlspecialchars($string);
 return $string;
}


if($_SERVER['REQUEST_METHOD'] === 'POST') {
	
	if((isset($_POST['captcha_challenge'])) && ($_POST['captcha_challenge'] == $_SESSION['captcha_text'])) {
    
	
    $name    = stripslashes(trim($_POST['name']));
    $email   = stripslashes(trim($_POST['email']));
    $subject = stripslashes(trim($_POST['subject']));
    $message = stripslashes(trim($_POST['message']));
    if (empty($name)) {
        $errors['name'] = 'Name is required.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email is invalid.';
    }
    if (empty($subject)) {
        $errors['subject'] = 'Subject is required.';
    }
    if (empty($message)) {
        $errors['message'] = 'Message is required.';
    }
	
	}
	else {
        $errors['captcha'] = 'You entered an incorrect Captcha.'; // Received:'.$_POST['captcha_challenge'].', should be: '.$_SESSION['captcha_text'];
    }
    // if there are any errors in our errors array, return a success boolean or false
    if (!empty($errors)) {
        $data['success'] = false;
        $data['errors']  = $errors;
    } else {
        $subject = "$subjectPrefix $subject";
        $body    = '
            <strong>Name: </strong>'.$name.'<br />
            <strong>Email: </strong>'.$email.'<br />
            <strong>Message: </strong>'.nl2br($message).'<br />
        ';
		
		$file_open = fopen("contact_data.csv", "a");
  $no_rows = count(file("contact_data.csv"));
  if($no_rows > 1)
  {
   $no_rows = ($no_rows - 1) + 1;
  }
  $form_data = array(
   'sr_no'  => $no_rows,
   'name'  => clean_text($name),
   'email'  => clean_text($email),
   'subject' => clean_text($subject),
   'message' => clean_text($message)
  );
  fputcsv($file_open, $form_data);
		
        // $headers  = "MIME-Version: 1.1" . PHP_EOL;
        // $headers .= "Content-type: text/html; charset=utf-8" . PHP_EOL;
        // $headers .= "Content-Transfer-Encoding: 8bit" . PHP_EOL;
        // $headers .= "Date: " . date('r', $_SERVER['REQUEST_TIME']) . PHP_EOL;
        // $headers .= "Message-ID: <" . $_SERVER['REQUEST_TIME'] . md5($_SERVER['REQUEST_TIME']) . '@' . $_SERVER['SERVER_NAME'] . '>' . PHP_EOL;
        // $headers .= "From: " . "admin@express-desk.com" . PHP_EOL;
        // $headers .= "Return-Path: $emailTo" . PHP_EOL;
        // $headers .= "Reply-To: $email" . PHP_EOL;
        // $headers .= "X-Mailer: PHP/". phpversion() . PHP_EOL;
        // $headers .= "X-Originating-IP: " . $_SERVER['SERVER_ADDR'] . PHP_EOL;
		// $CR_Mail = TRUE;
		// $CR_Mail = mail($emailTo, "=?utf-8?B?" . base64_encode($subject) . "?=", $body, $headers);
		
		
		
		   //$Subject = $subject;

   $mail_Data = "";

   $mail_Data .= "<html> \n";

   $mail_Data .= "<body> \n";
   
   $mail_Data .= $body;

   $mail_Data .= "</body> \n";

   $mail_Data .= "</HTML> \n";

 

   $headers  = "MIME-Version: 1.0 \n";

   $headers .= "Content-type: text/html; charset=iso-8859-1 \n";

   $headers .= "From: admin@express-desk.com  \n";

   $headers .= "Disposition-Notification-To: admin@express-desk.com  \n";
 
   $headers .= "Reply-To: ".$email."  \n" ;

   $CR_Mail = TRUE;

 

   $CR_Mail = @mail ($to, $Subject, $mail_Data, $headers);
		
		
		
		
		
		if ($CR_Mail === FALSE)
		{
			$data['success'] = false;
			$data['message'] = 'An error occurred while trying to send the email. <br> Please contact us by sending an email to: info@express-desk.com';
		}
		else
		{
			$data['success'] = true;
			$data['message'] = 'Congratulations. Your message has been sent successfully';
		}
	  
    }
    // return all our data to an AJAX call
    echo json_encode($data);
}



