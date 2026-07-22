/* Google Analytics 4, GTM, Meta Pixel & JSON-LD Structured Data Injection */

document.addEventListener('DOMContentLoaded', () => {
  initAnalyticsTrackers();
  injectStructuredData();
});

/* 1. Initialize Analytics Trackers (Mock Placeholders) */
function initAnalyticsTrackers() {
  console.log('[Analytics] Initializing Google Analytics 4 (Measurement ID: G-ADWAITGHEE)');
  console.log('[Analytics] Initializing Google Tag Manager (Container ID: GTM-T5K9L2B)');
  console.log('[Analytics] Initializing Meta Pixel (Pixel ID: 897458296312457)');

  // Track standard e-commerce events based on page actions
  window.trackAnalyticsEvent = function(eventName, eventParams) {
    // Console log for production verification
    console.log(`[GA4/Pixel Event] ${eventName}:`, eventParams);
    
    // In real production, this would trigger gtag:
    // typeof gtag === 'function' && gtag('event', eventName, eventParams);
    // and Meta fbq:
    // typeof fbq === 'function' && fbq('track', eventName, eventParams);
  };
}

/* 2. Dynamic JSON-LD Structured Data Builder */
function injectStructuredData() {
  const head = document.head;
  const path = window.location.pathname;

  // Global Organization Schema (Injected on Home Page)
  if (path === '/' || path.includes('index.html') || path === '') {
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      "name": "Adwait Pure Desi Ghee",
      "image": "https://adwaitghee.com/images/logo.png",
      "@id": "https://adwaitghee.com/#organization",
      "url": "https://adwaitghee.com",
      "telephone": "+91-9876543210",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Organic Farm Estate, Bilona Sector",
        "addressLocality": "Mumbai",
        "addressRegion": "Maharashtra",
        "postalCode": "400001",
        "addressCountry": "IN"
      },
      "sameAs": [
        "https://www.instagram.com/adwait.ghee/?hl=en",
        "https://www.facebook.com/adwaitghee"
      ]
    };
    appendSchemaScript(orgSchema);
  }

  // Product Detail Schema (Injected on Product details Page)
  if (path.includes('product.html')) {
    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Adwait Premium Bilona Desi Ghee",
      "image": [
        "https://adwaitghee.com/images/ghee_jar.jpg"
      ],
      "description": "Pure traditionally churned Desi Ghee made from grass-fed Desi Cow milk using Vedic Bilona curd method.",
      "sku": "ADW-BILONA-GHEE",
      "mpn": "ADW-01",
      "brand": {
        "@type": "Brand",
        "name": "Adwait"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Ananya Sharma"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "142"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": "475",
        "highPrice": "3299",
        "offerCount": "4",
        "availability": "https://schema.org/InStock"
      }
    };
    appendSchemaScript(productSchema);
  }

  // FAQ Page Schema (Injected on FAQ Page)
  if (path.includes('faq.html')) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is Bilona Desi Ghee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bilona Desi Ghee is traditionally churned butter fat obtained from the curd of grass-fed Desi cow milk using a wooden churner (Bilona) in two directions. It is rich in nutrients."
        }
      }, {
        "@type": "Question",
        "name": "How should I store Adwait Desi Ghee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Store Adwait Desi Ghee in a dry, cool place away from direct sunlight. Do not refrigerate, and always use a clean, dry spoon to avoid moisture contamination."
        }
      }, {
        "@type": "Question",
        "name": "What is the shelf life of Adwait Desi Ghee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Due to our traditional cooking process, our ghee is highly stable and has a shelf life of 6 to 8 months at room temperature."
        }
      }]
    };
    appendSchemaScript(faqSchema);
  }

  // Dynamic Breadcrumb Schema for all pages
  const crumbs = getBreadcrumbs();
  if (crumbs.length > 0) {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
    appendSchemaScript(breadcrumbSchema);
  }
}

function appendSchemaScript(jsonObject) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(jsonObject);
  document.head.appendChild(script);
}

function getBreadcrumbs() {
  const path = window.location.pathname;
  const domain = 'https://adwaitghee.com';
  const list = [{ name: 'Home', url: `${domain}/index.html` }];

  if (path.includes('shop.html')) {
    list.push({ name: 'Shop', url: `${domain}/shop.html` });
  } else if (path.includes('product.html')) {
    list.push({ name: 'Shop', url: `${domain}/shop.html` });
    list.push({ name: 'Bilona Desi Ghee', url: `${domain}/product.html` });
  } else if (path.includes('process.html')) {
    list.push({ name: 'Our Process', url: `${domain}/process.html` });
  } else if (path.includes('about.html')) {
    list.push({ name: 'About Brand', url: `${domain}/about.html` });
  } else if (path.includes('blog.html')) {
    list.push({ name: 'Ayurvedic Blog', url: `${domain}/blog.html` });
  } else if (path.includes('faq.html')) {
    list.push({ name: 'FAQs', url: `${domain}/faq.html` });
  } else if (path.includes('contact.html')) {
    list.push({ name: 'Contact Us', url: `${domain}/contact.html` });
  }

  // If we are just on home, don't show crumbs
  if (list.length === 1 && (path === '/' || path.includes('index.html'))) {
    return [];
  }
  return list;
}
