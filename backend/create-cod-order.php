<?php
// Endpoint to process and save Cash on Delivery (COD) orders

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

// Accept only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

// Get POST JSON data
$inputData = json_decode(file_get_contents('php://input'), true);

if (!$inputData || empty($inputData['customer']) || empty($inputData['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bad Request: Missing customer or items data.']);
    exit();
}

$customer = $inputData['customer'];
$items = $inputData['items'];
$total = floatval($inputData['total']);

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

// Generate unique order reference (ADW-XXXXXX)
$order_ref = 'ADW-' . rand(100000, 999999);

// Calculate totals server-side to prevent client price tampering
$calculated_subtotal = 0;
foreach ($items as $item) {
    $calculated_subtotal += floatval($item['price']) * intval($item['quantity']);
}

// Re-evaluate discount
$discount = 0;
$couponCode = filter_var($inputData['couponCode'] ?? '', FILTER_DEFAULT);
if ($couponCode) {
    $discountRate = 0;
    $couponStmt = $pdo->prepare("SELECT discount_percent FROM coupons WHERE code = :code AND active = 1 LIMIT 1");
    $couponStmt->execute([':code' => strtoupper($couponCode)]);
    $couponData = $couponStmt->fetch();
    if ($couponData) {
        $discountRate = intval($couponData['discount_percent']) / 100;
    }
    $discount = $calculated_subtotal * $discountRate;
}

$taxable = $calculated_subtotal - $discount;
$gst = $taxable * 0.05;
$shipping = 0; // Standard shipping is always free
$calculated_total = $taxable + $gst + $shipping;

// Begin transaction
try {
    $pdo->beginTransaction();

    // Check and deduct inventory stock
    foreach ($items as $item) {
        $pid = $item['id'] ?? 'adw-500ml';
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

    // Insert Order
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_ref, first_name, last_name, phone, email, 
            street_address, pincode, city, state, 
            subtotal, discount, gst, shipping, total, 
            payment_method, payment_status
        ) VALUES (
            :order_ref, :first_name, :last_name, :phone, :email, 
            :street_address, :pincode, :city, :state, 
            :subtotal, :discount, :gst, :shipping, :total, 
            'COD', 'Pending'
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
        ':total' => $calculated_total
    ]);

    $order_id = $pdo->lastInsertId();

    // Insert Order Items
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

    // Send successful response
    echo json_encode([
        'success' => true,
        'orderNumber' => $order_ref,
        'transactionId' => 'COD-' . uniqid(),
        'amountPaid' => $calculated_total,
        'date' => date('Y-m-d\TH:i:s\Z')
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("COD Order Execution Fail: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to save order. Error logged.']);
}
?>
