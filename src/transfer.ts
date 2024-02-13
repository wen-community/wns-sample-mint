import collection from "./assets/collection.json";
import { transferMint } from "./util";
import { TransferNftArgs } from "./utils";

export async function transferNft(transferParams: TransferNftArgs) {

    // Will use AUTHORITY_KEYPAIR environment variable as the collection and nft authority.
    // Will use USER_KEYPAIR environment variable as the location to mint all the NFTs to and pay for the mint.
    const { txn } = await transferMint(transferParams);
    return txn;
}
