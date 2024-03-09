# Idena Pool Manager

Idena pool manager automates the process of managing an Idena pool. It logs the
delegators and their stake in a local database and generates a transaction
automatically. All you have to do is to confirm. It also shows information about
the pool and the delegators.

# Setup

Install [Deno](https://deno.com/manual@v1.33.3/getting_started/installation):

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Setup the project:

```bash
git clone https://github.com/Swafox/idena-pool-manager.git
cp .env.example .env
# Edit .env by adding your pool address and following the Telegram bot setup
deno cache --unstable --reload --lock=deno.lock --lock-write main.ts
deno task init
```

# Usage

## Automated

Create a cronjob to run the script every day at 18:00 (UTC\*):

```bash
0 18 * * * cd /path/to/idena-pool-manager && deno task payout
```

- check your local timezone with `date +%Z` and adjust the cronjob accordingly

### Manual

Run `deno task payout force` 1h after the validation.

## Telegram bot

Create a Telegram bot via [BotFather](https://t.me/botfather) and follow these
steps:

1. Open `https://api.telegram.org/bot<Bot_token>/getUpdates` page.
2. Send one message to the Bot.
3. Find this message and navigate to the `result->message->chat->id` key.
4. Put this id to the .env file as TELEGRAM_CHAT_ID.

The bot will send you a message every time it checks the pool.

## Main commands

```bash
deno task info # shows information about the pool
deno task delegators # shows all delegators in the pool
deno task payout # pays out the delegators
```

## Experimental commands

```bash
deno run --allow-all --unstable main.ts listTxs <address> # lists all transactions for an address
deno run --allow-all --unstable main.ts checkDB <address> # checks the local db entry for the given address
```

# Disclaimer

This software is provided as is. Use at your own risk. Idena pool manager will
not send any transactions on your behalf. Idena pool manager, nor the author are
responsible for any loss of your funds.
