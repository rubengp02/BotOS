// ==============================================================================
// MODULO: navigation.js
// ==============================================================================

function switchTab(tabId) {
      window.currentActiveTab = tabId;
      safeRun(`Tab Navigation: ${tabId}`, () => {
        document.querySelectorAll('.nav-tab').forEach(t => {
          if (t.id === 'tab-graveyard') {
            t.className = 'nav-tab text-rose-400/80 hover:text-rose-300 px-3 py-1.5 rounded-md transition';
          } else {
            t.className = 'nav-tab text-slate-400 hover:text-white px-3 py-1.5 rounded-md transition';
          }
        });

        let activeBtn = document.getElementById(`tab-${tabId}`) || document.getElementById(`tab-${tabId.toLowerCase()}`);
        if (!activeBtn && (tabId === 'auditoria' || tabId === 'auditoría')) {
          activeBtn = document.getElementById('tab-auditoria') || document.getElementById('tab-auditoría');
        }
        if (activeBtn) {
          if (tabId === 'graveyard') {
            activeBtn.className = 'nav-tab text-rose-300 bg-rose-950/50 border-b-2 border-rose-500 px-3 py-1.5 rounded-t-md font-semibold transition';
          } else {
            activeBtn.className = 'nav-tab text-white bg-indigo-600/20 border-b-2 border-indigo-500 px-3 py-1.5 rounded-t-md font-semibold transition';
          }
        }

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

        const targetPane = document.getElementById(`tab-content-${tabId}`) || 
                           document.getElementById(`tab-content-${tabId.toLowerCase()}`) || 
                           (tabId === 'auditoria' || tabId === 'auditoría' ? (document.getElementById('tab-content-auditoria') || document.getElementById('tab-content-auditoría')) : null);
        if (targetPane) targetPane.classList.remove('hidden');

        // Ejecución aislada por bloque para cada pestaña
        if (tabId === 'portfolio') {
          safeRun('Render Portfolio', renderPortfolioTab);
        } else if (tabId === 'candidatas') {
          safeRun('Render Candidatas', renderCandidates);
        } else if (tabId === 'cuentas') {
          safeRun('Render Cuentas', renderCuentasTab);
        } else if (tabId === 'bots') {
          safeRun('Render Bots Sidebar', renderBotSidebar);
          safeRun('Render Bot Detail', updateBotDetailView);
        } else if (tabId === 'estrategias') {
          safeRun('Render Estrategias', renderStrategiesTab);
        } else if (tabId === 'salud') {
          safeRun('Render Salud', renderSaludTab);
        } else if (tabId === 'riesgo') {
          safeRun('Render Riesgo', renderRiskTab);
        } else if (tabId === 'ejecucion') {
          safeRun('Render Ejecución', renderEjecucionTab);
        } else if (tabId === 'escalado') {
          safeRun('Render Escalado', renderEscaladoTab);
        } else if (tabId === 'resumen') {
          safeRun('Render Resumen Equity', renderSummaryEquityChart);
          safeRun('Render Resumen Impulsos', renderImpulsesSummaryCard);
          safeRun('Render Resumen Alertas', updateAlertsWidget);
        } else if (tabId === 'pipeline') {
          safeRun('Render Pipeline', renderPipelineTab);
        } else if (tabId === 'graveyard') {
          safeRun('Render Graveyard', renderGraveyardTab);
        } else if (tabId === 'auditoria' || tabId === 'auditoría') {
          safeRun('Render Auditoría', renderAuditoriaTab);
          safeRun('Render Impulsos Card', renderImpulsesSummaryCard);
        }
        safeRun('Lucide Icons', () => lucide.createIcons());
      });
    }

        function filterBotSidebar() {
      const q = (document.getElementById('botSearchInput')?.value || '').toLowerCase();
      const items = document.querySelectorAll('.bot-item');
      items.forEach(it => {
        const botId = it.getAttribute('data-bot-id');
        const b = candidatesData.find(c => c.id === botId);
        if (!b) return;
        const match = (b.name && b.name.toLowerCase().includes(q)) || 
                      (b.shortName && b.shortName.toLowerCase().includes(q)) || 
                      (b.market && b.market.toLowerCase().includes(q)) || 
                      (b.profile && b.profile.toLowerCase().includes(q)) || 
                      (b.magic && b.magic.toString().includes(q));
        if (match) {
          it.classList.remove('hidden');
        } else {
          it.classList.add('hidden');
        }
      });
    }

        window.addEventListener('DOMContentLoaded', () => {
      safeRun('Restore User Bot Modes', () => { if (typeof restoreUserBotModes === 'function') restoreUserBotModes(); });
      safeRun('Init Live Master UI', () => updateLiveMasterUi(isLiveModeMasterEnabled));
      safeRun('Init Candidates', renderCandidates);
      safeRun('Init Portfolio', renderPortfolioTab);
      safeRun('Init Pipeline', renderPipelineTab);
      safeRun('Init Bots Sidebar', renderBotSidebar);
      safeRun('Init Salud', renderSaludTab);
      safeRun('Init Riesgo', renderRiskTab);
      safeRun('Init Counters', updateCounters);
      safeRun('Init Switch Default Tab', () => switchTab('portfolio'));
      safeRun('Init Bridge Connection', () => {
        testBridgeConnection();
        setInterval(() => safeRun('Bridge Polling', testBridgeConnection), 2000);
      });
      safeRun('Lucide Icons Init', () => lucide.createIcons());
    });
