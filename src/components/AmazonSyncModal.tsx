import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ExternalLink, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  FileSpreadsheet, 
  Clipboard, 
  X,
  AlertCircle,
  RotateCw,
  Building2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, getMonthNameFr } from '../utils/calculations';

interface AmazonSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  selectedMonth: number;
  currentRevenue: number;
  currentAds: number;
  onApplySync: (year: number, month: number, revenue: number, adsCost: number) => void;
}

const DEFAULT_ENTITY_ID = 'ENTITY10NY3ZV74DMDV';

export const AmazonSyncModal: React.FC<AmazonSyncModalProps> = ({
  isOpen,
  onClose,
  selectedYear,
  selectedMonth,
  currentRevenue,
  currentAds,
  onApplySync,
}) => {
  const [activeTab, setActiveTab] = useState<'oneclick' | 'bookmarklet' | 'paste' | 'csv' | 'direct'>('oneclick');
  const [entityId, setEntityId] = useState<string>(() => {
    return localStorage.getItem('kdp_amazon_entity_id') || DEFAULT_ENTITY_ID;
  });
  const [amazonCookie, setAmazonCookie] = useState<string>(() => {
    return localStorage.getItem('kdp_amazon_cookie') || '';
  });
  const [showCookieConfig, setShowCookieConfig] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);

  // Bookmarklet state
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Smart Paste state
  const [pasteContent, setPasteContent] = useState('');
  const [detectedAds, setDetectedAds] = useState<number | null>(null);
  const [detectedRevenue, setDetectedRevenue] = useState<number | null>(null);
  const [, setPasteStatus] = useState<string | null>(null);

  // CSV Drag and drop state
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvParsedAds, setCsvParsedAds] = useState<number | null>(null);
  const [csvParsedRevenue, setCsvParsedRevenue] = useState<number | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Save entity ID when changed
  const handleSaveEntityId = (newId: string) => {
    setEntityId(newId);
    try {
      localStorage.setItem('kdp_amazon_entity_id', newId);
    } catch {
      // ignore
    }
  };

  // Save cookie
  const handleSaveCookie = (newCookie: string) => {
    setAmazonCookie(newCookie);
    try {
      localStorage.setItem('kdp_amazon_cookie', newCookie);
    } catch {
      // ignore
    }
  };

  const amazonAdsUrl = `https://advertising.amazon.fr/campaign-manager/all-campaigns?entityId=${encodeURIComponent(
    entityId.trim() || DEFAULT_ENTITY_ID
  )}`;

  // The application URL where data will be sent back
  const appOrigin = window.location.origin + window.location.pathname;

  // The 1-Click Bookmarklet Script
  const bookmarkletCode = `javascript:(function(){try{let s=null,r=null;const t=document.body.innerText||'';const sm=t.match(/Co[uû]t\\s+total\\s*[:\\n\\r\\t]*€?\\s*([0-9\\s]+[,.][0-9]{2})/i)||t.match(/Co[uû]t\\s+total[^\\d\\n\\r]{0,40}?([0-9\\s]+[,.][0-9]{2})/i)||t.match(/Total\\s+des\\s+co[uû]ts\\s*[:\\n\\r\\t]*€?\\s*([0-9\\s]+[,.][0-9]{2})/i)||t.match(/D[ée]penses?\\s*[:\\n\\r]*([0-9\\s]+[,.][0-9]{2})/i)||t.match(/([0-9\\s]+[,.][0-9]{2})\\s*€?\\s*d[ée]pens[ée]s?/i)||t.match(/Spend\\s*[:\\n\\r]*€?\\s*([0-9\\s]+[,.][0-9]{2})/i);if(sm){s=sm[1].replace(/\\s/g,'').replace(',','.');}const rm=t.match(/Ventes\\s*[:\\n\\r]*([0-9\\s]+[,.][0-9]{2})/i)||t.match(/Redevances?\\s*[:\\n\\r]*([0-9\\s]+[,.][0-9]{2})/i)||t.match(/Sales\\s*[:\\n\\r]*€?\\s*([0-9\\s]+[,.][0-9]{2})/i);if(rm){r=rm[1].replace(/\\s/g,'').replace(',','.');}if(!s){const tds=Array.from(document.querySelectorAll('td,th,div,span'));for(let c of tds){const tx=(c.innerText||'').trim();if(/^Co[uû]t\\s+total$/i.test(tx)||/^Coût$/i.test(tx)||/^Dépenses$/i.test(tx)||/^Spend$/i.test(tx)){const nextText=c.nextElementSibling?.innerText||'';const mn=nextText.match(/([0-9\\s]+[,.][0-9]{2})/);if(mn){s=mn[1].replace(/\\s/g,'').replace(',','.');break;}const p=c.parentElement?.innerText||'';const m=p.match(/([0-9\\s]+[,.][0-9]{2})/);if(m){s=m[1].replace(/\\s/g,'').replace(',','.');break;}}}}const d=new Date();const y=d.getFullYear();const m=d.getMonth()+1;let u='${appOrigin}?sync=amazon_ads&year='+y+'&month='+m;if(s)u+='&syncAds='+encodeURIComponent(s);if(r)u+='&syncRev='+encodeURIComponent(r);window.open(u,'_blank');}catch(e){alert('Sync error: '+e.message);}})();`;

  // 1-Click Direct Fetch Handler
  const handleDirectFetch = async (forceSimulation: boolean = false) => {
    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const response = await fetch('/api/amazon/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-amazon-cookie': amazonCookie.trim(),
        },
        body: JSON.stringify({
          entityId: entityId.trim() || DEFAULT_ENTITY_ID,
          year: selectedYear,
          month: selectedMonth,
          cookie: amazonCookie.trim(),
          simulate: forceSimulation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'AUTH_REQUIRED' || data.code === 'SESSION_EXPIRED') {
          setShowCookieConfig(true);
          setFetchError(
            data.message || 'Session Amazon requise pour interroger directement le compte ENTITY10NY3ZV74DMDV.'
          );
        } else {
          setFetchError(data.message || 'Erreur lors de la récupération des données Amazon Ads.');
        }
        setIsFetching(false);
        return;
      }

      // Success! Apply data
      const finalRev = data.revenue != null ? data.revenue : currentRevenue;
      const finalAds = data.adsCost != null ? data.adsCost : currentAds;

      setFetchSuccess(
        `Synchronisation réussie ! Pub Ads : ${formatCurrency(finalAds)} | CA KDP : ${formatCurrency(finalRev)}`
      );

      setTimeout(() => {
        onApplySync(selectedYear, selectedMonth, finalRev, finalAds);
        onClose();
      }, 1200);

    } catch (err: any) {
      setFetchError(`Erreur de connexion au serveur : ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Parse text pasted by user
  useEffect(() => {
    if (!pasteContent.trim()) {
      setDetectedAds(null);
      setDetectedRevenue(null);
      setPasteStatus(null);
      return;
    }

    const text = pasteContent;
    let foundAds: number | null = null;
    let foundRev: number | null = null;

    // Search for Ads Spend — Priorité absolue au chiffre après "Coût total"
    const adsRegexes = [
      /Co[uû]t\s+total\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Co[uû]t\s+total[^\d\n\r]{0,40}?([0-9\s]+[,.][0-9]{2})/i,
      /Total\s+des\s+co[uû]ts\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Total\s+cost\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
      /Co[uû]t\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /D[ée]penses?\s*(?:totales?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Spend\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /([0-9\s]+[,.][0-9]{2})\s*€\s*d[ée]pens[ée]s?/i,
      /Total\s+D[ée]penses\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
    ];

    for (const rx of adsRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          foundAds = val;
          break;
        }
      }
    }

    // Search for KDP Revenue / Redevances / Ventes
    const revRegexes = [
      /Redevances?\s*(?:estim[ée]es?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Chiffre\s+d'affaires\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Ventes\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /Royalties\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /CA\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
      /([0-9\s]+[,.][0-9]{2})\s*€\s*redevances?/i,
    ];

    for (const rx of revRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          foundRev = val;
          break;
        }
      }
    }

    // Fallback: If pasting two numbers
    if (foundAds === null && foundRev === null) {
      const euroMatches = text.match(/([0-9]+[.,][0-9]{2})\s*€?/g);
      if (euroMatches && euroMatches.length >= 2) {
        const num1 = parseFloat(euroMatches[0].replace('€', '').replace(',', '.').trim());
        const num2 = parseFloat(euroMatches[1].replace('€', '').replace(',', '.').trim());
        if (!isNaN(num1) && !isNaN(num2)) {
          if (num1 >= num2) {
            foundRev = num1;
            foundAds = num2;
          } else {
            foundAds = num1;
            foundRev = num2;
          }
        }
      } else if (euroMatches && euroMatches.length === 1) {
        const num = parseFloat(euroMatches[0].replace('€', '').replace(',', '.').trim());
        if (!isNaN(num)) {
          if (/dépense|spend|pub|ads/i.test(text)) {
            foundAds = num;
          } else {
            foundRev = num;
          }
        }
      }
    }

    setDetectedAds(foundAds);
    setDetectedRevenue(foundRev);

    if (foundAds !== null || foundRev !== null) {
      setPasteStatus(
        `Extraction réussie : ${foundAds !== null ? `Pub Ads: ${foundAds.toFixed(2)} €` : ''} ${
          foundRev !== null ? `CA KDP: ${foundRev.toFixed(2)} €` : ''
        }`
      );
    } else {
      setPasteStatus("Aucun montant clair détecté dans le texte collé.");
    }
  }, [pasteContent]);

  // Read from clipboard automatically if supported
  const handleReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPasteContent(text);
        }
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  // CSV File Handler
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('Le fichier semble vide ou ne contient pas d’en-tête.');
          return;
        }

        const header = lines[0];
        let delimiter = ',';
        if (header.includes(';')) delimiter = ';';
        else if (header.includes('\t')) delimiter = '\t';

        const headers = header.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

        const spendIdx = headers.findIndex(
          (h) => h.includes('coût total') || h.includes('cout total') || h.includes('total cost') || h.includes('spend') || h.includes('dépense') || h.includes('cout') || h.includes('coût')
        );
        const salesIdx = headers.findIndex(
          (h) => h.includes('sales') || h.includes('vente') || h.includes('redevance') || h.includes('revenue')
        );

        if (spendIdx === -1 && salesIdx === -1) {
          setCsvError(
            `Colonnes "Dépenses" ou "Ventes" non reconnues. En-têtes trouvées: ${headers.slice(0, 5).join(', ')}...`
          );
          return;
        }

        let totalSpend = 0;
        let totalSales = 0;

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
          if (row.length <= 1) continue;

          if (spendIdx !== -1 && row[spendIdx]) {
            const raw = row[spendIdx].replace(/[^0-9,.-]/g, '').replace(',', '.');
            const val = parseFloat(raw);
            if (!isNaN(val)) totalSpend += val;
          }

          if (salesIdx !== -1 && row[salesIdx]) {
            const raw = row[salesIdx].replace(/[^0-9,.-]/g, '').replace(',', '.');
            const val = parseFloat(raw);
            if (!isNaN(val)) totalSales += val;
          }
        }

        setCsvParsedAds(spendIdx !== -1 ? Math.round(totalSpend * 100) / 100 : null);
        setCsvParsedRevenue(salesIdx !== -1 ? Math.round(totalSales * 100) / 100 : null);
      } catch (err: any) {
        setCsvError(`Erreur de lecture du fichier : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPaste = () => {
    const finalRev = detectedRevenue !== null ? detectedRevenue : currentRevenue;
    const finalAds = detectedAds !== null ? detectedAds : currentAds;
    onApplySync(selectedYear, selectedMonth, finalRev, finalAds);
    onClose();
  };

  const handleApplyCsv = () => {
    const finalRev = csvParsedRevenue !== null ? csvParsedRevenue : currentRevenue;
    const finalAds = csvParsedAds !== null ? csvParsedAds : currentAds;
    onApplySync(selectedYear, selectedMonth, finalRev, finalAds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-xs">
              <Zap className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Récupération Directe Amazon Ads</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                  1 Clic dans la page
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Allez chercher automatiquement vos dépenses Ads et redevances KDP pour {getMonthNameFr(selectedMonth)} {selectedYear}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity ID Bar */}
        <div className="bg-amber-50/80 px-5 py-3 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-950">Compte Amazon Ads :</span>
            <input
              type="text"
              value={entityId}
              onChange={(e) => handleSaveEntityId(e.target.value)}
              placeholder="ENTITY..."
              className="px-2 py-1 bg-white border border-amber-300 rounded font-mono text-[11px] font-bold text-amber-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              title="Identifiant de votre profil publicitaire Amazon Ads"
            />
          </div>

          <a
            href={amazonAdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
          >
            <span>Ouvrir mon Campaign Manager</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('oneclick')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'oneclick'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ 1. Récupération Directe (1 Clic)</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarklet')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'bookmarklet'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>2. Raccourci Favoris</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5 text-blue-600" />
            <span>3. Copier-Coller</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Rapport CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'direct'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Aide</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5">
          
          {/* TAB 1: 1-CLIC DIRECT (NEW & PRIMARY) */}
          {activeTab === 'oneclick' && (
            <div className="space-y-4">
              
              {/* Highlight Banner */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-300 rounded-xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      ⚡
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Récupération automatique d'un seul clic
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    {entityId}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  L'application interroge directement votre console Amazon Advertising France pour le mois de{' '}
                  <strong className="text-slate-900">{getMonthNameFr(selectedMonth)} {selectedYear}</strong> et extrait les dépenses de campagne ainsi que vos redevances.
                </p>

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleDirectFetch(false)}
                    disabled={isFetching}
                    className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isFetching ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-white" />
                        <span>Récupération depuis Amazon en cours...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-100 fill-amber-100" />
                        <span>⚡ Récupérer maintenant (1 Clic)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDirectFetch(true)}
                    disabled={isFetching}
                    className="w-full sm:w-auto px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Simule la synchronisation 1-clic avec les données du compte ENTITY10NY3ZV74DMDV"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tester la récupération (Compte {entityId.slice(0, 8)}...)</span>
                  </button>
                </div>
              </div>

              {/* Explication bienveillante et claire pour l'utilisateur déjà connecté */}
              <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    💡
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs">
                      Vous êtes déjà connecté à Amazon dans votre navigateur ? C'est tout à fait normal !
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Votre session Amazon est bien active dans votre navigateur. Cependant, les navigateurs web (Google Chrome, Safari, Firefox) appliquent une règle de sécurité mondiale stricte : <strong>un site externe n'a pas le droit d'aller lire en douce les cookies privés de vos autres onglets</strong> (pour vous protéger contre le piratage).
                    </p>
                  </div>
                </div>

                {/* 2 solutions directes en 1 clic tirant parti du fait que vous êtes DÉJÀ connecté */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  
                  {/* Solution A : Le Marque-Page 1-Clic */}
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs space-y-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">1</span>
                      Le Favori 1-Clic (Recommandé)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Puisque vous êtes déjà connecté sur Amazon Ads, glissez ce bouton dans vos favoris :
                    </p>
                    <a
                      href={bookmarkletCode}
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(bookmarkletCode);
                        setCopiedBookmarklet(true);
                        setTimeout(() => setCopiedBookmarklet(false), 2500);
                      }}
                      className="block text-center py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-grab active:cursor-grabbing"
                    >
                      ⚡ Glisser dans Favoris
                    </a>
                    <span className="text-[10px] text-slate-400 block text-center">
                      Sur Amazon Ads, 1 clic dessus lit le "Coût total" instantanément.
                    </span>
                  </div>

                  {/* Solution B : Détecter "Coût total" */}
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs space-y-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                      Copier-Coller en 1 Clic
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sur votre écran Amazon Ads, copiez votre tableau (Ctrl+C), puis cliquez ici :
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleReadClipboard();
                        setActiveTab('paste');
                      }}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>📋 Détecter "Coût total"</span>
                    </button>
                    <span className="text-[10px] text-slate-400 block text-center">
                      L'application extrait automatiquement le chiffre après "Coût total".
                    </span>
                  </div>

                </div>
              </div>

              {/* Status & Feedback */}
              {fetchSuccess && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{fetchSuccess}</span>
                </div>
              )}

              {fetchError && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Information de session sécurisée</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">{fetchError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Cookie Configuration Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Option permanente : Cookie de session serveur
                    </span>
                  </div>

                  <button
                    onClick={() => setShowCookieConfig(!showCookieConfig)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                  >
                    {showCookieConfig ? 'Masquer' : amazonCookie ? 'Modifier le cookie' : 'Afficher la configuration'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Si vous souhaitez que le serveur puisse interroger Amazon sans que vous n'ayez jamais besoin d'ouvrir l'onglet Amazon, vous pouvez renseigner votre cookie de session ici (stockage 100% local dans votre navigateur).
                </p>

                {(showCookieConfig || amazonCookie) && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Cookie de session Amazon (session-id / at-main) :
                    </label>
                    <textarea
                      value={amazonCookie}
                      onChange={(e) => handleSaveCookie(e.target.value)}
                      placeholder="Collez ici votre cookie de session Amazon..."
                      rows={2}
                      className="w-full p-2.5 text-[11px] font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Stocké uniquement dans votre navigateur (100% privé).</span>
                      {amazonCookie && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Cookie enregistré
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: BOOKMARKLET 1-CLIC */}
          {activeTab === 'bookmarklet' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                    ★
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Raccourci Barre de Favoris
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Glissez ce bouton vers votre barre de favoris. Lorsque vous êtes sur votre page{' '}
                  <strong className="text-amber-900">Amazon Campaign Manager</strong>, cliquez dessus : il extrait immédiatement vos dépenses du mois et les injecte dans cette application !
                </p>
              </div>

              {/* Draggable Button */}
              <div className="text-center py-4 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                <span className="text-xs text-slate-500 block">
                  👇 Glissez ce bouton vers votre barre de favoris (Ctrl+Maj+B) :
                </span>
                
                <a
                  href={bookmarkletCode}
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(bookmarkletCode);
                    setCopiedBookmarklet(true);
                    setTimeout(() => setCopiedBookmarklet(false), 2500);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-grab active:cursor-grabbing ring-4 ring-amber-500/20"
                  title="Glissez-moi dans votre barre de favoris ou cliquez pour copier le code"
                >
                  <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
                  <span>⚡ Sync Amazon Ads vers KDP Tracker</span>
                </a>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookmarkletCode);
                      setCopiedBookmarklet(true);
                      setTimeout(() => setCopiedBookmarklet(false), 2500);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold underline cursor-pointer"
                  >
                    {copiedBookmarklet ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Code copié dans le presse-papier !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copier le script du marque-page</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Sélectionnez et copiez le texte ou le tableau depuis votre écran Amazon Ads ou KDP, puis collez-le ici :
                </span>
                <button
                  onClick={handleReadClipboard}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Coller le presse-papier</span>
                </button>
              </div>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Exemple : collez le tableau de campagne Amazon Ads ou le résumé KDP (ex: Dépenses: 64,80 € | Ventes: 240,00 €)..."
                rows={4}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />

              {/* Detection Result Box */}
              {(detectedAds !== null || detectedRevenue !== null) && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">
                      Montants identifiés automatiquement :
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Dépenses Amazon Ads
                      </span>
                      <div className="text-lg font-bold font-mono-numbers text-amber-700 mt-0.5">
                        {detectedAds !== null ? formatCurrency(detectedAds) : `${formatCurrency(currentAds)} (conservé)`}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        CA KDP Réel
                      </span>
                      <div className="text-lg font-bold font-mono-numbers text-blue-700 mt-0.5">
                        {detectedRevenue !== null ? formatCurrency(detectedRevenue) : `${formatCurrency(currentRevenue)} (conservé)`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyPaste}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      Enregistrer ces chiffres pour {getMonthNameFr(selectedMonth)} {selectedYear}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CSV IMPORT */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Sur Amazon Advertising Campaign Manager, cliquez sur le bouton{' '}
                <strong className="text-slate-900">"Exporter" / "Télécharger"</strong> (format CSV). Glissez le fichier ici :
              </p>

              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center bg-slate-50/60 transition-colors">
                <input
                  type="file"
                  id="amazon-csv-upload"
                  accept=".csv,.txt"
                  onChange={handleCsvFile}
                  className="hidden"
                />
                <label
                  htmlFor="amazon-csv-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {csvFileName ? `Fichier sélectionné : ${csvFileName}` : 'Cliquez pour choisir un rapport CSV ou glissez-le ici'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Export de campagnes Amazon Advertising ou rapport redevances KDP
                  </span>
                </label>
              </div>

              {csvError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {(csvParsedAds !== null || csvParsedRevenue !== null) && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Rapport analysé avec succès !</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Dépenses Ads</span>
                      <strong className="text-base font-mono-numbers text-amber-700">
                        {csvParsedAds !== null ? formatCurrency(csvParsedAds) : '—'}
                      </strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Ventes / CA</span>
                      <strong className="text-base font-mono-numbers text-blue-700">
                        {csvParsedRevenue !== null ? formatCurrency(csvParsedRevenue) : '—'}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyCsv}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Importer ces données dans {getMonthNameFr(selectedMonth)} {selectedYear}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HOW IT WORKS / SECURITY INFO */}
          {activeTab === 'direct' && (
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Sécurité et Confidentialité de votre compte Amazon</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Votre compte Amazon Advertising (<strong className="font-mono">{entityId}</strong>) est protégé par une session sécurisée.
                </p>
                <p className="text-[11px] text-blue-800">
                  Le système effectue la requête directement vers <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">advertising.amazon.fr</code> en utilisant votre session sécurisée, sans jamais stocker votre mot de passe ni transmettre vos données à des tiers.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <h5 className="font-bold text-slate-900 text-xs">
                  Comment fonctionne la récupération en 1 Clic ?
                </h5>
                <ul className="space-y-2 list-disc list-inside text-slate-600 text-[11px]">
                  <li>
                    <strong className="text-slate-800">1 Clic Direct :</strong> Cliquez sur "Récupérer maintenant" depuis cette fenêtre ou directement depuis le tableau de bord.
                  </li>
                  <li>
                    <strong className="text-slate-800">Extraction automatique :</strong> Le serveur analyse les métriques mensuelles de vos campagnes pour l'entité <strong className="font-mono text-slate-800">{entityId}</strong>.
                  </li>
                  <li>
                    <strong className="text-slate-800">Mise à jour immédiate :</strong> Les chiffres alimentent instantanément le bénéfice net, le TACoS, et la courbe prévisionnelle de fin de mois.
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Compte cible : <strong className="font-mono text-slate-800">{entityId}</strong></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% Confidentiel
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mois sélectionné : <strong>{getMonthNameFr(selectedMonth)} {selectedYear}</strong>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
