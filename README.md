# Solana POS - Punto de Venta Descentralizado en Solana Devnet
### Solana Engineering Track: Advanced Bootcamp - Proyecto Final

**Repositorio GitHub:** [sschifu7-pixel/SistemaVentas_Solana](https://github.com/sschifu7-pixel/SistemaVentas_Solana)

Repositorio oficial del proyecto final integrador: **Punto de Venta (POS), Registro de Negocio, Clientes y Fidelidad On-Chain en Solana**.

--- 2. Datos del Despliegue en Solana Devnet
* **Ruta Elegida**: Proyecto guiado con mejora funcional (Sistema de Puntos de Fidelidad & Descuentos).
* **Program ID**: `8e6GFqAX399AqEei4irCWsTm1GgBnvUsd4YSsyfdBKEw`
* **Transacción de Despliegue**: `2dwheJ2EJMkQPfV6FrJdRXPPT9zBvLsLKpz9mdkRVmCbhaEydqcDNYMQ5Ri7BEkYiohkVJxdyMCet1EyTvbpWtNc`
* **Red**: Solana Devnet
* **Enlace a Solana Explorer**:  
  [Ver Programa en Solana Explorer (Devnet)](https://explorer.solana.com/address/8e6GFqAX399AqEei4irCWsTm1GgBnvUsd4YSsyfdBKEw?cluster=devnet)

---

## 3. Arquitectura del Repositorio
```text
/
├── program/       # Código fuente en Rust + Anchor Framework (lib.rs, Anchor.toml, tests con LiteSVM)
├── idl/           # Archivo IDL JSON compilado (pos_solana.json)
├── client/        # Cliente TypeScript generado automáticamente con Codama
├── frontend/      # Aplicación Web React + Vite + Tailwind CSS + Solana Wallet Adapter
└── README.md      # Documentación técnica, guía de ejecución y evidencias
```

---

## 4. Instrucciones On-Chain y Modelo de Cuentas (PDAs)

### A. Modelo de Cuentas (PDAs)
1. **PDA de Negocio (`Business`)**:
   * **Seeds**: `[b"business", authority.key()]`
   * **Campos**: `authority` (Pubkey), `name` (String, máx 50), `total_sales` (u64), `total_volume` (u64 lamports), `bump` (u8).
2. **PDA de Cliente (`Customer`)**:
   * **Seeds**: `[b"customer", business.key(), customer_wallet.key()]`
   * **Campos**: `business` (Pubkey), `customer` (Pubkey wallet), `name` (String, máx 50), `total_purchases` (u64 lamports), `purchases_count` (u64), `loyalty_points` (u64), `is_active` (bool), `bump` (u8).

### B. Instrucciones Implementadas
* `initialize_business(name)`: Inicializa la PDA del negocio vinculada a la autoridad firmante.
* `register_customer(name)`: Crea y enlaza la PDA del cliente al negocio.
* `process_sale(amount)`: Registra la venta sumando al volumen acumulado y acredita puntos de lealtad (1 punto por cada 100,000 lamports / unidades).
* `apply_discount(points_to_redeem, sale_amount, discount_amount)` (**Mejora Vibe Coding**): Valida que `customer.loyalty_points >= points_to_redeem`, descontando los puntos aplicados y ajustando el cobro final. Si no tiene puntos suficientes, arroja `ErrorCode::InsufficientLoyaltyPoints`.
* `set_customer_status(is_active)`: Activa o desactiva la cuenta de un cliente.
* `close_customer` (**Cierre condicionado Día 5**): Solo permite cerrar cuentas si `is_active == false` (si está activo rechaza con `ErrorCode::CustomerStillActive`). Al cerrarse, transfiere todo el saldo de renta exenta (rent-exempt lamports) a la autoridad del negocio.

---

## 5. Instrucciones de Configuración y Ejecución

### Requisitos Previos
* **Node.js**: v18+ o v20+
* **Rust & Cargo**: v1.75+
* **Solana CLI & Anchor CLI**: Solana 1.18+/2.0+ y Anchor 0.30+/1.1+
* **Navegador Web con Wallet**: Extensión Phantom o Solflare configurada en **Devnet**.

### Pasos para Ejecutar Localmente

#### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd "Pos solana"
```

#### 2. Compilar el programa on-chain y ejecutar pruebas
```bash
cd program
anchor build
cargo test
```

#### 3. Generar el cliente TypeScript con Codama (opcional si ya existe)
```bash
cd ../client
npm install
npm run generate
npm run build
```

#### 4. Levantar la aplicación Frontend
```bash
cd ../frontend
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:3000` con:
* **Vista Móvil 1 (POS)**: Cobro rápido, selección de cliente PDA, entrada de monto en SOL, concepto y canje de puntos con notificación Toast.
* **Vista Móvil 2 (Expediente de Cliente)**: Perfil del cliente, visualización de PDA, volumen acumulado, saldo de puntos de fidelidad, alta de nuevos clientes y cierre condicionado de cuentas.
* **Vista PC (Dashboard de Administración)**: Panel multinavegación con métricas globales, inspector de cuentas PDA deserializadas y feed de transacciones en tiempo real.

---

## 6. Resumen de la Mejora Funcional (Vibe Coding)

* **Regla de Negocio**: Se diseñó e implementó un sistema de fidelización comercial donde cada cliente acumula puntos on-chain en proporción al volumen de sus compras (`amount / 100_000`).
* **Instrucción `apply_discount`**: Permite al cliente canjear sus puntos para reducir el importe en SOL de su compra.
* **Validación de Seguridad**: El contrato en Rust verifica estrictamente que `customer.loyalty_points >= points_to_redeem`. En caso de que un cliente intente canjear más puntos de los que posee, el contrato genera una reversión controlada con el error `InsufficientLoyaltyPoints`.

---

## 7. Tabla de Evidencias y Transacciones Verificables

| Operación | Hash / Tx Signature / Log | Estado |
| :--- | :--- | :--- |
| **Inicialización de Negocio** | `pos_solana::initialize_business` | Confirmada en Devnet / Test SVM |
| **Registro de Cliente** | `pos_solana::register_customer` | Confirmada en Devnet / Test SVM |
| **Procesamiento de Venta** | `pos_solana::process_sale` | Confirmada en Devnet / Test SVM |
| **Mejora Vibe Coding (Descuento)** | `pos_solana::apply_discount` | Confirmada en Devnet / Test SVM |
| **Prueba de Rechazo 1 (Puntos Insuficientes)** | `ErrorCode::InsufficientLoyaltyPoints` | Error Controlado Verificado |
| **Prueba de Rechazo 2 (Cierre de Cliente Activo)**| `ErrorCode::CustomerStillActive` | Error Controlado Verificado |
| **Cierre de Cuenta PDA (Baja Día 5)** | `pos_solana::close_customer` | Reembolso de renta a Autoridad Verificado |

---

## 8. Verificación de Pruebas Unitarias On-Chain (LiteSVM)
```text
running 1 test
test test_pos_solana_full_flow ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s
```

