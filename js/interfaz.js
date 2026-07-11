// Módulo de interfaz: construye el DOM, gestiona los eventos
// y actualiza la pantalla en cada cambio de estado.
var Dudo = window.Dudo || {};

Dudo.Interfaz = (function () {
  "use strict";

  var DIE_ICONS = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

  var RISK_CLASSES = [
    "risk-0-10", "risk-10-20", "risk-20-30", "risk-30-40", "risk-40-50",
    "risk-50-60", "risk-60-70", "risk-70-80", "risk-80-100"
  ];

  var state; // referencia al estado compartido (asignada en init)
  var repetidor = null; // temporizador para mantener presionado

  // Compatibilidad con navegadores antiguos: se usa un bucle for tradicional
  // en lugar del operador de propagación dentro de classList.remove
  function applyRiskColor(element, percentage) {
    for (var i = 0; i < RISK_CLASSES.length; i++) {
      element.classList.remove(RISK_CLASSES[i]);
    }
    var idx;
    if (percentage < 10) idx = 0;
    else if (percentage < 20) idx = 1;
    else if (percentage < 30) idx = 2;
    else if (percentage < 40) idx = 3;
    else if (percentage < 50) idx = 4;
    else if (percentage < 60) idx = 5;
    else if (percentage < 70) idx = 6;
    else if (percentage < 80) idx = 7;
    else idx = 8;
    element.classList.add(RISK_CLASSES[idx]);
  }

  function aplicarInsignia(element, porcentaje) {
    element.classList.remove("badge-imposible", "badge-segura");
    var textoAnterior = element.querySelector(".badge");
    if (textoAnterior) textoAnterior.parentNode.removeChild(textoAnterior);

    if (Dudo.Reglas.esImposible(porcentaje) || Dudo.Reglas.esSegura(porcentaje)) {
      var etiqueta = document.createElement("span");
      etiqueta.className = "badge";
      etiqueta.textContent = Dudo.Reglas.esImposible(porcentaje) ? "Imposible" : "Segura";
      element.appendChild(etiqueta);
    }
  }

  function limpiarMiDadosACero() {
    state.myDice = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  }

  function sumaMisDados() {
    var total = 0;
    for (var f = 1; f <= 6; f++) total += state.myDice[f];
    return total;
  }

  function limitarCantidadJugada() {
    var maximo = Dudo.Probabilidad.maxCantidadPosible(state);
    if (state.currentQty > maximo) state.currentQty = maximo;
    if (state.currentQty < 1) state.currentQty = 1;
  }

  // Crea un ícono de flecha (triángulo dibujado con CSS), el mismo
  // que usan los botones de "Dados en juego" y "Jugada actual", para
  // que "Mis dados" use el mismo tipo de botón en toda la aplicación
  function crearIconoFlecha(direccion) {
    var icono = document.createElement("span");
    icono.className = "arrow-icon " + direccion;
    icono.setAttribute("aria-hidden", "true");
    return icono;
  }

  // ---------- Construcción de la interfaz estática ----------

  function buildMyDiceGrid() {
    var contenedor = document.getElementById("myDiceGrid");
    contenedor.innerHTML = "";
    for (var f = 1; f <= 6; f++) {
      var columna = document.createElement("div");
      columna.className = "mydice-col";

      var icono = document.createElement("div");
      icono.className = "die-icon";
      icono.textContent = DIE_ICONS[f];
      icono.setAttribute("aria-hidden", "true");

      var botonSubir = document.createElement("button");
      botonSubir.className = "arrow-btn mini-btn up";
      botonSubir.appendChild(crearIconoFlecha("up"));
      botonSubir.setAttribute("aria-label", "Sumar un dado propio de cara " + f);
      registrarPulsacionContinua(botonSubir, (function (cara) {
        return function () {
          if (sumaMisDados() < state.totalDice) {
            state.myDice[cara] += 1;
            render();
          }
        };
      })(f));

      var contador = document.createElement("div");
      contador.className = "mydice-count";
      contador.id = "mydice-count-" + f;

      var botonBajar = document.createElement("button");
      botonBajar.className = "arrow-btn mini-btn down";
      botonBajar.appendChild(crearIconoFlecha("down"));
      botonBajar.setAttribute("aria-label", "Restar un dado propio de cara " + f);
      registrarPulsacionContinua(botonBajar, (function (cara) {
        return function () {
          if (state.myDice[cara] > 0) {
            state.myDice[cara] -= 1;
            render();
          }
        };
      })(f));

      columna.appendChild(icono);
      columna.appendChild(botonSubir);
      columna.appendChild(contador);
      columna.appendChild(botonBajar);
      contenedor.appendChild(columna);
    }
  }

  function buildFaceSelector() {
    var contenedor = document.getElementById("faceSelector");
    contenedor.innerHTML = "";
    contenedor.setAttribute("role", "radiogroup");
    contenedor.setAttribute("aria-label", "Selector de cara para la jugada actual");

    for (var f = 1; f <= 6; f++) {
      var opcion = document.createElement("div");
      opcion.className = "face-option";
      opcion.id = "face-opt-" + f;
      opcion.textContent = DIE_ICONS[f];
      opcion.setAttribute("data-face", f);
      opcion.setAttribute("role", "radio");
      opcion.setAttribute("aria-label", "Cara " + f);
      opcion.setAttribute("tabindex", (f === state.currentFace) ? "0" : "-1");

      opcion.addEventListener("click", (function (cara) {
        return function () {
          seleccionarCara(cara);
        };
      })(f));

      opcion.addEventListener("keydown", function (evento) {
        manejarTecladoSelectorCara(evento);
      });

      contenedor.appendChild(opcion);
    }
  }

  function seleccionarCara(cara) {
    state.currentFace = cara;
    render();
    var elemento = document.getElementById("face-opt-" + cara);
    if (elemento) elemento.focus();
  }

  function manejarTecladoSelectorCara(evento) {
    var actual = state.currentFace;
    var siguiente = actual;

    if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
      siguiente = (actual % 6) + 1;
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
      siguiente = (actual === 1) ? 6 : actual - 1;
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      seleccionarCara(actual);
      return;
    } else {
      return;
    }

    evento.preventDefault();
    seleccionarCara(siguiente);
  }

  function buildResponsesGrid() {
    var contenedor = document.getElementById("responsesGrid");
    contenedor.innerHTML = "";
    for (var f = 1; f <= 6; f++) {
      var celda = document.createElement("div");
      celda.className = "response-cell";
      celda.id = "resp-cell-" + f;

      var botonCantidad = document.createElement("button");
      botonCantidad.className = "qty-btn";
      botonCantidad.id = "resp-qty-" + f;
      botonCantidad.setAttribute("data-face", f);
      botonCantidad.addEventListener("click", (function (cara) {
        return function () {
          var nuevaCantidad = Dudo.Reglas.nextLegalQty(state.currentFace, state.currentQty, cara);
          var maximo = Dudo.Probabilidad.maxCantidadPosible(state);
          if (nuevaCantidad > maximo) nuevaCantidad = maximo;
          state.currentQty = nuevaCantidad;
          state.currentFace = cara;
          render();
        };
      })(f));

      var icono = document.createElement("div");
      icono.className = "resp-die-icon";
      icono.textContent = DIE_ICONS[f];
      icono.setAttribute("aria-hidden", "true");

      var probCon = document.createElement("div");
      probCon.className = "prob-row";
      probCon.id = "resp-con-" + f;

      var probSin = document.createElement("div");
      probSin.className = "prob-row";
      probSin.id = "resp-sin-" + f;

      celda.appendChild(botonCantidad);
      celda.appendChild(icono);
      celda.appendChild(probCon);
      celda.appendChild(probSin);
      contenedor.appendChild(celda);
    }
  }

  function buildDistributionChart() {
    var contenedor = document.getElementById("distChart");
    contenedor.innerHTML = "";
    contenedor.setAttribute("aria-hidden", "true"); // es un complemento visual
    for (var i = -3; i <= 3; i++) {
      var barra = document.createElement("div");
      barra.className = "dist-bar";
      barra.id = "dist-bar-" + (i + 3);
      contenedor.appendChild(barra);
    }
  }

  // ---------- Pulsación continua (mantener presionado) ----------

  function registrarPulsacionContinua(boton, accion) {
    boton.addEventListener("click", accion);

    var iniciar = function (evento) {
      if (evento) evento.preventDefault();
      detener();
      repetidor = setTimeout(function repetir() {
        accion();
        repetidor = setTimeout(repetir, 90);
      }, 400);
    };
    var detener = function () {
      if (repetidor) {
        clearTimeout(repetidor);
        repetidor = null;
      }
    };

    boton.addEventListener("mousedown", iniciar);
    boton.addEventListener("touchstart", iniciar, { passive: false });
    boton.addEventListener("mouseup", detener);
    boton.addEventListener("mouseleave", detener);
    boton.addEventListener("touchend", detener);
    boton.addEventListener("touchcancel", detener);
  }

  // ---------- Actualización dinámica de la interfaz ----------

  function render() {
    limitarCantidadJugada();

    // Panel 1
    document.getElementById("totalDiceDisplay").textContent = state.totalDice;

    // Panel 2
    for (var f = 1; f <= 6; f++) {
      document.getElementById("mydice-count-" + f).textContent = state.myDice[f];
    }

    // Panel 3
    document.getElementById("currentQtyDisplay").textContent = state.currentQty;
    for (var fi = 1; fi <= 6; fi++) {
      var opcion = document.getElementById("face-opt-" + fi);
      if (fi === state.currentFace) {
        opcion.classList.add("selected");
        opcion.setAttribute("aria-checked", "true");
        opcion.setAttribute("tabindex", "0");
      } else {
        opcion.classList.remove("selected");
        opcion.setAttribute("aria-checked", "false");
        opcion.setAttribute("tabindex", "-1");
      }
    }

    var pctSin = Dudo.Probabilidad.calcProbability(state, state.currentQty, state.currentFace, false);
    var pctCon = Dudo.Probabilidad.calcProbability(state, state.currentQty, state.currentFace, true);

    var elPctSin = document.getElementById("pctSin");
    var elPctCon = document.getElementById("pctCon");
    elPctSin.textContent = pctSin.toFixed(0) + "%";
    elPctCon.textContent = pctCon.toFixed(0) + "%";

    var dotSin = document.getElementById("dotSin");
    var dotCon = document.getElementById("dotCon");
    applyRiskColor(dotSin, pctSin);
    applyRiskColor(dotCon, pctCon);

    aplicarInsignia(elPctSin, pctSin);
    aplicarInsignia(elPctCon, pctCon);

    actualizarDistribucion();

    // Panel 4
    for (var f2 = 1; f2 <= 6; f2++) {
      var maximo = Dudo.Probabilidad.maxCantidadPosible(state);
      var cantidadLegal = Dudo.Reglas.nextLegalQty(state.currentFace, state.currentQty, f2);
      if (cantidadLegal > maximo) cantidadLegal = maximo;

      var botonCantidad = document.getElementById("resp-qty-" + f2);
      botonCantidad.textContent = cantidadLegal;
      botonCantidad.setAttribute(
        "aria-label",
        "Cambiar a " + cantidadLegal + " dados de cara " + f2
      );

      var rSin = Dudo.Probabilidad.calcProbability(state, cantidadLegal, f2, false);
      var rCon = Dudo.Probabilidad.calcProbability(state, cantidadLegal, f2, true);

      var elSin = document.getElementById("resp-sin-" + f2);
      var elCon = document.getElementById("resp-con-" + f2);
      elSin.textContent = rSin.toFixed(0) + "%";
      elCon.textContent = rCon.toFixed(0) + "%";
      elCon.setAttribute("aria-label", "Con tus dados: " + rCon.toFixed(0) + "%");
      elSin.setAttribute("aria-label", "Sin tus dados: " + rSin.toFixed(0) + "%");

      applyRiskColor(elSin, rSin);
      applyRiskColor(elCon, rCon);
      applyRiskColor(botonCantidad, rCon);
    }
  }

  function actualizarDistribucion() {
    var mayorProb = 0;
    var valores = [];
    for (var i = -3; i <= 3; i++) {
      var cantidad = state.currentQty + i;
      var prob = (cantidad < 0) ? 0 : Dudo.Probabilidad.calcExactProbability(state, cantidad, state.currentFace, true);
      valores.push(prob);
      if (prob > mayorProb) mayorProb = prob;
    }
    if (mayorProb <= 0) mayorProb = 1;

    for (var j = -3; j <= 3; j++) {
      var barra = document.getElementById("dist-bar-" + (j + 3));
      var altura = Math.max(2, (valores[j + 3] / mayorProb) * 100);
      barra.style.height = altura + "%";
      if (j === 0) {
        barra.classList.add("current");
      } else {
        barra.classList.remove("current");
      }
    }
  }

  // ---------- Modo oscuro ----------

  function alternarModoOscuro() {
    document.documentElement.classList.toggle("dark-mode");
    var boton = document.getElementById("themeToggle");
    var activo = document.documentElement.classList.contains("dark-mode");
    boton.setAttribute("aria-pressed", activo ? "true" : "false");
    boton.textContent = activo ? "☀️ Modo claro" : "🌙 Modo oscuro";
  }

  // ---------- Eventos generales ----------

  function registrarEventosGenerales() {
    registrarPulsacionContinua(document.getElementById("totalUp"), function () {
      state.totalDice += 1;
      limpiarMiDadosACero();
      state.currentQty = Math.floor(state.totalDice / 3);
      if (state.currentQty < 1) state.currentQty = 1;
      render();
    });

    registrarPulsacionContinua(document.getElementById("totalDown"), function () {
      if (state.totalDice > 1) {
        state.totalDice -= 1;
        limpiarMiDadosACero();
        state.currentQty = Math.floor(state.totalDice / 3);
        if (state.currentQty < 1) state.currentQty = 1;
        render();
      }
    });

    registrarPulsacionContinua(document.getElementById("qtyUp"), function () {
      var maximo = Dudo.Probabilidad.maxCantidadPosible(state);
      if (state.currentQty < maximo) {
        state.currentQty += 1;
        render();
      }
    });

    registrarPulsacionContinua(document.getElementById("qtyDown"), function () {
      if (state.currentQty > 1) {
        state.currentQty -= 1;
        render();
      }
    });

    document.getElementById("themeToggle").addEventListener("click", alternarModoOscuro);
  }

  function init(estadoInicial) {
    state = estadoInicial;
    buildMyDiceGrid();
    buildFaceSelector();
    buildResponsesGrid();
    buildDistributionChart();
    registrarEventosGenerales();
    render();
  }

  return { init: init, render: render };
})();
