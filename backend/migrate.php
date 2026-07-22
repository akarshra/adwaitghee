<?php
// Database Migration Script for Adwait Pure Desi Ghee E-commerce
// Setup Coupons and Inventory tables

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

try {
    // 1. Create coupons table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_percent INT NOT NULL,
            active TINYINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Create inventory table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inventory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id VARCHAR(50) NOT NULL UNIQUE,
            product_name VARCHAR(100) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2b. Create inquiries table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 3. Populate default inventory if empty
    $checkInv = $pdo->query("SELECT COUNT(*) FROM inventory");
    if ($checkInv->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO inventory (product_id, product_name, stock, price) VALUES (:pid, :pname, :stock, :price)");
        
        $stmt->execute([
            ':pid' => 'adw-500ml',
            ':pname' => 'Adwait Pure Desi Ghee (500ml)',
            ':stock' => 100,
            ':price' => 1250.00
        ]);

        $stmt->execute([
            ':pid' => 'adw-1L',
            ':pname' => 'Adwait Pure Desi Ghee (1L)',
            ':stock' => 50,
            ':price' => 2500.00
        ]);
    }

    // 4. Populate default coupons if empty
    $checkCoupons = $pdo->query("SELECT COUNT(*) FROM coupons");
    if ($checkCoupons->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO coupons (code, discount_percent, active) VALUES (:code, :discount_percent, 1)");
        
        $stmt->execute([':code' => 'PURE20', ':discount_percent' => 20]);
        $stmt->execute([':code' => 'BILONA10', ':discount_percent' => 10]);
        $stmt->execute([':code' => 'AKARSH10', ':discount_percent' => 10]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database migration completed successfully. Tables created and populated.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database migration failed: ' . $e->getMessage()
    ]);
}
?>
