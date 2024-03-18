import groupBy from 'lodash/groupBy';
import { memo, useEffect, useState } from 'react';
import type { Account, TokenAccount, NFT } from '@ledgerhq/types-live';
import { buildCurrencyBridge } from '@ledgerhq/coin-evm/lib/bridge/js';

type Props = {
  account: Account | TokenAccount;
};

const NftsPreview = ({ account }: Props) => {
  const [nftsByCollection, setNftsByCollection] = useState<NFT[][]>([]);

  useEffect(() => {
    const bridge = buildCurrencyBridge((() => {}) as any);
    (async () => {
      if (account.type !== 'Account') return;

      const metadata = await Promise.all(
        account?.nfts?.map(({ contract, tokenId }) =>
          bridge.nftResolvers
            ?.nftMetadata({ contract, tokenId, currencyId: account.currency.id })
            .then(({ result }) => result),
        ) || [],
      );
      setNftsByCollection(
        Object.values(
          groupBy(
            (account.nfts?.map((nft, i) => (metadata[i] ? { ...nft, metadata: metadata[i] } : nft)) as NFT[]) || [],
            (nft) => nft.contract,
          ),
        ),
      );
    })();
  }, [account.nfts, account.currency]);

  return (
    <div className="bg-zinc-900 rounded py-5">
      <div className="text-lg pb-5 px-5 border-b-zinc-800 border-b">NFTS (Non Fungible Tokens) Collections</div>
      <div>
        {nftsByCollection.slice(0, 5).map((nfts) => (
          <div
            key={nfts[0].id}
            className="flex flex-row items-center justify-between py-3 px-5 border-b-zinc-800 border-b hover:bg-zinc-800 hover:cursor-pointer"
          >
            <div className="flex flex-row gap-3 items-center">
              <img className="w-10 aspect-square rounded-md" src={nfts[0].metadata.medias.preview.uri || ''} />
              <div className="text-base">{nfts[0].metadata.tokenName}</div>
            </div>
            <div className="flex flex-row">{nfts.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(NftsPreview);
