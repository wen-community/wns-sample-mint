import { ComputeBudgetProgram, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { CreateCollectionArgs, CreateNftArgs, Creator, PurchaseNftArgs, TransferNftArgs } from "./utils/interfaces";
import { USER_ACCOUNT, buildCreateCollectionIx, getProvider, CONNECTION_URL, AUTHORITY_ACCOUNT, buildAddDistributionIx, buildMintNftIx, buildAddGroupIx, buildAddRoyaltiesIx, buildApproveIx, buildAtaCreateIx, buildTransferIx, buildClaimDistributionIx, fetchDistributionAccount } from "./utils";

export const createCollectionWithRoyalties = async (args: { name: string; symbol: string; uri: string; maxSize: number; }) => {
    const collectionMint = new Keypair();
    const collectionPubkey = collectionMint.publicKey;
    const provider = getProvider(CONNECTION_URL);

    const authority = AUTHORITY_ACCOUNT;
    const authorityPubkey = authority.publicKey;

    const collectionArgs: CreateCollectionArgs = {
        name: args.name,
        symbol: args.symbol,
        uri: args.uri,
        maxSize: args.maxSize,
        mint: collectionPubkey.toString()
    }

    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 250_000
    });

    const { ix: createCollectionIx, group } = await buildCreateCollectionIx(provider, collectionArgs, authorityPubkey.toString());
    const addDistributionIx = await buildAddDistributionIx(provider, collectionPubkey.toString(), authorityPubkey.toString());

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: authorityPubkey,
        recentBlockhash: blockhash,
        instructions: [ prioIx, createCollectionIx, addDistributionIx ],
      }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([authority, collectionMint]);
    const _sig = await provider.connection.sendTransaction(txn, {
        preflightCommitment: "confirmed"
    });

    return {
        collection: collectionMint.publicKey.toString()
    };
}

export const createDistribution = async (args: { collection: string; }) => {
    const provider = getProvider(CONNECTION_URL);

    const authority = AUTHORITY_ACCOUNT;
    const authorityPubkey = authority.publicKey;


    const prioIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 500_000
    });

    const addDistributionIx = await buildAddDistributionIx(provider, args.collection, authorityPubkey.toString());

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: authorityPubkey,
        recentBlockhash: blockhash,
        instructions: [ prioIx, addDistributionIx ],
      }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([authority]);
    try {
        const logs = await provider.simulate(txn);
        console.log(logs);
    } catch (e) {
        console.log(e);
    }
    const _sig = await provider.connection.sendTransaction(txn, {
        preflightCommitment: "confirmed"
    });

    return {
        tx: _sig
    };
}


export const fetchDistribution = async (args: { distribution: string; }) => {
    const provider = getProvider(CONNECTION_URL);

    await fetchDistributionAccount(provider, args.distribution);
    return "OK";
}

export const mintNft = async (args: { name: string; symbol: string; uri: string; permanentDelegate: string | null, collection: string; royaltyBasisPoints: number; creators: Creator[] }) => {
    const mint = new Keypair();
    const mintPubkey = mint.publicKey;
    const provider = getProvider(CONNECTION_URL);
    const collectionPubkey = new PublicKey(args.collection);

    const minter = USER_ACCOUNT;
    const minterPubkey = minter.publicKey;
    
    const groupAuthority = AUTHORITY_ACCOUNT;
    const groupAuthPubkey = groupAuthority.publicKey;

    // Doesn't have to be the same, usually will be
    const nftAuthority = AUTHORITY_ACCOUNT;
    const nftAuthPubkey = nftAuthority.publicKey;

    const mintDetails: CreateNftArgs = {
        name: args.name,
        symbol: args.symbol,
        uri: args.uri,
        mint: mintPubkey.toString(),
        permanent_delegate: args.permanentDelegate
    }

    const prioFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000
    });
    const mintIx = await buildMintNftIx(provider, mintDetails, minterPubkey.toString(), nftAuthPubkey.toString());
    const addToGroupIx = await buildAddGroupIx(provider, minterPubkey.toString(), groupAuthPubkey.toString(), mintPubkey.toString(), collectionPubkey.toString());
    const addRoyaltiesToMintIx = await buildAddRoyaltiesIx(provider, minterPubkey.toString(), nftAuthPubkey.toString(), mintPubkey.toString(), args.royaltyBasisPoints, args.creators);

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: minterPubkey,
        recentBlockhash: blockhash,
        instructions: [ prioFeeIx, mintIx, addToGroupIx, addRoyaltiesToMintIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([minter, groupAuthority, nftAuthority, mint]);
    const sig = await provider.connection.sendTransaction(txn, {
        preflightCommitment: "confirmed"
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        txn: sig,
        mint: mintPubkey.toString()
    }
}

export const purchaseNft = async (args: PurchaseNftArgs) => {
    const provider = getProvider(CONNECTION_URL);
    const paymentAmount = args.paymentLamports;

    // Only supporting SOL to start
    // const paymentMint = args.paymentMint;
    const paymentMint = "11111111111111111111111111111111";

    const nftMint = args.nftMint;
    const collection = args.collection;
    // Assume keypair from ENV, should change to better way to determine signer
    const sender = USER_ACCOUNT.publicKey.toString();

    const destination = args.buyer;

    const prioFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 500_000
    });

    const approveIx = await buildApproveIx(provider, sender, nftMint, collection, paymentAmount, paymentMint);
    const createAtaIx = await buildAtaCreateIx(sender, nftMint, destination);
    const transferIx = await buildTransferIx(provider, nftMint, sender, destination);

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(sender),
        recentBlockhash: blockhash,
        instructions: [ prioFeeIx, approveIx, createAtaIx, transferIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([USER_ACCOUNT]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig
    };
};

export const transferNft = async (args: TransferNftArgs) => {
    const provider = getProvider(CONNECTION_URL);

    const nftMint = args.nftMint;
    // Assume keypair from ENV, should change to better way to determine signer
    const sender = USER_ACCOUNT.publicKey.toString();

    const destination = args.to;

    const prioFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000
    });
    const createAtaIx = await buildAtaCreateIx(sender, nftMint, destination);
    const transferIx = await buildTransferIx(provider, nftMint, sender, destination);

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(sender),
        recentBlockhash: blockhash,
        instructions: [ prioFeeIx, createAtaIx, transferIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([USER_ACCOUNT]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig
    };
};

export const claimDistribution = async (args: { collection: string, mintToClaim: string }) => {
    const provider = getProvider(CONNECTION_URL);
    // In test, for now making Creator into auth account
    const creatorPubkey = AUTHORITY_ACCOUNT.publicKey;

    const claimIx = await buildClaimDistributionIx(provider, args.collection, creatorPubkey.toString(), args.mintToClaim);
    
    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: creatorPubkey,
        recentBlockhash: blockhash,
        instructions: [ claimIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([AUTHORITY_ACCOUNT]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig
    };
};