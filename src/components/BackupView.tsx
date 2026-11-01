import React, { useRef, useState } from 'react';
import { DailyEntry, UserGoals, ActiveTab } from '../types';
import { 
  exportEntriesToCsv, 
  exportBackupToJson, 
  importBackupFromJson 
} from '../utils/storage';
import { 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  HardDrive, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Github,
  Info,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

interface BackupViewProps {
  entries: DailyEntry[];
  goals: UserGoals;
  onImportSuccess: (entries: DailyEntry[], goals?: UserGoals) => void;
  onClearAll: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  entries,
  goals,
  onImportSuccess,
  onClearAll,
  setActiveTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importBackupFromJson(file);
    setImportStatus({
      success: result.success,
      message: result.message,
    });

    if (result.success && result.entries) {
      onImportSuccess(result.entries, result.goals);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      setImportStatus(null);
    }, 5000);
  };

  const copyCode = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  const oldestDate = entries.length > 0 ? entries[entries.length - 1].date : 'Aucune';
  const newestDate = entries.length > 0 ? entries[0].date : 'Aucune';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sauvegardes & Hébergement GitHub Pages
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sécurisez vos données KDP et déployez gratuitement votre application
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Stockage Local Automatique</span>
        </span>
      </div>

      {/* Alert Messages */}
      {importStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          importStatus.success 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {importStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{importStatus.message}</span>
        </div>
      )}

      {/* SECTION 1: ÉTAT DU STOCKAGE LOCAL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              État de la base de données locale (LocalStorage)
            </h3>
          </div>
          <span className="text-xs font-mono-numbers text-slate-500">
            {entries.length} saisie{entries.length > 1 ? 's' : ''} en mémoire
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Nombre d'enregistrements</span>
            <span className="text-lg font-bold font-mono-numbers text-slate-900">
              {entries.length}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Période couverte</span>
            <span className="text-xs font-bold font-mono-numbers text-slate-800 mt-1 block">
              {entries.length > 0 ? `${oldestDate} → ${newestDate}` : 'Aucune donnée'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Sauvegarde continue</span>
            <span className="text-xs font-bold text-emerald-600 mt-1 block">
              ✓ Active à chaque saisie
            </span>
          </div>
        </div>

        {/* Warning Note about LocalStorage scope */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">À savoir sur le fonctionnement LocalStorage :</p>
            <p className="text-blue-800 leading-relaxed">
              Vos données sont enregistrées en toute confidentialité sur votre propre appareil, dans la mémoire locale de votre navigateur. 
              <strong>Aucun serveur tiers n'a accès à vos chiffres</strong>. Toutefois, comme GitHub Pages est un hébergement statique gratuit sans base de données centrale, vos données ne se synchronisent pas d'un ordinateur à un smartphone par magie : téléchargez un fichier de sauvegarde JSON pour copier vos données sur un autre appareil.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXPORT & IMPORT */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Exporter ou Importer une sauvegarde
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Export JSON (Sauvegarde complète) */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <FileJson className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Sauvegarde JSON</h4>
              <p className="text-xs text-slate-500 mt-1">
                Exporte l'intégralité de vos saisies et de vos objectifs dans un fichier restaurable.
              </p>
            </div>
            <button
              onClick={() => exportBackupToJson(entries, goals)}
              disabled={entries.length === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger .JSON</span>
            </button>
          </div>

          {/* Export CSV (Excel) */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Export Excel / CSV</h4>
              <p className="text-xs text-slate-500 mt-1">
                Fichier tabulaire avec encodage UTF-8 (BOM) compatible Microsoft Excel, Numbers et Google Sheets.
              </p>
            </div>
            <button
              onClick={() => exportEntriesToCsv(entries)}
              disabled={entries.length === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger .CSV</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Upload className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Restaurer un fichier</h4>
              <p className="text-xs text-slate-500 mt-1">
                Importez une sauvegarde JSON précédente pour restaurer vos données sur cet appareil.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer sauvegarde</span>
              </label>
            </div>
          </div>

        </div>

        {/* Clear controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Stockage local sur cet appareil : vos données sont conservées automatiquement.
          </span>

          <button
            onClick={() => setConfirmClearOpen(true)}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Réinitialiser toutes les données</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: INSTRUCTIONS GITHUB PAGES DÉTAILLÉES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Guide de déploiement sur GitHub Pages (100% Gratuit)
              </h3>
              <p className="text-xs text-slate-500">
                Cette application est configurée avec un chemin relatif (<code className="text-blue-700">base: './'</code>) prêt pour GitHub Pages.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 pt-2">
          
          {/* Étape 1 */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Étape 1 : Créer un nouveau dépôt sur GitHub
              </span>
              <span className="text-[11px] text-slate-400">github.com/new</span>
            </div>
            <p className="text-slate-600">
              Créez un dépôt public ou privé nommé par exemple <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">kdp-business-tracker</code>.
            </p>
          </div>

          {/* Étape 2: Premier envoi */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Étape 2 : Premier envoi (Initialisation du dépôt)
              </span>
              <button
                onClick={() => copyCode(
`git init
git add .
git commit -m "Initial commit KDP Business Tracker"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM/kdp-business-tracker.git
git push -u origin main`,
                  2
                )}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {copiedStep === 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStep === 2 ? 'Copié !' : 'Copier les commandes'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-md font-mono text-[11px] overflow-x-auto">
{`git init
git add .
git commit -m "Initial commit KDP Business Tracker"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM/kdp-business-tracker.git
git push -u origin main`}
            </pre>
          </div>

          {/* MISE A JOUR GITHUB (POUR ENVOYER LES NOUVEAUTES) */}
          <div className="p-3.5 bg-emerald-50/80 rounded-lg border border-emerald-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-950">
                  Mise à jour GitHub (Envoyer les dernières fonctionnalités)
                </span>
              </div>
              <button
                onClick={() => copyCode(
`git add .
git commit -m "Mise à jour : courbe CA/Pub cumulé jour par jour"
git push`,
                  4
                )}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-200/80 hover:bg-emerald-200 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedStep === 4 ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStep === 4 ? 'Copié !' : 'Copier mise à jour'}</span>
              </button>
            </div>
            <p className="text-emerald-900 text-[11px]">
              Si vous avez déjà créé votre dépôt GitHub, exécutez ces 3 lignes dans votre terminal pour déployer la courbe cumulée et les derniers correctifs :
            </p>
            <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto">
{`git add .
git commit -m "Mise à jour : courbe CA/Pub cumulé jour par jour"
git push`}
            </pre>
          </div>

          {/* Étape 3 */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Étape 3 : Activer GitHub Pages avec GitHub Actions
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
              <li>Rendez-vous dans votre dépôt GitHub &gt; <strong>Settings</strong> &gt; <strong>Pages</strong>.</li>
              <li>Dans <strong>Build and deployment &gt; Source</strong>, choisissez <strong>GitHub Actions</strong>.</li>
              <li>Le workflow <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">deploy.yml</code> s'exécutera automatiquement.</li>
              <li>Votre application sera instantanément accessible en ligne sur <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">https://votre-compte.github.io/kdp-business-tracker/</code>.</li>
            </ol>
          </div>

        </div>
      </div>

      {/* Confirmation Modal to Clear All Data */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Réinitialiser toutes les données ?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cette action effacera toutes les entrées enregistrées localement.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assurez-vous d'avoir téléchargé une sauvegarde JSON ou CSV avant de confirmer si vous souhaitez conserver l'historique de votre activité.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Oui, tout réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
