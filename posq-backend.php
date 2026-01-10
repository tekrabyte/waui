<?php
/**
 * Plugin Name: POSQ Backend API - Fixed with Manual Stock for Bundles (file sebenarnya ada di server)
 * Description: Complete POSQ REST API with manual stock support for bundles
 * Version: 3.1.0
 * Author: TB
 * Text Domain: posq-backend
*/

if (!defined('ABSPATH')) exit;

// Register activation hook for database setup
register_activation_hook(__FILE__, ['posq_Backend', 'activate']);

class posq_Backend {

    const DB_VERSION = '3.1.0';

    /**
     * Plugin Activation - Create all database tables
     */
    public static function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // Add image_url columns to existing tables if they don't exist
        $packages_table = $wpdb->prefix . 'posq_packages';
        $bundles_table = $wpdb->prefix . 'posq_bundles';
        
        // Check and add image_url to packages table
        $packages_columns = $wpdb->get_col("DESCRIBE {$packages_table}");
        if (!in_array('image_url', $packages_columns)) {
            $wpdb->query("ALTER TABLE {$packages_table} ADD COLUMN image_url varchar(500) AFTER is_active");
        }
        
        // Check and add image_url to bundles table
        $bundles_columns = $wpdb->get_col("DESCRIBE {$bundles_table}");
        if (!in_array('image_url', $bundles_columns)) {
            $wpdb->query("ALTER TABLE {$bundles_table} ADD COLUMN image_url varchar(500) AFTER manual_stock");
        }

