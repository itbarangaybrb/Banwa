import supabase from "../../../server/api/supabase.js";

/**
 * Handle Post-Email Verification & Account Sync
 * This script runs when a user arrives via a Supabase magic link or confirmation email.
 * It validates the Supabase session and synchronizes the user profile to the local PHP backend.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const statusEl = document.getElementById("status");

    try {
        // 1. Retrieve the session from Supabase URL fragments/cookies
        // This confirms the user actually clicked a valid verification link.
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            statusEl.style.color = "red";
            statusEl.textContent = "Invalid or expired verification link.";
            return;
        }

        const user = data.session.user;
        const supabaseUserId = user.id;
        const metadata = user.user_metadata;

        // 2. Safety Check: Ensure Supabase has actually marked the email as confirmed
        if (!user.email_confirmed_at) {
            statusEl.style.color = "red";
            statusEl.textContent = "Email not verified. Please check your inbox.";
            return;
        }

        // 3. Construct synchronization payload
        // We extract metadata stored during sign-up to persist it in our local 'residents' database.
        const payload = {
            user_id: supabaseUserId,
            email: user.email,
            fullname: metadata.fullname,
            sex: metadata.sex,
            contactNo: metadata.contactNo,
            address: metadata.address,
            idType: metadata.idType,
            agreeCheckBox: metadata.agreeCheckBox
        };

        // 4. Critical Sync: Send Supabase user data to our local backend
        // We use 'credentials: include' to ensure any session cookies are passed if required.
        const resp = await fetch("/Banwa/server/api/resident/signup_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const result = await resp.json();

        // 5. Handle Backend Validation
        // Even if Supabase is happy, our local DB might reject the user (e.g., duplicate data or DB downtime).
        if (!result.success) {
            statusEl.style.color = "red";
            statusEl.textContent = result.message || "Account activation failed.";
            return;
        }

        // 6. Success State: UX feedback and automated redirect
        statusEl.style.color = "green";
        statusEl.textContent = "Email verified successfully. Redirecting to login…";

        setTimeout(() => {
            window.location.href = "/Banwa/client/pages/auth/signin.php";
        }, 2000);

    } catch (err) {
        // Log the full error for debugging, but show a generic message to the user for security.
        console.error("Auth Sync Error:", err);
        statusEl.style.color = "red";
        statusEl.textContent = "Unexpected error. Please try again.";
    }
});