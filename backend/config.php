<?php
// Adwait Pure Desi Ghee E-commerce Backend Configuration

// Database Credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'adwait_db');

// Razorpay API Credentials (Test Mode by default)
define('RAZORPAY_KEY_ID', 'rzp_test_adwaitBrandKey123');
define('RAZORPAY_KEY_SECRET', 'testSecretKeyXYZ123abc');

// Enable Error Reporting for Debugging (set to false in production)
define('DEBUG_MODE', true);

if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}
?>
