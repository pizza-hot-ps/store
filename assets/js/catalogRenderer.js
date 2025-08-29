function renderCatalog() {
  const container = document.getElementById("catalog");
  container.innerHTML = ""; // تفريغ المحتوى السابق

  const sections = {
    pizza: "🍕 بيتزا",
    sides: "🍟 جانبي",
    drinks: "🥤 مشروبات"
  };

  Object.entries(sections).forEach(([key, label]) => {
    const items = window.catalog[key];
    if (!items || !items.length) return;

    const section = document.createElement("div");
    section.className = "catalog-section";
    section.innerHTML = `<h2>${label}</h2>`;

    items.forEach(({ name, price, image }) => {
      const card = document.createElement("div");
      card.className = "catalog-card";
      card.innerHTML = `
        <img src="${image}" alt="${name}" />
        <h3>${name}</h3>
        <p>${price}₪</p>
        <button onclick="CartCore.add('${name}', ${price}, 1)">أضف إلى السلة</button>
      `;
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}
