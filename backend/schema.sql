CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums for various statuses and types
CREATE TYPE ORDER_STATUS AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE PAYMENT_STATUS AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);

CREATE TYPE DELIVERY_STATUS AS ENUM (
    'pending',
    'accepted_by_driver',
    'picked_up',
    'on_the_way',
    'delivered',
    'failed',
    'cancelled'
);

CREATE TYPE RESTAURANT_STATUS AS ENUM (
    'open',
    'closed',
    'busy',
    'temporarily_closed'
);

CREATE TYPE DISCOUNT_TYPE AS ENUM (
    'percentage',
    'fixed_amount'
);

CREATE TYPE PAYMENT_METHOD AS ENUM (
    'credit_card',
    'debit_card',
    'cash',
    'wallet',
    'bank_transfer'
);

-- Table: customers
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Hashed password
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone_number ON customers(phone_number);

-- Table: customer_addresses
CREATE TABLE customer_addresses (
    address_id BIGSERIAL PRIMARY KEY,
    customer_id UUID NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Table: drivers
CREATE TABLE drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INT,
    vehicle_color VARCHAR(30),
    vehicle_plate_number VARCHAR(20) UNIQUE NOT NULL,
    profile_picture_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_phone_number ON drivers(phone_number);
CREATE INDEX idx_drivers_availability ON drivers(is_available);
CREATE INDEX idx_drivers_location ON drivers(current_latitude, current_longitude);

-- Table: cuisines (e.g., Italian, Mexican, Indian)
CREATE TABLE cuisines (
    cuisine_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: restaurants
CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    cuisine_id BIGINT, -- Primary cuisine, could be many-to-many
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    current_status RESTAURANT_STATUS DEFAULT 'closed',
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    cover_image_url TEXT,
    minimum_order_value NUMERIC(10, 2) DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    estimated_delivery_time_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuisine
        FOREIGN KEY (cuisine_id)
        REFERENCES cuisines(cuisine_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_cuisine_id ON restaurants(cuisine_id);
CREATE INDEX idx_restaurants_status ON restaurants(current_status);

-- Table: restaurant_categories (e.g., Fast Food, Fine Dining, Cafe)
CREATE TABLE restaurant_categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for restaurants and categories (many-to-many)
CREATE TABLE restaurant_category_map (
    restaurant_id UUID NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (restaurant_id, category_id),
    CONSTRAINT fk_restaurant_map
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_category_map
        FOREIGN KEY (category_id)
        REFERENCES restaurant_categories(category_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_restaurant_category_map_restaurant_id ON restaurant_category_map(restaurant_id);
CREATE INDEX idx_restaurant_category_map_category_id ON restaurant_category_map(category_id);

-- Table: menu_item_categories (e.g., Appetizers, Main Course, Drinks, Desserts)
CREATE TABLE menu_item_categories (
    menu_category_id BIGSERIAL PRIMARY KEY,
    restaurant_id UUID NOT NULL, -- Categories are specific to a restaurant's menu
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_restaurant_menu_category UNIQUE (restaurant_id, name),
    CONSTRAINT fk_restaurant_menu_category
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_menu_item_categories_restaurant_id ON menu_item_categories(restaurant_id);

-- Table: menu_items
CREATE TABLE menu_items (
    menu_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    menu_category_id BIGINT, -- Foreign key to menu_item_categories
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    prep_time_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_restaurant_menu_item
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_menu_item_category
        FOREIGN KEY (menu_category_id)
        REFERENCES menu_item_categories(menu_category_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(menu_category_id);
CREATE INDEX idx_menu_items_availability ON menu_items(is_available);

-- Table: menu_item_options (e.g., Size, Spice Level, Add-ons)
CREATE TABLE menu_item_options (
    option_id BIGSERIAL PRIMARY KEY,
    menu_item_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Size", "Protein Choice", "Spice Level"
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE, -- e.g., size might be required
    min_selections INT DEFAULT 0, -- Minimum number of options to select (for checkboxes)
    max_selections INT DEFAULT 1, -- Maximum number of options to select (1 for radio, >1 for checkbox)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_item_option
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(menu_item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_selections CHECK (min_selections >= 0 AND max_selections >= min_selections)
);

CREATE INDEX idx_menu_item_options_menu_item_id ON menu_item_options(menu_item_id);

-- Table: menu_item_option_values (e.g., Small, Medium, Large for Size)
CREATE TABLE menu_item_option_values (
    option_value_id BIGSERIAL PRIMARY KEY,
    option_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Small", "Medium", "Large", "Chicken", "Tofu"
    price_modifier NUMERIC(10, 2) DEFAULT 0.00, -- Extra cost for this option value
    is_default BOOLEAN DEFAULT FALSE, -- Is this option value pre-selected by default?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_option_value
        FOREIGN KEY (option_id)
        REFERENCES menu_item_options(option_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_menu_item_option_values_option_id ON menu_item_option_values(option_id);

-- Table: orders
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    delivery_address_id BIGINT NOT NULL, -- The specific address customer chose for delivery
    driver_id UUID, -- Nullable initially, assigned later
    order_status ORDER_STATUS DEFAULT 'pending' NOT NULL,
    payment_status PAYMENT_STATUS DEFAULT 'pending' NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
    tax_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    special_instructions TEXT,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE, -- From restaurant's estimation
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_order
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT -- Do not delete customer if they have orders
        ON UPDATE CASCADE,
    CONSTRAINT fk_restaurant_order
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE RESTRICT -- Do not delete restaurant if it has orders
        ON UPDATE CASCADE,
    CONSTRAINT fk_delivery_address
        FOREIGN KEY (delivery_address_id)
        REFERENCES customer_addresses(address_id)
        ON DELETE RESTRICT -- Address must exist for the order
        ON UPDATE CASCADE,
    CONSTRAINT fk_driver_order
        FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE SET NULL -- If a driver is deleted, remove their association from past orders
        ON UPDATE CASCADE
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);

-- Table: order_items
CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(10, 2) NOT NULL CHECK (price_at_order >= 0), -- Price of item at the time of order
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_item
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_menu_item_ordered
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(menu_item_id)
        ON DELETE RESTRICT -- Do not delete menu item if it's part of an order
        ON UPDATE CASCADE
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Table: order_item_selected_options
CREATE TABLE order_item_selected_options (
    order_item_id BIGINT NOT NULL,
    option_value_id BIGINT NOT NULL,
    price_modifier_at_order NUMERIC(10, 2) DEFAULT 0.00, -- Price of option at the time of order
    PRIMARY KEY (order_item_id, option_value_id),
    CONSTRAINT fk_order_item_option
        FOREIGN KEY (order_item_id)
        REFERENCES order_items(order_item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_option_value_selected
        FOREIGN KEY (option_value_id)
        REFERENCES menu_item_option_values(option_value_id)
        ON DELETE RESTRICT -- Do not delete option value if it's part of an order
        ON UPDATE CASCADE
);

CREATE INDEX idx_order_item_selected_options_order_item_id ON order_item_selected_options(order_item_id);
CREATE INDEX idx_order_item_selected_options_option_value_id ON order_item_selected_options(option_value_id);

-- Table: payments
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    customer_id UUID NOT NULL, -- Redundant but good for quick lookups and integrity checks
    payment_method PAYMENT_METHOD NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    transaction_id VARCHAR(255) UNIQUE, -- From payment gateway
    payment_status PAYMENT_STATUS DEFAULT 'pending' NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_payment
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE RESTRICT -- Do not delete order if it has payment
        ON UPDATE CASCADE,
    CONSTRAINT fk_customer_payment
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT -- Do not delete customer if they have payments
        ON UPDATE CASCADE
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Table: deliveries
CREATE TABLE deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL, -- Each order has one delivery record
    driver_id UUID, -- Assigned to a driver
    delivery_status DELIVERY_STATUS DEFAULT 'pending' NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    estimated_pickup_time TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    pickup_latitude NUMERIC(10, 7),
    pickup_longitude NUMERIC(10, 7),
    delivery_latitude NUMERIC(10, 7) NOT NULL, -- From customer_addresses
    delivery_longitude NUMERIC(10, 7) NOT NULL, -- From customer_addresses
    customer_rating_for_driver INT CHECK (customer_rating_for_driver >= 1 AND customer_rating_for_driver <= 5),
    driver_rating_for_customer INT CHECK (driver_rating_for_customer >= 1 AND driver_rating_for_customer <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_delivery
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_driver_delivery
        FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);
CREATE INDEX idx_deliveries_delivery_location ON deliveries(delivery_latitude, delivery_longitude);

-- Table: reviews (for restaurants and drivers)
CREATE TABLE reviews (
    review_id BIGSERIAL PRIMARY KEY,
    customer_id UUID NOT NULL,
    order_id UUID NOT NULL,
    restaurant_id UUID, -- Review can be for restaurant
    driver_id UUID, -- Or for driver
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_review
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_order_review
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_restaurant_review
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_driver_review
        FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_review_target CHECK ((restaurant_id IS NOT NULL AND driver_id IS NULL) OR (restaurant_id IS NULL AND driver_id IS NOT NULL)) -- Review must be for EITHER restaurant OR driver
);

CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Table: promotions
CREATE TABLE promotions (
    promotion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Promo code like "SAVE10"
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type DISCOUNT_TYPE NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0), -- e.g., 10 for 10%, 5.00 for $5 off
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2), -- Optional cap on discount
    usage_limit_per_user INT DEFAULT 1,
    usage_limit_total INT, -- Null means unlimited
    applies_to_all_restaurants BOOLEAN DEFAULT TRUE, -- If TRUE, applies to all restaurants; if FALSE, use promotion_restaurants
    applies_to_all_menu_items BOOLEAN DEFAULT TRUE, -- If TRUE, applies to all menu items; if FALSE, use promotion_menu_items
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_discount_percentage CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type = 'fixed_amount')
    )
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active);

-- Table: promotion_restaurants (junction table for promotions and specific restaurants)
CREATE TABLE promotion_restaurants (
    promotion_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    PRIMARY KEY (promotion_id, restaurant_id),
    CONSTRAINT fk_promo_restaurant_promo
        FOREIGN KEY (promotion_id)
        REFERENCES promotions(promotion_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_promo_restaurant_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_promotion_restaurants_promotion_id ON promotion_restaurants(promotion_id);
CREATE INDEX idx_promotion_restaurants_restaurant_id ON promotion_restaurants(restaurant_id);

-- Table: promotion_menu_items (junction table for promotions and specific menu items)
CREATE TABLE promotion_menu_items (
    promotion_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    PRIMARY KEY (promotion_id, menu_item_id),
    CONSTRAINT fk_promo_menu_item_promo
        FOREIGN KEY (promotion_id)
        REFERENCES promotions(promotion_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_promo_menu_item_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(menu_item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_promotion_menu_items_promotion_id ON promotion_menu_items(promotion_id);
CREATE INDEX idx_promotion_menu_items_menu_item_id ON promotion_menu_items(menu_item_id);

-- Table: order_promotions (junction table for orders and applied promotions)
CREATE TABLE order_promotions (
    order_id UUID NOT NULL,
    promotion_id UUID NOT NULL,
    discount_applied NUMERIC(10, 2) NOT NULL CHECK (discount_applied >= 0),
    PRIMARY KEY (order_id, promotion_id),
    CONSTRAINT fk_order_promotion_map
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_promotion_order_map
        FOREIGN KEY (promotion_id)
        REFERENCES promotions(promotion_id)
        ON DELETE RESTRICT -- Do not delete promotion if it has been used
        ON UPDATE CASCADE
);

CREATE INDEX idx_order_promotions_order_id ON order_promotions(order_id);
CREATE INDEX idx_order_promotions_promotion_id ON order_promotions(promotion_id);

-- Trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_cuisines_updated_at
BEFORE UPDATE ON cuisines
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_restaurant_categories_updated_at
BEFORE UPDATE ON restaurant_categories
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_menu_item_categories_updated_at
BEFORE UPDATE ON menu_item_categories
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_menu_item_options_updated_at
BEFORE UPDATE ON menu_item_options
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_menu_item_option_values_updated_at
BEFORE UPDATE ON menu_item_option_values
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();