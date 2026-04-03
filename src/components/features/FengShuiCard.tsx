/**
 * FengShuiCard — renders a product's feng shui profile.
 *
 * WHY RSC: data is already on the product object — no extra fetch needed.
 * LAYOUT: gradient card, circular element icon, title, description, tag pills.
 */

interface FengShuiProfile {
  elementSymbol: string;
  elementName: string;
  elementNameVi?: string;
  description?: string;
  descriptionVi?: string;
  benefitTags: string[];
}

interface FengShuiCardProps {
  profile: FengShuiProfile;
  lang: string;
  className?: string;
}

export function FengShuiCard({ profile, lang, className = '' }: FengShuiCardProps) {
  const displayName = lang === 'vi' ? (profile.elementNameVi ?? profile.elementName) : profile.elementName;
  const displayDesc = lang === 'vi' ? (profile.descriptionVi ?? profile.description) : profile.description;

  return (
    <section
      className={`rounded-[14px] border border-(--color-sand-dark) bg-gradient-to-br from-[#f7f3ec] to-[#f0ebe0] p-5 ${className}`}
      aria-label="Feng Shui"
    >
      <p className="mb-3 text-[11px] font-600 uppercase tracking-[0.1em] text-(--color-muted)">
        {lang === 'vi' ? 'Phong thuỷ' : 'Feng Shui'}
      </p>

      <div className="flex items-start gap-4">
        {/* Element icon circle */}
        <div
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg, var(--color-cta-hover), var(--color-cta))' }}
          aria-hidden="true"
        >
          <span className="text-[22px] font-600 text-white leading-none">{profile.elementSymbol}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[17px] font-500 text-(--color-stone) leading-snug mb-1">
            {displayName}
          </p>

          {displayDesc && (
            <p className="text-[13px] leading-relaxed text-(--color-muted) mb-3">
              {displayDesc}
            </p>
          )}

          {profile.benefitTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.benefitTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-500"
                  style={{ background: 'rgba(158,140,108,0.12)', color: 'var(--color-agate-dark, var(--color-cta))' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
