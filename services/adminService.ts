
import { supabase } from './supabaseClient';

export interface ChartPoint {
  date: string;
  count: number;
}

export interface TopCurator {
  username: string;
  avatar_url: string;
  list_count: number;
}

export interface AdminDashboardData {
  // Counters
  total_users: number;
  total_lists: number;
  total_reviews: number;
  
  // Activity
  dau: number;
  mau: number;
  
  // Growth
  new_users_monthly: number;
  new_lists_monthly: number;
  
  // List Stats
  public_lists: number;
  private_lists: number;
  avg_list_size: number;
  
  // Health
  churn_candidates: number;
  retention_rate: number;
  
  // Complex Data
  top_curators: TopCurator[];
  chart_data: ChartPoint[];
}

export const AdminService = {
  /**
   * Admin dashboard verilerini çeker.
   * Güvenli RPC (get_admin_dashboard_data) kullanır.
   */
  async getDashboardData(): Promise<AdminDashboardData | null> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_data');

    if (error) {
      console.error('Admin Dashboard Error:', error);
      throw new Error(error.message);
    }

    return data as AdminDashboardData;
  }
};
