/* =========================================================
   E C L I P S E — Carrito + Checkout PRO (WhatsApp)
   - Persistencia: NO borra el carrito
   - Datos cliente: se guardan en localStorage
   - Mensaje WhatsApp: formateado marca
   ========================================================= */

(function () {
  "use strict";

  const WA_NUMBER = "573003578712"; // tu número

  const $ = (sel, root = document) => root.querySelector(sel);

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

  function cartTotal(cart) {
    return cart.reduce(
      (acc, it) => acc + (Number(it.precio) || 0) * (Number(it.cantidad) || 0),
      0
    );
  }

  function cartCount(cart) {
    return cart.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getCheckoutInfo() {
    return (
      JSON.parse(localStorage.getItem("checkoutInfo")) || {
        nombre: "",
        direccion: "",
        referencia: "",
        ciudad: "",
        celular: "",
        nota: ""
      }
    );
  }

  function setCheckoutInfo(info) {
    localStorage.setItem("checkoutInfo", JSON.stringify(info));
  }

  // --- contador flotante (si existe) ---
  function updateCartCount() {
    const cart = getCart();
    const totalCantidad = cartCount(cart);

    const contador = document.getElementById("contador-carrito");
    if (contador) {
      contador.textContent = String(totalCantidad);
      contador.classList.remove("pop");
      void contador.offsetWidth;
      contador.classList.add("pop");
    }
  }

  // --- render principal ---
  function renderCart(containerId) {
    const host = document.getElementById(containerId);
    if (!host) return;

    const cart = getCart();
    const total = cartTotal(cart);
    const info = getCheckoutInfo();

    if (!cart.length) {
      host.innerHTML = `
        <div class="checkout-wrap">
          <div class="checkout-card">
            <h2 class="checkout-title">Tu carrito está vacío</h2>
            <p class="checkout-sub">Agrega productos y vuelve aquí para finalizar.</p>
            <a class="btn-checkout btn-primary" href="NEW.html">Ir a NEW</a>
          </div>
        </div>
      `;
      updateCartCount();
      return;
    }

    const rows = cart
      .map((it, i) => {
        const nombre = escapeHtml(it.nombre || "Producto");
        const precio = Number(it.precio) || 0;
        const cantidad = Number(it.cantidad) || 1;
        const imagen = it.imagen ? escapeHtml(it.imagen) : "";
        const lineTotal = precio * cantidad;

        return `
          <div class="cart-row">
            <div class="cart-row__img">
              ${imagen ? `<img src="${imagen}" alt="${nombre}">` : `<div class="cart-row__ph"></div>`}
            </div>

            <div class="cart-row__info">
              <div class="cart-row__name">${nombre}</div>
              <div class="cart-row__meta">
                <span>${formatCOP(precio)}</span>
                <span class="dot">•</span>
                <strong>${formatCOP(lineTotal)}</strong>
              </div>

              <div class="cart-row__controls">
                <button class="qtybtn" type="button" onclick="changeQuantity(${i}, -1)">−</button>
                <div class="qtyval">${cantidad}</div>
                <button class="qtybtn" type="button" onclick="changeQuantity(${i}, 1)">+</button>

                <button class="trash" type="button" onclick="removeFromCart(${i})" aria-label="Eliminar">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    host.innerHTML = `
      <div class="checkout-wrap">
        <section class="checkout-left">
          <div class="checkout-card">
            <h2 class="checkout-title">Tu pedido</h2>
            <p class="checkout-sub">Ajusta cantidades y confirma antes de enviar.</p>

            <div class="cart-list">
              ${rows}
            </div>

            <div class="cart-total">
              <span>Total</span>
              <strong>${formatCOP(total)}</strong>
            </div>

            <div class="cart-actions">
              <button class="btn-checkout btn-soft" type="button" id="btn-empty">
                Vaciar carrito
              </button>
              <a class="btn-checkout btn-soft" href="NEW.html">Seguir comprando</a>
            </div>
          </div>
        </section>

        <aside class="checkout-right">
          <div class="checkout-card">
            <h2 class="checkout-title">Datos para el envío</h2>
            <p class="checkout-sub">Esto se incluirá en el mensaje de WhatsApp.</p>

            <div class="form-grid">
              <label class="field field--full">
                <span>Nombre completo *</span>
                <input id="c-nombre" type="text" placeholder="Tu nombre completo" value="${escapeHtml(info.nombre || "")}">
              </label>

              <label class="field field--full">
                <span>Dirección con nomenclatura exacta *</span>
                <input id="c-direccion" type="text" placeholder="Ej: Calle 84 # 45-12 Apto 301" value="${escapeHtml(info.direccion || "")}">
              </label>

              <label class="field field--full">
                <span>Punto de referencia *</span>
                <input id="c-referencia" type="text" placeholder="Ej: Frente a supermercado / portería..." value="${escapeHtml(info.referencia || "")}">
              </label>

              <label class="field">
                <span>Ciudad *</span>
                <input id="c-ciudad" type="text" placeholder="Ej: Barranquilla" value="${escapeHtml(info.ciudad || "")}">
              </label>

              <label class="field">
                <span>Número de celular *</span>
                <input id="c-celular" type="tel" inputmode="tel" placeholder="Ej: 3001234567" value="${escapeHtml(info.celular || "")}">
              </label>

              <label class="field field--full">
                <span>Nota (opcional)</span>
                <textarea id="c-nota" rows="3" placeholder="Ej: Por favor empacar para regalo.">${escapeHtml(info.nota || "")}</textarea>
              </label>
            </div>

            <div class="preview">
              <div class="preview__head">
                <span>Vista previa WhatsApp</span>
                <button class="btn-mini" type="button" id="btn-copy">Copiar</button>
              </div>
              <textarea id="wa-preview" readonly></textarea>
            </div>

            <button class="btn-checkout btn-primary" type="button" id="btn-wa">
              <i class="fa-brands fa-whatsapp"></i> Enviar pedido por WhatsApp
            </button>

            <div class="fineprint">
              *Tu carrito queda guardado aunque envíes el pedido.*
            </div>
          </div>
        </aside>
      </div>
    `;

    // Bind vaciar
    const btnEmpty = $("#btn-empty");
    if (btnEmpty) {
      btnEmpty.addEventListener("click", () => {
        setCart([]);
        renderCart(containerId);
      });
    }

    // Bind inputs
    const inputs = ["c-nombre", "c-direccion", "c-referencia", "c-ciudad", "c-celular", "c-nota"]
      .map((id) => $("#" + id));

    inputs.forEach((el) => {
      if (!el) return;
      el.addEventListener("input", handleFormChange);
      el.addEventListener("change", handleFormChange);
    });

    // Bind WhatsApp
    const btnWA = $("#btn-wa");
    if (btnWA) btnWA.addEventListener("click", sendOrderToWhatsApp);

    // Copy
    const btnCopy = $("#btn-copy");
    if (btnCopy) {
      btnCopy.addEventListener("click", async () => {
        const txt = $("#wa-preview")?.value || "";
        try {
          await navigator.clipboard.writeText(txt);
          btnCopy.textContent = "Copiado";
          setTimeout(() => (btnCopy.textContent = "Copiar"), 900);
        } catch {
          // nada
        }
      });
    }

    // Preview inicial
    updatePreview();
    updateCartCount();
  }

  function readForm() {
    const info = {
      nombre: ($("#c-nombre")?.value || "").trim(),
      direccion: ($("#c-direccion")?.value || "").trim(),
      referencia: ($("#c-referencia")?.value || "").trim(),
      ciudad: ($("#c-ciudad")?.value || "").trim(),
      celular: ($("#c-celular")?.value || "").trim(),
      nota: ($("#c-nota")?.value || "").trim()
    };

    setCheckoutInfo(info);
    return info;
  }

  function handleFormChange() {
    updatePreview();
  }

  function buildWhatsAppMessage(cart, info) {
    const total = cartTotal(cart);

    const lines = [];
    lines.push("✦ *Pedido E C L I P S E* ✦");
    lines.push("");

    cart.forEach((p) => {
      const nombre = (p.nombre || "Producto").trim();
      const qty = Number(p.cantidad) || 1;
      const lineTotal = (Number(p.precio) || 0) * qty;
      lines.push(`• ${nombre}  x${qty}  —  ${formatCOP(lineTotal)}`);
    });

    lines.push("");
    lines.push(`✱ *Total:* ${formatCOP(total)}`);
    lines.push("");
    lines.push("*Datos del cliente*");
    lines.push(`✓ Nombre completo: ${info.nombre || "-"}`);
    lines.push(`✓ Dirección: ${info.direccion || "-"}`);
    lines.push(`✓ Punto de referencia: ${info.referencia || "-"}`);
    lines.push(`✓ Ciudad: ${info.ciudad || "-"}`);
    lines.push(`✓ Celular: ${info.celular || "-"}`);

    if (info.nota) {
      lines.push("");
      lines.push(`Nota: ${info.nota}`);
    }

    lines.push("");
    lines.push("Gracias!");

    return lines.join("\n").replace(/\r\n/g, "\n").normalize("NFC");
  }

  function updatePreview() {
    const cart = getCart();
    const info = readForm();
    const preview = $("#wa-preview");
    if (preview) preview.value = buildWhatsAppMessage(cart, info);
  }

  function sendOrderToWhatsApp() {
    const cart = getCart();
    if (!cart.length) return;

    // leer del form (para capturar cambios inmediatos)
    const info = readForm();

    // limpiar errores previos
    ["c-nombre", "c-direccion", "c-referencia", "c-ciudad", "c-celular"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("field-error");
    });

    const focusError = (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add("field-error");
        el.focus();
      }
    };

    // obligatorios
    if (!info.nombre) return focusError("c-nombre");
    if (!info.direccion) return focusError("c-direccion");
    if (!info.referencia) return focusError("c-referencia");
    if (!info.ciudad) return focusError("c-ciudad");
    if (!info.celular) return focusError("c-celular");

    const msg = buildWhatsAppMessage(cart, info);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  // --- funciones globales usadas por el HTML (botones) ---
  window.changeQuantity = function (index, delta) {
    const cart = getCart();
    if (!cart[index]) return;

    cart[index].cantidad = (Number(cart[index].cantidad) || 1) + delta;

    if (cart[index].cantidad <= 0) cart.splice(index, 1);

    setCart(cart);
    renderCart("cart");
    updateCartCount();
  };

  window.removeFromCart = function (index) {
    const cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
    renderCart("cart");
    updateCartCount();
  };

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    // si otro script dispara este evento, refrescamos
    window.addEventListener("cart:updated", () => {
      renderCart("cart");
      updateCartCount();
    });

    updateCartCount();
    renderCart("cart");

    // Scroll suave al checkout si viene desde el drawer
    setTimeout(() => {
      if (location.hash === "#checkout") {
        const checkout = document.getElementById("checkout");
        if (checkout) {
          checkout.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    }, 120);
  });
})();
