<?php
/**
 * Pomocnicze funkcje pluginu.
 *
 * @package Allemedia_Wedding_Timeline
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Dane demo harmonogramu.
 *
 * @return array
 */
function allemedia_wt_get_demo_timeline() {
    $seed_json = file_get_contents( ALLEMEDIA_WT_PATH . 'includes/seed.json' );
    if ( ! $seed_json ) {
        return array();
    }

    $data = json_decode( $seed_json, true );
    return is_array( $data ) ? $data : array();
}

/**
 * Aktualny użytkownik w formie prostego payloadu.
 */
function allemedia_wt_get_current_user_payload() {
    $user = wp_get_current_user();

    if ( ! $user || 0 === $user->ID ) {
        return null;
    }

    return array(
        'id'    => $user->ID,
        'name'  => $user->display_name,
        'email' => $user->user_email,
    );
}

/**
 * Teksty interfejsu.
 */
function allemedia_wt_get_strings() {
    return array(
        'wizardTitle'   => __( 'Generator harmonogramu ślubu', 'allemedia-wedding-timeline' ),
        'generate'      => __( 'Generuj timeline', 'allemedia-wedding-timeline' ),
        'save'          => __( 'Zapisz zmiany', 'allemedia-wedding-timeline' ),
        'loading'       => __( 'Wczytywanie...', 'allemedia-wedding-timeline' ),
        'liveDelay'     => __( 'Tryb LIVE – opóźnij:', 'allemedia-wedding-timeline' ),
        'minutes'       => __( 'min', 'allemedia-wedding-timeline' ),
        'commentPrompt' => __( 'Dodaj komentarz (PIN wymagany)', 'allemedia-wedding-timeline' ),
        'printGuest'    => __( 'Drukuj (Goście)', 'allemedia-wedding-timeline' ),
        'printCrew'     => __( 'Drukuj (Ekipa)', 'allemedia-wedding-timeline' ),
        'downloadICS'   => __( 'Pobierz ICS', 'allemedia-wedding-timeline' ),
        'publicLink'    => __( 'Udostępnij link', 'allemedia-wedding-timeline' ),
        'historyLabel'  => __( 'Historia zmian', 'allemedia-wedding-timeline' ),
    );
}

/**
 * Bezpieczne pobranie timeline z bazy.
 *
 * @param int $post_id ID wpisu.
 */
function allemedia_wt_get_timeline_from_post( $post_id ) {
    global $wpdb;

    $table = $wpdb->prefix . 'alle_timeline';
    $row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE post_id = %d", $post_id ), ARRAY_A );

    if ( ! $row ) {
        return null;
    }

    $timeline = json_decode( $row['data_json'], true );
    if ( ! is_array( $timeline ) ) {
        return null;
    }

    $timeline['id']          = (int) $row['id'];
    $timeline['publicId']    = $row['public_id'];
    $timeline['pin']         = $row['pin'];
    $timeline['lastUpdated'] = $row['last_updated'];

    return $timeline;
}

/**
 * Generowanie nowego publicznego ID.
 */
function allemedia_wt_generate_public_id() {
    return wp_generate_password( 12, false, false );
}

/**
 * Generowanie PIN (4-6 cyfr).
 */
function allemedia_wt_generate_pin() {
    return wp_rand( 1000, 999999 );
}

/**
 * Aktualizacja znaczników czasu w bazie.
 */
function allemedia_wt_update_last_updated( $timeline_id ) {
    global $wpdb;

    $table = $wpdb->prefix . 'alle_timeline';
    $wpdb->update(
        $table,
        array( 'last_updated' => current_time( 'mysql' ) ),
        array( 'id' => $timeline_id ),
        array( '%s' ),
        array( '%d' )
    );
}
