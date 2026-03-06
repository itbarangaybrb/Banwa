import supabase from "/server/api/supabase.js";

/**
 * Session Guard & Sign-out Handler
 * This script ensures the page is protected by an active Supabase session
 * and coordinates a "Global Sign-out" across both Supabase and the PHP backend.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const userStatus = document.getElementById("userStatus");
    const signoutBtn = document.getElementById("signoutBtn");

    // 1. Initial Identity Check (The "Gatekeeper")
    // Retrieves the session from local storage/cookies. 
    // This is the primary client-side check for protected routes.
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Unauthenticated Redirect
    // If no session exists, we immediately bounce the user to the login page.
    if (!session) {
        window.location.href = "/client/pages/auth/signin.php";
        return;
    }

    // 3. UI Enrichment
    // Display the user's identity once the session is confirmed.
    if (userStatus) {
        userStatus.textContent = `${session.user.email}`;
    }

    // 4. Global Sign-out Logic
    // In a distributed system, we must invalidate sessions in two places:
    // A) The Identity Provider (Supabase)
    // B) The Application Server (PHP Session)
    if (signoutBtn) {
        signoutBtn.addEventListener("click", async () => {

            // A. Invalidate Supabase Session
            // This clears the JWT from the browser's local storage.
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Supabase sign-out error:", error.message);
                // We proceed anyway to ensure the local PHP session is also cleared.
            }

            // B. Invalidate PHP Session
            // We notify the local backend to destroy the PHP $_SESSION.
            // 'credentials: include' is mandatory here to pass the session cookie.
            await fetch('/server/api/shared/signout_user.php', {
                method: 'POST',
                credentials: 'include'
            });

            window.location.href = "/client/index.php";
        });
    }
});
