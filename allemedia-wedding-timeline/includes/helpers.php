<?php
/**
 * Funkcje pomocnicze dla wtyczki.
 */

/**
 * Zwraca tablicę danych timeline'u z bazy.
 */
function allemedia_wt_get_timeline_data( $timeline_id ) {
    global $wpdb;
    $table = $wpdb->prefix . 'alle_timeline';

    $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE post_id = %d", $timeline_id ), ARRAY_A );
    if ( ! $row ) {
        return null;
    }

    $data = json_decode( $row['data'], true );
    if ( ! is_array( $data ) ) {
        $data = array();
    }

    $data['id']          = (string) $timeline_id;
    $data['publicId']    = $row['public_id'];
    $data['pin']         = $row['pin'];
    $data['lastUpdated'] = $row['last_updated'];

    return $data;
}

/**
 * Aktualizuje dane timeline'u.
 */
function allemedia_wt_update_timeline_data( $timeline_id, $data ) {
    global $wpdb;
    $table = $wpdb->prefix . 'alle_timeline';

    $public_id = isset( $data['publicId'] ) ? sanitize_text_field( $data['publicId'] ) : null;
    $pin       = isset( $data['pin'] ) ? sanitize_text_field( $data['pin'] ) : null;

    $wpdb->replace(
        $table,
        array(
            'post_id'      => $timeline_id,
            'public_id'    => $public_id,
            'pin'          => $pin,
            'data'         => wp_json_encode( $data ),
            'last_updated' => current_time( 'mysql' ),
        ),
        array(
            '%d',
            '%s',
            '%s',
            '%s',
            '%s',
        )
    );
}

/**
 * Generuje publiczny identyfikator.
 */
function allemedia_wt_generate_public_id() {
    return substr( str_replace( array( '+', '/', '=' ), '', base64_encode( random_bytes( 8 ) ) ), 0, 10 );
}

/**
 * Generuje PIN do komentarzy.
 */
function allemedia_wt_generate_pin() {
    return (string) wp_rand( 1000, 999999 );
}

/**
 * Zwraca przykładowy seed timeline.
 */
