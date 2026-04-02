export function PrizmLogo({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M11 2.5L2 19.5H11V2.5Z" fill="currentColor" />
      <path d="M13 2.5V19.5H22L13 2.5Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M7.5 21.5H16.5L12 24L7.5 21.5Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

