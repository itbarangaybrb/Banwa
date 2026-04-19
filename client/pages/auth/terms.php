<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="BANWA Terms and Conditions — Barangay Blue Ridge B Management System">
<title>Terms &amp; Conditions — BANWA</title>
<link rel="icon" type="image/svg+xml" href="../../../client/img/browser-icon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ─── BANWA Design Tokens ──────────────────────────────────────── */
:root {
  --ink:            #0B1526;
  --navy:           #00247C;
  --navy-deep:      #001050;
  --navy-06:        rgba(0,36,124,0.06);
  --navy-10:        rgba(0,36,124,0.10);
  --navy-18:        rgba(0,36,124,0.18);
  --gold:           #B8820F;
  --gold-bg:        #FDF5E4;
  --white:          #FFFFFF;
  --surface:        #F6F6F3;
  --surface-alt:    #EEEEEA;
  --border:         #E2E2DC;
  --border-strong:  #C8C8BF;
  --text-secondary: #4E5668;
  --text-muted:     #8F96A5;
  --green:          #1A7A4A;
  --green-bg:       #EAF5EF;
  --red:            #C0291A;

  --ff-display: 'Raleway', 'Arial Narrow', sans-serif;
  --ff-body:    'DM Sans', system-ui, sans-serif;

  --fs-2xs:  0.68rem;
  --fs-xs:   0.75rem;
  --fs-sm:   0.85rem;
  --fs-base: 0.95rem;
  --fs-md:   1.05rem;
  --fs-lg:   1.2rem;
  --fs-xl:   1.5rem;
  --fs-2xl:  2rem;
  --fs-3xl:  2.75rem;

  --lh-tight:  1.05;
  --lh-snug:   1.25;
  --lh-normal: 1.5;
  --lh-loose:  1.75;

  --fw-regular:  400;
  --fw-medium:   500;
  --fw-semibold: 600;
  --fw-bold:     700;
  --fw-black:    800;

  --s1: 8px; --s2: 16px; --s3: 24px; --s4: 32px;
  --s5: 40px; --s6: 48px; --s8: 64px; --s10: 80px;

  --max-w: 1200px;
  --r-sm: 4px;
  --r-md: 8px;
  --ease: cubic-bezier(0.4,0,0.2,1);
  --t-fast: 0.15s;
  --t-base: 0.25s;
  --t-slow: 0.45s;
}

/* ─── Reset ──────────────────────────────────────────────────────── */
*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
html { font-size:16px; scroll-behavior:smooth; }
body {
  font-family: var(--ff-body);
  font-size: var(--fs-base);
  color: var(--ink);
  background: var(--white);
  line-height: var(--lh-normal);
  overflow-x: hidden;
}
img { display:block; max-width:100%; }
a { color:var(--navy); text-decoration:none; }
a:hover { text-decoration:underline; }
ul,ol { padding-left: var(--s3); }
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-track { background:var(--surface); }
::-webkit-scrollbar-thumb { background:var(--navy-18); border-radius:3px; }

/* ─── Top bar ─────────────────────────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  height: 60px;
  display: flex;
  align-items: center;
}
.topbar__inner {
  max-width: var(--max-w);
  margin-inline: auto;
  padding-inline: var(--s4);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar__brand {
  display: flex;
  align-items: center;
  gap: var(--s2);
  text-decoration: none;
}
.topbar__wordmark {
  font-family: var(--ff-display);
  font-size: 1.15rem;
  font-weight: var(--fw-black);
  letter-spacing: 0.14em;
  color: var(--navy);
}
.topbar__divider {
  width: 1px;
  height: 16px;
  background: var(--border-strong);
  margin-inline: var(--s2);
}
.topbar__page {
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
}
.topbar__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--t-fast);
}
.topbar__back:hover { color: var(--navy); text-decoration: none; }
.topbar__back svg {
  width: 12px; height: 12px;
  stroke: currentColor; fill: none;
  stroke-width: 2.5; stroke-linecap: round;
}

/* ─── Hero banner ─────────────────────────────────────────────────── */
.doc-hero {
  background: var(--navy-deep);
  padding: var(--s10) 0 var(--s8);
  position: relative;
  overflow: hidden;
}
.doc-hero::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
}
/* grid lines decoration */
.doc-hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px,
    transparent 1px, transparent calc((100% - 64px)/12 + 64px/12)
  );
}
.doc-hero__inner {
  max-width: var(--max-w);
  margin-inline: auto;
  padding-inline: var(--s4);
  position: relative;
  z-index: 1;
}
.doc-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  margin-bottom: var(--s3);
}
.doc-hero__eyebrow-line {
  width: 28px; height: 1px;
  background: rgba(255,255,255,0.28);
}
.doc-hero__eyebrow-text {
  font-size: var(--fs-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.38);
}
.doc-hero__title {
  font-family: var(--ff-display);
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: var(--fw-black);
  color: var(--white);
  line-height: var(--lh-tight);
  letter-spacing: -0.01em;
  margin-bottom: var(--s3);
}
.doc-hero__meta {
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-wrap: wrap;
  margin-top: var(--s4);
}
.doc-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 50px;
  font-size: var(--fs-xs);
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.04em;
}
.doc-hero__badge-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
}

