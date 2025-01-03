import { memo } from 'react';
import { Props } from '.';

const Graph = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M2.62799 15.24L7.83599 10.032H15.732L19.764 6.024C19.716 6.624 19.716 7.2 19.716 7.776V9.288H21.372L21.348 3.12H15.204V4.8H16.716C17.268 4.8 17.868 4.8 18.444 4.752L14.964 8.232H7.11599L2.62799 12.696V15.24ZM2.62799 20.88H4.66799V17.952H2.62799V20.88ZM6.80399 20.88H8.84399V16.056H6.80399V20.88ZM10.98 20.88H13.02V12.96H10.98V20.88ZM15.156 20.88H17.196V15.12H15.156V20.88ZM19.308 20.88H21.348V12H19.308V20.88Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Graph);
