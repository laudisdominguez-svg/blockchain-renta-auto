# Red Privada Ethereum con Hyperledger Besu

Este proyecto muestra cómo configurar y ejecutar una **red privada de Ethereum** utilizando **Hyperledger Besu**.  
Incluye la creación de múltiples nodos validadores, configuración de RPC y conexión con Metamask.

---

## 📂 Estructura del proyecto
Cada nodo se inicia desde la carpeta bin de Besu, especificando su archivo génesis, su carpeta de datos y sus puertos RPC/P2P.
node 0  .\besu.bat --genesis-file="<RUTA_GENESIS>" --data-path="<RUTA_KEYS_NODE0>" --rpc-http-enabled --rpc-http-port=<PUERTO_RPC_NODE0> --host-allowlist="*" --p2p-port=<PUERTO_P2P_NODE0>
node 1 .\besu.bat --genesis-file="<RUTA_GENESIS>" --data-path="<RUTA_KEYS_NODE1>" --rpc-http-enabled --rpc-http-port=<PUERTO_RPC_NODE1> --host-allowlist="*" --p2p-port=<PUERTO_P2P_NODE1>
node 2 .\besu.bat --genesis-file="<RUTA_GENESIS>" --data-path="<RUTA_KEYS_NODE2>" --rpc-http-enabled --rpc-http-port=<PUERTO_RPC_NODE2> --host-allowlist="*" --p2p-port=<PUERTO_P2P_NODE2>
node 3 .\besu.bat --genesis-file="<RUTA_GENESIS>" --data-path="<RUTA_KEYS_NODE3>" --rpc-http-enabled --rpc-http-port=<PUERTO_RPC_NODE3> --host-allowlist="*" --p2p-port=<PUERTO_P2P_NODE3>

🔍 Verificación de nodos activos
Puedes consultar el número de bloque de cada nodo con PowerShell usando el puerto RPC correspondiente:
Invoke-RestMethod -Uri http://localhost:<PUERTO_RPC_NODEX> -Method Post -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
- El resultado será un JSON con el número de bloque actual
- Donde result es el bloque en hexadecimal


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

## 🚀 Cómo ejecutar este proyecto

1. **Instalar dependencias:** `npm install`
2. **Configurar variables de entorno:** Crear un archivo `.env` basado en `.env.example`.
3. **Compilar:** `npx hardhat compile`
4. **Desplegar:** `npx hardhat run scripts/deploy.js --network besu`
