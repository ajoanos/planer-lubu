<?php
/**
 * Minimalistyczny generator QR w SVG (wersja 1-M, alfanumeryczna).
 */
class Allemedia_WT_QR {

    /**
     * Dozwolone znaki trybu alfanumerycznego.
     */
    protected $alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

    /**
     * Renderowanie QR jako SVG.
     */
    public function render_svg( $text, $size = 256 ) {
        $text = strtoupper( sanitize_text_field( $text ) );
        $text = preg_replace( '/[^0-9A-Z $%*+\-\.\/:]/', '', $text );
        if ( '' === $text ) {
            $text = 'ALLEMEDIA';
        }
        if ( strlen( $text ) > 25 ) {
            $text = substr( $text, 0, 25 );
        }

        $modules = $this->build_matrix( $text );
        $count   = count( $modules );

        $svg  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . ( $count + 8 ) . ' ' . ( $count + 8 ) . '" width="' . intval( $size ) . '" height="' . intval( $size ) . '" role="img" aria-label="QR code">';
        $svg .= '<rect width="100%" height="100%" fill="white" />';
        $svg .= '<g transform="translate(4,4)" fill="black">';

        for ( $y = 0; $y < $count; $y++ ) {
            for ( $x = 0; $x < $count; $x++ ) {
                if ( $modules[ $y ][ $x ] ) {
                    $svg .= '<rect x="' . $x . '" y="' . $y . '" width="1" height="1" />';
                }
            }
        }

        $svg .= '</g></svg>';

        return $svg;
    }

    /**
     * Budowanie macierzy QR.
     */
    protected function build_matrix( $text ) {
        $data_codewords = $this->encode_text( $text );
        $data_with_ecc  = $this->add_error_correction( $data_codewords );
        $matrix         = $this->init_matrix();
        $this->fixed    = $this->init_fixed();
        $this->draw_function_patterns( $matrix );
        $this->draw_data( $matrix, $data_with_ecc );
        $this->apply_mask( $matrix, 0 );
        $this->draw_format_info( $matrix, 0 );
        return $matrix;
    }

    /**
     * Kodowanie tekstu do trybu alfanumerycznego.
     */
    protected function encode_text( $text ) {
        $bits = '0010'; // mode indicator
        $bits .= str_pad( decbin( strlen( $text ) ), 9, '0', STR_PAD_LEFT );

        $i = 0;
        while ( $i + 1 < strlen( $text ) ) {
            $value = $this->alphabet_pos( $text[ $i ] ) * 45 + $this->alphabet_pos( $text[ $i + 1 ] );
            $bits .= str_pad( decbin( $value ), 11, '0', STR_PAD_LEFT );
            $i += 2;
        }
        if ( $i < strlen( $text ) ) {
            $bits .= str_pad( decbin( $this->alphabet_pos( $text[ $i ] ) ), 6, '0', STR_PAD_LEFT );
        }

        $bits .= '0000';
        $bits = str_pad( $bits, ceil( strlen( $bits ) / 8 ) * 8, '0', STR_PAD_RIGHT );

        $bytes = array();
        for ( $i = 0; $i < strlen( $bits ); $i += 8 ) {
            $bytes[] = bindec( substr( $bits, $i, 8 ) );
        }

        $pad_bytes = array( 0xEC, 0x11 );
        $idx       = 0;
        while ( count( $bytes ) < 16 ) { // wersja 1-M
            $bytes[] = $pad_bytes[ $idx % 2 ];
            $idx++;
        }

        return $bytes;
    }

    /**
     * Dodanie kodów korekcyjnych Reed-Solomon (GF(256)).
     */
    protected function add_error_correction( array $data ) {
        $degree    = 10;
        $generator = $this->rs_generator_poly( $degree );
        $ec        = array_fill( 0, $degree, 0 );

        foreach ( $data as $byte ) {
            $factor = $byte ^ array_shift( $ec );
            $ec[]   = 0;
            for ( $i = 0; $i < $degree; $i++ ) {
                $coef = $generator[ $i + 1 ];
                if ( 0 === $coef ) {
                    continue;
                }
                $ec[ $i ] ^= $this->gf_mul( $coef, $factor );
            }
        }

        return array_merge( $data, $ec );
    }

    /**
     * Tworzenie pustej macierzy 21x21.
     */
    protected function init_matrix() {
        $matrix = array();
        for ( $y = 0; $y < 21; $y++ ) {
            $matrix[ $y ] = array_fill( 0, 21, null );
        }
        return $matrix;
    }

