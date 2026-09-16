'use strict';

const state = {
  language: 'es',
  source: null,
  view: null,
  charts: {},
  cycle: 0,
};

const translations = {
  es: {
    skip: 'Saltar al contenido',
    subtitle: 'Sistema de ingenieria de portfolios cuantitativos',
    syntheticStatus: 'DATOS SINTETICOS VERIFICADOS',
    disclaimer: 'Entorno demostrativo aislado. Todos los nombres, mercados, eventos y resultados son ficticios y se generan de forma determinista.',
    navOverview: 'Resumen',
    navPipeline: 'Pipeline',
    navPortfolio: 'Portfolio',
    navAudit: 'Auditoria',
    navArchitecture: 'Arquitectura',
    overviewEyebrow: 'Control plane / demo segura',
    overviewTitle: 'Una vista operativa, sin exponer el motor privado',
    overviewCopy: 'La demo reproduce la experiencia de supervision, validacion y trazabilidad con un dataset completamente inventado.',
    scenarioBaseline: 'Escenario base',
    scenarioStress: 'Estres sintetico',
    scenarioRecovery: 'Recuperacion sintetica',
    runCycle: 'Ejecutar ciclo demo',
    equity: 'Capital sintetico',
    notAccount: 'No es una cuenta real',
    monthlyChange: 'Variacion del mes',
    diversification: 'Diversificacion',
    demoComposite: 'Indice compuesto demo',
    systemState: 'Estado del sistema',
    isolatedDemo: 'DEMO AISLADA',
    equityCurve: 'Curva sintetica del portfolio',
    illustrativeSeries: 'Serie ilustrativa; no procede de trading ni backtests reales.',
    decisionLog: 'Registro de decisiones',
    fictionalEvents: 'Eventos ficticios y trazables',
    strategyMonitor: 'Monitor de modelos sinteticos',
    inventedNames: 'Identidades, mercados y metricas creados exclusivamente para esta demo.',
    model: 'Modelo',
    syntheticMarket: 'Mercado sintetico',
    stage: 'Fase',
    score: 'Score demo',
    stability: 'Estabilidad',
    allocation: 'Asignacion',
    state: 'Estado',
    pipelineEyebrow: 'Flujo demostrativo',
    pipelineTitle: 'De la exploracion a la monitorizacion',
    pipelineCopy: 'Las transiciones son visuales y locales. Esta web no conecta con MetaTrader, brokers, cuentas ni servicios privados.',
    portfolioEyebrow: 'Diversificacion ilustrativa',
    portfolioTitle: 'Composicion y dependencias sinteticas',
    allocationChart: 'Asignacion de demostracion',
    allocationCopy: 'Pesos inventados para mostrar la interfaz.',
    correlationMatrix: 'Matriz sintetica de correlacion',
    correlationCopy: 'Valores ficticios sin relacion con modelos privados.',
    auditEyebrow: 'Seguridad de publicacion',
    auditTitle: 'Controles de la edicion publica',
    syntheticOnly: 'Solo datos sinteticos',
    syntheticOnlyCopy: 'El repositorio publico no contiene exports, presets, historiales ni estados operativos.',
    isolatedRuntime: 'Runtime aislado',
    isolatedRuntimeCopy: 'La demo es estatica y no llama al bridge local, MT5 ni APIs privadas.',
    automatedChecks: 'Comprobaciones automaticas',
    automatedChecksCopy: 'CI valida el esquema, los marcadores de demo y patrones sensibles antes del despliegue.',
    publicContract: 'Contrato publico',
    contractOne: 'Sin credenciales, correos, tokens ni identificadores personales.',
    contractTwo: 'Sin nombres, parametros, presets ni codigo de estrategias reales.',
    contractThree: 'Sin resultados de trading, backtests o evidencia MT5 reales.',
    contractFour: 'Sin conexion de escritura ni capacidad para ejecutar operaciones.',
    architectureEyebrow: 'Vista de portfolio tecnico',
    architectureTitle: 'Arquitectura publica desacoplada',
    architectureCopy: 'La edicion publica conserva la experiencia de producto y sustituye todas las integraciones privadas por un adaptador de datos sinteticos.',
    archUi: 'Dashboard reutilizado',
    archUiCopy: 'HTML, componentes visuales y navegacion adaptados del panel local.',
    archAdapter: 'Capa de demostracion',
    archAdapterCopy: 'JavaScript determinista transforma escenarios publicos sin red.',
    archData: 'Dataset ficticio',
    archDataCopy: 'Un unico JSON auditable con identidades DEMO y mercados SYN.',
    archDeliveryCopy: 'Despliegue estatico reproducible, sin servidor ni secretos.',
    architectureBoundary: 'El motor cuantitativo, los conectores de ejecucion, los datasets operativos y las reglas de promocion permanecen exclusivamente en el entorno local privado.',
    footerSynthetic: 'Edicion de portfolio con datos sinteticos',
    footerDisclaimer: 'Demostracion educativa de software. No constituye asesoramiento financiero.',
    dayPrefix: 'Dia',
    strategies: 'modelos sinteticos',
    observations: 'observaciones demo',
    cycleLabel: 'Ciclo',
    cycleReady: 'Listo para simulacion local',
    cycleComplete: 'Ciclo sintetico completado',
    cycleCompleteDetail: 'Las vistas se actualizaron localmente; no se realizo ninguna llamada de ejecucion.',
    loadingError: 'No se pudo cargar el dataset publico. Sirve la carpeta mediante HTTP para ejecutar la demo.',
    healthy: 'Saludable',
    review: 'Revision',
    paused: 'Pausado',
    RESEARCH: 'Exploracion',
    VALIDATION: 'Validacion',
    PAPER: 'Simulacion',
    MONITORING: 'Monitorizacion',
    baseline: 'Base',
    stress: 'Estres',
    recovery: 'Recuperacion',
  },
  en: {
    skip: 'Skip to content',
    subtitle: 'Quantitative portfolio engineering system',
    syntheticStatus: 'VERIFIED SYNTHETIC DATA',
    disclaimer: 'Isolated demonstration environment. Every name, market, event, and result is fictional and deterministically generated.',
    navOverview: 'Overview',
    navPipeline: 'Pipeline',
    navPortfolio: 'Portfolio',
    navAudit: 'Audit',
    navArchitecture: 'Architecture',
    overviewEyebrow: 'Control plane / safe demo',
    overviewTitle: 'An operational view without exposing the private engine',
    overviewCopy: 'The demo reproduces the supervision, validation, and traceability experience with a completely invented dataset.',
    scenarioBaseline: 'Baseline scenario',
    scenarioStress: 'Synthetic stress',
    scenarioRecovery: 'Synthetic recovery',
    runCycle: 'Run demo cycle',
    equity: 'Synthetic capital',
    notAccount: 'Not a real account',
    monthlyChange: 'Monthly change',
    diversification: 'Diversification',
    demoComposite: 'Demo composite index',
    systemState: 'System state',
    isolatedDemo: 'ISOLATED DEMO',
    equityCurve: 'Synthetic portfolio curve',
    illustrativeSeries: 'Illustrative series; it does not come from real trading or backtests.',
    decisionLog: 'Decision log',
    fictionalEvents: 'Fictional, traceable events',
    strategyMonitor: 'Synthetic model monitor',
    inventedNames: 'Identities, markets, and metrics created exclusively for this demo.',
    model: 'Model',
    syntheticMarket: 'Synthetic market',
    stage: 'Stage',
    score: 'Demo score',
    stability: 'Stability',
    allocation: 'Allocation',
    state: 'State',
    pipelineEyebrow: 'Demonstration flow',
    pipelineTitle: 'From exploration to monitoring',
    pipelineCopy: 'Transitions are visual and local. This site does not connect to MetaTrader, brokers, accounts, or private services.',
    portfolioEyebrow: 'Illustrative diversification',
    portfolioTitle: 'Synthetic composition and dependencies',
    allocationChart: 'Demonstration allocation',
    allocationCopy: 'Invented weights used to showcase the interface.',
    correlationMatrix: 'Synthetic correlation matrix',
    correlationCopy: 'Fictional values unrelated to private models.',
    auditEyebrow: 'Publication security',
    auditTitle: 'Public edition controls',
    syntheticOnly: 'Synthetic data only',
    syntheticOnlyCopy: 'The public repository contains no exports, presets, histories, or operational states.',
    isolatedRuntime: 'Isolated runtime',
    isolatedRuntimeCopy: 'The demo is static and does not call the local bridge, MT5, or private APIs.',
    automatedChecks: 'Automated checks',
    automatedChecksCopy: 'CI validates the schema, demo markers, and sensitive patterns before deployment.',
    publicContract: 'Public contract',
    contractOne: 'No credentials, email addresses, tokens, or personal identifiers.',
    contractTwo: 'No real strategy names, parameters, presets, or strategy code.',
    contractThree: 'No real trading results, backtests, or MT5 evidence.',
    contractFour: 'No write connection or ability to execute trades.',
    architectureEyebrow: 'Technical portfolio view',
    architectureTitle: 'Decoupled public architecture',
    architectureCopy: 'The public edition keeps the product experience while replacing every private integration with a synthetic data adapter.',
    archUi: 'Reused dashboard',
    archUiCopy: 'HTML, visual components, and navigation adapted from the local dashboard.',
    archAdapter: 'Demonstration layer',
    archAdapterCopy: 'Deterministic JavaScript transforms public scenarios without network access.',
    archData: 'Fictional dataset',
    archDataCopy: 'A single auditable JSON file with DEMO identities and SYN markets.',
    archDeliveryCopy: 'Reproducible static deployment without a server or secrets.',
    architectureBoundary: 'The quantitative engine, execution connectors, operational datasets, and promotion rules remain exclusively in the private local environment.',
    footerSynthetic: 'Portfolio edition with synthetic data',
    footerDisclaimer: 'Educational software demonstration. Not investment advice.',
    dayPrefix: 'Day',
    strategies: 'synthetic models',
    observations: 'demo observations',
    cycleLabel: 'Cycle',
    cycleReady: 'Ready for local simulation',
    cycleComplete: 'Synthetic cycle completed',
    cycleCompleteDetail: 'Views were updated locally; no execution call was made.',
    loadingError: 'The public dataset could not be loaded. Serve the folder over HTTP to run the demo.',
    healthy: 'Healthy',
    review: 'Review',
    paused: 'Paused',
    RESEARCH: 'Exploration',
    VALIDATION: 'Validation',
    PAPER: 'Simulation',
    MONITORING: 'Monitoring',
    baseline: 'Baseline',
    stress: 'Stress',
    recovery: 'Recovery',
  },
};

