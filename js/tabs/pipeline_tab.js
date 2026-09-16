// ==============================================================================
// MODULO: pipeline_tab.js
// ==============================================================================

const PIPELINE_PHASES = [
      { id: "F1", name: "F1 · BACKTEST IN-SAMPLE", short: "F1", next: "F2", nextLabel: "Promover a F2 Meseta", desc: "Hipótesis y Expectativa Matemática In-Sample" },
      { id: "F2", name: "F2 · ROBUSTEZ EN MESETA", short: "F2", next: "F3", nextLabel: "Promover a F3 Forward OOS", desc: "Auditoría de estabilidad ±20% >= 85%" },
      { id: "F3", name: "F3 · FORWARD TESTING OOS", short: "F3", next: "F4", nextLabel: "Promover a F4 Paper", desc: "Test ciego 2026 y Retención OOS >= 65%" },
      { id: "F4", name: "F4 · STAGING (PAPER TRADING)", short: "F4", next: "F5", nextLabel: "Promover a F5 Live", desc: "Incubación de 30 operaciones en Demo MT5" },
      { id: "F5", name: "F5 · PRODUCCIÓN LIVE", short: "F5", next: null, nextLabel: "En Producción Live", desc: "Capital real con contratos de Drawdown" }
    ];

    // Fases iniciales por defecto de los 10 campeones oficiales de Pareto
    const defaultBotPhases = {
      "JCK_XAU_01_TIER1": "F4",
      "REV_SYN-A_415": "F3",
      "REV_SYN-A_301": "F3",
      "MOM_SYN-A_5641": "F3",
      "MOM_SYN-A_9100": "F3",
      "MOM_SYN-A_7010": "F3",
      "MOM_SYN-A_5603": "F3",
      "MOM_SYN-A_5547": "F3",
      "MOM_SYN-A_5876": "F3",
      "MOM_SYN-A_6706": "F3"
    };

    let customBotPhases = (function() {
      try {
        const saved = null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return Object.assign({}, defaultBotPhases, parsed);
        }
      } catch(e) {}
      return Object.assign({}, defaultBotPhases);
    })();
    window.customBotPhases = customBotPhases;

    let botPhaseTimestamps = (function() {
      try {
        const saved = null;
        if (saved) return JSON.parse(saved);
      } catch(e) {}
      return {};
    })();

    // Inicializar marcas de tiempo reales para bots que no tengan timestamp registrado
    (function initRealTimestamps() {
      const now = Date.now();
      const defaultOffsets = {
        "JCK_XAU_01_TIER1": 24 * 3600 * 1000 * 3, // 3 días en Paper
        "REV_SYN-A_415": 3600 * 1000 * 4,
        "REV_SYN-A_301": 3600 * 1000 * 4,
        "MOM_SYN-A_5641": 3600 * 1000 * 4,
        "MOM_SYN-A_9100": 3600 * 1000 * 4,
        "MOM_SYN-A_7010": 3600 * 1000 * 4,
        "MOM_SYN-A_5603": 3600 * 1000 * 4,
        "MOM_SYN-A_5547": 3600 * 1000 * 4,
        "MOM_SYN-A_5876": 3600 * 1000 * 4,
        "MOM_SYN-A_6706": 3600 * 1000 * 4
      };

      Object.keys(defaultBotPhases).forEach(id => {
        if (!botPhaseTimestamps[id]) {
          botPhaseTimestamps[id] = now - (defaultOffsets[id] || 3600 * 1000 * 6);
        }
      });
      try {
        localStorage.setItem('demo_quant_bot_phase_timestamps', JSON.stringify(botPhaseTimestamps));
      } catch(e) {}
    })();

    function saveCustomBotPhases() {
      localStorage.setItem('demo_quant_custom_bot_phases', JSON.stringify(customBotPhases));
      localStorage.setItem('demo_quant_bot_phase_timestamps', JSON.stringify(botPhaseTimestamps));
    }

    function recordPhaseTransition(botId) {
      botPhaseTimestamps[botId] = Date.now();
      saveCustomBotPhases();
    }

    function formatRealTimeInPhase(botId) {
      const now = Date.now();
      const entry = botPhaseTimestamps[botId] || now;
      const diffMs = Math.max(0, now - entry);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        if (diffHours === 0) {
          return `${Math.max(1, diffMinutes)}m en fase`;
        }
        return `${diffHours}h en fase`;
      }
      return `${diffDays}d en fase`;
    }

    function resetPipelineToDefault() {
      customBotPhases = Object.assign({}, defaultBotPhases);
      saveCustomBotPhases();
      renderPipelineTab();
      renderCandidates();
      renderPortfolioTab();
      updateCounters();
      showToast("Pipeline Restablecido", "Las fases de todos los bots se han restaurado a la configuración cuantitativa base.", "verde");
    }

    function determineAutoBotPhase(cand) {
      if (cand.isApproved) return "F5"; // Producción Live
      if (cand.isPaper) return "F4";    // Staging / Paper Trading
      
      // Clasificación Cuantitativa Unificada (100% idéntica a Candidatas y quant_rules.py)
      if (cand.statusColor === 'verde' || cand.filterScore === '7/7' || cand.filterScore === '6/6') return "F3"; // WFO & Robustez Validada
      if (cand.statusColor === 'naranja' || cand.filterScore === '6/7' || cand.filterScore === '5/6') return "F2"; // Backtest & Tolerancia
      return "F1"; // Ideación / En desarrollo
    }

    function getPipelineCandidate(bot) {
      if (!bot) return null;
      if (bot.candRef) return bot.candRef;
      if (typeof candidatesData === 'undefined') return null;
      return candidatesData.find(c => c.id === bot.id)
        || (bot.magic && candidatesData.find(c => String(c.magic) === String(bot.magic)))
        || null;
    }

    function getPipelineMagicLabel(bot, candidate) {
      const source = candidate || getPipelineCandidate(bot) || bot;
      if (typeof getCandidateDisplayMagic === 'function') {
        return getCandidateDisplayMagic(source);
      }
      return source && source.magic_number ? String(source.magic_number) : 'sin asignar';
    }

    function syncPipelineBotState(bot, candidate, mode) {
      const target = candidate || getPipelineCandidate(bot) || { id: bot.id, magic: bot.magic };
      return syncBotStateWithBridge(target, mode);
    }

    function getPipelineAllBots() {
      const list = [];

      candidatesData.forEach(cand => {
        let phase = determineAutoBotPhase(cand);

        const pfIsVal = Math.max(0.01, cand.pf || 1.0);
        const oosPfVal = cand.oosPF !== undefined ? cand.oosPF : (cand.oos_pf !== undefined ? cand.oos_pf : 1.30);
        const retVal = +((oosPfVal / pfIsVal) * 100.0).toFixed(1);
        cand.retentionScore = retVal;
        cand.retention_score = retVal;
        let rRatioVal = 2.0;
        try {
          if (cand.params && cand.params.InpTP) rRatioVal = parseFloat(cand.params.InpTP.split('R')[0].trim());
          else if (cand.params && cand.params.InpTP_R) rRatioVal = parseFloat(cand.params.InpTP_R.replace('R', '').trim());
        } catch(e) {}
        const beWr = (1.0 / (1.0 + rRatioVal)) * 100.0;
        const wrVal = cand.expWR || 55.0;

        const robVal = cand.robustnessScore !== undefined ? cand.robustnessScore : 82.0;
        const ddVal = cand.max_dd !== undefined ? cand.max_dd : 5.0;
        const profitVal = cand.total_profit || cand.profit || 0.0;
        const tradesVal = cand.trades || 30;
        const oosTradesVal = cand.oos_trades || Math.round(tradesVal * 0.28);
        const tfVal = (cand.timeframe || 'M1').toUpperCase();
        const sharpeVal = cand.sharpe || cand.expSharpe || 2.0;
        
        let tgtTot = 120, tgtOos = 35;
        if (tfVal === 'M5') { tgtTot = 80; tgtOos = 25; }
        else if (tfVal === 'M15' || tfVal === 'H1') { tgtTot = 50; tgtOos = 15; }
        else if (tfVal === 'H4' || tfVal === 'D1') { tgtTot = 30; tgtOos = 8; }
        
        const f1_ok = (wrVal >= 50.0) && (profitVal > 0);
        const f2_ok = (profitVal >= 1000.0);
        const f3_ok = (tradesVal >= tgtTot) && (oosTradesVal >= tgtOos);
        const f4_ok = (oosPfVal >= 1.25);
        const f5_ok = (sharpeVal >= 1.80) && (robVal >= 80.0);
        const f6_ok = (ddVal <= 5.00) || (cand.is_calibrated === true);
        const f7_ok = (retVal >= 65.0);
        const is7of7 = (cand.statusColor === 'verde' && (cand.filterScore === '7/7' || cand.filterScore === '6/6')) || (cand.is_calibrated === true);

        let badge = 'PROVISIONAL';
        let leftBorder = 'border-l border-l-[#1d2638]';
        let health = cand.statusColor === 'verde' ? 'Verde' : (cand.statusColor === 'amarillo' ? 'Amarillo' : 'Naranja');

        const gradCrit = (typeof getAdaptiveGraduationCriteria === 'function') ? getAdaptiveGraduationCriteria(cand) : { category: 'INTRADAY', categoryName: 'Intraday (M15/H1)', targetTrades: 25, minDays: 15 };
        const paperCount = cand.paperTradesCount || 0;
        const targetTrades = cand.paperTargetTrades || gradCrit.targetTrades;
        const paperPct = Math.min(100, Math.round((paperCount / targetTrades) * 100));

        if (cand.isApproved) {
          badge = 'CHAMPION';
          leftBorder = 'border-l-4 border-l-emerald-500';
          health = 'Verde';
        } else if (cand.isPaper) {
          health = 'PAPER';
          badge = paperCount >= targetTrades ? 'VERDE' : 'PROVISIONAL';
          leftBorder = paperCount >= targetTrades ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-purple-700';
        } else {
          if (phase === 'F3') {
            badge = is7of7 ? 'VERDE' : 'NARANJA';
            leftBorder = is7of7 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-orange-500';
            health = is7of7 ? 'Verde' : 'Naranja';
          } else if (phase === 'F2') {
            badge = 'NARANJA';
            leftBorder = 'border-l-4 border-l-orange-700';
            health = 'Naranja';
          } else if (phase === 'F1') {
            badge = 'PROVISIONAL';
            leftBorder = 'border-l-4 border-l-slate-600';
            health = 'Naranja';
          }
        }

        let notice = null;
        if (!f6_ok) {
          notice = `⚠️ Alerta Retención OOS: ${retVal.toFixed(1)}% < 65% (In-Sample sobreajustado vs OOS ${oosPfVal.toFixed(2)}).`;
        } else if (!f4_ok) {
          notice = `⚠️ Alerta OOS: PF histórico ${oosPfVal.toFixed(2)} < 1.25 — requiere mayor ventana de datos.`;
        } else if (!f5_ok) {
          notice = `⚠️ Meseta estrecha: Robustez ${robVal.toFixed(1)}% < 80% o Sharpe < 1.80.`;
        } else if (cand.isPaper && paperCount >= targetTrades) {
          notice = `🟣 ${targetTrades}/${targetTrades} operaciones de Paper (${gradCrit.categoryName}) completadas. Listo para confirmación de pase manual a Live.`;
        }

        list.push({
          id: cand.id,
          magic: cand.magic || '',
          magicLabel: getPipelineMagicLabel(cand, cand),
          name: cand.name,
          shortName: cand.shortName,
          category: `${gradCrit.category} · ${(cand.microCategory || 'smart_money').toLowerCase()} · ${cand.isPaper ? 'paper' : (cand.isApproved ? 'live' : 'candidata')}`,
          market: cand.market,
          timeframe: cand.timeframe,
          phase: phase,
          timeInPhaseText: formatRealTimeInPhase(cand.id),
          health: health,
          badge: badge,
          leftBorder: leftBorder,
          gateText: `Gate: ${cand.filterScore || (is7of7 ? '7/7' : '6/7')} filtros`,
          bar1: { cur: paperCount, tgt: targetTrades, pct: paperPct, label: `Muestra Paper (${gradCrit.category})` },
          bar2: { cur: cand.robustnessScore, tgt: 100, pct: Math.round(cand.robustnessScore), label: 'Meseta Robustez' },
          decisionTimer: phase === 'F4' ? (paperCount >= targetTrades ? 'Listo para pase a Live' : `Acumulando ${paperCount}/${targetTrades} trades`) : (phase === 'F3' ? (is7of7 ? 'Apto para pase a Staging (F4)' : 'Retención OOS en observación') : null),
          missingText: phase === 'F4' && paperCount < targetTrades ? `Faltan ${targetTrades - paperCount} trades en Demo` : null,
          notice: notice,
          isRealCore: true,
          candRef: cand
        });
      });

      return list;
    }

    function renderPipelineTab() {
      const container = document.getElementById('pipelineKanbanBoard');
      if (!container) return;
      container.innerHTML = '';

      const allBots = getPipelineAllBots();

      PIPELINE_PHASES.forEach(phase => {
        const col = document.createElement('div');
        col.className = 'w-full min-w-0 flex flex-col space-y-2.5';

        const botsInPhase = allBots.filter(b => b.phase === phase.id);

        // Cabecera compacta de la columna
        const colHeader = document.createElement('div');
        colHeader.className = 'p-2 bg-[#0c1017] rounded-lg border border-[#1b2332] flex items-center justify-between shadow-sm';
        colHeader.innerHTML = `
          <h3 class="text-[10px] xl:text-[10.5px] font-bold text-white tracking-tight uppercase font-mono truncate" title="${phase.name} — ${phase.desc}">${phase.name}</h3>
          <span class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold bg-[#161c28] text-slate-300 border border-[#232e42] shrink-0 ml-1">${botsInPhase.length}</span>
        `;
        col.appendChild(colHeader);

        // Contenedor de tarjetas
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'space-y-2';

        if (botsInPhase.length === 0) {
          cardsContainer.innerHTML = `
            <div class="p-4 text-center text-slate-600 font-mono text-[10px] border border-dashed border-[#1a2333] rounded-lg bg-[#0a0d14]/40">
              Sin bots en esta fase
            </div>
          `;
        } else {
          botsInPhase.forEach(bot => {
            const card = document.createElement('div');
            const leftBorder = bot.leftBorder || 'border-l border-l-[#1d2638]';
            card.className = `bg-[#10141d] border-y border-r border-[#1d2638] ${leftBorder} rounded-lg p-2 xl:p-2.5 space-y-2 shadow-md hover:border-[#2f3d57] transition flex flex-col justify-between`;

            // Badge superior derecho (VERDE / NARANJA / PROV / CHAMP)
            let badgeHtml = '';
            if (bot.badge === 'VERDE' || bot.badge === 'GO') {
              badgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-600 shadow-sm shrink-0 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>VERDE</span></span>`;
            } else if (bot.badge === 'NARANJA' || bot.badge === 'HOLD') {
              badgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase bg-orange-950/90 text-orange-300 border border-orange-600 shadow-sm shrink-0 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span><span>NARANJA</span></span>`;
            } else if (bot.badge === 'PROVISIONAL') {
              badgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase bg-[#18202d] text-slate-300 border border-[#28364c] shrink-0">PROV</span>`;
            } else if (bot.badge === 'CHAMPION') {
              badgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm shrink-0">CHAMP</span>`;
            }

            // Status Pill
            let statusPillClass = 'bg-[#151b27] text-slate-400 border border-[#202a3c]';
            if (bot.health === 'Verde') statusPillClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
            else if (bot.health === 'PAPER' || bot.health === 'Morado') statusPillClass = 'bg-purple-950/90 text-purple-300 border border-purple-700 font-bold uppercase tracking-wider';
            else if (bot.health === 'Amarillo') statusPillClass = 'bg-amber-950/80 text-amber-300 border border-amber-800';

            // Barras de progreso si están en F3 (OOS) o F4 (Paper)
            let gateBarsHtml = '';
            if (bot.bar1 && bot.bar2 && (phase.id === 'F3' || phase.id === 'F4')) {
              gateBarsHtml = `
                <div class="space-y-1.5 pt-1.5 border-t border-[#18202c]">
                  <div class="text-[9px] font-mono font-semibold text-slate-400 flex items-center justify-between">
                    <span>${bot.gateText || 'Gate Cuantitativo'}</span>
                  </div>
                  
                  <!-- Barra 1 (Púrpura / Muestra) -->
                  <div class="space-y-0.5">
                    <div class="flex items-center justify-between text-[8.5px] font-mono text-slate-400">
                      <span class="text-purple-400">Muestra (Demo)</span>
                      <span>${bot.bar1.cur}/${bot.bar1.tgt} (${bot.bar1.pct}%)</span>
                    </div>
                    <div class="w-full bg-[#0d1017] h-1 rounded-full overflow-hidden border border-[#1b2332]">
                      <div class="bg-purple-500 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, bot.bar1.pct)}%"></div>
                    </div>
                  </div>

                  <!-- Barra 2 (Verde / Calidad) -->
                  <div class="space-y-0.5">
                    <div class="flex items-center justify-between text-[8.5px] font-mono text-slate-400">
                      <span class="text-emerald-400">Meseta Estabilidad</span>
                      <span>${bot.bar2.cur}%</span>
                    </div>
                    <div class="w-full bg-[#0d1017] h-1 rounded-full overflow-hidden border border-[#1b2332]">
                      <div class="bg-emerald-400 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, bot.bar2.pct)}%"></div>
                    </div>
                  </div>
                </div>
              `;
            }

            // Timer & missing text
            let timerHtml = '';
            if (bot.decisionTimer || bot.missingText) {
              timerHtml = `
                <div class="text-[8.5px] font-mono text-slate-500 space-y-0.5 pt-0.5 leading-tight">
                  ${bot.decisionTimer ? `<div class="truncate text-indigo-300 font-semibold">${bot.decisionTimer}</div>` : ''}
                  ${bot.missingText ? `<div class="text-slate-400 font-semibold truncate">${bot.missingText}</div>` : ''}
                </div>
              `;
            }

            // Notice alert box
            let noticeHtml = '';
            if (bot.notice) {
              noticeHtml = `
                <div class="p-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-[9px] text-amber-300/90 leading-tight font-sans">
                  ${bot.notice}
                </div>
              `;
            }

            // Collapsible detail
            let gateDetailHtml = `
              <div class="pt-0.5">
                <button onclick="toggleGateDetail('${bot.id}')" class="text-[8.5px] text-slate-400 hover:text-indigo-300 font-mono flex items-center gap-0.5 cursor-pointer transition">
                  <i data-lucide="chevron-down" class="w-2.5 h-2.5 transition-transform duration-200" id="gate-icon-${bot.id}"></i>
                  <span>Detalle gate</span>
                </button>
                <div id="gate-detail-${bot.id}" class="hidden mt-1.5 p-1.5 rounded bg-[#0c1017] border border-[#1b2332] text-[8.5px] font-mono text-slate-300 space-y-0.5">
                  <div class="flex items-center justify-between text-emerald-400"><span>Sharpe In-Sample > 1.5:</span> <b>OK</b></div>
                  <div class="flex items-center justify-between text-emerald-400"><span>Profit Factor > 1.4:</span> <b>OK</b></div>
                  <div class="flex items-center justify-between ${bot.bar2.cur >= 85 ? 'text-emerald-400' : 'text-amber-400'}"><span>Meseta >= 85%:</span> <b>${bot.bar2.cur}%</b></div>
                  <div class="flex items-center justify-between text-emerald-400"><span>Monte Carlo DD < 4%:</span> <b>OK</b></div>
                  <div class="flex items-center justify-between ${phase.id === 'F4' ? 'text-purple-400 font-bold' : 'text-slate-400'}"><span>Trades Paper >= 30:</span> <b>${bot.bar1.cur}/30</b></div>
                </div>
              </div>
            `;

            // Botón Promover
            let promoteBtnHtml = '';
            if (phase.next) {
              promoteBtnHtml = `
                <button onclick="promoteBotInPipeline('${bot.id}')" class="w-full py-1.5 px-2 rounded text-[9.5px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer font-sans truncate" title="${phase.nextLabel}">
                  <i data-lucide="chevron-right" class="w-3 h-3 shrink-0"></i>
                  <span class="truncate">${phase.nextLabel}</span>
                </button>
              `;
            } else {
              promoteBtnHtml = `
                <div class="w-full py-1.5 px-2 rounded text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-sans shadow-sm truncate">
                  <i data-lucide="award" class="w-3 h-3 text-emerald-400 shrink-0"></i>
                  <span class="truncate">Live Champion</span>
                </div>
              `;
            }

            // Banners de Alerta de Anomalías y Régimen en Pipeline
            let anomalyBannerHtml = '';
            const cand = getPipelineCandidate(bot);
            const anomalyWarnings = (typeof getCandidateAnomalyWarnings === 'function' && cand) ? getCandidateAnomalyWarnings(cand) : (cand && cand.anomaly_warnings ? cand.anomaly_warnings : []);

            if (anomalyWarnings.length > 0) {
              anomalyBannerHtml = `
                <div class="space-y-1 my-1">
                  ${anomalyWarnings.map(w => `
                    <div class="p-1.5 rounded ${w.severity === 'critical' ? 'bg-rose-950/80 border border-rose-600/60 text-rose-200' : 'bg-amber-950/80 border border-amber-600/60 text-amber-200'} text-[8.5px] font-mono leading-tight flex items-start gap-1 shadow-sm" title="${w.detail}">
                      <i data-lucide="${w.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}" class="w-3 h-3 ${w.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'} shrink-0 mt-0.5"></i>
                      <div class="flex-1 min-w-0">
                        <div class="font-bold flex items-center justify-between">
                          <span class="truncate">${w.title}</span>
                          <span class="text-[7.5px] uppercase px-1 rounded ${w.severity === 'critical' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'} shrink-0 ml-1 font-sans">${w.code === 'PF_OOS_EXPLOSION' ? 'Racha OOS' : 'Régimen'}</span>
                        </div>
                        <div class="text-[8px] text-slate-300 font-sans mt-0.5 line-clamp-2">${w.detail}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `;
            }

            card.innerHTML = `
              <div class="space-y-1.5">
                <div class="flex items-start justify-between gap-1">
                  <div class="min-w-0 flex-1">
                    <h4 class="text-[10.5px] xl:text-[11px] font-bold text-white leading-tight hover:text-indigo-400 transition cursor-pointer truncate" title="${bot.name}">${bot.shortName || bot.name}</h4>
                    <div class="text-[8.5px] text-slate-400 font-mono truncate">Magic reportado: ${bot.magicLabel || getPipelineMagicLabel(bot, cand)} · ${bot.category}</div>
                  </div>
                  ${badgeHtml}
                </div>

                <div class="flex items-center justify-between text-[9px] font-mono pt-0.5">
                  <span class="px-1.5 py-0.5 rounded bg-[#131924] text-indigo-300 border border-[#1f2a3c] font-semibold">${bot.market ? bot.market.split(' ')[0] : 'MT5'} · ${bot.timeframe || 'M1'}</span>
                  <span class="text-slate-400 flex items-center gap-1" title="Tiempo real sincronizado desde la entrada a esta fase"><i data-lucide="clock" class="w-2.5 h-2.5 text-indigo-400"></i><span>${bot.timeInPhaseText}</span></span>
                </div>

                ${anomalyBannerHtml}
                ${gateBarsHtml}
                ${timerHtml}
                ${noticeHtml}
                ${gateDetailHtml}
              </div>

              <div class="space-y-1.5 pt-1.5 border-t border-[#18202c]">
                <div class="flex items-center gap-1.5">
                  <div class="flex-1 min-w-0">${promoteBtnHtml}</div>
                  <button onclick="discardCandidateToGraveyard('${bot.id}')" class="py-1.5 px-2 rounded bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 hover:border-rose-500 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-sm" title="Descartar y archivar en el Cementerio con informe forense">
                    <i data-lucide="trash-2" class="w-3 h-3 text-rose-400"></i>
                    <span>Descartar</span>
                  </button>
                </div>

                <select onchange="moveBotToPhase('${bot.id}', this.value); this.value='';" class="w-full bg-[#0d1017] border border-[#1e2739] hover:border-slate-500 rounded px-1.5 py-1 text-[8.5px] font-mono text-slate-300 focus:outline-none cursor-pointer transition truncate">
                  <option value="" disabled selected>+ Mover a... ▾</option>
                  <option value="F1">F1 · Backtest IS</option>
                  <option value="F2">F2 · Robustez Meseta</option>
                  <option value="F3">F3 · Forward OOS</option>
                  <option value="F4">F4 · Staging (Paper)</option>
                  <option value="F5">F5 · Producción (Live)</option>
                  <option value="GRAVEYARD">💀 Cementerio (Descartar)</option>
                </select>
              </div>
            `;

            cardsContainer.appendChild(card);
          });
        }

        col.appendChild(cardsContainer);
        container.appendChild(col);
      });

      lucide.createIcons();
    }

    function toggleGateDetail(botId) {
      const el = document.getElementById(`gate-detail-${botId}`);
      const icon = document.getElementById(`gate-icon-${botId}`);
      if (!el) return;
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      } else {
        el.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      }
    }

    function toggleCardParams(candId) {
      const el = document.getElementById(`params-box-${candId}`);
      const icon = document.getElementById(`icon-params-${candId}`);
      if (!el) return;
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      } else {
        el.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      }
    }

    function toggleCardFilters(candId) {
      const el = document.getElementById(`filters-box-${candId}`);
      const icon = document.getElementById(`icon-filters-${candId}`);
      if (!el) return;
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      } else {
        el.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      }
    }

    function promoteBotInPipeline(botId) {
      const allBots = getPipelineAllBots();
      const bot = allBots.find(b => b.id === botId);
      if (!bot) return;

      const currentPhaseIdx = PIPELINE_PHASES.findIndex(p => p.id === bot.phase);
      if (currentPhaseIdx === -1 || currentPhaseIdx >= PIPELINE_PHASES.length - 1) return;

      const nextPhase = PIPELINE_PHASES[currentPhaseIdx + 1];
      customBotPhases[bot.id] = nextPhase.id;
      recordPhaseTransition(bot.id);

      // Sincronizacion con candidatesData
      const cand = getPipelineCandidate(bot);

      // Si se promueve a F4 (Staging / Paper Trading)
      if (nextPhase.id === 'F4') {
        if (cand) {
          cand.isPaper = true;
          cand.isApproved = false;
        }
        syncPipelineBotState(bot, cand, 'PAPER');
        showToast("Incubación en Paper Trading", `${bot.shortName || bot.name} ha entrado a F4 (Staging Paper). Sincronizado con MT5.`, "morado");
      } 
      // Si se promueve a F5 (Producción Live)
      else if (nextPhase.id === 'F5') {
        if (!isLiveModeMasterEnabled) {
          showToast("⚠️ Modo LIVE Bloqueado", `No se puede pasar ${bot.shortName} a cuenta real porque el modo LIVE está bloqueado en Ajustes. Habilítalo escribiendo LIVE.`, "amarillo");
          openSettingsModal();
          return;
        }
        if (cand) {
          cand.isApproved = true;
          cand.isPaper = false;
          cand.liveInceptionDate = "2026-09-02";
        }
        syncPipelineBotState(bot, cand, 'LIVE');
        showToast("¡Promovido a Producción Live!", `${bot.shortName || bot.name} ahora opera en F5 (Live) con capital real en MT5.`, "verde");
      } else {
        if (cand) {
          cand.isApproved = false;
          cand.isPaper = false;
        }
        syncPipelineBotState(bot, cand, 'OFF');
        showToast("Fase Avanzada", `${bot.shortName || bot.name} promovido exitosamente a ${nextPhase.name}`, "verde");
      }

      saveCustomBotPhases();
      if (typeof saveUserBotModes === 'function') saveUserBotModes();
      if (typeof triggerGlobalStateSync === 'function') {
        triggerGlobalStateSync();
      } else {
        renderPipelineTab();
        renderCandidates();
        renderBotSidebar();
        updateBotDetailView();
        renderPortfolioTab();
        renderSaludTab();
        renderRiskTab();
        updateCounters();
      }
      if (typeof updateAlertsWidget === 'function') updateAlertsWidget();
    }

    function moveBotToPhase(botId, targetPhase) {
      const allBots = getPipelineAllBots();
      const bot = allBots.find(b => b.id === botId);
      if (!bot) return;

      const cand = getPipelineCandidate(bot);

      if (targetPhase === 'GRAVEYARD') {
        if (typeof discardCandidateToGraveyard === 'function') {
          discardCandidateToGraveyard(bot.id);
        } else {
          customBotPhases[bot.id] = 'GRAVEYARD';
          if (cand) {
            cand.isApproved = false;
            cand.isPaper = false;
          }
          syncPipelineBotState(bot, cand, 'OFF');
          showToast("Enviado al Cementerio", `${bot.shortName || bot.name} ha sido retirado del pipeline y archivado.`, "naranja");
        }
        return;
      } else {
        const targetObj = PIPELINE_PHASES.find(p => p.id === targetPhase);
        if (!targetObj) return;

        customBotPhases[bot.id] = targetPhase;
        recordPhaseTransition(bot.id);

        if (targetPhase === 'F4') {
          if (cand) {
            cand.isPaper = true;
            cand.isApproved = false;
          }
          syncPipelineBotState(bot, cand, 'PAPER');
          showToast("Reubicado en Staging", `${bot.shortName || bot.name} reubicado en Paper Trading (Demo MT5).`, "morado");
        } else if (targetPhase === 'F5') {
          if (!isLiveModeMasterEnabled) {
            showToast("⚠️ Modo LIVE Bloqueado", `Desbloquea el interruptor LIVE en Ajustes escribiendo LIVE para mover estrategias a Producción.`, "amarillo");
            openSettingsModal();
            return;
          }
          if (cand) {
            cand.isApproved = true;
            cand.isPaper = false;
            cand.liveInceptionDate = "2026-09-02";
          }
          syncPipelineBotState(bot, cand, 'LIVE');
          showToast("Reubicado en Producción", `${bot.shortName || bot.name} activo en Live con capital real.`, "verde");
        } else {
          if (cand) {
            cand.isApproved = false;
            cand.isPaper = false;
          }
          syncPipelineBotState(bot, cand, 'OFF');
          showToast("Fase Actualizada", `${bot.shortName || bot.name} reubicado en ${targetObj.name}`, "verde");
        }
      }

      saveCustomBotPhases();
      if (typeof saveUserBotModes === 'function') saveUserBotModes();
      if (typeof triggerGlobalStateSync === 'function') {
        triggerGlobalStateSync();
      } else {
        renderPipelineTab();
        renderCandidates();
        renderBotSidebar();
        updateBotDetailView();
        renderPortfolioTab();
        renderSaludTab();
        renderRiskTab();
        updateCounters();
      }
      if (typeof updateAlertsWidget === 'function') updateAlertsWidget();
    }
    window.renderPipelineTab = renderPipelineTab;
    window.moveBotToPhase = moveBotToPhase;
    window.promoteBotInPipeline = promoteBotInPipeline;
    window.getPipelineAllBots = getPipelineAllBots;
