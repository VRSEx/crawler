import { readFile } from "fs/promises";
import path from "path";
import https from "https";
import SoundProtocol from "./strategies/sound_protocol.js";
import { Strategy } from "./strategies/strategy.types.js";
import { RpcConfig } from "./types.js";

export function randomItem<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

//curl -s https://cloudflare-eth.com/v1/mainnet -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

export function getLatestBlockNumber(rpcHost: RpcConfig): Promise<number> {
  return new Promise((resolve, reject) => {
    let data = "";
    const req = https.request(
      rpcHost.url,
      {
        method: "POST",
        headers: {
          ...(rpcHost.key && { Authorization: `Bearer ${rpcHost.key}` }),
        },
      },
      (res) => {
        res.setEncoding("utf8");
        res.on("error", reject);
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const ret = JSON.parse(data);
          if (ret.error) reject(ret.error);
          resolve(parseInt(ret.result, 16));
        });
      }
    );

    req.on("error", reject);
    req.write(
      '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    );
    req.end();
  });
}

/**
 * User's contracts.json contains the new found addresses
 * Neume's contracts.json contains hardcoded addresses
 * This function reads and merge them both.
 */
export async function getContracts(): Promise<Record<string, any>> {
  const defaultContractsPath = new URL(
    "./contracts.hardcode.json",
    import.meta.url
  );
  const userContractsPath = path.resolve("./contracts.json");

  return {
    ...JSON.parse(await readFile(defaultContractsPath, "utf-8")),
    ...JSON.parse(await readFile(userContractsPath, "utf-8")),
  };
}

/**
 * New strategies should be added here.
 *
 * For development if you wish to run only a few selected strategies
 * then modify this function.
 */
export function getStrategies(
  strategyNames: string[],
  from: number,
  to: number
) {
  const strategies: Array<typeof Strategy> = [SoundProtocol];

  return strategies.filter(
    (s) =>
      s.createdAtBlock <= from &&
      to <= (s.deprecatedAtBlock ?? Number.MAX_VALUE) &&
      strategyNames.includes(s.name)
  );
}
