<?php
/**
 * Plugin Name: Allemedia Wedding Timeline
 * Description: Generator harmonogramu dnia ślubu z wizualizacjami, eksportem ICS i trybem LIVE dla ekip foto/wideo.
 * Version: 1.0.0
 * Author: Allemedia
 * Text Domain: allemedia-wedding-timeline
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Definicje stałych dla wtyczki.
define( 'ALLEMEDIA_WT_PATH', plugin_dir_path( __FILE__ ) );
define( 'ALLEMEDIA_WT_URL', plugin_dir_url( __FILE__ ) );
define( 'ALLEMEDIA_WT_VERSION', '1.0.0' );

// Autoloadowanie plików klas.
require_once ALLEMEDIA_WT_PATH . 'includes/class-activator.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-deactivator.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-post-type.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-rest.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-ics.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-qr.php';
require_once ALLEMEDIA_WT_PATH . 'includes/helpers.php';

/**
 * Funkcja uruchamiana przy aktywacji pluginu.
 */
function allemedia_wt_activate() {
    Allemedia_WT_Activator::activate();
}
register_activation_hook( __FILE__, 'allemedia_wt_activate' );

/**
 * Funkcja uruchamiana przy dezaktywacji pluginu.
 */
function allemedia_wt_deactivate() {
    Allemedia_WT_Deactivator::deactivate();
}
register_deactivation_hook( __FILE__, 'allemedia_wt_deactivate' );

/**
 * Inicjalizacja pluginu - rejestracja CPT, REST oraz zasobów.
 */
function allemedia_wt_init() {
    // Rejestracja typu wpisu.
    Allemedia_WT_Post_Type::register();

    // Rejestracja endpointów REST.
    Allemedia_WT_REST::register_routes();
}
add_action( 'init', 'allemedia_wt_init' );

/**
 * Ładowanie skryptów i stylów dla panelu admina.
 */
function allemedia_wt_admin_assets( $hook ) {
    if ( 'toplevel_page_allemedia-wt' !== $hook && 'post.php' !== $hook && 'post-new.php' !== $hook ) {
        return;
    }

    wp_enqueue_style( 'allemedia-wt-styles', ALLEMEDIA_WT_URL . 'assets/styles.css', array(), ALLEMEDIA_WT_VERSION );
    wp_enqueue_script( 'allemedia-wt-admin', ALLEMEDIA_WT_URL . 'assets/admin.js', array( 'wp-element', 'wp-i18n', 'wp-components', 'wp-api-fetch' ), ALLEMEDIA_WT_VERSION, true );

    wp_localize_script(
        'allemedia-wt-admin',
        'AllemediaWT',
        array(
            'root'       => esc_url_raw( rest_url( 'allemedia/v1/' ) ),
            'nonce'      => wp_create_nonce( 'wp_rest' ),
            'assetsUrl'  => ALLEMEDIA_WT_URL . 'assets/',
            'printCss'   => ALLEMEDIA_WT_URL . 'assets/print.css',
            'textDomain' => 'allemedia-wedding-timeline',
        )
    );
}
add_action( 'admin_enqueue_scripts', 'allemedia_wt_admin_assets' );

/**
 * Ładowanie skryptów i stylów dla widoku publicznego.
 */
function allemedia_wt_public_assets() {
    if ( ! is_singular() ) {
        return;
    }

    global $post;

    if ( has_shortcode( $post->post_content, 'allemedia_timeline' ) ) {
        wp_enqueue_style( 'allemedia-wt-styles', ALLEMEDIA_WT_URL . 'assets/styles.css', array(), ALLEMEDIA_WT_VERSION );
        wp_enqueue_style( 'allemedia-wt-print', ALLEMEDIA_WT_URL . 'assets/print.css', array(), ALLEMEDIA_WT_VERSION, 'print' );
        wp_enqueue_script( 'allemedia-wt-public', ALLEMEDIA_WT_URL . 'assets/public.js', array(), ALLEMEDIA_WT_VERSION, true );
        wp_localize_script(
            'allemedia-wt-public',
            'AllemediaWT',
            array(
                'root'      => esc_url_raw( rest_url( 'allemedia/v1/' ) ),
                'nonce'     => wp_create_nonce( 'wp_rest' ),
                'assetsUrl' => ALLEMEDIA_WT_URL . 'assets/',
                'printCss'  => ALLEMEDIA_WT_URL . 'assets/print.css',
            )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'allemedia_wt_public_assets' );

/**
 * Dodanie strony w panelu admina.
 */
function allemedia_wt_register_admin_page() {
    add_menu_page(
        __( 'Harmonogram ślubu', 'allemedia-wedding-timeline' ),
        __( 'Wedding Timeline', 'allemedia-wedding-timeline' ),
        'edit_posts',
        'allemedia-wt',
        'allemedia_wt_render_admin_page',
        'dashicons-calendar-alt',
        58
    );
}
add_action( 'admin_menu', 'allemedia_wt_register_admin_page' );

/**
 * Render szablonu strony admina.
 */
function allemedia_wt_render_admin_page() {
    require_once ALLEMEDIA_WT_PATH . 'includes/templates/admin-page.php';
}

/**
 * Rejestracja shortcode do widoku publicznego.
 */
function allemedia_wt_register_shortcode( $atts ) {
    $atts = shortcode_atts(
        array(
            'id'   => 0,
            'view' => 'editor',
            'print' => 'guest',
        ),
        $atts,
        'allemedia_timeline'
    );

    ob_start();
    require ALLEMEDIA_WT_PATH . 'includes/templates/public-view.php';
    return ob_get_clean();
}
add_shortcode( 'allemedia_timeline', 'allemedia_wt_register_shortcode' );
