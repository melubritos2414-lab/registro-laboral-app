// =====================
// 1) CLAVES LOCALSTORAGE
// =====================
const CLAVE_NOMBRE = "registro_nombre";
const CLAVE_REGISTROS = "registro_registros";

// =====================
// 2) CAPTURAR ELEMENTOS
// =====================

// A) Nombre (una sola vez)
const nombreInput = document.getElementById("nombre");
const guardarNombreBtn = document.getElementById("guardarNombreBtn");

// B) Registro diario
const puestoInput = document.getElementById("puesto"); // Lugar
const fechaInput = document.getElementById("fecha_inicio");

const guardarBtn = document.getElementById("guardarBtn");
const eliminarBtn = document.getElementById("eliminarBtn");
const imprimirBtn = document.getElementById("imprimirBtn");

// Export/Import
const exportarBtn = document.getElementById("exportarBtn");
const importarInput = document.getElementById("importarInput");
const importarBtn = document.getElementById("importarBtn");

// Filtro mes + tabla
const mesFiltro = document.getElementById("mesFiltro");
const filtrarMesBtn = document.getElementById("filtrarMesBtn");
const tablaBody = document.getElementById("tablaBody");

// =====================
// 3) ESTADO EN MEMORIA
// =====================
let registros = [];

// =====================
// 4) FUNCIONES ÚTILES
// =====================
function guardarEnStorage() {
  localStorage.setItem(CLAVE_REGISTROS, JSON.stringify(registros));
}

function cargarDesdeStorage() {
  const nombre = localStorage.getItem(CLAVE_NOMBRE);
  if (nombre) {
    nombreInput.value = nombre;
    nombreInput.disabled = true;
    guardarNombreBtn.disabled = true;
  }

  const datos = localStorage.getItem(CLAVE_REGISTROS);
  registros = datos ? JSON.parse(datos) : [];
}

// yyyy-mm-dd -> dd/mm/yyyy (bonito)
function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

// Devuelve "yyyy-mm" desde "yyyy-mm-dd"
function obtenerMesISO(fechaISO) {
  return fechaISO.slice(0, 7);
}

function limpiarCamposDiarios() {
  puestoInput.value = "";
  fechaInput.value = "";
}

// =====================
// 5) RENDER TABLA (con filtro)
// =====================
function renderTabla(mesSeleccionado = "") {
  tablaBody.innerHTML = "";

  // Si hay filtro, mostramos sólo ese mes
  const lista = mesSeleccionado
    ? registros.filter(r => obtenerMesISO(r.fecha) === mesSeleccionado)
    : registros;

  // Ordenar por fecha asc
  lista.sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2">No hay registros todavía.</td>`;
    tablaBody.appendChild(tr);
    return;
  }

  for (const r of lista) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatearFecha(r.fecha)}</td>
      <td>${r.lugar}</td>
    `;
    tablaBody.appendChild(tr);
  }
}

// =====================
// 6) EVENTOS
// =====================

// A) Guardar nombre (una sola vez)
guardarNombreBtn.addEventListener("click", () => {
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    alert("Escribe el Nombre y Apellido.");
    return;
  }

  localStorage.setItem(CLAVE_NOMBRE, nombre);

  // bloquear para que sea una sola vez
  nombreInput.disabled = true;
  guardarNombreBtn.disabled = true;

  alert("Nombre guardado ✅");
});

// B) Guardar registro diario
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

  // Agregar registro
  registros.push({ fecha, lugar });

  guardarEnStorage();
  renderTabla(mesFiltro.value); // respeta el filtro si hay

  limpiarCamposDiarios();
});

// Eliminar TODO (registros + nombre)
eliminarBtn.addEventListener("click", () => {
  const ok = confirm("¿Seguro que quieres eliminar TODO? (Nombre + registros)");
  if (!ok) return;

  localStorage.removeItem(CLAVE_NOMBRE);
  localStorage.removeItem(CLAVE_REGISTROS);

  registros = [];
  renderTabla("");

  // desbloquear nombre
  nombreInput.disabled = false;
  guardarNombreBtn.disabled = false;
  nombreInput.value = "";

  limpiarCamposDiarios();
  mesFiltro.value = "";

  alert("Eliminado ✅");
});

// Imprimir (idealmente imprime sólo lo que está en pantalla / tabla)
imprimirBtn.addEventListener("click", () => {
const nombre = localStorage.getItem(CLAVE_NOMBRE) || "";
document.getElementById("printNombre").textContent = nombre;

const valorMes = mesFiltro.value || ""; // "2026-01"
let textoMes = valorMes;

if (valorMes.includes("-")) {
  const [yyyy, mm] = valorMes.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  textoMes = `${meses[parseInt(mm, 10) - 1]} de ${yyyy}`;
}

document.getElementById("printMes").textContent = textoMes;

window.print();
});

// Filtrar por mes
filtrarMesBtn.addEventListener("click", () => {
  renderTabla(mesFiltro.value);
});

// =====================
// 7) EXPORT / IMPORT JSON
// =====================

exportarBtn.addEventListener("click", () => {
  const nombre = localStorage.getItem(CLAVE_NOMBRE) || "";

  const paquete = {
    nombre,
    registros
  };

  const blob = new Blob([JSON.stringify(paquete, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "registro-laboral.json";
  a.click();

  URL.revokeObjectURL(url);
});


importarBtn.addEventListener("click", () => {
  const file = importarInput.files[0];
  if (!file) {
    alert("Selecciona un archivo .json primero.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Validación simple
      if (!data || !Array.isArray(data.registros)) {
        alert("El JSON no tiene el formato correcto.");
        return;
      }

      // Guardar nombre si viene en el json
      if (data.nombre && data.nombre.trim()) {
        localStorage.setItem(CLAVE_NOMBRE, data.nombre.trim());
        nombreInput.value = data.nombre.trim();
        nombreInput.disabled = true;
        guardarNombreBtn.disabled = true;
      }

      // Reemplazar registros
      registros = data.registros.map(r => ({
        fecha: r.fecha,
        lugar: r.lugar
      }));

      guardarEnStorage();
      renderTabla(mesFiltro.value);

      alert("Importado ✅");

    } catch (err) {
      alert("No se pudo leer el JSON. ¿Está bien formado?");
    }
  };

  reader.readAsText(file);
});

// =====================
// 8) ARRANQUE
// =====================
document.addEventListener("DOMContentLoaded", () => {
  cargarDesdeStorage();

  // Opcional: poner por defecto el mes actual en el filtro
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const yyyy = hoy.getFullYear();
  mesFiltro.value = `${yyyy}-${mm}`;

  renderTabla(mesFiltro.value);
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}


