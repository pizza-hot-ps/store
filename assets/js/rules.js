// 🧠 تحميل قواعد الخصم من GitHub مباشرة
fetch("https://raw.githubusercontent.com/pizza-hot-ps/store/main/assets/data/rules.json")
  .then(res => res.json())
  .then(data => {
    // 🧠 تمرير القواعد إلى محرك الخصم
    DiscountEngine.loadRulesFrom(data);

    // ✅ تفعيل عرض السلة بعد تحميل القواعد
    if (typeof renderCart === "function") {
      renderCart();
    } else {
      console.warn("⚠️ renderCart غير مفعّلة بعد.");
    }
  })
  .catch(err => {
    console.error("❌ فشل تحميل قواعد الخصم:", err);
  });
