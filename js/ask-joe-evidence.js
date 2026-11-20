// ============================================================
// ASK JOE: answers that show their proof (prototype, 2026-11-19)
//
// After each Ask Joe answer, this matches the answer to the sections of this
// page it draws on and offers "Show me" links. A tap closes the chat, scrolls
// to that section and marks it, so a reader can check the answer against the
// page. An answer that matches nothing is labelled as coming from Joe's record
// and not shown on this page (Marcus: no citation, no claim).
//
// Client only. The worker is untouched while Mike's voice work is in flight;
// a later version can have the worker return the section ids itself.
// ============================================================
(function () {
    'use strict';

    // Each source: the page section, how the link reads, and the words that
    // tie an answer to it. Names that only one section uses count double.
    const SOURCES = [
        { id: 'project-careerspark', label: 'CareerSpark case study', strong: ['careerspark', '4 pillars', 'four pillars'], terms: ['1,500', '16,000', 'career development', 'tiaa university', 'nine modules', '9 modules', '27 years', 'distributions'] },
        { id: 'project-workplace', label: 'Workplace Modernization', strong: ['workplace modernization', 'frisco', 'lewisville'], terms: ['denver', 'charlotte', 'real estate', 'back to office', 'return to office', 'retention crisis', 'six locations', '44%'] },
        { id: 'project-futureme', label: 'Future Me, Answered', strong: ['future me'], terms: ['high school', 'students', 'college', 'career discovery', 'trades'] },
        { id: 'project-careerpointers', label: 'CareerPointers', strong: ['careerpointers', 'career pointers'], terms: ['job seekers', 'resume builder'] },
        { id: 'project-revolver', label: 'Revolver LCMS', strong: ['revolver', 'lcms'], terms: ['fortune 500', 'content management', 'knowledge architect'] },
        { id: 'project-rr', label: 'Recognition program', strong: ['values champion', 'r&r', 'recognition program'], terms: ['recognition', '306%', 'rewards', 'platform selection'] },
        { id: 'project-buildingblocks', label: 'Building Blocks, career eras', strong: ['lucent', 'budget.com', 'ecollege', 'vangent'], terms: ['horizon interactive', 'ixl', 'pearson', 'census', 'department of commerce', 'virtual career fair', 'sharepoint'] },
        { id: 'climb', label: 'How I measure adoption', strong: ['kirkpatrick', 'usage is the floor', 'access is a count'], terms: ['access', 'usage', 'active use', 'ninety days', '90 days after', 'go-live', 'measure', 'measured', 'transforming the way'] },
        { id: 'executive-summary', label: 'Executive Summary', strong: ['leadership scope', 'manager guide', 'amazon q developer'], terms: ['seven business areas', '3,000', 'client services', 'compliance', 'acceptable-use', 'direct team', 'operating model'] },
        { id: 'how-i-think', label: 'How I think about work', strong: ['start with the problem', 'human in the lead'], terms: ['principle', 'amplifier', 'identity', 'resistance', 'systems first', 'range'] },
        { id: 'team', label: 'My expert team', strong: ['expert team', 'devil\'s advocate'], terms: ['ai agents', 'agents', 'multi-agent', 'bench', 'argue', 'converge'] },
        { id: 'day-90-plan', label: 'My first 90 days', strong: ['first 90 days', '90-day', 'adoption audit'], terms: ['first 30 days', 'pilot', 'scale strategy', 'champions', 'playbook'] },
        { id: 'testimonials', label: 'What others say', strong: ['keeley', 'seth johnson', 'timothy montgomery', 'lee grimm', 'eric rohrer', 'jonathan jones'], terms: ['references', 'testimonial'] },
        { id: 'writing', label: 'What I write', strong: ['linkedin article', 'i wrote about'], terms: ['article', 'wrote'] }
    ];
    const MIN_SCORE = 2;     // one strong name, or two ordinary terms
    const MAX_LINKS = 2;

    function score(text, src) {
        const t = text.toLowerCase();
        let s = 0;
        src.strong.forEach(w => { if (t.includes(w)) s += 2; });
        src.terms.forEach(w => { if (t.includes(w)) s += 1; });
        return s;
    }

    function match(answer) {
        return SOURCES
            .map(src => ({ src, s: score(answer, src) }))
            .filter(x => x.s >= MIN_SCORE)
            .sort((a, b) => b.s - a.s)
            .slice(0, MAX_LINKS)
            .map(x => x.src);
    }

    function track(name, params) {
        if (typeof gtag === 'function') gtag('event', name, Object.assign({ event_category: 'chatbot' }, params));
    }

    function show(src) {
        const target = document.getElementById(src.id);
        if (!target) return;
        if (typeof closeChat === 'function') closeChat();

        // On a phone a case study's story sits behind "View case study"; open it.
        if (target.classList.contains('project-card') && !target.classList.contains('story-open')) {
            const toggle = target.querySelector('.story-toggle');
            if (toggle && getComputedStyle(toggle).display !== 'none') toggle.click();
        }

        // The ladder is a pinned scene; mark its stage, not the whole tall section.
        const mark = target.querySelector('.stick') || target;
        // Mark the section when the scroll lands, not when it starts: a long
        // smooth scroll can outlast the highlight.
        function flash() {
            mark.classList.remove('evidence-flash');
            void mark.offsetWidth;
            mark.classList.add('evidence-flash');
            setTimeout(() => mark.classList.remove('evidence-flash'), 2600);
        }
        setTimeout(() => {
            // "Landed" = no scroll movement for 160 ms (works in every browser,
            // including Safari, which has no scrollend event).
            let done = false, idle = null;
            const land = () => { if (done) return; done = true; window.removeEventListener('scroll', moving); flash(); };
            const moving = () => { clearTimeout(idle); idle = setTimeout(land, 160); };
            window.addEventListener('scroll', moving, { passive: true });
            idle = setTimeout(land, 900);   // already in place: no scroll happens
            if (typeof navScrollTo === 'function') navScrollTo(target);
            else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 320);
        track('ask_joe_evidence_click', { section: src.id });
    }

    // Called by the chat after a successful answer (see sendMessage in index.html).
    window.askJoeEvidence = function (wrap, answer) {
        if (!wrap || !answer) return;
        const found = match(answer);
        const box = document.createElement('div');
        box.className = 'chat-evidence';
        if (found.length) {
            const lead = document.createElement('span');
            lead.className = 'chat-evidence-lead';
            lead.textContent = 'Show me on the page:';
            box.appendChild(lead);
            found.forEach(src => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chat-evidence-link';
                b.textContent = src.label + ' →';
                b.addEventListener('click', () => show(src));
                box.appendChild(b);
            });
        } else {
            box.classList.add('chat-evidence--none');
            box.textContent = 'From Joe’s record. Not shown on this page.';
        }
        wrap.appendChild(box);
        track('ask_joe_evidence_shown', { sections: found.map(s => s.id).join(',') || 'none' });
    };

    // Exposed for testing only.
    window.askJoeEvidence._match = match;
})();
