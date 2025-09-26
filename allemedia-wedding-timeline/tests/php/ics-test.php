<?php
require_once __DIR__ . '/../../includes/class-ics.php';

$generator = new Allemedia_ICS();
$timeline  = array(
    'date'   => '2024-09-14',
    'events' => array(
        array(
            'id'    => 'evt_1',
            'title' => 'Ceremonia',
            'start' => '2024-09-14T15:00:00+02:00',
            'end'   => '2024-09-14T16:00:00+02:00',
            'location' => array( 'label' => 'Kościół' ),
            'notes'    => 'Uroczystość'
        )
    )
);

$ics = $generator->generate( $timeline );

if ( strpos( $ics, 'SUMMARY:Ceremonia' ) === false ) {
    echo "[FAIL] Brak tytułu w ICS\n";
    exit( 1 );
}

echo "[OK] ICS zawiera poprawne dane.\n";
