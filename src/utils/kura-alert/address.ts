import { getAddress } from 'ethers';
import { ChecksumAddress } from './types';

/**
 * 문자열을 ChecksumAddress로 변환
 * @param address - 변환할 주소 문자열
 * @returns ChecksumAddress 타입의 주소
 * @throws 주소가 유효하지 않은 경우 에러
 */
export function toChecksumAddress(address: string): ChecksumAddress {
  try {
    return getAddress(address) as ChecksumAddress;
  } catch (error) {
    throw new Error(`Invalid address: ${address}`);
  }
}

/**
 * 주소가 유효한지 확인
 * @param address - 확인할 주소
 * @returns 유효성 여부
 */
export function isValidAddress(address: string): boolean {
  try {
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * 주소 배열을 ChecksumAddress 배열로 변환
 * @param addresses - 변환할 주소 배열
 * @returns ChecksumAddress 배열
 */
export function toChecksumAddresses(addresses: string[]): ChecksumAddress[] {
  return addresses.map(address => toChecksumAddress(address));
}

/**
 * 타입 가드: 주소가 ChecksumAddress인지 확인
 * @param address - 확인할 주소
 * @returns ChecksumAddress 타입 가드
 */
export function isChecksumAddress(address: string): address is ChecksumAddress {
  try {
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * 환경 변수에서 주소를 안전하게 가져오기
 * @param envVar - 환경 변수 이름
 * @returns ChecksumAddress
 * @throws 환경 변수가 없거나 유효하지 않은 주소인 경우
 */
export function getAddressFromEnv(envVar: string): ChecksumAddress {
  const address = process.env[envVar];
  if (!address) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
  return toChecksumAddress(address);
} 