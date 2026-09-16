// ==============================================================================
// MODULO: strategies_tab.js
// Creador Visual de Estrategias Cuantitativas y Catálogo de Filtros Modulares
// ==============================================================================

// Estado del Creador de Estrategias
let customStrategyState = {
  name: "CoreSys Custom Alpha V1",
  asset: "SYN-A",
  timeframe: "M5",
  archetype: "smart_money",
  magic: 118250,
  riskFraction: 0.01,
  filters: {
    f1: { enabled: true, def: "FVG_DEF_WICKS_3BAR", minPoints: 15.0 },
    f2: { enabled: true, def: "TREND_DEF_SINGLE_EMA", emaPeriod: 200 },
    f3: { enabled: true, def: "ATR_DEF_SWEEP_RATIO", minRatio: 0.3, maxRatio: 3.0 },
    f4: { enabled: true, def: "RSI_DEF_EXTREMES_OB_OS", rsiPeriod: 14, obLevel: 65.0, osLevel: 35.0 },
    f5: { enabled: true, def: "DISP_DEF_BODY_PERCENT", minBodyPct: 55.0 },
    f6: { enabled: true, def: "RR_DEF_STATIC_TARGET", minRR: 1.8 },
    f7: { enabled: true, def: "SESSION_DEF_KILLZONES", startHour: 8, endHour: 17 },
    f8: { enabled: true, def: "STRUCT_DEF_M15_RECLAIM", bufferPoints: 10.0 }
  }
};

