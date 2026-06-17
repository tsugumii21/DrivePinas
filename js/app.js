/* ================================================================
   DrivePinas — Application Logic
   ================================================================
   Impeccable passes applied:
   ✓ harden   — Error handling, image fallbacks, input validation
   ✓ animate  — Intersection Observer scroll reveals, smooth transitions
   ✓ delight  — Shimmer loading, nav scroll effect, smooth gallery
   ✓ polish   — Debounced handlers, keyboard nav, clean code
   ================================================================ */

"use strict";

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */

/** Format Philippine Peso price — returns null if no price */
function formatPrice(price) {
  if (price === null || price === undefined) {
    return null;
  }
  return "\u20B1" + price.toLocaleString("en-PH");
}

/** Build a picsum.photos image URL from a seed */
function getCarImage(seed, width, height) {
  return IMAGE_CONFIG.baseUrl + "/car" + seed + "/" + width + "/" + height;
}

/** Escape HTML to prevent XSS in dynamic content */
function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Get all cars marked as featured across all brands */
function getAllFeaturedCars() {
  var featured = [];
  for (var b = 0; b < BRANDS.length; b++) {
    var brand = BRANDS[b];
    for (var u = 0; u < brand.units.length; u++) {
      if (brand.units[u].featured) {
        featured.push({ brand: brand, unit: brand.units[u], index: u });
      }
    }
  }
  return featured;
}

/** Count total available (non-sold) cars */
function getTotalAvailableCount() {
  var count = 0;
  for (var b = 0; b < BRANDS.length; b++) {
    for (var u = 0; u < BRANDS[b].units.length; u++) {
      if (!BRANDS[b].units[u].sold) {
        count++;
      }
    }
  }
  return count;
}

/** Simple debounce helper */
function debounce(fn, ms) {
  var timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

/** Generate SVG placeholder for failed images (harden pass) */
function getPlaceholderSvg(text) {
  var label = text || "Image";
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
        '<rect fill="#F7F7F8" width="600" height="400"/>' +
        '<text fill="#9AA0A6" font-family="Inter,sans-serif" font-size="18" font-weight="500" ' +
        'text-anchor="middle" x="300" y="210">' +
        label +
        "</text></svg>"
    )
  );
}

/** SVG icons for contact cards (delight pass — replaces emoji) */
var ICONS = {
  email:
    '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  location:
    '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

/* ================================================================
   NAVIGATION / ROUTING
   ================================================================ */

/** Navigate to a hash route */
function navigateTo(route) {
  window.location.hash = route;
}

/** Close mobile nav overlay */
function closeMobileNav() {
  var hamburger = document.getElementById("hamburger");
  var mobileNav = document.getElementById("mobileNav");
  if (hamburger) {
    hamburger.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
  }
  if (mobileNav) {
    mobileNav.classList.remove("is-open");
  }
  document.body.style.overflow = "";
}

/** Handle hash route changes */
function handleRoute() {
  var hash = window.location.hash.slice(1) || "home";
  var parts = hash.split("/");
  var route = parts[0];

  // Hide all views
  var views = document.querySelectorAll(".view");
  for (var i = 0; i < views.length; i++) {
    views[i].classList.remove("active");
  }

  // Clear nav active states
  var links = document.querySelectorAll(".nav__link");
  for (var j = 0; j < links.length; j++) {
    links[j].classList.remove("active");
  }

  // Close mobile nav if open
  closeMobileNav();

  // Scroll to top
  window.scrollTo(0, 0);

  // Route to correct view
  switch (route) {
    case "brand":
      if (parts[1]) {
        renderBrandPage(parts[1]);
        showView("view-brand");
        setActiveNav("brands");
      } else {
        navigateTo("home");
      }
      break;

    case "unit":
      if (parts[1] && parts[2] !== undefined) {
        renderUnitPage(parts[1], parseInt(parts[2], 10));
        showView("view-unit");
        setActiveNav("brands");
      } else {
        navigateTo("home");
      }
      break;

    case "contact":
      showView("view-contact");
      setActiveNav("contact");
      break;

    case "home":
    default:
      showView("view-home");
      setActiveNav("home");
      break;
  }

  // Re-observe reveal elements after rendering
  setTimeout(observeRevealElements, 100);
}

/** Show a specific view by ID */
function showView(id) {
  var view = document.getElementById(id);
  if (view) {
    view.classList.add("active");
  }
}

/** Set active state on nav links */
function setActiveNav(name) {
  var links = document.querySelectorAll('.nav__link[data-nav="' + name + '"]');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.add("active");
  }
}

