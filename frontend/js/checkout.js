// Reset coupon on checkout page load/refresh to ensure manual input only
localStorage.removeItem('applied_coupon');
sessionStorage.removeItem('applied_coupon');

document.addEventListener('DOMContentLoaded', () => {
  // Validate cart is not empty
  const cartData = JSON.parse(localStorage.getItem('adwait_cart')) || [];
  if (cartData.length === 0 && window.location.pathname.includes('checkout.html')) {
    alert('Your bag is empty! Redirecting to shop.');
    window.location.href = 'shop.html';
    return;
  }

  initCheckoutPage();
  initShiprocketPincodeCheck();
  initCheckoutFormValidation();
  initCodToggle();
});

function initCodToggle() {
  const cityInput = document.querySelector('#city');
  const codContainer = document.querySelector('#cod-payment-container');

  window.updateCodAvailability = function() {
    if (!cityInput || !codContainer) return;
    const cityValue = cityInput.value.trim().toLowerCase();
    
    if (cityValue === 'mumbai') {
      codContainer.style.display = 'flex';
    } else {
      codContainer.style.display = 'none';
      const codRadio = document.querySelector('#pay-cod');
      if (codRadio && codRadio.checked) {
        document.querySelector('#pay-online').checked = true;
      }
    }
  };

  if (cityInput) {
    cityInput.addEventListener('input', window.updateCodAvailability);
  }
  
  // Run check initially
  window.updateCodAvailability();
}

