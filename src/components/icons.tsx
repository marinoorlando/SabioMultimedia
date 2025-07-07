import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 2v20" />
      <path d="M12 12c-2.67 0-5.02.5-7 1.34" />
      <path d="M12 12c2.67 0 5.02-.5 7-1.34" />
      <path d="M12 12c-1.33 0-2.55.17-3.66.45" />
      <path d="M12 12c1.33 0 2.55-.17 3.66-.45" />
      <path d="M5.64 16.36c-1.28-1.28-2.14-2.98-2.28-4.86" />
      <path d="M18.36 7.64c1.28 1.28 2.14 2.98 2.28 4.86" />
    </svg>
  );
}
