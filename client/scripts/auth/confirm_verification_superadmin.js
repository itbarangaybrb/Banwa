import supabase from "../../../server/api/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const statusEl = document.getElementById("status");

    try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            statusEl.style.color = "red";
            statusEl.textContent = "Invalid or expired verification link.";
            return;
        }

        const user = data.session.user;
        const metadata = user.user_metadata;

        if (!user.email_confirmed_at) {
            statusEl.style.color = "red";
            statusEl.textContent = "Email not verified. Please check your inbox.";
            return;
        }

        const payload = {
            supabase_user_id: user.id,
            email: user.email,
            full_name: metadata.fullname,
            role_id: parseInt(metadata.role, 10) || 1,
            lot_no: metadata.lot_no || '',
            street: metadata.street || '',
            latitude: metadata.latitude || '',
            longitude: metadata.longitude || ''
        };

        const resp = await fetch("/server/api/staff/superadmin/signup_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const result = await resp.json();

        if (!result.success) {
            statusEl.style.color = "red";
            statusEl.textContent = result.message || "Account activation failed.";
            return;
        }

        statusEl.style.color = "green";
        statusEl.textContent = "Email verified successfully. Redirecting to login…";

        setTimeout(() => {
            window.location.href = "/client/pages/auth/signin.php";
        }, 2000);

    } catch (err) {
        console.error(err);
        statusEl.style.color = "red";
        statusEl.textContent = "Unexpected error. Please try again.";
    }
});
