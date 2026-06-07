#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    BytesN, Env, String,
};

#[contract]
pub struct QuorumPassNft;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pass {
    pub token_id: u64,
    pub event_id: BytesN<32>,
    pub owner: Address,
    pub metadata_uri: String,
    pub metadata_hash: BytesN<32>,
    pub checked_in: bool,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Core,
    NextTokenId,
    Pass(u64),
    OwnerEvent(Address, BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum PassError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    DuplicatePass = 4,
    PassNotFound = 5,
    NonTransferable = 6,
}

fn admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, PassError::NotInitialized))
}

fn core(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Core)
        .unwrap_or_else(|| panic_with_error!(env, PassError::NotInitialized))
}

fn require_admin(env: &Env, caller: &Address) {
    caller.require_auth();

    if caller != &admin(env) {
        panic_with_error!(env, PassError::Unauthorized);
    }
}

fn require_core(env: &Env, caller: &Address) {
    caller.require_auth();

    if caller != &core(env) {
        panic_with_error!(env, PassError::Unauthorized);
    }
}

#[allow(deprecated)]
fn emit_core_set(env: &Env, core: Address) {
    env.events()
        .publish((symbol_short!("core"), symbol_short!("set")), core);
}

#[allow(deprecated)]
fn emit_mint(env: &Env, event_id: BytesN<32>, owner: Address, token_id: u64) {
    env.events()
        .publish((symbol_short!("pass"), symbol_short!("mint")), (event_id, owner, token_id));
}

#[allow(deprecated)]
fn emit_checked_in(env: &Env, token_id: u64) {
    env.events()
        .publish((symbol_short!("pass"), symbol_short!("checkin")), token_id);
}

#[contractimpl]
impl QuorumPassNft {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, PassError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextTokenId, &1_u64);
    }

    pub fn set_core(env: Env, caller: Address, core: Address) {
        require_admin(&env, &caller);
        env.storage().instance().set(&DataKey::Core, &core);
        emit_core_set(&env, core);
    }

    pub fn mint(
        env: Env,
        caller: Address,
        to: Address,
        event_id: BytesN<32>,
        metadata_uri: String,
        metadata_hash: BytesN<32>,
    ) -> u64 {
        require_core(&env, &caller);

        let owner_key = DataKey::OwnerEvent(to.clone(), event_id.clone());

        if env.storage().persistent().has(&owner_key) {
            panic_with_error!(&env, PassError::DuplicatePass);
        }

        let token_id = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1_u64);
        let pass = Pass {
            token_id,
            event_id: event_id.clone(),
            owner: to.clone(),
            metadata_uri,
            metadata_hash,
            checked_in: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Pass(token_id), &pass);
        env.storage().persistent().set(&owner_key, &token_id);
        env.storage()
            .instance()
            .set(&DataKey::NextTokenId, &(token_id + 1));
        emit_mint(&env, event_id, to, token_id);

        token_id
    }

    pub fn owner_of(env: Env, token_id: u64) -> Address {
        Self::pass(env, token_id).owner
    }

    pub fn pass(env: Env, token_id: u64) -> Pass {
        env.storage()
            .persistent()
            .get(&DataKey::Pass(token_id))
            .unwrap_or_else(|| panic_with_error!(&env, PassError::PassNotFound))
    }

    pub fn has_pass(env: Env, owner: Address, event_id: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::OwnerEvent(owner, event_id))
    }

    pub fn token_for(env: Env, owner: Address, event_id: BytesN<32>) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerEvent(owner, event_id))
            .unwrap_or_else(|| panic_with_error!(&env, PassError::PassNotFound))
    }

    pub fn mark_checked_in(env: Env, caller: Address, token_id: u64) {
        require_core(&env, &caller);

        let mut pass = Self::pass(env.clone(), token_id);
        pass.checked_in = true;
        env.storage()
            .persistent()
            .set(&DataKey::Pass(token_id), &pass);
        emit_checked_in(&env, token_id);
    }

    pub fn transfer(env: Env, _from: Address, _to: Address, _token_id: u64) {
        panic_with_error!(&env, PassError::NonTransferable);
    }
}

mod test;
