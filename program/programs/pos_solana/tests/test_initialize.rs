use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_pos_solana_full_flow() {
    let program_id = pos_solana::id();
    let authority = Keypair::new();
    let customer_wallet = Keypair::new();

    let business_pda = Pubkey::find_program_address(
        &[pos_solana::BUSINESS_SEED, authority.pubkey().as_ref()],
        &program_id,
    ).0;

    let customer_pda = Pubkey::find_program_address(
        &[
            pos_solana::CUSTOMER_SEED,
            business_pda.as_ref(),
            customer_wallet.pubkey().as_ref(),
        ],
        &program_id,
    ).0;

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/pos_solana.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();

    // 1. INICIALIZAR NEGOCIO
    let init_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::InitializeBusiness {
            name: "Tienda Solana Express".to_string(),
        }
        .data(),
        pos_solana::accounts::InitializeBusiness {
            business: business_pda,
            authority: authority.pubkey(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[init_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al inicializar el negocio: {:?}", res.err());

    let b_acc = svm.get_account(&business_pda).unwrap();
    let mut b_data: &[u8] = &b_acc.data;
    let b_state = pos_solana::Business::try_deserialize(&mut b_data).unwrap();
    assert_eq!(b_state.name, "Tienda Solana Express");
    assert_eq!(b_state.authority, authority.pubkey());
    assert_eq!(b_state.total_sales, 0);
    assert_eq!(b_state.total_volume, 0);

    // 2. REGISTRAR CLIENTE
    let reg_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::RegisterCustomer {
            name: "Alice Developer".to_string(),
        }
        .data(),
        pos_solana::accounts::RegisterCustomer {
            business: business_pda,
            customer: customer_pda,
            customer_wallet: customer_wallet.pubkey(),
            authority: authority.pubkey(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[reg_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al registrar cliente: {:?}", res.err());

    let c_acc = svm.get_account(&customer_pda).unwrap();
    let mut c_data: &[u8] = &c_acc.data;
    let c_state = pos_solana::Customer::try_deserialize(&mut c_data).unwrap();
    assert_eq!(c_state.name, "Alice Developer");
    assert_eq!(c_state.customer, customer_wallet.pubkey());
    assert_eq!(c_state.purchases_count, 0);
    assert_eq!(c_state.loyalty_points, 0);
    assert!(c_state.is_active);

    // 3. PROCESAR VENTA (1_500_000 lamports -> 15 puntos de fidelidad)
    let sale_amount = 1_500_000u64;
    let sale_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::ProcessSale { amount: sale_amount }.data(),
        pos_solana::accounts::ProcessSale {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[sale_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al procesar venta: {:?}", res.err());

    let c_acc = svm.get_account(&customer_pda).unwrap();
    let mut c_data: &[u8] = &c_acc.data;
    let c_state = pos_solana::Customer::try_deserialize(&mut c_data).unwrap();
    assert_eq!(c_state.purchases_count, 1);
    assert_eq!(c_state.total_purchases, sale_amount);
    assert_eq!(c_state.loyalty_points, 15); // 1_500_000 / 100_000

    let b_acc = svm.get_account(&business_pda).unwrap();
    let mut b_data: &[u8] = &b_acc.data;
    let b_state = pos_solana::Business::try_deserialize(&mut b_data).unwrap();
    assert_eq!(b_state.total_sales, 1);
    assert_eq!(b_state.total_volume, sale_amount);

    // 4. PRUEBA DE RECHAZO CONTROLADA: Intento de descuento con puntos insuficientes
    // Alice tiene 15 puntos, intentamos canjear 50 puntos
    let fail_discount_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::ApplyDiscount {
            points_to_redeem: 50,
            sale_amount: 1_000_000,
            discount_amount: 200_000,
        }
        .data(),
        pos_solana::accounts::ApplyDiscount {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[fail_discount_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_err(), "Debe fallar por puntos de fidelidad insuficientes");

    // 5. MODULO DE MEJORA: Aplicar descuento válido canjeando 10 puntos
    let ok_discount_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::ApplyDiscount {
            points_to_redeem: 10,
            sale_amount: 1_000_000,
            discount_amount: 200_000,
        }
        .data(),
        pos_solana::accounts::ApplyDiscount {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ok_discount_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al aplicar descuento: {:?}", res.err());

    let c_acc = svm.get_account(&customer_pda).unwrap();
    let mut c_data: &[u8] = &c_acc.data;
    let c_state = pos_solana::Customer::try_deserialize(&mut c_data).unwrap();
    assert_eq!(c_state.loyalty_points, 5); // 15 - 10 = 5 restantes
    assert_eq!(c_state.purchases_count, 2);
    assert_eq!(c_state.total_purchases, 1_500_000 + 800_000); // 800_000 tras descuento

    // 6. PRUEBA DE RECHAZO: Intento de cierre de cliente mientras sigue ACTIVO
    let fail_close_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::CloseCustomer {}.data(),
        pos_solana::accounts::CloseCustomer {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[fail_close_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_err(), "Debe fallar al intentar cerrar un cliente activo");

    // 7. DESACTIVAR CLIENTE
    let deactivate_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::SetCustomerStatus { is_active: false }.data(),
        pos_solana::accounts::SetCustomerStatus {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[deactivate_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al desactivar cliente: {:?}", res.err());

    // 8. CIERRE DE CLIENTE INACTIVO (BAJA DÍA 5) Y RETORNO DE RENTA
    svm.expire_blockhash();
    let authority_pre_balance = svm.get_account(&authority.pubkey()).unwrap().lamports;

    let close_ix = Instruction::new_with_bytes(
        program_id,
        &pos_solana::instruction::CloseCustomer {}.data(),
        pos_solana::accounts::CloseCustomer {
            business: business_pda,
            customer: customer_pda,
            authority: authority.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[close_ix], Some(&authority.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&authority]).unwrap();
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Fallo al cerrar cliente inactivo: {:?}", res.err());

    // Verificar que la cuenta PDA de cliente ha sido eliminada
    let closed_account = svm.get_account(&customer_pda);
    assert!(
        closed_account.is_none() || closed_account.unwrap().lamports == 0,
        "La cuenta de cliente debe cerrarse y no tener fondos"
    );

    // Verificar que el balance de la autoridad recibió la renta recuperada
    let authority_post_balance = svm.get_account(&authority.pubkey()).unwrap().lamports;
    assert!(
        authority_post_balance > authority_pre_balance - 10_000,
        "Los fondos de renta deben ser reintegrados a la autoridad"
    );
}