/* ================================================================
   RENDER: HOME PAGE
   ================================================================ */

function renderHomePage() {
  renderHeroStats();
  renderFeaturedCars();
  renderBrandGrid();
  renderFooter();
}

function renderHeroStats() {
  var statsEl = document.getElementById("heroStats");
  if (!statsEl) return;

  var totalAvailable = getTotalAvailableCount();
  statsEl.innerHTML =
    '<div class="hero__stat">' +
      '<div class="hero__stat-value">' + BRANDS.length + "</div>" +
      '<div class="hero__stat-label">Trusted Brands</div>' +
    "</div>" +
    '<div class="hero__stat">' +
      '<div class="hero__stat-value">' + totalAvailable + "+</div>" +
      '<div class="hero__stat-label">Cars Available</div>' +
    "</div>" +
    '<div class="hero__stat">' +
      '<div class="hero__stat-value">100%</div>' +
      '<div class="hero__stat-label">Inspected</div>' +
    "</div>";
}

function renderBrandGrid() {
  var grid = document.getElementById("brandGrid");
  if (!grid) return;
  grid.innerHTML = "";

  for (var i = 0; i < BRANDS.length; i++) {
    var brand = BRANDS[i];
    var availableCount = 0;
    for (var u = 0; u < brand.units.length; u++) {
      if (!brand.units[u].sold) availableCount++;
    }

    var card = document.createElement("div");
    card.className = "brand-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "View " + brand.name + " cars");
    card.dataset.brandSlug = brand.slug;
    card.style.transitionDelay = i * ANIMATION_CONFIG.staggerDelayMs + "ms";

    card.innerHTML =
      '<img class="brand-card__logo" src="' + escapeHtml(brand.logo) + '" ' +
        'alt="' + escapeHtml(brand.name) + ' logo" loading="lazy" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="brand-card__fallback">' + escapeHtml(brand.name.charAt(0)) + "</div>" +
      '<span class="brand-card__name">' + escapeHtml(brand.name) + "</span>" +
      '<span class="brand-card__count">' + availableCount + " unit" + (availableCount !== 1 ? "s" : "") + " available</span>" +
      '<span class="brand-card__arrow">→</span>';

    card.addEventListener("click", createBrandClickHandler(brand.slug));
    card.addEventListener("keydown", createKeyHandler(brand.slug));
    grid.appendChild(card);
  }
}

/** Factory to avoid closure issues in loops */
function createBrandClickHandler(slug) {
  return function () {
    navigateTo("brand/" + slug);
  };
}

function createKeyHandler(slug) {
  return function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigateTo("brand/" + slug);
    }
  };
}

