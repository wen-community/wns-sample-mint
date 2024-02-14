import collection from "./assets/collection.json";
import { purchaseNft, transferNft } from "./util";
import { PurchaseNftArgs, TransferNftArgs } from "./utils";

export async function sendNftPurchase(purchaseParams: PurchaseNftArgs) {

    // Will use AUTHORITY_KEYPAIR environment variable as the collection and nft authority.
    // Will use USER_KEYPAIR environment variable as the location to mint all the NFTs to and pay for the mint.
    const { txn } = await purchaseNft(purchaseParams);
    return txn;
}

export async function sendNftTransfer(transferParams: TransferNftArgs) {

    // Will use AUTHORITY_KEYPAIR environment variable as the collection and nft authority.
    // Will use USER_KEYPAIR environment variable as the location to mint all the NFTs to and pay for the mint.
    const { txn } = await transferNft(transferParams);
    return txn;
}