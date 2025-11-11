import React, { useState, useEffect } from 'react';
import { Building2, UserSquare2, Pill, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Clinic, Provider } from '../lib/supabase';

interface PatientDetailsProps {
  onNext: () => void;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ onNext }) => {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userClinics, setUserClinics] = useState<string[]>([]);
  const [userProviders, setUserProviders] = useState<string[]>([]);
  const [drugName, setDrugName] = useState('');
  const [newClinicName, setNewClinicName] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [clinicsRes, providersRes, userClinicsRes, userProvidersRes] = await Promise.all([
        supabase.from('clinics').select('*').order('name'),
        supabase.from('providers').select('*').order('name'),
        supabase.from('user_clinics').select('clinic_id').eq('user_id', user.id),
        supabase.from('user_providers').select('provider_id').eq('user_id', user.id),
      ]);

      if (clinicsRes.data) setClinics(clinicsRes.data);
      if (providersRes.data) setProviders(providersRes.data);
      if (userClinicsRes.data) setUserClinics(userClinicsRes.data.map(uc => uc.clinic_id));
      if (userProvidersRes.data) setUserProviders(userProvidersRes.data.map(up => up.provider_id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClinic = async (clinicId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_clinics')
        .insert({ user_id: user.id, clinic_id: clinicId });

      if (error) throw error;
      setUserClinics([...userClinics, clinicId]);
    } catch (error) {
      console.error('Error adding clinic:', error);
    }
  };

  const handleAddProvider = async (providerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_providers')
        .insert({ user_id: user.id, provider_id: providerId });

      if (error) throw error;
      setUserProviders([...userProviders, providerId]);
    } catch (error) {
      console.error('Error adding provider:', error);
    }
  };

  const handleCreateClinic = async () => {
    if (!user || !newClinicName.trim()) return;

    try {
      const { data: newClinic, error: insertError } = await supabase
        .from('clinics')
        .insert({ name: newClinicName.trim() })
        .select()
        .single();

      if (insertError) throw insertError;
      if (newClinic) {
        setClinics([...clinics, newClinic]);
        await handleAddClinic(newClinic.id);
        setNewClinicName('');
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
    }
  };

  const handleCreateProvider = async () => {
    if (!user || !newProviderName.trim()) return;

    try {
      const { data: newProvider, error: insertError } = await supabase
        .from('providers')
        .insert({ name: newProviderName.trim() })
        .select()
        .single();

      if (insertError) throw insertError;
      if (newProvider) {
        setProviders([...providers, newProvider]);
        await handleAddProvider(newProvider.id);
        setNewProviderName('');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !drugName.trim()) return;

    try {
      const { error } = await supabase
        .from('drug_details')
        .insert({ user_id: user.id, drug_name: drugName.trim() });

      if (error) throw error;
      onNext();
    } catch (error) {
      console.error('Error saving drug details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#531B93' }}>Patient Details</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Clinic Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Clinics:</p>
                  <div className="flex flex-wrap gap-2">
                    {userClinics.map(clinicId => {
                      const clinic = clinics.find(c => c.id === clinicId);
                      return clinic ? (
                        <span key={clinic.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {clinic.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Additional Clinic
                  </label>
                  <select
                    onChange={(e) => e.target.value && handleAddClinic(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value=""
                  >
                    <option value="">Select a clinic...</option>
                    {clinics.filter(c => !userClinics.includes(c.id)).map(clinic => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or create new clinic"
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleCreateClinic}
                    className="text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    style={{ backgroundColor: '#531B93' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <UserSquare2 className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Provider Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Providers:</p>
                  <div className="flex flex-wrap gap-2">
                    {userProviders.map(providerId => {
                      const provider = providers.find(p => p.id === providerId);
                      return provider ? (
                        <span key={provider.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {provider.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Provider
                  </label>
                  <select
                    onChange={(e) => e.target.value && handleAddProvider(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value=""
                  >
                    <option value="">Select a provider...</option>
                    {providers.filter(p => !userProviders.includes(p.id)).map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or create new provider"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleCreateProvider}
                    className="text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    style={{ backgroundColor: '#531B93' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Pill className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Drug Details</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug Name
                </label>
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter drug name"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                style={{ backgroundColor: '#531B93' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
              >
                Continue to Program Enrollment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
