import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import Transport from '@ledgerhq/hw-transport';

export const openNanoApp = async (appName: string, type: 'ledger-usb' | 'ledger-ble'): Promise<Transport> => {
  const transport = await (type === 'ledger-usb'
    ? TransportWebUSB.create().catch((eee) => {
        console.log('usb', { eee });
        throw eee;
      })
    : TransportWebBLE.create().catch((eee) => {
        console.log('ble', { eee });
        throw eee;
      }));
  console.log('Create new transport', type);
  // getAppAndVersion
  const getAppAndVersionBuffer = await transport.send(0xb0, 0x01, 0x00, 0x00).catch((eeee) => {
    console.log({ eeee });
    throw eeee;
  });
  console.log({ getAppAndVersionBuffer });
  const nanoAppNameLength = getAppAndVersionBuffer[1];
  const openedNanoAppName = getAppAndVersionBuffer.slice(2, 2 + nanoAppNameLength).toString('ascii');
  console.log({ nanoAppName: openedNanoAppName });

  if (openedNanoAppName !== appName) {
    console.log('Not in Ethereum App');
    // quitApp
    await transport.send(0xb0, 0xa7, 0x00, 0x00);
    console.log('Back to dashboard');
    console.log('Requesting Ethereum App');
    // open Ethereum
    await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from(appName));
    console.log('Should be opened now');

    await transport.close();
    console.log('closing the transport');
    await new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 2500);
    });
    console.log('waiting 2.5s');
    // retry
    return openNanoApp(appName, type);
  }
  return transport;
};
