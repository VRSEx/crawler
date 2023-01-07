/**
 * Strategy to crawl Catalog songs on 0x0bC2A24ce568DAd89691116d5B34DEB6C203F342.
 * Also known as Catalog V2 as they used to use Zora initially.
 */

import { ExtractionWorkerHandler } from "@neume-network/extraction-worker";
import { callTokenUri } from "../components/call-tokenuri.js";
import { getIpfsTokenUri } from "../components/get-ipfs-tokenuri.js";
import { Config, NFT } from "../types.js";
import { Strategy } from "./strategy.types.js";

export default class CatalogV2 implements Strategy {
  public static version = "2.0.0";
  public static createdAtBlock = 0;
  public static deprecatedAtBlock = null;
  private worker: ExtractionWorkerHandler;
  private config: Config;

  constructor(worker: ExtractionWorkerHandler, config: Config) {
    this.worker = worker;
    this.config = config;
  }

  crawl = async (nft: NFT) => {
    console.log("crawling catalog");
    nft.erc721.token.uri = await callTokenUri(
      this.worker,
      this.config,
      nft.erc721.blockNumber,
      nft
    );
    nft.erc721.token.uriContent = await getIpfsTokenUri(
      nft.erc721.token.uri,
      this.worker,
      this.config
    );

    const datum = nft.erc721.token.uriContent;

    let duration;
    if (datum?.duration) {
      duration = `PT${Math.floor(datum.duration / 60)}M${(
        datum.duration % 60
      ).toFixed(0)}S`;
    }

    return {
      version: CatalogV2.version,
      title: datum.title,
      duration,
      artist: {
        version: CatalogV2.version,
        name: datum.artist,
      },
      platform: {
        version: CatalogV2.version,
        name: "Catalog",
        uri: "https://catalog.works",
      },
      erc721: {
        // TODO: Stop hard coding this value
        owner: "0x489e043540ff11ec22226ca0a6f6f8e3040c7b5a",
        version: CatalogV2.version,
        createdAt: nft.erc721.blockNumber,
        tokenId: nft.erc721.token.id,
        address: nft.erc721.address,
        tokenURI: nft.erc721.token.uri,
        metadata: {
          ...datum,
          name: datum.name,
          description: datum.description,
          image: datum.image,
        },
      },
      manifestations: [
        {
          version: CatalogV2.version,
          uri: datum.image,
          mimetype: "image",
        },
        {
          version: CatalogV2.version,
          uri: datum.losslessAudio,
          mimetype: datum.mimeType,
        },
      ],
    };
  };

  updateOwner(nft: NFT) {}
}