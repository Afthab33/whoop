import React from 'react';
import { User } from 'lucide-react';

const ProfileSection = ({ fullName, username, profileImage }) => {
  return (
    <div className="flex items-center pt-2 px-7">
      {/* Avatar with border */}
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--bg-overlay)] flex-shrink-0 bg-[var(--card-bg)]">
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={fullName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <User size={28} className="text-[var(--text-muted)]" />
          </div>
        )}
      </div>
      
      {/* User name and handle with proper typography */}
      <div className="ml-3">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{fullName}</h2>
        <p className="text-[var(--text-muted)] text-xs font-medium">@{username}</p>
      </div>
    </div>
  );
};

export default ProfileSection;