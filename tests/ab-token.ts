import { PublicKey, SystemProgram, Transaction, Connection, Commitment } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { TOKEN_2022_PROGRAM_ID, createMint, createAccount, mintTo, getAccount, transfer, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID  } from "@solana/spl-token";
import { assert } from "chai";

import { IDL } from "../target/types/ab_token";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
// import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const GLOBAL_AUTHORITY_SEED = "global-authority";
export const VAULT_SEED = "vault";


export const OLD_TOKEN = "Fm22RbypFLJeR3tjUKK2EGERj78PZVoNwE5wiDYqPHvN";

export const NEW_TOKEN = "FxiQg645pMgnyebiVS9D2h2eo5vnQPA7Au43JNm8kToU";


export const ADMIN =   "B1R6Wu96TdfBCe2EqAnvvDcgU5UX8BXrWc5o8j5nhHPW";
export const PROGRAM = "7vfAZgrKyYV2e3XTKuwisXfVcdSY7vMZ7N5m6ppNMboP";


function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  walletAddress: anchor.web3.PublicKey,
  splTokenMintAddress: anchor.web3.PublicKey
) => {
  const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: walletAddress, isSigner: false, isWritable: false },
      { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
      {
          pubkey: anchor.web3.SystemProgram.programId,
          isSigner: false,
          isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      {
          pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
      },
  ];
  return new anchor.web3.TransactionInstruction({
      keys,
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([]),
  });
}


const getATokenAccountsNeedCreate = async (
  connection: anchor.web3.Connection,
  walletAddress: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  nfts: anchor.web3.PublicKey[],
) => {
  let instructions: anchor.web3.TransactionInstruction[] = [], destinationAccounts = [];
  for (const mint of nfts) {
      const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
      let response = await connection.getAccountInfo(destinationPubkey);
      if (!response) {
          const createATAIx = createAssociatedTokenAccountInstruction(
              destinationPubkey,
              walletAddress,
              owner,
              mint,
          );
          instructions.push(createATAIx);
      }
      destinationAccounts.push(destinationPubkey);
      // if (walletAddress != owner) {
      //   console.log("compare", walletAddress, owner)
      //     const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
      //     response = await connection.getAccountInfo(userAccount);
      //     if (!response) {
      //         const createATAIx = createAssociatedTokenAccountInstruction(
      //             userAccount,
      //             walletAddress,
      //             walletAddress,
      //             mint,
      //         );
      //         instructions.push(createATAIx);
      //     }
      // }
  }
  return {
      instructions,
      destinationAccounts,
  };
}


const getAssociatedTokenAccount = async (
  ownerPubkey: PublicKey,
  mintPk: PublicKey
): Promise<PublicKey> => {
  let associatedTokenAccountPubkey = (PublicKey.findProgramAddressSync(
      [
          ownerPubkey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          mintPk.toBuffer(), // mint address
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
  ))[0];

  return associatedTokenAccountPubkey;
}


const initialize = async () => {
  const commitment: Commitment = "confirmed";
  const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment,
    // wsEndpoint: "wss://api.devnet.solana.com/",
  });
 
  const options = anchor.AnchorProvider.defaultOptions();
  const wallet =  anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233])
  );
  const adminWallet = new NodeWallet(wallet)
  const provider = new anchor.AnchorProvider(connection, adminWallet, options);

 
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM);
  const program = new anchor.Program(IDL, programId, provider);


  const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  const [vault, vault_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED)],
    program.programId
  );

  console.log(`globalAuthority : ${globalAuthority}, bump ${bump}`);
  console.log('vault authority',vault, vault_bump)

 const txId=  await program.methods.initialize(bump).accounts({
    globalAuthority: globalAuthority,
    admin: ADMIN,
    vault:vault,
    oldTokenMint: new PublicKey(OLD_TOKEN),
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY
  }).signers([adminWallet.payer]).rpc();

  console.log("txId", txId)
}




const updateNewToken = async () => {
  const commitment: Commitment = "confirmed";
  const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment,
    // wsEndpoint: "wss://api.devnet.solana.com/",
  });
 
  const options = anchor.AnchorProvider.defaultOptions();
  const wallet =  anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233]));
  const adminWallet = new NodeWallet(wallet)
  const provider = new anchor.AnchorProvider(connection, adminWallet, options);
  
  
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM);
  const program = new anchor.Program(IDL, programId, provider);

  const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
 

  const txId=  await program.methods.updateNewToken(bump, new PublicKey(NEW_TOKEN)).accounts({globalAuthority, admin: adminWallet.publicKey}).signers([adminWallet.payer]).rpc();
  console.log("txId", txId)

  
}

