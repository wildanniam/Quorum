#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    vec, Address, BytesN, Env, IntoVal, MuxedAddress, String, Symbol, Vec,
};

const BPS_DENOMINATOR: u32 = 10_000;

#[contract]
pub struct QuorumCore;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Event {
    pub event_id: BytesN<32>,
    pub organizer: Address,
    pub price: i128,
    pub currency: Address,
    pub capacity: u32,
    pub sold_count: u32,
    pub is_free: bool,
    pub published: bool,
    pub platform_fee_bps: u32,
    pub metadata_hash: BytesN<32>,
    pub pass_contract: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitRecipient {
    pub wallet: Address,
    pub percent_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Purchase {
    pub event_id: BytesN<32>,
    pub buyer: Address,
    pub amount: i128,
    pub token_id: u64,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    PlatformFeeBps,
    Event(BytesN<32>),
    Splits(BytesN<32>),
    Purchase(BytesN<32>, Address),
    Balance(BytesN<32>, Address),
    PlatformBalance(Address),
    TokenEvent(u64),
    CheckedIn(BytesN<32>, u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum CoreError {
    AlreadyInitialized = 100,
    NotInitialized = 101,
    Unauthorized = 102,
    EventExists = 103,
    EventNotFound = 104,
    InvalidSplit = 105,
    InvalidPrice = 106,
    SoldOut = 107,
    AlreadyPurchased = 108,
    InvalidPayment = 109,
    NoBalance = 110,
    PassMismatch = 111,
}

fn admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, CoreError::NotInitialized))
}

fn require_admin(env: &Env, caller: &Address) {
    caller.require_auth();

    if caller != &admin(env) {
        panic_with_error!(env, CoreError::Unauthorized);
    }
}

fn read_event(env: &Env, event_id: &BytesN<32>) -> Event {
    env.storage()
        .persistent()
        .get(&DataKey::Event(event_id.clone()))
        .unwrap_or_else(|| panic_with_error!(env, CoreError::EventNotFound))
}

fn write_event(env: &Env, event: &Event) {
    env.storage()
        .persistent()
        .set(&DataKey::Event(event.event_id.clone()), event);
}

fn balance(env: &Env, event_id: &BytesN<32>, wallet: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(event_id.clone(), wallet.clone()))
        .unwrap_or(0_i128)
}

fn add_balance(env: &Env, event_id: &BytesN<32>, wallet: &Address, amount: i128) {
    if amount == 0 {
        return;
    }

    let next = balance(env, event_id, wallet) + amount;
    env.storage()
        .persistent()
        .set(&DataKey::Balance(event_id.clone(), wallet.clone()), &next);
}

fn transfer_token(env: &Env, currency: &Address, from: &Address, to: &Address, amount: i128) {
    if amount == 0 {
        return;
    }

    token::TokenClient::new(env, currency).transfer(from, &MuxedAddress::from(to), &amount);
}

fn validate_splits(env: &Env, splits: &Vec<SplitRecipient>) {
    let mut total = 0_u32;

    for split in splits.iter() {
        total += split.percent_bps;
    }

    if total != BPS_DENOMINATOR {
        panic_with_error!(env, CoreError::InvalidSplit);
    }
}

fn mint_pass(
    env: &Env,
    pass_contract: &Address,
    buyer: &Address,
    event_id: &BytesN<32>,
    metadata_uri: &String,
    metadata_hash: &BytesN<32>,
) -> u64 {
    let core = env.current_contract_address();

    env.invoke_contract(
        pass_contract,
        &symbol_short!("mint"),
        vec![
            env,
            core.into_val(env),
            buyer.clone().into_val(env),
            event_id.clone().into_val(env),
            metadata_uri.clone().into_val(env),
            metadata_hash.clone().into_val(env),
        ],
    )
}

fn mark_pass_checked_in(env: &Env, pass_contract: &Address, token_id: u64) {
    let core = env.current_contract_address();

    env.invoke_contract::<()>(
        pass_contract,
        &Symbol::new(env, "mark_checked_in"),
        vec![env, core.into_val(env), token_id.into_val(env)],
    );
}

#[allow(deprecated)]
fn emit_event_created(env: &Env, event_id: BytesN<32>, organizer: Address) {
    env.events().publish(
        (symbol_short!("event"), symbol_short!("created")),
        (event_id, organizer),
    );
}

