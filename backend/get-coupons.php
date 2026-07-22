<?php
// Endpoint to retrieve active promo codes dynamically
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->prepare("SELECT code, discount_percent FROM coupons WHERE active = 1");
    $stmt->execute();
    $coupons = [];
    while ($row = $stmt->fetch()) {
        $coupons[$row['code']] = intval($row['discount_percent']) / 100;
    }
    
    echo json_encode([
        'success' => true,
        'coupons' => $coupons
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load promo codes: ' . $e->getMessage()
    ]);
}
?>
