// src/utils/contractConfig.js
import { ethers } from "ethers";


import SupplyChain from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

export const CONTRACT_ADDRESS = "0xC578c052E1fDA2d63a727cd722c4553C1A8D39a7"; 

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
  return contract;
}





