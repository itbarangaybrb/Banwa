import supabase from "../../configs/auth/supabase.js";

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

        userStatus.textContent = `${session.user.email}`;
        signoutBtn.style.display = "block";
    }

    // Handle sign-out
    signoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign-out error:", error.message);
            alert(error.message);
        } else {
            window.location.href = "/Banwa/client/pages/auth/signin.php";
        }
    });
});


// TODO: Front-end developer, need to change this for bfcache so users 
// will not able to return.
// Will update this later - jep