    protected function init_fixed() {
        $matrix = array();
        for ( $y = 0; $y < 21; $y++ ) {
            $matrix[ $y ] = array_fill( 0, 21, false );
        }
        return $matrix;
    }

    /**
     * Rysowanie elementów stałych.
     */
    protected function draw_function_patterns( array &$matrix ) {
        $this->draw_finder( $matrix, 0, 0 );
        $this->draw_finder( $matrix, 0, 14 );
        $this->draw_finder( $matrix, 14, 0 );

        for ( $i = 0; $i < 8; $i++ ) {
            $this->set_module( $matrix, 7, $i, 0, true );
            $this->set_module( $matrix, $i, 7, 0, true );
            $this->set_module( $matrix, 7, 20 - $i, 0, true );
            $this->set_module( $matrix, 20 - $i, 7, 0, true );
        }

        for ( $i = 8; $i < 13; $i++ ) {
            $this->set_module( $matrix, 6, $i, ( $i % 2 === 0 ) ? 1 : 0, true );
            $this->set_module( $matrix, $i, 6, ( $i % 2 === 0 ) ? 1 : 0, true );
        }

        // timing pattern
        for ( $i = 0; $i < 21; $i++ ) {
            if ( $matrix[ 6 ][ $i ] === null ) {
                $this->set_module( $matrix, 6, $i, ( $i % 2 === 0 ) ? 1 : 0, true );
            }
            if ( $matrix[ $i ][ 6 ] === null ) {
                $this->set_module( $matrix, $i, 6, ( $i % 2 === 0 ) ? 1 : 0, true );
            }
        }

        // ciemny moduł
        $this->set_module( $matrix, 13, 8, 1, true );
    }

    protected function draw_finder( array &$matrix, $row, $col ) {
        for ( $r = -1; $r <= 7; $r++ ) {
            for ( $c = -1; $c <= 7; $c++ ) {
                $y = $row + $r;
                $x = $col + $c;
                if ( $y < 0 || $y >= 21 || $x < 0 || $x >= 21 ) {
                    continue;
                }
                if ( $r === -1 || $r === 7 || $c === -1 || $c === 7 ) {
                    $this->set_module( $matrix, $y, $x, 0, true );
                } elseif ( $r === 0 || $r === 6 || $c === 0 || $c === 6 ) {
                    $this->set_module( $matrix, $y, $x, 1, true );
                } elseif ( $r >= 2 && $r <= 4 && $c >= 2 && $c <= 4 ) {
                    $this->set_module( $matrix, $y, $x, 1, true );
                } else {
                    $this->set_module( $matrix, $y, $x, 0, true );
                }
            }
        }
    }

    /**
     * Umieszczanie danych.
     */
    protected function draw_data( array &$matrix, array $codewords ) {
        $bit_index = 0;
        $direction = -1;
        $x = 20;
        $y = 20;

        while ( $x > 0 ) {
            if ( $x === 6 ) {
                $x--;
            }
            for ( $i = 0; $i < 21; $i++ ) {
                $row = $y + $direction * $i;
                if ( $row < 0 || $row >= 21 ) {
                    continue;
                }
                for ( $j = 0; $j < 2; $j++ ) {
                    $col = $x - $j;
                    if ( $this->fixed[ $row ][ $col ] ) {
                        continue;
                    }
                    $codeword_index = intdiv( $bit_index, 8 );
                    $bit = 0;
                    if ( isset( $codewords[ $codeword_index ] ) ) {
                        $bit = ( $codewords[ $codeword_index ] >> ( 7 - ( $bit_index % 8 ) ) ) & 1;
                    }
                    $this->set_module( $matrix, $row, $col, $bit );
                    $bit_index++;
                }
            }
            $x -= 2;
            $direction *= -1;
        }
    }

    /**
     * Nałożenie maski.
     */
    protected function apply_mask( array &$matrix, $mask ) {
        for ( $y = 0; $y < 21; $y++ ) {
            for ( $x = 0; $x < 21; $x++ ) {
                if ( $this->fixed[ $y ][ $x ] ) {
                    continue;
                }
                $mask_bit = ( ( $y + $x ) % 2 ) === 0; // maska 0
                if ( $mask_bit ) {
                    $matrix[ $y ][ $x ] ^= 1;
                }
            }
        }
    }

