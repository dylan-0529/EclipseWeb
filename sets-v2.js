/* =========================================================
   E C L I P S E — SETS V2 (multi-selección + total + favoritos)

   ✅ Qué corrige
   - Los sets (ej: Set Aura / Set Candongas) ahora permiten seleccionar varias opciones.
   - Si hay una opción "Set completo", se comporta como exclusiva:
       * Si seleccionas "Set completo", desmarca las demás.
       * Si seleccionas cualquier otra, desmarca "Set completo".
   - Calcula el total en vivo por cada .producto-set.
   - addSetToCart() global agrega al carrito cada item seleccionado con la imagen correcta.
   - Agrega el corazón de Favoritos en los .producto-set (usa localStorage("wishlist")).

   Requiere:
   - carrito.js (para contador) y/o tienda-v2.js (para addToCart y toast). Si existen, los usa.
   ========================================================= */

(() => {
  "use strict";

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  function formatCOP(value) {
    try {
      return "$" + Number(value || 0).toLocaleString("es-CO");
    } catch {
      return "$" + (value || 0);
    }
  }

  // ---- Wishlist local (compat con tienda-v2.js) ----
  function getWishlist() {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
  }
  function setWishlist(list) {
    localStorage.setItem("wishlist", JSON.stringify(list));
  }
  function isInWishlist(nombre) {
    return getWishlist().some((x) => x.nombre === nombre);
  }

  // Si existe toast global, lo usamos. Si no, fallback a alert.
  function notify(msg, type = "info") {
    if (typeof window.toast === "function") window.toast(msg, type);
    else alert(msg.replace(/<[^>]*>/g, ""));
  }

  // Busca si este set tiene una opción "Set completo"
  function findFullSetInput(setEl) {
    const inputs = $$("input.item-set[type=\"checkbox\"], input.item-set[type=\"radio\"]", setEl);
    const full = inputs.find((inp) => {
      const name = (inp.dataset.nombre || "").toLowerCase();
      const label = (inp.closest("label")?.textContent || "").toLowerCase();
      return name.includes("set completo") || label.includes("set completo");
    });
    return full || null;
  }

  function computeSetTotal(setEl) {
    const checked = $$("input.item-set:checked", setEl);
    const total = checked.reduce((acc, inp) => acc + (parseInt(inp.value, 10) || 0), 0);

    const precioEl = $(".precio-set", setEl);
    if (precioEl) precioEl.textContent = `Total: ${formatCOP(total)}`;
    return total;
  }

  function bindSetLogic(setEl) {
    const inputs = $$("input.item-set[type=\"checkbox\"], input.item-set[type=\"radio\"]", setEl);
    if (!inputs.length) return;

    const fullInp = findFullSetInput(setEl);

    inputs.forEach((inp) => {
      inp.addEventListener("change", () => {
        // Regla: "Set completo" exclusivo
        if (fullInp) {
          if (inp === fullInp && fullInp.checked) {
            // Seleccionó set completo: desmarca los demás
            inputs.forEach((o) => {
              if (o !== fullInp) o.checked = false;
            });
          } else if (inp !== fullInp && inp.checked) {
            // Seleccionó otro: desmarca set completo
            fullInp.checked = false;
          }
        }

        computeSetTotal(setEl);
      });
    });

    // Total inicial
    computeSetTotal(setEl);
  }

  // ---- Favoritos en SETS ----
  function ensureSetWishButton(setEl) {
    const titleEl = $(".producto-set-detalles h3", setEl) || $("h3", setEl);
    const imgEl = $(".producto-set-imagen img, img", setEl);
    if (!titleEl || !imgEl) return;

    const nombre = titleEl.textContent.trim();
    const imagen = imgEl.getAttribute("src") || "";

    // Precio de referencia para wishlist (si existe Total: $0, igual sirve)
    const precioText = $(".precio-set", setEl)?.textContent || "";
    const precio = parseInt(precioText.replace(/\D/g, ""), 10) || 0;

    const imgWrap = $(".producto-set-imagen", setEl) || setEl;
    if ($(".wish-btn", imgWrap)) return;

    const wish = document.createElement("button");
    wish.className = "wish-btn";
    wish.type = "button";
    wish.setAttribute("aria-label", "Agregar a favoritos");
    wish.style.position = "absolute";
    wish.style.top = "10px";
    wish.style.right = "10px";

    // asegurar contenedor posicionable
    const comp = window.getComputedStyle(imgWrap);
    if (comp.position === "static") imgWrap.style.position = "relative";

    const sync = () => {
      const inWish = isInWishlist(nombre);
      wish.innerHTML = inWish ? `<i class="fa-solid fa-heart"></i>` : `<i class="fa-regular fa-heart"></i>`;
      wish.classList.toggle("wish-btn--active", inWish);
    };
    sync();

    wish.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const list = getWishlist();
      const exists = list.find((x) => x.nombre === nombre);

      if (exists) {
        setWishlist(list.filter((x) => x.nombre !== nombre));
        notify(`Quitado de favoritos: <b>${nombre}</b>`, "info");
      } else {
        list.push({ nombre, precio, imagen });
        setWishlist(list);
        notify(`Guardado en favoritos: <b>${nombre}</b>`, "ok");
      }
      sync();
    });

    imgWrap.appendChild(wish);
  }

  // ---- addSetToCart global ----
  window.addSetToCart = function addSetToCart(button) {
    const setEl = button?.closest?.(".producto-set");
    if (!setEl) return;

    const selected = $$("input.item-set:checked", setEl);
    if (!selected.length) {
      notify("Selecciona al menos una opción del set.", "info");
      return;
    }

    // Imagen del set (usar atributo src, NO .src para evitar URL absoluta)
    const imgEl = $(".producto-set-imagen img, img", setEl);
    const imagePath = imgEl ? (imgEl.getAttribute("src") || "") : "";

    // Usa addToCart global (viene de tienda-v2.js). Si no existe, fallback básico
    const add =
      typeof window.addToCart === "function"
        ? window.addToCart
        : (nombre, precio, imagen) => {
            const cart = JSON.parse(localStorage.getItem("carrito")) || [];
            const idx = cart.findIndex((x) => x.nombre === nombre);
            if (idx >= 0) cart[idx].cantidad = (Number(cart[idx].cantidad) || 1) + 1;
            else cart.push({ nombre, precio, imagen, cantidad: 1 });
            localStorage.setItem("carrito", JSON.stringify(cart));
          };

    selected.forEach((inp) => {
      const nombre = (inp.dataset.nombre || "").trim() || "Producto";
      const precio = parseInt(inp.value, 10) || 0;
      add(nombre, precio, imagePath, 1);
    });

    // Actualiza contador si existe
    if (typeof window.updateCartCount === "function") window.updateCartCount();

    notify("Productos agregados al carrito ✅", "ok");
  };

  function init() {
    const sets = $$(".producto-set");
    sets.forEach((setEl) => {
      bindSetLogic(setEl);
      ensureSetWishButton(setEl);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