/* ─── Layout ──────────────────────────────────────────────────────── */
.doc-layout {
  max-width: var(--max-w);
  margin-inline: auto;
  padding-inline: var(--s4);
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--s10);
  align-items: start;
  padding-top: var(--s8);
  padding-bottom: var(--s10);
}

/* ─── Sidebar TOC ─────────────────────────────────────────────────── */
.doc-toc {
  position: sticky;
  top: calc(60px + var(--s4));
}
.doc-toc__label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--s2);
  padding-bottom: var(--s2);
  border-bottom: 1px solid var(--border);
}
.doc-toc__list { list-style: none; padding: 0; }
.doc-toc__item { margin-bottom: 2px; }
.doc-toc__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--s2);
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  transition: all var(--t-fast);
  text-decoration: none;
  border-left: 2px solid transparent;
}
.doc-toc__link::before {
  content: attr(data-n);
  font-size: 0.62rem;
  font-weight: var(--fw-bold);
  letter-spacing: 0.04em;
  color: var(--text-muted);
  min-width: 18px;
}
.doc-toc__link:hover,
.doc-toc__link.active {
  background: var(--navy-06);
  color: var(--navy);
  border-left-color: var(--navy);
  text-decoration: none;
}
.doc-toc__link.active::before { color: var(--navy); }

/* ─── Document Body ───────────────────────────────────────────────── */
.doc-body { min-width: 0; }

.doc-section {
  margin-bottom: var(--s8);
  padding-bottom: var(--s8);
  border-bottom: 1px solid var(--border);
  scroll-margin-top: calc(60px + var(--s4));
}
.doc-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.doc-section__num {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  margin-bottom: var(--s3);
}
.doc-section__num-badge {
  font-family: var(--ff-display);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: 0.04em;
  color: var(--navy);
  background: var(--navy-06);
  border: 1px solid var(--navy-10);
  border-radius: var(--r-sm);
  padding: 2px 8px;
}
.doc-section__num-label {
  font-size: var(--fs-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: var(--fw-bold);
}

.doc-section__title {
  font-family: var(--ff-display);
  font-size: var(--fs-2xl);
  font-weight: var(--fw-black);
  color: var(--navy);
  line-height: var(--lh-snug);
  margin-bottom: var(--s4);
  letter-spacing: -0.01em;
}

.doc-section p {
  font-size: var(--fs-sm);
  line-height: var(--lh-loose);
  color: var(--text-secondary);
  margin-bottom: var(--s3);
}

.doc-section p:last-child { margin-bottom: 0; }

.doc-section ul,
.doc-section ol {
  margin-bottom: var(--s3);
}

.doc-section li {
  font-size: var(--fs-sm);
  line-height: var(--lh-loose);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.doc-section strong {
  font-weight: var(--fw-semibold);
  color: var(--ink);
}

/* Callout box */
.doc-callout {
  background: var(--gold-bg);
  border: 1px solid rgba(184,130,15,0.20);
  border-left: 3px solid var(--gold);
  border-radius: var(--r-sm);
  padding: var(--s3) var(--s4);
  margin-bottom: var(--s4);
}
.doc-callout--navy {
  background: var(--navy-06);
  border-color: var(--navy-10);
  border-left-color: var(--navy);
}
.doc-callout p {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  margin: 0;
}
.doc-callout strong {
  color: var(--gold);
  display: block;
  font-size: var(--fs-xs);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  margin-bottom: 5px;
}
.doc-callout--navy strong { color: var(--navy); }

/* Info table */
.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--s4);
  font-size: var(--fs-xs);
}
.doc-table th {
  background: var(--navy-06);
  color: var(--navy);
  font-weight: var(--fw-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px var(--s2);
  text-align: left;
  border: 1px solid var(--navy-10);
}
.doc-table td {
  padding: 10px var(--s2);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  line-height: var(--lh-normal);
}
.doc-table tr:nth-child(even) td { background: var(--surface); }

/* Contact card */
.contact-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s2);
  margin-top: var(--s4);
}
.contact-card__item {
  padding: var(--s3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}
.contact-card__label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 5px;
}
.contact-card__value {
  font-size: var(--fs-sm);
  color: var(--ink);
  font-weight: var(--fw-medium);
}

