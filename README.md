# stockup contracts

> Smart-contracts of stockup share tokenization platform.

With using [Truffle framework](http://truffleframework.com/). Powered by [Ethereum](https://ethereum.org/).  
  
## Usage

### Requirements

- Linux (for run bash scripts)
- Node v10.15.3
- NPM v6.9.0

### Install

```
npm i
```

### Compile contracts

```
npm run compile
```

### Run tests

Using local truffle develop network.

```
npm run test
```

### Deploy

#### 1. Configure network parameters

Create file ```.env``` in root project directory. Fill out environment variables as in ```.env.example```.

##### Parameters:

1. ```INFURA_API_KEY``` - API key for Infura provider;  
2. ```MAINNET_MNEMONIC``` - Mnemonic phrase of deployer wallets;  
3. ```MAINNET_GAS_LIMIT``` - Gas limit value;  
4. ```MAINNET_GAS_PRICE``` - Gas price value;  
5. ```ROPSTEN_MNEMONIC``` - Mnemonic phrase of deployer wallets (for Ropsten network);  
6. ```ROPSTEN_GAS_LIMIT``` - Gas limit value (for Ropsten network);  
7. ```ROPSTEN_GAS_PRICE``` - Gas price value (for Ropsten network);  

#### 2. Configure contracts parameters

Create file ```<netName>.json``` in ```config/params``` directory. Fill out the config as in ```config/params/example.json```.

##### netNames:

```json
[
  "testnet",
  "ropsten",
  "mainnet"
]
```

##### Parameters:

1. ```token.name``` - Name of share-token;  
2. ```token.symbol``` - Symbol of share-token;  

#### 3. Compile contracts

```
truffle compile --network <netName>
```

##### netNames:

```json
[
  "develop",
  "ropsten",
  "mainnet"
]
```

##### 2. Deploy contracts

```
truffle migrate --network <netName>
```

For reset migration state and migrate again use ```--reset```.  
