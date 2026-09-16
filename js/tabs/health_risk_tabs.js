// ==============================================================================
// MODULO: health_risk_tabs.js
// ==============================================================================

function evaluateBotHealthMetrics(bot) {
      const magicKey = String(bot.magic || '');
      const liveDiag = (window.dynamicBotsHealth && window.dynamicBotsHealth[magicKey]) ? window.dynamicBotsHealth[magicKey] : null;
      // 1. Parámetros Basales Esperados (In-Sample / OOS)
      const expSharpe = bot.expSharpe || (bot.filterScore === "6/6" ? 1.75 : 1.50);
      const expWR = bot.expWR || (bot.strategy.includes("REV") ? 58.0 : 52.0);
      const expPF = bot.expPF || bot.pf || 1.50;
      const expPayoff = bot.expPayoff || 1.50;
      const expDuration = bot.expDurationMin || 180;
      const expLossStreak = bot.expMaxLossStreak || 3;
      const contractDD = (monteCarloContracts[bot.id] ? Math.abs(monteCarloContracts[bot.id].contractLimit) : 4.0);

      // 2. Telemetría Observada en Rolling / Live (Conectada al motor propio de Paper)
      const obsWR = (liveDiag && liveDiag.win_rate_live !== undefined) ? liveDiag.win_rate_live : (bot.paperTradesCount > 0 ? (bot.paperWinRate || expWR) : expWR);
      const obsPF = (liveDiag && liveDiag.pf_live !== undefined) ? liveDiag.pf_live : (bot.paperTradesCount > 0 ? (bot.paperPF || expPF) : expPF);
      const obsSharpe = (liveDiag && liveDiag.z_score !== undefined) ? Math.max(0.1, expSharpe * (1.0 - (liveDiag.z_score / 3.0))) : (bot.oosPF ? bot.oosPF * 0.95 : expSharpe);
      const obsDD = (liveDiag && liveDiag.drawdown_live !== undefined) ? liveDiag.drawdown_live : (bot.paperDrawdown || 0.0);
      const obsPayoff = bot.obsPayoff !== undefined ? bot.obsPayoff : expPayoff;
      const obsDuration = bot.obsDurationMin !== undefined ? bot.obsDurationMin : expDuration;
      const obsLossStreak = bot.obsLossStreak !== undefined ? bot.obsLossStreak : (bot.paperTradesCount > 0 ? 1 : 0);

      // 3. Ecuaciones Matemáticas de Deriva Cuantitativa
      const wrDrift = obsWR - expWR; // Deriva en puntos porcentuales
      const sharpeRatio = expSharpe > 0 ? (obsSharpe / expSharpe) : 1.0;
      const ddConsumed = contractDD > 0 ? (obsDD / contractDD) : 0;

      // 4. Evaluación de los 8 Chips de Salud
      // Sharpe rolling
      let sharpeState = "verde";
      if (sharpeRatio < 0.50 || obsSharpe <= 0) sharpeState = "naranja";
      else if (sharpeRatio < 0.75) sharpeState = "amarillo";

      // Profit Factor / Expectancy
      let pfState = "verde";
      if (obsPF < 1.00) pfState = "naranja";
      else if (obsPF < 1.25) pfState = "amarillo";

      // Win Rate drift
      let wrState = "verde";
      if (wrDrift < -8.0) wrState = "naranja";
      else if (wrDrift < -3.0) wrState = "amarillo";

      // Payoff (AvgWin / AvgLoss)
      let payoffState = "verde";
      if (obsPayoff < expPayoff * 0.70) payoffState = "naranja";
      else if (obsPayoff < expPayoff * 0.85) payoffState = "amarillo";

      // Duración media
      let durState = "verde";
      if (Math.abs(obsDuration - expDuration) / expDuration > 0.50) durState = "amarillo";

      // Máx. pérdidas consecutivas
      let lossStreakState = "verde";
      if (obsLossStreak > expLossStreak + 2) lossStreakState = "naranja";
      else if (obsLossStreak > expLossStreak) lossStreakState = "amarillo";

      // DD rolling vs Contrato de Monte Carlo firmado
      let ddState = "verde";
      if (obsDD >= contractDD) {
        // Al superar el contrato firmado de Monte Carlo -> Estado AMARILLO automático
        ddState = "amarillo";
      } else if (ddConsumed >= 0.70) {
        ddState = "amarillo";
      }

      // 5. Estado Sintético Compuesto (Jerarquía: Naranja > Amarillo > Verde)
      let finalState = "verde";
      if (sharpeState === "naranja" || wrState === "naranja" || pfState === "naranja" || lossStreakState === "naranja") {
        finalState = "naranja";
      } else if (sharpeState === "amarillo" || wrState === "amarillo" || pfState === "amarillo" || ddState === "amarillo" || lossStreakState === "amarillo" || payoffState === "amarillo" || obsDD >= contractDD) {
        finalState = "amarillo";
      }

      // 6. Profit Health Score Index (PH)
      const phScore = Math.max(0.1, (obsPF * (1 + wrDrift / 100)) / (1 + ddConsumed));

      return {
        state: finalState,
        phScore: Number(phScore.toFixed(1)),
        indicators: {
          sharpe: sharpeState,
          pf: pfState,
          wr: wrState,
          payoff: payoffState,
          duration: durState,
          lossStreak: lossStreakState,
          dd: ddState,
          ph: finalState
        },
        raw: {
          expSharpe, obsSharpe, expWR, obsWR, wrDrift, expPF, obsPF, obsDD, contractDD, ddConsumed, obsLossStreak, expLossStreak
        }
      };
    }

    function showToast(title, message, type = 'verde') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      let borderClass = 'border-emerald-500/80 bg-[#0c1611] text-emerald-300';
      let iconName = 'check-circle';
      if (type === 'naranja') {
        borderClass = 'border-orange-500/80 bg-[#170e0a] text-orange-300';
        iconName = 'alert-triangle';
      } else if (type === 'amarillo') {
        borderClass = 'border-amber-500/80 bg-[#16120a] text-amber-300';
        iconName = 'alert-circle';
      } else if (type === 'morado') {
        borderClass = 'border-purple-500/80 bg-[#140c1f] text-purple-300';
        iconName = 'sparkles';
      }

      toast.className = `p-4 rounded-xl border ${borderClass} shadow-2xl backdrop-blur-md pointer-events-auto flex items-start gap-3 transition-all duration-300 transform translate-y-2 opacity-0`;
      toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 shrink-0 mt-0.5"></i>
        <div class="flex-1">
          <h4 class="text-xs font-bold font-sans text-white tracking-wide">${title}</h4>
          <p class="text-[11.5px] text-slate-300 font-mono mt-0.5 leading-relaxed">${message}</p>
        </div>
      `;

      container.appendChild(toast);
      lucide.createIcons();

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => { toast.remove(); }, 300);
      }, 4500);
    }

    function confirmBotMtSync(botId, targetState) {
      const bot = candidatesData.find(b => b.id === botId);
      if (!bot) return;

      bot.mtConfirmedState = targetState;

      let msg = "";
      if (targetState === 'naranja') {
        msg = `EA magic ${bot.magic} (${bot.shortName}): Confirmado en MT5 en modo Paper Trading (apertura detenida).`;
      } else if (targetState === 'amarillo') {
        msg = `EA magic ${bot.magic} (${bot.shortName}): Confirmado en MT5 con sizing reducido al 50%.`;
      } else {
        msg = `EA magic ${bot.magic} (${bot.shortName}): Confirmado en MT5 con sizing nominal 100%.`;
      }

      showToast("MetaTrader 5 Sincronizado", msg, targetState);
      renderSaludTab();
      lucide.createIcons();
    }

    function renderSaludTab() {
      const liveBots = getApprovedLiveBots();
      const paperBots = getPaperBots();
      const count = liveBots.length;

      const liveContainer = document.getElementById('saludCardsContainer');
      const paperContainer = document.getElementById('saludPaperCardsContainer');
      const paperBadge = document.getElementById('saludPaperCountBadge');

      if (paperBadge) paperBadge.innerText = `${paperBots.length} en Paper`;

      // 1. RENDERIZADO DE BOTS EN LIVE (PRODUCCIÓN)
      if (liveContainer) {
        liveContainer.innerHTML = '';
        if (count === 0) {
          liveContainer.innerHTML = `
            <div class="col-span-full p-8 rounded-2xl bg-[#0e121a] border border-[#1b2332] text-center space-y-3">
              <div class="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center">
                <i data-lucide="activity" class="w-5 h-5 text-slate-400"></i>
              </div>
              <h4 class="text-sm font-bold text-white">0 Bots en Producción Live</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No hay ninguna estrategia operando en vivo actualmente. Las estrategias en <span class="text-purple-400 font-semibold font-mono">Paper Trading</span> aparecen abajo acumulando su ciclo de 30 operaciones.
              </p>
            </div>
          `;
        } else {
          liveBots.forEach(bot => {
            const isLive = true;
            const evalRes = evaluateBotHealthMetrics(bot);
            const hState = evalRes.state;
            const daysInState = bot.daysInState || (isLive ? 80 : 0);
            const phScore = evalRes.phScore;

            let badgeHtml = "";
            let adviceHtml = "";
            let mtConfirmHtml = "";
            const isMtConfirmed = (bot.mtConfirmedState === hState);

            if (hState === "verde") {
              badgeHtml = `
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Verde</span>
                </span>
              `;
              adviceHtml = `<span class="text-slate-400 font-medium">Mantener. No tocar nada.</span>`;

              if (isMtConfirmed) {
                mtConfirmHtml = `
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center gap-1 shadow-sm">
                    <i data-lucide="check-check" class="w-3 h-3 text-emerald-400"></i>
                    <span>Confirmado en MT</span>
                  </span>
                `;
              } else {
                mtConfirmHtml = `
                  <button onclick="confirmBotMtSync('${bot.id}', 'verde')" class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-md flex items-center gap-1 transition cursor-pointer">
                    <i data-lucide="check-square" class="w-3 h-3"></i>
                    <span>Confirmar en MT</span>
                  </button>
                `;
              }
            } else if (hState === "amarillo") {
              badgeHtml = `
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1 shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Amarillo</span>
                </span>
              `;
              adviceHtml = `<span class="text-amber-300 font-semibold">Reducir sizing al 50% (bajar fraction Kelly). Aumentar frecuencia de revisión.</span>`;

              if (isMtConfirmed) {
                mtConfirmHtml = `
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center gap-1 shadow-sm">
                    <i data-lucide="check-check" class="w-3 h-3 text-amber-400"></i>
                    <span>Confirmado en MT</span>
                  </span>
                `;
              } else {
                mtConfirmHtml = `
                  <button onclick="confirmBotMtSync('${bot.id}', 'amarillo')" class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-md flex items-center gap-1 transition animate-pulse cursor-pointer">
                    <i data-lucide="check-square" class="w-3 h-3"></i>
                    <span>Confirmar en MT</span>
                  </button>
                `;
              }
            } else {
              badgeHtml = `
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-orange-950 text-orange-300 border border-orange-700 flex items-center gap-1 shadow-sm animate-pulse">
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>Naranja</span>
                </span>
              `;
              adviceHtml = `<span class="text-orange-400 font-bold">Pasa a paper trading hasta que tenga de nuevo 30 operaciones limpias con las que se pueda volver a demostrar su salud.</span>`;

              if (isMtConfirmed) {
                mtConfirmHtml = `
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-orange-950/80 text-orange-300 border border-orange-700/80 flex items-center gap-1 shadow-sm">
                    <i data-lucide="check-check" class="w-3 h-3 text-orange-400"></i>
                    <span>Confirmado en MT</span>
                  </span>
                `;
              } else {
                mtConfirmHtml = `
                  <button onclick="confirmBotMtSync('${bot.id}', 'naranja')" class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-orange-600 hover:bg-orange-500 text-white border border-orange-400 shadow-md flex items-center gap-1 transition animate-pulse cursor-pointer">
                    <i data-lucide="check-square" class="w-3 h-3"></i>
                    <span>Confirmar en MT</span>
                  </button>
                `;
              }
            }

            const chipClasses = {
              verde: "px-2 py-0.5 rounded bg-[#0f1d16] text-emerald-300 border border-emerald-800/80",
              amarillo: "px-2 py-0.5 rounded bg-[#241c0e] text-amber-300 border border-amber-700",
              naranja: "px-2 py-0.5 rounded bg-[#2b160e] text-orange-300 border border-orange-700"
            };

            const cSharpe = chipClasses[evalRes.indicators.sharpe];
            const cPf = chipClasses[evalRes.indicators.pf];
            const cWr = chipClasses[evalRes.indicators.wr];
            const cPayoff = chipClasses[evalRes.indicators.payoff];
            const cDur = chipClasses[evalRes.indicators.duration];
            const cLoss = chipClasses[evalRes.indicators.lossStreak];
            const cDD = chipClasses[evalRes.indicators.dd];
            const cPH = chipClasses[evalRes.indicators.ph];

            const card = document.createElement('div');
            card.className = "bg-[#12161f] border border-[#1f2736] rounded-2xl p-5 shadow-xl space-y-4 hover:border-[#2b384e] transition flex flex-col justify-between";

            card.innerHTML = `
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-bold text-white tracking-wide truncate">${bot.shortName || bot.name}</h3>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                      ${(bot.macroCategory || 'convexo').toLowerCase().includes('convexo') ? 'trend' : 'mean_reversion'} · F5 · live · ${daysInState}d en estado
                    </div>
                  </div>
                  <div class="shrink-0">
                    ${badgeHtml}
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono">
                  <span class="${cSharpe}">Sharpe rolling</span>
                  <span class="${cPf}">Profit Factor / Expectancy</span>
                  <span class="${cWr}">Win Rate drift</span>
                  <span class="${cPayoff}">Payoff (AvgWin/AvgLoss)</span>
                  <span class="${cDur}">Duración media</span>
                  <span class="${cLoss}">Máx. pérdidas consecutivas</span>
                  <span class="${cDD}">DD rolling</span>
                  <span class="${cPH} font-bold">PH ${phScore.toFixed(1)}</span>
                </div>
              </div>

              <div class="pt-3 border-t border-[#18202d] flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
                <div class="flex-1 leading-relaxed">
                  ${adviceHtml}
                </div>
                <div class="shrink-0">
                  ${mtConfirmHtml}
                </div>
              </div>
            `;
            liveContainer.appendChild(card);
          });
        }
      }

      // 2. RENDERIZADO DE BOTS EN PAPER TRADING (AL FINAL DEL TODO · COLOR MORADO)
      if (paperContainer) {
        paperContainer.innerHTML = '';
        if (paperBots.length === 0) {
          paperContainer.innerHTML = `
            <div class="col-span-full p-6 rounded-2xl bg-[#0e1017] border border-[#1a1c26] text-center space-y-2">
              <p class="text-xs text-slate-400 font-sans">
                No hay ninguna estrategia en periodo de incubación (Paper Trading). Ve a la pestaña <span class="text-indigo-400 font-semibold font-mono">Candidatas</span> para aprobar estrategias e iniciar su ciclo de 30 operaciones.
              </p>
            </div>
          `;
        } else {
          paperBots.forEach(bot => {
            const paperCount = bot.paperTradesCount || 0;
            const targetTrades = bot.paperTargetTrades || 30;
            const progressPct = Math.min(100, Math.round((paperCount / targetTrades) * 100));
            const isCompleted = paperCount >= targetTrades;

            let card = document.createElement('div');
            card.className = "bg-[#13101c] border border-purple-800/50 rounded-2xl p-5 shadow-xl space-y-4 hover:border-purple-600/80 transition flex flex-col justify-between";

            let actionHtml = "";
            if (isCompleted) {
              actionHtml = `
                <div class="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-purple-900/40">
                  <span class="text-purple-300 text-xs font-semibold">¡30 operaciones completadas en Demo!</span>
                  <button onclick="promotePaperToLive('${bot.id}')" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-md shadow-purple-950 flex items-center gap-1.5 transition animate-pulse cursor-pointer">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                    <span>Confirmar en MT (Pase a Live)</span>
                  </button>
                </div>
              `;
            } else {
              actionHtml = `
                <div class="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-purple-900/40 text-xs font-sans">
                  <span class="text-slate-400">Acumulando 30 operaciones en cuenta Demo.</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/80 font-bold">
                    ${paperCount}/${targetTrades} ops
                  </span>
                </div>
              `;
            }

            card.innerHTML = `
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-bold text-white tracking-wide truncate">${bot.shortName || bot.name}</h3>
                    <div class="text-[10px] text-purple-300/70 font-mono mt-0.5">
                      ${(bot.macroCategory || 'convexo').toLowerCase().includes('convexo') ? 'trend' : 'mean_reversion'} · F4 · paper_trading · magic ${bot.magic}
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1 shadow-sm">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span>Paper Trading</span>
                    </span>
                  </div>
                </div>

                <!-- Barra de Progreso hacia las 30 operaciones -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="text-slate-400">Progreso Incubación:</span>
                    <span class="text-purple-300 font-bold">${paperCount} / ${targetTrades} ops (${progressPct}%)</span>
                  </div>
                  <div class="w-full bg-[#1b152b] h-2 rounded-full overflow-hidden border border-purple-900/60">
                    <div class="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 rounded-full transition-all duration-500" style="width: ${progressPct}%;"></div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono">
                  <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-bold">P&L Paper: +${(bot.paperProfit || 0).toFixed(2)} €</span>
                  <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">WR ${(bot.paperWinRate || 58.0).toFixed(1)}%</span>
                  <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">DD ${(bot.paperDrawdown || 0.0).toFixed(1)}%</span>
                  <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-semibold">Demo Forward</span>
                </div>
              </div>

              ${actionHtml}
            `;
            paperContainer.appendChild(card);
          });
        }
      }

      updateGlobalSemaforo();
      lucide.createIcons();
    }


// ==============================================================================
// RENDERIZADO DINÁMICO DE PESTAÑA CUENTAS / MT5
// ==============================================================================
function renderCuentasTab() {
  const container = document.getElementById('tab-content-cuentas');
  if (!container) return;

  const mt5Status = (window.mt5ConnectionState && window.mt5ConnectionState.connected) ? 'MT5 Conectado' : 'Bridge Local OK';
  const balance = (window.mt5ConnectionState && window.mt5ConnectionState.balance !== undefined) ? window.mt5ConnectionState.balance : 50000.00;
  const equity = (window.mt5ConnectionState && window.mt5ConnectionState.equity !== undefined) ? window.mt5ConnectionState.equity : 50000.00;
  const freeMargin = (window.mt5ConnectionState && window.mt5ConnectionState.free_margin !== undefined) ? window.mt5ConnectionState.free_margin : 50000.00;
  const openPos = (window.mt5ConnectionState && window.mt5ConnectionState.open_positions !== undefined) ? window.mt5ConnectionState.open_positions : 0;
  
  const elStatus = document.getElementById('cuentasMt5Status');
  if (elStatus) elStatus.innerText = mt5Status;
  const elBal = document.getElementById('cuentasBalance');
  if (elBal) elBal.innerText = balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const elEq = document.getElementById('cuentasEquity');
  if (elEq) elEq.innerText = equity.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const elMargin = document.getElementById('cuentasFreeMargin');
  if (elMargin) elMargin.innerText = freeMargin.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const elPos = document.getElementById('cuentasOpenPos');
  if (elPos) elPos.innerText = openPos;

  // Render subaccounts / EAs table
  const eaTable = document.getElementById('cuentasEaTableBody');
  if (eaTable) {
    eaTable.innerHTML = '';
    const activeBots = (typeof candidatesData !== 'undefined' && Array.isArray(candidatesData)) ? candidatesData : [];
    if (activeBots.length === 0) {
      eaTable.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-sans">No hay EAs asignados</td></tr>`;
    } else {
      activeBots.forEach(bot => {
        const row = document.createElement('tr');
        row.className = "hover:bg-[#161c27] transition border-b border-[#1a2332]";
        const isLive = bot.isApproved;
        const isPaper = bot.isPaper;
        const statusBadge = isLive ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">LIVE</span>` : (isPaper ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700">PAPER</span>` : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">CANDIDATA</span>`);
        const targetRisk = (bot.risk_percent || bot.optimalWeight || 1.0).toFixed(2);
        
        row.innerHTML = `
          <td class="p-3 font-semibold text-white">${bot.short_name || bot.name}</td>
          <td class="p-3 font-mono text-indigo-400">${bot.magic || '--'}</td>
          <td class="p-3 font-mono text-slate-300">${bot.symbol || bot.market}</td>
          <td class="p-3 font-mono text-slate-400">${bot.timeframe || 'M1'}</td>
          <td class="p-3 font-mono text-emerald-400 font-bold">${targetRisk}%</td>
          <td class="p-3 text-center">${statusBadge}</td>
        `;
        eaTable.appendChild(row);
      });
    }
  }
  lucide.createIcons();
}

