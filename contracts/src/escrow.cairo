#[starknet::contract]
mod escrow {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use super::super::errors::Errors;
    use super::super::interface::{EscrowData, EscrowStatus, IEscrow};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        token_address: ContractAddress,
        fee_bps: u16,
        accumulated_fees: u256,
        escrow_count: u64,
        escrows: Map<u64, EscrowData>,
        buyer_escrows: Map<(ContractAddress, u64), u64>,
        buyer_escrows_len: Map<ContractAddress, u64>,
        seller_escrows: Map<(ContractAddress, u64), u64>,
        seller_escrows_len: Map<ContractAddress, u64>,
        arbiter_escrows: Map<(ContractAddress, u64), u64>,
        arbiter_escrows_len: Map<ContractAddress, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        EscrowCreated: EscrowCreated,
        EscrowReleased: EscrowReleased,
        EscrowRefunded: EscrowRefunded,
        EscrowDisputed: EscrowDisputed,
        EscrowResolved: EscrowResolved,
        FeesWithdrawn: FeesWithdrawn,
    }

    #[derive(Drop, starknet::Event)]
    struct EscrowCreated {
        #[key]
        escrow_id: u64,
        #[key]
        buyer: ContractAddress,
        #[key]
        seller: ContractAddress,
        arbiter: ContractAddress,
        amount: u256,
        description: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct EscrowReleased {
        #[key]
        escrow_id: u64,
        #[key]
        seller: ContractAddress,
        amount: u256,
        fee: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct EscrowRefunded {
        #[key]
        escrow_id: u64,
        #[key]
        buyer: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct EscrowDisputed {
        #[key]
        escrow_id: u64,
        #[key]
        disputer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct EscrowResolved {
        #[key]
        escrow_id: u64,
        #[key]
        arbiter: ContractAddress,
        released_to_seller: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct FeesWithdrawn {
        #[key]
        owner: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        token_address: ContractAddress,
        fee_bps: u16,
    ) {
        assert(!owner.is_zero(), Errors::ZERO_ADDRESS);
        assert(!token_address.is_zero(), Errors::ZERO_ADDRESS);
        assert(fee_bps <= 1000, Errors::FEE_TOO_HIGH);

        self.owner.write(owner);
        self.token_address.write(token_address);
        self.fee_bps.write(fee_bps);
        self.escrow_count.write(0);
        self.accumulated_fees.write(0);
    }

    #[abi(embed_v0)]
    impl EscrowImpl of IEscrow<ContractState> {
        fn create_escrow(
            ref self: ContractState,
            seller: ContractAddress,
            arbiter: ContractAddress,
            amount: u256,
            description: felt252,
        ) -> u64 {
            let buyer = get_caller_address();

            assert(!seller.is_zero(), Errors::ZERO_ADDRESS);
            assert(!arbiter.is_zero(), Errors::ZERO_ADDRESS);
            assert(buyer != seller, Errors::SAME_BUYER_SELLER);
            assert(amount > 0, Errors::ZERO_AMOUNT);

            // Transfer tokens from buyer to contract
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let contract_address = get_contract_address();
            token.transfer_from(buyer, contract_address, amount);

            let id = self.escrow_count.read() + 1;
            self.escrow_count.write(id);

            let escrow = EscrowData {
                id,
                buyer,
                seller,
                arbiter,
                amount,
                status: EscrowStatus::Funded,
                created_at: get_block_timestamp(),
                description,
            };

            self.escrows.write(id, escrow);

            // Add to buyer_escrows
            let b_len = self.buyer_escrows_len.read(buyer);
            self.buyer_escrows.write((buyer, b_len), id);
            self.buyer_escrows_len.write(buyer, b_len + 1);

            // Add to seller_escrows
            let s_len = self.seller_escrows_len.read(seller);
            self.seller_escrows.write((seller, s_len), id);
            self.seller_escrows_len.write(seller, s_len + 1);

            // Add to arbiter_escrows
            let a_len = self.arbiter_escrows_len.read(arbiter);
            self.arbiter_escrows.write((arbiter, a_len), id);
            self.arbiter_escrows_len.write(arbiter, a_len + 1);

            self.emit(EscrowCreated { escrow_id: id, buyer, seller, arbiter, amount, description });

            id
        }

        fn release(ref self: ContractState, escrow_id: u64) {
            let mut escrow = self.escrows.read(escrow_id);
            assert(escrow.id != 0, Errors::ESCROW_NOT_FOUND);

            let caller = get_caller_address();
            assert(caller == escrow.buyer, Errors::NOT_BUYER);
            assert(escrow.status == EscrowStatus::Funded, Errors::NOT_FUNDED);

            let fee = (escrow.amount * self.fee_bps.read().into()) / 10000;
            let amount_to_seller = escrow.amount - fee;
            self.accumulated_fees.write(self.accumulated_fees.read() + fee);

            escrow.status = EscrowStatus::Completed;
            self.escrows.write(escrow_id, escrow);

            // Transfer tokens to seller
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            token.transfer(escrow.seller, amount_to_seller);

            self
                .emit(
                    EscrowReleased { escrow_id, seller: escrow.seller, amount: escrow.amount, fee },
                );
        }

        fn refund(ref self: ContractState, escrow_id: u64) {
            let mut escrow = self.escrows.read(escrow_id);
            assert(escrow.id != 0, Errors::ESCROW_NOT_FOUND);

            let caller = get_caller_address();
            assert(caller == escrow.seller, Errors::NOT_SELLER);
            assert(escrow.status == EscrowStatus::Funded, Errors::NOT_FUNDED);

            escrow.status = EscrowStatus::Refunded;
            self.escrows.write(escrow_id, escrow);

            // Transfer tokens back to buyer
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            token.transfer(escrow.buyer, escrow.amount);

            self.emit(EscrowRefunded { escrow_id, buyer: escrow.buyer, amount: escrow.amount });
        }

        fn dispute(ref self: ContractState, escrow_id: u64) {
            let mut escrow = self.escrows.read(escrow_id);
            assert(escrow.id != 0, Errors::ESCROW_NOT_FOUND);

            let caller = get_caller_address();
            assert(caller == escrow.buyer || caller == escrow.seller, Errors::NOT_PARTY);
            assert(escrow.status == EscrowStatus::Funded, Errors::NOT_FUNDED);

            escrow.status = EscrowStatus::Disputed;
            self.escrows.write(escrow_id, escrow);

            self.emit(EscrowDisputed { escrow_id, disputer: caller });
        }

        fn resolve(ref self: ContractState, escrow_id: u64, release_to_seller: bool) {
            let mut escrow = self.escrows.read(escrow_id);
            assert(escrow.id != 0, Errors::ESCROW_NOT_FOUND);

            let caller = get_caller_address();
            assert(caller == escrow.arbiter, Errors::NOT_ARBITER);
            assert(escrow.status == EscrowStatus::Disputed, Errors::NOT_DISPUTED);

            escrow.status = EscrowStatus::Resolved;
            self.escrows.write(escrow_id, escrow);

            let token = IERC20Dispatcher { contract_address: self.token_address.read() };

            if release_to_seller {
                let fee = (escrow.amount * self.fee_bps.read().into()) / 10000;
                let amount_to_seller = escrow.amount - fee;
                self.accumulated_fees.write(self.accumulated_fees.read() + fee);

                // Transfer tokens to seller
                token.transfer(escrow.seller, amount_to_seller);

                self
                    .emit(
                        EscrowReleased {
                            escrow_id, seller: escrow.seller, amount: escrow.amount, fee,
                        },
                    );
            } else {
                // Transfer tokens back to buyer
                token.transfer(escrow.buyer, escrow.amount);

                self.emit(EscrowRefunded { escrow_id, buyer: escrow.buyer, amount: escrow.amount });
            }

            self
                .emit(
                    EscrowResolved {
                        escrow_id, arbiter: caller, released_to_seller: release_to_seller,
                    },
                );
        }

        fn get_escrow(self: @ContractState, escrow_id: u64) -> Array<felt252> {
            let escrow = self.escrows.read(escrow_id);
            let mut result = ArrayTrait::new();

            if escrow.id == 0 {
                // Return array with exists = 1 (None)
                result.append(1);
                return result;
            }

            // Return array with exists = 0 (Some) followed by all fields
            result.append(0); // exists (0 = Some, 1 = None)
            result.append(escrow.id.into()); // id
            result.append(escrow.buyer.into()); // buyer
            result.append(escrow.seller.into()); // seller
            result.append(escrow.arbiter.into()); // arbiter

            // Split u256 amount into low and high
            let amount_low: felt252 = (escrow.amount & 0xffffffffffffffffffffffffffffffff)
                .try_into()
                .unwrap();
            let amount_high: felt252 = (escrow.amount / 0x100000000000000000000000000000000)
                .try_into()
                .unwrap();
            result.append(amount_low); // amount.low
            result.append(amount_high); // amount.high

            // Convert status enum to felt252
            let status_felt: felt252 = match escrow.status {
                EscrowStatus::Empty => 0,
                EscrowStatus::Funded => 1,
                EscrowStatus::Completed => 2,
                EscrowStatus::Refunded => 3,
                EscrowStatus::Disputed => 4,
                EscrowStatus::Resolved => 5,
            };
            result.append(status_felt); // status
            result.append(escrow.created_at.into()); // created_at
            result.append(escrow.description); // description

            result
        }

        fn get_escrow_count(self: @ContractState) -> u64 {
            self.escrow_count.read()
        }

        fn get_buyer_escrows(self: @ContractState, buyer: ContractAddress) -> Array<u64> {
            let mut result = ArrayTrait::new();
            let len = self.buyer_escrows_len.read(buyer);
            let mut i = 0;
            loop {
                if i >= len {
                    break;
                }
                result.append(self.buyer_escrows.read((buyer, i)));
                i += 1;
            }
            result
        }

        fn get_seller_escrows(self: @ContractState, seller: ContractAddress) -> Array<u64> {
            let mut result = ArrayTrait::new();
            let len = self.seller_escrows_len.read(seller);
            let mut i = 0;
            loop {
                if i >= len {
                    break;
                }
                result.append(self.seller_escrows.read((seller, i)));
                i += 1;
            }
            result
        }

        fn get_arbiter_escrows(self: @ContractState, arbiter: ContractAddress) -> Array<u64> {
            let mut result = ArrayTrait::new();
            let len = self.arbiter_escrows_len.read(arbiter);
            let mut i = 0;
            loop {
                if i >= len {
                    break;
                }
                result.append(self.arbiter_escrows.read((arbiter, i)));
                i += 1;
            }
            result
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn get_fee_bps(self: @ContractState) -> u16 {
            self.fee_bps.read()
        }

        fn set_fee_bps(ref self: ContractState, fee_bps: u16) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_OWNER);
            assert(fee_bps <= 1000, Errors::FEE_TOO_HIGH);
            self.fee_bps.write(fee_bps);
        }

        fn withdraw_fees(ref self: ContractState) {
            let owner = self.owner.read();
            assert(get_caller_address() == owner, Errors::NOT_OWNER);

            let amount = self.accumulated_fees.read();
            assert(amount > 0, Errors::ZERO_AMOUNT);

            self.accumulated_fees.write(0);

            // Transfer accumulated fees to owner
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            token.transfer(owner, amount);

            self.emit(FeesWithdrawn { owner, amount });
        }
    }
}
