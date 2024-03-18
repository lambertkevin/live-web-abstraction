const errors = {
  NotEnoughGas: "We couldn't simulate the transaction :(",
  FeeNotLoaded: "We couldn't estimate the transaction :(",
  NotEnoughBalance: "You're too poor to do this :(",
  TransportStatusError: "Oopsie, the device isn't happy :(",
};

export const translateError = (errorName: string) => errors[errorName as keyof typeof errors] || errorName;
