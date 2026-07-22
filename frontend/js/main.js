/* Global Luxury UI Behaviors */

// API Configuration: Change this to your production backend URL (e.g. 'https://api.yourdomain.com/backend') when deploying
window.ADWAIT_API_BASE = 'backend';

document.addEventListener('DOMContentLoaded', () => {
  initScrollBehaviors();
  initMobileMenu();
  // initCustomCursor(); // Disabled custom cursor to restore system cursor and remove floating gold ring/dot
  initMagneticButtons();
  initLiveSearch();
  initIntersectionObserver();
  initNewsletterValidation();
  initGlobalQuickView();
  initHeroTabs();
  initDraggableTestimonials();
});

/* 1. Scroll Behaviors: Sticky Header Fallback, Scroll Progress, Back to Top */
function initScrollBehaviors() {
  const header = document.querySelector('header');
  const backToTop = document.querySelector('.back-to-top');
  
  // Create Scroll Progress Bar dynamically
  const progressContainer = document.createElement('div');
  progressContainer.id = 'scroll-progress-container';
  progressContainer.style.position = 'fixed';
  progressContainer.style.top = '0';
  progressContainer.style.left = '0';
  progressContainer.style.width = '100%';
  progressContainer.style.height = '3px';
  progressContainer.style.zIndex = '99999';
  progressContainer.style.background = 'rgba(56, 9, 1, 0.05)';
  
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress-bar';
  progressBar.style.width = '0%';
  progressBar.style.height = '100%';
  progressBar.style.backgroundColor = 'var(--color-primary, #E7B453)';
  progressBar.style.transition = 'width 0.1s ease-out';
  
  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    
    // Update scroll progress bar
    progressBar.style.width = `${scrollPercent}%`;

    // Sticky Header & Smart Scroll Hide/Reveal
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (scrollY > 150) {
      if (scrollY > lastScrollY) {
        header.classList.add('hide-nav');
      } else {
        header.classList.remove('hide-nav');
      }
    } else {
      header.classList.remove('hide-nav');
    }
    lastScrollY = scrollY;

    // Toggle Back to Top Button
    if (backToTop) {
      if (scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* 2. Mobile Menu Toggle */
function initMobileMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.createElement('div');
  
  overlay.className = 'mobile-menu-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(56, 9, 1, 0.3)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '98';
  overlay.style.opacity = '0';
  overlay.style.visibility = 'hidden';
  overlay.style.transition = 'var(--transition-smooth)';
  document.body.appendChild(overlay);

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      if (isOpen) {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        menuBtn.innerHTML = '✕';
      } else {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        menuBtn.innerHTML = '☰';
      }
    });

    overlay.addEventListener('click', () => {
      navMenu.classList.remove('open');
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      menuBtn.innerHTML = '☰';
    });
  }
}

/* 3. Luxury Custom Cursor */
function initCustomCursor() {
  // Check if touch device
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const cursor = document.createElement('div');
  cursor.className = 'luxury-cursor';
  const cursorOutline = document.createElement('div');
  cursorOutline.className = 'luxury-cursor-outline';
  
  document.body.appendChild(cursor);
  document.body.appendChild(cursorOutline);

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // Smooth lerp for outer ring cursor
  function animateCursorOutline() {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    
    cursorOutline.style.left = `${outlineX}px`;
    cursorOutline.style.top = `${outlineY}px`;
    
    requestAnimationFrame(animateCursorOutline);
  }
  animateCursorOutline();

  // Scale cursor on hovering links/buttons
  const hoverables = document.querySelectorAll('a, button, .qty-btn, .card-action-btn, select, input[type="submit"]');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering-link'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering-link'));
  });
}

/* 4. Magnetic Buttons */
function initMagneticButtons() {
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Pull button slightly towards mouse
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/* 5. Live Search Autocomplete */
function initLiveSearch() {
  const searchInput = document.querySelector('#product-search-input');
  const searchResults = document.querySelector('#search-autocomplete-box');
  
  if (!searchInput || !searchResults) return;

  // Simple static product database for local live search
  const searchProducts = [
    { name: 'Adwait Pure Desi Ghee (500ml)', price: '₹1,250', url: 'product.html?weight=500ml' },
    { name: 'Adwait Pure Desi Ghee (1L)', price: '₹2,500', url: 'product.html?weight=1L' }
  ];

  // Debounced search input handler
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(() => {
      const matches = searchProducts.filter(p => p.name.toLowerCase().includes(query));
      
      if (matches.length === 0) {
        searchResults.innerHTML = '<div style="padding: 10px; color: #777;">No products found</div>';
      } else {
        searchResults.innerHTML = matches.map(p => `
          <a href="${p.url}" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--color-border); font-size: 0.9rem;">
            <span>${p.name}</span>
            <strong style="color: var(--color-primary);">${p.price}</strong>
          </a>
        `).join('');
      }
      searchResults.style.display = 'block';
    }, 250); // 250ms debounce
  });

  // Close search auto-complete if clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
}

