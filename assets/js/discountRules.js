// 📦 discountRules.js – تحميل القواعد الرمزية من rules.json

fetch("assets/data/rules.json")
  .then(res => res.json())
  .then(data => {
    DiscountEngine.loadRulesFrom(data);
    console.log(`✅ تم تحميل ${data.length} قاعدة خصم بنجاح`);
  })
  .catch(err => {
    console.warn("⚠️ فشل تحميل قواعد الخصم", err);
  });
