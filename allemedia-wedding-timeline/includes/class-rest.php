<?php
/**
 * Rejestracja REST API.
 */
class Allemedia_WT_REST {

    /**
     * Inicjalizacja hooków.
     */
    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    /**
     * Rejestracja tras.
     */
    public static function register_routes() {
        register_rest_route(
            'allemedia/v1',
            '/timelines',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( __CLASS__, 'create_timeline' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/timelines/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( __CLASS__, 'get_timeline' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( __CLASS__, 'update_timeline' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/timelines/(?P<id>\d+)/export/ics',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( __CLASS__, 'export_ics' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/public/(?P<public_id>[A-Za-z0-9]+)/?',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( __CLASS__, 'get_public_timeline' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/public/(?P<public_id>[A-Za-z0-9]+)/comments',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( __CLASS__, 'add_public_comment' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );
    }

    /**
     * Sprawdza uprawnienia.
     */
    public static function can_edit() {
        return current_user_can( 'edit_posts' );
    }

    /**
     * Tworzenie harmonogramu.
     */
    public static function create_timeline( WP_REST_Request $request ) {
        if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
            return new WP_Error( 'forbidden', __( 'Niepoprawny nonce.', 'allemedia-wedding-timeline' ), array( 'status' => 403 ) );
        }

        $data = $request->get_json_params();
        if ( empty( $data ) || ! is_array( $data ) ) {
            return new WP_Error( 'invalid', __( 'Niepoprawne dane.', 'allemedia-wedding-timeline' ), array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post(
            array(
                'post_type'   => 'wedding_timeline',
                'post_status' => 'publish',
                'post_title'  => sanitize_text_field( $data['title'] ?? __( 'Nowy harmonogram', 'allemedia-wedding-timeline' ) ),
            )
        );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        $result = self::save_timeline_payload( $post_id, $data );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( array( 'postId' => $post_id, 'timelineId' => $result ) );
    }

    /**
     * Pobranie harmonogramu.
     */
    public static function get_timeline( WP_REST_Request $request ) {
        if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
            return new WP_Error( 'forbidden', __( 'Niepoprawny nonce.', 'allemedia-wedding-timeline' ), array( 'status' => 403 ) );
        }

        $id = absint( $request['id'] );
        $post = get_post( $id );

        if ( ! $post || 'wedding_timeline' !== $post->post_type ) {
            return new WP_Error( 'not_found', __( 'Nie znaleziono harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $timeline = allemedia_wt_get_timeline_from_post( $id );
        if ( ! $timeline ) {
            return new WP_Error( 'not_found', __( 'Brak danych harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        return rest_ensure_response( $timeline );
    }

    /**
     * Aktualizacja harmonogramu.
     */
    public static function update_timeline( WP_REST_Request $request ) {
        if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
            return new WP_Error( 'forbidden', __( 'Niepoprawny nonce.', 'allemedia-wedding-timeline' ), array( 'status' => 403 ) );
        }

        $id   = absint( $request['id'] );
        $data = $request->get_json_params();

        if ( empty( $data ) ) {
            return new WP_Error( 'invalid', __( 'Brak danych do zapisania.', 'allemedia-wedding-timeline' ), array( 'status' => 400 ) );
        }

        $result = self::save_timeline_payload( $id, $data );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        allemedia_wt_update_last_updated( $result );

        return rest_ensure_response( array( 'timelineId' => $result ) );
    }

    /**
     * Eksport ICS.
     */
    public static function export_ics( WP_REST_Request $request ) {
        if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
            return new WP_Error( 'forbidden', __( 'Niepoprawny nonce.', 'allemedia-wedding-timeline' ), array( 'status' => 403 ) );
        }

        $id       = absint( $request['id'] );
        $timeline = allemedia_wt_get_timeline_from_post( $id );

        if ( ! $timeline ) {
            return new WP_Error( 'not_found', __( 'Brak harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $ics = ( new Allemedia_WT_ICS() )->generate( $timeline );

        return new WP_REST_Response( $ics, 200, array(
            'Content-Type'        => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="wedding-timeline.ics"',
        ) );
    }

    /**
     * Publiczny widok timeline.
     */
    public static function get_public_timeline( WP_REST_Request $request ) {
        $public_id = sanitize_text_field( $request['public_id'] );

        global $wpdb;
        $table = $wpdb->prefix . 'alle_timeline';
        $row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE public_id = %s", $public_id ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Publiczny link wygasł.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $timeline = json_decode( $row['data_json'], true );
        $comments = self::get_comments_for_timeline( (int) $row['id'] );

        return rest_ensure_response(
            array(
                'timeline' => $timeline,
                'meta'     => array(
                    'lastUpdated' => $row['last_updated'],
                    'publicId'    => $row['public_id'],
                ),
                'comments' => $comments,
            )
        );
    }

    /**
     * Dodawanie komentarza publicznego.
     */
    public static function add_public_comment( WP_REST_Request $request ) {
        $public_id = sanitize_text_field( $request['public_id'] );
        $params    = $request->get_json_params();

        if ( empty( $params['pin'] ) || empty( $params['text'] ) ) {
            return new WP_Error( 'invalid', __( 'PIN i treść są wymagane.', 'allemedia-wedding-timeline' ), array( 'status' => 400 ) );
        }

        global $wpdb;
        $table   = $wpdb->prefix . 'alle_timeline';
        $row     = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE public_id = %s", $public_id ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Publiczny link wygasł.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        if ( $row['pin'] !== sanitize_text_field( $params['pin'] ) ) {
            return new WP_Error( 'forbidden', __( 'Niepoprawny PIN.', 'allemedia-wedding-timeline' ), array( 'status' => 403 ) );
        }

        $comments_table = $wpdb->prefix . 'alle_timeline_comments';
        $wpdb->insert(
            $comments_table,
            array(
                'timeline_id' => (int) $row['id'],
                'author'      => sanitize_text_field( $params['author'] ?? __( 'Anonim', 'allemedia-wedding-timeline' ) ),
                'text'        => wp_kses_post( $params['text'] ),
                'created_at'  => current_time( 'mysql' ),
            ),
            array( '%d', '%s', '%s', '%s' )
        );

        $comments = self::get_comments_for_timeline( (int) $row['id'] );

        return rest_ensure_response( array( 'comments' => $comments ) );
    }

    /**
     * Zapis danych harmonogramu w bazie.
     */
    protected static function save_timeline_payload( $post_id, array $data ) {
        global $wpdb;

        $table = $wpdb->prefix . 'alle_timeline';

        $payload = wp_json_encode( self::sanitize_timeline( $data ) );
        if ( ! $payload ) {
            return new WP_Error( 'invalid', __( 'Nie można zapisać danych.', 'allemedia-wedding-timeline' ) );
        }

        $existing = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE post_id = %d", $post_id ) );

        if ( $existing ) {
            $wpdb->update(
                $table,
                array(
                    'data_json'    => $payload,
                    'last_updated' => current_time( 'mysql' ),
                ),
                array( 'post_id' => $post_id ),
                array( '%s', '%s' ),
                array( '%d' )
            );
            $timeline_id = (int) $existing;
        } else {
            $public_id = allemedia_wt_generate_public_id();
            $pin       = allemedia_wt_generate_pin();

            $wpdb->insert(
                $table,
                array(
                    'post_id'      => $post_id,
                    'data_json'    => $payload,
                    'public_id'    => $public_id,
                    'pin'          => $pin,
                    'last_updated' => current_time( 'mysql' ),
                ),
                array( '%d', '%s', '%s', '%s', '%s' )
            );
            $timeline_id = (int) $wpdb->insert_id;
        }

        // Zapisywanie eventów jako osobnych rekordów
        $events_table = $wpdb->prefix . 'alle_timeline_events';
        $wpdb->delete( $events_table, array( 'timeline_id' => $timeline_id ), array( '%d' ) );

        if ( ! empty( $data['events'] ) && is_array( $data['events'] ) ) {
            foreach ( $data['events'] as $event ) {
                $wpdb->insert(
                    $events_table,
                    array(
                        'timeline_id' => $timeline_id,
                        'event_json'  => wp_json_encode( self::sanitize_event( $event ) ),
                    ),
                    array( '%d', '%s' )
                );
            }
        }

        return $timeline_id;
    }

    /**
     * Sanityzacja timeline po stronie PHP.
     */
    protected static function sanitize_timeline( array $timeline ) {
        $timeline['title'] = sanitize_text_field( $timeline['title'] ?? __( 'Harmonogram', 'allemedia-wedding-timeline' ) );
        $timeline['date']  = sanitize_text_field( $timeline['date'] ?? '' );
        $timeline['style'] = sanitize_key( $timeline['style'] ?? 'standard' );

        if ( ! empty( $timeline['events'] ) && is_array( $timeline['events'] ) ) {
            $sanitized_events = array();
            foreach ( $timeline['events'] as $event ) {
                $sanitized_events[] = self::sanitize_event( $event );
            }
            $timeline['events'] = $sanitized_events;
        }

        return $timeline;
    }

    /**
     * Sanityzacja pojedynczego eventu.
     */
    protected static function sanitize_event( $event ) {
        $roles = array();
        if ( isset( $event['role'] ) && is_array( $event['role'] ) ) {
            $roles = $event['role'];
        }

        return array(
            'id'       => sanitize_text_field( $event['id'] ?? uniqid( 'evt_', true ) ),
            'title'    => sanitize_text_field( $event['title'] ?? '' ),
            'role'     => array_map( 'sanitize_text_field', $roles ),
            'start'    => sanitize_text_field( $event['start'] ?? '' ),
            'end'      => sanitize_text_field( $event['end'] ?? '' ),
            'fixed'    => ! empty( $event['fixed'] ),
            'notes'    => sanitize_textarea_field( $event['notes'] ?? '' ),
            'location' => isset( $event['location'] ) ? array(
                'label'       => sanitize_text_field( $event['location']['label'] ?? '' ),
                'address'     => sanitize_text_field( $event['location']['address'] ?? '' ),
                'kmFromPrev'  => isset( $event['location']['kmFromPrev'] ) ? floatval( $event['location']['kmFromPrev'] ) : null,
            ) : null,
        );
    }

    /**
     * Pobranie komentarzy timeline.
     */
    protected static function get_comments_for_timeline( $timeline_id ) {
        global $wpdb;

        $table    = $wpdb->prefix . 'alle_timeline_comments';
        $comments = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} WHERE timeline_id = %d ORDER BY created_at ASC", $timeline_id ), ARRAY_A );

        $formatted = array();
        foreach ( $comments as $comment ) {
            $formatted[] = array(
                'id'        => (int) $comment['id'],
                'author'    => $comment['author'],
                'text'      => wp_kses_post( $comment['text'] ),
                'createdAt' => $comment['created_at'],
            );
        }

        return $formatted;
    }
}
