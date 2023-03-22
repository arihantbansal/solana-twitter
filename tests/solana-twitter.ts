import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import { assert } from "chai";

describe("solana-twitter", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.SolanaTwitter;

	it("can send tweet!", async () => {
		const tweet = anchor.web3.Keypair.generate();

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
		assert.equal(tweetAccount.topic, "balaji");
		assert.equal(
			tweetAccount.content,
			"will the bitsignal come true or is just a play to get attention?"
		);
		assert.ok(tweetAccount.timestamp);
	});

	it("can send a new tweet without a topic", async () => {
		const tweet = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("", "gm!", {
			accounts: {
				tweet: tweet.publicKey,
				author: program.provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweet],
		});

		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		assert.equal(
			tweetAccount.author.toBase58(),
			program.provider.wallet.publicKey.toBase58()
		);
		assert.equal(tweetAccount.topic, "");
		assert.equal(tweetAccount.content, "gm!");
		assert.ok(tweetAccount.timestamp);
	});

	it("can send a new tweet from a different author", async () => {
		const otherUser = anchor.web3.Keypair.generate();
		await program.provider.connection.requestAirdrop(
			otherUser.publicKey,
			1000000000
		);

		const tweet = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("solana", "maxi for life", {
			accounts: {
				tweet: tweet.publicKey,
				author: otherUser.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [otherUser, tweet],
		});

		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		assert.equal(
			tweetAccount.author.toBase58(),
			otherUser.publicKey.toBase58()
		);
		assert.equal(tweetAccount.topic, "solana");
		assert.equal(tweetAccount.content, "maxi for life");
		assert.ok(tweetAccount.timestamp);
	});
});

