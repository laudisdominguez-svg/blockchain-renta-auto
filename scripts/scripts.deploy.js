const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("--- INICIANDO DESPLIEGUE EN HYPERLEDGER BESU ---");

  // 1. Obtener la cuenta que despliega (la Admin de tu .env)
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  // 2. Cargar el contrato
  const CarRentalToken = await ethers.getContractFactory("CarRentalToken");

  console.log("Desplegando Proxy UUPS...");

  // 3. Desplegar el Proxy y ejecutar el initialize()
  // Nota: Como tu initialize() no recibe parámetros, el array [] va vacío
  const carRental = await upgrades.deployProxy(CarRentalToken, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await carRental.waitForDeployment();

  // 4. Direcciones importantes
  const proxyAddress = await carRental.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ DESPLIEGUE EXITOSO");
  console.log("-----------------------------------------");
  console.log("Dirección del PROXY (Usar en MetaMask):", proxyAddress);
  console.log("Dirección de la IMPLEMENTACIÓN (Lógica):", implementationAddress);
  console.log("-----------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
