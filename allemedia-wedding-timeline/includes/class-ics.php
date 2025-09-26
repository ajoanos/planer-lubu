<?php
/**
 * Generator plików ICS.
 */
class Allemedia_WT_ICS {

    /**
     * Generowanie ICS dla timeline'u.
     *
     * @param array $timeline Dane timeline.
     * @param array|null $event_ids Lista ID eventów do eksportu.
     * @param string $tz Strefa czasowa.
     * @param int $alarm_minutes Minuty przed eventem.
     */
    public function generate( array $timeline, ?array $event_ids = null, $tz = 'Europe/Warsaw', $alarm_minutes = 30 ) {
        $lines = array(
            'BEGIN:VCALENDAR',
            'PRODID:-//Allemedia//Wedding Timeline//PL',
            'VERSION:2.0',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        );

        $events = $timeline['events'] ?? array();
        if ( $event_ids ) {
            $events = array_filter(
                $events,
                function ( $event ) use ( $event_ids ) {
                    return in_array( $event['id'], $event_ids, true );
                }
            );
        }

        foreach ( $events as $event ) {
            $lines = array_merge( $lines, $this->format_event( $event, $tz, $alarm_minutes ) );
        }

        $lines[] = 'END:VCALENDAR';

        return implode( "\r\n", $lines ) . "\r\n";
    }

    /**
     * Formatowanie pojedynczego wydarzenia.
     */
    protected function format_event( $event, $tz, $alarm_minutes ) {
        $uid      = sanitize_title( $event['id'] ) . '@allemedia-wedding-timeline';
        $dtstamp  = gmdate( 'Ymd\THis\Z' );
        $start    = $this->format_datetime( $event['start'], $tz );
        $end      = $this->format_datetime( $event['end'], $tz );
        $summary  = $this->escape( $event['title'] ?? __( 'Wydarzenie', 'allemedia-wedding-timeline' ) );
        $location = isset( $event['location']['label'] ) ? $this->escape( $event['location']['label'] ) : '';
        $description = $this->escape( $event['notes'] ?? '' );

        $lines = array(
            'BEGIN:VEVENT',
            'UID:' . $uid,
            'DTSTAMP:' . $dtstamp,
            'DTSTART;TZID=' . $tz . ':' . $start,
            'DTEND;TZID=' . $tz . ':' . $end,
            'SUMMARY:' . $summary,
        );

        if ( $location ) {
            $lines[] = 'LOCATION:' . $location;
        }

        if ( $description ) {
            $lines[] = 'DESCRIPTION:' . $description;
        }

        if ( $alarm_minutes > 0 ) {
            $lines[] = 'BEGIN:VALARM';
            $lines[] = 'TRIGGER:-PT' . intval( $alarm_minutes ) . 'M';
            $lines[] = 'ACTION:DISPLAY';
            $lines[] = 'DESCRIPTION:' . $summary;
            $lines[] = 'END:VALARM';
        }

        $lines[] = 'END:VEVENT';

        return $lines;
    }

    /**
     * Formatowanie daty.
     */
    protected function format_datetime( $datetime, $tz ) {
        $time = new DateTime( $datetime, new DateTimeZone( $tz ) );
        return $time->format( 'Ymd\THis' );
    }

    /**
     * Escapowanie linii ICS (folding zgodnie z RFC).
     */
    protected function escape( $string ) {
        $string = str_replace( array( '\\', ';', ',', "\n" ), array( '\\\\', '\\;', '\\,', '\\n' ), $string );
        $lines  = str_split( $string, 60 );
        $folded = array_shift( $lines );
        if ( null === $folded ) {
            return '';
        }
        foreach ( $lines as $line ) {
            $folded .= "\r\n " . $line;
        }
        return $folded;
    }
}
