// Punto de entrada: define el estado compartido e inicia la interfaz.
var Dudo = window.Dudo || {};

(function () {
  "use strict";

  var estadoInicial = {
    totalDice: 24,
    myDice: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    currentQty: 8,
    currentFace: 6
  };

  document.addEventListener("DOMContentLoaded", function () {
    Dudo.Interfaz.init(estadoInicial);
  });
})();
