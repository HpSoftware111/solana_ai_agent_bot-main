import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Buffer } from 'buffer';
import { config } from '../config';
import { CommandContext } from 'grammy';
import { MyContext } from '../types';
import { isBase58SolanaWalletAddress } from '../utils';

// Constants
const EXPECTED_DISCRIMINATOR = Buffer.from("17b7f83760d8ac60", 'hex');

interface BondingCurveState {
  virtualTokenReserves: BN;
  virtualSolReserves: BN;
  realTokenReserves: BN;
  realSolReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
}

export const getAssociatedBondingCurveAddress = (
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('bonding-curve'),
      mint.toBuffer()
    ],
    programId
  );
};

const parseBondingCurveState = (data: Buffer): BondingCurveState => {
    console.log("discriminator", data.slice(0, 8))
  if (!data.slice(0, 8).equals(EXPECTED_DISCRIMINATOR)) {
    throw new Error('Invalid curve state discriminator');
  }

  // Parse the state data starting after discriminator
  const dataView = new DataView(data.buffer, data.byteOffset + 8);
  
  return {
    virtualTokenReserves: new BN(dataView.getBigUint64(0, true).toString()),
    virtualSolReserves: new BN(dataView.getBigUint64(8, true).toString()),
    realTokenReserves: new BN(dataView.getBigUint64(16, true).toString()),
    realSolReserves: new BN(dataView.getBigUint64(24, true).toString()),
    tokenTotalSupply: new BN(dataView.getBigUint64(32, true).toString()),
    complete: Boolean(dataView.getUint8(40))
  };
};

export const getBondingCurveState = async (
  connection: Connection,
  curveAddress: PublicKey
): Promise<BondingCurveState> => {
  const accountInfo = await connection.getAccountInfo(curveAddress);
  
  if (!accountInfo?.data) {
    throw new Error('Invalid curve state: No data');
  }

  return parseBondingCurveState(accountInfo.data);
};

export const graduate = async (ctx: CommandContext<MyContext>) => {
    const param = ctx.match;
    console.log("/graduate", param);
    if (!isBase58SolanaWalletAddress(param)) {
      await ctx.reply("Token address is not correct");
      return;
    }
    let replyText = "";

    const status = await checkTokenStatus(param)

    if(status){
        replyText = " This bonding curve has completed and liquidity has been migrated to Raydium."
    }else{
        replyText = " This bonding curve is not completed."
    }

    await ctx.reply(replyText)

}

export const checkTokenStatus = async (mintAddress: string): Promise<boolean> => {
  try {
    const mint = new PublicKey(mintAddress);
    const connection = new Connection(config.SOLANA_RPC);
    const programId = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

    // Get the associated bonding curve address
    const [bondingCurveAddress, bump] = getAssociatedBondingCurveAddress(mint, programId);

    console.log('\nToken Status:');
    console.log('-'.repeat(50));
    console.log(`Token Mint:              ${mint.toString()}`);
    console.log(`Associated Bonding Curve: ${bondingCurveAddress.toString()}`);
    console.log(`Bump Seed:               ${bump}`);
    console.log('-'.repeat(50));

    try {
      const curveState = await getBondingCurveState(connection, bondingCurveAddress);

      console.log('\nBonding Curve Status:');
      console.log('-'.repeat(50));
      console.log(`Completion Status: ${curveState.complete ? 'Completed' : 'Not Completed'}`);
      
      if (curveState.complete) {
        console.log('\nNote: This bonding curve has completed and liquidity has been migrated to Raydium.');
        return true
      }
      
      console.log('-'.repeat(50));
    } catch (error) {
      console.log(`\nError accessing bonding curve: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(`\nError: Invalid address format - ${error.message}`);
    } else {
      console.log(`\nUnexpected error: ${error}`);
    }
  }
  return false
};

