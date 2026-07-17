// frontend/js/app.js - Central State Controller and Interactive Routing (Full-Stack Version)

class GlowCartApp {
  constructor() {
    this.state = {
      view: 'catalog',           // 'catalog' | 'details' | 'checkout' | 'orders' | 'admin'
      selectedProductId: null,   // for 'details' view
      category: 'All',           // filter
      searchQuery: '',           // filter
      sortBy: 'default',         // 'default' | 'price-low' | 'price-high' | 'rating'
      cart: [],                  // { productId, name, price, image, quantity }
      user: null,                // { email, role: 'user' | 'admin', name }
      promoApplied: false,
      detailQty: 1
    };

    // Initialize on DOM load
    window.addEventListener('DOMContentLoaded', () => this.init());
  }

  async init() {
    // Restore states from Local Storage (Sessions & Cart)
    this.restoreUser();
    this.restoreCart();

    // Attach Event Listeners
    this.setupGlobalListeners();

    // Start background poller to refresh order statuses from backend
    this.startOrdersPoller();

    // Render Initial View
    this.navigate(this.state.view);
  }

  // State Restorers
  restoreUser() {
    const saved = localStorage.getItem('glowcart_user');
    if (saved) {
      this.state.user = JSON.parse(saved);
      this.updateNavbarAuthUI();
    }
  }

  restoreCart() {
    const saved = localStorage.getItem('glowcart_cart');
    if (saved) {
      this.state.cart = JSON.parse(saved);
      this.updateCartBadge();
    }
  }

