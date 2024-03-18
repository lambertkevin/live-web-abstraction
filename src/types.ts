import type Transport from '@ledgerhq/hw-transport';

export type Signer = { enabled: boolean } & (
  | {
      type: 'ledger-usb';
      name: 'USB';
      transport?: Transport;
    }
  | {
      type: 'ledger-ble';
      name: 'Bluetooth';
      transport?: Transport;
    }
  | {
      type: 'webauthn';
      name: 'Webauthn';
    }
);
