export const AGENT_BACKEND =
  process.env['NEXT_PUBLIC_AGENT_BACKEND'] || 'http://localhost:3001';

export const SUI_PACKAGE_ID =
  process.env['NEXT_PUBLIC_SUI_PACKAGE_ID'] || '';

export const SUI_NETWORK =
  process.env['NEXT_PUBLIC_SUI_NETWORK'] || 'testnet';

export const EXPLORER_BASE =
  SUI_NETWORK === 'mainnet'
    ? 'https://suivision.xyz/txblock'
    : 'https://testnet.suivision.xyz/txblock';

export function explorerUrl(digest: string): string {
  return `${EXPLORER_BASE}/${digest}`;
}

export interface ChatResponse {
  context: any;
  plan: {
    blueprint: any;
    treasuryStrategy: any;
    bookings: any;
    riskAssessment: any;
  };
  logs: Array<{ agent: string; data: any }>;
  walrus: { blobId: string | null; url: string };
  markdown: string;
}

export interface ActionStep {
  step: number;
  name: string;
  description: string;
  action: string;
  params?: any;
}

export interface FullPlanResponse {
  context: any;
  plan: {
    blueprint: any;
    treasuryStrategy: any;
    bookings: any;
    riskAssessment: any;
  };
  logs: Array<{ agent: string; data: any }>;
  walrus: { blobId: string | null; url: string };
  markdown: string;
  actions: ActionStep[];
  summary: string;
}

export interface ExecuteResponse {
  action: string;
  txBytes: string;
}

export async function apiChat(message: string): Promise<ChatResponse> {
  const res = await fetch(`${AGENT_BACKEND}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiFullPlan(message: string, sender: string): Promise<FullPlanResponse> {
  const res = await fetch(`${AGENT_BACKEND}/api/full-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sender }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiExecute(
  action: string,
  sender: string,
  params?: any,
): Promise<ExecuteResponse> {
  const res = await fetch(`${AGENT_BACKEND}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, sender, params }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
