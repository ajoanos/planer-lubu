<?php
/**
 * Bardzo lekki generator pseudo-QR w SVG.
 * TODO: w przyszłości podmienić na pełną implementację standardu QR (np. biblioteka open source).
 */
class Allemedia_WT_QR {
    /**
     * Generuje proste SVG na podstawie ciągu znaków.
     */
    public function generate_svg( $text, $size = 200 ) {
        $hash   = hash( 'sha256', $text );
        $grid   = 21; // przybliżony rozmiar QR v1.
        $module = (int) floor( $size / $grid );

        $rects = array();
        for ( $y = 0; $y < $grid; $y++ ) {
            for ( $x = 0; $x < $grid; $x++ ) {
                $index = ( $y * $grid + $x ) % strlen( $hash );
                $bit   = hexdec( $hash[ $index ] ) % 2 === 0;

                // Zachowaj trzy znaczniki finder pattern aby przypominało QR.
                if ( self::is_finder_pattern( $x, $y, $grid ) ) {
                    $bit = true;
                }

                if ( $bit ) {
                    $rects[] = sprintf( '<rect x="%d" y="%d" width="%d" height="%d" />', $x * $module, $y * $module, $module, $module );
                }
            }
        }

        $svg  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . ( $grid * $module ) . ' ' . ( $grid * $module ) . '" fill="#000" shape-rendering="crispEdges">';
        $svg .= '<rect width="100%" height="100%" fill="#fff" />';
        $svg .= '<g fill="#000">' . implode( '', $rects ) . '</g>';
        $svg .= '</svg>';

        return $svg;
    }

    /**
     * Określa czy dana komórka powinna być częścią wzoru finder pattern.
     */
    private static function is_finder_pattern( $x, $y, $grid ) {
        $patterns = array(
            array( 0, 0 ),
            array( $grid - 7, 0 ),
            array( 0, $grid - 7 ),
        );

        foreach ( $patterns as $pattern ) {
            list( $px, $py ) = $pattern;
            if ( $x >= $px && $x < $px + 7 && $y >= $py && $y < $py + 7 ) {
                if ( $x === $px || $x === $px + 6 || $y === $py || $y === $py + 6 ) {
                    return true;
                }
                if ( $x >= $px + 2 && $x <= $px + 4 && $y >= $py + 2 && $y <= $py + 4 ) {
                    return true;
                }
            }
        }

        return false;
    }
}
