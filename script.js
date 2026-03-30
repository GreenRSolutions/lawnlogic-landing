/* ============================================
   LAWNLOGIC LANDING PAGE — ENHANCED SCRIPT
   v2.0 — Full click tracking, multi-step form,
   form abandonment capture, social proof pulse,
   mobile UX improvements
   ============================================ */

/* ============================================
   BEFORE/AFTER SLIDER
   ============================================ */

function initBeforeAfterSlider() {
    const container = document.querySelector('.before-after-slider');
    const beforeImg = document.querySelector('.before-after-img.before');
    const divider = document.getElementById('sliderDivider');
    const handle = document.getElementById('sliderHandle');
    const rangeInput = document.getElementById('beforeAfterSlider');

    if (!container || !beforeImg) return;

    let isDragging = false;
    let sliderInteracted = false;

    function setPosition(pct) {
        pct = Math.max(0, Math.min(100, pct));
        beforeImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        if (divider) divider.style.left = pct + '%';
        if (handle) handle.style.left = pct + '%';
        if (rangeInput) rangeInput.value = pct;
    }

    function getPercentage(e) {
        const rect = container.getBoundingClientRect();
        let clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        return ((clientX - rect.left) / rect.width) * 100;
    }

    // Mouse events
    container.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
        setPosition(getPercentage(e));
        if (!sliderInteracted) {
            sliderInteracted = true;
            trackEvent('before_after_slider_interact', { method: 'mouse' });
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        setPosition(getPercentage(e));
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Touch events
    container.addEventListener('touchstart', function(e) {
        isDragging = true;
        setPosition(getPercentage(e));
        if (!sliderInteracted) {
            sliderInteracted = true;
            trackEvent('before_after_slider_interact', { method: 'touch' });
        }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        setPosition(getPercentage(e));
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
    }, { passive: true });

    document.addEventListener('touchend', function() {
        isDragging = false;
    });

    if (rangeInput) {
        rangeInput.addEventListener('input', function(e) {
            setPosition(Number(e.target.value));
        });
    }

    setPosition(50);
}

/* ============================================
   FAQ ACCORDION
   ============================================ */

function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach((question) => {
        question.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            const questionText = this.querySelector('span:first-child')?.textContent || '';

            document.querySelectorAll('.faq-item').forEach((item) => {
                item.classList.remove('active');
            });

            if (!isActive) {
                faqItem.classList.add('active');
                trackEvent('faq_opened', { question: questionText });
            }
        });
    });
}

/* ============================================
   MULTI-STEP FORM
   ============================================ */

