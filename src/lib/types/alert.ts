export type AlertChannel = 'push'|'inapp'|'email';

export type WeatherCondition = {
  kind: 'weather';
  metric: 'temp'|'rain'|'wind';
  op: '>'|'<'|'≥'|'≤'|'=';
  value: number;
  windowHours?: number;
};

export type PestCondition = {
  kind: 'pest';
  species: string;
  metric: 'dd'|'risk';
  op: '>'|'<'|'≥'|'≤'|'=';
  value: number;
};

export type Condition = WeatherCondition | PestCondition;

export interface AlertRule {
  id: string;
  profile_id: string;
  garden_id?: string|null;
  name: string;
  channel: AlertChannel;
  is_enabled: boolean;
  condition: Condition;
  last_fired_at?: string|null;
  created_at?: string;
  updated_at?: string;
}