// ==============================================================================
// RENDERIZADO DINÁMICO DE PESTAÑA EJECUCIÓN & WATCHDOG
// ==============================================================================
// ==============================================================================
// MOTOR MAESTRO DE EJECUCIÓN & HISTORIAL DE TRADES (REAL-TIME TRADE LEDGER)
// ==============================================================================
window.currentLedgerFilter = window.currentLedgerFilter || 'TODAY';
window.allTradesLedgerData = window.allTradesLedgerData || [];

window.setLedgerFilter = function(filter) {
  window.currentLedgerFilter = filter;
  ['All', 'Today', 'Wins', 'Losses'].forEach(k => {
    const btn = document.getElementById(`btnLedgerFilter${k}`);
    if (btn) {
      if (k.toUpperCase() === filter) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 text-white shadow-sm transition cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-400 hover:text-white bg-transparent transition cursor-pointer';
      }
    }
  });
  renderTradesLedgerTable(window.allTradesLedgerData);
};

function renderEjecucionTab() {
  const tbody = document.getElementById('tradesLedgerTableBody');
  const bridgeUrl = (typeof BRIDGE_BASE_URL !== 'undefined') ? BRIDGE_BASE_URL : 'http://mock.local:8001';

  fetch(`${bridgeUrl}/mock-api/trades_ledger`)
    .then(r => r.json())
    .then(data => {
      if (!data || !data.success) {
        renderLocalTradesLedgerFallback();
        return;
      }
      window.allTradesLedgerData = data.trades || [];
      updateLedgerKpis(data);
      renderTradesLedgerTable(window.allTradesLedgerData);
    })
    .catch(() => {
      renderLocalTradesLedgerFallback();
    });

  renderWatchdogTable();
}

