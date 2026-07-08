(function () {
  "use strict";

  var DIE_ICONS = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

  var state = {
    totalDice: 24,
    myDice: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    currentQty: 8,
    currentFace: 6
  };

  var RISK_CLASSES = [
    "risk-0-10", "risk-10-20", "risk-20-30", "risk-30-40", "risk-40-50",
    "risk-50-60", "risk-60-70", "risk-70-80", "risk-80-100"
  ];

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

  function sumMyDice() {
    var total = 0;
    for (var f = 1; f <= 6; f++) {
      total += state.myDice[f];
    }
    return total;
  }

  function combin(n, k) {
    if (k < 0 || k > n) return 0;
    if (k > n - k) k = n - k;
    var result = 1;
    for (var i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return result;
  }

  // Probabilidad P(X >= k) para una distribución binomial(n, p)
  function binomCDFAtLeast(n, k, p) {
    if (k <= 0) return 1;
    if (k > n) return 0;
    var sum = 0;
    for (var i = k; i <= n; i++) {
      sum += combin(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
    }
    if (sum > 1) sum = 1;
    if (sum < 0) sum = 0;
    return sum;
  }

  // Calcula la probabilidad (en porcentaje) de que existan al menos "qty"
  // dados de la cara indicada. Si useMyDice es verdadero, descuenta los
  // dados propios ya conocidos antes de evaluar los dados ocultos.
  function calcProbability(qty, face, useMyDice) {
    var hidden = state.totalDice - sumMyDice();
    var p = (face === 1) ? (1 / 6) : (1 / 3);
    var neededHidden = qty;

    if (useMyDice) {
      var owned = 0;
      if (face === 1) {
        owned = state.myDice[1];
      } else {
        owned = state.myDice[face] + state.myDice[1];
      }
      neededHidden = qty - owned;
    }

    if (neededHidden <= 0) return 100;
    if (hidden <= 0) return 0;

    return binomCDFAtLeast(hidden, neededHidden, p) * 100;
  }

  // Regla de escalada: cantidad legal al cambiar de cara en la jugada
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

  function clampMyDiceTotal() {
    var sum = sumMyDice();
    if (sum > state.totalDice) {
      // Se reduce comenzando desde la cara 6 hacia la cara 1
      var excess = sum - state.totalDice;
      for (var f = 6; f >= 1 && excess > 0; f--) {
        var reduce = Math.min(state.myDice[f], excess);
        state.myDice[f] -= reduce;
        excess -= reduce;
      }
    }
  }

  // ---------- Construcción de la interfaz estática ----------

  function buildMyDiceGrid() {
    var container = document.getElementById("myDiceGrid");
    container.innerHTML = "";
    for (var f = 1; f <= 6; f++) {
      var col = document.createElement("div");
      col.className = "mydice-col";

      var icon = document.createElement("div");
      icon.className = "die-icon";
      icon.textContent = DIE_ICONS[f];

      var upBtn = document.createElement("button");
      upBtn.className = "mini-btn up";
      upBtn.textContent = "⇧";
      upBtn.setAttribute("data-face", f);
      upBtn.addEventListener("click", (function (face) {
        return function () {
          if (sumMyDice() < state.totalDice) {
            state.myDice[face] += 1;
            render();
          }
        };
      })(f));

      var count = document.createElement("div");
      count.className = "mydice-count";
      count.id = "mydice-count-" + f;

      var downBtn = document.createElement("button");
      downBtn.className = "mini-btn down";
      downBtn.textContent = "⇩";
      downBtn.setAttribute("data-face", f);
      downBtn.addEventListener("click", (function (face) {
        return function () {
          if (state.myDice[face] > 0) {
            state.myDice[face] -= 1;
            render();
          }
        };
      })(f));

      col.appendChild(icon);
      col.appendChild(upBtn);
      col.appendChild(count);
      col.appendChild(downBtn);
      container.appendChild(col);
    }
  }

  function buildFaceSelector() {
    var container = document.getElementById("faceSelector");
    container.innerHTML = "";
    for (var f = 1; f <= 6; f++) {
      var opt = document.createElement("div");
      opt.className = "face-option";
      opt.id = "face-opt-" + f;
      opt.textContent = DIE_ICONS[f];
      opt.setAttribute("data-face", f);
      opt.addEventListener("click", (function (face) {
        return function () {
          state.currentFace = face;
          render();
        };
      })(f));
      container.appendChild(opt);
    }
  }

  function buildResponsesGrid() {
    var container = document.getElementById("responsesGrid");
    container.innerHTML = "";
    for (var f = 1; f <= 6; f++) {
      var cell = document.createElement("div");
      cell.className = "response-cell";
      cell.id = "resp-cell-" + f;

      var qtyBtn = document.createElement("button");
      qtyBtn.className = "qty-btn";
      qtyBtn.id = "resp-qty-" + f;
      qtyBtn.setAttribute("data-face", f);
      qtyBtn.addEventListener("click", (function (face) {
        return function () {
          var newQty = nextLegalQty(state.currentFace, state.currentQty, face);
          state.currentQty = newQty;
          state.currentFace = face;
          render();
        };
      })(f));

      var icon = document.createElement("div");
      icon.className = "resp-die-icon";
      icon.textContent = DIE_ICONS[f];

      var lblSin = document.createElement("div");
      lblSin.className = "prob-label";
      lblSin.textContent = "Sin";

      var probSin = document.createElement("div");
      probSin.className = "prob-row";
      probSin.id = "resp-sin-" + f;

      var lblCon = document.createElement("div");
      lblCon.className = "prob-label";
      lblCon.textContent = "Con";

      var probCon = document.createElement("div");
      probCon.className = "prob-row";
      probCon.id = "resp-con-" + f;

      cell.appendChild(qtyBtn);
      cell.appendChild(icon);
      cell.appendChild(lblSin);
      cell.appendChild(probSin);
      cell.appendChild(lblCon);
      cell.appendChild(probCon);
      container.appendChild(cell);
    }
  }

  // ---------- Actualización dinámica de la interfaz ----------

  function render() {
    // Panel 1
    document.getElementById("totalDiceDisplay").textContent = state.totalDice;

    // Panel 2
    for (var f = 1; f <= 6; f++) {
      document.getElementById("mydice-count-" + f).textContent = state.myDice[f];
    }

    // Panel 3
    document.getElementById("currentQtyDisplay").textContent = state.currentQty;
    for (var fi = 1; fi <= 6; fi++) {
      var opt = document.getElementById("face-opt-" + fi);
      if (fi === state.currentFace) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    }

    var pctSin = calcProbability(state.currentQty, state.currentFace, false);
    var pctCon = calcProbability(state.currentQty, state.currentFace, true);

    document.getElementById("pctSin").textContent = pctSin.toFixed(0) + "%";
    document.getElementById("pctCon").textContent = pctCon.toFixed(0) + "%";
    applyRiskColor(document.getElementById("dotSin"), pctSin);
    applyRiskColor(document.getElementById("dotCon"), pctCon);

    // Panel 4
    for (var f2 = 1; f2 <= 6; f2++) {
      var legalQty = nextLegalQty(state.currentFace, state.currentQty, f2);
      var qtyBtn = document.getElementById("resp-qty-" + f2);
      qtyBtn.textContent = legalQty;

      var rSin = calcProbability(legalQty, f2, false);
      var rCon = calcProbability(legalQty, f2, true);

      var elSin = document.getElementById("resp-sin-" + f2);
      var elCon = document.getElementById("resp-con-" + f2);
      elSin.textContent = rSin.toFixed(0) + "%";
      elCon.textContent = rCon.toFixed(0) + "%";

      applyRiskColor(elSin, rSin);
      applyRiskColor(elCon, rCon);
      applyRiskColor(qtyBtn, rCon);
    }
  }

  // ---------- Eventos generales ----------

  document.getElementById("totalUp").addEventListener("click", function () {
    state.totalDice += 1;
    state.myDice = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    state.currentQty = Math.floor(state.totalDice / 3);
    if (state.currentQty < 1) state.currentQty = 1;
    render();
  });

  document.getElementById("totalDown").addEventListener("click", function () {
    if (state.totalDice > 1) {
      state.totalDice -= 1;
      state.myDice = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      state.currentQty = Math.floor(state.totalDice / 3);
      if (state.currentQty < 1) state.currentQty = 1;
      render();
    }
  });

  document.getElementById("qtyUp").addEventListener("click", function () {
    state.currentQty += 1;
    render();
  });

  document.getElementById("qtyDown").addEventListener("click", function () {
    if (state.currentQty > 1) {
      state.currentQty -= 1;
      render();
    }
  });

  // ---------- Inicio del programa ----------

  buildMyDiceGrid();
  buildFaceSelector();
  buildResponsesGrid();
  clampMyDiceTotal();
  render();

})();
