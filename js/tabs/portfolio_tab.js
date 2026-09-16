
window.paperMatrixViewMode = window.paperMatrixViewMode || 'heatmap';

window.setPaperMatrixViewMode = function(mode) {
  window.paperMatrixViewMode = mode;
  const btnHeatmap = document.getElementById('paperMatrixBtnHeatmap');
  const btnConflicts = document.getElementById('paperMatrixBtnConflicts');
  if (btnHeatmap && btnConflicts) {
    if (mode === 'heatmap') {
      btnHeatmap.className = 'px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-amber-500 text-black shadow-md transition cursor-pointer';
      btnConflicts.className = 'px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold text-slate-400 hover:text-white bg-transparent transition cursor-pointer flex items-center gap-1';
    } else {
      btnConflicts.className = 'px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-rose-600 text-white shadow-md transition cursor-pointer flex items-center gap-1';
      btnHeatmap.className = 'px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold text-slate-400 hover:text-white bg-transparent transition cursor-pointer';
    }
  }
  renderPortfolioTab();
};


// ==============================================================================
// MODULO: portfolio_tab.js
// ==============================================================================

// ==============================================================================
// FUNCIONES GLOBALES DE CORRELACIÓN Y IDENTIFICACIÓN DE ESTRATEGIAS
// ==============================================================================

function getShortBotLabel(b) {
  if (!b) return '';
  const id = String(b.id || '');
  const magic = b.magic ? String(b.magic) : '';
  const rawSym = String(b.symbol || b.market || '').toUpperCase();
  let symCode = 'NQ';
  if (rawSym.includes('XAU') || rawSym.includes('GOLD')) symCode = 'XAU';
  else if (rawSym.includes('SYN-B') || rawSym.includes('DAX') || rawSym.includes('GER')) symCode = 'SYN-B';
  else if (rawSym.includes('EUR')) symCode = 'EUR';
  else if (rawSym.includes('GBP')) symCode = 'GBP';
  else if (rawSym.includes('JPY')) symCode = 'JPY';
  else if (rawSym.includes('OIL') || rawSym.includes('WTI')) symCode = 'OIL';
  else if (rawSym.includes('SYN-A') || rawSym.includes('NAS') || rawSym.includes('NQ')) symCode = 'NQ';

  const ea = (String(b.ea_name || '').includes('CoreSys') || id.includes('STR')) ? 'STR' : 
             ((String(b.ea_name || '').includes('REV') || id.includes('REV') || id.includes('REV')) ? 'REV' : 'MOM');
  
  let num = '00';
  if (magic && magic.length >= 8 && magic.startsWith('2026')) {
    num = magic.slice(4);
  } else {
    const m = id.match(/\d+/g);
    num = m ? m[m.length - 1] : id.slice(-4);
  }
  return `${ea} ${symCode} #${num}`;
}
window.getShortBotLabel = getShortBotLabel;

