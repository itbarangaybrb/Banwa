<?php
session_start();

if (isset($_SESSION['user_id']) && isset($_SESSION['role_id'])) {
    require_once __DIR__ . '/../server/configs/database.php';
    $userId = $_SESSION['user_id'];
    $stmt   = $pdo->prepare("SELECT status FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $user   = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        if ($user['status'] === 'suspended') {
            session_destroy();
            header("Location: /client/pages/auth/suspended.php");
            exit;
        }
        $redirectMap = [
            1 => '/client/pages/resident/home.php',
            2 => '/client/pages/staff/superadmin/dashboard.php',
            4 => '/client/pages/staff/business_staff/business.php',
            5 => '/client/pages/staff/construction_staff/construction.php',
            6 => '/client/pages/staff/utilities_staff/utilities.php',
            7 => '/client/pages/staff/incident_report_staff/incident_report.php',
            8 => '/client/pages/staff/finance_staff/finance.php',
        ];
        $roleId = $_SESSION['role_id'];
        if (isset($redirectMap[$roleId])) { header("Location: {$redirectMap[$roleId]}"); }
        else { session_destroy(); header("Location: /client/index.php"); }
        exit;
    } else {
        session_destroy();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="BANWA — Barangay Blue Ridge B Management System. Access barangay services online 24/7.">
<title>BANWA — Barangay Blue Ridge B</title>
<link rel="icon" type="image/svg+xml" href="../client/img/browser-icon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../client/styles/resident/home.css">
<link rel="stylesheet" href="../client/styles/resident/nav.css">
<link rel="stylesheet" href="../client/styles/auth/signup-modal.css">
<link rel="stylesheet" href="../client/styles/components/loader.css">
</head>
<body>

<!-- LOADER -->
<div id="loader" role="status" aria-label="Loading BANWA">
  <span class="loader__wordmark">BANWA</span>
  <span class="loader__sub">Barangay Blue Ridge B</span>
  <div class="loader__track"><div class="loader__bar"></div></div>
</div>

<!-- NAV -->
<nav class="nav" id="mainNav" aria-label="Main navigation">
  <div class="wrap nav__inner">
    <a href="../client/index2.php" class="nav__brand">
      <div class="nav__logos" aria-hidden="true">
        <img src="../client/img/logo-1.png" alt="">
        <img src="../client/img/banwalogo.png" alt="">
      </div>
      <span class="nav__wordmark">BANWA</span>
    </a>
    <div class="nav__right">
      <time class="nav__time" id="navTime" aria-live="polite"></time>
      <button class="btn-cta" id="navGetStartedBtn" aria-haspopup="dialog">
        Get Started
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="hero" aria-labelledby="hero-title">
  <div class="hero__container">

    <!-- Background images -->
    <div class="hero__bg" aria-hidden="true">
      <img class="hero__bg-slide is-active" src="../client/img/building-1.png" alt="">
      <img class="hero__bg-slide" src="../client/img/building-2.png" alt="">
      <img class="hero__bg-slide" src="../client/img/building-3.png" alt="">
      <img class="hero__bg-slide" src="../client/img/building-4.png" alt="">
      <img class="hero__bg-slide" src="../client/img/building-5.png" alt="">
    </div>
    <div class="hero__overlay" aria-hidden="true"></div>
    <div class="hero__grid-lines" aria-hidden="true"></div>

    <!-- Right-side image strip -->
    <div class="hero__visual" aria-hidden="true">
      <div class="hero__visual-img"><img class="is-active" src="../client/img/building-2.png" alt=""></div>
      <div class="hero__visual-gap"></div>
      <div class="hero__visual-img"><img class="is-active" src="../client/img/building-4.png" alt=""></div>
    </div>

    <!-- Slide navigation dots -->
    <div class="hero__dots" aria-label="Slide navigation">
      <button class="hero__dot is-active" data-slide="0" aria-label="Slide 1"></button>
      <button class="hero__dot" data-slide="1" aria-label="Slide 2"></button>
      <button class="hero__dot" data-slide="2" aria-label="Slide 3"></button>
      <button class="hero__dot" data-slide="3" aria-label="Slide 4"></button>
      <button class="hero__dot" data-slide="4" aria-label="Slide 5"></button>
    </div>

    <!-- Main content -->
    <div class="hero__content">
      <div class="hero__body">
        <div class="wrap">
          <div class="hero__label" aria-hidden="true">
            <span class="hero__label-line"></span>
            <span class="hero__label-text">Barangay Blue Ridge B &mdash; Quezon City</span>
          </div>
          <h1 class="hero__title" id="hero-title">BANWA</h1>
          <p class="hero__title-sub">Barangay Management System</p>

          <div class="hero__status" role="group" aria-label="Office hours indicator">
            <span class="hero__status-pip" id="heroPip" aria-hidden="true"></span>
            <span class="hero__status-text" id="heroStatusText" tabindex="0">Checking office hours&hellip;</span>
            <div class="hero__hours-popup" role="tooltip">
              <div class="hours-popup__title">Onsite Office Hours</div>
              <div class="hours-popup__row">
                <span class="hours-popup__days">Monday &ndash; Friday</span>
                <span class="hours-popup__time">8:00 AM &ndash; 5:00 PM</span>
              </div>
              <div class="hours-popup__row">
                <span class="hours-popup__days">Saturday</span>
                <span class="hours-popup__time">8:00 AM &ndash; 12:00 PM</span>
              </div>
              <div class="hours-popup__row">
                <span class="hours-popup__days">Sunday &amp; Holidays</span>
                <span class="hours-popup__time is-closed">Closed</span>
              </div>
              <div class="hours-popup__status" id="hoursPopupStatus">
                <span class="hours-popup__status-dot"></span>
                <span id="hoursPopupStatusText">Loading&hellip;</span>
              </div>
              <p class="hours-popup__next" id="hoursPopupNext" style="display:none;"></p>
            </div>
          </div>

          <p class="hero__desc">The system enables Barangay Blue Ridge B to efficiently manage infrastructure, business clearances, utilities, and incidents — available online 24 hours a day, 7 days a week.</p>
        </div>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="hero__stats-bar" aria-label="Key figures">
      <div class="hero__stats-inner">
        <div class="hero__stat"><div class="hero__stat-num">24/7</div><div class="hero__stat-label">Online Access</div></div>
        <div class="hero__stat"><div class="hero__stat-num">4</div><div class="hero__stat-label">Core Services</div></div>
        <div class="hero__stat"><div class="hero__stat-num">9</div><div class="hero__stat-label">Barangay Officials</div></div>
        <div class="hero__stat"><div class="hero__stat-num">1</div><div class="hero__stat-label">Unified Platform</div></div>
      </div>
    </div>

    <div class="hero__rule" aria-hidden="true"></div>
  </div>
</section>

<!-- SERVICES -->
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

      <button class="service-card" aria-label="Construction Clearance — Apply online">
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
      </button>

      <button class="service-card" aria-label="Business Clearance — Apply online">
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
      </button>

      <button class="service-card" aria-label="Utilities Services — File a request">
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
      </button>

      <button class="service-card" aria-label="Incident Report — File a report">
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
      </button>

    </div>
  </div>
</section>

<!-- STORY -->
<section class="story" id="about" aria-labelledby="story-heading">
  <div class="wrap">
    <div class="story__layout">
      <div class="story__text">
        <div class="section-index reveal" data-n="02" style="color:rgba(255,255,255,0.35);">Our Story</div>
        <h2 class="section-title section-title--lg section-title--light reveal reveal-d1" id="story-heading">Barangay<br>Blue Ridge B</h2>
        <div class="story__divider reveal reveal-d1" aria-hidden="true"></div>
        <div class="reveal reveal-d2">
          <p>Barangay Blue Ridge B was established as a growing residential community committed to fostering unity, safety, and responsible governance among its residents.</p>
          <p>Over the years, the barangay has continuously adapted to social and technological changes to better serve the needs of its people — guided by transparent leadership and active community participation.</p>
          <p>Today, Barangay Blue Ridge B stands as a progressive and organized community that values cooperation, innovation, and sustainable growth for every resident.</p>
        </div>
      </div>
      <div class="story__images reveal reveal-d2">
        <div class="story__img-main"><img src="../client/img/building-1.png" alt="Barangay Hall" id="storyMainImg"></div>
        <div class="story__img-thumb"><img src="../client/img/building-3.png" alt="Community Center" data-full="../client/img/building-3.png" onclick="document.getElementById('storyMainImg').src=this.dataset.full"></div>
        <div class="story__img-thumb"><img src="../client/img/building-5.png" alt="Meeting Hall" data-full="../client/img/building-5.png" onclick="document.getElementById('storyMainImg').src=this.dataset.full"></div>
      </div>
    </div>
      <div class="story__partners reveal reveal-d3">
        <span class="story__partners-label">Partners</span>
        <div class="story__partner-logos">
          <img src="../client/img/logo-1.png" alt="Partner 1">
          <img src="../client/img/logo-2.png" alt="Partner 2">
          <img src="../client/img/logo-3.png" alt="Partner 3">
        </div>
      </div>
  </div>
</section>

<!-- MISSION & VISION -->
<section class="mv" id="mission" aria-labelledby="mv-heading">
  <div class="wrap">
    <div class="mv__header reveal">
      <div class="section-index" data-n="03">Mission &amp; Vision</div>
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
        <div class="section-index reveal" data-n="04">Leadership</div>
        <h2 class="section-title section-title--md reveal reveal-d1" id="officials-heading">Barangay Officials</h2>
      </div>
      <div class="officials__nav reveal reveal-d1">
        <button class="officials__nav-btn" id="officialsPrev" aria-label="Previous">&#8249;</button>
        <button class="officials__nav-btn" id="officialsNext" aria-label="Next">&#8250;</button>
      </div>
    </div>
    <div class="officials__viewport reveal reveal-d2">
      <div class="officials__track" id="officialsTrack">
        <div class="official-card is-active"><div class="official-card__photo"><img src="../client/img/official-1.png" alt="Kapitan Sessan Castro-Lee"></div><div><div class="official-card__name">Sessan Castro-Lee</div><div class="official-card__role">Barangay Captain</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-2.png" alt="Katherine T. De Jesus"></div><div><div class="official-card__name">Katherine T. De Jesus</div><div class="official-card__role">1st Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-3.png" alt="Margarette Karra De Jesus"></div><div><div class="official-card__name">Margarette K. De Jesus</div><div class="official-card__role">2nd Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-4.png" alt="Anna Francesca L. Maristela"></div><div><div class="official-card__name">Anna F. L. Maristela</div><div class="official-card__role">3rd Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-5.png" alt="Augusto D. Ilagan"></div><div><div class="official-card__name">Augusto D. Ilagan</div><div class="official-card__role">4th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-6.png" alt="Natalia L. Maristela"></div><div><div class="official-card__name">Natalia L. Maristela</div><div class="official-card__role">5th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-7.png" alt="Modesto Carlo M. Ruiz Jr."></div><div><div class="official-card__name">Modesto C. M. Ruiz Jr.</div><div class="official-card__role">6th Kagawad</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-8.png" alt="Rovie Rose B. Baylon"></div><div><div class="official-card__name">Rovie Rose B. Baylon</div><div class="official-card__role">Barangay Secretary</div></div></div>
        <div class="official-card"><div class="official-card__photo"><img src="../client/img/official-9.png" alt="Michell V. Meniano"></div><div><div class="official-card__name">Michell V. Meniano</div><div class="official-card__role">Barangay Treasurer</div></div></div>
      </div>
    </div>
    <div class="officials__indicators" id="officialsIndicators" aria-label="Slide indicators"></div>
  </div>
</section>

<!-- FAQ -->
<section class="faq" id="faq" aria-labelledby="faq-heading">
  <div class="wrap">
    <div class="section-index reveal" data-n="05">Help Center</div>
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
        <div class="section-index reveal" data-n="06" style="color:rgba(255,255,255,0.30);">Contact Us</div>
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

<!-- AUTH MODAL -->
<div id="authModal" class="signup-modal" role="dialog" aria-modal="true" aria-label="BANWA Authentication">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Welcome to BANWA</h2>
      <div class="subtitle">Barangay Blue Ridge B Management System</div>
      <button class="modal-close" id="closeModalBtn" aria-label="Close dialog">&times;</button>
    </div>
    <div class="auth-toggle">
      <button class="toggle-btn active" id="showLoginBtn">Log In</button>
      <button class="toggle-btn" id="showSignupBtn">Sign Up</button>
    </div>
    <div class="auth-panel" id="signupPanel">
      <div class="progress-steps">
        <div class="step active" data-step="1"><div class="step-number">1</div><div class="step-label">Identity</div></div>
        <div class="step" data-step="2"><div class="step-number">2</div><div class="step-label">Personal Info</div></div>
        <div class="step" data-step="3"><div class="step-number">3</div><div class="step-label">Account</div></div>
      </div>
      <div class="modal-body">
        <div class="form-panel" id="selectId">
          <form class="form" id="selectIdForm">
            <h2 class="form2">Identity Verification</h2>
            <p>Please upload a valid ID to autofill your information.</p>
            <div class="inputs-container">
              <div class="label-and-input" id="idTypeWrapper"><label>Type of ID <span style="color:#BB1B1B">*</span></label><select name="idType" id="idType" required><option value="" disabled selected>Select ID Type</option><option value="Quezon">Quezon City ID</option><option value="National">National ID (PhilSys)</option></select><div class="error-msg"></div></div>
              <div class="label-and-input" id="idFileWrapper"><label for="idFile">Upload ID File <span style="color:#BB1B1B">*</span><br><i>(Clear image of the front of your ID)</i></label><input id="idFile" name="idFile" type="file" accept="image/png,image/jpeg,image/jpg" required><div id="imagePreviewContainer" style="margin-top:10px;display:none;"><img id="idImagePreview" src="#" alt="ID Preview" style="max-width:100%;border-radius:8px;border:1px solid #ddd;"></div><div class="error-msg"></div></div>
              <div id="ocrStatus" style="display:none;"></div>
            </div>
            <div class="buttons-container"><button type="button" id="selectIdNextBtn">Next</button></div>
          </form>
        </div>
        <div class="form-panel hidden" id="personalDetails">
          <form class="form" id="personalDetailsForm">
            <h2 class="form2">Personal Information</h2>
            <div class="inputs-container">
              <div class="label-and-input"><label for="firstName">First name <span style="color:#BB1B1B">*</span></label><input id="firstName" name="firstName" type="text" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="middleName">Middle name <i>(Optional)</i></label><input id="middleName" name="middleName" type="text"><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="lastName">Last name <span style="color:#BB1B1B">*</span></label><input id="lastName" name="lastName" type="text" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="suffix">Suffix <i>(Optional)</i></label><input id="suffix" name="suffix" type="text"><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="sex">Sex <span style="color:#BB1B1B">*</span></label><select id="sex" name="sex" required><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="contactNo">Contact No. <span style="color:#BB1B1B">*</span></label><input type="tel" id="contactNo" name="contactNo" maxlength="11" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="address">Address</label><textarea id="address" name="address"></textarea><div class="error-msg"></div></div>
            </div>
            <div class="buttons-container"><button type="button" id="personalDetailsBackBtn">Back</button><button type="button" id="personalDetailsNextBtn">Next</button></div>
          </form>
        </div>
        <div class="form-panel hidden" id="createAcc">
          <form class="form" id="createAccForm">
            <h2 class="form2">Create Account</h2>
            <span id="formMessage"></span>
            <div class="inputs-container">
              <div class="label-and-input"><label for="createAccEmail">Email <span style="color:#BB1B1B">*</span></label><input type="email" name="createAccEmail" id="createAccEmail" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="password">Password <span style="color:#BB1B1B">*</span></label><input type="password" name="password" id="password" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="reTypePassword">Re-type password <span style="color:#BB1B1B">*</span></label><input type="password" name="reTypePassword" id="reTypePassword" required><div class="error-msg"></div></div>
              <div class="label-and-input"><label><input type="checkbox" id="agreeCheckBox" required> I confirm that I have read and accept the <a href="/client/pages/auth/terms.php" target="_blank" rel="noopener">terms and conditions</a> and <a href="/client/pages/auth/privacy.php" target="_blank" rel="noopener">privacy policy</a>.</label><div class="error-msg"></div></div>
            </div>
            <div class="buttons-container"><button type="button" id="createAccBackBtn">Back</button><button type="submit" id="createAccSubmitBtn">Submit</button><button type="button" id="resendEmailBtn">Resend verification email</button></div>
          </form>
        </div>
      </div>
    </div>
    <div class="auth-panel hidden" id="loginPanel">
      <div class="modal-body">
        <div class="login-container">
          <form class="form" id="loginForm">
            <div id="loginFormMessage" class="form-message"></div>
            <div class="inputs-container">
              <div class="label-and-input"><label for="loginEmail">Email</label><input type="email" id="loginEmail" name="email"><div class="error-msg"></div></div>
              <div class="label-and-input"><label for="loginPassword">Password</label><input type="password" id="loginPassword" name="password"><div class="error-msg"></div></div>
              <a href="../client/pages/auth/forgot_pass.php">Forgot password?</a>
            </div>
            <div class="buttons-container"><button type="submit" id="loginSubmitBtn" class="login-btn">Log in</button></div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="submitConfirmModal" aria-hidden="true" class="modal-hidden">
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal-box" role="document">
      <div class="modal-title">Submit Application</div>
      <div class="modal-body">Are you sure you want to submit? This will create your account and send a verification email.</div>
      <div class="modal-actions"><button class="btn btn-cancel">Cancel</button><button class="btn btn-confirm">Submit</button></div>
    </div>
  </div>
</div>

<script type="module" src="../client/scripts/auth/auth-modal.js"></script>
<script type="module" src="../client/scripts/resident/nav.js"></script>
<script type="module" src="../client/scripts/resident/home.js"></script>
<script type="module" src="../client/scripts/components/loader.js"></script>
</body>
</html>