function renderFeaturedCars() {
  var container = document.getElementById("featuredGrid");
  var section = document.getElementById("featuredSection");
  if (!container || !section) return;

  container.innerHTML = "";
  var featured = getAllFeaturedCars();

  if (featured.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  for (var i = 0; i < featured.length; i++) {
    var card = createCarCard(featured[i].brand, featured[i].unit, featured[i].index, i, true);
    container.appendChild(card);
  }
}

/* ================================================================
   RENDER: BRAND PAGE
   ================================================================ */

function renderBrandPage(slug) {
  var brand = null;
  for (var b = 0; b < BRANDS.length; b++) {
    if (BRANDS[b].slug === slug) {
      brand = BRANDS[b];
      break;
    }
  }

  if (!brand) {
    navigateTo("home");
    return;
  }

  // Breadcrumb
  var breadcrumb = document.getElementById("brandBreadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML =
      '<a href="#home">Home</a>' +
      '<span class="page-header__breadcrumb-sep">›</span>' +
      '<span class="page-header__breadcrumb-current">' + escapeHtml(brand.name) + "</span>";
  }

  // Header
  var header = document.getElementById("brandHeader");
  if (header) {
    var availableCount = 0;
    for (var u = 0; u < brand.units.length; u++) {
      if (!brand.units[u].sold) availableCount++;
    }

    header.innerHTML =
      '<img class="page-header__brand-logo" src="' + escapeHtml(brand.logo) + '" ' +
        'alt="' + escapeHtml(brand.name) + ' logo" ' +
        'onerror="this.style.display=\'none\'">' +
      "<div>" +
        '<h1 class="page-header__title">' + escapeHtml(brand.name) + "</h1>" +
        '<p class="page-header__subtitle">' + availableCount + " vehicle" + (availableCount !== 1 ? "s" : "") + " available</p>" +
      "</div>";
  }

  // Car grid
  var grid = document.getElementById("brandCarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (brand.units.length === 0) {
    grid.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state__icon">🚗</div>' +
        '<p class="empty-state__text">No units available at the moment. Check back soon!</p>' +
      "</div>";
    return;
  }

  for (var i = 0; i < brand.units.length; i++) {
    var card = createCarCard(brand, brand.units[i], i, i, false);
    grid.appendChild(card);
  }

  // Update page title (polish pass)
  document.title = brand.name + " Cars — " + SITE_CONFIG.name;
}

/* ================================================================
   RENDER: UNIT DETAIL PAGE
   ================================================================ */

function renderUnitPage(slug, unitIndex) {
  var brand = null;
  for (var b = 0; b < BRANDS.length; b++) {
    if (BRANDS[b].slug === slug) {
      brand = BRANDS[b];
      break;
    }
  }

  // Harden: validate brand and unit index
  if (!brand || !brand.units[unitIndex]) {
    navigateTo("home");
    return;
  }

  var unit = brand.units[unitIndex];
  var fullName = unit.year + " " + brand.name + " " + unit.name;

  // Breadcrumb
  var breadcrumb = document.getElementById("unitBreadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML =
      '<a href="#home">Home</a>' +
      '<span class="page-header__breadcrumb-sep">›</span>' +
      '<a href="#brand/' + escapeHtml(brand.slug) + '">' + escapeHtml(brand.name) + "</a>" +
      '<span class="page-header__breadcrumb-sep">›</span>' +
      '<span class="page-header__breadcrumb-current">' + escapeHtml(unit.name) + "</span>";
  }

  // Title
  var titleEl = document.getElementById("unitTitle");
  if (titleEl) {
    titleEl.textContent = fullName;
  }

  // Detail area
  var detail = document.getElementById("unitDetail");
  if (!detail) return;

  var mainImgSrc = getCarImage(unit.images[0], IMAGE_CONFIG.galleryWidth, IMAGE_CONFIG.galleryHeight);

  // Gallery
  var galleryHtml =
    '<div class="gallery">' +
      '<div class="gallery__main">' +
        '<img class="gallery__main-img" id="galleryMainImg" ' +
          'src="' + mainImgSrc + '" ' +
          'alt="' + escapeHtml(fullName) + '" ' +
          'loading="eager" ' +
          'onerror="this.src=\'' + getPlaceholderSvg(brand.name) + '\'">' +
      "</div>" +
      '<div class="gallery__thumbs" role="tablist" aria-label="Photo gallery">';

  for (var t = 0; t < unit.images.length; t++) {
    var thumbSrc = getCarImage(unit.images[t], IMAGE_CONFIG.thumbWidth, IMAGE_CONFIG.thumbHeight);
    galleryHtml +=
      '<div class="gallery__thumb' + (t === 0 ? " active" : "") + '" ' +
        'role="tab" tabindex="0" aria-selected="' + (t === 0 ? "true" : "false") + '" ' +
        'aria-label="Photo ' + (t + 1) + '" ' +
        'data-seed="' + unit.images[t] + '">' +
        '<img src="' + thumbSrc + '" alt="Photo ' + (t + 1) + '" loading="lazy">' +
      "</div>";
  }

  galleryHtml += "</div></div>";

  // Specs
  var priceHtml = unit.price
    ? '<span class="unit-specs__value unit-specs__value--accent">' + formatPrice(unit.price) + "</span>"
    : '<span class="unit-specs__value car-card__price--call">Call for Price</span>';

  var specsHtml =
    '<div class="unit-specs">' +
      '<h2 class="unit-specs__title">Vehicle Details</h2>' +
      '<div class="unit-specs__grid">' +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Price</span>' +
          priceHtml +
        "</div>" +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Year Model</span>' +
          '<span class="unit-specs__value">' + unit.year + "</span>" +
        "</div>" +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Odometer</span>' +
          '<span class="unit-specs__value">' + escapeHtml(unit.odometer) + "</span>" +
        "</div>" +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Transmission</span>' +
          '<span class="unit-specs__value">' + escapeHtml(unit.transmission) + "</span>" +
        "</div>" +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Fuel Type</span>' +
          '<span class="unit-specs__value">' + escapeHtml(unit.fuel) + "</span>" +
        "</div>" +
        '<div class="unit-specs__item">' +
          '<span class="unit-specs__label">Body Type</span>' +
          '<span class="unit-specs__value">' + escapeHtml(unit.body) + "</span>" +
        "</div>" +
        '<div class="unit-specs__item unit-specs__condition">' +
          '<span class="unit-specs__label">Condition / Notes</span>' +
          '<span class="unit-specs__value">' + escapeHtml(unit.condition) + "</span>" +
        "</div>" +
      "</div>" +
    "</div>";

  detail.innerHTML = galleryHtml + specsHtml;

  // Attach thumbnail click handlers
  var thumbs = detail.querySelectorAll(".gallery__thumb");
  for (var i = 0; i < thumbs.length; i++) {
    thumbs[i].addEventListener("click", createThumbClickHandler(thumbs[i]));
    thumbs[i].addEventListener("keydown", createThumbKeyHandler(thumbs[i]));
  }

  // Update page title
  document.title = fullName + " — " + SITE_CONFIG.name;
}

/** Gallery thumbnail click handler factory */
function createThumbClickHandler(thumbEl) {
  return function () {
    switchGalleryImage(thumbEl);
  };
}

/** Gallery thumbnail keyboard handler factory */
function createThumbKeyHandler(thumbEl) {
  return function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      switchGalleryImage(thumbEl);
    }
  };
}

