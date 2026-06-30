export type RiskLevel = 'pending' | 'low' | 'medium' | 'high';

export type ClaimStatus =
  | 'submitted'
  | 'under_review'
  | 'fraud_investigation'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'paid';

export type AIRecommendation = 'auto_approve' | 'human_review' | 'escalate';

export interface Claim {
  id: string;
  claim_number: string;
  claim_type: string;
  status: ClaimStatus;
  risk_level: RiskLevel;
  claimed_amount: number;
  approved_amount: number | null;
  fraud_score: number | null;
  ai_recommendation: AIRecommendation | null;
  ai_summary: string | null;
  incident_date: string;
  incident_description: string;
  submission_channel: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  policyholder_name?: string;
  policy_number?: string;
  policy_type?: string;
  adjuster_name?: string;
}

export interface ClaimDetail extends Claim {
  policyholder_email?: string;
  policyholder_phone?: string;
  policy_start_date?: string;
  policy_end_date?: string;
  coverage_amount?: number;
  premium_amount?: number;
  state?: string;
  country?: string;
  adjuster_email?: string;
}

export interface FraudFlag {
  id: string;
  claim_id: string;
  flag_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
}

export interface AuditLogEntry {
  id: string;
  claim_id: string;
  performed_by: string;
  performed_by_name: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string;
  performed_at: string;
}

export interface Evidence {
  id: string;
  claim_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  evidence_type: string;
  uploaded_at: string;
}

export interface Policyholder {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  policy_number: string;
  policy_type: string;
  policy_start_date: string;
  policy_end_date: string;
  coverage_amount: number;
  premium_amount: number;
  address: string;
  state: string;
  country: string;
  created_at: string;
}

export interface DashboardStats {
  totals: {
    total: string;
    total_claimed: string;
    total_approved: string;
  };
  by_status: Array<{ status: ClaimStatus; count: string }>;
  by_risk: Array<{ risk_level: RiskLevel; count: string }>;
  recent_claims: Claim[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'adjuster' | 'supervisor';
}