function allemedia_wt_seed_demo( $date ) {
    $base_date = new DateTimeImmutable( $date . ' 08:00:00', new DateTimeZone( 'Europe/Warsaw' ) );
    $events    = array();

    $append = function ( $title, $start_offset, $duration, $roles = array( 'Para' ), $location = array(), $notes = '' ) use ( &$events, $base_date ) {
        $start = $base_date->modify( '+' . $start_offset . ' minutes' );
        $end   = $start->modify( '+' . $duration . ' minutes' );
        $events[] = array(
            'id'    => uniqid( 'evt_', true ),
            'title' => $title,
            'role'  => $roles,
            'start' => $start->format( DateTimeInterface::ATOM ),
            'end'   => $end->format( DateTimeInterface::ATOM ),
            'location' => $location,
            'notes' => $notes,
        );
    };

    $append( 'Przygotowania Panny Młodej', 0, 120, array( 'Para', 'Foto', 'Wideo', 'MUAH' ), array(
        'label'   => 'Dom Panny Młodej',
        'address' => 'Kraków',
    ), 'Spokojne przygotowania, detale.' );
    $append( 'Przygotowania Pana Młodego', 30, 90, array( 'Para', 'Foto', 'Wideo' ), array(
        'label'   => 'Dom Pana Młodego',
        'address' => 'Skawina',
        'kmFromPrev' => 12,
    ) );
    $append( 'First look', 160, 20, array( 'Para', 'Foto', 'Wideo' ), array(
        'label'   => 'Ogród domu PM',
        'kmFromPrev' => 2,
    ), 'Czas na intymną chwilę.' );
    $append( 'Przejazd do kościoła', 185, 30, array( 'Para', 'Foto', 'Wideo', 'Goście' ), array(
        'label'   => 'Kościół św. Anny',
        'address' => 'Kraków',
        'kmFromPrev' => 18,
    ), 'Planowany bufor na ruch miejski.' );
    $append( 'Ceremonia kościelna', 220, 75, array( 'Para', 'Foto', 'Wideo', 'Goście' ), array(
        'label'   => 'Kościół św. Anny',
    ), 'Czytania, msza i życzenia.' );
    $append( 'Zdjęcia rodzinne', 300, 45, array( 'Para', 'Foto', 'Wideo' ), array(
        'label'   => 'Plac przy kościele',
    ), 'Lista grup: rodzina, świadkowie, przyjaciele.' );
    $append( 'Przejazd na salę', 350, 35, array( 'Para', 'Foto', 'Wideo', 'Goście' ), array(
        'label'   => 'Oaza Leńcze – sala',
        'address' => 'Leńcze',
        'kmFromPrev' => 28,
    ), 'Bufor na korki wieczorne.' );
    $append( 'Wejście na salę', 390, 15, array( 'Para', 'DJ', 'Goście' ), array(
        'label' => 'Oaza Leńcze – sala',
    ), 'Powitanie i chleb z solą.' );
    $append( 'Obiad serwowany', 420, 60, array( 'Goście', 'DJ' ), array(
        'label' => 'Oaza Leńcze – sala',
    ) );
    $append( 'Sesja plenerowa o zachodzie', 470, 40, array( 'Para', 'Foto', 'Wideo' ), array(
        'label'   => 'Punkt widokowy Lanckorona',
        'kmFromPrev' => 6,
    ), 'Zachód słońca około 19:20.' );
    $append( 'Tort weselny', 540, 20, array( 'Para', 'Goście', 'DJ' ), array(
        'label' => 'Oaza Leńcze – sala',
    ) );
    $append( 'Pierwszy taniec', 560, 20, array( 'Para', 'Goście', 'DJ' ), array(
        'label' => 'Oaza Leńcze – parkiet',
    ), 'Choreografia walc angielski.' );
    $append( 'Zabawa taneczna', 580, 180, array( 'Goście', 'DJ' ), array(
        'label' => 'Oaza Leńcze – parkiet',
    ) );
    $append( 'Poprawiny', 780, 120, array( 'Para', 'Goście', 'DJ' ), array(
        'label' => 'Oaza Leńcze – sala',
    ), 'Opcjonalnie, w razie potrzeby.' );

    return array(
        'id'            => '',
        'date'          => $date,
        'ceremonyType'  => 'kosciol',
        'style'         => 'standard',
        'baseLocations' => array(
            'gettingReady' => array(
                'label'   => 'Dom Panny Młodej',
                'address' => 'Kraków',
            ),
            'ceremony'     => array(
                'label'   => 'Kościół św. Anny',
                'address' => 'Kraków',
            ),
            'portrait'     => array(
                'label'   => 'Punkt widokowy Lanckorona',
                'address' => 'Lanckorona',
            ),
            'reception'    => array(
                'label'   => 'Oaza Leńcze – sala',
                'address' => 'Leńcze',
            ),
        ),
        'attendees' => array(
            array(
                'name'  => 'Anna Nowak',
                'role'  => 'Para',
                'email' => 'anna@example.com',
            ),
            array(
                'name'  => 'Piotr Kowalski',
                'role'  => 'Para',
                'email' => 'piotr@example.com',
            ),
            array(
                'name'  => 'Studio XYZ Foto',
                'role'  => 'Foto',
                'email' => 'foto@example.com',
            ),
            array(
                'name'  => 'DJ Sunrise',
                'role'  => 'DJ',
                'email' => 'dj@example.com',
            ),
        ),
        'events'      => $events,
        'lastUpdated' => current_time( 'mysql' ),
    );
}

/**
 * Dodaje komentarz publiczny.
 */
function allemedia_wt_insert_comment( $timeline_id, $author, $text ) {
    global $wpdb;
    $table = $wpdb->prefix . 'alle_timeline_comments';

    $wpdb->insert(
        $table,
        array(
            'timeline_id'  => $timeline_id,
            'author'       => $author,
            'comment_text' => $text,
            'created_at'   => current_time( 'mysql' ),
        ),
        array( '%d', '%s', '%s', '%s' )
    );
}

/**
 * Pobiera komentarze powiązane z timeline.
 */
function allemedia_wt_get_comments( $timeline_id ) {
    global $wpdb;
    $table = $wpdb->prefix . 'alle_timeline_comments';

    return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table WHERE timeline_id = %d ORDER BY created_at ASC", $timeline_id ), ARRAY_A );
}