const scenarioProfiles = {
  baseline: { equityFactor: 1, monthDelta: 0, drawdownDelta: 0, scoreDelta: 0 },
  stress: { equityFactor: 0.982, monthDelta: -2.45, drawdownDelta: 2.75, scoreDelta: -7 },
  recovery: { equityFactor: 1.011, monthDelta: 1.16, drawdownDelta: -0.54, scoreDelta: 3 },
};

function t(key) {
  return translations[state.language][key] ?? key;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCurrency(value) {
  return new Intl.NumberFormat(state.language === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency',
    currency: state.view.portfolio.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSigned(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function scenarioData(name) {
  const profile = scenarioProfiles[name] ?? scenarioProfiles.baseline;
  const next = clone(state.source);
  const base = state.source.portfolio.base_equity;
  next.portfolio.base_equity = Math.round(base * profile.equityFactor);
  next.portfolio.month_change_pct = Number((state.source.portfolio.month_change_pct + profile.monthDelta).toFixed(2));
  next.portfolio.day_change_pct = Number((state.source.portfolio.day_change_pct + profile.monthDelta * 0.16).toFixed(2));
  next.portfolio.drawdown_pct = Math.max(0.25, Number((state.source.portfolio.drawdown_pct + profile.drawdownDelta).toFixed(2)));
  next.portfolio.diversification_score = Math.max(0, Math.min(100, state.source.portfolio.diversification_score + profile.scoreDelta));
  next.equity_curve = state.source.equity_curve.map((point, index) => {
    const progression = index / Math.max(1, state.source.equity_curve.length - 1);
    const adjustment = (profile.equityFactor - 1) * base * progression;
    const wave = name === 'stress' ? Math.sin(index * 1.8) * 260 : Math.sin(index * 1.25) * 90;
    return Math.round(point + adjustment + wave);
  });
  next.strategies = next.strategies.map((strategy, index) => ({
    ...strategy,
    score: Math.max(0, Math.min(100, strategy.score + profile.scoreDelta - (name === 'stress' ? index % 3 : 0))),
    monthly_return_pct: Number((strategy.monthly_return_pct + profile.monthDelta * (0.16 + index * 0.015)).toFixed(2)),
    drawdown_pct: Math.max(0.2, Number((strategy.drawdown_pct + profile.drawdownDelta * (0.18 + index * 0.02)).toFixed(2))),
  }));
  return next;
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.getElementById('languageToggle').textContent = state.language === 'es' ? 'EN' : 'ES';
}

function statusStyle(status) {
  const styles = {
    healthy: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60',
    review: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    paused: 'bg-slate-900 text-slate-400 border-slate-700',
  };
  return styles[status] ?? styles.paused;
}

function stageStyle(stage) {
  const styles = {
    RESEARCH: 'bg-slate-900 text-slate-300 border-slate-700',
    VALIDATION: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
    PAPER: 'bg-violet-950/50 text-violet-300 border-violet-800/60',
    MONITORING: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
  };
  return styles[stage] ?? styles.RESEARCH;
}

function renderKpis() {
  const { portfolio } = state.view;
  document.getElementById('equityKpi').textContent = formatCurrency(portfolio.base_equity);
  document.getElementById('monthKpi').textContent = formatSigned(portfolio.month_change_pct);
  document.getElementById('monthKpi').className = `font-mono text-xl font-semibold mt-2 ${portfolio.month_change_pct >= 0 ? 'text-emerald-300' : 'text-rose-300'}`;
  document.getElementById('dayKpi').textContent = `${t('dayPrefix')}: ${formatSigned(portfolio.day_change_pct)}`;
  document.getElementById('drawdownKpi').textContent = `${portfolio.drawdown_pct.toFixed(2)}%`;
  document.getElementById('drawdownBar').style.width = `${Math.min(100, portfolio.drawdown_pct * 12)}%`;
  document.getElementById('diversificationKpi').textContent = `${portfolio.diversification_score}/100`;
  document.getElementById('cycleTime').textContent = state.cycle ? `${t('cycleLabel')} #${state.cycle}` : t('cycleReady');
}

function chartDefaults() {
  Chart.defaults.color = '#8290a5';
  Chart.defaults.font.family = 'IBM Plex Mono, monospace';
  Chart.defaults.font.size = 10;
}

function renderEquityChart() {
  const canvas = document.getElementById('equityChart');
  state.charts.equity?.destroy();
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(79, 140, 255, 0.32)');
  gradient.addColorStop(1, 'rgba(79, 140, 255, 0.015)');
  state.charts.equity = new Chart(context, {
    type: 'line',
    data: {
      labels: state.view.equity_curve.map((_, index) => `${t('dayPrefix')} ${index + 1}`),
      datasets: [{
        data: state.view.equity_curve,
        borderColor: '#6fa4ff',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#ffffff',
        tension: 0.34,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => formatCurrency(item.raw) } } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
        y: { grid: { color: '#1d2534' }, ticks: { callback: (value) => `${Math.round(value / 1000)}k` } },
      },
    },
  });
}

function renderAllocationChart() {
  const active = state.view.strategies.filter((strategy) => strategy.allocation_pct > 0);
  state.charts.allocation?.destroy();
  state.charts.allocation = new Chart(document.getElementById('allocationChart'), {
    type: 'doughnut',
    data: {
      labels: active.map((strategy) => strategy.name),
      datasets: [{
        data: active.map((strategy) => strategy.allocation_pct),
        backgroundColor: ['#4f8cff', '#42d6a4', '#f6b94a', '#a78bfa'],
        borderColor: '#121722',
        borderWidth: 4,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 18 } },
        tooltip: { callbacks: { label: (item) => `${item.label}: ${item.raw}%` } },
      },
    },
  });
}

function renderEvents() {
  const events = [...state.view.events];
  if (state.cycle > 0) {
    events.unshift({
      time: new Date().toLocaleTimeString(state.language === 'es' ? 'es-ES' : 'en-GB', { hour: '2-digit', minute: '2-digit' }),
      type: 'validation',
      title_es: t('cycleComplete'),
      title_en: t('cycleComplete'),
      detail_es: t('cycleCompleteDetail'),
      detail_en: t('cycleCompleteDetail'),
    });
  }
  const tone = { validation: 'bg-blue-400', risk: 'bg-emerald-400', review: 'bg-amber-400' };
  document.getElementById('eventFeed').innerHTML = events.slice(0, 4).map((event) => `
    <div class="flex gap-3 p-3 rounded-xl bg-[#0d1119] border border-[#1d2636]">
      <div class="pt-1"><span class="block w-2 h-2 rounded-full ${tone[event.type] ?? 'bg-slate-400'}"></span></div>
      <div class="min-w-0">
        <div class="flex items-center gap-2"><p class="text-xs font-bold text-slate-200">${escapeHtml(state.language === 'es' ? event.title_es : event.title_en)}</p><span class="text-[9px] font-mono text-slate-600">${escapeHtml(event.time)}</span></div>
        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${escapeHtml(state.language === 'es' ? event.detail_es : event.detail_en)}</p>
      </div>
    </div>
  `).join('');
}

function renderStrategies() {
  document.getElementById('strategyCount').textContent = `${state.view.strategies.length} ${t('strategies')}`;
  document.getElementById('strategyTableBody').innerHTML = state.view.strategies.map((strategy) => `
    <tr class="strategy-row border-transparent">
      <td class="px-5 py-4"><div class="font-semibold text-sm text-white">${escapeHtml(strategy.name)}</div><div class="text-[10px] font-mono text-slate-600 mt-1">${escapeHtml(strategy.id)}</div></td>
      <td class="px-4 py-4"><div class="font-mono text-xs text-slate-300">${escapeHtml(strategy.market)}</div><div class="text-[10px] text-slate-600 mt-1">${escapeHtml(strategy.family)}</div></td>
      <td class="px-4 py-4"><span class="inline-flex px-2 py-1 rounded-lg border text-[9px] font-bold ${stageStyle(strategy.stage)}">${escapeHtml(t(strategy.stage))}</span></td>
      <td class="px-4 py-4"><span class="font-mono text-sm text-blue-300">${strategy.score}</span><span class="text-slate-600 text-[10px]"> / 100</span></td>
      <td class="px-4 py-4"><div class="flex items-center gap-2"><div class="w-20 h-1.5 bg-[#202838] rounded-full overflow-hidden"><div class="h-full bg-emerald-400 rounded-full metric-bar" style="width:${strategy.stability}%"></div></div><span class="font-mono text-[10px] text-slate-400">${strategy.stability}%</span></div></td>
      <td class="px-4 py-4 text-right font-mono text-xs text-slate-300">${strategy.allocation_pct}%</td>
      <td class="px-5 py-4 text-right"><span class="inline-flex px-2 py-1 rounded-lg border text-[9px] font-bold ${statusStyle(strategy.status)}">${escapeHtml(t(strategy.status))}</span></td>
    </tr>
  `).join('');
}

function renderPipeline() {
  const accents = { DISCOVERY: '#718096', VALIDATION: '#f6b94a', PAPER: '#a78bfa', MONITORING: '#42d6a4' };
  document.getElementById('pipelineBoard').innerHTML = state.view.pipeline.map((stage, columnIndex) => {
    const stageStrategies = state.view.strategies.filter((strategy) => {
      if (stage.id === 'DISCOVERY') return strategy.stage === 'RESEARCH';
      return strategy.stage === stage.id;
    });
    const cards = stageStrategies.map((strategy, cardIndex) => `
      <div class="pipeline-card" style="--card-accent:${accents[stage.id]}; animation-delay:${(columnIndex * 60) + (cardIndex * 45)}ms">
        <div class="flex items-start justify-between gap-2"><div><p class="text-xs font-bold text-white">${escapeHtml(strategy.name)}</p><p class="text-[9px] font-mono text-slate-600 mt-1">${escapeHtml(strategy.id)}</p></div><span class="text-[9px] font-mono text-slate-400">${strategy.score}/100</span></div>
        <div class="flex items-center justify-between mt-3 text-[10px] text-slate-500"><span>${escapeHtml(strategy.market)}</span><span>${strategy.observations} ${t('observations')}</span></div>
      </div>
    `).join('');
    return `
      <article class="pipeline-column p-3">
        <div class="flex items-center justify-between px-1 mb-3"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background:${accents[stage.id]}"></span><h3 class="text-xs font-bold text-slate-200">${escapeHtml(state.language === 'es' ? stage.label_es : stage.label_en)}</h3></div><span class="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#171d29] border border-[#263248] text-slate-400">${stage.count}</span></div>
        <div class="space-y-2">${cards || '<div class="p-5 text-center text-[11px] text-slate-600 border border-dashed border-[#253047] rounded-xl">No demo cards</div>'}</div>
      </article>
    `;
  }).join('');
}

function correlationColor(value, diagonal) {
  if (diagonal) return 'rgba(79, 140, 255, 0.42)';
  if (value < 0) return `rgba(66, 214, 164, ${0.12 + Math.abs(value) * 0.45})`;
  return `rgba(246, 185, 74, ${0.08 + Math.abs(value) * 0.42})`;
}

function renderCorrelation() {
  const { labels, matrix } = state.view.correlation;
  const header = `<tr><th class="corr-cell text-slate-600 bg-[#0d1119]"></th>${labels.map((label) => `<th class="corr-cell text-slate-400 bg-[#0d1119]">${escapeHtml(label)}</th>`).join('')}</tr>`;
  const rows = matrix.map((row, rowIndex) => `<tr><th class="corr-cell text-slate-400 bg-[#0d1119]">${escapeHtml(labels[rowIndex])}</th>${row.map((value, columnIndex) => `<td class="corr-cell text-slate-100" style="background:${correlationColor(value, rowIndex === columnIndex)}">${value.toFixed(2)}</td>`).join('')}</tr>`).join('');
  document.getElementById('correlationMatrix').innerHTML = `<table class="border-collapse mx-auto"><tbody>${header}${rows}</tbody></table>`;
}

function renderAll() {
  applyTranslations();
  renderKpis();
  renderEquityChart();
  renderAllocationChart();
  renderEvents();
  renderStrategies();
  renderPipeline();
  renderCorrelation();
  lucide.createIcons();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('translate-x-[120%]', 'opacity-0');
  window.setTimeout(() => toast.classList.add('translate-x-[120%]', 'opacity-0'), 2800);
}

function bindEvents() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active', item === button));
      document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.toggle('active', pane.id === `tab-${button.dataset.tab}`));
      window.setTimeout(() => {
        state.charts.equity?.resize();
        state.charts.allocation?.resize();
      }, 20);
    });
  });

  document.getElementById('languageToggle').addEventListener('click', () => {
    state.language = state.language === 'es' ? 'en' : 'es';
    renderAll();
  });

  document.getElementById('runCycleButton').addEventListener('click', () => {
    state.cycle += 1;
    const scenario = document.getElementById('scenarioSelect').value;
    state.view = scenarioData(scenario);
    renderAll();
    showToast(`${t('cycleComplete')} · ${t(scenario)}`);
  });

  document.getElementById('scenarioSelect').addEventListener('change', (event) => {
    state.view = scenarioData(event.target.value);
    renderAll();
  });
}

async function initialize() {
  chartDefaults();
  bindEvents();
  try {
    const response = await fetch('data/demo_portfolio.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.source = await response.json();
    state.view = scenarioData('baseline');
    renderAll();
  } catch (error) {
    console.error('Public demo dataset load failed:', error);
    document.getElementById('main-content').innerHTML = `<div class="panel rounded-2xl p-6 text-rose-300">${escapeHtml(t('loadingError'))}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', initialize);
