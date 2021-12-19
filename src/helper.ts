import { Address, Bytes, BigInt, log, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  Assign,
  Punk,
  MetaData,
  Contract,
  Transfer,
  Wrap,
  Unwrap,
  Ask,
  AskRemoved,
  AskCreated,
  Sale,
  BidCreated,
  BidRemoved,
  Bid,
} from "../generated/schema";
import {
  TOKEN_URI,
  CONTRACT_URI,
  IMAGE_URI,
  ZERO_ADDRESS,
  WRAPPED_PUNK_ADDRESS,
  CRYPTOPUNKS_ADDRESS,
} from "./constant";

import { cryptopunks } from "../generated/cryptopunks/cryptopunks";
import { WrappedPunks } from "../generated/WrappedPunks/WrappedPunks";

export function getOrCreateAccount(address: Address): Account {
  let id = address.toHexString();
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.numberOfPunksOwned = BigInt.fromI32(0);
  }

  return account as Account;
}

// export function fillEvent(
//   event: ethereum.Event,
//   account: Account,
//   contract: Contract,
//   nft: Punk,
//   entityType: string // "ASSIGN" | "TRANSFER"
// ): Assign | Transfer {
//   let id =
//     event.transaction.hash.toHexString() +
//     "-" +
//     event.logIndex.toString() +
//     "-" +
//     entityType;

//   let entity;
//   if (entityType == "ASSIGN") {
//     entity = new Assign(id);
//   } else if (entityType == "TRANSFER") {
//     entity = new Transfer(id);
//   }

//   entity.to = account.id;
//   entity.nft = nft.id;
//   entity.timestamp = event.block.timestamp;
//   entity.blockNumber = event.block.number;
//   entity.txHash = event.transaction.hash;
//   entity.blockHash = event.block.hash;
//   entity.contract = contract.id;
//   entity.type = entityType;

//   entity.save();

//   return entity;
// }

export function getOrCreateAssign(
  id: BigInt,
  punk: Punk,
  account: Address,
  metadata: MetaData,
  event: ethereum.Event
): Assign {
  let assign = Assign.load(
    id
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
      .concat("-")
      .concat("ASSIGN")
  );

  if (!assign) {
    assign = new Assign(
      id
        .toString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat("ASSIGN")
    );
  }
  assign.to = account.toHexString();
  assign.nft = punk.id;
  assign.timestamp = event.block.timestamp;
  assign.contract = event.address.toHexString();
  assign.blockNumber = event.block.number;
  assign.txHash = event.transaction.hash;
  assign.blockHash = event.block.hash;
  punk.metadata = metadata.id;
  punk.assignedTo = account.toHexString();
  punk.transferedTo = account.toHexString();
  assign.type = "ASSIGN";
  assign.save();

  return assign as Assign;
}

export function getOrCreatePunk(id: BigInt, account: Address): Punk {
  let punk = Punk.load(id.toString());
  if (!punk) {
    punk = new Punk(id.toString());
    punk.wrapped = false;
  }
  punk.tokenId = id;
  punk.owner = account.toHexString();
  punk.save();

  return punk as Punk;
}

export function getOrCreateMetadata(
  punkId: BigInt,
  event: ethereum.Event
): MetaData {
  let metadata = MetaData.load(
    punkId
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
      .concat("-")
      .concat("METADATA")
  );

  if (!metadata) {
    metadata = new MetaData(
      punkId
        .toString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat("METADATA")
    );
    metadata.tokenURI = TOKEN_URI.concat(punkId.toString());
    metadata.contractURI = CONTRACT_URI;
    metadata.tokenId = punkId;
    metadata.punk = punkId.toString();
    metadata.contractURI = CONTRACT_URI;
    metadata.imageURI = IMAGE_URI.concat(punkId.toString()).concat(".png");

    metadata.traits = new Array<string>();

    metadata.save();
  }

  return metadata as MetaData;
}

export function getOrCreateCryptoPunkContract(address: Address): Contract {
  let id = address.toHexString();
  let contract = Contract.load(id);
  let cryptopunk = cryptopunks.bind(address);

  if (!contract) {
    contract = new Contract(id);
    contract.totalAmountTraded = BigInt.fromI32(0);
    contract.totalSales = BigInt.fromI32(0);

    let symbolCall = cryptopunk.try_symbol();
    if (!symbolCall.reverted) {
      contract.symbol = symbolCall.value;
    } else {
      log.warning("symbolCall Reverted", []);
    }

    let nameCall = cryptopunk.try_name();
    if (!nameCall.reverted) {
      contract.name = nameCall.value;
    } else {
      log.warning("nameCall Reverted", []);
    }

    let imageHashCall = cryptopunk.try_imageHash();
    if (!imageHashCall.reverted) {
      contract.imageHash = imageHashCall.value;
    } else {
      log.warning("imageHashCall Reverted", []);
    }

    let totalSupplyCall = cryptopunk.try_totalSupply();
    if (!totalSupplyCall.reverted) {
      contract.totalSupply = totalSupplyCall.value;
    } else {
      log.warning("totalSupplyCall Reverted", []);
    }

    contract.save();
  }

  return contract as Contract;
}

