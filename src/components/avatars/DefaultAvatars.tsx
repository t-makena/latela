import * as React from "react";

interface AvatarProps {
  className?: string;
}

export const FemaleAvatar: React.FC<AvatarProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle */}
    <circle cx="50" cy="50" r="50" fill="currentColor" className="text-muted" />
    
    {/* Long wavy hair */}
    <path
      d="M20 45C20 45 18 65 22 80C24 87 28 92 35 95C35 95 30 75 32 60C34 45 38 35 50 30C62 35 66 45 68 60C70 75 65 95 65 95C72 92 76 87 78 80C82 65 80 45 80 45C80 30 68 15 50 15C32 15 20 30 20 45Z"
      fill="currentColor"
      className="text-foreground"
    />
    
    {/* Face */}
    <ellipse cx="50" cy="55" rx="22" ry="26" fill="currentColor" className="text-muted" />
    
    {/* Hair bangs */}
    <path
      d="M30 40C30 40 35 30 50 28C65 30 70 40 70 40C70 40 65 35 50 33C35 35 30 40 30 40Z"
      fill="currentColor"
      className="text-foreground"
    />
    
    {/* Left eye */}
    <ellipse cx="40" cy="52" rx="3" ry="2" fill="currentColor" className="text-foreground" />
    
    {/* Right eye */}
    <ellipse cx="60" cy="52" rx="3" ry="2" fill="currentColor" className="text-foreground" />
    
    {/* Nose */}
    <path
      d="M50 55L48 62H52L50 55Z"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      className="text-foreground"
    />
    
    {/* Lips */}
    <path
      d="M44 68C44 68 47 71 50 71C53 71 56 68 56 68"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      className="text-foreground"
    />
  </svg>
);

export const MaleAvatar: React.FC<AvatarProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle */}
    <circle cx="50" cy="50" r="50" fill="currentColor" className="text-muted" />
    
    {/* Curly hair */}
    <path
      d="M25 40C25 25 35 15 50 15C65 15 75 25 75 40C75 40 78 35 78 42C78 48 75 50 75 50C75 50 72 45 70 45C70 45 72 40 70 35C68 30 62 25 50 25C38 25 32 30 30 35C28 40 30 45 30 45C28 45 25 50 25 50C25 50 22 48 22 42C22 35 25 40 25 40Z"
      fill="currentColor"
      className="text-foreground"
    />
    
    {/* Additional curls */}
    <circle cx="30" cy="35" r="5" fill="currentColor" className="text-foreground" />
    <circle cx="40" cy="25" r="4" fill="currentColor" className="text-foreground" />
    <circle cx="50" cy="22" r="4" fill="currentColor" className="text-foreground" />
    <circle cx="60" cy="25" r="4" fill="currentColor" className="text-foreground" />
    <circle cx="70" cy="35" r="5" fill="currentColor" className="text-foreground" />
    
    {/* Face */}
    <ellipse cx="50" cy="55" rx="20" ry="24" fill="currentColor" className="text-muted" />
    
    {/* Left eyebrow */}
    <path
      d="M36 46C36 46 38 44 42 44C46 44 48 46 48 46"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      className="text-foreground"
    />
    
    {/* Right eyebrow */}
    <path
      d="M52 46C52 46 54 44 58 44C62 44 64 46 64 46"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      className="text-foreground"
    />
    
    {/* Left eye */}
    <ellipse cx="42" cy="52" rx="3" ry="2" fill="currentColor" className="text-foreground" />
    
    {/* Right eye */}
    <ellipse cx="58" cy="52" rx="3" ry="2" fill="currentColor" className="text-foreground" />
    
    {/* Nose */}
    <path
      d="M50 54L48 62H52L50 54Z"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      className="text-foreground"
    />
    
    {/* Mustache */}
    <path
      d="M38 68C38 68 42 65 50 65C58 65 62 68 62 68C62 68 58 70 50 70C42 70 38 68 38 68Z"
      fill="currentColor"
      className="text-foreground"
    />
  </svg>
);

export const getAvatarComponent = (avatarId: string | null): React.FC<AvatarProps> | null => {
  switch (avatarId) {
    case 'female':
      return FemaleAvatar;
    case 'male':
      return MaleAvatar;
    default:
      return null;
  }
};
