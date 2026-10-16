import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, ArrowUpRight } from 'lucide-react';
import { PowerConnectLogo } from '../common/PowerConnectLogo';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#0B0C0E] text-[#9A9FA8] border-t border-[#292C32] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <PowerConnectLogo size={28} />
              <div>
                <span className="text-sm font-bold tracking-tight text-[#F3F4F5] block">
                  PowerConnect
                </span>
                <span className="text-[10px] text-[#9A9FA8] block">
                  Electricity Theft Intelligence & Inspection Platform
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed max-w-md text-[#9A9FA8]">
              A unified digital gateway for consumers, utility employees and official board updates. Built for modern electricity distribution management and intelligence.
            </p>
            <div className="pt-1 text-[11px] font-medium text-[#6E737D]">
              State Electricity Distribution Board • Operational Services Gateway
            </div>
          </div>

          {/* Service Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F5]">
              Service Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/consumer-portal"
                  className="transition-colors flex items-center gap-1 group text-[#9A9FA8] hover:text-[#F3F4F5]"
                >
                  <span>Consumer Portal</span>
                  <ArrowUpRight className="w-3 h-3 transition-colors text-[#6E737D] group-hover:text-[#9A9FA8]" />
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="transition-colors flex items-center gap-1 group text-[#9A9FA8] hover:text-[#F3F4F5]"
                >
                  <span>Employee Workspace</span>
                  <ArrowUpRight className="w-3 h-3 transition-colors text-[#6E737D] group-hover:text-[#9A9FA8]" />
                </Link>
              </li>
              <li>
                <Link
                  to="/board-communication"
                  className="transition-colors flex items-center gap-1 group text-[#9A9FA8] hover:text-[#F3F4F5]"
                >
                  <span>Board Communication</span>
                  <ArrowUpRight className="w-3 h-3 transition-colors text-[#6E737D] group-hover:text-[#9A9FA8]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional helpline & notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F3F4F5]">
              Helpline & Support
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-[#9A9FA8]">
                <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8AA8FF]" />
                <div>
                  <span className="block text-[11px] text-[#6E737D]">
                    Central Electricity Helpline
                  </span>
                  <strong className="text-[#F3F4F5]">1912</strong>{' '}
                  <span className="text-[11px] text-[#6E737D]">
                    (Toll Free, 24x7)
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-[#6E737D]">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#6E737D]" />
                <span>Authorized Inspection Operations Support Desk</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#292C32] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6E737D] gap-3">
          <div>
            © {new Date().getFullYear()} PowerConnect. State Electricity Distribution Board.
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/board-communication"
              className="transition-colors hover:text-[#9A9FA8]"
            >
              Official Bulletins
            </Link>
            <span>•</span>
            <Link
              to="/login"
              className="transition-colors hover:text-[#9A9FA8]"
            >
              Employee Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
