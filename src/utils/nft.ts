import { Provider } from "@coral-xyz/anchor";
import { getATAAddressSync, getExtraMetasAccount, getGroupAccount, getManagerAccount, getMemberAccount, getMetadataProgram } from "./core";
import { CreateNftArgs, Creator } from "./interfaces";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "./constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const buildMintNftIx = async (provider: Provider, args: CreateNftArgs, minter: string, authority: string) => {
    const metadataProgram = getMetadataProgram(provider);
    const managerAccount = getManagerAccount();

    const mintPubkey = new PublicKey(args.mint);
    const authorityPubkey = new PublicKey(authority);
    const minterPubkey = new PublicKey(minter);

    const permDel = args.permanent_delegate !== null ? new PublicKey(args.permanent_delegate) : null;

    const ix = await metadataProgram.methods
        .createMintAccount({ name: args.name, symbol: args.symbol, uri: args.uri, permanentDelegate: permDel })
        .accountsStrict({
            payer: minterPubkey,
            authority: authorityPubkey,
            receiver: minterPubkey,
            mint: mintPubkey,
            mintTokenAccount: getATAAddressSync({ mint: mintPubkey, owner: minterPubkey }),
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            manager: managerAccount
        })
        .instruction();
    return ix;
};

export const buildAddGroupIx = async (provider: Provider, payer: string, collectionAuthority: string, mint: string, collectionMint: string) => {
    const metadataProgram = getMetadataProgram(provider);

    const groupAccount = getGroupAccount(collectionMint);
    console.log({ groupAccount: groupAccount.toString() });
    const manager = getManagerAccount();
    const memberAccount = getMemberAccount(mint);
    const collectionAuthPubkey = new PublicKey(collectionAuthority);
    const mintPubkey = new PublicKey(mint);
    const payerPubkey = new PublicKey(payer);

    const ix = await metadataProgram.methods
        .addMintToGroup()
        .accountsStrict({
            payer: payerPubkey,
            authority: collectionAuthPubkey,
            group: groupAccount,
            member: memberAccount,
            mint: mintPubkey,
            manager,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .instruction();

    return ix;
}

export const buildAddRoyaltiesIx = async (provider: Provider, payer: string, metadataAuthority: string, mint: string, royaltyBasisPoints: number, creators: Creator[]) => {
    const metadataProgram = getMetadataProgram(provider);

    const extraMetasAccount = getExtraMetasAccount(mint);
    const metadataAuthPubkey = new PublicKey(metadataAuthority);
    const mintPubkey = new PublicKey(mint);
    const payerPubkey = new PublicKey(payer);

    const pubkeyCreators = creators.map((c) => {
        return {
            share: c.share,
            address: new PublicKey(c.address)
        }
    });

    const ix = await metadataProgram.methods
        .addRoyalties({
            royaltyBasisPoints,
            creators: pubkeyCreators
        })
        .accountsStrict({
            payer: payerPubkey,
            authority: metadataAuthPubkey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            extraMetasAccount,
            mint: mintPubkey,
        })
        .instruction();

    return ix;
}
