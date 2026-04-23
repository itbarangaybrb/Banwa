document.addEventListener('DOMContentLoaded', function () {

    // ─────────────────────────────────────────────
    // 0. NAVIGATION TIME DISPLAY
    // ─────────────────────────────────────────────
    var timeEl=document.getElementById('navTime');
    function tick(){
    if(!timeEl)return;
    var d=new Date();
    var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM';
    h=h%12||12;
    timeEl.textContent=days[d.getDay()]+' '+(h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+' '+ap;
    }
    tick();setInterval(tick,30000);


    // ─────────────────────────────────────────────
    // 1. OFFICE HOURS STATUS
    // ─────────────────────────────────────────────
    function refreshStatus(){
    var d=new Date(),day=d.getDay(),mins=d.getHours()*60+d.getMinutes();
    var open=(day>=1&&day<=5&&mins>=480&&mins<1020)||(day===6&&mins>=480&&mins<720);
    var pip=document.getElementById('heroPip');
    var stTx=document.getElementById('heroStatusText');
    var chip=document.getElementById('hoursPopupStatus');
    var chipTx=document.getElementById('hoursPopupStatusText');
    var nextEl=document.getElementById('hoursPopupNext');
    if(open){
        if(pip)pip.className='hero__status-pip';
        if(stTx)stTx.textContent='Office open now';
        if(chip)chip.className='hours-popup__status is-open';
        if(chipTx)chipTx.textContent='Currently open';
        if(nextEl)nextEl.style.display='none';
    } else {
        if(pip)pip.className='hero__status-pip is-closed';
        if(stTx)stTx.textContent='Office currently closed';
        if(chip)chip.className='hours-popup__status is-closed';
        if(chipTx)chipTx.textContent='Currently closed';
        var msg='';
        if(day===0)msg='Opens Monday at 8:00 AM';
        else if(day===6&&mins>=720)msg='Opens Monday at 8:00 AM';
        else if(day>=1&&day<=5&&mins<480)msg='Opens today at 8:00 AM';
        else if(day>=1&&day<=4&&mins>=1020)msg='Opens tomorrow at 8:00 AM';
        else if(day===5&&mins>=1020)msg='Opens Saturday at 8:00 AM';
        if(nextEl&&msg){nextEl.textContent=msg;nextEl.style.display='block';}
    }
    }
    refreshStatus();

    // ─────────────────────────────────────────────
    // 2. HERO BACKGROUND CAROUSEL
    // ─────────────────────────────────────────────
    var hSlides = document.querySelectorAll('.hero__bg-slide');
    var hDots   = document.querySelectorAll('.hero__dot');
    var hIdx    = 0;

    function goHero(i) {
        hSlides[hIdx].classList.remove('is-active');
        hDots[hIdx].classList.remove('is-active');
        hIdx = (i + hSlides.length) % hSlides.length;
        hSlides[hIdx].classList.add('is-active');
        hDots[hIdx].classList.add('is-active');
    }

    if (hSlides.length && hDots.length) {
        hDots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                goHero(parseInt(this.dataset.slide));
            });
        });

        var heroTimer = setInterval(function() { goHero(hIdx + 1); }, 5500);

        var heroBg = document.querySelector('.hero__bg');
        if (heroBg) {
            heroBg.addEventListener('mouseenter', function() { clearInterval(heroTimer); });
            heroBg.addEventListener('mouseleave', function() {
                heroTimer = setInterval(function() { goHero(hIdx + 1); }, 5500);
            });
        }
    }


    // ─────────────────────────────────────────────
    // 3. STORY IMAGE THUMBNAILS
    // ─────────────────────────────────────────────
    var storyMain = document.getElementById('storyMainImg');
    var thumbImgs = document.querySelectorAll('.story__img-thumb img');
 
    if (storyMain && thumbImgs.length) {
        thumbImgs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                storyMain.src = this.dataset.full;
            });
        });
    }


    // ─────────────────────────────────────────────
    // 4. AUTH MODAL — service cards + get-started btn
    // ─────────────────────────────────────────────
    const authModal = document.getElementById('authModal');

    if (authModal) {
        function openModal() {
            authModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            authModal.classList.remove('show');
            document.body.style.overflow = '';
        }

        const getStartedBtn = document.getElementById('navGetStartedBtn');
        if (getStartedBtn) getStartedBtn.addEventListener('click', openModal);

        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            });
        });

        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        authModal.addEventListener('click', function (e) {
            if (e.target === authModal) closeModal();
        });
    }


    // ─────────────────────────────────────────────
    // 5. SMOOTH SCROLL for anchor links
    // ─────────────────────────────────────────────
    var revs=document.querySelectorAll('.reveal');
    if('IntersectionObserver'in window){
    var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');obs.unobserve(e.target);}});},{threshold:0.10,rootMargin:'0px 0px -40px 0px'});
    revs.forEach(function(el){obs.observe(el);});
    } else {
    revs.forEach(function(el){el.classList.add('in-view');});
    }


    // ─────────────────────────────────────────────
    // 6. BARANGAY OFFICIALS CAROUSEL
    // ─────────────────────────────────────────────
    var track = document.getElementById('officialsTrack');
    var indWrap = document.getElementById('officialsIndicators');

    // Only run carousel code if BOTH elements exist
    if (track && indWrap) {
        var cards = Array.from(track.children);
        var oIdx = 0;
        
        cards.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'officials__dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', 'Official ' + (i + 1));
            dot.dataset.i = i;
            dot.addEventListener('click', function() { goOff(+this.dataset.i); });
            indWrap.appendChild(dot);
        });

        function pv() { 
            return window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : 3; 
        }
        
        function goOff(i) {
            var p = pv(),
                max = Math.max(0, cards.length - p);
            oIdx = Math.max(0, Math.min(i, max));
            var w = cards[0] ? cards[0].offsetWidth + 24 : 0;
            track.style.transform = 'translateX(-' + oIdx * w + 'px)';
            cards.forEach(function(c, idx) {
                c.classList.toggle('is-active', idx >= oIdx && idx < oIdx + p);
            });
            indWrap.querySelectorAll('.officials__dot').forEach(function(d, idx) {
                d.classList.toggle('is-active', idx === oIdx);
            });
        }

        var prevBtn = document.getElementById('officialsPrev');
        var nextBtn = document.getElementById('officialsNext');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() { goOff(oIdx - 1); });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() { goOff(oIdx + 1); });
        }
        
        window.addEventListener('resize', function() { goOff(oIdx); }, { passive: true });
        setTimeout(function() { goOff(0); }, 100);
    }


    // ─────────────────────────────────────────────
    // 7. FAQ ACCORDION
    // ─────────────────────────────────────────────
    document.querySelectorAll('.faq__tab-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
        document.querySelectorAll('.faq__tab-btn').forEach(function(b){b.classList.remove('is-active');});
        document.querySelectorAll('.faq__panel').forEach(function(p){p.classList.remove('is-active');});
        this.classList.add('is-active');
        var panel=document.getElementById(this.dataset.panel);
        if(panel)panel.classList.add('is-active');
    });
    });

    document.querySelectorAll('.faq__question').forEach(function(btn){
    btn.addEventListener('click',function(){
        var ans=this.nextElementSibling,isOpen=this.classList.contains('is-open');
        document.querySelectorAll('.faq__question.is-open').forEach(function(q){q.classList.remove('is-open');q.setAttribute('aria-expanded','false');q.nextElementSibling.classList.remove('is-open');});
        if(!isOpen){this.classList.add('is-open');this.setAttribute('aria-expanded','true');ans.classList.add('is-open');}
    });
    });
});