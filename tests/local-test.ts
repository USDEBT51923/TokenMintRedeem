// import * as anchor from '@project-serum/anchor';
// import { Program } from '@project-serum/anchor';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { AbToken } from '../target/types/ab_token';
import * as assert from 'assert';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMint,
    createAccount,
    mintTo,
    getAccount,
    transfer,
} from '@solana/spl-token';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    Connection,
    Commitment,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

export const GLOBAL_AUTHORITY_SEED = "global-authority";


export const OLD_TOKEN = "Fm22RbypFLJeR3tjUKK2EGERj78PZVoNwE5wiDYqPHvN";

export const NEW_TOKEN = "9YEV5BVyXAjyBVQKdZXMsBdutA4U8P1m4ZTB3rzLwhUS";

export const TOKEN_TREASURY = "8infgpFP47xNxk9KN5zLbPKgZdzCEiRVFxFu7PXH9ruT";
export const ADMIN =   "B1R6Wu96TdfBCe2EqAnvvDcgU5UX8BXrWc5o8j5nhHPW";



const privateKey = [237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233]
const wallet = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(privateKey)
);

export function getAssociatedTokenAddressSync(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): PublicKey {
    if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer())) {
        console.log('TOken owner offcurve');
        return;
    }

    const [address] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        associatedTokenProgramId
    );

    return address;
}

describe('Solana signatures', () => {
    // local test
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.Signatures as Program<AbToken>;

    before(async () => {

    });

    it('Init', async () => {
        const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from(GLOBAL_AUTHORITY_SEED)],
            program.programId
          );

          const txId=  await program.methods.initialize(bump).accounts({
            globalAuthority: globalAuthority,
            admin: ADMIN,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          }).signers([wallet]).rpc();
    });
});