import * as icons from '@ledgerhq/crypto-icons-ui/react';
import type { CryptoOrTokenCurrency } from '@ledgerhq/types-cryptoassets';
import { memo } from 'react';

type Props = { currency: CryptoOrTokenCurrency; size: number; color?: string };

const CurrencyIcon = ({ currency, size, color }: Props) => {
  const Icon: React.ComponentType<{ size: number; color?: string }> =
    (currency.type === 'CryptoCurrency' &&
      //@ts-expect-error fuck it
      icons[
        // eslint-disable-next-line import/namespace
        `CURRENCY_${currency.id.toUpperCase()}`
      ]) ||
    //@ts-expect-error fuck it
    // eslint-disable-next-line import/namespace
    icons[currency.ticker.toUpperCase()];

  return Icon ? (
    <Icon size={size} color={color} />
  ) : (
    <span style={{ color }} className="font-bold text-sm">
      {currency.name[0]}
    </span>
  );
};

export default memo(CurrencyIcon);
