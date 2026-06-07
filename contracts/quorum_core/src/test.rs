#![cfg(test)]

use super::*;
use quorum_pass_nft::{QuorumPassNft, QuorumPassNftClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, BytesN, Env, String};

struct Setup {
    env: Env,
    core: QuorumCoreClient<'static>,
    pass: QuorumPassNftClient<'static>,
    organizer: Address,
    speaker: Address,
    partner: Address,
    buyer: Address,
    currency: Address,
    event_id: BytesN<32>,
}

fn splits(
    env: &Env,
    organizer: &Address,
    speaker: &Address,
    partner: &Address,
) -> Vec<SplitRecipient> {
    vec![
        env,
        SplitRecipient {
            wallet: organizer.clone(),
            percent_bps: 7_000,
        },
        SplitRecipient {
            wallet: speaker.clone(),
            percent_bps: 2_000,
        },
        SplitRecipient {
            wallet: partner.clone(),
            percent_bps: 1_000,
        },
    ]
}

fn setup_with_platform_fee(platform_fee_bps: u32) -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let core_id = env.register(QuorumCore, ());
    let pass_id = env.register(QuorumPassNft, ());
    let core = QuorumCoreClient::new(&env, &core_id);
    let pass = QuorumPassNftClient::new(&env, &pass_id);
    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let speaker = Address::generate(&env);
    let partner = Address::generate(&env);
    let buyer = Address::generate(&env);
    let currency = Address::generate(&env);
    let event_id = BytesN::from_array(&env, &[3; 32]);

    pass.init(&admin);
    pass.set_core(&admin, &core_id);
    core.init(&admin, &platform_fee_bps);
    core.create_event(
        &organizer,
        &event_id,
        &1_000,
        &currency,
        &2,
        &false,
        &splits(&env, &organizer, &speaker, &partner),
        &BytesN::from_array(&env, &[8; 32]),
        &pass_id,
    );

    Setup {
        env,
        core,
        pass,
        organizer,
        speaker,
        partner,
        buyer,
        currency,
        event_id,
    }
}

fn setup() -> Setup {
    setup_with_platform_fee(500)
}

fn create_free_event(s: &Setup, event_byte: u8, capacity: u32) -> BytesN<32> {
    let event_id = BytesN::from_array(&s.env, &[event_byte; 32]);

    s.core.create_event(
        &s.organizer,
        &event_id,
        &0,
        &s.currency,
        &capacity,
        &true,
        &splits(&s.env, &s.organizer, &s.speaker, &s.partner),
        &BytesN::from_array(&s.env, &[6; 32]),
        &s.pass.address,
    );

    event_id
}

fn pass_metadata(env: &Env) -> (String, BytesN<32>) {
    (
        String::from_str(env, "ipfs://pass-1"),
        BytesN::from_array(env, &[9; 32]),
    )
}

#[test]
fn purchase_mints_pass_and_splits_balance() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);

    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    assert_eq!(token_id, 1);
    assert!(s.core.has_purchased(&s.event_id, &s.buyer));
    assert!(s.pass.has_pass(&s.buyer, &s.event_id));
    assert_eq!(s.pass.owner_of(&token_id), s.buyer);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.organizer), 665);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.speaker), 190);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.partner), 95);
    assert_eq!(s.core.platform_balance(&s.currency), 50);
}

#[test]
fn demo_zero_fee_routes_full_amount_to_collaborators() {
    let s = setup_with_platform_fee(0);
    let uri = String::from_str(&s.env, "ipfs://demo-pass-1");
    let hash = BytesN::from_array(&s.env, &[7; 32]);

    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    assert_eq!(token_id, 1);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.organizer), 700);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.speaker), 200);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.partner), 100);
    assert_eq!(s.core.platform_balance(&s.currency), 0);
}

#[test]
fn free_event_claim_mints_pass_without_balances() {
    let s = setup();
    let free_event_id = create_free_event(&s, 5, 2);
    let uri = String::from_str(&s.env, "ipfs://free-pass-1");
    let hash = BytesN::from_array(&s.env, &[5; 32]);

    let token_id = s.core.purchase(&s.buyer, &free_event_id, &0, &uri, &hash);

    assert_eq!(token_id, 1);
    assert!(s.core.has_purchased(&free_event_id, &s.buyer));
    assert!(s.pass.has_pass(&s.buyer, &free_event_id));
    assert_eq!(s.core.get_event(&free_event_id).sold_count, 1);
    assert_eq!(s.core.collaborator_balance(&free_event_id, &s.organizer), 0);
    assert_eq!(s.core.collaborator_balance(&free_event_id, &s.speaker), 0);
    assert_eq!(s.core.collaborator_balance(&free_event_id, &s.partner), 0);
    assert_eq!(s.core.platform_balance(&s.currency), 0);
}

