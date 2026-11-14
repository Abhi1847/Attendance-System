import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, UserCheck, Lock, Mail, Phone, Building2, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EmployeeInvitation } from '../../types';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const encodedData = searchParams.get('data');
  const navigate = useNavigate();
  const { invitations, acceptInvitationAndRegister, importInvitationIfMissing } = useAppData();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [invitation, setInvitation] = useState<EmployeeInvitation | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Headquarters');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    // 1. Try finding in loaded invitations
    const found = invitations.find(i => i.token === token);
    if (found) {
      setInvitation(found);
      return;
    }

    // 2. If not found (e.g. opened in a different browser, incognito window, or new device in frontend demo mode)
    // Decode from url data parameter if present
    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(encodedData));
        const recoveredInv: EmployeeInvitation = {
          id: decoded.id || `INV-${Date.now().toString().slice(-4)}`,
          name: decoded.name || 'Invited Employee',
          email: decoded.email || '',
          llcName: decoded.llcName || 'Acme Solutions LLC',
          jobLocation: decoded.jobLocation || 'California, US',
          role: decoded.role || 'employee',
          token,
          status: 'Pending',
          invitedAt: decoded.invitedAt || new Date().toISOString().split('T')[0]
        };
        setInvitation(recoveredInv);
        importInvitationIfMissing(recoveredInv);
        return;
      } catch (err) {
        console.warn('Failed to decode invitation payload', err);
      }
    }

    // 3. Fallback: If token format matches our generated format `inv_...`, auto-recover so incognito doesn't break
    if (token.startsWith('inv_')) {
      const fallbackInv: EmployeeInvitation = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        name: 'Invited Employee',
        email: 'employee.invited@demo.com',
        llcName: 'Acme Solutions LLC',
        jobLocation: 'California, US',
        role: 'employee',
        token,
        status: 'Pending',
        invitedAt: new Date().toISOString().split('T')[0]
      };
      setInvitation(fallbackInv);
      importInvitationIfMissing(fallbackInv);
    }
  }, [token, encodedData, invitations, importInvitationIfMissing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) {
      error('Valid invitation token is required.');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = acceptInvitationAndRegister(token, password, {
        phone,
        area,
        fallbackInvitation: invitation
      });
      if (res.success && res.employee) {
        setIsSuccess(true);
        success('Account registered successfully!');
        // Automatically log them in as an employee
        await login(res.employee.email, 'employee', password);
        setTimeout(() => {
          navigate('/employee/dashboard');
        }, 1500);
      } else {
        error(res.message);
      }
    } catch (err) {
      error('An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid or Missing Invitation Link</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Employee registration requires an administrative invitation link. Please ask your administrator to send you an invitation or log into your existing account.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invitation?.status === 'Registered' && !isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invitation Already Used</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This invitation for <b>{invitation.email}</b> has already been accepted and registered. Please proceed to sign in with your password.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Complete Employee Registration</h2>
          <p className="text-sm text-slate-400 mt-1">Accept your company invitation and set up your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100/10">
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-blue-950 block text-sm">{invitation?.name}</span>
                <span className="text-blue-700 font-medium block">{invitation?.email}</span>
                <span className="text-gray-500 block mt-1">
                  Assigned to: <b className="text-gray-800">{invitation?.llcName}</b> • Location: <b className="text-gray-800">{invitation?.jobLocation}</b>
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Area / Division</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Headquarters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Registering Account...' : 'Complete Registration & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-blue-600 hover:underline font-semibold">
              Already have an account? Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

