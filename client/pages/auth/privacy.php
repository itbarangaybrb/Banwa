<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="BANWA Privacy Policy — Barangay Blue Ridge B Management System">
<title>Privacy Policy — BANWA</title>
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
  --red-bg:         #FDECEA;

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

/* Shield icon in hero */
.doc-hero__icon {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--s4);
}
.doc-hero__icon svg {
  width: 26px; height: 26px;
  stroke: rgba(255,255,255,0.70); fill: none; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round;
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
.doc-callout--green {
  background: var(--green-bg);
  border-color: rgba(26,122,74,0.20);
  border-left-color: var(--green);
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
.doc-callout--green strong { color: var(--green); }

/* Data grid */
.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s2);
  margin-bottom: var(--s4);
}
.data-grid__item {
  padding: var(--s3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}
.data-grid__label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--navy);
  margin-bottom: 6px;
}
.data-grid__value {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  line-height: var(--lh-loose);
}

/* Rights grid */
.rights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s2);
  margin-bottom: var(--s4);
}
.rights-card {
  padding: var(--s3);
  border: 1px solid var(--navy-10);
  border-radius: var(--r-sm);
  background: var(--navy-06);
  position: relative;
  overflow: hidden;
}
.rights-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--navy);
}
.rights-card__title {
  font-family: var(--ff-display);
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  color: var(--navy);
  margin-bottom: 5px;
}
.rights-card__desc {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  line-height: var(--lh-normal);
}

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
  .data-grid,
  .rights-grid,
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
      <span class="topbar__page">Privacy Policy</span>
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
    <div class="doc-hero__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <h1 class="doc-hero__title">Privacy<br>Policy</h1>
    <div class="doc-hero__meta">
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>Effective date: January 1, 2025</span>
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>Last updated: January 1, 2025</span>
      <span class="doc-hero__badge"><span class="doc-hero__badge-dot"></span>RA 10173 Compliant</span>
    </div>
  </div>
</div>