#[allow(deprecated)]
fn emit_pass_purchase(
    env: &Env,
    event_id: BytesN<32>,
    buyer: Address,
    token_id: u64,
    amount: i128,
    is_free: bool,
) {
    let event_type = if is_free {
        symbol_short!("claim")
    } else {
        symbol_short!("purchase")
    };

    env.events()
        .publish((symbol_short!("pass"), event_type), (event_id, buyer, token_id, amount));
}

#[allow(deprecated)]
fn emit_balance_credit(env: &Env, event_id: BytesN<32>, wallet: Address, amount: i128) {
    if amount == 0 {
        return;
    }

    env.events().publish(
        (symbol_short!("balance"), symbol_short!("credit")),
        (event_id, wallet, amount),
    );
}

#[allow(deprecated)]
fn emit_withdraw(env: &Env, event_id: BytesN<32>, wallet: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("balance"), symbol_short!("withdraw")),
        (event_id, wallet, amount),
    );
}

#[allow(deprecated)]
fn emit_check_in(env: &Env, event_id: BytesN<32>, token_id: u64) {
    env.events()
        .publish((symbol_short!("pass"), symbol_short!("checkin")), (event_id, token_id));
}

#[allow(deprecated)]
fn emit_admin_withdraw(env: &Env, currency: Address, amount: i128) {
    env.events()
        .publish((symbol_short!("admin"), symbol_short!("withdraw")), (currency, amount));
}

