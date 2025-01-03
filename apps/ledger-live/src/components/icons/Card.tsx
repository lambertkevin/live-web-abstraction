import { memo } from 'react';
import { Props } from '.';

const Card = ({ size = 16, color = 'currentColor', className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      className={className ?? undefined}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.5 14H14V15.8H17.5V14Z" fill={color ?? 'currentColor'} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.64014 4.5C3.08785 4.5 2.64014 4.94772 2.64014 5.5V18.5C2.64014 19.0523 3.08785 19.5 3.64014 19.5H20.3601C20.9124 19.5 21.3601 19.0523 21.3601 18.5V5.5C21.3601 4.94772 20.9124 4.5 20.3601 4.5H3.64014ZM4.44014 6.3V9H19.5601V6.3H4.44014ZM4.44014 17.7V10.8H19.5601V17.7H4.44014Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Card);
