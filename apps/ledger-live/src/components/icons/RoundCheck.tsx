import { memo } from 'react';
import { Props } from '.';

const RoundCheck = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.444 12.339L10.611 14.506L10.597 14.492L15.486 9.603M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color ?? 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default memo(RoundCheck);
