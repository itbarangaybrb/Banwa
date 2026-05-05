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
    <title>About Us</title>
    <meta name="description" content="Professional residential management system with elegant design and user-friendly interface">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
</head>

<body>
    <?php
    $page_title = "About Us";
    include '../../pages/resident/_layout/nav.php';
    ?>

<!-- STORY -->
<section class="story" id="about" aria-labelledby="story-heading">
  <div class="wrap">
    <div class="story__layout">
      <div class="story__text">
        <div class="section-index reveal" data-n="01" style="color:rgba(255,255,255,0.35);">Our Story</div>
        <h2 class="section-title section-title--lg section-title--light reveal reveal-d1" id="story-heading">Barangay<br>Blue Ridge B</h2>
        <div class="story__divider reveal reveal-d1" aria-hidden="true"></div>
        <div class="reveal reveal-d2">
          <p>Barangay Blue Ridge B was established as a growing residential community committed to fostering unity, safety, and responsible governance among its residents.</p>
          <p>Over the years, the barangay has continuously adapted to social and technological changes to better serve the needs of its people — guided by transparent leadership and active community participation.</p>
          <p>Today, Barangay Blue Ridge B stands as a progressive and organized community that values cooperation, innovation, and sustainable growth for every resident.</p>
        </div>
      </div>
      <div class="story__images reveal reveal-d2">
        <div class="story__img-main"><img src="../../img/building-1.png" alt="Barangay Hall" id="storyMainImg"></div>
        <div class="story__img-thumb"><img src="../../img/building-3.png" alt="Community Center" data-full="../../img/building-3.png" onclick="document.getElementById('storyMainImg').src=this.dataset.full"></div>
        <div class="story__img-thumb"><img src="../../img/building-5.png" alt="Meeting Hall" data-full="../../img/building-5.png" onclick="document.getElementById('storyMainImg').src=this.dataset.full"></div>
      </div>
    </div>
      <div class="story__partners reveal reveal-d3">
        <span class="story__partners-label">Partners</span>
        <div class="story__partner-logos">
          <img src="../../img/logo-1.png" alt="Partner 1">
          <img src="../../img/logo-2.png" alt="Partner 2">
          <img src="../../img/logo-3.png" alt="Partner 3">
        </div>
      </div>
  </div>
</section>

<!-- MISSION & VISION -->
<section class="mv" id="mission" aria-labelledby="mv-heading">
  <div class="wrap">
    <div class="mv__header reveal">
      <div class="section-index" data-n="02">Mission &amp; Vision</div>
      <h2 class="section-title section-title--md" id="mv-heading">Principles That<br>Guide Us</h2>
    </div>
    <div class="mv__grid reveal reveal-d1">
      <div class="mv__card">
        <div class="mv__card-label">Mission</div>
        <div class="mv__card-title">What Drives Our Service</div>
        <p class="mv__card-text">We, as the front-liners of the government to its citizens at the Barangay level, are committed to becoming models of excellence and to delivering efficient, high-quality, and good-value services to Blue Ridge B towards attainment of our vision.</p>
      </div>
      <div class="mv__card">
        <div class="mv__card-label">Vision</div>
        <div class="mv__card-title">The Community We're Building</div>
        <p class="mv__card-text">We envision Barangay Blue Ridge B as a community of peaceful, drug-free, clean, environmentally aware, self-sufficient, disaster-resilient individuals — morally and socially progressive, caring, disciplined, law-abiding, productive, and healthy.</p>
      </div>
    </div>
  </div>
</section>

<!-- OFFICIALS -->
<section class="officials" id="officials" aria-labelledby="officials-heading">
  <div class="wrap">
    <div class="officials__header">
      <div>
        <div class="section-index reveal" data-n="03">Leadership</div>
        <h2 class="section-title section-title--md reveal reveal-d1" id="officials-heading">Barangay Officials</h2>
      </div>
      <div class="officials__nav reveal reveal-d1">
        <button class="officials__nav-btn" id="officialsPrev" aria-label="Previous">&#8249;</button>
        <button class="officials__nav-btn" id="officialsNext" aria-label="Next">&#8250;</button>
      </div>
    </div>
    <div class="officials__viewport reveal reveal-d2">
      <div class="officials__track" id="officialsTrack">
        <div class="official-card is-active"><div class="official-card__photo"><img src="../../img/official-1.png" alt="Kapitan Sessan Castro-Lee"></div><div><div class="official-card__name">Sessan Castro-Lee</div><div class="official-card__role">Barangay Captain</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-2.png" alt="Katherine T. De Jesus"></div><div><div class="official-card__name">Katherine T. De Jesus</div><div class="official-card__role">1st Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-3.png" alt="Margarette Karra De Jesus"></div><div><div class="official-card__name">Margarette K. De Jesus</div><div class="official-card__role">2nd Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-4.png" alt="Anna Francesca L. Maristela"></div><div><div class="official-card__name">Anna F. L. Maristela</div><div class="official-card__role">3rd Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-5.png" alt="Augusto D. Ilagan"></div><div><div class="official-card__name">Augusto D. Ilagan</div><div class="official-card__role">4th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-6.png" alt="Natalia L. Maristela"></div><div><div class="official-card__name">Natalia L. Maristela</div><div class="official-card__role">5th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-7.png" alt="Modesto Carlo M. Ruiz Jr."></div><div><div class="official-card__name">Modesto C. M. Ruiz Jr.</div><div class="official-card__role">6th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-8.png" alt="Rovie Rose B. Baylon"></div><div><div class="official-card__name">Rovie Rose B. Baylon</div><div class="official-card__role">Barangay Secretary</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../../img/official-9.png" alt="Michell V. Meniano"></div><div><div class="official-card__name">Michell V. Meniano</div><div class="official-card__role">Barangay Treasurer</div></div></div>
      </div>
    </div>
    <div class="officials__indicators" id="officialsIndicators" aria-label="Slide indicators"></div>
  </div>
