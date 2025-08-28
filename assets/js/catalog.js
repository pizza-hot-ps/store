// 📦 تحميل الكتالوج من GitHub
fetch("https://raw.githubusercontent.com/pizza-hot-ps/store/main/assets/data/catalog.json")
  .then(res => res.json())
  .then(data => {
    const baseImageURL = "https://raw.githubusercontent.com/pizza-hot-ps/store/main/assets/images/";

    // 🖼️ تحويل الصور إلى روابط مباشرة
    function fixImages(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (item.image) item.image = baseImageURL + item.image;
        });
      } else if (typeof obj === "object") {
        Object.values(obj).forEach(value => fixImages(value));
      }
    }

    fixImages(data.foods);
    fixImages(data.drinks);

    // 🧠 إعادة بناء الكتالوج بطريقة متوافقة مع store.js
    window.catalog = {
      pizza: data.foods.pizza,
      sides: data.foods.sides,
      drinks: [
        ...(data.drinks.carbonated || []),
        ...(data.drinks.juices || []),
        ...(data.drinks.naturalJuices?.items || []),
        ...(data.drinks.cocktails?.gas || []),
        ...(data.drinks.cocktails?.juice || []),
        ...(data.drinks.other || [])
      ],
      cocktails: data.drinks.cocktails || {},
      naturalJuices: data.drinks.naturalJuices || {}
    };

    // ✅ تفعيل العرض الرمزي
    if (typeof renderCatalog === "function") {
      renderCatalog();
    } else {
      console.warn("⚠️ renderCatalog غير مفعّلة بعد.");
    }
  })
  .catch(err => {
    console.error("❌ فشل تحميل الكتالوج:", err);
  });