<!-- CONTENT -->
<div class="doc-layout">

  <!-- SIDEBAR TOC -->
  <nav class="doc-toc" aria-label="Table of contents">
    <div class="doc-toc__label">On This Page</div>
    <ul class="doc-toc__list">
      <li class="doc-toc__item"><a class="doc-toc__link active" href="#sec-intro" data-n="01">Introduction</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-collection" data-n="02">Data Collection</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-use" data-n="03">How We Use Data</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-sharing" data-n="04">Data Sharing</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-storage" data-n="05">Storage &amp; Security</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-cookies" data-n="06">Cookies</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-rights" data-n="07">Your Rights</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-minors" data-n="08">Minors</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-changes" data-n="09">Policy Changes</a></li>
      <li class="doc-toc__item"><a class="doc-toc__link" href="#sec-contact" data-n="10">Contact &amp; DPO</a></li>
    </ul>
  </nav>

  <!-- BODY -->
  <main class="doc-body">

    <div class="doc-callout doc-callout--green">
      <strong>Your Privacy Matters</strong>
      <p>Barangay Blue Ridge B is committed to protecting your personal data in compliance with Republic Act No. 10173, the <strong>Data Privacy Act of 2012</strong>, and its Implementing Rules and Regulations. This policy explains how we collect, use, and safeguard your information.</p>
    </div>

    <!-- 01 -->
    <section class="doc-section" id="sec-intro">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">01</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Introduction</h2>
      <p><strong>Barangay Blue Ridge B</strong> ("the Barangay," "we," "us," or "our"), operating through the BANWA platform, acts as the <strong>Personal Information Controller (PIC)</strong> as defined under the Data Privacy Act of 2012 (RA 10173). This Privacy Policy describes:</p>
      <ul>
        <li>What personal information we collect from you;</li>
        <li>Why we collect and how we use that information;</li>
        <li>How we store, protect, and may share your information;</li>
        <li>Your rights as a data subject under Philippine law.</li>
      </ul>
      <p>By registering for and using BANWA, you <strong>consent</strong> to the collection, use, and processing of your personal data as described in this Policy. If you do not agree, please do not use the platform.</p>
    </section>

    <!-- 02 -->
    <section class="doc-section" id="sec-collection">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">02</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Data We Collect</h2>
      <p>We collect personal information directly from you when you register, submit an application, or interact with the platform. The types of data we collect include:</p>

      <div class="data-grid">
        <div class="data-grid__item">
          <div class="data-grid__label">Identity Data</div>
          <div class="data-grid__value">Full name, date of birth, sex, civil status, government ID number and type, ID photograph</div>
        </div>
        <div class="data-grid__item">
          <div class="data-grid__label">Contact Data</div>
          <div class="data-grid__value">Email address, mobile number, residential address within Barangay Blue Ridge B</div>
        </div>
        <div class="data-grid__item">
          <div class="data-grid__label">Account Data</div>
          <div class="data-grid__value">Username, encrypted password, account creation date, verification status</div>
        </div>
        <div class="data-grid__item">
          <div class="data-grid__label">Application Data</div>
          <div class="data-grid__value">Submitted forms, uploaded documents, application status, transaction history, associated fees</div>
        </div>
        <div class="data-grid__item">
          <div class="data-grid__label">Technical Data</div>
          <div class="data-grid__value">IP address, browser type, device information, session data, access logs, timestamps</div>
        </div>
        <div class="data-grid__item">
          <div class="data-grid__label">Sensitive Personal Information</div>
          <div class="data-grid__value">Where applicable: location data (for incident reports), health or safety-related details relevant to specific clearance applications</div>
        </div>
      </div>

      <div class="doc-callout">
        <strong>OCR / ID Scanning</strong>
        <p>During registration, uploaded ID images may be processed using Optical Character Recognition (OCR) technology to automatically extract your name and other details. This is done solely to assist form completion and improve accuracy. Your uploaded ID image is stored securely and used only for verification purposes.</p>
      </div>
    </section>

    <!-- 03 -->
    <section class="doc-section" id="sec-use">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">03</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">How We Use Your Data</h2>
      <p>We process your personal information only for the purposes for which it was collected, in accordance with the principles of <strong>transparency, legitimate purpose, and proportionality</strong> under RA 10173. Specifically, we use your data to:</p>
      <ul>
        <li><strong>Verify your identity</strong> during registration and when processing applications;</li>
        <li><strong>Process and manage</strong> your barangay service applications (clearances, utilities, incident reports);</li>
        <li><strong>Communicate with you</strong> about application status, decisions, and notifications via email or the platform;</li>
        <li><strong>Maintain official records</strong> as required by government record-keeping laws and regulations;</li>
        <li><strong>Improve the platform</strong> and our services through anonymized usage analytics;</li>
        <li><strong>Ensure the security and integrity</strong> of the platform and prevent fraudulent activity;</li>
        <li><strong>Comply with legal obligations</strong>, including requests from courts, law enforcement, and regulatory bodies;</li>
        <li><strong>Send official announcements</strong> relevant to barangay services and community matters.</li>
      </ul>
      <p>We will <strong>not</strong> use your data for commercial marketing, profiling for commercial purposes, or any purpose incompatible with the above without your explicit consent.</p>
    </section>

    <!-- 04 -->
    <section class="doc-section" id="sec-sharing">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">04</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Data Sharing &amp; Disclosure</h2>
      <p>Barangay Blue Ridge B does <strong>not sell, rent, or trade</strong> your personal information. We may share your data only in the following limited circumstances:</p>
      <ul>
        <li><strong>Barangay Staff &amp; Officials:</strong> Internal sharing among authorized personnel for the processing of your applications and requests;</li>
        <li><strong>Government Agencies:</strong> City Hall of Quezon City, national agencies (e.g., DTI, SEC, DICT), or other relevant government bodies as required for service delivery;</li>
        <li><strong>Law Enforcement:</strong> When compelled by a valid court order, subpoena, or lawful directive from Philippine law enforcement or regulatory authorities;</li>
        <li><strong>Service Providers:</strong> Third-party technology providers that assist in operating BANWA (e.g., hosting, email delivery), bound by confidentiality agreements and not permitted to use your data for independent purposes;</li>
        <li><strong>Emergency Situations:</strong> Sharing necessary information to protect the safety of individuals or the community in urgent circumstances.</li>
      </ul>

      <div class="doc-callout doc-callout--navy">
        <strong>Interagency Disclosure</strong>
        <p>In cases where your application requires coordination with another government agency or office (e.g., City Engineering, Fire Department), relevant information may be shared with the concerned agency solely for that purpose.</p>
      </div>
    </section>

    <!-- 05 -->
    <section class="doc-section" id="sec-storage">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">05</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Storage, Retention &amp; Security</h2>
      <p>Your data is stored on secured servers maintained within the Philippines. We employ appropriate technical and organizational security measures to protect your personal information, including:</p>
      <ul>
        <li><strong>Password hashing</strong> using industry-standard algorithms (passwords are never stored in plain text);</li>
        <li><strong>Encrypted HTTPS connections</strong> for all data transmitted to and from the platform;</li>
        <li><strong>Role-based access controls</strong> ensuring that only authorized staff can view sensitive data;</li>
        <li><strong>Regular security audits</strong> and vulnerability assessments;</li>
        <li><strong>Secure session management</strong> with automatic timeout for inactive sessions.</li>
      </ul>

      <p><strong>Data Retention:</strong> We retain your personal information for as long as your account is active and for such additional period as may be required by law or necessary for legitimate government record-keeping purposes. In general:</p>
      <ul>
        <li>Account data is retained for the duration of the account and up to <strong>5 years</strong> after closure;</li>
        <li>Application and clearance records are retained for a minimum of <strong>7 years</strong> as required by local government record-keeping standards;</li>
        <li>Technical logs are retained for <strong>up to 1 year</strong> for security and audit purposes.</li>
      </ul>

      <p>Despite our security measures, no system is completely immune to risks. In the event of a data breach, we will notify affected users and the <strong>National Privacy Commission (NPC)</strong> in accordance with RA 10173 and NPC Circular 16-03.</p>
    </section>

    <!-- 06 -->
    <section class="doc-section" id="sec-cookies">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">06</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Cookies &amp; Session Data</h2>
      <p>BANWA uses <strong>session cookies</strong> — small text files stored on your device — to maintain your login session and ensure the security of your account. These are strictly necessary for the platform to function and cannot be disabled.</p>
      <p>We do <strong>not</strong> use third-party advertising cookies, behavioral tracking cookies, or any cookies that profile you for commercial purposes.</p>

      <p>Cookies we use include:</p>
      <ul>
        <li><strong>Session cookies:</strong> Temporary cookies that expire when you close your browser, used to keep you logged in during your session;</li>
        <li><strong>Security cookies:</strong> Used to detect and prevent fraudulent activity and unauthorized access;</li>
        <li><strong>Preference cookies:</strong> Used to remember basic user settings within the platform.</li>
      </ul>
      <p>You may disable cookies through your browser settings; however, doing so will prevent you from logging into BANWA.</p>
    </section>

    <!-- 07 -->
    <section class="doc-section" id="sec-rights">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">07</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Your Rights as a Data Subject</h2>
      <p>Under the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, you have the following rights regarding your personal data:</p>

      <div class="rights-grid">
        <div class="rights-card">
          <div class="rights-card__title">Right to Be Informed</div>
          <div class="rights-card__desc">To know how your personal data is being collected, processed, and used.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Access</div>
          <div class="rights-card__desc">To request a copy of the personal data we hold about you.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Rectification</div>
          <div class="rights-card__desc">To have inaccurate or incomplete personal data corrected or updated.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Erasure</div>
          <div class="rights-card__desc">To request deletion of your personal data, subject to legal retention requirements.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Object</div>
          <div class="rights-card__desc">To object to processing of your data in certain circumstances, such as for direct marketing.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Data Portability</div>
          <div class="rights-card__desc">To receive your personal data in a structured, commonly used format.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to Withdraw Consent</div>
          <div class="rights-card__desc">To withdraw consent at any time, without affecting the lawfulness of prior processing.</div>
        </div>
        <div class="rights-card">
          <div class="rights-card__title">Right to File a Complaint</div>
          <div class="rights-card__desc">To lodge a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.</div>
        </div>
      </div>

      <p>To exercise any of these rights, please submit a written request to the Data Privacy Officer (DPO) at the contact details listed in Section 10. We will respond within <strong>fifteen (15) working days</strong> of receiving your request.</p>
      <p>Note that some rights may be limited where processing is required to comply with a legal obligation, protect the public interest, or fulfill a task carried out in the exercise of official authority.</p>
    </section>

    <!-- 08 -->
    <section class="doc-section" id="sec-minors">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">08</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Minors &amp; Parental Consent</h2>
      <p>BANWA is not intended for use by persons under the age of <strong>18 years</strong>. We do not knowingly collect personal information from minors without verifiable parental or guardian consent.</p>
      <p>If you are a parent or guardian submitting an application on behalf of a minor, you are acting as the responsible party and accept full responsibility for the accuracy of information provided and for compliance with these Terms and Privacy Policy on the minor's behalf.</p>
      <p>If we discover that personal information of a minor has been collected without appropriate consent, we will take immediate steps to delete that information from our systems.</p>
    </section>

    <!-- 09 -->
    <section class="doc-section" id="sec-changes">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">09</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Changes to This Policy</h2>
      <p>Barangay Blue Ridge B reserves the right to update or modify this Privacy Policy at any time. When we do, we will revise the "Last Updated" date at the top of this page.</p>
      <p>Material changes that affect how we use or share your personal data will be communicated to registered users via <strong>email notification at least seven (7) days before</strong> the changes take effect. Non-material clarifications may be updated without prior notice.</p>
      <p>Your continued use of BANWA after the effective date of any changes constitutes your acceptance of the revised Privacy Policy. If you do not agree to the changes, you must cease using the platform and may request account deletion by contacting us.</p>
    </section>

    <!-- 10 -->
    <section class="doc-section" id="sec-contact">
      <div class="doc-section__num">
        <span class="doc-section__num-badge">10</span>
        <span class="doc-section__num-label">Section</span>
      </div>
      <h2 class="doc-section__title">Contact Us &amp; Data Privacy Officer</h2>
      <p>For privacy-related concerns, requests to exercise your data subject rights, or questions about this Policy, please contact us through any of the following:</p>

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

      <div class="doc-callout doc-callout--navy" style="margin-top: var(--s4);">
        <strong>National Privacy Commission</strong>
        <p>You also have the right to file a complaint directly with the <strong>National Privacy Commission (NPC)</strong> if you believe your data privacy rights have been violated. Visit <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener" style="color: var(--navy); text-decoration: underline;">www.privacy.gov.ph</a> for more information.</p>
      </div>
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