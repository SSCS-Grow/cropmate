export type ScoutItemType = 'boolean' | 'number' | 'select' | 'text';

export interface ScoutItem {
  key: string;
  label: string;
  type: ScoutItemType;
  options?: string[];
  threshold?: number;
}

export interface ScoutTemplate {
  id: string;
  profile_id: string;
  name: string;
  description?: string;
  items: ScoutItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ScoutRun {
  id: string;
  template_id: string;
  profile_id: string;
  garden_id?: string|null;
  planned_for?: string|null;
  started_at?: string|null;
  finished_at?: string|null;
  notes?: string|null;
  created_at?: string;
}

export interface ScoutResult {
  id: string;
  run_id: string;
  item_key: string;
  value: any;
  photo_url?: string|null;
  created_at?: string;
}