/** Switch gallery main image with crossfade (delight pass) */
function switchGalleryImage(thumbEl) {
  var seed = thumbEl.dataset.seed;
  var mainImg = document.getElementById("galleryMainImg");
  if (!mainImg || !seed) return;

  var newSrc = getCarImage(seed, IMAGE_CONFIG.galleryWidth, IMAGE_CONFIG.galleryHeight);

  // Crossfade
  mainImg.style.opacity = "0";
  setTimeout(function () {
    mainImg.src = newSrc;
    mainImg.onload = function () {
      mainImg.style.opacity = "1";
    };
    // Harden: fallback if image fails to load
    mainImg.onerror = function () {
      mainImg.src = getPlaceholderSvg("Photo");
      mainImg.style.opacity = "1";
    };
  }, 200);

  // Update active states
  var allThumbs = document.querySelectorAll(".gallery__thumb");
  for (var i = 0; i < allThumbs.length; i++) {
    allThumbs[i].classList.remove("active");
    allThumbs[i].setAttribute("aria-selected", "false");
  }
  thumbEl.classList.add("active");
  thumbEl.setAttribute("aria-selected", "true");
}

/* ================================================================
   SHARED: Car Card Component
   ================================================================ */

function createCarCard(brand, unit, unitIndex, staggerIndex, showFeaturedBadge) {
  var card = document.createElement("article");
  card.className = "car-card" + (unit.sold ? " car-card--sold" : "");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", "View " + brand.name + " " + unit.name);

  var route = "unit/" + brand.slug + "/" + unitIndex;
  card.addEventListener("click", function () { navigateTo(route); });
  card.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigateTo(route);
    }
  });

  var imgSrc = getCarImage(unit.images[0], IMAGE_CONFIG.cardWidth, IMAGE_CONFIG.cardHeight);
  var priceDisplay = unit.price
    ? '<span class="car-card__price">' + formatPrice(unit.price) + "</span>"
    : '<span class="car-card__price car-card__price--call">Call for Price</span>';

  var badgesHtml = "";
  if (unit.sold) {
    badgesHtml += '<span class="car-card__badge car-card__badge--sold">Sold</span>';
  }
  if (showFeaturedBadge && unit.featured && !unit.sold) {
    badgesHtml += '<span class="car-card__badge car-card__badge--featured">★ Featured</span>';
  }

  card.innerHTML =
    '<div class="car-card__image-wrap" id="imgWrap-' + brand.slug + '-' + unitIndex + '">' +
      '<img class="car-card__image" src="' + imgSrc + '" ' +
        'alt="' + escapeHtml(brand.name + " " + unit.name) + '" ' +
        'loading="lazy" ' +
        'onload="this.parentElement.classList.add(\'is-loaded\')" ' +
        'onerror="this.src=\'' + getPlaceholderSvg(brand.name) + '\';this.parentElement.classList.add(\'is-loaded\')">' +
      badgesHtml +
    "</div>" +
    '<div class="car-card__body">' +
      '<h3 class="car-card__title">' + escapeHtml(brand.name + " " + unit.name) + "</h3>" +
      '<p class="car-card__year">' + unit.year + " · " + escapeHtml(unit.body) + "</p>" +
      '<div class="car-card__tags">' +
        '<span class="car-card__tag">' + escapeHtml(unit.transmission) + "</span>" +
        '<span class="car-card__tag">' + escapeHtml(unit.fuel) + "</span>" +
        '<span class="car-card__tag">' + escapeHtml(unit.odometer) + "</span>" +
      "</div>" +
      priceDisplay +
    "</div>";

  return card;
}

