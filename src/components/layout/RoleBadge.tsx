import React from 'react';
import { UserRole } from '../../types/auth.types';
import { ROLE_BADGE_CONFIG } from '../../utils/constants';
import { Shield, UserCheck, Stethoscope } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RoleBadge: React.FC<{ role?: UserRole; className?: string }> = ({ role, className }) => {
  if (!role) return null;
  const config = ROLE_BADGE_CONFIG[role];

  const renderIcon = () => {
    switch (role) {
      case 'HOSPITAL_ADMIN':
        return <Shield className="w-3.5 h-3.5 mr-1" />;
      case 'HOSPITAL_STAFF':
        return <UserCheck className="w-3.5 h-3.5 mr-1" />;
      case 'DOCTOR':
        return <Stethoscope className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        config.bg,
        config.text,
        className
      )}
    >
      {renderIcon()}
      {config.label}
    </span>
  );
};
