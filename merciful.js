// MERCIFUL CRUNCHY — frontend script without admin mode.
// Products are defined in defaultProducts. To add/remove products edit the array below
// (or clear localStorage key 'mc_products' to reseed).
(() => {
  const API_BASE = ''; // '' = same origin. If backend is at http://localhost:3000 set it here.
  const PRODUCTS_KEY = 'mc_products';
  const CART_KEY = 'mc_cart';

  // Edit this array to add new products directly in the script.
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

  // DOM refs (may be missing on some pages)
  const productGrid = document.getElementById('product-grid');
  const cartCountEl = document.getElementById('cart-count');
  const cartContainer = document.getElementById('cart-container');
  const orderSummary = document.getElementById('order-summary');
  const checkoutForm = document.getElementById('checkout-form');
  const contactForm = document.getElementById('contact-form');
  const orderResult = document.getElementById('order-result');

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
    try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list)); } catch (e) { console.error(e); }
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

  // Utilities
  function formatCurrency(n) {
    try { return '₦' + Number(n).toLocaleString(); } catch { return '₦' + n; }
  }
  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Render product list by looping the products array
  function renderProducts() {
    if (!productGrid) return;
    const products = loadProducts();
    productGrid.innerHTML = '';

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
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  // Add product to cart (local)
  function addToCart(productId, qty = 1) {
    const products = loadProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) { alert('Product not found'); return; }
    const cart = loadCart();
    const found = cart.find(c => c.id === productId);
    if (found) found.qty += qty;
    else cart.push({ id: productId, qty });
    saveCart(cart);
    alert(`${prod.name} added to cart.`);
  }

  // Render cart page
  function renderCartPage() {
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

  // Event handlers for product actions and cart controls
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

    // Cart actions
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

  // Place order: POST to backend, fallback to local save if network fails
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
      const orders = JSON.parse(localStorage.getItem('mc_orders') || '[]');
      const id = 'LOCAL-' + Date.now();
      orders.push({ id, createdAt: new Date().toISOString(), ...payload, total: payload.items_total || 0 });
      localStorage.setItem('mc_orders', JSON.stringify(orders));
      return { success: false, response: { id, savedLocally: true } };
    }
  }

  // Checkout form submit
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cart = loadCart();
      if (!cart.length) { alert('Your cart is empty.'); return; }
      const name = document.getElementById('cust-name').value.trim();
      const phone = document.getElementById('cust-phone').value.trim();
      const address = document.getElementById('cust-address').value.trim();
      const email = document.getElementById('cust-email').value.trim();
      if (!name || !phone || !address) { alert('Please fill name, phone and address.'); return; }

      const items = cart.map(i => ({ product_id: i.id, qty: i.qty }));
      const products = loadProducts();
      const items_total = cart.reduce((s, it) => {
        const p = products.find(x => x.id === it.id);
        return s + (p ? p.price * it.qty : 0);
      }, 0);

      const payload = { customer: { name, phone, address, email }, items, items_total };
      const result = await placeOrderToBackend(payload);

      // Clear cart after placing order
      localStorage.removeItem(CART_KEY);
      updateCartCount();
      renderCartPage();

      const id = result.response && result.response.id ? result.response.id : 'UNKNOWN';
      if (orderResult) {
        orderResult.innerHTML = `<strong>Order placed!</strong> Your order number is <em>${escapeHtml(id)}</em>. We will contact you at ${escapeHtml(phone)}.`;
      } else {
        alert(`Order placed! Order ID: ${id}`);
      }
      checkoutForm.reset();
    });
  }

  // Contact form submit
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      if (!name || !message) { alert('Please fill name and message.'); return; }
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

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderProducts();
    renderCartPage();
  });
})();
