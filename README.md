# Red Privada Ethereum con Hyperledger Besu /

## 📋 Descripción General

**Car Rental Token** es un smart contract de Solidity que implementa una plataforma descentralizada de alquiler de vehículos en blockchain. Construido con patrón **UUPS Proxy** upgradeable para permitir mejoras futuras sin perder el estado.

### Características Principales

✅ **Alquiler descentralizado** - Sistema completo de alquiler y devolución  
✅ **Patrón UUPS Upgradeable** - Permite evolucionar el contrato preservando datos  
✅ **Clientes Leales** - Sistema de descuentos para clientes recurrentes  
✅ **Seguridad Avanzada** - Protección contra reentrancia con ReentrancyGuard  
✅ **Validación de Inputs** - Prevención de errores comunes  
✅ **Sistema de Eventos** - Auditoría completa de operaciones  
✅ **Optimización de Gas** - Queries O(1) mediante mappings eficientes  
✅ **Historial de Transacciones** - Tracking completo de todas las operaciones  

# 🚗 Car Rental Token

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Latest-yellow.svg)](https://hardhat.org/)
[![Tests](https://img.shields.io/badge/Tests-125%2B-brightgreen.svg)](test/)
[![Coverage](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg)]
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

- **Lenguaje**: Solidity ^0.8.20
- **Framework**: Hardhat
- **Testing**: Chai + Mocha
- **Network**: Besu (IBFT 2.0) / Ethereum compatible
- **Proxy Pattern**: UUPS (Transparent Upgradeable Proxy)
- **Librerías**: OpenZeppelin Contracts Upgradeable

## 🎬 Demo Rápido (30 segundos)

### Flujo de usuario:
1. Admin agrega auto → `addCarOne(1, "Toyota", ...)`
2. Cliente renta → `rentCar(1, 5 days)` + 20 ETH
3. Cliente devuelve → `returnCar(1, false)` → reembolso
4. Sistema registra todo en blockchain ✅

**Gas usado**: ~150k por transacción

🔍 Verificación de nodos activos
Puedes consultar el número de bloque de cada nodo con PowerShell usando el puerto RPC correspondiente:
Invoke-RestMethod -Uri http://localhost:<PUERTO_RPC_NODEX> -Method Post -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
- El resultado será un JSON con el número de bloque actual
- Donde result es el bloque en hexadecimal

## 🛣️ Roadmap Futuro

- [ ] Integración con Chainlink Oracle para precios reales
- [ ] Sistema de NFT para ownership de autos
- [ ] Gobernanza descentralizada (DAO)
- [ ] Multisig para retiros grandes
- [ ] Subgraph The Graph para queries
- [ ] Frontend dApp (React + ethers.js)


## 🏗️ Arquitectura del Sistema

┌─────────────────────────────────┐
│   Car Rental Token (UUPS)       │
│   └─ Implementación upgradeable │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼─────┐    ┌─────▼────┐
   │  Autos   │    │ Rentales │
   │ (mapping)│    │ (mapping)│
   └──────────┘    └──────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Eventos + Logs  │
        │ (Auditoría)     │
        └─────────────────┘

## 📘 Aprendizajes
- Configuración de nodos validadores en Hyperledger Besu.
- Manejo de puertos RPC y P2P para evitar conflictos.
- Verificación de bloques mediante RPC en PowerShell.
- Preparación para conexión con Metamask.




  # 🚗 Car Rental Tokenization - Hyperledger Besu

Proyecto de tokenización de alquiler de vehículos utilizando una red privada de **Hyperledger Besu** y el estándar de contratos actualizables (**UUPS Proxy**).

## 🛠️ Retos Técnicos y Soluciones (Post-Mortem)

Durante el desarrollo y despliegue de este proyecto, se enfrentaron diversos retos técnicos que fueron documentados para el aprendizaje continuo:

### 1. Error HH700: Artifact for contract not found
*   **Problema:** Al ejecutar el script de despliegue, Hardhat no encontraba el contrato compilado.
*   **Causa:** Una discrepancia entre el nombre del contrato definido en Solidity (`contract CarRentalToken`) y el nombre llamado en el script de despliegue `getContractFactory()`.
*   **Solución:** Se sincronizaron los nombres y se forzó una recompilación limpia.
*   **Comando:** `npx hardhat compile`

### 2. Gestión de Dependencias (Ecosystem Conflict)
*   **Problema:** Errores de módulos faltantes al intentar usar `@nomicfoundation/hardhat-toolbox` en conjunto con los plugins de OpenZeppelin.
*   **Solución:** Se optó por una instalación modular, instalando específicamente solo los paquetes necesarios para reducir la sobrecarga de dependencias y evitar conflictos de versiones.
*   **Comando:** `npm install --save-dev @nomicfoundation/hardhat-ethers ethers @openzeppelin/hardhat-upgrades dotenv`

### 3. Sincronización con el Nodo Hyperledger Besu
*   **Problema:** Errores de conexión `JsonRpcProvider` al intentar desplegar.
*   **Causa:** El nodo RPC de la red privada no estaba recibiendo peticiones en el puerto `8545`.
*   **Solución:** Se implementó una verificación de salud del nodo mediante `curl` antes del despliegue para asegurar que la red estuviera lista para recibir transacciones.
*   **Comando de verificación:** 
    ```bash
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545
    ```

### 4. Implementación de Arquitectura de Proxy (UUPS)
*   **Reto:** Configurar el script de despliegue para que el contrato fuera actualizable.
*   **Solución:** Se utilizó el plugin `@openzeppelin/hardhat-upgrades` para separar la lógica de negocio (implementación) del estado del contrato (proxy), permitiendo futuras actualizaciones sin cambiar la dirección del contrato.

---
## 🔒 Auditoría de Seguridad

### Vulnerabilidades analizadas
- ✅ Reentrancia → ReentrancyGuard
- ✅ Integer overflow → Solidity 0.8.20+
- ✅ Access control → Ownable
- ✅ Input validation → require statements

### Tests de seguridad
- ✅ 15 tests de reentrancia
- ✅ 12 tests de boundary cases
- ✅ 8 tests de access control

  
## 🎯 Casos de Uso

### Plataforma de alquiler empresarial
- Gestión automática de rentas
- Tracking de daños en blockchain
- Auditoría completa inmutable

### Sistema de flota compartida
- Múltiples vehículos
- Clientes leales con descuentos
- Penalizaciones automáticas

### Seguros descentralizados
- Depósito de seguridad smart
- Reembolso automático

## 🚀 Cómo ejecutar este proyecto

1. **Instalar dependencias:** `npm install`
2. **Configurar variables de entorno:** Crear un archivo `.env` basado en `.env.example`.
3. **Compilar:** `npx hardhat compile`
4. **Desplegar:** `npx hardhat run scripts/deploy.js --network besu`


## ❓ Preguntas Frecuentes

**¿Puedo hacer upgrade sin perder datos?**
Sí, UUPS Proxy preserva estado. Ver sección "Upgrade del Contrato".

**¿Cuánto cuesta rentar un auto?**
Base: precio/día × días + 10% si > 7 días. Clientes leales: -50%.

**¿Qué pasa si hay daño?**
Se cobra 50% del valor de mercado del vehículo automáticamente.

**¿Es seguro?**
Sí, tiene ReentrancyGuard, validación inputs, y 125+ tests.


## 🤝 Contribuciones

Este proyecto es educativo. Colaboraciones bienvenidas:
1. Fork el repo
2. Crea rama: `git checkout -b feature/mejora`
3. Commit: `git commit -m 'Agrega X'`
4. Push: `git push origin feature/mejora`
5. Abre Pull Request

### Ideas para PRs:
- Agregar funcionalidad de seguros
- Integrar Chainlink
- Crear frontend dApp

## 📊 Comparativa vs Sistemas Tradicionales

| Feature             | Car Rental Token | Plataforma Web |
|---------------------|------------------|----------------|
| Auditoría inmutable |      ✅         |   ❌          |
| Sin intermediarios  |      ✅         |   ❌           |
| Transacciones 24/7  |      ✅         |   ⏰           |
| Transparencia total |      ✅         |   ❌           |
| Costo operativo     |     Bajo         |  Alto          |
| Gas (~$0.01)        |      ✅         |    -            |
