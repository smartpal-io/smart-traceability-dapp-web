pragma solidity ^0.4.24;

import "./Traceable.sol";

contract ProductRegistry {

  mapping (bytes32 => address) private products;

  event LogNewProductRecorded(bytes32 indexed id, address indexed value);


  /**
  * @dev Create a new Product registry Contract.
  */
  constructor() public {
  }

  /**
  * @dev Record a new product in the registry.
  * @param _id id of the product
  */
  function addProduct(bytes32 _id)
    public
    nonZeroBytes32(_id)
  {
    require(products[_id] == address(0x0));
    //create new contract
    Traceable traceable = new Traceable(_id);
    //add to whitelist the sender
    traceable.addAllowedModifier(msg.sender);
    //register this product
    products[_id] = traceable;
    emit LogNewProductRecorded(_id,traceable);
  }

  /**
  * Use this getter function to access the product address
  * @param _id of the product
  * @return the address
  */
  function getProductAddress(bytes32 _id) public view returns(address) {
    return products[_id];
  }

  /**
  * @dev Throws if zero
  */
  modifier nonZeroBytes32(bytes32 _value){
      require(_value != bytes32(0));
      _;
  }

}
