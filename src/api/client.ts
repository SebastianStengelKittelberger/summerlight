import axios from 'axios';
import type { InformationResponse, MapConfig, TemplateProperties, DataQuality } from '../types';

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

export function loadDataQuality(
  country: string,
  language: string,
  ukey: string,
): Promise<DataQuality> {
  return api.get<DataQuality>(`/${country}/${language}/dataQuality/${ukey}/`).then((r) => r.data);
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

export function applyCategoryMappingConfig(
  country: string,
  language: string,
  configs: MapConfig[],
): Promise<unknown> {
  return api.post(`/${country}/${language}/index/categories`, configs).then((r) => r.data);
}

const moonlightApi = axios.create({
  baseURL: 'http://localhost:8078/moonlight',
  headers: { 'Content-Type': 'application/json' },
});

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

export function deleteVorlage(name: string): Promise<void> {
  return moonlightApi.delete(`/vorlage/${name}`).then(() => undefined);
}

export interface VorlageVersion {
  id: string;
  timestamp: string;
}

export function loadVorlageHistory(name: string): Promise<VorlageVersion[]> {
  return moonlightApi.get<VorlageVersion[]>(`/vorlage/${name}/history`).then(r => r.data);
}

export function loadVorlageVersionHtml(name: string, historyId: string): Promise<string> {
  return moonlightApi.get<string>(`/vorlage/${name}/history/${historyId}`, {
    responseType: 'text',
    headers: { Accept: 'text/html,text/plain,*/*' },
  }).then(r => r.data);
}

export interface SkuValue {
  sku: string;
  value: string;
}

export function loadSkuValues(country: string, language: string, ukey: string): Promise<SkuValue[]> {
  return api.get<SkuValue[]>(`/${country}/${language}/dataQuality/${ukey}/values`).then(r => r.data);
}

export function getSampleSkus(country: string, language: string, limit = 10): Promise<string[]> {
  return api.get<string[]>(`/${country}/${language}/skus`, { params: { limit } }).then(r => r.data);
}

export function loadRoutes(country: string, language: string): Promise<import('../types').RouteConfig[]> {
  return moonlightApi.get(`/${country}/${language}/routes`).then(r => r.data);
}

export function saveRoutes(country: string, language: string, routes: import('../types').RouteConfig[]): Promise<void> {
  return moonlightApi.put(`/${country}/${language}/routes`, routes).then(() => undefined);
}

// ── Filter Labels ─────────────────────────────────────────────────────────────

export function loadFilterLabels(country: string, language: string): Promise<Record<string, string>> {
  return api.get<Record<string, string>>(`/${country}/${language}/filter-labels`).then(r => r.data);
}

export function saveFilterLabels(country: string, language: string, labels: Record<string, string>): Promise<void> {
  return api.put(`/${country}/${language}/filter-labels`, labels).then(() => undefined);
}

export function loadFilterConfig(country: string, language: string): Promise<import('../types').FilterConfigEntry[]> {
  return api.get<import('../types').FilterConfigEntry[]>(`/${country}/${language}/filter-config`).then(r => r.data);
}
