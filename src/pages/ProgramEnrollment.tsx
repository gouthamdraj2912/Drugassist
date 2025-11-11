import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Program, Enrollment } from '../lib/supabase';

interface ProgramEnrollmentProps {
  onLogout: () => void;
}

const ProgramEnrollment: React.FC<ProgramEnrollmentProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [enrollNow, setEnrollNow] = useState(false);
  const [completedCheck, setCompletedCheck] = useState(false);
  const [statusSelection, setStatusSelection] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [completionDate, setCompletionDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [programsRes, enrollmentsRes] = await Promise.all([
        supabase.from('programs').select('*').order('name'),
        supabase.from('enrollments').select('*').eq('user_id', user.id),
      ]);

      if (programsRes.data) setPrograms(programsRes.data);
      if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSelect = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      setSelectedProgram(program);
      setEnrollNow(false);
      setCompletedCheck(false);
      setStatusSelection('');
      setShowDatePicker(false);
      setCompletionDate('');
    }
  };

  const handleEnrollNow = async () => {
    if (!user || !selectedProgram) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          program_id: selectedProgram.id,
          status: 'enrolled',
        });

      if (error) throw error;

      window.open('https://portal.copays.org/#/register', '_blank');

      await loadData();

      setTimeout(() => {
        onLogout();
      }, 1000);
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!user || !selectedProgram) return;

    const enrollment = enrollments.find(e => e.program_id === selectedProgram.id);
    if (!enrollment) return;

    if (status === 'completed') {
      setStatusSelection(status);
      setShowDatePicker(true);
      return;
    }

    try {
      const updateData = status === 'rejected'
        ? { status: null, updated_at: new Date().toISOString() }
        : { status, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollment.id);

      if (error) throw error;

      await loadData();
      setStatusSelection('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCompletionSubmit = async () => {
    if (!user || !selectedProgram || !completionDate) return;

    const enrollment = enrollments.find(e => e.program_id === selectedProgram.id);
    if (!enrollment) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'completed',
          completion_date: completionDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);

      if (error) throw error;

      await loadData();
      setShowDatePicker(false);
      setCompletionDate('');
      setStatusSelection('');
    } catch (error) {
      console.error('Error updating completion:', error);
    }
  };

  const getEnrollmentForProgram = (programId: string) => {
    return enrollments.find(e => e.program_id === programId);
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#531B93' }}>Program Enrollment</h1>
            <button
              onClick={onLogout}
              className="text-sm font-medium"
              style={{ color: '#009193' }}
            >
              Logout
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Program
              </label>
              <select
                onChange={(e) => handleProgramSelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedProgram?.id || ''}
              >
                <option value="">Choose a program...</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>

            {selectedProgram && (
              <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 mt-1" style={{ color: '#009193' }} />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#531B93' }}>{selectedProgram.name}</h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">Sponsor:</span>
                        <span className="text-gray-600">{selectedProgram.sponsor}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">Monetary Cap:</span>
                        <span className="text-gray-600">{selectedProgram.monetary_cap}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">Description:</span>
                        <span className="text-gray-600">{selectedProgram.description}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">Enrollment Link:</span>
                        <a
                          href={selectedProgram.enrollment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedProgram.enrollment_link}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {!getEnrollmentForProgram(selectedProgram.id) ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enrollNow"
                        checked={enrollNow}
                        onChange={(e) => setEnrollNow(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="enrollNow" className="text-sm font-medium text-gray-700">
                        Enroll Now
                      </label>
                    </div>

                    {enrollNow && (
                      <button
                        onClick={handleEnrollNow}
                        className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        style={{ backgroundColor: '#531B93' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                      >
                        Proceed to Enrollment
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="completedCheck"
                        checked={completedCheck}
                        onChange={(e) => {
                          setCompletedCheck(e.target.checked);
                          if (e.target.checked) {
                            setShowDatePicker(true);
                          } else {
                            setShowDatePicker(false);
                            setCompletionDate('');
                          }
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="completedCheck" className="text-sm font-medium text-gray-700">
                        Completed
                      </label>
                    </div>

                    {showDatePicker && completedCheck && (
                      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-700">
                            Completion Date
                          </label>
                        </div>
                        <input
                          type="date"
                          value={completionDate}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={async () => {
                            if (!user || !selectedProgram || !completionDate) return;
                            try {
                              const { error } = await supabase
                                .from('enrollments')
                                .insert({
                                  user_id: user.id,
                                  program_id: selectedProgram.id,
                                  status: 'completed',
                                  completion_date: completionDate,
                                });
                              if (error) throw error;
                              await loadData();
                              setShowDatePicker(false);
                              setCompletionDate('');
                              setCompletedCheck(false);
                            } catch (error) {
                              console.error('Error marking as completed:', error);
                            }
                          }}
                          className="w-full text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          style={{ backgroundColor: '#531B93' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">
                        You are enrolled in this program
                      </p>
                      {getEnrollmentForProgram(selectedProgram.id)?.status && (
                        <p className="text-green-700 text-sm mt-1">
                          Status: <span className="capitalize">{getEnrollmentForProgram(selectedProgram.id)?.status}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Update Status:</p>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleStatusChange('ongoing')}
                          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Clock className="w-5 h-5 text-orange-500" />
                          <span className="font-medium text-gray-700">Ongoing</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange('completed')}
                          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-700">Completed</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange('rejected')}
                          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-gray-700">Rejected</span>
                        </button>
                      </div>
                    </div>

                    {showDatePicker && (
                      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-700">
                            Completion Date
                          </label>
                        </div>
                        <input
                          type="date"
                          value={completionDate}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleCompletionSubmit}
                          className="w-full text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          style={{ backgroundColor: '#531B93' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#421680'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramEnrollment;
