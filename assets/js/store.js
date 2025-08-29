function renderCatalog() {
  renderPizzaMenu(window.catalog.pizza);
  renderSidesMenu(window.catalog.sides);
  renderDrinksMenu(window.catalog.drinks);
}

function renderPizzaMenu(pizzaList) {
  const tbody = document.querySelector("#pizza-menu tbody");
  tbody.innerHTML = "";
  pizzaList.forEach(item => {
    if (!item.enabled) return;
    const defaultSize = Object.keys(item.sizes)[0];
    const defaultPrice = item.sizes[defaultSize];
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${item.image}" alt="${item.name}"> ${item.name}</td>
      <td>
        <select class="size">
          ${Object.entries(item.sizes).map(([size, price]) => `<option value="${price}">${size} – ${price}₪</option>`).join("")}
        </select>
      </td>
      <td><span class="price">${defaultPrice}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${defaultPrice}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    tbody.appendChild(row);
  });
}

function renderSidesMenu(sidesList) {
  const tbody = document.querySelector("#sides-menu tbody");
  tbody.innerHTML = "";
  sidesList.forEach(item => {
    if (!item.enabled) return;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${item.image}" alt="${item.name}"> ${item.name}</td>
      <td><span class="price">${item.price}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${item.price}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    tbody.appendChild(row);
  });
}

function renderDrinksMenu(drinksList) {
  const container = document.getElementById("drinks-container");
  container.innerHTML = "";
  drinksList.forEach(item => {
    if (!item.enabled) return;
    const box = document.createElement("div");
    box.className = "drink-section";
    const price = Object.values(item.sizes || {})[0] || item.price;
    box.innerHTML = `
      <h4>${item.name}</h4>
      <img src="${item.image}" alt="${item.name}">
      <p>السعر: ${price}₪</p>
      <input class="qty" type="number" min="1" value="1">
      <button class="add-btn">أضف</button>
    `;
    container.appendChild(box);
  });
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("add-btn")) {
    const parent = e.target.closest("tr") || e.target.closest(".drink-section");
    const name = parent.querySelector("img")?.alt || "منتج غير معروف";
    const qty = parseInt(parent.querySelector(".qty")?.value || "1");
    const price = parseFloat(parent.querySelector(".price")?.textContent.replace("₪", "") || "0");
    const sizeSelect = parent.querySelector(".size");
    const size = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text.split("–")[0].trim() : "";
    const label = size ? `${name} (${size})` : name;
    CartCore.add(label, price, qty);
    renderCart();
    e.target.classList.add("success");
    setTimeout(() => e.target.classList.remove("success"), 1000);
    const toast = document.getElementById("add-toast");
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 1200);
  }
});

function renderCart() {
  const cartBox = document.getElementById("cart-preview");
  const cart = CartCore.get();
  if (!cart.length) {
    cartBox.innerHTML = "<p>🛒 السلة فارغة</p>";
    return;
  }
  let html = "<h3>📦 معاينة الطلب</h3><ul>";
  let total = 0;
  cart.forEach(item => {
    html += `<li>${item.label} × ${item.qty} = ${item.price * item.qty}₪</li>`;
    total += item.price * item.qty;
  });
  html += `</ul><p><strong>الإجمالي: ${total.toFixed(2)}₪</strong></p>`;
  cartBox.innerHTML = html;
}

const CartCore = {
  items: [],
  add(label, price, qty) {
    this.items.push({ label, price, qty });
  },
  get() {
    return this.items;
  },
  clear() {
    this.items = [];
  }
};

function insertCouponFromClipboard(target) {
  navigator.clipboard.readText().then(text => {
    if (target === "primary") {
      document.getElementById("user-coupon").value = text.trim();
    } else {
      document.getElementById("secondary-coupon").value = text.trim();
    }
    renderCart();
  });
}

function insertCoupon(code, target) {
  if (target === "primary") {
    document.getElementById("user-coupon").value = code;
  } else {
    document.getElementById("secondary-coupon").value = code;
  }
  renderCart();
}

function activatePrimaryCoupon(code) {
  const input = document.getElementById("user-coupon");
  input.value = code;
  input.disabled = true;
  input.style.background = "#eee";
  input.style.cursor = "not-allowed";
  renderCart();
}

function activateSecondaryCoupon(code) {
  document.getElementById("secondary-coupon").value = code;
  renderCart();
}

function startRealCountdown(startTimestamp, durationHours = 3) {
  const timerBox = document.getElementById("countdown-timer");
  const durationMs = durationHours * 60 * 60 * 1000;
  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - startTimestamp;
    const remaining = durationMs - elapsed;
    if (remaining <= 0) {
      clearInterval(interval);
      timerBox.textContent = "✅ تم تفعيل العروض";
      if (typeof DiscountEngine !== "undefined" && typeof DiscountEngine.activate === "function") {
        DiscountEngine.activate();
      }
      document.getElementById("auto-discount-alert").style.display = "block";
      return;
    }
    const h = String(Math.floor(remaining / 3600000)).padStart(2, "0");
    const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
    timerBox.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

const launchTime = Date.now();
startRealCountdown(launchTime, 3);

function sendOrder() {
  const userName = document.getElementById("user-name").value.trim();
  const userAddr = document.getElementById("user-address").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();
  const cart = CartCore.get();
  const rawTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const result = DiscountEngine.apply(rawTotal, cart, userName, coupon1, coupon2);
  const msg = MessageBuilder.build(cart, userName, userAddr, result.total, result.applied, result.breakdown, rawTotal);
  const encoded = encodeURIComponent(msg);
  const waNumber = "972599123456";
  const waLink = `https://wa.me/${waNumber}?text=${encoded}`;
window.open(waLink, "_blank");
alert("✅ تم إرسال الطلب إلى WhatsApp.");
}
