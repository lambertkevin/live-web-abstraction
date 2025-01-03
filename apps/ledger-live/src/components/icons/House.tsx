import { memo } from 'react';
import { Props } from '.';

const House = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M4.31999 21.36H11.04V14.64H12.96V21.36H19.68V12.12L21.024 13.344L22.32 12L12 2.64001L1.67999 12L2.97599 13.344L4.31999 12.12V21.36ZM6.16799 19.56V10.44L12 5.13601L17.832 10.44V19.56H14.64V12.96H9.35999V19.56H6.16799Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(House);
