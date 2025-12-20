/* =========================================================
   E C L I P S E — Tienda V2 (Museo/Editorial) [FIXED]
   - Buscador + filtros + ordenar (por grid, sin IDs duplicados)
   - Vista rápida (modal)
   - Wishlist (localStorage)
   - Toasts elegantes
   - Relevancia = orden original (siempre)
   ========================================================= */

(() => {
  "use strict";

  // -----------------------
  // Helpers
  // -----------------------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  function normalizeText(str = "") {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function parsePriceFromText(priceText = "") {
    const cleaned = priceText
      .replace(/\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, "");
    const n = parseInt(cleaned, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function formatCOP(value) {
    try {
      return "$" + Number(value || 0).toLocaleString("es-CO");
    } catch {
      return "$" + (value || 0);
    }
  }

  function getCart() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
  }

  function setCart(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }

  function getWishlist() {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
  }

  function setWishlist(list) {
    localStorage.setItem("wishlist", JSON.stringify(list));
  }

  function isInWishlist(nombre) {
    return getWishlist().some((x) => x.nombre === nombre);
  }

  // -----------------------
  // Toasts
  // -----------------------
  function ensureToastHost() {
    let host = $("#toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, type = "info") {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <div class="toast__dot"></div>
      <div class="toast__msg">${message}</div>
      <button class="toast__close" aria-label="Cerrar">×</button>
    `;
    host.appendChild(el);

    const close = () => {
      el.classList.add("toast--out");
      setTimeout(() => el.remove(), 250);
    };

    const closeBtn = el.querySelector(".toast__close");
    if (closeBtn) closeBtn.addEventListener("click", close);

    setTimeout(close, 2600);
  }

  // -----------------------
  // addToCart global (para tus botones)
  // -----------------------
  window.addToCart = function addToCart(nombre, precio, imagen, cantidad = 1) {
    nombre = String(nombre || "").replace(/\s+/g, " ").trim();
imagen = String(imagen || "").trim();
precio = Number(precio) || 0;
cantidad = Number(cantidad) || 1;

    const carrito = getCart();
    const idx = carrito.findIndex((p) => p.nombre === nombre);

    if (idx !== -1) {
      carrito[idx].cantidad += Number(cantidad) || 1;
    } else {
      carrito.push({
        nombre,
        precio: Number(precio) || 0,
        cantidad: Number(cantidad) || 1,
        imagen,
      });
    }

    setCart(carrito);
window.dispatchEvent(new Event("cart:updated"));

    if (typeof window.updateCartCount === "function") {
      window.updateCartCount();
    } else {
      const totalCantidad = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
      const contador = document.getElementById("contador-carrito");
      if (contador) contador.textContent = totalCantidad;
    }

    toast(`Agregado: <b>${nombre}</b>`, "ok");
  };

  // -----------------------
  // Estado por grid (evita bugs en NEW.html)
  // -----------------------
  const stateMap = new WeakMap();

  function getState(grid) {
    if (!stateMap.has(grid)) {
      stateMap.set(grid, {
        search: "",
        sort: "relevance",
        filterNew: false,
        filterDiscount: false,
        filterWishlist: false,
      });
    }
    return stateMap.get(grid);
  }

  // -----------------------
  // Toolbar por grid (sin IDs, solo clases dentro del wrapper)
  // -----------------------
  function buildToolbar(grid) {
    const wrapper = document.createElement("div");
    wrapper.className = "toolbar-v2";

   wrapper.innerHTML = `
  <div class="toolbar-v2__row toolbar-v2__row--no-search">
    <div class="toolbar-v2__selects">
      <select class="sort-v2" aria-label="Ordenar">
        <option value="relevance">Orden: Relevancia</option>
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="name-asc">Nombre: A → Z</option>
        <option value="name-desc">Nombre: Z → A</option>
        <option value="new-first">Primero: NEW</option>
      </select>
    </div>
  </div>

  <div class="toolbar-v2__chips" role="group" aria-label="Filtros">
    <button class="chip" data-filter="new" type="button">NEW</button>
    <button class="chip" data-filter="discount" type="button">Descuento</button>
    <button class="chip" data-filter="wishlist" type="button">Favoritos</button>
    <button class="chip chip--ghost" data-filter="clear" type="button">Limpiar</button>
  </div>

  <div class="toolbar-v2__meta">
    <span class="results-v2">0 resultados</span>
  </div>
`;


    if (grid.parentElement) {
      grid.parentElement.insertBefore(wrapper, grid);
    }

    return wrapper;
  }

  // -----------------------
  // Modal Vista rápida (global)
  // -----------------------
  function ensureQuickModal() {
    let modal = $("#quick-modal-v2");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "quick-modal-v2";
    modal.className = "modal-v2";
    modal.innerHTML = `
      <div class="modal-v2__overlay" data-close="1"></div>
      <div class="modal-v2__panel" role="dialog" aria-modal="true" aria-label="Vista rápida">
        <button class="modal-v2__close" type="button" aria-label="Cerrar" data-close="1">×</button>

        <div class="modal-v2__content">
          <div class="modal-v2__imgwrap">
            <img id="qm-img" src="" alt="" />
          </div>

          <div class="modal-v2__info">
            <h3 id="qm-title"></h3>
            <div class="modal-v2__price" id="qm-price"></div>

            <div class="modal-v2__qty">
              <span class="modal-v2__label">Cantidad</span>
              <div class="qty">
                <button type="button" class="qty__btn" id="qm-minus">−</button>
                <input type="number" class="qty__input" id="qm-qty" min="1" value="1" />
                <button type="button" class="qty__btn" id="qm-plus">+</button>
              </div>
            </div>

            <div class="modal-v2__actions">
              <button type="button" class="btn-v2 btn-v2--primary" id="qm-add">
                <i class="fa-solid fa-bag-shopping"></i> Agregar
              </button>

              <button type="button" class="btn-v2 btn-v2--soft" id="qm-wish">
                <i class="fa-regular fa-heart"></i> Favorito
              </button>
            </div>

            <div class="modal-v2__hint">
              Tip: puedes buscar, filtrar y ordenar sin salir de la página.
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.dataset && target.dataset.close === "1") {
        closeQuickView();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeQuickView();
    });

    const qtyInput = $("#qm-qty", modal);
    const minusBtn = $("#qm-minus", modal);
    const plusBtn = $("#qm-plus", modal);

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        const v = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
        qtyInput.value = String(v);
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        const v = Math.max(1, (parseInt(qtyInput.value, 10) || 1) + 1);
        qtyInput.value = String(v);
      });
    }

    return modal;
  }

  function closeQuickView() {
    const modal = $("#quick-modal-v2");
    if (!modal) return;
    modal.classList.remove("modal-v2--open");
    document.body.classList.remove("no-scroll");
  }

  function openQuickView({ nombre, precio, imagen }) {
    const modal = ensureQuickModal();

    const title = $("#qm-title", modal);
    const price = $("#qm-price", modal);
    const img = $("#qm-img", modal);
    const qty = $("#qm-qty", modal);
    const btnAdd = $("#qm-add", modal);
    const btnWish = $("#qm-wish", modal);

    title.textContent = nombre;
    price.textContent = formatCOP(precio);
    img.src = imagen;
    img.alt = nombre;
    qty.value = "1";

    btnAdd.onclick = () => {
      const count = Math.max(1, parseInt(qty.value, 10) || 1);
      window.addToCart(nombre, precio, imagen, count);
      closeQuickView();
    };

    const syncWish = () => {
      const inWish = isInWishlist(nombre);
      btnWish.innerHTML = inWish
        ? `<i class="fa-solid fa-heart"></i> Favorito`
        : `<i class="fa-regular fa-heart"></i> Favorito`;
      btnWish.classList.toggle("btn-v2--active", inWish);
    };

    syncWish();

    btnWish.onclick = () => {
      const list = getWishlist();
      const exists = list.find((x) => x.nombre === nombre);

      if (exists) {
        setWishlist(list.filter((x) => x.nombre !== nombre));
        toast(`Quitado de favoritos: <b>${nombre}</b>`, "info");
      } else {
        list.push({ nombre, precio, imagen });
        setWishlist(list);
        toast(`Guardado en favoritos: <b>${nombre}</b>`, "ok");
      }

      syncWish();

      // refresca iconos en cards
      $$(".producto").forEach((c) => {
        if ((c.dataset.nombre || "") === nombre) {
          const w = $(".wish-btn", c);
          if (w) {
            const inCardWish = isInWishlist(nombre);
            w.innerHTML = inCardWish
              ? `<i class="fa-solid fa-heart"></i>`
              : `<i class="fa-regular fa-heart"></i>`;
            w.classList.toggle("wish-btn--active", inCardWish);
          }
        }
      });

      // Re-aplicar filtros en TODOS los grids (por si "Favoritos" está activo en alguno)
      $$(".productos-grid").forEach((g) => applyFiltersAndSort(g));
    };

    modal.classList.add("modal-v2--open");
    document.body.classList.add("no-scroll");
  }

  // -----------------------
  // Enriquecer cards
  // -----------------------
  function enhanceProductCards(grid) {
    const cards = $$(".producto", grid);

    cards.forEach((card, index) => {
      const img = $("img", card);
      const titleEl = $("h3", card);

      if (!img || !titleEl) return;

      const nombre = titleEl.textContent.trim();

      // Precio: detecta precio-final si existe (descuento), si no el primer <p>
      let precio = 0;
      const finalPriceEl = $(".precio-final", card);
      if (finalPriceEl) {
        precio = parsePriceFromText(finalPriceEl.textContent);
      } else {
        const p = $("p", card);
        if (p) precio = parsePriceFromText(p.textContent);
      }

      const imagen = img.getAttribute("src") || "";

      // Guardar dataset para filtros/orden
      card.dataset.nombre = nombre;
      card.dataset.nombreN = normalizeText(nombre);
      card.dataset.precio = String(precio);
      card.dataset.imagen = imagen;

      // NEW = clase .nuevo (como ya tienes)
      const hasNewBadge = card.querySelector(".etiqueta-nuevo");
      card.dataset.isNew = hasNewBadge ? "1" : "0";


      // Descuento = badge (solo donde exista)
      card.dataset.isDiscount = $(".descuento-badge", card) ? "1" : "0";

      // Relevancia: guardar orden original dentro del grid
      if (!card.dataset.order) {
        card.dataset.order = String(index);
      }

      // Vista rápida
      if (!$(".quick-btn", card)) {
        const quick = document.createElement("button");
        quick.className = "quick-btn";
        quick.type = "button";
        quick.innerHTML = `<i class="fa-regular fa-eye"></i><span>Vista rápida</span>`;
        card.appendChild(quick);

        quick.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openQuickView({ nombre, precio, imagen });
        });

        img.style.cursor = "pointer";
        img.addEventListener("click", () => openQuickView({ nombre, precio, imagen }));
      }

      // Favoritos
      if (!$(".wish-btn", card)) {
        const wish = document.createElement("button");
        wish.className = "wish-btn";
        wish.type = "button";
        wish.setAttribute("aria-label", "Agregar a favoritos");
        card.appendChild(wish);

        const syncWishIcon = () => {
          const inWish = isInWishlist(nombre);
          wish.innerHTML = inWish
            ? `<i class="fa-solid fa-heart"></i>`
            : `<i class="fa-regular fa-heart"></i>`;
          wish.classList.toggle("wish-btn--active", inWish);
        };

        syncWishIcon();

        wish.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const list = getWishlist();
          const exists = list.find((x) => x.nombre === nombre);

          if (exists) {
            setWishlist(list.filter((x) => x.nombre !== nombre));
            toast(`Quitado de favoritos: <b>${nombre}</b>`, "info");
          } else {
            list.push({ nombre, precio, imagen });
            setWishlist(list);
            toast(`Guardado en favoritos: <b>${nombre}</b>`, "ok");
          }

          syncWishIcon();

          // Refiltrar grid actual (y otros grids si el usuario tiene favoritos activado)
          $$(".productos-grid").forEach((g) => applyFiltersAndSort(g));
        });
      }
    });
  }

  // -----------------------
  // Filtros + Orden (por grid)
  // -----------------------
  function applyFiltersAndSort(grid) {
    const state = getState(grid);
    const cards = $$(".producto", grid);

    // Filtrado
    let visible = cards.filter((card) => {
      const nameNorm = card.dataset.nombreN || "";
      const isNew = card.dataset.isNew === "1";
      const isDiscount = card.dataset.isDiscount === "1";
      const nombre = card.dataset.nombre || "";

      if (state.search && !nameNorm.includes(state.search)) return false;
      if (state.filterNew && !isNew) return false;
      if (state.filterDiscount && !isDiscount) return false;
      if (state.filterWishlist && !isInWishlist(nombre)) return false;

      return true;
    });

    // Orden
    const sort = state.sort;
    const collator = new Intl.Collator("es", { sensitivity: "base" });

    if (sort === "relevance") {
      visible.sort((a, b) => (parseInt(a.dataset.order, 10) || 0) - (parseInt(b.dataset.order, 10) || 0));
    } else if (sort === "price-asc") {
      visible.sort((a, b) => (parseInt(a.dataset.precio, 10) || 0) - (parseInt(b.dataset.precio, 10) || 0));
    } else if (sort === "price-desc") {
      visible.sort((a, b) => (parseInt(b.dataset.precio, 10) || 0) - (parseInt(a.dataset.precio, 10) || 0));
    } else if (sort === "name-asc") {
      visible.sort((a, b) => collator.compare(a.dataset.nombre || "", b.dataset.nombre || ""));
    } else if (sort === "name-desc") {
      visible.sort((a, b) => collator.compare(b.dataset.nombre || "", a.dataset.nombre || ""));
    } else if (sort === "new-first") {
      visible.sort((a, b) => (b.dataset.isNew === "1") - (a.dataset.isNew === "1"));
    }

    // Aplicar visibilidad
    cards.forEach((c) => c.classList.add("is-hidden"));
    visible.forEach((c) => c.classList.remove("is-hidden"));

    // Reordenar DOM (solo para que el usuario vea el orden real)
    const hidden = cards.filter((c) => c.classList.contains("is-hidden"));
    grid.innerHTML = "";
    [...visible, ...hidden].forEach((c) => grid.appendChild(c));

    // Resultados (del toolbar correspondiente a este grid)
    const toolbar = grid.previousElementSibling;
    if (toolbar && toolbar.classList.contains("toolbar-v2")) {
      const results = $(".results-v2", toolbar);
      if (results) results.textContent = `${visible.length} resultados`;

      // Opcional: si no hay descuentos en este grid, el chip "Descuento" sigue funcionando (pero dará 0)
      // Eso es normal.
    }
  }

  // -----------------------
  // Init por grid
  // -----------------------
  function initGrid(grid) {
    const toolbar = buildToolbar(grid);
    const state = getState(grid);

    // Enhance cards (dataset + botones)
    enhanceProductCards(grid);

    
    const sortSelect = $(".sort-v2", toolbar);
    const chips = $$(".chip", toolbar);

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.search = normalizeText(searchInput.value);
        applyFiltersAndSort(grid);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value;
        applyFiltersAndSort(grid);
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;

        if (filter === "clear") {
          state.filterNew = false;
          state.filterDiscount = false;
          state.filterWishlist = false;

          chips.forEach((c) => c.classList.remove("chip--active"));
          applyFiltersAndSort(grid);
          return;
        }

        chip.classList.toggle("chip--active");

        if (filter === "new") state.filterNew = chip.classList.contains("chip--active");
        if (filter === "discount") state.filterDiscount = chip.classList.contains("chip--active");
        if (filter === "wishlist") state.filterWishlist = chip.classList.contains("chip--active");

        applyFiltersAndSort(grid);
      });
    });

    // Primer render
    applyFiltersAndSort(grid);
  }

  function boot() {
    const grids = $$(".productos-grid");
    grids.forEach(initGrid);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
