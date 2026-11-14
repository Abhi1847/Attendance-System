import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { AuthService } from '../../services/mock/storageService';
import { Sparkles, Shield, User, Lock, Mail, ArrowRight, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { requestPasswordChange, employees } = useAppData();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotReason, setForgotReason] = useState('');

  const handleSelectRole = (selectedRole: 'admin' | 'employee') => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setEmail('admin@demo.com');
      setPassword('admin123');
    } else {
      setEmail('employee@demo.com');
      setPassword('employee123');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      error('Please enter your employee email address.');
      return;
    }
    const matched = employees.find(emp => emp.email.toLowerCase() === forgotEmail.toLowerCase());
    const empId = matched ? matched.id : 'EMP-UNKNOWN';
    const empName = matched ? matched.name : forgotEmail.split('@')[0];

    requestPasswordChange(empId, empName, forgotEmail, forgotReason);
    success('Password change request submitted! Administrator will review and approve your request.');
    setForgotModalOpen(false);
    setForgotReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const registeredCreds = AuthService.getRegisteredCredentials();
      const userEmailKey = email.trim().toLowerCase();

      // Validate credentials
      if (role === 'admin') {
        const expected = registeredCreds['admin@demo.com'] || 'admin123';
        if (userEmailKey !== 'admin@demo.com' || password !== expected) {
          error(`Invalid Admin credentials. Use admin@demo.com / ${expected}`);
          setLoading(false);
          return;
        }
      } else {
        const expected = registeredCreds[userEmailKey];
        if (!expected) {
          // If not in registered map, test against fallback employee@demo.com / employee123
          if (userEmailKey !== 'employee@demo.com' || password !== 'employee123') {
            error('Invalid Employee credentials. If you were invited, please complete registration first.');
            setLoading(false);
            return;
          }
        } else if (password !== expected) {
          error('Incorrect password. If you forgot your password, submit a Password Change Request to admin.');
          setLoading(false);
          return;
        }
      }

      await login(email, role, password);
      success(`Welcome back! Signed in as ${role === 'admin' ? 'Administrator' : 'Employee'}.`);

      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      error('Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AttendFlow</h2>
          <p className="text-sm text-slate-400 mt-1">Enterprise Attendance & Leave Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100/10">
          {/* Role Switcher Pill */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${role === 'admin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('employee')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${role === 'employee'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Employee Portal</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/50"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 block">Password</label>
                {role === 'employee' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Request Password Change
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Employee'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Preset Helper Card */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Demo Test Accounts
            </p>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div
                onClick={() => handleSelectRole('admin')}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-blue-50/50 cursor-pointer transition border border-gray-100"
              >
                <div>
                  <span className="font-semibold text-gray-800">Admin: </span>
                  <span className="text-gray-500">admin@demo.com</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">admin123</span>
              </div>
              <div
                onClick={() => handleSelectRole('employee')}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-blue-50/50 cursor-pointer transition border border-gray-100"
              >
                <div>
                  <span className="font-semibold text-gray-800">Employee: </span>
                  <span className="text-gray-500">employee@demo.com</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">employee123</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>Frontend Demo Mode: LocalStorage enabled, zero backend setup required.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Password Change Request Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setForgotModalOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 p-6 z-10 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Request Password Reset</h3>
                  <p className="text-xs text-gray-500">
                    Employees cannot change passwords directly. Submit a request to the administrator for review and approval.
                  </p>
                </div>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Your Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="employee@demo.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Reason for Change (Optional)</label>
                  <textarea
                    rows={2}
                    value={forgotReason}
                    onChange={e => setForgotReason(e.target.value)}
                    placeholder="e.g. Forgot existing credentials, security policy..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Your company administrator will review and generate a temporary password for your account in the Admin Panel.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

