export type DTOType = 'PRODUCT' | 'SKU' | 'CATEGORY';
export type TargetType = 'PRODUCT' | 'CATEGORY';
export type MappingType = 'TEXT' | 'IMAGE' | 'COMPLEX' | 'JAVA_CODE' | 'PRODUCT_VARIANTS';
export type TargetFieldType = 'STRING' | 'IMAGE';

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