// Catálogo de Filtros Cuantitativos Institucionales
const institutionalFilterCatalog = [
  {
    id: "f1",
    tag: "[F1]",
    title: "Fair Value Gap (FVG) / Imbalance de Liquidez",
    category: "Liquidez y Estructura",
    description: "Detecta ineficiencias de precio originadas por agresiones institucionales en el libro de órdenes. Fuerza al algoritmo a entrar únicamente cuando existe un vacío de liquidez claro que actúe como imán magnético.",
    whyInstitutional: "Los algoritmos de alta frecuencia y los creadores de mercado (MM) dejan vacíos de cotización al ejecutar órdenes a mercado. Entrar en la mitigación del FVG garantiza una probabilidad de reacción superior al 65%.",
    variants: [
      { name: "Def A: Mechas de 3 Velas (Estándar ICT)", code: "FVG_DEF_WICKS_3BAR", desc: "Mide el gap estricto entre el High de la Vela 3 y el Low de la Vela 1. Ideal para M1 y M5 en índices y divisas." },
      { name: "Def B: BISI / SIBI Ponderado por Cuerpo", code: "FVG_DEF_BODY_BISI_SIBI", desc: "Requiere que la vela intermedia tenga un cuerpo dominante >= 60% del rango. Filtra falsos imbalances en baja volatilidad." },
      { name: "Def C: FVG Confirmado por Volumen Tick", code: "FVG_DEF_VOLUME_WEIGHTED", desc: "Valida el desbalance únicamente si el Tick Volume es >= 1.3x la media de 20 periodos. Alta fiabilidad en Nasdaq y Oro." }
    ],
    recommendedParams: "Nasdaq (SYN-A M1): 12–25 pts | DAX (SYN-B M1): 8–18 pts | Oro (SYN-C M5): 1.5–3.5 $"
  },
  {
    id: "f2",
    tag: "[F2]",
    title: "Régimen y Tendencia Macro (EMA / Multi-Timeframe)",
    category: "Régimen de Mercado",
    description: "Filtra la dirección permitida de las órdenes según el flujo dominante en marcos superiores (H1 / H4). Prohíbe compras contra tendencia bajista y ventas contra tendencia alcista.",
    whyInstitutional: "Reduce drásticamente el Drawdown relativo al evitar operar contratendencia en días direccionales impulsados por flujos macroeconómicos.",
    variants: [
      { name: "Def A: EMA Macro H1 Simple (50, 100, 200)", code: "TREND_DEF_SINGLE_EMA", desc: "Longs solo con Ask > EMA; Shorts solo con Bid < EMA. El estándar más limpio y robusto." },
      { name: "Def B: Doble EMA con Filtro de Pendiente", code: "TREND_DEF_DUAL_EMA_SLOPE", desc: "Exige EMA20 > EMA50 y pendiente dEMA/dt >= 0. Filtra mercados laterales o en consolidación." },
      { name: "Def C: Estructura de Swing HH / HL", code: "TREND_DEF_PRICE_ACTION", desc: "Confirma alineación solo si el último Swing High / Low de H1 no ha sido quebrado a la baja." }
    ],
    recommendedParams: "Intradía rápido: EMA 100 H1 | Swing / Tendencia: EMA 200 H1"
  },
  {
    id: "f3",
    tag: "[F3]",
    title: "Volatilidad y Calidad de Barrido (ATR / Anti-Noticias)",
    category: "Gestión de Volatilidad",
    description: "Normaliza la distancia de barrido del máximo/mínimo respecto al Rango Verdadero Medio (ATR). Descarta movimientos insignificantes por falta de liquidez y velas anómalas por noticias de alto impacto.",
    whyInstitutional: "Protege al sistema del 'ruido blanco' durante sesiones asiáticas muertas y evita ser atrapado en 'slippage' durante aperturas de NFP o IPC.",
    variants: [
      { name: "Def A: Ratio Barrido / ATR (0.25 a 3.0)", code: "ATR_DEF_SWEEP_RATIO", desc: "Exige que el barrido tenga entre el 25% y el 300% del ATR(14) de M15. Excelente equilibrio." },
      { name: "Def B: Bollinger Bandwidth Expansion", code: "ATR_DEF_BOLLINGER_BW", desc: "Filtra si el ancho de bandas de Bollinger está en el 15% inferior (rango muerto) o 5% superior (noticia descontrolada)." },
      { name: "Def C: Percentil Histórico ATR", code: "ATR_DEF_HISTORICAL_PCT", desc: "Exige que la volatilidad instantánea esté entre el percentil 25 y 85 de la sesión." }
    ],
    recommendedParams: "Ratio Mínimo: 0.30 | Ratio Máximo (Anti-Spike): 3.20 | Periodo: 14"
  },
  {
    id: "f4",
    tag: "[F4]",
    title: "Momentum y Extremos Estadísticos (RSI / Z-Score)",
    category: "Momentum",
    description: "Mide la velocidad del precio y cuantifica si el activo se encuentra en una zona de sobre-extensión estadística propicia para el giro y la expansión.",
    whyInstitutional: "Permite incorporarse con precisión milimétrica cuando los minoristas están atrapados en el extremo del movimiento (trampa de liquidez).",
    variants: [
      { name: "Def A: Sobrecompra / Sobreventa Clásica (65/35)", code: "RSI_DEF_EXTREMES_OB_OS", desc: "Longs en RSI <= 35 o zona 40-60; Shorts en RSI >= 65 o zona 40-60. Evita comprar techos." },
      { name: "Def B: Z-Score de Desviación de Precio", code: "RSI_DEF_ZSCORE_PRICE", desc: "Calcula Z = (Precio - SMA) / DesvStd. Dispara solo si |Z| >= 1.8 (extremo estadístico 95%)." },
      { name: "Def C: Pullback en Tendencia (Zona 45-55)", code: "RSI_DEF_PULLBACK_TREND", desc: "Permite entradas únicamente tras un respiro controlado a la zona neutral del oscilador." }
    ],
    recommendedParams: "RSI Period: 14 | Nivel Sobrecompra: 65 | Nivel Sobreventa: 35"
  },
  {
    id: "f5",
    tag: "[F5]",
    title: "Desplazamiento e Impulso (% Cuerpo de Vela)",
    category: "Acción del Precio",
    description: "Exige que la vela de confirmación posterior al barrido posea un cuerpo sólido respecto a su rango total, demostrando convicción institucional e intención compradora/vendedora.",
    whyInstitutional: "Descarta velas 'Doji' o mechas de indecisión que reflejan falta de volumen institucional.",
    variants: [
      { name: "Def A: % de Cuerpo >= 55% del Rango", code: "DISP_DEF_BODY_PERCENT", desc: "Exige cuerpo >= 55% del High-Low y cierre en dirección favorable. Muy robusto." },
      { name: "Def B: Expansión de Rango vs Media de 12", code: "DISP_DEF_EXPANSION_VS_AVG", desc: "Exige que el tamaño de la vela sea >= 1.35x el promedio de las últimas 12 velas." },
      { name: "Def C: Dos Velas Consecutivas en Dirección", code: "DISP_DEF_CONSECUTIVE_BARS", desc: "Requiere 2 cierres seguidos a favor del impulso para confirmar el cambio de flujo." }
    ],
    recommendedParams: "Mínimo % de Cuerpo: 55.0% | Periodo vela: M5 o M15"
  },
  {
    id: "f6",
    tag: "[F6]",
    title: "Asimetría Matemática y Ratio Riesgo/Beneficio (R:R)",
    category: "Gestión Matemática",
    description: "Calcula el ratio entre la distancia al Take Profit y la distancia al Stop Loss antes de colocar la orden. Si el trade ofrece menos del R:R exigido, se descarta automáticamente.",
    whyInstitutional: "Garantiza esperanza matemática positiva incluso con tasas de acierto bajas ($WR \approx 40\%$).",
    variants: [
      { name: "Def A: Ratio Fijo Mínimo (>= 1.5R a 2.5R)", code: "RR_DEF_STATIC_TARGET", desc: "Rechaza cualquier orden con reward/risk inferior al umbral configurado." },
      { name: "Def B: Take Profit Dinámico por Múltiplos ATR", code: "RR_DEF_DYNAMIC_ATR", desc: "Ajusta el TP a 2.5x ATR y el SL a 1.0x ATR para mantener la asimetría en todo régimen." },
      { name: "Def C: Asimetría con Break-Even a 1.0R", code: "RR_DEF_PARTIAL_BREAKEVEN", desc: "Asegura el riesgo a precio de entrada en 1.0R y busca el objetivo en 2.5R o superior." }
    ],
    recommendedParams: "Ratio Mínimo: 1.5R a 2.5R | Con BE activo: 1.0R trigger"
  },
  {
    id: "f7",
    tag: "[F7]",
    title: "Ventanas Horarias y Sesiones de Liquidez (Timing)",
    category: "Microestructura",
    description: "Restringe la apertura de posiciones a las franjas horarias donde el volumen y la participación institucional son máximos.",
    whyInstitutional: "Evita el 'chop' de mediodía y los spreads ensanchados de madrugada.",
    variants: [
      { name: "Def A: Killzones Institucionales Londres y NY", code: "SESSION_DEF_KILLZONES", desc: "08:00–11:00 (Londres Open) y 14:00–17:30 (NY Open). Máxima probabilidad." },
      { name: "Def B: Sesión Completa Europa + USA", code: "SESSION_DEF_EURO_US", desc: "Permite operar de 08:00 a 18:00 hora peninsular española / Broker GMT+3." },
      { name: "Def C: Horario Personalizado por Activo", code: "SESSION_DEF_CUSTOM", desc: "Configura horas y minutos exactos para cada índice o divisa." }
    ],
    recommendedParams: "SYN-B: 09:00 - 17:30 | SYN-A: 15:30 - 21:00 (Madrid)"
  },
  {
    id: "f8",
    tag: "[F8]",
    title: "Estructura de Liquidez y Order Block (OB / MSS)",
    category: "Smart Money",
    description: "Define el punto de invalidación y entrada institucional basado en la estructura de bloques de órdenes o retrocesos de equilibrio.",
    whyInstitutional: "Alinea las entradas con los puntos donde los creadores de mercado acumulan volumen.",
    variants: [
      { name: "Def A: M15 Reclaim (Recuperación de Vela Contraría)", code: "STRUCT_DEF_M15_RECLAIM", desc: "Última vela contraria previa al barrido re-superada con cierre de vela." },
      { name: "Def B: Market Structure Shift (MSS Fractal)", code: "STRUCT_DEF_FRACTAL_BREAK", desc: "Rotura con cuerpo del swing fractal previo en M5 / M15." },
      { name: "Def C: Entrada al 50% de Retroceso de Equilibrio", code: "STRUCT_DEF_EQUILIBRIUM_50", desc: "Entrada límite en el nivel Fibonacci 50% del impulso tras el barrido." }
    ],
    recommendedParams: "Buffer de seguridad SL: 10 - 25 puntos"
  }
];

