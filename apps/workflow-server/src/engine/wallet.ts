import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Chain,
  type Hash,
  type TransactionReceipt,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia, mainnet } from "viem/chains";

// --- Configuration ---

const NETWORK_MODE = process.env.NETWORK_MODE ?? "dry-run"; // "dry-run" | "testnet" | "mainnet"
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 1); // Ethereum mainnet by default
const RPC_URL = process.env.RPC_URL; // optional override
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

const chains: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  84532: baseSepolia,
};

function getChain(): Chain {
  return chains[CHAIN_ID] ?? baseSepolia;
}

function getTransport() {
  return http(RPC_URL ?? undefined);
}

// --- Clients (lazy init) ---

let _walletClient: ReturnType<typeof createWalletClient> | null = null;
let _publicClient: ReturnType<typeof createPublicClient> | null = null;

function getAccount() {
  if (!PRIVATE_KEY) {
    throw new Error("WALLET_PRIVATE_KEY not set. Add it to your .env file.");
  }
  const key = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  return privateKeyToAccount(key as `0x${string}`);
}

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: getChain(),
      transport: getTransport(),
    });
  }
  return _publicClient;
}

function getWalletClient() {
  if (!_walletClient) {
    _walletClient = createWalletClient({
      account: getAccount(),
      chain: getChain(),
      transport: getTransport(),
    });
  }
  return _walletClient;
}

// --- Public API ---

export function isDryRun(): boolean {
  return NETWORK_MODE === "dry-run" || !PRIVATE_KEY;
}

export function getNetworkMode(): string {
  return NETWORK_MODE;
}

export function getChainInfo() {
  const chain = getChain();
  return { chainId: chain.id, name: chain.name, networkMode: NETWORK_MODE };
}

export function getWalletAddress(): string | null {
  if (!PRIVATE_KEY) return null;
  try {
    return getAccount().address;
  } catch {
    return null;
  }
}

export async function getWalletBalance(): Promise<{ balance: string; balanceWei: bigint } | null> {
  const address = getWalletAddress();
  if (!address) return null;
  const client = getPublicClient();
  const balanceWei = await client.getBalance({ address: address as `0x${string}` });
  return { balance: formatEther(balanceWei), balanceWei };
}

export async function getAddressBalance(address: string): Promise<{ balance: string; balanceWei: bigint }> {
  const client = getPublicClient();
  const balanceWei = await client.getBalance({ address: address as `0x${string}` });
  return { balance: formatEther(balanceWei), balanceWei };
}

export async function sendTransaction(params: {
  to: string;
  value?: string; // in ETH
  data?: string; // hex-encoded calldata
}): Promise<{ hash: Hash; receipt: TransactionReceipt }> {
  if (isDryRun()) {
    throw new Error("Cannot send transactions in dry-run mode. Set NETWORK_MODE=testnet and WALLET_PRIVATE_KEY.");
  }
  const wallet = getWalletClient();
  const account = getAccount();
  const chain = getChain();
  const hash = await wallet.sendTransaction({
    account,
    chain,
    to: params.to as `0x${string}`,
    value: params.value ? parseEther(params.value) : undefined,
    data: params.data ? (params.data as `0x${string}`) : undefined,
  });
  const client = getPublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}

export async function readContract(params: {
  address: string;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
}): Promise<unknown> {
  const client = getPublicClient();
  return client.readContract({
    address: params.address as `0x${string}`,
    abi: params.abi as any,
    functionName: params.functionName,
    args: params.args,
  });
}

export async function writeContract(params: {
  address: string;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}): Promise<{ hash: Hash; receipt: TransactionReceipt }> {
  if (isDryRun()) {
    throw new Error("Cannot write contracts in dry-run mode.");
  }
  const wallet = getWalletClient();
  const account = getAccount();
  const chain = getChain();
  const hash = await wallet.writeContract({
    account,
    chain,
    address: params.address as `0x${string}`,
    abi: params.abi as any,
    functionName: params.functionName,
    args: params.args ?? [],
    value: params.value,
  });
  const client = getPublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}
