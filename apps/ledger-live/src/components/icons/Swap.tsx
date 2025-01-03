import { memo } from 'react';
import { Props } from '.';

const Swap = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M2.64005 12H4.46405V7.00801H19.1521C18.6961 7.41601 18.2641 7.80001 17.8561 8.20801L16.8001 9.28801L17.9761 10.464L22.3201 6.09601L17.9761 1.75201L16.8001 2.95201L17.8561 4.00801C18.2401 4.39201 18.6721 4.80001 19.1041 5.18401H2.64005V12ZM1.68005 17.904L6.02405 22.248L7.20005 21.048L6.14405 19.992C5.76005 19.608 5.32805 19.2 4.89605 18.816H21.3601V12H19.5361V16.992H4.84805C5.30405 16.584 5.73605 16.2 6.14405 15.792L7.20005 14.712L6.02405 13.536L1.68005 17.904Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Swap);
