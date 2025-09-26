<?php
$public_param = isset( $_GET['t'] ) ? sanitize_text_field( wp_unslash( $_GET['t'] ) ) : '';
$qr_svg       = '';
if ( $public_param ) {
    $qr          = new Allemedia_WT_QR();
    $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';
    $current_url = home_url( $request_uri );
    $qr_target   = esc_url_raw( add_query_arg( 't', $public_param, $current_url ) );
    $qr_svg      = $qr->render_svg( $qr_target, 180 );
}
?>
<div class="allemedia-wt" id="allemedia-wt-public" data-shortcode="true" data-timeline-id="<?php echo esc_attr( $timeline_id_attr ); ?>" data-view="<?php echo esc_attr( $view_mode ); ?>" data-print="<?php echo esc_attr( $print_variant ); ?>">
    <main class="wt-main" aria-live="polite">
        <?php if ( $qr_svg ) : ?>
            <div class="wt-qr" aria-hidden="true"><?php echo $qr_svg; // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
        <?php endif; ?>
    </main>
</div>
