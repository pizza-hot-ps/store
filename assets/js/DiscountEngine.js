// 🔐 DiscountEngine – PIZZA HOT (رمزيًا)
// 📦 القواعد تُحمّل حصريًا من rules.json عبر loadRulesFrom()
// ❌ لا تُضاف قواعد يدويًا خارج هذا المصدر

const DiscountEngine = (() => {
  let rules = [];

  // 🧩 دوال الشروط الثابتة
  const Conditions = {
    isChickenPizza: (cart) => cart.some(item => item.label.includes("دجاج")),
    isFamilyOrder: (cart) => cart.length >= 4,
    hasWings: (cart) => cart.some(item => item.label.includes("أجنحة")),
    alwaysTrue: () => true
  };

  // 🧮 دوال الحساب الثابتة
  const ApplyFns = {
    applyPercentage: (total, rule) => total * rule.value,
    applyFixed: (total, rule) => rule.value
  };

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
    for (const rule of sorted) {
      try {
        const conditionFn = Conditions[rule.condition];
        if (!conditionFn || typeof conditionFn !== "function") continue;

        const ok = conditionFn(cart, finalTotal, user, coupon1, coupon2, channel, orderDate, bookedVia, desiredHour);
        if (!ok) continue;

        const applyFn = ApplyFns[rule.applyFn] ||
          (rule.type === "percentage"
            ? ((t) => t * rule.value)
            : ((_) => rule.value));

        const value = applyFn(finalTotal, rule);
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
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${rounded}₪`);
          primaryApplied = true;
          continue;
        }

        if (isSecondary && !secondaryApplied) {
          const partial = value * 0.25;
          finalTotal -= partial;
          applied.push(`${rule.name} (ربع القيمة)`);
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${Math.round(partial)}₪`);
          secondaryApplied = true;
          continue;
        }

        if (!isCouponRule) {
          finalTotal -= value;
          applied.push(rule.name);
          breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${rounded}₪`);
        }

      } catch (err) {
        console.warn(`⚠️ فشل تطبيق القاعدة: ${rule.name}`, err);
      }
    }

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