export function getOrCreateWrappedPunkContract(address: Address): Contract {
  let id = address.toHexString();
  let contract = Contract.load(id);
  let wrappedPunks = WrappedPunks.bind(address);

  if (!contract) {
    contract = new Contract(id);
    contract.totalAmountTraded = BigInt.fromI32(0);
    contract.totalSales = BigInt.fromI32(0);

    let symbolCall = wrappedPunks.try_symbol();
    if (!symbolCall.reverted) {
      contract.symbol = symbolCall.value;
    } else {
      log.warning("symbolCall Reverted", []);
    }

    let nameCall = wrappedPunks.try_name();
    if (!nameCall.reverted) {
      contract.name = nameCall.value;
    } else {
      log.warning("nameCall Reverted", []);
    }

    let totalSupplyCall = wrappedPunks.try_totalSupply();
    if (!totalSupplyCall.reverted) {
      contract.totalSupply = totalSupplyCall.value;
    } else {
      log.warning("totalSupplyCall Reverted", []);
    }

    contract.save();
  }

  return contract as Contract;
}

export function getOrCreateWrap(
  id: Address,
  fromAccount: Address,
  nft: BigInt,
  event: ethereum.Event
): Wrap {
  let wrap = Wrap.load(
    id
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
      .concat("-")
      .concat("WRAP")
  );

  if (!wrap) {
    wrap = new Wrap(
      id
        .toHexString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat("WRAP")
    );
  }
  wrap.from = fromAccount.toHexString();
  wrap.type = "WRAP";
  wrap.timestamp = event.block.timestamp;
  wrap.nft = nft.toString();
  wrap.blockNumber = event.block.number;
  wrap.blockHash = event.block.hash;
  wrap.txHash = event.transaction.hash;

  wrap.save();
  return wrap as Wrap;
}

export function getOrCreateUnWrap(
  id: Address,
  fromAccount: Address,
  toAccount: Address,
  nft: BigInt,
  event: ethereum.Event
): Unwrap {
  let unWrap = Unwrap.load(
    id
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
      .concat("-")
      .concat("UNWRAP")
  );

  if (!unWrap) {
    unWrap = new Unwrap(
      id
        .toHexString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat("UNWRAP")
    );
  }
  unWrap.from = fromAccount.toHexString();
  unWrap.to = toAccount.toHexString();
  unWrap.type = "UNWRAP";
  unWrap.timestamp = event.block.timestamp;
  unWrap.nft = nft.toString();
  unWrap.blockNumber = event.block.number;
  unWrap.blockHash = event.block.hash;
  unWrap.txHash = event.transaction.hash;

  unWrap.save();
  return unWrap as Unwrap;
}

export function getOrCreateAsk(
  account: Account,
  askRemoved: AskRemoved,
  askCreated: AskCreated,
  nft: BigInt,
  event: ethereum.Event
): Ask {
  let ask = Ask.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "ASK"
  );

  if (!ask) {
    ask = new Ask(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "ASK"
    );
  }
  ask.nft = nft.toString();
  ask.from = account.id;
  ask.created = askCreated.id;
  ask.offerType = "ASK";
  ask.removed = askRemoved.id;
  ask.save();

  return ask as Ask;
}

export function getOrCreateAskCreated(
  nft: BigInt,
  event: ethereum.Event
): AskCreated {
  let askCreated = AskCreated.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "ASKCREATED"
  );

  if (!askCreated) {
    askCreated = new AskCreated(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "ASKCREATED"
    );
  }
  askCreated.type = "ASK_CREATED";
  askCreated.nft = nft.toString();
  askCreated.timestamp = event.block.timestamp;
  askCreated.blockNumber = event.block.number;
  askCreated.txHash = event.transaction.hash;
  askCreated.blockHash = event.block.hash;
  askCreated.contract = event.address.toHexString();
  askCreated.save();

  return askCreated as AskCreated;
}

