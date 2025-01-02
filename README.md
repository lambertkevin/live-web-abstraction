# Ledger Web Abstraction

Ledger Hacktathon creating a web version of Ledger Live, capable of using ERC-4337 to have an EVM experience without using a hardware wallet.
Using a modified version of @eth-infinitism Bundler and FreshCryptoLib for secp256r1 verification.

## Installation

1. Clone the repository:
  ```bash
  git clone git@github.com:lambertkevin/live-web-abstraction.git
  ```

2. Create your .env file:
  ```bash
  cp .env.dist .env
  ```

3. Use the makefile:
  ```bash
  make start
  ```

4. Regarding Anvil:
  If you're using anvil as RPC, you'll have to add in your `etc/hosts`:
  ```
  127.0.0.1 host.docker.internal
  ```
  then set the `RPC` environement variable of your `.env` to `http://host.docker.internal:8545` and `BUNDLER_UNSAFE` to `true`.

## Usage

- Access the Live at [http://localhost:4337](http://localhost:4337)
