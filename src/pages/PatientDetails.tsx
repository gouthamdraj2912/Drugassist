import React, { useState, useEffect } from 'react';
import { Building2, UserSquare2, Pill, Mail, Phone, MapPin, Hash } from 'lucide-react';
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

  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [isOtherClinic, setIsOtherClinic] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');

  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<Provider | null>(null);
  const [isOtherProvider, setIsOtherProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');

  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [isOtherDrug, setIsOtherDrug] = useState(false);
  const [newDrugName, setNewDrugName] = useState('');
  const [drugPricing, setDrugPricing] = useState<DrugPricing | null>(null);

  const [loading, setLoading] = useState(true);

  const commonDrugs = [
    'Aspirin',
    'Ibuprofen',
    'Metformin',
    'Lisinopril',
    'Atorvastatin',
    'Omeprazole',
    'Losartan',
    'Amlodipine',
    'Metoprolol',
    'Albuterol'
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const drugName = isOtherDrug ? newDrugName : selectedDrug;

    if (drugName.trim()) {
      const timer = setTimeout(() => {
        const pricing = drugService.getDrugPricing(drugName.trim());
        setDrugPricing(pricing);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDrugPricing(null);
    }
  }, [selectedDrug, newDrugName, isOtherDrug]);

  useEffect(() => {
    if (selectedProviderId) {
      const provider = providers.find(p => p.id === selectedProviderId);
      if (provider) {
        setSelectedProviderDetails(provider);
      }
    } else {
      setSelectedProviderDetails(null);
    }
  }, [selectedProviderId, providers]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [clinicsData, providersData] = await Promise.all([
        clinicService.getAllClinics(),
        providerService.getAllProviders(),
      ]);

      setClinics(clinicsData);
      setProviders(providersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async () => {
    if (!user || !newClinicName.trim()) return;

    try {
      const newClinic = await clinicService.createClinic(newClinicName.trim());
      setClinics([...clinics, newClinic]);
      setSelectedClinicId(newClinic.id);
      setNewClinicName('');
      setIsOtherClinic(false);
    } catch (error) {
      console.error('Error creating clinic:', error);
    }
  };

  const handleCreateProvider = async () => {
    if (!user || !newProviderName.trim()) return;

    try {
      const newProvider = await providerService.createProvider(newProviderName.trim());
      setProviders([...providers, newProvider]);
      setSelectedProviderId(newProvider.id);
      setNewProviderName('');
      setIsOtherProvider(false);
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalDrugName = isOtherDrug ? newDrugName.trim() : selectedDrug;

    if (!finalDrugName) {
      alert('Please select or enter a drug name');
      return;
    }

    try {
      const pricing = await drugService.saveDrugWithPricing(user.id, finalDrugName);
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
      <div className="max-w-5xl mx-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Clinic
                  </label>
                  <select
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                    disabled={isOtherClinic}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a clinic...</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="otherClinic"
                    checked={isOtherClinic}
                    onChange={(e) => {
                      setIsOtherClinic(e.target.checked);
                      if (e.target.checked) {
                        setSelectedClinicId('');
                      } else {
                        setNewClinicName('');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="otherClinic" className="text-sm font-medium text-gray-700">
                    Other (Add new clinic)
                  </label>
                </div>

                {isOtherClinic && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new clinic name"
                      value={newClinicName}
                      onChange={(e) => setNewClinicName(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleCreateClinic}
                      className="text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: '#531B93' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <UserSquare2 className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Provider Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Provider
                  </label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    disabled={isOtherProvider}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a provider...</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="otherProvider"
                    checked={isOtherProvider}
                    onChange={(e) => {
                      setIsOtherProvider(e.target.checked);
                      if (e.target.checked) {
                        setSelectedProviderId('');
                      } else {
                        setNewProviderName('');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="otherProvider" className="text-sm font-medium text-gray-700">
                    Other (Add new provider)
                  </label>
                </div>

                {isOtherProvider && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new provider name"
                      value={newProviderName}
                      onChange={(e) => setNewProviderName(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleCreateProvider}
                      className="text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: '#531B93' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                    >
                      Add
                    </button>
                  </div>
                )}

                {selectedProviderDetails && !isOtherProvider && (
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-lg mb-3" style={{ color: '#531B93' }}>
                      Provider Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <UserSquare2 className="w-4 h-4" style={{ color: '#009193' }} />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedProviderDetails.name}</span>
                      </div>
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
                        <div className="flex items-center gap-2 md:col-span-2">
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
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Pill className="w-6 h-6" style={{ color: '#009193' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#531B93' }}>Drug Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Drug
                  </label>
                  <select
                    value={selectedDrug}
                    onChange={(e) => setSelectedDrug(e.target.value)}
                    disabled={isOtherDrug}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required={!isOtherDrug}
                  >
                    <option value="">Select a drug...</option>
                    {commonDrugs.map(drug => (
                      <option key={drug} value={drug}>{drug}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="otherDrug"
                    checked={isOtherDrug}
                    onChange={(e) => {
                      setIsOtherDrug(e.target.checked);
                      if (e.target.checked) {
                        setSelectedDrug('');
                      } else {
                        setNewDrugName('');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="otherDrug" className="text-sm font-medium text-gray-700">
                    Other (Enter different drug)
                  </label>
                </div>

                {isOtherDrug && (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter drug name"
                      value={newDrugName}
                      onChange={(e) => setNewDrugName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Pricing information will automatically appear as you type</p>
                  </div>
                )}

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
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      This drug will be saved to your patient profile (User ID: {user?.id.substring(0, 8)}...)
                    </p>
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
