const EthTransactionManager = artifacts.require("EthTransactionManager");

module.exports = function (deployer) {
  deployer.deploy(EthTransactionManager);
};