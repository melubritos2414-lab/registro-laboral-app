// =======================
// 1) CLAVES LOCALSTORAGE
// =======================
const CLAVE_NOMBRE = "registro_nombre";
const CLAVE_REGISTROS = "registro_registros";

// =======================
// 2) CAPTURAR ELEMENTOS
// =======================
const nombreInput = document.getElementById("nombre");
const guardarNombreBtn = document.getElementById("guardarNombreBtn");

const puestoInput = document.getElementById("puesto");        // Lugar
const fechaInput = document.getElementById("fecha_inicio");    // Fecha

const guardarBtn = document.getElementById("guardarBtn");
const imprimirBtn = document.getElementById("imprimirBtn");
const eliminarBtn = document.getElementById("eliminarBtn");    // ELIMINAR TODO

const exportarBtn = document.getElementById("exportarBtn");
const importarInput = document.getElementById("importarInput");
const importarBtn = document.getElementById("importarBtn");

const mesFiltro = document.getElementById("mesFiltro");
const filtrarMesBtn = document.getElementById("filtrarMesBtn");

const tablaBody = document.getElementById("tablaBody");

// Para imprimir
const printNombre = document.getElementById("printNombre");
const printMes = document.getElementById("printMes");

// =======================
// 3) ESTADO EN MEMORIA
// =======================
let registros = [];
let editandoId = null; // si no es null => estamos editando una fila

// =======================
// 4) FUNCIONES ÚTILES
// =======================
function generarId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function guardarEnStorage() {
  localStorage.setItem(CLAVE_REGISTROS, JSON.stringify(registros));
}

function cargarDesdeStorage() {
  const data = localStorage.getItem(CLAVE_REGISTROS);
  registros = data ? JSON.parse(data) : [];
}

function limpiarCamposDiarios() {
  puestoInput.value = "";
  fechaInput.value = "";
  editandoId = null;
  guardarBtn.textContent = "Guardar"; // vuelve a normal
}

function obtenerMesISO(fechaISO) {
  // "2026-01-13" -> "2026-01"
  if (!fechaISO || fechaISO.length < 7) return "";
  return fechaISO.slice(0, 7);
}

