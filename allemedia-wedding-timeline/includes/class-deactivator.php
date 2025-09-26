<?php
/**
 * Dezaktywacja wtyczki - brak destrukcyjnych operacji (zostawiamy dane).
 */
class Allemedia_WT_Deactivator {
    public static function deactivate() {
        // Na razie brak akcji - zachowujemy tabele, by nie utracić harmonogramów.
    }
}
