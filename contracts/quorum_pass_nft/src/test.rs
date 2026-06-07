#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, BytesN, Env, String};

fn setup() -> (
    Env,
    QuorumPassNftClient<'static>,
    Address,
    Address,
    Address,
    BytesN<32>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuorumPassNft, ());
    let client = QuorumPassNftClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let core = Address::generate(&env);
    let owner = Address::generate(&env);
    let event_id = BytesN::from_array(&env, &[7; 32]);

    client.init(&admin);
    client.set_core(&admin, &core);

    (env, client, admin, core, owner, event_id)
}

fn pass_metadata(env: &Env) -> (String, BytesN<32>) {
    (
        String::from_str(env, "ipfs://pass-1"),
        BytesN::from_array(env, &[9; 32]),
    )
}

#[test]
fn mints_unique_pass_for_owner_event() {
    let (env, client, _admin, core, owner, event_id) = setup();
    let (uri, hash) = pass_metadata(&env);

    let token_id = client.mint(&core, &owner, &event_id, &uri, &hash);

    assert_eq!(token_id, 1);
    assert!(client.has_pass(&owner, &event_id));
    assert_eq!(client.token_for(&owner, &event_id), token_id);
    assert_eq!(client.owner_of(&token_id), owner);

    let pass = client.pass(&token_id);
    assert_eq!(pass.metadata_uri, uri);
    assert_eq!(pass.metadata_hash, hash);
    assert!(!pass.checked_in);
}

#[test]
#[should_panic]
fn rejects_duplicate_owner_event_pass() {
    let (env, client, _admin, core, owner, event_id) = setup();
    let (uri, hash) = pass_metadata(&env);

    client.mint(&core, &owner, &event_id, &uri, &hash);
    client.mint(&core, &owner, &event_id, &uri, &hash);
}

#[test]
#[should_panic]
fn rejects_unauthorized_mint() {
    let (env, client, _admin, _core, owner, event_id) = setup();
    let caller = Address::generate(&env);
    let (uri, hash) = pass_metadata(&env);

    client.mint(&caller, &owner, &event_id, &uri, &hash);
}

#[test]
fn core_can_mark_pass_checked_in() {
    let (env, client, _admin, core, owner, event_id) = setup();
    let (uri, hash) = pass_metadata(&env);
    let token_id = client.mint(&core, &owner, &event_id, &uri, &hash);

    client.mark_checked_in(&core, &token_id);

    assert!(client.pass(&token_id).checked_in);
}

#[test]
#[should_panic]
fn rejects_unauthorized_check_in_mark() {
    let (env, client, _admin, core, owner, event_id) = setup();
    let caller = Address::generate(&env);
    let (uri, hash) = pass_metadata(&env);
    let token_id = client.mint(&core, &owner, &event_id, &uri, &hash);

    client.mark_checked_in(&caller, &token_id);
}

#[test]
#[should_panic]
fn transfer_is_disabled() {
    let (env, client, _admin, core, owner, event_id) = setup();
    let receiver = Address::generate(&env);
    let (uri, hash) = pass_metadata(&env);
    let token_id = client.mint(&core, &owner, &event_id, &uri, &hash);

    client.transfer(&owner, &receiver, &token_id);
}
