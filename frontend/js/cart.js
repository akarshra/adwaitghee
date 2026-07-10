/* E-commerce Cart, Wishlist, and Recently Viewed States */

// Constants
const GST_PERCENTAGE = 0.05; // 5% GST on Ghee in India
const COUPONS = {
  'PURE20': 0.20,  // 20% off
  'BILONA10': 0.10, // 10% off
  'AKARSH10': 0.10  // 10% off
};

// Initialize State
let cart = JSON.parse(localStorage.getItem('adwait_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('adwait_wishlist')) || [];
let recentlyViewed = JSON.parse(localStorage.getItem('adwait_recently_viewed')) || [];

document.addEventListener('DOMContentLoaded', () => {
  updateCartCounters();
  initCartDrawer();
  
  // Bind dynamic add-to-cart clicks
  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-trigger')) {
      const btn = e.target;
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));
      const weight = btn.getAttribute('data-weight') || '1kg';
      const img = btn.getAttribute('data-image') || 'images/ghee_jar.jpg?v=3';
      
      addToCart({ id, name, price, weight, img, quantity: 1 });
    }
    
    if (e.target.classList.contains('wishlist-trigger')) {
      const btn = e.target;
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      toggleWishlist(id, name);
    }
  });

  // Render cart page if we are on cart.html
  if (window.location.pathname.includes('cart.html')) {
    renderCartPage();
  }
});

/* 1. Cart Management */
function addToCart(item) {
  const existingItemIndex = cart.findIndex(c => c.id === item.id && c.weight === item.weight);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  saveCart();
  updateCartCounters();
  renderCartDrawerItems();
  openCartDrawer();
  
  if (window.showSuccessPopup) {
    window.showSuccessPopup(`Added ${item.name} (${item.weight}) to cart.`);
  }
}

function removeFromCart(id, weight) {
  cart = cart.filter(c => !(c.id === id && c.weight === weight));
  saveCart();
  updateCartCounters();
  renderCartDrawerItems();
  
  if (window.location.pathname.includes('cart.html')) {
    renderCartPage();
  }
}

function updateQuantity(id, weight, delta) {
  const item = cart.find(c => c.id === id && c.weight === weight);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(id, weight);
    } else {
      saveCart();
      updateCartCounters();
      renderCartDrawerItems();
      if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
      }
    }
  }
}

function saveCart() {
  localStorage.setItem('adwait_cart', JSON.stringify(cart));
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartCounters();
}

function getCartSubtotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCalculations() {
  const subtotal = getCartSubtotal();
  const couponCode = sessionStorage.getItem('applied_coupon') || '';
  const discountRate = COUPONS[couponCode.toUpperCase()] || 0;
  const discountAmount = subtotal * discountRate;
  
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = taxableAmount * GST_PERCENTAGE;
  
  // Free Shipping on all orders
  const shippingCost = 0;
  const finalTotal = taxableAmount + gstAmount + shippingCost;

  return {
    subtotal,
    couponCode,
    discountAmount,
    taxableAmount,
    gstAmount,
    shippingCost,
    finalTotal
  };
}

function updateCartCounters() {
  const cartCounters = document.querySelectorAll('.cart-count');
  const totalQty = cart.reduce((qty, item) => qty + item.quantity, 0);
  
  cartCounters.forEach(counter => {
    counter.textContent = totalQty;
    counter.style.display = totalQty > 0 ? 'flex' : 'none';
  });
}