/* 6. Intersection Observer Scroll Reveal (Fallback for Firefox/Safari) */
function initIntersectionObserver() {
  const elements = document.querySelectorAll('.reveal, .reveal-scale');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* 7. Newsletter Form Validation & Success Pop-up */
function initNewsletterValidation() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      const email = input.value.trim();
      
      if (email.toLowerCase() === 'info@adwaitpureghee.com') {
        openAdminPasswordModal(email);
        input.value = '';
        return;
      }
      
      if (validateEmail(email)) {
        showSuccessPopup('Thank you! Subscribed to our luxury Ayurvedic log.');
        input.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  });
}

function openAdminPasswordModal(email) {
  let modal = document.getElementById('admin-password-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-password-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(18, 5, 2, 0.7)';
    modal.style.backdropFilter = 'blur(15px)';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    modal.innerHTML = `
      <div class="royal-glass-card" style="padding: 2.5rem; max-width: 420px; width: 90%; position: relative; border: 1px solid var(--color-primary); box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
        <button id="admin-modal-close" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--color-dark); opacity: 0.6; cursor: pointer; font-size: 1.2rem; transition: opacity 0.2s;">✕</button>
        <h2 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 1rem; color: var(--color-dark); text-align: center;">Administrator Portal</h2>
        <p style="font-size: 0.85rem; color: #4a332d; margin-bottom: 1.5rem; text-align: center; line-height: 1.4;">Authorized access only. Please enter your administrator password to proceed.</p>
        
        <div style="margin-bottom: 1.5rem;">
          <input type="password" id="admin-password-input" class="form-control" style="background: rgba(18, 5, 2, 0.05); border: 1px solid rgba(231,180,83,0.4); border-radius: var(--border-radius-full); padding: 0.8rem 1.2rem; color: var(--color-dark); width: 100%; box-sizing: border-box;" placeholder="Enter password" required>
        </div>
        <button id="admin-login-submit-btn" class="btn btn-primary" style="width: 100%; border-radius: var(--border-radius-full); padding: 0.8rem;">Access Dashboard</button>
        <div id="admin-login-error" style="color: #d9383a; font-size: 0.8rem; margin-top: 1rem; text-align: center; display: none; font-weight: 500;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('admin-modal-close').onclick = () => {
      modal.style.display = 'none';
    };
  } else {
    modal.style.display = 'flex';
  }
  
  const passwordInput = document.getElementById('admin-password-input');
  const errorDiv = document.getElementById('admin-login-error');
  passwordInput.value = '';
  errorDiv.style.display = 'none';
  passwordInput.focus();
  
  const submitBtn = document.getElementById('admin-login-submit-btn');
  const submitPassword = () => {
    const password = passwordInput.value;
    if (!password) return;
    
    submitBtn.innerText = 'Verifying...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    fetch('backend/admin-login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
      submitBtn.innerText = 'Access Dashboard';
      submitBtn.disabled = false;
      
      if (data.success) {
        window.location.href = 'admin.php';
      } else {
        errorDiv.innerText = data.message || 'Incorrect password.';
        errorDiv.style.display = 'block';
      }
    })
    .catch(err => {
      submitBtn.innerText = 'Access Dashboard';
      submitBtn.disabled = false;
      errorDiv.innerText = 'Connection error. Please try again.';
      errorDiv.style.display = 'block';
    });
  };
  
  submitBtn.onclick = submitPassword;
  passwordInput.onkeypress = (e) => {
    if (e.key === 'Enter') submitPassword();
  };
}

/* Global Success Popup Generator (Movable / Draggable) */
let successPopupTimeout;

function showSuccessPopup(message) {
  let popup = document.querySelector('.success-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
      <span>✓</span> 
      <p class="popup-text" style="margin: 0; flex-grow: 1; pointer-events: none;"></p>
      <button class="popup-close-btn" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.1rem; margin-left: 15px; opacity: 0.7; transition: opacity 0.2s; padding: 0 4px;" aria-label="Close message">✕</button>
    `;
    document.body.appendChild(popup);
    
    // Bind close click
    popup.querySelector('.popup-close-btn').addEventListener('click', () => {
      popup.classList.remove('show');
    });

    // Make the popup draggable/movable
    makeElementMovable(popup);
  }
  
  popup.querySelector('.popup-text').innerText = message;
  
  // Reset placement coordinates on new triggers so it starts at standard top-right (unless user already dragged it)
  if (!popup.classList.contains('show') && !popup.dataset.dragged) {
    popup.style.top = '';
    popup.style.right = '';
    popup.style.left = '';
  }
  
  popup.classList.add('show');
  
  // Manage automatic dismiss timer
  clearTimeout(successPopupTimeout);
  successPopupTimeout = setTimeout(() => {
    // Only auto-dismiss if user is not actively dragging
    if (!popup.dataset.dragging) {
      popup.classList.remove('show');
    }
  }, 4500);
}

