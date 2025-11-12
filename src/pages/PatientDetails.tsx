import React, { useState, useEffect } from 'react';
import { Building2, UserSquare2, Pill, Plus, X, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Clinic, Provider } from '../lib/supabase';
import { clinicService } from '../services/clinicService';
import { providerService } from '../services/providerService';
import { drugService, DrugPricing } from '../services/drugService';

interface PatientDetailsProps {
  onNext: () => void;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ onNext }) => {
  const { user } = useAuth();

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userClinics, setUserClinics] = useState<string[]>([]);
  const [userProviders, setUserProviders] = useState<string[]>([]);

  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<Provider | null>(null);
  const [displayedProviders, setDisplayedProviders] = useState<Provider[]>([]);

  const [drugName, setDrugName] = useState('');
  const [drugPricing, setDrugPricing] = useState<DrugPricing | null>(null);

  const [newClinicName, setNewClinicName] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (drugName.trim()) {
      const timer = setTimeout(() => {
        const pricing = drugService.getDrugPricing(drugName.trim());
        setDrugPricing(pricing);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDrugPricing(null);
    }
  }, [drugName]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [clinicsData, providersData, userClinicsData, userProvidersData] = await Promise.all([
        clinicService.getAllClinics(),
        providerService.getAllProviders(),
        clinicService.getUserClinics(user.id),
        providerService.getUserProviders(user.id),
      ]);

      setClinics(clinicsData);
      setProviders(providersData);
      setUserClinics(userClinicsData);
      setUserProviders(userProvidersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshClinics = async () => {
    if (!user) return;
    try {
      const [clinicsData, userClinicsData] = await Promise.all([
        clinicService.getAllClinics(),
        clinicService.getUserClinics(user.id),
      ]);
      setClinics(clinicsData);
      setUserClinics(userClinicsData);
    } catch (error) {
      console.error('Error refreshing clinics:', error);
    }
  };

  const refreshProviders = async () => {
    if (!user) return;
    try {
      const [providersData, userProvidersData] = await Promise.all([
        providerService.getAllProviders(),
        providerService.getUserProviders(user.id),
      ]);
      setProviders(providersData);
      setUserProviders(userProvidersData);
    } catch (error) {
      console.error('Error refreshing providers:', error);
    }
  };

  const handleAddClinic = (clinicId: string) => {
    if (userClinics.includes(clinicId)) return;
    setUserClinics([...userClinics, clinicId]);
  };

  const handleRemoveClinic = (e: React.MouseEvent, clinicId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setUserClinics(userClinics.filter(id => id !== clinicId));

    if (selectedClinicId === clinicId) {
      setSelectedClinicId('');
      setSelectedProviderId('');
      setSelectedProviderDetails(null);
      setDisplayedProviders([]);
    }
  };

  const handleAddProvider = (providerId: string) => {
    if (userProviders.includes(providerId)) return;
    setUserProviders([...userProviders, providerId]);
  };

  const handleRemoveProvider = (e: React.MouseEvent, providerId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setUserProviders(userProviders.filter(id => id !== providerId));
  };

  const handleCreateClinic = async () => {
    if (!user || !newClinicName.trim()) return;

    try {
      const newClinic = await clinicService.createClinic(newClinicName.trim());

      setClinics([...clinics, newClinic]);
      setUserClinics([...userClinics, newClinic.id]);
      setNewClinicName('');
    } catch (error) {
      console.error('Error creating clinic:', error);
    }
  };

  const handleCreateProvider = async () => {
    if (!user || !newProviderName.trim()) return;

    try {
      const newProvider = await providerService.createProvider(newProviderName.trim());

      setProviders([...providers, newProvider]);
      setUserProviders([...userProviders, newProvider.id]);
      setNewProviderName('');
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  const handleClinicSelect = async (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setSelectedProviderId('');
    setSelectedProviderDetails(null);
    setDisplayedProviders([]);
  };

  const handleProviderSelect = async (providerId: string) => {
    setSelectedProviderId(providerId);

    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProviderDetails(provider);
    }
  };

  const handleAddProviderToDisplay = () => {
    if (!selectedProviderDetails) return;

    const alreadyDisplayed = displayedProviders.some(p => p.id === selectedProviderDetails.id);
    if (!alreadyDisplayed) {
      setDisplayedProviders([...displayedProviders, selectedProviderDetails]);
    }

    setSelectedProviderId('');
  };

  const handleRemoveProviderFromDisplay = (providerId: string) => {
    setDisplayedProviders(displayedProviders.filter(p => p.id !== providerId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !drugName.trim()) return;

    try {
      const pricing = await drugService.saveDrugWithPricing(user.id, drugName.trim());
      setDrugPricing(pricing);

      setTimeout(() => {
        onNext();
      }, 2000);
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
      <div className="max-w-6xl mx-auto">
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
                    {userClinics.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No clinics selected</p>
                    ) : (
                      userClinics.map(clinicId => {
                        const clinic = clinics.find(c => c.id === clinicId);
                        return clinic ? (
                          <span
                            key={clinic.id}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {clinic.name}
                            <button
                              onClick={(e) => handleRemoveClinic(e, clinic.id)}
                              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Clinic (Context)
                    </label>
                    <select
                      value={selectedClinicId}
                      onChange={(e) => handleClinicSelect(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a clinic...</option>
                      {userClinics.map(clinicId => {
                        const clinic = clinics.find(c => c.id === clinicId);
                        return clinic ? (
                          <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                        ) : null;
                      })}
                    </select>
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
                    {userProviders.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No providers selected</p>
                    ) : (
                      userProviders.map(providerId => {
                        const provider = providers.find(p => p.id === providerId);
                        return provider ? (
                          <span
                            key={provider.id}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {provider.name}
                            <button
                              onClick={(e) => handleRemoveProvider(e, provider.id)}
                              className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                </div>

                {selectedClinicId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Select Provider for: <span className="font-bold" style={{ color: '#531B93' }}>
                        {clinics.find(c => c.id === selectedClinicId)?.name}
                      </span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <select
                          value={selectedProviderId}
                          onChange={(e) => handleProviderSelect(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a provider...</option>
                          {userProviders.map(providerId => {
                            const provider = providers.find(p => p.id === providerId);
                            return provider ? (
                              <option key={provider.id} value={provider.id}>{provider.name}</option>
                            ) : null;
                          })}
                        </select>
                      </div>

                      {selectedProviderDetails && (
                        <button
                          type="button"
                          onClick={handleAddProviderToDisplay}
                          className="text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#009193' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007b7d'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009193'}
                        >
                          <Plus className="w-4 h-4" />
                          Add to Display
                        </button>
                      )}
                    </div>

                    {selectedProviderDetails && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-lg mb-3" style={{ color: '#531B93' }}>
                          {selectedProviderDetails.name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedProviderDetails.specialty && (
                            <div className="flex items-center gap-2">
                              <UserSquare2 className="w-4 h-4" style={{ color: '#009193' }} />
                              <span className="text-gray-600">Specialty:</span>
                              <span className="font-medium">{selectedProviderDetails.specialty}</span>
                            </div>
                          )}
                          {selectedProviderDetails.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" style={{ color: '#009193' }} />
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium">{selectedProviderDetails.contact_email}</span>
                            </div>
                          )}
                          {selectedProviderDetails.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" style={{ color: '#009193' }} />
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-medium">{selectedProviderDetails.contact_phone}</span>
                            </div>
                          )}
                          {selectedProviderDetails.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" style={{ color: '#009193' }} />
                              <span className="text-gray-600">Address:</span>
                              <span className="font-medium">{selectedProviderDetails.address}</span>
                            </div>
                          )}
                          {selectedProviderDetails.npi_number && (
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4" style={{ color: '#009193' }} />
                              <span className="text-gray-600">NPI:</span>
                              <span className="font-medium">{selectedProviderDetails.npi_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {displayedProviders.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Added Provider Details (UI Only):</p>
                    <div className="space-y-3">
                      {displayedProviders.map(provider => (
                        <div key={provider.id} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-gray-200 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveProviderFromDisplay(provider.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <h3 className="font-semibold text-lg mb-3 pr-8" style={{ color: '#531B93' }}>
                            {provider.name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {provider.specialty && (
                              <div className="flex items-center gap-2">
                                <UserSquare2 className="w-4 h-4" style={{ color: '#009193' }} />
                                <span className="text-gray-600">Specialty:</span>
                                <span className="font-medium">{provider.specialty}</span>
                              </div>
                            )}
                            {provider.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" style={{ color: '#009193' }} />
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{provider.contact_email}</span>
                              </div>
                            )}
                            {provider.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" style={{ color: '#009193' }} />
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">{provider.contact_phone}</span>
                              </div>
                            )}
                            {provider.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" style={{ color: '#009193' }} />
                                <span className="text-gray-600">Address:</span>
                                <span className="font-medium">{provider.address}</span>
                              </div>
                            )}
                            {provider.npi_number && (
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4" style={{ color: '#009193' }} />
                                <span className="text-gray-600">NPI:</span>
                                <span className="font-medium">{provider.npi_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Provider to Your List
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
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Pill className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Drug Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drug Name
                  </label>
                  <input
                    type="text"
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter drug name (pricing will auto-fetch)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Pricing information will automatically appear as you type</p>
                </div>

                {drugPricing && (
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#531B93' }}>
                      Pricing for {drugPricing.drugName}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Weekly</p>
                        <p className="text-xl font-bold" style={{ color: '#009193' }}>
                          ${drugPricing.weekly}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Monthly</p>
                        <p className="text-xl font-bold" style={{ color: '#009193' }}>
                          ${drugPricing.monthly}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Yearly</p>
                        <p className="text-xl font-bold" style={{ color: '#009193' }}>
                          ${drugPricing.yearly}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
