// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };


require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28", 
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: [process.env.PRIVATE_KEY], // from .env
    },
  },
};