// Función Principal de Renderizado de la Pestaña Estrategias
function renderStrategiesTab() {
  const container = document.getElementById('tab-content-estrategias') || document.getElementById('tab-estrategias');
  if (!container) return;

  const totalEnabled = Object.values(customStrategyState.filters).filter(f => f.enabled).length;
  const estimatedWR = Math.min(78, Math.max(45, 48 + (totalEnabled * 3.5)));
  const estimatedPF = (1.30 + (totalEnabled * 0.14)).toFixed(2);
  const estimatedRobustness = Math.min(99, 65 + (totalEnabled * 4.2)).toFixed(1);

  // 1. Renderizar Encabezado y Métricas Estimadas
  const headerScoreBadge = document.getElementById('strategyFilterScoreBadge');
  if (headerScoreBadge) {
    headerScoreBadge.innerText = `${totalEnabled}/8 Filtros Activos`;
    headerScoreBadge.className = totalEnabled >= 6 ? "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm" : "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 shadow-sm";
  }

  const estWrElem = document.getElementById('builderEstWR');
  if (estWrElem) estWrElem.innerText = `${estimatedWR.toFixed(1)}%`;

  const estPfElem = document.getElementById('builderEstPF');
  if (estPfElem) estPfElem.innerText = estimatedPF;

  const estRobElem = document.getElementById('builderEstRobustness');
  if (estRobElem) estRobElem.innerText = `${estimatedRobustness}%`;

  // 2. Renderizar Lista de Filtros en el Creador
  const filterListContainer = document.getElementById('builderFilterCardsContainer');
  if (filterListContainer) {
    filterListContainer.innerHTML = '';
    institutionalFilterCatalog.forEach(cat => {
      const stateObj = customStrategyState.filters[cat.id] || { enabled: false, def: cat.variants[0].code };
      const isChecked = stateObj.enabled;

      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border transition-all ${isChecked ? 'bg-[#111622] border-[#2a374f] shadow-md' : 'bg-[#0c0f16]/60 border-[#1a212d] opacity-75'}`;
      
      let optionsHtml = '';
      cat.variants.forEach(v => {
        const isSelected = stateObj.def === v.code ? 'selected' : '';
        optionsHtml += `<option value="${v.code}" ${isSelected} class="bg-[#0f141d] text-slate-200">${v.name}</option>`;
      });

      card.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-2.5">
          <div class="flex items-center gap-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isChecked ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500 border border-slate-800'}">${cat.tag}</span>
            <span class="text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-400'}">${cat.title.split('/')[0]}</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="chk_${cat.id}" class="sr-only peer" ${isChecked ? 'checked' : ''} onchange="toggleStrategyFilter('${cat.id}', this.checked)">
            <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
        
        <div class="text-xs text-slate-400 mb-3 leading-relaxed">${cat.description}</div>
        
        <div class="bg-[#0a0d13] p-2.5 rounded-lg border border-[#1b2332]">
          <div class="text-[10.5px] font-mono text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Variante de Definición Matemática:</span>
            <span class="text-[9.5px] text-amber-400/90 font-mono font-normal">Multi-Definición</span>
          </div>
          <select class="w-full bg-[#131924] border border-[#232d3f] text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-sans" onchange="changeFilterVariant('${cat.id}', this.value)" ${isChecked ? '' : 'disabled'}>
            ${optionsHtml}
          </select>
        </div>
      `;
      filterListContainer.appendChild(card);
    });
  }

  // 3. Renderizar Catálogo Explicativo Completo a la Derecha
  const catalogListContainer = document.getElementById('educationalCatalogContainer');
  if (catalogListContainer) {
    catalogListContainer.innerHTML = '';
    institutionalFilterCatalog.forEach(cat => {
      const card = document.createElement('div');
      card.className = "bg-[#0e121a] p-5 rounded-xl border border-[#1b2332] space-y-3";
      
      let variantsListHtml = '';
      cat.variants.forEach((v, idx) => {
        variantsListHtml += `
          <div class="bg-[#090c12] p-2.5 rounded-lg border border-[#171e2b]">
            <div class="text-[11.5px] font-bold text-amber-300 font-mono mb-1">${v.name}</div>
            <div class="text-[11px] text-slate-400 leading-relaxed">${v.desc}</div>
            <div class="text-[9.5px] font-mono text-slate-500 mt-1">Constante MQL5: <span class="text-slate-300">${v.code}</span></div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-[#1b2332] pb-2.5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">${cat.tag}</span>
            <h4 class="text-sm font-bold text-white">${cat.title}</h4>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">${cat.category}</span>
        </div>
        
        <div class="text-xs text-slate-300 leading-relaxed">${cat.description}</div>
        
        <div class="bg-[#121722] p-3 rounded-lg border border-[#1f2839]">
          <div class="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Razón de Ser Institucional (Hedge Funds & Prop Desks):</span>
          </div>
          <div class="text-[11.5px] text-slate-300 leading-relaxed">${cat.whyInstitutional}</div>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Variantes de Definición Disponibles:</div>
          ${variantsListHtml}
        </div>

        <div class="text-[10.5px] font-mono text-slate-400 pt-1 border-t border-[#171e2b] flex items-center justify-between">
          <span class="text-slate-500">Parámetros recomendados:</span>
          <span class="text-slate-300 font-semibold">${cat.recommendedParams}</span>
        </div>
      `;
      catalogListContainer.appendChild(card);
    });
  }

  // 4. Actualizar Bloque de Código MQL5 Generado
  updateGeneratedMql5Code();
  lucide.createIcons();
}

// Controladores de eventos del Creador
function toggleStrategyFilter(filterId, isChecked) {
  if (customStrategyState.filters[filterId]) {
    customStrategyState.filters[filterId].enabled = isChecked;
    renderStrategiesTab();
  }
}

function changeFilterVariant(filterId, variantCode) {
  if (customStrategyState.filters[filterId]) {
    customStrategyState.filters[filterId].def = variantCode;
    renderStrategiesTab();
  }
}

function updateBuilderAsset(asset) {
  customStrategyState.asset = asset;
  updateGeneratedMql5Code();
}

function updateBuilderTimeframe(tf) {
  customStrategyState.timeframe = tf;
  updateGeneratedMql5Code();
}

function updateBuilderName(name) {
  customStrategyState.name = name;
  updateGeneratedMql5Code();
}

// Generador de Código MQL5
function generateMql5InputBlock() {
  const f = customStrategyState.filters;
  return `//+------------------------------------------------------------------+
//| PARÁMETROS GENERADOS POR CoreSys PORTFOLIO LAB - STRATEGY BUILDER |
//| Estrategia: ${customStrategyState.name}
//| Activo: ${customStrategyState.asset} | Marco: ${customStrategyState.timeframe} | Magic: ${customStrategyState.magic}
//+------------------------------------------------------------------+
#include <CoreSys_Fitness.mqh>
#include <CoreSys_Filters.mqh>

input group "=== Configuración de la Estrategia ==="
input ulong               InpMagicNumber       = ${customStrategyState.magic};       // Número Mágico
input double              InpRiskFraction      = ${customStrategyState.riskFraction};      // Fracción de Riesgo (% Balance)

input group "=== Criterio de Optimización Genética ==="
input ENUM_CUSTOM_FITNESS InpCustomFitness     = FITNESS_INSTITUTIONAL_MASTER; // Objetivo Fitness Custom Max

input group "=== Suite de Filtros Cuantitativos Modulares ==="
// [F1] Fair Value Gap / Imbalance
input bool                InpUseFVGFilter      = ${f.f1.enabled ? 'true' : 'false'};             // [F1] Activar Filtro FVG
input ENUM_FVG_DEF        InpFVGDefinition     = ${f.f1.def}; // [F1] Variante de Definición
input double              InpMinFVGPoints      = ${f.f1.minPoints.toFixed(1)};              // [F1] Tamaño Mínimo FVG (Puntos)

// [F2] Régimen y Tendencia Macro
input bool                InpUseTrendFilter    = ${f.f2.enabled ? 'true' : 'false'};             // [F2] Activar Filtro Tendencia Macro
input ENUM_TREND_DEF      InpTrendDefinition   = ${f.f2.def}; // [F2] Variante de Definición
input int                 InpTrendEMA_Period   = ${f.f2.emaPeriod};               // [F2] Periodo EMA Macro H1

// [F3] Volatilidad y Calidad de Barrido
input bool                InpUseATRFilter      = ${f.f3.enabled ? 'true' : 'false'};             // [F3] Activar Filtro ATR
input ENUM_ATR_DEF        InpATRDefinition     = ${f.f3.def}; // [F3] Variante de Definición
input double              InpMinSweepATRRatio  = ${f.f3.minRatio.toFixed(2)};              // [F3] Mínimo Ratio Sweep/ATR
input double              InpMaxSweepATRRatio  = ${f.f3.maxRatio.toFixed(2)};              // [F3] Máximo Ratio Sweep/ATR (Anti-Spike)

// [F4] Momentum y Extremos RSI
input bool                InpUseRSIFilter      = ${f.f4.enabled ? 'true' : 'false'};             // [F4] Activar Filtro RSI
input ENUM_RSI_DEF        InpRSIDefinition     = ${f.f4.def}; // [F4] Variante de Definición
input int                 InpRSI_Period        = ${f.f4.rsiPeriod};                // [F4] Periodo RSI
input double              InpRSI_OB            = ${f.f4.obLevel.toFixed(1)};              // [F4] Nivel Sobrecompra RSI
input double              InpRSI_OS            = ${f.f4.osLevel.toFixed(1)};              // [F4] Nivel Sobreventa RSI

// [F5] Desplazamiento de Vela
input bool                InpUseDisplacement   = ${f.f5.enabled ? 'true' : 'false'};             // [F5] Activar Filtro Desplazamiento
input ENUM_DISP_DEF       InpDispDefinition    = ${f.f5.def}; // [F5] Variante de Definición
input double              InpMinBodyPercent    = ${f.f5.minBodyPct.toFixed(1)};              // [F5] Mínimo % Cuerpo de Vela

// [F6] Asimetría y Ratio R:R
input bool                InpUseMinRRFilter    = ${f.f6.enabled ? 'true' : 'false'};             // [F6] Activar Ratio R:R Mínimo
input ENUM_RR_DEF         InpRRDefinition      = ${f.f6.def}; // [F6] Variante de Definición
input double              InpMinRR_Ratio       = ${f.f6.minRR.toFixed(1)};               // [F6] Mínimo Ratio R:R exigido

// [F7] Ventana Horaria
input bool                InpUseSessionFilter  = ${f.f7.enabled ? 'true' : 'false'};             // [F7] Activar Filtro de Horario
input ENUM_SESSION_DEF    InpSessionDefinition = ${f.f7.def}; // [F7] Variante de Horario

// [F8] Estructura de Liquidez
input bool                InpUseStructure      = ${f.f8.enabled ? 'true' : 'false'};             // [F8] Activar Estructura / OB
input ENUM_STRUCTURE_DEF  InpStructDefinition  = ${f.f8.def}; // [F8] Variante de Estructura
`;
}

function updateGeneratedMql5Code() {
  const codeBox = document.getElementById('generatedMql5CodeSnippet');
  if (codeBox) {
    codeBox.innerText = generateMql5InputBlock();
  }
}

// Copiar al Portapapeles
function copyMql5CodeToClipboard() {
  const codeText = generateMql5InputBlock();
  navigator.clipboard.writeText(codeText).then(() => {
    const btn = document.getElementById('btnCopyMql5Code');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span class="text-emerald-300 font-bold">¡Copiado con Éxito!</span>`;
      lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = originalText;
        lucide.createIcons();
      }, 2500);
    }
  }).catch(err => {
    alert("Error al copiar al portapapeles: " + err);
  });
}

// Descargar archivo de parámetros .set para MetaTrader 5
function downloadMql5SetFile() {
  const f = customStrategyState.filters;
  let setContent = `; CoreSys Quantitative Portfolio Lab - .SET Parameter File
; Strategy: ${customStrategyState.name}
; Asset: ${customStrategyState.asset} | TF: ${customStrategyState.timeframe}
InpMagicNumber=${customStrategyState.magic}
InpRiskFraction=${customStrategyState.riskFraction}
InpCustomFitness=0
InpUseFVGFilter=${f.f1.enabled ? 1 : 0}
InpFVGDefinition=${f.f1.def}
InpMinFVGPoints=${f.f1.minPoints}
InpUseTrendFilter=${f.f2.enabled ? 1 : 0}
InpTrendDefinition=${f.f2.def}
InpTrendEMA_Period=${f.f2.emaPeriod}
InpUseATRFilter=${f.f3.enabled ? 1 : 0}
InpATRDefinition=${f.f3.def}
InpMinSweepATRRatio=${f.f3.minRatio}
InpMaxSweepATRRatio=${f.f3.maxRatio}
InpUseRSIFilter=${f.f4.enabled ? 1 : 0}
InpRSIDefinition=${f.f4.def}
InpRSI_Period=${f.f4.rsiPeriod}
InpRSI_OB=${f.f4.obLevel}
InpRSI_OS=${f.f4.osLevel}
InpUseDisplacement=${f.f5.enabled ? 1 : 0}
InpDispDefinition=${f.f5.def}
InpMinBodyPercent=${f.f5.minBodyPct}
InpUseMinRRFilter=${f.f6.enabled ? 1 : 0}
InpRRDefinition=${f.f6.def}
InpMinRR_Ratio=${f.f6.minRR}
InpUseSessionFilter=${f.f7.enabled ? 1 : 0}
InpSessionDefinition=${f.f7.def}
InpUseStructure=${f.f8.enabled ? 1 : 0}
InpStructDefinition=${f.f8.def}
`;

  const blob = new Blob([setContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${customStrategyState.name.replace(/\s+/g, '_')}_${customStrategyState.asset}.set`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
