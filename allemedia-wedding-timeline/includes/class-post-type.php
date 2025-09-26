<?php
/**
 * Rejestracja typu wpisu.
 */
class Allemedia_WT_Post_Type {

    /**
     * Inicjalizacja hooków.
     */
    public static function init() {
        add_action( 'init', array( __CLASS__, 'register' ) );
    }

    /**
     * Rejestracja CPT.
     */
    public static function register() {
        $labels = array(
            'name'               => __( 'Harmonogramy ślubne', 'allemedia-wedding-timeline' ),
            'singular_name'      => __( 'Harmonogram ślubny', 'allemedia-wedding-timeline' ),
            'add_new'            => __( 'Dodaj nowy', 'allemedia-wedding-timeline' ),
            'add_new_item'       => __( 'Dodaj harmonogram', 'allemedia-wedding-timeline' ),
            'edit_item'          => __( 'Edytuj harmonogram', 'allemedia-wedding-timeline' ),
            'new_item'           => __( 'Nowy harmonogram', 'allemedia-wedding-timeline' ),
            'view_item'          => __( 'Zobacz harmonogram', 'allemedia-wedding-timeline' ),
            'search_items'       => __( 'Szukaj harmonogramu', 'allemedia-wedding-timeline' ),
            'not_found'          => __( 'Nie znaleziono', 'allemedia-wedding-timeline' ),
            'not_found_in_trash' => __( 'Brak w koszu', 'allemedia-wedding-timeline' ),
        );

        $args = array(
            'labels'        => $labels,
            'public'        => false,
            'show_ui'       => true,
            'show_in_menu'  => false,
            'supports'      => array( 'title', 'author' ),
            'show_in_rest'  => false,
            'capability_type' => 'post',
        );

        register_post_type( 'wedding_timeline', $args );
    }
}
