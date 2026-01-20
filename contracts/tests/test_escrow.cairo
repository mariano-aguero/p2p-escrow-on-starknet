use starknet::{ContractAddress};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
use starkescrow::interface::{IEscrowDispatcher, IEscrowDispatcherTrait, EscrowStatus, EscrowData};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starkescrow::mocks::{IPublicMintDispatcher, IPublicMintDispatcherTrait};

// Constants for test addresses
fn OWNER() -> ContractAddress {
    'OWNER'.try_into().unwrap()
}

fn BUYER() -> ContractAddress {
    'BUYER'.try_into().unwrap()
}

fn SELLER() -> ContractAddress {
    'SELLER'.try_into().unwrap()
}

fn ARBITER() -> ContractAddress {
    'ARBITER'.try_into().unwrap()
}

fn OTHER() -> ContractAddress {
    'OTHER'.try_into().unwrap()
}

// Helper to parse Array<felt252> from get_escrow into Option<EscrowData>
fn parse_escrow_array(arr: Array<felt252>) -> Option<EscrowData> {
    if arr.len() == 0 {
        return Option::None;
    }

    let exists = *arr.at(0);
    if exists == 1 {
        // None case
        return Option::None;
    }

    if arr.len() < 10 {
        return Option::None;
    }

    // Parse all fields from the array
    let id: u64 = (*arr.at(1)).try_into().unwrap();
    let buyer: ContractAddress = (*arr.at(2)).try_into().unwrap();
    let seller: ContractAddress = (*arr.at(3)).try_into().unwrap();
    let arbiter: ContractAddress = (*arr.at(4)).try_into().unwrap();

    // Reconstruct u256 from low and high
    let amount_low: u128 = (*arr.at(5)).try_into().unwrap();
    let amount_high: u128 = (*arr.at(6)).try_into().unwrap();
    let amount: u256 = u256 { low: amount_low, high: amount_high };

    // Parse status
    let status_felt = *arr.at(7);
    let status = if status_felt == 0 {
        EscrowStatus::Empty
    } else if status_felt == 1 {
        EscrowStatus::Funded
    } else if status_felt == 2 {
        EscrowStatus::Completed
    } else if status_felt == 3 {
        EscrowStatus::Refunded
    } else if status_felt == 4 {
        EscrowStatus::Disputed
    } else {
        EscrowStatus::Resolved
    };

    let created_at: u64 = (*arr.at(8)).try_into().unwrap();
    let description = *arr.at(9);

    Option::Some(
        EscrowData {
            id,
            buyer,
            seller,
            arbiter,
            amount,
            status,
            created_at,
            description,
        }
    )
}

// Helper to deploy mock ERC20 token
fn deploy_erc20() -> IERC20Dispatcher {
    let contract = declare("ERC20Mock").unwrap().contract_class();
    let constructor_calldata = ArrayTrait::new();
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    IERC20Dispatcher { contract_address }
}

// Helper to deploy the escrow contract
fn deploy_escrow(owner: ContractAddress, token_address: ContractAddress, fee_bps: u16) -> IEscrowDispatcher {
    let contract = declare("escrow").unwrap().contract_class();
    let mut constructor_calldata = ArrayTrait::new();
    constructor_calldata.append(owner.into());
    constructor_calldata.append(token_address.into());
    constructor_calldata.append(fee_bps.into());
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    IEscrowDispatcher { contract_address }
}

// Helper to setup test environment with token and escrow
fn setup_test() -> (IERC20Dispatcher, IEscrowDispatcher) {
    let token = deploy_erc20();
    let escrow = deploy_escrow(OWNER(), token.contract_address, 500);
    (token, escrow)
}

