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

  // Scroll to top
  window.scrollTo(0, 0);

  // Route to correct view
  switch (route) {
    case "brand":
      if (parts[1]) {
        renderBrandPage(parts[1]);
        showView("view-brand");
        setActiveNav("showroom");
      } else {
        navigateTo("showroom");
      }
      break;

    case "unit":
      if (parts[1] && parts[2] !== undefined) {
        renderUnitPage(parts[1], parseInt(parts[2], 10));
        showView("view-unit");
        setActiveNav("showroom");
      } else {
        navigateTo("showroom");
      }
      break;

    case "showroom":
      renderShowroomPage(parts[1] || "buy");
      showView("view-showroom");
      setActiveNav("showroom");
      break;

    case "contact":
      showView("view-contact");
      setActiveNav("contact");
      break;

    case "home":
    default:
      renderHomePage();
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
      '<a href="#showroom">Showroom</a>' +
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
      '<a href="#showroom">Showroom</a>' +
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
          '<li><a href="#showroom" onclick="navigateTo(\'showroom\')">Showroom</a></li>' +
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
      '<h2 class="contact-form-card__title">Send Us a Message</h2>' +
      '<p class="contact-form-card__subtitle">Fill out the form below and we\'ll get back to you as soon as possible.</p>' +
      '<form class="contact-form" id="contactForm" novalidate>' +
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
        '<div class="contact-form__field">' +
          '<label class="contact-form__label" for="contactMessage">Message</label>' +
          '<textarea class="contact-form__textarea" id="contactMessage" name="message" placeholder="I\'m interested in a vehicle..." required></textarea>' +
        '</div>' +
        '<button type="submit" class="contact-form__submit" id="btnContactSubmit">' +
          '<span>Send Message</span>' +
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

  // Attach form submit handler
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", handleContactFormSubmit);
  }
}

/* ================================================================
   RENDER: SHOWROOM PAGE
   ================================================================ */

/** Photos selected for the sell form — reset on each renderSellTab() call */
var _sellPhotos = [];

/** Active filter state for the Buy tab */
var _showroomFilters = { brand: "all", body: "all", price: "all", fuel: "all" };

/**
 * Renders the Showroom page and activates the given tab.
 * @param {string} [activeTab="buy"] - "buy" | "rent" | "sell"
 */
function renderShowroomPage(activeTab) {
  var tab = activeTab || "buy";
  var tabs = document.querySelectorAll(".showroom-tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle("active", tabs[i].dataset.tab === tab);
    tabs[i].addEventListener("click", createTabClickHandler(tabs[i].dataset.tab));
  }
  renderShowroomTab(tab);
  document.title = "Showroom \u2014 " + SITE_CONFIG.name;
}

/** Factory for tab button click handlers (avoids closure issues in loops) */
function createTabClickHandler(tab) {
  return function () { switchShowroomTab(tab); };
}

/** Switches the active tab with a 150ms fade-and-rise transition (Emil rule: no ease-in) */
function switchShowroomTab(tab) {
  var tabs = document.querySelectorAll(".showroom-tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle("active", tabs[i].dataset.tab === tab);
  }
  var content = document.getElementById("showroomContent");
  if (!content) return;
  content.style.transition = "opacity 150ms cubic-bezier(0.16,1,0.3,1), transform 150ms cubic-bezier(0.16,1,0.3,1)";
  content.style.opacity = "0";
  content.style.transform = "translateY(6px)";
  setTimeout(function () {
    renderShowroomTab(tab);
    content.style.opacity = "1";
    content.style.transform = "translateY(0)";
    setTimeout(observeRevealElements, 60);
  }, 150);
}

/** Routes to the correct tab render function */
function renderShowroomTab(tab) {
  if (tab === "buy") {
    _showroomFilters = { brand: "all", body: "all", price: "all", fuel: "all" };
    renderBuyTab();
  } else if (tab === "rent") {
    renderRentTab();
  } else if (tab === "sell") {
    renderSellTab();
  }
}

/* ================================================================
   BUY TAB
   ================================================================ */

/**
 * Collects all For Sale (non-rent, non-hidden) units across all brands.
 * @returns {Array<{brand: Object, unit: Object, index: number}>}
 */
function getAllSaleUnits() {
  var result = [];
  for (var b = 0; b < BRANDS.length; b++) {
    var brand = BRANDS[b];
    for (var u = 0; u < brand.units.length; u++) {
      var unit = brand.units[u];
      if (unit.active !== false && unit.listingType !== "rent") {
        result.push({ brand: brand, unit: unit, index: u });
      }
    }
  }
  return result;
}

