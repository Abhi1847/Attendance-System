import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarPlus,
  History,
  FileText,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { LeaveRequest } from '../types';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'Apply for Leave', icon: CalendarPlus, path: '/employee/apply-leave' },
  { label: 'Leave History', icon: History, path: '/employee/leave-history' },
  { label: 'My Profile', icon: User, path: '/employee/profile' },
];

export const EmployeeLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { leaveRequests } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const myPendingLeaves = leaveRequests.filter(
    (r: LeaveRequest) => r.employeeId === (user?.employeeId || 'EMP002') && r.status === 'Pending'
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = NAV_ITEMS.find(n => location.pathname.startsWith(n.path));
    return item ? item.label : 'Employee Self-Service';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/60 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Navy (#0F172A) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block">AttendFlow</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block -mt-1">
                  Employee Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="px-3 py-6 space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.label === 'Leave History' && myPendingLeaves > 0 && (
                    <span className="bg-amber-500 text-slate-950 font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                      {myPendingLeaves}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900/80 mb-2">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
              alt={user?.name}
              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
            />
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-emerald-400 truncate">
                {user?.designation || 'Staff Member'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
          {/* Top Navbar */}
            <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 hidden sm:block">{getPageTitle()}</h1>
              </div>

              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Status: Active Duty</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-xl object-cover border border-gray-200"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900">{user?.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <NavLink
                        to="/employee/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>My Profile</span>
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Dynamic Page Content */}
              <main className="p-4 sm:p-8 flex-1 flex flex-col">
                <Outlet />
              </main>
            </div>
        </div>
        );
};