// Helper to mint tokens to an address and approve escrow to spend them
fn mint_and_approve(token: IERC20Dispatcher, escrow: IEscrowDispatcher, recipient: ContractAddress, amount: u256) {
    // Mint tokens using the public mint interface
    let mint_dispatcher = IPublicMintDispatcher { contract_address: token.contract_address };
    mint_dispatcher.mint(recipient, amount);

    // Approve escrow to spend tokens
    start_cheat_caller_address(token.contract_address, recipient);
    token.approve(escrow.contract_address, amount);
    stop_cheat_caller_address(token.contract_address);
}

#[test]
fn test_constructor() {
    let owner = OWNER();
    let fee_bps = 500; // 5%
    let (_token, escrow) = setup_test();

    assert(escrow.get_owner() == owner, 'Wrong owner');
    assert(escrow.get_fee_bps() == fee_bps, 'Wrong fee_bps');
    assert(escrow.get_escrow_count() == 0, 'Wrong initial count');
}

#[test]
fn test_create_escrow() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    let arbiter = ARBITER();
    let amount = 1000_u256;
    let description = 'Test Escrow';

    mint_and_approve(token, escrow, buyer, amount);

    // When
    start_cheat_caller_address(escrow.contract_address, buyer);
    let escrow_id = escrow.create_escrow(seller, arbiter, amount, description);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    assert(escrow_id == 1, 'ID should be 1');
    assert(escrow.get_escrow_count() == 1, 'Count should be 1');

    let data = parse_escrow_array(escrow.get_escrow(escrow_id)).unwrap();
    assert(data.id == escrow_id, 'Wrong ID in data');
    assert(data.buyer == buyer, 'Wrong buyer');
    assert(data.seller == seller, 'Wrong seller');
    assert(data.arbiter == arbiter, 'Wrong arbiter');
    assert(data.amount == amount, 'Wrong amount');
    assert(data.status == EscrowStatus::Funded, 'Wrong status');
    assert(data.description == description, 'Wrong description');

    // Check arbiter escrows
    let arbiter_escrows = escrow.get_arbiter_escrows(arbiter);
    assert(arbiter_escrows.len() == 1, 'Wrong arbiter escrows len');
    assert(*arbiter_escrows.at(0) == escrow_id, 'Wrong arbiter escrow ID');
}

#[test]
fn test_create_multiple_escrows() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();

    mint_and_approve(token, escrow, buyer, 3000);

    // When
    start_cheat_caller_address(escrow.contract_address, buyer);
    let id1 = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Escrow 1');
    let id2 = escrow.create_escrow(SELLER(), ARBITER(), 2000, 'Escrow 2');
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    assert(id1 == 1, 'Wrong ID 1');
    assert(id2 == 2, 'Wrong ID 2');
    assert(escrow.get_escrow_count() == 2, 'Wrong count');
}

#[test]
#[should_panic(expected: ('Zero address',))]
fn test_create_escrow_zero_seller() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);

    // When (Then should panic)
    escrow.create_escrow(0.try_into().unwrap(), ARBITER(), 1000, 'Test');
}

#[test]
#[should_panic(expected: ('Zero address',))]
fn test_create_escrow_zero_arbiter() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);

    // When (Then should panic)
    escrow.create_escrow(SELLER(), 0.try_into().unwrap(), 1000, 'Test');
}

#[test]
#[should_panic(expected: ('Same buyer and seller',))]
fn test_create_escrow_same_buyer_seller() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);

    // When (Then should panic)
    escrow.create_escrow(buyer, ARBITER(), 1000, 'Test');
}

#[test]
fn test_release() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let amount = 1000_u256;

    mint_and_approve(token, escrow, buyer, amount);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), amount, 'Test');

    // When
    escrow.release(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Completed, 'Should be Completed');
}

#[test]
#[should_panic(expected: ('Not buyer',))]
fn test_release_not_buyer() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    // When (Then should panic)
    start_cheat_caller_address(escrow.contract_address, SELLER());
    escrow.release(id);
}

#[test]
#[should_panic(expected: ('Not funded',))]
fn test_release_already_released() {
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');
    escrow.release(id);
    escrow.release(id);
}

