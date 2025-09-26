<?php
/**
 * Aktywator wtyczki - tworzenie tabel i podstawowych ustawień.
 */
class Allemedia_WT_Activator {
    /**
     * Uruchamiany przy aktywacji wtyczki.
     */
    public static function activate() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $timeline_table = $wpdb->prefix . 'alle_timeline';
        $events_table   = $wpdb->prefix . 'alle_timeline_events';
        $comments_table = $wpdb->prefix . 'alle_timeline_comments';

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Tabela główna timeline.
        $sql_timeline = "CREATE TABLE $timeline_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            post_id BIGINT UNSIGNED NOT NULL,
            public_id VARCHAR(32) NULL,
            pin VARCHAR(8) NULL,
            data LONGTEXT NULL,
            last_updated DATETIME NULL,
            PRIMARY KEY  (id),
            KEY post_id (post_id),
            KEY public_id (public_id)
        ) $charset_collate;";

        // Tabela eventów - do rozbudowy w przyszłości (np. sync z innymi systemami).
        $sql_events = "CREATE TABLE $events_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            timeline_id BIGINT UNSIGNED NOT NULL,
            event_id VARCHAR(64) NOT NULL,
            data LONGTEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            KEY timeline_id (timeline_id),
            KEY event_id (event_id)
        ) $charset_collate;";

        // Tabela komentarzy publicznych.
        $sql_comments = "CREATE TABLE $comments_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            timeline_id BIGINT UNSIGNED NOT NULL,
            author VARCHAR(120) NOT NULL,
            comment_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY timeline_id (timeline_id)
        ) $charset_collate;";

        dbDelta( $sql_timeline );
        dbDelta( $sql_events );
        dbDelta( $sql_comments );
    }
}
