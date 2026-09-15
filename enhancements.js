(() => {
    'use strict';

    const lab = document.getElementById('inside-builds');
    const tabs = [...lab.querySelectorAll('[data-study-tab]')];
    const panels = [...lab.querySelectorAll('[data-study-panel]')];
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationsEnabled = () => document.body.dataset.motionPaused !== 'true';

    function selectStudy(name) {
        if (!panels.some(panel => panel.dataset.studyPanel === name)) return;
        tabs.forEach(tab => {
            const active = tab.dataset.studyTab === name;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        panels.forEach(panel => { panel.hidden = panel.dataset.studyPanel !== name; });
    }

    window.openBuildStudy = name => {
        if (document.getElementById('projects').classList.contains('hidden')) showSection('projects');
        selectStudy(name);
        tabs.find(tab => tab.dataset.studyTab === name)?.focus({ preventScroll: true });
        lab.scrollIntoView({ behavior: motionQuery.matches || !animationsEnabled() ? 'instant' : 'smooth', block: 'start' });
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectStudy(tab.dataset.studyTab));
        tab.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            selectStudy(tabs[next].dataset.studyTab);
            tabs[next].focus();
        });
    });

    const parts = {
        emg: { index: '01 / MUSCLE SENSING', title: 'MyoWare surface EMG', description: 'The MyoWare sensor provides the muscle-activity signal used by the wearable during biceps-curl testing.' },
        imu: { index: '02 / MOTION SENSING', title: 'BNO08X motion sensor', description: 'The motion sensor adds movement information alongside the muscle-activity signal.' },
        esp32: { index: '03 / PROCESSING', title: 'ESP32 electronics', description: 'The ESP32 electronics bring the sensor inputs together for calibration, rep detection, and feedback.' },
        rgb: { index: '04 / FEEDBACK', title: 'RGB LED feedback', description: 'The LED strip gives real-time visual feedback. The test gallery shows the green LEDs illuminated during a biceps curl.' }
    };
    function activatePart(name) {
        const part = parts[name];
        if (!part) return;
        lab.querySelectorAll('[data-system-part]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.systemPart === name));
        });
        lab.querySelectorAll('[data-component-region]').forEach(region => {
            region.classList.toggle('is-active', region.dataset.componentRegion === name);
        });
        document.getElementById('part-index').textContent = part.index;
        document.getElementById('part-title').textContent = part.title;
        document.getElementById('part-description').textContent = part.description;
    }
    lab.querySelectorAll('[data-system-part]').forEach(button => {
        const activate = () => activatePart(button.dataset.systemPart);
        button.addEventListener('click', activate);
        button.addEventListener('focus', activate);
        button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') activate(); });
    });

    const stageButtons = [...lab.querySelectorAll('[data-build-stage]')];
    const stageImage = document.getElementById('build-stage-image');
    function selectStage(button) {
        stageButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
        stageImage.src = button.dataset.image;
        stageImage.alt = button.dataset.alt;
        document.getElementById('stage-index').textContent = button.dataset.index;
        document.getElementById('stage-title').textContent = button.dataset.title;
        document.getElementById('stage-description').textContent = button.dataset.description;
    }
    stageButtons.forEach(button => button.addEventListener('click', () => selectStage(button)));
    document.getElementById('build-stage-open').addEventListener('click', () => openGallery([stageImage.getAttribute('src')]));

    // A small pool of current pointer coordinates drives the frame glow.
    let litCard = null;
    let glowFrame = null;
    let spotX = 0;
    let spotY = 0;
    const cards = [...document.querySelectorAll('.card')];
    cards.forEach(card => {
        card.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const rect = card.getBoundingClientRect();
            spotX = event.clientX - rect.left;
            spotY = event.clientY - rect.top;
            if (litCard !== card) {
                litCard?.classList.remove('is-lit');
                litCard = card;
                card.classList.add('is-lit');
            }
            if (glowFrame !== null) return;
            glowFrame = requestAnimationFrame(() => {
                glowFrame = null;
                if (!litCard) return;
                litCard.style.setProperty('--spot-x', `${spotX}px`);
                litCard.style.setProperty('--spot-y', `${spotY}px`);
            });
        }, { passive: true });
        card.addEventListener('pointerleave', () => {
            card.classList.remove('is-lit');
            if (litCard === card) litCard = null;
        });
    });

    // Content stays visible even if JavaScript or IntersectionObserver is unavailable.
    if ('IntersectionObserver' in window) {
        const arrivalObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                arrivalObserver.unobserve(entry.target);
                if (motionQuery.matches || !animationsEnabled()) return;
                entry.target.classList.add('reveal-arrival');
                entry.target.addEventListener('animationend', () => entry.target.classList.remove('reveal-arrival'), { once: true });
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('.card, .build-lab, .content-section > .mb-12').forEach(element => arrivalObserver.observe(element));
    }

    function markCurrentSection(name) {
        document.querySelectorAll('nav .nav-link').forEach(link => {
            if (link.textContent.trim().toLowerCase() === name) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }
    document.addEventListener('portfolio:section', event => markCurrentSection(event.detail.id));
    markCurrentSection('home');
})();