</section>

<!-- FAQ -->
<section class="faq" id="faq" aria-labelledby="faq-heading">
  <div class="wrap">
    <div class="section-index reveal" data-n="04">Help Center</div>
    <h2 class="section-title section-title--md reveal reveal-d1" id="faq-heading" style="margin-bottom:var(--s8);">Frequently Asked<br>Questions</h2>
    <div class="faq__layout">
      <nav class="faq__sidebar reveal" aria-label="FAQ categories">
        <div class="faq__sidebar-title">Categories</div>
        <button class="faq__tab-btn is-active" data-panel="faq-general">General</button>
        <button class="faq__tab-btn" data-panel="faq-clearances">Clearances</button>
        <button class="faq__tab-btn" data-panel="faq-technical">Technical</button>
        <button class="faq__tab-btn" data-panel="faq-payments">Payments</button>
      </nav>
      <div class="faq__panels reveal reveal-d1">

        <div class="faq__panel is-active" id="faq-general">
          <h3 class="faq__panel-title">General Questions</h3>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">What is BANWA?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>BANWA (Barangay Blue Ridge B Management System) is an online platform allowing residents to access barangay services, submit clearance applications, report issues, and stay updated with announcements from anywhere, anytime.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">Is the website available 24/7?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Yes. While the physical office has specific hours (Mon&ndash;Fri: 8AM&ndash;5PM, Sat: 8AM&ndash;12PM), the online system is accessible 24 hours a day, 7 days a week except public holidays. Submissions made outside office hours are processed the next business day.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">Do I need an account to use services?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Yes. An account is required to access most services. Registration verifies your identity and secures your information. The process takes only a few minutes and requires a valid government-issued ID.</p></div></div>
        </div>

        <div class="faq__panel" id="faq-clearances">
          <h3 class="faq__panel-title">Clearances &amp; Permits</h3>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">How long does processing take?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Online clearance applications are typically processed within a few working days. You will be notified through BANWA once your clearance is ready for pickup or if there are any issues.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">What documents are needed for Business Clearance?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><ul><li>SEC Registration or DTI Registration</li><li>Transfer Certificate of Title (TCT) or Lease Contract</li></ul></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">Can I track my application status?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Yes. After logging in, you can view real-time status of all applications in your dashboard: Pending, Under Review, Approved, Ready for Pickup, and Completed.</p></div></div>
        </div>

        <div class="faq__panel" id="faq-technical">
          <h3 class="faq__panel-title">Technical Support</h3>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">How do I reset my password?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Click "Forgot password?" on the login page and enter your registered email. If you don't receive the reset email within a few minutes, check your spam folder.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">What file formats are accepted for ID upload?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>We accept JPG, JPEG, and PNG formats. Maximum file size is 5&thinsp;MB. Ensure the image is clear and all text on the ID is fully readable.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">Who do I contact for technical issues?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Email: brgy.blueridgeb@quezoncity.gov.ph<br>Mobile: 0917-182-2272<br>Landline: 8-5359822<br>Or visit the barangay hall during office hours and ask for IT support staff.</p></div></div>
        </div>

        <div class="faq__panel" id="faq-payments">
          <h3 class="faq__panel-title">Payments &amp; Fees</h3>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">What payment methods are accepted?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>Cash at the barangay hall, GCash via our official account, and bank transfer with proof of payment. Additional online channels will be available soon.</p></div></div>
          <div class="faq__item"><button class="faq__question" aria-expanded="false">Is there a fee for using the online system?<span class="faq__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></button><div class="faq__answer" role="region"><p>No. BANWA is free to use. You only pay standard government fees for the services you apply for. GCash payments include a small processing fee.</p></div></div>
        </div>

      </div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="contact" id="contact" aria-labelledby="contact-heading">
  <div class="wrap">
    <div class="contact__layout">
      <div>
        <div class="section-index reveal" data-n="05" style="color:rgba(255,255,255,0.30);">Contact Us</div>
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
    </main>

    <?php include '../../pages/resident/_layout/end.php'; ?>
</body>

</html>