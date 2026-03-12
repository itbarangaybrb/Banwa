import supabase from "../../../server/api/supabase.js";

// 1. THE TRIPWIRE: Catch the user immediately if they hit 'Back'
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload(); 
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const signoutBtn = document.getElementById("signoutBtn");

    // 2. SECURITY CHECK: If they are back on this page but logged out, kick them
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.replace("/client/index.php");
        return;
    }

    // 3. LOGOUT LOGIC
    if (signoutBtn) {
        signoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            // Destroy both sessions
            await supabase.auth.signOut();
            await fetch('/server/api/shared/signout_user.php', { method: 'POST', credentials: 'include' });

            // Wipe history
            window.location.replace("/client/index.php");
        });
    }
});