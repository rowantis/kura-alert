import { ethers, TransactionReceipt } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export async function sendTransaction(
  contractAddress: string,
  abi: any[],
  privateKey: string,
  functionName: string,
  args: any[],
  providerUrl: string,
): Promise<TransactionReceipt> {
  try {
    // Provider 설정
    const provider = new ethers.JsonRpcProvider(providerUrl);

    // 지갑 생성
    const wallet = new ethers.Wallet(privateKey, provider);

    // 컨트랙트 인스턴스 생성
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // 트랜잭션 실행
    const tx = await contract[functionName](...args);

    // 트랜잭션 완료 대기
    const receipt: TransactionReceipt = await tx.wait();

    return receipt;
  } catch (error) {
    throw error;
  }
}

export async function call(
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[],
  providerUrl: string,
): Promise<any> {
  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    return await contract[functionName](...args);
  } catch (error) {
    throw error;
  }
}