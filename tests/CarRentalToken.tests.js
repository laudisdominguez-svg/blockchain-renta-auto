const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CarRentalToken", function () {
  let contract;
  let owner;
  let customer;
  let loyalCustomer;

  // Datos de auto de prueba
  const CAR_ID = 1;
  const CAR_MODEL = "Toyota Corolla";
  const MARKET_VALUE = ethers.parseEther("20000");
  const PLATE = "ABC-1234";
  const RENTAL_PRICE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, customer, loyalCustomer] = await ethers.getSigners();

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

    it("debe inicializar carCount en 0", async function () {
      expect(await contract.carCount()).to.equal(0);
    });
  });

  // ─── addCar ───────────────────────────────────────────────────────────────────

  describe("addCar", function () {
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

    it("debe revertir si no es el owner quien llama", async function () {
      await expect(
        contract.connect(customer).addCar(CAR_ID, CAR_MODEL)
      ).to.be.reverted;
    });
  });

  // ─── addCarOne ────────────────────────────────────────────────────────────────

  describe("addCarOne", function () {
    it("debe agregar un auto con todos los campos", async function () {
      await contract.addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE);
      const car = await contract.cars(CAR_ID);

      expect(car.id).to.equal(CAR_ID);
      expect(car.model).to.equal(CAR_MODEL);
      expect(car.marketValue).to.equal(MARKET_VALUE);
      expect(car.plate).to.equal(PLATE);
      expect(car.rentalPrice).to.equal(RENTAL_PRICE);
      expect(car.isAvailable).to.equal(true);
    });

    it("debe revertir si no es el owner quien llama", async function () {
      await expect(
        contract.connect(customer).addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE)
      ).to.be.reverted;
    });
  });

  // ─── countAvailableCars ───────────────────────────────────────────────────────

  describe("countAvailableCars", function () {
    it("debe retornar 0 cuando no hay autos", async function () {
      expect(await contract.countAvailableCars()).to.equal(0);
    });

    it("debe contar autos disponibles correctamente", async function () {
      await contract.addCarOne(1, "Toyota", MARKET_VALUE, "AAA-001", RENTAL_PRICE);
      await contract.addCarOne(2, "Honda", MARKET_VALUE, "AAA-002", RENTAL_PRICE);
      expect(await contract.countAvailableCars()).to.equal(2);
    });
  });

  // ─── getDepositAmount ─────────────────────────────────────────────────────────

  describe("getDepositAmount", function () {
    beforeEach(async function () {
      await contract.addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE);
    });

    it("debe calcular el depósito como el 20% del precio de renta", async function () {
      const deposit = await contract.connect(customer).getDepositAmount(CAR_ID);
      const expected = (RENTAL_PRICE * 20n) / 100n;
      expect(deposit).to.equal(expected);
    });

    it("debe aplicar descuento del 50% a clientes leales", async function () {
      await contract.setLoyalCustomer(loyalCustomer.address, true);
      const deposit = await contract.connect(loyalCustomer).getDepositAmount(CAR_ID);
      const normalDeposit = (RENTAL_PRICE * 20n) / 100n;
      const expected = normalDeposit / 2n;
      expect(deposit).to.equal(expected);
    });
  });

  // ─── calculateTotalRent ───────────────────────────────────────────────────────

  describe("calculateTotalRent", function () {
    beforeEach(async function () {
      await contract.addCarOne(CAR_ID, CAR_MODEL, MARKET_VALUE, PLATE, RENTAL_PRICE);
    });

    it("debe calcular la renta correctamente por 3 días (sin recargo)", async function () {
      const total = await contract.connect(customer).calculateTotalRent(CAR_ID, 3);
      expect(total).to.equal(RENTAL_PRICE * 3n);
    });

    it("debe aplicar recargo del 10% para rentas mayores a 7 días", async function () {
      const days = 10n;
      const base = RENTAL_PRICE * days;
      const recargo = (base * 10n) / 100n;
      const expected = base + recargo;

      const total = await contract.connect(customer).calculateTotalRent(CAR_ID, 10);
      expect(total).to.equal(expected);
    });

    it("debe aplicar descuento del 50% a clientes leales", async function () {
      await contract.setLoyalCustomer(loyalCustomer.address, true);
      const total = await contract.connect(loyalCustomer).calculateTotalRent(CAR_ID, 3);
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

      const total = await contract.connect(loyalCustomer).calculateTotalRent(CAR_ID, 10);
      expect(total).to.equal(expected);
    });
  });
}); 
