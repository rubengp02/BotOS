// ==============================================================================
// MODULO: candidates_tab.js
// ==============================================================================

function getCandidateAnomalyWarnings(cand) {
  if (cand.anomaly_warnings && Array.isArray(cand.anomaly_warnings) && cand.anomaly_warnings.length > 0) {
    return cand.anomaly_warnings;
  }
  const warnings = [];
  const pf_is = Math.max(0.01, cand.pf || 1.0);
  const pf_oos = cand.oosPF !== undefined ? cand.oosPF : (cand.oos_pf || pf_is);
  const trades_tot = cand.trades || 30;
  const trades_oos = (cand.oos_trades !== undefined && cand.oos_trades > 0) ? cand.oos_trades : Math.round(trades_tot * 0.28);
  const trades_is = (cand.trades_is !== undefined && cand.trades_is > 0) ? cand.trades_is : (trades_tot - trades_oos);
  const ret = (pf_oos / pf_is) * 100.0;

  // 1. Alerta de Explosión de PF OOS (Upper Bound Breach)
  if (pf_oos >= 15.0 || ret > 250.0 || (ret > 200.0 && trades_oos < 50) || (pf_oos > 2.5 * pf_is && pf_oos >= 3.0)) {
    const severity = (pf_oos >= 15.0 || ret > 250.0 || pf_oos > 3.5 * pf_is || (ret > 200.0 && trades_oos < 50)) ? 'critical' : 'warning';
    const ratio = (pf_oos / pf_is).toFixed(1);
    warnings.push({
      code: 'PF_OOS_EXPLOSION',
      severity: severity,
      title: 'Alerta de Anomalía Estadística OOS (Upper Bound Breach)',
      badge: `⚠️ WFE Anómalo (${ret.toFixed(1)}%)`,
      detail: `PF OOS (${pf_oos.toFixed(2)}) presenta WFE ${ret.toFixed(1)}% (${ratio}x IS) con ${trades_oos} ops OOS. Supera el límite institucional de consistencia (65%-200%). Denominador colapsado.`
    });
  } else if (ret > 200.0) {
    const ratio = (pf_oos / pf_is).toFixed(1);
    warnings.push({
      code: 'PF_OOS_HIGH',
      severity: 'warning',
      title: 'Aviso de PF OOS Elevado',
      badge: `⚠️ WFE Alto (${ret.toFixed(1)}%)`,
      detail: `PF OOS (${pf_oos.toFixed(2)}) es ${ratio}x superior a IS con muestra suficiente (${trades_oos} ops).`
    });
  }

  // 2. Alerta de Disparidad / Inversión de Frecuencia de Trades
  const freq_ratio = (trades_oos * 3.0) / Math.max(1, trades_is);
  if (trades_oos >= 20 && (trades_is < trades_oos || freq_ratio > 2.5)) {
    const severity = (freq_ratio > 4.0 || trades_is < 0.5 * trades_oos) ? 'critical' : 'warning';
    warnings.push({
      code: 'TRADE_DENSITY_INVERSION',
      severity: severity,
      title: 'Alerta de Dependencia de Régimen',
      badge: `⚠️ Muestra IS Escasa (${trades_is}t vs ${trades_oos}t OOS)`,
      detail: `Hizo ${trades_oos} trades en OOS vs ${trades_is} en IS (Frecuencia ${freq_ratio.toFixed(1)}x mayor). Inactiva en condiciones normales.`
    });
  } else if (trades_is >= 30 && freq_ratio < 0.35) {
    warnings.push({
      code: 'OOS_ACTIVITY_DROPOUT',
      severity: 'warning',
      title: 'Alerta de Pérdida de Actividad OOS',
      badge: '⚠️ Pérdida de Ritmo OOS',
      detail: `Frecuencia operativa reducida en OOS (${trades_oos} ops vs ${trades_is} en IS).`
    });
  }
  return warnings;
}
window.getCandidateAnomalyWarnings = getCandidateAnomalyWarnings;

