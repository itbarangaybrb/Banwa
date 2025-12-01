<?php
if (extension_loaded('pdo_pgsql')) {
    echo "✅ PDO_PGSQL is enabled!";
} else {
    echo "❌ PDO_PGSQL is NOT enabled. Check php.ini and System Path.";
}
?>