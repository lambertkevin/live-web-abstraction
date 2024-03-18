import axios from 'axios';
import { create } from 'zustand';
import type { Account, TokenAccount } from '@ledgerhq/types-live';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { buildAccountBridge, buildCurrencyBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import { getCryptoCurrencyById } from '@ledgerhq/cryptoassets/lib/currencies';
import { makeAccount } from '@ledgerhq/coin-evm/lib/__tests__/fixtures/common.fixtures';

type AccountsStore = {
  accounts: Account[];
  isSyncing: boolean;
  syncInterval: number;
  setSyncInterval: (syncInterval: number) => void;
  syncAccounts: () => Promise<void>;
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
};

export const useAccountsStore = create<AccountsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      accounts: [],
      isSyncing: false,
      syncInterval: 2 * 60 * 1000,
      setSyncInterval(syncInterval) {
        set(() => ({ syncInterval }));
      },
      async syncAccounts() {
        const currencyBridge = buildCurrencyBridge(() => ({}) as any);
        const accountBridge = buildAccountBridge(() => ({}) as any);

        set(() => ({ isSyncing: true }));
        const accounts = await Promise.all(
          get().accounts.map(async (account) => {
            await currencyBridge.preload(account.currency);
            return accountBridge
              .sync(account, { paginationConfig: {} })
              .toPromise()
              .then((updater) => {
                if (!updater || !account) throw new Error('No updater or account');
                return updater(account);
              })
              .catch((e) => {
                console.error('SYNC ERROR', e);
                throw e;
              });
          }),
        );

        set(() => ({
          accounts,
          isSyncing: false,
        }));
      },
      addAccount(account: Account) {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));
      },
      updateAccount(account: Account) {
        set((state) => ({
          accounts: [
            ...state.accounts.toSpliced(
              state.accounts.findIndex((a) => a.id === account.id),
              1,
              account,
            ),
          ],
        }));
      },
    })),
    { name: 'AccountsStore' },
  ),
);

type CurrencyPriceStore = {
  prices: Record<string, number>;
  addCurrencies: (tickers: string[]) => void;
  setPrice: (price: Record<string, number>) => void;
  updatePrices: () => Promise<void>;
};

export const useCurrencyPriceStore = create<CurrencyPriceStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      prices: {},
      setPrice(price) {
        set((state) => ({ prices: { ...state.prices, ...price } }));
      },
      addCurrencies(tickers) {
        const oldTickers = Object.keys(get().prices);
        const newTickers = tickers
          .map((ticker) => ticker.toLowerCase())
          .filter((ticker) => !oldTickers.includes(ticker));
        this.setPrice(newTickers.reduce((prev, curr) => ({ ...prev, [curr]: 0 }), {}));
      },
      async updatePrices() {
        const { data: prices } = await axios.get<Record<string, number>>(
          'https://countervalues.live.ledger.com/v3/spot/simple',
          {
            params: {
              froms: Object.keys(get().prices)
                .map((k) => k.toLowerCase())
                .join(),
              to: 'usd',
            },
          },
        );

        set(() => ({ prices }));
      },
    })),
    { name: 'CurrencyPriceStore' },
  ),
);

useAccountsStore.subscribe((state) => {
  useCurrencyPriceStore
    .getState()
    .addCurrencies(
      state.accounts.flatMap((account) => [
        account.unit.code,
        ...(account.subAccounts
          ?.filter((subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount')
          ?.map(({ token }) => token.id) || []),
      ]),
    );
});

let intervalId: NodeJS.Timeout;
useAccountsStore.subscribe((state) => {
  clearInterval(intervalId);
  intervalId = setInterval(state.syncAccounts, state.syncInterval);
});

useCurrencyPriceStore.subscribe((state, previousState) => {
  if (Object.keys(state.prices).join() !== Object.keys(previousState.prices).join()) {
    state.updatePrices();
  }
});

type ModalStore = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  modalName: string;
  modalParams?: any;
  openModal: (modalName: string, params?: any) => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      isOpen: false,
      setIsOpen(isOpen) {
        set(() => ({ isOpen }));
      },
      modalName: '',
      modalParams: null,
      openModal(modalName, params) {
        set(() => ({ modalName, modalParams: params, isOpen: true }));
      },
      closeModal() {
        set(() => ({ modalName: '', modalParams: null, isOpen: false }));
      },
    })),
    { name: 'ModalStore' },
  ),
);
