export type DTOType = 'PRODUCT' | 'SKU' | 'CATEGORY';
export type TargetType = 'PRODUCT' | 'CATEGORY';
export type MappingType = 'TEXT' | 'IMAGE' | 'COMPLEX' | 'JAVA_CODE' | 'PRODUCT_VARIANTS';
export type TargetFieldType = 'STRING' | 'IMAGE' | 'LIST';
export type PageType = 'PRODUCT_PAGE' | 'CMS_PAGE' | 'CATEGORY_PAGE';
export type FilterType = 'STANDARD' | 'PREDICATE';

export interface FilterConfig {
  enabled: boolean;
  filterType: FilterType;
  predicate?: string;
  order?: number;
  group?: string;
}

export interface RouteConfig {
  url: string;
  pageType: PageType;
  pageName: string;
  label: string;
}

export interface ComplexMapping {
  referencedAttrClasses: string[];
  producttypeAttrClassesToGroup: string[];
}

export interface MapConfig {
  ukey: string;
  dtoType: DTOType;
  mappingType: MappingType;
  targetField: string;
  targetFieldType?: TargetFieldType;
  isFallback?: boolean;
  target?: TargetType;
  javaCode?: string;
  complexMapping?: ComplexMapping;
  filterConfig?: FilterConfig;
}

export interface InformationResponse {
  skuUkeys: string[];
  productUkeys: string[];
  mappedSkuUkeys: string[];
  unmappedSkuUkeys: string[];
  mappedProductUkeys: string[];
  unmappedProductUkeys: string[];
}

export interface SlotConfig {
  component: string;
  order: number;
  enabled: boolean;
}

export interface TemplateProperties {
  name?: string;
  template?: string;
  labels: Record<string, string>;
  slots: SlotConfig[];
}

export interface DataQuality {
  ukey: string;
  percentage: string; // e.g. "80% haben den UKEY. Das sind 8 von 10 Skus."
  skusWithoutUkey: string[];
}

export interface FilterConfigEntry {
  ukey: string;
  targetField: string;
  filterConfig: FilterConfig;
  label: string;
}
