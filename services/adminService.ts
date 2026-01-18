
import { supabase } from './supabaseClient';

export interface AdminStats {
  total_users: number;
  total_lists: number;
  total_reviews: number;
}

export const AdminService = {
  /**
   * Admin istatistiklerini güvenli RPC üzerinden çeker.
   * RLS politikaları yüzünden standart 'count' sorguları çalışmaz.
   */
  async getStats(): Promise<AdminStats | null> {
    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
      console.error('Admin Stats Error:', error);
      throw new Error(error.message);
    }

    // Gelen veri JSON olduğu için tip dönüşümü gerekebilir
    return data as AdminStats;
  }
};
