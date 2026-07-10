<?php
// Endpoint to create a Razorpay Order ID on the server side

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

// Accept only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

$inputData = json_decode(file_get_contents('php://input'), true);

if (!$inputData || empty($inputData['customer']) || empty($inputData['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bad Request: Missing customer or items data.']);
    exit();
}

$customer = $inputData['customer'];
$items = $inputData['items'];

// Sanitize inputs
$first_name = filter_var($customer['firstName'] ?? '', FILTER_DEFAULT);
$last_name = filter_var($customer['lastName'] ?? '', FILTER_DEFAULT);
$phone = filter_var($customer['phone'] ?? '', FILTER_DEFAULT);
$email = filter_var($customer['email'] ?? '', FILTER_VALIDATE_EMAIL);
$street_address = filter_var($customer['address'] ?? '', FILTER_DEFAULT);
$pincode = filter_var($customer['pincode'] ?? '', FILTER_DEFAULT);
$city = filter_var($customer['city'] ?? '', FILTER_DEFAULT);
$state = filter_var($customer['state'] ?? '', FILTER_DEFAULT);

if (!$first_name || !$phone || !$email || !$street_address || !$pincode || !$city || !$state) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or missing customer fields.']);
    exit();
}

// Calculate totals server-side
$calculated_subtotal = 0;
foreach ($items as $item) {
    $calculated_subtotal += floatval($item['price']) * intval($item['quantity']);
}

// Re-evaluate discount
$discount = 0;
$couponCode = filter_var($inputData['couponCode'] ?? '', FILTER_DEFAULT);
if ($couponCode) {
    $COUPONS = [ 'PURE20' => 0.20, 'BILONA10' => 0.10, 'AKARSH10' => 0.10 ];
    $discountRate = $COUPONS[strtoupper($couponCode)] ?? 0;
    $discount = $calculated_subtotal * $discountRate;
}

$taxable = $calculated_subtotal - $discount;
$gst = $taxable * 0.05;
$shipping = 0; // Free shipping
$calculated_total = round($taxable + $gst + $shipping);

$order_ref = 'ADW-' . rand(100000, 999999);
$razorpay_order_id = '';

// Check if using default testing key
if (RAZORPAY_KEY_ID === 'rzp_test_adwaitBrandKey123') {
    // Generate Mock Razorpay Order ID for sandbox development
    $razorpay_order_id = 'order_MOCK' . substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz"), 0, 14);
} else {
    // Call Razorpay API using cURL
    $url = 'https://api.razorpay.com/v1/orders';
    $data = [
        'amount' => $calculated_total * 100, // in paisa
        'currency' => 'INR',
        'receipt' => $order_ref
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        $razorpay_order_id = $result['id'];
    } else {
        error_log("Razorpay Order API Failed. Code: $httpCode. Response: $response");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to initialize payment gateway order.']);
        exit();
    }
}

// Log pending order in database
try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_ref, first_name, last_name, phone, email, 
            street_address, pincode, city, state, 
            subtotal, discount, gst, shipping, total, 
            payment_method, payment_status, razorpay_order_id
        ) VALUES (
            :order_ref, :first_name, :last_name, :phone, :email, 
            :street_address, :pincode, :city, :state, 
            :subtotal, :discount, :gst, :shipping, :total, 
            'Online', 'Pending', :razorpay_order_id
        )
    ");

    $stmt->execute([
        ':order_ref' => $order_ref,
        ':first_name' => $first_name,
        ':last_name' => $last_name,
        ':phone' => $phone,
        ':email' => $email,
        ':street_address' => $street_address,
        ':pincode' => $pincode,
        ':city' => $city,
        ':state' => $state,
        ':subtotal' => $calculated_subtotal,
        ':discount' => $discount,
        ':gst' => $gst,
        ':shipping' => $shipping,
        ':total' => $calculated_total,
        ':razorpay_order_id' => $razorpay_order_id
    ]);

    $order_id = $pdo->lastInsertId();

    // Insert Items
    $itemStmt = $pdo->prepare("
        INSERT INTO order_items (
            order_id, product_id, product_name, price, weight, quantity, image
        ) VALUES (
            :order_id, :product_id, :product_name, :price, :weight, :quantity, :image
        )
    ");

    foreach ($items as $item) {
        $itemStmt->execute([
            ':order_id' => $order_id,
            ':product_id' => $item['id'] ?? 'adw-500ml',
            ':product_name' => $item['name'] ?? 'Adwait Pure Desi Ghee',
            ':price' => floatval($item['price']),
            ':weight' => $item['weight'] ?? '500ml',
            ':quantity' => intval($item['quantity']),
            ':image' => $item['img'] ?? 'images/ghee_jar.jpg'
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'order_id' => $razorpay_order_id,
        'order_ref' => $order_ref,
        'amount' => $calculated_total
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Razorpay Order Database Log Fail: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error while logging pending payment.']);
}
?>
