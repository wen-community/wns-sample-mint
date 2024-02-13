import express from "express";
import { setupCollection, mintNftsToCollection } from "./mint";
import { transferNft } from "./transfer";

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

app.post("/transferNft", async (req, res) => {
    const transferId = await transferNft(req.body);
    res.send(transferId);
});

app.get("/", async function (_, res) {
    res.send({ status: "true" });
});

app.listen(80, async () => {
    console.log("The application is listening on port 80!");
});
