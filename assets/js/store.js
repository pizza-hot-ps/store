// 🧩 تحميل الكتالوج الرسمي
fetch("assets/data/catalog.json")
  .then(res => res.json())
  .then(data => {
    window.catalog = data;
    renderCatalog();
  });

// 🧩 عرض الكتالوج في الجداول
function renderCatalog() {
  renderPizza(catalog.pizza);
  renderSides(catalog.sides);
  renderDrinks(catalog.drinks);
  bindCartEvents();
  bindQuantityAndSizeEvents();
}

// 🍕 بيتزا
function renderPizza(list) {
  const table = document.querySelector("#pizza-menu tbody");
  table.innerHTML = "";
  list.forEach(item => {
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
    table.appendChild(row);
  });
}

// 🍟 جانبيات
function renderSides(list) {
  const table = document.querySelector("#sides-menu tbody");
  table.innerHTML = "";
  list.forEach(item => {
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
    table.appendChild(row);
  });
}

// 🥤 مشروبات
function renderDrinks(list) {
  const table = document.querySelector("#drinks-menu tbody");
  table.innerHTML = "";
  list.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.item = item.name;
    row.dataset.price = item.price;
    if (item.highlight) row.classList.add("highlight-row");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.size || "—"}</td>
      <td><span class="price">${item.price}₪</span></td>
      <td><input class="qty" type="number" min="1" value="1"></td>
      <td class="total-cell">${item.price}₪</td>
      <td><button class="add-btn">أضف</button></td>
    `;
    table.appendChild(row);
  });
}

// 🛒 اختيار خاص من السوبرماركت
function addCustomItem() {
  const label = document.getElementById("custom-label").value.trim();
  const price = parseFloat(document.getElementById("custom-price").value);
  const qty = parseInt(document.getElementById("custom-qty").value);

  if (!label || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
    alert("يرجى إدخال وصف وسعر وكمية صحيحة");
    return;
  }

  addToCart(label, price, qty);
  renderCart();
}

// 🧾 إدارة السلة
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

// 📦 معاينة الطلب
function renderCart() {
  const cartData = getCartData();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();
  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2, "instore", new Date().toISOString(), "whatsapp", new Date().getHours()
  );

  const autoRule = applied.find(name => name.includes("تلقائي") || name.includes("FRIDAY") || name.includes("HOLIDAY"));
  document.getElementById("auto-discount-alert").style.display = autoRule ? "block" : "none";

  const preview = document.getElementById("cart-preview");
  preview.innerHTML = `
    <h3>📦 معاينة الطلب</h3>
    <p>👤 الاسم: ${userName || "—"}</p>
    <p>💰 الإجمالي قبل الخصم: ${rawTotal.toFixed(2)}₪</p>
    <p>🧠 القواعد المفعّلة: ${applied.join(", ") || "—"}</p>
    <p>🎯 الخصومات المطبقة:</p>
    <ul>${breakdown.map(b => `<li>${b}</li>`).join("")}</ul>
    <p>💸 الإجمالي بعد الخصم: <strong>${total.toFixed(2)}₪</strong></p>
    <p>🎟️ الكود الأساسي: ${coupon1 || "—"} | الكود الثانوي: ${coupon2 || "—"}</p>
    <p>🧾 محتوى السلة:</p>
    <ul>${cartData.map(i => `<li>${i.qty} × ${i.item} = ${(i.price * i.qty).toFixed(2)}₪</li>`).join("")}</ul>
    <button class="copy-btn" onclick="copyOrderMessage()">📋 نسخ الطلب</button>
  `;
}

// 📤 إرسال الطلب إلى واتساب
function sendOrder() {
  const cartData = getCartData();
  const userName = document.getElementById("user-name").value.trim();
  if (!cartData.length || !userName) return alert("🛒 أدخل اسمك وأضف عناصر قبل الإرسال.");

  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, "", "", "instore", new Date().toISOString(), "whatsapp", new Date().getHours()
  );

  const message = `
طلب جديد من ${userName}:
-----------------------
${cartData.map(item => {
    const line = `• ${item.qty} × ${item.item} = ${(item.price * item.qty).toFixed(2)}₪`;
    return item.price ? line : `${line} (🔗 السعر غير معروف – أدخل هنا: https://pizza-hot.ps/admin/price?id=${Date.now()})`;
}).join("\n")}
-----------------------
الإجمالي قبل الخصم: ${rawTotal.toFixed(2)}₪
الخصومات:
${breakdown.map(b => `- ${b}`).join("\n")}
الإجمالي بعد الخصم: ${total.toFixed(2)}₪
  `;

  const encoded = encodeURIComponent(message);
  const phone = config.whatsappNumber;
  window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
}

// 📋 نسخ الطلب
function copyOrderMessage() {
  const msg = document.getElementById("cart-preview").textContent;
  navigator.clipboard.writeText(msg).then(() => {
    alert("📋 تم نسخ الطلب إلى الحافظة");
  });
}

// ⚙️ تهيئة الصفحة
window.onload = () => {
  loadDiscountRules();
  initAutoDiscount();
  restoreUserData();
  enableEnterToSend();
  enableCopyOnClick();
  renderCart();

    document.getElementById("user-name").addEventListener("input", e => {
    localStorage.setItem("userName", e.target.value.trim());
  });

  document.getElementById("user-address").addEventListener("input", e => {
    localStorage.setItem("userAddress", e.target.value.trim());
  });

  // استرجاع الاسم والعنوان عند التحميل
  const savedName = localStorage.getItem("userName");
  const savedAddress = localStorage.getItem("userAddress");
  if (savedName) document.getElementById("user-name").value = savedName;
  if (savedAddress) document.getElementById("user-address").value = savedAddress;

  // تفعيل زر "معاينة الطلب"
  document.getElementById("start-btn").onclick = renderCart;

  // تفعيل زر "إرسال الطلب"
  document.getElementById("send-wa").onclick = sendOrder;

  // تفعيل زر "تفريغ السلة"
  document.getElementById("clear-cart").onclick = () => {
    localStorage.removeItem("cart");
    renderCart();
  };
};
