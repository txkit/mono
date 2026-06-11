// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.34;

/**
 * @title MockSettlementToken
 * @notice Minimal ERC-20 acting as the x402 settlement leg of the Buildathon
 *         demo (scenario C). The entire supply is pre-minted to the
 *         MockRwaRouter that creates it in its constructor, and the router
 *         moves one unit to the x402 merchant treasury per executed buy - so
 *         every RWA buy carries a real on-chain ERC-20 Transfer receipt next
 *         to RwaPurchased. Amounts are mock-scale.
 *
 * @dev Intentionally bare: fixed supply at construction, no mint/burn/permit.
 */
contract MockSettlementToken {
    string public constant name = "Mock x402 Settlement USD";
    string public constant symbol = "mxUSD";
    uint8 public constant decimals = 6;

    uint256 public immutable totalSupply;

    mapping(address holder => uint256 balance) public balanceOf;
    mapping(address holder => mapping(address spender => uint256 amount)) public allowance;

    error InsufficientBalance();
    error InsufficientAllowance();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address premintTo, uint256 supply) {
        totalSupply = supply;
        balanceOf[premintTo] = supply;
        emit Transfer(address(0), premintTo, supply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        return _transfer(msg.sender, to, value);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < value) {
            revert InsufficientAllowance();
        }
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        return _transfer(from, to, value);
    }

    function _transfer(address from, address to, uint256 value) private returns (bool) {
        uint256 fromBalance = balanceOf[from];
        if (fromBalance < value) {
            revert InsufficientBalance();
        }
        unchecked {
            balanceOf[from] = fromBalance - value;
        }
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
