export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
export type ExcludeOptionalProps<T> = Pick<T, RequiredKeys<T>>;

export type CraftSigner =
  | {
      type: 'WEBAUTHN';
      credId: string;
      pubKey: string[];
    }
  | {
      type: 'EOA';
      address: string;
    };
