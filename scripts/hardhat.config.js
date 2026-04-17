require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    besu: {
      url: "http://127.0.0.1:8545", // Asegúrate que tu nodo Besu esté corriendo aquí
      chainId: 2026,
      accounts: [process.env.PRIVATE_KEY_ADMIN] // Lee la llave de tu archivo .env
    }
  }
};
