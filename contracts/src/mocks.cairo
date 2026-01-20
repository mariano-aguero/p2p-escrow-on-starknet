use starknet::ContractAddress;

#[starknet::interface]
pub trait IPublicMint<TContractState> {
    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
}

#[starknet::contract]
pub mod ERC20Mock {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use openzeppelin::token::erc20::interface::{IERC20};
    use super::IPublicMint;

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        total_supply: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.total_supply.write(0);
    }

    #[abi(embed_v0)]
    impl ERC20MockImpl of IERC20<ContractState> {
        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');

            self.balances.write(sender, sender_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.write(recipient, recipient_balance + amount);

            true
        }

        fn transfer_from(ref self: ContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            let current_allowance = self.allowances.read((sender, caller));
            assert(current_allowance >= amount, 'Insufficient allowance');

            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');

            self.allowances.write((sender, caller), current_allowance - amount);
            self.balances.write(sender, sender_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.write(recipient, recipient_balance + amount);

            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            self.allowances.write((caller, spender), amount);
            true
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            let balance = self.balances.read(recipient);
            self.balances.write(recipient, balance + amount);
            let supply = self.total_supply.read();
            self.total_supply.write(supply + amount);
        }
    }

    #[abi(embed_v0)]
    impl PublicMintImpl of IPublicMint<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            InternalImpl::mint(ref self, recipient, amount);
        }
    }
}
