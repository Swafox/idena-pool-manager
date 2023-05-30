const baseUrl = "https://api.idena.io/api";

export async function callAPI(url: string) {
  url = baseUrl + url;
  const response = await fetch(url);
  return response.json();
}

export async function getPool(address: string) {
  return await callAPI(`/Pool/${address}`);
}

export async function getPoolDelegators(address: string) {
  return await callAPI(`/Pool/${address}/Delegators?limit=100`);
}

export async function getPoolDelegatorsCount(address: string) {
  return await callAPI(`/Pool/${address}/Delegators/Count`);
}

export async function getPoolSizeHistory(address: string) {
  return await callAPI(`/Pool/${address}/SizeHistory?limit=100`);
}

export async function getDelegatorRewards(epoch: number, address: string) {
  return await callAPI(
    `/epoch/${epoch}/address/${address}/delegateeRewards?limit=100`,
  );
}

export async function getDelegateeTotalRewards(address: string) {
  return await callAPI(`/address/${address}/delegateeTotalRewards?limit=2`);
}

export async function getLastEpoch() {
  return await callAPI(`/Epoch/Last`);
}

export async function getTxsForEpoch(address: string) {
  return await callAPI(`/address/${address}/txs?limit=50`);
}

export async function miningReward(address: string) {
  return await callAPI(`/Address/${address}/MiningRewardSummaries?limit=2`);
}

export async function validationSummary(epoch: number, address: string) {
  return await callAPI(`/Epoch/${epoch}/Identity/${address}/ValidationSummary`);
}

export async function identity(epoch: number, address: string) {
  return await callAPI(`/Epoch/${epoch}/Identity/${address}`);
}