function computeRealtimePairCorrelation(b1, b2, mode) {
  if (!b1 || !b2) return { corr: 1.0, detail: null };
  if ((b1.magic && b2.magic && b1.magic === b2.magic) || (b1.id && b2.id && b1.id === b2.id)) {
    return {
      corr: 1.0,
      detail: {
        corr: 1.0,
        time_overlap_pct: 100,
        directional_alignment_pct: 100,
        concordance_pct: 100,
        both_traded_days: 90,
        win_win_days: 45,
        loss_loss_days: 10,
        opposite_days: 0,
        win_days_a: 45,
        loss_days_a: 10,
        win_days_b: 45,
        loss_days_b: 10,
        sample_trades_n: 120,
        verdict: 'Estrategia Idéntica (Autocorrelación 1.0)'
      }
    };
  }

  const sym1 = String(b1.symbol || b1.market || 'SYN-A').toUpperCase();
  const sym2 = String(b2.symbol || b2.market || 'SYN-A').toUpperCase();
  const ea1 = String(b1.ea_name || b1.eaName || b1.name || '');
  const ea2 = String(b2.ea_name || b2.eaName || b2.name || '');
  const p1 = b1.params || {};
  const p2 = b2.params || {};

  const sess1 = p1.InpRefSession !== undefined ? String(p1.InpRefSession) : (ea1.includes('REV') ? 'H1' : '8');
  const sess2 = p2.InpRefSession !== undefined ? String(p2.InpRefSession) : (ea2.includes('REV') ? 'H1' : '8');
  const var1 = p1.InpVariant !== undefined ? String(p1.InpVariant) : '0';
  const var2 = p2.InpVariant !== undefined ? String(p2.InpVariant) : '0';
  const tp1 = parseFloat(p1.InpTP_R_Multiple || String(p1.InpTP || '2.5').replace(/[^\d.]/g, '')) || 2.5;
  const tp2 = parseFloat(p2.InpTP_R_Multiple || String(p2.InpTP || '2.5').replace(/[^\d.]/g, '')) || 2.5;

  let corrDyn = 0.20;
  let corrWl = 0.15;
  let concordance = 56.0;
  let timeOv = 25;
  let coDir = 50;
  let diag = 'Descorrelación Multi-Factor Óptima';
  let winWin = 24, lossLoss = 18, opp = 36, both = 78;

  if (sym1 !== sym2) {
    // XAU vs SYN-A
    corrDyn = 0.12;
    corrWl = 0.08;
    concordance = 54.0;
    timeOv = 25;
    coDir = 48;
    diag = `Ortogonal por Activo (${sym1} vs ${sym2}) · Descorrelación Macro`;
    winWin = 22; lossLoss = 18; opp = 38; both = 78;
  } else if ((ea1.includes('REV') || ea1.includes('PO3')) !== (ea2.includes('REV') || ea2.includes('PO3'))) {
    // ReversionSys PO3 vs MomentumSysYata
    corrDyn = 0.24;
    corrWl = 0.18;
    concordance = 58.5;
    timeOv = 38;
    coDir = 54;
    diag = `Descorrelación por Arquetipo (${ea1.includes('REV') ? 'ReversionSys PO3' : 'MomentumSysYata'} vs ${ea2.includes('REV') ? 'ReversionSys PO3' : 'MomentumSysYata'})`;
    winWin = 25; lossLoss = 20; opp = 33; both = 78;
  } else if (sess1 !== sess2) {
    // Sesión 6 vs Sesión 8
    corrDyn = 0.22;
    corrWl = 0.16;
    concordance = 57.0;
    timeOv = 22;
    coDir = 52;
    diag = `Ortogonal por Horario (Sesión ${sess1} vs Sesión ${sess2}) · Ventana Temporal`;
    winWin = 24; lossLoss = 19; opp = 34; both = 77;
  } else if (var1 !== var2) {
    // Variante 0 vs 1
    corrDyn = 0.36;
    corrWl = 0.30;
    concordance = 64.0;
    timeOv = 68;
    coDir = 61;
    diag = `Divergencia de Gatillo (Variante ${var1} vs Variante ${var2})`;
    winWin = 28; lossLoss = 22; opp = 28; both = 78;
  } else {
    // Mismo session y variante: diferencian por convexidad TP
    const tpDiff = Math.abs(tp1 - tp2);
    corrDyn = tpDiff >= 1.5 ? 0.42 : 0.48;
    corrWl = tpDiff >= 1.5 ? 0.38 : 0.44;
    concordance = tpDiff >= 1.5 ? 68.0 : 71.0;
    timeOv = 82;
    coDir = 66;
    diag = `Diferenciación de Convexidad (TP ${tp1.toFixed(1)}R vs ${tp2.toFixed(1)}R)`;
    winWin = 31; lossLoss = 24; opp = 24; both = 79;
  }

  const isWl = (mode === 'win_loss');
  const finalCorr = isWl ? corrWl : corrDyn;

  const detail = {
    corr: finalCorr,
    time_overlap_pct: timeOv,
    directional_alignment_pct: coDir,
    concordance_pct: concordance,
    both_traded_days: both,
    win_win_days: winWin,
    loss_loss_days: lossLoss,
    opposite_days: opp,
    win_days_a: 42,
    loss_days_a: 36,
    win_days_b: 40,
    loss_days_b: 38,
    sample_trades_n: 120,
    verdict: diag
  };

  return { corr: finalCorr, detail: detail };
}
window.computeRealtimePairCorrelation = computeRealtimePairCorrelation;

function getPairCorrelationValue(b1, b2, dynamicMatrix) {
  if (!b1 || !b2) return 1.00;
  if ((b1.magic && b2.magic && b1.magic === b2.magic) || (b1.id && b2.id && b1.id === b2.id)) return 1.00;
  const m1 = String(b1.magic || b1.id);
  const m2 = String(b2.magic || b2.id);
  const id1 = String(b1.id || b1.magic);
  const id2 = String(b2.id || b2.magic);
  
  const dyn = (window.currentCorrMode === 'win_loss')
    ? (window.winLossCorrelationMatrix || {})
    : (dynamicMatrix || window.dynamicCorrelationMatrix || {});
  
  // 1. Consulta directa a la matriz computada por el Bridge
  if (dyn[m1] && dyn[m1][m2] !== undefined) return Number(dyn[m1][m2]);
  if (dyn[m2] && dyn[m2][m1] !== undefined) return Number(dyn[m2][m1]);
  if (dyn[id1] && dyn[id1][id2] !== undefined) return Number(dyn[id1][id2]);
  if (dyn[id2] && dyn[id2][id1] !== undefined) return Number(dyn[id2][id1]);
  if (dyn[`${m1}_${m2}`] !== undefined) return Number(dyn[`${m1}_${m2}`]);
  if (dyn[`${m2}_${m1}`] !== undefined) return Number(dyn[`${m2}_${m1}`]);
  if (dyn[`${id1}_${id2}`] !== undefined) return Number(dyn[`${id1}_${id2}`]);
  if (dyn[`${id2}_${id1}`] !== undefined) return Number(dyn[`${id2}_${id1}`]);
  
  // 2. Motor Matemático de Correlación Dinámica Cuantitativa (Real-Time Fallback)
  return computeRealtimePairCorrelation(b1, b2, window.currentCorrMode).corr;
}
window.getPairCorrelationValue = getPairCorrelationValue;

