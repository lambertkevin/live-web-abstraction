import { memo } from 'react';
import { Props } from '.';

const ArrowToBottom = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M13 13.172L17 9.172L18.414 10.586L12 17L5.58598 10.586L6.99998 9.172L11 13.172V3H13V13.172Z"
        fill={color ?? 'currentColor'}
      />
      <path d="M5 19H19V21H5V19Z" fill={color ?? 'currentColor'} />
    </svg>
  );
};

export default memo(ArrowToBottom);
