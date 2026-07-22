<?php
// Secure Admin Actions API Controller
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access']);
    exit();
}

require_once __DIR__ . '/db.php';

$inputData = json_decode(file_get_contents('php://input'), true);
$action = filter_var($inputData['action'] ?? '', FILTER_DEFAULT);

if (!$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action required.']);
    exit();
}

try {
    switch ($action) {
        case 'update_stock':
            $product_id = filter_var($inputData['product_id'] ?? '', FILTER_DEFAULT);
            $stock = intval($inputData['stock'] ?? 0);
            
            if (!$product_id) {
                throw new Exception('Product ID required.');
            }
            
            $stmt = $pdo->prepare("UPDATE inventory SET stock = :stock WHERE product_id = :product_id");
            $stmt->execute([':stock' => $stock, ':product_id' => $product_id]);
            echo json_encode(['success' => true, 'message' => 'Stock updated successfully.']);
            break;
            
        case 'update_price':
            $product_id = filter_var($inputData['product_id'] ?? '', FILTER_DEFAULT);
            $price = floatval($inputData['price'] ?? 0);
            
            if (!$product_id) {
                throw new Exception('Product ID required.');
            }
            
            $stmt = $pdo->prepare("UPDATE inventory SET price = :price WHERE product_id = :product_id");
            $stmt->execute([':price' => $price, ':product_id' => $product_id]);
            echo json_encode(['success' => true, 'message' => 'Price updated successfully.']);
            break;
            
        case 'add_coupon':
            $code = strtoupper(filter_var($inputData['code'] ?? '', FILTER_DEFAULT));
            $discount_percent = intval($inputData['discount_percent'] ?? 0);
            
            if (!$code || $discount_percent <= 0 || $discount_percent > 100) {
                throw new Exception('Invalid coupon code or discount percentage.');
            }
            
            $stmt = $pdo->prepare("INSERT INTO coupons (code, discount_percent, active) VALUES (:code, :discount_percent, 1)");
            $stmt->execute([':code' => $code, ':discount_percent' => $discount_percent]);
            echo json_encode(['success' => true, 'message' => 'Coupon added successfully.']);
            break;
            
        case 'toggle_coupon':
            $code = strtoupper(filter_var($inputData['code'] ?? '', FILTER_DEFAULT));
            $active = intval($inputData['active'] ?? 0) ? 1 : 0;
            
            if (!$code) {
                throw new Exception('Coupon code required.');
            }
            
            $stmt = $pdo->prepare("UPDATE coupons SET active = :active WHERE code = :code");
            $stmt->execute([':active' => $active, ':code' => $code]);
            echo json_encode(['success' => true, 'message' => 'Coupon active state toggled.']);
            break;
            
        case 'delete_coupon':
            $code = strtoupper(filter_var($inputData['code'] ?? '', FILTER_DEFAULT));
            
            if (!$code) {
                throw new Exception('Coupon code required.');
            }
            
            $stmt = $pdo->prepare("DELETE FROM coupons WHERE code = :code");
            $stmt->execute([':code' => $code]);
            echo json_encode(['success' => true, 'message' => 'Coupon deleted successfully.']);
            break;
            
        case 'delete_inquiry':
            $inquiry_id = intval($inputData['id'] ?? 0);
            
            if ($inquiry_id <= 0) {
                throw new Exception('Inquiry ID required.');
            }
            
            $stmt = $pdo->prepare("DELETE FROM inquiries WHERE id = :id");
            $stmt->execute([':id' => $inquiry_id]);
            echo json_encode(['success' => true, 'message' => 'Inquiry deleted successfully.']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