export function getOrCreateAskRemoved(
  nft: BigInt,
  event: ethereum.Event
): AskRemoved {
  let askRemoved = AskRemoved.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "ASKREMOVED"
  );

  if (!askRemoved) {
    askRemoved = new AskRemoved(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "ASKREMOVED"
    );
  }
  askRemoved.type = "ASK_REMOVED";
  askRemoved.nft = nft.toString();
  askRemoved.timestamp = event.block.timestamp;
  askRemoved.blockNumber = event.block.number;
  askRemoved.txHash = event.transaction.hash;
  askRemoved.blockHash = event.block.hash;
  askRemoved.contract = event.address.toHexString();
  askRemoved.save();

  return askRemoved as AskRemoved;
}

export function getOrCreateSale(
  toAddress: Address,
  fromAddress: Address,
  punk: BigInt,
  event: ethereum.Event
): Sale {
  let sale = Sale.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "SALE"
  );

  if (!sale) {
    sale = new Sale(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "SALE"
    );
  }

  sale.to = toAddress.toHexString();
  sale.from = fromAddress.toHexString();
  sale.contract = event.address.toHexString();
  sale.nft = punk.toString();
  sale.timestamp = event.block.timestamp;
  sale.blockNumber = event.block.number;
  sale.txHash = event.transaction.hash;
  sale.blockHash = event.block.hash;
  sale.type = "SALE";

  sale.save();
  return sale as Sale;
}

export function getOrCreateTransfer(
  fromAddress: Address,
  toAddress: Address,
  punk: BigInt,
  event: ethereum.Event,
  entityType: string
): Transfer {
  let transfer = Transfer.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      entityType
  );

  if (!transfer) {
    transfer = new Transfer(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        entityType //REGULAR TRANSFER or WRAPPEDPUNK TRANSFER
    );
  }

  transfer.from = fromAddress.toHexString();
  transfer.to = toAddress.toHexString();
  transfer.contract = event.address.toHexString();
  transfer.nft = punk.toString();
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.txHash = event.transaction.hash;
  transfer.blockHash = event.block.hash;
  transfer.type = "TRANSFER";

  transfer.save();
  return transfer as Transfer;
}

export function getOrCreateBid(
  account: Address,
  bidRemoved: BidRemoved,
  bidCreated: BidCreated,
  nft: BigInt,
  event: ethereum.Event
): Bid {
  let bid = Bid.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "BID"
  );

  if (!bid) {
    bid = new Bid(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "BID"
    );
    bid.open = true;
  }
  bid.nft = nft.toString();
  bid.from = account.toHexString();
  bid.created = bidCreated.id;
  bid.offerType = "BID";
  bid.removed = bidRemoved.id;
  bid.save();

  return bid as Bid;
}

export function getOrCreateBidCreated(
  fromAddress: Address,
  nft: BigInt,
  event: ethereum.Event
): BidCreated {
  let bidCreated = BidCreated.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "BIDCREATED"
  );

  if (!bidCreated) {
    bidCreated = new BidCreated(
      event.transaction.hash.toHexString() +
        "-" +
        event.logIndex.toString() +
        "-" +
        "BIDCREATED"
    );
  }
  bidCreated.type = "BID_CREATED";
  bidCreated.nft = nft.toString();
  bidCreated.from = fromAddress.toHexString();
  bidCreated.timestamp = event.block.timestamp;
  bidCreated.blockNumber = event.block.number;
  bidCreated.txHash = event.transaction.hash;
  bidCreated.blockHash = event.block.hash;
  bidCreated.contract = event.address.toHexString();
  bidCreated.save();

  return bidCreated as BidCreated;
}

export function getOrCreateBidRemoved(
  fromAddress: Address,
  bidCreated: BidCreated,
  nft: BigInt,
  event: ethereum.Event
): BidRemoved {
  let bidRemoved = BidRemoved.load(
    event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString() +
      "-" +
      "BIDREMOVED"
  );

  if (!bidRemoved) {
    bidRemoved = new BidRemoved(
      event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat("BIDREMOVED")
    );
  }

  bidRemoved.bid = bidCreated.id;
  bidRemoved.from = fromAddress.toHexString();
  bidRemoved.contract = event.address.toHexString();
  bidRemoved.nft = nft.toString();
  bidRemoved.timestamp = event.block.timestamp;
  bidRemoved.blockNumber = event.block.number;
  bidRemoved.txHash = event.transaction.hash;
  bidRemoved.blockHash = event.block.hash;
  bidRemoved.type = "BID_REMOVED";
  bidRemoved.save();

  return bidRemoved as BidRemoved;
}
