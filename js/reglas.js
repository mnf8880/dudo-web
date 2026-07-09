// Módulo de reglas del juego (escalada de jugadas y casos límite).
var Dudo = window.Dudo || {};

Dudo.Reglas = (function () {
  "use strict";

  // Cantidad legal al cambiar de cara, según las reglas de escalada acordadas
  function nextLegalQty(fromFace, fromQty, toFace) {
    if (fromFace === 1) {
      if (toFace === 1) return fromQty + 1;
      return fromQty * 2;
    } else {
      if (toFace === 1) return Math.floor(fromQty / 2) + 1;
      if (toFace <= fromFace) return fromQty + 1;
      return fromQty;
    }
  }

  // Indica si, dada la probabilidad, la jugada es matemáticamente imposible
  function esImposible(porcentaje) {
    return porcentaje <= 0;
  }

  // Indica si, dada la probabilidad, la jugada es matemáticamente segura
  function esSegura(porcentaje) {
    return porcentaje >= 100;
  }

  return {
    nextLegalQty: nextLegalQty,
    esImposible: esImposible,
    esSegura: esSegura
  };
})();
