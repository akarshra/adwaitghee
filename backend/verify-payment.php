<?php
// Endpoint to verify Razorpay payment signatures securely and complete orders

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

// Accept only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

$inputData = json_decode(file_get_contents('php://input'), true);

if (!$inputData || empty($inputData['razorpay_payment_id']) || empty($inputData['razorpay_order_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bad Request: Missing payment or order reference details.']);
    exit();
}

$payment_id = filter_var($inputData['razorpay_payment_id'], FILTER_DEFAULT);
$order_id = filter_var($inputData['razorpay_order_id'], FILTER_DEFAULT);
$signature = filter_var($inputData['razorpay_signature'] ?? '', FILTER_DEFAULT);

$verified = false;

// 1. Signature Verification
if (strpos($order_id, 'order_MOCK') === 0) {
    // Auto-verify mock orders for seamless local testing
    $verified = true;
} else {
    if (empty($signature)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Bad Request: Missing payment verification signature.']);
        exit();
    }
    
    // Compute HMAC SHA256 signature
    $generated_signature = hash_hmac('sha256', $order_id . '|' . $payment_id, RAZORPAY_KEY_SECRET);
    if (hash_equals($generated_signature, $signature)) {
        $verified = true;
    }
}

if (!$verified) {
    // Fraudulent signature detected
    error_log("Razorpay Signature Verification Failed! Order: $order_id, Payment: $payment_id");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid payment signature. Security alert logged.']);
    exit();
}

// 2. Complete Order in Database
try {
    // Find the pending order
    $stmt = $pdo->prepare("SELECT id, order_ref, total, first_name, last_name, email, phone, street_address, city, state, pincode FROM orders WHERE razorpay_order_id = :order_id");
    $stmt->execute([':order_id' => $order_id]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found in database.']);
        exit();
    }

    // Start database transaction
    $pdo->beginTransaction();

    // Update payment status to Paid
    $updateStmt = $pdo->prepare("
        UPDATE orders 
        SET payment_status = 'Paid', razorpay_payment_id = :payment_id 
        WHERE id = :id
    ");
    $updateStmt->execute([
        ':payment_id' => $payment_id,
        ':id' => $order['id']
    ]);

    // Fetch order items to return in receipt response
    $itemStmt = $pdo->prepare("SELECT product_id AS id, product_name AS name, price, weight, quantity, image AS img FROM order_items WHERE order_id = :order_id");
    $itemStmt->execute([':order_id' => $order['id']]);
    $items = $itemStmt->fetchAll();

    // Check and deduct stock from inventory
    foreach ($items as $item) {
        $pid = $item['id'];
        $qty = intval($item['quantity']);
        
        $stockStmt = $pdo->prepare("SELECT stock, product_name FROM inventory WHERE product_id = :pid FOR UPDATE");
        $stockStmt->execute([':pid' => $pid]);
        $inv = $stockStmt->fetch();
        
        if (!$inv) {
            throw new Exception("Product code $pid not found in inventory.");
        }
        
        if ($inv['stock'] < $qty) {
            throw new Exception("Insufficient stock for " . $inv['product_name'] . ". Available: " . $inv['stock'] . ", requested: $qty.");
        }
        
        // Deduct stock
        $deductStmt = $pdo->prepare("UPDATE inventory SET stock = stock - :qty WHERE product_id = :pid");
        $deductStmt->execute([':qty' => $qty, ':pid' => $pid]);
    }

    $pdo->commit();

    // Send successful confirmation response
    echo json_encode([
        'success' => true,
        'orderNumber' => $order['order_ref'],
        'transactionId' => $payment_id,
        'amountPaid' => $order['total'],
        'date' => date('Y-m-d\TH:i:s\Z'),
        'customer' => [
            'firstName' => $order['first_name'],
            'lastName' => $order['last_name'],
            'email' => $order['email'],
            'phone' => $order['phone'],
            'address' => $order['street_address'],
            'city' => $order['city'],
            'state' => $order['state'],
            'pincode' => $order['pincode']
        ],
        'items' => $items
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Razorpay Success Db Commit Failure: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to finalize purchase in database. Error: ' . $e->getMessage()]);
}
?>
