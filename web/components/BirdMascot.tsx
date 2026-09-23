/**
 * Betty's Bird Brain mascot — a chubby budgie in profile.
 *
 * Design notes:
 * - 64x64 viewBox, scales crisply from ~14px to hero sizes.
 * - Body uses `currentColor` so it inherits the parent text color (works in
 *   light/dark, in accent-tinted containers, on user bubbles, etc.).
 * - Two layered tones (belly highlight + wing shadow) create depth without
 *   committing to a fixed palette.
 * - Beak is a warm amber that reads as a focal point at any size.
 * - Eye has a tiny specular highlight — the Pixar-ish detail that makes
 *   it feel like a character, not an icon.
 */
type Props = {
  size?: number;
  className?: string;
  ariaHidden?: boolean;
  title?: string;
};

export function BirdMascot({ size = 28, className, ariaHidden = true, title }: Props) {
  const labelled = !ariaHidden && title;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Belly highlight — soft tonal lift below the wing line. */}
      <path
        d="M16 38
           C 14 34, 16 28, 21 25
           C 27 22, 34 22, 40 24
           C 43 28, 43 34, 40 39
           C 35 43, 28 44, 22 43
           C 19 42, 17 40, 16 38 Z"
        fill="var(--bird-color, currentColor)"
        opacity="0.18"
      />

      {/* Main body — plump, rounded, slightly tilted forward. */}
      <path
        d="M14 35
           C 12 25, 20 17, 30 16
           C 41 15, 50 21, 51 30
           C 52 39, 45 46, 36 47
           C 30 47, 25 46, 21 44
           C 18 46, 14 45, 12 43
           C 14 41, 14 38, 14 35 Z"
        fill="var(--bird-color, currentColor)"
      />

      {/* Wing — folded against the back, a darker tonal layer. */}
      <path
        d="M27 25
           C 33 23, 41 25, 45 31
           C 43 36, 38 38, 32 38
           C 28 38, 25 36, 24 33
           C 24 30, 25 27, 27 25 Z"
        fill="var(--bird-color, currentColor)"
        opacity="0.32"
      />

      {/* Wing primary feather detail — tiny crescent for sophistication. */}
      <path
        d="M30 31
           C 33 30, 38 31, 41 33"
        stroke="var(--bird-color, currentColor)"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />

      {/* Head crest tuft — small curve, signature budgie touch. */}
      <path
        d="M37 16
           C 39 12, 42 12, 44 14
           C 43 16, 41 17, 39 17"
        fill="var(--bird-color, currentColor)"
        opacity="0.85"
      />

      {/* Beak — warm amber, slightly open for friendliness. */}
      <path
        d="M50 27
           L 57 27
           L 53 30
           L 50 30 Z"
        fill="#d49860"
      />
      <path
        d="M50 30
           L 53 30
           L 53 32
           L 50 31 Z"
        fill="#b87a45"
      />

      {/* Eye — soft white sclera, dark pupil, micro highlight. */}
      <circle cx="44" cy="25" r="2.1" fill="var(--bird-eye-sclera, #fbfaf7)" />
      <circle cx="44.4" cy="25.2" r="1.25" fill="#1f1a17" />
      <circle cx="44.85" cy="24.75" r="0.4" fill="var(--bird-eye-sclera, #fbfaf7)" />

      {/* Tail — short forked silhouette behind the body. */}
      <path
        d="M14 36
           C 10 38, 7 40, 5 42
           C 8 42, 11 41, 14 40 Z"
        fill="var(--bird-color, currentColor)"
        opacity="0.78"
      />

    </svg>
  );
}
