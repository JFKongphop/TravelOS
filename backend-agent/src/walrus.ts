const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

export async function uploadToWalrus(
  data: Uint8Array,
  epochs: number = 5
): Promise<string | null> {
  try {
    const url = `${PUBLISHER}/v1/blobs?epochs=${epochs}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: data,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const blobId = json.newlyCreated?.blobObject?.blobId || json.blobId;
    if (blobId) console.log(`[Walrus] Stored: ${blobId}`);
    return blobId || null;
  } catch {
    return null;
  }
}

export async function readFromWalrus(blobId: string): Promise<string | null> {
  try {
    const url = `${AGGREGATOR}/v1/blobs/${encodeURIComponent(blobId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function walrusUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}

export async function walrusHealth(): Promise<boolean> {
  try {
    const testData = new TextEncoder().encode("health-check");
    const blobId = await uploadToWalrus(testData, 1);
    return blobId !== null;
  } catch {
    return false;
  }
}