/** Renders the Buy tab: filter bar + flat inventory grid */
function renderBuyTab() {
  var content = document.getElementById("showroomContent");
  if (!content) return;

  var brandOptions = BRANDS.map(function (b) {
    return '<option value="' + escapeHtml(b.name.toLowerCase()) + '">' + escapeHtml(b.name) + "</option>";
  }).join("");

  content.innerHTML =
    '<div class="inventory-filter-bar reveal">' +
      '<div class="inventory-filter-group">' +
        '<label class="inventory-filter-label" for="filterBrand">Brand</label>' +
        '<select class="inventory-filter-select" id="filterBrand">' +
          '<option value="all">All Brands</option>' + brandOptions +
        "</select>" +
      "</div>" +
      '<div class="inventory-filter-group">' +
        '<label class="inventory-filter-label" for="filterBody">Body Type</label>' +
        '<select class="inventory-filter-select" id="filterBody">' +
          '<option value="all">All Types</option>' +
          '<option value="Sedan">Sedan</option>' +
          '<option value="SUV">SUV</option>' +
          '<option value="Pickup">Pickup</option>' +
          '<option value="MPV">MPV</option>' +
          '<option value="Hatchback">Hatchback</option>' +
          '<option value="Van">Van</option>' +
        "</select>" +
      "</div>" +
      '<div class="inventory-filter-group">' +
        '<label class="inventory-filter-label" for="filterPrice">Price Range</label>' +
        '<select class="inventory-filter-select" id="filterPrice">' +
          '<option value="all">Any Price</option>' +
          '<option value="under500">Under \u20b1500K</option>' +
          '<option value="500to1m">\u20b1500K \u2013 \u20b11M</option>' +
          '<option value="1mto2m">\u20b11M \u2013 \u20b12M</option>' +
          '<option value="over2m">Over \u20b12M</option>' +
        "</select>" +
      "</div>" +
      '<div class="inventory-filter-group">' +
        '<label class="inventory-filter-label" for="filterFuel">Fuel Type</label>' +
        '<select class="inventory-filter-select" id="filterFuel">' +
          '<option value="all">All Fuels</option>' +
          '<option value="Gasoline">Gasoline</option>' +
          '<option value="Diesel">Diesel</option>' +
          '<option value="Hybrid">Hybrid</option>' +
          '<option value="Electric">Electric</option>' +
        "</select>" +
      "</div>" +
    "</div>" +
    '<p class="inventory-results-bar" id="inventoryResultsBar"></p>' +
    '<div class="inventory-grid" id="inventoryGrid"></div>';

  renderInventoryGrid(getAllSaleUnits());

  var filterIds = ["filterBrand", "filterBody", "filterPrice", "filterFuel"];
  for (var i = 0; i < filterIds.length; i++) {
    var el = document.getElementById(filterIds[i]);
    if (el) el.addEventListener("change", applyShowroomFilters);
  }
}

/** Reads current filter dropdowns and re-renders the inventory grid */
function applyShowroomFilters() {
  var brandEl = document.getElementById("filterBrand");
  var bodyEl = document.getElementById("filterBody");
  var priceEl = document.getElementById("filterPrice");
  var fuelEl = document.getElementById("filterFuel");

  _showroomFilters = {
    brand: brandEl ? brandEl.value : "all",
    body: bodyEl ? bodyEl.value : "all",
    price: priceEl ? priceEl.value : "all",
    fuel: fuelEl ? fuelEl.value : "all",
  };

  var filtered = getAllSaleUnits().filter(function (item) {
    var u = item.unit;
    var brandMatch = _showroomFilters.brand === "all" || item.brand.name.toLowerCase() === _showroomFilters.brand;
    var bodyMatch = _showroomFilters.body === "all" || u.body === _showroomFilters.body;
    var fuelMatch = _showroomFilters.fuel === "all" || u.fuel === _showroomFilters.fuel;
    var priceMatch = true;
    if (_showroomFilters.price !== "all" && u.price !== null && u.price !== undefined) {
      if (_showroomFilters.price === "under500") priceMatch = u.price < 500000;
      else if (_showroomFilters.price === "500to1m") priceMatch = u.price >= 500000 && u.price <= 1000000;
      else if (_showroomFilters.price === "1mto2m") priceMatch = u.price > 1000000 && u.price <= 2000000;
      else if (_showroomFilters.price === "over2m") priceMatch = u.price > 2000000;
    }
    return brandMatch && bodyMatch && fuelMatch && priceMatch;
  });

  renderInventoryGrid(filtered);
}

/**
 * Renders the flat inventory grid.
 * @param {Array<{brand: Object, unit: Object, index: number}>} units
 */
function renderInventoryGrid(units) {
  var grid = document.getElementById("inventoryGrid");
  var bar = document.getElementById("inventoryResultsBar");
  if (!grid) return;

  if (bar) {
    bar.textContent = units.length + " vehicle" + (units.length !== 1 ? "s" : "") + " found";
  }

  grid.innerHTML = "";
  if (units.length === 0) {
    grid.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state__icon">\ud83d\udd0d</div>' +
        '<p class="empty-state__text">No vehicles match your filters. Try adjusting your search.</p>' +
      "</div>";
    return;
  }

  for (var i = 0; i < units.length; i++) {
    var card = createCarCard(units[i].brand, units[i].unit, units[i].index, i, false);
    grid.appendChild(card);
  }
}

