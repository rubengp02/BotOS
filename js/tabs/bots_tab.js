// ==============================================================================
// MODULO: bots_tab.js
// ============================================================================== 

function getBotDisplayMetadata(bot) {
    const validationMetadata = bot && bot.f3_validation_metadata && typeof bot.f3_validation_metadata === 'object'
        ? bot.f3_validation_metadata
        : {};
      const label = (value) => {
        const text = String(value ?? '').trim();
        return text && !['undefined', 'null', 'none'].includes(text.toLowerCase()) ? text : '';
      };
      const normalizeTimeframe = (value) => label(value).replace(/^PERIOD_/i, '');
      const graduation = (typeof getAdaptiveGraduationCriteria === 'function')
        ? getAdaptiveGraduationCriteria(bot || {})
        : { category: 'INTRADAY', categoryName: 'Intraday (M15/H1)', targetTrades: 25, minDays: 15 };

      return {
        // `magic_number` is the accepted MT5 artifact value, not an invented
        // runtime identity. bridge_client keeps the same display precedence.
        magic: typeof getCandidateDisplayMagic === 'function'
          ? getCandidateDisplayMagic(bot)
          : label(bot && (bot.magic || bot.magic_number)) || 'sin asignar',
        market: label(bot && bot.display_market)
          || label(bot && bot.market)
          || label(bot && bot.symbol)
          || label(validationMetadata.symbol)
          || 'sin declarar',
        timeframe: normalizeTimeframe(bot && bot.display_timeframe)
          || normalizeTimeframe(bot && bot.timeframe)
          || normalizeTimeframe(validationMetadata.timeframe)
          || 'sin declarar',
        profile: label(bot && bot.display_profile)
          || label(bot && bot.profile)
          || graduation.category
          || 'sin declarar',
        graduation,
      };
    }