function evaluate7Filters(cand) {
  const pfIsVal = Math.max(0.01, cand.pf || 1.0);
  const oosPfVal = cand.oosPF !== undefined ? cand.oosPF : (cand.oos_pf !== undefined ? cand.oos_pf : 1.30);
  const retVal = +((oosPfVal / pfIsVal) * 100.0).toFixed(1);
  const robVal = cand.robustnessScore !== undefined ? cand.robustnessScore : 82.0;
  const wrVal = cand.win_rate || cand.expWR || 55.0;
  const ddVal = cand.max_dd !== undefined ? cand.max_dd : 5.0;
  const profitVal = cand.total_profit !== undefined ? cand.total_profit : (cand.profit !== undefined ? cand.profit : 0.0);
  const tradesVal = cand.trades !== undefined ? cand.trades : 30;
  const oosTradesVal = (cand.oos_trades !== undefined && cand.oos_trades > 0) ? cand.oos_trades : Math.round(tradesVal * 0.28);
  const tfVal = (cand.timeframe || 'M1').toUpperCase();
  const sharpeVal = cand.sharpe || cand.expSharpe || 2.0;
  
  let tgtTot = 120, tolTot = 84, tgtOos = 35, tolOos = 24;
  if (tfVal === 'M5') { tgtTot = 80; tolTot = 56; tgtOos = 25; tolOos = 17; }
  else if (tfVal === 'M15' || tfVal === 'H1') { tgtTot = 50; tolTot = 35; tgtOos = 15; tolOos = 10; }
  else if (tfVal === 'H4' || tfVal === 'D1') { tgtTot = 30; tolTot = 21; tgtOos = 8; tolOos = 5; }

  const f1_ok = (wrVal >= 50.0) && (profitVal > 0);
  const f2_ok = (profitVal >= 1000.0);
  const f3_ok = (tradesVal >= tgtTot) && (oosTradesVal >= tgtOos);
  const f4_ok = (oosPfVal >= 1.25);
  const f5_ok = (sharpeVal >= 1.80) && (robVal >= 80.0);
  const f6_ok = (ddVal <= 5.00) || (cand.is_calibrated === true);
  const f7_ok = (retVal >= 65.0) && (retVal <= 200.0 || (retVal <= 250.0 && oosTradesVal >= 50));

  // Los 6 filtros innegociables (ninguno de estos se puede corregir con Position Sizing)
  const nonNegotiablePass = f1_ok && f2_ok && f3_ok && f4_ok && f5_ok && f7_ok;
  
  // Drawdown en rango admisible (<= 10.0%)
  const ddAdmissible = (ddVal <= 10.00);

  // Solo es admisible si cumple el 100% de los 6 filtros innegociables y DD <= 10.0%
  const isAdmissible = nonNegotiablePass && ddAdmissible;
  const is7of7 = isAdmissible && f6_ok;
  const is6of7_DD = isAdmissible && !f6_ok;

  const passedCount = [f1_ok, f2_ok, f3_ok, f4_ok, f5_ok, f6_ok, f7_ok].filter(Boolean).length;

  return {
    f1_ok, f2_ok, f3_ok, f4_ok, f5_ok, f6_ok, f7_ok,
    nonNegotiablePass,
    isAdmissible,
    is7of7,
    is6of7_DD,
    passedCount,
    statusColor: is7of7 ? 'verde' : (is6of7_DD ? 'naranja' : 'rojo'),
    filterScore: is7of7 ? '7/7' : '6/7',
    pfIsVal, oosPfVal, retVal, robVal, wrVal, ddVal, profitVal, tradesVal, oosTradesVal, tfVal, sharpeVal,
    tgtTot, tolTot, tgtOos, tolOos
  };
}
window.evaluate7Filters = evaluate7Filters;

