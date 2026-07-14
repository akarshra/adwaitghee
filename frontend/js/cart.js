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

// Global functions for inline html button triggers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