/* ─── Footer ──────────────────────────────────────────────────────── */
.doc-footer {
  background: var(--ink);
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: var(--s3) var(--s4);
}
.doc-footer__inner {
  max-width: var(--max-w);
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--s2);
}
.doc-footer__brand {
  font-family: var(--ff-display);
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.28);
}
.doc-footer__links {
  display: flex;
  gap: var(--s3);
}
.doc-footer__links a {
  font-size: var(--fs-xs);
  color: rgba(255,255,255,0.28);
  text-decoration: none;
  transition: color var(--t-fast);
}
.doc-footer__links a:hover { color: rgba(255,255,255,0.65); }
.doc-footer__copy {
  font-size: var(--fs-xs);
  color: rgba(255,255,255,0.18);
}

/* ─── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .doc-layout {
    grid-template-columns: 1fr;
    gap: var(--s6);
    padding-top: var(--s6);
  }
  .doc-toc {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .doc-toc__label { display: none; }
  .doc-toc__list { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; }
  .doc-toc__item { margin: 0; }
  .doc-toc__link { border-left: none; padding: 6px 12px; border: 1px solid var(--border); border-radius: 50px; }
  .doc-toc__link.active { border-color: var(--navy); }
  .contact-card { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .topbar__back span { display: none; }
  .doc-hero { padding: var(--s8) 0 var(--s6); }
  .doc-section__title { font-size: var(--fs-xl); }
  .doc-footer__inner { flex-direction: column; text-align: center; }
  .doc-footer__links { justify-content: center; }
}
</style>
</head>
<body>

<!-- TOP BAR -->
<header class="topbar">
  <div class="topbar__inner">
    <a href="javascript:void(0)" onclick="window.close()" class="topbar__brand">
      <span class="topbar__wordmark">BANWA</span>
      <span class="topbar__divider"></span>
      <span class="topbar__page">Terms &amp; Conditions</span>
    </a>
    <a href="javascript:void(0)" onclick="window.close()" class="topbar__back">
      <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span>Close &amp; return</span>
    </a>
  </div>
</header>

<!-- HERO -->
<div class="doc-hero">
  <div class="doc-hero__grid" aria-hidden="true"></div>
  <div class="doc-hero__inner">
    <div class="doc-hero__eyebrow">
      <span class="doc-hero__eyebrow-line"></span>
      <span class="doc-hero__eyebrow-text">Barangay Blue Ridge B &mdash; Quezon City</span>
    </div>
    <h1 class="doc-hero__title">Terms &amp;<br>Conditions</h1>
    <div class="doc-hero__meta">
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>Effective date: January 1, 2025</span>
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>Last updated: January 1, 2025</span>
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>Version 1.0</span>
    </div>
  </div>
</div>

<!-- CONTENT -->
<div class="doc-layout">

  <!-- SIDEBAR TOC -->
  <nav class="doc-toc" aria-label="Table of contents">
    <div class="doc-toc__label">On This Page</div>
    <ul class="doc-toc__list">
      <li class="doc-toc__item"><a class="doc-toc__link active" href="#sec-acceptance" data-n="01">Acceptance</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-eligibility" data-n="02">Eligibility</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-account" data-n="03">Accounts</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-services" data-n="04">Services</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-obligations" data-n="05">Obligations</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-intellectual" data-n="06">Intellectual Property</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-liability" data-n="07">Liability</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-termination" data-n="08">Termination</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-amendments" data-n="09">Amendments</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-contact" data-n="10">Contact</a></li>
    </ul>
  </nav>

  <!-- BODY -->
  <main class="doc-body">

    <div class="doc-callout doc-callout--navy">
      <strong>Important Notice</strong>
      <p>Please read these Terms and Conditions carefully before creating an account or using BANWA. By registering, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
    </div>

    <!-- 01 -->
    <section class="doc-section" id="sec-acceptance">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">01</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Acceptance of Terms</h2>
      <p>Welcome to <strong>BANWA</strong> (Barangay Blue Ridge B Management System), the official online service platform of Barangay Blue Ridge B, Quezon City, Metro Manila. These Terms and Conditions ("Terms") govern your access to and use of the BANWA platform, including its website, applications, and all related services.</p>
      <p>By accessing or using BANWA, checking the agreement box during registration, or using any of the services provided through the platform, you agree to be legally bound by these Terms in their entirety. If you do not agree with any part of these Terms, you must not use the platform.</p>
      <p>These Terms constitute a legally binding agreement between you ("User," "Resident," or "Applicant") and <strong>Barangay Blue Ridge B</strong> ("the Barangay," "we," "us," or "our"), operating under the governance framework of the Republic of the Philippines.</p>
    </section>

    <!-- 02 -->
    <section class="doc-section" id="sec-eligibility">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">02</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Eligibility</h2>
      <p>To be eligible to register and use BANWA, you must meet all of the following criteria:</p>
      <ul>
        <li>You are at least <strong>18 years of age</strong>, or a legal guardian filing on behalf of a minor;</li>
        <li>You are a <strong>resident, property owner, or registered business operator</strong> within the jurisdiction of Barangay Blue Ridge B;</li>
        <li>You possess a <strong>valid government-issued identification</strong> acceptable to the Philippine government;</li>
        <li>You have the <strong>legal capacity</strong> to enter into binding agreements under Philippine law;</li>
        <li>You have not been previously <strong>suspended or banned</strong> from the BANWA platform.</li>
      </ul>
      <p>The Barangay reserves the right to verify your eligibility at any time. Providing false or misleading information to establish eligibility is a ground for immediate account termination.</p>
    </section>

    <!-- 03 -->
    <section class="doc-section" id="sec-account">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">03</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">User Accounts</h2>
      <p>Each user is permitted to maintain <strong>one (1) account only</strong>. Creating multiple accounts is strictly prohibited. You are solely responsible for maintaining the confidentiality of your login credentials.</p>

      <div class="doc-callout">
        <strong>Security Reminder</strong>
        <p>Never share your password with anyone, including Barangay staff. BANWA will never ask for your password via email, phone, or text message.</p>
      </div>

      <p>You agree to:</p>
      <ul>
        <li>Provide <strong>accurate, current, and complete</strong> information during registration and keep it up to date;</li>
        <li>Maintain the <strong>confidentiality</strong> of your username and password;</li>
        <li>Immediately notify the Barangay of any <strong>unauthorized access</strong> or suspected breach of your account;</li>
        <li>Accept <strong>full responsibility</strong> for all activities conducted under your account.</li>
      </ul>

      <p>The Barangay shall not be liable for any loss resulting from unauthorized use of your account due to your failure to safeguard your credentials.</p>

      <p><strong>Account Verification:</strong> Upon registration, you will receive a verification email. Your account must be verified before you can submit applications. Unverified accounts will be automatically purged after 30 days of inactivity.</p>
    </section>

    <!-- 04 -->
    <section class="doc-section" id="sec-services">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">04</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Services</h2>
      <p>BANWA provides an online gateway to the following barangay services:</p>

      <table class="doc-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Description</th>
            <th>Processing Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Business Clearance</strong></td>
            <td>Applications for new businesses, renewals, and closures</td>
            <td>3–5 working days</td>
          </tr>
          <tr>
            <td><strong>Construction Clearance</strong></td>
            <td>Permits for home repairs, renovations, and new construction</td>
            <td>5–7 working days</td>
          </tr>
          <tr>
            <td><strong>Utilities Services</strong></td>
            <td>Requests for water, electrical, internet, and billing concerns</td>
            <td>2–5 working days</td>
          </tr>
          <tr>
            <td><strong>Incident Reports</strong></td>
            <td>Filing and tracking community incident reports</td>
            <td>1–3 working days</td>
          </tr>
        </tbody>
      </table>

      <p>All services are subject to applicable government fees as prescribed by existing ordinances and national laws. BANWA facilitates online submission only; physical clearances and documents must be picked up at the Barangay Hall unless otherwise specified.</p>

      <p>Applications submitted outside official office hours (Monday–Friday 8:00 AM–5:00 PM, Saturday 8:00 AM–12:00 PM) will be <strong>queued for processing on the next working day</strong>.</p>

      <p>The Barangay reserves the right to <strong>modify, suspend, or discontinue</strong> any service at any time without prior notice, although reasonable efforts will be made to inform affected users.</p>
    </section>

    <!-- 05 -->
    <section class="doc-section" id="sec-obligations">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">05</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">User Obligations &amp; Prohibited Conduct</h2>
      <p>As a user of BANWA, you agree to use the platform only for lawful purposes. You are expressly <strong>prohibited</strong> from:</p>
      <ul>
        <li>Submitting <strong>false, fraudulent, or misleading</strong> information in any application or report;</li>
        <li>Uploading <strong>fabricated or altered documents</strong>, including forged IDs or fake supporting materials;</li>
        <li>Attempting to <strong>hack, probe, scan, or test</strong> the vulnerability of the platform;</li>
        <li>Using the platform to <strong>harass, threaten, or defame</strong> barangay officials, staff, or other residents;</li>
        <li>Creating accounts using <strong>another person's identity</strong> without proper legal authorization;</li>
        <li>Attempting to <strong>circumvent</strong> any security measure, access control, or authentication mechanism;</li>
        <li>Using automated bots or scripts to <strong>scrape, crawl, or spam</strong> the platform;</li>
        <li>Engaging in any activity that <strong>disrupts or interferes</strong> with the normal functioning of the system.</li>
      </ul>
      <p>Violations may result in immediate account suspension, referral to law enforcement, and/or legal action under applicable Philippine laws, including but not limited to Republic Act No. 10175 (Cybercrime Prevention Act of 2012).</p>
    </section>

    <!-- 06 -->
    <section class="doc-section" id="sec-intellectual">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">06</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Intellectual Property</h2>
      <p>The BANWA platform, including its design, layout, source code, logos, content, graphics, and all related materials, is the <strong>intellectual property of Barangay Blue Ridge B</strong>. All rights are reserved.</p>
      <p>You are granted a <strong>limited, non-exclusive, non-transferable</strong> license to access and use the platform solely for the purposes of availing barangay services as a resident or authorized representative.</p>
      <p>You may <strong>not</strong> reproduce, copy, redistribute, republish, upload, post, transmit, or otherwise exploit any part of the platform's content, design, or technology without prior written consent from the Barangay.</p>
    </section>

    <!-- 07 -->
    <section class="doc-section" id="sec-liability">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">07</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Limitation of Liability</h2>
      <p>The BANWA platform is provided on an <strong>"as is" and "as available" basis</strong>. While we strive to maintain system availability and accuracy, Barangay Blue Ridge B makes no warranties — express or implied — regarding:</p>
      <ul>
        <li>Uninterrupted or error-free access to the platform;</li>
        <li>Accuracy or completeness of information displayed;</li>
        <li>Fitness for a particular purpose;</li>
        <li>Security of data transmitted over the internet.</li>
      </ul>
      <p>To the fullest extent permitted by law, the Barangay shall not be liable for any <strong>direct, indirect, incidental, special, or consequential damages</strong> arising from your use of or inability to use the platform, including loss of data, service delays, or unauthorized access caused by factors beyond our control.</p>

      <div class="doc-callout">
        <strong>Disclaimer</strong>
        <p>BANWA is a tool to facilitate access to government services. Final decisions on all clearance applications remain the exclusive authority of the Barangay officials and staff, subject to existing laws and ordinances.</p>
      </div>
    </section>

    <!-- 08 -->
    <section class="doc-section" id="sec-termination">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">08</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Account Termination &amp; Suspension</h2>
      <p>Barangay Blue Ridge B reserves the right to <strong>suspend or terminate</strong> your account at any time, with or without notice, for reasons including but not limited to:</p>
      <ul>
        <li>Violation of any provision of these Terms;</li>
        <li>Submission of fraudulent documents or false information;</li>
        <li>Behavior that disrupts the platform or harms other users;</li>
        <li>Inactivity exceeding one (1) year;</li>
        <li>Requests from law enforcement or judicial authorities.</li>
      </ul>
      <p>Upon termination, your right to access BANWA ceases immediately. The Barangay may retain your data as required by law or for legitimate administrative purposes, as described in the Privacy Policy.</p>
      <p>You may also voluntarily close your account by visiting the Barangay Hall during office hours or by submitting a written request to the contact details listed in Section 10.</p>
    </section>

    <!-- 09 -->
    <section class="doc-section" id="sec-amendments">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">09</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Amendments &amp; Governing Law</h2>
      <p>Barangay Blue Ridge B reserves the right to <strong>amend, update, or modify</strong> these Terms at any time. Changes will take effect upon posting to the platform. Continued use of BANWA after such changes constitutes your acceptance of the revised Terms.</p>
      <p>We will endeavor to notify registered users of material changes via email at least <strong>seven (7) days before</strong> the amended Terms take effect.</p>
      <p>These Terms shall be governed by and construed in accordance with the <strong>laws of the Republic of the Philippines</strong>. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the appropriate courts of Quezon City, Metro Manila.</p>
    </section>

    <!-- 10 -->
    <section class="doc-section" id="sec-contact">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">10</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Contact Us</h2>
      <p>For questions, concerns, or clarifications regarding these Terms and Conditions, please reach out through any of the following channels:</p>

      <div class="contact-card">
        <div class="contact-card__item">
          <div class="contact-card__label">Address</div>
          <div class="contact-card__value">5 Moonlight Loop, Project 4<br>Quezon City, Metro Manila</div>
        </div>
        <div class="contact-card__item">
          <div class="contact-card__label">Email</div>
          <div class="contact-card__value">blueridgeb@yahoo.com</div>
        </div>
        <div class="contact-card__item">
          <div class="contact-card__label">Mobile</div>
          <div class="contact-card__value">0917-1822272</div>
        </div>
        <div class="contact-card__item">
          <div class="contact-card__label">Landline</div>
          <div class="contact-card__value">8-5359822</div>
        </div>
      </div>

      <p style="margin-top: var(--s4);">Office hours: <strong>Monday–Friday, 8:00 AM – 5:00 PM</strong> and <strong>Saturday, 8:00 AM – 12:00 PM</strong>.</p>
    </section>

  </main>
</div>

<!-- FOOTER -->
<footer class="doc-footer">
  <div class="doc-footer__inner">
    <span class="doc-footer__brand">BANWA</span>
    <div class="doc-footer__links">
      <a href="terms.php">Terms &amp; Conditions</a>
      <a href="privacy.php">Privacy Policy</a>
    </div>
    <span class="doc-footer__copy">&copy; <?php echo date('Y'); ?> Barangay Blue Ridge B. All rights reserved.</span>
  </div>
</footer>

<script>
/* Active TOC link on scroll */
(function(){
  var links = document.querySelectorAll('.doc-toc__link');
  var sections = Array.from(document.querySelectorAll('.doc-section'));

  function onScroll(){
    var scrollY = window.scrollY + 100;
    var current = sections[0];
    sections.forEach(function(s){ if(s.offsetTop <= scrollY) current = s; });
    links.forEach(function(l){
      l.classList.toggle('active', l.getAttribute('href') === '#' + current.id);
    });
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}());
</script>
</body>
</html>