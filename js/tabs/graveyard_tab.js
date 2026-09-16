// ==============================================================================
// MODULO: graveyard_tab.js
// Pestaña de Cementerio Cuantitativo (Graveyard & Forensic Post-Mortem)
// ==============================================================================

let graveyardBotsData = [
  {
    "id": "DEMO-GRV-01",
    "name": "Dead Sigma 1",
    "symbol": "SYN-C",
    "market": "SYN-C",
    "mode": "ARCHIVED",
    "magic": 20268880,
    "death_reason": "OOS_FAILURE",
    "forensic_report": "Simulated forensic report explaining why this strategy was archived.",
    "final_wfe": 39.1,
    "avg_wfe_at_death": 45.0,
    "sharpe": 1.2,
    "pf": 1.1,
    "max_dd": 12.5,
    "profit": -50.0,
    "trades": 80,
    "retentionScore": 45.0,
    "robustnessScore": 70.0
  },
  {
    "id": "DEMO-GRV-02",
    "name": "Dead Sigma 2",
    "symbol": "SYN-C",
    "market": "SYN-C",
    "mode": "ARCHIVED",
    "magic": 20268881,
    "death_reason": "CORRELATION_PRUNING",
    "forensic_report": "Simulated forensic report explaining why this strategy was archived.",
    "final_wfe": 32.3,
    "avg_wfe_at_death": 45.0,
    "sharpe": 1.2,
    "pf": 1.1,
    "max_dd": 12.5,
    "profit": -50.0,
    "trades": 80,
    "retentionScore": 45.0,
    "robustnessScore": 70.0
  }
];
let currentGraveyardFilter = 'ALL';
let currentGraveyardSearch = '';
let graveyardSummaryData = {
  "total_retired": 2,
  "top_death_reason": "OOS_FAILURE",
  "total_capital_saved": 500,
  "avg_wfe_at_death": 45.0
};

// ==================== RENDERIZADO PRINCIPAL DEL CEMENTERIO ====================

function renderGraveyardTab() {
  const container = document.getElementById('tab-content-graveyard');
  if (!container) return;

  // 0ms Optimistic UI Rendering from memory cache
  const updateUi = () => {
    const tabBtn = document.getElementById('tab-graveyard');
    if (tabBtn) {
      const countSpan = tabBtn.querySelector('span');
      if (countSpan) {
        countSpan.innerText = `Cementerio (${graveyardBotsData.length})`;
      }
    }
    renderGraveyardSummaryKPIs();
    renderGraveyardToolbar();
    renderGraveyardGrid();
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  };

  // Render at 0ms instantly
  updateUi();

  // Non-blocking background sync with Bridge
  (async () => {
    try {
      const bridgeUrl = (typeof BRIDGE_URL !== 'undefined') ? BRIDGE_URL : 'http://mock.local:8001';
      const response = await fetch(`${bridgeUrl}/mock-api/graveyard`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          let hasChange = false;
          if (data.bots && Array.isArray(data.bots) && data.bots.length > 0) {
            if (JSON.stringify(data.bots) !== JSON.stringify(graveyardBotsData)) {
              graveyardBotsData = data.bots;
              hasChange = true;
              try { localStorage.setItem('demo_quant_graveyard_bots', JSON.stringify(graveyardBotsData)); } catch(e){}
            }
          }
          if (data.summary) {
            graveyardSummaryData = data.summary;
            hasChange = true;
          }
          if (hasChange && window.currentActiveTab === 'graveyard') {
            updateUi();
          }
        }
      }
    } catch (err) {}
  })();
}

// ==================== KPIS FORENSES SUPERIORES ====================