/* ================================================================
   RENT TAB
   ================================================================ */

/**
 * Collects all For Rent units across all brands.
 * @returns {Array<{brand: Object, unit: Object, index: number}>}
 */
function getAllRentUnits() {
  var result = [];
  for (var b = 0; b < BRANDS.length; b++) {
    var brand = BRANDS[b];
    for (var u = 0; u < brand.units.length; u++) {
      var unit = brand.units[u];
      if (unit.active !== false && unit.listingType === "rent") {
        result.push({ brand: brand, unit: unit, index: u });
      }
    }
  }
  return result;
}

/** Renders the Rent tab: rental unit cards with daily rates */
function renderRentTab() {
  var content = document.getElementById("showroomContent");
  if (!content) return;

  var rentUnits = getAllRentUnits();

  if (rentUnits.length === 0) {
    content.innerHTML =
      '<div class="empty-state" style="padding:var(--sp-16) 0;">' +
        '<div class="empty-state__icon">\ud83d\udd11</div>' +
        '<p class="empty-state__text">No rental units available at the moment. Please check back soon.</p>' +
        '<button class="btn btn--primary" onclick="navigateTo(\'contact\')" type="button" style="margin-top:var(--sp-5);">Contact Us</button>' +
      "</div>";
    return;
  }

  var html = '<div class="inventory-grid inventory-grid--rent">';
  for (var i = 0; i < rentUnits.length; i++) {
    html += createRentCard(rentUnits[i].brand, rentUnits[i].unit, rentUnits[i].index, i);
  }
  html += "</div>";
  content.innerHTML = html;
}

/**
 * Builds an HTML string for a single rental car card.
 * @param {Object} brand
 * @param {Object} unit
 * @param {number} unitIndex
 * @param {number} staggerIndex
 * @returns {string}
 */
function createRentCard(brand, unit, unitIndex, staggerIndex) {
  var imgSrc = getCarImage(unit.images[0], IMAGE_CONFIG.cardWidth, IMAGE_CONFIG.cardHeight);
  var rateDisplay = unit.dailyRate
    ? "\u20b1" + unit.dailyRate.toLocaleString("en-PH") + '<span class="rent-card__rate-period">/day</span>'
    : '<span class="rent-card__rate-call">Contact for Rate</span>';

  return (
    '<div class="rent-card reveal" style="transition-delay:' + staggerIndex * ANIMATION_CONFIG.staggerDelayMs + 'ms">' +
      '<div class="rent-card__image-wrap">' +
        '<img class="rent-card__image" src="' + imgSrc + '" ' +
          'alt="' + escapeHtml(brand.name + " " + unit.name) + '" loading="lazy" ' +
          'onerror="this.src=\'' + getPlaceholderSvg(brand.name) + '\'">' +
        '<span class="rent-card__badge">For Rent</span>' +
      "</div>" +
      '<div class="rent-card__body">' +
        '<h3 class="rent-card__title">' + escapeHtml(brand.name + " " + unit.name) + "</h3>" +
        '<p class="rent-card__year">' + unit.year + " \u00b7 " + escapeHtml(unit.body) + "</p>" +
        '<div class="rent-card__specs">' +
          '<span class="spec-chip">\u2699 ' + escapeHtml(unit.transmission) + "</span>" +
          '<span class="spec-chip">\u26fd " + escapeHtml(unit.fuel) + "</span>" +
          '<span class="spec-chip">\ud83d\udccd ' + escapeHtml(unit.odometer) + "</span>" +
        "</div>" +
        '<div class="rent-card__rate">' + rateDisplay + "</div>" +
        '<button class="rent-card__cta" onclick="navigateTo(\'contact\')" type="button" ' +
          'id="btnRent-' + brand.slug + "-" + unitIndex + '">Book Now \u2192</button>' +
      "</div>" +
    "</div>"
  );
}

/* ================================================================
   SELL TAB
   ================================================================ */

/**
 * Builds <option> elements from the BRANDS array for the brand dropdown.
 * @returns {string}
 */
function buildBrandOptions() {
  return BRANDS.map(function (b) {
    return '<option value="' + escapeHtml(b.slug) + '">' + escapeHtml(b.name) + "</option>";
  }).join("") + '<option value="other">Other</option>';
}

/**
 * Renders a single benefit list item for the sell benefits panel.
 * @param {string} title
 * @param {string} desc
 * @returns {string}
 */