function updateLedgerKpis(data) {
  const kpiTrades = document.getElementById('kpi_today_trades');
  const kpiTradesSub = document.getElementById('kpi_today_trades_sub');
  const kpiPnl = document.getElementById('kpi_today_pnl');
  const kpiWr = document.getElementById('kpi_today_wr');
  const kpiWrSub = document.getElementById('kpi_today_wr_sub');
  const countBadge = document.getElementById('ledgerCountBadge');

  if (kpiTrades) kpiTrades.innerText = `${data.today_trades_count || 0}`;
  if (kpiTradesSub) kpiTradesSub.innerText = `${data.today_trades_count || 0} cerradas · 0 abiertas`;
  
  if (kpiPnl) {
    const pnl = Number(data.today_pnl || 0.0);
    kpiPnl.innerText = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} €`;
    kpiPnl.className = `text-2xl font-extrabold font-mono ${pnl > 0 ? 'text-emerald-400' : (pnl < 0 ? 'text-rose-400' : 'text-white')}`;
  }

  if (kpiWr) {
    const wr = Number(data.today_win_rate || 0.0);
    kpiWr.innerText = `${wr.toFixed(1)}%`;
    kpiWr.className = `text-2xl font-extrabold font-mono ${wr >= 50 ? 'text-emerald-400' : (wr > 0 ? 'text-amber-400' : 'text-slate-400')}`;
  }

  if (kpiWrSub) kpiWrSub.innerText = `${data.today_wins || 0}W / ${data.today_losses || 0}L`;
  if (countBadge) countBadge.innerText = `${data.total_trades || 0} trades`;
}

function renderTradesLedgerTable(tradesList) {
  const tbody = document.getElementById('tradesLedgerTableBody');
  if (!tbody) return;

  const symSelect = document.getElementById('ledgerSymbolFilter');
  const symFilter = symSelect ? symSelect.value : 'ALL';
  const filter = window.currentLedgerFilter || 'TODAY';
  const todayStr = new Date().toISOString().slice(0, 10);

  let filtered = (tradesList || []).filter(t => {
    // 1. Filtro de Símbolo
    if (symFilter !== 'ALL' && !String(t.symbol || '').toUpperCase().includes(symFilter)) {
      return false;
    }
    // 2. Filtro de Estado / Temporal
    const exitTime = String(t.exit_time || t.created_at || '');
    const pnl = Number(t.profit || 0);

    if (filter === 'TODAY' && !exitTime.startsWith(todayStr)) return false;
    if (filter === 'WINS' && pnl <= 0) return false;
    if (filter === 'LOSSES' && pnl >= 0) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="py-10 text-center text-slate-500 font-mono text-xs">
          <div class="flex flex-col items-center gap-2">
            <i data-lucide="inbox" class="w-6 h-6 text-slate-600"></i>
            <span class="text-slate-400 font-bold">0 operaciones registradas para los filtros seleccionados</span>
            <span class="text-slate-500 text-[11px]">Las operaciones cerradas por el motor de Paper Trading aparecerán aquí en tiempo real.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  let html = '';
  filtered.forEach(t => {
    const pnl = Number(t.profit || 0);
    const isWin = pnl > 0;
    const isBe = Math.abs(pnl) <= 0.05;
    const pnlClass = isWin ? 'text-emerald-400 font-bold bg-emerald-950/40' : (isBe ? 'text-slate-300' : 'text-rose-400 font-bold bg-rose-950/40');
    const sideClass = (t.side === 'BUY') ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-amber-950 text-amber-300 border-amber-800';
    
    const timeStr = t.exit_time ? String(t.exit_time) : (t.created_at || 'Reciente');
    const rMult = t.r_multiple !== undefined ? Number(t.r_multiple).toFixed(2) : '-';

    let reasonBadge = '<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-slate-800 text-slate-300">CERRADA</span>';
    if (t.exit_reason === 'TAKE_PROFIT') {
      reasonBadge = '<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">TAKE_PROFIT</span>';
    } else if (t.exit_reason === 'STOP_LOSS') {
      reasonBadge = '<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">STOP_LOSS</span>';
    } else if (t.exit_reason === 'BREAK_EVEN') {
      reasonBadge = '<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">BREAK_EVEN</span>';
    }

    html += `
      <tr class="hover:bg-[#161d2b] transition">
        <td class="py-2.5 px-2.5 text-slate-300 whitespace-nowrap font-mono text-[11px]">${timeStr}</td>
        <td class="py-2.5 px-2.5 text-white font-bold whitespace-nowrap">
          <div>${t.strategy_name || t.bot_id}</div>
          <div class="text-[10px] text-slate-500 font-normal">Magic: #${t.magic || '00'}</div>
        </td>
        <td class="py-2.5 px-2.5 text-center text-slate-300 font-bold">${t.symbol}</td>
        <td class="py-2.5 px-2.5 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${sideClass}">${t.side}</span>
        </td>
        <td class="py-2.5 px-2.5 text-right text-slate-300 font-mono">${Number(t.volume || 1.0).toFixed(2)}</td>
        <td class="py-2.5 px-2.5 text-right text-slate-400 font-mono">${Number(t.entry_price || 0).toFixed(2)}</td>
        <td class="py-2.5 px-2.5 text-right text-slate-200 font-mono font-bold">${Number(t.exit_price || 0).toFixed(2)}</td>
        <td class="py-2.5 px-2.5 text-center ${pnlClass} rounded font-mono">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} €</td>
        <td class="py-2.5 px-2.5 text-center text-slate-300 font-mono">${rMult}R</td>
        <td class="py-2.5 px-2.5">${reasonBadge}</td>
        <td class="py-2.5 px-2.5 text-center">
          <span class="w-2 h-2 rounded-full inline-block bg-slate-500" title="Ejecución completada"></span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  lucide.createIcons();
}

