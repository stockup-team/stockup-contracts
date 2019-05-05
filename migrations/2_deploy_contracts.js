/* global artifacts */
const StockupShareToken = artifacts.require('StockupShareToken');

const config = require('../config/params');

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0];

  let netId;

  switch (network) {
    case 'mainnet':
      netId = 1;
      break;
    case 'ropsten':
      netId = 3;
      break;
    default:
      netId = 123; // testnet
  }

  const configParams = config.getParams(netId);

  const params = {
    token: {
      name: configParams.token.name,
      symbol: configParams.token.symbol,
    },
  };

  deployer.deploy(StockupShareToken, params.token.name, params.token.symbol, { from: owner });
};
