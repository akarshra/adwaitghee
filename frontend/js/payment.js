/* Razorpay Standard Checkout Integration */

// Load Razorpay library dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function triggerRazorpayPayment(customerDetails) {
  const loader = document.querySelector('.payment-loader-overlay');
  if (loader) {
    loader.classList.add('active');
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    if (loader) loader.classList.remove('active');
    alert('Failed to connect to payment gateway Razorpay. Check your internet connection.');
    return;
  }

  // Get Cart calculations
  const cartData = JSON.parse(localStorage.getItem('adwait_cart')) || [];
  
  // Create order on backend first to get a secure Razorpay order_id
  const apiBase = window.ADWAIT_API_BASE || 'backend';
  fetch(`${apiBase}/create-razorpay-order.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: customerDetails,
      items: cartData,
      couponCode: sessionStorage.getItem('applied_coupon') || ''
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to create order on server');
    return res.json();
  })
  .then(orderData => {
    if (!orderData.success) throw new Error(orderData.message || 'Order creation failed');

    // Razorpay Standard Integration Config Options
    const options = {
      key: 'rzp_test_adwaitBrandKey123', // Demo testing Key ID or dynamically set
      amount: orderData.amount * 100, 
      currency: 'INR',
      name: 'Adwait Desi Ghee',
      description: `Traditional A2 Bilona Ghee Order`,
      image: 'https://cdn.shopify.com/s/files/1/0550/2953/0798/files/adwait_logo_gold.png?v=demo',
      order_id: orderData.order_id, // Pass server-created Razorpay Order ID!
      handler: function (response) {
        // Send payment signature to backend verification endpoint
        if (loader) {
          loader.querySelector('h3').textContent = 'Verifying Payment Authenticity...';
        }
        
        const apiBase = window.ADWAIT_API_BASE || 'backend';
        fetch(`${apiBase}/verify-payment.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          })
        })
        .then(verRes => {
          if (!verRes.ok) throw new Error('Payment signature verification request failed');
          return verRes.json();
        })
        .then(verData => {
          if (verData.success) {
            processOrderSuccess(verData, customerDetails, cartData, orderData.amount);
          } else {
            throw new Error(verData.message || 'Signature mismatch');
          }
        })
        .catch(err => {
          if (loader) loader.classList.remove('active');
          alert('Security Verification Failed: ' + err.message);
        });
      },
      prefill: {
        name: `${customerDetails.firstName} ${customerDetails.lastName}`,
        email: customerDetails.email,
        contact: customerDetails.phone
      },
      notes: {
        shipping_address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pincode}`,
        shipping_partner: 'Shiprocket'
      },
      theme: {
        color: '#E7B453'
      },
      modal: {
        ondismiss: function() {
          if (loader) {
            loader.classList.remove('active');
          }
          alert('Payment was cancelled. You can try checkout again.');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      if (loader) loader.classList.remove('active');
      alert(`Payment Failed: ${response.error.description}`);
    });
    rzp.open();
  })
  .catch(err => {
    if (loader) loader.classList.remove('active');
    alert('Failed to initiate online checkout: ' + err.message);
  });
}

function processOrderSuccess(response, customer, items, total) {
  const orderReceipt = {
    orderNumber: response.orderNumber || 'ADW-' + Math.floor(100000 + Math.random() * 900000),
    transactionId: response.transactionId || 'pay_mockTransactionID456',
    amountPaid: response.amountPaid || total,
    date: response.date || new Date().toISOString(),
    customer: customer,
    items: items
  };

  // Store receipt details in localstorage to display on Thank-You page
  localStorage.setItem('last_completed_order', JSON.stringify(orderReceipt));

  // Clear Cart from storage
  localStorage.removeItem('adwait_cart');
  localStorage.removeItem('applied_coupon');
  sessionStorage.removeItem('applied_coupon');

  // Redirect to success screen
  window.location.href = 'thank-you.html';
}

// Bind to window to allow checkout.js trigger
window.triggerRazorpayPayment = triggerRazorpayPayment;
window.processOrderSuccess = processOrderSuccess; // For mock payment testing if needed
