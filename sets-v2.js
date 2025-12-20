/* =========================================================
   NEW — SETS V2 (una sola opción)
   - Convierte checkboxes de .opciones-set en selección única
   ========================================================= */

(() => {
  "use strict";

  function initSingleChoiceSets() {
    const sets = document.querySelectorAll(".producto-set .opciones-set");
    sets.forEach((wrap) => {
      const inputs = Array.from(wrap.querySelectorAll('input[type="checkbox"], input[type="radio"]'));
      if (inputs.length <= 1) return;

      inputs.forEach((inp) => {
        inp.addEventListener("change", () => {
          if (!inp.checked) return;

          // Desmarcar todos menos el seleccionado
          inputs.forEach((other) => {
            if (other !== inp) other.checked = false;
          });

          // Disparar evento por compatibilidad con tu script de total (si existe)
          const evt = new Event("input", { bubbles: true });
          inp.dispatchEvent(evt);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initSingleChoiceSets);
})();
