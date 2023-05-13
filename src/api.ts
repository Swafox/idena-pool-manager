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
    `/epoch/${epoch}/address/${address}/delegateeRewards?limit=30`,
  );
}

export async function getDelegateeTotalRewards(address: string) {
  return await callAPI(`/address/${address}/delegateeTotalRewards?limit=2`);
}

export async function getLastEpoch() {
  return await callAPI(`/Epoch/Last`);
}

export async function getEpoch(epoch: number) {
  return await callAPI(`/Epoch/${epoch}`);
}

export async function getTxsForEpoch(address: string) {
  return await callAPI(`/address/${address}/txs?limit=50`);
}