/* ================================================================
   RENDER: FOOTER
   ================================================================ */

function renderFooter() {
  var footer = document.getElementById("footerContent");
  if (!footer) return;

  footer.innerHTML =
    '<div class="footer__inner">' +
      '<div>' +
        '<div class="nav__logo-text" style="font-size:var(--fs-xl)">' +
          '<span class="nav__logo-drive">Drive</span><span class="nav__logo-pinas">Pinas</span>' +
        "</div>" +
        '<p class="footer__desc">Your trusted source for quality pre-owned cars in the Philippines. Every unit inspected, every detail transparent.</p>' +
      "</div>" +
      '<div class="footer__col">' +
        '<h4 class="footer__col-title">Quick Links</h4>' +
        "<ul>" +
          '<li><a href="#home">Home</a></li>' +
          '<li><a href="#contact">Contact Us</a></li>' +
        "</ul>" +
      "</div>" +
      '<div class="footer__col">' +
        '<h4 class="footer__col-title">Contact</h4>' +
        "<ul>" +
          '<li><a href="mailto:' + SITE_CONFIG.email + '">' + SITE_CONFIG.email + "</a></li>" +
          '<li><a href="tel:' + SITE_CONFIG.phoneTel + '">' + SITE_CONFIG.phone + "</a></li>" +
          '<li><a href="' + SITE_CONFIG.facebook + '" target="_blank" rel="noopener">Facebook</a></li>' +
        "</ul>" +
      "</div>" +
    "</div>" +
    '<div class="footer__bottom">' +
      "<span>© " + SITE_CONFIG.year + " " + SITE_CONFIG.name + ". All rights reserved.</span>" +
      "<span>" + SITE_CONFIG.tagline + "</span>" +
    "</div>";
}

/* ================================================================
   RENDER: CONTACT PAGE
   ================================================================ */