    protected function is_function_module( $row, $col ) {
        $finder = ( $row <= 8 && $col <= 8 ) || ( $row <= 8 && $col >= 13 ) || ( $row >= 13 && $col <= 8 );
        if ( $finder ) {
            return true;
        }
        if ( $row === 6 || $col === 6 ) {
            return true;
        }
        if ( $row === 13 && $col === 8 ) {
            return true;
        }
        if ( ( $row === 8 && $col >= 0 && $col <= 5 ) || ( $col === 8 && $row >= 0 && $row <= 5 ) ) {
            return true;
        }
        if ( ( $row === 8 && $col >= 13 && $col <= 20 ) || ( $col === 8 && $row >= 13 && $row <= 20 ) ) {
            return true;
        }
        return false;
    }

    /**
     * Format info dla poziomu M i maski 0.
     */
    protected function draw_format_info( array &$matrix, $mask ) {
        $format = '101010000010010';
        $bits   = array_map( 'intval', str_split( $format ) );

        // górny rząd
        for ( $i = 0; $i < 6; $i++ ) {
            $this->set_module( $matrix, 8, $i, $bits[ $i ], true );
        }
        $this->set_module( $matrix, 8, 7, $bits[6], true );
        $this->set_module( $matrix, 8, 8, $bits[7], true );
        $this->set_module( $matrix, 7, 8, $bits[8], true );
        for ( $i = 9; $i < 15; $i++ ) {
            $this->set_module( $matrix, 14 - $i, 8, $bits[ $i ], true );
        }

        // prawy pasek
        for ( $i = 0; $i < 8; $i++ ) {
            $this->set_module( $matrix, 8, 20 - $i, $bits[ $i ], true );
        }
        for ( $i = 0; $i < 7; $i++ ) {
            $this->set_module( $matrix, $i, 8, $bits[ $i ], true );
        }
        for ( $i = 7; $i < 15; $i++ ) {
            $this->set_module( $matrix, 20 - ( $i - 7 ), 8, $bits[ $i ], true );
        }
    }

    /**
     * Pozycja znaku w alfabecie.
     */
    protected function alphabet_pos( $char ) {
        $pos = strpos( $this->alphabet, $char );
        return false === $pos ? 0 : $pos;
    }

    /**
     * Logarytmy w GF(256).
     */
    protected function gf_log() {
        static $log = null;
        if ( null === $log ) {
            $log = array_fill( 0, 256, 0 );
            $x   = 1;
            for ( $i = 0; $i < 255; $i++ ) {
                $log[ $x ] = $i;
                $x <<= 1;
                if ( $x & 0x100 ) {
                    $x ^= 0x11D;
                }
            }
        }
        return $log;
    }

    /**
     * Potęgi w GF(256).
     */
    protected function gf_exp() {
        static $exp = null;
        if ( null === $exp ) {
            $exp = array_fill( 0, 512, 0 );
            $x   = 1;
            for ( $i = 0; $i < 255; $i++ ) {
                $exp[ $i ]       = $x;
                $exp[ $i + 255 ] = $x;
                $x <<= 1;
                if ( $x & 0x100 ) {
                    $x ^= 0x11D;
                }
            }
        }
        return $exp;
    }

    /**
     * Generator RS.
     */
    protected function rs_generator_poly( $degree ) {
        $poly = array( 1 );
        for ( $i = 0; $i < $degree; $i++ ) {
            $poly = $this->rs_poly_mul( $poly, array( 1, $this->gf_exp()[ $i ] ) );
        }
        return $poly;
    }

    protected function rs_poly_mul( array $p, array $q ) {
        $result = array_fill( 0, count( $p ) + count( $q ) - 1, 0 );
        foreach ( $p as $i => $pv ) {
            foreach ( $q as $j => $qv ) {
                $result[ $i + $j ] ^= $this->gf_mul( $pv, $qv );
            }
        }
        return $result;
    }

    protected function gf_mul( $a, $b ) {
        if ( 0 === $a || 0 === $b ) {
            return 0;
        }
        $log = $this->gf_log();
        $exp = $this->gf_exp();
        $sum = $log[ $a ] + $log[ $b ];
        return $exp[ $sum % 255 ];
    }

    protected function set_module( array &$matrix, $y, $x, $value, $fixed = false ) {
        $matrix[ $y ][ $x ] = $value;
        if ( $fixed ) {
            $this->fixed[ $y ][ $x ] = true;
        }
    }
}
