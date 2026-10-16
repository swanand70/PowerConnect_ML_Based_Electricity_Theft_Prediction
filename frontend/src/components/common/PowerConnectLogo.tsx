import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export interface PowerConnectLogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

/**
 * Standardized PowerConnect Vector Logo Mark
 * Represents electricity transmission infrastructure + smart grid connectivity
 */
export const PowerConnectLogo: React.FC<PowerConnectLogoProps> = ({
  size = 32,
  className = '',
  iconOnly = false
}) => {
  if (iconOnly) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="2" fill="currentColor" fillOpacity="0.85" />
        <path d="M6.5 6.5L9.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
        <path d="M14 2L6 13h7l-2 9 10-12h-7l2-8z" fill="currentColor" />
        <circle cx="19" cy="19" r="2" fill="currentColor" fillOpacity="0.85" />
        <path d="M14.5 14.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
      </svg>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-lg bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.625)}
        height={Math.round(size * 0.625)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="5" cy="5" r="2" fill="white" fillOpacity="0.9" />
        <path d="M6.5 6.5L9.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M14 2L6 13h7l-2 9 10-12h-7l2-8z" fill="white" />
        <circle cx="19" cy="19" r="2" fill="white" fillOpacity="0.9" />
        <path d="M14.5 14.5l3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.85" />
      </svg>
    </div>
  );
};

export interface PowerConnectBrandProps {
  descriptor?: string;
  badge?: string;
  linkTo?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hideDescriptorOnMobile?: boolean;
}

/**
 * Standardized PowerConnect Wordmark & Brand Identity Component
 * Used across Employee, Consumer, Board and Public surfaces
 */
export const PowerConnectBrand: React.FC<PowerConnectBrandProps> = ({
  descriptor = 'Electricity Theft Intelligence & Inspection Platform',
  badge,
  linkTo = '/',
  size = 'md',
  className = '',
  hideDescriptorOnMobile = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pixelSize = size === 'sm' ? 26 : size === 'lg' ? 40 : 32;
  const titleSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base';

  const brandContent = (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none min-w-0 ${className}`}>
      <PowerConnectLogo size={pixelSize} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 leading-tight">
          <span
            className={`font-bold tracking-tight truncate ${titleSizeClass} ${
              isDark ? 'text-[#F3F4F5] group-hover:text-white' : 'text-slate-900 group-hover:text-slate-950'
            }`}
          >
            PowerConnect
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
            aria-hidden="true"
          />
          {badge && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider ${
                isDark
                  ? 'bg-[#181B1F] border-[#292C32] text-[#9A9FA8]'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {descriptor && (
          <div
            className={`text-[10.5px] leading-tight truncate ${
              hideDescriptorOnMobile ? 'hidden sm:block' : 'block'
            } ${isDark ? 'text-[#9A9FA8]' : 'text-slate-500'}`}
          >
            {descriptor}
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 rounded-lg pr-1"
        aria-label="PowerConnect Home"
      >
        {brandContent}
      </Link>
    );
  }

  return brandContent;
};
