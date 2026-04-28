const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚗 CAR RENTAL TOKEN - DEPLOY SCRIPT");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Desplegando con cuenta: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  try {
    // Compilar
    console.log("📦 Compilando contratos...");
    const CarRentalToken = await ethers.getContractFactory("CarRentalToken");

    // Deploy proxy
    console.log("🔧 Desplegando Proxy UUPS...");
    const proxy = await upgrades.deployProxy(CarRentalToken, [], {
      initializer: "initialize",
      kind: "uups",
      timeout: 60000,
    });

    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    console.log("\n✅ PROXY DESPLEGADO EXITOSAMENTE\n");
    console.log(`   Proxy Address: ${proxyAddress}`);

    // Obtener implementación
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`   Implementation: ${implementationAddress}`);

    // Verificar que se inicializó correctamente
    console.log("\n🔍 Verificando inicialización...");
    const owner = await proxy.owner();
    const carCount = await proxy.carCount();
    const penalty = await proxy.penaltyPercentage();
    const deposit = await proxy.depositPercentage();
    const damage = await proxy.damagePercentage();

    console.log(`   ✓ Owner: ${owner}`);
    console.log(`   ✓ Car Count: ${carCount}`);
    console.log(`   ✓ Penalty %: ${penalty}`);
    console.log(`   ✓ Deposit %: ${deposit}`);
    console.log(`   ✓ Damage %: ${damage}`);

    // Guardar direcciones en archivo
    const fs = require("fs");
    const deploymentInfo = {
      proxyAddress,
      implementationAddress,
      owner,
      network: (await ethers.provider.getNetwork()).name,
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      "./deployment.json",
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n" + "=".repeat(70));
    console.log("  ✨ DEPLOYMENT EXITOSO");
    console.log("=".repeat(70));
    console.log("\n📋 Detalles de despliegue guardados en: deployment.json\n");

  } catch (error) {
    console.error("\n❌ ERROR EN DEPLOY:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
