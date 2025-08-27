// cart.js – وحدة إدارة السلة المركزية
const CartCore = (() => {
  let key = '', user = 'guest', carts = {}, cur = '1';

  // 🧠 تهيئة السلة حسب اسم المستخدم
  function init(name) {
    user = name || 'guest';
    key = 'orders_' + user;
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    carts = data.carts || { '1': [] };
    cur = data.cur || '1';
  }

  // 💾 حفظ السلة في localStorage
  function save() {
    localStorage.setItem(key, JSON.stringify({ carts, cur }));
  }

  // 📦 الحصول على السلة الحالية
  function getCurrentCart() {
    return carts[cur] || [];
  }

  // ➕ إضافة عنصر إلى السلة
  function add(item, price, qty, note = "") {
    carts[cur] = carts[cur] || [];
    carts[cur].push({ item, price, qty, note });
    save();
  }

  // 🗑️ حذف عنصر حسب الفهرس
  function remove(index) {
    if (carts[cur]) {
      carts[cur].splice(index, 1);
      save();
    }
  }

  // 🧹 تفريغ السلة
  function clear() {
    carts[cur] = [];
    save();
  }

  // 💰 حساب الإجمالي
  function total() {
    return getCurrentCart().reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  // 🔀 تغيير السلة النشطة (اختياري)
  function switchCart(id) {
    if (!carts[id]) carts[id] = [];
    cur = id;
    save();
  }

  return {
    init,
    save,
    add,
    remove,
    clear,
    total,
    getCurrentCart,
    switchCart
  };
})();
