// src/utils/uploadToIPFS.js
import axios from "axios";

const projectId = "fd9915966e0d4ceb9e86ffd5b7867dd7";
const projectSecret = "jKbuSgiHWUQHpQRFXwNi7EwoGbdFOp/C5A5gTdY9zAjDKsDH0N2xNA";

const auth =
  "Basic " + btoa(projectId + ":" + projectSecret);

export const uploadToIPFS = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "https://ipfs.infura.io:5001/api/v0/add",
      formData,
      {
        headers: {
          Authorization: auth,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // 👇 returns the IPFS hash
    return `https://ipfs.io/ipfs/${response.data.Hash}`;
  } catch (error) {
    console.error("❌ IPFS Upload Error:", error);
    return null;
  }
};
