# Idena Pool Manager

Idena pool manager automates the process of managing an Idena pool. It logs the delegators and their stake in a local database and generates a transaction automatically. All you have to do is to confirm. It also shows information about the pool and the delegators.

## Setup

Install [Deno](https://deno.com/manual@v1.33.3/getting_started/installation):

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Setup the project:

```bash
git clone https://github.com/Swafox/idena-pool-manager.git
cp .env.example .env
# Edit .env by adding your pool address
deno cache --unstable --reload --lock=deno.lock --lock-write main.ts
```

## Usage

### Main commands

```bash
deno task info # shows information about the pool
deno task delegators # shows all delegators in the pool
deno task log # logs delegators and their stake in a local db
deno task payout # pays out the delegators
```

### Experimental commands

```bash
deno run --allow-all --unstable main.ts listTxs <address> # lists all transactions for an address
deno run --allow-all --unstable main.ts checkDB <address> # checks the local db entry for the given address
```

### Disclaimer

This software is provided as is. Use at your own risk. Idena pool manager will not send any transactions on your behalf. Idena pool manager, nor the author are responsible for any loss of your funds.
