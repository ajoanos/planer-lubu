<?php
/**
 * Szablon shortcode'u - mount React.
 */
$timeline_id = absint( $atts['id'] );
$view        = sanitize_text_field( $atts['view'] );
$print       = sanitize_text_field( $atts['print'] );
?>
<div class="allemedia-wt-public" data-view="<?php echo esc_attr( $view ); ?>" data-print="<?php echo esc_attr( $print ); ?>" data-id="<?php echo esc_attr( $timeline_id ); ?>">
    <div id="allemedia-wt-root" data-view="public" data-id="<?php echo esc_attr( $timeline_id ); ?>"></div>
</div>
