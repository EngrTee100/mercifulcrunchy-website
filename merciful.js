// MERCIFUL CRUNCHY — frontend script with editable product list (add/remove) and cart
// Drop this into your public/ folder (replaces previous script.js).
// Admin mode: open your site with #admin appended to the URL (e.g. http://localhost:3000/#admin)
// or call enableAdminMode() in the console to show add/remove controls.

(() => {
  const API_BASE = ''; // leave empty if using backend on same origin, otherwise 'http://localhost:3000'
  const PRODUCTS_KEY = 'mc_products';
  const CART_KEY = 'mc_cart';

  // Default product list (used first run)
  const defaultProducts = [
    {
      id: 'chinchin-01',
      name: 'Crunchy Chinchin (250g)',
      price: 800,
      description: 'Golden, sweet crunchy chinchin made in small batches.',
      image: 'images/chinchin.jpg'
    },
    {
      id: 'peanut-01',
      name: 'Peanut Burger (single)',
      price: 600,
      description: 'Savory peanut burger — crunchy and satisfying.',
      image: 'images/peanut-burger.jpg'
    }
  ];

  // DOM refs (may be absent on some pages)
  const productGrid = document.getElementById('product-grid');
  const cartCountEl = document.getElementById('cart-count');
  const cartContainer = document.getElementById('cart-container');
  const orderSummary = document.getElementById('order-summary');
  const checkoutForm = document.getElementById('checkout-form');
  const contactForm = document.getElementById('contact-form');
  const orderResult = document.getElementById('order-result');

  // Admin mode detection: hash #admin OR toggle by function
  let adminMode = (window.location.hash === '#admin') || (localStorage.getItem('mc_admin') === '1');

  function enableAdminMode() {
    adminMode = true;
    localStorage.setItem('mc_admin', '1');
    renderProducts();
    renderCartPage();
  }
  function disableAdminMode() {
    adminMode = false;
    localStorage.removeItem('mc_admin');
    renderProducts();
    renderCartPage();
  }
  window.enableAdminMode = enableAdminMode;
  window.disableAdminMode = disableAdminMode;

  // Storage helpers
  function loadProducts() {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (!raw) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
        return defaultProducts.slice();
      }
      return JSON.parse(raw);
    } catch {
      return defaultProducts.slice();
    }
  }
  function saveProducts(list) {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Could not save products', e);
    }
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }
  function updateCartCount() {
    if (!cartCountEl) return;
    const cart = loadCart();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    cartCountEl.textContent = String(count);
  }

  // Utility
  function formatCurrency(n) {
    try { return '₦' + Number(n).toLocaleString(); } catch { return '₦' + n; }
  }
  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function generateId(prefix = 'p') {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
  }

  // Product rendering: loop through array
  function renderProducts() {
    if (!productGrid) return;
    const products = loadProducts();
    productGrid.innerHTML = '';

    

    // Render each product card
    products.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product';
      card.innerHTML = `
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${formatCurrency(p.price)}</div>
        <p class="muted">${escapeHtml(p.description || '')}</p>
        <div class="actions">
          <button class="btn" data-id="${p.id}" data-action="details">Details</button>
          <button class="btn buy" data-id="${p.id}" data-action="add">Add to Cart</button>
          ${adminMode ? `<button class="btn" data-id="${p.id}" data-action="remove">Remove</button>` : ''}
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  // Product remove (admin)
  function removeProduct(id) {
    if (!adminMode) return;
    if (!confirm('Remove product? This will delete it from the local product list.')) return;
    const products = loadProducts().filter(p => p.id !== id);
    saveProducts(products);
    // If product exists in cart, remove it from cart as well
    const cart = loadCart().filter(item => item.id !== id);
    saveCart(cart);
    renderProducts();
    renderCartPage();
    alert('Product removed.');
  }

  // Cart functions remain similar: add, render, update qty
  function addToCart(productId, qty = 1) {
    const products = loadProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) {
      alert('Product not found (maybe it was removed).');
      return;
    }
    const cart = loadCart();
    const found = cart.find(c => c.id === productId);
    if (found) found.qty += qty;
    else cart.push({ id: productId, qty });
    saveCart(cart);
    alert(`${prod.name} added to cart.`);
  }

  async function renderCartPage() {
    if (!cartContainer) return;
    const cart = loadCart();
    if (!cart.length) {
      cartContainer.innerHTML = '<p>Your cart is empty. <a href="index.html">Continue shopping</a>.</p>';
      if (orderSummary) orderSummary.innerHTML = '';
      return;
    }
    const products = loadProducts();
    cartContainer.innerHTML = '';
    let subtotal = 0;
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id) || { name: item.id, price: 0, image: 'images/placeholder.png' };
      const itemTotal = (p.price || 0) * item.qty;
      subtotal += itemTotal;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
        <div style="flex:1">
          <div><strong>${escapeHtml(p.name)}</strong></div>
          <div class="muted">${formatCurrency(p.price || 0)} each</div>
          <div class="qty-controls">
            <button class="btn" data-action="dec" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="btn" data-action="inc" data-id="${item.id}">+</button>
            <button class="btn" data-action="remove" data-id="${item.id}" style="margin-left:12px">Remove</button>
          </div>
        </div>
        <div><strong>${formatCurrency(itemTotal)}</strong></div>
      `;
      cartContainer.appendChild(row);
    });
    const totalEl = document.createElement('div');
    totalEl.style.marginTop = '12px';
    totalEl.innerHTML = `<div class="muted">Subtotal:</div><h3>${formatCurrency(subtotal)}</h3>`;
    cartContainer.appendChild(totalEl);
    if (orderSummary) orderSummary.innerHTML = `<p>Items: ${cart.reduce((s,i)=>s+i.qty,0)} • Subtotal: ${formatCurrency(subtotal)}</p>`;
  }

  // Try to send order to backend; if backend unavailable, store locally
  async function placeOrderToBackend(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      return { success: true, response: json };
    } catch (err) {
      console.warn('Backend order failed, saving locally', err);
      // Save local fallback
      const orders = JSON.parse(localStorage.getItem('mc_orders') || '[]');
      const id = 'LOCAL-' + Date.now();
      orders.push({ id, createdAt: new Date().toISOString(), ...payload, total: payload.items_total || 0 });
      localStorage.setItem('mc_orders', JSON.stringify(orders));
      return { success: false, response: { id, savedLocally: true } };
    }
  }

  // Checkout behavior
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cart = loadCart();
      if (!cart.length) {
        alert('Your cart is empty.');
        return;
      }
      const name = document.getElementById('cust-name').value.trim();
      const phone = document.getElementById('cust-phone').value.trim();
      const address = document.getElementById('cust-address').value.trim();
      const email = document.getElementById('cust-email').value.trim();

      if (!name || !phone || !address) {
        alert('Please fill in required fields (name, phone, address).');
        return;
      }

      // Build items: product_id and qty
      const items = cart.map(i => ({ product_id: i.id, qty: i.qty }));
      // Calculate items_total from local products (in case backend absent)
      const products = loadProducts();
      const items_total = cart.reduce((s, it) => {
        const p = products.find(x => x.id === it.id);
        return s + (p ? p.price * it.qty : 0);
      }, 0);

      const payload = {
        customer: { name, phone, address, email },
        items,
        items_total
      };

      const result = await placeOrderToBackend(payload);
      // Clear cart after order attempt
      localStorage.removeItem(CART_KEY);
      updateCartCount();
      renderCartPage();

      if (orderResult) {
        const id = result.response && result.response.id ? result.response.id : 'UNKNOWN';
        orderResult.innerHTML = `<strong>Order placed!</strong> Your order number is <em>${escapeHtml(id)}</em>. We will contact you at ${escapeHtml(phone)}.`;
      } else {
        alert('Order placed. Check the page for confirmation.');
      }
      checkoutForm.reset();
    });
  }

  // Contact form posts to backend if available, otherwise just simulates
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      if (!name || !message) {
        alert('Please fill name and message.');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, message })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || res.statusText);
        const statusEl = document.getElementById('contact-status');
        if (statusEl) statusEl.textContent = 'Thank you! Your message has been received.';
        contactForm.reset();
      } catch (err) {
        console.warn('Contact submit failed, saved locally', err);
        const contacts = JSON.parse(localStorage.getItem('mc_contacts') || '[]');
        contacts.push({ name, email, phone, message, createdAt: new Date().toISOString() });
        localStorage.setItem('mc_contacts', JSON.stringify(contacts));
        const statusEl = document.getElementById('contact-status');
        if (statusEl) statusEl.textContent = 'Message saved locally (offline).';
        contactForm.reset();
      }
    });
  }

  // Click handlers (add to cart, details, inc/dec/remove in cart, remove product in admin)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action) return;

    if (action === 'add' && id) { addToCart(id, 1); return; }
    if (action === 'details' && id) {
      const products = loadProducts();
      const p = products.find(x => x.id === id);
      if (!p) { alert('Product not found'); return; }
      alert(`${p.name}\n\nPrice: ${formatCurrency(p.price)}\n\n${p.description || ''}`);
      return;
    }
    if (action === 'remove' && id && adminMode) { removeProduct(id); return; }

    // Cart page actions
    if (action === 'inc' || action === 'dec' || action === 'remove') {
      const cart = loadCart();
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      if (action === 'inc') cart[idx].qty += 1;
      if (action === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      if (action === 'remove') cart.splice(idx, 1);
      saveCart(cart);
      renderCartPage();
    }
  });

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderProducts();
    renderCartPage();

    // If not admin, add a small admin toggle button in the footer area for convenience
    if (!adminMode) {
      const footer = document.querySelector('.site-footer .container');
      if (footer) {
        const btn = document.createElement('button');
        btn.textContent = 'Admin';
        btn.className = 'btn';
        btn.style.marginLeft = '12px';
        btn.addEventListener('click', () => {
          if (confirm('Enable admin mode to add/remove products?')) enableAdminMode();
        });
        footer.appendChild(btn);
      }
    }
  });
})();