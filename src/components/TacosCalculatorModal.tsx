import React, { useState } from 'react';
import { 
  formatCurrency, 
  formatPercent, 
  getTacosDiagnostic, 
  getMonthNameFr 
} from '../utils/calculations';
import { 
  Calculator, 
  X, 
  TrendingUp, 
  Megaphone, 
  DollarSign, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface TacosCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRevenue?: number;
  defaultExpectedRevenue?: number;
  defaultAds?: number;
  selectedMonth?: number;
  selectedYear?: number;
  onApplySimulatedValues?: (ads: number, revenue: number, expectedRevenue?: number) => void;
}

export const TacosCalculatorModal: React.FC<TacosCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultRevenue = 0,
  defaultExpectedRevenue,
  defaultAds = 0,
  selectedMonth,
  selectedYear,
  onApplySimulatedValues,
}) => {
  if (!isOpen) return null;

  // Simulator inputs
  const [revenueInput, setRevenueInput] = useState<string>(
    defaultRevenue > 0 ? defaultRevenue.toString() : '500'
  );
  const [expectedRevenueInput, setExpectedRevenueInput] = useState<string>(
    defaultExpectedRevenue && defaultExpectedRevenue !== defaultRevenue 
      ? defaultExpectedRevenue.toString() 
      : ''
  );
  const [adsInput, setAdsInput] = useState<string>(
    defaultAds > 0 ? defaultAds.toString() : '100'
  );
  const [adsAttributedSalesInput, setAdsAttributedSalesInput] = useState<string>('200');

  // Target TACoS for target simulator
  const [targetTacosPercent, setTargetTacosPercent] = useState<number>(20);

  // Active view tab inside modal
  const [calcTab, setCalcTab] = useState<'calculator' | 'target' | 'guide'>('calculator');

  // Parsed values
  const rev = Math.max(0, parseFloat(revenueInput.replace(',', '.')) || 0);
  const expRev = expectedRevenueInput 
    ? Math.max(0, parseFloat(expectedRevenueInput.replace(',', '.')) || rev) 
    : rev;
  const ads = Math.max(0, parseFloat(adsInput.replace(',', '.')) || 0);
  const adsDirectSales = Math.max(0, parseFloat(adsAttributedSalesInput.replace(',', '.')) || 0);

  // Calculations
  const tacosReal = rev > 0 ? (ads / rev) * 100 : 0;
  const tacosExpected = expRev > 0 ? (ads / expRev) * 100 : 0;
  const acosDirect = adsDirectSales > 0 ? (ads / adsDirectSales) * 100 : 0;

  const profitReal = rev - ads;
  const profitExpected = expRev - ads;
  const marginReal = rev > 0 ? (profitReal / rev) * 100 : 0;

  const diagnosticReal = getTacosDiagnostic(tacosReal, ads, rev);
  const diagnosticExpected = getTacosDiagnostic(tacosExpected, ads, expRev);

  // Target reverse calculations
  // Target TACoS = (Ads / CA) * 100  =>  Max Ads = (Target TACoS * CA) / 100
  const maxAdsAllowed = (targetTacosPercent / 100) * rev;
  // Target TACoS = (Ads / CA) * 100  =>  Min CA = Ads / (Target TACoS / 100)
  const minRevenueRequired = targetTacosPercent > 0 ? ads / (targetTacosPercent / 100) : 0;

  // Reset / Preload actual month values
  const handleLoadCurrentMonth = () => {
    setRevenueInput(defaultRevenue > 0 ? defaultRevenue.toString() : '0');
    setExpectedRevenueInput(
      defaultExpectedRevenue && defaultExpectedRevenue !== defaultRevenue
        ? defaultExpectedRevenue.toString()
        : ''
    );
    setAdsInput(defaultAds > 0 ? defaultAds.toString() : '0');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  Calculateur & Simulateur TACoS KDP
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Essentiel KDP
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Total Advertising Cost of Sales : l'indicateur reine de la rentabilité de vos livres
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setCalcTab('calculator')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              calcTab === 'calculator'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulateur en direct</span>
          </button>

          <button
            onClick={() => setCalcTab('target')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              calcTab === 'target'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Objectif TACoS & Budget</span>
          </button>

          <button
            onClick={() => setCalcTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              calcTab === 'guide'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ACoS vs TACoS (Repères KDP)</span>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: SIMULATEUR EN DIRECT */}
          {calcTab === 'calculator' && (
            <div className="space-y-5">
              
              {/* Load current month button if available */}
              {(defaultRevenue > 0 || defaultAds > 0) && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Données actuelles de {selectedMonth ? getMonthNameFr(selectedMonth) : ''} {selectedYear} : 
                      <strong> CA {formatCurrency(defaultRevenue)}</strong> · 
                      <strong> Pub {formatCurrency(defaultAds)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadCurrentMonth}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Pré-remplir
                  </button>
                </div>
              )}

              {/* Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Dépenses Amazon Ads */}
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
                  <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>1. Dépenses Amazon Ads (€)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-amber-600 pointer-events-none">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adsInput}
                      onChange={(e) => setAdsInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono-numbers bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-amber-700 shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[11px] text-amber-700/80">
                    Facturé par la régie Amazon Ads
                  </p>
                </div>

                {/* 2. CA Global KDP */}
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1.5">
                  <label className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. CA Total KDP Réel (€)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-blue-600 pointer-events-none">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={revenueInput}
                      onChange={(e) => setRevenueInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono-numbers bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-blue-700 shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[11px] text-blue-700/80">
                    Redevances totales KDP (organique + pubs)
                  </p>
                </div>

                {/* 3. Optionnel : CA Espéré avec Ads en attente */}
                <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1.5">
                  <label className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                      <span>3. CA Espéré Total (Optionnel)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-200 text-purple-800 font-semibold">
                      2ème Courbe
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-purple-600 pointer-events-none">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedRevenueInput}
                      onChange={(e) => setExpectedRevenueInput(e.target.value)}
                      placeholder={revenueInput || '0.00'}
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono-numbers bg-white border border-purple-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-purple-800 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-purple-700/80">
                    Inclut les redevances estimées des ventes Ads récentes
                  </p>
                </div>

                {/* 4. Optionnel : Ventes directes Ads pour comparer avec ACoS */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-slate-500" />
                    <span>4. Ventes directes Ads (Optionnel)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-slate-500 pointer-events-none">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adsAttributedSalesInput}
                      onChange={(e) => setAdsAttributedSalesInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono-numbers bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-500 text-slate-700 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Chiffre des « Ventes » affiché dans Amazon Ads
                  </p>
                </div>

              </div>

              {/* RÉSULTAT PRINCIPAL : CARTE TACOS */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                      Résultat TACoS Global
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${diagnosticReal.badgeClass}`}>
                      {diagnosticReal.shortLabel}
                    </span>
                  </div>

                  <span className="text-xs text-slate-300 font-mono">
                    Formule : ({formatCurrency(ads)} / {formatCurrency(rev)}) × 100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Valeur TACoS Réel */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-xs text-slate-400">TACoS Réel (KDP)</div>
                    <div className="text-3xl font-extrabold font-mono-numbers text-amber-400 mt-1">
                      {rev > 0 ? `${tacosReal.toFixed(1)} %` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Part pub absorbée sur le CA
                    </div>
                  </div>

                  {/* Bénéfice net restant */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-xs text-slate-400">Bénéfice Net Restant</div>
                    <div className={`text-3xl font-extrabold font-mono-numbers mt-1 ${
                      profitReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatCurrency(profitReal)}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Marge restante : {formatPercent(marginReal)}
                    </div>
                  </div>

                  {/* TACoS Espéré ou ACoS comparatif */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    {expectedRevenueInput && expRev !== rev ? (
                      <>
                        <div className="text-xs text-purple-300">TACoS Espéré (+ Ads)</div>
                        <div className="text-3xl font-extrabold font-mono-numbers text-purple-400 mt-1">
                          {expRev > 0 ? `${tacosExpected.toFixed(1)} %` : '—'}
                        </div>
                        <div className="text-[10px] text-purple-200 mt-1">
                          Bénéfice espéré : {formatCurrency(profitExpected)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-slate-400">ACoS Direct Console</div>
                        <div className="text-3xl font-extrabold font-mono-numbers text-slate-200 mt-1">
                          {adsDirectSales > 0 ? `${acosDirect.toFixed(1)} %` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Sur ventes directes pubs
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar visualizer for TACoS */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Jauge de santé TACoS :</span>
                    <span className="font-mono-numbers text-amber-400">{tacosReal.toFixed(1)}% / 100%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        tacosReal <= 15 ? 'bg-emerald-500' :
                        tacosReal <= 25 ? 'bg-blue-500' :
                        tacosReal <= 35 ? 'bg-amber-500' :
                        tacosReal <= 50 ? 'bg-orange-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, tacosReal)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0% (Pur organique)</span>
                    <span className="text-emerald-400 font-semibold">15% (Top)</span>
                    <span className="text-blue-400 font-semibold">25% (Idéal)</span>
                    <span className="text-amber-400">35% (Lancement)</span>
                    <span className="text-rose-400">50%+ (Danger)</span>
                  </div>
                </div>

                {/* Strategic Advice specific to KDP */}
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-start gap-2.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Diagnostic KDP : {diagnosticReal.label}</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed">
                      {diagnosticReal.advice}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: OBJECTIF TACOS & CALCULATEUR INVERSÉ */}
          {calcTab === 'target' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Fixez votre objectif de TACoS cible :</span>
                </div>
                <p className="text-xs text-amber-800">
                  Déterminez instantanément combien vous pouvez investir en publicité tout en protégeant votre marge bénéficiaire.
                </p>

                {/* Preset target buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 15, 20, 25, 30].map((tgt) => (
                    <button
                      key={tgt}
                      type="button"
                      onClick={() => setTargetTacosPercent(tgt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-numbers transition-all cursor-pointer ${
                        targetTacosPercent === tgt
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tgt} % {tgt === 20 ? '(Recommandé)' : ''}
                    </button>
                  ))}
                  
                  <div className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-600">
                    <span>Curseur personnalisé :</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={targetTacosPercent}
                      onChange={(e) => setTargetTacosPercent(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono font-bold"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>

              {/* 2 Target Scenarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Scénario A : Budget Pub Maximum Autorisé */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Scénario A : Budget Pub Max
                  </span>
                  <div className="text-xs text-slate-600">
                    Pour votre CA KDP actuel de <strong>{formatCurrency(rev)}</strong>, avec un objectif TACoS de <strong>{targetTacosPercent}%</strong> :
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <span className="text-xs text-amber-800 block">Dépense Pub Max recommandée :</span>
                    <span className="text-2xl font-bold font-mono-numbers text-amber-700">
                      {formatCurrency(maxAdsAllowed)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Il vous restera alors <strong>{formatCurrency(rev - maxAdsAllowed)}</strong> de bénéfice net ({100 - targetTacosPercent}% de marge).
                  </div>
                </div>

                {/* Scénario B : CA Minimum Requis */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Scénario B : CA KDP Cible
                  </span>
                  <div className="text-xs text-slate-600">
                    Si vous dépensez actuellement <strong>{formatCurrency(ads)}</strong> en Amazon Ads, pour atteindre un TACoS de <strong>{targetTacosPercent}%</strong> :
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <span className="text-xs text-blue-800 block">CA KDP global requis :</span>
                    <span className="text-2xl font-bold font-mono-numbers text-blue-700">
                      {formatCurrency(minRevenueRequired)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Écart de CA restant à générer : <strong>{formatCurrency(Math.max(0, minRevenueRequired - rev))}</strong>.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: GUIDE ACOS VS TACOS POUR KDP */}
          {calcTab === 'guide' && (
            <div className="space-y-4 text-xs">
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Pourquoi le TACoS est l'indicateur le plus important sur Amazon KDP ?</span>
                </h4>
                <p className="text-blue-800 leading-relaxed">
                  Sur Amazon Ads, l'<strong>ACoS direct</strong> est trompeur pour un auteur de livres : il ne compte QUE les ventes réalisées directement suite à un clic sur votre pub.
                </p>
                <p className="text-blue-800 leading-relaxed">
                  En réalité, la publicité sur KDP déclenche un puissant <strong>effet boule de neige (Halo Effect)</strong> :
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-900 font-medium pl-1">
                  <li>Elle améliore le classement de vente (BSR) de votre livre, augmentant sa visibilité naturelle sur Amazon.</li>
                  <li>Elle génère des ventes <strong>organiques gratuites</strong> qui ne coûtent rien en pub.</li>
                  <li>Pour les séries de romans ou de guides, un clic sur le tome 1 amène souvent le lecteur à acheter les tomes 2, 3 et 4 !</li>
                </ul>
              </div>

              {/* Tableau Comparatif */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Indicateur</th>
                      <th className="p-3">Formule</th>
                      <th className="p-3">Que mesure-t-il ?</th>
                      <th className="p-3">Objectif recommandé KDP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-800">ACoS Direct</td>
                      <td className="p-3 font-mono text-amber-700">Pub / Ventes Pub directes</td>
                      <td className="p-3 text-slate-600">Performance immédiate des annonces cliquées</td>
                      <td className="p-3 font-semibold text-slate-700">&lt; 50-60% (selon le prix du livre)</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="p-3 font-bold text-amber-900">TACoS Global</td>
                      <td className="p-3 font-mono text-amber-700 font-bold">Pub / CA Total KDP</td>
                      <td className="p-3 text-amber-900 font-medium">Santé financière globale de tout votre catalogue</td>
                      <td className="p-3 font-bold text-emerald-700">15 % à 25 % (Vitesse de croisière)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Barème de diagnostic */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Grille d'évaluation du TACoS pour auteur KDP :
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
                    <strong>&lt; 15% - Excellent :</strong> Forte traction organique, bénéfice maximal.
                  </div>
                  <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900">
                    <strong>15% à 25% - Zone Idéale :</strong> Équilibre parfait entre croissance BSR et profit.
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                    <strong>25% à 35% - Lancement :</strong> Acceptable en phase de démarrage d'un titre.
                  </div>
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-900">
                    <strong>&gt; 35% - Vigilance :</strong> La pub mange trop de redevances, ajuster le CPC.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            TACoS Réel : <strong className="text-slate-800 font-mono-numbers">{tacosReal.toFixed(1)}%</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