#[test]
fn test_refund() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(seller, ARBITER(), 1000, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, seller);
    escrow.refund(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Refunded, 'Should be Refunded');
}

#[test]
#[should_panic(expected: ('Not seller',))]
fn test_refund_not_seller() {
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');
    escrow.refund(id);
}

#[test]
fn test_dispute_by_buyer() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');

    // When
    escrow.dispute(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Disputed, 'Should be Disputed');
}

#[test]
fn test_dispute_by_seller() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(seller, ARBITER(), 1000, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, seller);
    escrow.dispute(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Disputed, 'Should be Disputed');
}

#[test]
#[should_panic(expected: ('Not party',))]
fn test_dispute_not_party() {
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    start_cheat_caller_address(escrow.contract_address, OTHER());
    escrow.dispute(id);
}

#[test]
fn test_resolve_to_seller() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let arbiter = ARBITER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), arbiter, 1000, 'Test');
    escrow.dispute(id);
    stop_cheat_caller_address(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, arbiter);
    escrow.resolve(id, true);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Resolved, 'Should be Resolved');
}

#[test]
fn test_resolve_to_buyer() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let arbiter = ARBITER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), arbiter, 1000, 'Test');
    escrow.dispute(id);
    stop_cheat_caller_address(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, arbiter);
    escrow.resolve(id, false);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();
    assert(data.status == EscrowStatus::Resolved, 'Should be Resolved');
}

#[test]
#[should_panic(expected: ('Not arbiter',))]
fn test_resolve_not_arbiter() {
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), ARBITER(), 1000, 'Test');
    escrow.dispute(id);
    stop_cheat_caller_address(escrow.contract_address);

    start_cheat_caller_address(escrow.contract_address, OTHER());
    escrow.resolve(id, true);
}

#[test]
#[should_panic(expected: ('Not disputed',))]
fn test_resolve_not_disputed() {
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let arbiter = ARBITER();
    mint_and_approve(token, escrow, buyer, 1000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(SELLER(), arbiter, 1000, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    start_cheat_caller_address(escrow.contract_address, arbiter);
    escrow.resolve(id, true);
}

#[test]
fn test_get_escrow() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    let arbiter = ARBITER();
    let amount = 1000_u256;
    let description = 'Test Escrow';

    mint_and_approve(token, escrow, buyer, amount);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(seller, arbiter, amount, description);
    stop_cheat_caller_address(escrow.contract_address);

    // When
    let data = parse_escrow_array(escrow.get_escrow(id)).unwrap();

    // Then
    assert(data.id == id, 'Wrong id');
    assert(data.buyer == buyer, 'Wrong buyer');
    assert(data.seller == seller, 'Wrong seller');
    assert(data.arbiter == arbiter, 'Wrong arbiter');
    assert(data.amount == amount, 'Wrong amount');
    assert(data.status == EscrowStatus::Funded, 'Wrong status');
    assert(data.description == description, 'Wrong description');
}

#[test]
fn test_query_escrows() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();

    mint_and_approve(token, escrow, buyer, 3000);

    start_cheat_caller_address(escrow.contract_address, buyer);
    escrow.create_escrow(seller, ARBITER(), 1000, 'E1');
    escrow.create_escrow(seller, ARBITER(), 2000, 'E2');
    stop_cheat_caller_address(escrow.contract_address);

    // When
    let buyer_escrows = escrow.get_buyer_escrows(buyer);
    let seller_escrows = escrow.get_seller_escrows(seller);

    // Then
    assert(buyer_escrows.len() == 2, 'Wrong buyer escrow len');
    assert(*buyer_escrows.at(0) == 1, 'Wrong buyer escrow 1');
    assert(*buyer_escrows.at(1) == 2, 'Wrong buyer escrow 2');

    assert(seller_escrows.len() == 2, 'Wrong seller escrow len');
    assert(*seller_escrows.at(0) == 1, 'Wrong seller escrow 1');
    assert(*seller_escrows.at(1) == 2, 'Wrong seller escrow 2');
}

