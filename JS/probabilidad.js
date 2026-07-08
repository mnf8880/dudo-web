// Módulo de cálculo de probabilidades.
// Se expone en el espacio de nombres global "Dudo" para mantener
// compatibilidad con navegadores antiguos (sin módulos ES).
var Dudo = window.Dudo || {};

Dudo.Probabilidad = (function () {
  "use strict";

  function combin(n, k) {
    if (k < 0 || k > n) return 0;
    if (k > n - k) k = n - k;
    var resultado = 1;
    for (var i = 0; i < k; i++) {
      resultado = resultado * (n - i) / (i + 1);
    }
    return resultado;
  }

  // Probabilidad puntual P(X = k) para una distribución binomial(n, p)
  function binomPMF(n, k, p) {
    if (k < 0 || k > n) return 0;
    return combin(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  // Probabilidad acumulada P(X >= k) para una distribución binomial(n, p)
  function binomCDFAtLeast(n, k, p) {
    if (k <= 0) return 1;
    if (k > n) return 0;
    var suma = 0;
    for (var i = k; i <= n; i++) {
      suma += binomPMF(n, i, p);
    }
    if (suma > 1) suma = 1;
    if (suma < 0) suma = 0;
    return suma;
  }

  function dadosOcultos(state) {
    var propios = 0;
    for (var f = 1; f <= 6; f++) {
      propios += state.myDice[f];
    }
    return state.totalDice - propios;
  }

  function probabilidadBase(face) {
    return (face === 1) ? (1 / 6) : (1 / 3);
  }

  // Cantidad de dados ocultos que se necesitan para cumplir "qty",
  // luego de descontar los dados propios conocidos (si corresponde)
  function cantidadOcultaNecesaria(state, qty, face, useMyDice) {
    if (!useMyDice) return qty;
    var poseidos = 0;
    if (face === 1) {
      poseidos = state.myDice[1];
    } else {
      poseidos = state.myDice[face] + state.myDice[1];
    }
    return qty - poseidos;
  }

  // Probabilidad (en porcentaje) de que existan AL MENOS "qty" dados
  // de la cara indicada, considerando o no los dados propios
  function calcProbability(state, qty, face, useMyDice) {
    var ocultos = dadosOcultos(state);
    var p = probabilidadBase(face);
    var necesarios = cantidadOcultaNecesaria(state, qty, face, useMyDice);

    if (necesarios <= 0) return 100;
    if (ocultos <= 0) return 0;

    return binomCDFAtLeast(ocultos, necesarios, p) * 100;
  }

  // Probabilidad puntual aproximada (en porcentaje) de que la cantidad
  // real sea exactamente "qty". Útil para visualizar qué tan ajustada
  // está una apuesta. Los valores fuera de rango se aproximan a los
  // extremos más cercanos.
  function calcExactProbability(state, qty, face, useMyDice) {
    var ocultos = dadosOcultos(state);
    var p = probabilidadBase(face);
    var necesarios = cantidadOcultaNecesaria(state, qty, face, useMyDice);

    if (ocultos <= 0) return (necesarios <= 0) ? 100 : 0;
    if (necesarios < 0) necesarios = 0;
    if (necesarios > ocultos) necesarios = ocultos;

    return binomPMF(ocultos, necesarios, p) * 100;
  }

  // La mayor cantidad con sentido físico: no se puede reclamar
  // más dados de una cara que el total de dados en juego
  function maxCantidadPosible(state) {
    return state.totalDice;
  }

  return {
    combin: combin,
    binomPMF: binomPMF,
    binomCDFAtLeast: binomCDFAtLeast,
    dadosOcultos: dadosOcultos,
    calcProbability: calcProbability,
    calcExactProbability: calcExactProbability,
    maxCantidadPosible: maxCantidadPosible
  };
})();
