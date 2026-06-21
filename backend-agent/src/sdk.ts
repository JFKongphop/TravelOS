import { TravelOSClient, PACKAGE_ID } from "travelos-sdk";

const client = new TravelOSClient({ packageId: PACKAGE_ID, network: "testnet" });

export function getSDK(): TravelOSClient {
  return client;
}
