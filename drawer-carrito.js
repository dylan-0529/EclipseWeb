/* =========================================================
   E C L I P S E — Drawer Carrito (Lateral)
   - Lee localStorage("carrito")
   - Renderiza items con +/- y eliminar
   - Total en vivo
   - Abre desde el botón flotante del carrito
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getCart() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
  }

  function setCart(cart) {
    localStorage.setItem("carrito", JSON.stringify(cart));
  }

  function formatCOP(value) {
    try {
      return "$" + Number(value || 0).toLocaleString("es-CO");
    } catch {
      return "$" + (value || 0);
    }
  }

  function cartCount(cart) {
    return cart.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
  }

  function cartTotal(cart) {
    return cart.reduce((acc, it) => acc + (Number(it.precio) || 0) * (Number(it.cantidad) || 0), 0);
  }

  function ensureDrawer() {
    let el = $("#cart-drawer");
    if (el) return el;

    el = document.createElement("div");
    el.id = "cart-drawer";
    el.className = "cart-drawer";

    el.innerHTML = `
      <div class="cart-drawer__overlay" data-close="1"></div>

      <aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Carrito">
        <header class="cart-drawer__header">
          <div class="cart-drawer__title">
            <span>Carrito</span>
            <span class="cart-drawer__badge" id="drawer-count">0</span>
          </div>

          <button class="cart-drawer__close" type="button" aria-label="Cerrar" data-close="1">×</button>
        </header>

        <div class="cart-drawer__body">
          <div class="cart-drawer__empty" id="drawer-empty">
            <div class="cart-drawer__empty-title">Tu carrito está vacío</div>
            <div class="cart-drawer__empty-sub">Agrega productos y aparecerán aquí.</div>
            <button type="button" class="btn-v2 btn-v2--primary" id="drawer-go-shop">
              Seguir comprando
            </button>
          </div>

          <div class="cart-drawer__items" id="drawer-items"></div>
        </div>

        <footer class="cart-drawer__footer">
          <div class="cart-drawer__totals">
            <div class="cart-drawer__totals-row">
              <span>Total</span>
              <strong id="drawer-total">$0</strong>
            </div>
            <div class="cart-drawer__totals-hint">Los productos quedan guardados aunque envíes por WhatsApp.</div>
          </div>

          <div class="cart-drawer__actions">
            <a class="btn-v2 btn-v2--primary" href="carrito.html#checkout" id="drawer-checkout">
              Finalizar pedido
            </a>
            <button class="btn-v2 btn-v2--soft" type="button" id="drawer-clear">
              Vaciar
            </button>
          </div>
        </footer>
      </aside>
    `;

    document.body.appendChild(el);

    // Close handlers
    el.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === "1") closeDrawer();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });

    // Buttons
    const goShop = $("#drawer-go-shop", el);
    if (goShop) goShop.addEventListener("click", closeDrawer);

    const clearBtn = $("#drawer-clear", el);
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        setCart([]);
        syncCartUI();
        renderDrawer();
      });
    }

    return el;
  }

  function openDrawer() {
    const drawer = ensureDrawer();
    drawer.classList.add("cart-drawer--open");
    document.body.classList.add("no-scroll");
    renderDrawer();
  }

  function closeDrawer() {
    const drawer = $("#cart-drawer");
    if (!drawer) return;
    drawer.classList.remove("cart-drawer--open");
    document.body.classList.remove("no-scroll");
  }

  function syncCartUI() {
    // Si ya tienes updateCartCount(), úsala
    if (typeof window.updateCartCount === "function") {
      window.updateCartCount();
      return;
    }

    // Fallback: actualiza contador flotante
    const cart = getCart();
    const contador = document.getElementById("contador-carrito");
    if (contador) contador.textContent = String(cartCount(cart));
  }

  function changeQty(nombre, delta) {
    const cart = getCart();
    const idx = cart.findIndex((p) => p.nombre === nombre);
    if (idx === -1) return;

    cart[idx].cantidad = Math.max(1, (Number(cart[idx].cantidad) || 1) + delta);
    setCart(cart);
    syncCartUI();
    renderDrawer();
  }

  function removeItem(nombre) {
    const cart = getCart().filter((p) => p.nombre !== nombre);
    setCart(cart);
    syncCartUI();
    renderDrawer();
  }

  function renderDrawer() {
    const drawer = ensureDrawer();
    const itemsWrap = $("#drawer-items", drawer);
    const empty = $("#drawer-empty", drawer);
    const totalEl = $("#drawer-total", drawer);
    const countEl = $("#drawer-count", drawer);

    const cart = getCart();
    const count = cartCount(cart);
    const total = cartTotal(cart);

    if (countEl) countEl.textContent = String(count);
    if (totalEl) totalEl.textContent = formatCOP(total);

    if (!cart.length) {
      if (empty) empty.style.display = "grid";
      if (itemsWrap) itemsWrap.innerHTML = "";
      return;
    }

    if (empty) empty.style.display = "none";

    itemsWrap.innerHTML = cart
      .map((it) => {
        const nombre = it.nombre || "Producto";
        const precio = Number(it.precio) || 0;
        const cantidad = Number(it.cantidad) || 1;
        const imagen = it.imagen || "";

        return `
          <div class="drawer-item">
            <div class="drawer-item__img">
              ${imagen ? `<img src="${imagen}" alt="${nombre}">` : `<div class="drawer-item__ph"></div>`}
            </div>

            <div class="drawer-item__info">
              <div class="drawer-item__name">${nombre}</div>
              <div class="drawer-item__meta">
                <span class="drawer-item__price">${formatCOP(precio)}</span>
                <span class="drawer-item__sub">x${cantidad}</span>
              </div>

              <div class="drawer-item__controls">
                <button class="qtybtn" type="button" data-action="minus" data-name="${encodeURIComponent(nombre)}">−</button>
                <div class="qtyval">${cantidad}</div>
                <button class="qtybtn" type="button" data-action="plus" data-name="${encodeURIComponent(nombre)}">+</button>

                <button class="trash" type="button" data-action="remove" data-name="${encodeURIComponent(nombre)}" aria-label="Eliminar">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Bind events
    $$(".qtybtn, .trash", itemsWrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const nombre = decodeURIComponent(btn.dataset.name || "");

        if (action === "minus") changeQty(nombre, -1);
        if (action === "plus") changeQty(nombre, +1);
        if (action === "remove") removeItem(nombre);
      });
    });
  }

  function hookCartButtons() {
    // 1) Botón flotante del carrito
    const float = $(".carrito-float");
    if (float) {
      float.addEventListener("click", (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

   // 2) Links a carrito.html: si están FUERA del drawer, abrimos el drawer.
//    Si están DENTRO del drawer (Finalizar pedido), dejamos navegar normal.
$$('a[href^="carrito.html"]').forEach((a) => {
  // Si el link está dentro del drawer, NO interceptar
  if (a.closest("#cart-drawer")) return;

  a.addEventListener("click", (e) => {
    e.preventDefault();
    openDrawer();
  });
});

  }

  // Exponer para usarlo si quieres desde otros scripts
  window.openCartDrawer = openDrawer;
  window.closeCartDrawer = closeDrawer;

  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("cart:updated", () => {
  renderDrawer();
});
    ensureDrawer();
    hookCartButtons();
    syncCartUI();
  });
})();
