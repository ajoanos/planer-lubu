<?php
/**
 * Rejestracja typu wpisu dla harmonogramów.
 */
class Allemedia_WT_Post_Type {
    public static function register() {
        $labels = array(
            'name'               => __( 'Harmonogramy ślubne', 'allemedia-wedding-timeline' ),
            'singular_name'      => __( 'Harmonogram ślubny', 'allemedia-wedding-timeline' ),
            'add_new'            => __( 'Dodaj nowy', 'allemedia-wedding-timeline' ),
            'add_new_item'       => __( 'Dodaj nowy harmonogram', 'allemedia-wedding-timeline' ),
            'edit_item'          => __( 'Edytuj harmonogram', 'allemedia-wedding-timeline' ),
            'new_item'           => __( 'Nowy harmonogram', 'allemedia-wedding-timeline' ),
            'view_item'          => __( 'Zobacz harmonogram', 'allemedia-wedding-timeline' ),
            'search_items'       => __( 'Szukaj harmonogramów', 'allemedia-wedding-timeline' ),
            'not_found'          => __( 'Nie znaleziono harmonogramów', 'allemedia-wedding-timeline' ),
            'not_found_in_trash' => __( 'Brak harmonogramów w koszu', 'allemedia-wedding-timeline' ),
            'menu_name'          => __( 'Wedding Timeline', 'allemedia-wedding-timeline' ),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'show_ui'            => true,
            'show_in_menu'       => false,
            'supports'           => array( 'title', 'editor' ),
            'capability_type'    => 'post',
            'map_meta_cap'       => true,
            'show_in_rest'       => false,
            'rewrite'            => false,
        );

        register_post_type( 'wedding_timeline', $args );
    }
}
