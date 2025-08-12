import {
  TOKEN_SYMBOLS,
  TOKEN_PRICES,
} from './contract';
import { ChecksumAddress } from './types';
import { toChecksumAddress } from './address';

export function getTokenSymbol(tokenAddress: ChecksumAddress): string {
  return TOKEN_SYMBOLS[tokenAddress] || tokenAddress.slice(0, 8) + '...';
}

export function getTokenAddress(tokenSymbol: string): ChecksumAddress {
  const tokenAddress = Object.keys(TOKEN_SYMBOLS).find(key => TOKEN_SYMBOLS[toChecksumAddress(key)] === tokenSymbol);
  if (!tokenAddress) {
    throw new Error(`Token symbol ${tokenSymbol} not found`);
  }
  return toChecksumAddress(tokenAddress);
}

export function getTokenPrice(token: ChecksumAddress): number {
  return TOKEN_PRICES[token] || TOKEN_PRICES[getTokenAddress(token)];
}

export { TOKEN_PRICES };

