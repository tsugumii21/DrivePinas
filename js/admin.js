"use strict";

/* ================================================================
   CONSTANTS
   ================================================================ */

var SESSION_KEY = 'dp_admin_session';
var DATA_KEY = 'dp_admin_data';
var PROFILE_KEY = 'dp_admin_profile';
var PASSWORD_KEY = 'dp_admin_pw_hash';

/* ================================================================
   DATA STORE
   ================================================================ */

var adminData = {
  brands: [],
  messages: [],
  notifications: [],
  acquisitions: [],
  nextCarId: 100,
  nextNotificationId: 10
};

/* ================================================================
   AUTHENTICATION & SECURITY
   ================================================================ */

async function hashString(str) {
  var encoder = new TextEncoder();
  var data = encoder.encode(str);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function initAuth() {
  var storedHash = localStorage.getItem(PASSWORD_KEY);
  if (!storedHash) {
    // Set default password 'drivepinas2026'
    storedHash = await hashString('drivepinas2026');
    localStorage.setItem(PASSWORD_KEY, storedHash);
  }

  var session = sessionStorage.getItem(SESSION_KEY);
  if (session === 'authenticated') {
    showAdminPanel();
  } else {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('adminLayout').style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  var passwordInput = document.getElementById('loginPassword');
  var errorEl = document.getElementById('loginError');
  var password = passwordInput.value;

  if (!password) {
    errorEl.textContent = 'Please enter a password';
    passwordInput.classList.add('error');
    return;
  }

  var hash = await hashString(password);
  var storedHash = localStorage.getItem(PASSWORD_KEY);

  if (hash === storedHash) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
    errorEl.textContent = '';
    passwordInput.classList.remove('error');
    showAdminPanel();
  } else {
    errorEl.textContent = 'Incorrect password';
    passwordInput.classList.add('error');
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function showAdminPanel() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('adminLayout').style.display = '';
  initApp();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

/* ================================================================
   DATA INITIALIZATION
   ================================================================ */

function initData() {
  var stored = localStorage.getItem(DATA_KEY);
  if (stored) {
    try {
      adminData = JSON.parse(stored);
      if (!adminData.acquisitions) {
        adminData.acquisitions = [];
      }
      return;
    } catch (e) {
      // fall through to seed if corrupted
    }
  }

  // Seed from BRANDS in data.js
  adminData.brands = [];
  var nextId = 100;
  
  if (typeof BRANDS !== 'undefined') {
    BRANDS.forEach(function(brand) {
      var adminBrand = {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        units: []
      };
      
      brand.units.forEach(function(unit) {
        // Map images array or seeds
        var images = unit.images || [nextId];
        adminBrand.units.push({
          id: nextId++,
          name: unit.name,
          year: unit.year,
          price: unit.price,
          odometer: unit.odometer,
          transmission: unit.transmission,
          fuel: unit.fuel,
          body: unit.body,
          condition: unit.condition || 'Excellent condition.',
          sold: unit.sold || false,
          featured: unit.featured || false,
          active: unit.active !== false,
          listingType: 'sale',
          channels: ['facebook', 'gmail'],
          images: images,
          imagePaths: []
        });
      });
      adminData.brands.push(adminBrand);
    });
  }

  // Seed sample contact messages
  adminData.messages = [];

  adminData.notifications = [];

  adminData.acquisitions = [];

  adminData.nextCarId = nextId;
  adminData.nextNotificationId = 1;
  saveData();
}

function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(adminData));
}

/* ================================================================
   HELPER FUNCTIONS
   ================================================================ */

function formatPeso(price) {
  if (price === null || price === undefined) return 'Contact for Price';
  return '₱' + Number(price).toLocaleString('en-PH');
}

function timeAgo(dateStr) {
  var now = new Date();
  var date = new Date(dateStr);
  var diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getAllCars() {
  var cars = [];
  adminData.brands.forEach(function(brand) {
    brand.units.forEach(function(unit, idx) {
      cars.push({ brand: brand, unit: unit, brandIndex: idx });
    });
  });
  return cars;
}

function getStats() {
  var total = 0, forSale = 0, forRent = 0, sold = 0, featured = 0;
  adminData.brands.forEach(function(b) {
    b.units.forEach(function(u) {
      total++;
      if (u.sold) { sold++; }
      else if (u.listingType === 'rent') { forRent++; }
      else { forSale++; }
      if (u.featured) featured++;
    });
  });
  var unreadMsgs = adminData.messages.filter(function(m) { return !m.read; }).length;
  return { total: total, forSale: forSale, forRent: forRent, sold: sold, featured: featured, unread: unreadMsgs, brands: adminData.brands.length };
}

/* ================================================================
   VIEW SWITCHING
   ================================================================ */

function switchView(view) {
  document.querySelectorAll('.admin-view').forEach(function(v) { v.classList.remove('active'); });
  var target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sidebar__link').forEach(function(link) { link.classList.remove('active'); });
  var activeLink = document.querySelector('[data-view="' + view + '"]');
  if (activeLink) activeLink.classList.add('active');

  var titles = {
    'dashboard': ['Dashboard', 'Overview of your portal'],
    'inbox': ['Inbox', 'Manage contact form messages'],
    'inventory': ['Inventory', 'Manage your car listings'],
    'add-car': ['Add Listing', 'Create a new car listing'],
    'analytics': ['Analytics', 'Platform performance metrics'],
    'settings': ['Settings', 'Admin profile and configuration'],
    'acquisitions': ['Car Acquisitions', 'Manage 2nd hand car offers for inventory']
  };
  var t = titles[view] || ['Admin', ''];
  document.getElementById('topbarTitle').textContent = t[0];
  document.getElementById('topbarSubtitle').textContent = t[1];

  if (view === 'dashboard') renderDashboard();
  if (view === 'inbox') renderInbox();
  if (view === 'inventory') renderInventory();
  if (view === 'add-car') populateBrandSelect();
  if (view === 'analytics') renderAnalytics();
  if (view === 'settings') renderSettings();
  if (view === 'acquisitions') renderAcquisitions();

  closeSidebar();
}

/* ================================================================
   SIDEBAR & NAVIGATION
   ================================================================ */

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

/* ================================================================
   RENDER: DASHBOARD
   ================================================================ */

function renderDashboard() {
  var stats = getStats();

  document.getElementById('metricsGrid').innerHTML =
    buildMetricCard(stats.total, 'Total Cars', 'fa-car', 'accent') +
    buildMetricCard(stats.unread, 'New Messages', 'fa-envelope', 'warning') +
    buildMetricCard(stats.forSale, 'For Sale', 'fa-tag', 'success') +
    buildMetricCard(stats.forRent, 'For Rent', 'fa-key', 'info');

  document.getElementById('inboxBadge').textContent = stats.unread;
  
  var acqCount = adminData.acquisitions ? adminData.acquisitions.length : 0;
  var acqBadge = document.getElementById('acqBadge');
  if (acqBadge) {
    acqBadge.textContent = acqCount;
    acqBadge.classList.toggle('sidebar__link-badge--hidden', acqCount === 0);
  }

  var notifDot = document.getElementById('notifDot');
  var hasUnread = stats.unread > 0 || (adminData.notifications || []).some(function(n) { return !n.read; });
  notifDot.classList.toggle('topbar__btn-dot--hidden', !hasUnread);

  // Render recent activity feed (inbox messages)
  var feedHtml = '';
  var recent = adminData.messages.slice(0, 5);
  recent.forEach(function(msg) {
    var iconClass = msg.read ? 'activity-item__icon--read' : 'activity-item__icon--unread';
    feedHtml +=
      '<div class="activity-item">' +
      '<div class="activity-item__icon ' + iconClass + '">' +
      '<i class="fa-solid fa-envelope"></i>' +
      '</div>' +
      '<div>' +
      '<div class="activity-item__text"><strong>' + escapeHtml(msg.name) + '</strong> sent a message</div>' +
      '<div class="activity-item__time">' + timeAgo(msg.time) + '</div>' +
      '</div>' +
      '</div>';
  });
  if (!recent.length) {
    feedHtml = '<div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-inbox"></i></div><div class="empty-state__title">No activity yet</div></div>';
  }
  document.getElementById('activityFeed').innerHTML = feedHtml;

  // Render quick stats breakdown bars
  var total = stats.total || 1;
  document.getElementById('quickStats').innerHTML =
    buildQuickStat('fa-tag', 'For Sale', stats.forSale, 'success', (stats.forSale / total * 100)) +
    buildQuickStat('fa-key', 'For Rent', stats.forRent, 'info', (stats.forRent / total * 100)) +
    buildQuickStat('fa-circle-xmark', 'Sold', stats.sold, 'danger', (stats.sold / total * 100)) +
    buildQuickStat('fa-star', 'Featured', stats.featured, 'warning', (stats.featured / total * 100)) +
    buildQuickStat('fa-building', 'Brands', stats.brands, 'accent', 100);
}

function buildMetricCard(value, label, icon, variant) {
  return '<div class="metric-card">' +
    '<div><div class="metric-card__value">' + value + '</div><div class="metric-card__label">' + label + '</div></div>' +
    '<div class="metric-card__icon metric-card__icon--' + variant + '"><i class="fa-solid ' + icon + '"></i></div>' +
    '</div>';
}

function buildQuickStat(icon, label, value, variant, pct) {
  return '<div class="quick-stat">' +
    '<div class="quick-stat__info">' +
    '<div class="quick-stat__header">' +
    '<span class="quick-stat__label"><i class="fa-solid ' + icon + ' quick-stat__label-icon--' + variant + '"></i> ' + label + '</span>' +
    '<span class="quick-stat__value">' + value + '</span>' +
    '</div>' +
    '<div class="quick-stat__bar">' +
    '<div class="quick-stat__fill quick-stat__fill--' + variant + '" style="width:' + Math.min(pct, 100) + '%;"></div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

/* ================================================================
   RENDER: INBOX
   ================================================================ */

var inboxFilter = 'all';

function setInboxFilter(filter, btn) {
  inboxFilter = filter;
  document.querySelectorAll('.inbox-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderInbox();
}

function renderInbox() {
  var search = (document.getElementById('inboxSearchInput').value || '').toLowerCase();
  var msgs = adminData.messages.filter(function(m) {
    if (inboxFilter === 'unread' && m.read) return false;
    if (inboxFilter === 'read' && !m.read) return false;
    if (search && m.name.toLowerCase().indexOf(search) === -1 && m.email.toLowerCase().indexOf(search) === -1 && m.message.toLowerCase().indexOf(search) === -1) return false;
    return true;
  });

  document.getElementById('inboxCount').textContent = msgs.length + ' message' + (msgs.length !== 1 ? 's' : '');

  if (!msgs.length) {
    document.getElementById('inboxList').innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state__icon"><i class="fa-solid fa-inbox"></i></div>' +
      '<div class="empty-state__title">No messages found</div>' +
      '<div class="empty-state__desc">Messages from the contact form will appear here</div>' +
      '</div>';
    return;
  }

  var html = '';
  msgs.forEach(function(msg) {
    html +=
      '<div class="message-row ' + (msg.read ? '' : 'unread') + '" data-message-id="' + msg.id + '">' +
      '<div class="message-sender">' +
      '<span class="message-sender__name">' + escapeHtml(msg.name) + '</span>' +
      '<span class="message-sender__email">' + escapeHtml(msg.email) + '</span>' +
      '</div>' +
      '<div class="message-preview">' + escapeHtml(msg.message) + '</div>' +
      '<div class="message-meta">' +
      '<span class="message-time">' + timeAgo(msg.time) + '</span>' +
      '<a class="message-action-btn" href="mailto:' + encodeURIComponent(msg.email) + '?subject=RE: Your inquiry at DrivePinas" data-stop-propagation>' +
      '<i class="fa-solid fa-reply"></i> Reply' +
      '</a>' +
      '</div>' +
      '</div>';
  });
  document.getElementById('inboxList').innerHTML = html;

  // Bind click listeners for message rows
  document.querySelectorAll('.message-row').forEach(function(row) {
    row.addEventListener('click', function(e) {
      if (e.target.closest('[data-stop-propagation]')) return;
      var id = parseInt(row.getAttribute('data-message-id'));
      openMessage(id);
    });
  });
}

function openMessage(id) {
  var msg = adminData.messages.find(function(m) { return m.id === id; });
  if (!msg) return;

  msg.read = true;
  saveData();

  var body = document.getElementById('modalBody');
  body.innerHTML =
    '<div class="modal__field"><div class="modal__label">Full Name</div><div class="modal__value">' + escapeHtml(msg.name) + '</div></div>' +
    '<div class="modal__field"><div class="modal__label">Email Address</div><div class="modal__value"><a href="mailto:' + encodeURIComponent(msg.email) + '" class="modal__link">' + escapeHtml(msg.email) + '</a></div></div>' +
    '<div class="modal__field"><div class="modal__label">Phone Number</div><div class="modal__value">' + (msg.phone ? '<a href="tel:' + msg.phone.replace(/\s/g, '') + '" class="modal__link">' + escapeHtml(msg.phone) + '</a>' : '<span class="modal__value--empty">Not provided</span>') + '</div></div>' +
    '<div class="modal__field" style="margin-bottom:0;"><div class="modal__label">Message</div><div class="modal__value modal__value--boxed">' + escapeHtml(msg.message) + '</div></div>';

  var footer = document.getElementById('modalFooter');
  footer.innerHTML =
    '<a class="btn btn--primary" href="mailto:' + encodeURIComponent(msg.email) + '?subject=RE: Your inquiry at DrivePinas&body=Hi ' + encodeURIComponent(msg.name) + ',%0A%0AThank you for reaching out to DrivePinas!%0A%0A"><i class="fa-solid fa-reply"></i> Reply via Email</a>' +
    '<button class="btn btn--outline" data-delete-message="' + msg.id + '"><i class="fa-solid fa-trash"></i> Delete</button>' +
    '<button class="btn btn--outline btn--ghost" data-close-modal>Close</button>';

  // Bind footer buttons dynamically
  footer.querySelector('[data-delete-message]').addEventListener('click', function() {
    deleteMessage(parseInt(this.getAttribute('data-delete-message')));
  });
  footer.querySelector('[data-close-modal]').addEventListener('click', closeMessageModal);

  document.getElementById('messageModal').classList.add('active');
  renderInbox();
  renderDashboard();
}

function deleteMessage(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  adminData.messages = adminData.messages.filter(function(m) { return m.id !== id; });
  saveData();
  closeMessageModal();
  renderInbox();
  showToast('Message deleted', 'danger');
}

function closeMessageModal() {
  document.getElementById('messageModal').classList.remove('active');
}

/* ================================================================
   RENDER: INVENTORY
   ================================================================ */

function renderInventory() {
  populateBrandFilter();

  var search = (document.getElementById('inventorySearchInput').value || '').toLowerCase();
  var brandFilterVal = document.getElementById('brandFilter').value;
  var statusFilterVal = document.getElementById('statusFilter').value;

  var cars = getAllCars().filter(function(c) {
    if (brandFilterVal !== 'all' && c.brand.slug !== brandFilterVal) return false;
    if (statusFilterVal === 'sold' && !c.unit.sold) return false;
    if (statusFilterVal === 'sale' && (c.unit.sold || c.unit.listingType !== 'sale')) return false;
    if (statusFilterVal === 'rent' && (c.unit.sold || c.unit.listingType !== 'rent')) return false;
    if (search) {
      var searchStr = (c.brand.name + ' ' + c.unit.name).toLowerCase();
      if (searchStr.indexOf(search) === -1) return false;
    }
    return true;
  });

  document.getElementById('inventoryCount').textContent = cars.length + ' listing' + (cars.length !== 1 ? 's' : '');

  if (!cars.length) {
    document.getElementById('inventoryBody').innerHTML =
      '<tr><td colspan="9"><div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-car"></i></div><div class="empty-state__title">No cars found</div></div></td></tr>';
    return;
  }

  var html = '';
  cars.forEach(function(c) {
    var unit = c.unit;
    var statusClass = unit.sold ? 'sold' : unit.listingType === 'rent' ? 'rent' : 'sale';
    var statusText = unit.sold ? 'Sold' : unit.listingType === 'rent' ? 'For Rent' : 'For Sale';

    var channelHtml = '';
    (unit.channels || []).forEach(function(ch) {
      var cls = ch === 'facebook' ? 'fb' : ch === 'instagram' ? 'ig' : 'gmail';
      var icon = ch === 'facebook' ? 'fa-brands fa-facebook-f' : ch === 'instagram' ? 'fa-brands fa-instagram' : 'fa-brands fa-google';
      channelHtml += '<span class="channel-icon channel-icon--' + cls + '" title="' + ch + '"><i class="' + icon + '"></i></span>';
    });
    if (!channelHtml) channelHtml = '<span class="channel-icon channel-icon--inactive">—</span>';

    // Image source resolve
    var imgSrc = '';
    if (unit.imagePaths && unit.imagePaths.length > 0) {
      imgSrc = escapeHtml(unit.imagePaths[0]);
    } else {
      var imgSeed = (unit.images && unit.images[0]) || 100;
      imgSrc = 'https://picsum.photos/seed/car' + imgSeed + '/104/72';
    }

    html +=
      '<tr>' +
      '<td><div class="car-row__name">' +
      '<img class="car-row__thumb" src="' + imgSrc + '" alt="" onerror="this.src=\'https://picsum.photos/seed/placeholder/104/72\'">' +
      '<div class="car-row__info"><span class="car-row__title">' + escapeHtml(unit.name) + '</span><span class="car-row__brand">' + escapeHtml(c.brand.name) + '</span></div>' +
      '</div></td>' +
      '<td>' + unit.year + '</td>' +
      '<td>' + formatPeso(unit.price) + '</td>' +
      '<td>' + escapeHtml(unit.body) + '</td>' +
      '<td><span class="status-badge status-badge--' + statusClass + ' status-badge--dot">' + statusText + '</span></td>' +
      '<td><div class="channel-icons">' + channelHtml + '</div></td>' +
      '<td><label class="toggle"><input type="checkbox" ' + (unit.featured ? 'checked' : '') + ' data-toggle-featured="' + c.brand.slug + '|' + c.brandIndex + '"><span class="toggle__slider"></span></label></td>' +
      '<td><label class="toggle"><input type="checkbox" ' + (unit.active !== false ? 'checked' : '') + ' data-toggle-active="' + c.brand.slug + '|' + c.brandIndex + '"><span class="toggle__slider"></span></label></td>' +
      '<td><div class="car-row__actions text-right">' +
      '<button class="car-row__btn" title="Edit" data-edit-car="' + c.brand.slug + '|' + c.brandIndex + '"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="car-row__btn car-row__btn--danger" title="Delete" data-delete-car="' + c.brand.slug + '|' + c.brandIndex + '"><i class="fa-solid fa-trash"></i></button>' +
      '</div></td>' +
      '</tr>';
  });

  document.getElementById('inventoryBody').innerHTML = html;

  // Bind dynamic toggle and row action click listeners
  document.querySelectorAll('[data-toggle-featured]').forEach(function(input) {
    input.addEventListener('change', function() {
      var parts = this.getAttribute('data-toggle-featured').split('|');
      toggleFeatured(parts[0], parseInt(parts[1]), this.checked);
    });
  });

  document.querySelectorAll('[data-toggle-active]').forEach(function(input) {
    input.addEventListener('change', function() {
      var parts = this.getAttribute('data-toggle-active').split('|');
      toggleActive(parts[0], parseInt(parts[1]), this.checked);
    });
  });
  
  document.querySelectorAll('[data-edit-car]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parts = this.getAttribute('data-edit-car').split('|');
      editCar(parts[0], parseInt(parts[1]));
    });
  });

  document.querySelectorAll('[data-delete-car]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parts = this.getAttribute('data-delete-car').split('|');
      deleteCar(parts[0], parseInt(parts[1]));
    });
  });
}

