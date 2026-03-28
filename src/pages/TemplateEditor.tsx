import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useAppStore } from '../store/useAppStore';
import {
  listPages, loadPage, savePage,
  loadLabels, saveLabels,
  listVorlagen, loadVorlage, saveVorlage, deleteVorlage,
  loadVorlageHistory, loadVorlageVersionHtml,
  loadUkeys,
  loadMappingConfig,
  saveMappingConfig,
} from '../api/client';
import type { VorlageVersion } from '../api/client';
import type { MapConfig, TemplateProperties, SlotConfig, DTOType, MappingType, TargetFieldType, TargetType } from '../types';

interface QuickMapState {
  ukey: string;
  dtoType: DTOType;
}

function QuickMapModal({
  initial,
  onSave,
  onClose,
}: {
  initial: QuickMapState;
  onSave: (cfg: MapConfig) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MapConfig>({
    ukey: initial.ukey,
    dtoType: initial.dtoType,
    mappingType: 'TEXT',
    targetField: initial.ukey.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    targetFieldType: 'STRING',
    isFallback: false,
    target: 'PRODUCT',
  });

  const set = <K extends keyof MapConfig>(k: K, v: MapConfig[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Mapping hinzufügen</h2>
        <p className="text-sm text-slate-500 mb-5">
          <strong>{initial.ukey}</strong> ist noch nicht in der MappingConfig. Jetzt schnell anlegen?
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ukey</label>
              <input value={form.ukey} readOnly
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm bg-slate-50 text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">DTO Type</label>
              <select value={form.dtoType} onChange={e => set('dtoType', e.target.value as DTOType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white">
                {(['PRODUCT', 'SKU', 'CATEGORY'] as DTOType[]).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mapping Type</label>
              <select value={form.mappingType} onChange={e => set('mappingType', e.target.value as MappingType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white">
                {(['TEXT', 'IMAGE', 'COMPLEX', 'JAVA_CODE', 'PRODUCT_VARIANTS'] as MappingType[]).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Field</label>
              <input value={form.targetField} onChange={e => set('targetField', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Field Type</label>
              <select value={form.targetFieldType} onChange={e => set('targetFieldType', e.target.value as TargetFieldType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white">
                {(['STRING', 'IMAGE'] as TargetFieldType[]).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target</label>
              <select value={form.target} onChange={e => set('target', e.target.value as TargetType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white">
                {(['PRODUCT', 'CATEGORY'] as TargetType[]).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={!!form.isFallback} onChange={e => set('isFallback', e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            Fallback-Mapping
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose}
            className="px-4 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200 text-slate-700">
            Abbrechen
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function UkeyChipModal({
  title,
  ukeys,
  skuSet,
  copiedUkey,
  getSnippet,
  onCopy,
  onClose,
}: {
  title: string;
  ukeys: string[];
  skuSet: Set<string>;
  copiedUkey: string | null;
  getSnippet: (u: string, t: 'SKU' | 'PRODUCT') => string;
  onCopy: (u: string, t: 'SKU' | 'PRODUCT') => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = ukeys.filter(u => !search || u.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-base font-semibold text-slate-800 flex-1">{title}</h2>
          <input autoFocus type="text" placeholder="Suchen…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div className="flex flex-wrap gap-1.5 p-4 overflow-y-auto">
          {filtered.map(ukey => {
            const type: 'SKU' | 'PRODUCT' = skuSet.has(ukey) ? 'SKU' : 'PRODUCT';
            const isCopied = copiedUkey === ukey;
            return (
              <div
                key={ukey}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', getSnippet(ukey, type));
                  e.dataTransfer.effectAllowed = 'copy';
                  // Close modal so the editor below is exposed for the drop
                  setTimeout(onClose, 0);
                }}
                onClick={() => onCopy(ukey, type)}
                className="group inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-slate-100 hover:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 cursor-grab transition-all select-none"
              >
                <span>{ukey}</span>
                <span className={`opacity-0 group-hover:opacity-100 px-1 rounded text-[9px] font-semibold transition-all ${
                  isCopied ? 'bg-green-500 text-white !opacity-100' : type === 'SKU' ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'
                }`}>
                  {isCopied ? '✓' : type}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-slate-400 italic">Keine UKeys gefunden</p>}
        </div>
      </div>
    </div>
  );
}

export default function TemplateEditor() {
  const { country, language, showToast } = useAppStore();

  const [pages, setPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState<string>('');
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [seitenOpen, setSeitenOpen] = useState(true);

  const [config, setConfig] = useState<TemplateProperties | null>(null);
  const [vorlagen, setVorlagen] = useState<string[]>([]);
  const [activeVorlage, setActiveVorlage] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [globalLabels, setGlobalLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [vorlagenOpen, setVorlagenOpen] = useState(true);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [configOpen, setConfigOpen] = useState(false);

  const [ukeyInfo, setUkeyInfo] = useState<{ mappedSkuUkeys: string[]; unmappedSkuUkeys: string[]; mappedProductUkeys: string[]; unmappedProductUkeys: string[] }>({ mappedSkuUkeys: [], unmappedSkuUkeys: [], mappedProductUkeys: [], unmappedProductUkeys: [] });
  const [copiedUkey, setCopiedUkey] = useState<string | null>(null);
  const [mappedModalOpen, setMappedModalOpen] = useState(false);
  const [unmappedModalOpen, setUnmappedModalOpen] = useState(false);

  const [mappingConfigs, setMappingConfigs] = useState<MapConfig[]>([]);
  const [quickMap, setQuickMap] = useState<QuickMapState | null>(null);
  const [previewSku, setPreviewSku] = useState('');
  const [draggedVorlage, setDraggedVorlage] = useState<string | null>(null);
  const [dropTargetPage, setDropTargetPage] = useState<string | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Feature 1: Split-View Preview
  const [splitPreview, setSplitPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Feature 2: Vorlage umbenennen
  const [renamingVorlage, setRenamingVorlage] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Feature 4: Undo/Redo für Seiten-Config
  const configHistoryRef = useRef<TemplateProperties[]>([]);
  const configHistoryIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Versionshistorie
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<VorlageVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<string | null>(null);

  // Initial load: pages, vorlagen, ukeys, mapping configs, global labels
  useEffect(() => {
    setLoading(true);
    Promise.all([
      listPages(country, language),
      listVorlagen(),
      loadUkeys(country, language),
      loadMappingConfig(country, language).catch(() => [] as MapConfig[]),
      loadLabels(country, language).catch(() => ({} as Record<string, string>)),
    ])
      .then(([pageList, vorlagenList, info, mappings, labels]) => {
        setPages(pageList);
        setVorlagen(vorlagenList);
        setUkeyInfo({
          mappedSkuUkeys: [...(info.mappedSkuUkeys ?? [])].sort(),
          unmappedSkuUkeys: [...(info.unmappedSkuUkeys ?? [])].sort(),
          mappedProductUkeys: [...(info.mappedProductUkeys ?? [])].sort(),
          unmappedProductUkeys: [...(info.unmappedProductUkeys ?? [])].sort(),
        });
        setMappingConfigs(mappings);
        setGlobalLabels(labels);
        const firstPage = pageList[0] ?? 'produktseite';
        setActivePage(firstPage);
        if (vorlagenList.length > 0) setActiveVorlage(vorlagenList[0]);
      })
      .catch(() => showToast('Fehler beim Laden', 'error'))
      .finally(() => setLoading(false));
  }, [country, language]);

  // Load page config when activePage changes
  useEffect(() => {
    if (!activePage) return;
    loadPage(country, language, activePage)
      .then(cfg => {
        setConfig(cfg);
        // Reset history when switching pages
        configHistoryRef.current = [cfg];
        configHistoryIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      })
      .catch(() => showToast('Fehler beim Laden der Seite', 'error'));
  }, [activePage, country, language]);

  // Load vorlage HTML when activeVorlage changes
  useEffect(() => {
    if (!activeVorlage) return;
    loadVorlage(activeVorlage)
      .then(setHtmlContent)
      .catch(() => setHtmlContent(''));
  }, [activeVorlage]);

  function isMapped(ukey: string) {
    return mappingConfigs.some(c => c.ukey === ukey);
  }

  function checkAndPrompt(ukey: string, type: 'SKU' | 'PRODUCT') {
    if (!isMapped(ukey)) {
      setQuickMap({ ukey, dtoType: type === 'SKU' ? 'SKU' : 'PRODUCT' });
    }
  }

  async function handleQuickMapSave(cfg: MapConfig) {
    const updated = [...mappingConfigs, cfg];
    try {
      await saveMappingConfig(country, language, updated);
      setMappingConfigs(updated);
      showToast(`"${cfg.ukey}" zur MappingConfig hinzugefügt`);
    } catch {
      showToast('Fehler beim Speichern der MappingConfig', 'error');
    }
    setQuickMap(null);
  }

  async function handleSaveTemplate() {
    if (!activeVorlage) return;
    try {
      await saveVorlage(activeVorlage, htmlContent);
      showToast(`Vorlage "${activeVorlage}" gespeichert`);
      if (splitPreview) setPreviewKey(k => k + 1);
    } catch {
      showToast('Fehler beim Speichern der Vorlage', 'error');
    }
  }

  // Feature 4: setConfigWithHistory wrapper
  function setConfigWithHistory(newConfig: TemplateProperties) {
    configHistoryRef.current = configHistoryRef.current.slice(0, configHistoryIndexRef.current + 1);
    configHistoryRef.current.push(newConfig);
    configHistoryIndexRef.current = configHistoryRef.current.length - 1;
    setConfig(newConfig);
    setCanUndo(configHistoryIndexRef.current > 0);
    setCanRedo(configHistoryIndexRef.current < configHistoryRef.current.length - 1);
  }

  function handleUndoConfig() {
    if (configHistoryIndexRef.current <= 0) return;
    configHistoryIndexRef.current -= 1;
    setConfig(configHistoryRef.current[configHistoryIndexRef.current]);
    setCanUndo(configHistoryIndexRef.current > 0);
    setCanRedo(configHistoryIndexRef.current < configHistoryRef.current.length - 1);
  }

  function handleRedoConfig() {
    if (configHistoryIndexRef.current >= configHistoryRef.current.length - 1) return;
    configHistoryIndexRef.current += 1;
    setConfig(configHistoryRef.current[configHistoryIndexRef.current]);
    setCanUndo(configHistoryIndexRef.current > 0);
    setCanRedo(configHistoryIndexRef.current < configHistoryRef.current.length - 1);
  }

  // Feature 2: Vorlage umbenennen
  async function handleRenameVorlage(oldName: string, newName: string) {
    newName = newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!newName || newName === oldName || vorlagen.includes(newName)) return;
    try {
      const html = await loadVorlage(oldName);
      await saveVorlage(newName, html);
      await deleteVorlage(oldName);
      const allPages = await listPages(country, language);
      await Promise.all(allPages.map(async (pageName) => {
        try {
          const pageConfig = await loadPage(country, language, pageName);
          const hasRef = pageConfig.slots?.some(s => s.component === oldName);
          if (hasRef) {
            const updated = { ...pageConfig, slots: pageConfig.slots.map(s => s.component === oldName ? { ...s, component: newName } : s) };
            await savePage(country, language, pageName, updated);
            if (pageName === activePage) setConfig(updated);
          }
        } catch { /* skip pages that fail */ }
      }));
      setVorlagen(v => v.map(x => x === oldName ? newName : x));
      if (activeVorlage === oldName) setActiveVorlage(newName);
      setRenamingVorlage(null);
      showToast(`Vorlage umbenannt: „${oldName}" → „${newName}"`);
    } catch {
      showToast('Fehler beim Umbenennen', 'error');
    }
  }

  function getSnippet(ukey: string, type: 'SKU' | 'PRODUCT') {
    return type === 'SKU'
      ? `$skuAttr(${ukey})$.getText()`
      : `$productAttr(${ukey})$.getText()`;
  }

  function handleCopyUkey(ukey: string, type: 'SKU' | 'PRODUCT') {
    const snippet = getSnippet(ukey, type);
    const editor = editorRef.current;
    if (editor) {
      const position = editor.getPosition() ?? { lineNumber: 1, column: 1 };
      editor.executeEdits('ukey-insert', [{
        range: { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column },
        text: snippet,
      }]);
      editor.setPosition({ lineNumber: position.lineNumber, column: position.column + snippet.length });
      editor.focus();
    }
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedUkey(ukey);
      setTimeout(() => setCopiedUkey(null), 1500);
    });
    checkAndPrompt(ukey, type);
  }

  function handleLabelChange(key: string, value: string) {
    setGlobalLabels(prev => ({ ...prev, [key]: value }));
  }

  function handleAddLabel() {
    setGlobalLabels(prev => ({ ...prev, [`label_${Date.now()}`]: '' }));
  }

  function handleDeleteLabel(key: string) {
    setGlobalLabels(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleSlotConfigChange(index: number, field: keyof SlotConfig, value: string | number | boolean) {
    if (!config) return;
    const updatedSlots = config.slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setConfigWithHistory({ ...config, slots: updatedSlots });
  }

  async function handleSaveConfig() {
    if (!config || !activePage) return;
    try {
      await savePage(country, language, activePage, config);
      await saveLabels(country, language, globalLabels);
      showToast('Seite und Labels gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    }
  }

  async function handleAddVorlage() {
    const name = newSlotName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!name || vorlagen.includes(name)) return;
    const newVorlagen = [...vorlagen, name];
    setVorlagen(newVorlagen);
    setActiveVorlage(name);
    setHtmlContent('');
    setAddingSlot(false);
    setNewSlotName('');
  }

  async function handleCopyVorlageForPage(vorlageName?: string) {
    const targetVorlage = vorlageName ?? activeVorlage;
    if (!targetVorlage || !activePage) return;
    const newName = `${targetVorlage}-${activePage}`;
    if (!vorlagen.includes(newName)) {
      try {
        await saveVorlage(newName, htmlContent);
      } catch {
        showToast('Fehler beim Kopieren der Vorlage', 'error');
        return;
      }
      setVorlagen(v => [...v, newName]);
    }
    if (config) {
      const hasSlot = config.slots?.some(s => s.component === targetVorlage);
      const updatedSlots = hasSlot
        ? config.slots.map(s => s.component === targetVorlage ? { ...s, component: newName } : s)
        : [...(config.slots ?? []), { component: newName, order: (config.slots?.length ?? 0) + 1, enabled: true }];
      setConfigWithHistory({ ...config, slots: updatedSlots });
    }
    setActiveVorlage(newName);
    showToast(`Verwendung „${newName}" erstellt und Seite zugewiesen`);
  }

  async function handleAssignVorlageToPage(vorlageName: string, targetPage: string) {
    const newName = `${vorlageName}-${targetPage}`;
    try {
      const [targetConfig, html] = await Promise.all([
        loadPage(country, language, targetPage),
        loadVorlage(vorlageName),
      ]);
      if (!vorlagen.includes(newName)) {
        await saveVorlage(newName, html);
        setVorlagen(v => [...v, newName]);
      }
      const hasSlot = targetConfig.slots?.some(s => s.component === newName);
      if (!hasSlot) {
        const updatedSlots = [...(targetConfig.slots ?? []), { component: newName, order: (targetConfig.slots?.length ?? 0) + 1, enabled: true }];
        const updatedConfig = { ...targetConfig, slots: updatedSlots };
        await savePage(country, language, targetPage, updatedConfig);
        if (targetPage === activePage) setConfigWithHistory(updatedConfig);
      }
      setActivePage(targetPage);
      setActiveVorlage(newName);
      showToast(`„${newName}" als Verwendung für „${targetPage}" hinzugefügt`);
    } catch {
      showToast('Fehler beim Zuweisen der Vorlage', 'error');
    }
  }

  async function handleDeleteVorlage(name: string) {
    if (!window.confirm(`Vorlage „${name}" wirklich löschen?`)) return;
    try {
      await deleteVorlage(name);
      setVorlagen(v => v.filter(x => x !== name));
      if (activeVorlage === name) {
        const remaining = vorlagen.filter(x => x !== name);
        setActiveVorlage(remaining[0] ?? '');
      }
      showToast(`Vorlage „${name}" gelöscht`);
    } catch {
      showToast('Fehler beim Löschen der Vorlage', 'error');
    }
  }

  async function handleOpenHistory() {
    if (!activeVorlage) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const h = await loadVorlageHistory(activeVorlage);
      setHistory(h);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handlePreviewVersion(ver: VorlageVersion) {
    if (!activeVorlage) return;
    try {
      const html = await loadVorlageVersionHtml(activeVorlage, ver.id);
      setPreviewVersion(html);
    } catch {
      showToast('Fehler beim Laden der Version', 'error');
    }
  }

  function handleRestoreVersion() {
    if (previewVersion === null) return;
    setHtmlContent(previewVersion);
    setHistoryOpen(false);
    setPreviewVersion(null);
    showToast('Version wiederhergestellt — bitte speichern');
  }

  function handleDeleteVerwendung(slotComponent: string) {
    if (!config) return;
    if (!window.confirm(`Verwendung „${slotComponent}" aus der Seite entfernen?`)) return;
    const updatedSlots = config.slots?.filter(s => s.component !== slotComponent) ?? [];
    const updatedConfig = { ...config, slots: updatedSlots };
    setConfigWithHistory(updatedConfig);
    savePage(country, language, activePage, updatedConfig)
      .then(() => showToast(`Verwendung „${slotComponent}" entfernt`))
      .catch(() => showToast('Fehler beim Speichern', 'error'));
    if (activeVorlage === slotComponent) setActiveVorlage(updatedSlots[0]?.component ?? '');
  }

  const unmappedUkeys = [...new Set([...ukeyInfo.unmappedSkuUkeys, ...ukeyInfo.unmappedProductUkeys])].sort();
  const mappedUkeys   = [...new Set([...ukeyInfo.mappedSkuUkeys,   ...ukeyInfo.mappedProductUkeys])].sort();
  const unmappedSkuSet = new Set(ukeyInfo.unmappedSkuUkeys);
  const mappedSkuSet   = new Set(ukeyInfo.mappedSkuUkeys);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Lädt…</div>;
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">

        {/* ── File Explorer ────────────────────────────────────────── */}
        <div className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

          {/* ── Seiten Section ─────────────────────────────────── */}
          <div className="shrink-0">
            <button
              onClick={() => setSeitenOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest hover:bg-slate-50 border-b border-slate-100"
            >
              <span>Seiten</span>
              <span className="text-slate-400">{seitenOpen ? '▼' : '▶'}</span>
            </button>
            {seitenOpen && (
              <div className="py-1">
                {pages.map(page => (
                  <div key={page}>
                    <button
                      onClick={() => setActivePage(page)}
                      onDragOver={e => { e.preventDefault(); setDropTargetPage(page); }}
                      onDragLeave={() => setDropTargetPage(null)}
                      onDrop={e => {
                        e.preventDefault();
                        setDropTargetPage(null);
                        if (draggedVorlage) handleAssignVorlageToPage(draggedVorlage, page);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs truncate transition-colors border-b border-transparent ${
                        dropTargetPage === page
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : activePage === page
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      {activePage === page ? '▾' : '▸'} {page}
                    </button>
                    {/* Verwendungen unter aktiver Seite */}
                    {activePage === page && config?.slots && config.slots.length > 0 && (
                      <div className="border-b border-slate-100 bg-slate-50/60">
                        {[...config.slots].sort((a, b) => a.order - b.order).map((slot, i) => (
                          <div key={i} className="group flex items-center">
                            <button
                              onClick={() => setActiveVorlage(slot.component)}
                              className={`flex-1 text-left pl-6 pr-1 py-1 text-[11px] truncate flex items-center gap-1 transition-colors ${
                                activeVorlage === slot.component
                                  ? 'text-blue-700 bg-blue-50'
                                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                              } ${!slot.enabled ? 'opacity-40' : ''}`}
                            >
                              <span className="text-slate-300 shrink-0">└</span>
                              <span className="truncate">{slot.component}</span>
                              {!slot.enabled && <span className="text-[9px] text-slate-400 shrink-0">(off)</span>}
                            </button>
                            <button
                              onClick={() => handleDeleteVerwendung(slot.component)}
                              title="Verwendung entfernen"
                              className="opacity-0 group-hover:opacity-100 pr-2 text-slate-300 hover:text-red-500 transition-all text-xs shrink-0">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {addingPage ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input autoFocus type="text" value={newPageName}
                      onChange={e => setNewPageName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const name = newPageName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                          if (name && !pages.includes(name)) { setPages(p => [...p, name]); setActivePage(name); }
                          setAddingPage(false); setNewPageName('');
                        }
                        if (e.key === 'Escape') { setAddingPage(false); setNewPageName(''); }
                      }}
                      placeholder="seiten-name"
                      className="flex-1 min-w-0 px-2 py-1 border border-indigo-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    <button onClick={() => { setAddingPage(false); setNewPageName(''); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingPage(true)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    ＋ Seite
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Vorlagen Section ───────────────────────────────── */}
          <div className="shrink-0 border-t border-slate-100">
            <button
              onClick={() => setVorlagenOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest hover:bg-slate-50 border-b border-slate-100"
            >
              <span>Vorlagen</span>
              <span className="text-slate-400">{vorlagenOpen ? '▼' : '▶'}</span>
            </button>
            {vorlagenOpen && (
              <div className="py-1 overflow-y-auto max-h-64">
                {vorlagen.filter(v => !pages.some(p => v.endsWith('-' + p))).map(v => {
                  const isAssigned = config?.slots?.some(s => s.component === v) ?? false;
                  return (
                    <div key={v} className={`group relative flex items-center px-2 py-1 transition-colors ${
                      activeVorlage === v ? 'bg-blue-50' : 'hover:bg-slate-50'
                    } ${draggedVorlage === v ? 'opacity-50' : ''}`}>
                      {renamingVorlage === v ? (
                        <input
                          autoFocus
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameVorlage(v, renameValue);
                            if (e.key === 'Escape') setRenamingVorlage(null);
                          }}
                          onBlur={() => setRenamingVorlage(null)}
                          className="flex-1 min-w-0 px-1 py-0.5 border border-blue-300 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <button
                          draggable
                          onDragStart={() => setDraggedVorlage(v)}
                          onDragEnd={() => { setDraggedVorlage(null); setDropTargetPage(null); }}
                          onClick={() => setActiveVorlage(v)}
                          title="Ziehen um Vorlage einer Seite zuzuweisen"
                          className={`flex-1 text-left text-xs truncate cursor-grab active:cursor-grabbing ${
                            activeVorlage === v ? 'text-blue-700 font-medium' : 'text-slate-600'
                          }`}>
                          {isAssigned && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 align-middle" />}
                          {v}
                        </button>
                      )}
                      {isAssigned && renamingVorlage !== v && (
                        <span className="text-[9px] text-blue-400 font-medium shrink-0 mr-1">Verw.</span>
                      )}
                      <button
                        onClick={() => { setRenamingVorlage(v); setRenameValue(v); }}
                        title="Vorlage umbenennen"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-yellow-600 transition-all text-xs shrink-0">
                        ✏
                      </button>
                      <button
                        onClick={() => handleCopyVorlageForPage(v)}
                        title={`Als Verwendung für „${activePage}" kopieren`}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all text-xs shrink-0">
                        📋
                      </button>
                      <button
                        onClick={() => handleDeleteVorlage(v)}
                        title={`Vorlage „${v}" löschen`}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-xs shrink-0 ml-0.5">
                        🗑
                      </button>
                    </div>
                  );
                })}
                {addingSlot ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input autoFocus type="text" value={newSlotName}
                      onChange={e => setNewSlotName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddVorlage();
                        if (e.key === 'Escape') { setAddingSlot(false); setNewSlotName(''); }
                      }}
                      placeholder="vorlage-name"
                      className="flex-1 min-w-0 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <button onClick={() => { setAddingSlot(false); setNewSlotName(''); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingSlot(true)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    ＋ Vorlage
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Seiten-Konfiguration Section ── */}
          <div className="border-t border-slate-100 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center border-b border-slate-100 shrink-0">
              <button
                onClick={() => setConfigOpen(o => !o)}
                className="flex-1 flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest hover:bg-slate-50"
              >
                <span>⚙ Konfiguration</span>
                <span className="text-slate-400">{configOpen ? '▼' : '▶'}</span>
              </button>
              <div className="flex items-center gap-1 pr-2">
                <button onClick={handleUndoConfig} title="Rückgängig (Seiten-Config)"
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs px-1"
                  disabled={!canUndo}>↩</button>
                <button onClick={handleRedoConfig} title="Wiederholen (Seiten-Config)"
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs px-1"
                  disabled={!canRedo}>↪</button>
              </div>
            </div>
            {configOpen && (
              <div className="flex-1 overflow-y-auto p-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Slots</p>
                {config?.slots?.map((slot, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <span className="flex-1 text-[10px] font-mono text-slate-600 truncate">{slot.component}</span>
                    <input type="checkbox" checked={slot.enabled}
                      onChange={e => handleSlotConfigChange(i, 'enabled', e.target.checked)}
                      className="w-3 h-3 accent-indigo-600 shrink-0" />
                    <input type="number" value={slot.order}
                      onChange={e => handleSlotConfigChange(i, 'order', parseInt(e.target.value, 10))}
                      className="w-8 px-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-center focus:outline-none" />
                  </div>
                ))}
                <button onClick={() => {
                  if (!config) return;
                  setConfigWithHistory({ ...config, slots: [...(config.slots ?? []), { component: vorlagen[0] ?? '', order: (config.slots?.length ?? 0) + 1, enabled: true }] });
                }} className="w-full py-1 border border-dashed border-slate-300 rounded text-[10px] text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors mb-2">
                  ＋ Slot
                </button>

                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Labels</p>
                <button onClick={handleAddLabel}
                  className="w-full py-1 border border-dashed border-slate-300 rounded text-[10px] text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors mb-1">
                  ＋ Label
                </button>
                {Object.entries(globalLabels ?? {}).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5 mb-1.5">
                    <span className="text-[9px] font-mono text-slate-400 truncate">{key}</span>
                    <div className="flex gap-0.5">
                      <input type="text" value={value} onChange={e => handleLabelChange(key, e.target.value)}
                        className="flex-1 min-w-0 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                      <button onClick={() => handleDeleteLabel(key)} className="text-slate-300 hover:text-red-400 shrink-0 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <button onClick={handleSaveConfig}
                  className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium transition-colors">
                  💾 Seite speichern
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Editor Column ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor top bar */}
          <div className="flex items-center gap-2 px-3 h-10 bg-slate-800 text-white shrink-0">
            <span className="text-slate-300 text-xs font-mono">{activeVorlage || '—'}</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-400 text-xs">{activePage || '—'}</span>

            <div className="flex-1" />

            <button onClick={() => setMappedModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition-colors">
              🟢 Gemappt ({mappedUkeys.length})
            </button>

            <button onClick={() => setUnmappedModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium transition-colors">
              ⚠ Nicht gemappt ({unmappedUkeys.length})
            </button>

            <div className="w-px h-4 bg-slate-600" />

            <input type="text" placeholder="SKU Preview"
              value={previewSku} onChange={e => setPreviewSku(e.target.value)}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white placeholder-slate-400 w-28 focus:outline-none focus:ring-1 focus:ring-slate-500" />

            <button onClick={() => window.open(`http://localhost:8078/moonlight/${country}/${language}/product-${previewSku || 'EXAMPLE'}?page=${activePage}`, '_blank')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors">
              👁 Preview
            </button>

            <button onClick={() => setSplitPreview(s => !s)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${splitPreview ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
              ⊞ Split
            </button>

            <button onClick={handleOpenHistory}
              title="Versionshistorie"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors">
              🕐 Verlauf
            </button>

            <div className="w-px h-4 bg-slate-600" />

            <button onClick={handleSaveTemplate}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors">
              💾 Vorlage
            </button>

            <button onClick={handleSaveConfig}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium transition-colors">
              💾 Seite
            </button>
          </div>

          {/* Monaco Editor */}
          <div className={`flex-1 overflow-hidden${splitPreview ? ' flex flex-row' : ''}`}>
            <div className={splitPreview ? 'flex-1 min-w-0 h-full' : 'h-full'}>
              <Editor
                height="100%"
                language="html"
                theme="vs-dark"
                value={htmlContent}
                onChange={value => setHtmlContent(value ?? '')}
                onMount={(editor) => {
                  editorRef.current = editor;
                  const domNode = editor.getDomNode();
                  if (!domNode) return;
                  domNode.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    (e as DragEvent).dataTransfer!.dropEffect = 'copy';
                  }, true);
                  domNode.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const text = (e as DragEvent).dataTransfer?.getData('text/plain');
                    if (!text) return;
                    const target = editor.getTargetAtClientPoint(e.clientX, e.clientY);
                    const position = target?.position ?? editor.getPosition();
                    if (!position) return;
                    editor.executeEdits('drag-drop', [{
                      range: { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column },
                      text,
                    }]);
                    editor.setPosition({ lineNumber: position.lineNumber, column: position.column + text.length });
                    editor.focus();
                    const match = text.match(/\$(?:skuAttr|productAttr)\(([^)]+)\)/);
                    if (match) {
                      const ukey = match[1];
                      const type = text.startsWith('$skuAttr') ? 'SKU' : 'PRODUCT';
                      checkAndPrompt(ukey, type);
                    }
                  }, true);
                  // Feature 3: Quick-Map via context menu
                  editor.addAction({
                    id: 'quick-map-ukey',
                    label: 'UKey mappen…',
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.5,
                    run: (ed) => {
                      const position = ed.getPosition();
                      if (!position) return;
                      const model = ed.getModel();
                      if (!model) return;
                      const line = model.getLineContent(position.lineNumber);
                      const col = position.column - 1;
                      const pattern = /\$(skuAttr|productAttr)\(([^)]+)\)\$/g;
                      let match;
                      while ((match = pattern.exec(line)) !== null) {
                        const start = match.index;
                        const end = match.index + match[0].length;
                        if (col >= start && col <= end) {
                          const type: DTOType = match[1] === 'skuAttr' ? 'SKU' : 'PRODUCT';
                          const ukey = match[2];
                          setQuickMap({ ukey, dtoType: type });
                          return;
                        }
                      }
                      showToast('Kein UKey unter dem Cursor gefunden', 'error');
                    },
                  });
                }}
                options={{ minimap: { enabled: true }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
              />
            </div>
            {splitPreview && (
              <iframe
                key={previewKey}
                src={`http://localhost:8078/moonlight/${country}/${language}/product-${previewSku || 'EXAMPLE'}?page=${activePage}`}
                className="w-[420px] shrink-0 border-l border-slate-200"
              />
            )}
          </div>
        </div>
      </div>

      {quickMap && <QuickMapModal initial={quickMap} onSave={handleQuickMapSave} onClose={() => setQuickMap(null)} />}
      {mappedModalOpen && (
        <UkeyChipModal
          title={`🟢 Gemappte UKeys (${mappedUkeys.length})`}
          ukeys={mappedUkeys}
          skuSet={mappedSkuSet}
          copiedUkey={copiedUkey}
          getSnippet={getSnippet}
          onCopy={handleCopyUkey}
          onClose={() => setMappedModalOpen(false)}
        />
      )}
      {unmappedModalOpen && (
        <UkeyChipModal
          title={`⚠ Nicht gemappte UKeys (${unmappedUkeys.length})`}
          ukeys={unmappedUkeys}
          skuSet={unmappedSkuSet}
          copiedUkey={copiedUkey}
          getSnippet={getSnippet}
          onCopy={handleCopyUkey}
          onClose={() => setUnmappedModalOpen(false)}
        />
      )}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => { setHistoryOpen(false); setPreviewVersion(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-base font-semibold text-slate-800 flex-1">
                Versionshistorie: {activeVorlage}
              </h2>
              <button
                onClick={() => { setHistoryOpen(false); setPreviewVersion(null); }}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >✕</button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: version list */}
              <div className="w-64 shrink-0 border-r border-slate-200 overflow-y-auto">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-400 italic p-4">Keine Versionen gefunden</p>
                ) : (
                  history.map(ver => (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between px-3 py-2 border-b border-slate-100 hover:bg-slate-50"
                    >
                      <span className="text-xs text-slate-600">
                        {new Date(ver.timestamp).toLocaleString('de-DE')}
                      </span>
                      <button
                        onClick={() => handlePreviewVersion(ver)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >Vorschau</button>
                    </div>
                  ))
                )}
              </div>
              {/* Right: preview */}
              <div className="flex-1 overflow-auto p-3">
                {previewVersion !== null ? (
                  <pre className="whitespace-pre-wrap text-xs font-mono overflow-auto">{previewVersion}</pre>
                ) : (
                  <p className="text-sm text-slate-400 italic">Klicke auf eine Version zum Vorschauen</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 shrink-0">
              <button
                onClick={handleRestoreVersion}
                disabled={previewVersion === null}
                className="px-4 py-2 rounded text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >↩ Wiederherstellen</button>
              <button
                onClick={() => { setHistoryOpen(false); setPreviewVersion(null); }}
                className="px-4 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
              >Schließen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
