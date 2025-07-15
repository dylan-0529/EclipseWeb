// Agrega producto al carrito (con imagen)
function addToCart(nombre, precio, imagen) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const index = carrito.findIndex(p => p.nombre === nombre);
  if (index !== -1) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({ nombre, precio, cantidad: 1, imagen });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  updateCartCount();
  alert(`${nombre} agregado al carrito.`);
}

// Renderiza carrito en carrito.html
function renderCart(containerId) {
  const el = document.getElementById(containerId);
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (!el) return;

  if (carrito.length === 0) {
    el.innerHTML = `<p style="text-align:center;">Carrito vacío</p>`;
    return;
  }

  let total = 0;
let html = `
  <table style="width:100%; border-collapse:collapse; margin-top:30px;">
    <thead>
      <tr style="border-bottom: 2px solid #ccc;">
        <th style="padding: 10px; text-align: left;">Producto</th>
        <th style="padding: 10px; text-align: center;">Imagen</th>
        <th style="padding: 10px; text-align: center;">Cantidad</th>
        <th style="padding: 10px; text-align: center;">Precio</th>
      </tr>
    </thead>
      <tbody>`;

  carrito.forEach((item, i) => {
    total += item.precio * item.cantidad;
    html += `
<tr>
  <td style="padding: 10px; text-align: left;">${item.nombre}</td>
  <td style="padding: 10px; text-align: center;">
    <img src="${item.imagen}" alt="${item.nombre}" style="width: 80px; height: auto; border-radius: 6px;" />
  </td>
  <td style="padding: 10px; text-align: center;">
    <button class="boton-cantidad" onclick="changeQuantity(${i}, -1)">-</button>
    <span style="margin: 0 10px;">${item.cantidad}</span>
    <button class="boton-cantidad" onclick="changeQuantity(${i}, 1)">+</button>
    <button class="boton-cantidad" onclick="removeFromCart(${i})" style="margin-left: 8px;">
      <i class="fas fa-trash"></i>
    </button>
  </td>
  <td style="padding: 10px; text-align: center;">
    $${(item.precio * item.cantidad).toLocaleString()}
  </td>
      </tr>`;
  });

  html += `
      </tbody>
    </table>

    <!-- Línea final estética -->
    <hr style="border: 1px solid #ccc; margin-top: 30px;">

    <!-- Total -->
    <h3 style="margin-top: 20px; text-align:right;">Total: $${total.toLocaleString()}</h3>

    <!-- Botón de WhatsApp -->
    <div style="text-align:center; margin-top: 30px;">
      <button onclick="sendOrderToWhatsApp()" class="boton-carrito-elegante">
        <i class="fab fa-whatsapp"></i> Enviar pedido por WhatsApp
      </button>
    </div>`;

  el.innerHTML = html;
}

// Cambia la cantidad de un producto
function changeQuantity(index, delta) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (!carrito[index]) return;

  carrito[index].cantidad += delta;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCart("cart");
  updateCartCount();
}

// Elimina producto completamente
function removeFromCart(index) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCart("cart");
  updateCartCount();
}

// Enviar carrito por WhatsApp
function sendOrderToWhatsApp() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  let mensaje = "*Hola! Quiero hacer este pedido:*%0A";
  carrito.forEach(p => {
    mensaje += `• ${p.nombre} x${p.cantidad} - $${(p.precio * p.cantidad).toLocaleString()}%0A`;
  });

  const total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  mensaje += `%0A*Total:* $${total.toLocaleString()}`;

  const numero = "573001234567"; // Cambia por tu número real
  const url = `https://wa.me/${numero}?text=${mensaje}`;
  window.open(url, "_blank");

  // No borra el carrito
}

// Actualiza el contador flotante
function updateCartCount() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const contador = document.getElementById("cart-count");
  if (contador) {
    contador.textContent = totalCantidad;
    contador.classList.remove("pop");
    void contador.offsetWidth; // Reflow
    contador.classList.add("pop");
  }
}

// Ejecutar contador al cargar
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
