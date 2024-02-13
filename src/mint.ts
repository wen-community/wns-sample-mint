import collection from "./assets/collection.json";
import nfts from "./assets/nfts.json";
import { createCollectionWithRoyalties, mintNft } from "./util";

export async function setupCollection() {

    // Will use AUTHORITY_KEYPAIR environment variable as the collection and nft authority.
    // Will use USER_KEYPAIR environment variable as the location to mint all the NFTs to and pay for the mint.
    const { collection: collectionAddress } = await createCollectionWithRoyalties(collection);
    return collectionAddress;
}

export async function mintNftsToCollection(collectionAddress: string) {

    // Will use AUTHORITY_KEYPAIR environment variable as the collection and nft authority.
    // Will use USER_KEYPAIR environment variable as the location to mint all the NFTs to and pay for the mint.
    const responses = [];
    
    for( let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        const res = await mintNft({ ...nft, collection: collectionAddress });
        responses.push(res);
    }
    return responses;
}