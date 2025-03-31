// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import "@hyperlane-xyz/core/contracts/interfaces/IInterchainGasPaymaster.sol";

/**
 * @title HyperlanePaymentToken
 * @dev ERC20 token with payment distribution functionality using Hyperlane
 */
contract HyperlanePaymentToken is ERC20, Ownable {
    // Hyperlane contracts
    IMailbox public mailbox;
    IInterchainGasPaymaster public gasPaymaster;
    
    // The contract's address on the destination chain
    mapping(uint32 => bytes32) public remoteReceivers;
    
    // Payment request ID counter
    uint256 public nextPaymentId = 1;
    
    // Payment request struct
    struct PaymentRequest {
        address[] payees;
        uint256[] amounts;
        bool processed;
    }
    
    // Mapping from payment ID to payment details
    mapping(uint256 => PaymentRequest) public paymentRequests;
    
    // Events
    event PaymentRequested(uint256 indexed paymentId, address requester);
    event PaymentProcessed(uint256 indexed paymentId);
    event MessageSent(uint256 indexed paymentId, uint32 destinationDomain, bytes32 messageId);
    event MessageReceived(uint32 originDomain, bytes32 sender, uint256 paymentId);
    
    /**
     * @dev Constructor for the HyperlanePaymentToken
     * @param _mailbox Hyperlane mailbox contract
     * @param _gasPaymaster Hyperlane gas paymaster contract
     */
    constructor(
        address _mailbox,
        address _gasPaymaster
    ) ERC20("HyperlanePaymentToken", "HPT") Ownable(msg.sender) {
        mailbox = IMailbox(_mailbox);
        gasPaymaster = IInterchainGasPaymaster(_gasPaymaster);
    }
    
    /**
     * @dev Set the receiver address for a particular destination domain
     * @param _destinationDomain The domain ID of the destination chain
     * @param _receiver The address of the receiving contract on the destination chain
     */
    function setRemoteReceiver(uint32 _destinationDomain, address _receiver) external onlyOwner {
        remoteReceivers[_destinationDomain] = addressToBytes32(_receiver);
    }
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
    /**
     * @dev Request a payment to be processed on the destination chain
     * @param _payees Array of addresses to receive tokens
     * @param _amounts Array of token amounts to distribute
     * @param _destinationDomain The domain ID of the destination chain
     * @return paymentId The ID of the created payment request
     */
    function requestPayment(
        address[] calldata _payees,
        uint256[] calldata _amounts,
        uint32 _destinationDomain
    ) external payable returns (uint256 paymentId) {
        require(_payees.length == _amounts.length, "Arrays length mismatch");
        require(_payees.length > 0, "No payees specified");
        require(remoteReceivers[_destinationDomain] != bytes32(0), "Remote receiver not configured");
        
        paymentId = nextPaymentId++;
        
        PaymentRequest storage request = paymentRequests[paymentId];
        request.payees = _payees;
        request.amounts = _amounts;
        request.processed = false;
        
        emit PaymentRequested(paymentId, msg.sender);
        
        // Send the payment request to the destination chain
        _sendPaymentRequest(paymentId, _destinationDomain);
        
        return paymentId;
    }
    
    /**
     * @dev Send the payment request to the destination chain via Hyperlane
     * @param _paymentId The ID of the payment request
     * @param _destinationDomain The domain ID of the destination chain
     */
    function _sendPaymentRequest(
        uint256 _paymentId,
        uint32 _destinationDomain
    ) internal {
        bytes32 receiver = remoteReceivers[_destinationDomain];
        
        // Encode the payment request data
        bytes memory message = abi.encode(
            _paymentId,
            paymentRequests[_paymentId].payees,
            paymentRequests[_paymentId].amounts
        );
        
        // Send the message via Hyperlane
        bytes32 messageId = mailbox.dispatch(
            _destinationDomain,
            receiver,
            message
        );
        
        // Pay for the gas on the destination chain
        
        
        emit MessageSent(_paymentId, _destinationDomain, messageId);
    }
    
    /**
     * @dev Handle the incoming message from the source chain
     * @param _origin The domain ID of the origin chain
     * @param _sender The address of the sender contract on the origin chain
     * @param _message The encoded message
     */
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external {
        // Verify the sender is an expected contract
        require(_sender == remoteReceivers[_origin], "Unauthorized sender");
        require(msg.sender == address(mailbox), "Only mailbox can call handle");
        
        // Decode the message
        (uint256 paymentId, address[] memory payees, uint256[] memory amounts) = 
            abi.decode(_message, (uint256, address[], uint256[]));
        
        emit MessageReceived(_origin, _sender, paymentId);
        
        // Process the payment
        _processPayment(paymentId, payees, amounts);
    }
    
    /**
     * @dev Process a payment by minting tokens to payees
     * @param _paymentId The ID of the payment to process
     * @param _payees Array of addresses to receive tokens
     * @param _amounts Array of token amounts to distribute
     */
    function _processPayment(
        uint256 _paymentId,
        address[] memory _payees,
        uint256[] memory _amounts
    ) internal {
        for (uint256 i = 0; i < _payees.length; i++) {
            _mint(_payees[i], _amounts[i]);
        }
        
        emit PaymentProcessed(_paymentId);
    }
    
    /**
     * @dev Direct function to mint tokens (restricted to owner)
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}