function createBenefitItem(title, desc) {
  return (
    '<div class="sell-benefit-item">' +
      '<span class="sell-benefit-item__icon" aria-hidden="true">\u2713</span>' +
      "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(desc) + "</p></div>" +
    "</div>"
  );
}

/** Renders the Sell / Trade-in tab with split layout: benefits panel + wizard form */
function renderSellTab() {
  var content = document.getElementById("showroomContent");
  if (!content) return;

  content.innerHTML =
    '<div class="sell-split">' +

      '<div class="sell-benefits">' +
        '<span class="sell-benefits__tag">Sell or Trade-In</span>' +
        '<h2 class="sell-benefits__title">Get the Best<br>Value for Your Car</h2>' +
        '<p class="sell-benefits__subtitle">Join hundreds of satisfied sellers who trusted DrivePinas for a fair, fast, and hassle-free experience.</p>' +
        '<div class="sell-benefits__list">' +
          createBenefitItem("Free Professional Valuation", "Our experts assess your vehicle at no cost to you.") +
          createBenefitItem("Fast, Hassle-Free Process", "Submit details online — we'll reach out within 24 hours.") +
          createBenefitItem("Trusted by Hundreds", "A track record of fair deals and transparent pricing.") +
        "</div>" +
        '<div class="sell-benefits__stats">' +
          '<div class="sell-benefits__stat"><span class="sell-benefits__stat-value">500+</span><span class="sell-benefits__stat-label">Cars Acquired</span></div>' +
          '<div class="sell-benefits__stat"><span class="sell-benefits__stat-value">24h</span><span class="sell-benefits__stat-label">Response Time</span></div>' +
          '<div class="sell-benefits__stat"><span class="sell-benefits__stat-value">100%</span><span class="sell-benefits__stat-label">Free Valuation</span></div>' +
        "</div>" +
      "</div>" +

      '<div class="sell-form-wrapper">' +
        '<div class="sell-wizard-card">' +
          '<div class="wizard-header">' +
            '<span class="wizard-step-label">Step <span id="wizardStepNum">1</span> of 2</span>' +
            '<div class="wizard-progress-track"><div class="wizard-progress-fill" id="wizardProgressFill" style="width:50%"></div></div>' +
          "</div>" +

          '<form id="sellForm" novalidate>' +

            '<div class="wizard-step" id="sellStep1">' +
              '<h3 class="sell-wizard-card__title">Vehicle Details</h3>' +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeBrand">Brand</label>' +
                  '<select class="contact-form__select" id="tradeBrand">' + buildBrandOptions() + "</select></div>" +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeModel">Model / Name <span class="sell-required">*</span></label>' +
                  '<input class="contact-form__input" type="text" id="tradeModel" placeholder="e.g. Civic 1.5 RS Turbo" required></div>' +
              "</div>" +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeVariant">Variant / Trim</label>' +
                  '<input class="contact-form__input" type="text" id="tradeVariant" placeholder="e.g. 1.5 V AT"></div>' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeYear">Year Model <span class="sell-required">*</span></label>' +
                  '<input class="contact-form__input" type="number" id="tradeYear" placeholder="2020" min="1990" max="2030" required></div>' +
              "</div>" +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeColor">Color</label>' +
                  '<input class="contact-form__input" type="text" id="tradeColor" placeholder="e.g. Pearl White"></div>' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeOdometer">Odometer Reading</label>' +
                  '<input class="contact-form__input" type="text" id="tradeOdometer" placeholder="e.g. 45,000 km"></div>' +
              "</div>" +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeBody">Body Type <span class="sell-required">*</span></label>' +
                  '<select class="contact-form__select" id="tradeBody">' +
                    '<option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Pickup">Pickup</option>' +
                    '<option value="MPV">MPV</option><option value="Hatchback">Hatchback</option><option value="Van">Van</option>' +
                    '<option value="Coupe">Coupe</option><option value="Other">Other</option>' +
                  "</select></div>" +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeTransmission">Transmission <span class="sell-required">*</span></label>' +
                  '<select class="contact-form__select" id="tradeTransmission">' +
                    '<option value="Automatic">Automatic</option><option value="Manual">Manual</option>' +
                    '<option value="CVT">CVT</option><option value="DCT">DCT (Dual Clutch)</option>' +
                  "</select></div>" +
              "</div>" +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeFuel">Fuel Type <span class="sell-required">*</span></label>' +
                  '<select class="contact-form__select" id="tradeFuel">' +
                    '<option value="Gasoline">Gasoline</option><option value="Diesel">Diesel</option>' +
                    '<option value="Hybrid">Hybrid</option><option value="Electric">Electric</option>' +
                  "</select></div>" +
                '<div class="contact-form__field"><label class="contact-form__label" for="tradeOwners">Previous Owners</label>' +
                  '<select class="contact-form__select" id="tradeOwners">' +
                    '<option value="1st">1st Owner</option><option value="2nd">2nd Owner</option><option value="3rd+">3rd Owner or More</option>' +
                  "</select></div>" +
              "</div>" +
              '<div class="contact-form__field"><label class="contact-form__label" for="tradePrice">Asking Price (\u20b1) <span class="sell-required">*</span></label>' +
                '<input class="contact-form__input" type="number" id="tradePrice" placeholder="e.g. 850000" min="1" required></div>' +
              '<button type="button" class="contact-form__submit" id="btnSellNext" style="margin-top:var(--sp-5);">' +
                '<span>Continue</span><span class="contact-form__submit-icon">&rarr;</span>' +
              "</button>" +
            "</div>" +

            '<div class="wizard-step" id="sellStep2" style="display:none;">' +
              '<h3 class="sell-wizard-card__title">Condition, Photos &amp; Your Details</h3>' +
              '<div class="contact-form__field"><label class="contact-form__label">Overall Condition <span class="sell-required">*</span></label>' +
                '<div class="condition-radio-group" id="conditionGroup">' +
                  '<label class="condition-radio"><input type="radio" name="tradeConditionRating" value="Excellent" id="condExcellent"><span class="condition-radio__label condition-radio__label--excellent">Excellent</span></label>' +
                  '<label class="condition-radio"><input type="radio" name="tradeConditionRating" value="Good" id="condGood" checked><span class="condition-radio__label condition-radio__label--good">Good</span></label>' +
                  '<label class="condition-radio"><input type="radio" name="tradeConditionRating" value="Fair" id="condFair"><span class="condition-radio__label condition-radio__label--fair">Fair</span></label>' +
                  '<label class="condition-radio"><input type="radio" name="tradeConditionRating" value="Poor" id="condPoor"><span class="condition-radio__label condition-radio__label--poor">Poor</span></label>' +
                "</div></div>" +
              '<div class="contact-form__field"><label class="contact-form__label" for="tradeRegStatus">Registration Status <span class="sell-required">*</span></label>' +
                '<select class="contact-form__select" id="tradeRegStatus">' +
                  '<option value="OR/CR Complete">OR/CR Complete</option><option value="Expired">Expired</option><option value="For Transfer">For Transfer</option>' +
                "</select></div>" +
              '<div class="contact-form__field"><label class="contact-form__label" for="tradeIssues">Known Issues</label>' +
                '<textarea class="contact-form__textarea" id="tradeIssues" placeholder="Mechanical issues, body damage, accidents, etc. Leave blank if none." style="min-height:80px;"></textarea></div>' +
              '<div class="contact-form__field"><label class="contact-form__label" for="tradeDescription">Description</label>' +
                '<textarea class="contact-form__textarea" id="tradeDescription" placeholder="Highlight your car\'s best features, recent servicing, accessories, or reasons for selling..." style="min-height:90px;"></textarea></div>' +
              '<div class="contact-form__field">' +
                '<label class="contact-form__label">Photos <span class="sell-required-note">(up to 7 \u00b7 auto-compressed)</span></label>' +
                '<div class="photo-upload-zone" id="photoUploadZone" role="button" tabindex="0" aria-label="Click to upload photos">' +
                  '<input type="file" id="photoFileInput" accept="image/*" multiple style="display:none;">' +
                  '<div class="photo-upload-zone__inner">' +
                    '<div class="photo-upload-zone__icon">\ud83d\udcf7</div>' +
                    '<p class="photo-upload-zone__text">Click or drag photos here</p>' +
                    '<p class="photo-upload-zone__hint">JPEG &nbsp;\u00b7&nbsp; PNG &nbsp;\u00b7&nbsp; WEBP &nbsp;\u00b7&nbsp; Max 7 photos &nbsp;\u00b7&nbsp; Auto-compressed</p>' +
                  "</div>" +
                "</div>" +
                '<p class="photo-counter" id="photoCounter" style="display:none;"></p>' +
                '<div class="photo-preview-grid" id="photoPreviewGrid"></div>' +
              "</div>" +
              '<div class="contact-form__row">' +
                '<div class="contact-form__field"><label class="contact-form__label" for="sellName">Full Name <span class="sell-required">*</span></label>' +
                  '<input class="contact-form__input" type="text" id="sellName" placeholder="Juan Dela Cruz" required></div>' +
                '<div class="contact-form__field"><label class="contact-form__label" for="sellEmail">Email Address <span class="sell-required">*</span></label>' +
                  '<input class="contact-form__input" type="email" id="sellEmail" placeholder="juan@email.com" required></div>' +
              "</div>" +
              '<div class="contact-form__field"><label class="contact-form__label" for="sellPhone">Phone Number</label>' +
                '<input class="contact-form__input" type="tel" id="sellPhone" placeholder="+63 9XX XXX XXXX"></div>' +
              '<div class="wizard-actions">' +
                '<button type="button" class="btn btn--outline" id="btnSellBack">&larr; Back</button>' +
                '<button type="submit" class="contact-form__submit" id="btnSellSubmit">' +
                  '<span id="btnSellSubmitText">Submit Offer</span><span class="contact-form__submit-icon">&rarr;</span>' +
                "</button>" +
              "</div>" +
              '<p class="upload-progress-text" id="uploadProgressText" style="display:none;"></p>' +
            "</div>" +

          "</form>" +
        "</div>" +
      "</div>" +
    "</div>";

  _sellPhotos = [];
  initSellWizard();
}

