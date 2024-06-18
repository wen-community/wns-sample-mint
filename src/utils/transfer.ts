import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN, Provider } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, createTransferCheckedWithTransferHookInstruction } from "@solana/spl-token";
import { getATAAddressSync, getApprovalAccount, getDistributionAccount, getMetadataProgram } from "./core";
import { TOKEN_PROGRAM_ID, DISTRIBUTION_PROGRAM_ID, WNS_PROGRAM_ID } from "./constants";

export const buildApproveIx = async (provider: Provider, sender: string, mint: string, collection: string, paymentAmount: number, paymentMint: string) => {
    const metadataProgram = getMetadataProgram(provider);
    const approveAccount = getApprovalAccount(mint);
    const distributionAccount = getDistributionAccount(collection);
    
    const senderPubkey = new PublicKey(sender);
    const mintPubkey = new PublicKey(mint);
    const paymentMintPubkey = new PublicKey(paymentMint);

    let senderTokenAccount = WNS_PROGRAM_ID;
    let programTokenAccount = WNS_PROGRAM_ID;

    if (paymentMint !== PublicKey.default.toString()) {
        senderTokenAccount = getATAAddressSync({ mint: paymentMintPubkey, owner: senderPubkey });
        programTokenAccount = getATAAddressSync({ mint: paymentMintPubkey, owner: distributionAccount });
    }

    // get approve ix
    const approveIx = await metadataProgram.methods
        .approveTransfer(new BN(paymentAmount))
        .accountsStrict({
            payer: senderPubkey,
            authority: senderPubkey,
            mint: mintPubkey,
            systemProgram: SystemProgram.programId,
            paymentMint,
            approveAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            authorityTokenAccount: senderTokenAccount,
            distributionAccount: distributionAccount,
            distributionTokenAccount: programTokenAccount,
            distributionProgram: DISTRIBUTION_PROGRAM_ID,
            paymentTokenProgram: WNS_PROGRAM_ID
        })
        .instruction();

    return approveIx;
}

export const buildAtaCreateIx = async (payer: string, mint: string, owner: string) => {
    const payerPubkey = new PublicKey(payer);
    const mintPubkey = new PublicKey(mint);
    const ownerPubkey = new PublicKey(owner);

    const createTaIx = createAssociatedTokenAccountInstruction(
        payerPubkey,
        getATAAddressSync({ mint: mintPubkey, owner: ownerPubkey }),
        ownerPubkey,
        mintPubkey,
        TOKEN_PROGRAM_ID,
    );

    return createTaIx;
}

export const buildTransferIx = async (provider: Provider, mint: string, sender: string, receiver: string) => {
    const mintPubkey = new PublicKey(mint);
    const senderPubkey = new PublicKey(sender);
    const receiverPubkey = new PublicKey(receiver);

    // get transfer ix
    const transferIx = await createTransferCheckedWithTransferHookInstruction(
        provider.connection,
        getATAAddressSync({ mint: mintPubkey, owner: senderPubkey }),
        mintPubkey,
        getATAAddressSync({ mint: mintPubkey, owner: receiverPubkey }),
        senderPubkey,
        BigInt(1),
        0,
        [],
        undefined,
        TOKEN_PROGRAM_ID
    );

    return transferIx;
}