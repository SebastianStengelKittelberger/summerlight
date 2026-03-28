import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useAppStore } from '../store/useAppStore';
import {
  listPages, loadPage, savePage,
  loadLabels, saveLabels,
  listVorlagen, loadVorlage, saveVorlage,
  loadUkeys,
  loadMappingConfig,
  saveMappingConfig,
} from '../api/client';
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

function UkeySidebarRow({ ukey, inSku, inProduct, copiedUkey, getSnippet, onCopy, onDragStart }: {
  ukey: string; inSku: boolean; inProduct: boolean; copiedUkey: string | null;
  getSnippet: (u: string, t: 'SKU' | 'PRODUCT') => string;
  onCopy: (u: string, t: 'SKU' | 'PRODUCT') => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div className="px-2 py-0.5 flex items-center gap-1 group hover:bg-slate-600 rounded mx-1 cursor-grab"
      draggable onDragStart={onDragStart}>
      <span className="flex-1 text-xs font-mono text-white truncate">{ukey}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {inSku && (
          <button onClick={() => onCopy(ukey, 'SKU')} title={getSnippet(ukey, 'SKU')}
            className={`px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${copiedUkey === ukey ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-400'}`}>
            {copiedUkey === ukey ? '✓' : 'SKU'}
          </button>
        )}
        {inProduct && (
          <button onClick={() => onCopy(ukey, 'PRODUCT')} title={getSnippet(ukey, 'PRODUCT')}
            className={`px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${copiedUkey === ukey ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-400'}`}>
            {copiedUkey === ukey ? '✓' : 'PRD'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TemplateEditor() {
  const { country, language, showToast } = useAppStore();

  const [pages, setPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState<string>('');
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const [config, setConfig] = useState<TemplateProperties | null>(null);
  const [vorlagen, setVorlagen] = useState<string[]>([]);
  const [activeVorlage, setActiveVorlage] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [globalLabels, setGlobalLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [ukeyInfo, setUkeyInfo] = useState<{ mappedSkuUkeys: string[]; unmappedSkuUkeys: string[]; mappedProductUkeys: string[]; unmappedProductUkeys: string[] }>({ mappedSkuUkeys: [], unmappedSkuUkeys: [], mappedProductUkeys: [], unmappedProductUkeys: [] });
  const [ukeyFilter, setUkeyFilter] = useState('');
  const [copiedUkey, setCopiedUkey] = useState<string | null>(null);

  const [mappingConfigs, setMappingConfigs] = useState<MapConfig[]>([]);
  const [quickMap, setQuickMap] = useState<QuickMapState | null>(null);
  const [newSlotName, setNewSlotName] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);
  const [previewSku, setPreviewSku] = useState('');
  const [bottomTab, setBottomTab] = useState<'slots' | 'labels'>('slots');
  const [bottomOpen, setBottomOpen] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

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
      .then(setConfig)
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
    } catch {
      showToast('Fehler beim Speichern der Vorlage', 'error');
    }
  }

  function getSnippet(ukey: string, type: 'SKU' | 'PRODUCT') {
    return type === 'SKU'
      ? `$skuAttr(${ukey})$.getText()`
      : `$productAttr(${ukey})$.getText()`;
  }

  function handleCopyUkey(ukey: string, type: 'SKU' | 'PRODUCT') {
    const snippet = getSnippet(ukey, type);
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
    setConfig({ ...config, slots: updatedSlots });
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

  async function handleCopyVorlageForPage() {
    if (!activeVorlage || !activePage) return;
    const newName = `${activeVorlage}-${activePage}`;
    if (!vorlagen.includes(newName)) {
      // Save copy with current HTML content
      try {
        await saveVorlage(newName, htmlContent);
      } catch {
        showToast('Fehler beim Kopieren der Vorlage', 'error');
        return;
      }
      setVorlagen(v => [...v, newName]);
    }
    // Assign to current page's slots: replace existing use of activeVorlage, or add new slot
    if (config) {
      const hasSlot = config.slots?.some(s => s.component === activeVorlage);
      const updatedSlots = hasSlot
        ? config.slots.map(s => s.component === activeVorlage ? { ...s, component: newName } : s)
        : [...(config.slots ?? []), { component: newName, order: (config.slots?.length ?? 0) + 1, enabled: true }];
      setConfig({ ...config, slots: updatedSlots });
    }
    setActiveVorlage(newName);
    setSlotDropdownOpen(false);
    showToast(`Verwendung „${newName}" erstellt und Seite zugewiesen`);
  }

  // Build filtered ukey groups
  const f = ukeyFilter.toLowerCase();
  const filterFn = (u: string) => !f || u.toLowerCase().includes(f);
  const unmappedUkeys = [...new Set([...ukeyInfo.unmappedSkuUkeys, ...ukeyInfo.unmappedProductUkeys])].filter(filterFn).sort();
  const mappedUkeys   = [...new Set([...ukeyInfo.mappedSkuUkeys,   ...ukeyInfo.mappedProductUkeys])].filter(filterFn).sort();
  const unmappedSkuSet = new Set(ukeyInfo.unmappedSkuUkeys);
  const mappedSkuSet   = new Set(ukeyInfo.mappedSkuUkeys);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Lädt…</div>;
  }

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden bg-slate-900">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <span className="text-white font-semibold text-sm mr-2">Template Editor</span>

        {/* Seiten-Dropdown */}
        <div className="relative">
          <button onClick={() => setPageDropdownOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 rounded text-xs text-white transition-colors min-w-32 max-w-48">
            <span className="text-indigo-200 text-[10px] uppercase tracking-wide mr-0.5">Seite</span>
            <span className="truncate flex-1 text-left">{activePage || '…'}</span>
            <span className="text-indigo-300">{pageDropdownOpen ? '▲' : '▼'}</span>
          </button>
          {pageDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPageDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded shadow-xl min-w-44 max-h-72 overflow-y-auto">
                {pages.map((page) => (
                  <button key={page} onClick={() => { setActivePage(page); setPageDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      activePage === page ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}>
                    {page}
                  </button>
                ))}
                <div className="border-t border-slate-600 mt-1 pt-1 px-2 pb-2">
                  {addingPage ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input autoFocus type="text" value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const name = newPageName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            if (name && !pages.includes(name)) { setPages(p => [...p, name]); setActivePage(name); }
                            setAddingPage(false); setNewPageName(''); setPageDropdownOpen(false);
                          }
                          if (e.key === 'Escape') { setAddingPage(false); setNewPageName(''); }
                        }}
                        placeholder="seiten-name"
                        className="flex-1 px-2 py-1 bg-slate-600 border border-indigo-500 rounded text-xs text-white focus:outline-none" />
                      <button onClick={() => {
                        const name = newPageName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        if (name && !pages.includes(name)) { setPages(p => [...p, name]); setActivePage(name); }
                        setAddingPage(false); setNewPageName(''); setPageDropdownOpen(false);
                      }} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500">✓</button>
                      <button onClick={() => { setAddingPage(false); setNewPageName(''); }}
                        className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs hover:bg-slate-500">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingPage(true)}
                      className="w-full text-left px-1 py-1 text-xs text-slate-400 hover:text-white transition-colors">
                      + Neue Seite
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vorlagen-Dropdown */}
        <div className="relative">
          <button onClick={() => setSlotDropdownOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-white transition-colors min-w-28 max-w-48">
            <span className="text-slate-400 text-[10px] uppercase tracking-wide mr-0.5">Vorlage</span>
            <span className="truncate flex-1 text-left">{activeVorlage || 'wählen'}</span>
            <span className="text-slate-400">{slotDropdownOpen ? '▲' : '▼'}</span>
          </button>
          {slotDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSlotDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded shadow-xl min-w-48 max-h-72 overflow-y-auto">
                {vorlagen.map((v) => (
                  <button key={v} onClick={() => { setActiveVorlage(v); setSlotDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      activeVorlage === v ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}>
                    {v}
                  </button>
                ))}
                {activeVorlage && activePage && (
                  <div className="border-t border-slate-600 mt-1 pt-1 px-2 pb-1">
                    <button onClick={handleCopyVorlageForPage}
                      title={`Kopie „${activeVorlage}-${activePage}" erstellen und Seite zuweisen`}
                      className="w-full text-left px-1 py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      <span>📋</span>
                      <span>
                        Als Verwendung für <strong className="font-semibold">„{activePage}"</strong> kopieren
                      </span>
                    </button>
                  </div>
                )}
                <div className="border-t border-slate-600 mt-1 pt-1 px-2 pb-2">
                  {addingSlot ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input autoFocus type="text" value={newSlotName}
                        onChange={(e) => setNewSlotName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { handleAddVorlage(); setSlotDropdownOpen(false); }
                          if (e.key === 'Escape') { setAddingSlot(false); setNewSlotName(''); }
                        }}
                        placeholder="vorlage-name"
                        className="flex-1 px-2 py-1 bg-slate-600 border border-blue-500 rounded text-xs text-white focus:outline-none" />
                      <button onClick={() => { handleAddVorlage(); setSlotDropdownOpen(false); }}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500">✓</button>
                      <button onClick={() => { setAddingSlot(false); setNewSlotName(''); }}
                        className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs hover:bg-slate-500">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingSlot(true)}
                      className="w-full text-left px-1 py-1 text-xs text-slate-400 hover:text-white transition-colors">
                      + Neue Vorlage
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        <input type="text" placeholder="SKU für Preview"
          value={previewSku} onChange={(e) => setPreviewSku(e.target.value)}
          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white w-36 placeholder-slate-400" />

        <button onClick={() => window.open(`http://localhost:8078/moonlight/${country}/${language}/product-${previewSku || 'EXAMPLE'}?page=${activePage}`, '_blank')}
          className="px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500">
          👁 Preview
        </button>

        <button onClick={handleSaveTemplate}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-500">
          💾 Speichern
        </button>
      </div>

      {/* Main area: left = ukeys, right = editor */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Ukey Sidebar – two sections */}
        <div className="w-60 shrink-0 flex flex-col bg-slate-700 border-r border-slate-600">
          <div className="p-3 border-b border-slate-600">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Ukeys</p>
            <input type="text" placeholder="Suchen…"
              value={ukeyFilter} onChange={(e) => setUkeyFilter(e.target.value)}
              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Mapped section */}
            <div className="px-3 py-1.5 bg-green-900/30 border-b border-green-700/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">Gemappt</span>
              <span className="ml-auto text-[10px] text-green-500">{mappedUkeys.length}</span>
            </div>
            {mappedUkeys.length === 0
              ? <p className="text-xs text-slate-500 px-3 py-2 italic">Keine</p>
              : mappedUkeys.map((ukey) => (
                <UkeySidebarRow key={ukey} ukey={ukey}
                  inSku={mappedSkuSet.has(ukey)}
                  inProduct={!mappedSkuSet.has(ukey)}
                  copiedUkey={copiedUkey}
                  getSnippet={getSnippet}
                  onCopy={handleCopyUkey}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', getSnippet(ukey, mappedSkuSet.has(ukey) ? 'SKU' : 'PRODUCT')); e.dataTransfer.effectAllowed = 'copy'; }}
                />
              ))
            }

            {/* Unmapped section */}
            <div className="px-3 py-1.5 bg-amber-900/30 border-b border-amber-700/30 border-t border-slate-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Nicht gemappt</span>
              <span className="ml-auto text-[10px] text-amber-500">{unmappedUkeys.length}</span>
            </div>
            {unmappedUkeys.length === 0
              ? <p className="text-xs text-slate-500 px-3 py-2 italic">Keine</p>
              : unmappedUkeys.map((ukey) => (
                <UkeySidebarRow key={ukey} ukey={ukey}
                  inSku={unmappedSkuSet.has(ukey)}
                  inProduct={!unmappedSkuSet.has(ukey)}
                  copiedUkey={copiedUkey}
                  getSnippet={getSnippet}
                  onCopy={handleCopyUkey}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', getSnippet(ukey, unmappedSkuSet.has(ukey) ? 'SKU' : 'PRODUCT')); e.dataTransfer.effectAllowed = 'copy'; }}
                />
              ))
            }
          </div>
        </div>

        {/* Right: Monaco Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor
            height="100%"
            language="html"
            theme="vs-dark"
            value={htmlContent}
            onChange={(value) => setHtmlContent(value ?? '')}
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
                // Check if dragged ukey is mapped — extract ukey from snippet
                const match = text.match(/\$(?:skuAttr|productAttr)\(([^)]+)\)/);
                if (match) {
                  const ukey = match[1];
                  const type = text.startsWith('$skuAttr') ? 'SKU' : 'PRODUCT';
                  checkAndPrompt(ukey, type);
                }
              }, true);
            }}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Bottom panel: Labels & Slots (collapsible) */}
      <div className={`shrink-0 bg-slate-800 border-t border-slate-700 transition-all ${bottomOpen ? 'h-56' : 'h-9'}`}>
        <div className="flex items-center gap-2 px-4 h-9 border-b border-slate-700">
          <button onClick={() => setBottomOpen(!bottomOpen)}
            className="text-slate-400 hover:text-white text-xs">
            {bottomOpen ? '▼' : '▲'}
          </button>
          {(['slots', 'labels'] as const).map((tab) => (
            <button key={tab} onClick={() => { setBottomTab(tab); setBottomOpen(true); }}
              className={`px-3 py-0.5 rounded text-xs transition-colors ${
                bottomTab === tab && bottomOpen ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {tab === 'slots' ? '⚙ Slots' : '🏷 Labels'}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleSaveConfig}
            className="px-3 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-500">
            💾 Config speichern
          </button>
        </div>

        {bottomOpen && (
          <div className="overflow-y-auto h-[calc(100%-2.25rem)] p-3">
            {bottomTab === 'slots' && config?.slots && (
              <table className="w-full text-xs text-slate-300">
                <thead><tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="pb-1 pr-6">Vorlage</th>
                  <th className="pb-1 pr-6 w-24">Reihenfolge</th>
                  <th className="pb-1 w-16">Aktiv</th>
                  <th className="pb-1 w-16"></th>
                </tr></thead>
                <tbody>
                  {config.slots.map((slot, i) => (
                    <tr key={i} className="border-b border-slate-700">
                      <td className="py-1 pr-6">
                        <select value={slot.component}
                          onChange={(e) => handleSlotConfigChange(i, 'component', e.target.value)}
                          className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white w-full max-w-[160px]">
                          {vorlagen.map(v => <option key={v} value={v}>{v}</option>)}
                          {!vorlagen.includes(slot.component) && (
                            <option value={slot.component}>{slot.component}</option>
                          )}
                        </select>
                      </td>
                      <td className="py-1 pr-6">
                        <input type="number" value={slot.order}
                          onChange={(e) => handleSlotConfigChange(i, 'order', parseInt(e.target.value, 10))}
                          className="w-16 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white" />
                      </td>
                      <td className="py-1">
                        <input type="checkbox" checked={slot.enabled}
                          onChange={(e) => handleSlotConfigChange(i, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-blue-500" />
                      </td>
                      <td className="py-1">
                        <button onClick={() => {
                          const updatedSlots = config.slots.filter((_, idx) => idx !== i);
                          setConfig({ ...config, slots: updatedSlots });
                        }} className="text-red-400 hover:text-red-300 px-1 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {bottomTab === 'slots' && (
              <button onClick={() => {
                if (!config) return;
                const newSlot = { component: vorlagen[0] ?? '', order: (config.slots?.length ?? 0) + 1, enabled: true };
                setConfig({ ...config, slots: [...(config.slots ?? []), newSlot] });
              }} className="mt-2 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs">
                + Vorlage hinzufügen
              </button>
            )}

            {bottomTab === 'labels' && (
              <div>
                <button onClick={handleAddLabel}
                  className="mb-2 px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-500">
                  + Label hinzufügen
                </button>
                {Object.entries(globalLabels ?? {}).map(([key, value]) => (
                  <div key={key} className="flex gap-1 mb-1 items-center">
                    <input type="text" defaultValue={key} readOnly
                      className="w-48 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-400 font-mono" />
                    <input type="text" value={value} onChange={(e) => handleLabelChange(key, e.target.value)}
                      className="flex-1 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white" />
                    <button onClick={() => handleDeleteLabel(key)}
                      className="px-1.5 text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {quickMap && (
      <QuickMapModal
        initial={quickMap}
        onSave={handleQuickMapSave}
        onClose={() => setQuickMap(null)}
      />
    )}
    </>
  );
}