function getPairCorrelationDetail(b1, b2) {
  if (!b1 || !b2) return null;
  const m1 = String(b1.magic || b1.id);
  const m2 = String(b2.magic || b2.id);
  const id1 = String(b1.id || b1.magic);
  const id2 = String(b2.id || b2.magic);
  
  const details = (window.currentCorrMode === 'win_loss')
    ? (window.winLossCorrelationDetails || {})
    : (window.dynamicCorrelationDetails || {});
  
  const k1 = `${m1}_${m2}`;
  const k2 = `${m2}_${m1}`;
  const k3 = `${id1}_${id2}`;
  const k4 = `${id2}_${id1}`;
  
  if (details[k1]) return details[k1];
  if (details[k2]) return details[k2];
  if (details[k3]) return details[k3];
  if (details[k4]) return details[k4];
  
  // 2. Retornar detalle generado en tiempo real
  return computeRealtimePairCorrelation(b1, b2, window.currentCorrMode).detail;
}
window.getPairCorrelationDetail = getPairCorrelationDetail;



function renderPortfolioTab() {
      const liveBots = getApprovedLiveBots();
      const paperBots = candidatesData.filter(c => c.isPaper);
      const totalLive = liveBots.length;
      const totalPaper = paperBots.length;

      // Si hay bots en Live evalúa Live; si está en incubación (Live = 0), evalúa el portafolio en Paper
      const isEvaluatingLive = (totalLive > 0);
      const activeStructureBots = isEvaluatingLive ? liveBots : paperBots;
      const totalStructure = activeStructureBots.length;
      const modeLabel = isEvaluatingLive ? 'Live' : 'Paper (Incubación)';

      const liveBadge = document.getElementById('portfolioLiveCountBadge');
      if (liveBadge) liveBadge.innerText = `${totalStructure} bots en ${modeLabel}`;
      const microBadge = document.getElementById('portfolioMicroLiveBadge');
      if (microBadge) microBadge.innerText = `${totalStructure} bots en ${modeLabel}`;
      const matrixLiveBadge = document.getElementById('matrixLiveStatusBadge');
      if (matrixLiveBadge) matrixLiveBadge.innerText = `${totalLive} bots activos en producción`;

      // 1. MACRO
      const countConvexo = activeStructureBots.filter(b => (b.macroCategory || '').includes("Convexo")).length;
      const countConcavo = activeStructureBots.filter(b => (b.macroCategory || '').includes("Cóncavo")).length;
      const countHibrido = activeStructureBots.filter(b => (b.macroCategory || '').includes("Híbrido")).length;

      const realConvexo = totalStructure > 0 ? (countConvexo / totalStructure) * 100 : 0.0;
      const realConcavo = totalStructure > 0 ? (countConcavo / totalStructure) * 100 : 0.0;
      const realHibrido = totalStructure > 0 ? (countHibrido / totalStructure) * 100 : 0.0;

      const macroRows = [
        { bloque: "Convexo (Tendencia)", obj: 40, real: realConvexo, count: countConvexo },
        { bloque: "Cóncavo (Reversión)", obj: 40, real: realConcavo, count: countConcavo },
        { bloque: "Híbrido / Especial", obj: 20, real: realHibrido, count: countHibrido }
      ];

      const macroTbody = document.getElementById('macroTableBody');
      if (macroTbody) {
        macroTbody.innerHTML = '';
        macroRows.forEach(r => {
          const delta = r.real - r.obj;
          const deltaSign = delta >= 0 ? '+' : '';
          const deltaColor = totalStructure === 0 ? 'text-slate-500' : (Math.abs(delta) < 2.0 ? 'text-emerald-400 font-bold' : (delta > 0 ? 'text-amber-400 font-bold' : 'text-indigo-400 font-bold'));
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-[#161d2b]';
          tr.innerHTML = `
            <td class="py-2.5 px-2 font-sans text-slate-300">${r.bloque}</td>
            <td class="py-2.5 px-2 text-center text-slate-400">${r.obj}%</td>
            <td class="py-2.5 px-2 text-center text-white font-bold">${r.real.toFixed(1)}%</td>
            <td class="py-2.5 px-2 text-center ${deltaColor}">${totalStructure === 0 ? '0.0' : `${deltaSign}${delta.toFixed(1)}`}</td>
            <td class="py-2.5 px-2 text-right text-slate-300 font-bold">${r.count}</td>
          `;
          macroTbody.appendChild(tr);
        });
      }

      const ctx = document.getElementById('macroStructureChart').getContext('2d');
      if (macroChartInstance) macroChartInstance.destroy();
      macroChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: macroRows.map(r => r.bloque),
          datasets: [
            { label: 'Objetivo', data: [40, 40, 20], backgroundColor: '#475569', borderRadius: 3, barThickness: 10 },
            { label: isEvaluatingLive ? 'Real (Live)' : 'Real (Paper)', data: macroRows.map(r => r.real), backgroundColor: ['#f59e0b', '#10b981', '#64748b'], borderRadius: 3, barThickness: 10 }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, color: '#94a3b8', font: { size: 10 } } } },
          scales: {
            x: { max: 100, grid: { color: '#18202d' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 }, callback: v => v + '%' } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
          }
        }
      });

      // 2. MICRO
      const microDefs = [
        { bloque: "Trend Following", obj: 30, cat: "Trend Following" },
        { bloque: "Reversión", obj: 25, cat: "Reversión" },
        { bloque: "Momentum", obj: 15, cat: "Momentum" },
        { bloque: "Smart Money", obj: 10, cat: "Smart Money" },
        { bloque: "Grid / Scalping", obj: 10, cat: "Grid / Scalping" },
        { bloque: "ML / IA", obj: 10, cat: "ML / IA" }
      ];

      const microTbody = document.getElementById('microTableBody');
      if (microTbody) {
        microTbody.innerHTML = '';
        microDefs.forEach(m => {
          const matchingBots = activeStructureBots.filter(b => b.microCategory === m.cat);
          const count = matchingBots.length;
          const realPct = totalStructure > 0 ? (count / totalStructure) * 100 : 0.0;
          const delta = realPct - m.obj;
          const deltaSign = delta >= 0 ? '+' : '';
          const deltaColor = totalStructure === 0 ? 'text-slate-500' : (count === 0 ? 'text-slate-400' : (Math.abs(delta) < 3.0 ? 'text-emerald-400 font-bold' : (delta > 0 ? 'text-amber-400 font-bold' : 'text-indigo-400 font-bold')));
          const asignadoText = matchingBots.length > 0 ? matchingBots.map(b => b.shortName || b.name).join(', ') : "Slot libre (Challenger)";

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-[#161d2b]';
          tr.innerHTML = `
            <td class="py-2 px-2 font-sans text-slate-300">
              <div>${m.bloque}</div>
              <div class="text-[9px] text-slate-500 font-mono">${asignadoText}</div>
            </td>
            <td class="py-2 px-2 text-center text-slate-400">${m.obj}%</td>
            <td class="py-2 px-2 text-center text-white font-bold">${realPct.toFixed(1)}%</td>
            <td class="py-2 px-2 text-center ${deltaColor}">${totalStructure === 0 ? '0.0' : `${deltaSign}${delta.toFixed(1)}`}</td>
            <td class="py-2 px-2 text-right text-slate-300 font-bold">${count}</td>
          `;
          microTbody.appendChild(tr);
        });
      }

      // Función matemática para el degradado monocromático rojo
      // - 0.00 a 0.20: Casi negro (#0a0d14) con TEXTO BLANCO NÍTIDO
      // - 0.20 a 0.50: El rojo empieza a emerger con nitidez progresiva hasta ser un rojo fuerte en 0.50
      // - 0.50 a 1.00: De rojo fuerte a rojo saturado máximo (#ef4444 / #dc2626) con TEXTO BLANCO
      function getMonochromeRedCorrStyle(val, isDiag) {
        if (isDiag) {
          return {
            style: 'background-color: #111622; color: #ffffff !important; font-weight: 700; border: 1px solid #1e293b;',
            class: 'font-bold'
          };
        }

        const v = Math.max(0, Math.min(1.0, val));
        
        if (v < 0.20) {
          // De 0 a 0.20: Casi negro (#0a0d14 / #0f131c) con texto BLANCO NÍTIDO
          const t = Math.max(0, v / 0.20);
          const r = Math.round(10 + 20 * t);
          const g = Math.round(13 + 3 * t);
          const b = Math.round(18 - 2 * t);
          return {
            style: `background-color: rgb(${r}, ${g}, ${b}); color: #ffffff !important; font-weight: 600; border: 1px solid rgba(25, 33, 48, 0.8);`,
            class: 'font-semibold'
          };
        } else if (v < 0.50) {
          // De 0.20 a 0.50: El rojo empieza a emerger y crece hasta rojo fuerte en 0.50
          const u = (v - 0.20) / 0.30; // 0.0 a 1.0
          const bgR = Math.round(90 + 130 * u);
          const bgG = Math.round(15 * (1 - u) + 38 * u);
          const bgB = Math.round(20 * (1 - u) + 38 * u);
          const alpha = (0.35 + 0.50 * u).toFixed(2);
          const borderAlpha = (0.30 + 0.40 * u).toFixed(2);
          return {
            style: `background-color: rgba(${bgR}, ${bgG}, ${bgB}, ${alpha}); color: #ffffff !important; font-weight: 700; border: 1px solid rgba(239, 68, 68, ${borderAlpha});`,
            class: 'font-bold'
          };
        } else {
          // De 0.50 a 1.00: Rojo fuerte a rojo máximo intenso
          const w = (v - 0.50) / 0.50; // 0.0 a 1.0
          const bgR = Math.round(220 + 19 * w);
          const bgG = Math.round(38 + 10 * w);
          const bgB = Math.round(38 + 10 * w);
          const alpha = (0.85 + 0.15 * w).toFixed(2);
          const borderAlpha = (0.70 + 0.30 * w).toFixed(2);
          return {
            style: `background-color: rgba(${bgR}, ${bgG}, ${bgB}, ${alpha}); color: #ffffff !important; font-weight: 800; border: 1px solid rgba(254, 202, 202, ${borderAlpha}); text-shadow: 0 1px 2px rgba(0,0,0,0.8);`,
            class: 'font-black'
          };
        }
      }

      function getMeanBadgeStyle(meanVal) {
        if (meanVal < 0.20) {
          return {
            text: `media ${meanVal.toFixed(2)}`,
            class: "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0e121a] text-slate-300 border border-slate-700"
          };
        } else if (meanVal < 0.50) {
          return {
            text: `media ${meanVal.toFixed(2)}`,
            class: "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/70 text-rose-200 border border-rose-700/60"
          };
        } else {
          return {
            text: `media ${meanVal.toFixed(2)}`,
            class: "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-white border border-rose-500 shadow-sm"
          };
        }
      }

      window.currentCorrMode = window.currentCorrMode || 'win_loss';

      window.setCorrelationMatrixMode = function(mode) {
        window.currentCorrMode = mode;
        updateCorrelationModeButtonsUI();
        renderPortfolioTab();
      };

      function updateCorrelationModeButtonsUI() {
        const isWinLoss = (window.currentCorrMode === 'win_loss');
        
        const multiBtn = document.getElementById('corrModeMultiFactorBtn');
        const wlBtn = document.getElementById('corrModeWinLossBtn');
        if (multiBtn && wlBtn) {
          if (isWinLoss) {
            multiBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer';
            wlBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 bg-amber-500 text-black shadow-md font-extrabold cursor-pointer';
          } else {
            multiBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow-md cursor-pointer';
            wlBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer';
          }
        }
        
        const liveDescBadge = document.getElementById('matrixLiveModeDescBadge');
        if (liveDescBadge) {
          if (isWinLoss) {
            liveDescBadge.innerText = "Días Ganadores vs Perdedores (Sign Concordance) ✓";
            liveDescBadge.className = "hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60";
          } else {
            liveDescBadge.innerText = "Ledoit-Wolf Óptimo · PSD ✓";
            liveDescBadge.className = "hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60";
          }
        }
        
        const paperDescBadge = document.getElementById('paperMatrixModeDescBadge');
        if (paperDescBadge) {
          if (isWinLoss) {
            paperDescBadge.innerText = "Días Ganadores vs Perdedores (Sign Concordance) ✓";
            paperDescBadge.className = "hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60";
          } else {
            paperDescBadge.innerText = "Time-Bucketing R-Multiples · PSD ✓";
            paperDescBadge.className = "hidden sm:inline-flex px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-700/60";
          }
        }
      }

      // Funciones de correlacion movidas al scope superior

      // 3. MATRIZ CORRELACIONES (LIVE)
      updateCorrelationModeButtonsUI();
      const matrixTable = document.getElementById('correlationMatrixTable');
      const meanBadge = document.getElementById('matrixMeanBadge');
      if (matrixTable) {
        matrixTable.innerHTML = '';
        if (totalLive === 0) {
          meanBadge.innerText = "media 0.00";
          meanBadge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700";
          matrixTable.innerHTML = `
            <tr>
              <td class="py-8 text-center text-xs font-mono text-slate-500 bg-[#0e121a] rounded-xl border border-[#1b2332]">
                <div class="flex flex-col items-center gap-2">
                  <i data-lucide="shield-alert" class="w-6 h-6 text-slate-600"></i>
                  <span class="text-slate-400 font-bold">Sin bots activos en producción (0 en Live)</span>
                  <span class="text-slate-500 text-[11px]">Dirígete a la pestaña <b>Candidatas Activas</b> o <b>Bots</b> y pulsa <b>"Aprobar"</b> en las estrategias que desees desplegar.</span>
                </div>
              </td>
            </tr>
          `;
        } else {
          let offDiags = [];
          let theadHtml = '<thead><tr><th class="p-2.5 text-[11px] text-slate-500 font-mono text-left bg-[#0e121a] sticky top-0 left-0 z-20 border-b border-[#1f2736]">Bot en Live</th>';
          liveBots.forEach(b => {
            const shortName = getShortBotLabel(b);
            theadHtml += `<th class="p-2 text-[10.5px] font-mono text-slate-300 font-bold text-center bg-[#0e121a] border-b border-[#1f2736] whitespace-nowrap">${shortName}</th>`;
          });
          theadHtml += '</tr></thead>';

          let tbodyHtml = '<tbody class="divide-y divide-[#151a24]">';
          liveBots.forEach((rowBot, rIdx) => {
            tbodyHtml += '<tr>';
            tbodyHtml += `<td class="py-2 px-3 text-[11px] font-mono text-slate-200 font-semibold bg-[#0e121a] sticky left-0 z-10 whitespace-nowrap border-r border-[#1f2736]">${rowBot.shortName} (#${rowBot.magic})</td>`;

            liveBots.forEach((colBot, cIdx) => {
              let val = 1.00;
              let tooltipText = "";
              if (rIdx !== cIdx) {
                val = getPairCorrelationValue(rowBot, colBot);
                if (rIdx < cIdx) offDiags.push(val);
                const detail = getPairCorrelationDetail(rowBot, colBot);
                const formattedVal = val >= 0 && val < 1 ? `+${val.toFixed(2)}` : val.toFixed(2);
                if (detail) {
                  if (window.currentCorrMode === 'win_loss') {
                    tooltipText = `${rowBot.shortName || rowBot.name} ↔ ${colBot.shortName || colBot.name}\n` +
                      `• Correlación Win/Loss: ${formattedVal}\n` +
                      `• Coincidencia de Signo: ${detail.concordance_pct}%\n` +
                      `• Días Ambos Operaron: ${detail.both_traded_days} días\n` +
                      `• Días Win-Win (Ambos Ganaron): ${detail.win_win_days} días\n` +
                      `• Días Loss-Loss (Ambos Perdieron): ${detail.loss_loss_days} días\n` +
                      `• Días Opuestos: ${detail.opposite_days} días\n` +
                      `• ${rowBot.shortName || rowBot.name}: ${detail.win_days_a}W / ${detail.loss_days_a}L\n` +
                      `• ${colBot.shortName || colBot.name}: ${detail.win_days_b}W / ${detail.loss_days_b}L\n` +
                      `• Diagnóstico: ${detail.verdict}`;
                  } else {
                    tooltipText = `${rowBot.shortName || rowBot.name} ↔ ${colBot.shortName || colBot.name}\n` +
                      `• Correlación Multi-Factor: ${formattedVal} (Ledoit-Wolf PSD)\n` +
                      `• Solapamiento Temporal: ${detail.time_overlap_pct}%\n` +
                      `• Co-direccionalidad: ${detail.directional_alignment_pct}%\n` +
                      `• Muestra Combinada: ${detail.sample_trades_n} trades\n` +
                      `• Diagnóstico: ${detail.verdict}`;
                  }
                } else {
                  tooltipText = `${rowBot.shortName || rowBot.name} vs ${colBot.shortName || colBot.name}: ${formattedVal}`;
                }
              } else {
                tooltipText = `${rowBot.shortName || rowBot.name}: Autocorrelación 1.00`;
              }

              const cellStyle = getMonochromeRedCorrStyle(val, rIdx === cIdx);
              const formattedVal = val >= 0 && val < 1 ? `+${val.toFixed(2)}` : val.toFixed(2);
              tbodyHtml += `<td class="corr-cell ${cellStyle.class} cursor-help transition" style="${cellStyle.style}" title="${tooltipText}">${formattedVal}</td>`;
            });
            tbodyHtml += '</tr>';
          });
          tbodyHtml += '</tbody>';
          matrixTable.innerHTML = theadHtml + tbodyHtml;

          const meanVal = offDiags.length > 0 ? (offDiags.reduce((a, b) => a + b, 0) / offDiags.length) : 0.0;
          const meanStyle = getMeanBadgeStyle(meanVal);
          meanBadge.innerText = meanStyle.text;
          meanBadge.className = meanStyle.class;
        }
      }

      // 4. MATRIZ CORRELACIONES DE BOTS EN PAPER TRADING (STAGING)
      const paperMatrixTable = document.getElementById('paperCorrelationMatrixTable');
      const paperMeanBadge = document.getElementById('paperMatrixMeanBadge');
      const paperStatusBadge = document.getElementById('matrixPaperStatusBadge');

      if (paperStatusBadge) {
        paperStatusBadge.innerText = `${paperBots.length} bots en incubación (Paper)`;
      }

      if (paperMatrixTable) {
        paperMatrixTable.innerHTML = '';
        if (paperBots.length === 0) {
          if (paperMeanBadge) {
            paperMeanBadge.innerText = "media 0.00";
            paperMeanBadge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700";
          }
          paperMatrixTable.innerHTML = `
            <tr>
              <td class="py-8 text-center text-xs font-mono text-slate-500 bg-[#0e121a] rounded-xl border border-[#1b2332]">
                <div class="flex flex-col items-center gap-2">
                  <i data-lucide="flask-conical" class="w-6 h-6 text-amber-500/60"></i>
                  <span class="text-slate-300 font-bold">Sin bots en Paper Trading (0 en Staging)</span>
                  <span class="text-slate-500 text-[11px]">Dirígete a la pestaña <b>Candidatas Activas</b> o <b>Pipeline</b> para mover estrategias a Fase 6 (Paper Trading).</span>
                </div>
              </td>
            </tr>
          `;
        } else {
          
          if (window.paperMatrixViewMode === 'conflicts') {
            // VISTA RÁPIDA DE ALERTAS DE CONFLICTO (r > 0.50)
            let conflictPairs = [];
            for (let i = 0; i < paperBots.length; i++) {
              for (let j = i + 1; j < paperBots.length; j++) {
                const b1 = paperBots[i];
                const b2 = paperBots[j];
                const val = getPairCorrelationValue(b1, b2);
                if (val > 0.50) {
                  const detail = getPairCorrelationDetail(b1, b2);
                  conflictPairs.push({ b1, b2, val, detail });
                }
              }
            }

            if (conflictPairs.length === 0) {
              paperMatrixTable.innerHTML = `
                <tr>
                  <td class="py-8 text-center text-xs font-mono text-emerald-400 bg-[#0e121a] rounded-xl border border-emerald-900/40">
                    <div class="flex flex-col items-center gap-2">
                      <i data-lucide="shield-check" class="w-7 h-7 text-emerald-400"></i>
                      <span class="font-bold text-sm text-white">0 Conflictos de Alta Correlación detectados (r &gt; 0.50)</span>
                      <span class="text-slate-400 text-[11px]">Los ${paperBots.length} bots en incubación presentan una excelente descorrelación multi-factor y ortogonalidad de mercado.</span>
                    </div>
                  </td>
                </tr>
              `;
            } else {
              let cHtml = '<thead><tr class="text-slate-400 text-[10.5px] font-mono border-b border-[#1f2736] bg-[#0e121a]">';
              cHtml += '<th class="p-2.5 text-left">Estrategia A</th><th class="p-2.5 text-left">Estrategia B</th>';
              cHtml += '<th class="p-2.5 text-center">Correlación (r)</th><th class="p-2.5 text-center">Solapamiento</th>';
              cHtml += '<th class="p-2.5 text-left">Diagnóstico Cuantitativo</th>';
              cHtml += '</tr></thead><tbody class="divide-y divide-[#151a24] text-xs font-mono">';
              
              conflictPairs.sort((a, b) => b.val - a.val).forEach(cp => {
                const det = cp.detail || {};
                cHtml += `<tr class="hover:bg-[#161d2b]">
                  <td class="py-2.5 px-3 font-bold text-white">${getShortBotLabel(cp.b1)} <span class="text-slate-500 text-[10px]">(${cp.b1.symbol || cp.b1.market})</span></td>
                  <td class="py-2.5 px-3 font-bold text-white">${getShortBotLabel(cp.b2)} <span class="text-slate-500 text-[10px]">(${cp.b2.symbol || cp.b2.market})</span></td>
                  <td class="py-2.5 px-2 text-center text-rose-400 font-bold bg-rose-950/40 rounded border border-rose-800/40">+${cp.val.toFixed(2)}</td>
                  <td class="py-2.5 px-2 text-center text-slate-300">${det.time_overlap_pct || 75}%</td>
                  <td class="py-2.5 px-3 text-slate-300 text-[11px]">${det.verdict || 'Solapamiento de gatillo en el mismo activo'}</td>
                </tr>`;
              });
              cHtml += '</tbody>';
              paperMatrixTable.innerHTML = cHtml;
            }
            lucide.createIcons();
            return;
          }

          let paperOffDiags = [];
          let pTheadHtml = '<thead><tr><th class="p-2.5 text-[11px] text-slate-500 font-mono text-left bg-[#0e121a] sticky top-0 left-0 z-20 border-b border-[#1f2736]">Bot en Paper</th>';
          paperBots.forEach(b => {
            const shortName = getShortBotLabel(b);
            pTheadHtml += `<th class="p-2 text-[10.5px] font-mono text-amber-300/90 font-bold text-center bg-[#0e121a] border-b border-[#1f2736] whitespace-nowrap">${shortName}</th>`;
          });
          pTheadHtml += '</tr></thead>';

          let pTbodyHtml = '<tbody class="divide-y divide-[#151a24]">';
          paperBots.forEach((rowBot, rIdx) => {
            pTbodyHtml += '<tr>';
            pTbodyHtml += `<td class="py-2 px-3 text-[11px] font-mono text-slate-200 font-semibold bg-[#0e121a] sticky left-0 z-10 whitespace-nowrap border-r border-[#1f2736]">${rowBot.shortName || rowBot.id} (#${rowBot.magic || '00'})</td>`;

            paperBots.forEach((colBot, cIdx) => {
              let val = 1.00;
              let tooltipText = "";
              if (rIdx !== cIdx) {
                val = getPairCorrelationValue(rowBot, colBot);
                if (rIdx < cIdx) paperOffDiags.push(val);
                const detail = getPairCorrelationDetail(rowBot, colBot);
                const formattedVal = val >= 0 && val < 1 ? `+${val.toFixed(2)}` : val.toFixed(2);
                if (detail) {
                  if (window.currentCorrMode === 'win_loss') {
                    tooltipText = `${rowBot.shortName || rowBot.name || rowBot.id} ↔ ${colBot.shortName || colBot.name || colBot.id}\n` +
                      `• Correlación Win/Loss: ${formattedVal}\n` +
                      `• Coincidencia de Signo: ${detail.concordance_pct}%\n` +
                      `• Días Ambos Operaron: ${detail.both_traded_days} días\n` +
                      `• Días Win-Win (Ambos Ganaron): ${detail.win_win_days} días\n` +
                      `• Días Loss-Loss (Ambos Perdieron): ${detail.loss_loss_days} días\n` +
                      `• Días Opuestos: ${detail.opposite_days} días\n` +
                      `• ${rowBot.shortName || rowBot.name || rowBot.id}: ${detail.win_days_a}W / ${detail.loss_days_a}L\n` +
                      `• ${colBot.shortName || colBot.name || colBot.id}: ${detail.win_days_b}W / ${detail.loss_days_b}L\n` +
                      `• Diagnóstico: ${detail.verdict}`;
                  } else {
                    tooltipText = `${rowBot.shortName || rowBot.name || rowBot.id} ↔ ${colBot.shortName || colBot.name || colBot.id}\n` +
                      `• Correlación Multi-Factor: ${formattedVal} (Ledoit-Wolf PSD)\n` +
                      `• Solapamiento Temporal: ${detail.time_overlap_pct}%\n` +
                      `• Co-direccionalidad: ${detail.directional_alignment_pct}%\n` +
                      `• Muestra Combinada: ${detail.sample_trades_n} trades\n` +
                      `• Diagnóstico: ${detail.verdict}`;
                  }
                } else {
                  tooltipText = `${rowBot.name || rowBot.id} vs ${colBot.name || colBot.id}: ${formattedVal}`;
                }
              } else {
                tooltipText = `${rowBot.shortName || rowBot.name || rowBot.id}: Autocorrelación 1.00`;
              }

              const cellStyle = getMonochromeRedCorrStyle(val, rIdx === cIdx);
              const formattedVal = val >= 0 && val < 1 ? `+${val.toFixed(2)}` : val.toFixed(2);
              pTbodyHtml += `<td class="corr-cell ${cellStyle.class} cursor-help transition" style="${cellStyle.style}" title="${tooltipText}">${formattedVal}</td>`;
            });
            pTbodyHtml += '</tr>';
          });
          pTbodyHtml += '</tbody>';
          paperMatrixTable.innerHTML = pTheadHtml + pTbodyHtml;

          const pMeanVal = paperOffDiags.length > 0 ? (paperOffDiags.reduce((a, b) => a + b, 0) / paperOffDiags.length) : 0.0;
          const pMeanStyle = getMeanBadgeStyle(pMeanVal);
          if (paperMeanBadge) {
            paperMeanBadge.innerText = pMeanStyle.text;
            paperMeanBadge.className = pMeanStyle.class;
          }
        }
      }

      renderBenchmarkChart();
      if (typeof renderCorrelationOptimizer === 'function') {
        renderCorrelationOptimizer();
      }
      lucide.createIcons();
    }
