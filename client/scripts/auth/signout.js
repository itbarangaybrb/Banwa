import supabase from "../../../server/api/supabase.js";

/**
 * 1. THE ALARM CLOCK
 * Forces the browser to refresh from the server whenever the 'Back' button 
 * is used. This ensures your PHP session check at the top of the file runs.
 */
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload(); 
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const userStatus = document.getElementById("userStatus");
    const signoutBtn = document.getElementById("signoutBtn");

    // 2. UI ENRICHMENT (Optional)
    // We check for the session ONLY to display the email, NOT to redirect.
    const { data: { session } } = await supabase.auth.getSession();
    if (session && userStatus) {
        userStatus.textContent = session.user.email;
    }

    // 3. LOGOUT LOGIC
    if (signoutBtn) {
        signoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            // Invalidate both Supabase and PHP sessions
            await supabase.auth.signOut();
            await fetch('/server/api/shared/signout_user.php', { 
                method: 'POST', 
                credentials: 'include' 
            });

            // Wipe history and send to index
            window.location.replace("/client/index.php");
        });
    }
});