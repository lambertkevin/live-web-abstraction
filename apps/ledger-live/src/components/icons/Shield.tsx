import { memo } from 'react';
import { Props } from '.';

const Shield = ({ size = 16, color = 'currentColor', className }: Props) => {
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
        d="M12 21.84C18.24 19.368 21.36 15.432 21.36 10.128V5.088C18.696 3.168 15.456 2.16 12 2.16C8.54401 2.16 5.30401 3.168 2.64001 5.088V10.128C2.64001 15.432 5.76002 19.368 12 21.84ZM4.56001 10.128V6C6.79202 4.608 9.19202 3.96 12 3.96C14.808 3.96 17.208 4.608 19.44 6V10.128C19.44 14.64 17.208 17.64 12 19.872C6.79202 17.64 4.56001 14.64 4.56001 10.128ZM7.92002 11.304L11.28 14.688L16.944 9L15.6 7.656L11.28 11.952L9.26402 9.96L7.92002 11.304Z"
        fill={color ?? 'currentColor'}
      />
    </svg>
  );
};

export default memo(Shield);
