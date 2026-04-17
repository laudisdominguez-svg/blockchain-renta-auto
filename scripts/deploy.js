const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Cambia "CarRentalToken" por el nombre exacto que tiene tu contrato dentro del archivo .sol
  const CarRentalToken = await ethers.getContractFactory("CarRentalToken");

  console.log("Desplegando Proxy...");
  
  // Esto despliega el contrato y llama a la función initialize()
  const proxy = await upgrades.deployProxy(CarRentalToken, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.prepareUpgrade(proxyAddress, CarRentalToken);

  console.log("**********************************************");
  console.log("CONTRATO DESPLEGADO CON ÉXITO");
  console.log("Dirección del Proxy (USAR ESTA):", proxyAddress);
  console.log("Dirección de la Implementación:", implementationAddress);
  console.log("**********************************************");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
