import { TravelOSClient, PACKAGE_ID } from "travelos-sdk";
const client = new TravelOSClient({ packageId: PACKAGE_ID, network: "testnet" });
export function getSDK() {
    return client;
}
//# sourceMappingURL=sdk.js.map