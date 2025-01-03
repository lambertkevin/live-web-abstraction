import { memo } from 'react';
import { Props } from '.';

const Lend = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M2.62801 13.344V15.168C9.49201 14.304 15.3 10.872 19.764 5.928C19.716 6.528 19.716 7.104 19.716 7.68V9.288H21.372L21.348 3.12H15.204V4.8H16.716C17.244 4.8 17.82 4.8 18.396 4.752C14.196 9.384 8.96401 12.504 2.62801 13.344ZM2.62801 20.88H4.66801V17.952H2.62801V20.88ZM6.80401 20.88H8.84401V16.608H6.80401V20.88ZM10.98 20.88H13.02V15.192H10.98V20.88ZM15.156 20.88H17.196V13.824H15.156V20.88ZM19.308 20.88H21.348V12.48H19.308V20.88Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Lend);
