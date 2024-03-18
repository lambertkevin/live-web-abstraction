import { memo } from 'react';
import { Props } from '.';

const Plus = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinejoin="miter"
      stroke={color ?? 'currentColor'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
};

export default memo(Plus);
