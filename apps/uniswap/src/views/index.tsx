import { memo } from 'react';
import { ethers } from 'ethers';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

type JsonRPCResponse<T = any> = { "jsonrpc": string, "id": number, "result": T }; 
const RPC_URL = "https://polygon.blockpi.network/v1/rpc/fed4a3cb04e57b02dd7d1f6fbea89b2aa49baea7";

const customProvider = () => {
  const { document } = window;
  const liveWebDialog = document.createElement('dialog');
  liveWebDialog.innerHTML =
`<div class="modal-box p-0 rounded shadow-xl overflow-hidden aspect-[1/3] select-none">
  <iframe
    class="w-full h-full select-none"
    src="http://localhost:4337/connect"
    sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
    allow="publickey-credentials-get *; hid; bluetooth;"
    name="iframe-ledger"
    loading="eager"
  />
</div>`;
  liveWebDialog.setAttribute('class', 'modal');
  document.body.appendChild(liveWebDialog);
  const iframe = liveWebDialog.querySelector('iframe');

  let isReady = false;
  const listener = (event: MessageEvent) => {
    const { data: content, origin } = event;
    if (origin !== 'http://localhost:4337') return;

    console.log("event", event);
    switch (content.type) {
      case 'rendered':
        isReady = true;
        break;

      case 'open':
        liveWebDialog.showModal();
        break;

      case 'error':
        console.error("LLW ERROR", content.data.error);
        break;

      case 'close':
        liveWebDialog.close();
        break;
    }
  };
  window.addEventListener('message', listener);
  console.log("customProvider created");

  const jsonProvider = new ethers.providers.StaticJsonRpcProvider(RPC_URL);

  const ethCallCache: any = {};
  return {
    requestIndex: 0,
    isMetaMask: false,
    async request(request: { method: string, params?: any[] }) {
      await new Promise((resolve) => {
        const checkReady = () => {
          if (isReady) {
            return resolve(null)
          } else {
            console.log("not ready trying in 200ms");
            setTimeout(checkReady, 1000);
          }
        }
        checkReady();
      });

      let response = null;
      switch (request.method) {
        case 'eth_accounts':
          iframe?.contentWindow?.postMessage({ type: 'connect' }, "*");
          const address = await new Promise((resolve) => {
            const addressListener = (event: MessageEvent) => {
              const { data: content, origin } = event;
              if (origin !== 'http://localhost:4337') return;

              if (content.type === 'connect:response') {
                window.removeEventListener('message', addressListener);
                resolve(content.data.address);
              }
            };
            window.addEventListener('message', addressListener);
          });
          
          response = [address];
          break;
        case 'eth_sendTransaction':
          const { chainId } = await jsonProvider.getNetwork();
          iframe?.contentWindow?.postMessage({ type: 'sign', data: { transaction: {...request.params?.[0], chainId } } }, "*");
          const hash = await new Promise((resolve) => {
            const addressListener = (event: MessageEvent) => {
              const { data: content, origin } = event;
              if (origin !== 'http://localhost:4337') return;

              if (content.type === 'sign:response') {
                window.removeEventListener('message', addressListener);
                resolve(content.data.hash);
              }
            };
            window.addEventListener('message', addressListener);
          });
          
          response = hash;
          break;
        default:
          const cacheKey = request.method + request.params?.join() as keyof typeof ethCallCache;
          if (ethCallCache[cacheKey]) {
            response = ethCallCache[cacheKey];
            break;
          
          }
          const result = await jsonProvider.send(request.method, request.params || []);
          ethCallCache[cacheKey] = result;
          response = result;
          break;
      }
      console.log("request", request.method, response);
      return response;
    }
  }
};
const provider = new ethers.providers.Web3Provider(customProvider());

export const IndexView = () => {
  return (
    <div className="flex flex-col flex-grow justify-center items-center h-screen">
       <div className="Uniswap">
        <SwapWidget
          tokenList='https://tokens-uniswap-org.ipns.dweb.link'
          provider={provider}
        />
      </div>
    </div>
  );
};

export default memo(IndexView);