function renderBotSidebar() {
      const container = document.getElementById('botsSidebarList');
      if (!container) return;
      container.innerHTML = '';

      // 1. Filtrar solo bots aceptados (Live o Paper). Candidatas no aprobadas se excluyen
      const activeBots = candidatesData.filter(b => b.isApproved || b.isPaper);

      // 2. Ordenar: Primero los Live (isApproved), después los Paper (isPaper)
      activeBots.sort((a, b) => {
        if (a.isApproved && !b.isApproved) return -1;
        if (!a.isApproved && b.isApproved) return 1;
        return 0;
      });

      // 3. Fallback de selección si el bot seleccionado no está activo
      if (!activeBots.some(b => b.id === currentSelectedBotId)) {
        if (activeBots.length > 0) {
          currentSelectedBotId = activeBots[0].id;
        }
      }

      const liveCount = activeBots.filter(b => b.isApproved).length;
      const paperCount = activeBots.filter(b => b.isPaper).length;
      const headerCountEl = document.getElementById('sidebarApprovedCount');
      if (headerCountEl) {
        headerCountEl.innerText = `${liveCount} en Live · ${paperCount} en Paper`;
      }

      const titleEl = document.getElementById('sidebarBotsTitle');
      if (titleEl) {
        titleEl.innerText = `BOTS ACTIVOS (${activeBots.length})`;
      }

      if (activeBots.length === 0) {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-[#0e121a] border border-[#1b2332] text-center space-y-2">
            <p class="text-xs text-slate-400 font-sans font-semibold">Sin bots en Live ni en Paper</p>
            <p class="text-[11px] text-slate-500 font-sans">Ve a la pestaña <span class="text-indigo-400 font-mono font-bold">Candidatas</span> para aprobar estrategias e iniciar su ciclo de incubación.</p>
          </div>
        `;
        return;
      }

      activeBots.forEach(bot => {
        const display = getBotDisplayMetadata(bot);
        const isActive = bot.id === currentSelectedBotId;
        const item = document.createElement('div');
        item.className = `bot-item p-3 rounded-xl border border-[#1f2736] cursor-pointer transition flex flex-col gap-1.5 hover:bg-[#151c28] ${isActive ? 'active' : 'bg-[#12161f]'}`;
        item.setAttribute('data-bot-id', bot.id);
        item.onclick = () => selectBot(bot.id);

        let badgeHtml = "";
        if (bot.isApproved) {
          const evalRes = evaluateBotHealthMetrics(bot);
          const h = evalRes.state;
          if (h === "verde") {
            badgeHtml = `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Verde Live</span></span>`;
          } else if (h === "amarillo") {
            badgeHtml = `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shrink-0 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Amarillo Live</span></span>`;
          } else {
            badgeHtml = `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 flex items-center gap-1 shrink-0 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span><span>Naranja Live</span></span>`;
          }
        } else if (bot.isPaper) {
          const gradCrit = display.graduation;
          const targetTrades = bot.paperTargetTrades || gradCrit.targetTrades;
          badgeHtml = `
            <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 shrink-0 shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Paper (${bot.paperTradesCount || 0}/${targetTrades})</span>
            </span>
          `;
        }

        item.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-xs font-bold text-white truncate flex items-center gap-1.5">
              ${bot.shortName || bot.short_name || bot.name || bot.id || 'Estrategia'}
              <span class="text-indigo-400 text-[10px] font-mono">Magic rep. ${display.magic}</span>
            </h4>
            ${badgeHtml}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap text-[10px] font-mono mt-0.5">
            <span class="bg-[#0e121a] px-1.5 py-0.5 rounded border border-[#1c2331] text-slate-300 font-sans font-semibold">${display.market}</span>
            <span class="bg-[#0e121a] px-1.5 py-0.5 rounded border border-[#1c2331] text-indigo-300 font-bold">${display.timeframe}</span>
            <span class="text-slate-400 font-sans truncate">${display.profile}</span>
          </div>
        `;
        container.appendChild(item);
      });
      lucide.createIcons();
    }

    function selectBot(botId) {
      currentSelectedBotId = botId;
      renderBotSidebar();
      updateBotDetailView();
    }

    function toggleCurrentBotApproval() {
      toggleCandidateApproval(currentSelectedBotId);
      updateBotDetailView();
    }

    function updateBotDetailView() {
      const bot = candidatesData.find(b => b.id === currentSelectedBotId);
      if (!bot) return;
      const display = getBotDisplayMetadata(bot);

      document.getElementById('botDetailName').innerText = bot.shortName || bot.short_name || bot.name || bot.id || 'Estrategia';
      document.getElementById('botDetailMagic').innerText = `Magic reportado ${display.magic}`;
      document.getElementById('botDetailMarket').innerText = `Mercado: ${display.market}`;
      document.getElementById('botDetailTF').innerText = `Temporalidad: ${display.timeframe}`;
      document.getElementById('botDetailProfile').innerText = `Perfil: ${display.profile}`;

      const healthBadge = document.getElementById('botDetailHealthBadge');
      const toggleBtn = document.getElementById('btnToggleApproval');
      const adviceEl = document.getElementById('botDetailAdvice');

      if (bot.isApproved) {
        const evalRes = evaluateBotHealthMetrics(bot);
        const h = evalRes.state;
        if (h === "verde") {
          healthBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5 shadow-sm';
          healthBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Verde (Saludable · Mantener en Live)</span>`;
          adviceEl.innerText = "Estrategia saludable en Producción Live. Mantener operando sin intervención.";
        } else if (h === "amarillo") {
          healthBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1.5 shadow-sm';
          healthBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Amarillo (Sizing 50% en Live)</span>`;
          adviceEl.innerText = "Alerta: Reducir sizing al 50% (bajar fracción Kelly). Aumentar frecuencia de revisión.";
        } else {
          healthBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700 flex items-center gap-1.5 shadow-sm';
          healthBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-orange-500"></span><span>Naranja (Pasa a Paper Trading 30 ops)</span>`;
          adviceEl.innerText = "Degradación: Pasa a paper trading hasta acumular 30 operaciones limpias verificadas.";
        }

        toggleBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800 transition shadow-md cursor-pointer';
        toggleBtn.innerHTML = `<i data-lucide="pause-circle" class="w-3.5 h-3.5"></i><span>Pausar de Live</span>`;
      } else if (bot.isPaper) {
        const gradCrit = display.graduation;
        const paperCount = bot.paperTradesCount || 0;
        const targetTrades = bot.paperTargetTrades || gradCrit.targetTrades;
        const isCompleted = paperCount >= targetTrades;

        healthBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1.5 shadow-sm';
        healthBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-purple-400"></span><span>Paper Trading (${paperCount}/${targetTrades} ops · ${gradCrit.category})</span>`;

        if (isCompleted) {
          adviceEl.innerHTML = `<span class="text-purple-300 font-semibold">¡${targetTrades} operaciones completadas en Demo (${gradCrit.categoryName})! Revisa las métricas y pulsa el botón para confirmar pase manual a Live.</span>`;
          toggleBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-950 font-bold animate-pulse cursor-pointer';
          toggleBtn.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5"></i><span>Confirmar en MT (Pase a Live)</span>`;
        } else {
          adviceEl.innerText = `Incubación (Fase 4): Acumulando ${paperCount}/${targetTrades} operaciones en Demo con Magic reportado ${display.magic} (${gradCrit.categoryName}, mín. ${gradCrit.minDays} días) antes de autorizar capital real.`;
          toggleBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-700 transition shadow-md cursor-pointer';
          toggleBtn.innerHTML = `<i data-lucide="clock" class="w-3.5 h-3.5 text-purple-400"></i><span>En Paper (${paperCount}/${targetTrades} ops)</span>`;
        }
      } else {
        healthBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 shadow-sm';
        healthBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Candidata (Pendiente de Paper)</span>`;
        adviceEl.innerText = "Estrategia en laboratorio. Aprueba para iniciar su incubación de 30 operaciones en Demo.";

        toggleBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-950 font-bold cursor-pointer';
        toggleBtn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Aprobar para Paper (F4)</span>`;
      }

      renderFilteredPnlChart(bot, currentTimeRange);
      lucide.createIcons();
    }

    function setBotTimeRange(range) {
      currentTimeRange = range;
      document.querySelectorAll('.time-range-btn').forEach(b => {
        b.className = 'time-range-btn px-2.5 py-1 rounded text-slate-400 hover:text-white';
      });
      const activeBtn = document.getElementById(`btn-range-${range}`);
      if (activeBtn) activeBtn.className = 'time-range-btn px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold';

      const bot = candidatesData.find(b => b.id === currentSelectedBotId);
      if (bot) renderFilteredPnlChart(bot, range);
    }

    function renderFilteredPnlChart(bot, range) {
      const isLive = bot.isApproved;
      const isPaper = bot.isPaper;
      let rangeTitle = "";
      let totalPnl = 0;
      let labels = [];
      let data = [];
      let lineColor = "#34d399";
      let bgColor = "rgba(52, 211, 153, 0.08)";
      let pointColor = "#34d399";
      let badgeText = "";

      if (isLive) {
        const liveTrades = bot.liveTradesHistory || [];
        const liveCount = liveTrades.length;
        const livePnl = bot.liveProfit || 0.0;
        rangeTitle = `P&L en Producción Live · Desde activación (${bot.liveInceptionDate || '2026-09-02'}) · ${liveCount} trades`;
        
        if (liveTrades.length === 0) {
          labels = [bot.liveInceptionDate || '2026-09-02', 'Hoy'];
          data = [0, 0];
          totalPnl = 0.0;
        } else {
          labels = liveTrades.map(t => t.date);
          data = liveTrades.map(t => t.pnl);
          totalPnl = livePnl;
        }

        lineColor = '#34d399';
        bgColor = 'rgba(52, 211, 153, 0.08)';
        pointColor = '#34d399';
        const sign = totalPnl >= 0 ? '+' : '';
        badgeText = `${sign}${totalPnl.toFixed(2)} € (${liveCount} trades Live)`;
      } else if (isPaper) {
        const gradCrit = (typeof getAdaptiveGraduationCriteria === 'function') ? getAdaptiveGraduationCriteria(bot) : { category: 'INTRADAY', categoryName: 'Intraday (M15/H1)', targetTrades: 25, minDays: 15 };
        const targetTrades = bot.paperTargetTrades || gradCrit.targetTrades;
        const paperTrades = bot.paperTradesHistory || [];
        const paperCount = bot.paperTradesCount || paperTrades.length;
        const paperPnl = bot.paperProfit !== undefined ? bot.paperProfit : (bot.paperPnl || 0.0);
        rangeTitle = `P&L en Paper Trading (Incubación F4 · Cuenta Demo) · ${paperCount}/${targetTrades} ops (${gradCrit.category})`;

        if (paperTrades.length === 0) {
          labels = ['Inception Paper', 'Hoy'];
          data = [0, 0];
          totalPnl = 0.0;
        } else {
          labels = ['Inicio', ...paperTrades.map((t, idx) => t.label || (t.date && t.date.includes(' ') ? t.date.split(' ')[1].slice(0, 5) : `T${idx+1}`))];
          data = [0, ...paperTrades.map(t => typeof t.pnl === 'number' ? t.pnl : (typeof t.cum_pnl === 'number' ? t.cum_pnl : 0))];
          totalPnl = paperPnl || (data.length > 1 ? data[data.length - 1] : 0.0);
        }

        lineColor = totalPnl >= 0 ? '#c084fc' : '#f43f5e';
        bgColor = totalPnl >= 0 ? 'rgba(192, 132, 252, 0.12)' : 'rgba(244, 63, 94, 0.12)';
        pointColor = totalPnl >= 0 ? '#c084fc' : '#f43f5e';
        const sign = totalPnl >= 0 ? '+' : '';
        badgeText = `${sign}${totalPnl.toFixed(2)} € (${paperCount}/${targetTrades} trades Paper)`;
      } else {
        rangeTitle = `P&L · (Pendiente de inicio en Paper Trading)`;
        labels = ['Inception', 'Hoy'];
        data = [0, 0];
        totalPnl = 0.0;
        lineColor = '#64748b';
        bgColor = 'rgba(100, 116, 139, 0.05)';
        pointColor = '#64748b';
        badgeText = `+0.00 € (0 trades)`;
      }

      document.getElementById('botPnlChartTitle').innerText = rangeTitle;
      document.getElementById('botPnlTotalBadge').innerText = badgeText;

      const ctx = document.getElementById('botPnlCanvas').getContext('2d');
      if (botPnlChartInstance) botPnlChartInstance.destroy();

      botPnlChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: isPaper ? 'P&L Paper (€)' : 'P&L Live (€)',
            data: data,
            borderColor: lineColor,
            backgroundColor: bgColor,
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
            pointRadius: 3,
            pointBackgroundColor: pointColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: c => ` P&L: ${c.parsed.y >= 0 ? '+' : ''}${c.parsed.y.toFixed(2)} €`
              }
            }
          },
          scales: {
            x: { grid: { color: '#161d28' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } } },
            y: { grid: { color: '#161d28' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 10 }, callback: v => (v >= 0 ? '+' : '') + v + ' €' } }
          }
        }
      });
    }


    // =========================================================================
    //   ENGINE DEL PIPELINE KANBAN (7 FASES CUANTITATIVAS) · 100% SINCRONIZADO
    // =========================================================================
    
    // ==============================================================================
    // HELPER GLOBAL DE BLINDAJE MATEMÁTICO ULTRA SEGURO (ANTI-ANOMALÍAS)
    // ==============================================================================
    function safeFormatCurrency(val) {
      if (val === null || val === undefined) return "0,00 €";
      let n = Number(val);
      if (isNaN(n) || !isFinite(n) || Math.abs(n) > 100000000.0) return "0,00 €";
      return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    }

    function safeFormatNumber(val, decimals = 2, fallback = "0.00") {
      if (val === null || val === undefined) return fallback;
      let n = Number(val);
      if (isNaN(n) || !isFinite(n) || Math.abs(n) > 100000000.0) return fallback;
      return n.toFixed(decimals);
    }