#[test]
#[should_panic]
fn test_get_nonexistent_escrow() {
    let (_token, escrow) = setup_test();
    parse_escrow_array(escrow.get_escrow(999)).unwrap();
}

#[test]
fn test_set_fee() {
    // Given
    let owner = OWNER();
    let (_token, escrow) = setup_test();

    // When
    start_cheat_caller_address(escrow.contract_address, owner);
    escrow.set_fee_bps(800);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    assert(escrow.get_fee_bps() == 800, 'Fee not updated');
}

#[test]
#[should_panic(expected: ('Not owner',))]
fn test_set_fee_not_owner() {
    // Given
    let (_token, escrow) = setup_test();

    // When (Then should panic)
    start_cheat_caller_address(escrow.contract_address, OTHER());
    escrow.set_fee_bps(800);
}

#[test]
#[should_panic(expected: ('Fee too high',))]
fn test_set_fee_too_high() {
    // Given
    let owner = OWNER();
    let (_token, escrow) = setup_test();

    // When (Then should panic)
    start_cheat_caller_address(escrow.contract_address, owner);
    escrow.set_fee_bps(1001);
}

#[test]
fn test_token_transfers_on_create() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let amount = 1000_u256;

    mint_and_approve(token, escrow, buyer, amount);

    let buyer_balance_before = token.balance_of(buyer);
    let escrow_balance_before = token.balance_of(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, buyer);
    escrow.create_escrow(SELLER(), ARBITER(), amount, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let buyer_balance_after = token.balance_of(buyer);
    let escrow_balance_after = token.balance_of(escrow.contract_address);

    assert(buyer_balance_after == buyer_balance_before - amount, 'Buyer balance wrong');
    assert(escrow_balance_after == escrow_balance_before + amount, 'Escrow balance wrong');
}

#[test]
fn test_token_transfers_on_release() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    let amount = 1000_u256;
    let fee_bps = 500_u16; // 5%
    let fee = (amount * fee_bps.into()) / 10000;
    let amount_to_seller = amount - fee;

    mint_and_approve(token, escrow, buyer, amount);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(seller, ARBITER(), amount, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    let seller_balance_before = token.balance_of(seller);
    let escrow_balance_before = token.balance_of(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, buyer);
    escrow.release(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let seller_balance_after = token.balance_of(seller);
    let escrow_balance_after = token.balance_of(escrow.contract_address);

    assert(seller_balance_after == seller_balance_before + amount_to_seller, 'Seller balance wrong');
    assert(escrow_balance_after == escrow_balance_before - amount_to_seller, 'Escrow balance wrong');
}

#[test]
fn test_token_transfers_on_refund() {
    // Given
    let (token, escrow) = setup_test();
    let buyer = BUYER();
    let seller = SELLER();
    let amount = 1000_u256;

    mint_and_approve(token, escrow, buyer, amount);

    start_cheat_caller_address(escrow.contract_address, buyer);
    let id = escrow.create_escrow(seller, ARBITER(), amount, 'Test');
    stop_cheat_caller_address(escrow.contract_address);

    let buyer_balance_after_create = token.balance_of(buyer);
    let escrow_balance_before = token.balance_of(escrow.contract_address);

    // When
    start_cheat_caller_address(escrow.contract_address, seller);
    escrow.refund(id);
    stop_cheat_caller_address(escrow.contract_address);

    // Then
    let buyer_balance_after = token.balance_of(buyer);
    let escrow_balance_after = token.balance_of(escrow.contract_address);

    assert(buyer_balance_after == buyer_balance_after_create + amount, 'Buyer balance wrong');
    assert(escrow_balance_after == escrow_balance_before - amount, 'Escrow balance wrong');
}
