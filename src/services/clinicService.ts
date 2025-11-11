import { supabase, Clinic, UserClinic } from '../lib/supabase';

export const clinicService = {
  async getAllClinics(): Promise<Clinic[]> {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getUserClinics(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_clinics')
      .select('clinic_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(uc => uc.clinic_id) || [];
  },

  async addClinicToUser(userId: string, clinicId: string): Promise<UserClinic> {
    const { data, error } = await supabase
      .from('user_clinics')
      .insert({ user_id: userId, clinic_id: clinicId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeClinicFromUser(userId: string, clinicId: string): Promise<void> {
    const { error } = await supabase
      .from('user_clinics')
      .delete()
      .eq('user_id', userId)
      .eq('clinic_id', clinicId);

    if (error) throw error;
  },

  async createClinic(name: string): Promise<Clinic> {
    const { data, error } = await supabase
      .from('clinics')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
