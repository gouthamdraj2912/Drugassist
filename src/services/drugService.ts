import { supabase } from '../lib/supabase';

export interface DrugPricing {
  drugName: string;
  weekly: number;
  monthly: number;
  yearly: number;
}

const DRUG_PRICE_MAP: Record<string, { weekly: number; monthly: number; yearly: number }> = {
  'aspirin': { weekly: 5, monthly: 20, yearly: 200 },
  'ibuprofen': { weekly: 8, monthly: 30, yearly: 300 },
  'metformin': { weekly: 15, monthly: 60, yearly: 600 },
  'lisinopril': { weekly: 12, monthly: 45, yearly: 450 },
  'atorvastatin': { weekly: 20, monthly: 75, yearly: 750 },
  'omeprazole': { weekly: 10, monthly: 40, yearly: 400 },
  'losartan': { weekly: 18, monthly: 70, yearly: 700 },
  'amlodipine': { weekly: 14, monthly: 55, yearly: 550 },
  'metoprolol': { weekly: 16, monthly: 65, yearly: 650 },
  'albuterol': { weekly: 25, monthly: 95, yearly: 950 },
};

const DEFAULT_PRICING = { weekly: 10, monthly: 40, yearly: 400 };

export const drugService = {
  async saveDrugDetails(userId: string, drugName: string): Promise<void> {
    const { error } = await supabase
      .from('drug_details')
      .insert({ user_id: userId, drug_name: drugName });

    if (error) throw error;
  },

  getDrugPricing(drugName: string): DrugPricing {
    const normalizedName = drugName.toLowerCase().trim();
    const pricing = DRUG_PRICE_MAP[normalizedName] || DEFAULT_PRICING;

    return {
      drugName,
      weekly: pricing.weekly,
      monthly: pricing.monthly,
      yearly: pricing.yearly,
    };
  },

  async saveDrugWithPricing(userId: string, drugName: string): Promise<DrugPricing> {
    await this.saveDrugDetails(userId, drugName);
    return this.getDrugPricing(drugName);
  }
};
