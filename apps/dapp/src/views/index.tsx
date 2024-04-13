import axios from 'axios';
import { ethers } from 'ethers';
import isEqual from 'lodash/isEqual';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import nftAbi from '../abis/nft.abi.json';
import { toRawEthersTransaction } from '../helpers';
// @ts-expect-error accessible via docker volume
// eslint-disable-next-line import/no-unresolved
import addresses from '../../contracts-config/addresses.json';

const provider = new ethers.providers.StaticJsonRpcProvider(import.meta.env.RPC);
const nftContract = new ethers.Contract(addresses.NFT_CONTRACT, nftAbi, provider);

export const IndexView = () => {
  const iframe = useRef<HTMLIFrameElement | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>();
  useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => {
        setErrorMessage(undefined);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

  const [hash, setHash] = useState<string>();
  useEffect(() => {
    if (hash) {
      const timeout = setTimeout(() => {
        setHash(undefined);
      }, 10_000);
      return () => clearTimeout(timeout);
    }
  }, [hash]);

  const [iframeIsRendered, setIframeIsRendered] = useState(false);
  const [address, setAddress] = useState<string>();
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const { data: content } = event;
      switch (content.type) {
        case 'rendered':
          console.log('IFRAME', iframe.current);
          setIframeIsRendered(true);
          break;

        case 'open':
          dialog.current?.showModal();
          break;

        case 'connect:response':
          setAddress(content.data.address);
          break;

        case 'sign:response':
          setHash(content.data.hash);
          break;

        case 'error':
          setErrorMessage(content.data.error);
          break;

        case 'close':
          dialog.current?.close();
      }
    };
    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  const sendMessage = useCallback(
    ({ type, data }: { type: string; data?: Record<string, unknown> }) => {
      if (iframeIsRendered) {
        iframe.current?.contentWindow?.postMessage(
          {
            type,
            data,
          },
          '*',
        );
      } else {
        setErrorMessage('iFrameNotRendered');
      }
    },
    [iframeIsRendered],
  );

  const [nftBalance, setNftBalance] = useState<number | undefined>();
  useEffect(() => {
    if (address) {
      const interval = setInterval(() => {
        nftContract.balanceOf(address).then((balance: ethers.BigNumber) => setNftBalance(balance.toNumber()));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [address]);

  const [nfts, setNfts] = useState<Record<string, any>[]>([]);
  useEffect(() => {
    const getNfts = async () => {
      const bag = [];
      if (address) {
        for (let i = 1; i <= 50; i++) {
          const owner = await nftContract.ownerOf(i).catch(() => '');
          if (owner !== address) continue;
          const metadataIpfs = await nftContract.tokenURI(i);
          const { data: metadata } = await axios.get<Record<string, any>>(
            `https://cloudflare-ipfs.com/ipfs/${metadataIpfs.replace('ipfs://', '')}`,
          );
          bag.push({
            index: i,
            ...metadata,
            image: `https://cloudflare-ipfs.com/ipfs/${metadata.image.replace('ipfs://', '')}`,
          });
        }

        if (!isEqual(bag, nfts)) {
          setNfts(bag);
        }
      }
    };

    const to = setTimeout(getNfts, 500);

    return () => {
      clearTimeout(to);
    };
  }, [address, nfts, nftBalance]);

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex flex-row justify-end p-4">
        <div className="flex flex-col items-end">
          <button
            className="btn btn-primary disabled:bg-opacity-50 disabled:text-white disabled:text-opacity-70"
            disabled={!!address || !iframeIsRendered}
            onClick={() => sendMessage({ type: 'connect' })}
          >
            {address
              ? `${address.slice(0, 8)}...${address.slice(address.length - 7, address.length - 1)}`
              : 'Se connecter'}
          </button>
          {address ? (
            <div className="stats shadow mt-14 absolute">
              <div className="stat bg-secondary">
                <div className="stat-title font-bold">NFTs owned</div>
                <div className="stat-value text-right text-white">
                  {typeof nftBalance === 'number' ? (
                    nftBalance
                  ) : (
                    <span className="loading loading-ring loading-sm"></span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="toast toast-top toast-start">
        {errorMessage && <div className="alert alert-error text-center flex flex-row">{errorMessage}</div>}
      </div>
      <div className="toast toast-top toast-start" onClick={() => setHash(undefined)}>
        {hash && (
          <div className="alert alert-info text-center flex flex-row">
            <a href={`my-imaginary-explorer.com/tx/${hash}`} target="_blank" rel="noreferrer">
              See transaction 🌐
            </a>
          </div>
        )}
      </div>
      <h1 className="text-3xl font-bold text-center py-10">Qui Veut Être Mon NFT ?</h1>
      <div className="flex flex-row justify-center items-center">
        <div className="card w-96 bg-white shadow-xl shadow-lime-400 rounded-lg">
          <figure>
            <img src="https://i.ytimg.com/vi/ckYVhmTJ6lQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDLP2lJZvZEchTB9i7v_Pl30f6nyg" />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Achète mon NFT !</h2>
            <p>Le NFT que les banquiers détestent. Satisfait ou burné.</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-accent"
                disabled={!iframeIsRendered || !address}
                onClick={async () => {
                  const transaction: ethers.Transaction = {
                    nonce: 0,
                    gasLimit: ethers.BigNumber.from(21_000),
                    value: ethers.BigNumber.from(0),
                    to: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
                    data: nftContract.interface.encodeFunctionData('mint'),
                    chainId: await provider.getNetwork().then(({ chainId }) => chainId),
                  };
                  sendMessage({
                    type: 'sign',
                    data: {
                      transaction: toRawEthersTransaction(transaction),
                    },
                  });
                }}
              >
                Achète tavu
              </button>
            </div>
          </div>
        </div>
      </div>
      {nfts.length ? (
        <div className="flex flex-col items-center mt-10 w-screen">
          <h1 className="text-xl font-bold border-b border-lime-500 mb-4">Mes NFTs de Millionaires $$</h1>
          <div className="carousel rounded-box w-[99%] p-4 space-x-4 justify-center">
            {nfts.map((nft) => (
              <div key={nft.index} className="carousel-item w-1/5">
                <div className="card glass bg-white">
                  <figure>
                    <img src={nft.image} />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">
                      #{nft.index} {nft.title}
                    </h2>
                    <p>{nft.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <dialog ref={dialog} className="modal">
        <div className="modal-box p-0 rounded shadow-xl overflow-hidden aspect-[1/3] select-none">
          <iframe
            ref={iframe}
            className="w-full h-full select-none"
            src="http://localhost:4337/connect"
            sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
            allow="publickey-credentials-get *; hid; bluetooth;"
            name="iframe-ledger"
            loading="eager"
          />
        </div>
      </dialog>
      <div className="avatar fixed bottom-4 right-8 flex-col items-center gap-3">
        <div className="w-20 rounded-full ring ring-primary shadow-lg ring-offset-base-100 ring-offset-2">
          <img src="https://inspire-media.fr/wp-content/uploads/2022/07/oussama-ammar-du-succes-au-bannissement-ep-2.jpg" />
        </div>
        <h2 className="font-bold text-black text-sm glass shadow-lg p-4 rounded ring ring-primary">
          Recommandé par <br />
          Oussama Ammar
        </h2>
      </div>
    </div>
  );
};

export default memo(IndexView);
