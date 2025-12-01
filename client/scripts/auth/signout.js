import supabase from "../../../server/api/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userStatus = document.getElementById("userStatus");
    const signoutBtn = document.getElementById("signoutBtn");

    // Check authentication state
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "/Banwa/client/pages/auth/signin.php";
        return;
    } else {
        const emailInput = document.getElementById("email");

        if (emailInput) {
            emailInput.value = `${session.user.email}`;
        }

        if (userStatus) userStatus.textContent = `${session.user.email}`;
        // keep the intended flex layout from CSS; avoid overriding it with "block"
        if (signoutBtn) signoutBtn.style.display = "flex";
    }

    // Handle sign-out (only if button exists)
    if (signoutBtn) {
        signoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign-out error:", error.message);
            alert(error.message);
        } else {
            window.location.href = "/Banwa/client/pages/auth/signin.php";
        }
        });
    }
});