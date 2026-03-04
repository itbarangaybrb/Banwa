<?php
// server/api/shared/get_user_name.php

function getCurrentUserName()
{
    // Check if session is started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Return the full name from session, or default value
    return $_SESSION['full_name'] ?? 'User';
}
