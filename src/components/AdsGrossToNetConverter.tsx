import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  Check, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Book, 
  Smartphone, 
  BookMarked, 
  Sliders, 
  TrendingUp 
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

export interface AdsGrossToNetConverterProps {
  currentRevenue: number;
  currentExpectedRevenue?: number;
  onApplyNetRevenue: (netAmount: number, target: 'real' | 'expected', mode: 'add' | 'replace') => void;
  defaultExpanded?: boolean;
  compact?: boolean;
}

type PresetType = 'broche' | 'ebook' | 'relie' | 'custom';

interface PresetConfig {
  id: PresetType;
  label: string;
  icon: React.ReactNode;
  defaultRate: number;
  description: string;
}

const PRESETS: PresetConfig[] = [
  {
    id: 'broche',
    label: 'Broché',
    icon: <Book className="w-3.5 h-3.5" />,
    defaultRate: 35,
    description: 'Format broché standard (~35% net après 40% Amazon et frais impression)',
  },
  {
    id: 'ebook',
    label: 'Ebook (Kindle)',
    icon: <Smartphone className="w-3.5 h-3.5" />,
    defaultRate: 70,
    description: 'Format numérique 70% (aucun frais impression)',
  },
  {
    id: 'relie',
    label: 'Relié',
    icon: <BookMarked className="w-3.5 h-3.5" />,
    defaultRate: 28,
    description: 'Format couverture rigide (~28% net, coût d’impression plus élevé)',
  },
  {
    id: 'custom',
    label: 'Personnalisé',
    icon: <Sliders className="w-3.5 h-3.5" />,
    defaultRate: 35,
    description: 'Taux libre adapté au prix de votre catalogue',
  },
];