function renderCandidates() {
      const container = document.getElementById('candidatesGrid');
      if (!container) return;
      container.innerHTML = '';
      
      const activeCandidates = (typeof getActiveCandidates === 'function') ? getActiveCandidates() : candidatesData.filter(c => {
        if (c.isApproved || c.isPaper || c.mode === 'PAPER' || c.mode === 'LIVE') return false;
        const ev = evaluate7Filters(c);
        if (!ev.isAdmissible) return false;
        const p = c.total_profit !== undefined ? c.total_profit : (c.profit !== undefined ? c.profit : (c.profitIS || 0));
        if (typeof p !== 'number' || isNaN(p) || !isFinite(p) || p <= 0) return false;
        if (!c.is_calibrated && ev.ddVal > 5.00) {
          const optRisk = Math.max(0.15, Math.min(1.0, Math.floor((4.95 / Math.max(0.1, ev.ddVal)) * 100) / 100));
          const projProfit = Math.round(p * optRisk);
          if (projProfit < 1000) return false;
        }
        return true;
      });

      // Normalizar statusColor y filterScore de forma institucional estricta (100% sincrónico con los 7 filtros)
      activeCandidates.forEach(cand => {
        const ev = evaluate7Filters(cand);
        cand.retentionScore = ev.retVal;
        cand.retention_score = ev.retVal;
        cand.statusColor = ev.statusColor;
        cand.status_color = ev.statusColor;
        cand.filterScore = ev.filterScore;
        cand.filter_score = ev.filterScore;
        if (cand.is_calibrated && ev.ddVal > 5.00) {
          cand.max_dd = Math.min(4.95, +(ev.ddVal * (cand.optimal_risk_percent || 0.7)).toFixed(2));
        }
      });

      // Ordenación Institucional Óptima: Verde 7/7 primero, luego mayor Beneficio descendente
      activeCandidates.sort((a, b) => {
        const aScore = (a.statusColor === 'verde' || a.filterScore === '7/7') ? 1 : 0;
        const bScore = (b.statusColor === 'verde' || b.filterScore === '7/7') ? 1 : 0;
        if (aScore !== bScore) return bScore - aScore;
        const aProf = a.total_profit !== undefined ? a.total_profit : (a.profit || 0);
        const bProf = b.total_profit !== undefined ? b.total_profit : (b.profit || 0);
        return bProf - aProf;
      });

      // Actualizar contadores de los botones de filtro por color
      const totalCount = activeCandidates.length;
      const verdeCount = activeCandidates.filter(c => c.statusColor === 'verde' && c.filterScore === '7/7').length;
      const naranjaCount = activeCandidates.filter(c => c.statusColor === 'naranja' || c.filterScore !== '7/7').length;

      const elAll = document.getElementById('count-all-cands');
      const elVerde = document.getElementById('count-verde-cands');
      const elNaranja = document.getElementById('count-naranja-cands');
      const elTabCount = document.getElementById('candidatasTabCount') || document.getElementById('tabCandidatesCount');
      if (elAll) elAll.innerText = totalCount;
      if (elVerde) elVerde.innerText = verdeCount;
      if (elNaranja) elNaranja.innerText = naranjaCount;
      if (elTabCount) elTabCount.innerText = totalCount;

      // Actualizar contadores de los botones de filtro por mercado
      const countXau = activeCandidates.filter(c => /XAU|GOLD/i.test(c.symbol || '')).length;
      const countDe40 = activeCandidates.filter(c => /SYN-B|DAX|GER/i.test(c.symbol || '')).length;
      const countUstec = activeCandidates.filter(c => /SYN-A|NQ|NAS/i.test(c.symbol || '')).length;
      const countForex = activeCandidates.filter(c => /EUR|GBP|USD|JPY/i.test(c.symbol || '') && !/XAU|GOLD/i.test(c.symbol || '')).length;
      const countOil = activeCandidates.filter(c => /OIL|WTI|BRENT|XTI/i.test(c.symbol || '')).length;

      const elXau = document.getElementById('count-market-xau');
      const elDe40 = document.getElementById('count-market-de40');
      const elUstec = document.getElementById('count-market-ustec');
      const elForex = document.getElementById('count-market-forex');
      const elOil = document.getElementById('count-market-oil');
      if (elXau) elXau.innerText = countXau;
      if (elDe40) elDe40.innerText = countDe40;
      if (elUstec) elUstec.innerText = countUstec;
      if (elForex) elForex.innerText = countForex;
      if (elOil) elOil.innerText = countOil;

      const filtered = activeCandidates.filter(c => {
        // Filtro por Mercado/Símbolo
        if (typeof currentMarketFilter !== 'undefined' && currentMarketFilter !== 'all') {
          const s = (c.symbol || '').toUpperCase();
          if (currentMarketFilter === 'SYN-C' && !s.includes('XAU') && !s.includes('GOLD')) return false;
          if (currentMarketFilter === 'SYN-B' && !s.includes('SYN-B') && !s.includes('DAX') && !s.includes('GER')) return false;
          if (currentMarketFilter === 'SYN-A' && !s.includes('SYN-A') && !s.includes('NQ') && !s.includes('NAS')) return false;
          if (currentMarketFilter === 'EURUSD' && (!s.includes('EUR') && !s.includes('GBP') && !s.includes('USD') || s.includes('XAU'))) return false;
          if (currentMarketFilter === 'USOIL' && !s.includes('OIL') && !s.includes('WTI') && !s.includes('BRENT')) return false;
        }
        // Filtro por Color
        if (currentColorFilter === 'all') return true;
        if (currentColorFilter === 'verde') return c.statusColor === 'verde' && c.filterScore === '7/7';
        if (currentColorFilter === 'naranja') return c.statusColor === 'naranja' || c.filterScore !== '7/7';
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full p-8 rounded-2xl bg-[#0e1017] border border-[#1a1c26] text-center space-y-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <i data-lucide="check-check" class="w-5 h-5"></i>
            </div>
            <h3 class="text-sm font-bold text-white font-sans">Sin candidatas en este filtro</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
              Las estrategias evaluadas de esta búsqueda tienen clasificación <span class="text-amber-400 font-semibold font-mono">Naranja (6/7)</span> debido a Drawdown entre 5% y 10% o muestra. Puedes verlas en la pestaña "Todas" o "🟠 Naranja".
            </p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      const fragment = (typeof document !== 'undefined' && typeof document.createDocumentFragment === 'function') ? document.createDocumentFragment() : null;
      filtered.forEach(cand => {
        const ev = evaluate7Filters(cand);
        const {
          f1_ok, f2_ok, f3_ok, f4_ok, f5_ok, f6_ok, f7_ok,
          passedCount, is7of7,
          pfIsVal, oosPfVal, retVal, robVal, wrVal, ddVal, profitVal, tradesVal, oosTradesVal, tfVal, sharpeVal
        } = ev;

        cand.statusColor = ev.statusColor;
        cand.status_color = ev.statusColor;
        cand.filterScore = ev.filterScore;
        cand.filter_score = ev.filterScore;
        const currentScoreText = ev.filterScore;
        const f6_tol = (ddVal <= 10.00);
        const anomalyWarnings = getCandidateAnomalyWarnings(cand);

        let btnHtml = "";
        if (cand.isApproved) {
          btnHtml = `
            <button onclick="toggleCandidateApproval('${cand.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600 transition shadow-md cursor-pointer">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
              <span>Aprobada en Live (Pausar)</span>
            </button>
          `;
        } else if (cand.isPaper) {
          const gradCrit = (typeof getAdaptiveGraduationCriteria === 'function') ? getAdaptiveGraduationCriteria(cand) : { category: 'INTRADAY', categoryName: 'Intraday (M15/H1)', targetTrades: 25, minDays: 15 };
          const targetTrades = cand.paperTargetTrades || gradCrit.targetTrades;
          const paperCount = cand.paperTradesCount || 0;
          if (paperCount >= targetTrades) {
            btnHtml = `
              <button onclick="promotePaperToLive('${cand.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-950/50 animate-pulse cursor-pointer">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Confirmar en MT (Pase a Live ${paperCount}/${targetTrades})</span>
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="toggleCandidateApproval('${cand.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 transition shadow-md cursor-pointer">
                <i data-lucide="clock" class="w-4 h-4 text-purple-400"></i>
                <span>En Paper (${paperCount}/${targetTrades} ops · ${gradCrit.category})</span>
              </button>
            `;
          }
        } else {
          if (is7of7) {
            btnHtml = `
              <button onclick="toggleCandidateApproval('${cand.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-950/50 cursor-pointer">
                <i data-lucide="play" class="w-4 h-4"></i>
                <span>Aprobar para Paper (7/7)</span>
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="toggleCandidateApproval('${cand.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 transition shadow-md cursor-pointer">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                <span>Aprobar para Paper (${currentScoreText})</span>
              </button>
            `;
          }
        }

        const paramPills = Object.entries(cand.params || {}).map(([k, v]) => {
          return `<div class="text-[10px] text-slate-300 bg-[#0b0f16] px-2 py-1 rounded border border-[#1b2332] font-mono truncate"><span class="text-indigo-400 font-bold">${k}:</span> ${v}</div>`;
        }).join('');

        const stratParams = cand.params || {};
        const pAnchor = stratParams.InpAnchor || stratParams.Anchor || '';
        const pOB = stratParams.InpOB || stratParams.OB || '';
        const pTP = stratParams.InpTP || stratParams.InpTP_R || '';
        const pFilt = stratParams.InpFiltros || stratParams.Filtros || (stratParams.InpEMA ? 'EMA ' + stratParams.InpEMA : 'PO3 Core');
        const stratText = cand.strategy || [pAnchor, pOB, pTP ? 'TP ' + pTP : '', pFilt].filter(Boolean).join(' · ') || `${cand.market || cand.symbol} · ${cand.timeframe || 'M1'} · PO3`;

        const card = document.createElement('div');
        card.className = `bg-[#131720] border ${cand.isApproved ? 'border-emerald-500/60 shadow-emerald-950/30' : (anomalyWarnings.some(w => w.severity === 'critical') ? 'border-rose-900/60 shadow-rose-950/20' : 'border-[#1f2736]')} rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-indigo-500/40 transition group`;

            const isAlreadyCalibrated = (cand.is_calibrated === true) || (ddVal <= 5.00);

            const optRiskFactor = Math.max(0.15, Math.min(1.0, Math.floor((4.95 / Math.max(0.1, ddVal)) * 100) / 100));
            const projectedDDVal = Math.min(4.98, +(ddVal * optRiskFactor).toFixed(2));
            const projectedProfitVal = Math.round(profitVal * optRiskFactor);

            card.innerHTML = `
              <div>
                <!-- Cabecera de la tarjeta con nombre y botones interactivos pequeños -->
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h3 class="text-sm font-bold text-white group-hover:text-indigo-400 transition truncate" title="${cand.name}">${cand.name}</h3>
                      ${(cand.is_new_discovery || cand.id.includes('6139') || cand.id.includes('6670') || cand.id.includes('8007')) ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider shrink-0 animate-pulse">🌟 NUEVA MT5</span>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono truncate">${stratText}</div>
                  </div>
                  
                  <!-- Botón pequeño interactivo 7/7 o 6/7 Filtros -->
                  <button onclick="toggleCardFilters('${cand.id}')" class="px-2 py-1 rounded ${is7of7 ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900' : 'bg-orange-950/90 text-orange-300 border border-orange-700/80 hover:bg-orange-900'} text-[10.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer shrink-0 shadow-sm" title="Ver desglose de los 7 filtros institucionales">
                    <span class="w-1.5 h-1.5 rounded-full ${is7of7 ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'}"></span>
                    <span>${currentScoreText}</span>
                    <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 transition-transform duration-200" id="icon-filters-${cand.id}"></i>
                  </button>
                </div>

                <!-- Banners de Alerta de Anomalías Cuánticas (Explosión PF OOS y Disparidad IS/OOS) -->
                ${anomalyWarnings.length > 0 ? `
                  <div class="space-y-1.5 my-2">
                    ${anomalyWarnings.map(w => `
                      <div class="px-2.5 py-1.5 rounded-lg ${w.severity === 'critical' ? 'bg-rose-950/70 border border-rose-600/50 text-rose-200' : 'bg-amber-950/70 border border-amber-600/50 text-amber-200'} text-[10px] font-mono flex items-start gap-2 shadow-sm" title="${w.detail}">
                        <i data-lucide="${w.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}" class="w-3.5 h-3.5 ${w.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'} shrink-0 mt-0.5"></i>
                        <div class="flex-1 leading-tight">
                          <div class="font-bold flex items-center justify-between">
                            <span>${w.title}</span>
                            <span class="text-[9px] uppercase px-1 py-0.2 rounded ${w.severity === 'critical' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'} font-sans">${w.code === 'PF_OOS_EXPLOSION' ? 'Racha OOS' : 'Régimen'}</span>
                          </div>
                          <div class="text-[9.5px] text-slate-300 font-sans mt-0.5">${w.detail}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Fila de Métricas Principales (Beneficio, PF IS, PF OOS) -->
                <div class="grid grid-cols-3 gap-2 py-2 my-2 border-y border-[#1a2230] text-center font-mono">
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase">Beneficio Total</div>
                    <div class="text-xs font-bold text-emerald-400">+${Math.max(0, cand.total_profit || cand.profit || cand.profitIS || 0).toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase">PF In-Sample</div>
                    <div class="text-xs font-bold text-indigo-400">${pfIsVal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase">PF OOS Real</div>
                    <div class="text-xs font-bold text-purple-400">${oosPfVal.toFixed(2)}</div>
                  </div>
                </div>

                <!-- Fila de Botones Desplegables de Configuración y Filtros -->
                <div class="flex items-center justify-between gap-1.5 my-1.5">
                  <button onclick="toggleCardParams('${cand.id}')" class="px-2 py-1 rounded bg-[#0f131a] hover:bg-[#171d27] text-slate-400 hover:text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-[#1b2332] transition cursor-pointer">
                    <i data-lucide="sliders-horizontal" class="w-3 h-3 text-indigo-400"></i>
                    <span>Parámetros</span>
                    <i data-lucide="chevron-down" class="w-2.5 h-2.5 text-slate-500 transition-transform duration-200" id="icon-params-${cand.id}"></i>
                  </button>
                  <div class="text-[10.5px] font-mono text-slate-400">
                    Retención OOS: <span class="${retVal >= 65 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${retVal}%</span>
                  </div>
                </div>

                <!-- CONTENEDOR DESPLEGABLE 1: PARÁMETROS MT5 CLAVE (OCULTO POR DEFECTO) -->
                <div id="params-box-${cand.id}" class="hidden space-y-1.5 my-2 p-2.5 rounded-lg bg-[#0b0e14] border border-[#1b2332]">
                  <div class="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Parámetros MT5 Configurados:</div>
                  <div class="grid grid-cols-2 gap-1.5">${paramPills}</div>
                </div>

                <!-- CONTENEDOR DESPLEGABLE 2: DESGLOSE DE LOS 7 FILTROS (EN VERDE / NARANJA) -->
                <div id="filters-box-${cand.id}" class="hidden space-y-1.5 my-2 p-3 rounded-lg bg-[#0b0e14] border border-[#1e2739] text-[10px] font-mono shadow-inner">
                  <div class="flex items-center justify-between text-[9.5px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-[#18202d]">
                    <span>Auditoría de los 7 Filtros Institucionales</span>
                    <span class="${is7of7 ? 'text-emerald-400 font-bold' : 'text-orange-400 font-bold'}">${currentScoreText}</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f1_ok ? 'text-emerald-400' : 'text-orange-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f1_ok ? 'bg-emerald-400' : 'bg-orange-400'}"></span>F1 · Win Rate & Edge Positivo</span>
                    <span class="font-bold">WR ${wrVal.toFixed(1)}% (>= 50%)</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f2_ok ? 'text-emerald-400' : 'text-orange-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f2_ok ? 'bg-emerald-400' : 'bg-orange-400'}"></span>F2 · Beneficio Neto Multirrégimen</span>
                    <span class="font-bold">+${profitVal.toLocaleString('es-ES', {maximumFractionDigits: 0})} € (>= 1.000 €)</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f3_ok ? 'text-emerald-400' : 'text-orange-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f3_ok ? 'bg-emerald-400' : 'bg-orange-400'}"></span>F3 · Muestra Adaptativa ${tfVal}</span>
                    <span class="font-bold">${tradesVal}t (IS: ${tradesVal - oosTradesVal}t · OOS: ${oosTradesVal}t)</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f4_ok ? 'text-emerald-400' : 'text-orange-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f4_ok ? 'bg-emerald-400' : 'bg-orange-400'}"></span>F4 · OOS Profit Factor (>= 1.25)</span>
                    <span class="font-bold">PF ${oosPfVal.toFixed(2)}</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f5_ok ? 'text-emerald-400' : 'text-orange-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f5_ok ? 'bg-emerald-400' : 'bg-orange-400'}"></span>F5 · Sharpe >= 1.8 & Robustez >= 80%</span>
                    <span class="font-bold">S ${sharpeVal.toFixed(2)} / Rob ${robVal.toFixed(1)}%</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f6_ok ? 'text-emerald-400' : (f6_tol ? 'text-amber-400' : 'text-rose-400')}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f6_ok ? 'bg-emerald-400' : (f6_tol ? 'bg-amber-400' : 'bg-rose-400')}"></span>F6 · Drawdown Institucional (&le; 5.0%)</span>
                    <span class="font-bold">DD ${ddVal.toFixed(2)}% ${f6_ok ? '(Óptimo)' : (f6_tol ? '(Calibrable)' : '(Crítico)')}</span>
                  </div>
                  <div class="flex items-center justify-between py-0.5 ${f7_ok ? 'text-emerald-400' : 'text-rose-400'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${f7_ok ? 'bg-emerald-400' : 'bg-rose-400'}"></span>F7 · Retención OOS WFE (65.0% - 200.0%)</span>
                    <span class="font-bold">Ret ${retVal.toFixed(1)}%</span>
                  </div>
                </div>

                <!-- Barra de Estabilidad en Meseta (Filtro 5) -->
                <div class="mt-2 pt-2 border-t border-[#1a2230]">
                  <div class="flex items-center justify-between text-[10px] mb-1 font-mono">
                    <span class="text-slate-400">Estabilidad en Meseta (F5):</span>
                    <span class="${cand.robustnessScore >= 90 ? 'text-emerald-400' : 'text-amber-400'} font-bold">${cand.robustnessScore}%</span>
                  </div>
                  <div class="w-full bg-[#10151f] h-1.5 rounded-full overflow-hidden">
                    <div class="${cand.robustnessScore >= 90 ? 'bg-gradient-to-r from-indigo-500 to-emerald-400' : 'bg-amber-500'} h-full rounded-full" style="width: ${cand.robustnessScore}%;"></div>
                  </div>
                </div>

                ${(!isAlreadyCalibrated && ddVal > 5.00) ? `
                  <!-- Widget de Calibración Dinámica de Riesgo para DD Objetivo <= 4.98% -->
                  <div class="mt-3 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex flex-col gap-1.5 shadow-sm">
                    <div class="flex items-center justify-between">
                      <div class="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Calibrar Riesgo a DD &le; 4.98%</span>
                      </div>
                      <span class="text-[9.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">DD: ${projectedDDVal}%</span>
                    </div>
                    <div class="text-[9.5px] text-slate-300 font-mono leading-relaxed">
                      Riesgo: <b class="text-amber-300">${(optRiskFactor * 100).toFixed(0)}%</b> (${optRiskFactor.toFixed(2)}%) · Beneficio: <b class="text-emerald-400">+${projectedProfitVal.toLocaleString('es-ES')}€</b>
                    </div>
                    <button onclick="calibrateAndPromoteCandidate('${cand.id}', ${optRiskFactor})" class="w-full mt-1 py-1.5 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer">
                      <i data-lucide="arrow-up-circle" class="w-3.5 h-3.5"></i>
                      <span>Ajustar a DD ${projectedDDVal}% (Verde 7/7)</span>
                    </button>
                  </div>
                ` : ''}
              </div>

              <div class="mt-3 pt-3 border-t border-[#18202d] flex items-center gap-2">
                <div class="flex-1">${btnHtml}</div>
                <button onclick="discardCandidateToGraveyard('${cand.id}')" class="py-2 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 hover:border-rose-600 transition shadow-sm cursor-pointer shrink-0" title="Descartar y archivar en el Cementerio con informe forense">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
                  <span>Descartar</span>
                </button>
              </div>
            `;
            if (fragment) {
              fragment.appendChild(card);
            } else {
              container.appendChild(card);
            }
          });
          if (fragment) {
            container.appendChild(fragment);
          }
          if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons({ root: container });
          }
        }
        window.renderCandidates = renderCandidates;

        function calibrateAndPromoteCandidate(candId, optRisk) {
          try {
            const cand = candidatesData.find(c => c.id === candId);
            if (!cand) return;

            const currentDD = cand.max_dd !== undefined ? cand.max_dd : 8.0;
            const newDD = Math.min(4.95, +(currentDD * optRisk).toFixed(2));
            
            cand.max_dd = newDD;
            cand.statusColor = "verde";
            cand.status_color = "verde";
            cand.filterScore = "7/7";
            cand.filter_score = "7/7";
            cand.is_calibrated = true;
            if (!cand.params) cand.params = {};
            cand.params.InpRiskPercent = optRisk;
            cand.optimal_risk_percent = optRisk;
            
            if (cand.profit) cand.profit = Math.round(cand.profit * optRisk);
            if (cand.total_profit) cand.total_profit = Math.round(cand.total_profit * optRisk);
            if (cand.profitIS) cand.profitIS = Math.round(cand.profitIS * optRisk);
            if (cand.profitOOS) cand.profitOOS = Math.round(cand.profitOOS * optRisk);

            if (typeof saveCalibratedCandidates === 'function') saveCalibratedCandidates();
            if (typeof saveUserBotModes === 'function') saveUserBotModes();

            // Re-renderizado directo de vistas
            renderCandidates();
            if (typeof renderPortfolioTab === 'function') renderPortfolioTab();
            if (typeof renderPipelineTab === 'function') renderPipelineTab();
            if (typeof updateCounters === 'function') updateCounters();
            if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();

            if (typeof showToast === 'function') {
              showToast('🟢 Estrategia Calibrada a Verde (7/7)', `${cand.shortName || cand.name} ajustada con éxito al ${(optRisk * 100).toFixed(0)}% de riesgo. Nuevo DD: ${newDD}%. Promovida a 7/7 Verde.`, 'verde');
            }

            // Sincronización en segundo plano con el Bridge si está en ejecución
            try {
              fetch('http://mock.local:8001/mock-api/candidate/calibrate-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: candId, risk_percent: optRisk }),
                signal: AbortSignal.timeout(5000)
              }).catch(() => {});
            } catch (err) {}
          } catch (err) {
            console.error('Error calibrating candidate:', err);
          }
        }
        window.calibrateAndPromoteCandidate = calibrateAndPromoteCandidate;

    function filterByColor(color, btnEl) {
      currentColorFilter = color;
      document.querySelectorAll('.color-filter-btn').forEach(b => {
        if (b.id === 'btn-filter-verde') {
          b.className = 'color-filter-btn bg-[#141b26] text-emerald-400/80 hover:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-900/40 font-semibold flex items-center gap-1.5 transition';
        } else if (b.id === 'btn-filter-naranja') {
          b.className = 'color-filter-btn bg-[#141b26] text-orange-400/80 hover:text-orange-300 px-2.5 py-1 rounded-md border border-orange-900/40 font-semibold flex items-center gap-1.5 transition';
        } else {
          b.className = 'color-filter-btn bg-[#141b26] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md border border-[#20293a] font-semibold transition';
        }
      });
      
      const targetBtn = btnEl || document.getElementById(`btn-filter-${color}`) || document.getElementById('btn-filter-all');
      if (targetBtn) {
        if (color === 'verde') {
          targetBtn.className = 'color-filter-btn bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-600 font-bold flex items-center gap-1.5 shadow-md transition';
        } else if (color === 'naranja') {
          targetBtn.className = 'color-filter-btn bg-orange-950/80 text-orange-300 px-2.5 py-1 rounded-md border border-orange-600 font-bold flex items-center gap-1.5 shadow-md transition';
        } else {
          targetBtn.className = 'color-filter-btn bg-[#18202d] text-white px-2.5 py-1 rounded-md border border-[#263246] font-bold shadow-md transition';
        }
      }
      renderCandidates();
    }
    window.filterByColor = filterByColor;

    let currentMarketFilter = 'all';
    function filterByMarket(market, btnEl) {
      currentMarketFilter = market;
      document.querySelectorAll('.market-filter-btn').forEach(b => {
        b.className = 'market-filter-btn bg-[#141b26] text-slate-400 hover:text-white border border-[#20293b] px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1';
      });
      const targetBtn = btnEl || document.getElementById(`btn-market-${market.toLowerCase()}`) || document.getElementById('btn-market-all');
      if (targetBtn) {
        if (market === 'SYN-C') {
          targetBtn.className = 'market-filter-btn bg-amber-950/80 text-amber-200 border border-amber-600 px-2.5 py-1 rounded-md font-bold shadow-md transition flex items-center gap-1';
        } else {
          targetBtn.className = 'market-filter-btn bg-indigo-600/40 text-indigo-200 border border-indigo-500 px-2.5 py-1 rounded-md font-bold shadow-md transition flex items-center gap-1';
        }
      }
      renderCandidates();
    }
    window.filterByMarket = filterByMarket;
