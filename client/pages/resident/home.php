<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /client/index.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/resident/home2.css">
</head>


<body>
    <?php
    $page_title = "Home";
    include '../../pages/resident/_layout/nav.php';
    ?>

<section class="services" id="services" aria-labelledby="services-heading">
  <div class="wrap">
    <div class="services__header">
      <div>
        <div class="section-index reveal" data-n="01">Barangay Services</div>
        <h2 class="section-title section-title--lg reveal reveal-d1" id="services-heading">What We<br>Offer Online</h2>
      </div>
      <div class="services__header-right reveal reveal-d2">
        <div class="services__online-badge"><span class="online-pip" aria-hidden="true"></span>Available online 24 / 7</div>
        <p class="services__note">Applications outside office hours are<br>processed the next business day.</p>
      </div>
    </div>

    <div class="services__grid reveal reveal-d1">

      <a href="construction_app.php" class="service-card" aria-label="Construction Clearance — Apply online">
        <span class="service-card__number" aria-hidden="true">01</span>
        <div class="service-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 20h20" stroke-linecap="round"/><rect x="4" y="9" width="16" height="11" rx="1"/><path d="M8 9V6l4-3 4 3v3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="service-card__name">Construction Clearance</div>
        <div class="service-card__tag">Home Repairs, Renovations, New Construction</div>
        <div class="service-card__divider" aria-hidden="true"></div>
        <div class="service-card__req-label">Requirements</div>
        <ul class="service-card__req-list">
          <li>Construction Information</li>
          <li>Contractor Information</li>
          <li>Blueprint Document</li>
        </ul>
        <div class="service-card__cta" aria-hidden="true">Apply Now <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </a>

      <a href="business_app.php" class="service-card" aria-label="Business Clearance — Apply online">
        <span class="service-card__number" aria-hidden="true">02</span>
        <div class="service-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke-linecap="round"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg></div>
        <div class="service-card__name">Business Clearance</div>
        <div class="service-card__tag">New Businesses, Renewals, and Closure</div>
        <div class="service-card__divider" aria-hidden="true"></div>
        <div class="service-card__req-label">Requirements</div>
        <ul class="service-card__req-list">
          <li>SEC or DTI Registration</li>
          <li>TCT or Lease Contract</li>
        </ul>
        <div class="service-card__cta" aria-hidden="true">Apply Now <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </a>

      <a href="utilities_app.php" class="service-card" aria-label="Utilities Services — File a request">
        <span class="service-card__number" aria-hidden="true">03</span>
        <div class="service-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v5M12 17v5M22 12h-5M7 12H2" stroke-linecap="round"/></svg></div>
        <div class="service-card__name">Utilities Services</div>
        <div class="service-card__tag">Water, Electricity, Internet &amp; Billing</div>
        <div class="service-card__divider" aria-hidden="true"></div>
        <div class="service-card__req-label">Available Services</div>
        <ul class="service-card__req-list">
          <li>Water Connection</li>
          <li>Electrical Repair</li>
          <li>Internet Connectivity</li>
          <li>Billing Inquiries</li>
        </ul>
        <div class="service-card__cta" aria-hidden="true">File Request <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </a>

      <a href="incidentReport.php" class="service-card" aria-label="Incident Report — File a report">
        <span class="service-card__number" aria-hidden="true">04</span>
        <div class="service-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg></div>
        <div class="service-card__name">Incident Report</div>
        <div class="service-card__tag">Report Incidents, Seek Assistance</div>
        <div class="service-card__divider" aria-hidden="true"></div>
        <div class="service-card__req-label">Information Needed</div>
        <ul class="service-card__req-list">
          <li>Reporter &amp; Victim Details</li>
          <li>Suspect Description</li>
          <li>Map-based Location Pin</li>
          <li>Witness Statements</li>
        </ul>
        <div class="service-card__cta" aria-hidden="true">File Report <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      </a>

    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="contact" id="contact" aria-labelledby="contact-heading">
  <div class="wrap">
    <div class="contact__layout">
      <div>
        <div class="section-index reveal" data-n="02" style="color:rgba(255,255,255,0.30);">Contact Us</div>
        <h2 class="section-title section-title--md section-title--light reveal reveal-d1" id="contact-heading">Get in Touch</h2>
        <p class="section-lead section-lead--light reveal reveal-d2" style="margin-top:var(--s2);">Have questions or need assistance? Reach us through any of the channels below.</p>
        <div class="contact__info-grid reveal reveal-d2">
          <div class="contact__info-item"><div class="contact__info-label">Address</div><div class="contact__info-value">5 Moonlight Loop,<br>Blue Ridge B,<br>Quezon City, Metro Manila</div></div>
          <div class="contact__info-item"><div class="contact__info-label">Mobile</div><div class="contact__info-value">0917-182-2272</div></div>
          <div class="contact__info-item"><div class="contact__info-label">Landline</div><div class="contact__info-value">8-5359822</div></div>
          <div class="contact__info-item"><div class="contact__info-label">Email</div><div class="contact__info-value">brgy.blueridgeb@quezoncity.gov.ph</div></div>
          <div class="contact__info-item"><div class="contact__info-label">Office Hours</div><div class="contact__info-value">Monday &ndash; Friday:<br>8:00 AM &ndash; 5:00 PM<br>Saturday:<br>8:00 AM &ndash; 12:00 PM</div></div>
          <div class="contact__info-item"><div class="contact__info-label">Online System</div><div class="contact__info-value">Available 24 hours a day,<br>7 days a week</div></div>
        </div>
      </div>

      <div class="contact__map reveal reveal-d3" aria-label="Barangay Blue Ridge B location map">
        <iframe
          src="https://www.google.com/maps?q=14.6183228,121.0744429&z=18&output=embed"
          width="100%"
          height="100%"
          style="border:0; display:block;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Barangay Blue Ridge B — 5 Moonlight Loop, Quezon City">
        </iframe>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer" role="contentinfo">
  <div class="wrap footer__inner">
    <span class="footer__brand">BANWA</span>
    <span class="footer__copy">&copy; <?php echo date('Y'); ?> Barangay Blue Ridge B. All rights reserved.</span>
  </div>
</footer>

    <?php include '../../pages/resident/_layout/end.php'; ?>
</body>

</html>