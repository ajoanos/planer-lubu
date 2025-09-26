<?php
/**
 * Generator plików ICS.
 */
class Allemedia_ICS {
    /**
     * Generuje plik ICS z danych timeline'u.
     */
    public function generate( $timeline, $event_ids = null ) {
        $lines = array(
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Allemedia//Wedding Timeline//PL',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        );

        $tz = 'Europe/Warsaw';
        $lines[] = 'BEGIN:VTIMEZONE';
        $lines[] = 'TZID:' . $tz;
        $lines[] = 'X-LIC-LOCATION:' . $tz;
        $lines[] = 'BEGIN:STANDARD';
        $lines[] = 'TZOFFSETFROM:+0200';
        $lines[] = 'TZOFFSETTO:+0100';
        $lines[] = 'TZNAME:CET';
        $lines[] = 'DTSTART:19701025T030000';
        $lines[] = 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU';
        $lines[] = 'END:STANDARD';
        $lines[] = 'BEGIN:DAYLIGHT';
        $lines[] = 'TZOFFSETFROM:+0100';
        $lines[] = 'TZOFFSETTO:+0200';
        $lines[] = 'TZNAME:CEST';
        $lines[] = 'DTSTART:19700329T020000';
        $lines[] = 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU';
        $lines[] = 'END:DAYLIGHT';
        $lines[] = 'END:VTIMEZONE';

        $events = isset( $timeline['events'] ) ? $timeline['events'] : array();
        foreach ( $events as $event ) {
            if ( $event_ids && ! in_array( $event['id'], $event_ids, true ) ) {
                continue;
            }

            $uid      = isset( $event['id'] ) ? $event['id'] : uniqid( 'evt_', true );
            $summary  = $this->escape_text( $event['title'] ?? 'Wydarzenie' );
            $location = $this->escape_text( $event['location']['label'] ?? '' );
            $desc     = $this->escape_text( $event['notes'] ?? '' );
            $start    = $this->format_datetime( $event['start'], $tz );
            $end      = $this->format_datetime( $event['end'], $tz );

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $uid . '@allemedia.pl';
            $now     = function_exists( 'current_time' ) ? current_time( 'mysql' ) : gmdate( 'Y-m-d H:i:s' );
            $lines[] = 'DTSTAMP:' . $this->format_datetime( $now, 'UTC', true );
            $lines[] = 'DTSTART;TZID=' . $tz . ':' . $start;
            $lines[] = 'DTEND;TZID=' . $tz . ':' . $end;
            $lines[] = 'SUMMARY:' . $summary;
            if ( ! empty( $location ) ) {
                $lines[] = 'LOCATION:' . $location;
            }
            if ( ! empty( $desc ) ) {
                $lines[] = 'DESCRIPTION:' . $desc;
            }
            $lines[] = 'BEGIN:VALARM';
            $lines[] = 'TRIGGER:-PT30M';
            $lines[] = 'ACTION:DISPLAY';
            $lines[] = 'DESCRIPTION:Przypomnienie';
            $lines[] = 'END:VALARM';
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        return implode( "\r\n", $lines );
    }

    /**
     * Escape tekstu zgodnie ze specyfikacją ICS.
     */
    private function escape_text( $text ) {
        if ( function_exists( 'wp_strip_all_tags' ) ) {
            $text = wp_strip_all_tags( (string) $text );
        } else {
            $text = strip_tags( (string) $text );
        }
        $text = str_replace( '\\', '\\\\', $text );
        $text = str_replace( ';', '\\;', $text );
        $text = str_replace( ',', '\\,', $text );
        $text = str_replace( "\n", '\\n', $text );
        return $text;
    }

    /**
     * Formatuje datę do ICS.
     */
    private function format_datetime( $datetime, $tz = 'UTC', $utc = false ) {
        if ( empty( $datetime ) ) {
            return '';
        }

        try {
            $date = new DateTime( $datetime, new DateTimeZone( $utc ? 'UTC' : $tz ) );
        } catch ( Exception $e ) {
            $date = new DateTime( '@' . strtotime( $datetime ) );
        }

        if ( $utc ) {
            $date->setTimezone( new DateTimeZone( 'UTC' ) );
            return $date->format( 'Ymd\THis\Z' );
        }

        return $date->format( 'Ymd\THis' );
    }
}
