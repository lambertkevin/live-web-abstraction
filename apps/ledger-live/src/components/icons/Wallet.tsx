import { memo } from 'react';
import { Props } from '.';

const Wallet = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M4.56001 20.4H21.36V7.19998H6.36001V8.99998H19.56V18.6H4.56001C4.44001 18.6 4.44001 18.6 4.44001 18.48V5.51998C4.44001 5.39998 4.44001 5.39998 4.56001 5.39998H19.44C19.392 4.34398 18.576 3.59998 17.52 3.59998H4.56001C3.45601 3.59998 2.64001 4.41598 2.64001 5.51998V18.48C2.64001 19.584 3.45601 20.4 4.56001 20.4ZM15.048 13.92C15.048 14.592 15.6 15.192 16.32 15.192C17.016 15.192 17.568 14.592 17.568 13.92C17.568 13.224 17.016 12.672 16.32 12.672C15.6 12.672 15.048 13.224 15.048 13.92Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Wallet);