/** Wires up all event listeners for the sell wizard form */
function initSellWizard() {
  var nextBtn = document.getElementById("btnSellNext");
  var backBtn = document.getElementById("btnSellBack");
  var step1 = document.getElementById("sellStep1");
  var step2 = document.getElementById("sellStep2");
  var form = document.getElementById("sellForm");
  var stepNum = document.getElementById("wizardStepNum");
  var progressFill = document.getElementById("wizardProgressFill");
  var photoZone = document.getElementById("photoUploadZone");
  var fileInput = document.getElementById("photoFileInput");

  if (!nextBtn || !backBtn || !step1 || !step2 || !form) return;

  var clearBorderOnInput = function (el) {
    el.addEventListener("input", function handler() {
      el.style.borderColor = "";
      el.removeEventListener("input", handler);
    });
  };

  // Validate Step 1 and advance to Step 2
  nextBtn.addEventListener("click", function () {
    var tradeModel = document.getElementById("tradeModel");
    var tradeYear = document.getElementById("tradeYear");
    var tradePrice = document.getElementById("tradePrice");
    var hasError = false;

    if (!tradeModel.value.trim()) {
      tradeModel.style.borderColor = "var(--color-accent)";
      clearBorderOnInput(tradeModel);
      hasError = true;
    }
    var yearVal = parseInt(tradeYear.value, 10);
    if (!tradeYear.value.trim() || yearVal < SELL_FORM_CONFIG.minYear || yearVal > SELL_FORM_CONFIG.maxYear) {
      tradeYear.style.borderColor = "var(--color-accent)";
      clearBorderOnInput(tradeYear);
      hasError = true;
    }
    if (!tradePrice.value.trim() || parseInt(tradePrice.value, 10) <= 0) {
      tradePrice.style.borderColor = "var(--color-accent)";
      clearBorderOnInput(tradePrice);
      hasError = true;
    }
    if (hasError) return;

    step1.style.display = "none";
    step2.style.display = "block";
    if (stepNum) stepNum.textContent = "2";
    if (progressFill) progressFill.style.width = "100%";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Go back to Step 1
  backBtn.addEventListener("click", function () {
    step2.style.display = "none";
    step1.style.display = "block";
    if (stepNum) stepNum.textContent = "1";
    if (progressFill) progressFill.style.width = "50%";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Photo upload zone interactions
  if (photoZone && fileInput) {
    photoZone.addEventListener("click", function () { fileInput.click(); });
    photoZone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
    });
    photoZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      photoZone.classList.add("is-dragover");
    });
    photoZone.addEventListener("dragleave", function () { photoZone.classList.remove("is-dragover"); });
    photoZone.addEventListener("drop", function (e) {
      e.preventDefault();
      photoZone.classList.remove("is-dragover");
      handlePhotoFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", function () {
      handlePhotoFiles(fileInput.files);
      fileInput.value = "";
    });
  }

  form.addEventListener("submit", handleSellFormSubmit);
}

