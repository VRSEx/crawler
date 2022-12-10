import test from "ava";
import { fileURLToPath } from "url";
import { DB } from "./index.js";
const db = new DB(fileURLToPath(new URL("./db", import.meta.url)));
const chainId = "1";
test.serial("should be able insert values", async (t) => {
    await t.notThrowsAsync(async () => db.insert({ chainId, address: "0x13", tokenId: "5", blockNumber: "95" }, { test: "data" }));
});
test.serial("should be able to delete values by id", async (t) => {
    await t.notThrowsAsync(async () => db.del({ chainId, address: "0x13", tokenId: "5", blockNumber: "95" }));
});
test.serial("should be able to get values by id", async (t) => {
    const datum = { chainId, address: "0x9b", tokenId: "2", blockNumber: "110" };
    const value = { test: "data" };
    await db.insert(datum, value);
    const ret = await db.getOne(datum);
    t.deepEqual(ret.id, datum);
    t.deepEqual(ret.value, value);
});
test.serial("should get value at latest block number if no block number is specified", async (t) => {
    const values = [
        {
            id: { chainId, address: "0x01", tokenId: "1", blockNumber: "100" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0x01", tokenId: "1", blockNumber: "101" },
            value: { test: "updated-data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const { blockNumber, ...datum } = values[0].id;
    const ret = await db.getOne(datum);
    t.deepEqual(ret.id, values[1].id);
    t.deepEqual(ret.value, values[1].value);
});
test.serial("provided with only chainId and address should get all tokenIds", async (t) => {
    const address = "0xb8";
    const values = [
        {
            id: { chainId, address, tokenId: "1", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address, tokenId: "2", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address, tokenId: "2", blockNumber: "120" },
            value: { test: "updated-data" },
        },
        {
            id: { chainId, address, tokenId: "3", blockNumber: "130" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xc8", tokenId: "3", blockNumber: "110" },
            value: { test: "data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const ret = [];
    for await (const r of db.getMany({ chainId, address })) {
        ret.push(r);
    }
    t.deepEqual(ret, [values[0], values[2], values[3]]);
});
test.serial("provided with chainId, address and a block number should get all tokenIds upto the given block number", async (t) => {
    const address = "0xb8";
    const values = [
        {
            id: { chainId, address, tokenId: "1", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address, tokenId: "2", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address, tokenId: "2", blockNumber: "120" },
            value: { test: "updated-data" },
        },
        {
            id: { chainId, address, tokenId: "3", blockNumber: "130" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xc8", tokenId: "3", blockNumber: "110" },
            value: { test: "data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const ret = [];
    for await (const r of db.getMany({
        chainId,
        address,
        blockNumber: "110",
    })) {
        ret.push(r);
    }
    t.deepEqual(ret, [values[0], values[1]]);
});
test.serial("provided with only chainId should get all tokenIds", async (t) => {
    const values = [
        {
            id: { chainId, address: "0xb8", tokenId: "1", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xb9", tokenId: "2", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xb9", tokenId: "2", blockNumber: "120" },
            value: { test: "updated-data" },
        },
        {
            id: { chainId, address: "0xc8", tokenId: "3", blockNumber: "130" },
            value: { test: "data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const ret = [];
    for await (const r of db.getMany({ chainId })) {
        ret.push(r);
    }
    t.deepEqual(ret, [values[0], values[2], values[3]]);
});
test.serial("provided with chainId and blockNumber should get all tokenIds upto the given block number", async (t) => {
    const values = [
        {
            id: { chainId, address: "0xb8", tokenId: "1", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xb9", tokenId: "2", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xb9", tokenId: "2", blockNumber: "120" },
            value: { test: "updated-data" },
        },
        {
            id: { chainId, address: "0xc8", tokenId: "3", blockNumber: "130" },
            value: { test: "data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const ret = [];
    for await (const r of db.getMany({ chainId, blockNumber: "110" })) {
        ret.push(r);
    }
    t.deepEqual(ret, [values[0], values[1]]);
});
test.serial("should rewrite data if id is same", async (t) => {
    const values = [
        {
            id: { chainId, address: "0xa0", tokenId: "1", blockNumber: "110" },
            value: { test: "data" },
        },
        {
            id: { chainId, address: "0xa0", tokenId: "1", blockNumber: "110" },
            value: { test: "updated-data" },
        },
    ];
    await Promise.all(values.map((v) => db.insert(v.id, v.value)));
    const { blockNumber, ...datum } = values[0].id;
    const ret = await db.getOne(datum);
    t.deepEqual(ret.id, values[0].id);
    t.deepEqual(ret.value, values[1].value);
});
test.afterEach("clear database", async (t) => {
    await db.level.clear();
});
test.after("close database", async (t) => {
    await db.level.close();
});