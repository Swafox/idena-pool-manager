import * as api from "./src/api.ts"; // Import API functions
import { load } from "https://deno.land/std@0.170.0/dotenv/mod.ts";
import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";
import { Bot } from "https://deno.land/x/grammy@v1.15.3/mod.ts";

const env = await load(); // Load the .env file
const poolAddress = env["POOL_ADDRESS"] as string; // Get the address from .env
const TG_AUTH = env["TG_AUTH"] as string; // Get the telegram bot token from .env
const TELEGRAM_CHAT_ID = env["TELEGRAM_CHAT_ID"] as string; // Get the telegram chat id from .env

const bot = new Bot(TG_AUTH);

const kv = await Deno.openKv(); // Initialize local keystore db

// Check that the pool address is set
if (poolAddress == null) {
  console.log(
    "Please set POOL_ADDRESS in .env, see .env.example for an example",
  );
  Deno.exit(1);
}

// Init functions
async function init() {
  // get the last epoch and store it in the keystore
  const epoch = await api.getLastEpoch();
  await kv.set(["lastEpoch"], epoch.result.epoch);
  console.log(`Current epoch: ${epoch.result.epoch}`);
}

// Check that a command was provided
if (Deno.args.length == 0) {
  console.log("Please provide a command");
  Deno.exit(1);
}

// Info command that call the pool info api
async function poolInfo() { // async function since all API calls are asynchronous
  const info = await api.getPool(poolAddress);
  console.log(`
Address: ${info.result.address}
Size: ${chalkin.blue(info.result.size)}
Total Stake: ${chalkin.green(info.result.totalStake)}
Total Validated Stake: ${
    chalkin.greenBright(info.result.totalValidatedStake)
  } \n
`);
}

// Show all delegators and their stake
async function poolDelegators() {
  const delegators = await api.getPoolDelegators(poolAddress);
  console.log(`Delegators: ${delegators.result.length}`);
  for (const delegator of delegators.result) {
    console.log(`
Address: ${delegator.address}
Stake: ${chalkin.green(delegator.stake)}
`);
  }
}

// List all transactions for an address
async function listTsx(address: string) {
  const txs = await api.getTxsForEpoch(address);
  console.log(txs);
}

// Calculate payout for a delegator
function calculatePayout(reward: number) {
  reward = Number(reward);
  const totalMiningReward: number = (reward * 100) / 20 - reward;
  const balance: number = Number(totalMiningReward) + reward;
  const poolCommission: number = balance * 0.2;
  const payout: number = totalMiningReward - poolCommission;
  return payout;
}

// Calculate payout for all delegators and generate payout txs
async function payout() {
  const epoch = await api.getLastEpoch();

  const lastEpoch = await kv.get(["lastEpoch"]);
  if (Deno.args[1] == "force" || epoch.result.epoch > lastEpoch.value) {
    bot.api.sendMessage(
      TELEGRAM_CHAT_ID,
      `Happy new epoch! ${epoch.result.epoch} 🎉`,
    );
    const delegators = await api.getPoolDelegators(poolAddress);
    console.log(delegators);
    for (const delegator of delegators.result) {
      const lastEpochMining = await api.miningReward(delegator.address);
      const lastEpochValidation = await api.validationSummary(
        epoch.result.epoch - 1,
        delegator.address,
      );

      if (lastEpochMining.result[1].epoch != epoch.result.epoch - 1) {
        const msg =
          `Mining reward for ${delegator.address} is not available for epoch ${
            epoch.result.epoch - 1
          }`;
        console.log(msg);
        await bot.api.sendMessage(TELEGRAM_CHAT_ID, msg);
      } else {
        const totalReward =
          Number(calculatePayout(lastEpochMining.result[1].amount)) +
          Number(lastEpochValidation.result.delegateeReward.amount);

        const report = `
👤 Address: ${delegator.address}

Mining reward w/commission: ${
          calculatePayout(lastEpochMining.result[1].amount)
        } for ${lastEpochMining.result[1].epoch} epoch 

Validation reward: ${lastEpochValidation.result.delegateeReward.amount} for ${
          epoch.result.epoch - 1
        } epoch 
      
Total reward: ${totalReward}  💸
Pay: https://app.idena.io/dna/send?address=${delegator.address}&amount=${totalReward}}`;

        console.log(report);

        await bot.api.sendMessage(TELEGRAM_CHAT_ID, report);
      }
    }
    await kv.set(["lastEpoch"], epoch.result.epoch);
  } else if (lastEpoch.value == null) {
    console.log("Please run init first");
    Deno.exit(1);
  } else if (epoch.result.epoch == lastEpoch.value) {
    console.log("No new epoch");
    await bot.api.sendMessage(
      TELEGRAM_CHAT_ID,
      "No new epoch, I checked. If there was one, please report to repo's issue tracker",
    );
    Deno.exit(1);
  } else {
    console.log("Something went wrong");
    await bot.api.sendMessage(TELEGRAM_CHAT_ID, "Something went wrong");
    Deno.exit(1);
  }
}

switch (Deno.args[0]) {
  case "init":
    await init();
    break;
  case "info":
    await poolInfo();
    break;
  case "delegators":
    console.log("Delegators and their current stake: \n");
    await poolDelegators();
    break;
  case "payout":
    await payout();
    break;
  case "listTxs":
    await listTsx(Deno.args[1]);
    break;
  default:
    console.log("Unknown command");
    Deno.exit(1);
}
