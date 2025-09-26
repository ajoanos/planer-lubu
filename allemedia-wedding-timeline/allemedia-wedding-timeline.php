<?php
/**
 * Plugin Name: Allemedia Wedding Timeline
 * Description: Generator harmonogramu ślubu z trybem LIVE, eksportem ICS oraz udostępnianiem publicznym.
 * Version: 1.0.0
 * Author: Allemedia
 * Text Domain: allemedia-wedding-timeline
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Stałe pluginu
if ( ! defined( 'ALLEMEDIA_WT_VERSION' ) ) {
    define( 'ALLEMEDIA_WT_VERSION', '1.0.0' );
}

if ( ! defined( 'ALLEMEDIA_WT_PATH' ) ) {
    define( 'ALLEMEDIA_WT_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'ALLEMEDIA_WT_URL' ) ) {
    define( 'ALLEMEDIA_WT_URL', plugin_dir_url( __FILE__ ) );
}

require_once ALLEMEDIA_WT_PATH . 'includes/helpers.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-activator.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-deactivator.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-post-type.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-rest.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-ics.php';
require_once ALLEMEDIA_WT_PATH . 'includes/class-qr.php';

/**
 * Aktywacja pluginu.
 */
function allemedia_wt_activate() {
    Allemedia_WT_Activator::activate();
}
register_activation_hook( __FILE__, 'allemedia_wt_activate' );

/**
 * Dezaktywacja pluginu.
 */
function allemedia_wt_deactivate() {
    Allemedia_WT_Deactivator::deactivate();
}
register_deactivation_hook( __FILE__, 'allemedia_wt_deactivate' );

/**
 * Inicjalizacja pluginu.
 */
function allemedia_wt_init() {
    load_plugin_textdomain( 'allemedia-wedding-timeline', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );

    Allemedia_WT_Post_Type::init();
    Allemedia_WT_REST::init();

    // Rejestracja shortcode
    add_shortcode( 'allemedia_timeline', 'allemedia_wt_shortcode' );

    // Dodanie strony w menu
    add_action( 'admin_menu', 'allemedia_wt_register_admin_page' );

    // Ładowanie assetów
    add_action( 'admin_enqueue_scripts', 'allemedia_wt_admin_assets' );
    add_action( 'wp_enqueue_scripts', 'allemedia_wt_public_assets' );
}
add_action( 'init', 'allemedia_wt_init' );

/**
 * Rejestracja strony admina.
 */
function allemedia_wt_register_admin_page() {
    add_menu_page(
        __( 'Wedding Timeline', 'allemedia-wedding-timeline' ),
        __( 'Wedding Timeline', 'allemedia-wedding-timeline' ),
        'edit_posts',
        'allemedia-wedding-timeline',
        'allemedia_wt_render_admin_page',
        'dashicons-calendar-alt',
        28
    );
}

/**
 * Render strony admina.
 */
function allemedia_wt_render_admin_page() {
    if ( ! current_user_can( 'edit_posts' ) ) {
        wp_die( esc_html__( 'Brak uprawnień.', 'allemedia-wedding-timeline' ) );
    }

    wp_nonce_field( 'allemedia_wt_admin', 'allemedia_wt_admin_nonce' );

    $seed = allemedia_wt_get_demo_timeline();
    include ALLEMEDIA_WT_PATH . 'includes/templates/admin-page.php';
}

/**
 * Ładowanie assetów admina.
 */
function allemedia_wt_admin_assets( $hook ) {
    if ( 'toplevel_page_allemedia-wedding-timeline' !== $hook ) {
        return;
    }

    wp_enqueue_style( 'allemedia-wt-styles', ALLEMEDIA_WT_URL . 'assets/styles.css', array(), ALLEMEDIA_WT_VERSION );
    wp_enqueue_style( 'allemedia-wt-print', ALLEMEDIA_WT_URL . 'assets/print.css', array(), ALLEMEDIA_WT_VERSION, 'print' );

    wp_enqueue_script( 'allemedia-wt-admin', ALLEMEDIA_WT_URL . 'assets/admin.js', array(), ALLEMEDIA_WT_VERSION, true );
    wp_script_add_data( 'allemedia-wt-admin', 'type', 'module' ); // Skrypt jako moduł ES6
    wp_localize_script(
        'allemedia-wt-admin',
        'AllemediaWT',
        array(
            'restUrl'     => esc_url_raw( rest_url( 'allemedia/v1/' ) ),
            'nonce'       => wp_create_nonce( 'wp_rest' ),
            'demoTimeline'=> allemedia_wt_get_demo_timeline(),
            'currentUser' => allemedia_wt_get_current_user_payload(),
            'strings'     => allemedia_wt_get_strings(),
        )
    );
}

/**
 * Ładowanie assetów publicznych (shortcode i publiczny widok).
 */
function allemedia_wt_public_assets() {
    if ( ! is_singular() ) {
        return;
    }

    global $post;
    if ( ! has_shortcode( $post->post_content, 'allemedia_timeline' ) ) {
        return;
    }

    wp_enqueue_style( 'allemedia-wt-styles', ALLEMEDIA_WT_URL . 'assets/styles.css', array(), ALLEMEDIA_WT_VERSION );
    wp_enqueue_style( 'allemedia-wt-print', ALLEMEDIA_WT_URL . 'assets/print.css', array(), ALLEMEDIA_WT_VERSION, 'print' );
    wp_enqueue_script( 'allemedia-wt-public', ALLEMEDIA_WT_URL . 'assets/public.js', array(), ALLEMEDIA_WT_VERSION, true );
    wp_script_add_data( 'allemedia-wt-public', 'type', 'module' ); // Skrypt jako moduł ES6
    wp_localize_script(
        'allemedia-wt-public',
        'AllemediaWT',
        array(
            'restUrl' => esc_url_raw( rest_url( 'allemedia/v1/' ) ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
            'strings' => allemedia_wt_get_strings(),
        )
    );
}

/**
 * Shortcode do osadzania edytora lub widoku publicznego.
 *
 * @param array $atts Atrybuty shortcode.
 */
function allemedia_wt_shortcode( $atts ) {
    $atts = shortcode_atts(
        array(
            'id'   => 0,
            'view' => 'editor',
            'print'=> 'guest',
        ),
        $atts,
        'allemedia_timeline'
    );

    $timeline_id = absint( $atts['id'] );
    $view        = sanitize_key( $atts['view'] );

    if ( ! $timeline_id ) {
        return '<div class="allemedia-wt-error">' . esc_html__( 'Brak ID harmonogramu.', 'allemedia-wedding-timeline' ) . '</div>';
    }

    $template = 'editor' === $view ? 'admin-page.php' : 'public-view.php';
    $timeline_id_attr = $timeline_id;
    $view_mode        = $view;
    $print_variant    = sanitize_key( $atts['print'] );

    ob_start();
    include ALLEMEDIA_WT_PATH . 'includes/templates/' . $template;
    return ob_get_clean();
}
