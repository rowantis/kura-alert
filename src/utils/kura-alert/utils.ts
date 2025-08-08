import {
  TOKEN_SYMBOLS,
  TOKEN_PRICES,
} from './contract';

export function getTokenSymbol(tokenAddress: string): string {
  return TOKEN_SYMBOLS[tokenAddress] || tokenAddress.slice(0, 8) + '...';
}

export function getTokenAddress(tokenSymbol: string): string {
  return Object.keys(TOKEN_SYMBOLS).find(key => TOKEN_SYMBOLS[key] === tokenSymbol) || '';
}

export function getTokenPrice(token: string): number {
  return TOKEN_PRICES[token] || TOKEN_PRICES[getTokenAddress(token)];
}

export { TOKEN_PRICES };