#[test]
#[should_panic]
fn rejects_duplicate_free_claim() {
    let s = setup();
    let free_event_id = create_free_event(&s, 6, 2);
    let uri = String::from_str(&s.env, "ipfs://free-pass-1");
    let hash = BytesN::from_array(&s.env, &[5; 32]);

    s.core.purchase(&s.buyer, &free_event_id, &0, &uri, &hash);
    s.core.purchase(&s.buyer, &free_event_id, &0, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_free_claim_when_capacity_is_full() {
    let s = setup();
    let free_event_id = create_free_event(&s, 7, 1);
    let second_buyer = Address::generate(&s.env);
    let uri = String::from_str(&s.env, "ipfs://free-pass-1");
    let hash = BytesN::from_array(&s.env, &[5; 32]);

    s.core.purchase(&s.buyer, &free_event_id, &0, &uri, &hash);
    s.core.purchase(&second_buyer, &free_event_id, &0, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_duplicate_purchase() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);

    s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);
    s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_paid_purchase_with_wrong_amount() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);

    s.core.purchase(&s.buyer, &s.event_id, &0, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_free_claim_with_nonzero_amount() {
    let s = setup();
    let free_event_id = create_free_event(&s, 8, 2);
    let (uri, hash) = pass_metadata(&s.env);

    s.core.purchase(&s.buyer, &free_event_id, &1, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_paid_purchase_when_capacity_is_full() {
    let s = setup();
    let second_buyer = Address::generate(&s.env);
    let third_buyer = Address::generate(&s.env);
    let (uri, hash) = pass_metadata(&s.env);

    s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);
    s.core.purchase(&second_buyer, &s.event_id, &1_000, &uri, &hash);
    s.core.purchase(&third_buyer, &s.event_id, &1_000, &uri, &hash);
}

#[test]
fn collaborator_can_withdraw_balance() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);

    s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    assert_eq!(s.core.withdraw(&s.speaker, &s.event_id), 190);
    assert_eq!(s.core.collaborator_balance(&s.event_id, &s.speaker), 0);
}

#[test]
#[should_panic]
fn rejects_withdraw_without_balance() {
    let s = setup();
    let outsider = Address::generate(&s.env);

    s.core.withdraw(&outsider, &s.event_id);
}

#[test]
fn organizer_can_check_in_pass() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);
    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    s.core.check_in(&s.organizer, &s.event_id, &token_id);

    assert!(s.core.is_checked_in(&s.event_id, &token_id));
    assert!(s.pass.pass(&token_id).checked_in);
}

#[test]
fn duplicate_check_in_is_idempotent() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);
    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    s.core.check_in(&s.organizer, &s.event_id, &token_id);
    s.core.check_in(&s.organizer, &s.event_id, &token_id);

    assert!(s.core.is_checked_in(&s.event_id, &token_id));
    assert!(s.pass.pass(&token_id).checked_in);
}

#[test]
#[should_panic]
fn rejects_check_in_from_non_organizer() {
    let s = setup();
    let (uri, hash) = pass_metadata(&s.env);
    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    s.core.check_in(&s.speaker, &s.event_id, &token_id);
}

#[test]
#[should_panic]
fn rejects_check_in_for_unknown_token() {
    let s = setup();

    s.core.check_in(&s.organizer, &s.event_id, &999);
}

#[test]
#[should_panic]
fn rejects_check_in_for_token_from_another_event() {
    let s = setup();
    let other_event_id = create_free_event(&s, 9, 2);
    let (uri, hash) = pass_metadata(&s.env);
    let token_id = s.core.purchase(&s.buyer, &s.event_id, &1_000, &uri, &hash);

    s.core.check_in(&s.organizer, &other_event_id, &token_id);
}

#[test]
#[should_panic]
fn rejects_invalid_split_total() {
    let s = setup();
    let bad_event_id = BytesN::from_array(&s.env, &[4; 32]);
    let bad_splits = vec![
        &s.env,
        SplitRecipient {
            wallet: s.organizer.clone(),
            percent_bps: 9_000,
        },
    ];

    s.core.create_event(
        &s.organizer,
        &bad_event_id,
        &1_000,
        &s.currency,
        &2,
        &false,
        &bad_splits,
        &BytesN::from_array(&s.env, &[8; 32]),
        &s.pass.address,
    );
}
