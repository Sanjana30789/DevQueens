// src/utils/contractConfig.js
import { ethers } from "ethers";


import SupplyChain from "../../blockchain/artifacts/contracts/SupplyChain.sol/SupplyChain.json";

export const CONTRACT_ADDRESS = "0xc65252fC5348ad0D64D7C84C29Ee76297d22B106"; 

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
  return contract;
}