export const AdsGrossToNetConverter: React.FC<AdsGrossToNetConverterProps> = ({
  currentRevenue,
  currentExpectedRevenue,
  onApplyNetRevenue,
  defaultExpanded = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [grossAmount, setGrossAmount] = useState<string>('18');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(() => {
    const saved = localStorage.getItem('kdp_ads_royalty_preset');
    return (saved as PresetType) || 'broche';
  });
  const [customRate, setCustomRate] = useState<string>(() => {
    return localStorage.getItem('kdp_ads_royalty_custom_rate') || '35';
  });
  const [justAppliedMessage, setJustAppliedMessage] = useState<string | null>(null);

  // Active rate percentage
  const activeRate = selectedPreset === 'custom' 
    ? (parseFloat(customRate.replace(',', '.')) || 0)
    : (PRESETS.find(p => p.id === selectedPreset)?.defaultRate || 35);

  const numGross = parseFloat(grossAmount.replace(',', '.')) || 0;
  const estimatedNet = Math.round((numGross * (activeRate / 100)) * 100) / 100;
  const estimatedAmazonCut = Math.round((numGross * 0.40) * 100) / 100;
  const estimatedPrintOrDiff = Math.max(0, Math.round((numGross - estimatedNet - estimatedAmazonCut) * 100) / 100);

  const effectiveExpectedRev = currentExpectedRevenue != null ? currentExpectedRevenue : currentRevenue;

  const handlePresetChange = (preset: PresetType) => {
    setSelectedPreset(preset);
    localStorage.setItem('kdp_ads_royalty_preset', preset);
  };

  const handleCustomRateChange = (val: string) => {
    setCustomRate(val);
    localStorage.setItem('kdp_ads_royalty_custom_rate', val);
  };

  const handleApply = (target: 'real' | 'expected', mode: 'add' | 'replace') => {
    if (estimatedNet <= 0) return;
    onApplyNetRevenue(estimatedNet, target, mode);
    
    if (target === 'expected') {
      setJustAppliedMessage(
        mode === 'add'
          ? `+${estimatedNet.toFixed(2)} € ajoutés au CA Espéré ! (Pris en compte dans le Bénéfice Espéré & 2ème courbe)`
          : `CA Espéré défini à ${estimatedNet.toFixed(2)} € !`
      );
    } else {
      setJustAppliedMessage(
        mode === 'add' 
          ? `+${estimatedNet.toFixed(2)} € ajoutés au CA Réel KDP !`
          : `CA Réel KDP défini à ${estimatedNet.toFixed(2)} € !`
      );
    }

    setTimeout(() => {
      setJustAppliedMessage(null);
    }, 3200);
  };

  return (
    <div className={`rounded-xl border transition-all ${
      isExpanded 
        ? 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border-indigo-200 shadow-xs' 
        : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
    }`}>
      {/* Header / Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Calculator className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-950">
                Convertisseur Ventes Ads → CA Espéré & 2ème Courbe
              </span>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                Ex. vente 18 €
              </span>
              <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded">
                ✨ Deux calculs possibles
              </span>
            </div>
            {!isExpanded && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Convertit le CA brut Amazon Ads en redevance nette (~{activeRate}%) et l'intègre au <strong>Bénéfice Espéré</strong> avec affichage sur <strong>2 courbes</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
          <span>{isExpanded ? 'Masquer' : 'Ouvrir'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-indigo-100/80 space-y-3.5 text-xs">
          {/* Explanation banner */}
          <div className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 text-slate-600 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong>Comment fonctionne le double calcul ?</strong>
              <div className="mt-1 space-y-0.5 text-slate-600">
                <div>• <strong>Calcul 1 (Bénéfice Réel)</strong> = CA KDP confirmé - Publicité.</div>
                <div>• <strong>Calcul 2 (Bénéfice Espéré)</strong> = (CA KDP + Redevances nettes des ventes Ads en attente) - Publicité.</div>
              </div>
              <p className="mt-1 text-slate-500 text-[10px]">
                En cliquant sur <strong>« + Ajouter au CA Espéré »</strong>, votre bénéfice espéré est recalculé immédiatement et une <strong>deuxième courbe</strong> apparaît sur le graphique pour comparer le réel et l'espéré.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Input CA Brut Ads */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. Vente brute vue sur Ads (€)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center font-bold text-indigo-600 pointer-events-none">
                  €
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="18.00"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold font-mono-numbers text-indigo-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Presets Selection */}
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Format du livre (taux de redevance nette estimée)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetChange(preset.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px]">
                        {preset.icon}
                        <span>{preset.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono-numbers ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {preset.id === 'custom' ? `${customRate}%` : `~${preset.defaultRate}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* If custom is selected, show custom rate input */}
          {selectedPreset === 'custom' && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50/60 rounded-lg border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-900">
                Votre taux personnalisé de redevance nette :
              </span>
              <div className="relative w-24">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={customRate}
                  onChange={(e) => handleCustomRateChange(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-indigo-300 rounded text-center text-xs font-bold font-mono-numbers text-indigo-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                (Mémorisé automatiquement pour vos prochaines saisies)
              </span>
            </div>
          )}

          {/* Real-time Calculation Result Box */}
          <div className="p-3 bg-white rounded-xl border border-indigo-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 pb-2">
              <div>
                <div className="text-[11px] text-slate-500">
                  Redevance nette estimée à percevoir :
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold font-mono-numbers text-emerald-600">
                    +{formatCurrency(estimatedNet)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono-numbers">
                    ({numGross.toFixed(2)} € brut × {activeRate}%)
                  </span>
                </div>
                {selectedPreset === 'broche' && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Détail : ~{estimatedAmazonCut.toFixed(2)} € commission Amazon (40%) + ~{estimatedPrintOrDiff.toFixed(2)} € impression → ~{estimatedNet.toFixed(2)} € redevance
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto text-[11px]">
                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono-numbers">
                  CA Réel : {formatCurrency(currentRevenue)}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono-numbers">
                  CA Espéré : {formatCurrency(effectiveExpectedRev)}
                </span>
              </div>
            </div>

            {/* Action buttons allowing dual-target apply */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Choisissez où appliquer cette redevance estimée :</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Bouton Recommandé : Ajouter au CA Espéré */}
                <button
                  type="button"
                  onClick={() => handleApply('expected', 'add')}
                  disabled={estimatedNet <= 0}
                  className="px-3.5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Ajoute au CA Espéré pour calculer le Bénéfice Espéré et tracer la 2ème courbe sans modifier le CA réel confirmé par KDP"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-purple-200" />
                  <span>+ Ajouter au CA Espéré (2ème courbe)</span>
                  <span className="text-[10px] bg-purple-700/80 px-1.5 py-0.2 rounded font-mono-numbers">
                    +{estimatedNet.toFixed(2)} €
                  </span>
                </button>

                {/* 2. Bouton : Ajouter au CA Réel */}
                <button
                  type="button"
                  onClick={() => handleApply('real', 'add')}
                  disabled={estimatedNet <= 0}
                  className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Ajouter directement au CA Réel KDP"
                >
                  <span>+ Ajouter au CA Réel</span>
                  <span className="text-[10px] font-mono-numbers opacity-80">
                    (+{estimatedNet.toFixed(2)} €)
                  </span>
                </button>

                {/* 3. Bouton : Remplacer le CA Réel */}
                <button
                  type="button"
                  onClick={() => handleApply('real', 'replace')}
                  disabled={estimatedNet <= 0}
                  className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                  title="Définir directement le CA Réel à cette valeur"
                >
                  <span>Définir comme CA Réel ({estimatedNet.toFixed(2)} €)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback badge */}
          {justAppliedMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{justAppliedMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
