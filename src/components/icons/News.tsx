import { memo } from 'react';
import { Props } from '.';

const News = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.466 9.05486H10.1589V10.985H17.466V9.05486Z" fill="black" />
      <path d="M10.1589 12.6056H17.466V14.5358H10.1589V12.6056Z" fill="black" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.82887 20.3561C4.35896 20.8875 5.07772 21.1864 5.82738 21.1871L5.83789 21.1871H18.4331C19.1139 21.1871 19.7668 20.9159 20.2481 20.4333C20.7295 19.9507 20.9999 19.2961 20.9999 18.6135V5.66805H18.951V2.81274H3V18.3524C3.00068 19.104 3.29878 19.8246 3.82887 20.3561ZM8.65477 7.59822V18.3524C8.65442 18.6629 8.60331 18.9681 8.50606 19.2569H18.4331C18.6033 19.2569 18.7665 19.1891 18.8869 19.0685C19.0072 18.9478 19.0748 18.7842 19.0748 18.6135V7.59819L8.65477 7.59822ZM5.8343 19.2569C6.07104 19.2549 6.29764 19.1598 6.46518 18.9918C6.63435 18.8222 6.72946 18.5922 6.72963 18.3524V5.66808H17.0259V4.74289H4.92513V18.3524C4.9253 18.5922 5.02042 18.8222 5.18959 18.9918C5.35874 19.1614 5.58811 19.2568 5.82733 19.257L5.8343 19.2569Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(News);
