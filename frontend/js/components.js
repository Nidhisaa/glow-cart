// components.js - Dynamic UI rendering component templates

// Currency formatter for Indian Rupees
function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Helper: Generates star ratings
function generateStarsHTML(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let html = '';
  for (let i = 0; i < fullStars; i++) {
    html += `<svg class="star full" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
  }
  if (halfStar) {
    html += `<svg class="star half" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88.99 4.28L12 15.4z"/></svg>`;
  }
  for (let i = 0; i < emptyStars; i++) {
    html += `<svg class="star empty" viewBox="0 0 24 24" width="14" height="14" fill="rgba(255,255,255,0.15)"><path d="M22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
  }
  return html;
}

// 1. Renders Catalog Grid of Product Cards
function renderProductGrid(products) {
  if (products.length === 0) {
    return `
      <div class="cart-empty-message" style="grid-column: 1/-1; padding: 4rem 0;">
        <svg viewBox="0 0 24 24" width="60" height="60" fill="rgba(255,255,255,0.15)">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <p>No products match your search or filter criteria.</p>
        <button class="nav-btn" onclick="app.clearSearchAndFilters()" style="margin-top: 1rem;">Reset Filters</button>
      </div>
    `;
  }

  return products.map(product => {
    const isOutOfStock = product.stock <= 0;
    return `
      <div class="product-card glass" onclick="app.viewProductDetails('${product.id}')">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <span class="product-category-tag">${product.category}</span>
        </div>
        <div class="product-card-body">
          <div class="product-card-rating">
            <span class="product-rating-stars">${generateStarsHTML(product.rating)}</span>
            <span class="rating-count">(${product.reviewsCount})</span>
          </div>
          <h3 class="product-card-title">${product.name}</h3>
          <p class="product-card-desc">${product.description}</p>
          <div class="product-card-footer">
            <span class="product-card-price">${formatPrice(product.price)}</span>
            <button class="btn-add-cart" 
                    onclick="event.stopPropagation(); app.addToCart('${product.id}', 1)"
                    title="Add to Cart"
                    ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? '✖' : `
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>`}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 2. Renders Detailed Product Sheet View
function renderProductDetails(product, currentCartQuantity = 0) {
  const isOutOfStock = product.stock <= 0;
  const maxAvailable = Math.max(0, product.stock - currentCartQuantity);

  // Specs Rows
  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => `
    <tr>
      <td>${key}</td>
      <td>${val}</td>
    </tr>
  `).join('');

  let stockStatus = 'In Stock';
  let stockClass = 'in-stock';
  if (product.stock === 0) {
    stockStatus = 'Out of Stock';
    stockClass = 'out-of-stock';
  } else if (product.stock <= 4) {
    stockStatus = `Low Stock (${product.stock} left)`;
    stockClass = 'low-stock';
  }

  return `
    <div class="product-detail-view">
      <div class="detail-gallery">
        <button class="detail-back-btn" onclick="app.viewCatalog()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Shop
        </button>
        <div class="detail-img-container">
          <img src="${product.image}" alt="${product.name}">
        </div>
      </div>
      <div class="detail-info">
        <span class="detail-category">${product.category}</span>
        <h1 class="detail-title">${product.name}</h1>
        
        <div class="detail-rating-row">
          <span style="display:flex; color:var(--clr-warning);">${generateStarsHTML(product.rating)}</span>
          <span style="color:var(--text-dim); font-size:0.9rem;">${product.rating} / 5.0 (${product.reviewsCount} customer reviews)</span>
        </div>

        <div class="detail-price">${formatPrice(product.price)}</div>
        
        <p class="detail-desc">${product.description}</p>
        
        <div class="detail-meta-grid">
          <div class="detail-meta-card glass">
            <div class="detail-meta-label">Stock Status</div>
            <div class="detail-meta-value stock-indicator">
              <span class="stock-dot ${stockClass}"></span>
              <span>${stockStatus}</span>
            </div>
          </div>
          <div class="detail-meta-card glass">
            <div class="detail-meta-label">Fast Shipping</div>
            <div class="detail-meta-value">Free 2-Day Delivery</div>
          </div>
        </div>

        <div class="detail-buy-row">
          <div class="qty-selector">
            <button class="qty-select-btn" onclick="app.changeDetailQty(-1)" id="btn-detail-qty-minus">-</button>
            <span class="qty-select-val" id="detail-qty-value">1</span>
            <button class="qty-select-btn" onclick="app.changeDetailQty(1)" id="btn-detail-qty-plus">+</button>
          </div>
          <button class="btn-detail-add" 
                  id="btn-detail-add-cart"
                  onclick="app.addDetailQtyToCart('${product.id}')"
                  ${isOutOfStock ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.88 1.46h13.08c.88 0 1.65-.62 1.88-1.46l2.54-9.27.04-.27c0-.55-.45-1-1-1h-4.79zM9 9l3-4.5L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>

        ${specsRows ? `
          <h2 class="detail-specs-title">Specifications</h2>
          <table class="specs-table">
            <tbody>
              ${specsRows}
            </tbody>
          </table>
        ` : ''}
      </div>
    </div>
  `;
}