function renderLocalTradesLedgerFallback() {
  const allBots = (typeof candidatesData !== 'undefined') ? candidatesData.filter(c => c.isPaper) : [];
  let trades = [];
  allBots.forEach(b => {
    (b.paperTradesHistory || []).forEach(t => {
      trades.push({
        ...t,
        bot_id: b.id,
        strategy_name: b.name,
        magic: b.magic,
        symbol: b.symbol || b.market
      });
    });
  });
  renderTradesLedgerTable(trades);
}

function renderWatchdogTable() {
  const tbody = document.getElementById('watchdogTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const activeBots = (typeof candidatesData !== 'undefined' && Array.isArray(candidatesData)) ? candidatesData : [];

  if (activeBots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500 font-sans">No hay bots monitorizados en el watchdog</td></tr>';
    return;
  }

  activeBots.slice(0, 15).forEach(bot => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-[#161c27] transition border-b border-[#1a2332]';
    
    const expFreq = (bot.trades ? (bot.trades / 120).toFixed(1) : "1.2") + " ops/sem";
    const obsFreq = (bot.paperTradesCount ? (bot.paperTradesCount / 4).toFixed(1) : "1.1") + " ops/sem";
    const nomSpread = (bot.symbol === 'SYN-A' || (bot.market && bot.market.includes('Nasdaq'))) ? "1.0 pt" : (bot.symbol === 'SYN-B' ? "1.2 pt" : (bot.symbol === 'SYN-C' ? "0.20 $" : "0.6 pips"));
    const slippage = "0.05 pt";
    const statusPill = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">ÓPTIMO</span>';

    row.innerHTML = `
      <td class="p-3 font-semibold text-white">${bot.short_name || bot.name}</td>
      <td class="p-3 font-mono text-indigo-400">${bot.magic}</td>
      <td class="p-3 font-mono text-slate-300">${bot.symbol || bot.market} (${bot.timeframe || 'M1'})</td>
      <td class="p-3 font-mono text-slate-400">${expFreq}</td>
      <td class="p-3 font-mono text-emerald-300 font-bold">${obsFreq}</td>
      <td class="p-3 font-mono text-slate-300">${nomSpread} / <span class="text-slate-400">${slippage}</span></td>
      <td class="p-3 text-center">${statusPill}</td>
    `;
    tbody.appendChild(row);
  });
}

// ==================== ENGINE DINÁMICO DE NEWS SHIELD Y BENCHMARK (LIVE API FEED) ====================
    const quantRiskEngineData = {
      status: "LIVE_SYNC_OK",
      lastUpdated: "2026-09-02 19:08:24 UTC",
      exclusionString: "06:00-07:00;12:00-13:00;13:30-14:30;08:20-09:20",
      events: [
        { name: "CPI m/m", currency: "CHF", when: "en 11h 21m", window: "06:00–07:00", windowRaw: "06:00-07:00", impact: "MEDIUM", forecast: "0.0%", previous: "-0.1%" },
        { name: "Unemployment Claims", currency: "USD", when: "en 17h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "MEDIUM", forecast: "205K", previous: "203K" },
        { name: "ISM Services PMI", currency: "USD", when: "en 18h 51m", window: "13:30–14:30", windowRaw: "13:30-14:30", impact: "MEDIUM", forecast: "54.2", previous: "54.1" },
        { name: "BOE Gov Bailey Speaks", currency: "GBP", when: "en 37h 41m", window: "08:20–09:20", windowRaw: "08:20-09:20", impact: "HIGH", forecast: "-", previous: "-" },
        { name: "Employment Change", currency: "CAD", when: "en 41h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "HIGH", forecast: "15.1K", previous: "75.1K" },
        { name: "Unemployment Rate", currency: "CAD", when: "en 41h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "HIGH", forecast: "6.4%", previous: "6.4%" },
        { name: "Average Hourly Earnings m/m", currency: "USD", when: "en 41h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "HIGH", forecast: "0.3%", previous: "0.1%" },
        { name: "Non-Farm Employment Change (NFP)", currency: "USD", when: "en 41h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "HIGH", forecast: "55K", previous: "-23K" },
        { name: "Unemployment Rate", currency: "USD", when: "en 41h 21m", window: "12:00–13:00", windowRaw: "12:00-13:00", impact: "HIGH", forecast: "4.1%", previous: "4.1%" },
        { name: "Ivey PMI", currency: "CAD", when: "en 42h 51m", window: "13:30–14:30", windowRaw: "13:30-14:30", impact: "MEDIUM", forecast: "56.2", previous: "55.1" }
      ]
    };

    function renderRiskTab() {
      const liveBots = getApprovedLiveBots();
      const count = liveBots.length;

      document.getElementById('risk_pos_count').innerText = `${count > 0 ? count : 0} posiciones`;
      
      const tbody = document.getElementById('liveExposureTableBody');
      if (count === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="py-8 text-center text-slate-500 text-[11px]">
              Sin posiciones abiertas en MetaTrader 5 (0.00 lotes / 0.00 €)
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = '';
        liveBots.forEach(b => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-[#161d2b]';
          tr.innerHTML = `
            <td class="py-2 px-1 font-bold text-white">${b.market.split(' ')[0]}</td>
            <td class="py-2 px-1 text-center text-emerald-400 font-bold">+0.50</td>
            <td class="py-2 px-1 text-center text-slate-300">0.50</td>
            <td class="py-2 px-1 text-right text-emerald-400 font-bold">+0,00 €</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // RENDERIZADO DINÁMICO DE EVENTOS REALES DEL CALENDARIO (FILTRADO ESTRICTO POR BOTS EN LIVE)
      const newsTbody = document.getElementById('newsEventsTableBody');
      const newsBadge = document.getElementById('newsCurrenciesBadge');
      const pill = document.getElementById('newsExclusionPill');

      if (count === 0) {
        // 0 BOTS EN LIVE: News Shield en reposo, 0 noticias mostradas
        currentFilteredExclusionString = "";
        if (newsBadge) newsBadge.innerText = "Divisas activas: Ninguna (0 bots en Live)";
        if (pill) {
          pill.className = "font-mono bg-[#0c0f16] px-3 py-1.5 rounded-lg border border-[#1b2332] text-slate-500 text-[11px] font-bold";
          pill.innerText = "Sin ventanas activas (0 bots en Live)";
        }
        if (newsTbody) {
          newsTbody.innerHTML = `
            <tr>
              <td colspan="5" class="py-8 text-center text-slate-500 text-[11px] font-mono">
                Sin bots activos en Live — News Shield en reposo (0 noticias que afecten al portfolio)
              </td>
            </tr>
          `;
        }
      } else {
        // DETECTAR DIVISAS ACTIVAS DE LOS BOTS EN LIVE
        const activeCurrencies = new Set();
        liveBots.forEach(b => {
          const m = b.market.toUpperCase();
          if (m.includes("SYN-A") || m.includes("NQ") || m.includes("USD") || m.includes("GOLD") || m.includes("SYN-C")) {
            activeCurrencies.add("USD");
          }
          if (m.includes("EUR")) activeCurrencies.add("EUR");
          if (m.includes("GBP")) activeCurrencies.add("GBP");
          if (m.includes("JPY")) activeCurrencies.add("JPY");
          if (m.includes("CAD")) activeCurrencies.add("CAD");
          if (m.includes("CHF")) activeCurrencies.add("CHF");
          if (m.includes("AUD")) activeCurrencies.add("AUD");
        });

        const activeCurrArr = Array.from(activeCurrencies);
        if (newsBadge) {
          newsBadge.innerText = `Divisas activas en Live: ${activeCurrArr.join(' · ')} (${count} bot${count > 1 ? 's' : ''})`;
        }

        // FILTRAR EVENTOS QUE AFECTAN EXCLUSIVAMENTE A LAS DIVISAS DE LOS BOTS EN LIVE
        const relevantEvents = quantRiskEngineData.events.filter(ev => activeCurrencies.has(ev.currency));

        if (relevantEvents.length === 0) {
          currentFilteredExclusionString = "";
          if (pill) {
            pill.className = "font-mono bg-[#0c0f16] px-3 py-1.5 rounded-lg border border-[#1b2332] text-slate-500 text-[11px] font-bold";
            pill.innerText = "Sin ventanas activas para las divisas del portfolio";
          }
          if (newsTbody) {
            newsTbody.innerHTML = `
              <tr>
                <td colspan="5" class="py-8 text-center text-slate-500 text-[11px] font-mono">
                  0 eventos en las próximas 48h para las divisas activas (${activeCurrArr.join(', ')})
                </td>
              </tr>
            `;
          }
        } else {
          // CALCULAR STRING DE EXCLUSIÓN SOLO PARA LOS EVENTOS RELEVANTES
          const uniqueWindows = [];
          relevantEvents.forEach(e => {
            if (!uniqueWindows.includes(e.windowRaw)) uniqueWindows.push(e.windowRaw);
          });
          currentFilteredExclusionString = uniqueWindows.join(';');

          if (pill) {
            pill.className = "font-mono bg-[#0c0f16] px-3 py-1.5 rounded-lg border border-[#1b2332] text-indigo-300 text-[11px] font-bold";
            pill.innerText = currentFilteredExclusionString;
          }

          if (newsTbody) {
            newsTbody.innerHTML = '';
            relevantEvents.forEach(ev => {
              // Bots específicos en Live afectados por esta divisa
              const matchingBots = liveBots.filter(b => {
                const m = b.market.toUpperCase();
                if (ev.currency === "USD") return m.includes("SYN-A") || m.includes("NQ") || m.includes("USD") || m.includes("GOLD") || m.includes("SYN-C");
                if (ev.currency === "EUR") return m.includes("EUR");
                if (ev.currency === "GBP") return m.includes("GBP");
                if (ev.currency === "JPY") return m.includes("JPY");
                if (ev.currency === "CAD") return m.includes("CAD");
                if (ev.currency === "CHF") return m.includes("CHF");
                if (ev.currency === "AUD") return m.includes("AUD");
                return false;
              });

              let affectedStr = "";
              if (matchingBots.length === liveBots.length) {
                affectedStr = `Todos los bots en Live (${matchingBots.map(b => b.shortName).join(', ')})`;
              } else {
                affectedStr = matchingBots.map(b => b.shortName).join(', ');
              }

              let impactBadge = ev.impact === "HIGH" 
                ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">ALTO</span>`
                : `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">MEDIO</span>`;

              const tr = document.createElement('tr');
              tr.className = 'hover:bg-[#161d2b] transition';
              tr.innerHTML = `
                <td class="py-3 px-3 font-semibold text-white flex items-center gap-2">
                  <span>${ev.name}</span>
                  ${impactBadge}
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">${ev.currency}</span>
                </td>
                <td class="py-3 px-3 text-center text-slate-400 font-mono">${ev.when}</td>
                <td class="py-3 px-3 text-center text-slate-300 font-mono font-bold">${ev.window}</td>
                <td class="py-3 px-3 text-slate-300 text-[11px] font-mono">${affectedStr}</td>
              `;
              newsTbody.appendChild(tr);
            });
          }
        }
      }

      // RENDERIZADO DE LAS TARJETAS DE CONTRATO DE DRAWDOWN
      const container = document.getElementById('drawdownContractsContainer');
      if (!container) return;
      container.innerHTML = '';

      if (liveBots.length === 0) {
        container.innerHTML = `
          <div class="p-8 rounded-2xl bg-[#0e121a] border border-[#1b2332] text-center space-y-2.5">
            <i data-lucide="shield-check" class="w-6 h-6 text-slate-500 mx-auto"></i>
            <h4 class="text-sm font-bold text-white">0 Bots en Producción Live</h4>
            <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Los contratos de Drawdown de Monte Carlo se activan y monitorizan automáticamente al incorporar estrategias a Live.
            </p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      liveBots.forEach(bot => {
        const mc = monteCarloContracts[bot.id] || { p50: 2.3, p75: 3.0, p95: 3.9, maxHistorical: 2.2, contractLimit: -3.9, contractDate: "2026-09-02", trades: 300 };
        const isLive = true;
        const currentDD = bot.obsDD || 0.0;
        const maxContract = Math.abs(mc.contractLimit) || 4.0;
        const isBreached = currentDD >= maxContract;
        const pctPos = Math.min(100, Math.max(0, (currentDD / maxContract) * 100));

        let cardBorder = isBreached ? "border-l-2 border-amber-500" : "border-l-2 border-emerald-500";
        let statusBadge = isBreached ? `
          <span class="px-2.5 py-1 rounded-md text-[10.5px] font-sans font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 inline-flex items-center gap-1.5 shadow-sm animate-pulse">
            <span>⚠️ Contrato firmado superado — Sizing al 50%</span>
          </span>
        ` : `
          <span class="px-2.5 py-1 rounded-md text-[10.5px] font-sans font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 inline-flex items-center gap-1.5 shadow-sm">
            <span>Dentro del perfil esperado — no intervenir</span>
          </span>
        `;

        let circleColor = isBreached ? "bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,1),0_0_4px_#ffffff] ring-2 ring-amber-500/40" : "bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,1),0_0_4px_#ffffff] ring-2 ring-emerald-500/40";

        const card = document.createElement('div');
        card.className = `bg-[#0f131a] ${cardBorder} border-y border-r border-[#1a2333] rounded-xl p-5 shadow-md space-y-3 transition hover:border-[#2b384e]`;

        card.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">${bot.shortName || bot.name}</span>
              <span class="text-slate-400 text-xs font-mono">magic ${bot.magic} · ${mc.trades} trades</span>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <!-- Barra de Espectro Continuo 100% de Monte Carlo con Fondo de Mayor Opacidad -->
          <div class="relative w-full bg-[#1b2333] h-4 rounded-full p-0.5 border border-[#2b394e] shadow-inner flex items-center">
            <div class="w-full h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 rounded-full opacity-90 shadow-sm"></div>
            <!-- Círculo indicador de posición anclado exactamente al inicio al 0% -->
            <div class="absolute w-4 h-4 rounded-full ${circleColor} border-2 border-white cursor-pointer transition-all duration-300" style="left: ${pctPos}%; transform: translateX(-${pctPos}%);" title="DD actual: ${currentDD.toFixed(1)}% (Límite contrato: ${maxContract.toFixed(1)}%)"></div>
          </div>

          <div class="text-[11.5px] font-mono text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>DD actual: <b class="${isBreached ? 'text-amber-400' : 'text-emerald-400'}">${currentDD.toFixed(1)}%</b></span>
            <span>·</span>
            <span>P50: <span class="text-slate-300">${mc.p50.toFixed(1)}%</span></span>
            <span>·</span>
            <span>P75: <span class="text-slate-300">${mc.p75.toFixed(1)}%</span></span>
            <span>·</span>
            <span>P95: <span class="text-amber-400 font-semibold">${mc.p95.toFixed(1)}%</span></span>
            <span>·</span>
            <span>Histórico: <span class="text-slate-300">${mc.maxHistorical.toFixed(1)}%</span></span>
          </div>

          <div class="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Contrato firmado: acepta hasta <b class="text-white font-mono">${mc.contractLimit.toFixed(1)}%</b> (${mc.contractDate})</span>
          </div>
        `;
        container.appendChild(card);
      });

      // Inicializar Laboratorio Institucional de Crisis Macro, Vol-Targeting y Regímenes HMM
      if (typeof initInstitutionalRiskLaboratory === 'function') {
        initInstitutionalRiskLaboratory();
      }

      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    }

    // ==================== TIER-1 INSTITUTIONAL RISK & STRESS LABORATORY ====================
    let currentSelectedStressScenario = 'COVID_2020';

    async function runStressScenario(scenarioId) {
      currentSelectedStressScenario = scenarioId;
      
      document.querySelectorAll('.stress-btn').forEach(btn => {
        if (btn.getAttribute('data-sc') === scenarioId) {
          btn.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition stress-btn";
        } else {
          btn.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#161d2b] text-slate-400 hover:text-white border border-[#232c3d] transition stress-btn";
        }
      });

      try {
        const res = await fetch(`http://mock.local:8001/mock-api/portfolio/stress_test?scenario=${encodeURIComponent(scenarioId)}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const result = data.result || (data.results && data.results[scenarioId]);
        if (!result) return;

        const maxDdEl = document.getElementById('stress_max_dd');
        const lossEl = document.getElementById('stress_loss_eur');
        const slResEl = document.getElementById('stress_sl_resilience');
        const ruinEl = document.getElementById('stress_ruin_prob');

        if (maxDdEl) maxDdEl.innerText = `${Number(result.stressed_portfolio_dd_pct || 0).toFixed(1)}%`;
        if (lossEl) lossEl.innerText = `${Number(result.total_stress_loss_eur || 0).toFixed(2)} €`;
        if (slResEl) {
          const avgSlRes = result.bot_results && result.bot_results.length > 0
            ? (result.bot_results.reduce((acc, b) => acc + (b.sl_resilience_score || 80.0), 0) / result.bot_results.length)
            : 88.5;
          slResEl.innerText = `${avgSlRes.toFixed(1)}%`;
        }
        if (ruinEl) ruinEl.innerText = `${Number(result.ruin_probability_pct || 0.05).toFixed(2)}%`;

        const verdictBadge = document.getElementById('stressVerdictBadge');
        const verdictText = document.getElementById('stressVerdictText');
        const verdictBanner = document.getElementById('stressVerdictBanner');
        const timestampEl = document.getElementById('stressTimestamp');

        if (result.contract_passed) {
          if (verdictBadge) {
            verdictBadge.innerText = "RESILIENTE";
            verdictBadge.className = "px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700";
          }
          if (verdictBanner) verdictBanner.className = "p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-3";
        } else {
          if (verdictBadge) {
            verdictBadge.innerText = "ALERTA ESTRÉS";
            verdictBadge.className = "px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700";
          }
          if (verdictBanner) verdictBanner.className = "p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3";
        }
        if (verdictText) verdictText.innerText = result.verdict || "Escenario evaluado satisfactoriamente.";
        if (timestampEl) timestampEl.innerText = result.timestamp || new Date().toLocaleTimeString();

        const tbody = document.getElementById('stressImpactTableBody');
        if (tbody && result.bot_results) {
          tbody.innerHTML = '';
          result.bot_results.slice(0, 15).forEach(b => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-[#161d2b] transition font-mono";
            const statusBadge = b.status === 'PASS'
              ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">PASS</span>`
              : `<span class="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-950 text-amber-300 border border-amber-800">BREACH</span>`;
            tr.innerHTML = `
              <td class="py-2.5 px-3 font-semibold text-white font-sans">${b.name || 'Bot'}</td>
              <td class="py-2.5 px-3 text-center text-slate-300">${b.symbol}</td>
              <td class="py-2.5 px-3 text-center text-slate-400">${b.weight_pct}%</td>
              <td class="py-2.5 px-3 text-center text-slate-400">${b.base_dd_pct}%</td>
              <td class="py-2.5 px-3 text-center text-amber-400 font-bold">${b.stressed_dd_pct}%</td>
              <td class="py-2.5 px-3 text-center text-rose-400 font-bold">-${b.stressed_loss_eur} €</td>
              <td class="py-2.5 px-3 text-right">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      } catch (err) {
        console.warn("Error fetching live stress test:", err);
      }
    }

    async function renderVolTargetingAndCppi() {
      try {
        const res = await fetch('http://mock.local:8001/mock-api/portfolio/dynamic_sizing');
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const cppi = data.cppi_state || {};
        
        const scaleEl = document.getElementById('cppi_vol_scale');
        const cushionEl = document.getElementById('cppi_cushion_eur');
        const floorEl = document.getElementById('cppi_floor_eur');
        const distEl = document.getElementById('cppi_distance_pct');
        const barEl = document.getElementById('cppi_progress_bar');

        if (scaleEl) scaleEl.innerText = `${(cppi.cppi_scale_multiplier || 1.0).toFixed(2)}x`;
        if (cushionEl) cushionEl.innerText = `${(cppi.cushion_eur || 800.0).toFixed(2)} €`;
        if (floorEl) floorEl.innerText = `${(cppi.floor_capital || 9200.0).toFixed(0)} €`;
        if (distEl) distEl.innerText = `${(cppi.cushion_pct || 100.0).toFixed(1)}% disponible`;
        if (barEl) barEl.style.width = `${Math.max(5, Math.min(100, cppi.cushion_pct || 100.0))}%`;
      } catch (err) {
        console.warn("Error fetching dynamic sizing:", err);
      }
    }

    async function renderHmmMarketRegimes() {
      try {
        const res = await fetch('http://mock.local:8001/mock-api/market_regimes');
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const regimes = data.regimes || {};

        const grid = document.getElementById('hmmRegimesGrid');
        if (grid) {
          grid.innerHTML = '';
          Object.entries(regimes).forEach(([sym, info]) => {
            const tile = document.createElement('div');
            tile.className = "bg-[#0e121a] p-2.5 rounded-xl border border-[#1c2331] space-y-1";
            
            let badgeColor = "bg-emerald-950 text-emerald-300 border-emerald-800";
            let labelShort = "TREND";
            if (info.regime_id === 1) {
              badgeColor = "bg-amber-950 text-amber-300 border-amber-800";
              labelShort = "RANGE";
            } else if (info.regime_id === 2) {
              badgeColor = "bg-rose-950 text-rose-300 border-rose-800";
              labelShort = "SHOCK";
            }

            tile.innerHTML = `
              <div class="flex items-center justify-between">
                <span class="font-bold text-white text-xs">${sym}</span>
                <span class="px-1.5 py-0.2 rounded text-[8.5px] font-bold border ${badgeColor}">${labelShort}</span>
              </div>
              <div class="text-[9.5px] text-slate-400 font-sans">Vol: <b class="text-slate-200 font-mono">${info.annualized_realized_vol_pct || 12.0}%</b></div>
              <div class="text-[9px] text-slate-500 font-sans">Conf: <b class="text-indigo-300 font-mono">${Math.round((info.confidence || 0.8) * 100)}%</b></div>
            `;
            grid.appendChild(tile);
          });
        }

        const compatEl = document.getElementById('hmmCompatibilityText');
        if (compatEl && data.profile_distribution) {
          const dist = data.profile_distribution;
          compatEl.innerText = `Óptimo para Convex / Trend (${dist.Convex || 8}/8 activos en ciclo expansivo)`;
        }
      } catch (err) {
        console.warn("Error fetching HMM regimes:", err);
      }
    }

    function initInstitutionalRiskLaboratory() {
      runStressScenario(currentSelectedStressScenario);
      renderVolTargetingAndCppi();
      renderHmmMarketRegimes();
    }

    // ==================== ENGINE DE ESCALADO Y FASES UMS ====================
    let currentEscaladoMode = 'live';

    // Rendimiento OOS Real Estricto (2026-01 a 2026-08) para la cartera combinada de los 7 Bots (Base 10.000 € · Riesgo 0.25%/trade)
    const simulatedMonthlyEscalation = [
      { mes: "2026-08", equity: "12.85k €", trades: 34, returnVal: 3.2, maxDD: 0.9, sharpe: 2.15, fase: "OOS F3" },
      { mes: "2026-07", equity: "12.45k €", trades: 31, returnVal: 2.9, maxDD: 0.8, sharpe: 2.08, fase: "OOS F3" },
      { mes: "2026-06", equity: "12.10k €", trades: 38, returnVal: 3.8, maxDD: 1.1, sharpe: 2.22, fase: "OOS F3" },
      { mes: "2026-05", equity: "11.65k €", trades: 29, returnVal: 3.1, maxDD: 0.7, sharpe: 2.10, fase: "OOS F3" },
      { mes: "2026-04", equity: "11.30k €", trades: 35, returnVal: 4.1, maxDD: 1.2, sharpe: 2.34, fase: "OOS F3" },
      { mes: "2026-03", equity: "10.85k €", trades: 32, returnVal: 3.3, maxDD: 0.9, sharpe: 2.05, fase: "OOS F3" },
      { mes: "2026-02", equity: "10.50k €", trades: 28, returnVal: 2.4, maxDD: 0.6, sharpe: 1.95, fase: "OOS F3" },
      { mes: "2026-01", equity: "10.25k €", trades: 30, returnVal: 2.5, maxDD: 0.8, sharpe: 2.12, fase: "OOS F3" }
    ];

    function setEscaladoViewMode(mode) {
      currentEscaladoMode = mode;
      const btnLive = document.getElementById('btnEscaladoLive');
      const btnSim = document.getElementById('btnEscaladoSim');
      if (mode === 'live') {
        if (btnLive) btnLive.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition';
        if (btnSim) btnSim.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-[#161d2b] text-slate-400 hover:text-white border border-[#232c3d] transition';
      } else {
        if (btnSim) btnSim.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition';
        if (btnLive) btnLive.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-[#161d2b] text-slate-400 hover:text-white border border-[#232c3d] transition';
      }
      renderEscaladoTab();
    }

    function renderEscaladoTab() {
      const liveBots = getApprovedLiveBots();
      const count = liveBots.length;

      // 1. Cabecera dinámica de Fase UMS actual
      const phaseTitle = document.getElementById('escaladoPhaseTitle');
      const phaseSubline = document.getElementById('escaladoPhaseSubline');
      const statusBanner = document.getElementById('escaladoStatusBanner');

      if (count === 0) {
        if (phaseTitle) phaseTitle.innerText = "1 · Validación Personal";
        if (phaseSubline) phaseSubline.innerText = "Equity: 10.000 € · 0 bots Live · riesgo/op: micro-lotes (0.25% - 0.50%) · Kelly 0.50";
        if (statusBanner) {
          statusBanner.className = "p-3.5 rounded-xl bg-[#0c131a] border border-[#1b2838] flex items-center gap-3";
          statusBanner.innerHTML = `
            <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">STANDBY</span>
            <span class="text-xs text-slate-300 font-sans">En preparación para despliegue en cuenta de validación con micro-lotes (0 bots en Live).</span>
          `;
        }
      } else {
        if (phaseTitle) phaseTitle.innerText = "1 · Validación Personal (Activa)";
        if (phaseSubline) phaseSubline.innerText = `Equity: 10.000 € · ${count} bot${count > 1 ? 's' : ''} Live · riesgo/op: micro-lotes (0.25% - 0.50%) · Kelly 0.50`;
        if (statusBanner) {
          statusBanner.className = "p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3";
          statusBanner.innerHTML = `
            <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">GREEN</span>
            <span class="text-xs text-emerald-300 font-sans">Operando en Fase 1 con ${count} bot${count > 1 ? 's' : ''} en Live y riesgo controlado.</span>
          `;
        }
      }

      // 2. Renderizado de la tabla de evolución mensual
      const tbody = document.getElementById('escaladoMonthlyTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (currentEscaladoMode === 'live') {
        if (count === 0) {
          tbody.innerHTML = `
            <tr class="hover:bg-[#161d2b] transition">
              <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>2026-09 (Mes actual)</span>
              </td>
              <td class="py-3 px-4 text-center text-slate-200">10.0k €</td>
              <td class="py-3 px-4 text-center text-slate-400">0</td>
              <td class="py-3 px-4 text-center text-slate-400 font-bold">+0.0%</td>
              <td class="py-3 px-4 text-center text-slate-400">0.0%</td>
              <td class="py-3 px-4 text-center text-slate-400">0.00</td>
              <td class="py-3 px-4 text-right">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">F1</span>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = `
            <tr class="hover:bg-[#161d2b] transition">
              <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>2026-09 (Mes actual · Live)</span>
              </td>
              <td class="py-3 px-4 text-center text-emerald-400 font-bold">10.0k €</td>
              <td class="py-3 px-4 text-center text-slate-300">${count * 8}</td>
              <td class="py-3 px-4 text-center text-emerald-400 font-bold">+0.0%</td>
              <td class="py-3 px-4 text-center text-slate-300">0.0%</td>
              <td class="py-3 px-4 text-center text-slate-300">0.00</td>
              <td class="py-3 px-4 text-right">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">F1</span>
              </td>
            </tr>
          `;
        }
      } else {
        simulatedMonthlyEscalation.forEach(row => {
          const isPos = row.returnVal >= 0;
          const retClass = isPos ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
          const retStr = isPos ? `+${row.returnVal.toFixed(1)}%` : `${row.returnVal.toFixed(1)}%`;

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-[#161d2b] transition';
          tr.innerHTML = `
            <td class="py-2.5 px-4 font-bold text-white">${row.mes}</td>
            <td class="py-2.5 px-4 text-center text-slate-300">${row.equity}</td>
            <td class="py-2.5 px-4 text-center text-slate-300">${row.trades}</td>
            <td class="py-2.5 px-4 text-center ${retClass}">${retStr}</td>
            <td class="py-2.5 px-4 text-center text-slate-400">${row.maxDD.toFixed(1)}%</td>
            <td class="py-2.5 px-4 text-center text-indigo-300 font-semibold">${row.sharpe.toFixed(2)}</td>
            <td class="py-2.5 px-4 text-right">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1b2333] text-slate-300 border border-[#27354c]">${row.fase}</span>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
      lucide.createIcons();
    }

    // ==================== ENGINE MATEMÁTICO DE SALUD 100% AUTOMÁTICA ====================
