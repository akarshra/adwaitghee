<?php
session_start();
// Verify session authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: index.html');
    exit();
}

require_once __DIR__ . '/backend/db.php';

// Handle logout parameter
if (isset($_GET['logout'])) {
    $_SESSION['admin_logged_in'] = false;
    session_destroy();
    header('Location: index.html');
    exit();
}

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
      background-color: #120502;
      color: #F8F5F0;
      min-height: 100vh;
      font-family: var(--font-sans);
    }
    
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(231, 180, 83, 0.2);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .admin-title {
      font-family: var(--font-display);
      font-size: 2.2rem;
      letter-spacing: 0.1em;
      color: var(--color-secondary);
    }
    
    .admin-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.5rem;
    }
    
    .admin-tab-btn {
      background: none;
      border: none;
      color: #aaa;
      padding: 0.6rem 1.2rem;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }
    
    .admin-tab-btn:hover {
      color: var(--color-primary);
      background: rgba(231, 180, 83, 0.05);
    }
    
    .admin-tab-btn.active {
      color: #120502;
      background-color: var(--color-primary);
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(231, 180, 83, 0.3);
    }
    
    .admin-panel {
      display: none;
    }
    
    .admin-panel.active {
      display: block;
      animation: fadeIn 0.4s ease forwards;
    }
    
    .admin-card {
      background: rgba(30, 15, 12, 0.6);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(231, 180, 83, 0.15);
      border-radius: var(--border-radius-md);
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    
    .admin-table th {
      border-bottom: 1px solid rgba(231, 180, 83, 0.3);
      padding: 1rem;
      color: var(--color-primary);
      font-family: var(--font-serif);
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    
    .admin-table td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1rem;
      vertical-align: middle;
    }
    
    .admin-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(231, 180, 83, 0.2);
      border-radius: var(--border-radius-sm);
      color: #fff;
      padding: 0.5rem 0.8rem;
      font-size: 0.9rem;
      width: 100%;
      max-width: 150px;
      transition: all 0.2s ease;
    }
    
    .admin-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 10px rgba(231, 180, 83, 0.2);
    }
    
    .btn-admin {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .btn-admin-save {
      background: var(--color-primary);
      border: 1px solid var(--color-primary);
      color: #120502;
    }
    
    .btn-admin-save:hover {
      background: #dfaa3e;
      transform: translateY(-2px);
    }
    
    .btn-admin-delete {
      background: rgba(220, 53, 69, 0.15);
      border: 1px solid rgba(220, 53, 69, 0.5);
      color: #ff6b76;
      margin-left: 0.5rem;
    }
    
    .btn-admin-delete:hover {
      background: #dc3545;
      color: #fff;
    }
    
    .btn-admin-toggle {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ddd;
    }
    
    .btn-admin-toggle.active {
      background: rgba(40, 167, 69, 0.15);
      border-color: rgba(40, 167, 69, 0.5);
      color: #2fed64;
    }
    
    .btn-admin-toggle:hover {
      border-color: var(--color-primary);
    }
    
    .logout-link {
      color: #ff6b76;
      text-decoration: none;
      font-size: 0.95rem;
      border: 1px solid rgba(255, 107, 118, 0.2);
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }
    
    .logout-link:hover {
      background: rgba(255, 107, 118, 0.1);
      border-color: #ff6b76;
    }
    
    .status-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
    }
    
    .status-pending {
      background: rgba(231, 180, 83, 0.15);
      color: var(--color-primary);
      border: 1px solid rgba(231, 180, 83, 0.3);
    }
    
    .status-paid {
      background: rgba(40, 167, 69, 0.15);
      color: #2fed64;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }
    
    .status-failed {
      background: rgba(220, 53, 69, 0.15);
      color: #ff6b76;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }
    
    .order-items-list {
      margin: 0.5rem 0 0 0;
      padding-left: 1.2rem;
      font-size: 0.8rem;
      color: #ccc;
    }
  </style>
</head>
<body>

  <div class="admin-container">
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Adwait Dashboard</h1>
        <p style="font-size: 0.9rem; color: #aaa; margin-top: 0.25rem;">Secure Vedic Store Administration Panel</p>
      </div>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <a href="index.html" class="logout-link" style="color: var(--color-primary); border-color: rgba(231, 180, 83, 0.3); font-weight: 500;">← Back to Website</a>
        <a href="admin.php?logout=1" class="logout-link">Sign Out</a>
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
    
    <!-- Tab 2: Promo Codes Panel -->
    <div id="coupons-panel" class="admin-panel">
      <div class="admin-card" style="margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Create New Promo Code</h2>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
          <div style="flex: 1; min-width: 200px;">
            <label style="font-size: 0.8rem; color: #aaa; display: block; margin-bottom: 0.4rem;">Promo Code (e.g. GOLD30)</label>
            <input type="text" class="admin-input" id="new-coupon-code" style="max-width: 100%; text-transform: uppercase;" placeholder="PROMOCODE">
          </div>
          <div style="flex: 1; min-width: 200px;">
            <label style="font-size: 0.8rem; color: #aaa; display: block; margin-bottom: 0.4rem;">Discount Percentage (%)</label>
            <input type="number" class="admin-input" id="new-coupon-discount" style="max-width: 100%;" min="1" max="100" placeholder="25">
          </div>
          <button class="btn-admin btn-admin-save" style="padding: 0.7rem 1.5rem;" onclick="addCoupon()">Create Promo Code</button>
        </div>
      </div>
      
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Active Promos List</h2>
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
    
    <!-- Tab 3: Recent Orders Panel -->
    <div id="orders-panel" class="admin-panel">
      <div class="admin-card">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1.5rem; color: var(--color-primary);">Transaction & Order Log</h2>
        <div style="overflow-x: auto;">
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
        <div style="overflow-x: auto;">
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
  </script>
</body>
</html>
