const MessageBuilder = (() => {
  function classify(name) {
    const n = name.toLowerCase();
    if (n.includes("بيتزا") || n.includes("كلزوني")) return "pizza";
    if (n.includes("بطاطا") || n.includes("زنجر")) return "sides";
    if (n.includes("كولا") || n.includes("عصير") || n.includes("مياه")) return "drinks";
    return "other";
  }

  function merge(cart) {
    const result = {};
    cart.forEach(({ item, price, qty, note }) => {
      const key = item + (note ? `|${note}` : "");
      if (!result[key]) result[key] = { item, price, qty: 0, note };
      result[key].qty += qty;
    });
    return Object.values(result);
  }

  function build(cart, userName, userAddr, finalTotal, discounts, breakdown, rawTotal) {
    const sections = { pizza: [], sides: [], drinks: [], other: [] };
    const merged = merge(cart);

    merged.forEach(({ item, price, qty, note }) => {
      const line = `• ${item} ×${qty} = ${price * qty}₪` + (note ? ` [ملاحظة: ${note}]` : "");
      sections[classify(item)].push(line);
    });

    let msg = `🍕 PIZZA HOT – طلب جديد\n------------------\n`;
    msg += `👤 الاسم: ${userName || "ضيف"}\n`;
    if (userAddr) msg += `📍 العنوان: ${userAddr}\n`;
    msg += `\n📦 محتوى الطلب:\n`;

    if (sections.pizza.length) msg += `\n🍕 بيتزا:\n` + sections.pizza.join("\n");
    if (sections.sides.length) msg += `\n\n🍟 جانبي:\n` + sections.sides.join("\n");
    if (sections.drinks.length) msg += `\n\n🥤 مشروبات:\n` + sections.drinks.join("\n");
    if (sections.other.length) msg += `\n\n📦 أخرى:\n` + sections.other.join("\n");

    msg += `\n\n------------------\n📦 قبل الخصم: ${rawTotal}₪`;
    msg += `\n📦 بعد الخصم: ${finalTotal}₪`;

    if (discounts?.length) msg += `\n💸 خصومات مفعّلة: ${discounts.join(", ")}`;
    if (breakdown?.length) msg += `\n📊 تفاصيل الخصومات:\n` + breakdown.join("\n");

    msg += `\n\n🙏 شكرًا لاختياركم PIZZA HOT`;

    return msg;
  }

  return { build };
})();