/**
 * Handles new photo files: compresses each and adds to _sellPhotos.
 * @param {FileList} files
 */
function handlePhotoFiles(files) {
  var remaining = SELL_FORM_CONFIG.maxPhotos - _sellPhotos.length;
  if (remaining <= 0) {
    showSellError("Maximum " + SELL_FORM_CONFIG.maxPhotos + " photos allowed. Remove one to add another.");
    return;
  }
  var toProcess = Math.min(files.length, remaining);
  for (var i = 0; i < toProcess; i++) {
    (function (file) {
      compressImage(file).then(function (blob) {
        _sellPhotos.push({ file: file, blob: blob });
        updatePhotoPreview();
      }).catch(function () {
        showSellError("Could not process \"" + file.name + "\". Please try a different image.");
      });
    })(files[i]);
  }
}

/** Re-renders the photo preview grid from _sellPhotos */
function updatePhotoPreview() {
  var grid = document.getElementById("photoPreviewGrid");
  var counter = document.getElementById("photoCounter");
  if (!grid) return;

  if (counter) {
    counter.textContent = _sellPhotos.length + " / " + SELL_FORM_CONFIG.maxPhotos +
      " photo" + (_sellPhotos.length !== 1 ? "s" : "") + " added";
    counter.style.display = _sellPhotos.length > 0 ? "block" : "none";
  }

  grid.innerHTML = "";
  for (var i = 0; i < _sellPhotos.length; i++) {
    grid.innerHTML += renderPhotoPreviewItem(_sellPhotos[i].file, _sellPhotos[i].blob, i);
  }

  var removeBtns = grid.querySelectorAll(".photo-preview-item__remove");
  for (var j = 0; j < removeBtns.length; j++) {
    removeBtns[j].addEventListener("click", createRemovePhotoHandler(parseInt(removeBtns[j].dataset.index, 10)));
  }
}