function renderGraveyardSummaryKPIs() {
  const elTotal = document.getElementById('graveKpiTotalRetired');
  const elReason = document.getElementById('graveKpiTopReason');
  const elSaved = document.getElementById('graveKpiCapitalSaved');
  const elWfe = document.getElementById('graveKpiAvgWfe');

  if (elTotal) elTotal.innerText = graveyardSummaryData.total_retired || graveyardBotsData.length;
  if (elReason) elReason.innerText = graveyardSummaryData.top_death_reason || 'Solapamiento de Correlación';
  if (elSaved) {
    const val = Number(graveyardSummaryData.total_capital_saved || 0);
    elSaved.innerText = `+${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  if (elWfe) {
    const val = Number(graveyardSummaryData.avg_wfe_at_death || 0);
    elWfe.innerText = `${val.toFixed(1)}%`;
  }
}

// ==================== BARRA DE HERRAMIENTAS Y FILTROS ====================

function renderGraveyardToolbar() {
  const filterBtns = document.querySelectorAll('.grave-filter-btn');
  filterBtns.forEach(btn => {
    const filter = btn.getAttribute('data-filter');
    if (filter === currentGraveyardFilter) {
      btn.className = 'grave-filter-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-600/80 transition cursor-pointer shadow-sm';
    } else {
      btn.className = 'grave-filter-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#141a24] text-slate-400 hover:text-white border border-[#232f42] transition cursor-pointer';
    }
  });

  // Conteo en los botones de filtro
  const countAll = graveyardBotsData.length;
  const countCorr = graveyardBotsData.filter(b => b.death_reason === 'CORRELATION_PRUNING').length;
  const countEdge = graveyardBotsData.filter(b => b.death_reason === 'EDGE_DEGRADATION').length;
  const countOos = graveyardBotsData.filter(b => b.death_reason === 'OOS_FAILURE').length;
  const countManual = graveyardBotsData.filter(b => b.death_reason === 'MANUAL_RETIRED').length;

  const badgeAll = document.getElementById('graveFilterCountAll');
  const badgeCorr = document.getElementById('graveFilterCountCorr');
  const badgeEdge = document.getElementById('graveFilterCountEdge');
  const badgeOos = document.getElementById('graveFilterCountOos');
  const badgeManual = document.getElementById('graveFilterCountManual');

  if (badgeAll) badgeAll.innerText = countAll;
  if (badgeCorr) badgeCorr.innerText = countCorr;
  if (badgeEdge) badgeEdge.innerText = countEdge;
  if (badgeOos) badgeOos.innerText = countOos;
  if (badgeManual) badgeManual.innerText = countManual;
}

function setGraveyardFilter(filter) {
  currentGraveyardFilter = filter;
  renderGraveyardToolbar();
  renderGraveyardGrid();
}

function onGraveyardSearchInput(e) {
  currentGraveyardSearch = (e.target.value || '').trim().toLowerCase();
  renderGraveyardGrid();
}

// ==================== RENDERIZADO DEL GRID DE LÁPIDAS (TOMBSTONES) ====================

function renderGraveyardGrid() {
  const grid = document.getElementById('graveyardGrid');
  if (!grid) return;

  // Filtrado de estrategias
  let filtered = graveyardBotsData.filter(bot => {
    // Filtro por categoría
    if (currentGraveyardFilter !== 'ALL' && bot.death_reason !== currentGraveyardFilter) {
      return false;
    }
    // Filtro por texto de búsqueda
    if (currentGraveyardSearch) {
      const q = currentGraveyardSearch;
      const matchName = (bot.name || '').toLowerCase().includes(q);
      const matchShort = (bot.short_name || '').toLowerCase().includes(q);
      const matchMagic = String(bot.magic || '').includes(q);
      const matchSymbol = (bot.symbol || '').toLowerCase().includes(q);
      const matchReport = (bot.forensic_report || '').toLowerCase().includes(q);
      if (!matchName && !matchShort && !matchMagic && !matchSymbol && !matchReport) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-[#0c1017] border border-[#1b2332] rounded-2xl p-8 space-y-3">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400">
          <i data-lucide="shield-check" class="w-6 h-6"></i>
        </div>
        <h4 class="text-base font-bold text-white">No hay estrategias en este filtro</h4>
        <p class="text-xs text-slate-400 font-sans max-w-md mx-auto">
          No se encontraron estrategias retiradas que coincidan con los criterios seleccionados. El portafolio mantiene una higiene cuantitativa óptima.
        </p>
      </div>
    `;
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(bot => {
    const card = document.createElement('div');
    card.className = 'group relative bg-[#0e131d] border border-[#202b3c] hover:border-rose-900/60 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4';

    // Razón de defunción y estilos visuales
    let reasonBadge = '';

    if (bot.death_reason === 'CORRELATION_PRUNING') {
      reasonBadge = `
        <span class="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700 flex items-center gap-1.5 shadow-sm">
          <i data-lucide="git-merge" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>Poda por Correlación</span>
        </span>
      `;
    } else if (bot.death_reason === 'EDGE_DEGRADATION') {
      reasonBadge = `
        <span class="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-700 flex items-center gap-1.5 shadow-sm">
          <i data-lucide="trending-down" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>Degradación de Edge</span>
        </span>
      `;
    } else if (bot.death_reason === 'OOS_FAILURE') {
      reasonBadge = `
        <span class="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1.5 shadow-sm">
          <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i>
          <span>Fallo Forward OOS</span>
        </span>
      `;
    } else {
      reasonBadge = `
        <span class="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1.5 shadow-sm">
          <i data-lucide="archive" class="w-3.5 h-3.5 text-slate-400"></i>
          <span>Retiro Manual</span>
        </span>
      `;
    }

    // Diagnóstico rápido
    let conflictDiagnosticHtml = '';
    if (bot.conflicting_bot_id && bot.conflicting_corr) {
      conflictDiagnosticHtml = `
        <div class="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 font-sans flex items-start gap-2">
          <i data-lucide="layers" class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"></i>
          <div>
            <span class="font-bold">Conflicto de Duplicidad:</span> Solapamiento extremo (<b>ρ = ${Number(bot.conflicting_corr).toFixed(2)}</b>) con <span class="font-mono text-white">${bot.conflicting_bot_id}</span>.
          </div>
        </div>
      `;
    }

    const capitalSavedVal = Number(bot.capital_saved || 0);
    const capitalSavedStr = capitalSavedVal > 0 ? `+${capitalSavedVal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : 'N/A';

    const deathDateStr = (bot.death_date || '').replace('T', ' ').slice(0, 16);
    const createdDateStr = (bot.created_date || '2026-01-01');
    const lifespan = bot.lifespan_days ? `${bot.lifespan_days} días` : 'Activa en R&D';

    card.innerHTML = `
      <!-- Cabecera de Tarjeta Lápida -->
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          ${reasonBadge}
          <span class="text-[10px] font-mono text-slate-500 bg-[#090d14] px-2 py-0.5 rounded border border-[#1b2332]">
            ${bot.symbol || 'SYN-A'} · ${bot.timeframe || 'M1'}
          </span>
        </div>

        <div>
          <h4 class="text-sm font-bold text-white tracking-wide group-hover:text-rose-300 transition flex items-center gap-1.5">
            <span>${bot.short_name || bot.name}</span>
          </h4>
          <div class="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Magic #${bot.magic || '000000'}</span>
            <span>·</span>
            <span class="text-slate-500">ID: ${bot.bot_id || bot.id}</span>
          </div>
        </div>

        <!-- Línea de Vida (Inception -> Defunción) -->
        <div class="p-2.5 rounded-xl bg-[#090d14] border border-[#18202d] text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>${createdDateStr} ➔ ${deathDateStr}</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-[#131924] text-slate-300 font-bold border border-[#232e42]">${lifespan}</span>
        </div>

        <!-- Mini-Grid de Métricas Forenses -->
        <div class="grid grid-cols-4 gap-2 pt-1">
          <div class="bg-[#111722] p-2 rounded-xl border border-[#1d2737] text-center">
            <span class="block text-[9.5px] font-mono text-slate-500 uppercase">Sharpe</span>
            <span class="text-xs font-bold text-slate-200 font-mono">${Number(bot.final_sharpe || 0).toFixed(2)}</span>
          </div>
          <div class="bg-[#111722] p-2 rounded-xl border border-[#1d2737] text-center">
            <span class="block text-[9.5px] font-mono text-slate-500 uppercase">PF</span>
            <span class="text-xs font-bold text-slate-200 font-mono">${Number(bot.final_pf || 0).toFixed(2)}</span>
          </div>
          <div class="bg-[#111722] p-2 rounded-xl border border-[#1d2737] text-center">
            <span class="block text-[9.5px] font-mono text-slate-500 uppercase">WFE Ret.</span>
            <span class="text-xs font-bold ${Number(bot.final_wfe || 0) >= 65 ? 'text-emerald-400' : 'text-rose-400'} font-mono">${Number(bot.final_wfe || 0).toFixed(1)}%</span>
          </div>
          <div class="bg-[#111722] p-2 rounded-xl border border-[#1d2737] text-center">
            <span class="block text-[9.5px] font-mono text-slate-500 uppercase">Max DD</span>
            <span class="text-xs font-bold text-rose-400 font-mono">-${Number(bot.final_max_dd || 0).toFixed(1)}%</span>
          </div>
        </div>

        ${conflictDiagnosticHtml}

        <!-- Callout de Capital Protegido -->
        <div class="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 font-sans flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-semibold">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Capital Protegido Estimado:</span>
          </span>
          <span class="font-mono font-bold text-emerald-400">${capitalSavedStr}</span>
        </div>
      </div>

      <!-- Acciones de la Tarjeta -->
      <div class="pt-3 border-t border-[#1a2332] flex items-center gap-2">
        <button onclick="openGraveyardAutopsyModal('${bot.id}')" class="flex-1 py-2 px-3 rounded-xl bg-[#141b27] hover:bg-[#1f293a] text-slate-200 hover:text-white border border-[#27354a] hover:border-slate-400 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
          <i data-lucide="file-search" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>Autopsia Forense</span>
        </button>
        <button onclick="confirmResurrectBot('${bot.id}', ${bot.magic}, '${bot.short_name || bot.name}')" class="py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-700/80 text-purple-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm" title="Reactivar estrategia en Paper Trading">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>Resucitar</span>
        </button>
      </div>
    `;

    grid.appendChild(card);
  });

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ==================== MODAL DE AUTOPSIA FORENSE POST-MORTEM ====================

function openGraveyardAutopsyModal(botId) {
  const bot = graveyardBotsData.find(b => b.id === botId || b.bot_id === botId);
  if (!bot) return;

  const modal = document.getElementById('modalGraveyardAutopsy');
  if (!modal) return;

  // Llenar datos de cabecera
  document.getElementById('graveModalTitle').innerText = bot.name || bot.short_name;
  document.getElementById('graveModalSubline').innerText = `Magic #${bot.magic || '000000'} · ${bot.symbol || 'SYN-A'} · Timeframe ${bot.timeframe || 'M1'} · Inception: ${bot.created_date || '2026-01-01'}`;

  // Badge de causa de muerte
  const badgeContainer = document.getElementById('graveModalReasonBadge');
  if (badgeContainer) {
    let badgeText = 'Retiro Discrecional';
    let badgeClass = 'bg-slate-900 text-slate-300 border-slate-700';

    if (bot.death_reason === 'CORRELATION_PRUNING') {
      badgeText = 'Poda de Correlación (Markowitz/HRP)';
      badgeClass = 'bg-indigo-950 text-indigo-300 border-indigo-700';
    } else if (bot.death_reason === 'EDGE_DEGRADATION') {
      badgeText = 'Degradación de Edge (Z-Score Drift)';
      badgeClass = 'bg-amber-950 text-amber-300 border-amber-700';
    } else if (bot.death_reason === 'OOS_FAILURE') {
      badgeText = 'Fallo Crítico Walk-Forward OOS';
      badgeClass = 'bg-rose-950 text-rose-300 border-rose-700';
    }

    badgeContainer.innerHTML = `<span class="px-3 py-1 rounded-lg text-xs font-mono font-bold border ${badgeClass}">${badgeText}</span>`;
  }

  // Informe forense técnico
  const reportEl = document.getElementById('graveModalReportText');
  if (reportEl) {
    reportEl.innerText = bot.forensic_report || 'No se registraron notas forenses detalladas en la desactivación.';
  }

  // Métricas forenses
  document.getElementById('graveModalSharpe').innerText = Number(bot.final_sharpe || 0).toFixed(2);
  document.getElementById('graveModalPf').innerText = Number(bot.final_pf || 0).toFixed(2);
  document.getElementById('graveModalWfe').innerText = `${Number(bot.final_wfe || 0).toFixed(1)}%`;
  document.getElementById('graveModalMaxDD').innerText = `-${Number(bot.final_max_dd || 0).toFixed(1)}%`;
  document.getElementById('graveModalSaved').innerText = `+${Number(bot.capital_saved || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
  document.getElementById('graveModalLifespan').innerText = `${bot.lifespan_days || 90} días`;

  // Sección de conflicto si fue por correlación
  const conflictBox = document.getElementById('graveModalConflictSection');
  if (conflictBox) {
    if (bot.conflicting_bot_id && bot.conflicting_corr) {
      conflictBox.classList.remove('hidden');
      document.getElementById('graveModalConflictingBot').innerText = bot.conflicting_bot_id;
      document.getElementById('graveModalConflictingCorr').innerText = `ρ = ${Number(bot.conflicting_corr).toFixed(2)}`;
    } else {
      conflictBox.classList.add('hidden');
    }
  }

  // Visualizador de parámetros JSON
  const paramsCode = document.getElementById('graveModalParamsJson');
  if (paramsCode) {
    paramsCode.innerText = JSON.stringify(bot.params || {}, null, 2);
  }

  // Botón de resurrección dentro del modal
  const resBtn = document.getElementById('graveModalResurrectBtn');
  if (resBtn) {
    resBtn.onclick = () => {
      closeGraveyardAutopsyModal();
      confirmResurrectBot(bot.id, bot.magic, bot.short_name || bot.name);
    };
  }

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeGraveyardAutopsyModal() {
  const modal = document.getElementById('modalGraveyardAutopsy');
  if (modal) modal.classList.add('hidden');
}

// ==================== RESURRECCIÓN DE ESTRATEGIAS ====================

async function confirmResurrectBot(botId, magic, botName) {
  const confirmed = confirm(`¿Deseas resucitar la estrategia "${botName}" (Magic #${magic}) y reincorporarla a la incubadora de Paper Trading?`);
  if (!confirmed) return;

  try {
    // 1. Eliminar del cementerio local de inmediato
    const graveIdx = graveyardBotsData.findIndex(b => b.id === botId || String(b.magic) === String(magic));
    let resurrectedBot = null;
    if (graveIdx !== -1) {
      resurrectedBot = graveyardBotsData.splice(graveIdx, 1)[0];
      try { localStorage.setItem('demo_quant_graveyard_bots', JSON.stringify(graveyardBotsData)); } catch(e){}
    }

    // 2. Reincorporar a candidatesData localmente
    if (typeof candidatesData !== 'undefined' && Array.isArray(candidatesData)) {
      const existingCand = candidatesData.find(c => c.id === botId || String(c.magic) === String(magic));
      if (existingCand) {
        existingCand.isPaper = true;
        existingCand.isApproved = false;
      } else if (resurrectedBot) {
        candidatesData.push({
          id: resurrectedBot.id || botId,
          magic: resurrectedBot.magic || magic,
          name: resurrectedBot.name || botName,
          shortName: resurrectedBot.short_name || botName,
          symbol: resurrectedBot.symbol || 'SYN-A',
          market: resurrectedBot.market || 'Indices',
          timeframe: resurrectedBot.timeframe || 'M1',
          ea_name: resurrectedBot.ea_name || 'MomentumSysYata',
          sharpe: resurrectedBot.final_sharpe || 2.0,
          pf: resurrectedBot.final_pf || 1.5,
          max_dd: resurrectedBot.final_max_dd || 4.5,
          statusColor: 'verde',
          filterScore: '7/7',
          isPaper: true,
          isApproved: false,
          params: resurrectedBot.params || {}
        });
      }
    }

    if (typeof customBotPhases !== 'undefined') {
      customBotPhases[botId] = 'F4';
      if (typeof saveCustomBotPhases === 'function') saveCustomBotPhases();
    }
    if (typeof saveUserBotModes === 'function') saveUserBotModes();

    if (typeof showToast === 'function') {
      showToast("✨ Estrategia Resucitada", `${botName} ha vuelto a la vida en la incubadora de Paper Trading.`, "verde");
    }

    if (typeof triggerGlobalStateSync === 'function') {
      triggerGlobalStateSync();
    } else {
      if (typeof renderGraveyardTab === 'function') renderGraveyardTab();
      if (typeof renderPipelineTab === 'function') renderPipelineTab();
      if (typeof renderCandidates === 'function') renderCandidates();
      if (typeof renderPortfolioTab === 'function') renderPortfolioTab();
      if (typeof updateCounters === 'function') updateCounters();
    }

    // Sincronización asíncrona de fondo con el Bridge
    try {
      const bridgeUrl = (typeof BRIDGE_URL !== 'undefined') ? BRIDGE_URL : 'http://mock.local:8001';
      fetch(`${bridgeUrl}/mock-api/graveyard/resurrect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          magic: magic,
          target_mode: 'PAPER'
        }),
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    } catch (err) {}
  } catch (err) {
    console.error('[GRAVEYARD] Error al resucitar bot:', err);
  }
}

// ==================== RETIRADA A CEMENTERIO DESDE OTRAS PESTAÑAS ====================

async function retireBotToGraveyard(botData, deathReason, forensicReport, capitalSaved = 1000.0) {
  try {
    const payload = {
      id: botData.id || `BOT_${botData.magic}`,
      bot_id: botData.id || `BOT_${botData.magic}`,
      magic: botData.magic,
      name: botData.name,
      short_name: botData.shortName || botData.name,
      symbol: botData.symbol || botData.market || 'SYN-A',
      timeframe: botData.timeframe || 'M1',
      death_reason: deathReason || 'MANUAL_RETIRED',
      forensic_report: forensicReport || 'Retirada discrecional del operador.',
      final_sharpe: botData.sharpe || 0.0,
      final_pf: botData.pf || 0.0,
      final_wfe: botData.retentionScore || botData.retention_score || 50.0,
      final_max_dd: botData.max_dd || botData.maxDrawdown || 0.0,
      capital_saved: capitalSaved,
      death_date: new Date().toISOString().split('T')[0],
      conflicting_bot_id: botData.conflicting_bot_id || '',
      conflicting_corr: botData.conflicting_corr || 0.0,
      params: botData.params || {}
    };

    // 1. Guardar de inmediato en estado local y localStorage
    const existingIdx = graveyardBotsData.findIndex(b => b.id === payload.id || (b.magic && b.magic === payload.magic));
    if (existingIdx !== -1) {
      graveyardBotsData[existingIdx] = payload;
    } else {
      graveyardBotsData.unshift(payload);
    }
    try {
      localStorage.setItem('demo_quant_graveyard_bots', JSON.stringify(graveyardBotsData));
    } catch(e) {}

    if (typeof customBotPhases !== 'undefined') {
      customBotPhases[botData.id] = 'GRAVEYARD';
      if (typeof saveCustomBotPhases === 'function') saveCustomBotPhases();
    }

    if (typeof showToast === 'function') {
      showToast("⚰️ Estrategia Archivada", `${botData.shortName || botData.name} ha sido enviada al Cementerio con su informe forense.`, "naranja");
    }

    // 2. Notificar al bridge en segundo plano sin bloquear
    try {
      const bridgeUrl = (typeof BRIDGE_URL !== 'undefined') ? BRIDGE_URL : 'http://mock.local:8001';
      fetch(`${bridgeUrl}/mock-api/graveyard/retire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    } catch (err) {}

    return true;
  } catch (err) {
    console.error('[GRAVEYARD] Error al retirar bot:', err);
    return true; // Continuar en cliente aunque falle
  }
}
window.retireBotToGraveyard = retireBotToGraveyard;

// ==================== DESCARTE COMPLETO DE CANDIDATA AL CEMENTERIO ====================

async function discardCandidateToGraveyard(candId) {
  const cand = (typeof candidatesData !== 'undefined' && Array.isArray(candidatesData)) ?
    candidatesData.find(c => c.id === candId || String(c.magic) === String(candId)) : null;
  if (!cand) return;

  const stratName = cand.shortName || cand.name || candId;
  const confirmed = confirm(`¿Estás seguro de que deseas descartar la estrategia "${stratName}" y enviarla al Cementerio?\n\nSe registrarán todos sus parámetros, métricas y se generará un informe forense detallando todos los motivos de descarte y alertas.`);
  if (!confirmed) return;

  // 1. Recopilar todas las razones de descarte
  const failureReasons = [];
  
  // Auditar 7 filtros institucionales
  const pfIsVal = Math.max(0.01, cand.pf || 1.0);
  const oosPfVal = cand.oosPF !== undefined ? cand.oosPF : (cand.oos_pf !== undefined ? cand.oos_pf : 1.30);
  const retVal = +((oosPfVal / pfIsVal) * 100.0).toFixed(1);
  const robVal = cand.robustnessScore !== undefined ? cand.robustnessScore : 82.0;
  const wrVal = cand.win_rate || cand.expWR || 55.0;
  const ddVal = cand.max_dd !== undefined ? cand.max_dd : 5.0;
  const profitVal = cand.total_profit || cand.profit || 0.0;
  const tradesVal = cand.trades !== undefined ? cand.trades : 30;
  const oosTradesVal = cand.oos_trades !== undefined ? cand.oos_trades : Math.round(tradesVal * 0.28);
  const tfVal = (cand.timeframe || 'M1').toUpperCase();
  const sharpeVal = cand.sharpe || cand.expSharpe || 2.0;
  
  let tgtTot = 120, tgtOos = 35;
  if (tfVal === 'M5') { tgtTot = 80; tgtOos = 25; }
  else if (tfVal === 'M15' || tfVal === 'H1') { tgtTot = 50; tgtOos = 15; }
  else if (tfVal === 'H4' || tfVal === 'D1') { tgtTot = 30; tgtOos = 8; }

  if (wrVal < 50.0) failureReasons.push(`Filtro 1 (Win Rate): ${wrVal.toFixed(1)}% < 50.0%`);
  if (profitVal < 1000.0) failureReasons.push(`Filtro 2 (Beneficio Neto): +${profitVal.toFixed(2)}€ < 1.000,00€`);
  if (tradesVal < tgtTot || oosTradesVal < tgtOos) failureReasons.push(`Filtro 3 (Muestra ${tfVal}): ${tradesVal}t total (mín. ${tgtTot}) / ${oosTradesVal}t OOS (mín. ${tgtOos})`);
  if (oosPfVal < 1.25) failureReasons.push(`Filtro 4 (PF OOS): ${oosPfVal.toFixed(2)} < 1.25`);
  if (sharpeVal < 1.80 || robVal < 80.0) failureReasons.push(`Filtro 5 (Sharpe/Robustez): Sharpe ${sharpeVal.toFixed(2)} < 1.80 o Meseta ${robVal.toFixed(1)}% < 80%`);
  if (ddVal > 8.00 || retVal < 65.0) failureReasons.push(`Filtro 6 (DD/Retención): Max DD ${ddVal.toFixed(2)}% > 8.00% o Retención OOS ${retVal.toFixed(1)}% < 65%`);

  // Alertas de anomalías estadísticas y dependencia de régimen
  const anomalies = (typeof getCandidateAnomalyWarnings === 'function') ? getCandidateAnomalyWarnings(cand) : [];
  anomalies.forEach(a => {
    failureReasons.push(`${a.title}: ${a.detail}`);
  });

  if (failureReasons.length === 0) {
    failureReasons.push('Descarte discrecional del operador (Estrategia viable archivada manualmente).');
  }

  // Determinar categoría técnica de defunción
  let deathReason = 'MANUAL_RETIRED';
  if (anomalies.length > 0) {
    deathReason = 'EDGE_DEGRADATION';
  } else if (ddVal > 8.0 || oosPfVal < 1.25 || retVal < 65.0) {
    deathReason = 'OOS_FAILURE';
  }

  // Redactar informe forense completo
  const forensicReport = `Dictamen Forense de Descarte:\n` +
    `• Estrategia: ${cand.name} (${cand.market || cand.symbol || 'SYN-C'} ${cand.timeframe || 'M5'})\n` +
    `• Magic: #${cand.magic || 0} | EA: ${cand.ea_name || 'Desconocido'}\n` +
    `• Métricas al descarte: Sharpe ${sharpeVal.toFixed(2)}, PF IS ${cand.pf ? cand.pf.toFixed(2) : '1.00'}, PF OOS ${oosPfVal.toFixed(2)}, Max DD ${ddVal.toFixed(2)}%, Retención OOS ${retVal.toFixed(1)}%\n` +
    `• Motivos del Descarte:\n  - ` + failureReasons.join('\n  - ');

  const accBalance = (window.mt5ConnectionState && window.mt5ConnectionState.balance) ? window.mt5ConnectionState.balance : 50000.0;
  const capitalSaved = Math.max(500.0, Math.round(accBalance * (ddVal / 100.0)));

  // 1. Eliminar de candidatesData en memoria de inmediato (0ms sincrónico)
  const idx = candidatesData.findIndex(c => c.id === cand.id);
  if (idx !== -1) {
    candidatesData.splice(idx, 1);
  }
  
  if (typeof customBotPhases !== 'undefined') {
    customBotPhases[cand.id] = 'GRAVEYARD';
    if (typeof saveCustomBotPhases === 'function') saveCustomBotPhases();
  }
  if (typeof saveUserBotModes === 'function') saveUserBotModes();

  // 2. Sincronización Global Inmediata
  if (typeof triggerGlobalStateSync === 'function') {
    triggerGlobalStateSync();
  } else {
    if (typeof renderCandidates === 'function') renderCandidates();
    if (typeof renderPipelineTab === 'function') renderPipelineTab();
    if (typeof renderPortfolioTab === 'function') renderPortfolioTab();
    if (typeof renderBotSidebar === 'function') renderBotSidebar();
    if (typeof updateCounters === 'function') updateCounters();
    if (typeof renderGraveyardTab === 'function') renderGraveyardTab();
  }

  // 3. Archivar en cementerio local y notificar backend en segundo plano
  retireBotToGraveyard(cand, deathReason, forensicReport, capitalSaved).catch(() => {});
}
window.discardCandidateToGraveyard = discardCandidateToGraveyard;

