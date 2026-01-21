import supabase from "../../../server/api/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userStatus = document.getElementById("userStatus");
    const signoutBtn = document.getElementById("signoutBtn");

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "/Banwa/client/pages/auth/signin.php";
        return;
    }
    
    if (userStatus) userStatus.textContent = `${session.user.email}`;
    // if (signoutBtn) signoutBtn.style.display = "flex";


    if (signoutBtn) {
        signoutBtn.addEventListener("click", async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Supabase sign-out error:", error.message);
            }

            await fetch('/Banwa/server/api/shared/signout_user.php', {
                method: 'POST',
                credentials: 'include'
            });

            window.location.href = "/Banwa/client/pages/auth/signin.php";
        });
    }
});