/** Factory for photo remove button handlers — avoids closure issues in loops */
function createRemovePhotoHandler(index) {
  return function () {
    _sellPhotos.splice(index, 1);
    updatePhotoPreview();
  };
}

/**
 * Builds HTML for a single photo preview item showing original vs compressed size.
 * @param {File} file - Original image file
 * @param {Blob} blob - Compressed JPEG blob
 * @param {number} index - Position in _sellPhotos array
 * @returns {string}
 */
function renderPhotoPreviewItem(file, blob, index) {
  var origKb = (file.size / 1024).toFixed(0);
  var compKb = (blob.size / 1024).toFixed(0);
  var url = URL.createObjectURL(blob);
  return (
    '<div class="photo-preview-item">' +
      '<img class="photo-preview-item__img" src="' + url + '" alt="Photo ' + (index + 1) + '">' +
      '<button class="photo-preview-item__remove" type="button" data-index="' + index +
        '" aria-label="Remove photo ' + (index + 1) + '">\u00d7</button>' +
      '<span class="photo-size-badge">' + origKb + "KB \u2192 " + compKb + "KB</span>" +
    "</div>"
  );
}

/**
 * Compresses an image File using the Canvas API.
 * Resizes to max 1280px wide and encodes as JPEG at 80% quality.
 * @param {File} file - Original image File object.
 * @returns {Promise<Blob>} Compressed JPEG blob.
 */
