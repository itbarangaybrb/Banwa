/**
 * Hide page loader after full window load
 * Ensures loader is removed when all resources are ready
 */
window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "none";
});


/**
 * Display page loader when navigating via anchor links
 * Prevents interaction during page transition
 */
document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
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

/**
 * Display page loader on form submission
 * Ensures loader appears unless submission is prevented
 */
document.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;

    const loader = document.getElementById("page-loader");
    if (loader) loader.style.display = "flex";
});
