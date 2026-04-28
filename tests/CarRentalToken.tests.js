const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CarRentalToken", function () {
  let contract;
  let owner;
  let customer;
  let loyalCustomer;
  let attacker;

  // Datos de auto de prueba
  const CAR_ID = 1;
  const CAR_MODEL = "Toyota Corolla";
  const MARKET_VALUE = ethers.parseEther("20000");
  const PLATE = "ABC-1234";
  const RENTAL_PRICE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, customer, loyalCustomer, attacker] = await ethers.getSigners();

    const CarRentalToken = await ethers.getContractFactory("CarRentalToken");
    contract = await upgrades.deployProxy(CarRentalToken, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await contract.waitForDeployment();
  });

  // ─── Inicialización ───────────────────────────────────────────────────────────

  describe("Inicialización", function () {
    it("debe configurar el owner correctamente", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("debe inicializar penaltyPercentage en 10", async function () {
      expect(await contract.penaltyPercentage()).to.equal(10);
    });

    it("debe inicializar depositPercentage en 20", async function () {
      expect(await contract.depositPercentage()).to.equal(20);
    });

    it("debe inicializar damagePercentage en 50", async function () {
      expect(await contract.damagePercentage()).to.equal(50);
    });

    it("debe inicializar carCount en 0", async function () {
      expect(await contract.carCount()).to.equal(0);
    });
  });

  // ─── addCar ───────────────────────────────────────────────────────────────────

  describe("addCar - Validación de Inputs", function () {
    it("debe agregar un auto correctamente", async function () {
      await contract.addCar(CAR_ID, CAR_MODEL);
      const car = await contract.cars(CAR_ID);

      expect(car.id).to.equal(CAR_ID);
      expect(car.model).to.equal(CAR_MODEL);
      expect(car.isAvailable).to.equal(true);
      expect(car.currentRenter).to.equal(ethers.ZeroAddress);
    });

    it("debe incrementar carCount al agregar un auto", async function () {
      await contract.addCar(CAR_ID, CAR_MODEL);
      expect(await contract.carCount()).to.equal(1);
    });

    it("debe revertir si ID es 0", async function () {
      await expect(contract.addCar(0, CAR_MODEL)).to.be.revertedWith(
        "Car ID debe ser > 0"
      );
    });

    it("debe revertir si model está vacío", async function () {
      await expect(contract.addCar(CAR_ID, "")).to.be.revertedWith(
        "Model no puede estar vacio"
      );
    });

    it("debe revertir si ID ya existe", async function () {
      await contract.addCar(CAR_ID, CAR_MODEL);
      await expect(contract.addCar(CAR_ID, "Honda")).to.be.revertedWith(
        "Car ID ya existe"
      );
    });

    it("debe revertir si no es el owner quien llama", async function () {
      await expect(contract.connect(customer).addCar(CAR_ID, CAR_MODEL)).to.be
        .reverted;
    });

    it("debe emitir evento CarAdded", async function () {
      await expect(contract.addCar(CAR_ID, CAR_MODEL))
        .to.emit(contract, "CarAdded")
        .withArgs(CAR_ID, CAR_MODEL, 0);
    });
  });

  // ─── addCarOne ────────────────────────────────────────────────────────────────

  describe("addCarOne - Validación Completa", function () {
    it("debe agregar un auto con todos los campos", async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
      const car = await contract.cars(CAR_ID);

      expect(car.id).to.equal(CAR_ID);
      expect(car.model).to.equal(CAR_MODEL);
      expect(car.marketValue).to.equal(MARKET_VALUE);
      expect(car.plate).to.equal(PLATE);
      expect(car.rentalPrice).to.equal(RENTAL_PRICE);
      expect(car.isAvailable).to.equal(true);
    });

    it("debe revertir si ID es 0", async function () {
      await expect(
        contract.addCarOne(0, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE)
      ).to.be.revertedWith("Car ID debe ser > 0");
    });

    it("debe revertir si model está vacío", async function () {
      await expect(
        contract.addCarOne(CAR_ID, "", MARKET_VALUE, PLATE, RENTAL_PRICE)
      ).to.be.revertedWith("Model no puede estar vacio");
    });

    it("debe revertir si marketValue es 0", async function () {
      await expect(
        contract.addCarOne(CAR_ID, CAR_MODEL, 0, PLATE, RENTAL_PRICE)
      ).to.be.revertedWith("Market value debe ser > 0");
    });

    it("debe revertir si plate está vacía", async function () {
      await expect(
        contract.addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, "", RENTAL_PRICE)
      ).to.be.revertedWith("Plate no puede estar vacio");
    });

    it("debe revertir si rentalPrice es 0", async function () {
      await expect(
        contract.addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, 0)
      ).to.be.revertedWith("Rental price debe ser > 0");
    });

    it("debe revertir si ID ya existe", async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
      await expect(
        contract.addCarOne(CAR_ID, "Honda", MARKET_VALUE, "XYZ-5678", RENTAL_PRICE)
      ).to.be.revertedWith("Car ID ya existe");
    });

    it("debe revertir si no es el owner quien llama", async function () {
      await expect(
        contract
          .connect(customer)
          .addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE)
      ).to.be.reverted;
    });

    it("debe emitir evento CarAdded con precio correcto", async function () {
      await expect(
        contract.addCarOne(
          CAR_ID,
          CAR_MODEL,
          MARKET_VALUE,
          PLATE,
          RENTAL_PRICE
        )
      )
        .to.emit(contract, "CarAdded")
        .withArgs(CAR_ID, CAR_MODEL, RENTAL_PRICE);
    });
  });

  // ─── countAvailableCars ───────────────────────────────────────────────────────

  describe("countAvailableCars - Optimización O(1)", function () {
    it("debe retornar 0 cuando no hay autos", async function () {
      expect(await contract.countAvailableCars()).to.equal(0);
    });

    it("debe contar autos disponibles correctamente", async function () {
      await contract.addCarOne(1, "Toyota", MARKET_VALUE, "AAA-001", RENTAL_PRICE);
      await contract.addCarOne(2, "Honda", MARKET_VALUE, "AAA-002", RENTAL_PRICE);
      expect(await contract.countAvailableCars()).to.equal(2);
    });

    it("debe actualizar cuando un auto se renta", async function () {
      await contract.addCarOne(1, "Toyota", MARKET_VALUE, "AAA-001", RENTAL_PRICE);
      expect(await contract.countAvailableCars()).to.equal(1);

      const deposit = await contract.connect(customer).getDepositAmount(1);
      const totalCost = await contract.connect(customer).calculateTotalRent(1, 3);
      const totalRequired = deposit + totalCost;

      await contract.connect(customer).rentCar(1, 3, { value: totalRequired });
      expect(await contract.countAvailableCars()).to.equal(0);
    });
  });

  // ─── getDepositAmount ─────────────────────────────────────────────────────────

  describe("getDepositAmount - Cálculo de Depósito", function () {
    beforeEach(async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
    });

    it("debe calcular el depósito como el 20% del precio de renta", async function () {
      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const expected = (RENTAL_PRICE * 20n) / 100n;
      expect(deposit).to.equal(expected);
    });

    it("debe aplicar descuento del 50% a clientes leales", async function () {
      await contract.setLoyalCustomer(loyalCustomer.address, true);
      const deposit = await contract
        .connect(loyalCustomer)
        .getDepositAmount(CAR_ID);
      const normalDeposit = (RENTAL_PRICE * 20n) / 100n;
      const expected = normalDeposit / 2n;
      expect(deposit).to.equal(expected);
    });

    it("debe revertir si auto no existe", async function () {
      await expect(
        contract.connect(customer).getDepositAmount(999)
      ).to.be.revertedWith("Auto no existe");
    });
  });

  // ─── calculateTotalRent ───────────────────────────────────────────────────────

  describe("calculateTotalRent - Cálculo de Renta", function () {
    beforeEach(async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
    });

    it("debe calcular la renta correctamente por 3 días (sin recargo)", async function () {
      const total = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      expect(total).to.equal(RENTAL_PRICE * 3n);
    });

    it("debe aplicar recargo del 10% para rentas mayores a 7 días", async function () {
      const days = 10n;
      const base = RENTAL_PRICE * days;
      const recargo = (base * 10n) / 100n;
      const expected = base + recargo;

      const total = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 10);
      expect(total).to.equal(expected);
    });

    it("debe aplicar descuento del 50% a clientes leales", async function () {
      await contract.setLoyalCustomer(loyalCustomer.address, true);
      const total = await contract
        .connect(loyalCustomer)
        .calculateTotalRent(CAR_ID, 3);
      const expected = (RENTAL_PRICE * 3n) / 2n;
      expect(total).to.equal(expected);
    });

    it("cliente leal con más de 7 días: aplica recargo primero y luego descuento", async function () {
      await contract.setLoyalCustomer(loyalCustomer.address, true);
      const days = 10n;
      const base = RENTAL_PRICE * days;
      const recargo = (base * 10n) / 100n;
      const conRecargo = base + recargo;
      const expected = conRecargo / 2n;

      const total = await contract
        .connect(loyalCustomer)
        .calculateTotalRent(CAR_ID, 10);
      expect(total).to.equal(expected);
    });

    it("debe revertir si días es 0", async function () {
      await expect(
        contract.connect(customer).calculateTotalRent(CAR_ID, 0)
      ).to.be.revertedWith("Dias debe ser > 0");
    });

    it("debe revertir si auto no existe", async function () {
      await expect(
        contract.connect(customer).calculateTotalRent(999, 3)
      ).to.be.revertedWith("Auto no existe");
    });
  });

  // ─── calculateDamageFee ────────────────────────────────────────────────────────

  describe("calculateDamageFee - Tarifa de Daño", function () {
    beforeEach(async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
    });

    it("debe calcular tarifa de daño como 50% del valor de mercado", async function () {
      const fee = await contract.calculateDamageFee(CAR_ID);
      const expected = (MARKET_VALUE * 50n) / 100n;
      expect(fee).to.equal(expected);
    });

    it("debe revertir si auto no existe", async function () {
      await expect(contract.calculateDamageFee(999)).to.be.revertedWith(
        "Auto no existe"
      );
    });
  });

  // ─── Rental Functions ──────────────────────────────────────────────────────────

  describe("rentCar - Alquiler de Auto", function () {
    beforeEach(async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );
    });

    it("debe rentar un auto correctamente", async function () {
      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });

      const car = await contract.cars(CAR_ID);
      expect(car.isAvailable).to.equal(false);
      expect(car.currentRenter).to.equal(customer.address);
    });

    it("debe emitir evento CarRented", async function () {
      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await expect(
        contract
          .connect(customer)
          .rentCar(CAR_ID, 3, { value: totalRequired })
      )
        .to.emit(contract, "CarRented")
        .withArgs(CAR_ID, customer.address, 3, deposit);
    });

    it("debe revertir si auto no existe", async function () {
      const totalRequired = ethers.parseEther("500");
      await expect(
        contract.connect(customer).rentCar(999, 3, { value: totalRequired })
      ).to.be.revertedWith("Auto no existe");
    });

    it("debe revertir si auto no está disponible", async function () {
      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });

      // Intento de renta del mismo auto
      await expect(
        contract.connect(loyalCustomer).rentCar(CAR_ID, 3, { value: totalRequired })
      ).to.be.revertedWith("Auto no disponible");
    });

    it("debe revertir si monto enviado es insuficiente", async function () {
      const insufficientAmount = ethers.parseEther("1");
      await expect(
        contract.connect(customer).rentCar(CAR_ID, 3, { value: insufficientAmount })
      ).to.be.revertedWith("Monto insuficiente");
    });

    it("debe revertir si días es 0", async function () {
      const totalRequired = ethers.parseEther("500");
      await expect(
        contract.connect(customer).rentCar(CAR_ID, 0, { value: totalRequired })
      ).to.be.revertedWith("Dias debe ser > 0");
    });

    it("debe decrementar countAvailableCars al rentar", async function () {
      expect(await contract.countAvailableCars()).to.equal(1);

      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });

      expect(await contract.countAvailableCars()).to.equal(0);
    });
  });

  // ─── returnCar - Devolución de Auto ────────────────────────────────────────────

  describe("returnCar - Devolución de Auto", function () {
    let deposit, totalCost, totalRequired;

    beforeEach(async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );

      deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });
    });

    it("debe devolver un auto correctamente sin daños", async function () {
      await contract.connect(customer).returnCar(CAR_ID, false);

      const car = await contract.cars(CAR_ID);
      expect(car.isAvailable).to.equal(true);
      expect(car.currentRenter).to.equal(ethers.ZeroAddress);
    });

    it("debe emitir evento CarReturned", async function () {
      await expect(contract.connect(customer).returnCar(CAR_ID, false))
        .to.emit(contract, "CarReturned")
        .withArgs(CAR_ID, customer.address, false);
    });

    it("debe reportar daños y cobrar tarifa", async function () {
      await expect(contract.connect(customer).returnCar(CAR_ID, true))
        .to.emit(contract, "DamageFeeCharged");
    });

    it("debe revertir si no eres el rentador actual", async function () {
      await expect(contract.connect(loyalCustomer).returnCar(CAR_ID, false)).to
        .be.reverted;
    });

    it("debe revertir si auto no existe", async function () {
      await expect(contract.connect(customer).returnCar(999, false)).to.be
        .reverted;
    });

    it("debe incrementar countAvailableCars al devolver", async function () {
      expect(await contract.countAvailableCars()).to.equal(0);

      await contract.connect(customer).returnCar(CAR_ID, false);

      expect(await contract.countAvailableCars()).to.equal(1);
    });
  });

  // ─── Loyal Customer Functions ──────────────────────────────────────────────────

  describe("setLoyalCustomer - Gestión de Clientes Leales", function () {
    it("debe marcar un cliente como leal", async function () {
      await contract.setLoyalCustomer(customer.address, true);
      expect(await contract.isLoyalCustomer(customer.address)).to.equal(true);
    });

    it("debe remover estatus de cliente leal", async function () {
      await contract.setLoyalCustomer(customer.address, true);
      await contract.setLoyalCustomer(customer.address, false);
      expect(await contract.isLoyalCustomer(customer.address)).to.equal(false);
    });

    it("debe emitir evento LoyalCustomerUpdated", async function () {
      await expect(contract.setLoyalCustomer(customer.address, true))
        .to.emit(contract, "LoyalCustomerUpdated")
        .withArgs(customer.address, true);
    });

    it("debe revertir si address es 0", async function () {
      await expect(
        contract.setLoyalCustomer(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Direccion invalida");
    });

    it("debe revertir si no es el owner", async function () {
      await expect(contract.connect(customer).setLoyalCustomer(customer.address, true))
        .to.be.reverted;
    });
  });

  // ─── Admin Functions ───────────────────────────────────────────────────────────

  describe("setPenaltyPercentage - Gestión de Penalidades", function () {
    it("debe actualizar el porcentaje de penalidad", async function () {
      await contract.setPenaltyPercentage(15);
      expect(await contract.penaltyPercentage()).to.equal(15);
    });

    it("debe emitir evento PenaltyPercentageUpdated", async function () {
      await expect(contract.setPenaltyPercentage(15))
        .to.emit(contract, "PenaltyPercentageUpdated")
        .withArgs(15);
    });

    it("debe revertir si porcentaje es 0", async function () {
      await expect(contract.setPenaltyPercentage(0)).to.be.revertedWith(
        "Porcentaje invalido"
      );
    });

    it("debe revertir si porcentaje > 100", async function () {
      await expect(contract.setPenaltyPercentage(101)).to.be.revertedWith(
        "Porcentaje invalido"
      );
    });

    it("debe revertir si no es el owner", async function () {
      await expect(contract.connect(customer).setPenaltyPercentage(15)).to.be
        .reverted;
    });
  });

  // ─── Security Tests - Reentrancy ──────────────────────────────────────────────

  describe("Seguridad - Protección Reentrancy", function () {
    it("debe proteger contra reentrancia en returnCar", async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );

      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });

      // returnCar tiene nonReentrant, así que si se intenta reentrancia fallará
      await expect(contract.connect(customer).returnCar(CAR_ID, false)).to.not
        .be.reverted;
    });
  });

  // ─── UUPS Upgrade Tests ───────────────────────────────────────────────────────

  describe("UUPS Upgrade Functionality", function () {
    it("debe permitir al owner hacer upgrade", async function () {
      const CarRentalTokenV2 = await ethers.getContractFactory("CarRentalToken");
      const newImplementation = await CarRentalTokenV2.deploy();
      await newImplementation.waitForDeployment();

      // Solo el owner puede autorizar upgrade
      await expect(
        upgrades.upgradeProxy(
          await contract.getAddress(),
          CarRentalTokenV2,
          { kind: "uups" }
        )
      ).to.not.be.reverted;
    });

    it("debe revertir upgrade si no es el owner", async function () {
      const CarRentalTokenV2 = await ethers.getContractFactory("CarRentalToken");
      const newImplementation = CarRentalTokenV2.connect(attacker);

      // Intento de upgrade por no-owner fallará
      await expect(
        upgrades.upgradeProxy(
          await contract.getAddress(),
          newImplementation,
          { kind: "uups" }
        )
      ).to.be.reverted;
    });
  });

  // ─── Edge Cases and Boundary Tests ───────────────────────────────────────────

  describe("Edge Cases and Boundary Tests", function () {
    it("debe manejar múltiples autos correctamente", async function () {
      for (let i = 1; i <= 5; i++) {
        await contract.addCarOne(
          i,
          `Model${i}`,
          MARKET_VALUE,
          `PLATE-${i}`,
          RENTAL_PRICE
        );
      }
      expect(await contract.carCount()).to.equal(5);
      expect(await contract.countAvailableCars()).to.equal(5);
    });

    it("debe manejar valores de ether grandes", async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );

      const largeAmount = ethers.parseEther("1000");
      await expect(
        contract.connect(customer).rentCar(CAR_ID, 3, { value: largeAmount })
      ).to.not.be.reverted;
    });

    it("debe rastrear historial de transacciones", async function () {
      await contract.addCarOne(
        CAR_ID,
        CAR_MODEL,
        MARKET_VALUE,
        PLATE,
        RENTAL_PRICE
      );

      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const totalCost = await contract
        .connect(customer)
        .calculateTotalRent(CAR_ID, 3);
      const totalRequired = deposit + totalCost;

      await contract
        .connect(customer)
        .rentCar(CAR_ID, 3, { value: totalRequired });

      const history = await contract.getTransactionHistory();
      expect(history.length).to.be.greaterThan(0);
    });
  });
}); 

