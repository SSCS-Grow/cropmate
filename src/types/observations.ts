export type Observation = {
  id: string;
  org_id: string;
  field_id: string;
  user_id: string;
  observed_at: string; // ISO
  type: string;
  severity: number; // 0-5
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ObservationInput = Omit<
  Observation,
  'id' | 'created_at' | 'updated_at' | 'user_id'
> & {
  // user_id resolved server-side from session
};
