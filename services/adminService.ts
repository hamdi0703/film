
import { supabase } from './supabaseClient';

export interface ChartPoint {
  date: string;
  count: number;
}

export interface AdminDashboardData {
  total_users: number;
  total_lists: number;
  total_reviews: number;
  new_users_monthly: number;
  new_lists_monthly: number;
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
