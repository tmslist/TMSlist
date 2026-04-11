interface CommunityAuthorBadgeProps {
  authorName: string | null;
  authorRole: string;
  doctorName?: string;
  credential?: string;
  imageUrl?: string;
  size?: 'sm' | 'md';
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  clinic_owner: { label: 'Verified Specialist', color: 'bg-emerald-100 text-emerald-700' },
  admin: { label: 'TMS List Staff', color: 'bg-violet-100 text-violet-700' },
  editor: { label: 'TMS List Staff', color: 'bg-violet-100 text-violet-700' },
};

export default function CommunityAuthorBadge({
  authorName,
  authorRole,
  doctorName,
  credential,
  imageUrl,
  size = 'sm',
}: CommunityAuthorBadgeProps) {
  const badge = ROLE_BADGES[authorRole];
  const displayName = doctorName || authorName || 'Anonymous';
  const isSpecialist = authorRole === 'clinic_owner' && (doctorName || credential);
  const avatarSize = size === 'md' ? 'w-10 h-10' : 'w-7 h-7';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex items-center gap-2">
      {/* Avatar */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className={`${avatarSize} rounded-full object-cover ring-2 ${isSpecialist ? 'ring-emerald-300' : 'ring-gray-200'}`}
        />
      ) : (
        <div className={`${avatarSize} rounded-full flex items-center justify-center text-white font-bold ${
          isSpecialist ? 'bg-emerald-500' : badge ? 'bg-violet-500' : 'bg-gray-400'
        } ${size === 'md' ? 'text-sm' : 'text-[10px]'}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-gray-900 ${textSize}`}>
            {displayName}
            {credential && <span className="text-gray-500 font-normal">, {credential}</span>}
          </span>
          {badge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>
              {isSpecialist && (
                <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {badge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
