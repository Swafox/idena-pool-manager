import * as api from "./src/api.ts"; // Import API functions
import { load } from "https://deno.land/std@0.170.0/dotenv/mod.ts";
import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";

const env = await load(); // Load the .env file
const poolAddress = env["POOL_ADDRESS"] as string; // Get the address from .env

const kv = await Deno.openKv(); // Initialize local keystore db

// Check that the pool address is set
if (poolAddress == null) {
  console.log(
    "Please set POOL_ADDRESS in .env, see .env.example for an example",
  );
  Deno.exit(1);
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

// Records the delegator stake in the local db
async function recordDelegatorStake() {
  const delegators = await api.getPoolDelegators(poolAddress);
  console.log(`Delegators: ${delegators.result.length}`);
  for (const delegator of delegators.result) {
    await kv.set(["delegators", delegator.address], { stake: delegator.stake });
  }
}

// Get local delegator stake
async function getKvDelegatorStake(address: string) {
  try {
    const delegatorStake = await kv.get(["delegators", address]);
    return delegatorStake;
  } catch (error) {
    throw error;
  }
}

// List all transactions for an address
async function listTsx(address: string) {
  const txs = await api.getTxsForEpoch(address);
  console.log(txs);
}

// Calculate payout for a delegator
function calculatePayout(
  stakeStart: number,
  stakeEnd: number,
  replenishAmount?: number,
) {
  let stakeDiff = 0;
  if (replenishAmount) {
    stakeDiff = stakeEnd - stakeStart - replenishAmount;
    console.log("Replenish was found, difference now is: " + stakeDiff + "\n");
  } else {
    stakeDiff = stakeEnd - stakeStart;
  }

  const balance = ((stakeDiff * 100) / 20) - stakeDiff;
  console.log("Balance: " + balance + "\n");
  const total = balance + stakeDiff;
  console.log("Total: " + total + "\n");
  const commission = total * 0.15;
  console.log("Commission: " + commission + "\n");
  const payout = balance - commission;
  return payout;
}

// Calculate payout for all delegators and generate payout txs
async function payout() {
  const delegators = await api.getPoolDelegators(poolAddress);
  for (const delegator of delegators.result) {
    const delegatorLocalStake = await kv.get(["delegators", delegator.address]); // local
    let stakeDiff = delegator.stake - delegatorLocalStake.value.stake as number;
    console.log(
      `${
        chalkin.blue(delegator.address)
      } has ${delegator.stake}, while ${delegatorLocalStake.value.stake} in local db. Raw difference: ${
        stakeDiff > 0 ? chalkin.green(stakeDiff) : chalkin.red(stakeDiff)
      }`,
    );

    const tsx = await api.getTxsForEpoch(delegator.address);
    const lastEpochNum = await api.getLastEpoch();
    const lastEpochTime = await api.getEpoch(lastEpochNum.result.epoch - 1);

    let replenish = false;
    let totalWComission = 0;
    for (const tx of tsx.result) {
      if (tx.timestamp > lastEpochTime.result.validationTime) {
        if (tx.type == "ReplenishStakeTx") {
          totalWComission = calculatePayout(
            delegatorLocalStake.value.stake as number,
            delegator.stake,
            tx.amount,
          );
          break;
        }
      } else {
        totalWComission = calculatePayout(
          delegatorLocalStake.value.stake as number,
          delegator.stake,
        );
        break;
      }
    }

    console.log(
      `Total payout for ${chalkin.blue(delegator.address)}: ${
        chalkin.green(totalWComission)
      }`,
    );

    // create transaction to send totalWCommision to delegator
    console.log(
      `Pay: ${
        chalkin.red(
          `https://app.idena.io/dna/send?address=${delegator.address}&amount=${totalWComission}&comment=Delegator%20payout%20for%20${poolAddress}`,
        )
      }\n\n`,
    );
  }
  console.log("Do you want to log the new delegator stakes? (y/n)");
  const answer = prompt();
  if (answer == "y") {
    await recordDelegatorStake().then(() =>
      console.log("Delegator stake recorded")
    );
  } else {
    console.log("Delegator stake not recorded");
  }
}

switch (Deno.args[0]) {
  case "info":
    await poolInfo();
    break;
  case "delegators":
    console.log("Delegators and their current stake: \n");
    await poolDelegators();
    break;
  case "log":
    await recordDelegatorStake().then(() =>
      console.log("Delegator stake recorded")
    );
    break;
  case "payout":
    await payout();
    break;
  case "listTxs":
    await listTsx(Deno.args[1]);
    break;
  case "checkDB": {
    const delegatorLocalStake = await getKvDelegatorStake(Deno.args[1]);
    console.log(
      chalkin.blue(delegatorLocalStake.key[1]) + " has " +
        chalkin.green(delegatorLocalStake.value.stake as string) +
        " in local db",
    );
    break;
  }
  default:
    console.log("Unknown command");
    Deno.exit(1);
}
