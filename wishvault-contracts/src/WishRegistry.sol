// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WishRegistry is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Wish {
        address creator;
        address recipient;
        string title;
        string description;
        string imageURI;
        uint256 goal;
        uint256 totalRaised;
        uint256 balance;
        bool closed;
    }

    IERC20 public immutable usdc;

    Wish[] private wishes;

    event WishCreated(
        uint256 indexed wishId,
        address indexed creator,
        address indexed recipient,
        string title,
        string description,
        string imageURI,
        uint256 goal
    );
    event Donated(uint256 indexed wishId, address indexed donor, uint256 amount, uint256 totalRaised);
    event Withdrawn(uint256 indexed wishId, address indexed recipient, uint256 amount, uint256 remainingBalance);
    event WishClosed(uint256 indexed wishId);

    error ZeroAddress();
    error ZeroAmount();
    error WishNotFound();
    error WishClosedErr();
    error NotRecipient();
    error NotCreator();
    error InsufficientBalance();

    constructor(IERC20 usdc_) {
        if (address(usdc_) == address(0)) revert ZeroAddress();
        usdc = usdc_;
    }

    function createWish(
        string calldata title,
        string calldata description,
        string calldata imageURI,
        uint256 goal,
        address recipient
    ) external returns (uint256 wishId) {
        address resolvedRecipient = recipient == address(0) ? msg.sender : recipient;

        wishId = wishes.length;
        wishes.push(
            Wish({
                creator: msg.sender,
                recipient: resolvedRecipient,
                title: title,
                description: description,
                imageURI: imageURI,
                goal: goal,
                totalRaised: 0,
                balance: 0,
                closed: false
            })
        );

        emit WishCreated(wishId, msg.sender, resolvedRecipient, title, description, imageURI, goal);
    }

    function donate(uint256 wishId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Wish storage wish = _wish(wishId);
        if (wish.closed) revert WishClosedErr();

        wish.totalRaised += amount;
        wish.balance += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit Donated(wishId, msg.sender, amount, wish.totalRaised);
    }

    function withdraw(uint256 wishId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Wish storage wish = _wish(wishId);
        if (msg.sender != wish.recipient) revert NotRecipient();
        if (amount > wish.balance) revert InsufficientBalance();

        wish.balance -= amount;
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(wishId, msg.sender, amount, wish.balance);
    }

    function closeWish(uint256 wishId) external {
        Wish storage wish = _wish(wishId);
        if (msg.sender != wish.creator) revert NotCreator();

        wish.closed = true;

        emit WishClosed(wishId);
    }

    function getWish(uint256 wishId) external view returns (Wish memory) {
        return _wish(wishId);
    }

    function wishCount() external view returns (uint256) {
        return wishes.length;
    }

    function _wish(uint256 wishId) private view returns (Wish storage wish) {
        if (wishId >= wishes.length) revert WishNotFound();
        return wishes[wishId];
    }
}
