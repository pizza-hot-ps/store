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
      const line = `${item} ×${qty} = ${price * qty}₪` + (note ? ` [${note}]` : "");
      sections[classify(item)].push(line);
    });

    let msg = `طلب جديد من ${userName || "ضيف"}\n`;
    if (userAddr) msg += `العنوان: ${userAddr}\n`;
    msg += `\nالطلب:\n`;

    if (sections.pizza.length) msg += `\nبيتزا:\n` + sections.pizza.join("\n");
    if (sections.sides.length) msg += `\n\nجانبي:\n` + sections.sides.join("\n");
    if (sections.drinks.length) msg += `\n\nمشروبات:\n` + sections.drinks.join("\n");
    if (sections.other.length) msg += `\n\nأخرى:\n` + sections.other.join("\n");

    msg += `\n\nالإجمالي قبل الخصم: ${rawTotal}₪`;
    msg += `\nالإجمالي بعد الخصم: ${finalTotal}₪`;

    if (discounts?.length) msg += `\nالخصومات المفعّلة: ${discounts.join(", ")}`;
    if (breakdown?.length) msg += `\nتفاصيل الخصومات:\n` + breakdown.join("\n");

    return msg;
  }

  return { build };
})();
