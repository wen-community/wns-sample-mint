import express from "express";
import { setupCollection, mintNftsToCollection } from "./mint";
import { sendNftPurchase, sendNftTransfer } from "./transfer";
import { createDistribution, fetchDistribution } from "./util";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/initializeCollection", async (req, res) => {
    const collection = await setupCollection();
    res.send(collection);
});

app.post("/mintNftsToCollection", async (req, res) => {
    const responses = await mintNftsToCollection(req.body.collection);
    res.send(responses);
});

app.post("/purchaseNft", async (req, res) => {
    /*
        Will use USER_ACCOUNT as signer and "from" account
        BODY --
        collection: string;
        nftMint: string;
        paymentAmount: number;
        buyer: string;
    */
    const txn = await sendNftPurchase(req.body);
    res.send(txn);
});

app.post("/transferNft", async (req, res) => {
    /*
        Will use USER_ACCOUNT as signer and "from" account
        BODY --
        nftMint: string;
        to: string;
    */
   try {
    const txn = await sendNftTransfer(req.body);
    res.send(txn);
   } catch (e) {
    res.send(e.message);
   }
});

app.post("/initDistribution", async (req, res) => {
    /*
        Will use USER_ACCOUNT as signer
        BODY --
        collection: string;
    */
   try {
    const txn = await createDistribution(req.body);
    res.send(txn);
   } catch (e) {
    res.send(e.message);
   }
});

app.post("/fetchDistribution", async (req, res) => {
    /*
        BODY --
        distribution: string;
    */
   try {
    const txn = await fetchDistribution(req.body);
    res.send(txn);
   } catch (e) {
    res.send(e.message);
   }
});

app.get("/", async function (_, res) {
    res.send({ status: "true" });
});

app.listen(80, async () => {
    console.log("The application is listening on port 80!");
});
