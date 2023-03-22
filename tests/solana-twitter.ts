import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import { assert } from "chai";

describe("solana-twitter", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.SolanaTwitter;
	const tweet = anchor.web3.Keypair.generate();

	it("can send tweet!", async () => {
		const tx = await program.methods
			.sendTweet(
				"balaji",
				"will the bitsignal come true or is just a play to get attention?"
			)
			.accounts({
				tweet: tweet.publicKey,
				author: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([tweet])
			.rpc();
		console.log("Your transaction signature", tx);

		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
		console.log(tweetAccount);

		assert.equal(
			tweetAccount.author.toBase58(),
			provider.wallet.publicKey.toBase58()
		);
		assert.equal(tweetAccount.topic, "veganism");
		assert.equal(tweetAccount.content, "Hummus, am I right?");
		assert.ok(tweetAccount.timestamp);
	});
});

