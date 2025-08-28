// 🔐 DiscountEngine – PIZZA HOT (رمزيًا)
// 📦 القواعد تُحمّل حصريًا من rules.json عبر loadRulesFrom()
// ❌ لا تُضاف قواعد يدويًا خارج هذا المصدر

const DiscountEngine = (() => {
  let rules = [];

  // 🧩 تحميل القواعد النشطة فقط
  function loadRulesFrom(rulesArray) {
    rules = rulesArray.filter(rule => rule.active);
  }

  // 🧠 تطبيق الخصومات على السلة
  function apply(total, cart, user, coupon1 = "", coupon2 = "", channel = "", orderDate = "", bookedVia = "", desiredHour = null) {
    let finalTotal = total;
    let applied = [];
    let breakdown = [];

    const sorted = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    let primaryApplied = false;
    let secondaryApplied = false;

    // ❌ منع تكرار الكود الترويجي
    if (coupon1 && coupon2 && coupon1.toLowerCase() === coupon2.toLowerCase()) {
      breakdown.push("❌ لا يمكن استخدام نفس الكود في الحقلين");
      coupon2 = "";
    }

    // 🔄 تطبيق كل قاعدة حسب الشرط
    sorted.forEach(rule => {
      try {
        // 🛡️ حماية من شروط غير آمنة أو طويلة
        if (typeof rule.condition !== "string" || rule.condition.length > 200) return;

        const conditionFn = new Function("cart", "total", "user", "coupon1", "coupon2", "channel", "orderDate", "bookedVia", "desiredHour", `
          return ${rule.condition};
        `);

        const ok = conditionFn(cart, finalTotal, user, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour);
        if (!ok) return;

        // 🧮 تحديد طريقة تطبيق الخصم
        const applyFn = rule.applyFn
          ? new Function("total", "cart", "user", "coupon1", "coupon2", "channel", "orderDate", "bookedVia", "desiredHour", `
              return ${rule.applyFn};
            `)
          : rule.type === "percentage"
            ? (t => t * rule.value)
            : (_ => rule.value);

        const value = applyFn(finalTotal, cart, user, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour);
        const rounded = Math.round(value);

        // 🎟️ تحديد نوع القاعدة
        const isCouponRule = !!rule.code;
        const codeLower = rule.code?.toLowerCase() || "";
        const coupon1Lower = coupon1.toLowerCase();
        const coupon2Lower = coupon2.toLowerCase();

        const isPrimary = isCouponRule && codeLower === coupon1Lower;
        const isSecondary = isCouponRule && codeLower === coupon2Lower && codeLower !== coupon1Lower;

        // ✅ تطبيق الكود الأساسي
        if (isPrimary && !primaryApplied) {
          finalTotal -= value;
          applied.push(`${rule.name} (كامل القيمة)`);
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${rounded}₪`);
          primaryApplied = true;
          return;
        }

        // ✅ تطبيق الكود الثانوي بربع القيمة
        if (isSecondary && !secondaryApplied) {
          const partial = value * 0.25;
          finalTotal -= partial;
          applied.push(`${rule.name} (ربع القيمة)`);
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${Math.round(partial)}₪`);
          secondaryApplied = true;
          return;
        }

        // ✅ تطبيق القواعد التلقائية دون منع التكرار
        if (!isCouponRule) {
          finalTotal -= value;
          applied.push(rule.name);
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${rounded}₪`);
        }

      } catch (err) {
        console.warn(`⚠️ فشل تطبيق القاعدة: ${rule.name}`, err);
      }
    });

    return {
      total: Math.max(0, Math.round(finalTotal)),
      applied,
      breakdown
    };
  }

  return {
    loadRulesFrom,
    apply
  };
})();
