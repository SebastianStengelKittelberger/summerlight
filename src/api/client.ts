import axios from 'axios';
import type { InformationResponse, MapConfig, TemplateProperties } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8079/illusion',
  headers: { 'Content-Type': 'application/json' },
});

export function loadUkeys(
  country: string,
  language: string,
  sku?: string,
): Promise<InformationResponse> {
  return api
    .get<InformationResponse>(`/${country}/${language}/info/`, {
      params: sku ? { sku } : undefined,
    })
    .then((r) => r.data);
}

export function loadMappingConfig(
  country: string,
  language: string,
): Promise<MapConfig[]> {
  return api.get<MapConfig[]>(`/${country}/${language}/mapping-config`).then((r) => r.data);
}

export function saveMappingConfig(
  country: string,
  language: string,
  configs: MapConfig[],
): Promise<void> {
  return api.put(`/${country}/${language}/mapping-config`, configs).then(() => undefined);
}

export function applyMappingConfig(
  country: string,
  language: string,
  configs: MapConfig[],
): Promise<unknown> {
  return api.post(`/${country}/${language}/index`, configs).then((r) => r.data);
}

const moonlightApi = axios.create({
  baseURL: 'http://localhost:8078/moonlight',
  headers: { 'Content-Type': 'application/json' },
});

export function loadTemplateConfig(country: string, language: string): Promise<TemplateProperties> {
  return moonlightApi.get<TemplateProperties>(`/${country}/${language}/config`).then((r) => r.data);
}

export function saveTemplateConfig(country: string, language: string, config: TemplateProperties): Promise<void> {
  return moonlightApi.put(`/${country}/${language}/config`, config).then(() => undefined);
}

// ── Seiten ────────────────────────────────────────────────────────────────────

export function listPages(country: string, language: string): Promise<string[]> {
  return moonlightApi.get<string[]>(`/${country}/${language}/pages`).then((r) => r.data);
}

export function loadPage(country: string, language: string, pageName: string): Promise<TemplateProperties> {
  return moonlightApi.get<TemplateProperties>(`/${country}/${language}/page/${pageName}`).then((r) => r.data);
}

export function savePage(country: string, language: string, pageName: string, config: TemplateProperties): Promise<void> {
  return moonlightApi.put(`/${country}/${language}/page/${pageName}`, config).then(() => undefined);
}

// ── Labels (global) ───────────────────────────────────────────────────────────

export function loadLabels(country: string, language: string): Promise<Record<string, string>> {
  return moonlightApi.get<Record<string, string>>(`/${country}/${language}/labels`).then((r) => r.data);
}

export function saveLabels(country: string, language: string, labels: Record<string, string>): Promise<void> {
  return moonlightApi.put(`/${country}/${language}/labels`, labels).then(() => undefined);
}

// ── Vorlagen (global) ─────────────────────────────────────────────────────────

export function listVorlagen(): Promise<string[]> {
  return moonlightApi.get<string[]>('/vorlagen').then((r) => r.data);
}

export function loadVorlage(name: string): Promise<string> {
  return moonlightApi.get<string>(`/vorlage/${name}`, {
    responseType: 'text',
    headers: { Accept: 'text/html,text/plain,*/*' },
  }).then((r) => r.data);
}

export function saveVorlage(name: string, html: string): Promise<void> {
  return moonlightApi.put(`/vorlage/${name}`, html, {
    headers: { 'Content-Type': 'text/plain' },
  }).then(() => undefined);
}

export function loadSlotTemplate(country: string, language: string, slot: string): Promise<string> {
  return moonlightApi.get<string>(`/${country}/${language}/template/${slot}`, {
    responseType: 'text',
    headers: { Accept: 'text/html,text/plain,*/*' },
  }).then((r) => r.data);
}

export function saveSlotTemplate(country: string, language: string, slot: string, html: string): Promise<void> {
  return moonlightApi.put(`/${country}/${language}/template/${slot}`, html, {
    headers: { 'Content-Type': 'text/plain' },
  }).then(() => undefined);
}

export function listSlots(country: string, language: string): Promise<string[]> {
  return moonlightApi.get<string[]>(`/${country}/${language}/templates`).then((r) => r.data);
}