const updateTokenTreasury = async () => {
  const commitment: Commitment = "confirmed";
  const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment,
    // wsEndpoint: "wss://api.devnet.solana.com/",
  });
 
  const options = anchor.AnchorProvider.defaultOptions();
  const wallet =  anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233]));
  const adminWallet = new NodeWallet(wallet)
  const provider = new anchor.AnchorProvider(connection, adminWallet, options);
  
  
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM);
  const program = new anchor.Program(IDL, programId, provider);

  const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  let tokenTreasury = await getAssociatedTokenAccount(new PublicKey(globalAuthority), new PublicKey(OLD_TOKEN));
  console.log("tokenTreasury", tokenTreasury)
 

  // const txId=  await program.methods.updateNewTreasury(bump, tokenTreasury).accounts({globalAuthority, admin: adminWallet.publicKey}).signers([adminWallet.payer]).rpc();
  // console.log("txId", txId)

  
}




const transferMintTo = async () => {
  const commitment: Commitment = "confirmed";
  const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment,
    // wsEndpoint: "wss://api.devnet.solana.com/",
  });
 
  const options = anchor.AnchorProvider.defaultOptions();
  const wallet =  anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233]));
  const adminWallet = new NodeWallet(wallet)
  const provider = new anchor.AnchorProvider(connection, adminWallet, options);

 
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM);
  const program = new anchor.Program(IDL, programId, provider);

  const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  
  const [vault, vault_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED)],
    program.programId
  );


  let oldTokenAccount = await getAssociatedTokenAccount(adminWallet.publicKey,new PublicKey(OLD_TOKEN));
  console.log("oldTokenAccount: ", oldTokenAccount.toBase58());

  console.log("admin wallet", adminWallet.publicKey)


  let tokenTreasury = await getAssociatedTokenAccount(new PublicKey(globalAuthority), new PublicKey(OLD_TOKEN));
  console.log("tokenTreasury: ", tokenTreasury.toBase58());

  console.log("token treasury", tokenTreasury)

  let newTokenAccount = await getAssociatedTokenAccount(adminWallet.publicKey, new PublicKey(NEW_TOKEN));
  console.log("newTokenAccount: ", newTokenAccount.toBase58());
  
  let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
    connection,
    adminWallet.publicKey,
    adminWallet.publicKey,
    [new PublicKey(NEW_TOKEN)]
  );

  // console.log("length", instructions.length)
  const tokenDestination = destinationAccounts[0];
  console.log("input param", {globalAuthority, user: adminWallet.publicKey,tokenDestination, oldToken: oldTokenAccount, newToken : new PublicKey(NEW_TOKEN), tokenTreasury: tokenTreasury, tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")})

  const txId=  await program.methods.tokenTransferMintTo( bump,new anchor.BN(1000000000)).accounts({globalAuthority, user: adminWallet.publicKey,tokenDestination, oldTokenAccount: oldTokenAccount,oldTokenMint: new PublicKey(OLD_TOKEN) ,newTokenMint : new PublicKey(NEW_TOKEN),vault,  tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")}).preInstructions(instructions).signers([adminWallet.payer]).rpc()
  console.log("txId", txId)

  
}





const redeem = async () => {
  const commitment: Commitment = "confirmed";
  const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment,
    // wsEndpoint: "wss://api.devnet.solana.com/",
  });
 
  const options = anchor.AnchorProvider.defaultOptions();
  const wallet =  anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([237,83,221,155,141,60,32,20,24,0,139,109,131,120,9,222,229,130,21,74,161,237,199,56,213,120,250,85,20,77,93,222,148,176,29,25,190,185,60,109,16,89,67,100,7,0,74,126,196,255,40,204,19,182,238,240,162,3,96,232,90,158,185,233]));
  const adminWallet = new NodeWallet(wallet)
  const provider = new anchor.AnchorProvider(connection, adminWallet, options);

 
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM);
  const program = new anchor.Program(IDL, programId, provider);

  const [globalAuthority, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  
  const [vault, vault_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED)],
    program.programId
  );


  let oldTokenAccount = await getAssociatedTokenAccount(adminWallet.publicKey,new PublicKey(OLD_TOKEN));
  console.log("oldTokenAccount: ", oldTokenAccount.toBase58());

  console.log("admin wallet", adminWallet.publicKey)


  let newTokenAccount = await getAssociatedTokenAccount(adminWallet.publicKey, new PublicKey(NEW_TOKEN));
  console.log("newTokenAccount: ", newTokenAccount.toBase58());
  
  let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
    connection,
    adminWallet.publicKey,
    adminWallet.publicKey,
    [new PublicKey(NEW_TOKEN)]
  );

  console.log("new token account", newTokenAccount)

  // console.log("length", instructions.length)
  // const tokenDestination = destinationAccounts[0];
  
  const txId=  await program.methods.redeem( bump,new anchor.BN(100000000)).accounts({globalAuthority, user: adminWallet.publicKey, oldTokenMint: new PublicKey(OLD_TOKEN) ,newTokenMint : new PublicKey(NEW_TOKEN), newTokenAccount, oldTokenAccount , vault,  tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")}).signers([adminWallet.payer]).rpc()
  console.log("txId", txId)

  
}

// transferMintTo()
// updateTokenTreasury();


// initialize()

// updateNewToken()

redeem()