function renderContactPage() {
  var grid = document.getElementById("contactGrid");
  if (!grid) return;

  var cards = [
    {
      icon: ICONS.email,
      title: "Email",
      desc: "Send us a message anytime",
      link: "mailto:" + SITE_CONFIG.email,
      linkText: SITE_CONFIG.email,
    },
    {
      icon: ICONS.phone,
      title: "Phone",
      desc: "Call or text us",
      link: "tel:" + SITE_CONFIG.phoneTel,
      linkText: SITE_CONFIG.phone,
    },
    {
      icon: ICONS.facebook,
      title: "Facebook",
      desc: "Follow us for the latest units",
      link: SITE_CONFIG.facebook,
      linkText: SITE_CONFIG.facebookDisplay,
      external: true,
    },
    {
      icon: ICONS.location,
      title: "Location",
      desc: "Visit our showroom",
      value: SITE_CONFIG.location,
    },
  ];

  grid.innerHTML = "";
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    var contentHtml;

    if (c.link) {
      contentHtml =
        '<a class="contact-card__link" href="' + c.link + '"' +
        (c.external ? ' target="_blank" rel="noopener"' : "") +
        ">" + escapeHtml(c.linkText) + "</a>";
    } else {
      contentHtml = '<span class="contact-card__value">' + escapeHtml(c.value) + "</span>";
    }

    var cardEl = document.createElement("div");
    cardEl.className = "contact-card";
    cardEl.innerHTML =
      '<div class="contact-card__icon">' + c.icon + "</div>" +
      "<div>" +
        '<h3 class="contact-card__title">' + escapeHtml(c.title) + "</h3>" +
        '<p class="contact-card__desc">' + escapeHtml(c.desc) + "</p>" +
        contentHtml +
      "</div>";

    grid.appendChild(cardEl);
  }
}

/* ================================================================
   SCROLL EFFECTS (animate + delight passes)
   ================================================================ */

/** Intersection Observer for scroll-triggered reveal animations */
var revealObserver = null;

function initRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    // Fallback: show everything immediately
    var revealEls = document.querySelectorAll(".reveal, .reveal--left, .reveal--scale, .stagger-children");
    for (var i = 0; i < revealEls.length; i++) {
      revealEls[i].classList.add("is-visible");
    }
    return;
  }

  revealObserver = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var el = entries[i].target;
          el.classList.add("is-visible");

          // Stagger children with delay
          if (el.classList.contains("stagger-children")) {
            var children = el.children;
            for (var c = 0; c < children.length; c++) {
              children[c].style.transitionDelay = c * ANIMATION_CONFIG.staggerDelayMs + "ms";
            }
          }

          revealObserver.unobserve(el);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
}

function observeRevealElements() {
  if (!revealObserver) return;

  var elements = document.querySelectorAll(
    ".reveal:not(.is-visible), .reveal--left:not(.is-visible), .reveal--scale:not(.is-visible), .stagger-children:not(.is-visible)"
  );
  for (var i = 0; i < elements.length; i++) {
    revealObserver.observe(elements[i]);
  }
}

/** Nav scroll effect — glassmorphism to solid (delight pass) */
function initNavScrollEffect() {
  var nav = document.getElementById("nav");
  if (!nav) return;

  var handleScroll = debounce(function () {
    if (window.scrollY > ANIMATION_CONFIG.navScrollThreshold) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }, ANIMATION_CONFIG.debounceMs);

  window.addEventListener("scroll", handleScroll, { passive: true });
}

/** Back to top button */
function initBackToTop() {
  var btn = document.getElementById("backToTop");
  if (!btn) return;

  var handleScroll = debounce(function () {
    if (window.scrollY > ANIMATION_CONFIG.scrollThreshold) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  }, ANIMATION_CONFIG.debounceMs);

  window.addEventListener("scroll", handleScroll, { passive: true });

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ================================================================
   HAMBURGER MENU
   ================================================================ */

function initHamburger() {
  var hamburger = document.getElementById("hamburger");
  var mobileNav = document.getElementById("mobileNav");
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener("click", function () {
    var isOpen = hamburger.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", isOpen.toString());
    mobileNav.classList.toggle("is-open");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
}

/* ================================================================
   BRANDS NAV CLICK (scrolls to brands section on home)
   ================================================================ */

function scrollToBrands() {
  var currentHash = window.location.hash.slice(1) || "home";
  if (currentHash === "home" || currentHash === "") {
    var section = document.getElementById("brandsSection");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  } else {
    navigateTo("home");
    setTimeout(function () {
      var section = document.getElementById("brandsSection");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, ANIMATION_CONFIG.brandsScrollDelayMs);
  }
}

/* ================================================================
   INITIALIZE
   ================================================================ */

function init() {
  // Render static content
  renderHomePage();
  renderContactPage();

  // Initialize interactions
  initHamburger();
  initBackToTop();
  initNavScrollEffect();
  initRevealObserver();

  // Start routing
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

// Boot when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