function compressImage(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error("FileReader failed for: " + file.name)); };
    reader.onload = function (evt) {
      var img = new Image();
      img.onerror = function () { reject(new Error("Image load failed for: " + file.name)); };
      img.onload = function () {
        var maxW = SELL_FORM_CONFIG.maxImageWidthPx;
        var scale = img.width > maxW ? maxW / img.width : 1;
        var w = Math.round(img.width * scale);
        var h = Math.round(img.height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          function (blob) {
            if (blob) { resolve(blob); }
            else { reject(new Error("Canvas toBlob returned null for: " + file.name)); }
          },
          "image/jpeg",
          SELL_FORM_CONFIG.jpegQuality
        );
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Shows an inline error message inside the sell form (auto-removes after 4s) */
function showSellError(msg) {
  var existing = document.getElementById("sellErrorMsg");
  if (existing) existing.remove();
  var el = document.createElement("p");
  el.id = "sellErrorMsg";
  el.setAttribute("role", "alert");
  el.style.cssText = "color:var(--color-accent);font-size:var(--fs-sm);margin-top:var(--sp-3);text-align:center;";
  el.textContent = msg;
  var step2 = document.getElementById("sellStep2");
  if (step2) step2.appendChild(el);
  setTimeout(function () { if (el.parentNode) el.remove(); }, 4000);
}

/** Handle contact form submission with validation and toast */
function handleContactFormSubmit(e) {
  e.preventDefault();

  var name = document.getElementById("contactName");
  var email = document.getElementById("contactEmail");
  var phone = document.getElementById("contactPhone");
  var message = document.getElementById("contactMessage");
  var submitBtn = document.getElementById("btnContactSubmit");

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

  // Validate Message
  if (!message.value.trim()) {
    message.style.borderColor = "var(--color-accent)";
    clearBorder(message);
    hasError = true;
  }

  if (hasError) return;

  // Get dynamic field values
  var nameVal = name.value.trim();
  var emailVal = email.value.trim();
  var phoneVal = phone ? phone.value.trim() : "";
  var messageVal = message.value.trim();

  // Submit button visual feedback
  if (submitBtn) {
    submitBtn.disabled = true;
    var originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = "<span>Sending...</span>";
  }

  // Simulate network dispatch with a slight delay
  setTimeout(function () {
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

    localStorage.setItem("dp_admin_data", JSON.stringify(adminDb));

    // Reset field borders
    name.style.borderColor = "";
    email.style.borderColor = "";
    message.style.borderColor = "";

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

/**
 * Handles the Sell/Trade-in wizard form submission.
 * Validates fields, compresses photos, uploads to Cloudinary, and saves to Supabase.
 * @param {Event} e - Submit event
 */
function handleSellFormSubmit(e) {
  e.preventDefault();

  var name = document.getElementById("sellName");
  var email = document.getElementById("sellEmail");
  var phone = document.getElementById("sellPhone");
  
  var brandSelect = document.getElementById("tradeBrand");
  var brandSlug = brandSelect ? brandSelect.value : "other";
  
  var model = document.getElementById("tradeModel");
  var variant = document.getElementById("tradeVariant");
  var year = document.getElementById("tradeYear");
  var color = document.getElementById("tradeColor");
  var odometer = document.getElementById("tradeOdometer");
  var body = document.getElementById("tradeBody");
  var transmission = document.getElementById("tradeTransmission");
  var fuel = document.getElementById("tradeFuel");
  var owners = document.getElementById("tradeOwners");
  var price = document.getElementById("tradePrice");
  
  var condRating = document.querySelector('input[name="tradeConditionRating"]:checked');
  var condRatingVal = condRating ? condRating.value : "Good";
  
  var regStatus = document.getElementById("tradeRegStatus");
  var knownIssues = document.getElementById("tradeIssues");
  var description = document.getElementById("tradeDescription");
  
  var submitBtn = document.getElementById("btnSellSubmit");
  var progressText = document.getElementById("uploadProgressText");

  var hasError = false;

  var clearBorder = function (el) {
    el.addEventListener("input", function handler() {
      el.style.borderColor = "";
      el.removeEventListener("input", handler);
    });
  };

  // Validate Step 2 fields
  if (!name || !name.value.trim()) {
    if (name) name.style.borderColor = "var(--color-accent)";
    if (name) clearBorder(name);
    hasError = true;
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.value.trim() || !emailRegex.test(email.value.trim())) {
    if (email) email.style.borderColor = "var(--color-accent)";
    if (email) clearBorder(email);
    hasError = true;
  }

  if (hasError) {
    showSellError("Please fill in all required seller details.");
    return;
  }

  // Double check Step 1 fields just in case
  if (!model || !model.value.trim()) hasError = true;
  var yearVal = year ? parseInt(year.value, 10) : 0;
  if (!year || !year.value.trim() || yearVal < SELL_FORM_CONFIG.minYear || yearVal > SELL_FORM_CONFIG.maxYear) hasError = true;
  if (!price || !price.value.trim() || parseInt(price.value, 10) <= 0) hasError = true;

  if (hasError) {
    showSellError("Please go back and correct errors in vehicle details.");
    return;
  }

  // Visual loading feedback
  if (submitBtn) submitBtn.disabled = true;
  if (progressText) {
    progressText.textContent = "Processing photos...";
    progressText.style.display = "block";
  }

  // Upload photos one by one to Cloudinary
  var uploadPromises = _sellPhotos.map(function (photoObj, idx) {
    return function () {
      if (progressText) {
        progressText.textContent = "Uploading photo " + (idx + 1) + " of " + _sellPhotos.length + "...";
      }
      return uploadPhotoToCloudinary(photoObj.blob);
    };
  });

  // Execute sequential uploads to avoid overloading bandwidth and get accurate progress
  var photoUrls = [];
  var uploadChain = Promise.resolve();

  uploadPromises.forEach(function (uploadFn) {
    uploadChain = uploadChain.then(uploadFn).then(function (url) {
      photoUrls.push(url);
    });
  });

  uploadChain
    .then(function () {
      if (progressText) {
        progressText.textContent = "Saving submission...";
      }
      
      var submissionData = {
        brand: brandSlug,
        model: model.value.trim(),
        variant: variant ? variant.value.trim() || null : null,
        year: yearVal,
        color: color ? color.value.trim() || null : null,
        body_type: body ? body.value : "Other",
        transmission: transmission ? transmission.value : "Automatic",
        fuel_type: fuel ? fuel.value : "Gasoline",
        odometer: odometer ? odometer.value.trim() || null : null,
        num_owners: owners ? owners.value : "1st",
        asking_price: parseInt(price.value, 10),
        condition: condRatingVal,
        registration_status: regStatus ? regStatus.value : "OR/CR Complete",
        known_issues: knownIssues ? knownIssues.value.trim() || null : null,
        description: description ? description.value.trim() || null : null,
        photo_urls: photoUrls,
        seller_name: name.value.trim(),
        seller_email: email.value.trim(),
        seller_phone: phone ? phone.value.trim() || null : null,
        status: "pending"
      };

      return saveSellSubmission(submissionData);
    })
    .then(function () {
      // Success!
      if (progressText) progressText.style.display = "none";
      
      // Reset form & state
      e.target.reset();
      _sellPhotos = [];
      updatePhotoPreview();
      
      // Show success toast
      showContactToast();
      
      // Return to tab/sell view
      renderSellTab();
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
    .catch(function (err) {
      console.error("Submission failed:", err);
      showSellError("Submission failed. Please check your connection and try again.");
    })
    .finally(function () {
      if (submitBtn) submitBtn.disabled = false;
      if (progressText) progressText.style.display = "none";
    });
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
