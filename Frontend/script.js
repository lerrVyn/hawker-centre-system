// ══════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════
const API = "http://localhost:3000";

let token = localStorage.getItem("token") || null;
let customerId = localStorage.getItem("customer_id") || null;
let customerName = localStorage.getItem("customer_name") || null;

let officer_token = localStorage.getItem("officer_token") || null;
let officerName = localStorage.getItem("officer_name") || null;
let officerId = localStorage.getItem("officer_id") || null;

let owner_token = localStorage.getItem("owner_token") || null;
let ownerName = localStorage.getItem("owner_name") || null;

let custAuthMode = "login";
let staffAuthMode = "owner";

let currentStoreId = null;
let currentStoreName = null;
let currentStoreCuisine = null;
let storeTab = "menu";

let likedItemIds = new Set();
let cartNotes = JSON.parse(localStorage.getItem("cart_notes") || "{}"); // { [item_id]: "note text" }, client-side only

let modalItem = null;
let modalQty = 1;

let currentOrderId = Number(localStorage.getItem("latestOrderId")) || null;
let currentOrderTotal = Number(localStorage.getItem("latestOrderTotal")) || 0;

let editingMenuId = null;
let ownerStalls = []; // stalls owned by the logged-in owner

let allInspections = [];

// ══════════════════════════════════════════════════════════════════
// SCREEN NAVIGATION
// ══════════════════════════════════════════════════════════════════
function goScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
}

function statCard(icon, iconClass, value, label) {
  return `
    <div class="stat-card">
      <div class="stat-icon ${iconClass}">${icon}</div>
      <div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    </div>`;
}

function showStatus(elId, message, ok) {
  const el = document.getElementById(elId);
  el.className = "status " + (ok ? "ok" : "err");
  el.textContent = message;
}

function foodEmojiFor(name) {
  const n = (name || "").toLowerCase();
  const map = [
    [["noodle", "mee", "mian", "ramen"], "🍜"],
    [["rice", "nasi", "fan"], "🍚"],
    [["chicken", "ayam"], "🍗"],
    [["satay", "skewer", "bbq"], "🍢"],
    [["drink", "tea", "coffee", "juice", "milo"], "🥤"],
    [["dessert", "cake", "sweet", "ice"], "🍨"],
    [["soup", "tang", "broth"], "🍲"],
    [["fish", "seafood", "prawn"], "🐟"],
    [["bread", "toast", "bun", "kaya"], "🍞"],
    [["egg"], "🍳"],
  ];
  for (const [keywords, emoji] of map) {
    if (keywords.some(k => n.includes(k))) return emoji;
  }
  const fallback = ["🍛", "🥘", "🍱", "🥟", "🍡"];
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash + n.charCodeAt(i)) % fallback.length;
  return fallback[hash];
}

function cuisineEmojiFor(cuisine) {
  const c = (cuisine || "").toLowerCase();
  if (c.includes("chinese")) return "🥡";
  if (c.includes("malay")) return "🍢";
  if (c.includes("indian")) return "🍛";
  if (c.includes("western")) return "🍔";
  if (c.includes("dessert") || c.includes("drink")) return "🍹";
  if (c.includes("seafood")) return "🦐";
  return "🍜";
}

