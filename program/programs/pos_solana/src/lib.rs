use anchor_lang::prelude::*;

declare_id!("8e6GFqAX399AqEei4irCWsTm1GgBnvUsd4YSsyfdBKEw");

pub const BUSINESS_SEED: &[u8] = b"business";
pub const CUSTOMER_SEED: &[u8] = b"customer";
pub const MAX_NAME_LENGTH: usize = 50;

#[program]
pub mod pos_solana {
    use super::*;

    /// 1. initialize_business: Inicialización de la cuenta PDA del negocio.
    pub fn initialize_business(
        ctx: Context<InitializeBusiness>,
        name: String,
    ) -> Result<()> {
        require!(!name.is_empty() && name.len() <= MAX_NAME_LENGTH, ErrorCode::InvalidName);

        let business = &mut ctx.accounts.business;
        business.authority = ctx.accounts.authority.key();
        business.name = name.clone();
        business.total_sales = 0;
        business.total_volume = 0;
        business.bump = ctx.bumps.business;

        emit!(BusinessInitializedEvent {
            business: business.key(),
            authority: business.authority,
            name,
        });

        msg!("Negocio inicializado correctamente: {}", business.name);
        Ok(())
    }

    /// 2. register_customer: Creación de la cuenta PDA de un cliente vinculado al negocio.
    pub fn register_customer(
        ctx: Context<RegisterCustomer>,
        name: String,
    ) -> Result<()> {
        require!(!name.is_empty() && name.len() <= MAX_NAME_LENGTH, ErrorCode::InvalidName);

        let customer = &mut ctx.accounts.customer;
        customer.business = ctx.accounts.business.key();
        customer.customer = ctx.accounts.customer_wallet.key();
        customer.name = name.clone();
        customer.total_purchases = 0;
        customer.purchases_count = 0;
        customer.loyalty_points = 0;
        customer.is_active = true;
        customer.bump = ctx.bumps.customer;

        emit!(CustomerRegisteredEvent {
            business: customer.business,
            customer_pda: customer.key(),
            customer_wallet: customer.customer,
            name,
        });

        msg!("Cliente registrado exitosamente: {}", customer.name);
        Ok(())
    }

    /// 3. process_sale: Actualización del contador de ventas y volumen acumulado en las PDAs correspondientes.
    pub fn process_sale(
        ctx: Context<ProcessSale>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let customer = &mut ctx.accounts.customer;
        require!(customer.is_active, ErrorCode::CustomerInactive);

        let business = &mut ctx.accounts.business;

        // Actualizar métricas del Negocio
        business.total_sales = business
            .total_sales
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        business.total_volume = business
            .total_volume
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Actualizar métricas del Cliente
        customer.purchases_count = customer
            .purchases_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        customer.total_purchases = customer
            .total_purchases
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Asignación de puntos de fidelidad (1 punto por cada 100_000 lamports / unidades, mínimo 1 punto)
        let points_earned = (amount / 100_000).max(1);
        customer.loyalty_points = customer
            .loyalty_points
            .checked_add(points_earned)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(SaleProcessedEvent {
            business: business.key(),
            customer_pda: customer.key(),
            amount,
            points_earned,
            total_business_sales: business.total_sales,
            total_business_volume: business.total_volume,
        });

        msg!(
            "Venta procesada: Monto = {}, Puntos Ganados = {}, Total Ventas = {}",
            amount,
            points_earned,
            business.total_sales
        );
        Ok(())
    }