function initMultiStepForm() {
    const multiStepForm = document.getElementById('multi-step-form');
    if (!multiStepForm) return;

    const steps = multiStepForm.querySelectorAll('.form-step');
    const progressBar = document.getElementById('form-progress-bar');
    const progressText = document.getElementById('form-progress-text');
    let currentStep = 0;
    let formStartTime = null;
    let formStarted = false;

    // Track which fields have been filled for abandonment capture
    let capturedPhone = '';
    let capturedName = '';

    function showStep(index) {
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });
        const pct = Math.round(((index) / steps.length) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = `Step ${index + 1} of ${steps.length}`;
    }

    function goToStep(index) {
        if (index >= 0 && index < steps.length) {
            currentStep = index;
            showStep(currentStep);
            trackEvent('form_step_viewed', { step: index + 1, step_name: steps[index].dataset.stepName || '' });
        }
    }

    // Project type card selection (Step 1)
    multiStepForm.querySelectorAll('.project-type-card').forEach(card => {
        card.addEventListener('click', function() {
            multiStepForm.querySelectorAll('.project-type-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            const hiddenInput = document.getElementById('ms-projectType');
            if (hiddenInput) hiddenInput.value = this.dataset.value;
            trackEvent('project_type_selected', { project_type: this.dataset.value });

            // Auto-advance after short delay for UX delight
            setTimeout(() => goToStep(1), 350);
        });
    });

    // Next/Back buttons
    multiStepForm.querySelectorAll('[data-next-step]').forEach(btn => {
        btn.addEventListener('click', function() {
            const nextIndex = parseInt(this.dataset.nextStep);
            // Validate step 2 (contact info) before advancing
            if (nextIndex === 2) {
                const nameEl = document.getElementById('ms-fullName');
                const phoneEl = document.getElementById('ms-phone');
                const emailEl = document.getElementById('ms-email');
                let valid = true;

                if (!nameEl || !nameEl.value.trim()) {
                    nameEl && nameEl.focus();
                    nameEl && nameEl.classList.add('invalid');
                    valid = false;
                } else {
                    nameEl && nameEl.classList.remove('invalid');
                }

                const digits = phoneEl ? phoneEl.value.replace(/\D/g,'').length : 0;
                const phoneErrEl = document.getElementById('phone-error');
                if (!phoneEl || digits < 10) {
                    phoneEl && phoneEl.classList.add('invalid');
                    if (phoneErrEl) phoneErrEl.style.display = 'block';
                    if (!nameEl || nameEl.value.trim()) phoneEl && phoneEl.focus();
                    valid = false;
                } else {
                    phoneEl && phoneEl.classList.remove('invalid');
                    if (phoneErrEl) phoneErrEl.style.display = 'none';
                }

                // Email: only validate if filled in
                const emailErrEl = document.getElementById('email-error');
                if (emailEl && emailEl.value.trim().length > 0) {
                    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim());
                    if (!emailOk) {
                        emailEl.classList.add('invalid');
                        if (emailErrEl) emailErrEl.style.display = 'block';
                        valid = false;
                    } else {
                        emailEl.classList.remove('invalid');
                        if (emailErrEl) emailErrEl.style.display = 'none';
                    }
                }

                if (!valid) return;
            }
            goToStep(nextIndex);
        });
    });

    multiStepForm.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.addEventListener('click', function() {
            const prevIndex = parseInt(this.dataset.prevStep);
            goToStep(prevIndex);
        });
    });

    // Track form start on first interaction
    multiStepForm.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('focus', function() {
            if (!formStarted) {
                formStarted = true;
                formStartTime = Date.now();
                trackEvent('form_started', { field: this.id || this.name });
            }
        });
    });

    // Capture phone for abandonment
    const phoneInput = document.getElementById('ms-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let raw = e.target.value.replace(/\D/g, '');
            if (raw.length > 10) raw = raw.slice(0, 10);
            let formatted = raw;
            if (raw.length > 6) {
                formatted = `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`;
            } else if (raw.length > 3) {
                formatted = `(${raw.slice(0,3)}) ${raw.slice(3)}`;
            } else if (raw.length > 0) {
                formatted = `(${raw}`;
            }
            e.target.value = formatted;
            const digits = raw.length;
            const errEl = document.getElementById('phone-error');
            if (digits === 10) {
                e.target.classList.remove('invalid'); e.target.classList.add('valid');
                if (errEl) errEl.style.display = 'none';
            } else if (digits > 0) {
                e.target.classList.remove('valid');
            }
        });
        phoneInput.addEventListener('blur', function() {
            const digits = this.value.replace(/\D/g,'').length;
            const errEl = document.getElementById('phone-error');
            if (digits > 0 && digits < 10) {
                this.classList.add('invalid'); this.classList.remove('valid');
                if (errEl) errEl.style.display = 'block';
            } else if (digits === 10) {
                this.classList.add('valid'); this.classList.remove('invalid');
                if (errEl) errEl.style.display = 'none';
                capturedPhone = this.value;
                scheduleAbandonmentCapture();
            }
        });
    }

    // Email validation
    const emailInput = document.getElementById('ms-email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const val = this.value.trim();
            const errEl = document.getElementById('email-error');
            if (val.length === 0) {
                this.classList.remove('invalid','valid');
                if (errEl) errEl.style.display = 'none';
                return;
            }
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
            if (valid) {
                this.classList.add('valid'); this.classList.remove('invalid');
                if (errEl) errEl.style.display = 'none';
            } else {
                this.classList.add('invalid'); this.classList.remove('valid');
                if (errEl) errEl.style.display = 'block';
            }
        });
    }

    // Mapbox address autocomplete
    // Token configured via Vercel environment variable MAPBOX_TOKEN
    const MAPBOX_TOKEN = window.MAPBOX_TOKEN || 'MAPBOX_TOKEN_PLACEHOLDER';
    const addressInput = document.getElementById('ms-address');
    const suggestionBox = document.getElementById('mapbox-suggestions');
    let mapboxTimeout = null;
    let selectedAddress = '';

    if (addressInput && suggestionBox) {
        addressInput.addEventListener('input', function() {
            const query = this.value.trim();
            clearTimeout(mapboxTimeout);
            if (query.length < 3) { suggestionBox.style.display = 'none'; return; }
            mapboxTimeout = setTimeout(async () => {
                try {
                    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=US&proximity=-84.3880,33.7490&types=address,place,neighborhood&limit=5`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (!data.features || data.features.length === 0) { suggestionBox.style.display = 'none'; return; }
                    suggestionBox.innerHTML = '';
                    data.features.forEach(feature => {
                        const item = document.createElement('div');
                        item.className = 'mapbox-suggestion-item';
                        const icon = feature.place_type[0] === 'address' ? '📍' : '🏙️';
                        item.innerHTML = `<span class="place-icon">${icon}</span><span>${feature.place_name}</span>`;
                        item.addEventListener('click', () => {
                            addressInput.value = feature.place_name;
                            selectedAddress = feature.place_name;
                            suggestionBox.style.display = 'none';
                            trackEvent('address_autocomplete_selected', { address: feature.place_name });
                        });
                        suggestionBox.appendChild(item);
                    });
                    suggestionBox.style.display = 'block';
                } catch(err) { suggestionBox.style.display = 'none'; }
            }, 300);
        });

        document.addEventListener('click', function(e) {
            if (!addressInput.contains(e.target) && !suggestionBox.contains(e.target)) {
                suggestionBox.style.display = 'none';
            }
        });
    }

    const nameInput = document.getElementById('ms-fullName');
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            if (this.value.trim().length > 1) {
                capturedName = this.value.trim();
                // Fire partial lead immediately if we also have phone
                if (capturedPhone && !abandonmentFired) {
                    fireAbandonmentCapture();
                }
            }
        });
    }

    let abandonmentTimer = null;
    let abandonmentFired = false;

    function scheduleAbandonmentCapture() {
        // Immediate fire if we have both name and phone
        if (capturedPhone && capturedName && !abandonmentFired) {
            fireAbandonmentCapture();
            return;
        }
        // Otherwise wait briefly in case they're still typing name
        if (abandonmentFired) return;
        clearTimeout(abandonmentTimer);
        abandonmentTimer = setTimeout(() => {
            if (!abandonmentFired && capturedPhone) {
                fireAbandonmentCapture();
            }
        }, 5000); // 5s fallback if name not yet captured
    }

    async function fireAbandonmentCapture() {
        if (abandonmentFired) return;
        abandonmentFired = true;
        const projectType = document.getElementById('ms-projectType')?.value || '';
        trackEvent('partial_lead_captured', { has_phone: !!capturedPhone, has_name: !!capturedName });
        try {
            await fetch('https://hook.us2.make.com/m4ed7smu5owlvj3se8mpk61daymf62yh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: capturedName || 'Unknown',
                    phone: capturedPhone,
                    email: '',
                    projectType: projectType,
                    propertyAddress: '',
                    message: '',
                    source: 'Partial Lead — instant.lawnlogicturf.com',
                    notifyEmail: 'dusty@lawnlogicturf.com',
                    smsMessage: "Hi " + (capturedName ? capturedName.split(' ')[0] : 'there') + "! We saw you're interested in more information about artificial turf — we will reach out soon! Or you can call us for faster service at (706) 701-8873. - LawnLogic Turf",
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer,
                    utm_source: getUTMParam('utm_source'),
                    utm_medium: getUTMParam('utm_medium'),
                    utm_campaign: getUTMParam('utm_campaign'),
                    utm_content: getUTMParam('utm_content'),
                    utm_term: getUTMParam('utm_term'),
                    gclid: getUTMParam('gclid'),
                })
            });
        } catch(err) { /* silent */ }
    }

    // Form submission
    multiStepForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        abandonmentFired = true; // prevent abandonment capture after submit
        clearTimeout(abandonmentTimer);

        const submitBtn = document.getElementById('ms-submitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

        const timeToSubmit = formStartTime ? Math.round((Date.now() - formStartTime) / 1000) : null;

        const fullName = document.getElementById('ms-fullName')?.value || '';
        const formData = {
            fullName: fullName,
            phone: document.getElementById('ms-phone')?.value || '',
            email: document.getElementById('ms-email')?.value || '',
            projectType: document.getElementById('ms-projectType')?.value || '',
            propertyAddress: document.getElementById('ms-address')?.value || '',
            message: document.getElementById('ms-message')?.value || '',
            source: 'Full Lead — instant.lawnlogicturf.com',
            notifyEmail: 'dusty@lawnlogicturf.com',
            smsMessage: 'Hi ' + (fullName.split(' ')[0] || 'there') + "! Thanks for requesting a free turf quote from LawnLogic! We'll be in touch within 24 hours. Questions? Call us at (706) 701-8873. - LawnLogic Turf",
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            utm_source: getUTMParam('utm_source'),
            utm_medium: getUTMParam('utm_medium'),
            utm_campaign: getUTMParam('utm_campaign'),
            utm_content: getUTMParam('utm_content'),
            utm_term: getUTMParam('utm_term'),
            gclid: getUTMParam('gclid'),
            time_to_submit_seconds: timeToSubmit,
        };

        try {
            const response = await fetch('https://hook.us2.make.com/m4ed7smu5owlvj3se8mpk61daymf62yh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                trackEvent('landing_form_submit_success', {
                    form_type: 'multi_step_quote_form',
                    project_type: formData.projectType,
                    time_to_submit: timeToSubmit,
                });
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', { 'send_to': 'AW-18016868257' });
                    gtag('event', 'conversion', { 'send_to': 'AW-17770927319' });
                    gtag('event', 'conversion', { 'send_to': 'AW-17775300843' });
                    gtag('event', 'generate_lead', { currency: 'USD', value: 1.0 });
                }
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', { content_name: 'Full Quote Form', value: 1.0, currency: 'USD' });
                }
                if (typeof ndp !== 'undefined') {
                    ndp('track', 'Conversion');
                }

                // Show success step
                steps.forEach(s => s.classList.remove('active'));
                const successStep = document.getElementById('form-success');
                if (successStep) {
                    successStep.style.display = 'block';
                    const firstName = formData.fullName.split(' ')[0];
                    const successName = document.getElementById('success-name');
                    if (successName) successName.textContent = firstName + '!';
                }
                if (progressBar) progressBar.style.width = '100%';
                if (progressText) progressText.textContent = 'Complete!';
            } else {
                throw new Error('Webhook failed');
            }
        } catch(err) {
            trackEvent('landing_form_submit_error', { error: err.message });
            const errorMsg = document.getElementById('ms-error');
            if (errorMsg) { errorMsg.style.display = 'block'; }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Get My Free Quote →'; }
        }
    });

    showStep(0);
}

/* ============================================
   LEGACY FORM HANDLER (fallback if multi-step
   not present)
   ============================================ */

function initFormHandler() {
    const form = document.getElementById('quote-form');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

        const formData = {
            fullName: document.getElementById('fullName')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            projectType: document.getElementById('projectType')?.value || '',
            propertyAddress: document.getElementById('propertyAddress')?.value || '',
            message: document.getElementById('message')?.value || '',
            source: 'LawnLogic Landing Page',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            utm_source: getUTMParam('utm_source'),
            utm_medium: getUTMParam('utm_medium'),
            utm_campaign: getUTMParam('utm_campaign'),
            gclid: getUTMParam('gclid'),
        };

        try {
            const response = await fetch('https://hook.us2.make.com/m4ed7smu5owlvj3se8mpk61daymf62yh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                trackEvent('landing_form_submit_success', { form_type: 'quote_form', project_type: formData.projectType });
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', { 'send_to': 'AW-18016868257' });
                    gtag('event', 'conversion', { 'send_to': 'AW-17770927319' });
                    gtag('event', 'conversion', { 'send_to': 'AW-17775300843' });
                    gtag('event', 'generate_lead', { currency: 'USD', value: 1.0 });
                }
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', { content_name: 'Quote Form', value: 1.0, currency: 'USD' });
                }
                if (typeof ndp !== 'undefined') {
                    ndp('track', 'Conversion');
                }
                if (formMessage) {
                    formMessage.textContent = 'Thank you! We received your quote request. We\'ll call you within 24 hours.';
                    formMessage.className = 'form-message success';
                    formMessage.style.display = 'block';
                }
                form.reset();
                if (submitBtn) { submitBtn.textContent = 'Get My Free Quote'; submitBtn.disabled = false; }
                setTimeout(() => { if (formMessage) formMessage.style.display = 'none'; }, 5000);
            } else {
                throw new Error('Webhook request failed');
            }
        } catch(error) {
            trackEvent('landing_form_submit_error', { error: error.message });
            if (formMessage) {
                formMessage.textContent = 'There was an issue submitting your quote. Please call us at (706) 701-8873.';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
            }
            if (submitBtn) { submitBtn.textContent = 'Get My Free Quote'; submitBtn.disabled = false; }
        }
    });
}

/* ============================================
   COMPREHENSIVE EVENT TRACKING
   Captures every meaningful click and interaction
   ============================================ */

function trackEvent(eventName, eventData = {}) {
    // Enrich with session data
    const enriched = {
        ...eventData,
        page_url: window.location.href,
        page_path: window.location.pathname,
        utm_source: getUTMParam('utm_source'),
        utm_medium: getUTMParam('utm_medium'),
        utm_campaign: getUTMParam('utm_campaign'),
        gclid: getUTMParam('gclid'),
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
    };

    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, enriched);
    }
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: eventName, ...enriched });
    }
    console.log('[LL Track]', eventName, enriched);
}

function initEventTracking() {
    // All elements with data-event attribute
    document.querySelectorAll('[data-event]').forEach((element) => {
        element.addEventListener('click', function() {
            const eventName = this.getAttribute('data-event');
            const extra = {};
            if (this.href) extra.link_url = this.href;
            if (this.textContent) extra.button_text = this.textContent.trim().slice(0, 50);
            trackEvent(eventName, extra);
        });
    });

    // Phone number clicks — all tel: links
    document.querySelectorAll('a[href^="tel:"]').forEach(el => {
        el.addEventListener('click', function() {
            trackEvent('phone_click', {
                phone_number: this.href.replace('tel:', ''),
                click_location: getClickLocation(this),
            });
            if (typeof gtag !== 'undefined') {
                gtag('event', 'conversion', { 'send_to': 'AW-18016868257' });
            }
        });
    });

    // Email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.addEventListener('click', function() {
            trackEvent('email_click', { email: this.href.replace('mailto:', '') });
        });
    });

    // External links
    document.querySelectorAll('a[target="_blank"]').forEach(el => {
        el.addEventListener('click', function() {
            trackEvent('external_link_click', {
                link_url: this.href,
                link_text: this.textContent.trim().slice(0, 50),
            });
        });
    });

    // AI chat open
    const aiToggle = document.getElementById('aiChatToggle');
    if (aiToggle) {
        aiToggle.addEventListener('click', function() {
            trackEvent('ai_chat_opened');
        });
    }

    // Instant Estimate Tool
    document.querySelectorAll('a[href*="getturfinstant"]').forEach(el => {
        el.addEventListener('click', function() {
            trackEvent('instant_estimate_tool_click', { click_location: getClickLocation(this) });
        });
    });

    // Form field focus (tracks which fields get attention)
    ['fullName', 'phone', 'email', 'projectType', 'propertyAddress', 'message',
     'ms-fullName', 'ms-phone', 'ms-email', 'ms-address', 'ms-message'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('focus', function() {
                trackEvent('form_field_focus', { field: id });
            });
        }
    });

    // Scroll depth tracking
    initScrollDepthTracking();

    // Time on page milestones
    [30, 60, 120, 180].forEach(seconds => {
        setTimeout(() => {
            trackEvent('time_on_page', { seconds: seconds });
        }, seconds * 1000);
    });
}

function initScrollDepthTracking() {
    const milestones = [25, 50, 75, 90, 100];
    const reached = new Set();

    function getScrollPct() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    }

    window.addEventListener('scroll', function() {
        const pct = getScrollPct();
        milestones.forEach(m => {
            if (pct >= m && !reached.has(m)) {
                reached.add(m);
                trackEvent('scroll_depth', { percent: m });
            }
        });
    }, { passive: true });
}

function getClickLocation(el) {
    // Determine where on page the click happened
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const absoluteTop = rect.top + scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const pct = Math.round((absoluteTop / docHeight) * 100);
    if (pct < 20) return 'header';
    if (pct < 40) return 'hero';
    if (pct < 60) return 'mid_page';
    if (pct < 80) return 'lower_page';
    return 'footer';
}

/* ============================================
   UTM & SESSION UTILITIES
   ============================================ */

function getUTMParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);
    if (value) {
        // Persist UTMs in sessionStorage so they survive page navigation
        sessionStorage.setItem('utm_' + param, value);
        return value;
    }
    return sessionStorage.getItem('utm_' + param) || '';
}

function getSessionId() {
    let sid = sessionStorage.getItem('ll_session_id');
    if (!sid) {
        sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('ll_session_id', sid);
    }
    return sid;
}

/* ============================================
   SOCIAL PROOF PULSE
   Shows rotating "recent lead" notifications
   ============================================ */

function initSocialProofPulse() {
    // Massive shuffled pool — 300 unique combos, never looks cyclic
    const _n = ['Mike','Sarah','James','Lisa','David','Amanda','Chris','Jennifer','Tyler','Ashley','Brandon','Megan','Kevin','Rachel','Justin','Nicole','Ryan','Stephanie','Nathan','Brittany','Josh','Lauren','Zach','Heather','Adam','Amber','Matt','Danielle','Andrew','Samantha','Brian','Kayla','Derek','Courtney','Eric','Tiffany','Kyle','Lindsey','Sean','Erica','Aaron','Melissa','Patrick','Alicia','Jason','Candace','Mark','Vanessa','Scott','Natalie','Travis','Alexis','Cody','Brooke','Dusty','Kristen','Chase','Paige','Blake','Kelsey','Austin','Taylor','Logan','Haley','Hunter','Kaitlyn','Garrett','Whitney','Colton','Morgan','Tanner','Cassidy','Bryce','Shelby','Caleb','Jenna','Seth','Allison','Evan','Chloe','Cole','Abby','Grant','Emma','Reid','Olivia','Drew','Ava','Parker','Lily','Cooper','Grace','Carter','Hannah','Mason','Claire','Wyatt','Leah','Ethan','Sydney','Noah','Savannah','Liam','Peyton','Owen','Bailey','Luke','Maddie','Jack','Hailey','Aiden','Zoe','Connor','Mackenzie','Ian','Kendall','Dylan','Kylie','Nolan','Lacey','Brady','Molly','Trent','Jillian','Brent','Stacy','Greg','Carrie','Jeff','Wendy','Todd','Tammy','Steve','Donna','Phil','Renee','Keith','Gina','Gary','Pam','Craig','Trish','Dale','Cindy','Wayne','Brenda','Doug','Cheryl','Randy','Debbie','Terry','Sandy','Larry','Sheryl','Barry','Denise','Jerry','Diane','Dennis','Bonnie','Roger','Becky','Jimmy','Marcia','Bobby','Rhonda','Danny','Wanda','Ronnie','Glenda','Donnie','Vicki','Ricky','Terri','Timmy','Sherry','Billy','Kathy','Tony','Donna','Frank','Carol','Ray','Judy','Joe','Ruth','Bob','Sharon','Tom','Linda','Jim','Barbara','John','Patricia','Charles','Sandra','George','Betty','Ken','Dorothy','Ed','Nancy','Paul','Karen','Dan','Helen','Rick','Lisa','Dave','Anna','Tim','Maria','Sam','Susan','Ben','Margaret','Alex','Jessica','Chris','Ashley','Nick','Emily','Will','Mia','Jake','Sophia','Luke','Isabella','Zach','Charlotte','Ryan','Amelia','Tyler','Ella','Josh','Scarlett','Ethan','Victoria','Noah','Aria','Liam','Grace','Owen','Lily','Jack','Chloe','Henry','Zoey','Carter','Nora','Mason','Penelope','Logan','Layla','Lucas','Riley','Jayden','Hannah','Grayson','Ellie','Jackson','Aubrey','Aiden','Addison','Oliver','Avery','Elijah','Evelyn','James','Sofia','Benjamin','Camila','Sebastian','Abigail','Mateo','Natalie','Samuel','Stella','Joseph','Zoe','David','Leah','Carter','Audrey','Wyatt','Bella','Jayden','Claire','John','Skylar','Dylan','Lucy','Luke','Paisley','Gabriel','Everly','Anthony','Anna','Isaac','Caroline','Lincoln','Genesis','Hunter','Aaliyah','Eli','Kennedy','Jaxon','Kinsley','Julian','Savannah','Levi','Hailey','Isaiah','Serenity','Landon','Nevaeh','Jordan','Ariana','Jose','Autumn','Aaron','Quinn','Charles','Madelyn','Thomas','Ruby','Connor','Eva','Jeremiah','Piper','Cameron','Sophie','Adrian','Alice','Evan','Sadie','Robert','Violet','Colton','Maya','Kevin','Willow','Zachary','Eliana','Angel','Rylee','Robert','Brielle','Nolan','Hadley','Josiah','Emery','Austin','Lydia','Cooper','Jade','Easton','Kaylee','Jace','Peyton','Declan','Brynn','Bentley','Teagan','Axel','Mackenzie','Everett','Reese','Parker','Sloane','Roman','Phoebe','Miles','Naomi','Jaxson','Sienna','Leonardo','Elise','Dominic','Molly','Greyson','Daisy','Kayden','Josephine','Bryson','Ivy','Ryder','Adeline','Knox','Emilia','Milo','Cora','Sawyer','Reagan','Silas','Eliza','Micah','Cecelia','Rowan','Iris','Ezra','Anastasia','Asher','Tessa','Tristan','Genevieve','Damian','Arabella','Emmett','Scarlet','Weston','Adalyn','Maverick','Margot','Jasper','Isla','Rhett','Fiona','Beckett','Rosalie','Beau','Daphne','Caden','Ingrid','Eli','Miriam','Arlo','Juliet','Finn','Celeste','Archer','Lyric','Zane','Freya','Atticus','Thea','Bowen','Winona','Colt','Vera','Crew','Vivienne','Jett','Serena','Kade','Nadia','Gage','Tatum','Remi','Lena','Ryker','Camille','Kyler','Elspeth','Soren','Lorelei','Thatcher','Maren','Briggs','Juniper','Crue','Wren','Dax','Rosalyn','Zion','Corinne','Ledger','Paloma','Wilder','Harlow','Caspian','Saoirse','Stellan','Maeve','Rafferty','Calliope'];
    const _c = [
      // Cobb County (core market)
      'Kennesaw','Marietta','Acworth','Smyrna','Powder Springs','Mableton','Austell','Vinings','Fair Oaks','Clarkdale','Lost Mountain','West Cobb','East Cobb','Shallowford','Chesterfield','Milford',
      // Cherokee County
      'Canton','Ball Ground','Holly Springs','Waleska','Nelson','Toonigh','Buffington','Sixes','Hickory Flat',
      // Forsyth County
      'Cumming','Sharon Springs','Vickery','Coal Mountain','Midway','Shiloh',
      // Dawson County
      'Dawsonville','Dawson Forest',
      // Pickens County
      'Jasper','Talking Rock','Tate','Marble Hill','Hinton','Fairmount',
      // Gilmer County
      'Ellijay','East Ellijay','Cherry Log','Cartecay',
      // Lumpkin County
      'Dahlonega','Auraria','Wimpy','Nimblewill',
      // Hall County
      'Gainesville','Flowery Branch','Oakwood','Chestnut Mountain','Gillsville','Clermont','Murrayville','Lula','Braselton',
      // White County
      'Cleveland','Helen','Sautee Nacoochee','Robertstown','Nora',
      // Habersham County
      'Clarkesville','Cornelia','Demorest','Baldwin','Mount Airy',
      // Murray & Gordon Counties
      'Chatsworth','Eton','Calhoun','Adairsville','Resaca','Sugar Valley',
      // Bartow County
      'Cartersville','Kingston','White','Euharlee','Emerson','Taylorsville','Adairsville',
      // Paulding County
      'Dallas','Hiram','Braswell','Yorkville','New Georgia','Nebo',
      // Douglas County
      'Douglasville','Lithia Springs','Winston','Prestley Mill','Beulah',
      // North Fulton
      'Alpharetta','Milton','Roswell','Sandy Springs','Johns Creek','Dunwoody','Buckhead','Brookhaven','Crabapple','Birmingham','Deerfield','Windward','Avalon','Halcyon',
      // Gwinnett County
      'Duluth','Suwanee','Sugar Hill','Buford','Lawrenceville','Snellville','Grayson','Loganville','Dacula','Hoschton','Auburn','Hamilton Mill','Braselton','Pendergrass',
      // Barrow & Jackson Counties
      'Winder','Jefferson','Commerce','Arcade','Statham','Auburn','Nicholson',
      // DeKalb (North)
      'Chamblee','Doraville','Tucker','Decatur','Clarkston','Stone Mountain','Dunwoody'
    ];
    const _t = ['Pet-Friendly Turf','Full Backyard Setup','Putting Green','General Lawn','Side Yard Turf','Front Yard Makeover','Dog Run Turf','Backyard Putting Green','Low-Maintenance Lawn','Kid-Safe Turf','Artificial Grass Install','Turf Replacement','Drainage & Turf System','Custom Putting Green','Pet Turf & Drainage','Luxury Turf Install','Turf & Landscape Design','Commercial Turf','Rooftop Turf','Pool Surround Turf'];
    const _tm = ['just now','1 min ago','2 min ago','3 min ago','4 min ago','5 min ago','6 min ago','7 min ago','8 min ago','9 min ago','10 min ago','11 min ago','12 min ago','14 min ago','16 min ago','18 min ago','20 min ago','22 min ago','25 min ago','28 min ago','32 min ago','36 min ago','40 min ago','45 min ago','50 min ago','55 min ago','1 hr ago','1 hr 10 min ago','1 hr 20 min ago','1.5 hrs ago','2 hrs ago','2.5 hrs ago','3 hrs ago'];
    function _sh(a) { return a.slice().sort(() => Math.random() - 0.5); }
    const _sn = _sh(_n), _sc = _sh(_c), _st = _sh(_t), _stm = _sh(_tm);
    const _pool = [];
    for (let i = 0; i < 300; i++) {
        _pool.push({ name: _sn[i % _sn.length], city: _sc[i % _sc.length], type: _st[i % _st.length], time: _stm[i % _stm.length] });
    }
    const notifications = _sh(_pool);

    // Create notification element
    const notif = document.createElement('div');
    notif.id = 'll-social-pulse';
    notif.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 16px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        padding: 12px 16px;
        max-width: 260px;
        z-index: 9990;
        display: none;
        align-items: center;
        gap: 10px;
        font-family: 'Inter', sans-serif;
        border-left: 4px solid #2d6a2d;
        animation: slideInLeft 0.4s ease-out;
        cursor: pointer;
    `;
    notif.innerHTML = `
        <div style="font-size:1.6rem;line-height:1;">🏡</div>
        <div>
            <div id="ll-pulse-text" style="font-size:0.82rem;font-weight:600;color:#1a1a1a;line-height:1.3;"></div>
            <div id="ll-pulse-time" style="font-size:0.72rem;color:#888;margin-top:2px;"></div>
        </div>
        <button onclick="document.getElementById('ll-social-pulse').style.display='none'" 
                style="position:absolute;top:6px;right:8px;background:none;border:none;color:#ccc;font-size:0.9rem;cursor:pointer;padding:0;line-height:1;">✕</button>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInLeft {
            from { transform: translateX(-120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-120%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notif);

    notif.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        trackEvent('social_proof_pulse_click');
        document.querySelector('#quote-form, #multi-step-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    let notifIndex = 0;

    function showNotification() {
        const n = notifications[notifIndex % notifications.length];
        notifIndex++;

        const textEl = document.getElementById('ll-pulse-text');
        const timeEl = document.getElementById('ll-pulse-time');
        if (textEl) textEl.textContent = `${n.name} from ${n.city} requested a ${n.type} quote`;
        if (timeEl) timeEl.textContent = n.time;

        notif.style.animation = 'none';
        notif.style.display = 'flex';
        void notif.offsetWidth; // reflow
        notif.style.animation = 'slideInLeft 0.4s ease-out';

        trackEvent('social_proof_pulse_shown', { city: n.city, type: n.type });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            notif.style.animation = 'slideOutLeft 0.3s ease-in forwards';
            setTimeout(() => { notif.style.display = 'none'; }, 300);
        }, 5000);
    }

    // First notification after 8 seconds, then every 35 seconds
    setTimeout(() => {
        showNotification();
        setInterval(showNotification, 35000);
    }, 8000);
}

/* ============================================
   URGENCY BADGE
   ============================================ */

function initUrgencyBadge() {
    // Add urgency near the main CTA
    const heroCtas = document.querySelector('.hero-ctas');
    if (!heroCtas) return;

    const badge = document.createElement('div');
    badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,200,0,0.12);
        border: 1px solid rgba(255,200,0,0.35);
        border-radius: 20px;
        padding: 5px 14px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #f5c518;
        margin-top: 12px;
        font-family: 'Inter', sans-serif;
    `;
    badge.innerHTML = `<span style="font-size:0.9rem;">⚡</span> Spring schedule filling fast — limited install slots remaining`;
    heroCtas.insertAdjacentElement('afterend', badge);
}

/* ============================================
   SMOOTH SCROLL ANCHORS
   ============================================ */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => { target.focus({ preventScroll: true }); }, 500);
            }
        });
    });
}

