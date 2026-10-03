// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title QDOTToken
 * @notice Standard ERC-20 with role-based minting (flexible/uncapped supply support), burn, and pause.
 * Designed for deployment on Polkadot Hub / Asset Hub via pallet-revive / PolkaVM.
 */
contract QDOTToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;

    address public owner;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isMinter;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterStatusChanged(address indexed account, bool isMinter);
    event PausedStateChanged(bool isPaused);

    modifier onlyOwner() {
        require(msg.sender == owner, "QDOT: caller is not the owner");
        _;
    }

    modifier onlyMinter() {
        require(isMinter[msg.sender] || msg.sender == owner, "QDOT: caller is not authorized minter");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "QDOT: token transfers are paused");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        address _initialOwner
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = _initialOwner;
        isMinter[_initialOwner] = true;

        if (_initialSupply > 0) {
            _mint(_initialOwner, _initialSupply);
        }
    }

    function setMinter(address account, bool status) external onlyOwner {
        isMinter[account] = status;
        emit MinterStatusChanged(account, status);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "QDOT: insufficient allowance");
        if (currentAllowance != type(uint256).max) {
            allowance[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Allows designated minters (Launchpad, Agent Rewards, Treasury) to mint new tokens.
     * Provides programmatic dynamic/flexible supply without an arbitrary hard cap.
     */
    function mint(address to, uint256 amount) external onlyMinter returns (bool) {
        _mint(to, amount);
        return true;
    }

    function burn(uint256 amount) external whenNotPaused returns (bool) {
        require(balanceOf[msg.sender] >= amount, "QDOT: burn amount exceeds balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "QDOT: transfer from zero address");
        require(to != address(0), "QDOT: transfer to zero address");
        require(balanceOf[from] >= amount, "QDOT: transfer amount exceeds balance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "QDOT: mint to zero address");
        totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}
