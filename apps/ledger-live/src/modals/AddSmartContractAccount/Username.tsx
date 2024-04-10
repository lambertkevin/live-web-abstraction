import axios from 'axios';
import base64url from 'base64url';
import classNames from 'classnames';
import { memo, useEffect, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Signer } from '../../types';
import { openNanoApp } from '../../helpers';
import Eth from '@ledgerhq/hw-app-eth';
import { ethers } from 'ethers';

type Props = {
  username: string;
  setUsername: (username: string) => void;
  setToken: (token: string) => void;
  setSigner: (signer: Signer) => void;
  goNextStep: (stepsToSkip?: number) => void;
};

const domain = 'ledger.com';

const UsernameStep = ({ username, setUsername, goNextStep, setToken, setSigner }: Props) => {
  const [credentials, setCredentials] = useState<string[] | undefined>([]);

  useEffect(() => {
    setCredentials(undefined);
    const timeout = setTimeout(() => {
      if (username) {
        axios
          .get<string[]>(`${import.meta.env.VITE_NAMING_SERVICE}account/${username}.${domain}`)
          .then(({ data }) => {
            setCredentials(data);
          })
          .catch(() => {
            setCredentials(undefined);
          });
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [username]);

  return (
    <>
      <div className="px-6">
        <label
          className={classNames([
            'input input-bordered flex items-center gap-2',
            username && credentials ? 'outline-error outline focus-within:outline-error' : null,
          ])}
        >
          <input
            type="text"
            className="grow"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span className="badge badge-info">.ledger.com</span>
        </label>
        <div className="label">
          {username && credentials ? (
            <span className="label-text-alt text-error">Already taken 🔒</span>
          ) : (
            <span className="label-text-alt">&nbsp;</span>
          )}
        </div>
      </div>
      <hr className="border-zinc-700 my-4 mt-10" />
      <div className="flex px-6 justify-end items-center gap-3">
        {username && credentials?.length ? (
          <button
            className="btn btn-primary"
            disabled={!credentials}
            onClick={() => {
              if (credentials[0]?.length === 42) {
                openNanoApp('Ethereum', 'ledger-usb').then(async ([transport, transportError]) => {
                  if (transportError) alert('Nope');
                  const sig = await new Eth(transport!).signPersonalMessage(
                    "44'/60'/0'/0/0",
                    Buffer.from(`${username}.${domain}`).toString('hex'),
                  );

                  if (
                    ethers.utils.verifyMessage(`${username}.${domain}`, {
                      r: `0x${sig.r}`,
                      s: `0x${sig.s}`,
                      v: sig.v,
                    })
                  ) {
                    setSigner({
                      mode: 'EOA',
                      type: 'ledger-usb',
                      username,
                      domain,
                      address: credentials[0],
                    });
                    goNextStep(2);
                  }
                });
              } else if (credentials[0]?.length === 66) {
                startAuthentication({
                  challenge: '',
                  allowCredentials: credentials
                    .filter((c) => c.length === 66)
                    .map((credId) => ({
                      id: base64url.encode(Buffer.from(credId.slice(2), 'hex')),
                      type: 'public-key',
                      transports: ['internal', 'hybrid'],
                    })),
                }).then(() => {
                  setSigner({
                    mode: 'Webauthn',
                    type: 'webauthn',
                    username,
                    domain,
                    credId: credentials[0],
                  });
                  goNextStep(2);
                });
              }
            }}
          >
            <span>Login</span>
          </button>
        ) : null}
        <button
          className="btn btn-primary"
          disabled={!username || !!credentials}
          onClick={() => {
            axios
              .post<string>(`${import.meta.env.VITE_NAMING_SERVICE}lock/set/${username}.${domain}`)
              .then(({ data }) => {
                setToken(data);
                goNextStep();
              });
          }}
        >
          <span>Continue</span>
        </button>
      </div>
    </>
  );
};

export default memo(UsernameStep);
