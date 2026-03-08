export function MalteseCross({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="var(--mantine-color-red-9)"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M35,5 L65,5 L70,30 L95,35 L95,65 L70,70 L65,95 L35,95 L30,70 L5,65 L5,35 L30,30 Z" />
    </svg>
  );
}
