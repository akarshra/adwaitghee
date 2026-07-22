<?php
// Endpoint to handle admin authentication securely
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

$inputData = json_decode(file_get_contents('php://input'), true);
$email = filter_var($inputData['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $inputData['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing email or password fields.']);
    exit();
}

// Credentials defined by the user
$expected_email = 'info@adwaitpureghee.com';
$expected_password = 'adwaitpureghee@123';

if ($email === $expected_email && $password === $expected_password) {
    $_SESSION['admin_logged_in'] = true;
    echo json_encode(['success' => true, 'message' => 'Authentication successful.']);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password. Access denied.']);
}
?>