/* 2. Cart Drawer UI */
function initCartDrawer() {
  // Check if drawer exists, if not, create it
  let drawer = document.querySelector('.cart-drawer');
  let overlay = document.querySelector('.cart-overlay');
  
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <h2>Your Ritual Bag</h2>
        <button class="cart-drawer-close" style="font-size: 1.5rem; cursor: pointer; color: var(--color-dark);">✕</button>
      </div>
      <div class="cart-drawer-items"></div>
      <div class="cart-drawer-footer">
        <div class="cart-drawer-totals">
          <span>Subtotal</span>
          <span class="drawer-subtotal">₹0.00</span>
        </div>
        <p style="font-size: 0.8rem; color: #777; margin-bottom: 1rem;">Taxes and shipping calculated at checkout.</p>
        <a href="cart.html" class="btn btn-outline-gold" style="width: 100%; margin-bottom: 0.5rem; text-align: center;">View Cart</a>
        <a href="checkout.html" class="btn btn-primary" style="width: 100%; text-align: center;">Proceed to Checkout</a>
      </div>
    `;
    
    overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    
    document.body.appendChild(drawer);
    document.body.appendChild(overlay);
    
    // Close events
    const closeBtn = drawer.querySelector('.cart-drawer-close');
    closeBtn.addEventListener('click', closeCartDrawer);
    overlay.addEventListener('click', closeCartDrawer);
  }

  // Bind Header Cart icon clicks
  const cartIconBtn = document.querySelector('.cart-toggle');
  if (cartIconBtn) {
    cartIconBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  renderCartDrawerItems();
}

function openCartDrawer() {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-overlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeCartDrawer() {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function renderCartDrawerItems() {
  const container = document.querySelector('.cart-drawer-items');
  const drawerSubtotal = document.querySelector('.drawer-subtotal');
  
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--spacing-lg) 0;">
        <p style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-dark); margin-bottom: 1rem;">Your bag is currently empty.</p>
        <a href="shop.html" class="btn btn-outline-gold">Explore Store</a>
      </div>
    `;
    if (drawerSubtotal) drawerSubtotal.textContent = '₹0.00';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-drawer-item">
      <img src="${item.img}" alt="${item.name}" class="cart-drawer-item-img">
      <div class="cart-drawer-item-details">
        <h4 class="cart-drawer-item-title">${item.name}</h4>
        <p class="cart-drawer-item-weight">Weight: ${item.weight}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
          <div class="cart-drawer-qty">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', '${item.weight}', -1)">-</button>
            <span style="font-weight: 500;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', '${item.weight}', 1)">+</button>
          </div>
          <span style="font-weight: 600; color: var(--color-dark);">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  `).join('');

  if (drawerSubtotal) {
    drawerSubtotal.textContent = `₹${getCartSubtotal().toLocaleString('en-IN')}`;
  }
}

/* 3. Wishlist Management */
function toggleWishlist(id, name) {
  const index = wishlist.indexOf(id);
  if (index > -1) {
    wishlist.splice(index, 1);
    if (window.showSuccessPopup) {
      window.showSuccessPopup(`Removed ${name} from Wishlist.`);
    }
  } else {
    wishlist.push(id);
    if (window.showSuccessPopup) {
      window.showSuccessPopup(`Added ${name} to Wishlist.`);
    }
  }
  localStorage.setItem('adwait_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
}

function updateWishlistUI() {
  const wishlistTriggers = document.querySelectorAll('.wishlist-trigger');
  wishlistTriggers.forEach(btn => {
    const id = btn.getAttribute('data-id');
    if (wishlist.includes(id)) {
      btn.classList.add('active');
      btn.style.color = 'var(--color-primary)';
      btn.innerHTML = '♥';
    } else {
      btn.classList.remove('active');
      btn.style.color = 'inherit';
      btn.innerHTML = '♡';
    }
  });
}

/* 4. Recently Viewed Tracking */
function trackRecentlyViewed(id, name, price, img) {
  recentlyViewed = recentlyViewed.filter(item => item.id !== id);
  recentlyViewed.unshift({ id, name, price, img });
  if (recentlyViewed.length > 4) {
    recentlyViewed.pop(); // Keep only last 4 items
  }
  localStorage.setItem('adwait_recently_viewed', JSON.stringify(recentlyViewed));
}

/* 5. Cart Page Render (cart.html specific) */
function renderCartPage() {
  const cartGrid = document.querySelector('#cart-page-grid');
  if (!cartGrid) return;

  if (cart.length === 0) {
    cartGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-xl) 0;">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1rem;">Your Ayurvedic Ritual Bag is Empty</h2>
        <p style="margin-bottom: 2rem; color: #777;">Return to the store to invite the golden elixir of health into your kitchen.</p>
        <a href="shop.html" class="btn btn-primary">Return to Shop</a>
      </div>
    `;
    return;
  }

  const calcs = getCartCalculations();

  let htmlContent = `
    <!-- Cart Items list -->
    <div class="cart-items-column" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
      <h2 style="font-family: var(--font-serif); border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; margin-bottom: 1rem;">Items In Your Bag</h2>
  `;

  htmlContent += cart.map(item => `
    <div class="cart-page-item">
      <img src="${item.img}" alt="${item.name}" class="cart-page-item-img">
      
      <div class="cart-page-item-info">
        <h3 class="cart-page-item-title">${item.name}</h3>
        <p class="cart-page-item-weight">Packaging: ${item.weight}</p>
        
        <div class="cart-page-item-actions">
          <div class="cart-drawer-qty">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', '${item.weight}', -1)">-</button>
            <span style="font-weight: 500;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', '${item.weight}', 1)">+</button>
          </div>
          <button onclick="removeFromCart('${item.id}', '${item.weight}')" class="cart-page-item-remove">Remove</button>
        </div>
      </div>
      
      <div class="cart-page-item-price-block">
        <span class="cart-page-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
      </div>
    </div>
  `).join('');

  htmlContent += `
    </div>
    <!-- Cart Summary column -->
    <div class="cart-summary-column" style="background: white; border: 1px solid var(--color-border); border-radius: var(--border-radius-md); padding: var(--spacing-lg); height: fit-content; box-shadow: var(--shadow-premium);">
      <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; color: var(--color-dark);">Order Summary</h3>
      
      <!-- Free Shipping visual tracker -->
      <div style="background: #f4faf6; border: 1px solid #d4ecd9; border-radius: var(--border-radius-md); padding: 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">🚚</span>
        <div>
          <p style="margin: 0; font-size: 0.85rem; color: #27803B; font-weight: 600;">You qualify for FREE Delivery!</p>
          <p style="margin: 0; font-size: 0.75rem; color: #666;">Complimentary Express Shipping across India.</p>
        </div>
      </div>

      <!-- Promo coupon field -->
      <div style="margin-bottom: 1.5rem;">
        <label class="form-label" style="font-size: 0.85rem; color: var(--color-dark); font-weight: 600; display: block; margin-bottom: 0.4rem;">Apply Gift Coupon</label>
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="coupon-code-input" class="form-control" placeholder="e.g. PURE20" value="${calcs.couponCode}" style="border-radius: var(--border-radius-full); padding: 0.6rem 1rem; border: 1px solid rgba(56, 9, 1, 0.15); width: 100%; outline: none; font-size: 0.9rem;">
          <button onclick="applyCouponCode()" class="btn btn-outline-gold" style="padding: 0.6rem 1.2rem; border-radius: var(--border-radius-full); font-size: 0.9rem; cursor: pointer;">Apply</button>
        </div>
        ${calcs.couponCode ? `<p style="font-size: 0.8rem; color: #27803B; margin-top: 0.4rem; font-weight: 500;">✓ Coupon "${calcs.couponCode}" applied successfully!</p>` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Subtotal</span>
          <span style="font-weight: 500; color: var(--color-dark);">₹${calcs.subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${calcs.discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #27803B; font-weight: 500;">
          <span>Discount Applied</span>
          <span>- ₹${calcs.discountAmount.toLocaleString('en-IN')}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">GST (5% tax)</span>
          <span style="font-weight: 500; color: var(--color-dark);">₹${calcs.gstAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Shipping (Pan-India)</span>
          <span>${calcs.shippingCost === 0 ? '<span style="color: #27803B; font-weight: 600; font-size: 0.85rem; letter-spacing: 0.05em;">FREE</span>' : `₹${calcs.shippingCost}`}</span>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.3rem; margin-bottom: 1.5rem; color: var(--color-dark);">
        <span>Total</span>
        <span>₹${Math.round(calcs.finalTotal).toLocaleString('en-IN')}</span>
      </div>

      <a href="checkout.html" class="btn btn-primary" style="width: 100%; text-align: center; font-size: 1.05rem; display: block; padding: 0.8rem 1rem;">Proceed to Checkout</a>
      
      <!-- Premium CSS Trust Seals Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center; margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
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
    </div>
  `;

  cartGrid.innerHTML = htmlContent;
}

function applyCouponCode() {
  const input = document.querySelector('#coupon-code-input');
  if (input) {
    const code = input.value.trim().toUpperCase();
    if (code === '') {
      sessionStorage.removeItem('applied_coupon');
      renderCartPage();
      return;
    }
    
    if (COUPONS[code] !== undefined) {
      sessionStorage.setItem('applied_coupon', code);
      renderCartPage();
      if (window.showSuccessPopup) {
        window.showSuccessPopup(`Coupon "${code}" applied!`);
      }
    } else {
      alert('Invalid Promo Code. Try "PURE20" for 20% discount.');
    }
  }
}

// Global functions for inline html button triggers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.applyCouponCode = applyCouponCode;
