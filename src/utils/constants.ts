import BigNumber from "bignumber.js";
import { toChecksumAddress } from "./kura-alert/address";
import { ChecksumAddress } from "./kura-alert/types";

export const ONE_SECOND = 1000;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const ONE_HOUR = 60 * ONE_MINUTE;
export const ONE_DAY = 24 * ONE_HOUR;
export const ONE_WEEK = 7 * ONE_DAY;
export const ONE_YEAR = 365 * ONE_DAY;

export const WHITE_LISTED_SENDERS = [
  toChecksumAddress('0xc267f8082C435945caD8CbA230bdDeB949C0a487'),
  toChecksumAddress('0xDE1dDAd329A8713C3518c5DEa93EFf410F4bbE3c'),
  toChecksumAddress('0xBAF863dE292cF72F6fD8a07Fdbb78c24157C6922'),
  toChecksumAddress('0xf024F55cA6E0a30a5339508F3343d3e90f682a72'),
  toChecksumAddress('0xaC4f0fe2bf800aA3005245F095A317541D745567'),
  toChecksumAddress('0x691C7034331460cd275f81B0251238712d2c7819'),
  toChecksumAddress('0x73811a9405cF6CC81F41c4715F36CDba957B5F0b'),
  toChecksumAddress('0x8a208235FB7F2e16D12C9A4A96f6983934589727'),
  toChecksumAddress('0xA89E9C7cb8B0d6b751321A08aAC214Ba24cb794c'),
  toChecksumAddress('0xCa7D3124e5Cd9f393A66DFfbE6e8fBA784eAbc73'),
  toChecksumAddress('0x557B09a8E79727d77164E292C393dD354926242c'),
  toChecksumAddress('0xb041c23F702eBd65F359E62e8179fC6150ed6E34'),
  toChecksumAddress('0xA458bF88b7e5db1f447eD768488bCBE7d42b44E7'),
  toChecksumAddress('0xcd7a48e9b5a14cddc564f93dc5c4bdac3e4e9931'),
  toChecksumAddress('0xdDd3B48CB0bD6ACc15571eCEB1915CE7514f4247'),
  toChecksumAddress('0xc637751336f7c6946bf717b17e78bb3965170bb4'),
  toChecksumAddress('0xcadfe278d7b5e65e5211cd5da181e3973e40ebe0'),
  toChecksumAddress('0x3D73ed744c92f900C7A723B50aFc83c8FF53E7c0'),
  toChecksumAddress('0xd2ACBcC7Bc317432FA0f2CE31f5727dA4B9187B4'),
  toChecksumAddress('0xb041c23F702eBd65F359E62e8179fC6150ed6E34'),
  toChecksumAddress('0xCE259247B477A990b0dC93559f4499fedbbC6381'),
  toChecksumAddress('0xc71D7385ed18AD5dA6917090661AcbBfa6f8F00d'),
  toChecksumAddress('0xd0bCb448699BF98019D91018E5e730995D790391'),
  toChecksumAddress('0x1CA3a9bA21993eaF194AAaA22A566E118ECa6373'),
  toChecksumAddress('0x2098065E92a75538420F5086DAF0D044c43b9b69'),
  toChecksumAddress('0xaeb3d94C5786d7B1A2E88F3F6B7653151D20A5b5'),
  toChecksumAddress('0x793Be046001F5b196F4aE19116c93D24e43a496b'),
]

export const WHITELISTED_TOKENS: ChecksumAddress[] = [
  toChecksumAddress("0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7"), // WSEI
  toChecksumAddress("0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"), // WBTC
  toChecksumAddress("0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423"), // iSEI
  toChecksumAddress("0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8"), // WETH
  toChecksumAddress("0x9151434b16b9763660705744891fA906F660EcC5"), // USDT
  toChecksumAddress("0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1"), // USDC_n
  toChecksumAddress("0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392"), // USDC
  toChecksumAddress("0x059A6b0bA116c63191182a0956cF697d0d2213eC"), // syUSD
  toChecksumAddress("0x4b416A45e1f26a53D2ee82a50a4C7D7bE9EdA9E4"), // KURA
  toChecksumAddress("0x8A200a13c1321fdc7F6c7AFba1494E1949426eFD"), // K33
]

export const AVAILABLE_ORDER: string[] = [
  toChecksumAddress("0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392"), // USDC
  toChecksumAddress("0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7"), // WSEI
  toChecksumAddress("0x4b416A45e1f26a53D2ee82a50a4C7D7bE9EdA9E4"), // KURA
  toChecksumAddress("0x8A200a13c1321fdc7F6c7AFba1494E1949426eFD"), // K33
  toChecksumAddress("0x9151434b16b9763660705744891fA906F660EcC5"), // USDT
  toChecksumAddress("0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1"), // USDC_n
  toChecksumAddress("0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8"), // WETH
  toChecksumAddress("0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"), // WBTC
  toChecksumAddress("0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423"), // iSEI
  toChecksumAddress("0x059A6b0bA116c63191182a0956cF697d0d2213eC"), // syUSD
]

export const getAvailableOrderIndex = (token: string) => {
  return AVAILABLE_ORDER.indexOf(token);
}

export const MIN_SQRT_RATIO_PLUS_ONE = "4295128740";
export const MAX_SQRT_RATIO_MINUS_ONE = "1461446703485210103287273052203988822378723970341";

const FEE_TIER_TO_TICK_SPACING: Record<number, number> = {
  100: 1,
  250: 5,
  500: 10,
  3000: 50,
  10000: 100,
  20000: 200,
}

export const getTickSpacing = (feeTier: number) => {
  const tickSpacing = FEE_TIER_TO_TICK_SPACING[feeTier];
  if (!tickSpacing) {
    throw new Error(`Invalid fee tier: ${feeTier}`);
  }
  return tickSpacing;
}