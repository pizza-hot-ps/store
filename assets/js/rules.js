// 🧠 تحميل قواعد الخصم من GitHub مباشرة
fetch("https://raw.githubusercontent.com/pizza-hot-ps/store/main/assets/data/rules.json")
  .then(res => res.json())
  .then(data => {
    // 🧠 تمرير القواعد إلى محرك الخصم
    DiscountEngine.loadRulesFrom(data);

    // 🎁 تسجيل الأكواد الترويجية المتاحة
    const availableCodes = data.filter(r => r.code).map(r => r.code);
    localStorage.setItem("availableCoupons", JSON.stringify(availableCodes));

    // ✅ تفعيل عرض السلة بعد تحميل القواعد
    if (typeof renderCart === "function") {
      renderCart();
    } else {
      console.warn("⚠️ renderCart غير مفعّلة بعد.");
    }

    console.log(`✅ تم تحميل ${data.length} قاعدة خصم من GitHub`);
  })
  .catch(err => {
    console.error("❌ فشل تحميل قواعد الخصم:", err);
  });
