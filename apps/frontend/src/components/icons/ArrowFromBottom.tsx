import { memo } from 'react';
import { Props } from '.';

const ArrowFromBottom = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 19H19V21H5V19Z" fill={color ?? 'currentColor'} />
      <path
        d="M13 6.828L17 10.828L18.414 9.414L12 3L5.586 9.414L7 10.828L11 6.828V17H13V6.828Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(ArrowFromBottom);
