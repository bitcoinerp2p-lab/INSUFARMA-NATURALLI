import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export default function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className = "",
}: StarRatingProps) {
  const clampedRating = Math.min(Math.max(0, rating), maxStars);
  const fullStars = Math.floor(clampedRating);
  const hasHalf = clampedRating - fullStars >= 0.5;
  const iconClass = sizeMap[size];
  const textClass = textSizeMap[size];

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`Avaliação: ${clampedRating} de ${maxStars} estrelas`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const filled = i < fullStars;
          const half = !filled && i === fullStars && hasHalf;

          return (
            <span key={i} className="relative inline-block">
              {/* Empty star (base) */}
              <Star className={`${iconClass} text-gray-200`} fill="currentColor" />

              {/* Filled or half overlay */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star
                    className={`${iconClass} text-brand-gold`}
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {(showValue || reviewCount !== undefined) && (
        <span className={`${textClass} text-gray-500 leading-none`}>
          {showValue && (
            <span className="font-medium text-gray-700">
              {clampedRating.toFixed(1)}
            </span>
          )}
          {showValue && reviewCount !== undefined && (
            <span className="mx-0.5">&nbsp;</span>
          )}
          {reviewCount !== undefined && (
            <span>
              ({reviewCount})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
