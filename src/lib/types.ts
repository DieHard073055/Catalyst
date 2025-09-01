// Database types
export interface UserProfile {
  id: string;
  username: string | null;
  role: 'admin' | 'premium' | 'free';
  credits: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: number;
  name: string;
  description: string | null;
  required_role: string;
  credit_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface CreditTransaction {
  id: number;
  user_id: string;
  amount: number;
  transaction_type: 'grant' | 'usage' | 'adjustment' | 'refund';
  feature_used: string | null;
  admin_notes: string | null;
  granted_by: string | null;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  permissions: string[];
  created_at: string;
}