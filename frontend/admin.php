<?php
session_start();

$is_logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// Handle logout parameter
if (isset($_GET['logout'])) {
    $_SESSION['admin_logged_in'] = false;
    session_destroy();
    header('Location: admin.php');
    exit();
}

// Fetch dashboard data only if authenticated
if ($is_logged_in) {
    require_once __DIR__ . '/backend/db.php';

    // Fetch KPI stats
    $revStmt = $pdo->query("SELECT SUM(total) FROM orders WHERE payment_status = 'Paid'");
    $total_revenue = floatval($revStmt->fetchColumn());

    $ordCountStmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $total_orders = intval($ordCountStmt->fetchColumn());

    $stockStmt = $pdo->query("SELECT SUM(stock) FROM inventory");
    $total_stock = intval($stockStmt->fetchColumn());

    $inqCountStmt = $pdo->query("SELECT COUNT(*) FROM inquiries");
    $total_inquiries = intval($inqCountStmt->fetchColumn());

    // 1. Fetch products inventory
    $invStmt = $pdo->prepare("SELECT * FROM inventory ORDER BY product_id");
    $invStmt->execute();
    $products = $invStmt->fetchAll();

    // 2. Fetch promo codes
    $couponStmt = $pdo->prepare("SELECT * FROM coupons ORDER BY code");
    $couponStmt->execute();
    $coupons = $couponStmt->fetchAll();

    // 3. Fetch recent 100 orders with items loaded
    $ordersStmt = $pdo->prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100");
    $ordersStmt->execute();
    $orders = $ordersStmt->fetchAll();

    $ordersWithItems = [];
    foreach ($orders as $order) {
        $itemStmt = $pdo->prepare("SELECT product_name, weight, quantity, price FROM order_items WHERE order_id = :order_id");
        $itemStmt->execute([':order_id' => $order['id']]);
        $order['items'] = $itemStmt->fetchAll();
        $ordersWithItems[] = $order;
    }

    // 4. Fetch recent 100 inquiries
    $inqStmt = $pdo->prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 100");
    $inqStmt->execute();
    $inquiries = $inqStmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard | Adwait Pure Desi Ghee</title>
  
  <link rel="stylesheet" href="css/style.css?v=52">
  <link rel="stylesheet" href="css/animations.css?v=50">
  <link rel="stylesheet" href="css/responsive.css?v=50">
  <link rel="icon" type="image/png" href="images/logo.png">
  
  <style>
    body {
      background-color: #0f0402;
      color: #F8F5F0;
      min-height: 100vh;
      font-family: var(--font-sans);
      background-image: radial-gradient(circle at 50% 15%, #250a04 0%, #0f0402 80%);
      background-attachment: fixed;
    }
    
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
    }
    
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(231, 180, 83, 0.15);
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    
    .admin-title-gradient {
      font-family: var(--font-display);
      font-size: 2.2rem;
      letter-spacing: 0.08em;
      margin: 0;
      background: linear-gradient(135deg, #FFF3DB 0%, #E7B453 50%, #B8860B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .admin-subtitle-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }
    
    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #2fed64;
      box-shadow: 0 0 10px #2fed64;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 14px #2fed64; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    
    .admin-subtitle {
      font-size: 0.85rem;
      color: #888;
      margin: 0;
    }
    
    .admin-profile-badge {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(231, 180, 83, 0.15);
      border-radius: 50px;
      padding: 0.4rem 1.2rem 0.4rem 0.4rem;
      gap: 1.2rem;
    }
    
    .admin-profile-user {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFE3AD 0%, #D4AF37 100%);
      color: #120502;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }
    
    .admin-meta {
      display: flex;
      flex-direction: column;
    }
    
    .admin-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
    }
    
    .admin-role {
      font-size: 0.7rem;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    
    /* Stats Overview Cards styling */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    
    .stat-card {
      background: rgba(30, 15, 12, 0.45);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(231, 180, 83, 0.12);
      border-radius: var(--border-radius-md);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.35);
      transition: all 0.3s cubic-bezier(0.25, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.08), transparent 60%);
      pointer-events: none;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(231, 180, 83, 0.4);
      box-shadow: 0 15px 30px rgba(212, 175, 55, 0.15), 0 5px 15px rgba(0, 0, 0, 0.4);
    }
    
    .stat-icon-wrapper {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      flex-shrink: 0;
      transition: all 0.3s ease;
    }
    
    .stat-card:hover .stat-icon-wrapper {
      background: var(--color-primary);
      color: #120502;
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
      transform: scale(1.05);
    }
    
    .stat-icon {
      width: 24px;
      height: 24px;
    }
    
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #aaa;
      margin: 0;
    }
    
    .stat-value {
      font-family: var(--font-display);
      font-size: 1.4rem;
      margin: 0.25rem 0 0 0;
      font-weight: 600;
      background: linear-gradient(135deg, #FFF3DB 0%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 0.4rem;
      border-radius: var(--border-radius-md);
      width: max-content;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .admin-tab-btn {
      background: none;
      border: none;
      color: #aaa;
      padding: 0.7rem 1.4rem;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.3, 1);
    }
    
    .admin-tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.04);
    }
    
    .admin-tab-btn.active {
      color: #120502;
      background: linear-gradient(135deg, #FFE3AD 0%, #D4AF37 100%);
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
    }
    
    .admin-panel {
      display: none;
    }
    
    @keyframes slideUpFade {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .admin-panel.active {
      display: block;
      animation: slideUpFade 0.45s cubic-bezier(0.25, 1, 0.3, 1) forwards;
    }
    
    .admin-card {
      background: rgba(30, 15, 12, 0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(231, 180, 83, 0.12);
      border-radius: var(--border-radius-md);
      padding: 2.2rem;
      margin-bottom: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }
    
    .admin-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(231, 180, 83, 0.03) 0%, transparent 100%);
      pointer-events: none;
    }
    
    .admin-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 0.9rem;
    }
    
    .admin-table th {
      border-bottom: 1px solid rgba(231, 180, 83, 0.25);
      padding: 1.2rem 1rem;
      color: var(--color-primary);
      font-family: var(--font-serif);
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.01);
    }
    
    .admin-table td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1.1rem 1rem;
      vertical-align: middle;
      color: #e5dfd5;
      transition: background-color 0.2s ease;
    }
    
    .admin-table tbody tr:hover td {
      background-color: rgba(231, 180, 83, 0.04);
      color: #fff;
    }
    
    .admin-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(231, 180, 83, 0.15);
      border-radius: var(--border-radius-sm);
      color: #fff;
      padding: 0.6rem 0.9rem;
      font-size: 0.9rem;
      width: 100%;
      max-width: 150px;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.3, 1);
    }
    
    .admin-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
      background: rgba(255, 255, 255, 0.07);
    }
    
    .btn-admin {
      padding: 0.6rem 1.2rem;
      font-size: 0.85rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.3, 1);
    }
    
    .btn-admin-save {
      background: linear-gradient(135deg, #FFE3AD 0%, #D4AF37 100%);
      border: none;
      color: #120502;
      box-shadow: 0 4px 10px rgba(212, 175, 55, 0.15);
    }
    
    .btn-admin-save:hover {
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    
    .btn-admin-delete {
      background: rgba(220, 53, 69, 0.1);
      border: 1px solid rgba(220, 53, 69, 0.4);
      color: #ff8b94;
      margin-left: 0.5rem;
    }
    
    .btn-admin-delete:hover {
      background: #dc3545;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
    
    .btn-admin-toggle {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ddd;
    }
    
    .btn-admin-toggle.active {
      background: rgba(40, 167, 69, 0.1);
      border-color: rgba(40, 167, 69, 0.4);
      color: #3efc76;
    }
    
    .btn-admin-toggle:hover {
      border-color: var(--color-primary);
    }
    
    .logout-link {
      color: #ff8b94;
      text-decoration: none;
      font-size: 0.85rem;
      border: 1px solid rgba(255, 107, 118, 0.25);
      padding: 0.5rem 1.1rem;
      border-radius: var(--border-radius-full);
      transition: all 0.3s cubic-bezier(0.25, 1, 0.3, 1);
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .logout-link:hover {
      background: rgba(255, 107, 118, 0.1);
      border-color: #ff6b76;
      color: #ff6b76;
      transform: scale(1.02);
    }
    
    .status-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
      letter-spacing: 0.05em;
    }
    
    .status-pending {
      background: rgba(231, 180, 83, 0.12);
      color: var(--color-primary);
      border: 1px solid rgba(231, 180, 83, 0.25);
    }
    
    .status-paid {
      background: rgba(40, 167, 69, 0.12);
      color: #3efc76;
      border: 1px solid rgba(40, 167, 69, 0.25);
    }
    
    .status-failed {
      background: rgba(220, 53, 69, 0.12);
      color: #ff8b94;
      border: 1px solid rgba(220, 53, 69, 0.25);
    }
    
    .order-items-list {
      margin: 0.5rem 0 0 0;
      padding-left: 1.2rem;
      font-size: 0.8rem;
      color: #ccc;
    }
    
    /* Login Page Styling */
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    
    .login-card {
      background: rgba(30, 15, 12, 0.75);
      backdrop-filter: blur(20px);
      border: 1px solid var(--color-primary);
      border-radius: var(--border-radius-md);
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: fadeIn 0.5s ease forwards;
      box-sizing: border-box;
    }
    
    .login-logo {
      display: block;
      margin: 0 auto 1.5rem auto;
      max-width: 90px;
      height: auto;
    }
    
    .login-title {
      font-family: var(--font-display);
      color: var(--color-primary);
      text-align: center;
      font-size: 1.6rem;
      margin: 0 0 0.5rem 0;
      letter-spacing: 0.1em;
    }
    
    .login-subtitle {
      text-align: center;
      color: #aaa;
      font-size: 0.85rem;
      margin: 0 0 2rem 0;
      line-height: 1.4;
    }
    
    .login-field {
      margin-bottom: 1.5rem;
      text-align: left;
    }
    
    .login-label {
      display: block;
      font-size: 0.8rem;
      color: var(--color-secondary);
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    
    .login-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(231, 180, 83, 0.3);
      border-radius: var(--border-radius-sm);
      color: #fff;
      padding: 0.8rem 1rem;
      font-size: 0.95rem;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }
    
    .login-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 12px rgba(231, 180, 83, 0.3);
      background: rgba(255, 255, 255, 0.08);
    }
    
    .btn-login {
      background: var(--color-primary);
      border: 1px solid var(--color-primary);
      color: #120502;
      font-family: var(--font-sans);
      font-weight: 600;
      padding: 0.9rem;
      font-size: 1rem;
      width: 100%;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }
    
    .btn-login:hover {
      background: #dfaa3e;
      box-shadow: 0 5px 20px rgba(231, 180, 83, 0.4);
      transform: translateY(-2px);
    }
    
    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .login-error {
      color: #ff6b76;
      background: rgba(255, 107, 118, 0.1);
      border: 1px solid rgba(255, 107, 118, 0.3);
      padding: 0.8rem;
      border-radius: var(--border-radius-sm);
      font-size: 0.85rem;
      text-align: center;
      margin-top: 1.5rem;
      display: none;
    }
    
    .back-home-link {
      display: block;
      text-align: center;
      margin-top: 1.5rem;
      color: var(--color-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.2s;
    }
    
    .back-home-link:hover {
      color: var(--color-primary);
    }

    /* Responsive Styling for Mobile / Tablets */
    .admin-header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .back-to-site-btn {
      color: var(--color-primary) !important;
      border-color: rgba(231, 180, 83, 0.3) !important;
      font-weight: 500;
    }

    .admin-table-wrapper {
      overflow-x: auto;
      width: 100%;
      -webkit-overflow-scrolling: touch;
      margin-bottom: 1rem;
    }
    
    /* Fine-tune scrollbar for premium touch */
    .admin-table-wrapper::-webkit-scrollbar {
      height: 6px;
    }
    .admin-table-wrapper::-webkit-scrollbar-thumb {
      background: rgba(212, 175, 55, 0.3);
      border-radius: var(--border-radius-full);
    }
    .admin-table-wrapper::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }

    #inventory-panel .admin-table {
      min-width: 600px;
    }
    #coupons-panel .admin-table {
      min-width: 500px;
    }
    #orders-panel .admin-table {
      min-width: 900px;
    }
    #inquiries-panel .admin-table {
      min-width: 800px;
    }

    .promo-create-form {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    
    .promo-form-group {
      flex: 1;
      min-width: 200px;
    }
    
    .promo-form-label {
      font-size: 0.8rem;
      color: #aaa;
      display: block;
      margin-bottom: 0.4rem;
    }
    
    @media (max-width: 992px) {
      .admin-container {
        padding: 1.5rem 1rem;
      }
    }
    
    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.2rem;
      }
      
      .admin-header-actions {
        width: 100%;
        justify-content: space-between;
      }
      
      .admin-title-gradient {
        font-size: 1.8rem;
      }
      
      .admin-profile-badge {
        width: 100%;
        box-sizing: border-box;
        border-radius: var(--border-radius-md);
        padding: 1rem;
        flex-direction: column;
        align-items: stretch;
        gap: 1.2rem;
      }
      
      .admin-profile-user {
        width: 100%;
      }
      
      .admin-profile-badge .admin-header-actions {
        width: 100%;
        margin-left: 0 !important;
        justify-content: space-between;
        gap: 0.8rem;
      }
      
      .admin-profile-badge .logout-link {
        flex: 1;
        text-align: center;
      }
      
      .admin-tabs {
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 0.8rem;
        margin-bottom: 1.5rem;
        gap: 0.5rem;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        max-width: 100%;
      }
      
      .admin-tab-btn {
        flex-shrink: 0;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }
      
      .admin-card {
        padding: 1.2rem;
        margin-bottom: 1.5rem;
      }

      .admin-table th, .admin-table td {
        padding: 0.8rem 0.6rem;
        font-size: 0.85rem;
      }
      
      .btn-admin {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
      }
      
      .status-badge {
        padding: 0.2rem 0.5rem;
        font-size: 0.7rem;
      }
      
      .promo-create-form {
        flex-direction: column;
        align-items: stretch;
      }
      
      .promo-form-group {
        width: 100%;
      }
      
      #coupons-panel .btn-admin-save {
        width: 100%;
        padding: 0.8rem;
      }
      
      .admin-input {
        max-width: 100%;
      }
    }
    
    @media (max-width: 480px) {
      .admin-title-gradient {
        font-size: 1.5rem;
      }
      
      .logout-link {
        font-size: 0.8rem;
        padding: 0.4rem 0.8rem;
      }
      
      .login-card {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>

  <?php if ($is_logged_in): ?>
  <div class="admin-container">
    <div class="admin-header">
      <div>
        <h1 class="admin-title-gradient">Adwait Admin Panel</h1>
        <div class="admin-subtitle-wrapper">
          <span class="status-indicator-dot"></span>
          <p class="admin-subtitle">Secure Administration • Server Time: <span id="server-time"><?= date('H:i:s') ?></span></p>
        </div>
      </div>
      <div class="admin-profile-badge">
        <div class="admin-profile-user">
          <div class="avatar-circle">AD</div>
          <div class="admin-meta">
            <span class="admin-name">Administrator</span>
            <span class="admin-role">System Root</span>
          </div>
        </div>
        <div class="admin-header-actions" style="margin-left: 1rem;">
          <a href="index.html" class="logout-link back-to-site-btn">← Website</a>
          <a href="admin.php?logout=1" class="logout-link">Sign Out</a>
        </div>
      </div>
    </div>

    <!-- Dashboard Stats KPI Overview -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="stat-info">
          <p class="stat-label">Total Revenue</p>
          <h3 class="stat-value">₹<?= number_format($total_revenue, 2) ?></h3>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        </div>
        <div class="stat-info">
          <p class="stat-label">Total Orders</p>
          <h3 class="stat-value"><?= number_format($total_orders) ?></h3>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
        </div>
        <div class="stat-info">
          <p class="stat-label">Ghee Stock Level</p>
          <h3 class="stat-value"><?= number_format($total_stock) ?> units</h3>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper">
          <svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        </div>
        <div class="stat-info">
          <p class="stat-label">Customer Leads</p>
          <h3 class="stat-value"><?= number_format($total_inquiries) ?></h3>
        </div>
      </div>
    </div>
    
    <div class="admin-tabs">
      <button class="admin-tab-btn active" onclick="switchTab(event, 'inventory')">Inventory Manager</button>
      <button class="admin-tab-btn" onclick="switchTab(event, 'coupons')">Promo Codes</button>
      <button class="admin-tab-btn" onclick="switchTab(event, 'orders')">Recent Orders</button>
      <button class="admin-tab-btn" onclick="switchTab(event, 'inquiries')">Customer Inquiries</button>
    </div>
    
    <!-- Tab 1: Inventory Panel -->
    <div id="inventory-panel" class="admin-panel active">
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Product Stock & Prices</h2>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Price (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($products as $prod): ?>
              <tr>
                <td style="font-family: monospace; font-weight: bold;"><?= htmlspecialchars($prod['product_id']) ?></td>
                <td><?= htmlspecialchars($prod['product_name']) ?></td>
                <td>
                  <input type="number" class="admin-input" id="stock-<?= htmlspecialchars($prod['product_id']) ?>" value="<?= intval($prod['stock']) ?>" min="0">
                </td>
                <td>
                  <input type="number" class="admin-input" id="price-<?= htmlspecialchars($prod['product_id']) ?>" value="<?= floatval($prod['price']) ?>" min="1">
                </td>
                <td>
                  <button class="btn-admin btn-admin-save" onclick="updateInventory('<?= htmlspecialchars($prod['product_id']) ?>')">Save Changes</button>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Tab 2: Promo Codes Panel -->
    <div id="coupons-panel" class="admin-panel">
      <div class="admin-card" style="margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Create New Promo Code</h2>
        <div class="promo-create-form">
          <div class="promo-form-group">
            <label class="promo-form-label">Promo Code (e.g. GOLD30)</label>
            <input type="text" class="admin-input" id="new-coupon-code" style="text-transform: uppercase;" placeholder="PROMOCODE">
          </div>
          <div class="promo-form-group">
            <label class="promo-form-label">Discount Percentage (%)</label>
            <input type="number" class="admin-input" id="new-coupon-discount" min="1" max="100" placeholder="25">
          </div>
          <button class="btn-admin btn-admin-save" style="padding: 0.7rem 1.5rem;" onclick="addCoupon()">Create Promo Code</button>
        </div>
      </div>
      
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Active Promos List</h2>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Promo Code</th>
                <th>Discount Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($coupons as $coup): ?>
              <tr id="coupon-row-<?= htmlspecialchars($coup['code']) ?>">
                <td style="font-family: monospace; font-size: 1.1rem; font-weight: bold; color: var(--color-primary);"><?= htmlspecialchars($coup['code']) ?></td>
                <td><?= intval($coup['discount_percent']) ?>% OFF</td>
                <td>
                  <button class="btn-admin btn-admin-toggle <?= $coup['active'] ? 'active' : '' ?>" onclick="toggleCoupon('<?= htmlspecialchars($coup['code']) ?>', <?= $coup['active'] ? 0 : 1 ?>)">
                    <?= $coup['active'] ? 'Active' : 'Disabled' ?>
                  </button>
                </td>
                <td>
                  <button class="btn-admin btn-admin-delete" onclick="deleteCoupon('<?= htmlspecialchars($coup['code']) ?>')">Remove</button>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Tab 3: Recent Orders Panel -->
    <div id="orders-panel" class="admin-panel">
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Transaction & Order Log</h2>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer Name</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Total Bill</th>
                <th>Purchased Items</th>
                <th>Date Placed</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($ordersWithItems)): ?>
              <tr>
                <td colspan="7" style="text-align: center; color: #888; padding: 2rem;">No orders found.</td>
              </tr>
              <?php endif; ?>
              <?php foreach ($ordersWithItems as $ord): ?>
              <tr>
                <td style="font-family: monospace; font-weight: bold;"><?= htmlspecialchars($ord['order_ref']) ?></td>
                <td>
                  <strong><?= htmlspecialchars($ord['first_name'] . ' ' . $ord['last_name']) ?></strong><br>
                  <span style="font-size: 0.75rem; color: #888;"><?= htmlspecialchars($ord['email']) ?> | <?= htmlspecialchars($ord['phone']) ?></span>
                </td>
                <td><?= htmlspecialchars($ord['payment_method']) ?></td>
                <td>
                  <span class="status-badge status-<?= strtolower($ord['payment_status']) ?>">
                    <?= htmlspecialchars($ord['payment_status']) ?>
                  </span>
                </td>
                <td style="font-weight: bold;">₹<?= number_format($ord['total'], 2) ?></td>
                <td>
                  <ul class="order-items-list">
                    <?php foreach ($ord['items'] as $item): ?>
                    <li><?= htmlspecialchars($item['product_name']) ?> (<?= htmlspecialchars($item['weight']) ?>) × <?= intval($item['quantity']) ?></li>
                    <?php endforeach; ?>
                  </ul>
                </td>
                <td style="font-size: 0.8rem; color: #aaa;"><?= htmlspecialchars($ord['created_at']) ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Tab 4: Inquiries Panel -->
    <div id="inquiries-panel" class="admin-panel">
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Customer Leads & Inquiries</h2>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Inquiry Scope</th>
                <th>Message Content</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($inquiries)): ?>
              <tr>
                <td colspan="5" style="text-align: center; color: #888; padding: 2rem;">No inquiries received yet.</td>
              </tr>
              <?php endif; ?>
              <?php foreach ($inquiries as $inq): ?>
              <tr id="inquiry-row-<?= htmlspecialchars($inq['id']) ?>">
                <td>
                  <strong><?= htmlspecialchars($inq['name']) ?></strong><br>
                  <span style="font-size: 0.75rem; color: #888;">
                    <?= htmlspecialchars($inq['email']) ?><br>
                    <?= htmlspecialchars($inq['phone']) ?>
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 4px; background: rgba(231, 180, 83, 0.1); border: 1px solid rgba(231, 180, 83, 0.2); color: var(--color-primary); text-transform: uppercase;">
                    <?= htmlspecialchars($inq['type']) ?>
                  </span>
                </td>
                <td style="max-width: 400px; line-height: 1.4; color: #eee; font-size: 0.85rem;">
                  <?= nl2br(htmlspecialchars($inq['message'])) ?>
                </td>
                <td style="font-size: 0.8rem; color: #aaa; white-space: nowrap;"><?= htmlspecialchars($inq['created_at']) ?></td>
                <td>
                  <button class="btn-admin btn-admin-delete" onclick="deleteInquiry(<?= intval($inq['id']) ?>)">Delete</button>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Global Success Popup Container (Movable) -->
  <div class="success-popup"></div>

  <!-- Dashboard Controller Script -->
  <script>
    function switchTab(evt, tabName) {
      document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(pnl => pnl.classList.remove('active'));
      
      evt.currentTarget.classList.add('active');
      document.getElementById(`${tabName}-panel`).classList.add('active');
    }
    
    // 1. AJAX: Update Inventory (Stock & Price)
    function updateInventory(productId) {
      const stock = parseInt(document.getElementById(`stock-${productId}`).value);
      const price = parseFloat(document.getElementById(`price-${productId}`).value);
      
      if (isNaN(stock) || stock < 0 || isNaN(price) || price < 1) {
        alert("Please enter valid positive values for stock and price.");
        return;
      }
      
      // Update stock
      fetch('backend/admin-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_stock', product_id: productId, stock: stock })
      })
      .then(res => res.json())
      .then(dataStock => {
        if (!dataStock.success) throw new Error(dataStock.message);
        
        // Update price
        return fetch('backend/admin-api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_price', product_id: productId, price: price })
        });
      })
      .then(res => res.json())
      .then(dataPrice => {
        if (!dataPrice.success) throw new Error(dataPrice.message);
        showSuccessPopup("Product stock and price updated successfully!");
      })
      .catch(err => {
        alert("Failed to update inventory: " + err.message);
      });
    }
    
    // 2. AJAX: Add Promo Code
    function addCoupon() {
      const code = document.getElementById('new-coupon-code').value.trim().toUpperCase();
      const discount = parseInt(document.getElementById('new-coupon-discount').value);
      
      if (!code || isNaN(discount) || discount < 1 || discount > 100) {
        alert("Please enter a valid coupon code name and a discount percent between 1% and 100%.");
        return;
      }
      
      fetch('backend/admin-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_coupon', code: code, discount_percent: discount })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        showSuccessPopup("Promo code created successfully!");
        setTimeout(() => location.reload(), 1200);
      })
      .catch(err => {
        alert("Failed to create coupon: " + err.message);
      });
    }
    
    // 3. AJAX: Toggle Promo Active Status
    function toggleCoupon(code, newState) {
      fetch('backend/admin-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_coupon', code: code, active: newState })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        showSuccessPopup("Promo status updated!");
        setTimeout(() => location.reload(), 800);
      })
      .catch(err => {
        alert("Failed to toggle coupon status: " + err.message);
      });
    }
    
    // 4. AJAX: Delete Promo Code
    function deleteCoupon(code) {
      if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
      
      fetch('backend/admin-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_coupon', code: code })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        showSuccessPopup("Promo code deleted successfully.");
        const row = document.getElementById(`coupon-row-${code}`);
        if (row) row.remove();
      })
      .catch(err => {
        alert("Failed to delete coupon: " + err.message);
      });
    }
    
    // 5. AJAX: Delete Inquiry
    function deleteInquiry(id) {
      if (!confirm("Are you sure you want to permanently delete this inquiry?")) return;
      
      fetch('backend/admin-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_inquiry', id: id })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        showSuccessPopup("Inquiry deleted successfully.");
        const row = document.getElementById(`inquiry-row-${id}`);
        if (row) row.remove();
      })
      .catch(err => {
        alert("Failed to delete inquiry: " + err.message);
      });
    }
    
    // Simple popup feedback trigger (helper)
    function showSuccessPopup(message) {
      const popup = document.querySelector('.success-popup');
      if (popup) {
        popup.innerHTML = `<span>✓</span> <p style="margin:0; font-weight:500;">${message}</p>`;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 3500);
      }
    }

    // Live Server Time ticking clock
    function initServerTime() {
      const serverTimeEl = document.getElementById('server-time');
      if (!serverTimeEl) return;
      
      let [hours, minutes, seconds] = serverTimeEl.innerText.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        const now = new Date();
        hours = now.getHours();
        minutes = now.getMinutes();
        seconds = now.getSeconds();
      }
      
      setInterval(() => {
        seconds++;
        if (seconds >= 60) {
          seconds = 0;
          minutes++;
          if (minutes >= 60) {
            minutes = 0;
            hours = (hours + 1) % 24;
          }
        }
        
        const pad = (num) => String(num).padStart(2, '0');
        serverTimeEl.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }, 1000);
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      initServerTime();
    });
  </script>
  
  <?php else: ?>
  <!-- Render Login Page -->
  <div class="login-container">
    <div class="login-card">
      <img src="images/logo.png" alt="Adwait Ghee Logo" class="login-logo">
      <h2 class="login-title">Adwait Admin Portal</h2>
      <p class="login-subtitle">Secure Vedic Store Administration</p>
      
      <form id="admin-login-form" onsubmit="handleAdminLogin(event)">
        <div class="login-field">
          <label for="login-email" class="login-label">Email Address</label>
          <input type="email" id="login-email" class="login-input" placeholder="info@adwaitpureghee.com" required>
        </div>
        <div class="login-field">
          <label for="login-password" class="login-label">Password</label>
          <input type="password" id="login-password" class="login-input" placeholder="••••••••" required>
        </div>
        
        <button type="submit" id="login-submit-btn" class="btn-login">Access Dashboard</button>
        
        <div id="login-error-msg" class="login-error"></div>
      </form>
      
      <a href="index.html" class="back-home-link">← Back to Website</a>
    </div>
  </div>
  
  <script>
    function handleAdminLogin(event) {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');
      const errorMsg = document.getElementById('login-error-msg');
      
      if (!email || !password) return;
      
      submitBtn.innerText = 'Verifying...';
      submitBtn.disabled = true;
      errorMsg.style.display = 'none';
      
      fetch('backend/admin-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.message || 'Incorrect credentials.'); });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          submitBtn.innerText = 'Redirecting...';
          location.reload();
        } else {
          throw new Error(data.message || 'Authentication failed.');
        }
      })
      .catch(err => {
        submitBtn.innerText = 'Access Dashboard';
        submitBtn.disabled = false;
        errorMsg.innerText = err.message || 'Connection error. Please try again.';
        errorMsg.style.display = 'block';
      });
    }
  </script>
  <?php endif; ?>
</body>
</html>
