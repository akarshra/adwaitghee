<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

// Decode input JSON
$input = json_decode(file_get_contents('php://input'), true);

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$type = isset($input['type']) ? trim($input['type']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

// Validation checks
if (empty($name) || empty($email) || empty($phone) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill out all required fields.']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO inquiries (name, email, phone, type, message) 
        VALUES (:name, :email, :phone, :type, :message)
    ");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':type' => $type,
        ':message' => $message
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Your message has been received. Our Ayurvedic log team will reply in 24 hours.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: failed to log inquiry.'
    ]);
}
?>
