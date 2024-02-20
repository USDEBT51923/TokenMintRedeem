use crate::constants::*;
use anchor_lang::prelude::*;

#[account]
pub struct GlobalInfo {
    pub admin: Pubkey,     // 32
    pub old_token: Pubkey, // 32
    pub new_token: Pubkey, // 32
}

impl Default for GlobalInfo {
    #[inline]
    fn default() -> GlobalInfo {
        GlobalInfo {
            admin: Pubkey::default(),
            new_token: NEW_TOKEN.parse::<Pubkey>().unwrap(),
            old_token: OLD_TOKEN.parse::<Pubkey>().unwrap(),
        }
    }
}
