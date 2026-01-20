use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
#[allow(starknet::store_no_default_variant)]
pub enum EscrowStatus {
    Empty,
    Funded,
    Completed,
    Refunded,
    Disputed,
    Resolved,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct EscrowData {
    pub id: u64,
    pub buyer: ContractAddress,
    pub seller: ContractAddress,
    pub arbiter: ContractAddress,
    pub amount: u256,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub description: felt252,
}

#[starknet::interface]
pub trait IEscrow<TContractState> {
    fn create_escrow(
        ref self: TContractState,
        seller: ContractAddress,
        arbiter: ContractAddress,
        amount: u256,
        description: felt252,
    ) -> u64;
    fn release(ref self: TContractState, escrow_id: u64);
    fn refund(ref self: TContractState, escrow_id: u64);
    fn dispute(ref self: TContractState, escrow_id: u64);
    fn resolve(ref self: TContractState, escrow_id: u64, release_to_seller: bool);
    fn get_escrow(self: @TContractState, escrow_id: u64) -> Array<felt252>;
    fn get_escrow_count(self: @TContractState) -> u64;
    fn get_buyer_escrows(self: @TContractState, buyer: ContractAddress) -> Array<u64>;
    fn get_seller_escrows(self: @TContractState, seller: ContractAddress) -> Array<u64>;
    fn get_arbiter_escrows(self: @TContractState, arbiter: ContractAddress) -> Array<u64>;
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn get_fee_bps(self: @TContractState) -> u16;
    fn set_fee_bps(ref self: TContractState, fee_bps: u16);
    fn withdraw_fees(ref self: TContractState);
}
