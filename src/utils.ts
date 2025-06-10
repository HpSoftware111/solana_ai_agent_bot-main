import { PublicKey } from "@solana/web3.js";
import base58 from "bs58";

export function isBase58SolanaWalletAddress(address: string) {
    try {
        // Decode the base58 string
        const decoded = base58.decode(address);
        

        // Check if the decoded length is 32 bytes
        if (decoded.length !== 32) {
            return false;
        }

        // Construct a PublicKey object to further validate
        const publicKey = new PublicKey(address);

        // Check if it is a valid PublicKey
        return true;
    } catch (error) {
        // If any error occurs during decoding or PublicKey construction, it's invalid
        return false;
    }
}
export function formatTable(data: string[][]) {
    // Find the maximum width of each column
    const columnWidths = data[0].map((_, colIndex) =>
        Math.max(...data.map(row => row[colIndex].length))
    );

    // Format each row by padding the columns
    return data.map(row =>
        row.map((cell, colIndex) =>
            cell.padEnd(columnWidths[colIndex], ' ') // Pad each cell to align columns
        ).join(' | ') // Join columns with " | "
    ).join('\n'); // Join rows with line breaks
}

export function shortenAddress(address: string) {
    return `${address.slice(0, 2)}...${address.slice(-2)}`;
}

export function simplifyNumber(num: number) {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'k';
    } else {
        return num.toFixed(1);
    }
}


export function formatUnits(number: number, decimals: number) {
    return ((number) / (10 ** decimals)); // Divide by 10^decimals
}