  // Global UI binders
  setupGlobalListeners() {
    // Search listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        if (this.state.view !== 'catalog') {
          this.navigate('catalog');
        } else {
          this.renderCatalog();
        }
      });
    }

    // Modal click out close
    window.addEventListener('click', (e) => {
      const authOverlay = document.getElementById('auth-modal');
      if (e.target === authOverlay) {
        this.closeAuthModal();
      }
      const adminModal = document.getElementById('admin-modal');
      if (e.target === adminModal) {
        this.closeAdminModal();
      }
    });
  }

  // Routing and Navigation Control
  navigate(view, param = null) {
    this.state.view = view;
    
    // Hide details modal or panels if open
    this.closeAuthModal();
    this.closeAdminModal();
    this.closeCart();

    const heroBanner = document.getElementById('hero-banner-container');
    const categoriesBar = document.getElementById('categories-bar-container');
    const sortingBar = document.getElementById('sorting-bar-container');

    // Show categories & sorting only on Catalog View
    if (view === 'catalog') {
      if (categoriesBar) categoriesBar.style.display = 'flex';
      if (sortingBar) sortingBar.style.display = 'flex';
      
      // Show hero only when looking at "All" products and no search query
      if (heroBanner) {
        if (this.state.category === 'All' && !this.state.searchQuery) {
          heroBanner.style.display = 'block';
        } else {
          heroBanner.style.display = 'none';
        }
      }
    } else {
      if (heroBanner) heroBanner.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      if (sortingBar) sortingBar.style.display = 'none';
    }

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Reset window scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (view) {
      case 'catalog':
        this.renderCatalog();
        break;
      case 'details':
        this.state.selectedProductId = param;
        this.state.detailQty = 1;
        this.renderDetails();
        break;
      case 'checkout':
        if (this.state.cart.length === 0) {
          this.showToast('Your cart is empty! Cannot proceed to checkout.', 'warning');
          this.navigate('catalog');
          return;
        }
        this.renderCheckoutView();
        break;
      case 'orders':
        this.renderOrdersView();
        break;
      case 'admin':
        if (!this.state.user || this.state.user.role !== 'admin') {
          this.showToast('Access denied. Admin permissions required.', 'danger');
          this.navigate('catalog');
          return;
        }
        this.renderAdminView();
        break;
    }
  }

  // Renders
  async renderCatalog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">Loading Shop Catalog...</div>';
    
    let products = await getProducts();

    // Category Filter
    if (this.state.category !== 'All') {
      products = products.filter(p => p.category === this.state.category);
    }

    // Search Query Filter
    if (this.state.searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(this.state.searchQuery) ||
        p.category.toLowerCase().includes(this.state.searchQuery) ||
        p.description.toLowerCase().includes(this.state.searchQuery)
      );
    }

    // Sorting
    if (this.state.sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (this.state.sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (this.state.sortBy === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    }

    // Render results
    mainContent.innerHTML = `
      <div class="products-grid">
        ${renderProductGrid(products)}
      </div>
    `;

    // Update Results count text
    const countEl = document.getElementById('results-count-text');
    if (countEl) {
      countEl.innerText = `${products.length} product(s) found`;
    }
  }

  async renderDetails() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">Loading Product Specifications...</div>';
    
    const product = await getProductById(this.state.selectedProductId);
    if (!product) {
      this.showToast('Product not found.', 'danger');
      this.navigate('catalog');
      return;
    }

    // Get current quantity of this item in cart
    const cartItem = this.state.cart.find(c => c.productId === product.id);
    const cartQty = cartItem ? cartItem.quantity : 0;

    mainContent.innerHTML = renderProductDetails(product, cartQty);
    
    // Update visual controls based on bounds
    this.updateDetailQtyControls(product, cartQty);
  }

  renderCheckoutView() {
    const mainContent = document.getElementById('main-content');
    const totals = this.calculateTotals();
    mainContent.innerHTML = renderCheckout(
      this.state.cart, 
      totals.subtotal, 
      totals.discount, 
      totals.tax, 
      totals.total
    );
  }

  async renderOrdersView() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">Fetching Order History...</div>';
    
    // Fetch orders from API
    const userEmail = this.state.user ? this.state.user.email : 'guest';
    const role = this.state.user ? this.state.user.role : 'user';
    
    try {
      const response = await fetch(`/api/orders?email=${userEmail}&role=${role}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const orders = await response.json();
      mainContent.innerHTML = renderOrders(orders);
    } catch (error) {
      console.error(error);
      mainContent.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--clr-danger);">Error: Could not retrieve order details.</div>`;
    }
  }

  async renderAdminView() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">Loading Dashboard Metrics...</div>';
    
    const products = await getProducts();

    try {
      // Fetch all orders to compute stats
      const userEmail = this.state.user ? this.state.user.email : '';
      const response = await fetch(`/api/orders?email=${userEmail}&role=admin`);
      if (!response.ok) throw new Error('Failed to fetch admin metrics');
      const orders = await response.json();

      const totalRevenue = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + o.totals.total, 0);

      const stats = {
        revenue: totalRevenue,
        productsCount: products.length,
        ordersCount: orders.length,
        outOfStockCount: products.filter(p => p.stock <= 0).length
      };

      mainContent.innerHTML = renderAdminDashboard(products, stats);
    } catch (error) {
      console.error(error);
      mainContent.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--clr-danger);">Error: Could not load administrator panel.</div>`;
    }
  }

  // Catalog Category Filters Tab Changer
  selectCategory(category, tabElement) {
    this.state.category = category;
    
    // Manage active classes
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');

    // Re-trigger navigation to catalog to set correct banner layout
    this.navigate('catalog');
  }

  selectSort(criteria) {
    this.state.sortBy = criteria;
    this.renderCatalog();
  }

  clearSearchAndFilters() {
    this.state.category = 'All';
    this.state.searchQuery = '';
    this.state.sortBy = 'default';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(t => {
      if (t.innerText.trim() === 'All') {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';

    this.navigate('catalog');
  }

  // Detail Quantity Select Actions
  async changeDetailQty(delta) {
    const product = await getProductById(this.state.selectedProductId);
    const cartItem = this.state.cart.find(c => c.productId === product.id);
    const cartQty = cartItem ? cartItem.quantity : 0;
    const maxAvailable = product.stock - cartQty;

    const newVal = this.state.detailQty + delta;
    if (newVal >= 1 && newVal <= maxAvailable) {
      this.state.detailQty = newVal;
      document.getElementById('detail-qty-value').innerText = this.state.detailQty;
    }
  }

  updateDetailQtyControls(product, cartQty) {
    const maxAvailable = product.stock - cartQty;
    const qtyValEl = document.getElementById('detail-qty-value');
    const minusBtn = document.getElementById('btn-detail-qty-minus');
    const plusBtn = document.getElementById('btn-detail-qty-plus');
    const addToCartBtn = document.getElementById('btn-detail-add-cart');

    if (maxAvailable <= 0) {
      if (qtyValEl) qtyValEl.innerText = '0';
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;
      if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerText = 'Max In Cart';
      }
    } else {
      if (this.state.detailQty > maxAvailable) {
        this.state.detailQty = maxAvailable;
      }
      if (qtyValEl) qtyValEl.innerText = this.state.detailQty;
    }
  }

  async addDetailQtyToCart(productId) {
    await this.addToCart(productId, this.state.detailQty);
    // Refresh details page state
    this.navigate('details', productId);
  }

  // Cart Operations
  async addToCart(productId, quantity) {
    const product = await getProductById(productId);
    if (!product) return;

    if (product.stock <= 0) {
      this.showToast('Product is currently out of stock!', 'danger');
      return;
    }

    // Check existing cart item
    const existing = this.state.cart.find(item => item.productId === productId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stock) {
      this.showToast(`Only ${product.stock} items available. You already have ${currentQty} in cart.`, 'warning');
      return;
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      this.state.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity
      });
    }

    this.saveCart();
    this.showToast(`Added ${quantity}x ${product.name} to Cart.`, 'success');
  }

  async updateCartQty(productId, newQuantity) {
    const product = await getProductById(productId);
    if (!product) return;

    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      this.showToast(`Cannot increase. Only ${product.stock} in stock.`, 'warning');
      return;
    }

    const item = this.state.cart.find(c => c.productId === productId);
    if (item) {
      item.quantity = newQuantity;
      this.saveCart();
    }
  }

  removeFromCart(productId) {
    const item = this.state.cart.find(c => c.productId === productId);
    this.state.cart = this.state.cart.filter(item => item.productId !== productId);
    this.saveCart();
    if (item) {
      this.showToast(`Removed ${item.name} from Cart`, 'warning');
    }
  }

  saveCart() {
    localStorage.setItem('glowcart_cart', JSON.stringify(this.state.cart));
    this.updateCartBadge();
    
    // Live update open drawer
    const drawerContent = document.getElementById('cart-drawer-content');
    if (drawerContent) {
      drawerContent.innerHTML = renderCart(this.state.cart);
    }
    
    const totals = this.calculateTotals();
    this.updateCartDrawerTotalsUI(totals);
  }

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const totalCount = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
      if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  calculateTotals() {
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = this.state.promoApplied ? (subtotal * 0.20) : 0.0;
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  }

  updateCartDrawerTotalsUI(totals) {
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    const taxEl = document.getElementById('cart-drawer-tax');
    const totalEl = document.getElementById('cart-drawer-total');
    const discountRow = document.getElementById('cart-drawer-discount-row');
    const discountEl = document.getElementById('cart-drawer-discount');

    if (subtotalEl) subtotalEl.innerText = `$${totals.subtotal.toFixed(2)}`;
    if (taxEl) taxEl.innerText = `$${totals.tax.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${totals.total.toFixed(2)}`;
    
    if (discountRow && discountEl) {
      if (totals.discount > 0) {
        discountEl.innerText = `-$${totals.discount.toFixed(2)}`;
        discountRow.style.display = 'flex';
      } else {
        discountRow.style.display = 'none';
      }
    }
  }

  // Slide-out Drawer Drawer Toggles
  openCart() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
      // Re-render
      document.getElementById('cart-drawer-content').innerHTML = renderCart(this.state.cart);
      this.saveCart(); // sync totals layout

      overlay.classList.add('active');
      drawer.classList.add('active');
    }
  }

  closeCart() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
    }
  }

  // Promo Code
  applyPromoCode() {
    const input = document.getElementById('promo-input');
    if (input) {
      const code = input.value.trim().toUpperCase();
      if (code === 'GLOW20') {
        this.state.promoApplied = true;
        this.showToast('Promo Code applied successfully! 20% off!', 'success');
        // Refresh checkout page
        if (this.state.view === 'checkout') {
          this.renderCheckoutView();
        }
      } else {
        this.showToast('Invalid Promo Code.', 'danger');
      }
    }
  }

  // Checkout Payment Inputs Syncing
  syncCardNumber(value) {
    const cleaned = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
    document.getElementById('card-num-input').value = cleaned;
    document.getElementById('preview-card-num').innerText = cleaned || '•••• •••• •••• ••••';
  }

  syncCardName(value) {
    document.getElementById('preview-card-name').innerText = value.toUpperCase() || 'YOUR NAME';
  }

  syncCardExpiry(value) {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0,2) + '/' + cleaned.slice(2,4);
    }
    document.getElementById('card-expiry-input').value = cleaned;
    document.getElementById('preview-card-expiry').innerText = cleaned || 'MM/YY';
  }

  syncCardCvv(value) {
    const cleaned = value.replace(/\D/g, '');
    document.getElementById('card-cvv-input').value = cleaned;
    document.getElementById('preview-card-cvv').innerText = cleaned || '•••';
  }

  async processCheckout(e) {
    e.preventDefault();

    // Perform validation and loading state simulation
    const totals = this.calculateTotals();
    
    // Build order
    const nextOrderId = String(Math.floor(100000 + Math.random() * 900000));
    const newOrder = {
      id: nextOrderId,
      userEmail: this.state.user ? this.state.user.email : 'guest',
      totals: totals,
      status: 'Processing',
      items: [...this.state.cart],
      shippingDetails: {
        firstName: document.getElementById('ship-fname').value,
        lastName: document.getElementById('ship-lname').value,
        address: document.getElementById('ship-address').value,
        city: document.getElementById('ship-city').value,
        zip: document.getElementById('ship-zip').value
      }
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
      });

      if (!response.ok) throw new Error('Failed to record transaction');

      // Clear cart
      this.state.cart = [];
      this.state.promoApplied = false;
      this.saveCart();

      this.showToast('Payment Authorized. Order placed!', 'success');

      // Route to receipt success screen
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = renderOrderSuccess(newOrder);
    } catch (error) {
      this.showToast(`Checkout Error: ${error.message}`, 'danger');
    }
  }

  // Order status poller (updates status lists dynamically in the background)
  startOrdersPoller() {
    setInterval(async () => {
      // If user is currently looking at their orders list, pull new status from server
      if (this.state.view === 'orders') {
        const mainContent = document.getElementById('main-content');
        const userEmail = this.state.user ? this.state.user.email : 'guest';
        const role = this.state.user ? this.state.user.role : 'user';

        try {
          const response = await fetch(`/api/orders?email=${userEmail}&role=${role}`);
          if (response.ok) {
            const orders = await response.json();
            // Don't redraw entire screen if user is scrolling, but this is a demo, so updating is clean
            mainContent.innerHTML = renderOrders(orders);
          }
        } catch (err) {
          console.error('Poller error:', err);
        }
      }
    }, 15000); // Poll every 15 seconds
  }

  // Authentication Flow
  openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-container glass">
          <button class="modal-close" onclick="app.closeAuthModal()">✖</button>
          <div class="auth-panel">
            <div class="auth-header">
              <div class="auth-logo">GlowCart<span class="logo-dot"></span></div>
              <div class="auth-subtitle">Login to track orders and save your preference.</div>
            </div>
            
            <div class="auth-tabs">
              <button class="auth-tab-btn ${tab === 'login' ? 'active' : ''}" onclick="app.switchAuthTab('login')">Sign In</button>
              <button class="auth-tab-btn ${tab === 'register' ? 'active' : ''}" onclick="app.switchAuthTab('register')">Register</button>
            </div>
            
            <div id="auth-tab-content">
              ${this.getAuthFormHTML(tab)}
            </div>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tab) {
    const loginTab = document.querySelectorAll('.auth-tab-btn')[0];
    const registerTab = document.querySelectorAll('.auth-tab-btn')[1];
    
    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    } else {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
    }

    document.getElementById('auth-tab-content').innerHTML = this.getAuthFormHTML(tab);
  }

  getAuthFormHTML(tab) {
    if (tab === 'login') {
      return `
        <form onsubmit="app.handleLogin(event)">
          <div class="auth-form-group">
            <label for="login-email">Email Address</label>
            <div class="auth-input-wrapper">
              <input type="email" id="login-email" required placeholder="name@domain.com">
            </div>
          </div>
          <div class="auth-form-group">
            <label for="login-password">Password</label>
            <div class="auth-input-wrapper">
              <input type="password" id="login-password" required placeholder="••••••••">
            </div>
          </div>
          <button type="submit" class="btn-auth-submit">Sign In</button>
          
          <div class="quick-creds">
            <div class="quick-creds-title">Demo Accounts:</div>
            <div class="quick-creds-links">
              <button type="button" class="btn-quick-login" onclick="app.quickLogin('user@glowcart.com', 'user123')">👤 Login as Customer (user@glowcart.com / user123)</button>
              <button type="button" class="btn-quick-login" onclick="app.quickLogin('admin@glowcart.com', 'admin123')">⚡ Login as Admin (admin@glowcart.com / admin123)</button>
            </div>
          </div>
        </form>
      `;
    } else {
      return `
        <form onsubmit="app.handleRegister(event)">
          <div class="auth-form-group">
            <label for="reg-name">Full Name</label>
            <div class="auth-input-wrapper">
              <input type="text" id="reg-name" required placeholder="John Doe">
            </div>
          </div>
          <div class="auth-form-group">
            <label for="reg-email">Email Address</label>
            <div class="auth-input-wrapper">
              <input type="email" id="reg-email" required placeholder="name@domain.com">
            </div>
          </div>
          <div class="auth-form-group">
            <label for="reg-password">Password</label>
            <div class="auth-input-wrapper">
              <input type="password" id="reg-password" required placeholder="••••••••">
            </div>
          </div>
          <button type="submit" class="btn-auth-submit">Create Account</button>
        </form>
      `;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    await this.performLogin(email, password);
  }

  async performLogin(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Authentication failed');
      }

      const sessionUser = await response.json();
      this.state.user = sessionUser;
      localStorage.setItem('glowcart_user', JSON.stringify(this.state.user));
      
      this.updateNavbarAuthUI();
      this.closeAuthModal();
      this.showToast(`Welcome back, ${sessionUser.name}!`, 'success');

      if (sessionUser.role === 'admin') {
        this.navigate('admin');
      } else {
        this.navigate('catalog');
      }
    } catch (error) {
      this.showToast(error.message, 'danger');
    }
  }

  async quickLogin(email, pass) {
    await this.performLogin(email, pass);
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Registration failed');
      }

      const sessionUser = await response.json();
      this.state.user = sessionUser;
      localStorage.setItem('glowcart_user', JSON.stringify(this.state.user));
      
      this.updateNavbarAuthUI();
      this.closeAuthModal();
      this.showToast(`Account created! Welcome, ${sessionUser.name}.`, 'success');
      this.navigate('catalog');
    } catch (error) {
      this.showToast(error.message, 'danger');
    }
  }

  handleLogout() {
    this.state.user = null;
    localStorage.removeItem('glowcart_user');
    this.updateNavbarAuthUI();
    this.showToast('Logged out successfully.', 'warning');
    this.navigate('catalog');
  }

  updateNavbarAuthUI() {
    const authBtn = document.getElementById('nav-auth-btn');
    const adminTab = document.getElementById('nav-admin-tab');

    if (this.state.user) {
      if (authBtn) {
        authBtn.innerHTML = `
          <span>👤 ${this.state.user.name.split(' ')[0]}</span>
          <button class="qty-btn" onclick="event.stopPropagation(); app.handleLogout();" style="margin-left:5px; font-size:0.75rem; width:18px; height:18px; display:inline-flex;" title="Logout">✖</button>
        `;
      }
      
      // Admin link
      if (adminTab) {
        if (this.state.user.role === 'admin') {
          adminTab.style.display = 'flex';
        } else {
          adminTab.style.display = 'none';
        }
      }
    } else {
      if (authBtn) {
        authBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          Login
        `;
      }
      if (adminTab) adminTab.style.display = 'none';
    }
  }

  // Admin Dashboard CRUD Operations
  openAddProductModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-container glass">
          <button class="modal-close" onclick="app.closeAdminModal()">✖</button>
          <div style="padding:2rem;">
            <h2 class="modal-title">Add New Catalog Product</h2>
            <form onsubmit="app.handleAddProduct(event)">
              <div class="product-form-grid">
                <div class="auth-form-group">
                  <label for="prod-name">Product Name</label>
                  <div class="auth-input-wrapper">
                    <input type="text" id="prod-name" required placeholder="GlowKeyboard V2">
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="prod-category">Category</label>
                  <div class="auth-input-wrapper">
                    <select id="prod-category" style="width:100%; padding:0.75rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:var(--radius-md); color:var(--text-main); font-family:inherit;" required>
                      <option value="Keyboards" style="background:#120e24;">Keyboards</option>
                      <option value="Audio" style="background:#120e24;">Audio</option>
                      <option value="Wearables" style="background:#120e24;">Wearables</option>
                      <option value="Smart Home" style="background:#120e24;">Smart Home</option>
                    </select>
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="prod-price">Price ($)</label>
                  <div class="auth-input-wrapper">
                    <input type="number" step="0.01" id="prod-price" required placeholder="99.99">
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="prod-stock">Stock Qty</label>
                  <div class="auth-input-wrapper">
                    <input type="number" id="prod-stock" required placeholder="10">
                  </div>
                </div>
                <div class="auth-form-group form-group-full">
                  <label for="prod-image">Image File/URL</label>
                  <div class="auth-input-wrapper">
                    <select id="prod-image" style="width:100%; padding:0.75rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:var(--radius-md); color:var(--text-main); font-family:inherit;" required>
                      <option value="assets/neon_keyboard.jpg" style="background:#120e24;">Mechanical Keyboard Asset</option>
                      <option value="assets/cyber_headphones.jpg" style="background:#120e24;">Cyber Headphones Asset</option>
                      <option value="assets/cyber_watch.jpg" style="background:#120e24;">Cyber Smartwatch Asset</option>
                      <option value="assets/ambient_lamp.jpg" style="background:#120e24;">Smart Lamp Asset</option>
                    </select>
                  </div>
                </div>
                <div class="auth-form-group form-group-full">
                  <label for="prod-desc">Description</label>
                  <textarea id="prod-desc" required placeholder="Describe the product details and key attributes here..."></textarea>
                </div>
              </div>
              <button type="submit" class="btn-auth-submit" style="margin-top:1.5rem;">Add Product to Shop</button>
            </form>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  async openEditProductModal(productId) {
    const product = await getProductById(productId);
    if (!product) return;

    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-container glass">
          <button class="modal-close" onclick="app.closeAdminModal()">✖</button>
          <div style="padding:2rem;">
            <h2 class="modal-title">Edit Product: ${product.name}</h2>
            <form onsubmit="app.handleEditProduct(event, '${product.id}')">
              <div class="product-form-grid">
                <div class="auth-form-group">
                  <label for="edit-name">Product Name</label>
                  <div class="auth-input-wrapper">
                    <input type="text" id="edit-name" required value="${product.name}">
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="edit-category">Category</label>
                  <div class="auth-input-wrapper">
                    <select id="edit-category" style="width:100%; padding:0.75rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:var(--radius-md); color:var(--text-main); font-family:inherit;" required>
                      <option value="Keyboards" ${product.category === 'Keyboards' ? 'selected' : ''} style="background:#120e24;">Keyboards</option>
                      <option value="Audio" ${product.category === 'Audio' ? 'selected' : ''} style="background:#120e24;">Audio</option>
                      <option value="Wearables" ${product.category === 'Wearables' ? 'selected' : ''} style="background:#120e24;">Wearables</option>
                      <option value="Smart Home" ${product.category === 'Smart Home' ? 'selected' : ''} style="background:#120e24;">Smart Home</option>
                    </select>
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="edit-price">Price ($)</label>
                  <div class="auth-input-wrapper">
                    <input type="number" step="0.01" id="edit-price" required value="${product.price}">
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="edit-stock">Stock Qty</label>
                  <div class="auth-input-wrapper">
                    <input type="number" id="edit-stock" required value="${product.stock}">
                  </div>
                </div>
                <div class="auth-form-group form-group-full">
                  <label for="edit-image">Image File/URL</label>
                  <div class="auth-input-wrapper">
                    <select id="edit-image" style="width:100%; padding:0.75rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:var(--radius-md); color:var(--text-main); font-family:inherit;" required>
                      <option value="assets/neon_keyboard.jpg" ${product.image === 'assets/neon_keyboard.jpg' ? 'selected' : ''} style="background:#120e24;">Mechanical Keyboard Asset</option>
                      <option value="assets/cyber_headphones.jpg" ${product.image === 'assets/cyber_headphones.jpg' ? 'selected' : ''} style="background:#120e24;">Cyber Headphones Asset</option>
                      <option value="assets/cyber_watch.jpg" ${product.image === 'assets/cyber_watch.jpg' ? 'selected' : ''} style="background:#120e24;">Cyber Smartwatch Asset</option>
                      <option value="assets/ambient_lamp.jpg" ${product.image === 'assets/ambient_lamp.jpg' ? 'selected' : ''} style="background:#120e24;">Smart Lamp Asset</option>
                    </select>
                  </div>
                </div>
                <div class="auth-form-group form-group-full">
                  <label for="edit-desc">Description</label>
                  <textarea id="edit-desc" required>${product.description}</textarea>
                </div>
              </div>
              <button type="submit" class="btn-auth-submit" style="margin-top:1.5rem;">Update Product Details</button>
            </form>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  }

  async handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);
    const image = document.getElementById('prod-image').value;
    const description = document.getElementById('prod-desc').value;

    try {
      await addProduct({ name, category, price, stock, image, description });
      this.showToast(`Created new product: ${name}`, 'success');
      this.closeAdminModal();
      this.renderAdminView();
    } catch (err) {
      this.showToast(err.message, 'danger');
    }
  }

  async handleEditProduct(e, productId) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value;
    const category = document.getElementById('edit-category').value;
    const price = parseFloat(document.getElementById('edit-price').value);
    const stock = parseInt(document.getElementById('edit-stock').value);
    const image = document.getElementById('edit-image').value;
    const description = document.getElementById('edit-desc').value;

    try {
      await updateProduct(productId, { name, category, price, stock, image, description });
      this.showToast(`Updated product: ${name}`, 'success');
      this.closeAdminModal();
      this.renderAdminView();
    } catch (err) {
      this.showToast(err.message, 'danger');
    }
  }

  async deleteProductAction(id) {
    const product = await getProductById(id);
    if (!product) return;

    if (confirm(`Are you sure you want to remove '${product.name}' from the shop catalog?`)) {
      try {
        await deleteProduct(id);
        this.showToast(`Product '${product.name}' deleted.`, 'warning');
        this.renderAdminView();
      } catch (err) {
        this.showToast(err.message, 'danger');
      }
    }
  }

  // Toast Notification System
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Type icons
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon ${type}">
        ${iconSvg}
      </div>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove after animation completes
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3900);
  }

  // Redirect Helpers
  viewCatalog() { this.navigate('catalog'); }
  viewOrders() { this.navigate('orders'); }
  viewAdmin() { this.navigate('admin'); }
  viewProductDetails(id) { this.navigate('details', id); }
  viewCheckout() { this.navigate('checkout'); }
}

// Instantiate global app
const app = new GlowCartApp();
