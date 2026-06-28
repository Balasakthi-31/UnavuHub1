/* ============================================================
   UnavuHub — Data Layer (db.js)
   All LocalStorage operations, sample seed data, session utils
   ============================================================ */

const DB = {
  KEYS: {
    USERS:    'unavuhub_users',
    MENU:     'unavuhub_menu',
    ORDERS:   'unavuhub_orders',
    SESSION:  'unavuhub_session',
    CART:     'unavuhub_cart',
    RATINGS:  'unavuhub_ratings',
  },

  /* ── Helpers ── */
  get(key)       { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  getObj(key)    { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } },
  set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); },
  genId()        { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },

  /* ── Session ── */
  getSession()   { return this.getObj(this.KEYS.SESSION); },
  setSession(u)  { this.set(this.KEYS.SESSION, u); },
  clearSession() { localStorage.removeItem(this.KEYS.SESSION); },
  isLoggedIn()   { return !!this.getSession(); },
  isAdmin()      { const s = this.getSession(); return s && s.role === 'admin'; },
  isCustomer()   { const s = this.getSession(); return s && s.role === 'customer'; },

  /* ── Users ── */
  getUsers()     { return this.get(this.KEYS.USERS); },
  saveUsers(u)   { this.set(this.KEYS.USERS, u); },
  getUserById(id){ return this.getUsers().find(u => u.id === id) || null; },
  findUserByEmail(email) { return this.getUsers().find(u => u.email === email.toLowerCase()) || null; },

  registerUser(data) {
    const users = this.getUsers();
    if (this.findUserByEmail(data.email)) return { ok: false, msg: 'Email already registered.' };
    const user = {
      id:        this.genId(),
      name:      data.name.trim(),
      email:     data.email.toLowerCase().trim(),
      phone:     data.phone.trim(),
      address:   data.address.trim(),
      password:  data.password,
      role:      'customer',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this.saveUsers(users);
    return { ok: true, user };
  },

  loginUser(email, password) {
    if (email === 'admin@unavuhub.com' && password === 'admin123') {
      const adminUser = { id: 'admin', name: 'Admin', email, role: 'admin' };
      this.setSession(adminUser);
      return { ok: true, user: adminUser };
    }
    const user = this.findUserByEmail(email);
    if (!user) return { ok: false, msg: 'No account found with this email.' };
    if (user.password !== password) return { ok: false, msg: 'Incorrect password.' };
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    this.setSession(sessionUser);
    return { ok: true, user: sessionUser };
  },

  /* ── Menu ── */
  getMenu()       { return this.get(this.KEYS.MENU); },
  saveMenu(items) { this.set(this.KEYS.MENU, items); },
  getMenuItem(id) { return this.getMenu().find(i => i.id === id) || null; },

  addMenuItem(data) {
    const menu = this.getMenu();
    const item = { ...data, id: this.genId(), popular: data.popular || false };
    menu.push(item);
    this.saveMenu(menu);
    return item;
  },

  updateMenuItem(id, data) {
    const menu = this.getMenu().map(i => i.id === id ? { ...i, ...data } : i);
    this.saveMenu(menu);
  },

  deleteMenuItem(id) {
    this.saveMenu(this.getMenu().filter(i => i.id !== id));
  },

  /* ── Cart ── */
  getCart()      { return this.get(this.KEYS.CART); },
  saveCart(c)    { this.set(this.KEYS.CART, c); },
  clearCart()    { this.set(this.KEYS.CART, []); },

  cartCount() {
    return this.getCart().reduce((sum, i) => sum + i.qty, 0);
  },

  addToCart(menuItem) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === menuItem.id);
    if (existing) { existing.qty += 1; }
    else { cart.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1, image: menuItem.image || '' }); }
    this.saveCart(cart);
  },

  updateCartQty(id, qty) {
    if (qty <= 0) { this.removeFromCart(id); return; }
    const cart = this.getCart().map(i => i.id === id ? { ...i, qty } : i);
    this.saveCart(cart);
  },

  removeFromCart(id) {
    this.saveCart(this.getCart().filter(i => i.id !== id));
  },

  cartTotal() {
    return this.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  /* ── Orders ── */
  getOrders()      { return this.get(this.KEYS.ORDERS); },
  saveOrders(o)    { this.set(this.KEYS.ORDERS, o); },
  getOrderById(id) { return this.getOrders().find(o => o.id === id) || null; },

  getUserOrders(userId) {
    return this.getOrders().filter(o => o.userId === userId).sort((a,b) => new Date(b.date) - new Date(a.date));
  },

  placeOrder(paymentMethod) {
    const session = this.getSession();
    if (!session) return null;
    const cart    = this.getCart();
    if (!cart.length) return null;
    const user    = this.getUserById(session.id) || session;
    const order   = {
      id:            '#' + String(Date.now()).slice(-6),
      userId:        session.id,
      customerName:  user.name || session.name,
      phone:         user.phone || '—',
      items:         cart.map(i => ({ ...i })),
      total:         this.cartTotal(),
      paymentMethod,
      status:        'pending',
      date:          new Date().toISOString(),
    };
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);
    this.clearCart();
    return order;
  },

  cancelOrder(id) {
    const orders = this.getOrders().map(o => o.id === id ? { ...o, status: 'cancelled' } : o);
    this.saveOrders(orders);
  },

  updateOrderStatus(id, status) {
    const orders = this.getOrders().map(o => o.id === id ? { ...o, status } : o);
    this.saveOrders(orders);
  },

  deleteOrder(id) {
    this.saveOrders(this.getOrders().filter(o => o.id !== id));
  },

  /* ── Ratings ── */
  getRatings()     { return this.get(this.KEYS.RATINGS); },
  saveRatings(r)   { this.set(this.KEYS.RATINGS, r); },

  addRating(menuItemId, rating, review) {
    const session = this.getSession();
    if (!session || session.role !== 'customer') return { ok: false, msg: 'Login required.' };
    const ratings = this.getRatings();
    const existing = ratings.findIndex(r => r.menuItemId === menuItemId && r.userId === session.id);
    const entry = {
      id:         this.genId(),
      menuItemId,
      userId:     session.id,
      userName:   session.name,
      rating,
      review:     review || '',
      date:       new Date().toISOString(),
    };
    if (existing >= 0) { ratings[existing] = { ...ratings[existing], ...entry }; }
    else { ratings.push(entry); }
    this.saveRatings(ratings);
    return { ok: true };
  },

  getItemRatings(menuItemId) {
    return this.getRatings().filter(r => r.menuItemId === menuItemId);
  },

  getItemAvgRating(menuItemId) {
    const ratings = this.getItemRatings(menuItemId);
    if (!ratings.length) return { avg: 0, count: 0 };
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  },

  getUserRatingForItem(menuItemId) {
    const session = this.getSession();
    if (!session) return null;
    return this.getRatings().find(r => r.menuItemId === menuItemId && r.userId === session.id) || null;
  },

  /* ── Dashboard Stats ── */
  getStats() {
    const orders  = this.getOrders();
    const users   = this.getUsers();
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    return { totalOrders: orders.length, revenue, customers: users.length, pending };
  },

  /* ── Seed Data ── */
  seed() {
    if (this.getMenu().length) return;

    const menuItems = [
      // ─── BREAKFAST ───
      { name: 'Dosa', category: 'Breakfast', price: 40, type: 'veg', description: 'Classic crispy South Indian crepe made from fermented rice and lentil batter.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Podi Dosa', category: 'Breakfast', price: 50, type: 'veg', description: 'Crispy dosa brushed with spicy gun powder (podi) and sesame oil.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Onion Dosa', category: 'Breakfast', price: 55, type: 'veg', description: 'Golden dosa topped with finely chopped onions and green chillies.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Roast Dosa', category: 'Breakfast', price: 60, type: 'veg', description: 'Extra thin, extra crispy roasted dosa served with chutneys.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Ghee Roast Dosa', category: 'Breakfast', price: 80, type: 'veg', description: 'Crispy roast dosa generously drizzled with pure desi ghee.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: true },
{ name: 'Masala Roast Dosa', category: 'Breakfast', price: 85, type: 'veg', description: 'Roast dosa stuffed with spiced potato masala filling.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Butter Dosa', category: 'Breakfast', price: 65, type: 'veg', description: 'Soft dosa slathered with fresh white butter.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Butter Roast', category: 'Breakfast', price: 75, type: 'veg', description: 'Crispy roast dosa with a generous spread of butter.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Special Onion Roast', category: 'Breakfast', price: 110, type: 'veg', description: 'Chef\'s special roast with extra onions, butter, and secret masala.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Double Egg Dosa', category: 'Breakfast', price: 90, type: 'non-veg', description: 'Soft dosa made with two eggs mixed into the batter for extra richness.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Egg Dosa', category: 'Breakfast', price: 70, type: 'non-veg', description: 'Classic dosa with a freshly cracked egg spread and cooked on top.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: true },
{ name: 'Uttapam', category: 'Breakfast', price: 55, type: 'veg', description: 'Thick, soft South Indian pancake made from fermented batter.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Onion Uttapam', category: 'Breakfast', price: 65, type: 'veg', description: 'Fluffy uttapam topped with diced onions and coriander.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Podi Uttapam', category: 'Breakfast', price: 70, type: 'veg', description: 'Uttapam sprinkled with spicy podi blend and sesame seeds.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Idli', category: 'Breakfast', price: 35, type: 'veg', description: 'Soft, steamed rice cakes served with sambar and coconut chutney.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: true },
{ name: 'Pongal', category: 'Breakfast', price: 50, type: 'veg', description: 'Creamy rice and moong dal porridge seasoned with pepper, cumin and cashews.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: false },
{ name: 'Appam', category: 'Breakfast', price: 45, type: 'veg', description: 'Lacy, bowl-shaped rice pancake with crispy edges and soft centre.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
{ name: 'Poori', category: 'Breakfast', price: 50, type: 'veg', description: 'Deep-fried puffed wheat bread served with potato masala.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80', popular: false },
{ name: 'Medu Vada', category: 'Breakfast', price: 40, type: 'veg', description: 'Crispy fried doughnut-shaped lentil fritters, served with chutney.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: false },
{ name: 'Sambar Vada', category: 'Breakfast', price: 50, type: 'veg', description: 'Crispy vada soaked in hot, tangy sambar.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: false },
{ name: 'Curd Vada', category: 'Breakfast', price: 50, type: 'veg', description: 'Soft vada dunked in chilled, seasoned yoghurt.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: false },
{ name: 'Wheat Upma With Curd', category: 'Breakfast', price: 45, type: 'veg', description: 'Wholesome broken wheat upma served with cool curd.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', popular: false },
      // ─── BIRYANI ───
      { name: 'Chicken Biryani',              category: 'Biryani', price: 280, type: 'non-veg', description: 'Fragrant basmati rice layered with spiced chicken, saffron and caramelized onions.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: true  },
      { name: 'Mutton Biryani',               category: 'Biryani', price: 350, type: 'non-veg', description: 'Slow-cooked tender mutton pieces layered with spiced rice and whole spices.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: true  },
      { name: 'Egg Biryani',                  category: 'Biryani', price: 200, type: 'non-veg', description: 'Fragrant biryani rice with boiled eggs cooked in spiced masala.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Fish Biryani',                 category: 'Biryani', price: 320, type: 'non-veg', description: 'Flaky fish marinated in coastal spices, layered with fragrant basmati.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Prawn Biryani',                category: 'Biryani', price: 360, type: 'non-veg', description: 'Juicy prawns cooked in a spiced masala, layered with aromatic rice.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Chicken 65 Biryani',           category: 'Biryani', price: 320, type: 'non-veg', description: 'Biryani topped with crispy Chicken 65 — the best of both worlds.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: true  },
      { name: 'Kuska',                        category: 'Biryani', price: 160, type: 'veg',     description: 'Plain biryani rice without meat — light, fragrant and perfect with curries.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Veg Biryani',                  category: 'Biryani', price: 200, type: 'veg',     description: 'Fragrant basmati with fresh garden vegetables and whole spices.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Mushroom Biryani',             category: 'Biryani', price: 220, type: 'veg',     description: 'Earthy mushrooms slow-cooked into an aromatic spiced biryani.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Paneer Biryani',               category: 'Biryani', price: 240, type: 'veg',     description: 'Soft paneer cubes marinated and layered with fragrant biryani rice.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Ghee Rice',                    category: 'Biryani', price: 150, type: 'veg',     description: 'Basmati rice cooked in ghee with cashews, raisins and whole spices.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Jeera Rice',                   category: 'Biryani', price: 130, type: 'veg',     description: 'Steamed basmati seasoned with cumin seeds and a touch of ghee.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Chicken Tikka Biryani',        category: 'Biryani', price: 330, type: 'non-veg', description: 'Biryani with smoky tandoor-charred chicken tikka pieces.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Pepper Chicken Biryani',       category: 'Biryani', price: 300, type: 'non-veg', description: 'Bold pepper-forward biryani with freshly cracked black peppercorns.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Crab Biryani',                 category: 'Biryani', price: 420, type: 'non-veg', description: 'Fresh crab cooked in tangy spiced masala, layered with fragrant rice.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Special Family Pack Biryani',  category: 'Biryani', price: 950, type: 'non-veg', description: 'Large family portion of house-special biryani — feeds 4 to 5.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },
      { name: 'Bucket Chicken Biryani',       category: 'Biryani', price: 1200,type: 'non-veg', description: 'Massive bucket biryani — perfect for parties and celebrations!', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', popular: false },

      // ─── STARTERS ───
      { name: 'Chilli Chicken',       category: 'Starters', price: 260, type: 'non-veg', description: 'Indo-Chinese classic — crispy chicken tossed in tangy chilli-garlic sauce.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: true  },
      { name: 'Chicken Fry',          category: 'Starters', price: 240, type: 'non-veg', description: 'Juicy chicken pieces marinated in spices and deep fried to crispy perfection.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: true  },
      { name: 'Chicken Leg Piece',    category: 'Starters', price: 120, type: 'non-veg', description: 'Marinated and fried whole chicken leg piece — a crowd favourite.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Chicken Manchurian',   category: 'Starters', price: 270, type: 'non-veg', description: 'Crispy chicken balls in a sweet-spicy Manchurian sauce.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Green Chilli Chicken', category: 'Starters', price: 270, type: 'non-veg', description: 'Fiery chicken starter made with fresh green chillies and garlic.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Lemon Chicken',        category: 'Starters', price: 260, type: 'non-veg', description: 'Tender chicken in a bright, zesty lemon and herb marinade.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Egg Poriyal',          category: 'Starters', price: 90,  type: 'non-veg', description: 'Scrambled eggs tossed with onions, tomatoes and South Indian spices.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },
      { name: 'Bread Omelette',       category: 'Starters', price: 60,  type: 'non-veg', description: 'Fluffy omelette sandwiched between toasted bread slices.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },
      { name: 'Omelette',             category: 'Starters', price: 45,  type: 'non-veg', description: 'Classic two-egg omelette seasoned with onion, tomato and green chilli.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },
      { name: 'Plain Omelette',       category: 'Starters', price: 35,  type: 'non-veg', description: 'Simple, light egg omelette with just salt and pepper.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },
      { name: 'Full Boiled Egg',      category: 'Starters', price: 20,  type: 'non-veg', description: 'Hard-boiled egg with a sprinkle of salt and pepper.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },
      { name: 'Egg Lappa',            category: 'Starters', price: 70,  type: 'non-veg', description: 'Street-style egg lappa — a unique South Indian snack with eggs and spices.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', popular: false },

      // ─── MAIN COURSE ───
      { name: 'Chicken Gravy',          category: 'Main Course', price: 220, type: 'non-veg', description: 'Tender chicken in a rich, aromatic South Indian gravy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: true  },
      { name: 'Egg Gravy',              category: 'Main Course', price: 130, type: 'non-veg', description: 'Boiled eggs simmered in a tangy onion-tomato gravy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      //{ name: 'Quail Gravy',            category: 'Main Course', price: 280, type: 'non-veg', description: 'Tender quail cooked in a peppery, aromatic South Indian gravy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Mutton Gravy',           category: 'Main Course', price: 300, type: 'non-veg', description: 'Slow-cooked mutton in a deep, spiced curry — best with parotta.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Mutton Chettinad Gravy', category: 'Main Course', price: 340, type: 'non-veg', description: 'Robustly spiced Chettinad mutton curry with kalpasi and marathi mokku.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Mutton Sukka',           category: 'Main Course', price: 340, type: 'non-veg', description: 'Dry-fried mutton with freshly ground masala — a South Indian classic.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: true  },
      { name: 'Mutton Pepper Masala',   category: 'Main Course', price: 340, type: 'non-veg', description: 'Mutton tossed in a bold black pepper and whole spice masala.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Mutton Kudal Gravy',     category: 'Main Course', price: 260, type: 'non-veg', description: 'Mutton intestine cooked in a spiced South Indian gravy — a local delicacy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Mutton Kudal Fry',       category: 'Main Course', price: 260, type: 'non-veg', description: 'Stir-fried mutton intestine with aromatic spices and curry leaves.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Chicken Egg Fry',        category: 'Main Course', price: 200, type: 'non-veg', description: 'Crispy fried chicken and egg combo — hearty and satisfying.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Butter Chicken',         category: 'Main Course', price: 280, type: 'non-veg', description: 'Tender chicken in a creamy, mildly spiced tomato-butter sauce.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Kadai Chicken',          category: 'Main Course', price: 260, type: 'non-veg', description: 'Chicken and capsicum cooked in a spiced kadai masala.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Pepper Chicken Gravy',   category: 'Main Course', price: 240, type: 'non-veg', description: 'Chicken in a robust freshly-cracked pepper and onion gravy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Nattu Kozhi Kulambu',    category: 'Main Course', price: 300, type: 'non-veg', description: 'Country chicken in an intensely spiced traditional curry.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },
      { name: 'Fish Curry',             category: 'Main Course', price: 280, type: 'non-veg', description: 'Fresh fish cooked in a tangy, tamarind-based South Indian curry.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', popular: false },

      // ─── BREADS ───
      { name: 'Chapati',        category: 'Breads', price: 15,  type: 'veg', description: 'Soft, whole-wheat flatbread cooked on a tawa.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Butter Chapati', category: 'Breads', price: 20,  type: 'veg', description: 'Warm chapati served with a generous spread of butter.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Ghee Chapati',   category: 'Breads', price: 22,  type: 'veg', description: 'Soft chapati drizzled with pure desi ghee.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Egg Chapati',    category: 'Breads', price: 35,  type: 'non-veg', description: 'Flaky egg-stuffed chapati — a popular street-food snack.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Parotta',        category: 'Breads', price: 20,  type: 'veg', description: 'Flaky, layered South Indian parotta made from maida.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: true  },
      { name: 'Oil Parotta',    category: 'Breads', price: 25,  type: 'veg', description: 'Crispy parotta cooked in oil for an extra flaky texture.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Chilli Parotta', category: 'Breads', price: 80,  type: 'veg', description: 'Shredded parotta tossed with chilli sauce and onions.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Veechu Parotta', category: 'Breads', price: 25,  type: 'veg', description: 'Thin, crispy parotta made by throwing (veechu) the dough.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Egg Veechu Parotta', category: 'Breads', price: 60, type: 'non-veg', description: 'Crispy veechu parotta cooked with egg.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Kothu Parotta',      category: 'Breads', price: 100, type: 'veg', description: 'Shredded parotta stir-fried with eggs, onions, and spices on a hot griddle.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: true  },
      { name: 'Chicken Kothu Parotta', category: 'Breads', price: 150, type: 'non-veg', description: 'Kothu parotta with tender shredded chicken pieces.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: true  },
      { name: 'Mutton Kothu Parotta', category: 'Breads', price: 180, type: 'non-veg', description: 'Kothu parotta elevated with succulent mutton pieces.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Coin Parotta',    category: 'Breads', price: 60,  type: 'veg', description: 'Bite-sized mini parottas — perfect as a snack or starter.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Bun Parotta',     category: 'Breads', price: 30,  type: 'veg', description: 'Fluffy bun-shaped parotta — a popular street snack.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Paneer Chapati Roll',   category: 'Breads', price: 90,  type: 'veg',     description: 'Soft chapati rolled with spiced paneer filling.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      { name: 'Chicken Chapati Roll',  category: 'Breads', price: 110, type: 'non-veg', description: 'Soft chapati rolled with spiced chicken filling and onions.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', popular: false },
      // ─── FRIED RICE & NOODLES ───
      { name: 'Veg Fried Rice',      category: 'Fried Rice & Noodles', price: 150, type: 'veg',     description: 'Wok-tossed basmati with fresh vegetables, soy sauce and sesame.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: false },
      { name: 'Veg Noodles',         category: 'Fried Rice & Noodles', price: 140, type: 'veg',     description: 'Stir-fried noodles with crunchy vegetables in a light soy-based sauce.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: false },
      { name: 'Egg Fried Rice',      category: 'Fried Rice & Noodles', price: 170, type: 'non-veg', description: 'Fluffy egg-tossed fried rice with vegetables and soy sauce.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: true  },
      { name: 'Egg Noodles',         category: 'Fried Rice & Noodles', price: 160, type: 'non-veg', description: 'Noodles stir-fried with eggs, vegetables and a savoury sauce.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: true  },
      { name: 'Chicken Fried Rice',  category: 'Fried Rice & Noodles', price: 200, type: 'non-veg', description: 'Wok-tossed rice with tender chicken strips, eggs and vegetables.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: true  },
      { name: 'Chicken Noodles',     category: 'Fried Rice & Noodles', price: 190, type: 'non-veg', description: 'Stir-fried noodles with spiced chicken pieces and crunchy vegetables.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: false },
      { name: 'Schezwan Fried Rice', category: 'Fried Rice & Noodles', price: 180, type: 'veg',     description: 'Fried rice tossed in fiery Schezwan sauce with mixed vegetables.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: false },
      { name: 'Mixed Noodles',       category: 'Fried Rice & Noodles', price: 210, type: 'non-veg', description: 'Mixed noodles with chicken, egg, and vegetables in a savoury sauce.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', popular: false },

      // ─── DINNER SPECIALS ───
      //{ name: 'Dragon Chicken',       category: 'Dinner Specials', price: 290, type: 'non-veg', description: 'Crispy chicken strips in a sweet, sticky dragon sauce with capsicum.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: true  },
      { name: 'Pepper Chicken',       category: 'Dinner Specials', price: 270, type: 'non-veg', description: 'Stir-fried chicken with coarsely ground black pepper and curry leaves.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Gobi Manchurian',      category: 'Dinner Specials', price: 200, type: 'veg',     description: 'Crispy cauliflower florets in a spicy, tangy Manchurian sauce.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Paneer Manchurian',    category: 'Dinner Specials', price: 220, type: 'veg',     description: 'Soft paneer cubes in a sweet-spicy Manchurian gravy.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Fish Fry',             category: 'Dinner Specials', price: 280, type: 'non-veg', description: 'Fresh fish marinated in South Indian spices and deep fried crispy.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      { name: 'Prawn Fry',            category: 'Dinner Specials', price: 320, type: 'non-veg', description: 'Crunchy fried prawns with a crispy spiced coating.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', popular: false },
      //{ name: 'Cheese Dosa',          category: 'Dinner Specials', price: 100, type: 'veg',     description: 'Crispy dosa filled with generous melted cheese — a crowd pleaser.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
      //{ name: 'Paneer Dosa',          category: 'Dinner Specials', price: 100, type: 'veg',     description: 'Dosa stuffed with a spiced paneer filling.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },
      //{ name: 'Masala Dosa',          category: 'Dinner Specials', price: 70,  type: 'veg',     description: 'Classic dosa stuffed with a spiced potato masala filling.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', popular: false },

      // ─── SOUPS ───
      { name: 'Veg Soup',        category: 'Soups', price: 90,  type: 'veg',     description: 'Light vegetable broth with seasonal vegetables and herbs.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },
      { name: 'Tomato Soup',     category: 'Soups', price: 90,  type: 'veg',     description: 'Thick, creamy tomato soup with basil and a swirl of cream.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },
      { name: 'Sweet Corn Soup', category: 'Soups', price: 100, type: 'veg',     description: 'Creamy corn soup with tender corn kernels and spring onions.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },
      { name: 'Chicken Soup',    category: 'Soups', price: 130, type: 'non-veg', description: 'Nourishing clear chicken broth with shredded chicken and vegetables.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },
      { name: 'Hot & Sour Soup', category: 'Soups', price: 110, type: 'veg',     description: 'Tangy and spicy Indo-Chinese soup with vegetables and corn starch.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },
      { name: 'Mushroom Soup',   category: 'Soups', price: 110, type: 'veg',     description: 'Earthy, creamy mushroom soup with a hint of garlic and herbs.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', popular: false },

      
      // ─── FRESH JUICES ───
      { name: 'Orange Juice',       category: 'Fresh Juices', price: 60, type: 'veg', description: 'Freshly squeezed orange juice, full of Vitamin C.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Apple Juice',        category: 'Fresh Juices', price: 70, type: 'veg', description: 'Fresh pressed apple juice — sweet and crisp.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Watermelon Juice',   category: 'Fresh Juices', price: 50, type: 'veg', description: 'Ice-cold blended watermelon juice — the perfect summer coolant.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Pineapple Juice',    category: 'Fresh Juices', price: 70, type: 'veg', description: 'Tangy, tropical pineapple juice served fresh.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      //{ name: 'Mosambi Juice',      category: 'Fresh Juices', price: 60, type: 'veg', description: 'Sweet lime juice — mild, refreshing and great for digestion.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Mango Juice',        category: 'Fresh Juices', price: 80, type: 'veg', description: 'Thick, pulpy fresh mango juice — taste of summer.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Pomegranate Juice',  category: 'Fresh Juices', price: 90, type: 'veg', description: 'Ruby red pomegranate juice, antioxidant-rich and tangy.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Grape Juice',        category: 'Fresh Juices', price: 70, type: 'veg', description: 'Fresh grape juice — sweet, deep and rich in flavour.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },

      // ─── MILKSHAKES ───
      { name: 'Chocolate Milkshake',  category: 'Milkshakes', price: 120, type: 'veg', description: 'Rich, creamy chocolate milkshake blended with ice cream.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Oreo Milkshake',       category: 'Milkshakes', price: 130, type: 'veg', description: 'Creamy milkshake blended with crushed Oreo cookies.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Vanilla Milkshake',    category: 'Milkshakes', price: 100, type: 'veg', description: 'Classic vanilla milkshake — smooth, creamy and cold.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Strawberry Milkshake', category: 'Milkshakes', price: 110, type: 'veg', description: 'Pink and fruity strawberry milkshake topped with cream.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Mango Milkshake',      category: 'Milkshakes', price: 120, type: 'veg', description: 'Thick mango milkshake made with real Alphonso mango pulp.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'KitKat Milkshake',     category: 'Milkshakes', price: 140, type: 'veg', description: 'Indulgent milkshake blended with KitKat chocolate wafers.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Dry Fruit Milkshake',  category: 'Milkshakes', price: 160, type: 'veg', description: 'Nutritious milkshake loaded with cashews, almonds and dates.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },
      { name: 'Banana Milkshake',     category: 'Milkshakes', price: 100, type: 'veg', description: 'Smooth, naturally sweet banana milkshake with honey.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80', popular: false },

      // ─── TRADITIONAL DRINKS ───
      { name: 'Buttermilk',         category: 'Traditional Drinks', price: 30, type: 'veg', description: 'Chilled, lightly spiced buttermilk — the ultimate Indian coolant.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', popular: false },
      { name: 'Masala Buttermilk',  category: 'Traditional Drinks', price: 40, type: 'veg', description: 'Buttermilk spiced with ginger, green chilli and asafoetida.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', popular: false },
      { name: 'Lemon Juice',        category: 'Traditional Drinks', price: 40, type: 'veg', description: 'Fresh lime juice with sugar, salt and a pinch of cumin.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Lemon Mint Cooler',  category: 'Traditional Drinks', price: 60, type: 'veg', description: 'Chilled lemonade with fresh mint leaves and a hint of ginger.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },
      { name: 'Nannari Sarbath',    category: 'Traditional Drinks', price: 50, type: 'veg', description: 'Refreshing Indian sarsaparilla drink with a distinctive earthy sweetness.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', popular: false },
      { name: 'Jigarthanda',        category: 'Traditional Drinks', price: 80, type: 'veg', description: 'Iconic Madurai cooler with nannari, badam pisin and ice cream.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', popular: true  },
      { name: 'Rose Milk',          category: 'Traditional Drinks', price: 50, type: 'veg', description: 'Chilled sweetened milk flavoured with rose water and basil seeds.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', popular: false },
      { name: 'Tender Coconut',     category: 'Traditional Drinks', price: 60, type: 'veg', description: 'Fresh tender coconut water — naturally hydrating and electrolyte-rich.', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', popular: false },

      // ─── HOT BEVERAGES ───
      { name: 'Tea',            category: 'Hot Beverages', price: 20, type: 'veg', description: 'Classic Indian chai brewed with milk, sugar and tea leaves.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Ginger Tea',     category: 'Hot Beverages', price: 25, type: 'veg', description: 'Spicy, warming chai brewed with fresh ginger root.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Green Tea',      category: 'Hot Beverages', price: 30, type: 'veg', description: 'Delicate green tea — light, antioxidant-rich and refreshing.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Coffee',         category: 'Hot Beverages', price: 25, type: 'veg', description: 'Hot milk coffee with a rich, roasted flavour.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Filter Coffee',  category: 'Hot Beverages', price: 30, type: 'veg', description: 'Traditional South Indian filter kaapi — frothy, aromatic and strong.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: true  },
      { name: 'Boost',          category: 'Hot Beverages', price: 35, type: 'veg', description: 'Energizing Boost malt drink in hot milk.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Horlicks',       category: 'Hot Beverages', price: 35, type: 'veg', description: 'Classic malted Horlicks in warm milk — nutritious and comforting.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },
      { name: 'Hot Chocolate',  category: 'Hot Beverages', price: 60, type: 'veg', description: 'Rich, velvety hot chocolate topped with a dusting of cocoa.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', popular: false },

      // ─── WATER ───
      { name: 'Mineral Water 500ml', category: 'Water', price: 20, type: 'veg', description: 'Chilled mineral water in a 500ml bottle.', image: 'https://www.bestonewater.com/wp-content/uploads/2025/01/1l.png', popular: false },
      { name: 'Mineral Water 1L',    category: 'Water', price: 30, type: 'veg', description: 'Still mineral water in a 1 litre bottle.', image: 'https://www.bestonewater.com/wp-content/uploads/2025/01/1l.png', popular: false },
      { name: 'Soda',                category: 'Water', price: 25, type: 'veg', description: 'Chilled plain soda water — ideal mixer or light refresher.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0ZhHys9kyfgKHmIp3v2TnL1xpi5rv3_rOKVd3xKrXwQ&s=10', popular: false },
    ];

    menuItems.forEach(item => this.addMenuItem(item));

    // Seed sample ratings
    const menu = this.getMenu();
    const sampleRatings = [
      { menuItemId: menu.find(m=>m.name==='Chicken Biryani')?.id, userId:'u1', userName:'Priya R', rating:5, review:'Absolutely amazing! Best biryani in Erode.', date: new Date(Date.now()-86400000*5).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Chicken Biryani')?.id, userId:'u2', userName:'Karthik M', rating:4, review:'Very tasty, generous portions too!', date: new Date(Date.now()-86400000*3).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Mutton Biryani')?.id, userId:'u1', userName:'Priya R', rating:5, review:'Perfectly cooked mutton, loved the spices!', date: new Date(Date.now()-86400000*2).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Ghee Roast Dosa')?.id, userId:'u3', userName:'Sundari K', rating:5, review:'Super crispy and the ghee aroma is divine!', date: new Date(Date.now()-86400000).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Filter Coffee')?.id, userId:'u2', userName:'Karthik M', rating:5, review:'Best filter coffee I\'ve had!', date: new Date().toISOString() },
      { menuItemId: menu.find(m=>m.name==='Chilli Chicken')?.id, userId:'u3', userName:'Sundari K', rating:4, review:'Spicy and delicious. Exactly how I like it.', date: new Date(Date.now()-86400000*4).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Veg Meals')?.id, userId:'u1', userName:'Priya R', rating:4, review:'Good value for money. Fresh and filling.', date: new Date(Date.now()-86400000*6).toISOString() },
      { menuItemId: menu.find(m=>m.name==='Chicken Fried Rice')?.id, userId:'u2', userName:'Karthik M', rating:4, review:'Nicely seasoned, good wok flavour.', date: new Date(Date.now()-86400000*1).toISOString() },
    ].filter(r => r.menuItemId);
    this.saveRatings(sampleRatings);

    // Seed a sample customer
    this.registerUser({
      name: 'Priya Rajan', email: 'priya@example.com', phone: '9876543210',
      address: 'Anna Nagar, Chennai – 600 040', password: 'priya123',
    });
  },
};

/* ── Toast Helper ── */
const Toast = {
  show(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const colours = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info text-dark' };
    const id = 'toast_' + Date.now();
    const html = `
      <div id="${id}" class="toast align-items-center text-white ${colours[type] || 'bg-dark'} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3200">
        <div class="d-flex">
          <div class="toast-body">${msg}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    new bootstrap.Toast(el).show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }
};

/* ── Shared UI helpers ── */
const UI = {
  formatCurrency(n) { return '₹' + Number(n).toFixed(2); },
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  statusBadge(status) {
    const map = {
      pending:            'status-pending',
      confirmed:          'status-confirmed',
      preparing:          'status-preparing',
      'out for delivery': 'status-out-for-delivery',
      delivered:          'status-delivered',
      cancelled:          'status-cancelled',
    };
    const cls = map[status] || 'status-pending';
    return `<span class="status-badge ${cls}">${status}</span>`;
  },
  vegBadge(type) {
    return type === 'veg'
      ? `<span class="veg-badge veg">&#9632; Veg</span>`
      : `<span class="veg-badge non-veg">&#9632; Non-Veg</span>`;
  },
  foodEmoji(cat) {
    const map = {
      'Breakfast':'🍳','Biryani':'🍛','Starters':'🍢','Main Course':'🥘','Breads':'🫓',
      'Meals & Rice':'🍱','Fried Rice & Noodles':'🍜','Dinner Specials':'🌙','Soups':'🥣',
      'Cold Drinks':'🥤','Fresh Juices':'🍊','Milkshakes':'🥛','Lassi':'🥛',
      'Traditional Drinks':'🫙','Hot Beverages':'☕','Water':'💧',
    };
    return map[cat] || '🍽️';
  },
  /* ── Star rating render ── */
  renderStars(avg, interactive = false, itemId = '', userRating = 0) {
    if (interactive) {
      return [1,2,3,4,5].map(n => `
        <i class="star-icon ${n <= userRating ? 'fas' : 'far'} fa-star"
           data-value="${n}" data-item="${itemId}"
           onclick="handleStarClick('${itemId}', ${n})"
           onmouseover="hoverStars(this, ${n})"
           onmouseout="resetStars('${itemId}', ${userRating})"
           style="cursor:pointer;color:${n <= userRating ? '#f59e0b' : '#d1d5db'};font-size:1.1rem;transition:color .15s;"></i>
      `).join('');
    }
    const full  = Math.floor(avg);
    const half  = avg - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return [
      ...Array(full).fill('<i class="fas fa-star" style="color:#f59e0b;font-size:.8rem;"></i>'),
      ...Array(half).fill('<i class="fas fa-star-half-alt" style="color:#f59e0b;font-size:.8rem;"></i>'),
      ...Array(empty).fill('<i class="far fa-star" style="color:#d1d5db;font-size:.8rem;"></i>'),
    ].join('');
  },
  updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = DB.cartCount(); });
  },
  requireAuth(adminOnly = false) {
    if (!DB.isLoggedIn()) { window.location.href = 'login.html'; return false; }
    if (adminOnly && !DB.isAdmin()) { window.location.href = 'index.html'; return false; }
    if (!adminOnly && DB.isAdmin()) { window.location.href = 'admin-dashboard.html'; return false; }
    return true;
  },
  requireAdmin() { return this.requireAuth(true); },
};

/* Init on every page */
document.addEventListener('DOMContentLoaded', () => {
  DB.seed();
  UI.updateCartBadge();
});
