import { Token } from '../core/types';
import initialTokens from '../out/initial_tokens.json';

export const TOKENS = initialTokens.tokens;

// 유틸리티 함수들
export function getTokenAddresses(): string[] {
  return TOKENS.map(token => token.address);
}

export function getTokenByAddress(address: string): Token | undefined {
  return TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase());
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS.find(token => token.symbol === symbol);
}

export function getTokens(): Token[] {
  return TOKENS;
}