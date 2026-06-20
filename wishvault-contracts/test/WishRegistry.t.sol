// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {WishRegistry} from "../src/WishRegistry.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract WishRegistryTest is Test {
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

    MockUSDC internal usdc;
    WishRegistry internal registry;

    address internal creator = address(0xA11CE);
    address internal recipient = address(0xB0B);
    address internal donor = address(0xCAFE);
    address internal stranger = address(0xD00D);

    function setUp() public {
        usdc = new MockUSDC();
        registry = new WishRegistry(IERC20(address(usdc)));

        usdc.mint(donor, 1_000e6);
        vm.prank(donor);
        usdc.approve(address(registry), type(uint256).max);
    }

    function testCreateWishStoresAllFieldsAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit WishCreated(0, creator, recipient, "New bike", "A city bike", "ipfs://none", 250e6);

        vm.prank(creator);
        uint256 wishId = registry.createWish("New bike", "A city bike", "ipfs://none", 250e6, recipient);

        WishRegistry.Wish memory wish = registry.getWish(wishId);
        assertEq(wish.creator, creator);
        assertEq(wish.recipient, recipient);
        assertEq(wish.title, "New bike");
        assertEq(wish.description, "A city bike");
        assertEq(wish.imageURI, "ipfs://none");
        assertEq(wish.goal, 250e6);
        assertEq(wish.totalRaised, 0);
        assertEq(wish.balance, 0);
        assertEq(wish.closed, false);
        assertEq(registry.wishCount(), 1);
    }

    function testCreateWishZeroRecipientDefaultsToCreator() public {
        vm.prank(creator);
        uint256 wishId = registry.createWish("Open wish", "Anything helps", "", 0, address(0));

        WishRegistry.Wish memory wish = registry.getWish(wishId);
        assertEq(wish.recipient, creator);
        assertEq(wish.goal, 0);
    }

    function testDonateIncreasesRaisedAndBalanceAndPullsUsdc() public {
        uint256 wishId = _createWish();

        vm.expectEmit(true, true, true, true);
        emit Donated(wishId, donor, 75e6, 75e6);

        vm.prank(donor);
        registry.donate(wishId, 75e6);

        WishRegistry.Wish memory wish = registry.getWish(wishId);
        assertEq(wish.totalRaised, 75e6);
        assertEq(wish.balance, 75e6);
        assertEq(usdc.balanceOf(donor), 925e6);
        assertEq(usdc.balanceOf(address(registry)), 75e6);
    }

    function testDonateRevertsOnClosedWish() public {
        uint256 wishId = _createWish();

        vm.prank(creator);
        registry.closeWish(wishId);

        vm.prank(donor);
        vm.expectRevert(WishRegistry.WishClosedErr.selector);
        registry.donate(wishId, 1e6);
    }

    function testDonateRevertsOnMissingWish() public {
        vm.prank(donor);
        vm.expectRevert(WishRegistry.WishNotFound.selector);
        registry.donate(99, 1e6);
    }

    function testWithdrawRevertsForNonRecipient() public {
        uint256 wishId = _createFundedWish(100e6);

        vm.prank(stranger);
        vm.expectRevert(WishRegistry.NotRecipient.selector);
        registry.withdraw(wishId, 10e6);
    }

    function testWithdrawRevertsIfAmountExceedsBalance() public {
        uint256 wishId = _createFundedWish(100e6);

        vm.prank(recipient);
        vm.expectRevert(WishRegistry.InsufficientBalance.selector);
        registry.withdraw(wishId, 101e6);
    }

    function testPartialWithdrawLeavesCorrectBalanceAndLaterWithdrawWorks() public {
        uint256 wishId = _createFundedWish(100e6);

        vm.expectEmit(true, true, true, true);
        emit Withdrawn(wishId, recipient, 40e6, 60e6);

        vm.prank(recipient);
        registry.withdraw(wishId, 40e6);

        WishRegistry.Wish memory afterFirst = registry.getWish(wishId);
        assertEq(afterFirst.totalRaised, 100e6);
        assertEq(afterFirst.balance, 60e6);
        assertEq(usdc.balanceOf(recipient), 40e6);

        vm.prank(recipient);
        registry.withdraw(wishId, 60e6);

        WishRegistry.Wish memory afterSecond = registry.getWish(wishId);
        assertEq(afterSecond.balance, 0);
        assertEq(usdc.balanceOf(recipient), 100e6);
    }

    function testCloseWishRevertsForNonCreator() public {
        uint256 wishId = _createWish();

        vm.prank(stranger);
        vm.expectRevert(WishRegistry.NotCreator.selector);
        registry.closeWish(wishId);
    }

    function testCloseWishEmitsAndStillAllowsWithdraw() public {
        uint256 wishId = _createFundedWish(50e6);

        vm.expectEmit(true, true, true, true);
        emit WishClosed(wishId);

        vm.prank(creator);
        registry.closeWish(wishId);

        vm.prank(recipient);
        registry.withdraw(wishId, 50e6);

        WishRegistry.Wish memory wish = registry.getWish(wishId);
        assertEq(wish.closed, true);
        assertEq(wish.balance, 0);
    }

    function testTwoWishBalancesNeverInterfere() public {
        uint256 first = _createWish();
        uint256 second;
        vm.prank(creator);
        second = registry.createWish("Laptop", "Work machine", "", 800e6, recipient);

        vm.startPrank(donor);
        registry.donate(first, 10e6);
        registry.donate(second, 90e6);
        vm.stopPrank();

        assertEq(registry.getWish(first).balance, 10e6);
        assertEq(registry.getWish(second).balance, 90e6);

        vm.prank(recipient);
        registry.withdraw(first, 10e6);

        assertEq(registry.getWish(first).balance, 0);
        assertEq(registry.getWish(second).balance, 90e6);
    }

    function testZeroAmountDonateAndWithdrawRevert() public {
        uint256 wishId = _createWish();

        vm.prank(donor);
        vm.expectRevert(WishRegistry.ZeroAmount.selector);
        registry.donate(wishId, 0);

        vm.prank(recipient);
        vm.expectRevert(WishRegistry.ZeroAmount.selector);
        registry.withdraw(wishId, 0);
    }

    function _createWish() internal returns (uint256 wishId) {
        vm.prank(creator);
        wishId = registry.createWish("New bike", "A city bike", "ipfs://none", 250e6, recipient);
    }

    function _createFundedWish(uint256 amount) internal returns (uint256 wishId) {
        wishId = _createWish();
        vm.prank(donor);
        registry.donate(wishId, amount);
    }
}