// 3. Renders Slide-out Cart Items list
function renderCart(cartItems) {
  if (cartItems.length === 0) {
    return `
      <div class="cart-empty-message">
        <svg viewBox="0 0 24 24">
          <path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.88 1.46h13.08c.88 0 1.65-.62 1.88-1.46l2.54-9.27.04-.27c0-.55-.45-1-1-1h-4.79zM9 9l3-4.5L15 9H9z"/>
        </svg>
        <p>Your shopping cart is empty.</p>
        <button class="nav-btn" onclick="app.closeCart(); app.viewCatalog();" style="margin-top: 1rem;">Shop Products</button>
      </div>
    `;
  }

  return cartItems.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="cart-item-name" title="${item.name}">${item.name}</div>
          <button class="btn-remove-item" onclick="app.removeFromCart('${item.productId}')" title="Remove Item">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
          <div class="quantity-controller">
            <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity - 1})">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity + 1})">+</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// 4. Renders Checkout Form with Interactive Card Flip
function renderCheckout(cartItems, subtotal, discount, tax, total) {
  const itemsSummaryHTML = cartItems.map(item => `
    <div class="checkout-summary-item">
      <div>
        <span class="checkout-item-qty">${item.quantity}x</span>
        <span>${item.name}</span>
      </div>
      <span>${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  return `
    <div class="checkout-view">
      <h1 class="checkout-title">Secure Checkout</h1>
      
      <div class="checkout-grid">
        <form class="checkout-form-container" onsubmit="app.processCheckout(event)">
          
          <!-- Shipping Address -->
          <div class="checkout-section-card glass">
            <h2 class="checkout-section-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Shipping Address
            </h2>
            <div class="product-form-grid">
              <div class="auth-form-group">
                <label for="ship-fname">First Name</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="ship-fname" required placeholder="John">
                </div>
              </div>
              <div class="auth-form-group">
                <label for="ship-lname">Last Name</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="ship-lname" required placeholder="Doe">
                </div>
              </div>
              <div class="auth-form-group form-group-full">
                <label for="ship-address">Street Address</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="ship-address" required placeholder="123 Neon Boulevard">
                </div>
              </div>
              <div class="auth-form-group">
                <label for="ship-city">City</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="ship-city" required placeholder="Metropolis">
                </div>
              </div>
              <div class="auth-form-group">
                <label for="ship-zip">Zip Code</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="ship-zip" required placeholder="90210">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Payment Info & Animated Flipping Card -->
          <div class="checkout-section-card glass">
            <h2 class="checkout-section-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              Card Payment
            </h2>
            
            <!-- Virtual Card Preview Wrapper -->
            <div class="card-preview-area">
              <div class="interactive-card" id="virtual-card">
                <div class="card-inner">
                  <!-- Card Front -->
                  <div class="card-front">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div class="card-chip"></div>
                      <div style="font-weight:800; font-size:1.1rem; font-style:italic;">GlowPay</div>
                    </div>
                    <div class="card-number" id="preview-card-num">•••• •••• •••• ••••</div>
                    <div class="card-holder-row">
                      <div>
                        <div class="card-label">Card Holder</div>
                        <div class="card-val" id="preview-card-name">YOUR NAME</div>
                      </div>
                      <div style="text-align:right;">
                        <div class="card-label">Expires</div>
                        <div class="card-val" id="preview-card-expiry">MM/YY</div>
                      </div>
                    </div>
                  </div>
                  <!-- Card Back -->
                  <div class="card-back">
                    <div class="card-magnetic-stripe"></div>
                    <div>
                      <div class="card-label" style="text-align:right; margin-right: 0.5rem;">Security Code (CVV)</div>
                      <div class="card-signature-area">
                        <span class="card-cvv-stripe" id="preview-card-cvv">•••</span>
                      </div>
                    </div>
                    <div style="font-size:0.6rem; opacity:0.5; text-align:left; line-height:1.3;">
                      This is a virtual demonstration checkout card. No actual charges will occur.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Inputs -->
            <div class="product-form-grid">
              <div class="auth-form-group form-group-full">
                <label for="card-num-input">Card Number</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="card-num-input" required max-length="19" placeholder="4111 2222 3333 4444"
                         onfocus="document.getElementById('virtual-card').classList.remove('flipped')"
                         oninput="app.syncCardNumber(this.value)">
                </div>
              </div>
              <div class="auth-form-group form-group-full">
                <label for="card-name-input">Cardholder Name</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="card-name-input" required placeholder="John Doe"
                         onfocus="document.getElementById('virtual-card').classList.remove('flipped')"
                         oninput="app.syncCardName(this.value)">
                </div>
              </div>
              <div class="auth-form-group">
                <label for="card-expiry-input">Expiration Date</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="card-expiry-input" required placeholder="MM/YY" maxlength="5"
                         onfocus="document.getElementById('virtual-card').classList.remove('flipped')"
                         oninput="app.syncCardExpiry(this.value)">
                </div>
              </div>
              <div class="auth-form-group">
                <label for="card-cvv-input">CVV</label>
                <div class="auth-input-wrapper">
                  <input type="text" id="card-cvv-input" required placeholder="123" maxlength="4"
                         onfocus="document.getElementById('virtual-card').classList.add('flipped')"
                         onblur="document.getElementById('virtual-card').classList.remove('flipped')"
                         oninput="app.syncCardCvv(this.value)">
                </div>
              </div>
            </div>
          </div>
          
          <button type="submit" class="btn-checkout" style="margin-top: 1rem;">Complete Purchase (${formatPrice(total)})</button>
        </form>
        
        <!-- Summary Sidebar -->
        <div class="checkout-summary">
          <div class="checkout-summary-card glass">
            <h2 class="checkout-summary-title">Order Summary</h2>
            <div class="checkout-summary-items">
              ${itemsSummaryHTML}
            </div>
            
            <div class="promo-code-container">
              <input type="text" id="promo-input" placeholder="Promo Code (GLOW20)">
              <button class="btn-promo-apply" onclick="app.applyPromoCode()">Apply</button>
            </div>
            
            <div class="cart-summary-line">
              <span>Subtotal</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            ${discount > 0 ? `
              <div class="cart-summary-line" style="color:var(--clr-accent-2);">
                <span>Discount (GLOW20 -20%)</span>
                <span>${formatPrice(-discount)}</span>
              </div>
            ` : ''}
            <div class="cart-summary-line">
              <span>Estimated Tax (8%)</span>
              <span>${formatPrice(tax)}</span>
            </div>
            <div class="cart-summary-line">
              <span>Shipping</span>
              <span style="color:var(--clr-success); font-weight:600;">FREE</span>
            </div>
            <div class="cart-total-line">
              <span>Total</span>
              <span>${formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 5. Renders Order Success Page with Interactive Receipt
function renderOrderSuccess(order) {
  const itemsHTML = order.items.map(item => `
    <div class="receipt-row">
      <span>${item.quantity}x ${item.name}</span>
      <span>${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  return `
    <div class="success-screen glass">
      <div class="success-badge">
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </div>
      <h1 class="success-title">Payment Successful!</h1>
      <p class="success-order-id">Order ID: #${order.id}</p>
      <p style="margin-bottom: 2rem; color:var(--text-muted);">Thank you for your purchase. A confirmation and tracking link have been emailed to your address.</p>
      
      <div class="receipt-card">
        <h3 class="receipt-title">Transaction Receipt</h3>
        ${itemsHTML}
        <div class="receipt-row" style="margin-top:0.8rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem;">
          <span>Subtotal</span>
          <span>${formatPrice(order.totals.subtotal)}</span>
        </div>
        ${order.totals.discount > 0 ? `
        <div class="receipt-row" style="color:var(--clr-accent-2);">
          <span>Discount (20% Off)</span>
          <span>${formatPrice(-order.totals.discount)}</span>
        </div>
        ` : ''}
        <div class="receipt-row">
          <span>Sales Tax</span>
          <span>${formatPrice(order.totals.tax)}</span>
        </div>
        <div class="receipt-row total">
          <span>Paid Amount</span>
          <span>${formatPrice(order.totals.total)}</span>
        </div>
      </div>
      
      <button class="btn-history-view" onclick="app.viewOrders()">Track Order</button>
    </div>
  `;
}

// 6. Renders Customer Order History (with Progress Tracking Bar)
function renderOrders(orders) {
  if (orders.length === 0) {
    return `
      <div class="orders-view">
        <h1 class="orders-title">Your Orders</h1>
        <div class="success-screen glass" style="margin: 0;">
          <svg viewBox="0 0 24 24" width="60" height="60" fill="var(--text-dim)" style="opacity: 0.5; margin-bottom:1.5rem;">
            <path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0-2.5h7v1.5h-7zM6 12H3.5a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5H6v9zm0-7.5H3.5A1.5 1.5 0 0 0 2 6v4.5A1.5 1.5 0 0 0 3.5 12H6V4.5zM12 4H9.5a1.5 1.5 0 0 0-1.5 1.5V11A1.5 1.5 0 0 0 9.5 12.5H12V4zm0 8.5H9.5a1.5 1.5 0 0 1-1.5-1.5V5.5A1.5 1.5 0 0 1 9.5 4H12v8.5zm8 4h-2.5A1.5 1.5 0 0 0 16 18v4.5A1.5 1.5 0 0 0 17.5 24H20v-7.5zm0 7.5h-2.5a1.5 1.5 0 0 1-1.5-1.5V18a1.5 1.5 0 0 1 1.5-1.5H20V24z"/>
          </svg>
          <p style="color:var(--text-dim);">You have not placed any orders yet.</p>
          <button class="nav-btn" onclick="app.viewCatalog()" style="margin-top: 1.5rem;">Explore Catalog</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="orders-view">
      <h1 class="orders-title">Your Orders</h1>
      ${orders.map(order => {
        // Compute tracking progress percentage
        // Status can be: 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'
        const statuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
        const currentIndex = statuses.indexOf(order.status);
        const percentWidth = (currentIndex / (statuses.length - 1)) * 100;

        const itemsHTML = order.items.map(item => `
          <div class="order-item-row">
            <span>${item.quantity}x ${item.name}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('');

        return `
          <div class="order-card glass">
            <div class="order-card-header">
              <div class="order-date-id">
                <span class="order-id-label">Order #${order.id}</span>
                <span class="order-date-label">Placed on ${new Date(order.date).toLocaleDateString()}</span>
              </div>
              <span class="order-status-badge">${order.status}</span>
            </div>
            
            <div class="order-items-summary">
              ${itemsHTML}
              <div class="order-item-row" style="margin-top:0.8rem; border-top:1px dashed rgba(255,255,255,0.06); padding-top:0.8rem; font-weight:700;">
                <span>Total Paid</span>
                <span style="color:var(--clr-accent-1); font-size:1.1rem;">${formatPrice(order.totals.total)}</span>
              </div>
            </div>

            <!-- Interactive Tracking Bar -->
            <div class="order-tracking-bar">
              <div class="tracking-track"></div>
              <div class="tracking-fill" style="width: ${percentWidth}%"></div>
              
              <div class="tracking-steps">
                <div class="tracking-step ${currentIndex >= 0 ? 'completed' : ''}">
                  <div class="step-node">✓</div>
                  <span class="step-label">Processing</span>
                </div>
                <div class="tracking-step ${currentIndex >= 1 ? 'completed' : ''}">
                  <div class="step-node">${currentIndex >= 1 ? '✓' : '2'}</div>
                  <span class="step-label">Shipped</span>
                </div>
                <div class="tracking-step ${currentIndex >= 2 ? 'completed' : ''}">
                  <div class="step-node">${currentIndex >= 2 ? '✓' : '3'}</div>
                  <span class="step-label">On Route</span>
                </div>
                <div class="tracking-step ${currentIndex >= 3 ? 'completed' : ''}">
                  <div class="step-node">${currentIndex >= 3 ? '✓' : '4'}</div>
                  <span class="step-label">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 7. Renders Admin Panel Dashboard
function renderAdminDashboard(products, stats) {
  const tableRowsHTML = products.map(p => `
    <tr>
      <td><img class="admin-table-img" src="${p.image}" alt=""></td>
      <td style="font-weight:600;">${p.name}</td>
      <td style="color:var(--clr-accent-1); font-weight:600;">${formatPrice(p.price)}</td>
      <td><span class="category-tab active" style="font-size:0.75rem; padding: 0.2rem 0.6rem;">${p.category}</span></td>
      <td>
        <span style="font-weight:600; color: ${p.stock <= 4 ? 'var(--clr-warning)' : 'var(--text-main)'}">
          ${p.stock}
        </span>
      </td>
      <td>
        <div class="admin-table-actions">
          <button class="btn-admin-action edit" onclick="app.openEditProductModal('${p.id}')" title="Edit Product">
            <svg viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button class="btn-admin-action delete" onclick="app.deleteProductAction('${p.id}')" title="Delete Product">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <div class="admin-dashboard-view">
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Admin Dashboard</h1>
          <p style="color:var(--text-dim); margin-top:0.2rem;">Manage products, inventory, and inspect sales metrics.</p>
        </div>
        <button class="btn-add-product" onclick="app.openAddProductModal()">
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add Product
        </button>
      </div>
      
      <!-- Stats Cards -->
      <div class="admin-stats-grid">
        <div class="stat-card glass">
          <div class="stat-info">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-val">${formatPrice(stats.revenue)}</span>
          </div>
          <div class="stat-icon sales">
            <svg viewBox="0 0 24 24">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card glass">
          <div class="stat-info">
            <span class="stat-label">Total Catalog Products</span>
            <span class="stat-val">${stats.productsCount}</span>
          </div>
          <div class="stat-icon products">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
        <div class="stat-card glass">
          <div class="stat-info">
            <span class="stat-label">Total Orders</span>
            <span class="stat-val">${stats.ordersCount}</span>
          </div>
          <div class="stat-icon orders">
            <svg viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card glass">
          <div class="stat-info">
            <span class="stat-label">Out of Stock Alerts</span>
            <span class="stat-val" style="color: ${stats.outOfStockCount > 0 ? 'var(--clr-danger)' : 'var(--text-main)'}">${stats.outOfStockCount}</span>
          </div>
          <div class="stat-icon stock">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Products CRUD Table -->
      <div class="admin-table-container glass">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="admin-table-body">
            ${tableRowsHTML || `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No products in database. Click Add Product to create one.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
