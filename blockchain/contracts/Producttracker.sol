// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTracker {
    struct Product {
        string productId;
        string companyId;
        string supplyChainId;
        string productName;
        string description;
        string batchNumber;
        string deliveryLocation;
        string productionDate;
        uint256 quantity;
        uint256 price;
        address createdBy;
    }

    mapping(string => Product) public products;

    event ProductAdded(string productId, string productName);

    function addProduct(
        string memory _productId,
        string memory _companyId,
        string memory _supplyChainId,
        string memory _productName,
        string memory _description,
        string memory _batchNumber,
        string memory _deliveryLocation,
        string memory _productionDate,
        uint256 _quantity,
        uint256 _price
    ) public {
        require(products[_productId].createdBy == address(0), "Product already exists");

        products[_productId] = Product(
            _productId,
            _companyId,
            _supplyChainId,
            _productName,
            _description,
            _batchNumber,
            _deliveryLocation,
            _productionDate,
            _quantity,
            _price,
            msg.sender
        );

        emit ProductAdded(_productId, _productName);
    }

    function getProduct(string memory _productId)
        public
        view
        returns (Product memory)
    {
        return products[_productId];
    }
}