    /// 4. Módulo de Mejora (Vibe Coding): apply_discount que valida puntos de lealtad requeridos.
    pub fn apply_discount(
        ctx: Context<ApplyDiscount>,
        points_to_redeem: u64,
        sale_amount: u64,
        discount_amount: u64,
    ) -> Result<()> {
        require!(sale_amount > 0, ErrorCode::InvalidAmount);
        require!(points_to_redeem > 0, ErrorCode::InvalidPointsAmount);
        require!(discount_amount <= sale_amount, ErrorCode::DiscountExceedsAmount);

        let customer = &mut ctx.accounts.customer;
        require!(customer.is_active, ErrorCode::CustomerInactive);

        // Validación estricta de regla de negocio
        require!(
            customer.loyalty_points >= points_to_redeem,
            ErrorCode::InsufficientLoyaltyPoints
        );

        // Descontar puntos de lealtad
        customer.loyalty_points = customer
            .loyalty_points
            .checked_sub(points_to_redeem)
            .ok_or(ErrorCode::MathOverflow)?;

        let final_amount = sale_amount
            .checked_sub(discount_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        let business = &mut ctx.accounts.business;

        // Registrar la venta con descuento
        business.total_sales = business
            .total_sales
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        business.total_volume = business
            .total_volume
            .checked_add(final_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        customer.purchases_count = customer
            .purchases_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        customer.total_purchases = customer
            .total_purchases
            .checked_add(final_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(DiscountAppliedEvent {
            business: business.key(),
            customer_pda: customer.key(),
            points_redeemed: points_to_redeem,
            discount_amount,
            final_amount,
            remaining_points: customer.loyalty_points,
        });

        msg!(
            "Descuento aplicado: Puntos = {}, Descuento = {}, Monto Final = {}",
            points_to_redeem,
            discount_amount,
            final_amount
        );
        Ok(())
    }

    /// Actualizar estado del cliente (activar / desactivar)
    pub fn set_customer_status(
        ctx: Context<SetCustomerStatus>,
        is_active: bool,
    ) -> Result<()> {
        let customer = &mut ctx.accounts.customer;
        customer.is_active = is_active;

        emit!(CustomerStatusUpdatedEvent {
            business: ctx.accounts.business.key(),
            customer_pda: customer.key(),
            is_active,
        });

        msg!("Estado de cliente actualizado: is_active = {}", is_active);
        Ok(())
    }

    /// 5. close_customer (Baja / Cierre del Día 5): Cierre condicionado de la cuenta PDA de un cliente inactivo,
    /// devolviendo el saldo de exención de renta (rent-exempt) a la autoridad del negocio.
    pub fn close_customer(ctx: Context<CloseCustomer>) -> Result<()> {
        let customer = &ctx.accounts.customer;

        // Validación de condición de cierre: Solo clientes inactivos pueden ser cerrados
        require!(!customer.is_active, ErrorCode::CustomerStillActive);

        emit!(CustomerClosedEvent {
            business: ctx.accounts.business.key(),
            customer_pda: customer.key(),
            authority: ctx.accounts.authority.key(),
        });

        msg!(
            "Cuenta PDA del cliente {} cerrada. Fondos de renta devueltos a la autoridad.",
            customer.name
        );
        Ok(())
    }
}

// ====================================================================
// CUENTAS (CONTEXTOS DE INSTRUCCIÓN)
// ====================================================================

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeBusiness<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Business::INIT_SPACE,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump
    )]
    pub business: Account<'info, Business>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterCustomer<'info> {
    #[account(
        has_one = authority @ ErrorCode::Unauthorized,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, Business>,

    #[account(
        init,
        payer = authority,
        space = 8 + Customer::INIT_SPACE,
        seeds = [CUSTOMER_SEED, business.key().as_ref(), customer_wallet.key().as_ref()],
        bump
    )]
    pub customer: Account<'info, Customer>,

    /// CHECK: Wallet pública del cliente
    pub customer_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessSale<'info> {
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, Business>,

    #[account(
        mut,
        has_one = business @ ErrorCode::InvalidBusinessRelation,
        seeds = [CUSTOMER_SEED, business.key().as_ref(), customer.customer.as_ref()],
        bump = customer.bump
    )]
    pub customer: Account<'info, Customer>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApplyDiscount<'info> {
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, Business>,

    #[account(
        mut,
        has_one = business @ ErrorCode::InvalidBusinessRelation,
        seeds = [CUSTOMER_SEED, business.key().as_ref(), customer.customer.as_ref()],
        bump = customer.bump
    )]
    pub customer: Account<'info, Customer>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetCustomerStatus<'info> {
    #[account(
        has_one = authority @ ErrorCode::Unauthorized,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, Business>,

    #[account(
        mut,
        has_one = business @ ErrorCode::InvalidBusinessRelation,
        seeds = [CUSTOMER_SEED, business.key().as_ref(), customer.customer.as_ref()],
        bump = customer.bump
    )]
    pub customer: Account<'info, Customer>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseCustomer<'info> {
    #[account(
        has_one = authority @ ErrorCode::Unauthorized,
        seeds = [BUSINESS_SEED, authority.key().as_ref()],
        bump = business.bump
    )]
    pub business: Account<'info, Business>,

    #[account(
        mut,
        close = authority,
        has_one = business @ ErrorCode::InvalidBusinessRelation,
        seeds = [CUSTOMER_SEED, business.key().as_ref(), customer.customer.as_ref()],
        bump = customer.bump
    )]
    pub customer: Account<'info, Customer>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ====================================================================
