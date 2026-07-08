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
      if (brand.units[u].featured && brand.units[u].active !== false) {
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
      if (!BRANDS[b].units[u].sold && BRANDS[b].units[u].active !== false) {
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
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
  location:
    '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

/* ================================================================
   NAVIGATION / ROUTING
   ================================================================ */

/** Flag: when true, handleRoute() skips scroll-to-top and sets 'brands' active */
var _pendingBrandsScroll = false;

/** Navigate to a hash route — handles same-hash re-clicks */
function navigateTo(route) {
  var currentHash = window.location.hash.slice(1) || "home";
  if (currentHash === route) {
    // Already on this route — force re-render and scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    handleRoute();
  } else {
    window.location.hash = route;
  }
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

  // Scroll to top (skip when brands scroll is pending)
  if (!_pendingBrandsScroll) {
    window.scrollTo(0, 0);
  } else {
    _pendingBrandsScroll = false;
  }

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
      renderHomePage();
      showView("view-home");
      if (_pendingBrandsScroll) {
        setActiveNav("brands");
        _pendingBrandsScroll = false;
      } else {
        setActiveNav("home");
      }
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
      '<a href="#home">Brands</a>' +
      '<span class="page-header__breadcrumb-sep">›</span>' +
      '<span class="page-header__breadcrumb-current">' + escapeHtml(brand.name) + "</span>";
  }

  // Header
  var header = document.getElementById("brandHeader");
  if (header) {
    var availableCount = 0;
    for (var u = 0; u < brand.units.length; u++) {
      if (!brand.units[u].sold && brand.units[u].active !== false) availableCount++;
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

  var visibleUnits = brand.units.filter(function(u) { return u.active !== false; });

  if (visibleUnits.length === 0) {
    grid.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state__icon">🚗</div>' +
        '<p class="empty-state__text">No units available at the moment. Check back soon!</p>' +
      "</div>";
    return;
  }

  for (var i = 0; i < brand.units.length; i++) {
    if (brand.units[i].active === false) continue;
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
  if (unit.active === false) {
    navigateTo("home");
    return;
  }
  var fullName = unit.year + " " + brand.name + " " + unit.name;

  // Breadcrumb — first crumb goes back to the brand page
  var breadcrumb = document.getElementById("unitBreadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML =
      '<a href="#brand/' + escapeHtml(brand.slug) + '">Brands</a>' +
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

  // Build sidebar: specs + reserve button + inline CTA
  var sidebarHtml = specsHtml;

  // Reserve Unit button (right below specs)
  sidebarHtml +=
    '<div style="margin-top:var(--sp-5)">' +
      '<button class="unit-reserve-btn" onclick="navigateTo(\'contact\')" id="btnReserveUnit">' +
        '<span>Reserve This Unit</span>' +
        '<span class="unit-reserve-btn__icon">&rarr;</span>' +
      '</button>' +
    '</div>';

  // Build dynamic CTA links based on active channels
  var ctaLinksHtml = '';
  
  // Phone is always present as a direct link
  ctaLinksHtml +=
    '<a class="unit-inline-cta__link" href="tel:' + SITE_CONFIG.phoneTel + '">' +
      '<span class="unit-inline-cta__link-icon">' + ICONS.phone + '</span>' +
      '<span>' + SITE_CONFIG.phone + '</span>' +
    '</a>';

  var showGmail = !unit.channels || unit.channels.indexOf('gmail') > -1;
  if (showGmail) {
    ctaLinksHtml +=
      '<a class="unit-inline-cta__link" href="mailto:' + SITE_CONFIG.email + '">' +
        '<span class="unit-inline-cta__link-icon">' + ICONS.email + '</span>' +
        '<span>' + SITE_CONFIG.email + '</span>' +
      '</a>';
  }

  var showFacebook = !unit.channels || unit.channels.indexOf('facebook') > -1;
  if (showFacebook) {
    ctaLinksHtml +=
      '<a class="unit-inline-cta__link" href="' + SITE_CONFIG.facebook + '" target="_blank" rel="noopener">' +
        '<span class="unit-inline-cta__link-icon">' + ICONS.facebook + '</span>' +
        '<span>' + SITE_CONFIG.facebookDisplay + '</span>' +
      '</a>';
  }

  var showInstagram = unit.channels && unit.channels.indexOf('instagram') > -1;
  if (showInstagram) {
    ctaLinksHtml +=
      '<a class="unit-inline-cta__link" href="' + SITE_CONFIG.instagram + '" target="_blank" rel="noopener">' +
        '<span class="unit-inline-cta__link-icon">' + ICONS.instagram + '</span>' +
        '<span>' + SITE_CONFIG.instagramDisplay + '</span>' +
      '</a>';
  }

  // Inline CTA card
  sidebarHtml +=
    '<div class="unit-inline-cta">' +
      '<h3 class="unit-inline-cta__title">Interested in this unit?</h3>' +
      '<p class="unit-inline-cta__subtitle">Get in touch for inquiries, test drives, or more details about this vehicle.</p>' +
      '<div class="unit-inline-cta__actions">' +
        ctaLinksHtml +
      '</div>' +
    '</div>';

  detail.innerHTML = galleryHtml + sidebarHtml;

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
  } else {
    var typeText = unit.listingType === 'rent' ? 'For Rent' : 'For Sale';
    var typeClass = unit.listingType === 'rent' ? 'rent' : 'sale';
    badgesHtml += '<span class="car-card__badge car-card__badge--' + typeClass + '">' + typeText + '</span>';
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
        '<ul class="footer__contact-list">' +
          '<li><a href="mailto:' + SITE_CONFIG.email + '"><span class="footer__contact-icon">' + ICONS.email + '</span><span>' + SITE_CONFIG.email + '</span></a></li>' +
          '<li><a href="tel:' + SITE_CONFIG.phoneTel + '"><span class="footer__contact-icon">' + ICONS.phone + '</span><span>' + SITE_CONFIG.phone + '</span></a></li>' +
          '<li><a href="' + SITE_CONFIG.facebook + '" target="_blank" rel="noopener"><span class="footer__contact-icon">' + ICONS.facebook + '</span><span>Facebook</span></a></li>' +
        "</ul>" +
      "</div>" +
    "</div>" +
    '<div class="footer__bottom">' +
      "<span>© " + SITE_CONFIG.year + " " + SITE_CONFIG.name + ". All rights reserved.</span>" +
      "<span>" + SITE_CONFIG.tagline + "</span>" +
    "</div>";
}

function renderContactPage() {
  var layout = document.getElementById("contactLayout");
  if (!layout) return;

  // === LEFT COLUMN: Contact Form Card ===
  var formHtml =
    '<div class="contact-form-card">' +
      '<div class="form-toggle-bar">' +
        '<button type="button" class="form-toggle-btn active" id="btnToggleInquiry">Send Inquiry</button>' +
        '<button type="button" class="form-toggle-btn" id="btnToggleTradeIn">Sell / Trade-in</button>' +
      '</div>' +
      '<h2 class="contact-form-card__title" id="contactFormTitle">Send Us a Message</h2>' +
      '<p class="contact-form-card__subtitle" id="contactFormSubtitle">Fill out the form below and we\'ll get back to you as soon as possible.</p>' +
      '<form class="contact-form" id="contactForm" novalidate>' +
        '<input type="hidden" id="contactFormType" value="inquiry">' +
        
        '<div class="contact-form__row">' +
          '<div class="contact-form__field">' +
            '<label class="contact-form__label" for="contactName">Full Name</label>' +
            '<input class="contact-form__input" type="text" id="contactName" name="name" placeholder="Juan Dela Cruz" required>' +
          '</div>' +
          '<div class="contact-form__field">' +
            '<label class="contact-form__label" for="contactEmail">Email Address</label>' +
            '<input class="contact-form__input" type="email" id="contactEmail" name="email" placeholder="juan@email.com" required>' +
          '</div>' +
        '</div>' +
        '<div class="contact-form__field">' +
          '<label class="contact-form__label" for="contactPhone">Phone Number</label>' +
          '<input class="contact-form__input" type="tel" id="contactPhone" name="phone" placeholder="+63 9XX XXX XXXX">' +
        '</div>' +

        // --- INQUIRY MODE FIELDS (visible by default) ---
        '<div id="inquiryFieldsGroup">' +
          '<div class="contact-form__field">' +
            '<label class="contact-form__label" for="contactMessage">Message</label>' +
            '<textarea class="contact-form__textarea" id="contactMessage" name="message" placeholder="I\'m interested in a vehicle..." required></textarea>' +
          '</div>' +
        '</div>' +

        // --- TRADE-IN MODE FIELDS (hidden by default) ---
        '<div id="tradeInFieldsGroup" style="display:none;">' +
          '<div class="contact-form__row">' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeBrand">Brand</label>' +
              '<select class="contact-form__select" id="tradeBrand">' +
                '<option value="toyota">Toyota</option>' +
                '<option value="honda">Honda</option>' +
                '<option value="mitsubishi">Mitsubishi</option>' +
                '<option value="nissan">Nissan</option>' +
                '<option value="ford">Ford</option>' +
                '<option value="mazda">Mazda</option>' +
                '<option value="suzuki">Suzuki</option>' +
                '<option value="hyundai">Hyundai</option>' +
              '</select>' +
            '</div>' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeModel">Model / Name</label>' +
              '<input class="contact-form__input" type="text" id="tradeModel" placeholder="e.g. Mirage G4 1.2 GLX">' +
            '</div>' +
          '</div>' +
          '<div class="contact-form__row">' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeYear">Year Model</label>' +
              '<input class="contact-form__input" type="number" id="tradeYear" placeholder="2020" min="1990" max="2030">' +
            '</div>' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradePrice">Asking Price (₱)</label>' +
              '<input class="contact-form__input" type="number" id="tradePrice" placeholder="500000">' +
            '</div>' +
          '</div>' +
          '<div class="contact-form__row">' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeOdometer">Odometer</label>' +
              '<input class="contact-form__input" type="text" id="tradeOdometer" placeholder="e.g. 25,000 km">' +
            '</div>' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeTransmission">Transmission</label>' +
              '<select class="contact-form__select" id="tradeTransmission">' +
                '<option value="Automatic">Automatic</option>' +
                '<option value="Manual">Manual</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="contact-form__row">' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeFuel">Fuel Type</label>' +
              '<select class="contact-form__select" id="tradeFuel">' +
                '<option value="Gasoline">Gasoline</option>' +
                '<option value="Diesel">Diesel</option>' +
                '<option value="Hybrid">Hybrid</option>' +
                '<option value="Electric">Electric</option>' +
              '</select>' +
            '</div>' +
            '<div class="contact-form__field">' +
              '<label class="contact-form__label" for="tradeBody">Body Type</label>' +
              '<select class="contact-form__select" id="tradeBody">' +
                '<option value="Sedan">Sedan</option>' +
                '<option value="SUV">SUV</option>' +
                '<option value="Pickup">Pickup</option>' +
                '<option value="MPV">MPV</option>' +
                '<option value="Hatchback">Hatchback</option>' +
                '<option value="Van">Van</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="contact-form__field">' +
            '<label class="contact-form__label" for="tradeCondition">Condition Notes</label>' +
            '<textarea class="contact-form__textarea" id="tradeCondition" placeholder="Describe the vehicle condition..."></textarea>' +
          '</div>' +
        '</div>' +

        '<button type="submit" class="contact-form__submit" id="btnContactSubmit">' +
          '<span id="submitBtnText">Send Message</span>' +
          '<span class="contact-form__submit-icon">&rarr;</span>' +
        '</button>' +
      '</form>' +
    '</div>';

  // === RIGHT COLUMN: Info + Contact Cards ===
  var cards = [
    {
      icon: ICONS.phone,
      title: "Phone",
      desc: "Call or text us",
      link: "tel:" + SITE_CONFIG.phoneTel,
      value: SITE_CONFIG.phone,
      linkText: SITE_CONFIG.phone,
    },
    {
      icon: ICONS.email,
      title: "Email",
      desc: "Send us an email",
      link: "mailto:" + SITE_CONFIG.email,
      value: SITE_CONFIG.email,
      linkText: SITE_CONFIG.email,
    },
    {
      icon: ICONS.facebook,
      title: "Facebook",
      desc: "Message us on Messenger",
      link: SITE_CONFIG.facebook,
      value: SITE_CONFIG.facebookDisplay,
      linkText: SITE_CONFIG.facebookDisplay,
    },
    {
      icon: ICONS.location,
      title: "Showroom",
      desc: "Visit our location",
      value: SITE_CONFIG.location,
    },
  ];

  var cardsHtml = "";
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    var contentHtml = "";
    if (c.link) {
      contentHtml =
        '<a class="contact-card__value contact-card__value--link" href="' +
        c.link +
        '"' +
        (c.title === "Facebook" ? ' target="_blank" rel="noopener"' : "") +
        ">" + escapeHtml(c.linkText) + "</a>";
    } else {
      contentHtml = '<span class="contact-card__value">' + escapeHtml(c.value) + "</span>";
    }

    cardsHtml +=
      '<div class="contact-card">' +
        '<div class="contact-card__icon">' + c.icon + '</div>' +
        '<div>' +
          '<h3 class="contact-card__title">' + escapeHtml(c.title) + '</h3>' +
          '<p class="contact-card__desc">' + escapeHtml(c.desc) + '</p>' +
          contentHtml +
        '</div>' +
      '</div>';
  }

  var infoHtml =
    '<div class="contact-info">' +
      '<div class="contact-info__intro">' +
        '<h2 class="contact-info__intro-title">Let\'s Connect</h2>' +
        '<p class="contact-info__intro-desc">Whether you\'re looking for your next car, have questions about our inventory, or want to schedule a test drive — we\'re here to help. Reach out through any of our channels below.</p>' +
      '</div>' +
      '<div class="contact-grid">' +
        cardsHtml +
      '</div>' +
    '</div>';

  layout.innerHTML = formHtml + infoHtml;

  // Bind toggling click events
  var toggleInquiry = document.getElementById("btnToggleInquiry");
  var toggleTradeIn = document.getElementById("btnToggleTradeIn");
  var formTypeInput = document.getElementById("contactFormType");
  var inquiryGroup = document.getElementById("inquiryFieldsGroup");
  var tradeInGroup = document.getElementById("tradeInFieldsGroup");
  var submitText = document.getElementById("submitBtnText");
  var formTitle = document.getElementById("contactFormTitle");
  var formSubtitle = document.getElementById("contactFormSubtitle");

  if (toggleInquiry && toggleTradeIn && formTypeInput && inquiryGroup && tradeInGroup) {
    toggleInquiry.addEventListener("click", function() {
      toggleInquiry.classList.add("active");
      toggleTradeIn.classList.remove("active");
      formTypeInput.value = "inquiry";
      inquiryGroup.style.display = "block";
      tradeInGroup.style.display = "none";
      submitText.textContent = "Send Message";
      formTitle.textContent = "Send Us a Message";
      formSubtitle.textContent = "Fill out the form below and we'll get back to you as soon as possible.";
    });

    toggleTradeIn.addEventListener("click", function() {
      toggleTradeIn.classList.add("active");
      toggleInquiry.classList.remove("active");
      formTypeInput.value = "tradein";
      inquiryGroup.style.display = "none";
      tradeInGroup.style.display = "block";
      submitText.textContent = "Submit Offer";
      formTitle.textContent = "Sell / Trade-in Your Car";
      formSubtitle.textContent = "Provide your vehicle's specifications below to receive a trade-in offer.";
    });
  }

  // Attach form submit handler
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", handleContactFormSubmit);
  }
}

/** Handle contact form submission with validation and toast */
function handleContactFormSubmit(e) {
  e.preventDefault();

  var name = document.getElementById("contactName");
  var email = document.getElementById("contactEmail");
  var phone = document.getElementById("contactPhone");
  var message = document.getElementById("contactMessage");
  var submitBtn = document.getElementById("btnContactSubmit");
  var formType = document.getElementById("contactFormType").value;

  var hasError = false;

  // Clear borders dynamically on edit (Emil style)
  var clearBorder = function (el) {
    el.addEventListener("input", function handler() {
      el.style.borderColor = "";
      el.removeEventListener("input", handler);
    });
  };

  // Validate Name
  if (!name.value.trim()) {
    name.style.borderColor = "var(--color-accent)";
    clearBorder(name);
    hasError = true;
  }

  // Validate Email
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
    email.style.borderColor = "var(--color-accent)";
    clearBorder(email);
    hasError = true;
  }

  if (formType === "inquiry") {
    // Validate Message
    if (!message.value.trim()) {
      message.style.borderColor = "var(--color-accent)";
      clearBorder(message);
      hasError = true;
    }
  } else {
    // Validate Trade-in fields
    var tradeModel = document.getElementById("tradeModel");
    var tradeYear = document.getElementById("tradeYear");
    var tradePrice = document.getElementById("tradePrice");

    if (!tradeModel.value.trim()) {
      tradeModel.style.borderColor = "var(--color-accent)";
      clearBorder(tradeModel);
      hasError = true;
    }
    if (!tradeYear.value.trim() || parseInt(tradeYear.value) < 1990 || parseInt(tradeYear.value) > 2030) {
      tradeYear.style.borderColor = "var(--color-accent)";
      clearBorder(tradeYear);
      hasError = true;
    }
    if (!tradePrice.value.trim() || parseInt(tradePrice.value) <= 0) {
      tradePrice.style.borderColor = "var(--color-accent)";
      clearBorder(tradePrice);
      hasError = true;
    }
  }

  if (hasError) return;

  // Get dynamic field values
  var nameVal = name.value.trim();
  var emailVal = email.value.trim();
  var phoneVal = phone ? phone.value.trim() : "";
  var messageVal = message ? message.value.trim() : "";

  // Submit button visual feedback
  if (submitBtn) {
    submitBtn.disabled = true;
    var originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = "<span>Sending...</span>";
  }

  // Simulate network dispatch with a slight delay
  setTimeout(function () {
    // Save to local storage for admin inbox
    var stored = localStorage.getItem("dp_admin_data");
    var adminDb = { brands: [], messages: [], notifications: [], acquisitions: [], nextCarId: 100, nextNotificationId: 10 };
    if (stored) {
      try {
        adminDb = JSON.parse(stored);
      } catch (err) {
        // use default
      }
    }

    if (!adminDb.messages) adminDb.messages = [];
    if (!adminDb.notifications) adminDb.notifications = [];
    if (!adminDb.nextNotificationId) adminDb.nextNotificationId = 10;

    if (formType === "inquiry") {
      var newMsg = {
        id: Math.floor(Math.random() * 90000) + 10000,
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        message: messageVal,
        time: new Date().toISOString(),
        read: false
      };

      adminDb.messages.unshift(newMsg);

      adminDb.notifications.unshift({
        id: adminDb.nextNotificationId++,
        type: "message",
        title: "New Inquiry from " + nameVal,
        message: messageVal.substring(0, 100) + (messageVal.length > 100 ? "..." : ""),
        time: new Date().toISOString(),
        read: false
      });
    } else {
      var brandSelect = document.getElementById("tradeBrand");
      var brandName = brandSelect.options[brandSelect.selectedIndex].text;
      var brandSlug = brandSelect.value;
      
      var tradeModelVal = document.getElementById("tradeModel").value.trim();
      var tradeYearVal = parseInt(document.getElementById("tradeYear").value);
      var tradePriceVal = parseInt(document.getElementById("tradePrice").value);
      var tradeOdometerVal = document.getElementById("tradeOdometer").value.trim() || "N/A";
      var tradeTransmissionVal = document.getElementById("tradeTransmission").value;
      var tradeFuelVal = document.getElementById("tradeFuel").value;
      var tradeBodyVal = document.getElementById("tradeBody").value;
      var tradeConditionVal = document.getElementById("tradeCondition").value.trim() || "Good condition.";

      if (!adminDb.acquisitions) adminDb.acquisitions = [];

      var newAcq = {
        id: Math.floor(Math.random() * 90000) + 10000,
        brandSlug: brandSlug,
        brandName: brandName,
        name: tradeModelVal,
        year: tradeYearVal,
        price: tradePriceVal,
        odometer: tradeOdometerVal,
        transmission: tradeTransmissionVal,
        fuel: tradeFuelVal,
        body: tradeBodyVal,
        contactLink: emailVal,
        condition: tradeConditionVal,
        time: new Date().toISOString()
      };

      adminDb.acquisitions.unshift(newAcq);

      adminDb.notifications.unshift({
        id: adminDb.nextNotificationId++,
        type: "acquisition",
        title: "New Trade-in Offer: " + brandName + " " + tradeModelVal,
        message: "Asking Price: ₱" + tradePriceVal.toLocaleString() + " | Year: " + tradeYearVal,
        time: new Date().toISOString(),
        read: false
      });
    }

    localStorage.setItem("dp_admin_data", JSON.stringify(adminDb));

    // Reset field borders
    name.style.borderColor = "";
    email.style.borderColor = "";
    if (message) message.style.borderColor = "";
    
    var tradeModelEl = document.getElementById("tradeModel");
    var tradeYearEl = document.getElementById("tradeYear");
    var tradePriceEl = document.getElementById("tradePrice");
    if (tradeModelEl) tradeModelEl.style.borderColor = "";
    if (tradeYearEl) tradeYearEl.style.borderColor = "";
    if (tradePriceEl) tradePriceEl.style.borderColor = "";

    // Clear form
    e.target.reset();

    // Show success toast
    showContactToast();

    // Restore submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }, 800);
}

/** Show a success toast notification */
function showContactToast() {
  // Remove existing toast if any
  var existing = document.getElementById("contactToast");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.className = "contact-toast";
  toast.id = "contactToast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML =
    '<span class="contact-toast__icon">✓</span>' +
    '<span>Message sent successfully! We\'ll get back to you soon.</span>';

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(function () {
    toast.classList.add("is-visible");
  });

  // Auto-dismiss using ANIMATION_CONFIG properties
  setTimeout(function () {
    toast.classList.remove("is-visible");
    setTimeout(function () {
      toast.remove();
    }, ANIMATION_CONFIG.toastRemoveDelayMs);
  }, ANIMATION_CONFIG.toastDurationMs);
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

/**
 * Track scroll position on home view to keep nav active state in sync.
 * When brandsSection is in view → highlight "brands", otherwise "home".
 */
function initHomeScrollNavTracking() {
  if (!("IntersectionObserver" in window)) return;

  var brandsSection = document.getElementById("brandsSection");
  if (!brandsSection) return;

  var brandsSectionObserver = new IntersectionObserver(
    function (entries) {
      // Only act when we are actually on the home view
      var hash = window.location.hash.slice(1) || "home";
      if (hash !== "home" && hash !== "") return;

      if (entries[0].isIntersecting) {
        // Brands section scrolled into view
        var allLinks = document.querySelectorAll(".nav__link");
        for (var i = 0; i < allLinks.length; i++) allLinks[i].classList.remove("active");
        setActiveNav("brands");
      } else {
        // Brands section scrolled out — check if we are above it (hero visible)
        var rect = brandsSection.getBoundingClientRect();
        if (rect.top > 0) {
          // User scrolled back up above brands section
          var allLinks2 = document.querySelectorAll(".nav__link");
          for (var j = 0; j < allLinks2.length; j++) allLinks2[j].classList.remove("active");
          setActiveNav("home");
        }
      }
    },
    { threshold: 0.15 }
  );

  brandsSectionObserver.observe(brandsSection);
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
  var isHome = currentHash === "home" || currentHash === "";

  if (isHome) {
    // Already on home — scroll to brands and update nav state
    var section = document.getElementById("brandsSection");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    // Manually switch nav highlight to "brands"
    var links = document.querySelectorAll(".nav__link");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove("active");
    }
    setActiveNav("brands");
  } else {
    // Coming from another page — set flag so handleRoute()
    // skips scroll-to-top and highlights "brands" instead of "home"
    _pendingBrandsScroll = true;
    window.location.hash = "home";
    // After view renders, scroll to brands section
    setTimeout(function () {
      requestAnimationFrame(function () {
        var section = document.getElementById("brandsSection");
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      });
    }, ANIMATION_CONFIG.routeScrollDelayMs);
  }
}

/** Load database from localStorage if it exists to sync with admin panel */
function initDatabase() {
  var stored = localStorage.getItem("dp_admin_data");
  if (stored) {
    try {
      var db = JSON.parse(stored);
      if (db && db.brands && db.brands.length > 0) {
        // Clear the const BRANDS array and push dynamic data to preserve reference
        BRANDS.length = 0;
        db.brands.forEach(function (b) {
          BRANDS.push(b);
        });
      }
    } catch (e) {
      console.error("Failed to sync BRANDS from localStorage", e);
    }
  }
}

/* ================================================================
   INITIALIZE
   ================================================================ */

function init() {
  // Load dynamic data first
  initDatabase();

  // Render static content
  renderHomePage();
  renderContactPage();

  // Initialize interactions
  initHamburger();
  initBackToTop();
  initNavScrollEffect();
  initRevealObserver();
  initHomeScrollNavTracking();

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

// Storage event listener to sync data and update UI in real-time across tabs
window.addEventListener("storage", function (e) {
  if (e.key === "dp_admin_data") {
    initDatabase();
    // Re-run router to refresh the active view with new data
    handleRoute();
  }
});