function makeElementMovable(el) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;
  
  el.style.cursor = 'grab';
  el.style.userSelect = 'none';
  
  const dragStart = (e) => {
    // Avoid dragging when clicking close button
    if (e.target.closest('.popup-close-btn')) return;
    
    isDragging = true;
    el.style.cursor = 'grabbing';
    el.dataset.dragging = 'true';
    el.dataset.dragged = 'true';
    
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    
    const rect = el.getBoundingClientRect();
    
    // Convert current position into coordinates
    initialLeft = rect.left;
    initialTop = rect.top;
    
    startX = clientX;
    startY = clientY;
    
    el.style.transition = 'none'; // Stop transition during drag
    
    // Position fixed absolute coordinates
    el.style.right = 'auto';
    el.style.left = `${initialLeft}px`;
    el.style.top = `${initialTop}px`;
  };
  
  const drag = (e) => {
    if (!isDragging) return;
    
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    
    // Boundary check
    const rect = el.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    if (newLeft < 10) newLeft = 10;
    if (newLeft + rect.width > w - 10) newLeft = w - rect.width - 10;
    if (newTop < 10) newTop = 10;
    if (newTop + rect.height > h - 10) newTop = h - rect.height - 10;
    
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  };
  
  const dragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.cursor = 'grab';
    el.removeAttribute('data-dragging');
    el.style.transition = ''; // Restore default styles
    
    // Auto-dismiss 3 seconds after drag release
    clearTimeout(successPopupTimeout);
    successPopupTimeout = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  };
  
  // Mouse
  el.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  // Touch
  el.addEventListener('touchstart', dragStart, { passive: true });
  document.addEventListener('touchmove', drag, { passive: false });
  document.addEventListener('touchend', dragEnd);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Export for other scripts if needed
window.showSuccessPopup = showSuccessPopup;

/* 8. Global Quick View native dialog binding */
function initGlobalQuickView() {
  const triggers = document.querySelectorAll('.quickview-trigger, .quickview-btn');
  const dialog = document.getElementById('quickview-dialog');
  
  if (!dialog) return;
  
  const qvImage = document.getElementById('qv-image');
  const qvTitle = document.getElementById('dialog-title');
  const qvWeight = document.getElementById('qv-weight');
  const qvPrice = document.getElementById('qv-price');
  const qvMrp = document.getElementById('qv-mrp');
  const qvDesc = document.getElementById('qv-desc');
  const qvAddBtn = document.getElementById('qv-add-btn');
  const qvBuyBtn = document.getElementById('qv-buy-btn');

  // Safari clicking outside support
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) dialog.close();
    });
  }

  triggers.forEach(btn => {
    // Prevent duplicate event bindings
    if (btn.getAttribute('data-quickview-bound')) return;
    btn.setAttribute('data-quickview-bound', 'true');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = btn.getAttribute('data-price');
      const mrp = btn.getAttribute('data-mrp');
      const weight = btn.getAttribute('data-weight');
      const img = btn.getAttribute('data-image');
      const desc = btn.getAttribute('data-desc');

      if (qvImage) {
        qvImage.src = img;
        qvImage.alt = name;
      }
      if (qvTitle) qvTitle.textContent = name;
      if (qvWeight) qvWeight.textContent = `Weight Packaging: ${weight}`;
      if (qvPrice) qvPrice.textContent = `₹${parseFloat(price).toLocaleString('en-IN')}`;
      if (qvMrp) qvMrp.textContent = `₹${parseFloat(mrp).toLocaleString('en-IN')}`;
      if (qvDesc) qvDesc.textContent = desc;

      if (qvAddBtn) {
        qvAddBtn.onclick = () => {
          if (window.addToCart) {
            window.addToCart({ id, name, price: parseFloat(price), weight, img, quantity: 1 });
          }
          dialog.close();
        };
      }

      if (qvBuyBtn) {
        qvBuyBtn.onclick = () => {
          if (window.buyNow) {
            window.buyNow({ id, name, price: parseFloat(price), weight, img, quantity: 1 });
          } else {
            if (window.addToCart) {
              window.addToCart({ id, name, price: parseFloat(price), weight, img, quantity: 1 });
            }
            window.location.href = 'checkout.html';
          }
          dialog.close();
        };
      }

      dialog.showModal();
    });
  });
}

