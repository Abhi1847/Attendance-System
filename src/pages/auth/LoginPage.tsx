import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Shield, User, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate credentials
      if (role === 'admin') {
        if (email !== 'admin@demo.com' || password !== 'admin123') {
          error('Invalid Admin credentials. Use admin@demo.com / admin123');
          setLoading(false);
          return;
        }
      } else {
        if (email !== 'employee@demo.com' || password !== 'employee123') {
          error('Invalid Employee credentials. Use employee@demo.com / employee123');
          setLoading(false);
          return;
        }
      }

      await login(email, role);
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
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'admin'
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
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'employee'
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
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Password</label>
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
    </div>
  );
};

