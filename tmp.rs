use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, MintTo, Mint, Burn};

pub mod account;
pub mod constants;
pub mod error;

use error::*;
use account::*;
use constants::*;

declare_id!("D5aNoP8aU9CnWtfCByURp42NEsTdS52GVyB7ufEK3KYS");

#[program]
pub mod ab_token {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        _global_bump: u8,
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.admin = ctx.accounts.admin.key();
        // global_authority.old_token1 = ctx.accounts.old_token1_mint.key();
        // global_authority.old_token2 = ctx.accounts.old_token2_mint.key();
        // global_authority.old_token3 = ctx.accounts.old_token3_mint.key();
        // global_authority.old_token4 = ctx.accounts.old_token4_mint.key();
        // global_authority.old_token5 = ctx.accounts.old_token5_mint.key();
        // global_authority.old_token6 = ctx.accounts.old_token6_mint.key();
        // global_authority.old_token7 = ctx.accounts.old_token7_mint.key();
        global_authority.new_token = ctx.accounts.new_token_mint.key();
        msg!("SuperAdmin: {:?}", global_authority.admin.key());
        Ok(())
    }

    pub fn update_old_token(
        ctx: Context<UpdateGlobalState>,
        _global_bump: u8,
        old_token1: Pubkey,
        old_token2: Pubkey,
        old_token3: Pubkey,
        old_token4: Pubkey,
        old_token5: Pubkey,
        old_token6: Pubkey,
        old_token7: Pubkey,
        old_token8: Pubkey
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
 
        require!(ctx.accounts.admin.key() == global_authority.admin.key(), ABTokenError::InvalidSuperOwner);

        global_authority.old_token1 = old_token1;
        global_authority.old_token2 = old_token2;
        global_authority.old_token3 = old_token3;
        global_authority.old_token4 = old_token4;
        global_authority.old_token5 = old_token5;
        global_authority.old_token6 = old_token6;
        global_authority.old_token7 = old_token7;
        global_authority.old_token8 = old_token8;

        Ok(())
    }

    pub fn update_new_token(
        ctx: Context<UpdateGlobalState>,
        _global_bump: u8,
        new_token: Pubkey
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
 
        require!(ctx.accounts.admin.key() == global_authority.admin.key(), ABTokenError::InvalidSuperOwner);
        
        global_authority.new_token = new_token;

        Ok(())
    }

    pub fn update_new_admin(
        ctx: Context<UpdateGlobalState>,
        _global_bump: u8,
        new_admin: Pubkey
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
 
        require!(ctx.accounts.admin.key() == global_authority.admin.key(), ABTokenError::InvalidSuperOwner);

        global_authority.admin = new_admin;

        Ok(())
    }

    pub fn token_transfer_mint_to<'info>(
        ctx: Context<TokenMintTo>,
        _global_bump: u8,
        amount: u64
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let vault = &mut ctx.accounts.vault;
        let from = ctx.accounts.old_token_account.to_account_info().clone();
        let authority = ctx.accounts.user.to_account_info().clone();

        if ctx.accounts.old_token_mint.key() != global_authority.old_token1 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token2 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token3 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token4 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token5 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token6 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token7 && 
            ctx.accounts.old_token_mint.key() != global_authority.old_token8  {
                return Err(ABTokenError::InvalidOldTokenAddress.into());
        }
        
        let cpi_ctx: CpiContext<_> = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from,
                authority,
                to: vault.to_account_info().clone()
            },
        );
        token::transfer(cpi_ctx, amount)?;

        const GLOBAL_AUTHORITY_SEED: &[u8] = b"global-authority";

        let (_global_authority, _bump) = Pubkey::find_program_address(&[GLOBAL_AUTHORITY_SEED], ctx.program_id);
        let authority_seed = &[&GLOBAL_AUTHORITY_SEED[..], &[_bump]];
    
        let cpi_accounts = MintTo {
            mint: ctx.accounts.new_token_mint.to_account_info().clone(),
            to: ctx.accounts.token_destination.to_account_info().clone(),
            authority: global_authority.to_account_info().clone(),
        };

        token::mint_to(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts).with_signer(&[&authority_seed[..]]),
            amount / 100
        )?;
        
        Ok(())
    }

    pub fn redeem<'info>(
        ctx: Context<Redeem>,
        _global_bump: u8,
        amount: u64
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let vault = &mut ctx.accounts.vault;
        let authority = ctx.accounts.user.to_account_info().clone();
        let mint = ctx.accounts.new_token_mint.to_account_info().clone();
        let from =  ctx.accounts.new_token_account.to_account_info().clone();

        let cpi_ctx: CpiContext<_> = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint,
                authority,
                from
            },
        );
        token::burn(cpi_ctx, amount)?;

        const SEED: &[u8] = b"global-authority";

        let (_global_authority, _bump) = Pubkey::find_program_address(&[SEED], ctx.program_id);
        let authority_seed = &[&SEED[..], &[_bump]];
    
        let cpi_accounts: Transfer<'_> = Transfer {
            from: vault.to_account_info().clone(),
            to: ctx.accounts.old_token_account.to_account_info().clone(),
            authority: global_authority.to_account_info().clone(),
        };

        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts).with_signer(&[&authority_seed[..]]),
            amount * 100
        )?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        space = 8 + 32 + 32 + 32 + 32, 
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        payer = admin
    )]
    pub global_authority: Box<Account<'info, GlobalInfo>>,

    #[account(mut)]
    pub admin: Signer<'info>,

    // #[account(mut)]
    // pub old_token1_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED1.as_ref()],
    //     bump,
    //     token::mint = old_token1_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault1: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token2_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED2.as_ref()],
    //     bump,
    //     token::mint = old_token2_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault2: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token3_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED3.as_ref()],
    //     bump,
    //     token::mint = old_token3_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault3: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token4_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED4.as_ref()],
    //     bump,
    //     token::mint = old_token4_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault4: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token5_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED5.as_ref()],
    //     bump,
    //     token::mint = old_token5_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault5: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token6_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED6.as_ref()],
    //     bump,
    //     token::mint = old_token6_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault6: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token7_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED7.as_ref()],
    //     bump,
    //     token::mint = old_token7_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault7: Account<'info, TokenAccount>,

    // #[account(mut)]
    // pub old_token8_mint: Box<Account<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds=[VAULT_SEED8.as_ref()],
    //     bump,
    //     token::mint = old_token8_mint,
    //     token::authority = global_authority,
    //     payer = admin
    // )]
    // pub vault8: Account<'info, TokenAccount>,

    #[account(mut)]
    pub new_token_mint: Box<Account<'info, Mint>>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    token_program: Program<'info, Token>
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct UpdateGlobalState<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Box<Account<'info, GlobalInfo>>,

    #[account(mut)]
    pub admin: Signer<'info>,  
}

#[derive(Accounts)]
#[instruction(global_bump: u8, vault_seed: String)]
pub struct TokenMintTo<'info> {
    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Box<Account<'info, GlobalInfo>>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = old_token_mint
    )]
    pub old_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub old_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = new_token_mint.key() == global_authority.new_token
    )]
    pub new_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds=[vault_seed.as_ref()],
        bump,
        token::mint = old_token_mint,
        token::authority = global_authority,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub token_destination: Box<Account<'info, TokenAccount>>,

    token_program: Program<'info, Token>
}


#[derive(Accounts)]
#[instruction(global_bump: u8, vault_seed: String)]
pub struct Redeem<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Box<Account<'info, GlobalInfo>>,
    
    #[account(mut)]
    pub old_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds=[vault_seed.as_ref()],
        bump,
        token::mint = old_token_mint,
        token::authority = global_authority,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = new_token_mint,
    )]
    pub new_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = old_token_mint,
    )]
    pub old_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = new_token_mint.key() == global_authority.new_token
    )]
    pub new_token_mint: Box<Account<'info, Mint>>,

    token_program: Program<'info, Token>
}
