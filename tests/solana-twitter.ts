import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";

describe("solana-twitter", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;
	const tweet = anchor.web3.Keypair.generate();
	const wallet = anchor.workspace.SolanaTwitter.provider.wallet;

	it("can send tweet!", async () => {
		const tx = await program.methods
			.sendTweet(
				"balaji",
				"will the bitsignal come true or is just a play to get attention?"
			)
			.accounts({
				tweet: tweet.publicKey,
				author: wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.rpc();
		console.log("Your transaction signature", tx);

		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
		console.log(tweetAccount);
	});
});

