use anchor_lang::prelude::*;

declare_id!("F7b6DyY2AfVj2PgZ2eNLEMyXg4nRAMstRuVPwNrHGAek");

#[program]
pub mod solana_twitter {
    use super::*;

    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
        require!(topic.chars().count() <= 50, TweetError::TopicTooLong);
        require!(content.chars().count() <= 280, TweetError::ContentTooLong);

        let tweet = &mut ctx.accounts.tweet;
        let author = &ctx.accounts.author;

        let clock = Clock::get().unwrap();

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(topic: String, content: String)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = 8 + 32 + 8 + 4 + topic.len() + 4 + content.len())]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

#[error_code]
pub enum TweetError {
    #[msg("The provided topic length should be 50 characters long maximum")]
    TopicTooLong,
    #[msg("The provided content length should be 280 characters long maximum")]
    ContentTooLong,
}
