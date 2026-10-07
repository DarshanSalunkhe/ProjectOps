import { useMemo } from 'react';

/**
 * Avatar component with initials fallback
 * Shows profile photo if available, otherwise shows initials with colored background
 */
const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const sizeClass = sizes[size] || sizes.md;

  // Generate initials from name
  const initials = useMemo(() => {
    if (!user?.name) return '?';
    
    const parts = user.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [user?.name]);

  // Generate consistent color based on name hash
  const backgroundColor = useMemo(() => {
    if (!user?.name) return '#6B7280'; // gray-500
    
    const colors = [
      '#EF4444', // red-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
    ];
    
    let hash = 0;
    for (let i = 0; i < user.name.length; i++) {
      hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, [user?.name]);

  if (user?.profile_photo_url) {
    return (
      <div className="relative inline-block">
        <img
          src={user.profile_photo_url}
          alt={user.name || 'User avatar'}
          className={`${sizeClass} rounded-full object-cover ${className}`}
          onError={(e) => {
            // On image load error, hide image and show initials fallback
            e.target.style.display = 'none';
            const fallback = e.target.nextElementSibling;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
          style={{ backgroundColor, display: 'none' }}
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
