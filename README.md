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
