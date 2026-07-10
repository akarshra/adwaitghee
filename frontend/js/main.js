/* Global Luxury UI Behaviors */

// API Configuration: Change this to your production backend URL (e.g. 'https://api.yourdomain.com/backend') when deploying
window.ADWAIT_API_BASE = 'backend';

document.addEventListener('DOMContentLoaded', () => {
  initScrollBehaviors();
  initMobileMenu();
  initCustomCursor();
  initMagneticButtons();
  initLiveSearch();
  initIntersectionObserver();
  initNewsletterValidation();
  initGlobalQuickView();
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
      
      if (validateEmail(email)) {
        showSuccessPopup('Thank you! Subscribed to our luxury Ayurvedic log.');
        input.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  });
}

/* Global Success Popup Generator */
function showSuccessPopup(message) {
  let popup = document.querySelector('.success-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `<span>✓</span> <p class="popup-text"></p>`;
    document.body.appendChild(popup);
  }
  
  popup.querySelector('.popup-text').innerText = message;
  popup.classList.add('show');
  
  setTimeout(() => {
    popup.classList.remove('show');
  }, 3500);
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

      dialog.showModal();
    });
  });
}

window.initGlobalQuickView = initGlobalQuickView;
