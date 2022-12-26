import { fastify as Fastify } from "fastify";
import { JSONRPCServer, JSONRPCErrorException } from "json-rpc-2.0";

import { Config } from "../../types.js";
import { getLatestBlockNumber, getStrategies } from "../../utils.js";
import crawl from "../crawl.js";
import filter_contracts from "../filter_contracts.js";
import { db } from "../../database/index.js";
import { DaemonJsonrpcType } from "./daemon-jsonrpc-type.js";
import { daemonJsonrpcSchema } from "./daemon-jsonrpc-schema.js";

const fastify = Fastify();

export default async function daemon(
  from: number,
  crawlFlag: boolean,
  config: Config,
  strategyNames: string[]
) {
  let to = Math.min(from + 5000, await getLatestBlockNumber(config.rpc[0]));
  const strategies = getStrategies(strategyNames, from, to);

  const task = async () => {
    console.log("Starting a crawl cycle");

    to = Math.min(from + 5000, await getLatestBlockNumber(config.rpc[0]));

    await filter_contracts(from, to, config, strategies);
    await crawl(from, to, config, strategies);

    from = to;
    setTimeout(task, 10);
  };

  if (crawlFlag) task();
  await startServer();
}

async function startServer() {
  const server = new JSONRPCServer();
  server.addMethod("getIdsChanged_fill", async ([from, to]) => {
    if (to - from > 5000)
      throw new JSONRPCErrorException(
        "Block range should be less than 5000",
        -32600
      );
    const res = await db.getIdsChanged_fill(from, to);
    return res;
  });

  fastify.route<{ Body: DaemonJsonrpcType }>({
    method: "POST",
    url: "/",
    schema: {
      body: daemonJsonrpcSchema,
    },
    handler: async (request, reply) => {
      const res = await server.receive(request.body);
      return res;
    },
  });

  return fastify.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Daemon started at ${address}`);
  });
}