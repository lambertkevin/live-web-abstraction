import { memo } from 'react';
import { Props } from '.';

const Exchange = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path
          d="M2.775 3.525h-.75a.75.75 0 010-1.5h11.9a.75.75 0 110 1.5H2.775zM11.124.901a.75.75 0 011.06-1.06l2.405 2.404a.75.75 0 010 1.06L12.184 5.71a.75.75 0 01-1.06-1.06l1.874-1.874L11.124.901zm2.801 10.374a.75.75 0 01-.75.75H2.025a.75.75 0 110-1.5h11.15a.75.75 0 01.75.75zm-10.973 0l1.874 1.874a.75.75 0 01-1.06 1.06L1.36 11.805a.75.75 0 010-1.06L3.766 8.34a.75.75 0 111.06 1.06l-1.874 1.874z"
          id="Transfer-a"
        />
      </defs>
      <use
        fill={color ?? 'currentColor'}
        fillRule="nonzero"
        transform="rotate(-180 7.475 7.5)"
        xlinkHref="#Transfer-a"
      />
    </svg>
  );
};

export default memo(Exchange);
