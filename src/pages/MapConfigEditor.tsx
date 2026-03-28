import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../store/useAppStore';
import { saveMappingConfig } from '../api/client';
import type { MapConfig, DTOType, MappingType, TargetFieldType, TargetType } from '../types';

const emptyConfig = (): MapConfig => ({
  ukey: '',
  dtoType: 'PRODUCT',
  mappingType: 'TEXT',
  targetField: '',
  targetFieldType: 'STRING',
  isFallback: false,
  target: 'PRODUCT',
  javaCode: '',
  complexMapping: {
    referencedAttrClasses: [],
    producttypeAttrClassesToGroup: [],
  },
});

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="border border-slate-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-500 hover:text-blue-700 font-bold leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none"
        />
        <button
          type="button"
          onClick={addTag}
          className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

export default function MapConfigEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const configs = useAppStore((s) => s.configs);
  const addConfig = useAppStore((s) => s.addConfig);
  const updateConfig = useAppStore((s) => s.updateConfig);

  const ukeyParam = searchParams.get('ukey') || '';
  const dtoTypeParam = (searchParams.get('dtoType') as DTOType) || 'PRODUCT';
  const indexParam = searchParams.get('index');
  const editIndex = indexParam !== null ? parseInt(indexParam, 10) : null;

  const initialised = useRef(false);
  const [form, setForm] = useState<MapConfig>(() => {
    if (editIndex !== null && configs[editIndex]) {
      return { ...emptyConfig(), ...configs[editIndex] };
    }
    return { ...emptyConfig(), ukey: ukeyParam, dtoType: dtoTypeParam };
  });

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    if (editIndex !== null && configs[editIndex]) {
      setForm({ ...emptyConfig(), ...configs[editIndex] });
    }
  }, [editIndex, configs]);

  const showToast = useAppStore((s) => s.showToast);
  const [errors, setErrors] = useState<Partial<Record<keyof MapConfig, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof MapConfig>(key: K, value: MapConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MapConfig, string>> = {};
    if (!form.ukey.trim()) newErrors.ukey = 'Pflichtfeld';
    if (!form.dtoType) newErrors.dtoType = 'Pflichtfeld';
    if (!form.mappingType) newErrors.mappingType = 'Pflichtfeld';
    if (!form.targetField.trim()) newErrors.targetField = 'Pflichtfeld';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let updatedConfigs: MapConfig[];
      if (editIndex !== null) {
        const copy = [...configs];
        copy[editIndex] = form;
        updatedConfigs = copy;
        updateConfig(editIndex, form);
      } else {
        addConfig(form);
        const existingIndex = configs.findIndex((c) => c.ukey === form.ukey);
        if (existingIndex >= 0) {
          const copy = [...configs];
          copy[existingIndex] = form;
          updatedConfigs = copy;
        } else {
          updatedConfigs = [...configs, form];
        }
      }
      await saveMappingConfig(country, language, updatedConfigs);
      showToast('MapConfig erfolgreich gespeichert');
      navigate('/configs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof MapConfig) =>
    `border ${errors[field] ? 'border-red-400' : 'border-slate-300'} rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`;

  const selectClass = (field: keyof MapConfig) =>
    `border ${errors[field] ? 'border-red-400' : 'border-slate-300'} rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white`;

  return (
    <div className="p-6 max-w-3xl mx-auto overflow-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          {editIndex !== null ? 'MapConfig bearbeiten' : 'Neue MapConfig'}
        </h2>
        <button
          onClick={() => navigate('/configs')}
          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm font-medium"
        >
          Abbrechen
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        {/* ukey */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ukey <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.ukey}
            onChange={(e) => set('ukey', e.target.value)}
            className={inputClass('ukey')}
            placeholder="z.B. price"
          />
          {errors.ukey && <p className="text-red-500 text-xs mt-1">{errors.ukey}</p>}
        </div>

        {/* dtoType */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            DTO Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.dtoType}
            onChange={(e) => set('dtoType', e.target.value as DTOType)}
            className={selectClass('dtoType')}
          >
            <option value="PRODUCT">PRODUCT</option>
            <option value="SKU">SKU</option>
            <option value="CATEGORY">CATEGORY</option>
          </select>
          {errors.dtoType && <p className="text-red-500 text-xs mt-1">{errors.dtoType}</p>}
        </div>

        {/* mappingType */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mapping Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.mappingType}
            onChange={(e) => set('mappingType', e.target.value as MappingType)}
            className={selectClass('mappingType')}
          >
            <option value="TEXT">TEXT</option>
            <option value="IMAGE">IMAGE</option>
            <option value="COMPLEX">COMPLEX</option>
            <option value="JAVA_CODE">JAVA_CODE</option>
            <option value="PRODUCT_VARIANTS">PRODUCT_VARIANTS</option>
          </select>
          {errors.mappingType && <p className="text-red-500 text-xs mt-1">{errors.mappingType}</p>}
        </div>

        {/* targetField */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Field <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.targetField}
            onChange={(e) => set('targetField', e.target.value)}
            className={inputClass('targetField')}
            placeholder="z.B. name"
          />
          {errors.targetField && <p className="text-red-500 text-xs mt-1">{errors.targetField}</p>}
        </div>

        {/* targetFieldType */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Field Type</label>
          <select
            value={form.targetFieldType ?? 'STRING'}
            onChange={(e) => set('targetFieldType', e.target.value as TargetFieldType)}
            className={selectClass('targetFieldType')}
          >
            <option value="STRING">STRING</option>
            <option value="IMAGE">IMAGE</option>
          </select>
        </div>

        {/* target */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
          <select
            value={form.target ?? 'PRODUCT'}
            onChange={(e) => set('target', e.target.value as TargetType)}
            className={selectClass('target')}
          >
            <option value="PRODUCT">PRODUCT</option>
            <option value="CATEGORY">CATEGORY</option>
          </select>
        </div>

        {/* isFallback */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFallback"
            checked={form.isFallback ?? false}
            onChange={(e) => set('isFallback', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isFallback" className="text-sm font-medium text-slate-700">
            Is Fallback
          </label>
        </div>

        {/* JAVA_CODE section */}
        {form.mappingType === 'JAVA_CODE' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Java Code</label>
            <div className="border border-slate-300 rounded overflow-hidden">
              <Editor
                height="300px"
                language="java"
                value={form.javaCode ?? ''}
                onChange={(value) => set('javaCode', value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        )}

        {/* COMPLEX section */}
        {form.mappingType === 'COMPLEX' && (
          <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700">Complex Mapping</h4>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Referenced Attr Classes
              </label>
              <TagInput
                tags={form.complexMapping?.referencedAttrClasses ?? []}
                onChange={(tags) =>
                  set('complexMapping', {
                    referencedAttrClasses: tags,
                    producttypeAttrClassesToGroup:
                      form.complexMapping?.producttypeAttrClassesToGroup ?? [],
                  })
                }
                placeholder="Enter und Add drücken…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Producttype Attr Classes To Group
              </label>
              <TagInput
                tags={form.complexMapping?.producttypeAttrClassesToGroup ?? []}
                onChange={(tags) =>
                  set('complexMapping', {
                    referencedAttrClasses: form.complexMapping?.referencedAttrClasses ?? [],
                    producttypeAttrClassesToGroup: tags,
                  })
                }
                placeholder="Enter und Add drücken…"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
        <button
          onClick={() => navigate('/configs')}
          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm font-medium"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