/* ============================================
   MOBILE STICKY CTA VISIBILITY
   ============================================ */

function initMobileStickyVisibility() {
    const mobileStickyArea = document.getElementById('mobileStickyArea');
    const quoteForm = document.getElementById('quote-form') || document.getElementById('multi-step-form');

    if (!mobileStickyArea || !quoteForm) return;

    function checkFormVisibility() {
        if (window.innerWidth > 768) {
            mobileStickyArea.style.display = 'none';
            return;
        }
        const formRect = quoteForm.getBoundingClientRect();
        const isFormInView = formRect.top < window.innerHeight && formRect.bottom > 0;
        mobileStickyArea.style.display = isFormInView ? 'none' : 'grid';
    }

    window.addEventListener('scroll', checkFormVisibility, { passive: true });
    window.addEventListener('resize', checkFormVisibility);
    checkFormVisibility();
}

/* ============================================
   FORM INPUT VALIDATION & FORMATTING
   ============================================ */

function initFormValidation() {
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');

    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            if (value.length > 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
            } else if (value.length > 3) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
            e.target.value = value;
        });
    }

    if (emailInput) {
        emailInput.addEventListener('blur', function(e) {
            const email = e.target.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            e.target.style.borderColor = (email && !emailRegex.test(email)) ? '#EF4444' : 'var(--border-color)';
        });
    }
}

