const getNetworkName = id => {
  let name;

  switch (id) {
    case 1:
      name = 'mainnet';
      break;
    case 3:
      name = 'ropsten';
      break;
    default:
      name = 'testnet';
  }

  return name;
};

const getParams = netId => {
  const network = getNetworkName(netId);

  return require(`./${network}.json`); // eslint-disable-line
};

module.exports = {
  getParams,
};
