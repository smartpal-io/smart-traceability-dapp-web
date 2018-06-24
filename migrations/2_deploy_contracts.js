var ProductRegistry = artifacts.require("./ProductRegistry.sol");
module.exports = function(deployer) {
  deployer.deploy(ProductRegistry);
};
