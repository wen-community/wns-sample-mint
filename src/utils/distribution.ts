import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getATAAddressSync, getDistributionAccount, getDistributionProgram } from "./core";
import { Provider } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "./constants";

export const buildAddDistributionIx = async (provider: Provider, collection: string, authority: string) => {
    const distributionProgram = getDistributionProgram(provider);
    const distributionAccount = getDistributionAccount(collection);
    console.log({ distribution: distributionAccount.toString() });
    const authorityPubkey = new PublicKey(authority);

    const ix = await distributionProgram.methods
        .initializeDistribution(PublicKey.default)
        .accountsStrict({
            payer: authorityPubkey,
            groupMint: collection,
            systemProgram: SystemProgram.programId,
            distributionAccount,
        })
        .instruction();

    return ix;
};

export const buildClaimDistributionIx = async (provider: Provider, collection: string, creator: string, mintToClaim: string) => {
    const distributionProgram = getDistributionProgram(provider);
    const distributionAccount = getDistributionAccount(collection);

    const creatorPubkey = new PublicKey(creator);
    const mintPubkey = new PublicKey(mintToClaim);

    let creatorTokenAccount = creatorPubkey;
    let programTokenAccount = distributionAccount;

    if (mintToClaim !== PublicKey.default.toString()) {
        creatorTokenAccount = getATAAddressSync({ mint: mintPubkey, owner: creatorPubkey });
        programTokenAccount = getATAAddressSync({ mint: mintPubkey, owner: distributionAccount });
    }

    const ix = await distributionProgram.methods
        .claimDistribution()
        .accountsStrict({
            creator: creatorPubkey,
            distribution: distributionAccount,
            creatorTokenAccount,
            paymentMint: mintPubkey,
            distributionTokenAccount: programTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

    return ix;
};

export const fetchDistributionAccount = async (provider: Provider, distribution: string) => {
    const distributionProgram = getDistributionProgram(provider);

    const acc = await distributionProgram.account.distributionAccount.fetch(distribution);

    console.log({ acc });
}