/* 1. Compile Checkout Totals */
function initCheckoutPage() {
  const summaryBox = document.querySelector('#checkout-summary-box');
  if (!summaryBox) return;

  const cartData = JSON.parse(localStorage.getItem('adwait_cart')) || [];
  const calcs = getCartCalculationsFromStore(cartData);

  summaryBox.innerHTML = `
    <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; color: var(--color-dark);">Your Order</h3>
    
    <!-- Free Shipping tracker -->
    <div style="background: #f4faf6; border: 1px solid #d4ecd9; border-radius: var(--border-radius-md); padding: 0.8rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
      <span style="font-size: 1.25rem;">🚚</span>
      <div>
        <p style="margin: 0; font-size: 0.8rem; color: #27803B; font-weight: 600;">You qualify for FREE Delivery!</p>
      </div>
    </div>

    <!-- Item List -->
    <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-height: 250px; overflow-y: auto; padding-right: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem;">
      ${cartData.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <img src="${item.img}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(231,180,83,0.15); background: var(--color-bg);">
            <div>
              <p style="font-weight: 600; color: var(--color-dark); margin: 0; font-size: 0.9rem;">${item.name}</p>
              <p style="font-size: 0.75rem; color: #777; margin: 0.1rem 0 0 0;">${item.weight} × ${item.quantity}</p>
            </div>
          </div>
          <span style="font-weight: 600; color: var(--color-dark);">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
        </div>
      `).join('')}
    </div>

    <!-- Promo Code Form -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <input type="text" id="checkout-coupon-input" placeholder="Promo Code" value="${calcs.couponCode}" style="flex-grow: 1; padding: 0.6rem 1rem; border: 1px solid rgba(56, 9, 1, 0.15); border-radius: var(--border-radius-full); font-size: 0.85rem; text-transform: uppercase; outline: none; width: 100%;">
      <button type="button" id="checkout-coupon-btn" class="btn btn-outline-gold" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; border-radius: var(--border-radius-full); cursor: pointer;">Apply</button>
    </div>
    <div id="checkout-coupon-feedback" style="font-size: 0.75rem; margin-top: -0.75rem; margin-bottom: 0.75rem; display: none; font-weight: 500;"></div>

    <!-- Summary Details -->
    <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem; margin-bottom: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666;">Subtotal</span>
        <span style="font-weight: 500; color: var(--color-dark);">₹${calcs.subtotal.toLocaleString('en-IN')}</span>
      </div>
      ${calcs.discountAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; color: #27803B; font-weight: 500;">
        <span>Discount (${calcs.couponCode})</span>
        <span>- ₹${calcs.discountAmount.toLocaleString('en-IN')}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666;">GST (5% tax)</span>
        <span style="font-weight: 500; color: var(--color-dark);">₹${calcs.gstAmount.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666;">Shipping (Pan-India)</span>
        <span id="summary-shipping-price">${calcs.shippingCost === 0 ? '<span style="color: #27803B; font-weight: 600; font-size: 0.85rem; letter-spacing: 0.05em;">FREE</span>' : `₹${calcs.shippingCost}`}</span>
      </div>
    </div>
    
    <!-- Total -->
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.3rem; color: var(--color-dark); margin-bottom: 1.5rem;">
      <span>Final Total</span>
      <span id="summary-final-total">₹${Math.round(calcs.finalTotal).toLocaleString('en-IN')}</span>
    </div>

    <!-- Premium CSS Trust Seals Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center; border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
      <div>
        <div style="font-size: 1.4rem; margin-bottom: 0.25rem;">🔒</div>
        <p style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-dark); margin: 0 0 0.1rem 0;">100% Secure</p>
        <p style="font-size: 0.55rem; color: #777; margin: 0; line-height: 1.2;">Razorpay Secure</p>
      </div>
      <div>
        <div style="font-size: 1.4rem; margin-bottom: 0.25rem;">🌱</div>
        <p style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-dark); margin: 0 0 0.1rem 0;">Pure A2</p>
        <p style="font-size: 0.55rem; color: #777; margin: 0; line-height: 1.2;">Gir Cow Curd</p>
      </div>
      <div>
        <div style="font-size: 1.4rem; margin-bottom: 0.25rem;">🍯</div>
        <p style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-dark); margin: 0 0 0.1rem 0;">Traditional</p>
        <p style="font-size: 0.55rem; color: #777; margin: 0; line-height: 1.2;">Vedic Bilona</p>
      </div>
    </div>
  `;

  // Attach listener only once
  if (!summaryBox.dataset.listenerAttached) {
    summaryBox.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'checkout-coupon-btn') {
        const input = document.getElementById('checkout-coupon-input');
        const feedback = document.getElementById('checkout-coupon-feedback');
        if (!input || !feedback) return;
        
        const code = input.value.trim().toUpperCase();
        if (code === '') {
          feedback.style.display = 'block';
          feedback.style.color = '#a94442';
          feedback.textContent = 'Please enter a coupon code.';
          return;
        }

        const COUPONS = { 'PURE20': 0.20, 'BILONA10': 0.10, 'AKARSH10': 0.10 };
        if (COUPONS.hasOwnProperty(code)) {
          // Clear old localStorage to prevent auto-fill pollution
          localStorage.removeItem('applied_coupon');
          sessionStorage.setItem('applied_coupon', code);
          feedback.style.display = 'block';
          feedback.style.color = '#27803B';
          feedback.textContent = `✓ Promo code "${code}" applied (${Math.round(COUPONS[code]*100)}% Off)!`;
          setTimeout(() => {
            initCheckoutPage();
          }, 800);
        } else {
          feedback.style.display = 'block';
          feedback.style.color = '#a94442';
          feedback.textContent = '✕ Invalid promo code. Try "PURE20".';
        }
      }
    });
    summaryBox.dataset.listenerAttached = 'true';
  }
}

function getCartCalculationsFromStore(cartData) {
  // Clear old localStorage pollution immediately on page calculations
  localStorage.removeItem('applied_coupon');
  
  const subtotal = cartData.reduce((total, item) => total + (item.price * item.quantity), 0);
  const couponCode = sessionStorage.getItem('applied_coupon') || '';
  const COUPONS = { 'PURE20': 0.20, 'BILONA10': 0.10, 'AKARSH10': 0.10 };
  const discountRate = COUPONS[couponCode.toUpperCase()] || 0;
  const discountAmount = subtotal * discountRate;
  
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = taxableAmount * 0.05;
  const shippingCost = 0;
  const finalTotal = taxableAmount + gstAmount + shippingCost;

  return { subtotal, couponCode, discountAmount, taxableAmount, gstAmount, shippingCost, finalTotal };
}

/* 2. Shiprocket Pincode Check API Mock */
function initShiprocketPincodeCheck() {
  const pincodeCheckBtn = document.querySelector('#pincode-check-btn');
  const pincodeInput = document.querySelector('#pincode');
  const shiprocketFeedback = document.querySelector('#shiprocket-feedback');

  if (!pincodeCheckBtn || !pincodeInput || !shiprocketFeedback) return;

  pincodeCheckBtn.addEventListener('click', () => {
    const pin = pincodeInput.value.trim();
    
    // Clear previous
    shiprocketFeedback.style.display = 'none';
    shiprocketFeedback.className = '';
    shiprocketFeedback.innerHTML = '';

    if (!/^\d{6}$/.test(pin)) {
      shiprocketFeedback.style.display = 'block';
      shiprocketFeedback.className = 'error-feedback';
      shiprocketFeedback.innerHTML = '<span style="color: #a94442;">✕ Invalid Indian Pin Code. Must be exactly 6 digits.</span>';
      return;
    }

    // Simulate API call loading
    pincodeCheckBtn.textContent = 'Checking...';
    pincodeCheckBtn.disabled = true;

    setTimeout(() => {
      pincodeCheckBtn.textContent = 'Check';
      pincodeCheckBtn.disabled = false;

      // Mock Shiprocket API Success/Failure
      // In India, pincodes ending with "000" are set to fail serviceability in our mock
      if (pin.endsWith('000')) {
        shiprocketFeedback.style.display = 'block';
        shiprocketFeedback.className = 'error-feedback';
        shiprocketFeedback.innerHTML = '<span style="color: #a94442;">✕ Sorry! Our logistics partner Shiprocket does not deliver to this pincode.</span>';
      } else {
        const deliveryDays = Math.floor(Math.random() * 3) + 3; // 3 to 5 days
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
        
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        const formattedDate = deliveryDate.toLocaleDateString('en-IN', dateOptions);

        shiprocketFeedback.style.display = 'block';
        shiprocketFeedback.className = 'success-feedback';
        shiprocketFeedback.innerHTML = `
          <span style="color: #27803B;">✓ Serviced by Shiprocket Express!</span><br>
          <small style="color: #555;">Estimated Delivery: <strong>${formattedDate}</strong> (${deliveryDays} Days)</small>
        `;
        
        // Auto fill State and City based on standard region prefixes
        const firstDigit = pin.charAt(0);
        const cityState = getMockCityState(firstDigit);
        
        const stateInput = document.querySelector('#state');
        const cityInput = document.querySelector('#city');
        
        if (stateInput && cityInput) {
          stateInput.value = cityState.state;
          cityInput.value = cityState.city;
          // Trigger COD availability check
          if (window.updateCodAvailability) window.updateCodAvailability();
        }
      }
    }, 800);
  });
}

function getMockCityState(firstDigit) {
  switch(firstDigit) {
    case '1': return { state: 'Delhi NCR', city: 'New Delhi' };
    case '2': return { state: 'Uttar Pradesh', city: 'Noida' };
    case '3': return { state: 'Rajasthan', city: 'Jaipur' };
    case '4': return { state: 'Maharashtra', city: 'Mumbai' };
    case '5': return { state: 'Karnataka', city: 'Bengaluru' };
    case '6': return { state: 'Tamil Nadu', city: 'Chennai' };
    case '7': return { state: 'West Bengal', city: 'Kolkata' };
    case '8': return { state: 'Bihar', city: 'Patna' };
    case '9': return { state: 'Jammu & Kashmir', city: 'Srinagar' };
    default: return { state: 'Maharashtra', city: 'Pune' };
  }
}

/* 3. Checkout Form Validation & Sanitation */
function initCheckoutFormValidation() {
  const form = document.querySelector('#checkout-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = [
      { id: 'first-name', label: 'First Name' },
      { id: 'last-name', label: 'Last Name' },
      { id: 'phone', label: 'Phone Number', pattern: /^\d{10}$/, error: 'Enter a valid 10-digit phone number' },
      { id: 'email', label: 'Email Address', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, error: 'Enter a valid email' },
      { id: 'address', label: 'Shipping Address' },
      { id: 'city', label: 'City' },
      { id: 'state', label: 'State' },
      { id: 'pincode', label: 'Pin Code', pattern: /^\d{6}$/, error: 'Enter a valid 6-digit pin code' }
    ];

    let isValid = true;

    // Reset error styling
    document.querySelectorAll('.error-text').forEach(el => el.remove());
    document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = 'var(--color-border)');

    fields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;

      let val = input.value.trim();
      
      // XSS Protection: Sanitize input values by stripping HTML tag patterns
      val = sanitizeInput(val);
      input.value = val;

      if (val === '') {
        isValid = false;
        showFieldError(input, `${field.label} is required`);
      } else if (field.pattern && !field.pattern.test(val)) {
        isValid = false;
        showFieldError(input, field.error || `Invalid ${field.label}`);
      }
    });

    if (isValid) {
      const selectedPayment = document.querySelector('input[name="payment-method"]:checked').value;

      // Collect billing data
      const checkoutPayload = {
        firstName: sanitizeInput(document.getElementById('first-name').value),
        lastName: sanitizeInput(document.getElementById('last-name').value),
        phone: sanitizeInput(document.getElementById('phone').value),
        email: sanitizeInput(document.getElementById('email').value),
        address: sanitizeInput(document.getElementById('address').value),
        city: sanitizeInput(document.getElementById('city').value),
        state: sanitizeInput(document.getElementById('state').value),
        pincode: sanitizeInput(document.getElementById('pincode').value),
        paymentMethod: selectedPayment
      };

      // Store billing customer details temporarily
      localStorage.setItem('checkout_customer', JSON.stringify(checkoutPayload));

      if (selectedPayment === 'cod') {
        const cartData = JSON.parse(localStorage.getItem('adwait_cart')) || [];
        const calcs = getCartCalculationsFromStore(cartData);

        // Show loading screen
        const loader = document.querySelector('.payment-loader-overlay');
        if (loader) {
          loader.querySelector('h3').textContent = 'Creating Cash on Delivery Order...';
          loader.classList.add('active');
        }

        // Send COD order to PHP backend
        fetch('backend/create-cod-order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: checkoutPayload,
            items: cartData,
            total: calcs.finalTotal,
            couponCode: sessionStorage.getItem('applied_coupon') || ''
          })
        })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          if (data.success) {
            if (window.processOrderSuccess) {
              window.processOrderSuccess(data, checkoutPayload, cartData, calcs.finalTotal);
            } else {
              window.location.href = 'thank-you.html';
            }
          } else {
            throw new Error(data.message || 'Failed to place order');
          }
        })
        .catch(err => {
          if (loader) loader.classList.remove('active');
          alert('Error placing Cash on Delivery order: ' + err.message);
        });
      } else {
        // Online Payment via Razorpay
        if (window.triggerRazorpayPayment) {
          window.triggerRazorpayPayment(checkoutPayload);
        } else {
          alert('Payment system is loading, please try again.');
        }
      }
    } else {
      // Scroll to the first error input
      const firstError = document.querySelector('.error-text');
      if (firstError) {
        firstError.previousElementSibling.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

function sanitizeInput(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, ''); // Strips all HTML brackets and attributes
}

function showFieldError(input, msg) {
  input.style.borderColor = '#a94442';
  const err = document.createElement('small');
  err.className = 'error-text';
  err.style.color = '#a94442';
  err.style.display = 'block';
  err.style.marginTop = '0.3rem';
  err.textContent = msg;
  input.parentNode.appendChild(err);
}
