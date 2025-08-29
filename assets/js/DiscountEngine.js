const DiscountEngine = {
  rules: [],

  loadRulesFrom(data) {
    this.rules = Array.isArray(data) ? data.filter(r => r.active) : [];
  },

  apply(total, cart, userName, coupon1, coupon2, orderDate = null, channel = null) {
    let applied = [];
    let breakdown = [];

    this.rules
      .sort((a, b) => b.priority - a.priority)
      .forEach(rule => {
        const conditionFn = Conditions[rule.condition];
        const applyFn = ApplyFns[rule.applyFn];

        if (typeof conditionFn === "function" && typeof applyFn === "function") {
          const isValid = conditionFn(cart, userName, total, orderDate, channel, coupon1, coupon2);
          if (isValid) {
            const discount = applyFn(total, rule);
            applied.push(rule.name);
            breakdown.push(`🔻 ${rule.name} (${rule.source}): خصم ${discount.toFixed(2)}₪`);
            total -= discount;
          }
        }
      });

    return {
      total: Math.max(total, 0),
      applied,
      breakdown
    };
  }
};

// ✅ دوال الشروط الثابتة
const Conditions = {
  isTomorrow: (_, __, ___, orderDate) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return orderDate && new Date(orderDate).toDateString() === tomorrow.toDateString();
  },
  isInstore: (_, __, ___, ____, channel) => channel === "instore",
  hasPrimaryChickenXL: (_, __, ___, ____, _____, coupon1) => coupon1 === "CHICKENXL",
  hasSecondaryChickenXL: (_, __, ___, ____, _____, ____, coupon2) => coupon2 === "CHICKENXL",
  hasPrimaryFamilySet: (_, __, ___, ____, _____, coupon1) => coupon1 === "FAMILYSET",
  hasSecondaryFamilySet: (_, __, ___, ____, _____, ____, coupon2) => coupon2 === "FAMILYSET",
  hasPrimaryWingsDeal: (_, __, ___, ____, _____, coupon1) => coupon1 === "WINGSDEAL",
  hasSecondaryWingsDeal: (_, __, ___, ____, _____, ____, coupon2) => coupon2 === "WINGSDEAL"
};

// ✅ دوال تطبيق الخصم
const ApplyFns = {
  applyFixed: (total, rule) => rule.value,
  applyPercentage: (total, rule) => total * rule.value
};