function formatearFecha(fechaISO) {
  // "2026-01-13" -> "13/01/2026"
  if (!fechaISO) return "";
  const [yyyy, mm, dd] = fechaISO.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function textoMesDesdeISO(yyyyMM) {
  // "2026-01" -> "enero de 2026"
  if (!yyyyMM || !yyyyMM.includes("-")) return "";
  const [yyyy, mm] = yyyyMM.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const idx = parseInt(mm, 10) - 1;
  if (idx < 0 || idx > 11) return yyyyMM;
  return `${meses[idx]} de ${yyyy}`;
}

// =======================
// 5) RENDER TABLA (con filtro)
// =======================
function renderTabla(mesSeleccionado = "") {
  tablaBody.innerHTML = "";

  // filtrar
  let lista = mesSeleccionado
    ? registros.filter(r => obtenerMesISO(r.fecha) === mesSeleccionado)
    : [...registros];

  // ordenar por fecha asc
  lista.sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3">No hay registros todavía.</td>`;
    tablaBody.appendChild(tr);
    return;
  }

  lista.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <button class="btnEditar" data-id="${r.id}">✏️</button>
        <button class="btnBorrar" data-id="${r.id}">🗑️</button>
      </td>
      <td>${formatearFecha(r.fecha)}</td>
      <td>${r.lugar}</td>
    `;

    // EDITAR
    tr.querySelector(".btnEditar").addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const reg = registros.find(x => x.id === id);
      if (!reg) return;

      puestoInput.value = reg.lugar;
      fechaInput.value = reg.fecha;
      editandoId = id;
      guardarBtn.textContent = "Guardar cambios";
    });

    // BORRAR SOLO ESA FILA
    tr.querySelector(".btnBorrar").addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const ok = confirm("¿Borrar SOLO este registro?");
      if (!ok) return;

      registros = registros.filter(x => x.id !== id);
      guardarEnStorage();
      renderTabla(mesFiltro.value);
    });

    tablaBody.appendChild(tr);
  });
}

// =======================
// 6) EVENTOS
// =======================

// A) Guardar nombre (una sola vez)
guardarNombreBtn.addEventListener("click", () => {
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    alert("Escribe el Nombre y Apellido.");
    return;
  }
  localStorage.setItem(CLAVE_NOMBRE, nombre);

  // bloquear
  nombreInput.disabled = true;
  guardarNombreBtn.disabled = true;

  alert("Nombre guardado ✅");
});

// B) Guardar o Editar registro diario
guardarBtn.addEventListener("click", () => {
  const nombreGuardado = localStorage.getItem(CLAVE_NOMBRE);
  if (!nombreGuardado) {
    alert("Primero guarda el Nombre y Apellido (una sola vez).");
    return;
  }

  const lugar = puestoInput.value.trim();
  const fecha = fechaInput.value;

  if (!lugar || !fecha) {
    alert("Completa Lugar y Fecha.");
    return;
  }

  // Si estamos editando => actualizar
  if (editandoId) {
    const idx = registros.findIndex(x => x.id === editandoId);
    if (idx !== -1) {
      registros[idx].lugar = lugar;
      registros[idx].fecha = fecha;
    }
  } else {
    // nuevo
    registros.push({ id: generarId(), fecha, lugar });
  }

  guardarEnStorage();
  renderTabla(mesFiltro.value);
  limpiarCamposDiarios();

  alert("Registro guardado ✅");
});

// C) ELIMINAR TODO (botón grande)
eliminarBtn.addEventListener("click", () => {
  const ok = confirm("¿Seguro que quieres eliminar TODO? (Nombre + registros)");
  if (!ok) return;

  localStorage.removeItem(CLAVE_NOMBRE);
  localStorage.removeItem(CLAVE_REGISTROS);

  registros = [];
  renderTabla(mesFiltro.value);

  // desbloquear nombre
  nombreInput.disabled = false;
  guardarNombreBtn.disabled = false;
  nombreInput.value = "";

  limpiarCamposDiarios();
  mesFiltro.value = "";

  alert("Todo eliminado ✅");
});

// D) Filtrar por mes
filtrarMesBtn.addEventListener("click", () => {
  renderTabla(mesFiltro.value);
});

// E) Imprimir
imprimirBtn.addEventListener("click", () => {
  const nombre = localStorage.getItem(CLAVE_NOMBRE) || "";
  printNombre.textContent = nombre;

  const mes = mesFiltro.value || "";
  printMes.textContent = textoMesDesdeISO(mes);

  window.print();
});

// F) Exportar / Importar
exportarBtn.addEventListener("click", () => {
  const nombre = localStorage.getItem(CLAVE_NOMBRE) || "";
  const paquete = { nombre, registros };

  const blob = new Blob([JSON.stringify(paquete, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "registro_laboral.json";
  a.click();

  URL.revokeObjectURL(url);
});

importarBtn.addEventListener("click", async () => {
  const file = importarInput.files?.[0];
  if (!file) {
    alert("Selecciona un archivo JSON.");
    return;
  }

  try {
    const texto = await file.text();
    const data = JSON.parse(texto);

    if (!data || !Array.isArray(data.registros)) {
      alert("El archivo no es un JSON válido.");
      return;
    }

    // importar nombre
    if (typeof data.nombre === "string" && data.nombre.trim()) {
      localStorage.setItem(CLAVE_NOMBRE, data.nombre.trim());
      nombreInput.value = data.nombre.trim();
      nombreInput.disabled = true;
      guardarNombreBtn.disabled = true;
    }

    // importar registros (asegurar id)
    registros = data.registros.map(r => ({
      id: r.id || generarId(),
      fecha: r.fecha,
      lugar: r.lugar
    }));

    guardarEnStorage();
    renderTabla(mesFiltro.value);
    alert("Importado ✅");

  } catch (e) {
    alert("Error al importar: el archivo no es JSON válido.");
  }
});

// =======================
// 7) INICIO
// =======================
(function init() {
  // poner mes actual por defecto
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const yyyy = hoy.getFullYear();
  mesFiltro.value = `${yyyy}-${mm}`;

  // cargar nombre
  const nombre = localStorage.getItem(CLAVE_NOMBRE);
  if (nombre) {
    nombreInput.value = nombre;
    nombreInput.disabled = true;
    guardarNombreBtn.disabled = true;
  }

  cargarDesdeStorage();
  renderTabla(mesFiltro.value);
})();
