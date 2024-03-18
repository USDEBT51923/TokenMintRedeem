// use crate::constants::*;
use anchor_lang::prelude::*;

#[account]
pub struct GlobalInfo {
    pub admin: Pubkey,      // 32
    pub old_token1: Pubkey, // 32
    pub old_token2: Pubkey, // 32
    pub old_token3: Pubkey, // 32
    pub old_token4: Pubkey, // 32
    pub old_token5: Pubkey, // 32
    pub old_token6: Pubkey, // 32
    pub old_token7: Pubkey, // 32
    pub old_token8: Pubkey, // 32
    pub new_token: Pubkey,  // 32
}

// impl Default for GlobalInfo {
//     #[inline]
//     fn default() -> GlobalInfo {
//         GlobalInfo {
//             admin: Pubkey::default(),
//             new_token: NEW_TOKEN.parse::<Pubkey>().unwrap(),
//             old_token: OLD_TOKEN.parse::<Pubkey>().unwrap(),
//         }
//     }
// }
