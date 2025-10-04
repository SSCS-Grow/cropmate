export type ThreatType = 'pest' | 'disease';
export type ThreatCategory =
  | 'insect'
  | 'mite'
  | 'nematode'
  | 'weed'
  | 'fungus'
  | 'bacteria'
  | 'virus'
  | 'physiological'
  | 'other';

export interface Threat {
  id: string;
  type: ThreatType;
  category: ThreatCategory;
  name_common: string;
  name_latin: string | null;
  slug: string | null;
  summary: string | null;
  description_md: string | null;
  life_cycle_md: string | null;
  management_md: string | null;
  severity_min: number | null;
  severity_max: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThreatSymptom {
  id: string;
  threat_id: string;
  stage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'post-harvest' | null;
  title: string;
  description: string | null;
  severity: number | null;
  created_at: string;
}

export interface ThreatImage {
  id: string;
  threat_id: string;
  path: string; // storage path
  caption: string | null;
  source_url: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ThreatWithJoins extends Threat {
  symptoms: ThreatSymptom[];
  images: ThreatImage[];
  crops: { crop_id: string; name: string }[];
}