function imageOrFallback(url, emoji, cssClass) {
  if (url) {
    return `<img class="${cssClass}" src="${url}" alt=""
              onerror="this.outerHTML='<div class=\\'${cssClass}\\'>${emoji}</div>'" />`;
  }
  return `<div class="${cssClass}">${emoji}</div>`;
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMER AUTH
// ══════════════════════════════════════════════════════════════════
function setCustAuthMode(mode) {
  custAuthMode = mode;
  document.getElementById("custToggleLogin").classList.toggle("active", mode === "login");
  document.getElementById("custToggleRegister").classList.toggle("active", mode === "register");
  document.getElementById("custRegisterFields").style.display = mode === "register" ? "block" : "none";
  document.getElementById("custAuthSubmit").textContent = mode === "register" ? "Register" : "Login";
  document.getElementById("custAuthStatus").innerHTML = "";
}

async function handleCustomerAuth() {
  const email = document.getElementById("custAuthEmail").value.trim();
  const password = document.getElementById("custAuthPassword").value;

  if (custAuthMode === "register") {
    const name = document.getElementById("custRegName").value.trim();
    try {
      const res = await fetch(`${API}/auth/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Registration failed.");
      showStatus("custAuthStatus", "Registered! Now log in.", true);
      setCustAuthMode("login");
    } catch (err) {
      showStatus("custAuthStatus", err.message, false);
    }
    return;
  }

  try {
    const res = await fetch(`${API}/auth/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Login failed.");

    token = data.token;
    customerId = data.data.customer_id;
    customerName = data.data.name;
    localStorage.setItem("token", token);
    localStorage.setItem("customer_id", customerId);
    localStorage.setItem("customer_name", customerName);

    enterCustomerApp();
  } catch (err) {
    showStatus("custAuthStatus", err.message, false);
  }
}

function customerLogout() {
  token = null; customerId = null; customerName = null;
  localStorage.removeItem("token");
  localStorage.removeItem("customer_id");
  localStorage.removeItem("customer_name");
  goScreen("role");
}

function enterCustomerApp() {
  goScreen("customer-app");
  updateCustomerHeader();
  custNav("home");
  loadStores();
  updateCartBadge();
}

// ══════════════════════════════════════════════════════════════════
// STAFF AUTH (stall owner / NEA officer)
// ══════════════════════════════════════════════════════════════════
function setStaffAuthMode(mode) {
  staffAuthMode = mode;
  document.getElementById("staffToggleOwner").classList.toggle("active", mode === "owner");
  document.getElementById("staffToggleOfficer").classList.toggle("active", mode === "officer");
  document.getElementById("staffAuthSubmit").textContent =
    mode === "owner" ? "Login as Stall Owner" : "Login as NEA Officer";
  document.getElementById("staffAuthStatus").innerHTML = "";
}

async function handleStaffAuth() {
  const email = document.getElementById("staffAuthEmail").value.trim();
  const password = document.getElementById("staffAuthPassword").value;

  if (staffAuthMode === "owner") {
    try {
      const res = await fetch(`${API}/auth/owner/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");

      owner_token = data.token;
      ownerName = data.owner.name;
      localStorage.setItem("owner_token", owner_token);
      localStorage.setItem("owner_name", ownerName);

      enterOwnerApp();
    } catch (err) {
      showStatus("staffAuthStatus", err.message, false);
    }
    return;
  }

  try {
    const res = await fetch(`${API}/auth/officer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Login failed.");

    officer_token = data.token;
    officerName = data.data.name;
    officerId = data.data.officer_id;
    localStorage.setItem("officer_token", officer_token);
    localStorage.setItem("officer_name", officerName);
    localStorage.setItem("officer_id", officerId);

    enterOfficerApp();
  } catch (err) {
    showStatus("staffAuthStatus", err.message, false);
  }
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMER APP: NAVIGATION
// ══════════════════════════════════════════════════════════════════
function custNav(page) {
  closeCustomerProfileMenu();

  document
    .querySelectorAll(".cust-nav-item, .cust-header-link")
    .forEach(n => n.classList.remove("active"));

  document
    .querySelectorAll(`[data-page="${page}"]`)
    .forEach(item => item.classList.add("active"));

  document
    .querySelectorAll(".cust-page")
    .forEach(p => p.classList.remove("active"));

  document
    .getElementById(`cust-page-${page}`)
    .classList.add("active");

  const titles = {
    home: "Discover Hawker Stalls",
    cart: "Your Cart",
    orders: "Your Orders",
    account: "My Account"
  };

  document.getElementById("custPageTitle").textContent =
    titles[page] || "";

  document.getElementById("custBackBtn").style.visibility =
    "hidden";

  if (page === "cart") {
    showCartStage("cart");
    loadCart();
  }

  if (page === "orders") {
    loadOrderHistory();
  }

  if (page === "account") {
    loadCustomerProfile();
  }
}

function custBack() {
  custNav("home");
}

function openStore(stallId, stallName, cuisine, imageUrl) {
  currentStoreId = stallId;
  currentStoreName = stallName;
  currentStoreCuisine = cuisine;

  document.querySelectorAll(".cust-nav-item").forEach(n => n.classList.remove("active"));
  document.querySelectorAll(".cust-page").forEach(p => p.classList.remove("active"));
  document.getElementById("cust-page-store").classList.add("active");
  document.getElementById("custPageTitle").textContent = stallName;
  document.getElementById("custBackBtn").style.visibility = "visible";

  const banner = document.getElementById("storeBanner");
  banner.style.backgroundImage = imageUrl ? `url('${imageUrl}')` : "";
  banner.innerHTML = `
    ${stallName}<span class="cuisine-tag">${cuisine || "Hawker Stall"}</span>
    <div id="storeGradeBadge" class="store-grade-badge" style="display:none;"></div>
  `;

  setStoreTab("menu");
  loadStoreMenu(stallId);
  loadStoreGradeBadge(stallId);
}

async function loadStoreGradeBadge(stallId) {
  const badge = document.getElementById("storeGradeBadge");
  if (!badge) return;

  try {
    const [inspectionRes, gradeRes] = await Promise.all([fetch(`${API}/inspection`), fetch(`${API}/grade`)]);
    const inspections = await inspectionRes.json();
    const grades = await gradeRes.json();

    const inspectionMap = {};
    (Array.isArray(inspections) ? inspections : []).forEach(i => { inspectionMap[i.inspection_id] = i; });

    let history = (Array.isArray(grades) ? grades : []).filter(g => {
      const inspection = inspectionMap[g.inspection_id];
      return inspection && inspection.stall_id == stallId;
    }).map(g => ({ ...g, inspection_date: inspectionMap[g.inspection_id].inspection_date }));

    if (history.length === 0) return; // no grade recorded yet — leave the corner empty

    history.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));
    const current = history[0];
    const previous = history[1];

    // Same colour scheme as the owner dashboard's hygiene grade page, for consistency.
    const gradeColours = { A: "#28c76f", B: "#7367f0", C: "#ff9f43", D: "#ea5455" };
    const gradeRank = { A: 4, B: 3, C: 2, D: 1 };

    let arrowHtml = "";
    if (previous && gradeRank[current.grade] && gradeRank[previous.grade]) {
      const diff = gradeRank[current.grade] - gradeRank[previous.grade];
      if (diff > 0) arrowHtml = `<span class="grade-arrow" style="color:#28c76f;">▲</span>`;
      else if (diff < 0) arrowHtml = `<span class="grade-arrow" style="color:#ea5455;">▼</span>`;
      else arrowHtml = `<span class="grade-arrow" style="color:#999;">=</span>`;
    }

    badge.innerHTML = `
      <div class="grade-row">
        <span class="grade-letter" style="color:${gradeColours[current.grade] || "#999"}">${current.grade}</span>
        ${arrowHtml}
      </div>
      <div class="grade-label">Hygiene Grade</div>
    `;
    badge.style.display = "flex";
  } catch (err) {
    console.error("Unable to load hygiene grade badge:", err);
  }
}

function setStoreTab(tab) {
  storeTab = tab;
  document.querySelectorAll(".pill-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.pill-tab[data-store-tab="${tab}"]`).classList.add("active");
  document.querySelectorAll(".store-tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(`storeTab-${tab}`).classList.add("active");

  if (tab === "reviews") loadStoreReviews();
  if (tab === "complaints") loadStoreComplaints();
}

function toggleCustomerProfileMenu() {
  const dropdown = document.getElementById("custProfileDropdown");

  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

function closeCustomerProfileMenu() {
  const dropdown = document.getElementById("custProfileDropdown");

  if (dropdown) {
    dropdown.classList.remove("show");
  }
}

function openCustomerAccount() {
  closeCustomerProfileMenu();
  custNav("account");
}

function openChangePassword() {
  closeCustomerProfileMenu();
  custNav("account");

  setTimeout(() => {
    const passwordCard =
      document.getElementById("changePasswordCard");

    if (passwordCard) {
      passwordCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      const currentPasswordInput =
        document.getElementById("currentPassword");

      if (currentPasswordInput) {
        currentPasswordInput.focus();
      }
    }
  }, 100);
}

function updateCustomerHeader() {
  const name = customerName || "Customer";

  const headerName = document.getElementById("custHeaderName");
  const welcomeName = document.getElementById("custWelcomeName");

  if (headerName) {
    headerName.textContent = name;
  }

  if (welcomeName) {
    welcomeName.textContent = name;
  }
}

document.addEventListener("click", function (event) {
  const profileMenu = document.querySelector(".cust-profile-menu");

  if (
    profileMenu &&
    !profileMenu.contains(event.target)
  ) {
    closeCustomerProfileMenu();
  }
});

// ══════════════════════════════════════════════════════════════════
// HOME: STORE GRID
// ══════════════════════════════════════════════════════════════════
async function loadStores() {
  const grid = document.getElementById("storeGrid");
  grid.innerHTML = '<p class="muted">Loading stalls...</p>';

  try {
    const res = await fetch(`${API}/catalog/stalls`);
    const stalls = await res.json();
    if (!res.ok) throw new Error(stalls.error || "Unable to load stalls.");

    if (!Array.isArray(stalls) || stalls.length === 0) {
      grid.innerHTML = '<p class="muted">No stalls available yet.</p>';
      return;
    }

    grid.innerHTML = stalls.map(s => `
      <div class="store-card" onclick='openStore(${s.stall_id}, ${JSON.stringify(s.stall_name)}, ${JSON.stringify(s.cuisine_type || "")}, ${JSON.stringify(s.image_url || "")})'>
        ${imageOrFallback(s.image_url, cuisineEmojiFor(s.cuisine_type), "store-card-image")}
        <div class="store-card-body">
          <div class="store-card-name">${s.stall_name}</div>
          <div class="store-card-cuisine">${s.cuisine_type || "Hawker Stall"}</div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════════
// STORE MENU + LIKES
// ══════════════════════════════════════════════════════════════════
async function loadMyLikes() {
  likedItemIds = new Set();
  if (!token) return;
  try {
    const res = await fetch(`${API}/likes/my-likes`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      data.forEach(l => likedItemIds.add(l.item_id));
    }
  } catch (err) {
    console.error("Unable to load likes:", err);
  }
}

async function loadStoreMenu(stallId) {
  const grid = document.getElementById("storeMenuGrid");
  grid.innerHTML = '<p class="muted">Loading menu...</p>';

  await loadMyLikes();

  try {
    const res = await fetch(`${API}/catalog/menu-items/${stallId}`);
    const items = await res.json();
    if (!res.ok) throw new Error(items.error || "Unable to load menu.");

    window.__currentMenuItems = items;

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<p class="muted">No menu items for this stall yet.</p>';
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="menu-card" onclick="openItemModal(${item.item_id})">
        ${imageOrFallback(item.image_url, foodEmojiFor(item.item_name), "menu-card-image")}
        <div class="menu-card-heart" onclick="event.stopPropagation(); toggleLikeQuick(${item.item_id})">
          ${likedItemIds.has(item.item_id) ? "❤️" : "🤍"}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-name">${item.item_name}</div>
          <div class="menu-card-price">$${Number(item.price).toFixed(2)}</div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

async function toggleLikeQuick(itemId) {
  if (!token) return alert("Please log in first.");
  try {
    if (likedItemIds.has(itemId)) {
      await fetch(`${API}/likes/${itemId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      likedItemIds.delete(itemId);
    } else {
      await fetch(`${API}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: itemId }),
      });
      likedItemIds.add(itemId);
    }
    loadStoreMenu(currentStoreId);
  } catch (err) {
    alert("Unable to update like.");
  }
}

// ══════════════════════════════════════════════════════════════════
// ITEM DETAIL MODAL
// ══════════════════════════════════════════════════════════════════
function openItemModal(itemId) {
  const item = (window.__currentMenuItems || []).find(i => i.item_id === itemId);
  if (!item) return;

  modalItem = item;
  modalQty = 1;

  document.getElementById("itemModalImage").outerHTML =
    imageOrFallback(item.image_url, foodEmojiFor(item.item_name), "modal-image");
  document.getElementById("itemModalImage").id = "itemModalImage"; // re-attach id lost by outerHTML swap
  document.getElementById("itemModalName").textContent = item.item_name;
  document.getElementById("itemModalPrice").textContent = `$${Number(item.price).toFixed(2)}`;
  document.getElementById("itemModalDescription").textContent = item.description || "";
  document.getElementById("itemModalNotes").value = cartNotes[item.item_id] || "";
  document.getElementById("itemModalQty").textContent = modalQty;
  document.getElementById("itemModalHeart").textContent = likedItemIds.has(item.item_id) ? "❤️" : "🤍";
  document.getElementById("itemModalHeart").classList.toggle("liked", likedItemIds.has(item.item_id));
  document.getElementById("itemModalStatus").innerHTML = "";

  document.getElementById("itemModal").classList.add("active");
}

function closeItemModal() {
  document.getElementById("itemModal").classList.remove("active");
  modalItem = null;
}

function modalQtyChange(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById("itemModalQty").textContent = modalQty;
}

async function toggleLikeFromModal() {
  if (!modalItem) return;
  await toggleLikeQuick(modalItem.item_id);
  const liked = likedItemIds.has(modalItem.item_id);
  document.getElementById("itemModalHeart").textContent = liked ? "❤️" : "🤍";
  document.getElementById("itemModalHeart").classList.toggle("liked", liked);
}

async function confirmAddToCart() {
  if (!token) return showStatus("itemModalStatus", "Please log in first.", false);
  if (!modalItem) return;

  const notes = document.getElementById("itemModalNotes").value.trim();

  const payload = { customerId: Number(customerId), itemId: modalItem.item_id, quantity: modalQty };

  try {
    const res = await fetch(`${API}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Unable to add item to cart.");

    // Special requests aren't stored by the cart API yet (see note in chat) -
    // kept client-side only so it still shows up next to the item in your cart.
    if (notes) {
      cartNotes[modalItem.item_id] = notes;
      localStorage.setItem("cart_notes", JSON.stringify(cartNotes));
    }

    showStatus("itemModalStatus", "Added to cart!", true);
    setTimeout(closeItemModal, 500);
    updateCartBadge();
  } catch (err) {
    showStatus("itemModalStatus", err.message, false);
  }
}

async function updateCartBadge() {
  if (!customerId) return;
  try {
    const res = await fetch(`${API}/cart/${customerId}`);
    const data = await res.json();
    const count = Array.isArray(data) ? data.reduce((sum, i) => sum + i.quantity, 0) : 0;
    document.getElementById("custCartCount").textContent = count;
  } catch (err) {
    // silent - badge just won't update
  }
}

// ══════════════════════════════════════════════════════════════════
// REVIEWS (per-store feedback, SA-37/SA-208)
// ══════════════════════════════════════════════════════════════════
async function submitReview() {
  if (!token) return showStatus("reviewStatus", "Please log in first.", false);

  const rating = parseInt(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();
  if (!comment) return showStatus("reviewStatus", "Please enter a comment.", false);

  try {
    const res = await fetch(`${API}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stall_id: currentStoreId, rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to submit review.");

    showStatus("reviewStatus", "Review submitted!", true);
    document.getElementById("reviewComment").value = "";
    loadStoreReviews();
  } catch (err) {
    showStatus("reviewStatus", err.message, false);
  }
}

async function loadStoreReviews() {
  const statsEl = document.getElementById("reviewsStats");
  const listEl = document.getElementById("reviewsList");
  listEl.innerHTML = '<p class="muted">Loading reviews...</p>';

  try {
    const res = await fetch(`${API}/feedback/stall/${currentStoreId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load reviews.");

    const feedbackList = data.feedback || [];

    statsEl.innerHTML = feedbackList.length
      ? statCard("⭐", "i-orange", data.average_rating ?? "-", "Average") +
        statCard("💬", "i-purple", data.total_reviews, "Reviews")
      : "";

    if (feedbackList.length === 0) {
      listEl.innerHTML = '<p class="muted">No reviews yet - be the first!</p>';
      return;
    }

    listEl.innerHTML = feedbackList.map(f => `
      <div class="feedback-entry">
        <span class="stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
        <b>${f.customer_name}</b>
        <p style="margin:4px 0;">${f.comment}</p>
        <span class="muted">${new Date(f.created_at).toLocaleString()}</span>
        ${f.reply_text ? `<div class="feedback-reply"><b>🏪 Stall replied:</b> ${f.reply_text}</div>` : ""}
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════════
// COMPLAINTS (per-store, SA-39/SA-210)
// ══════════════════════════════════════════════════════════════════
function statusBadgeClass(status) {
  if (status === "Resolved") return "status-resolved";
  if (status === "Under Review") return "status-review";
  return "status-pending";
}

async function submitComplaint() {
  if (!token) return showStatus("complaintStatus", "Please log in first.", false);

  const category = document.getElementById("complaintCategory").value;
  const description = document.getElementById("complaintDescription").value.trim();
  if (description.length < 10) return showStatus("complaintStatus", "Description must be at least 10 characters.", false);

  try {
    const res = await fetch(`${API}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stall_id: currentStoreId, category, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to submit complaint.");

    showStatus("complaintStatus", "Complaint submitted! Track its status below.", true);
    document.getElementById("complaintDescription").value = "";
    loadStoreComplaints();
  } catch (err) {
    showStatus("complaintStatus", err.message, false);
  }
}

async function loadStoreComplaints() {
  const listEl = document.getElementById("storeComplaintsList");

  if (!token) {
    listEl.innerHTML = '<p class="muted">Log in to see your complaints for this stall.</p>';
    return;
  }

  listEl.innerHTML = '<p class="muted">Loading...</p>';

  try {
    const res = await fetch(`${API}/complaints/my`, { headers: { Authorization: `Bearer ${token}` } });
    const complaints = await res.json();
    if (!res.ok) throw new Error(complaints.error || "Unable to load complaints.");

    const mine = complaints.filter(c => c.stall_id === currentStoreId);

    if (mine.length === 0) {
      listEl.innerHTML = '<p class="muted">You have no complaints logged for this stall.</p>';
      return;
    }

    listEl.innerHTML = mine.map(c => `
      <div class="complaint-card">
        <div class="complaint-card-top">
          <b>${c.category}</b>
          <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
        </div>
        <p style="margin:6px 0;">${c.description}</p>
        <span class="muted">Last updated: ${new Date(c.updated_at).toLocaleString()}</span>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════════
// CART / CHECKOUT / PAYMENT
// ══════════════════════════════════════════════════════════════════
function showCartStage(stage) {
  document.querySelectorAll(".cart-stage").forEach(s => s.classList.remove("active"));
  document.getElementById(`cartStage-${stage}`).classList.add("active");
}

async function loadCart() {
  const cartList = document.getElementById("cartList");
  const totalRow = document.getElementById("cartTotalRow");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!customerId) {
    cartList.innerHTML = '<p class="muted">Please log in first.</p>';
    totalRow.innerHTML = "";
    checkoutBtn.disabled = true;
    return;
  }

  cartList.innerHTML = '<p class="muted">Loading cart...</p>';

  try {
    const res = await fetch(`${API}/cart/${customerId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.details || data.error || "Unable to load cart.");

    updateCartBadge();

    if (!Array.isArray(data) || data.length === 0) {
      cartList.innerHTML = '<p class="muted">Your cart is empty.</p>';
      totalRow.innerHTML = "";
      checkoutBtn.disabled = true;
      return;
    }

    let total = 0;
    cartList.innerHTML = data.map(item => {
      total += Number(item.subtotal);
      const note = cartNotes[item.item_id];
      return `
        <div class="cart-item">
          <div>
            <h3 style="margin:0 0 4px;font-size:14px;">${item.item_name}</h3>
            <p class="muted" style="margin:0;">${item.stall_name || ""}</p>
            <p style="margin:4px 0 0;">$${Number(item.price).toFixed(2)} × ${item.quantity}</p>
            ${note ? `<div class="cart-item-notes">Note: ${note}</div>` : ""}
          </div>
          <div style="text-align:right;">
            <p style="font-weight:800;margin:0 0 8px;">$${Number(item.subtotal).toFixed(2)}</p>
            <button class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="removeCartItem(${item.cart_item_id})">Remove</button>
          </div>
        </div>`;
    }).join("");

    totalRow.innerHTML = `<div class="cart-total-row"><span>Total</span><span>$${total.toFixed(2)}</span></div>`;
    checkoutBtn.disabled = false;
  } catch (err) {
    cartList.innerHTML = `<p class="status err">${err.message}</p>`;
    checkoutBtn.disabled = true;
  }
}

async function removeCartItem(cartItemId) {
  if (!confirm("Remove this item from your cart?")) return;
  try {
    const res = await fetch(`${API}/cart/${cartItemId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details || data.error || "Unable to remove item.");
    loadCart();
  } catch (err) {
    alert(err.message);
  }
}

async function goCheckout() {
  if (!customerId) return alert("Please log in first.");

  try {
    const res = await fetch(`${API}/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: Number(customerId) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details || data.error || "Checkout failed.");

    currentOrderId = Number(data.orderId);
    currentOrderTotal = Number(data.totalPrice);
    localStorage.setItem("latestOrderId", String(currentOrderId));
    localStorage.setItem("latestOrderTotal", String(currentOrderTotal));

    document.getElementById("payOrderNumber").textContent = currentOrderId;
    document.getElementById("payOrderTotal").textContent = `$${currentOrderTotal.toFixed(2)}`;
    document.getElementById("checkoutStatus").innerHTML = "";

    showCartStage("payment");
  } catch (err) {
    showStatus("checkoutStatus", err.message, false);
  }
}

async function makePayment() {
  const paymentMethod = document.getElementById("paymentMethod").value;
  if (!currentOrderId) return showStatus("paymentStatus", "Checkout first.", false);
  if (!paymentMethod) return showStatus("paymentStatus", "Select a payment method.", false);

  try {
    const res = await fetch(`${API}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: currentOrderId, paymentMethod }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Payment failed.");

    let status = "Paid";
    try {
      const sRes = await fetch(`${API}/orders/${currentOrderId}/status`);
      const sData = await sRes.json();
      if (sRes.ok) {
        const result = Array.isArray(sData) ? sData[0] : sData;
        status = result.status || status;
      }
    } catch (_) { /* keep default */ }

    document.getElementById("doneOrderNumber").textContent = currentOrderId;
    document.getElementById("donePaymentMethod").textContent = paymentMethod;
    document.getElementById("doneStatus").textContent = status;

    showCartStage("complete");
  } catch (err) {
    showStatus("paymentStatus", err.message, false);
  }
}

function startNewOrder() {
  currentOrderId = null;
  currentOrderTotal = 0;
  localStorage.removeItem("latestOrderId");
  localStorage.removeItem("latestOrderTotal");
  document.getElementById("paymentMethod").value = "";
  document.getElementById("paymentStatus").innerHTML = "";
  custNav("home");
}

// ══════════════════════════════════════════════════════════════════
// ORDER HISTORY
// ══════════════════════════════════════════════════════════════════
async function loadOrderHistory() {
  const container = document.getElementById("orderHistoryList");
  if (!customerId) {
    container.innerHTML = '<p class="muted">Please log in first.</p>';
    return;
  }
  container.innerHTML = '<p class="muted">Loading order history...</p>';

  try {
    const res = await fetch(`${API}/orders/history/${customerId}`);
    const orders = await res.json();
    if (!res.ok) throw new Error(orders.error || orders.details || "Unable to load order history.");

    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = '<p class="muted">No orders yet - go place one!</p>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-card-top">
          <b>Order #${order.order_id}</b>
          <span class="badge status-review">${order.status || "Pending"}</span>
        </div>
        <p style="margin:6px 0 0;">Total: $${Number(order.total_price || 0).toFixed(2)}</p>
        <p class="muted" style="margin:4px 0 0;">
          ${order.created_at ? new Date(order.created_at).toLocaleString() : ""}
        </p>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════════
// CUSTOMER PROFILE
// ══════════════════════════════════════════════════════════════════
async function loadCustomerProfile() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/profile/customer`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById("profileName").value = data.customer.name;
    document.getElementById("profileEmail").value = data.customer.email;
    document.getElementById("profilePhone").value = data.customer.phone || "";
  } catch (err) {
    console.error(err.message);
  }
}

async function saveCustomerProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();

  try {
    const res = await fetch(`${API}/profile/customer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.details && data.details.join(", ")) || data.error);

    customerName = name;
    localStorage.setItem("customer_name", name);
    updateCustomerHeader();

    showStatus("profileStatus", "Profile updated!", true);
    setTimeout(() => { document.getElementById("profileStatus").innerHTML = ""; }, 3000);
  } catch (err) {
    showStatus("profileStatus", err.message, false);
  }
}

async function changeCustomerPassword() {
  const currentPassword =
    document.getElementById("currentPassword").value;

  const newPassword =
    document.getElementById("newPassword").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showStatus(
      "passwordStatus",
      "Please fill in all password fields.",
      false
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showStatus(
      "passwordStatus",
      "The new passwords do not match.",
      false
    );
    return;
  }

  if (newPassword.length < 8) {
    showStatus(
      "passwordStatus",
      "The new password must be at least 8 characters.",
      false
    );
    return;
  }

  try {
    const res = await fetch(
      `${API}/profile/customer/customer/password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Unable to change password."
      );
    }

    showStatus(
      "passwordStatus",
      "Password changed successfully!",
      true
    );

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    setTimeout(() => {
      document.getElementById("passwordStatus").innerHTML = "";
    }, 3000);

  } catch (err) {
    showStatus(
      "passwordStatus",
      err.message,
      false
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// STALL OWNER APP
// ══════════════════════════════════════════════════════════════════
function enterOwnerApp() {
  goScreen("owner-app");
  document.getElementById("ownerChipName").textContent = ownerName;
  ownerNav("overview");
  loadOwnerStalls();
}

function ownerLogout() {
  owner_token = null; ownerName = null;
  localStorage.removeItem("owner_token");
  localStorage.removeItem("owner_name");
  goScreen("role");
}

function ownerNav(page) {
  document.querySelectorAll("#screen-owner-app .dash-nav-item[data-owner-page]").forEach(n => n.classList.remove("active"));
  const navItem = document.querySelector(`#screen-owner-app .dash-nav-item[data-owner-page="${page}"]`);
  if (navItem) navItem.classList.add("active");

  document.querySelectorAll("#screen-owner-app .dash-page").forEach(p => p.classList.remove("active"));
  document.getElementById(`owner-page-${page}`).classList.add("active");

  const titles = { overview: "Overview", hygiene: "Hygiene Grade", feedback: "Feedback", complaints: "Complaints", menu: "Menu & Stall" };
  document.getElementById("ownerPageTitle").textContent = titles[page] || "";

  if (page === "overview") loadOwnerOverview();
  if (page === "hygiene") loadOwnerHygiene();
  if (page === "feedback") loadOwnerFeedback();
  if (page === "complaints") loadOwnerComplaints();
  if (page === "menu") loadOwnerMenu();
}

async function loadOwnerStalls() {
  try {
    const res = await fetch(`${API}/catalog/stalls`);
    const stalls = await res.json();
    if (!res.ok) return;

    // We don't have owner_id in the JWT-verified session directly here, but the
    // dashboard endpoints (/owner/feedback etc.) already scope by it server-side.
    // This local list is just used to power the stall picker + hygiene grade page.
    ownerStalls = stalls;

    const select = document.getElementById("ownerStallSelect");
    const wrap = document.getElementById("ownerStallSelectWrap");
    select.innerHTML = stalls.map(s => `<option value="${s.stall_id}">${s.stall_name}</option>`).join("");
    wrap.style.display = stalls.length > 1 ? "block" : "none";
  } catch (err) {
    console.error("Unable to load stalls:", err);
  }
}

async function loadOwnerOverview() {
  const statsEl = document.getElementById("ownerOverviewStats");
  const feedbackEl = document.getElementById("ownerOverviewFeedback");
  const complaintsEl = document.getElementById("ownerOverviewComplaints");
  statsEl.innerHTML = '<p class="muted">Loading...</p>';

  try {
    const [fRes, cRes] = await Promise.all([
      fetch(`${API}/owner/feedback`, { headers: { Authorization: `Bearer ${owner_token}` } }),
      fetch(`${API}/owner/complaints`, { headers: { Authorization: `Bearer ${owner_token}` } }),
    ]);
    const fData = await fRes.json();
    const cData = await cRes.json();
    if (!fRes.ok) throw new Error(fData.error || "Unable to load feedback.");
    if (!cRes.ok) throw new Error(cData.error || "Unable to load complaints.");

    const feedback = fData.feedback || [];
    const complaints = cData.complaints || [];
    const avgRating = feedback.length
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : "-";
    const openComplaints = complaints.filter(c => c.status !== "Resolved").length;

    statsEl.innerHTML =
      statCard("⭐", "i-orange", avgRating, "Average Rating") +
      statCard("💬", "i-purple", feedback.length, "Total Feedback") +
      statCard("📋", "i-red", openComplaints, "Open Complaints") +
      statCard("✅", "i-green", complaints.filter(c => c.status === "Resolved").length, "Resolved");

    feedbackEl.innerHTML = feedback.slice(0, 5).length
      ? feedback.slice(0, 5).map(f => `
          <div class="feedback-entry">
            <span class="stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
            <b>${f.customer_name}</b>
            <p style="margin:4px 0;">${f.comment}</p>
          </div>`).join("")
      : '<p class="muted">No feedback yet.</p>';

    complaintsEl.innerHTML = complaints.filter(c => c.status !== "Resolved").slice(0, 5).length
      ? complaints.filter(c => c.status !== "Resolved").slice(0, 5).map(c => `
          <div class="complaint-card">
            <div class="complaint-card-top">
              <b>${c.category}</b>
              <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
            </div>
            <p style="margin:6px 0;">${c.description}</p>
          </div>`).join("")
      : '<p class="muted">No open complaints.</p>';
  } catch (err) {
    statsEl.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

async function loadOwnerHygiene() {
  const select = document.getElementById("ownerStallSelect");
  const stallId = select.value ? Number(select.value) : (ownerStalls[0] && ownerStalls[0].stall_id);
  const currentEl = document.getElementById("ownerCurrentGrade");
  const historyEl = document.getElementById("ownerGradeHistory");

  if (!stallId) {
    currentEl.innerHTML = '<div class="placeholder">No stall found for this account.</div>';
    historyEl.innerHTML = "";
    return;
  }

  currentEl.innerHTML = "Loading...";
  historyEl.innerHTML = "Loading...";

  try {
    const [inspectionRes, gradeRes] = await Promise.all([fetch(`${API}/inspection`), fetch(`${API}/grade`)]);
    const inspections = await inspectionRes.json();
    const grades = await gradeRes.json();

    const inspectionMap = {};
    inspections.forEach(i => { inspectionMap[i.inspection_id] = i; });

    let history = grades.filter(g => {
      const inspection = inspectionMap[g.inspection_id];
      return inspection && inspection.stall_id == stallId;
    }).map(g => ({ ...g, inspection_date: inspectionMap[g.inspection_id].inspection_date }));
    history.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));

    if (history.length === 0) {
      currentEl.innerHTML = '<div class="placeholder">No hygiene grades recorded yet.</div>';
      historyEl.innerHTML = "";
      return;
    }

    const current = history[0];
    const gradeColours = { A: "#28c76f", B: "#7367f0", C: "#ff9f43", D: "#ea5455" };

    currentEl.innerHTML = `
      <div style="text-align:center;">
        <span style="font-size:80px;font-weight:800;color:${gradeColours[current.grade] || "#999"}">${current.grade}</span>
        <div class="muted">Valid until ${new Date(current.valid_until).toLocaleDateString()}</div>
      </div>`;

    historyEl.innerHTML = history.map(g => `
      <div class="feedback-entry">
        <span style="color:${gradeColours[g.grade] || "#999"};font-weight:800;font-size:15px;">Grade ${g.grade}</span>
        <p style="margin:4px 0;">Issued: ${new Date(g.issued_date).toLocaleDateString()}</p>
        <span class="muted">Valid until: ${new Date(g.valid_until).toLocaleDateString()}</span>
      </div>`).join("");
  } catch (err) {
    currentEl.innerHTML = '<div class="placeholder">Could not load grade data.</div>';
    historyEl.innerHTML = "";
  }
}

async function loadOwnerFeedback() {
  const listEl = document.getElementById("ownerFeedbackList");
  listEl.innerHTML = '<p class="muted">Loading...</p>';

  const from = document.getElementById("ownerFeedbackFrom").value;
  const to = document.getElementById("ownerFeedbackTo").value;
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  try {
    const res = await fetch(`${API}/owner/feedback?${params.toString()}`, { headers: { Authorization: `Bearer ${owner_token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load feedback.");

    if (data.feedback.length === 0) {
      listEl.innerHTML = '<p class="muted">No feedback in this range.</p>';
      return;
    }

    listEl.innerHTML = data.feedback.map(f => `
      <div class="feedback-entry">
        <span class="stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
        <b>${f.customer_name}</b> on <i>${f.stall_name}</i>
        <p style="margin:4px 0;">${f.comment}</p>
        <span class="muted">${new Date(f.created_at).toLocaleString()}</span>
        <div class="row-2" style="margin-top:6px;">
          <input type="text" id="reply-${f.feedback_id}" placeholder="Write a reply..." style="margin:0;" />
          <button class="btn-secondary" onclick="postOwnerReply(${f.feedback_id})">Reply</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

async function postOwnerReply(feedbackId) {
  const input = document.getElementById(`reply-${feedbackId}`);
  const reply_text = input.value.trim();
  if (!reply_text) return alert("Please enter a reply.");

  try {
    const res = await fetch(`${API}/feedback-replies/${feedbackId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${owner_token}` },
      body: JSON.stringify({ reply_text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to post reply.");
    alert("Reply posted!");
    loadOwnerFeedback();
  } catch (err) {
    alert(err.message);
  }
}

async function loadOwnerComplaints() {
  const listEl = document.getElementById("ownerComplaintsListFull");
  listEl.innerHTML = '<p class="muted">Loading...</p>';

  const from = document.getElementById("ownerComplaintsFrom").value;
  const to = document.getElementById("ownerComplaintsTo").value;
  const status = document.getElementById("ownerComplaintStatusFilter").value;
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (status) params.set("status", status);

  try {
    const res = await fetch(`${API}/owner/complaints?${params.toString()}`, { headers: { Authorization: `Bearer ${owner_token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load complaints.");

    if (data.complaints.length === 0) {
      listEl.innerHTML = '<p class="muted">No complaints in this range.</p>';
      return;
    }

    listEl.innerHTML = data.complaints.map(c => `
      <div class="complaint-card">
        <div class="complaint-card-top">
          <b>${c.category}</b> on <i>${c.stall_name}</i>
          <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
        </div>
        <p style="margin:6px 0;">${c.description}</p>
        <span class="muted">By ${c.customer_name} · Updated ${new Date(c.updated_at).toLocaleString()}</span>
        <div class="row-2" style="margin-top:6px;">
          <select id="statusSelect-${c.complaint_id}" style="margin:0;">
            <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Under Review" ${c.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option value="Resolved" ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
          <button class="btn-secondary" onclick="updateComplaintStatus(${c.complaint_id})">Update</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

async function updateComplaintStatus(complaintId) {
  const select = document.getElementById(`statusSelect-${complaintId}`);
  const status = select.value;

  try {
    const res = await fetch(`${API}/complaints/${complaintId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${owner_token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to update status.");
    alert("Status updated!");
    loadOwnerComplaints();
  } catch (err) {
    alert(err.message);
  }
}

// ── Menu & Stall management (Siyu's feature, restyled + fixed to use the
//    logged-in owner's actual stall instead of a hardcoded stall_id) ──────
function currentOwnerStallId() {
  return ownerStalls[0] ? ownerStalls[0].stall_id : null;
}

async function loadOwnerMenu() {
  const table = document.getElementById("menuTable");
  const stallId = currentOwnerStallId();

  if (!stallId) {
    table.innerHTML = '<div class="placeholder">No stall found for this account.</div>';
    return;
  }

  table.innerHTML = '<p class="muted">Loading menu...</p>';

  try {
    const res = await fetch(`${API}/menu/stall/${stallId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unable to load menu.");

    const menuItems = data.data;
    if (!menuItems || menuItems.length === 0) {
      table.innerHTML = '<div class="placeholder">No menu items found.</div>';
      return;
    }

    table.innerHTML = menuItems.map(item => `
      <div class="menu-item-row">
        ${imageOrFallback(item.image_url, foodEmojiFor(item.item_name), "menu-item-thumb")}
        <div style="flex:1;">
          <b>${item.item_name}</b>
          <div class="muted">$${Number(item.price).toFixed(2)}</div>
        </div>
        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="editMenuItem(${item.item_id})">Edit</button>
        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="deleteMenuItem(${item.item_id})">Delete</button>
      </div>
    `).join("");
  } catch (err) {
    table.innerHTML = `<p class="status err">${err.message}</p>`;
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm("Delete this menu item?")) return;
  try {
    const res = await fetch(`${API}/menu/${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unable to delete menu item.");
    loadOwnerMenu();
  } catch (err) {
    alert(err.message);
  }
}

async function editMenuItem(itemId) {
  try {
    const res = await fetch(`${API}/menu/${itemId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unable to load menu item.");

    const item = data.data;
    editingMenuId = itemId;

    document.getElementById("menuName").value = item.item_name;
    document.getElementById("menuPrice").value = item.price;
    document.getElementById("menuDescription").value = item.description || "";
    document.getElementById("menuImageUrl").value = item.image_url || "";
    document.getElementById("menuAvailable").value = item.is_available ? "true" : "false";
    document.getElementById("menuFormTitle").textContent = "Edit Menu Item";
  } catch (err) {
    alert(err.message);
  }
}

async function saveMenuItem() {
  const itemName = document.getElementById("menuName").value.trim();
  const price = document.getElementById("menuPrice").value;
  const description = document.getElementById("menuDescription").value.trim();
  const imageUrl = document.getElementById("menuImageUrl").value.trim();
  const isAvailable = document.getElementById("menuAvailable").value === "true";
  const stallId = currentOwnerStallId();

  if (!itemName || !price) return alert("Please enter the item name and price.");
  if (!stallId) return alert("No stall found for this account.");

  try {
    const url = editingMenuId ? `${API}/menu/${editingMenuId}` : `${API}/menu`;
    const method = editingMenuId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stall_id: stallId,
        item_name: itemName,
        description,
        price: Number(price),
        is_available: isAvailable,
        image_url: imageUrl || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unable to save menu item.");

    document.getElementById("menuName").value = "";
    document.getElementById("menuPrice").value = "";
    document.getElementById("menuDescription").value = "";
    document.getElementById("menuImageUrl").value = "";
    document.getElementById("menuAvailable").value = "true";
    document.getElementById("menuFormTitle").textContent = "Add Menu Item";
    editingMenuId = null;

    loadOwnerMenu();
  } catch (err) {
    alert(err.message);
  }
}

// ══════════════════════════════════════════════════════════════════
// NEA OFFICER APP
// ══════════════════════════════════════════════════════════════════
function enterOfficerApp() {
  goScreen("officer-app");
  document.getElementById("officerChipName").textContent = officerName;
  officerNav("inspections");
}

function officerLogout() {
  officer_token = null; officerName = null; officerId = null;
  localStorage.removeItem("officer_token");
  localStorage.removeItem("officer_name");
  localStorage.removeItem("officer_id");
  goScreen("role");
}

function officerNav(page) {
  document.querySelectorAll("#screen-officer-app .dash-nav-item[data-officer-page]").forEach(n => n.classList.remove("active"));
  document.querySelector(`#screen-officer-app .dash-nav-item[data-officer-page="${page}"]`).classList.add("active");
  document.querySelectorAll("#screen-officer-app .dash-page").forEach(p => p.classList.remove("active"));
  document.getElementById(`officer-page-${page}`).classList.add("active");
}

async function loadInspectionHistory() {
  const res = await fetch(`${API}/inspection`);
  if (!res.ok) {
    document.getElementById("inspectionHistoryList").innerHTML = "Unable to load inspection history.";
    return;
  }
  allInspections = await res.json();
  if (!Array.isArray(allInspections)) allInspections = [];

  populateInspectionFilterOptions();
  renderInspectionHistory();
}

function populateInspectionFilterOptions() {
  const stallSelect = document.getElementById("inspFilterStall");
  const officerSelect = document.getElementById("inspFilterOfficer");
  const prevStall = stallSelect.value;
  const prevOfficer = officerSelect.value;

  const stallNames = [...new Set(allInspections.map(i => i.stall_name ?? i.stall_id))].sort();
  const officerNames = [...new Set(allInspections.map(i => i.officer_name ?? i.officer_id))].sort();

  stallSelect.innerHTML = '<option value="">All Stalls</option>' +
    stallNames.map(name => `<option value="${name}">${name}</option>`).join("");
  officerSelect.innerHTML = '<option value="">All Officers</option>' +
    officerNames.map(name => `<option value="${name}">${name}</option>`).join("");

  stallSelect.value = prevStall;
  officerSelect.value = prevOfficer;
}

function renderInspectionHistory() {
  const stallFilter = document.getElementById("inspFilterStall").value;
  const gradeFilter = document.getElementById("inspFilterGrade").value;
  const officerFilter = document.getElementById("inspFilterOfficer").value;
  const sortBy = document.getElementById("inspSortBy").value;

  let filtered = allInspections.filter(i => {
    if (stallFilter && String(i.stall_name ?? i.stall_id) !== stallFilter) return false;
    if (gradeFilter && i.grade !== gradeFilter) return false;
    if (officerFilter && String(i.officer_name ?? i.officer_id) !== officerFilter) return false;
    return true;
  });

  const gradeRank = { A: 4, B: 3, C: 2, D: 1 };
  if (sortBy === "date_desc") {
    filtered.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));
  } else if (sortBy === "date_asc") {
    filtered.sort((a, b) => new Date(a.inspection_date) - new Date(b.inspection_date));
  } else if (sortBy === "grade_best") {
    filtered.sort((a, b) => (gradeRank[b.grade] || 0) - (gradeRank[a.grade] || 0));
  } else if (sortBy === "grade_worst") {
    filtered.sort((a, b) => (gradeRank[a.grade] || 0) - (gradeRank[b.grade] || 0));
  }

  const listEl = document.getElementById("inspectionHistoryList");
  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="muted">No inspections match these filters.</p>';
    return;
  }

  listEl.innerHTML = filtered.map(i => `
    <div class="inspection-entry">
      <b>Inspection #${i.inspection_id}</b>
      <p><b>Stall:</b> ${i.stall_name ?? i.stall_id}</p>
      <p><b>Officer:</b> ${i.officer_name ?? i.officer_id}</p>
      <p><b>Score:</b> ${i.score}${i.grade ? ` (${i.grade})` : ""}</p>
      <p><b>Remarks:</b> ${i.remarks || "None"}</p>
      <p><b>Date:</b> ${new Date(i.inspection_date).toLocaleDateString()}</p>
    </div>
  `).join("");
}

function toggleInspectionHistory() {
  const history = document.getElementById("inspectionHistory");
  const panel = document.getElementById("addInspectionPanel");
  panel.style.display = "none";
  if (history.style.display === "none") {
    history.style.display = "block";
    loadInspectionHistory();
  } else {
    history.style.display = "none";
  }
}

function toggleAddInspection() {
  const history = document.getElementById("inspectionHistory");
  const panel = document.getElementById("addInspectionPanel");
  history.style.display = "none";
  if (panel.style.display === "none") {
    panel.style.display = "block";
    loadInspectionStalls();
  } else {
    panel.style.display = "none";
  }
}

async function loadInspectionStalls() {
  const res = await fetch(`${API}/catalog/stalls`);
  if (!res.ok) return;
  const stalls = await res.json();
  const select = document.getElementById("inspectionStall");
  select.innerHTML = '<option value="">-- Select a stall --</option>' +
    stalls.map(s => `<option value="${s.stall_id}">${s.stall_name}</option>`).join("");
}

async function submitInspection() {
  const scoreInput = document.getElementById("inspectionScore");
  const score = Number(scoreInput.value);
  if (scoreInput.value.trim() === "" || !Number.isInteger(score) || score < 0 || score > 100) {
    showStatus("inspectionStatus", "Score must be an integer from 0 to 100.", false);
    return;
  }

  const stall_id = document.getElementById("inspectionStall").value;
  const remarks = document.getElementById("inspectionRemarks").value;

  try {
    const res = await fetch(`${API}/inspection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${officer_token}` },
      body: JSON.stringify({ stall_id: Number(stall_id), officer_id: Number(officerId), score, remarks }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || data.error || (Array.isArray(data.details) ? data.details.join(", ") : null) || "Unable to create inspection.";
      showStatus("inspectionStatus", errorMsg, false);
      return;
    }

    showStatus("inspectionStatus", "Inspection created successfully!", true);
    document.getElementById("inspectionRemarks").value = "";
    document.getElementById("inspectionScore").value = "";
    document.getElementById("addInspectionPanel").style.display = "none";
    document.getElementById("inspectionHistory").style.display = "block";
    loadInspectionHistory();
  } catch (err) {
    showStatus("inspectionStatus", "Network error: " + err.message, false);
  }
}

// ══════════════════════════════════════════════════════════════════
// INIT — resume whichever session (if any) was already active
// ══════════════════════════════════════════════════════════════════
if (owner_token) {
  enterOwnerApp();
} else if (officer_token) {
  enterOfficerApp();
} else if (token) {
  enterCustomerApp();
} else {
  goScreen("role");
}