use anchor_lang::prelude::*;

declare_id!("HmgaDncYyDqmwT7axPykK9Gy5QFNB9pX3BBoNtwv3qjj");

#[program]
pub mod solana_twitter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
