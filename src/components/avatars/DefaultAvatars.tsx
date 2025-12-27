import * as React from "react";

interface AvatarProps {
  className?: string;
}

export const DefaultAvatar: React.FC<AvatarProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle - adapts to light/dark mode */}
    <circle cx="50" cy="50" r="50" className="fill-white dark:fill-black" />
    
    {/* Mask for shoulders */}
    <mask id="avatarMask">
      <circle cx="50" cy="50" r="50" fill="white"/>
    </mask>
    
    {/* Shoulders - adapts to light/dark mode */}
    <g mask="url(#avatarMask)">
      <ellipse 
        cx="50" 
        cy="88" 
        rx="38" 
        ry="22" 
        className="fill-black dark:fill-white"
      />
    </g>
    
    {/* Head - adapts to light/dark mode */}
    <circle 
      cx="50" 
      cy="42" 
      r="18" 
      className="fill-black dark:fill-white"
    />
  </svg>
);

export const getAvatarComponent = (avatarId: string | null): React.FC<AvatarProps> | null => {
  // All avatar IDs now return the universal DefaultAvatar
  switch (avatarId) {
    case 'default':
    case 'female':
    case 'male':
      return DefaultAvatar;
    default:
      return null;
  }
};
