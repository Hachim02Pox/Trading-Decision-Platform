import styles from "./GyroscopeMark.module.css";

interface GyroscopeMarkProps {
  /** Rendered width/height in px. The SVG ring, textPath radius, and center
   * dot are all derived from this so the mark stays proportional at any
   * size — 180 (login/splash) down to ~20 (compact nav). */
  size?: number;
}

/**
 * The brand mark: three concentric rings rotating on a compound axis
 * (gyroscope / armillary sphere), with the owner's name inscribed as a
 * subtle textPath on the equatorial ring. See
 * design_handoff_logo/README.md for the full spec this implements.
 */
export function GyroscopeMark({ size = 32 }: GyroscopeMarkProps) {
  const r = size / 2 - 1;
  const circumference = Math.round(2 * Math.PI * r);
  const c = size / 2;
  const path = `M ${c},1 A ${r},${r} 0 0 1 ${c},${size - 1} A ${r},${r} 0 0 1 ${c},1`;
  const pathId = "gyro-eq";
  const dotSize = Math.max(2, Math.round(size / 36));

  return (
    <div className={styles.wrap} style={{ width: size, height: size }} aria-hidden="true">
      <div className={styles.spin} style={{ width: size, height: size }}>
        <svg className={styles.ringSvg} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <path id={pathId} d={path} />
          </defs>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-gold)" strokeWidth="1.5" />
          <text fontFamily="var(--font-mono)" fontSize={Math.max(6, size / 18)} fill="var(--color-gold)" opacity="0.65" fontWeight="300">
            <textPath href={`#${pathId}`} textLength={circumference} lengthAdjust="spacing">
              H&nbsp;·&nbsp;A&nbsp;·&nbsp;C&nbsp;·&nbsp;H&nbsp;·&nbsp;I&nbsp;·&nbsp;M&nbsp;·
            </textPath>
          </text>
        </svg>
        <div className={styles.ringVertical} />
        <div className={styles.ringPerp} />
        <div className={styles.dot} style={{ width: dotSize, height: dotSize }} />
      </div>
    </div>
  );
}