window.initGlobalQuickView = initGlobalQuickView;

/* 9. Redesigned Hero Section Tabs & Copy Transitions */
function initHeroTabs() {
  const tabs = document.querySelectorAll('.hero-tab-btn');
  const contents = document.querySelectorAll('.hero-tab-content');
  
  if (tabs.length === 0 || contents.length === 0) return;
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      
      // Update active state of tab buttons
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active state of content blocks
      contents.forEach(content => {
        if (content.id === `hero-tab-${target}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

window.initHeroTabs = initHeroTabs;

/* 10. Interactive Movable Testimonials Section (Horizontal Strip Carousel) */
function initDraggableTestimonials() {
  const wrapper = document.querySelector('.testimonials-strip-wrapper');
  const track = document.querySelector('.testimonials-strip-track');
  
  if (!wrapper || !track) return;
  
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationId = 0;
  
  const getPositionX = (event) => {
    return event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
  };
  
  const setTranslate = (translate) => {
    track.style.transform = `translateX(${translate}px)`;
  };
  
  const dragStart = (event) => {
    isDragging = true;
    startX = getPositionX(event);
    track.style.transition = 'none';
    
    // Disable links/buttons clicks during drag
    track.style.pointerEvents = 'none';
    
    animationId = requestAnimationFrame(animationLoop);
  };
  
  const drag = (event) => {
    if (!isDragging) return;
    const currentX = getPositionX(event);
    const diff = currentX - startX;
    
    let translate = prevTranslate + diff;
    
    // Boundary check with rubber banding resistance
    const maxTranslate = 0;
    const minTranslate = wrapper.clientWidth - track.scrollWidth;
    
    if (minTranslate >= 0) {
      currentTranslate = 0;
      return;
    }
    
    if (translate > maxTranslate) {
      translate = maxTranslate + (translate - maxTranslate) * 0.35;
    } else if (translate < minTranslate) {
      translate = minTranslate + (translate - minTranslate) * 0.35;
    }
    
    currentTranslate = translate;
  };
  
  const dragEnd = () => {
    isDragging = false;
    cancelAnimationFrame(animationId);
    track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.pointerEvents = 'auto';
    
    const maxTranslate = 0;
    const minTranslate = wrapper.clientWidth - track.scrollWidth;
    
    if (minTranslate >= 0) {
      currentTranslate = 0;
    } else if (currentTranslate > maxTranslate) {
      currentTranslate = maxTranslate;
    } else if (currentTranslate < minTranslate) {
      currentTranslate = minTranslate;
    }
    
    prevTranslate = currentTranslate;
    setTranslate(currentTranslate);
  };
  
  const animationLoop = () => {
    setTranslate(currentTranslate);
    if (isDragging) requestAnimationFrame(animationLoop);
  };
  
  // Mouse
  wrapper.addEventListener('mousedown', dragStart);
  wrapper.addEventListener('mousemove', drag);
  wrapper.addEventListener('mouseup', dragEnd);
  wrapper.addEventListener('mouseleave', dragEnd);
  
  // Touch
  wrapper.addEventListener('touchstart', dragStart, { passive: true });
  wrapper.addEventListener('touchmove', drag, { passive: false });
  wrapper.addEventListener('touchend', dragEnd);
  
  // Prevent default image/link dragging
  track.querySelectorAll('img, a').forEach(el => {
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });
}

window.initDraggableTestimonials = initDraggableTestimonials;
