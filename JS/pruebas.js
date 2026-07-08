// Runner de pruebas mínimo, sin dependencias externas, pensado
// para funcionar en el mismo tipo de entornos que la aplicación.
(function () {
  "use strict";

  var resultados = [];

  function afirmar(descripcion, condicion) {
    resultados.push({ descripcion: descripcion, ok: !!condicion });
  }

  function afirmarCercano(descripcion, obtenido, esperado, tolerancia) {
    var diferencia = Math.abs(obtenido - esperado);
    afirmar(
      descripcion + " (obtenido: " + obtenido.toFixed(4) + ", esperado: " + esperado.toFixed(4) + ")",
      diferencia <= tolerancia
    );
  }

  function correrPruebas() {
    var P = Dudo.Probabilidad;
    var R = Dudo.Reglas;

    // ---------- Pruebas de combinatoria ----------
    afirmar("combin(5,0) es 1", P.combin(5, 0) === 1);
    afirmar("combin(5,5) es 1", P.combin(5, 5) === 1);
    afirmarCercano("combin(6,2) es 15", P.combin(6, 2), 15, 0.0001);
    afirmar("combin(5,6) fuera de rango es 0", P.combin(5, 6) === 0);

    // ---------- Pruebas de la binomial ----------
    afirmarCercano(
      "binomPMF(1,1,0.5) es 0.5 (una moneda)",
      P.binomPMF(1, 1, 0.5), 0.5, 0.0001
    );
    afirmarCercano(
      "binomCDFAtLeast(n,0,p) siempre es 1",
      P.binomCDFAtLeast(10, 0, 1 / 3), 1, 0.0001
    );
    afirmar(
      "binomCDFAtLeast(n,k,p) es 0 si k > n",
      P.binomCDFAtLeast(5, 6, 1 / 3) === 0
    );
    afirmarCercano(
      "binomCDFAtLeast(6,1,1/6) coincide con 1 - (5/6)^6",
      P.binomCDFAtLeast(6, 1, 1 / 6),
      1 - Math.pow(5 / 6, 6),
      0.0001
    );

    // ---------- Pruebas de calcProbability con estado simulado ----------
    var estado = {
      totalDice: 10,
      myDice: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      currentQty: 0,
      currentFace: 6
    };
    afirmar(
      "calcProbability es 100% cuando la cantidad pedida es 0",
      P.calcProbability(estado, 0, 6, false) === 100
    );
    afirmar(
      "calcProbability es 0% cuando no hay dados ocultos suficientes",
      P.calcProbability(estado, 11, 6, false) === 0
    );

    var estadoConDados = {
      totalDice: 10,
      myDice: { 1: 0, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0 },
      currentQty: 3,
      currentFace: 2
    };
    afirmar(
      "calcProbability con dados propios llega a 100% si ya se cumple la cantidad",
      P.calcProbability(estadoConDados, 3, 2, true) === 100
    );
    afirmar(
      "calcProbability sin contar los dados propios es menor a 100%",
      P.calcProbability(estadoConDados, 3, 2, false) < 100
    );

    // ---------- Pruebas de las reglas de escalada ----------
    afirmar(
      "de Ases a Ases suma uno",
      R.nextLegalQty(1, 5, 1) === 6
    );
    afirmar(
      "de Ases a cara normal duplica la cantidad",
      R.nextLegalQty(1, 5, 4) === 10
    );
    afirmar(
      "de cara normal a Ases es la mitad más uno",
      R.nextLegalQty(4, 10, 1) === 6
    );
    afirmar(
      "de cara normal a una cara menor o igual suma uno",
      R.nextLegalQty(4, 8, 3) === 9
    );
    afirmar(
      "de cara normal a una cara mayor mantiene la cantidad",
      R.nextLegalQty(4, 8, 5) === 8
    );

    afirmar("esImposible(0) es verdadero", R.esImposible(0) === true);
    afirmar("esImposible(5) es falso", R.esImposible(5) === false);
    afirmar("esSegura(100) es verdadero", R.esSegura(100) === true);
    afirmar("esSegura(99) es falso", R.esSegura(99) === false);

    mostrarResultados();
  }

  function mostrarResultados() {
    var contenedor = document.getElementById("resultados");
    var aprobadas = 0;

    for (var i = 0; i < resultados.length; i++) {
      var fila = document.createElement("div");
      fila.className = "fila-prueba " + (resultados[i].ok ? "ok" : "error");
      fila.textContent = (resultados[i].ok ? "✔ " : "✘ ") + resultados[i].descripcion;
      contenedor.appendChild(fila);
      if (resultados[i].ok) aprobadas++;
    }

    var resumen = document.getElementById("resumen");
    resumen.textContent = aprobadas + " de " + resultados.length + " pruebas aprobadas";
    resumen.className = (aprobadas === resultados.length) ? "resumen-ok" : "resumen-error";
  }

  document.addEventListener("DOMContentLoaded", correrPruebas);
})();