function populateBrandFilter() {
  var select = document.getElementById('brandFilter');
  var current = select.value;
  var options = '<option value="all">All Brands</option>';
  adminData.brands.forEach(function(b) {
    options += '<option value="' + b.slug + '"' + (current === b.slug ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>';
  });
  select.innerHTML = options;
}

function toggleFeatured(brandSlug, unitIndex, val) {
  var brand = adminData.brands.find(function(b) { return b.slug === brandSlug; });
  if (brand && brand.units[unitIndex]) {
    brand.units[unitIndex].featured = val;
    saveData();
  }
}

function toggleActive(brandSlug, unitIndex, val) {
  var brand = adminData.brands.find(function(b) { return b.slug === brandSlug; });
  if (brand && brand.units[unitIndex]) {
    brand.units[unitIndex].active = val;
    saveData();
  }
}

function deleteCar(brandSlug, unitIndex) {
  if (!confirm('Are you sure you want to delete this listing?')) return;
  var brand = adminData.brands.find(function(b) { return b.slug === brandSlug; });
  if (brand) {
    brand.units.splice(unitIndex, 1);
    saveData();
    renderInventory();
    showToast('Listing deleted', 'danger');
  }
}

/* ================================================================
   ADD / EDIT CAR
   ================================================================ */

function populateBrandSelect() {
  var select = document.getElementById('carBrand');
  var current = select.value;
  var options = '';
  adminData.brands.forEach(function(b) {
    options += '<option value="' + b.slug + '"' + (current === b.slug ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>';
  });
  select.innerHTML = options;
}

function editCar(brandSlug, unitIndex) {
  switchView('add-car');
  document.getElementById('formTitle').textContent = 'Edit Listing';
  document.getElementById('formSubmitText').textContent = 'Save Changes';
  document.getElementById('editIndex').value = unitIndex;
  document.getElementById('editBrandSlug').value = brandSlug;

  var brand = adminData.brands.find(function(b) { return b.slug === brandSlug; });
  if (!brand || !brand.units[unitIndex]) return;
  var u = brand.units[unitIndex];

  document.getElementById('carBrand').value = brandSlug;
  document.getElementById('carName').value = u.name;
  document.getElementById('carYear').value = u.year;
  document.getElementById('carPrice').value = u.price || '';
  document.getElementById('carOdometer').value = u.odometer || '';
  document.getElementById('carTransmission').value = u.transmission;
  document.getElementById('carFuel').value = u.fuel;
  document.getElementById('carBody').value = u.body;
  document.getElementById('carCondition').value = u.condition || '';
  document.getElementById('carImages').value = (u.imagePaths || []).join(', ');

  // Listing type
  var currentType = u.sold ? 'sold' : (u.listingType || 'sale');
  document.querySelectorAll('#listingTypeGroup .listing-type-option').forEach(function(opt) {
    opt.classList.remove('selected--sale', 'selected--rent', 'selected--sold');
    var radio = opt.querySelector('input');
    if (radio.value === currentType) {
      radio.checked = true;
      opt.classList.add('selected--' + radio.value);
    }
  });

  // Visibility status
  var currentVisibility = u.active !== false ? 'active' : 'hidden';
  document.querySelectorAll('#visibilityGroup .listing-type-option').forEach(function(opt) {
    opt.classList.remove('selected--active', 'selected--hidden');
    var radio = opt.querySelector('input');
    if (radio.value === currentVisibility) {
      radio.checked = true;
      opt.classList.add('selected--' + radio.value);
    }
  });

  // Channels
  var channels = u.channels || [];
  document.querySelectorAll('#channelsGroup .form-channel').forEach(function(label) {
    var cb = label.querySelector('input');
    var isChecked = channels.indexOf(cb.value) > -1;
    cb.checked = isChecked;
    label.classList.toggle('checked', isChecked);
  });
}

function handleCarFormSubmit(e) {
  e.preventDefault();

  var brandSlug = document.getElementById('carBrand').value;
  var brand = adminData.brands.find(function(b) { return b.slug === brandSlug; });
  if (!brand) return;

  var nameVal = document.getElementById('carName').value.trim();
  var yearVal = document.getElementById('carYear').value;
  if (!nameVal || !yearVal) {
    showToast('Please fill in all required fields', 'danger');
    return;
  }

  var channels = [];
  document.querySelectorAll('#channelsGroup input:checked').forEach(function(cb) {
    channels.push(cb.value);
  });

  var listingType = document.querySelector('input[name="listingType"]:checked').value;
  var isSold = listingType === 'sold';
  var actualListingType = isSold ? 'sale' : listingType;

  var carVisibility = document.querySelector('input[name="carVisibility"]:checked').value;
  var isActive = carVisibility === 'active';

  var imagePathsRaw = document.getElementById('carImages').value.trim();
  var imagePaths = imagePathsRaw ? imagePathsRaw.split(',').map(function(p) { return p.trim(); }).filter(Boolean) : [];

  var carData = {
    id: adminData.nextCarId++,
    name: nameVal,
    year: parseInt(yearVal),
    price: document.getElementById('carPrice').value ? parseInt(document.getElementById('carPrice').value) : null,
    odometer: document.getElementById('carOdometer').value.trim(),
    transmission: document.getElementById('carTransmission').value,
    fuel: document.getElementById('carFuel').value,
    body: document.getElementById('carBody').value,
    condition: document.getElementById('carCondition').value.trim(),
    sold: isSold,
    featured: false,
    active: isActive,
    listingType: actualListingType,
    channels: channels,
    images: [Math.floor(Math.random() * 900) + 100],
    imagePaths: imagePaths
  };

  var editIndex = document.getElementById('editIndex').value;
  var editBrandSlug = document.getElementById('editBrandSlug').value;

  if (editIndex !== '' && editBrandSlug) {
    var editBrand = adminData.brands.find(function(b) { return b.slug === editBrandSlug; });
    if (editBrand && editBrand.units[parseInt(editIndex)]) {
      var existing = editBrand.units[parseInt(editIndex)];
      carData.id = existing.id;
      carData.sold = isSold;
      carData.featured = existing.featured;
      carData.active = isActive;
      if (!imagePaths.length) carData.images = existing.images;

      // Handle brand change
      if (editBrandSlug !== brandSlug) {
        editBrand.units.splice(parseInt(editIndex), 1);
        brand.units.push(carData);
      } else {
        editBrand.units[parseInt(editIndex)] = carData;
      }
      showToast('Listing updated successfully', 'success');
    }
  } else {
    brand.units.push(carData);
    showToast('New listing added successfully', 'success');
  }

  saveData();
  resetCarForm();
  switchView('inventory');
}

function resetCarForm() {
  document.getElementById('carForm').reset();
  document.getElementById('editIndex').value = '';
  document.getElementById('editBrandSlug').value = '';
  document.getElementById('formTitle').textContent = 'Add New Listing';
  document.getElementById('formSubmitText').textContent = 'Add Listing';

  document.querySelectorAll('#listingTypeGroup .listing-type-option').forEach(function(opt) {
    opt.classList.remove('selected--sale', 'selected--rent', 'selected--sold');
    var radio = opt.querySelector('input');
    if (radio.value === 'sale') {
      radio.checked = true;
      opt.classList.add('selected--sale');
    }
  });

  document.querySelectorAll('#visibilityGroup .listing-type-option').forEach(function(opt) {
    opt.classList.remove('selected--active', 'selected--hidden');
    var radio = opt.querySelector('input');
    if (radio.value === 'active') {
      radio.checked = true;
      opt.classList.add('selected--active');
    }
  });

  document.querySelectorAll('#channelsGroup .form-channel').forEach(function(label) {
    var cb = label.querySelector('input');
    var isDefault = cb.value === 'facebook' || cb.value === 'gmail';
    cb.checked = isDefault;
    label.classList.toggle('checked', isDefault);
  });
}

/* ================================================================
   TOASTS
   ================================================================ */

function showToast(text, type) {
  var toast = document.getElementById('adminToast');
  var icon = document.getElementById('toastIcon');
  document.getElementById('toastText').textContent = text;
  icon.className = 'admin-toast__icon admin-toast__icon--' + (type || 'success');
  icon.innerHTML = type === 'danger' ? '<i class="fa-solid fa-trash"></i>' : '<i class="fa-solid fa-check"></i>';
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

/* ================================================================
   NOTIFICATIONS SYSTEM
   ================================================================ */

function toggleNotifications() {
  var dropdown = document.getElementById('notifDropdown');
  dropdown.classList.toggle('active');
  if (dropdown.classList.contains('active')) {
    renderNotifications();
  }
}

function renderNotifications() {
  var list = document.getElementById('notifDropdownList');
  var notifs = adminData.notifications || [];
  if (!notifs.length) {
    list.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:12px;">No notifications yet</div>';
    return;
  }

  var html = '';
  notifs.forEach(function(n) {
    var iconClass = n.read ? 'activity-item__icon--read' : 'activity-item__icon--unread';
    var icon = 'fa-bell';
    if (n.type === 'message') icon = 'fa-envelope';
    if (n.type === 'system') icon = 'fa-info';

    html +=
      '<div class="notif-item ' + (n.read ? '' : 'unread') + '" data-notif-id="' + n.id + '">' +
      '<div class="notif-item__icon ' + iconClass + '"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div style="flex:1;">' +
      '<div class="notif-item__title">' + escapeHtml(n.title) + '</div>' +
      '<div class="notif-item__desc">' + escapeHtml(n.message) + '</div>' +
      '<div class="notif-item__time">' + timeAgo(n.time) + '</div>' +
      '</div>' +
      '</div>';
  });
  list.innerHTML = html;

  // Bind click for reading notifications
  list.querySelectorAll('[data-notif-id]').forEach(function(item) {
    item.addEventListener('click', function() {
      readNotification(parseInt(this.getAttribute('data-notif-id')));
    });
  });
}

function readNotification(id) {
  var n = adminData.notifications.find(function(x) { return x.id === id; });
  if (n) {
    n.read = true;
    saveData();
    updateNotificationBadge();
    renderNotifications();
  }
}

function markAllNotificationsRead() {
  (adminData.notifications || []).forEach(function(n) { n.read = true; });
  saveData();
  updateNotificationBadge();
  renderNotifications();
  showToast('All notifications marked as read', 'success');
}

function clearAllNotifications() {
  if (!confirm('Are you sure you want to clear all notifications?')) return;
  adminData.notifications = [];
  saveData();
  updateNotificationBadge();
  renderNotifications();
  showToast('All notifications cleared', 'danger');
}

function updateNotificationBadge() {
  var unreadCount = (adminData.notifications || []).filter(function(n) { return !n.read; }).length;
  var dot = document.getElementById('notifDot');
  if (dot) {
    dot.classList.toggle('topbar__btn-dot--hidden', unreadCount === 0);
  }
}

function playChime() {
  var storedProfile = localStorage.getItem(PROFILE_KEY);
  var profile = {};
  try { profile = JSON.parse(storedProfile || '{}'); } catch (e) { /* ignore */ }
  if (profile.sound === 'disabled') return;

  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

/* ================================================================
   ANALYTICS & CHARTS
   ================================================================ */

function renderAnalytics() {
  var stats = getStats();
  var myListings = getAllCars();

  document.getElementById('analTotalViews').textContent = '—';
  document.getElementById('analTotalLeads').textContent = adminData.messages.length;
  document.getElementById('analConversionRate').textContent = '—';

  var valuation = myListings.reduce(function(acc, c) { return acc + (c.unit.price || 0); }, 0);
  document.getElementById('analTotalRevenue').textContent = '₱' + valuation.toLocaleString('en-PH');

  var brandCounts = {};
  myListings.forEach(function(c) {
    brandCounts[c.brand.name] = (brandCounts[c.brand.name] || 0) + 1;
  });

  var maxCount = 1;
  Object.keys(brandCounts).forEach(function(k) {
    if (brandCounts[k] > maxCount) maxCount = brandCounts[k];
  });

  var html = '<h4 class="section-heading">Brand Distribution</h4>';
  Object.keys(brandCounts).forEach(function(k) {
    var count = brandCounts[k];
    var pct = Math.round((count / maxCount) * 100);
    html +=
      '<div class="chart-bar-group">' +
      '<div class="chart-bar-header"><span>' + escapeHtml(k) + '</span><span>' + count + ' units</span></div>' +
      '<div class="chart-bar-outer"><div class="chart-bar-inner" style="width:' + pct + '%"></div></div>' +
      '</div>';
  });
  document.getElementById('adminAnalyticsCharts').innerHTML = html;
}

/* ================================================================
   SETTINGS & SYSTEM RESET
   ================================================================ */

function renderSettings() {
  var storedProfile = localStorage.getItem(PROFILE_KEY);
  var profile = { name: "Admin Manager", role: "DrivePinas Manager", sound: "enabled", currency: "PHP" };
  if (storedProfile) {
    try { profile = JSON.parse(storedProfile); } catch (e) { /* ignore */ }
  }

  document.getElementById('adminName').value = profile.name;
  document.getElementById('adminRole').value = profile.role;
  document.getElementById('configSound').value = profile.sound || 'enabled';
  document.getElementById('configCurrency').value = profile.currency || 'PHP';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

async function handleAdminSettingsSubmit(e) {
  e.preventDefault();

  var newPw = document.getElementById('newPassword').value;
  var confirmPw = document.getElementById('confirmPassword').value;
  
  if (newPw) {
    if (newPw !== confirmPw) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    if (newPw.length < 6) {
      showToast('Password must be at least 6 characters', 'danger');
      return;
    }
    var newHash = await hashString(newPw);
    localStorage.setItem(PASSWORD_KEY, newHash);
  }

  var profile = {
    name: document.getElementById('adminName').value.trim(),
    role: document.getElementById('adminRole').value.trim(),
    sound: document.getElementById('configSound').value,
    currency: document.getElementById('configCurrency').value
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  // Update sidebar user details
  document.getElementById('sidebarUserName').textContent = profile.name;
  document.getElementById('sidebarUserRole').textContent = profile.role;
  var initials = profile.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;

  showToast('Settings saved successfully', 'success');
}

function resetDatabase() {
  if (!confirm('Are you sure you want to reset the platform database? All admin listings and settings changes will be lost.')) return;
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PASSWORD_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

/* ================================================================
   ACQUISITIONS
   ================================================================ */

function renderAcquisitions() {
  var list = document.getElementById('acquisitionsBody');
  var acqs = adminData.acquisitions || [];

  document.getElementById('acqCount').textContent = acqs.length + ' offer' + (acqs.length !== 1 ? 's' : '') + ' pending';

  var acqBadge = document.getElementById('acqBadge');
  if (acqBadge) {
    acqBadge.textContent = acqs.length;
    acqBadge.classList.toggle('sidebar__link-badge--hidden', acqs.length === 0);
  }

  if (!acqs.length) {
    list.innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><div class="empty-state__icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>' +
      '<div class="empty-state__title">No Pending Acquisitions</div>' +
      '<div class="empty-state__desc">When users submit trade-in offers from the contact page, they will appear here.</div></div></td></tr>';
    return;
  }

  var html = '';
  acqs.forEach(function(acq) {
    html +=
      '<tr>' +
      '<td style="padding-left: 24px;">' +
      '<div style="font-weight:700; color:var(--text-primary);">' + escapeHtml(acq.brandName + ' ' + acq.name) + '</div>' +
      '<div class="car-row__brand">Submitted ' + timeAgo(acq.time) + '</div>' +
      '</td>' +
      '<td>' + acq.year + '</td>' +
      '<td class="buy-details__price">' + formatPeso(acq.price) + '</td>' +
      '<td>' + escapeHtml(acq.odometer) + '</td>' +
      '<td>' + escapeHtml(acq.transmission) + ' · ' + escapeHtml(acq.fuel) + '</td>' +
      '<td>' + escapeHtml(acq.contactLink) + '</td>' +
      '<td class="car-row__brand" title="' + escapeHtml(acq.condition) + '">' + escapeHtml(acq.condition) + '</td>' +
      '<td class="text-right--padded">' +
      '<div class="car-row__actions" style="justify-content:flex-end;">' +
      '<button class="btn btn--primary btn--sm" data-buy-acq="' + acq.id + '"><i class="fa-solid fa-cart-shopping"></i> Buy</button>' +
      '<button class="btn btn--outline btn--sm btn--danger" data-reject-acq="' + acq.id + '"><i class="fa-solid fa-trash"></i> Reject</button>' +
      '</div>' +
      '</td>' +
      '</tr>';
  });
  list.innerHTML = html;

  // Bind dynamic acquisition button listeners
  document.querySelectorAll('[data-buy-acq]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openBuyModal(parseInt(this.getAttribute('data-buy-acq')));
    });
  });
  
  document.querySelectorAll('[data-reject-acq]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      rejectAcquisition(parseInt(this.getAttribute('data-reject-acq')));
    });
  });
}

function openBuyModal(id) {
  var acq = adminData.acquisitions.find(function(x) { return x.id === id; });
  if (!acq) return;

  document.getElementById('buyAcqId').value = acq.id;
  document.getElementById('buyCarTitle').textContent = acq.brandName + ' ' + acq.name + ' (' + acq.year + ')';
  document.getElementById('buyCarSpecs').textContent = 'Mileage: ' + acq.odometer + ' | Transmission: ' + acq.transmission + ' | Fuel: ' + acq.fuel;
  document.getElementById('buySellerLink').textContent = 'Seller Contact: ' + acq.contactLink;
  document.getElementById('buyAskingPrice').textContent = formatPeso(acq.price);

  var suggestedRetail = Math.round(acq.price * 1.15);
  document.getElementById('buyRetailPrice').value = suggestedRetail;

  document.getElementById('buyModal').classList.add('active');
}

function closeBuyModal() {
  document.getElementById('buyModal').classList.remove('active');
}

function confirmBuyVehicle(e) {
  e.preventDefault();
  var acqId = parseInt(document.getElementById('buyAcqId').value);
  var retailPrice = parseInt(document.getElementById('buyRetailPrice').value);

  var acqIndex = adminData.acquisitions.findIndex(function(x) { return x.id === acqId; });
  if (acqIndex === -1) return;
  var acq = adminData.acquisitions[acqIndex];

  var brand = adminData.brands.find(function(b) { return b.slug === acq.brandSlug; });
  if (!brand) {
    brand = {
      name: acq.brandName,
      slug: acq.brandSlug,
      logo: 'images/brands/' + acq.brandName + '.png',
      units: []
    };
    adminData.brands.push(brand);
  }

  var baseImageSeed = 100 + Math.floor(Math.random() * 800);
  var newUnit = {
    id: adminData.nextCarId++,
    name: acq.name,
    year: acq.year,
    price: retailPrice,
    odometer: acq.odometer,
    transmission: acq.transmission,
    fuel: acq.fuel,
    body: acq.body,
    condition: acq.condition + ' (Acquired from client, fully inspected by DrivePinas)',
    sold: false,
    featured: false,
    listingType: "sale",
    channels: ["facebook", "gmail"],
    images: [baseImageSeed, baseImageSeed + 1, baseImageSeed + 2, baseImageSeed + 3],
    imagePaths: []
  };

  brand.units.push(newUnit);

  adminData.notifications.unshift({
    id: adminData.nextNotificationId++,
    type: "system",
    title: "Car Acquired",
    message: "Acquired " + acq.brandName + " " + acq.name + " for inventory at retail price " + formatPeso(retailPrice) + ".",
    time: new Date().toISOString(),
    read: false
  });

  adminData.acquisitions.splice(acqIndex, 1);
  saveData();
  closeBuyModal();

  updateNotificationBadge();
  showToast('Acquired and listed ' + acq.brandName + ' ' + acq.name, 'success');
  playChime();

  switchView('inventory');
}

function rejectAcquisition(id) {
  if (!confirm('Are you sure you want to reject this trade-in offer?')) return;
  var acqIndex = adminData.acquisitions.findIndex(function(x) { return x.id === id; });
  if (acqIndex === -1) return;

  var acq = adminData.acquisitions[acqIndex];
  adminData.acquisitions.splice(acqIndex, 1);
  saveData();

  renderAcquisitions();
  showToast('Rejected offer for ' + acq.brandName + ' ' + acq.name, 'danger');
}

/* ================================================================
   FORM COMPONENT CONTROLLERS
   ================================================================ */

function initFormControllers() {
  // Option controls for Listing Type
  document.querySelectorAll('#listingTypeGroup .listing-type-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('#listingTypeGroup .listing-type-option').forEach(function(el) {
        el.classList.remove('selected--sale', 'selected--rent', 'selected--sold');
      });
      var type = this.getAttribute('data-type');
      this.classList.add('selected--' + type);
      this.querySelector('input').checked = true;
    });
  });

  // Option controls for Visibility Status
  document.querySelectorAll('#visibilityGroup .listing-type-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('#visibilityGroup .listing-type-option').forEach(function(el) {
        el.classList.remove('selected--active', 'selected--hidden');
      });
      var type = this.getAttribute('data-type');
      this.classList.add('selected--' + type);
      this.querySelector('input').checked = true;
    });
  });

  // Checkbox option controllers for Lead Channels
  document.querySelectorAll('#channelsGroup .form-channel').forEach(function(label) {
    label.addEventListener('click', function() {
      var cb = this.querySelector('input');
      setTimeout(function() {
        label.classList.toggle('checked', cb.checked);
      }, 0);
    });
  });
}

