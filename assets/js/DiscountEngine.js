// 🔐 DiscountEngine – PIZZA HOT
// 📦 القواعد تُحمّل حصريًا من rules.json عبر loadRulesFrom()
// ❌ لا تُضاف قواعد يدويًا خارج هذا المصدر

const DiscountEngine = (() => {
  let rules = [];

  function loadRulesFrom(rulesArray) {
    rules = rulesArray.filter(rule => rule.active);
  }

  function isTomorrow(orderDate) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return new Date(orderDate).toDateString() === tomorrow.toDateString();
  }

  function apply(total, cart, user, coupon1 = "", coupon2 = "", channel = "", orderDate = "", bookedVia = "", desiredHour = null) {
    let finalTotal = total;
    let applied = [];
    let breakdown = [];

    const sorted = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    let primaryApplied = false;
    let secondaryApplied = false;

    if (coupon1 && coupon2 && coupon1.toLowerCase() === coupon2.toLowerCase()) {
      breakdown.push("❌ لا يمكن استخدام نفس الكود في الحقلين");
      coupon2 = "";
    }

    sorted.forEach(rule => {
      try {
        const conditionFn = new Function("cart", "total", "user", "coupon1", "coupon2", "channel", "orderDate", "bookedVia", "desiredHour", `
          return ${rule.condition};
        `);

        const ok = conditionFn(cart, finalTotal, user, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour);
        if (!ok) return;

        const applyFn = rule.applyFn
          ? new Function("total", "cart", "user", "coupon1", "coupon2", "channel", "orderDate", "bookedVia", "desiredHour", `
              return ${rule.applyFn};
            `)
          : rule.type === "percentage"
            ? (t => t * rule.value)
            : (_ => rule.value);

        const value = applyFn(finalTotal, cart, user, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour);
        const rounded = Math.round(value);

        const isCouponRule = !!rule.code;
        const codeLower = rule.code?.toLowerCase() || "";
        const coupon1Lower = coupon1.toLowerCase();
        const coupon2Lower = coupon2.toLowerCase();

        const isPrimary = isCouponRule && codeLower === coupon1Lower;
        const isSecondary = isCouponRule && codeLower === coupon2Lower && codeLower !== coupon1Lower;

        if (isPrimary && !primaryApplied) {
          finalTotal -= value;
          applied.push(`${rule.name} (كامل القيمة)`);
          breakdown.push(`• ${rule.name} [${rule.source}]: -${rounded}₪`);
          primaryApplied = true;
          return;
        }

        if (isSecondary && !secondaryApplied) {
          const partial = value * 0.25;
          finalTotal -= partial;
          applied.push(`${rule.name} (ربع القيمة)`);
          breakdown.push(`• ${rule.name} [${rule.source}]: -${Math.round(partial)}₪`);
          secondaryApplied = true;
          return;
        }

        if (!isCouponRule && !primaryApplied) {
          finalTotal -= value;
          applied.push(rule.name);
          breakdown.push(`• ${rule.name} [${rule.source}]: -${rounded}₪`);
          primaryApplied = true;
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
