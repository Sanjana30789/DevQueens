// src/utils/contractConfig.js
import { ethers } from "ethers";


import SupplyChain from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

export const CONTRACT_ADDRESS = "0x9c3A2B154B534aF1C6925A119Cba00C3cc6251Ca"; 

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
  return contract;
}





