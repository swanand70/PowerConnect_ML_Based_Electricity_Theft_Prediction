import React from 'react';
import { NavLink } from 'react-router-dom';
import { PowerConnectLogo } from '../common/PowerConnectLogo';
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  FileBarChart2,
  HelpCircle,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/inspections', label: 'Inspections', icon: ClipboardList },
  { to: '/employee/map', label: 'Inspection Map', icon: MapPin },
  { to: '/employee/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/employee/model-governance', label: 'Model Governance', icon: ShieldCheck },
  { to: '/employee/help', label: 'Help & Reference', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#000814] text-[#E0FBFC] flex flex-col justify-between border-r border-[#001D3D]
        transition-all duration-200 ease-in-out shrink-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full pointer-events-none'}
        lg:static lg:shadow-none
        ${isOpen ? 'lg:w-64 lg:translate-x-0 lg:pointer-events-auto' : 'lg:w-0 lg:-translate-x-full lg:overflow-hidden lg:border-r-0 lg:p-0 lg:pointer-events-none'}
      `}
      aria-label="Operational Navigation"
    >
      <div className="flex flex-col flex-1 min-h-0 w-64">
        {/* Header with Title and Collapse Button */}
        <div className="py-3.5 px-4 border-b border-[#001D3D] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <PowerConnectLogo size={24} />
            <div className="min-w-0">
              <span className="text-xs font-bold tracking-wide text-[#E0FBFC] block truncate">
                PowerConnect
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#9DB4C0] uppercase block truncate">
                Command Centre
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#9DB4C0] hover:text-[#E0FBFC] hover:bg-[#001D3D] transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#C2DFE3]/50 shrink-0 cursor-pointer"
            aria-label="Collapse navigation menu"
            title="Collapse Navigation (Alt+M)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation destinations */}
        <nav className="space-y-1 p-3 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#003566] text-[#E0FBFC] border border-[#C2DFE3]/30 shadow-xs'
                      : 'text-[#9DB4C0] hover:text-[#E0FBFC] hover:bg-[#001D3D]/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Intelligence Loop System Status Card */}
      <div className="p-4 border-t border-[#001D3D] bg-[#001D3D]/50 w-64">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#E0FBFC] mb-2">
          <Cpu className="w-3.5 h-3.5 text-[#E0FBFC]" />
          <span>Active Intelligence Model</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-[#9DB4C0] tabular-nums font-medium">
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="text-[#E0FBFC] font-semibold">XGBoost v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Decision Cutoff:</span>
            <span className="text-[#E0FBFC] font-semibold">0.65 (PR-AUC 0.316)</span>
          </div>
          <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-[#001D3D]">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[#E0FBFC]">Feedback Loop</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
