// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract TokenSwapper {
    ISwapRouter public immutable swapRouter;

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient
    );

    error InsufficientOutput();
    error DeadlineExpired();

    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
    }

    /**
     * @notice Swap exact amount of input tokens for output tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param fee Pool fee tier (500, 3000, or 10000)
     * @param amountIn Exact amount of input tokens
     * @param amountOutMinimum Minimum amount of output tokens expected
     * @param deadline Transaction deadline
     * @return amountOut Amount of output tokens received
     */
    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Check deadline
        if (block.timestamp > deadline) revert DeadlineExpired();

        // Transfer tokens from sender to this contract
        TransferHelper.safeTransferFrom(
            tokenIn,
            msg.sender,
            address(this),
            amountIn
        );

        // Approve the router to spend tokens
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        // Prepare swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        // Execute the swap
        amountOut = swapRouter.exactInputSingle(params);

        // Verify minimum output
        if (amountOut < amountOutMinimum) revert InsufficientOutput();

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, msg.sender);

        return amountOut;
    }

    /**
     * @notice Swap tokens for exact amount of output tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param fee Pool fee tier
     * @param amountOut Exact amount of output tokens desired
     * @param amountInMaximum Maximum amount of input tokens willing to spend
     * @param deadline Transaction deadline
     * @return amountIn Amount of input tokens actually spent
     */
    function swapExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint256 amountInMaximum,
        uint256 deadline
    ) external returns (uint256 amountIn) {
        if (block.timestamp > deadline) revert DeadlineExpired();

        // Transfer max amount from sender
        TransferHelper.safeTransferFrom(
            tokenIn,
            msg.sender,
            address(this),
            amountInMaximum
        );

        // Approve router
        TransferHelper.safeApprove(
            tokenIn,
            address(swapRouter),
            amountInMaximum
        );

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                deadline: deadline,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        // Execute swap
        amountIn = swapRouter.exactOutputSingle(params);

        // Refund unspent tokens
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(tokenIn, address(swapRouter), 0);
            TransferHelper.safeTransfer(
                tokenIn,
                msg.sender,
                amountInMaximum - amountIn
            );
        }

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, msg.sender);

        return amountIn;
    }

    /**
     * @notice Emergency function to recover stuck tokens
     */
    function recoverTokens(
        address token,
        uint256 amount
    ) external {
        TransferHelper.safeTransfer(token, owner(), amount);
    }
}