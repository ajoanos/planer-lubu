<?php
/** @var array $seed */
?>
<div class="allemedia-wt" id="allemedia-wt-admin" data-seed='<?php echo esc_attr( wp_json_encode( $seed ) ); ?>'>
    <header class="wt-header">
        <h1 class="wt-title"><?php esc_html_e( 'Wedding Timeline', 'allemedia-wedding-timeline' ); ?></h1>
        <p class="wt-subtitle"><?php esc_html_e( 'Stwórz harmonogram dnia ślubu, udostępnij ekipie i kontroluj tryb LIVE.', 'allemedia-wedding-timeline' ); ?></p>
        <button class="wt-btn" type="button" id="wt-load-demo"><?php esc_html_e( 'Załaduj demo', 'allemedia-wedding-timeline' ); ?></button>
    </header>
    <main class="wt-main" aria-live="polite"></main>
    <aside class="wt-aside" id="wt-self-test">
        <h2><?php esc_html_e( 'Self-test ICS', 'allemedia-wedding-timeline' ); ?></h2>
        <?php
        $ics_preview = ( new Allemedia_WT_ICS() )->generate( allemedia_wt_get_demo_timeline() );
        ?>
        <textarea readonly rows="12" class="wt-textarea"><?php echo esc_textarea( $ics_preview ); ?></textarea>
        <p class="description"><?php esc_html_e( 'To szybki test poprawności eksportu ICS na bazie danych demo.', 'allemedia-wedding-timeline' ); ?></p>
    </aside>
</div>