        // Table: posq_outlets
        $sql = "CREATE TABLE {$wpdb->prefix}posq_outlets (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            address text NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(1) DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_categories
        $sql = "CREATE TABLE {$wpdb->prefix}posq_categories (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(1) DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_brands
        $sql = "CREATE TABLE {$wpdb->prefix}posq_brands (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(1) DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_products
        $sql = "CREATE TABLE {$wpdb->prefix}posq_products (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            price bigint(20) NOT NULL DEFAULT 0,
            stock bigint(20) NOT NULL DEFAULT 0,
            outlet_id bigint(20) UNSIGNED NOT NULL,
            category_id bigint(20) UNSIGNED NULL,
            brand_id bigint(20) UNSIGNED NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_deleted tinyint(1) DEFAULT 0,
            description text,
            image_url varchar(500),
            PRIMARY KEY (id),
            KEY outlet_id (outlet_id),
            KEY category_id (category_id),
            KEY brand_id (brand_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_packages
        $sql = "CREATE TABLE {$wpdb->prefix}posq_packages (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            price bigint(20) NOT NULL,
            outlet_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(1) DEFAULT 1,
            image_url varchar(500),
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_package_components
        $sql = "CREATE TABLE {$wpdb->prefix}posq_package_components (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            package_id bigint(20) UNSIGNED NOT NULL,
            product_id bigint(20) UNSIGNED NOT NULL,
            quantity int(11) NOT NULL DEFAULT 1,
            PRIMARY KEY (id),
            KEY package_id (package_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_bundles - UPDATED WITH MANUAL STOCK FIELDS
        $sql = "CREATE TABLE {$wpdb->prefix}posq_bundles (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            price bigint(20) NOT NULL,
            outlet_id bigint(20) UNSIGNED NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(1) DEFAULT 1,
            manual_stock_enabled tinyint(1) DEFAULT 0,
            manual_stock bigint(20) NULL,
            image_url varchar(500),
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_bundle_items
        $sql = "CREATE TABLE {$wpdb->prefix}posq_bundle_items (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            bundle_id bigint(20) UNSIGNED NOT NULL,
            product_id bigint(20) UNSIGNED NULL,
            package_id bigint(20) UNSIGNED NULL,
            quantity int(11) NOT NULL DEFAULT 1,
            is_package tinyint(1) DEFAULT 0,
            PRIMARY KEY (id),
            KEY bundle_id (bundle_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_transactions
        $sql = "CREATE TABLE {$wpdb->prefix}posq_transactions (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            outlet_id bigint(20) UNSIGNED NOT NULL,
            total bigint(20) NOT NULL,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY outlet_id (outlet_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_transaction_items
        $sql = "CREATE TABLE {$wpdb->prefix}posq_transaction_items (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            transaction_id bigint(20) UNSIGNED NOT NULL,
            product_id bigint(20) UNSIGNED NOT NULL,
            quantity int(11) NOT NULL,
            price bigint(20) NOT NULL,
            is_package tinyint(1) DEFAULT 0,
            is_bundle tinyint(1) DEFAULT 0,
            PRIMARY KEY (id),
            KEY transaction_id (transaction_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_payment_methods
        $sql = "CREATE TABLE {$wpdb->prefix}posq_payment_methods (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            transaction_id bigint(20) UNSIGNED NOT NULL,
            category varchar(50) NOT NULL,
            sub_category varchar(50),
            method_name varchar(255) NOT NULL,
            amount bigint(20) NOT NULL,
            PRIMARY KEY (id),
            KEY transaction_id (transaction_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_stock_logs
        $sql = "CREATE TABLE {$wpdb->prefix}posq_stock_logs (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id bigint(20) UNSIGNED NOT NULL,
            outlet_id bigint(20) UNSIGNED NOT NULL,
            operation varchar(50) NOT NULL,
            quantity int(11) NOT NULL,
            from_outlet_id bigint(20) UNSIGNED NULL,
            to_outlet_id bigint(20) UNSIGNED NULL,
            user_id bigint(20) UNSIGNED NOT NULL,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            reference_transaction_id bigint(20) UNSIGNED NULL,
            PRIMARY KEY (id),
            KEY product_id (product_id),
            KEY outlet_id (outlet_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_expenses
        $sql = "CREATE TABLE {$wpdb->prefix}posq_expenses (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            amount bigint(20) NOT NULL,
            category varchar(100),
            outlet_id bigint(20) UNSIGNED NOT NULL,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            note text,
            PRIMARY KEY (id),
            KEY outlet_id (outlet_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_user_profiles
        $sql = "CREATE TABLE {$wpdb->prefix}posq_user_profiles (
            user_id bigint(20) UNSIGNED NOT NULL,
            name varchar(255) NOT NULL,
            outlet_id bigint(20) UNSIGNED NULL,
            role varchar(50) NOT NULL DEFAULT 'cashier',
            PRIMARY KEY (user_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_customers
        $sql = "CREATE TABLE {$wpdb->prefix}posq_customers (
              id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
              name varchar(255) NOT NULL,
              email varchar(100),
              phone varchar(20),
              address text,
              created_at datetime DEFAULT CURRENT_TIMESTAMP,
              is_active tinyint(1) DEFAULT 1,
              PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta($sql);

        // Table: posq_menu_access
        $sql = "CREATE TABLE {$wpdb->prefix}posq_menu_access (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            role varchar(50) NOT NULL,
            menu varchar(100) NOT NULL,
            is_accessible tinyint(1) DEFAULT 1,
            PRIMARY KEY (id),
            UNIQUE KEY role_menu (role, menu)
        ) $charset_collate;";
        dbDelta($sql);

        // Insert default menu access config
        self::insert_default_menu_access();

        // Migration: Allow NULL for outlet_id in posq_bundles to support factory bundles
        $wpdb->query("ALTER TABLE {$wpdb->prefix}posq_bundles MODIFY COLUMN outlet_id bigint(20) UNSIGNED NULL");

        update_option('posq_db_version', self::DB_VERSION);
    }

    /**
     * Insert default menu access configuration
     */
    private static function insert_default_menu_access() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_menu_access';

        $defaults = [
            // Cashier
            ['cashier', 'dashboard', 1],
            ['cashier', 'pos', 1],
            ['cashier', 'products', 1],
            ['cashier', 'reports', 0],
            ['cashier', 'stock', 0],
            ['cashier', 'staff', 0],
            ['cashier', 'outlets', 0],
            ['cashier', 'categories', 0],
            ['cashier', 'settings', 0],
            // Manager
            ['manager', 'dashboard', 1],
            ['manager', 'pos', 0],
            ['manager', 'products', 1],
            ['manager', 'reports', 1],
            ['manager', 'stock', 1],
            ['manager', 'staff', 1],
            ['manager', 'outlets', 0],
            ['manager', 'categories', 1],
            ['manager', 'settings', 0],
            // Owner
            ['owner', 'dashboard', 1],
            ['owner', 'pos', 1],
            ['owner', 'products', 1],
            ['owner', 'reports', 1],
            ['owner', 'stock', 1],
            ['owner', 'staff', 1],
            ['owner', 'outlets', 1],
            ['owner', 'categories', 1],
            ['owner', 'settings', 1],
        ];

        foreach ($defaults as $row) {
            $wpdb->replace($table, [
                'role' => $row[0],
                'menu' => $row[1],
                'is_accessible' => $row[2]
            ]);
        }
    }

    /**
     * Initialize plugin hooks
     */
    public static function init() {
        // CORS Handling
        add_action('init', [self::class, 'handle_cors'], 0);

        // REST API Routes
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    /**
     * Handle CORS
     */
    public static function handle_cors() {
        $origin = get_http_origin();
        $allowed = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'http://localhost:5174',
            'https://erpos.tekrabyte.id',
        ];

        if ($origin && in_array($origin, $allowed, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
            header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Posq-Token");
        }

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
    }

    /**
     * Register all REST API routes
     */
    public static function register_routes() {
        $namespace = 'posq/v1';

        // Auth routes
        register_rest_route($namespace, '/auth/login', [
            'methods' => 'POST',
            'callback' => [self::class, 'login'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route($namespace, '/auth/me', [
            'methods' => 'GET',
            'callback' => [self::class, 'auth_me'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/auth/is-admin', [
            'methods' => 'GET',
            'callback' => [self::class, 'is_admin'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        // Users
        register_rest_route($namespace, '/users', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_users'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'wp_create_user'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/users/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_user'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_user'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Outlets
        register_rest_route($namespace, '/outlets', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_outlets'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_outlet'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/outlets/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_outlet'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_outlet'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Categories
        register_rest_route($namespace, '/categories', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_categories'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_category'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/categories/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_category'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_category'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Brands
        register_rest_route($namespace, '/brands', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_brands'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_brand'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/brands/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_brand'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_brand'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Products
        register_rest_route($namespace, '/products', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_products'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_product'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/products/search', [
            'methods' => 'GET',
            'callback' => [self::class, 'search_products'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/products/(?P<id>\d+)', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_product'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'PUT', 'callback' => [self::class, 'update_product'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_product'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Packages
        register_rest_route($namespace, '/packages', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_packages'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_package'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/packages/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_package'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_package'], 'permission_callback' => [self::class, 'check_owner']]
        ]);
        
        // Customers
        register_rest_route($namespace, '/customers', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_customers'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_customer'], 'permission_callback' => [self::class, 'check_auth']]
        ]);

        register_rest_route($namespace, '/customers/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_customer']  , 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_customer'], 'permission_callback' => [self::class, 'check_auth']]
        ]);

        // Bundles
        register_rest_route($namespace, '/bundles', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_bundles'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_bundle'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/bundles/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_bundle'], 'permission_callback' => [self::class, 'check_owner']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_bundle'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        // Stock Management
        register_rest_route($namespace, '/stock/add', [
            'methods' => 'POST',
            'callback' => [self::class, 'add_stock'],
            'permission_callback' => [self::class, 'check_manager']
        ]);

        register_rest_route($namespace, '/stock/reduce', [
            'methods' => 'POST',
            'callback' => [self::class, 'reduce_stock'],
            'permission_callback' => [self::class, 'check_manager']
        ]);

        register_rest_route($namespace, '/stock/transfer', [
            'methods' => 'POST',
            'callback' => [self::class, 'transfer_stock'],
            'permission_callback' => [self::class, 'check_manager']
        ]);

        register_rest_route($namespace, '/stock/logs', [
            'methods' => 'GET',
            'callback' => [self::class, 'get_stock_logs'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        // Transactions
        register_rest_route($namespace, '/transactions', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_transactions'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_transaction'], 'permission_callback' => [self::class, 'check_auth']]
        ]);

        // Expenses
        register_rest_route($namespace, '/expenses', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_expenses'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'create_expense'], 'permission_callback' => [self::class, 'check_auth']]
        ]);

        register_rest_route($namespace, '/expenses/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [self::class, 'update_expense'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'DELETE', 'callback' => [self::class, 'delete_expense'], 'permission_callback' => [self::class, 'check_auth']]
        ]);

        // Reports
        register_rest_route($namespace, '/reports/top-outlets', [
            'methods' => 'GET',
            'callback' => [self::class, 'report_top_outlets'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/reports/daily-summary', [
            'methods' => 'GET',
            'callback' => [self::class, 'report_daily_summary'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/reports/overall-summary', [
            'methods' => 'GET',
            'callback' => [self::class, 'report_overall_summary'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/reports/best-sellers', [
            'methods' => 'GET',
            'callback' => [self::class, 'report_best_sellers'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        // Image Upload
        register_rest_route($namespace, '/upload-image', [
            'methods' => 'POST',
            'callback' => [self::class, 'upload_image'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        register_rest_route($namespace, '/reports/cashflow', [
            'methods' => 'GET',
            'callback' => [self::class, 'report_cashflow'],
            'permission_callback' => [self::class, 'check_auth']
        ]);

        // Menu Access
        register_rest_route($namespace, '/settings/menu-access', [
            ['methods' => 'GET', 'callback' => [self::class, 'get_menu_access'], 'permission_callback' => [self::class, 'check_auth']],
            ['methods' => 'POST', 'callback' => [self::class, 'save_menu_access'], 'permission_callback' => [self::class, 'check_owner']]
        ]);

        register_rest_route($namespace, '/settings/role-menu-access', [
            'methods' => 'GET',
            'callback' => [self::class, 'get_role_menu_access'],
            'permission_callback' => [self::class, 'check_auth']
        ]);
    }

    // ===== AUTH & PERMISSION HELPERS =====

    private static function get_token_from_request($request) {
        $auth_header = $request->get_header('authorization');
        if ($auth_header && preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
            return trim($matches[1]);
        }
        $x_token = $request->get_header('x-posq-token');
        return $x_token ? trim($x_token) : null;
    }

    public static function check_auth($request) {
        $token = self::get_token_from_request($request);
        if (!$token) return false;

        global $wpdb;
        $user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = 'posq_api_token' AND meta_value = %s LIMIT 1",
            $token
        ));

        if ($user_id) {
            wp_set_current_user($user_id);
            return true;
        }
        return false;
    }

    private static function is_owner($user_id = null) {
        if (!$user_id) $user_id = get_current_user_id();
        $user = new WP_User($user_id);
        return in_array('administrator', (array) $user->roles);
    }

    private static function get_user_role($user_id = null) {
        if (!$user_id) $user_id = get_current_user_id();
        
        if (self::is_owner($user_id)) {
            return 'owner';
        }

        global $wpdb;
        $profile = $wpdb->get_row($wpdb->prepare(
            "SELECT role FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
            $user_id
        ));

        return $profile ? $profile->role : 'cashier';
    }

    public static function check_owner($request) {
        if (!self::check_auth($request)) return false;
        return self::is_owner();
    }

    public static function check_manager($request) {
        if (!self::check_auth($request)) return false;
        $role = self::get_user_role();
        return in_array($role, ['owner', 'manager']);
    }

    private static function can_access_outlet($outlet_id) {
        $user_id = get_current_user_id();
        if (self::is_owner($user_id)) return true;

        global $wpdb;
        $profile = $wpdb->get_row($wpdb->prepare(
            "SELECT outlet_id FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
            $user_id
        ));

        return $profile && $profile->outlet_id == $outlet_id;
    }

    // ===== AUTH ENDPOINTS =====

    public static function login($request) {
        $data = $request->get_json_params();
        
        if (empty($data['username']) || empty($data['password'])) {
            return new WP_Error('bad_request', 'Missing credentials', ['status' => 400]);
        }

        $user = wp_authenticate($data['username'], $data['password']);
        
        if (is_wp_error($user)) {
            return new WP_Error('invalid_login', 'Invalid credentials', ['status' => 401]);
        }

        $token = bin2hex(random_bytes(32));
        update_user_meta($user->ID, 'posq_api_token', $token);

        return [
            'success' => true,
            'token' => $token,
            'user' => self::format_user_data($user)
        ];
    }

    public static function auth_me() {
        $user = wp_get_current_user();
        return [
            'success' => true,
            'user' => self::format_user_data($user)
        ];
    }

    public static function is_admin() {
        return ['isAdmin' => self::is_owner()];
    }

    /**
     * Upload image to WordPress Media Library
     */
    public static function upload_image($request) {
        $files = $request->get_file_params();
        
        if (empty($files['image'])) {
            return new WP_Error('no_image', 'No image file provided', ['status' => 400]);
        }

        $file = $files['image'];
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            return new WP_Error('invalid_type', 'Invalid file type. Only JPG, PNG, GIF, and WEBP allowed', ['status' => 400]);
        }

        // Validate file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            return new WP_Error('file_too_large', 'File size exceeds 5MB limit', ['status' => 400]);
        }

        // WordPress media upload
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $upload = wp_handle_upload($file, ['test_form' => false]);
        
        if (isset($upload['error'])) {
            return new WP_Error('upload_failed', $upload['error'], ['status' => 500]);
        }

        // Crop image to 1:1 (square) ratio
        $cropped_file = self::crop_image_to_square($upload['file']);
        
        if (is_wp_error($cropped_file)) {
            // If crop fails, continue with original image
            $final_file = $upload['file'];
            $final_url = $upload['url'];
        } else {
            $final_file = $cropped_file;
            // Get the new URL for cropped image
            $upload_dir = wp_upload_dir();
            $final_url = str_replace($upload_dir['path'], $upload_dir['url'], $cropped_file);
        }

        // Create attachment
        $attachment = [
            'post_mime_type' => $upload['type'],
            'post_title' => sanitize_file_name($file['name']),
            'post_content' => '',
            'post_status' => 'inherit'
        ];

        $attachment_id = wp_insert_attachment($attachment, $final_file);
        
        if (is_wp_error($attachment_id)) {
            return new WP_Error('attachment_failed', 'Failed to create attachment', ['status' => 500]);
        }

        // Generate metadata
        $attachment_data = wp_generate_attachment_metadata($attachment_id, $final_file);
        wp_update_attachment_metadata($attachment_id, $attachment_data);

        return [
            'success' => true,
            'url' => $final_url,
            'attachment_id' => $attachment_id
        ];
    }

    /**
     * Crop image to 1:1 square ratio
     */
    private static function crop_image_to_square($file_path) {
        $image_editor = wp_get_image_editor($file_path);
        
        if (is_wp_error($image_editor)) {
            return $image_editor;
        }

        $size = $image_editor->get_size();
        $width = $size['width'];
        $height = $size['height'];

        // Calculate crop dimensions for 1:1 ratio
        $new_size = min($width, $height);
        $x = ($width - $new_size) / 2;
        $y = ($height - $new_size) / 2;

        // Crop to square
        $image_editor->crop($x, $y, $new_size, $new_size);

        // Save cropped image
        $saved = $image_editor->save($file_path);
        
        if (is_wp_error($saved)) {
            return $saved;
        }

        return $saved['path'];
    }

    private static function format_user_data($user) {
        global $wpdb;
        
        $profile = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
            $user->ID
        ));

        $role = self::get_user_role($user->ID);

        return [
            'id' => (string) $user->ID,
            'name' => $profile ? $profile->name : $user->display_name,
            'email' => $user->user_email,
            'username' => $user->user_login,
            'role' => $role,
            'outletId' => $profile && $profile->outlet_id ? (string) $profile->outlet_id : null,
            'status' => 'active',
            'avatar' => get_avatar_url($user->ID),
            'is_admin' => self::is_owner($user->ID)
        ];
    }

    // ===== USERS CRUD =====

    public static function get_users() {
        $users = get_users();
        $data = [];
        foreach ($users as $user) {
            $data[] = self::format_user_data($user);
        }
        return $data;
    }

    public static function wp_create_user($request) {
        $data = $request->get_json_params();

        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        $user_id = wp_create_user($data['username'], $data['password'], $data['email']);
        
        if (is_wp_error($user_id)) {
            return new WP_Error('create_failed', $user_id->get_error_message(), ['status' => 500]);
        }

        // Create user profile
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_user_profiles', [
            'user_id' => $user_id,
            'name' => !empty($data['name']) ? sanitize_text_field($data['name']) : $data['username'],
            'outlet_id' => !empty($data['outletId']) ? intval($data['outletId']) : null,
            'role' => !empty($data['role']) ? sanitize_text_field($data['role']) : 'cashier'
        ]);

        return ['success' => true, 'id' => $user_id];
    }

    public static function update_user($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        
        $update_data = [];
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['outletId'])) $update_data['outlet_id'] = $data['outletId'] ? intval($data['outletId']) : null;
        if (!empty($data['role'])) $update_data['role'] = sanitize_text_field($data['role']);

        if (!empty($update_data)) {
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT user_id FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
                $id
            ));

            if ($exists) {
                $wpdb->update(
                    $wpdb->prefix . 'posq_user_profiles',
                    $update_data,
                    ['user_id' => $id]
                );
            } else {
                $update_data['user_id'] = $id;
                if (!isset($update_data['name'])) $update_data['name'] = get_userdata($id)->display_name;
                if (!isset($update_data['role'])) $update_data['role'] = 'cashier';
                $wpdb->insert($wpdb->prefix . 'posq_user_profiles', $update_data);
            }
        }

        if (!empty($data['password'])) {
            wp_update_user(['ID' => $id, 'user_pass' => $data['password']]);
        }

        return ['success' => true];
    }

    public static function delete_user($request) {
        $id = (int) $request['id'];
        
        if ($id === get_current_user_id()) {
            return new WP_Error('delete_self', 'Cannot delete self', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->delete($wpdb->prefix . 'posq_user_profiles', ['user_id' => $id]);

        require_once(ABSPATH . 'wp-admin/includes/user.php');
        $result = wp_delete_user($id, get_current_user_id());

        return $result ? ['success' => true] : new WP_Error('failed', 'Delete failed');
    }

    // ===== OUTLETS CRUD =====

    public static function get_outlets() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_outlets';
        
        $outlets = $wpdb->get_results("SELECT * FROM $table WHERE is_active = 1 ORDER BY id DESC");
        
        $data = [];
        foreach ($outlets as $outlet) {
            $data[] = [
                'id' => (int) $outlet->id,
                'name' => $outlet->name,
                'address' => $outlet->address,
                'created_at' => $outlet->created_at,
                'is_active' => (bool) $outlet->is_active
            ];
        }
        
        return $data;
    }

    public static function create_outlet($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name']) || empty($data['address'])) {
            return new WP_Error('missing_fields', 'Name and address required', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_outlets', [
            'name' => sanitize_text_field($data['name']),
            'address' => sanitize_textarea_field($data['address']),
            'is_active' => 1
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_outlet($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (!empty($data['address'])) $update_data['address'] = sanitize_textarea_field($data['address']);
        if (isset($data['is_active'])) $update_data['is_active'] = (int) $data['is_active'];

        $wpdb->update(
            $wpdb->prefix . 'posq_outlets',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_outlet($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        $wpdb->delete($wpdb->prefix . 'posq_outlets', ['id' => $id]);

        return ['success' => true];
    }

    // ===== CATEGORIES CRUD =====

    public static function get_categories() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_categories';
        
        $categories = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
        
        $data = [];
        foreach ($categories as $cat) {
            $data[] = [
                'id' => (int) $cat->id,
                'name' => $cat->name,
                'description' => $cat->description,
                'created_at' => $cat->created_at,
                'is_active' => (bool) $cat->is_active
            ];
        }
        
        return $data;
    }

    public static function create_category($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name'])) {
            return new WP_Error('missing_fields', 'Name required', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_categories', [
            'name' => sanitize_text_field($data['name']),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'is_active' => 1
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_category($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['description'])) $update_data['description'] = sanitize_textarea_field($data['description']);
        if (isset($data['is_active'])) $update_data['is_active'] = (int) $data['is_active'];

        $wpdb->update(
            $wpdb->prefix . 'posq_categories',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_category($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        
        // Check if any products use this category
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}posq_products WHERE category_id = %d AND is_deleted = 0",
            $id
        ));
        
        if ($count > 0) {
            return new WP_Error('in_use', 'Cannot delete category: products are using it', ['status' => 400]);
        }

        $wpdb->delete($wpdb->prefix . 'posq_categories', ['id' => $id]);

        return ['success' => true];
    }

    // ===== BRANDS CRUD =====

    public static function get_brands() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_brands';
        
        $brands = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
        
        $data = [];
        foreach ($brands as $brand) {
            $data[] = [
                'id' => (int) $brand->id,
                'name' => $brand->name,
                'description' => $brand->description,
                'created_at' => $brand->created_at,
                'is_active' => (bool) $brand->is_active
            ];
        }
        
        return $data;
    }

    public static function create_brand($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name'])) {
            return new WP_Error('missing_fields', 'Name required', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_brands', [
            'name' => sanitize_text_field($data['name']),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'is_active' => 1
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_brand($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['description'])) $update_data['description'] = sanitize_textarea_field($data['description']);
        if (isset($data['is_active'])) $update_data['is_active'] = (int) $data['is_active'];

        $wpdb->update(
            $wpdb->prefix . 'posq_brands',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_brand($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        
        // Check if any products use this brand
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}posq_products WHERE brand_id = %d AND is_deleted = 0",
            $id
        ));
        
        if ($count > 0) {
            return new WP_Error('in_use', 'Cannot delete brand: products are using it', ['status' => 400]);
        }

        $wpdb->delete($wpdb->prefix . 'posq_brands', ['id' => $id]);

        return ['success' => true];
    }

    // ===== PRODUCTS CRUD =====

    public static function get_products() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_products';
        
        $products = $wpdb->get_results("
            SELECT p.*, c.name as category_name, b.name as brand_name
            FROM $table p
            LEFT JOIN {$wpdb->prefix}posq_categories c ON p.category_id = c.id
            LEFT JOIN {$wpdb->prefix}posq_brands b ON p.brand_id = b.id
            WHERE p.is_deleted = 0
            ORDER BY p.id DESC
        ");
        
        $data = [];
        foreach ($products as $product) {
            $data[] = [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => (int) $product->price,
                'stock' => (int) $product->stock,
                'outlet_id' => (string) $product->outlet_id,
                'category_id' => $product->category_id ? (int) $product->category_id : null,
                'category_name' => $product->category_name ?? 'Uncategorized',
                'brand_id' => $product->brand_id ? (int) $product->brand_id : null,
                'brand_name' => $product->brand_name ?? null,
                'description' => $product->description,
                'image_url' => $product->image_url,
                'created_at' => $product->created_at,
                'is_active' => true
            ];
        }
        
        return $data;
    }

    public static function get_product($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT p.*, c.name as category_name, b.name as brand_name
            FROM {$wpdb->prefix}posq_products p
            LEFT JOIN {$wpdb->prefix}posq_categories c ON p.category_id = c.id
            LEFT JOIN {$wpdb->prefix}posq_brands b ON p.brand_id = b.id
            WHERE p.id = %d AND p.is_deleted = 0",
            $id
        ));

        if (!$product) {
            return new WP_Error('not_found', 'Product not found', ['status' => 404]);
        }

        return [
            'id' => (string) $product->id,
            'name' => $product->name,
            'price' => (int) $product->price,
            'stock' => (int) $product->stock,
            'outlet_id' => (string) $product->outlet_id,
            'category_id' => $product->category_id ? (int) $product->category_id : null,
            'category_name' => $product->category_name ?? 'Uncategorized',
            'brand_id' => $product->brand_id ? (int) $product->brand_id : null,
            'brand_name' => $product->brand_name ?? null,
            'description' => $product->description,
            'image_url' => $product->image_url,
            'created_at' => $product->created_at
        ];
    }

    public static function search_products($request) {
        $keyword = $request->get_param('keyword') ?? '';
        $outlet_id = $request->get_param('outletId');
        $category_id = $request->get_param('categoryId');
        $brand_id = $request->get_param('brandId');

        global $wpdb;
        $where = ["p.is_deleted = 0"];
        $params = [];

        if (!empty($keyword)) {
            $where[] = "p.name LIKE %s";
            $params[] = '%' . $wpdb->esc_like($keyword) . '%';
        }

        if ($outlet_id) {
            $where[] = "p.outlet_id = %d";
            $params[] = $outlet_id;
        }

        if ($category_id) {
            $where[] = "p.category_id = %d";
            $params[] = $category_id;
        }

        if ($brand_id) {
            $where[] = "p.brand_id = %d";
            $params[] = $brand_id;
        }

        $where_clause = implode(' AND ', $where);
        $query = "SELECT p.*, c.name as category_name, b.name as brand_name
                  FROM {$wpdb->prefix}posq_products p
                  LEFT JOIN {$wpdb->prefix}posq_categories c ON p.category_id = c.id
                  LEFT JOIN {$wpdb->prefix}posq_brands b ON p.brand_id = b.id
                  WHERE $where_clause
                  ORDER BY p.id DESC";

        if (!empty($params)) {
            $query = $wpdb->prepare($query, $params);
        }

        $products = $wpdb->get_results($query);
        
        $data = [];
        foreach ($products as $product) {
            $data[] = [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => (int) $product->price,
                'stock' => (int) $product->stock,
                'outlet_id' => (string) $product->outlet_id,
                'category_id' => $product->category_id ? (int) $product->category_id : null,
                'category_name' => $product->category_name ?? 'Uncategorized',
                'brand_id' => $product->brand_id ? (int) $product->brand_id : null,
                'description' => $product->description,
                'image_url' => $product->image_url
            ];
        }
        
        return $data;
    }

    public static function create_product($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name']) || !isset($data['price']) || !isset($data['outletId'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_products', [
            'name' => sanitize_text_field($data['name']),
            'price' => (int) $data['price'],
            'stock' => isset($data['stock']) ? (int) $data['stock'] : 0,
            'outlet_id' => (int) $data['outletId'],
            'category_id' => !empty($data['categoryId']) ? (int) $data['categoryId'] : null,
            'brand_id' => !empty($data['brandId']) ? (int) $data['brandId'] : null,
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'image_url' => esc_url_raw($data['image_url'] ?? ''),
            'is_deleted' => 0
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_product($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['price'])) $update_data['price'] = (int) $data['price'];
        if (isset($data['stock'])) $update_data['stock'] = (int) $data['stock'];
        if (isset($data['outletId'])) $update_data['outlet_id'] = (int) $data['outletId'];
        if (isset($data['categoryId'])) $update_data['category_id'] = $data['categoryId'] ? (int) $data['categoryId'] : null;
        if (isset($data['brandId'])) $update_data['brand_id'] = $data['brandId'] ? (int) $data['brandId'] : null;
        if (isset($data['description'])) $update_data['description'] = sanitize_textarea_field($data['description']);
        if (isset($data['image_url'])) $update_data['image_url'] = esc_url_raw($data['image_url']);

        $wpdb->update(
            $wpdb->prefix . 'posq_products',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_product($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        $wpdb->update(
            $wpdb->prefix . 'posq_products',
            ['is_deleted' => 1],
            ['id' => $id]
        );

        return ['success' => true];
    }

    // ===== PACKAGES CRUD =====

    public static function get_packages() {
        global $wpdb;
        $packages_table = $wpdb->prefix . 'posq_packages';
        $components_table = $wpdb->prefix . 'posq_package_components';
        
        $packages = $wpdb->get_results("SELECT * FROM $packages_table WHERE is_active = 1 ORDER BY id DESC");
        
        $data = [];
        foreach ($packages as $package) {
            $components = $wpdb->get_results($wpdb->prepare(
                "SELECT pc.*, p.name as product_name
                FROM $components_table pc
                LEFT JOIN {$wpdb->prefix}posq_products p ON pc.product_id = p.id
                WHERE pc.package_id = %d",
                $package->id
            ));

            $items = [];
            foreach ($components as $comp) {
                $items[] = [
                    'product_id' => (int) $comp->product_id,
                    'product_name' => $comp->product_name,
                    'quantity' => (int) $comp->quantity
                ];
            }

            $data[] = [
                'id' => (string) $package->id,
                'name' => $package->name,
                'price' => (int) $package->price,
                'outlet_id' => (string) $package->outlet_id,
                'components' => $items,
                'created_at' => $package->created_at,
                'is_active' => (bool) $package->is_active,
                'image_url' => $package->image_url ?? null
            ];
        }
        
        return $data;
    }

    public static function create_package($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name']) || !isset($data['price']) || empty($data['components'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        
        // Support both imageUrl and image_url for compatibility
        $image_url = !empty($data['imageUrl']) ? $data['imageUrl'] : (!empty($data['image_url']) ? $data['image_url'] : null);
        
        // Insert package
        $wpdb->insert($wpdb->prefix . 'posq_packages', [
            'name' => sanitize_text_field($data['name']),
            'price' => (int) $data['price'],
            'outlet_id' => (int) $data['outletId'],
            'is_active' => 1,
            'image_url' => !empty($image_url) ? esc_url_raw($image_url) : null
        ]);

        $package_id = $wpdb->insert_id;

        // Insert components
        foreach ($data['components'] as $comp) {
            $wpdb->insert($wpdb->prefix . 'posq_package_components', [
                'package_id' => $package_id,
                'product_id' => (int) $comp['productId'],
                'quantity' => (int) $comp['quantity']
            ]);
        }

        return ['success' => true, 'id' => $package_id];
    }

    public static function update_package($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        
        // Update package
        $update_data = [];
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['price'])) $update_data['price'] = (int) $data['price'];
        
        // Support both imageUrl and image_url for compatibility
        if (isset($data['imageUrl']) || isset($data['image_url'])) {
            $image_url = !empty($data['imageUrl']) ? $data['imageUrl'] : (!empty($data['image_url']) ? $data['image_url'] : null);
            $update_data['image_url'] = !empty($image_url) ? esc_url_raw($image_url) : null;
        }

        if (!empty($update_data)) {
            $wpdb->update(
                $wpdb->prefix . 'posq_packages',
                $update_data,
                ['id' => $id]
            );
        }

        // Update components if provided
        if (isset($data['components'])) {
            // Delete old components
            $wpdb->delete($wpdb->prefix . 'posq_package_components', ['package_id' => $id]);

            // Insert new components
            foreach ($data['components'] as $comp) {
                $wpdb->insert($wpdb->prefix . 'posq_package_components', [
                    'package_id' => $id,
                    'product_id' => (int) $comp['productId'],
                    'quantity' => (int) $comp['quantity']
                ]);
            }
        }

        return ['success' => true];
    }

    public static function delete_package($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        
        // Delete components first
        $wpdb->delete($wpdb->prefix . 'posq_package_components', ['package_id' => $id]);
        
        // Delete package
        $wpdb->delete($wpdb->prefix . 'posq_packages', ['id' => $id]);

        return ['success' => true];
    }

    // ===== BUNDLES CRUD - FIXED WITH MANUAL STOCK SUPPORT =====

    public static function get_bundles() {
        global $wpdb;
        $bundles_table = $wpdb->prefix . 'posq_bundles';
        $items_table = $wpdb->prefix . 'posq_bundle_items';
        
        $bundles = $wpdb->get_results("SELECT * FROM $bundles_table WHERE is_active = 1 ORDER BY id DESC");
        
        $data = [];
        foreach ($bundles as $bundle) {
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT bi.*, p.name as product_name, pkg.name as package_name
                FROM $items_table bi
                LEFT JOIN {$wpdb->prefix}posq_products p ON bi.product_id = p.id
                LEFT JOIN {$wpdb->prefix}posq_packages pkg ON bi.package_id = pkg.id
                WHERE bi.bundle_id = %d",
                $bundle->id
            ));

            $bundle_items = [];
            foreach ($items as $item) {
                $bundle_items[] = [
                    'product_id' => $item->product_id ? (int) $item->product_id : null,
                    'package_id' => $item->package_id ? (int) $item->package_id : null,
                    'quantity' => (int) $item->quantity,
                    'is_package' => (bool) $item->is_package,
                    'name' => $item->is_package ? $item->package_name : $item->product_name
                ];
            }

            $data[] = [
                'id' => (string) $bundle->id,
                'name' => $bundle->name,
                'price' => (int) $bundle->price,
                'outlet_id' => (string) $bundle->outlet_id,
                'items' => $bundle_items,
                'created_at' => $bundle->created_at,
                'is_active' => (bool) $bundle->is_active,
                // PERBAIKAN: Return manual stock fields
                'manual_stock_enabled' => (bool) $bundle->manual_stock_enabled,
                'manual_stock' => $bundle->manual_stock !== null ? (int) $bundle->manual_stock : null,
                'image_url' => $bundle->image_url ?? null
            ];
        }
        
        return $data;
    }

    public static function create_bundle($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name']) || !isset($data['price']) || empty($data['items'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        
        // PERBAIKAN: Prepare manual stock data
        $manual_stock_enabled = !empty($data['manualStockEnabled']) ? 1 : 0;
        $manual_stock = null;
        
        if ($manual_stock_enabled && isset($data['manualStock'])) {
            $manual_stock = (int) $data['manualStock'];
        }
        
        // PERBAIKAN: Handle factory bundle (outletId = null)
        $outlet_id = null;
        if (isset($data['outletId']) && $data['outletId'] !== '' && $data['outletId'] !== null && $data['outletId'] !== 'null') {
            $outlet_id = (int) $data['outletId'];
        }
        
        // Support both imageUrl and image_url for compatibility
        $image_url = !empty($data['imageUrl']) ? $data['imageUrl'] : (!empty($data['image_url']) ? $data['image_url'] : null);
        
        // Insert bundle with manual stock fields
        $result = $wpdb->insert($wpdb->prefix . 'posq_bundles', [
            'name' => sanitize_text_field($data['name']),
            'price' => (int) $data['price'],
            'outlet_id' => $outlet_id,
            'is_active' => 1,
            'manual_stock_enabled' => $manual_stock_enabled,
            'manual_stock' => $manual_stock,
            'image_url' => !empty($image_url) ? esc_url_raw($image_url) : null
        ]);

        if ($result === false) {
            error_log('Failed to insert bundle: ' . $wpdb->last_error);
            return new WP_Error('db_insert_error', 'Failed to create bundle: ' . $wpdb->last_error, ['status' => 500]);
        }

        $bundle_id = $wpdb->insert_id;

        if (!$bundle_id) {
            error_log('Failed to get bundle ID after insert');
            return new WP_Error('db_insert_error', 'Failed to get bundle ID', ['status' => 500]);
        }

        // Insert items
        foreach ($data['items'] as $item) {
            $item_result = $wpdb->insert($wpdb->prefix . 'posq_bundle_items', [
                'bundle_id' => $bundle_id,
                'product_id' => !empty($item['productId']) ? (int) $item['productId'] : null,
                'package_id' => !empty($item['packageId']) ? (int) $item['packageId'] : null,
                'quantity' => (int) $item['quantity'],
                'is_package' => !empty($item['isPackage']) ? 1 : 0
            ]);

            if ($item_result === false) {
                error_log('Failed to insert bundle item: ' . $wpdb->last_error);
                // Continue with other items instead of failing completely
            }
        }

        return ['success' => true, 'id' => $bundle_id];
    }

    public static function update_bundle($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        
        // Update bundle
        $update_data = [];
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['price'])) $update_data['price'] = (int) $data['price'];
        
        // PERBAIKAN: Handle outlet_id update (support factory bundle)
        if (isset($data['outletId'])) {
            if ($data['outletId'] === '' || $data['outletId'] === null || $data['outletId'] === 'null') {
                $update_data['outlet_id'] = null;
            } else {
                $update_data['outlet_id'] = (int) $data['outletId'];
            }
        }
        
        // PERBAIKAN: Handle manual stock update
        if (isset($data['manualStockEnabled'])) {
            $update_data['manual_stock_enabled'] = !empty($data['manualStockEnabled']) ? 1 : 0;
            
            // If manual stock is enabled, update the value
            if ($update_data['manual_stock_enabled'] && isset($data['manualStock'])) {
                $update_data['manual_stock'] = (int) $data['manualStock'];
            } else {
                // If disabled, set to null
                $update_data['manual_stock'] = null;
            }
        }
        
        // Support both imageUrl and image_url for compatibility
        if (isset($data['imageUrl']) || isset($data['image_url'])) {
            $image_url = !empty($data['imageUrl']) ? $data['imageUrl'] : (!empty($data['image_url']) ? $data['image_url'] : null);
            $update_data['image_url'] = !empty($image_url) ? esc_url_raw($image_url) : null;
        }

        if (!empty($update_data)) {
            $result = $wpdb->update(
                $wpdb->prefix . 'posq_bundles',
                $update_data,
                ['id' => $id]
            );

            if ($result === false) {
                error_log('Failed to update bundle: ' . $wpdb->last_error);
                return new WP_Error('db_update_error', 'Failed to update bundle: ' . $wpdb->last_error, ['status' => 500]);
            }
        }

        // Update items if provided
        if (isset($data['items'])) {
            // Delete old items
            $delete_result = $wpdb->delete($wpdb->prefix . 'posq_bundle_items', ['bundle_id' => $id]);
            
            if ($delete_result === false) {
                error_log('Failed to delete old bundle items: ' . $wpdb->last_error);
            }

            // Insert new items
            foreach ($data['items'] as $item) {
                $item_result = $wpdb->insert($wpdb->prefix . 'posq_bundle_items', [
                    'bundle_id' => $id,
                    'product_id' => !empty($item['productId']) ? (int) $item['productId'] : null,
                    'package_id' => !empty($item['packageId']) ? (int) $item['packageId'] : null,
                    'quantity' => (int) $item['quantity'],
                    'is_package' => !empty($item['isPackage']) ? 1 : 0
                ]);

                if ($item_result === false) {
                    error_log('Failed to insert bundle item during update: ' . $wpdb->last_error);
                }
            }
            
        }

        return ['success' => true];
    }

    public static function delete_bundle($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        
        // Delete items first
        $wpdb->delete($wpdb->prefix . 'posq_bundle_items', ['bundle_id' => $id]);
        
        // Delete bundle
        $wpdb->delete($wpdb->prefix . 'posq_bundles', ['id' => $id]);

        return ['success' => true];
    }

    // ===== STOCK MANAGEMENT =====

    private static function log_stock_change($product_id, $outlet_id, $operation, $quantity, $from_outlet = null, $to_outlet = null, $transaction_id = null) {
        global $wpdb;
        
        $wpdb->insert($wpdb->prefix . 'posq_stock_logs', [
            'product_id' => $product_id,
            'outlet_id' => $outlet_id,
            'operation' => $operation,
            'quantity' => $quantity,
            'from_outlet_id' => $from_outlet,
            'to_outlet_id' => $to_outlet,
            'user_id' => get_current_user_id(),
            'reference_transaction_id' => $transaction_id
        ]);
    }

    public static function add_stock($request) {
        $data = $request->get_json_params();
        
        if (!isset($data['productId']) || !isset($data['quantity'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}posq_products WHERE id = %d",
            $data['productId']
        ));

        if (!$product) {
            return new WP_Error('not_found', 'Product not found', ['status' => 404]);
        }

        // Update stock
        $wpdb->update(
            $wpdb->prefix . 'posq_products',
            ['stock' => $product->stock + $data['quantity']],
            ['id' => $product->id]
        );

        // Log
        self::log_stock_change($product->id, $product->outlet_id, 'add', $data['quantity']);

        return ['success' => true];
    }

    public static function reduce_stock($request) {
        $data = $request->get_json_params();
        
        if (!isset($data['productId']) || !isset($data['quantity'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}posq_products WHERE id = %d",
            $data['productId']
        ));

        if (!$product) {
            return new WP_Error('not_found', 'Product not found', ['status' => 404]);
        }

        if ($product->stock < $data['quantity']) {
            return new WP_Error('insufficient_stock', 'Insufficient stock', ['status' => 400]);
        }

        // Update stock
        $wpdb->update(
            $wpdb->prefix . 'posq_products',
            ['stock' => $product->stock - $data['quantity']],
            ['id' => $product->id]
        );

        // Log
        self::log_stock_change($product->id, $product->outlet_id, 'reduce', $data['quantity']);

        return ['success' => true];
    }

    public static function transfer_stock($request) {
        $data = $request->get_json_params();
        
        if (!isset($data['productId']) || !isset($data['toOutletId']) || !isset($data['quantity'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        
        // Start transaction untuk memastikan konsistensi data
        $wpdb->query('START TRANSACTION');
        
        try {
            // Get source product
            $product = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}posq_products WHERE id = %d AND is_deleted = 0",
                $data['productId']
            ));

            if (!$product) {
                $wpdb->query('ROLLBACK');
                return new WP_Error('not_found', 'Product not found', ['status' => 404]);
            }

            if ($product->stock < $data['quantity']) {
                $wpdb->query('ROLLBACK');
                return new WP_Error('insufficient_stock', 'Insufficient stock', ['status' => 400]);
            }

            // Cek apakah produk sudah ada di outlet tujuan
            $target_product = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}posq_products 
                 WHERE name = %s AND outlet_id = %d AND is_deleted = 0",
                $product->name,
                $data['toOutletId']
            ));

            if ($target_product) {
                // Produk sudah ada di outlet tujuan, tambahkan stoknya
                $wpdb->update(
                    $wpdb->prefix . 'posq_products',
                    ['stock' => $target_product->stock + $data['quantity']],
                    ['id' => $target_product->id]
                );
                
                // Log penambahan di outlet tujuan
                self::log_stock_change(
                    $target_product->id, 
                    $data['toOutletId'], 
                    'transfer_in', 
                    $data['quantity'],
                    $product->outlet_id,
                    $data['toOutletId']
                );
            } else {
                // Produk belum ada di outlet tujuan, buat produk baru
                $wpdb->insert($wpdb->prefix . 'posq_products', [
                    'name' => $product->name,
                    'price' => $product->price,
                    'stock' => $data['quantity'],
                    'outlet_id' => $data['toOutletId'],
                    'category_id' => $product->category_id,
                    'brand_id' => $product->brand_id,
                    'description' => $product->description,
                    'image_url' => $product->image_url,
                    'is_deleted' => 0
                ]);
                
                $new_product_id = $wpdb->insert_id;
                
                // Log penambahan di outlet tujuan untuk produk baru
                self::log_stock_change(
                    $new_product_id, 
                    $data['toOutletId'], 
                    'transfer_in', 
                    $data['quantity'],
                    $product->outlet_id,
                    $data['toOutletId']
                );
            }

            // Kurangi stok dari produk sumber
            $wpdb->update(
                $wpdb->prefix . 'posq_products',
                ['stock' => $product->stock - $data['quantity']],
                ['id' => $product->id]
            );

            // Log pengurangan di outlet sumber
            self::log_stock_change(
                $product->id, 
                $product->outlet_id, 
                'transfer_out', 
                $data['quantity'],
                $product->outlet_id,
                $data['toOutletId']
            );

            $wpdb->query('COMMIT');
            
            return [
                'success' => true,
                'message' => 'Stock transferred successfully'
            ];
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('transfer_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public static function get_stock_logs() {
        global $wpdb;
        $user_id = get_current_user_id();
        
        $query = "
            SELECT sl.*, p.name as product_name, o.name as outlet_name
            FROM {$wpdb->prefix}posq_stock_logs sl
            LEFT JOIN {$wpdb->prefix}posq_products p ON sl.product_id = p.id
            LEFT JOIN {$wpdb->prefix}posq_outlets o ON sl.outlet_id = o.id
        ";

        // Filter by outlet for non-owners
        if (!self::is_owner($user_id)) {
            $profile = $wpdb->get_row($wpdb->prepare(
                "SELECT outlet_id FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
                $user_id
            ));

            if ($profile && $profile->outlet_id) {
                $query .= $wpdb->prepare(" WHERE sl.outlet_id = %d", $profile->outlet_id);
            }
        }

        $query .= " ORDER BY sl.timestamp DESC LIMIT 100";

        $logs = $wpdb->get_results($query);
        
        $data = [];
        foreach ($logs as $log) {
            $data[] = [
                'id' => (int) $log->id,
                'product_id' => (int) $log->product_id,
                'product_name' => $log->product_name,
                'outlet_id' => (int) $log->outlet_id,
                'outlet_name' => $log->outlet_name,
                'operation' => $log->operation,
                'quantity' => (int) $log->quantity,
                'from_outlet_id' => $log->from_outlet_id ? (int) $log->from_outlet_id : null,
                'to_outlet_id' => $log->to_outlet_id ? (int) $log->to_outlet_id : null,
                'user_id' => (int) $log->user_id,
                'timestamp' => $log->timestamp,
                'reference_transaction_id' => $log->reference_transaction_id ? (int) $log->reference_transaction_id : null
            ];
        }
        
        return $data;
    }

    // ===== TRANSACTIONS =====

    public static function create_transaction($request) {
        $data = $request->get_json_params();
        
        if (empty($data['items']) || empty($data['paymentMethods']) || !isset($data['outletId'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        
        // Calculate total
        $total = 0;
        foreach ($data['items'] as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        // Verify payment total
        $payment_total = 0;
        foreach ($data['paymentMethods'] as $payment) {
            $payment_total += $payment['amount'];
        }

        if ($payment_total != $total) {
            return new WP_Error('payment_mismatch', 'Payment total must equal transaction total', ['status' => 400]);
        }

        // Start transaction
        $wpdb->query('START TRANSACTION');

        try {
            // Insert transaction
            $wpdb->insert($wpdb->prefix . 'posq_transactions', [
                'user_id' => get_current_user_id(),
                'outlet_id' => (int) $data['outletId'],
                'total' => $total
            ]);

            $transaction_id = $wpdb->insert_id;

            // Insert items and update stock
            foreach ($data['items'] as $item) {
                $wpdb->insert($wpdb->prefix . 'posq_transaction_items', [
                    'transaction_id' => $transaction_id,
                    'product_id' => (int) $item['productId'],
                    'quantity' => (int) $item['quantity'],
                    'price' => (int) $item['price'],
                    'is_package' => !empty($item['isPackage']) ? 1 : 0,
                    'is_bundle' => !empty($item['isBundle']) ? 1 : 0
                ]);

                // Reduce stock if it's a regular product
                if (empty($item['isPackage']) && empty($item['isBundle'])) {
                    $product = $wpdb->get_row($wpdb->prepare(
                        "SELECT * FROM {$wpdb->prefix}posq_products WHERE id = %d",
                        $item['productId']
                    ));

                    if (!$product || $product->stock < $item['quantity']) {
                        throw new Exception('Insufficient stock for product');
                    }

                    $wpdb->update(
                        $wpdb->prefix . 'posq_products',
                        ['stock' => $product->stock - $item['quantity']],
                        ['id' => $product->id]
                    );

                    // Log stock change
                    self::log_stock_change(
                        $product->id,
                        $data['outletId'],
                        'transaction',
                        $item['quantity'],
                        null,
                        null,
                        $transaction_id
                    );
                }
            }

            // Insert payment methods
            foreach ($data['paymentMethods'] as $payment) {
                $wpdb->insert($wpdb->prefix . 'posq_payment_methods', [
                    'transaction_id' => $transaction_id,
                    'category' => sanitize_text_field($payment['category']),
                    'sub_category' => !empty($payment['subCategory']) ? sanitize_text_field($payment['subCategory']) : null,
                    'method_name' => sanitize_text_field($payment['methodName']),
                    'amount' => (int) $payment['amount']
                ]);
            }

            $wpdb->query('COMMIT');

            return ['success' => true, 'id' => $transaction_id];

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('transaction_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public static function get_transactions() {
        global $wpdb;
        $user_id = get_current_user_id();
        $role = self::get_user_role($user_id);

        $query = "
            SELECT t.*, o.name as outlet_name
            FROM {$wpdb->prefix}posq_transactions t
            LEFT JOIN {$wpdb->prefix}posq_outlets o ON t.outlet_id = o.id
        ";

        $where = [];

        // Filter based on role
        if ($role === 'cashier') {
            $where[] = $wpdb->prepare("t.user_id = %d", $user_id);
        } elseif ($role === 'manager') {
            $profile = $wpdb->get_row($wpdb->prepare(
                "SELECT outlet_id FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
                $user_id
            ));
            if ($profile && $profile->outlet_id) {
                $where[] = $wpdb->prepare("t.outlet_id = %d", $profile->outlet_id);
            }
        }

        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }

        $query .= " ORDER BY t.timestamp DESC LIMIT 100";

        $transactions = $wpdb->get_results($query);
        
        $data = [];
        foreach ($transactions as $trans) {
            // Get items
            $items = $wpdb->get_results($wpdb->prepare(
                "SELECT ti.*, p.name as product_name
                FROM {$wpdb->prefix}posq_transaction_items ti
                LEFT JOIN {$wpdb->prefix}posq_products p ON ti.product_id = p.id
                WHERE ti.transaction_id = %d",
                $trans->id
            ));

            $trans_items = [];
            foreach ($items as $item) {
                $trans_items[] = [
                    'product_id' => (int) $item->product_id,
                    'product_name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                    'price' => (int) $item->price,
                    'is_package' => (bool) $item->is_package,
                    'is_bundle' => (bool) $item->is_bundle
                ];
            }

            // Get payment methods
            $payments = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}posq_payment_methods WHERE transaction_id = %d",
                $trans->id
            ));

            $payment_methods = [];
            foreach ($payments as $payment) {
                $payment_methods[] = [
                    'category' => $payment->category,
                    'sub_category' => $payment->sub_category,
                    'method_name' => $payment->method_name,
                    'amount' => (int) $payment->amount
                ];
            }

            $data[] = [
                'id' => (int) $trans->id,
                'user_id' => (int) $trans->user_id,
                'outlet_id' => (int) $trans->outlet_id,
                'outlet_name' => $trans->outlet_name,
                'items' => $trans_items,
                'payment_methods' => $payment_methods,
                'total' => (int) $trans->total,
                'timestamp' => $trans->timestamp
            ];
        }
        
        return $data;
    }

    // ===== EXPENSES =====

    public static function get_expenses() {
        global $wpdb;
        $user_id = get_current_user_id();
        
        $query = "
            SELECT e.*, o.name as outlet_name
            FROM {$wpdb->prefix}posq_expenses e
            LEFT JOIN {$wpdb->prefix}posq_outlets o ON e.outlet_id = o.id
        ";

        // Filter by outlet for non-owners
        if (!self::is_owner($user_id)) {
            $profile = $wpdb->get_row($wpdb->prepare(
                "SELECT outlet_id FROM {$wpdb->prefix}posq_user_profiles WHERE user_id = %d",
                $user_id
            ));

            if ($profile && $profile->outlet_id) {
                $query .= $wpdb->prepare(" WHERE e.outlet_id = %d", $profile->outlet_id);
            }
        }

        $query .= " ORDER BY e.date DESC";

        $expenses = $wpdb->get_results($query);
        
        $data = [];
        foreach ($expenses as $expense) {
            $data[] = [
                'id' => (string) $expense->id,
                'title' => $expense->title,
                'amount' => (int) $expense->amount,
                'category' => $expense->category,
                'outlet_id' => (string) $expense->outlet_id,
                'outlet_name' => $expense->outlet_name,
                'date' => strtotime($expense->date) * 1000,
                'note' => $expense->note
            ];
        }
        
        return $data;
    }

    public static function create_expense($request) {
        $data = $request->get_json_params();
        
        if (empty($data['title']) || !isset($data['amount']) || !isset($data['outletId'])) {
            return new WP_Error('missing_fields', 'Required fields missing', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_expenses', [
            'title' => sanitize_text_field($data['title']),
            'amount' => (int) $data['amount'],
            'category' => sanitize_text_field($data['category'] ?? ''),
            'outlet_id' => (int) $data['outletId'],
            'note' => sanitize_textarea_field($data['note'] ?? '')
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_expense($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['title'])) $update_data['title'] = sanitize_text_field($data['title']);
        if (isset($data['amount'])) $update_data['amount'] = (int) $data['amount'];
        if (isset($data['category'])) $update_data['category'] = sanitize_text_field($data['category']);
        if (isset($data['note'])) $update_data['note'] = sanitize_textarea_field($data['note']);

        $wpdb->update(
            $wpdb->prefix . 'posq_expenses',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_expense($request) {
        $id = (int) $request['id'];
        
        global $wpdb;
        $wpdb->delete($wpdb->prefix . 'posq_expenses', ['id' => $id]);

        return ['success' => true];
    }

    // ===== REPORTS =====

    public static function report_top_outlets($request) {
        global $wpdb;
        
        $results = $wpdb->get_results("
            SELECT outlet_id, SUM(total) as revenue
            FROM {$wpdb->prefix}posq_transactions
            GROUP BY outlet_id
            ORDER BY revenue DESC
            LIMIT 10
        ");

        $data = [];
        foreach ($results as $row) {
            $data[] = [
                'outlet_id' => (string) $row->outlet_id,
                'revenue' => (int) $row->revenue
            ];
        }

        return $data;
    }

    public static function report_daily_summary($request) {
        global $wpdb;
        
        $today = date('Y-m-d');
        $result = $wpdb->get_row($wpdb->prepare("
            SELECT COUNT(*) as count, SUM(total) as revenue
            FROM {$wpdb->prefix}posq_transactions
            WHERE DATE(timestamp) = %s
        ", $today));

        return [
            'transaction_count' => (int) $result->count,
            'total_revenue' => (int) $result->revenue
        ];
    }

    public static function report_overall_summary($request) {
        global $wpdb;
        
        $result = $wpdb->get_row("
            SELECT COUNT(*) as count, SUM(total) as revenue
            FROM {$wpdb->prefix}posq_transactions
        ");

        return [
            'transaction_count' => (int) $result->count,
            'total_revenue' => (int) $result->revenue
        ];
    }

    public static function report_best_sellers($request) {
        global $wpdb;
        
        $results = $wpdb->get_results("
            SELECT product_id, SUM(quantity) as total_quantity
            FROM {$wpdb->prefix}posq_transaction_items
            WHERE is_package = 0 AND is_bundle = 0
            GROUP BY product_id
            ORDER BY total_quantity DESC
            LIMIT 10
        ");

        $data = [];
        foreach ($results as $row) {
            $data[] = [
                'product_id' => (string) $row->product_id,
                'quantity' => (int) $row->total_quantity
            ];
        }

        return $data;
    }

    public static function report_cashflow($request) {
        global $wpdb;
        
        $period = $request->get_param('period') ?: 'monthly';
        
        // Get income from transactions
        $income_result = $wpdb->get_row("
            SELECT SUM(total) as total
            FROM {$wpdb->prefix}posq_transactions
            WHERE DATE(timestamp) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");

        // Get expenses
        $expense_result = $wpdb->get_row("
            SELECT SUM(amount) as total
            FROM {$wpdb->prefix}posq_expenses
            WHERE DATE(date) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");

        $total_income = (int) ($income_result->total ?? 0);
        $total_expense = (int) ($expense_result->total ?? 0);

        // Chart data
        $chart_data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            
            $day_income = $wpdb->get_var($wpdb->prepare("
                SELECT SUM(total) FROM {$wpdb->prefix}posq_transactions WHERE DATE(timestamp) = %s
            ", $date));

            $day_expense = $wpdb->get_var($wpdb->prepare("
                SELECT SUM(amount) FROM {$wpdb->prefix}posq_expenses WHERE DATE(date) = %s
            ", $date));

            $chart_data[] = [
                'date' => $date,
                'income' => (int) ($day_income ?? 0),
                'expense' => (int) ($day_expense ?? 0)
            ];
        }

        return [
            'total_income' => $total_income,
            'total_expense' => $total_expense,
            'net_profit' => $total_income - $total_expense,
            'period' => $period,
            'chart_data' => $chart_data
        ];
    }

    // ===== MENU ACCESS =====

    public static function get_menu_access() {
        global $wpdb;
        
        $menus = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}posq_menu_access ORDER BY role, menu");
        
        $config = [
            'cashier' => [],
            'manager' => [],
            'owner' => []
        ];

        foreach ($menus as $menu) {
            $config[$menu->role][] = [
                'menu' => $menu->menu,
                'is_accessible' => (bool) $menu->is_accessible
            ];
        }

        return $config;
    }

    public static function save_menu_access($request) {
        $data = $request->get_json_params();

        global $wpdb;
        $table = $wpdb->prefix . 'posq_menu_access';

        foreach (['cashier', 'manager'] as $role) {
            if (isset($data[$role])) {
                foreach ($data[$role] as $menu_item) {
                    $wpdb->replace($table, [
                        'role' => $role,
                        'menu' => $menu_item['menu'],
                        'is_accessible' => $menu_item['is_accessible'] ? 1 : 0
                    ]);
                }
            }
        }

        return ['success' => true];
    }
    
    // ===== CUSTOMERS CRUD =====

    public static function get_customers() {
        global $wpdb;
        $table = $wpdb->prefix . 'posq_customers';
        
        $customers = $wpdb->get_results("SELECT * FROM $table WHERE is_active = 1 ORDER BY name ASC");
        
        $data = [];
        foreach ($customers as $c) {
            $data[] = [
                'id' => (string) $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'address' => $c->address,
                'created_at' => $c->created_at
            ];
        }
        return $data;
    }

    public static function create_customer($request) {
        $data = $request->get_json_params();
        
        if (empty($data['name'])) {
            return new WP_Error('missing_fields', 'Name required', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'posq_customers', [
            'name' => sanitize_text_field($data['name']),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'address' => sanitize_textarea_field($data['address'] ?? ''),
            'is_active' => 1
        ]);

        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public static function update_customer($request) {
        $id = (int) $request['id'];
        $data = $request->get_json_params();

        global $wpdb;
        $update_data = [];
        
        if (!empty($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['email'])) $update_data['email'] = sanitize_email($data['email']);
        if (isset($data['phone'])) $update_data['phone'] = sanitize_text_field($data['phone']);
        if (isset($data['address'])) $update_data['address'] = sanitize_textarea_field($data['address']);

        $wpdb->update(
            $wpdb->prefix . 'posq_customers',
            $update_data,
            ['id' => $id]
        );

        return ['success' => true];
    }

    public static function delete_customer($request) {
        $id = (int) $request['id'];
        global $wpdb;
        // Soft delete
        $wpdb->update(
            $wpdb->prefix . 'posq_customers',
            ['is_active' => 0],
            ['id' => $id]
        );
        return ['success' => true];
    }

    public static function get_role_menu_access() {
        $role = self::get_user_role();
        
        global $wpdb;
        $menus = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}posq_menu_access WHERE role = %s",
            $role
        ));

        $data = [];
        foreach ($menus as $menu) {
            $data[] = [
                'menu' => $menu->menu,
                'is_accessible' => (bool) $menu->is_accessible
            ];
        }

        return $data;
    }
}

// Initialize plugin
posq_Backend::init();