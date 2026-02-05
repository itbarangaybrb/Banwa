    </main>

        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script src="../../scripts/resident/nav.js" defer></script>
    <script src="../../scripts/resident/home.js" defer></script>
        <script type="module" src="../../scripts/auth/signout.js"></script>
        <script>
            window.addEventListener("load", () => {
                const loader = document.getElementById("page-loader");
                if (loader) loader.style.display = "none";
            });

            document.addEventListener("click", (e) => {
                const link = e.target.closest("a");
                const submit = e.target.closest("button[type=submit]");
                const loader = document.getElementById("page-loader");

                if (
                    loader &&
                    link &&
                    link.href &&
                    !link.target &&
                    !link.href.startsWith("javascript:") &&
                    link.href.includes("#") &&
                    document.getElementById("page-loader")
                ) {
                    loader.style.display = "flex";
                }
            });

            document.addEventListener("submit", (e) => {
                if (e.defaultPrevented) return;

                const loader = document.getElementById("page-loader");
                if (loader) loader.style.display = "flex";
            });
        </script>
        </body>

        </html>