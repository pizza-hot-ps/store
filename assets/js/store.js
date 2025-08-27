// 📦 تحميل الكتالوج الأساسي
fetch("assets/data/catalog.json")
  .then(res => res.json())
  .then(data => {
    window.catalog = data;
    renderCatalog(); // ← سنكتبها لاحقًا
  });

// 🧠 تحميل قواعد الخصم وتفعيلها
fetch("assets/data/rules.json")
  .then(res => res.json())
  .then(data => {
    DiscountEngine.loadRulesFrom(data);
    renderCart(); // ← سنكتبها لاحقًا
  });
function renderGenericTable(label, items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "drink-section";

  section.innerHTML = `
    <h4>${label}</h4>
    <table class="drink-table menu-table">
      <thead>
        <tr><th>المنتج</th><th>الحجم</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th><th></th></tr>
      </thead>
      <tbody>
        ${items.filter(i => i.enabled !== false).map(item => {
          const defaultSize = item.sizes ? Object.keys(item.sizes)[0] : item.size || "—";
          const defaultPrice = item.sizes ? item.sizes[defaultSize] : item.price;

          return `
            <tr data-item="${item.name}">
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <img src="assets/images/${item.image}" alt="${item.name}" style="height:40px;border-radius:4px;">
                  <span>${item.name}</span>
                </div>
              </td>
              <td>
                ${item.sizes
                  ? `<select class="size">
                      ${Object.entries(item.sizes).map(([label, price]) =>
                        `<option value="${price}">${label} – ${price}${config.currency}</option>`
                      ).join("")}
                    </select>`
                  : item.size || "—"}
              </td>
              <td><span class="price">${defaultPrice}${config.currency}</span></td>
              <td><input class="qty" type="number" min="1" value="1"></td>
              <td class="total-cell">${defaultPrice}${config.currency}</td>
              <td><button class="add-btn">أضف</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
  container.appendChild(section);
}
function renderCatalog() {
  renderGenericTable("🍕 قائمة البيتزا", catalog.pizza, "pizza-menu");
  renderGenericTable("🍟 أطباق جانبية", catalog.sides, "sides-menu");
  renderGenericTable("🥤 مشروبات", catalog.drinks, "drinks-container");
  renderGenericTable("🍸 كوكتيلات", catalog.cocktails.items, "cocktails-container");
  renderGenericTable("🍹 عصائر طبيعية", catalog.naturalJuices.items, "natural-juices-container");

  bindCartEvents();              // ← سنكتبها في الجزء الرابع
  bindQuantityAndSizeEvents();  // ← سنكتبها في الجزء الخامس
}
function bindCartEvents() {
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest("tr");
      const item = row.dataset.item;
      const sizeSelect = row.querySelector(".size");
      const qty = parseInt(row.querySelector(".qty").value || "1");

      let price;
      let label = item;

      if (sizeSelect) {
        const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
        price = parseFloat(selectedOption.value);
        const sizeLabel = selectedOption.text.split(" –")[0];
        label = `${item} (${sizeLabel})`;
      } else {
        price = parseFloat(row.querySelector(".price").textContent);
      }

      CartCore.add(label, price, qty);
      showAddToast();
      renderCart(); // ← سنكتبه في الجزء السادس
    };
  });
}
function bindQuantityAndSizeEvents() {
  document.querySelectorAll("tr[data-item]").forEach(row => {
    const sizeSelect = row.querySelector(".size");
    const qtyInput = row.querySelector(".qty");
    const priceCell = row.querySelector(".price");
    const totalCell = row.querySelector(".total-cell");

    function updateTotal() {
      const price = sizeSelect ? parseFloat(sizeSelect.value) : parseFloat(row.dataset.price);
      const qty = parseInt(qtyInput.value || "1");
      priceCell.textContent = `${price}${config.currency}`;
      totalCell.textContent = `${(price * qty).toFixed(2)}${config.currency}`;
    }

    if (sizeSelect) sizeSelect.onchange = updateTotal;
    if (qtyInput) qtyInput.oninput = updateTotal;
    updateTotal(); // ← تفعيل الحساب مباشرة عند التحميل
  });
}
function renderCart() {
  const cartData = CartCore.get();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();
  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const { total, applied, breakdown } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2,
    "instore", new Date().toISOString(), "whatsapp", new Date().getHours()
  );

  const autoRule = applied.find(name =>
    name.includes("تلقائي") || name.includes("FRIDAY") || name.includes("HOLIDAY")
  );

  document.getElementById("auto-discount-alert").style.display = autoRule ? "block" : "none";

  const preview = document.getElementById("cart-preview");
  preview.innerHTML = `
    <h3>📦 معاينة الطلب</h3>
    <div class="cart-section">
      <p>👤 الاسم: <strong>${userName || "—"}</strong></p>
      <p>🎟️ الكود الأساسي: ${coupon1 || config.promoCoupon}</p>
      <p>🎟️ الكود الثانوي: ${coupon2 || "—"}</p>
    </div>

    <div class="cart-section">
      <p>💰 الإجمالي قبل الخصم: <strong>${rawTotal.toFixed(2)}${config.currency}</strong></p>
      <p>🧠 القواعد المفعّلة: ${applied.length ? applied.join(", ") : "—"}</p>
      <p>🎯 الخصومات المطبقة:</p>
      <ul>${breakdown.map(b => `<li>${b}</li>`).join("")}</ul>
      <p>💸 الإجمالي بعد الخصم: <strong>${total.toFixed(2)}${config.currency}</strong></p>
    </div>

    <div class="cart-section">
      <p>🧾 محتوى السلة:</p>
      <ul>
        ${cartData.map(i => {
          const line = `${i.qty} × ${i.item} = ${(i.price * i.qty).toFixed(2)}${config.currency}`;
          return i.price > 0
            ? `<li>${line}</li>`
            : `<li style="background:#fff3cd;border-right:4px solid orange;">${line} 🔺 السعر غير معروف</li>`;
        }).join("")}
      </ul>
    </div>

    <button class="copy-btn" onclick="copyOrderMessage()">📋 نسخ الطلب</button>
  `;
}
function copyOrderMessage() {
  const msg = document.getElementById("cart-preview").textContent;
  navigator.clipboard.writeText(msg).then(() => {
    alert("📋 تم نسخ الطلب إلى الحافظة");
  });
}
function sendOrder() {
  const cartData = CartCore.get();
  const userName = document.getElementById("user-name").value.trim();
  const coupon1 = document.getElementById("user-coupon").value.trim();
  const coupon2 = document.getElementById("secondary-coupon").value.trim();

  const rawTotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { total, applied } = DiscountEngine.apply(
    rawTotal, cartData, userName, coupon1, coupon2,
    "instore", new Date().toISOString(), "whatsapp", new Date().getHours()
  );

  const message = `
🧺 طلب جديد من ${userName || "—"}:
${cartData.map(i => `• ${i.qty} × ${i.item} = ${(i.price * i.qty).toFixed(2)}₪`).join("\n")}

💰 الإجمالي قبل الخصم: ${rawTotal.toFixed(2)}₪
🎯 الخصومات: ${applied.join(", ") || "—"}
💸 الإجمالي بعد الخصم: ${total.toFixed(2)}₪

🎟️ كود 1: ${coupon1 || "—"}
🎟️ كود 2: ${coupon2 || "—"}
📦 تم الإرسال من صفحة الطلب
  `.trim();

  const encoded = encodeURIComponent(message);
  const link = `https://wa.me/${config.whatsappNumber}?text=${encoded}`;
  window.open(link, "_blank");

  savePendingOrder({ userName, cartData, total, coupon1, coupon2 });
}
function savePendingOrder(order) {
  const history = JSON.parse(localStorage.getItem("orderHistory") || "[]");
  history.push({ ...order, time: new Date().toISOString() });
  localStorage.setItem("orderHistory", JSON.stringify(history));
}
window.onload = () => {
  renderCatalog(); // عرض كل الفئات
  renderCart();    // عرض السلة ومعاينتها

  // ربط زر الإرسال
  document.getElementById("send-order-btn").onclick = sendOrder;

  // ربط الحقول بتحديث السلة تلقائيًا
  document.getElementById("user-name").oninput = renderCart;
  document.getElementById("user-coupon").oninput = renderCart;
  document.getElementById("secondary-coupon").oninput = renderCart;
};
