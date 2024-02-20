use crate::*;

#[error_code]
pub enum ABTokenError {
    #[msg("You should transfer mint authority of new token to program")]
    InvalidAutority,
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner
}