#[contractimpl]
impl QuorumCore {
    pub fn init(env: Env, admin: Address, platform_fee_bps: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, CoreError::AlreadyInitialized);
        }

        if platform_fee_bps > BPS_DENOMINATOR {
            panic_with_error!(&env, CoreError::InvalidSplit);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PlatformFeeBps, &platform_fee_bps);
    }

    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: BytesN<32>,
        price: i128,
        currency: Address,
        capacity: u32,
        is_free: bool,
        splits: Vec<SplitRecipient>,
        metadata_hash: BytesN<32>,
        pass_contract: Address,
    ) {
        organizer.require_auth();

        if env
            .storage()
            .persistent()
            .has(&DataKey::Event(event_id.clone()))
        {
            panic_with_error!(&env, CoreError::EventExists);
        }

        if capacity == 0 || (is_free && price != 0) || (!is_free && price <= 0) {
            panic_with_error!(&env, CoreError::InvalidPrice);
        }

        validate_splits(&env, &splits);

        let platform_fee_bps = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeBps)
            .unwrap_or_else(|| panic_with_error!(&env, CoreError::NotInitialized));
        let event = Event {
            event_id: event_id.clone(),
            organizer,
            price,
            currency,
            capacity,
            sold_count: 0,
            is_free,
            published: true,
            platform_fee_bps,
            metadata_hash,
            pass_contract,
        };

        write_event(&env, &event);
        env.storage()
            .persistent()
            .set(&DataKey::Splits(event_id.clone()), &splits);
        emit_event_created(&env, event_id, event.organizer);
    }

    pub fn get_event(env: Env, event_id: BytesN<32>) -> Event {
        read_event(&env, &event_id)
    }

    pub fn get_splits(env: Env, event_id: BytesN<32>) -> Vec<SplitRecipient> {
        env.storage()
            .persistent()
            .get(&DataKey::Splits(event_id))
            .unwrap_or_else(|| vec![&env])
    }

    pub fn purchase(
        env: Env,
        buyer: Address,
        event_id: BytesN<32>,
        amount: i128,
        metadata_uri: String,
        metadata_hash: BytesN<32>,
    ) -> u64 {
        buyer.require_auth();

        let mut event = read_event(&env, &event_id);

        if event.sold_count >= event.capacity {
            panic_with_error!(&env, CoreError::SoldOut);
        }

        if env
            .storage()
            .persistent()
            .has(&DataKey::Purchase(event_id.clone(), buyer.clone()))
        {
            panic_with_error!(&env, CoreError::AlreadyPurchased);
        }

        if (event.is_free && amount != 0) || (!event.is_free && amount != event.price) {
            panic_with_error!(&env, CoreError::InvalidPayment);
        }

        let contract_address = env.current_contract_address();
        transfer_token(&env, &event.currency, &buyer, &contract_address, amount);

        let token_id = mint_pass(
            &env,
            &event.pass_contract,
            &buyer,
            &event_id,
            &metadata_uri,
            &metadata_hash,
        );

        event.sold_count += 1;
        write_event(&env, &event);
        env.storage().persistent().set(
            &DataKey::Purchase(event_id.clone(), buyer.clone()),
            &Purchase {
                event_id: event_id.clone(),
                buyer: buyer.clone(),
                amount,
                token_id,
            },
        );
        env.storage()
            .persistent()
            .set(&DataKey::TokenEvent(token_id), &event_id);
        emit_pass_purchase(
            &env,
            event_id.clone(),
            buyer.clone(),
            token_id,
            amount,
            event.is_free,
        );

        if amount > 0 {
            let platform_fee = amount * i128::from(event.platform_fee_bps) / 10_000_i128;
            let net = amount - platform_fee;
            let splits = Self::get_splits(env.clone(), event_id.clone());
            let mut distributed = 0_i128;
            let mut first_wallet: Option<Address> = None;

            for split in splits.iter() {
                if first_wallet.is_none() {
                    first_wallet = Some(split.wallet.clone());
                }

                let split_amount = net * i128::from(split.percent_bps) / 10_000_i128;
                distributed += split_amount;
                add_balance(&env, &event_id, &split.wallet, split_amount);
                emit_balance_credit(&env, event_id.clone(), split.wallet, split_amount);
            }

            if let Some(wallet) = first_wallet {
                let residual = net - distributed;
                add_balance(&env, &event_id, &wallet, residual);
                emit_balance_credit(&env, event_id.clone(), wallet, residual);
            }

            let platform_balance = env
                .storage()
                .persistent()
                .get(&DataKey::PlatformBalance(event.currency.clone()))
                .unwrap_or(0_i128);
            env.storage().persistent().set(
                &DataKey::PlatformBalance(event.currency),
                &(platform_balance + platform_fee),
            );
        }

        token_id
    }

    pub fn has_purchased(env: Env, event_id: BytesN<32>, buyer: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Purchase(event_id, buyer))
    }

    pub fn collaborator_balance(env: Env, event_id: BytesN<32>, wallet: Address) -> i128 {
        balance(&env, &event_id, &wallet)
    }

    pub fn withdraw(env: Env, collaborator: Address, event_id: BytesN<32>) -> i128 {
        collaborator.require_auth();

        let event = read_event(&env, &event_id);
        let amount = balance(&env, &event_id, &collaborator);
        if amount <= 0 {
            panic_with_error!(&env, CoreError::NoBalance);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Balance(event_id.clone(), collaborator.clone()), &0_i128);
        transfer_token(
            &env,
            &event.currency,
            &env.current_contract_address(),
            &collaborator,
            amount,
        );
        emit_withdraw(&env, event_id, collaborator, amount);

        amount
    }

    pub fn check_in(env: Env, organizer: Address, event_id: BytesN<32>, token_id: u64) {
        let event = read_event(&env, &event_id);
        organizer.require_auth();

        if organizer != event.organizer {
            panic_with_error!(&env, CoreError::Unauthorized);
        }

        let token_event: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::TokenEvent(token_id))
            .unwrap_or_else(|| panic_with_error!(&env, CoreError::PassMismatch));

        if token_event != event_id {
            panic_with_error!(&env, CoreError::PassMismatch);
        }

        mark_pass_checked_in(&env, &event.pass_contract, token_id);
        env.storage()
            .persistent()
            .set(&DataKey::CheckedIn(event_id.clone(), token_id), &true);
        emit_check_in(&env, event_id, token_id);
    }

    pub fn is_checked_in(env: Env, event_id: BytesN<32>, token_id: u64) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::CheckedIn(event_id, token_id))
            .unwrap_or(false)
    }

    pub fn platform_balance(env: Env, currency: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::PlatformBalance(currency))
            .unwrap_or(0_i128)
    }

    pub fn admin_withdraw(env: Env, caller: Address, currency: Address) -> i128 {
        require_admin(&env, &caller);

        let amount = Self::platform_balance(env.clone(), currency.clone());
        env.storage()
            .persistent()
            .set(&DataKey::PlatformBalance(currency.clone()), &0_i128);
        transfer_token(
            &env,
            &currency,
            &env.current_contract_address(),
            &caller,
            amount,
        );
        emit_admin_withdraw(&env, currency, amount);
        amount
    }
}

mod test;
