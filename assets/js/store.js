// 🧩 بناء الكتالوج الديناميكي
function renderCatalog() {
  const pizzaTable = document.querySelector("#pizza-menu tbody");
  pizzaTable.innerHTML = "";

  catalog.pizza.forEach(item => {
    const [defaultLabel, defaultPrice] = Object.entries(item.sizes)[0];
    const row = document.createElement("tr");
    row.dataset.item = item.name;
    row.innerHTML = `
      <td>${item.name}</td>
      <td>
        <select class="size">
          ${Object.entries(item.sizes).map(([label, price]) =>
            `<option value="${price}">${label} – ${price}₪</option>`
          ).join("")}
        </select>
      </td>
      <td><span class="price">${defaultPrice}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${defaultPrice}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    pizzaTable.appendChild(row);
  });

  const sidesTable = document.querySelector("#sides-menu tbody");
  sidesTable.innerHTML = "";
  catalog.sides.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.item = item.name;
    row.dataset.price = item.price;
    row.innerHTML = `
      <td>${item.name}</td>
      <td><span class="price">${item.price}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${item.price}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    sidesTable.appendChild(row);
  });

  const drinksTable = document.querySelector("#drinks-menu tbody");
  drinksTable.innerHTML = "";
  catalog.drinks.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.item = item.name;
    row.dataset.price = item.price;
    row.innerHTML = `
      <td>${item.name}</td>
      <td><span class="price">${item.price}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${item.price}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    drinksTable.appendChild(row);
  });

  bindCartEvents();
  bindQuantityAndSizeEvents();
}

// 🧾 إدارة السلة وتخزين سجل الطلبات
function addToCart(item, price, qty) {
  const cart = getCartData();
  const existing = cart.find(i => i.item === item);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ item, price, qty });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getCartData() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function saveOrderSnapshot(orderText) {
  const history = JSON.parse(localStorage.getItem("orderHistory") || "[]");
  history.push({
    id: Date.now(),
    date: new Date().toISOString(),
    content: orderText
  });
  localStorage.setItem("orderHistory", JSON.stringify(history));
}
// 📦 معاينة الطلب
function renderCart() {
  const cartData = getCartData();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();
  const channel = "instore";
  const orderDate = new Date().toISOString();
  const bookedVia = "whatsapp";
  const desiredHour = new Date().getHours();
  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour
  );

  const autoRule = applied.find(name =>
    name.includes("تلقائي") || name.includes("FRIDAY") || name.includes("HOLIDAY")
  );

  document.getElementById("auto-discount-alert").style.display = autoRule ? "block" : "none";
  const primaryBlocked = autoRule ? `🧠 تم حجز الحقل الأساسي بواسطة: ${autoRule}` : "—";

  const preview = document.getElementById("cart-preview");
  preview.innerHTML = `
    <h3>📦 معاينة الطلب</h3>
    <p>👤 الاسم: ${userName || "—"}</p>
    <p>💰 الإجمالي قبل الخصم: ${rawTotal.toFixed(2)}₪</p>
    <p>🧠 القواعد المفعّلة: ${applied.join(", ") || "—"}</p>
    <p>📌 من حجز الحقل الأساسي: ${primaryBlocked}</p>
    <p>🎯 الخصومات المطبقة:</p>
    <ul>${breakdown.map(b => `<li>${b}</li>`).join("")}</ul>
    <p>💸 الإجمالي بعد الخصم: <strong>${total.toFixed(2)}₪</strong></p>
    <p>🎟️ الكود الأساسي: ${coupon1 || "—"} | الكود الثانوي: ${coupon2 || "—"}</p>
    <p>🧾 محتوى السلة:</p>
    <ul>
      ${cartData.map(i => `<li>${i.qty} × ${i.item} = ${(i.price * i.qty).toFixed(2)}₪</li>`).join("")}
    </ul>
    <button class="copy-btn" aria-label="نسخ الطلب إلى الحافظة" onclick="copyOrderMessage()">📋 نسخ الطلب</button>
    <button class="view-btn" aria-label="عرض سجل الطلبات" onclick="window.location.href='order_history.html'">📜 عرض سجل الطلبات</button>
  `;

  const previewBtn = document.getElementById("start-btn");
  if (previewBtn) {
    previewBtn.textContent = `☑ معاينة الطلب (${cartData.length})`;
  }

  const orderText = cartData.map(i => `• ${i.qty} × ${i.item} = ${(i.price * i.qty).toFixed(2)}₪`).join("\n");
  saveOrderSnapshot(orderText);
}

// 📋 نسخ الطلب إلى الحافظة
function copyOrderMessage() {
  const msg = document.getElementById("cart-preview").textContent;
  navigator.clipboard.writeText(msg).then(() => {
    alert("📋 تم نسخ الطلب إلى الحافظة");
  });
}
// 📤 إرسال الطلب عبر واتساب
function sendOrder() {
  const cartData = getCartData();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();
  const channel = "instore";
  const orderDate = new Date().toISOString();
  const bookedVia = "whatsapp";
  const desiredHour = new Date().getHours();

  if (!cartData.length) {
    alert("🛒 السلة فارغة. أضف عناصر قبل إرسال الطلب.");
    return;
  }

  if (!userName) {
    alert("👤 يرجى إدخال الاسم قبل إرسال الطلب.");
    return;
  }

  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour
  );

  const message = `
طلب جديد من ${userName}:
-----------------------
${cartData.map(item => `• ${item.qty} × ${item.item} = ${(item.price * item.qty).toFixed(2)}₪`).join("\n")}
-----------------------
الإجمالي قبل الخصم: ${rawTotal.toFixed(2)}₪
الخصومات:
${breakdown.map(b => `- ${b}`).join("\n")}
الإجمالي بعد الخصم: ${total.toFixed(2)}₪
الكود الأساسي: ${coupon1 || "—"}
الكود الثانوي: ${coupon2 || "—"}
  `;

  const encoded = encodeURIComponent(message);
  const phone = config.whatsappNumber;
  const waLink = `https://wa.me/${phone}?text=${encoded}`;
  window.open(waLink, "_blank");

  saveOrderSnapshot(message);
}

// 🚀 تهيئة الصفحة عند التحميل
window.onload = () => {
  renderCatalog();
  loadDiscountRules();
  initAutoDiscount();
  restoreUserData();
  enableEnterToSend();
  enableCopyOnClick();
  renderCart();

  // حفظ تلقائي للاسم والعنوان
  document.getElementById("user-name").addEventListener("input", e => {
    localStorage.setItem("userName", e.target.value.trim());
  });
  document.getElementById("user-address").addEventListener("input", e => {
    localStorage.setItem("userAddress", e.target.value.trim());
  });
};