// MODELO DE DATOS Y ESTADO (PDAs)
// ====================================================================

#[account]
#[derive(InitSpace)]
pub struct Business {
    pub authority: Pubkey,       // 32
    #[max_len(50)]
    pub name: String,            // 4 + 50
    pub total_sales: u64,        // 8
    pub total_volume: u64,       // 8
    pub bump: u8,                // 1
}

#[account]
#[derive(InitSpace)]
pub struct Customer {
    pub business: Pubkey,        // 32
    pub customer: Pubkey,        // 32
    #[max_len(50)]
    pub name: String,            // 4 + 50
    pub total_purchases: u64,    // 8
    pub purchases_count: u64,    // 8
    pub loyalty_points: u64,     // 8
    pub is_active: bool,         // 1
    pub bump: u8,                // 1
}

// ====================================================================
// EVENTOS
// ====================================================================

#[event]
pub struct BusinessInitializedEvent {
    pub business: Pubkey,
    pub authority: Pubkey,
    pub name: String,
}

#[event]
pub struct CustomerRegisteredEvent {
    pub business: Pubkey,
    pub customer_pda: Pubkey,
    pub customer_wallet: Pubkey,
    pub name: String,
}

#[event]
pub struct SaleProcessedEvent {
    pub business: Pubkey,
    pub customer_pda: Pubkey,
    pub amount: u64,
    pub points_earned: u64,
    pub total_business_sales: u64,
    pub total_business_volume: u64,
}

#[event]
pub struct DiscountAppliedEvent {
    pub business: Pubkey,
    pub customer_pda: Pubkey,
    pub points_redeemed: u64,
    pub discount_amount: u64,
    pub final_amount: u64,
    pub remaining_points: u64,
}

#[event]
pub struct CustomerStatusUpdatedEvent {
    pub business: Pubkey,
    pub customer_pda: Pubkey,
    pub is_active: bool,
}

#[event]
pub struct CustomerClosedEvent {
    pub business: Pubkey,
    pub customer_pda: Pubkey,
    pub authority: Pubkey,
}

// ====================================================================
// CÓDIGOS DE ERROR PERSONALIZADOS
// ====================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("No tiene autorización para ejecutar esta acción en el negocio.")]
    Unauthorized,

    #[msg("El nombre proporcionado es inválido o excede los 50 caracteres.")]
    InvalidName,

    #[msg("El monto de la venta debe ser mayor a cero.")]
    InvalidAmount,

    #[msg("La cuenta del cliente no pertenece a este negocio.")]
    InvalidBusinessRelation,

    #[msg("El cliente no se encuentra activo para realizar transacciones.")]
    CustomerInactive,

    #[msg("Puntos de fidelidad insuficientes para aplicar el descuento solicitado.")]
    InsufficientLoyaltyPoints,

    #[msg("La cantidad de puntos a redimir debe ser mayor a cero.")]
    InvalidPointsAmount,

    #[msg("El monto del descuento no puede ser superior al monto de la venta.")]
    DiscountExceedsAmount,

    #[msg("No se puede cerrar la cuenta de un cliente activo. Debe darse de baja primero.")]
    CustomerStillActive,

    #[msg("Error de cálculo aritmético (desbordamiento).")]
    MathOverflow,
}
