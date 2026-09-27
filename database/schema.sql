-- =====================================================================
-- AutoEquip Pro · Esquema de base de datos (TiDB / MySQL 8)
--
-- Ejecutar con:  npm run db:schema      (usa DATABASE_URL)
-- o desde la consola de TiDB Cloud importando este archivo.
-- =====================================================================

CREATE TABLE IF NOT EXISTS brands (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  country    VARCHAR(80)  NOT NULL DEFAULT '',
  logo       VARCHAR(500) NOT NULL DEFAULT '',
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_brands_name (name),
  KEY idx_brands_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS models (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  brand_id   VARCHAR(128)  NOT NULL,
  name       VARCHAR(120) NOT NULL,
  body_type  VARCHAR(60)  NOT NULL DEFAULT '',
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_models_brand (brand_id),
  CONSTRAINT fk_models_brand FOREIGN KEY (brand_id) REFERENCES brands (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS generations (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  model_id   VARCHAR(128)  NOT NULL,
  name       VARCHAR(60)  NOT NULL,
  start_year SMALLINT     NOT NULL,
  end_year   SMALLINT     NULL,
  KEY idx_generations_model (model_id),
  CONSTRAINT fk_generations_model FOREIGN KEY (model_id) REFERENCES models (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id           VARCHAR(128)  NOT NULL PRIMARY KEY,
  generation_id VARCHAR(128) NOT NULL,
  year         SMALLINT     NOT NULL,
  version      VARCHAR(80)  NOT NULL DEFAULT '',
  engine       VARCHAR(120) NOT NULL DEFAULT '',
  fuel         VARCHAR(40)  NOT NULL DEFAULT 'Gasolina',
  transmission VARCHAR(40)  NOT NULL DEFAULT 'Manual',
  drivetrain   VARCHAR(20)  NOT NULL DEFAULT 'FWD',
  body_type    VARCHAR(60)  NOT NULL DEFAULT '',
  power        SMALLINT     NOT NULL DEFAULT 0,
  displacement SMALLINT     NOT NULL DEFAULT 0,
  image        VARCHAR(500) NOT NULL DEFAULT '',
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_vehicles_generation (generation_id),
  KEY idx_vehicles_year (year),
  CONSTRAINT fk_vehicles_generation FOREIGN KEY (generation_id) REFERENCES generations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(128)  NOT NULL PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS products (
  id               VARCHAR(128)   NOT NULL PRIMARY KEY,
  sku              VARCHAR(60)   NOT NULL,
  name             VARCHAR(160)  NOT NULL,
  description      TEXT          NOT NULL,
  category_id      VARCHAR(128)   NULL,
  brand            VARCHAR(80)   NOT NULL DEFAULT '',
  price            DECIMAL(12,2) NOT NULL DEFAULT 0,
  promotional_price DECIMAL(12,2) NULL,
  stock            INT           NOT NULL DEFAULT 0,
  image            VARCHAR(500)  NOT NULL DEFAULT '',
  gallery          JSON          NULL,
  specs            JSON          NULL,
  installation     TEXT          NULL,
  tags             JSON          NULL,
  active           TINYINT(1)    NOT NULL DEFAULT 1,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category_id),
  KEY idx_products_active (active),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  product_id VARCHAR(128)  NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  KEY idx_product_images_product (product_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS compatibility (
  id         VARCHAR(128) NOT NULL PRIMARY KEY,
  product_id VARCHAR(128) NOT NULL,
  vehicle_id VARCHAR(128) NOT NULL,
  notes      VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_compat_pair (product_id, vehicle_id),
  KEY idx_compat_vehicle (vehicle_id),
  CONSTRAINT fk_compat_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_compat_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(160) NOT NULL,
  role       VARCHAR(30)  NOT NULL DEFAULT 'Editor',
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS settings (
  id                  VARCHAR(128)  NOT NULL PRIMARY KEY,
  app_name            VARCHAR(120) NOT NULL DEFAULT 'AutoEquip Pro',
  currency            VARCHAR(10)  NOT NULL DEFAULT 'USD',
  timezone            VARCHAR(60)  NOT NULL DEFAULT 'UTC',
  low_stock_threshold SMALLINT     NOT NULL DEFAULT 5,
  enable_promotions   TINYINT(1)   NOT NULL DEFAULT 1,
  default_page_size   SMALLINT     NOT NULL DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- Caja / ventas
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales (
  id             VARCHAR(128)   NOT NULL PRIMARY KEY,
  number         VARCHAR(32)    NOT NULL,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  discount       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  total          DECIMAL(12,2)  NOT NULL DEFAULT 0,
  payment_method VARCHAR(24)    NOT NULL DEFAULT 'Efectivo',
  amount_paid    DECIMAL(12,2)  NOT NULL DEFAULT 0,
  change_due     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  status         VARCHAR(24)    NOT NULL DEFAULT 'Completada',
  notes          TEXT           NULL,
  items_count    INT            NOT NULL DEFAULT 0,
  UNIQUE KEY uq_sales_number (number),
  KEY idx_sales_created (created_at),
  KEY idx_sales_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS sale_items (
  id         VARCHAR(128)  NOT NULL PRIMARY KEY,
  sale_id    VARCHAR(128)  NOT NULL,
  product_id VARCHAR(128)  NOT NULL,
  sku        VARCHAR(60)   NOT NULL DEFAULT '',
  name       VARCHAR(160)  NOT NULL DEFAULT '',
  price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity   INT           NOT NULL DEFAULT 1,
  subtotal   DECIMAL(12,2) NOT NULL DEFAULT 0,
  KEY idx_sale_items_sale (sale_id),
  KEY idx_sale_items_product (product_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO settings (id, app_name, currency, timezone, low_stock_threshold, enable_promotions, default_page_size)
VALUES ('default', 'AutoEquip Pro', 'USD', 'America/Bogota', 5, 1, 10)
ON DUPLICATE KEY UPDATE app_name = VALUES(app_name);
