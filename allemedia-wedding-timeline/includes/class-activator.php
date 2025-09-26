<?php
/**
 * Klasa obsługująca aktywację pluginu.
 */
class Allemedia_WT_Activator {

    /**
     * Uruchamiana podczas aktywacji.
     */
    public static function activate() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        $table_timelines = $wpdb->prefix . 'alle_timeline';
        $sql_timelines   = "CREATE TABLE {$table_timelines} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            post_id bigint(20) unsigned NOT NULL,
            data_json LONGTEXT NOT NULL,
            public_id varchar(32) DEFAULT NULL,
            pin varchar(10) DEFAULT NULL,
            last_updated datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY post_id (post_id),
            KEY public_id (public_id)
        ) {$charset_collate};";

        $table_events = $wpdb->prefix . 'alle_timeline_events';
        $sql_events   = "CREATE TABLE {$table_events} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            timeline_id bigint(20) unsigned NOT NULL,
            event_json LONGTEXT NOT NULL,
            PRIMARY KEY  (id),
            KEY timeline_id (timeline_id)
        ) {$charset_collate};";

        $table_comments = $wpdb->prefix . 'alle_timeline_comments';
        $sql_comments   = "CREATE TABLE {$table_comments} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            timeline_id bigint(20) unsigned NOT NULL,
            author varchar(191) NOT NULL,
            text LONGTEXT NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY timeline_id (timeline_id)
        ) {$charset_collate};";

        dbDelta( $sql_timelines );
        dbDelta( $sql_events );
        dbDelta( $sql_comments );
    }
}
