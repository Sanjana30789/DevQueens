// src/utils/contractConfig.js
import { ethers } from "ethers";


import SupplyChain from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

export const CONTRACT_ADDRESS = "0x7432DE22B2a94F3a8d0184815448E3Ee67E3C4D3"; 

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
  return contract;
}





