<?php
/**
 * Rejestracja tras REST API dla harmonogramu.
 */
class Allemedia_WT_REST {
    /**
     * Rejestracja hooka inicjalizującego.
     */
    public static function register_routes() {
        add_action( 'rest_api_init', array( __CLASS__, 'register' ) );
    }

    /**
     * Właściwa rejestracja endpointów.
     */
    public static function register() {
        register_rest_route(
            'allemedia/v1',
            '/timelines',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( __CLASS__, 'create_timeline' ),
                'permission_callback' => array( __CLASS__, 'permissions_edit' ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/timelines/(?P<id>\\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( __CLASS__, 'get_timeline' ),
                    'permission_callback' => array( __CLASS__, 'permissions_view' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( __CLASS__, 'update_timeline' ),
                    'permission_callback' => array( __CLASS__, 'permissions_edit' ),
                ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/timelines/(?P<id>\\d+)/export/ics',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( __CLASS__, 'export_ics' ),
                'permission_callback' => array( __CLASS__, 'permissions_view' ),
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/public/(?P<public_id>[A-Za-z0-9_-]+)',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( __CLASS__, 'get_public_timeline' ),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            'allemedia/v1',
            '/public/(?P<public_id>[A-Za-z0-9_-]+)/comments',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( __CLASS__, 'add_public_comment' ),
                'permission_callback' => '__return_true',
            )
        );
    }

    /**
     * Sprawdza uprawnienia do edycji.
     */
    public static function permissions_edit( $request ) {
        return current_user_can( 'edit_posts' );
    }

    /**
     * Sprawdza uprawnienia do podglądu.
     */
    public static function permissions_view( $request ) {
        $id = (int) $request['id'];
        if ( current_user_can( 'edit_post', $id ) ) {
            return true;
        }

        // Pozwól na publiczny dostęp jeśli timeline ma publiczny link.
        $data = allemedia_wt_get_timeline_data( $id );
        if ( $data && ! empty( $data['publicId'] ) && isset( $request['public'] ) && $request['public'] === $data['publicId'] ) {
            return true;
        }

        return current_user_can( 'read_post', $id );
    }

    /**
     * Tworzenie nowego timeline'u.
     */
    public static function create_timeline( WP_REST_Request $request ) {
        $params = $request->get_json_params();

        $title = isset( $params['title'] ) ? sanitize_text_field( $params['title'] ) : __( 'Nowy harmonogram ślubny', 'allemedia-wedding-timeline' );
        $demo  = ! empty( $params['demo'] );

        $post_id = wp_insert_post(
            array(
                'post_title'  => $title,
                'post_type'   => 'wedding_timeline',
                'post_status' => 'publish',
            )
        );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        $date = ! empty( $params['date'] ) ? sanitize_text_field( $params['date'] ) : wp_date( 'Y-m-d', strtotime( 'next saturday' ) );
        $data = $demo ? allemedia_wt_seed_demo( $date ) : array(
            'id'            => (string) $post_id,
            'date'          => $date,
            'ceremonyType'  => 'kosciol',
            'style'         => 'standard',
            'baseLocations' => array(),
            'attendees'     => array(),
            'events'        => array(),
            'lastUpdated'   => current_time( 'mysql' ),
        );

        $data['id']       = (string) $post_id;
        $data['publicId'] = allemedia_wt_generate_public_id();
        $data['pin']      = allemedia_wt_generate_pin();

        allemedia_wt_update_timeline_data( $post_id, $data );

        return rest_ensure_response( $data );
    }

    /**
     * Pobranie timeline'u.
     */
    public static function get_timeline( WP_REST_Request $request ) {
        $id = (int) $request['id'];

        $data = allemedia_wt_get_timeline_data( $id );
        if ( ! $data ) {
            return new WP_Error( 'not_found', __( 'Nie znaleziono harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $data['comments'] = allemedia_wt_get_comments( $id );

        return rest_ensure_response( $data );
    }

    /**
     * Aktualizacja timeline'u.
     */
    public static function update_timeline( WP_REST_Request $request ) {
        $id   = (int) $request['id'];
        $data = $request->get_json_params();

        if ( empty( $data ) ) {
            return new WP_Error( 'invalid', __( 'Brak danych do zapisania.', 'allemedia-wedding-timeline' ), array( 'status' => 400 ) );
        }

        $data['id']          = (string) $id;
        $data['lastUpdated'] = current_time( 'mysql' );

        if ( empty( $data['publicId'] ) ) {
            $data['publicId'] = allemedia_wt_generate_public_id();
        }
        if ( empty( $data['pin'] ) ) {
            $data['pin'] = allemedia_wt_generate_pin();
        }

        allemedia_wt_update_timeline_data( $id, $data );

        return rest_ensure_response( $data );
    }

    /**
     * Eksport do ICS.
     */
    public static function export_ics( WP_REST_Request $request ) {
        $id   = (int) $request['id'];
        $data = allemedia_wt_get_timeline_data( $id );

        if ( ! $data ) {
            return new WP_Error( 'not_found', __( 'Nie znaleziono harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $ics_generator = new Allemedia_ICS();
        $ics_content   = $ics_generator->generate( $data );

        $response = new WP_REST_Response( array( 'ics' => base64_encode( $ics_content ) ) );
        $response->set_headers(
            array(
                'Content-Disposition' => 'attachment; filename="wedding-timeline-' . $id . '.ics"',
                'Content-Type'        => 'application/json',
            )
        );

        return $response;
    }

    /**
     * Pobiera timeline po publicznym ID.
     */
    public static function get_public_timeline( WP_REST_Request $request ) {
        $public_id = sanitize_text_field( $request['public_id'] );
        global $wpdb;
        $table = $wpdb->prefix . 'alle_timeline';

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE public_id = %s", $public_id ), ARRAY_A );
        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Nie znaleziono publicznego harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        $data = json_decode( $row['data'], true );
        if ( ! is_array( $data ) ) {
            $data = array();
        }

        $data['id']       = (string) $row['post_id'];
        $data['publicId'] = $row['public_id'];
        $data['comments'] = allemedia_wt_get_comments( (int) $row['post_id'] );

        return rest_ensure_response( $data );
    }

    /**
     * Dodawanie komentarza publicznego z PIN.
     */
    public static function add_public_comment( WP_REST_Request $request ) {
        $public_id = sanitize_text_field( $request['public_id'] );
        $params    = $request->get_json_params();
        $pin       = isset( $params['pin'] ) ? sanitize_text_field( $params['pin'] ) : '';
        $author    = isset( $params['author'] ) ? sanitize_text_field( $params['author'] ) : __( 'Gość', 'allemedia-wedding-timeline' );
        $comment   = isset( $params['comment'] ) ? wp_kses_post( $params['comment'] ) : '';

        global $wpdb;
        $table = $wpdb->prefix . 'alle_timeline';
        $row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE public_id = %s", $public_id ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Nie znaleziono harmonogramu.', 'allemedia-wedding-timeline' ), array( 'status' => 404 ) );
        }

        if ( $row['pin'] !== $pin ) {
            return new WP_Error( 'invalid_pin', __( 'Niepoprawny PIN.', 'allemedia-wedding-timeline' ), array( 'status' => 401 ) );
        }

        if ( empty( $comment ) ) {
            return new WP_Error( 'invalid_comment', __( 'Komentarz nie może być pusty.', 'allemedia-wedding-timeline' ), array( 'status' => 400 ) );
        }

        allemedia_wt_insert_comment( (int) $row['post_id'], $author, $comment );

        return rest_ensure_response( allemedia_wt_get_comments( (int) $row['post_id'] ) );
    }
}
