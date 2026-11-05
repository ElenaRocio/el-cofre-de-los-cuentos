// =====================================================
//  El cofre de los Cuentos - script.js
//  1. Carga los cuentos desde cuentos.json y crea las tarjetas
//  2. Filtra los cuentos por edad
//  3. Muestra los videos en una ventana emergente
//  4. Valida y envía el formulario sin salir de la página
// =====================================================

const lista = document.getElementById("lista-cuentos");
const botonesFiltro = document.querySelectorAll(".filtro");
const modal = document.getElementById("modal-video");
const modalTitulo = document.getElementById("modal-titulo");
const modalVideo = modal.querySelector(".modal-video");

let cuentos = []; // acá guardamos los cuentos que vienen del JSON


// ---------- 1. Cargar los cuentos ----------

async function cargarCuentos() {
  try {
    const respuesta = await fetch("cuentos.json");
    if (!respuesta.ok) throw new Error("No se encontró cuentos.json");
    cuentos = await respuesta.json();
    mostrarCuentos(cuentos);
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<p class="cargando">No pudimos abrir el cofre 😢. Probá recargar la página.</p>`;
  }
}

// Crea el HTML de una tarjeta a partir de un objeto cuento
function crearTarjeta(cuento) {
  const tieneVideo = Boolean(cuento.videoId);

  const boton = tieneVideo
    ? `<button type="button" class="btn btn-sm" data-video="${cuento.videoId}" data-titulo="${cuento.titulo}">▶ Ver cuento</button>`
    : `<span class="proximamente">🌟 Próximamente</span>`;

  return `
    <article class="card">
      <div class="card-icon" aria-hidden="true">${cuento.icono}</div>
      <h3>${cuento.titulo}</h3>
      <p>${cuento.descripcion}</p>
      <span class="duracion">🕒 ${cuento.minutos} min · ${cuento.edadMin} a ${cuento.edadMax} años</span>
      ${boton}
    </article>
  `;
}

function mostrarCuentos(listaDeCuentos) {
  if (listaDeCuentos.length === 0) {
    lista.innerHTML = `<p class="cargando">Todavía no hay cuentos para esta edad. ¡Pronto vamos a sumar más! 🌙</p>`;
    return;
  }
  lista.innerHTML = listaDeCuentos.map(crearTarjeta).join("");
}


// ---------- 2. Filtro por edad ----------
// Un cuento aparece si su rango de edad se cruza con el rango del botón.
// Ejemplo: un cuento de 3 a 6 años aparece en "2 a 4" y en "4 a 6",
// pero no en "6 a 8" (solo se tocan en el borde, en los 6 años).

botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    const min = Number(boton.dataset.min);
    const max = Number(boton.dataset.max);

    const filtrados = cuentos.filter(
      (cuento) => cuento.edadMin < max && cuento.edadMax > min
    );
    mostrarCuentos(filtrados);

    // Marcar visualmente el botón activo
    botonesFiltro.forEach((b) => {
      b.classList.remove("activo");
      b.setAttribute("aria-pressed", "false");
    });
    boton.classList.add("activo");
    boton.setAttribute("aria-pressed", "true");
  });
});


// ---------- 3. Ventana de video ----------
// Usamos "delegación de eventos": escuchamos los clics en todo el documento
// y vemos si el clic fue en algo con data-video. Así funciona también
// con las tarjetas que se crean después con JavaScript.

document.addEventListener("click", (evento) => {
  const elemento = evento.target.closest("[data-video]");
  if (elemento) abrirVideo(elemento.dataset.video, elemento.dataset.titulo);
});

function abrirVideo(videoId, titulo) {
  modalTitulo.textContent = titulo;
  modalVideo.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0"
      title="${titulo}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>`;
  modal.showModal();
}

function cerrarVideo() {
  modal.close();
}

// Al cerrar (con la X, con Escape o clic afuera) borramos el iframe
// para que el video deje de sonar.
modal.addEventListener("close", () => {
  modalVideo.innerHTML = "";
});

modal.querySelector(".modal-cerrar").addEventListener("click", cerrarVideo);

// Clic en el fondo oscuro (fuera del contenido) también cierra
modal.addEventListener("click", (evento) => {
  if (evento.target === modal) cerrarVideo();
});


// ---------- 4. Formulario de contacto ----------

const form = document.getElementById("form-contacto");
const estado = document.getElementById("form-estado");

// Reglas de validación: cada campo tiene su función que devuelve
// un mensaje de error, o "" si está todo bien.
const reglas = {
  nombre: (valor) =>
    valor.trim().length < 2 ? "Contanos tu nombre (al menos 2 letras)." : "",
  email: (valor) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
      ? ""
      : "Revisá el correo, por ejemplo: nombre@gmail.com",
  mensaje: (valor) =>
    valor.trim().length < 10 ? "Escribí un mensaje de al menos 10 caracteres." : "",
};

function validarCampo(campo) {
  const mensajeError = reglas[campo.name](campo.value);
  const textoError = document.getElementById(`error-${campo.name}`);
  textoError.textContent = mensajeError;
  campo.classList.toggle("invalido", mensajeError !== "");
  campo.setAttribute("aria-invalid", mensajeError !== "");
  return mensajeError === "";
}

// Validamos cada campo cuando la persona sale de él
form.querySelectorAll("input, textarea").forEach((campo) => {
  campo.addEventListener("blur", () => validarCampo(campo));
  // y si ya tenía error, lo revisamos mientras escribe
  campo.addEventListener("input", () => {
    if (campo.classList.contains("invalido")) validarCampo(campo);
  });
});

form.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // evitamos que el navegador cambie de página

  const campos = [...form.querySelectorAll("input, textarea")];
  const todoBien = campos.map(validarCampo).every(Boolean);
  if (!todoBien) {
    form.querySelector(".invalido").focus();
    return;
  }

  const boton = form.querySelector("button[type='submit']");
  boton.disabled = true;
  boton.textContent = "Enviando...";
  estado.className = "form-estado";
  estado.textContent = "";

  try {
    const respuesta = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (!respuesta.ok) throw new Error("Error de Formspree");

    form.reset();
    estado.classList.add("ok");
    estado.textContent = "¡Gracias! Recibimos tu mensaje 💛";
  } catch (error) {
    console.error(error);
    estado.classList.add("fallo");
    estado.textContent = "Uy, no se pudo enviar. Probá de nuevo en un ratito.";
  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar mensaje ✨";
  }
});


// ¡Arrancamos!
cargarCuentos();
