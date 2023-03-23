import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import { assert } from "chai";
import * as bs58 from "bs58";

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
		const signature = await program.provider.connection.requestAirdrop(
			otherUser.publicKey,
			1000000000
		);
		await program.provider.connection.confirmTransaction(signature);

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

	it("cannot provide a topic with more than 50 characters", async () => {
		try {
			const tweet = anchor.web3.Keypair.generate();
			const topicWith51Chars = "x".repeat(51);
			await program.rpc.sendTweet(topicWith51Chars, "maxi for life", {
				accounts: {
					tweet: tweet.publicKey,
					author: program.provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [tweet],
			});
		} catch (error) {
			assert.equal(
				error.msg,
				"The provided topic length should be 50 characters long maximum"
			);
			return;
		}
		assert.fail(
			"The instruction should have failed with a 51-character topic."
		);
	});

	it("cannot provide a content with more than 280 characters", async () => {
		try {
			const tweet = anchor.web3.Keypair.generate();
			const contentWith281Chars = "x".repeat(281);
			await program.rpc.sendTweet("solana", contentWith281Chars, {
				accounts: {
					tweet: tweet.publicKey,
					author: program.provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [tweet],
			});
		} catch (error) {
			assert.equal(
				error.msg,
				"The provided content length should be 280 characters long maximum"
			);
			return;
		}

		assert.fail(
			"The instruction should have failed with a 281-character content."
		);
	});

	it("can fetch all tweets", async () => {
		const tweetAccounts = await program.account.tweet.all();
		assert.equal(tweetAccounts.length, 3);
	});

	it("can filter tweets by author", async () => {
		const authorPublicKey = program.provider.wallet.publicKey;
		const tweetAccounts = await program.account.tweet.all([
			{
				memcmp: {
					offset: 8,
					bytes: authorPublicKey.toBase58(),
				},
			},
		]);

		assert.equal(tweetAccounts.length, 2);
		assert.ok(
			tweetAccounts.every((tweetAccount) => {
				return (
					tweetAccount.account.author.toBase58() === authorPublicKey.toBase58()
				);
			})
		);
	});

	it("can filter tweets by topics", async () => {
		const tweetAccounts = await program.account.tweet.all([
			{
				memcmp: {
					offset: 8 + 32 + 8 + 4,
					bytes: bs58.encode(Buffer.from("solana")),
				},
			},
		]);

		assert.equal(tweetAccounts.length, 1);
		assert.ok(
			tweetAccounts.every((tweetAccount) => {
				return tweetAccount.account.topic === "solana";
			})
		);
	});
});

