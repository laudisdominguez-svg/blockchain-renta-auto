SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable-upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol;

contract CarRentalToken is Initializable, OwnableUpgradeable, UUPSUpgradeable {


struct Car {
    uint256 id;
    string model;
    uint256 marketValue;
    string plate; 
    uint256 rentalPrice;
    bool isAvailable;
    address currentRenter;
}

mapping(uint256 => Car) public cars;
    uint256[] public carIds;
    uint256 public carCount;
    address public owner;
    mapping(address => bool) public isLoyalCostumer;
    uint256 public penaltyPercentage;

function initialize() public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    owner = msg.sender;
    penaltyPercentage = 10;
}

function addCar(uint256 _id, string memory _model) public onlyOwner {
    cars[_id] = Car(_id, _model, 0, "", 0, true, address(0));
    carIds.push(_id);
    carCount++;
}
 
function countAvailableCars() public view returns (uint256) {
    uint256 count = 0;
    for (uint256 i = 0; i < carIds.length; i++) {
        if (cars[carIds[i]].isAvailable) {
            count++;
        }
    }
    return count;
} 

// FUNCIONES DEL NEGOCIO

function getDepositAmount(uint256 _id) public view returns (uint256) {
    uint256 price = cars[_id].rentalPrice;
    uint256 depositFee = (price * 20) / 100;  // calculo del 20%
    
    if (isLoyalCostumer[msg.sender]) {
        depositFee = depositFee / 2;  // Descuento del 50% para clientes leales
    }
    return depositFee;
}

function calculateTotalRent(uint256 _id, uint256 _days) public view returns (uint256) {
    uint256 total = cars[_id].rentalPrice * _days;

    if (_days > 7) {
        uint256 extraCharge = (total * penaltyPercentage) / 100;
        total = total + extraCharge;
    }

    if (isLoyalCostumer[msg.sender]) {
        total = total / 2;
    }
    return total;
}
function calculateDamageFee(uint256 _id) public view returns (uint256) {
    return (cars[_id].marketValue * 50) / 100;
}
  
  //FUNCIONES ADMINISTRATIVAS

function addCarOne(
    uint256 _id,
    string memory _model,
    uint256 _marketValue,
    string memory _plate,
    uint256 _rentalPrice
) public onlyOwner {
    cars[_id] = Car(_id, _model, _marketValue, _plate, _rentalPrice, true, address(0));
    carIds.push(_id);
    carCount++;
}

function setLoyalCustomer(address _customer, bool _status) public onlyOwner {
    isLoyalCostumer[_customer] = _status;
}

function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