/* ================================================================
   EVENT LISTENERS BINDING
   ================================================================ */

function initEventListeners() {
  // Login flow
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('loginPassword').addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('loginError').textContent = '';
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Sidebar navigation links
  document.querySelectorAll('.sidebar__link[data-view]').forEach(function(link) {
    link.addEventListener('click', function() {
      switchView(this.getAttribute('data-view'));
    });
  });

  // Dashboard shortcuts
  document.querySelectorAll('.panel__action[data-view]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchView(this.getAttribute('data-view'));
    });
  });

  // Mobile navigation hamburger controls
  document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Notifications dropdown trigger and management
  document.getElementById('notifBtn').addEventListener('click', toggleNotifications);
  document.getElementById('markAllReadBtn').addEventListener('click', markAllNotificationsRead);
  document.getElementById('clearAllNotifsBtn').addEventListener('click', clearAllNotifications);

  // Close notifications dropdown if clicking outside
  document.addEventListener('click', function(e) {
    var dropdown = document.getElementById('notifDropdown');
    var notifBtn = document.getElementById('notifBtn');
    if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  // Inbox search and filtering
  document.getElementById('inboxSearchInput').addEventListener('input', renderInbox);
  document.querySelectorAll('.inbox-filter-btn[data-filter]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setInboxFilter(this.getAttribute('data-filter'), this);
    });
  });

  // Inventory search, filtering, and add trigger
  document.getElementById('inventorySearchInput').addEventListener('input', renderInventory);
  document.getElementById('brandFilter').addEventListener('change', renderInventory);
  document.getElementById('statusFilter').addEventListener('change', renderInventory);
  document.getElementById('addCarFromInventoryBtn').addEventListener('click', function() {
    switchView('add-car');
  });
  // Form submission and validation actions
  document.getElementById('carForm').addEventListener('submit', handleCarFormSubmit);
  document.getElementById('backToInventoryBtn').addEventListener('click', function() {
    switchView('inventory');
  });
  document.getElementById('cancelCarFormBtn').addEventListener('click', function() {
    resetCarForm();
    switchView('inventory');
  });

  // Configuration settings form
  document.getElementById('adminSettingsForm').addEventListener('submit', handleAdminSettingsSubmit);
  document.getElementById('resetDatabaseBtn').addEventListener('click', resetDatabase);

  // Buy modal form submission and close
  document.getElementById('buyForm').addEventListener('submit', confirmBuyVehicle);
  document.getElementById('closeBuyModalBtn').addEventListener('click', closeBuyModal);
  document.getElementById('cancelBuyBtn').addEventListener('click', closeBuyModal);

  // Message modal actions
  document.getElementById('closeMessageModalBtn').addEventListener('click', closeMessageModal);

  // Modal backdrop click handlers to close them
  document.getElementById('messageModal').addEventListener('click', function(e) {
    if (e.target === this) closeMessageModal();
  });
  document.getElementById('buyModal').addEventListener('click', function(e) {
    if (e.target === this) closeBuyModal();
  });

  // Global keydown escape event listener
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMessageModal();
      closeBuyModal();
      var dropdown = document.getElementById('notifDropdown');
      if (dropdown && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
      }
    }
  });

  // Initialize form option styles toggles
  initFormControllers();
}

/* ================================================================
   APPLICATION INIT
   ================================================================ */

function initApp() {
  initData();

  var storedProfile = localStorage.getItem(PROFILE_KEY);
  if (storedProfile) {
    try {
      var p = JSON.parse(storedProfile);
      document.getElementById('sidebarUserName').textContent = p.name;
      document.getElementById('sidebarUserRole').textContent = p.role;
      var initials = p.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
      document.getElementById('sidebarAvatar').textContent = initials;
    } catch (e) {
      // ignore
    }
  }

  var unreadCount = (adminData.notifications || []).filter(function(n) { return !n.read; }).length;
  if (unreadCount > 0) {
    playChime();
  }

  updateNotificationBadge();
  renderDashboard();
}

document.addEventListener('DOMContentLoaded', function() {
  initEventListeners();
  initAuth();
});
