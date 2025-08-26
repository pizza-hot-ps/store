// 🧩 تحميل الكتالوج الرسمي فقط لعرضه في store.html
fetch("assets/data/catalog.json")
  .then(res => res.json())
  .then(data => {
    window.catalog = data;
    renderCatalog();
  });

// 🧩 تحميل كتالوج السوبرماركت بشكل منفصل عند الحاجة فقط
let supermarketCatalog = [];

function loadSupermarketCatalog() {
  if (supermarketCatalog.length) return; // تم تحميله مسبقًا

  fetch("assets/data/supermarket.json")
    .then(res => res.json())
    .then(data => {
      supermarketCatalog = data;
      // يمكن هنا فتح نافذة منبثقة أو عرض صفحة مستقلة
      showSupermarketCatalog(data);
    });
}
function renderCatalog() {
  renderPizza(catalog.pizza);
  renderSides(catalog.sides);
  renderDrinks(catalog.drinks);
  bindCartEvents();
  bindQuantityAndSizeEvents();
}
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
function renderDrinks(list) {
  const table = document.querySelector("#drinks-menu tbody");
  table.innerHTML = "";

  const categories = {
    "عصائر": [],
    "كولا": [],
    "مياه": [],
    "أخرى": []
  };

  list.forEach(item => {
    const type = item.type || "أخرى";
    if (!categories[type]) categories[type] = [];
    categories[type].push(item);
  });

  Object.entries(categories).forEach(([label, items]) => {
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<td colspan="6"><strong>🧃 ${label}</strong></td>`;
    table.appendChild(headerRow);

    items.forEach(item => {
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
  });
}
function bindQuantityAndSizeEvents() {
  document.querySelectorAll("tr[data-item]").forEach(row => {
    const sizeSelect = row.querySelector(".size");
    const qtyInput = row.querySelector(".qty");
    const priceCell = row.querySelector(".price");
    const totalCell = row.querySelector(".total-cell");

    function updateRowTotal() {
      const price = sizeSelect ? parseFloat(sizeSelect.value) : parseFloat(row.dataset.price);
      const qty = parseInt(qtyInput.value || "1");
      priceCell.textContent = `${price}₪`;
      totalCell.textContent = `${(price * qty).toFixed(2)}₪`;
    }

    if (sizeSelect) sizeSelect.onchange = updateRowTotal;
    if (qtyInput) qtyInput.oninput = updateRowTotal;

    updateRowTotal(); // تهيئة أولية
  });
}
function bindCartEvents() {
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest("tr");
      const item = row.dataset.item;
      const qty = parseInt(row.querySelector(".qty").value || "1");
      const sizeSelect = row.querySelector(".size");
      const price = sizeSelect ? parseFloat(sizeSelect.value) : parseFloat(row.dataset.price || row.querySelector(".price")?.textContent);
      const sizeLabel = sizeSelect ? sizeSelect.selectedOptions[0].text : "";
      const itemLabel = sizeSelect ? `${item} (${sizeLabel})` : item;

      addToCart(itemLabel, price, qty);
      renderCart();
    };
  });
}
function addCustomItem() {
  const label = document.getElementById("custom-label").value.trim();
  const priceInput = document.getElementById("custom-price").value.trim();
  const qty = parseInt(document.getElementById("custom-qty").value);

  let price = parseFloat(priceInput);

  // فحص إن كان المنتج موجودًا مسبقًا في كتالوج السوبرماركت
  const known = supermarketCatalog.find(p => p.name === label);
  if (known && !priceInput) {
    price = known.price;
  }

  if (!label || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
    alert("يرجى إدخال وصف وسعر وكمية صحيحة");
    return;
  }

  addToCart(label, price, qty);
  renderCart();
}
function sendOrder() {
  const cartData = getCartData();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();

  if (!cartData.length || !userName) {
    alert("🛒 أدخل اسمك وأضف عناصر قبل الإرسال.");
    return;
  }

  const orderId = Date.now(); // رقم طلب فريد
  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2, "instore", new Date().toISOString(), "whatsapp", new Date().getHours()
  );

  const unknownItems = cartData.filter(i => !i.price || i.price === 0);
  if (unknownItems.length) {
    savePendingOrder(orderId, cartData, userName);
  }

  const message = `
طلب جديد من ${userName}:
-----------------------
${cartData.map(item => {
    const line = `• ${item.qty} × ${item.item} = ${(item.price * item.qty).toFixed(2)}₪`;
    return item.price ? line : `${line} (🔗 السعر غير معروف – أدخل هنا: https://pizza-hot.ps/admin/price?id=${orderId})`;
}).join("\n")}
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
  window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
}
function savePendingOrder(orderId, cartData, userName) {
  const pending = JSON.parse(localStorage.getItem("pendingOrders") || "[]");

  pending.push({
    orderId,
    userName,
    createdAt: new Date().toISOString(),
    items: cartData.filter(i => !i.price || i.price === 0),
    status: "pending"
  });

  localStorage.setItem("pendingOrders", JSON.stringify(pending));
}
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
function copyOrderMessage() {
  const msg = document.getElementById("cart-preview").textContent;
  navigator.clipboard.writeText(msg).then(() => {
    alert("📋 تم نسخ الطلب إلى الحافظة");
  });
}
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

  const savedName = localStorage.getItem("userName");
  const savedAddress = localStorage.getItem("userAddress");
  if (savedName) document.getElementById("user-name").value = savedName;
  if (savedAddress) document.getElementById("user-address").value = savedAddress;

  document.getElementById("start-btn").onclick = renderCart;
  document.getElementById("send-wa").onclick = sendOrder;
  document.getElementById("clear-cart").onclick = () => {
    localStorage.removeItem("cart");
    renderCart();
  };
};
