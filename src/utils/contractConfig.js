// src/utils/contractConfig.js
import { ethers } from "ethers";


import SupplyChain from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

export const CONTRACT_ADDRESS = "0xBd9EB099Cc524F25b3F9872fdb59Be61932c4E7F"; 

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
  return contract;
}