/* ============================================
   PAGE PERFORMANCE & LAZY LOADING
   ============================================ */

function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        images.forEach((img) => imageObserver.observe(img));
    } else {
        images.forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    }
}

/* ============================================
   TRACK PAGE VIEW
   ============================================ */

function trackPageView() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_path: window.location.pathname,
            utm_source: getUTMParam('utm_source'),
            utm_medium: getUTMParam('utm_medium'),
            utm_campaign: getUTMParam('utm_campaign'),
            gclid: getUTMParam('gclid'),
        });
    }
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */

function initScrollAnimations() {
    const elements = document.querySelectorAll('section, .pain-card, .feature-card, .testimonial-card, .project-type-card');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        elements.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });
    }
}

/* ============================================
   STICKY HEADER SHADOW
   ============================================ */

function initStickyHeader() {
    const header = document.querySelector('.sticky-header');
    if (!header) return;
    window.addEventListener('scroll', function() {
        header.style.boxShadow = window.scrollY > 10
            ? '0 2px 20px rgba(0,0,0,0.15)'
            : 'none';
    }, { passive: true });
}

/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initBeforeAfterSlider();
    initFAQAccordion();
    initMultiStepForm();
    initFormHandler();
    initEventTracking();
    initSmoothScroll();
    initMobileStickyVisibility();
    initFormValidation();
    initLazyLoading();
    initScrollAnimations();
    initStickyHeader();
    initSocialProofPulse();
    initUrgencyBadge();
    trackPageView();

    console.log('[LawnLogic] Landing page v2.0 initialized');
});

window.addEventListener('resize', function() {
    initMobileStickyVisibility();
});

/* ============================================
   UTILITY: PHONE NUMBER FORMATTING
   ============================================ */

function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    if (value.length > 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length > 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 0) {
        value = `(${value}`;
    }
    input.value = value;
}
