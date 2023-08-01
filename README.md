# Spielworks Hardhat tasks

This module exposes some useful Hardhat tasks.

## Installation

Install the plugins via

```shell
npm install --save @spielworksdev/hardhat-plugin
```

Or add to `package.json`:

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^3.0.0",
    "@spielworksdev/hardhat-plugin": "^2.0.0",
    "hardhat": "^2.17.0"
  }
}
```

and run `npm i`.

Then add this line to `hardhat.config.ts` to enable the plugin:

```typescript
import '@spielworksdev/hardhat-plugin'
```

## Features

### Tasks

#### Deploy smart contract

A task to deploy a smart contract to a chain. The smart contract must be part of the project and
is referenced by name.

Usage:

```shell
npx hardhat deploy-smart-contract --name $ContractName --arguments 0x...,4096 --verify
```

Arguments:

| Name      | Explanation                                                                                                              |
|-----------|--------------------------------------------------------------------------------------------------------------------------|
| name      | The name of the smart contract. This corresponds with the name in the solidity file.                                     |
| arguments | Comma separated list of constructor arguments. Array arguments are semicolon separated.                                  |
| verify    | Flag to verify the deployed contract. Optional. Requires Etherscan/Polygonscan etc key to be set up in hardhat.config.ts |

#### Deploy proxy

A task to deploy a `TransparentUpgradeableProxy` from OpenZeppelin to another smart contract.

Both the proxy solidity file and the proxied smart contract must be part of the project.

Usage:

```shell
npx hardhat deploy-proxy --address 0x... --proxy-owner 0x... --name $ProxiedContractName \
  --initializer-function $initialize --arguments 0x...,4096 --verify
```

Arguments:

| Name                 | Explanation                                                                                                              |
|----------------------|--------------------------------------------------------------------------------------------------------------------------|
| address              | The address of the implementation to proxy to                                                                            |
| proxy-owner          | The address owning the proxy (should be a deployed `ProxyAdmin` contract, but this is not required)                      |
| name                 | The name of the smart contract being proxied. This corresponds with the name in the solidity file.                       |
| proxy-name           | The name of the proxy smart contract (defaults to `TransparentUpgradeableProxy`)                                         |
| initializer-function | Name of a function in `contract` to call (constructor replacement)                                                       |
| arguments            | Arguments to `initializer-function`, comma separated. Array arguemnts are semicolon separated.                           |
| verify               | Flag to verify the proxy source code. Optional. Requires Etherscan/Polygonscan etc key to be set up in hardhat.config.ts |
