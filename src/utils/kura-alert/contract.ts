import { DexType, ChecksumAddress } from "./types";
import { toChecksumAddress, toChecksumAddresses } from "./address";

export const KURA_V2_FACTORY: ChecksumAddress = toChecksumAddress('0xAEbdA18889D6412E237e465cA25F5F346672A2eC');
export const KURA_V3_FACTORY: ChecksumAddress = toChecksumAddress('0xd0c54c480fD00DDa4DF1BbE041A6881f2F09111e');
export const KURA_SWAP_ROUTER: ChecksumAddress = toChecksumAddress('0x7706ba1E17fB334d49e1C5063A96564bB40eF227');

export const TOKENS: ChecksumAddress[] = toChecksumAddresses([
  '0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7', // WSEI
  '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', // WBTC
  '0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423', // iSEI
  '0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8', // WETH
  '0x9151434b16b9763660705744891fA906F660EcC5', // USDT
  '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1', // USDC
  '0x059A6b0bA116c63191182a0956cF697d0d2213eC', // syUSD
  '0x37a4dD9CED2b19Cfe8FAC251cd727b5787E45269', // fastUSD
  '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', // USDC circle
]);

export const FEE_DIVISOR = 1000000;

export const KURA_V2_FEES = (isStable: boolean) => isStable ? 3000 : 3000; // 0.3%

export enum KURA_V3_TICK_SPACING {
  V3_1 = 1,
  V3_5 = 5,
  V3_10 = 10,
  V3_50 = 50,
  V3_100 = 100,
  V3_200 = 200,
}

export const KURA_V3_TICK_SPACING_TO_FEE = {
  [KURA_V3_TICK_SPACING.V3_1]: 100,
  [KURA_V3_TICK_SPACING.V3_5]: 250,
  [KURA_V3_TICK_SPACING.V3_10]: 500,
  [KURA_V3_TICK_SPACING.V3_50]: 3000,
  [KURA_V3_TICK_SPACING.V3_100]: 10000,
  [KURA_V3_TICK_SPACING.V3_200]: 20000,
}

export const DEX_INDEX = {
  [DexType.KuraV2]: 2,
  [DexType.KuraV3]: 3,
}

export const WRAPPED_NATIVE_TOKEN: ChecksumAddress = toChecksumAddress('0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7');

export const TOKEN_DECIMALS: { [key in ChecksumAddress]: number } = {
  [toChecksumAddress('0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7')]: 18, // WSEI
  [toChecksumAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c')]: 8,  // WBTC
  [toChecksumAddress('0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423')]: 6,  // iSEI
  [toChecksumAddress('0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8')]: 18, // WETH
  [toChecksumAddress('0x9151434b16b9763660705744891fA906F660EcC5')]: 6,  // USDT
  [toChecksumAddress('0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1')]: 6,  // USDC noble
  [toChecksumAddress('0x059A6b0bA116c63191182a0956cF697d0d2213eC')]: 18, // syUSD
  [toChecksumAddress('0x37a4dD9CED2b19Cfe8FAC251cd727b5787E45269')]: 18, // fastUSD
  [toChecksumAddress('0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392')]: 6, // USDC circle
  [toChecksumAddress('0x4b416A45e1f26a53D2ee82a50a4C7D7bE9EdA9E4')]: 18, // KURA
  [toChecksumAddress('0x8A200a13c1321fdc7F6c7AFba1494E1949426eFD')]: 18, // K33
};

export const TOKEN_SYMBOLS: { [key in ChecksumAddress]: string } = {
  [toChecksumAddress('0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7')]: 'WSEI',
  [toChecksumAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c')]: 'WBTC',
  [toChecksumAddress('0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423')]: 'iSEI',
  [toChecksumAddress('0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8')]: 'WETH',
  [toChecksumAddress('0x9151434b16b9763660705744891fA906F660EcC5')]: 'USDT',
  [toChecksumAddress('0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1')]: 'USDC.n',
  [toChecksumAddress('0x059A6b0bA116c63191182a0956cF697d0d2213eC')]: 'syUSD',
  [toChecksumAddress('0x37a4dD9CED2b19Cfe8FAC251cd727b5787E45269')]: 'fastUSD',
  [toChecksumAddress('0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392')]: 'USDC',
  [toChecksumAddress('0x4b416A45e1f26a53D2ee82a50a4C7D7bE9EdA9E4')]: 'KURA',
  [toChecksumAddress('0x8A200a13c1321fdc7F6c7AFba1494E1949426eFD')]: 'K33',
};

export const PATHS = {
  VALID_POOLS: 'out/valid_pools.json',
  LAST_UPDATED_PERIOD: 'out/last_updated_period.json',
} as const;


// update 2025-07-28
export const TOKEN_PRICES: { [key in ChecksumAddress]: number } = {
  [toChecksumAddress('0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7')]: 0.35,    // WSEI
  [toChecksumAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c')]: 118967,  // WBTC
  [toChecksumAddress('0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423')]: 0.37,    // iSEI
  [toChecksumAddress('0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8')]: 3891,    // WETH
  [toChecksumAddress('0x9151434b16b9763660705744891fA906F660EcC5')]: 1,       // USDT
  [toChecksumAddress('0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1')]: 1,       // USDC
  [toChecksumAddress('0x059A6b0bA116c63191182a0956cF697d0d2213eC')]: 1,       // syUSD
  [toChecksumAddress('0x37a4dD9CED2b19Cfe8FAC251cd727b5787E45269')]: 1,       // fastUSD
  [toChecksumAddress('0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392')]: 1,       // USDC circle
};
