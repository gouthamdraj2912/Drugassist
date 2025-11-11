import { supabase, Provider, UserProvider } from '../lib/supabase';

export const providerService = {
  async getAllProviders(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getUserProviders(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_providers')
      .select('provider_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(up => up.provider_id) || [];
  },

  async addProviderToUser(userId: string, providerId: string): Promise<UserProvider> {
    const { data, error } = await supabase
      .from('user_providers')
      .insert({ user_id: userId, provider_id: providerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeProviderFromUser(userId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('user_providers')
      .delete()
      .eq('user_id', userId)
      .eq('provider_id', providerId);

    if (error) throw error;
  },

  async createProvider(name: string): Promise<Provider> {
    const { data, error } = await supabase
      .from('providers')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
