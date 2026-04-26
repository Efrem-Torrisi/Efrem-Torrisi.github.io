/**
 * Portfolio — Modal System + Three.js Particle Field
 * Efrem Torrisi | Technical Artist
 */
// ── Theme Toggle ─────────────────────────────────────────────
(function initTheme() {
    window.swapIcons = function swapIcons(isLight) {
        var attr = isLight ? 'data-light-src' : 'data-dark-src';
        document.querySelectorAll('[data-light-src][data-dark-src]').forEach(function (img) {
            var newSrc = img.getAttribute(attr);
            if (newSrc) img.setAttribute('src', newSrc);
        });
    };

    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        window.swapIcons(true);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.theme-toggle');
        if (!btn) return;
        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            window.swapIcons(false);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            window.swapIcons(true);
        }
    });
})();

// ── Work In Progress Gate ─────────────────────────────────────
const WIP_MODE = false; // set to false to disable

if (WIP_MODE && !sessionStorage.getItem('wip_unlocked')) {
  const style = document.createElement('style');
  style.textContent = `
    nav, main, footer {
      display: none;
    }
    #wip-gate {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      color: #fff;
      background: rgba(10, 10, 10, 0.75);
      backdrop-filter: blur(2px);
    }
    #wip-gate h1 {
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 700;
      letter-spacing: 0.05em;
      margin: 0 0 0.5rem;
    }
    #wip-gate p {
      font-size: 1.1rem;
      color: #888;
      margin: 0;
      letter-spacing: 0.02em;
    }
    #wip-gate .dot {
      display: inline-block;
      animation: blink 1.4s infinite both;
    }
    #wip-gate .dot:nth-child(2) { animation-delay: 0.2s; }
    #wip-gate .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40%            { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.id = 'wip-gate';
  gate.innerHTML = `
    <h1>Work in Progress</h1>
    <p>Stay Tuned<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>
  `;
  document.body.appendChild(gate);

  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  let progress = 0;

  document.addEventListener('keydown', function(e) {
    if (e.key === code[progress]) {
      progress++;
      if (progress === code.length) {
        sessionStorage.setItem('wip_unlocked', 'true');
        location.reload();
      }
    } else {
      progress = 0;
    }
  });

  // Mobile unlock: tap the gate 5 times within 3 seconds
  let tapCount = 0;
  let tapTimer = null;
  gate.addEventListener('click', function() {
    tapCount++;
    if (tapCount === 1) {
      tapTimer = setTimeout(function() { tapCount = 0; }, 3000);
    }
    if (tapCount >= 5) {
      clearTimeout(tapTimer);
      sessionStorage.setItem('wip_unlocked', 'true');
      location.reload();
    }
  });
}
// ─────────────────────────────────────────────────────────────
(function () {
    'use strict';

    /* ========================================
       MEDIA PREVIEW — auto-swap img→video by extension,
       show/hide default vs hover content
       ======================================== */

    var videoExts = /\.(mp4|webm|ogg|mov|avi)$/i;

    function imgToVideo(img, preload) {
        var video = document.createElement('video');
        video.src = img.src;
        video.className = img.className;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = preload || 'metadata';
        video.disablePictureInPicture = true;
        video.disableRemotePlayback = true;
        video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
        img.parentNode.replaceChild(video, img);
        return video;
    }

    // Solo projects (.piece) — load metadata only (first frame + dimensions)
    document.querySelectorAll('.piece img').forEach(function (img) {
        if (!videoExts.test(img.getAttribute('src'))) return;
        var isHover = img.classList.contains('preview-hover');
        var video = imgToVideo(img, 'metadata');
        if (!isHover) {
            video.autoplay = true;
        }
    });

    // Game projects (.project) — lazy load videos sequentially, but prioritize hovered card
    var projectVideoMap = new Map(); // card element -> array of video elements
    document.querySelectorAll('.project').forEach(function (card) {
        var videos = [];
        card.querySelectorAll('img').forEach(function (img) {
            if (!videoExts.test(img.getAttribute('src'))) return;
            var isHover = img.classList.contains('preview-hover');
            var video = imgToVideo(img, 'none');
            if (!isHover) {
                video.autoplay = true;
            }
            videos.push(video);
        });
        if (videos.length) projectVideoMap.set(card, videos);
    });

    var seqIndex = 0;
    var seqCards = Array.from(projectVideoMap.keys());
    var loadedCards = new Set();
    var seqPaused = false;

    function loadCardVideos(card, callback) {
        if (loadedCards.has(card)) { if (callback) callback(); return; }
        loadedCards.add(card);
        var videos = projectVideoMap.get(card);
        if (!videos || !videos.length) { if (callback) callback(); return; }
        var remaining = videos.length;
        videos.forEach(function (video) {
            video.preload = 'auto';
            video.load();
            var done = false;
            function onDone() {
                if (done) return;
                done = true;
                remaining--;
                if (remaining <= 0 && callback) callback();
            }
            video.addEventListener('canplaythrough', onDone, { once: true });
            setTimeout(onDone, 5000);
        });
    }

    function runSequentialLoad() {
        if (seqPaused) return;
        // Skip already-loaded cards
        while (seqIndex < seqCards.length && loadedCards.has(seqCards[seqIndex])) {
            seqIndex++;
        }
        if (seqIndex >= seqCards.length) return;
        loadCardVideos(seqCards[seqIndex], function () {
            seqIndex++;
            runSequentialLoad();
        });
    }

    // Priority load: called when a game project card is hovered
    function priorityLoadCard(card) {
        if (loadedCards.has(card)) return;
        seqPaused = true;
        loadCardVideos(card, function () {
            seqPaused = false;
            runSequentialLoad();
        });
    }

    // Start sequential loading after a short delay to prioritize solo projects
    setTimeout(function () {
        runSequentialLoad();
    }, 1000);

    // Hover preview: play hover media on enter, pause on leave (pieces)
    var activePiece = null;
    var pieceVideoTimer = null;

    function focusPiece(card) {
        if (card === activePiece) return;
        // Clear pending timer
        if (pieceVideoTimer) {
            clearTimeout(pieceVideoTimer);
            pieceVideoTimer = null;
        }
        // Deactivate previous
        if (activePiece) {
            var prevHover = activePiece.querySelector('.preview-hover');
            if (prevHover) {
                prevHover.classList.remove('is-hover-active');
                if (prevHover.tagName === 'VIDEO') prevHover.pause();
            }
        }
        activePiece = card;
        if (!card) return;
        var hoverEl = card.querySelector('.preview-hover');
        if (!hoverEl) return;
        // Delay video playback by 600ms
        pieceVideoTimer = setTimeout(function () {
            if (activePiece !== card) return;
            hoverEl.classList.add('is-hover-active');
            if (hoverEl.tagName === 'VIDEO') {
                hoverEl.currentTime = 0;
                hoverEl.play();
            }
        }, 600);
    }

    function unfocusPiece(card) {
        if (activePiece !== card) return;
        if (pieceVideoTimer) {
            clearTimeout(pieceVideoTimer);
            pieceVideoTimer = null;
        }
        activePiece = null;
        var hoverEl = card.querySelector('.preview-hover');
        if (hoverEl) {
            hoverEl.classList.remove('is-hover-active');
            if (hoverEl.tagName === 'VIDEO') hoverEl.pause();
        }
    }

    document.querySelectorAll('.piece').forEach(function (card) {
        // Desktop: mouse events
        card.addEventListener('mouseenter', function () { focusPiece(card); });
        card.addEventListener('mouseleave', function () { unfocusPiece(card); });

        // Mobile: touch events
        card.addEventListener('touchstart', function () { focusPiece(card); }, { passive: true });
    });

    // When touching outside any piece, deactivate the current one
    document.addEventListener('touchstart', function (e) {
        if (!activePiece) return;
        if (!e.target.closest('.piece')) {
            focusPiece(null);
        }
    }, { passive: true });

    /* ========================================
       PAGE INTRO ANIMATION
       ======================================== */

    // Activate entrance animation immediately
    document.body.classList.add('is-intro');

    // Remove intro class after all entrance animations complete (~2.6s),
    // letting the scroll-reveal system take over.
    setTimeout(function () {
        document.body.classList.remove('is-intro');
    }, 1600);

    /* ========================================
       MODAL SYSTEM
       ======================================== */

    var modalOverlay = document.getElementById('project-modal');
    var modalContent = document.getElementById('modal-content');
    var modalClose   = modalOverlay.querySelector('.modal-close');
    var modalBackdrop = modalOverlay.querySelector('.modal-backdrop');
    var contentCache  = {};
    var pendingFetches = {}; // slug -> Promise<html> — deduplicates in-flight requests
    var originalTitle = document.title;
    var modalStack    = []; // stack of { html, scrollTop, slug, title }

    /* ── Lazy Prism loader (shared across all modal opens) ── */
    var _prismState = 'idle'; // idle | loading | ready
    var _prismQueue = [];     // callbacks waiting for Prism
    var _prismExtended = false;

    function extendPrismLanguages() {
        if (_prismExtended) return;
        _prismExtended = true;

        if (Prism.languages.hlsl) {
            Prism.languages.insertBefore('hlsl', 'keyword', {
                'hlsl-semantic': {
                    pattern: /\b(?:SV_\w+|TEXCOORD\d*|COLOR\d*|POSITION\d*|NORMAL\d*|TANGENT\d*|BINORMAL\d*|BLENDWEIGHT\d*|BLENDINDICES\d*|PSIZE\d*|VFACE|VPOS|SV_DispatchThreadID|SV_GroupID|SV_GroupThreadID|SV_GroupIndex|SV_VertexID|SV_InstanceID|SV_PrimitiveID|SV_Target\d*|SV_Depth|SV_Position)\b/,
                    alias: 'builtin'
                },
                'hlsl-attribute': {
                    pattern: /\[(?:numthreads|maxvertexcount|domain|partitioning|outputtopology|outputcontrolpoints|patchconstantfunc|earlydepthstencil)\b[^\]]*\]/,
                    alias: 'attr-name',
                    inside: {
                        'number': /\b\d+\b/,
                        'punctuation': /[[\],()]/
                    }
                },
                'hlsl-builtin': {
                    pattern: /\b(?:saturate|lerp|step|smoothstep|clamp|abs|sign|floor|ceil|round|frac|fmod|pow|exp|exp2|log|log2|log10|sqrt|rsqrt|normalize|length|distance|dot|cross|reflect|refract|min|max|mul|transpose|determinant|sin|cos|tan|asin|acos|atan|atan2|sincos|radians|degrees|ddx|ddy|fwidth|clip|tex2D|tex2Dlod|Sample|SampleLevel|SampleGrad|SampleCmp|Load|GetDimensions|InterlockedAdd|InterlockedMin|InterlockedMax|InterlockedOr|InterlockedAnd|InterlockedXor|InterlockedCompareStore|InterlockedCompareExchange|InterlockedExchange|AllMemoryBarrier|AllMemoryBarrierWithGroupSync|GroupMemoryBarrier|GroupMemoryBarrierWithGroupSync|DeviceMemoryBarrier|DeviceMemoryBarrierWithGroupSync|asfloat|asint|asuint|countbits|firstbithigh|firstbitlow|reversebits|any|all|isnan|isinf|isfinite|mad|rcp|frexp|ldexp|trunc|modf)\b/,
                    alias: 'function'
                },
                'hlsl-global': {
                    pattern: /\b(?:Out\w+|In\w+|Num\w+|Max\w+|Spawn\w+|Camera\w+|LOD\w+|VertexCount\w+|Start\w+|bCircularShape)\b/,
                    alias: 'variable'
                },
                'hlsl-member': {
                    pattern: /\.(?:x|y|z|w|xy|xyz|xyzw|r|g|b|a|rgb|rgba|Position|Scale|Normal|Rotation|VertexCountPerInstance|StartVertexLocation|StartInstanceLocation|InstanceCount)\b/,
                    alias: 'property'
                }
            });
        }

        if (Prism.languages.cpp) {
            Prism.languages.insertBefore('cpp', 'keyword', {
                'ue-type': {
                    pattern: /\b(?:F[A-Z]\w+|U[A-Z]\w+|A[A-Z]\w+|E[A-Z]\w+|T[A-Z]\w+)\b/,
                    alias: 'class-name'
                },
                'ue-function': {
                    pattern: /\b(?:AddClearUAVPass|ExtractFrustumPlanes|RDG_EVENT_NAME|TEXT|DrawPrimitiveIndirect)\b/,
                    alias: 'function'
                },
                'cpp-member': {
                    pattern: /(?:->|\.)\s*([A-Z]\w+|[a-z]\w+)\s*(?=[=(])/,
                    lookbehind: false,
                    alias: 'function'
                },
                'cpp-scope': {
                    pattern: /\b\w+(?=::)/,
                    alias: 'class-name'
                }
            });
        }
    }

    function loadPrism(callback) {
        if (_prismState === 'ready') { callback(); return; }
        _prismQueue.push(callback);
        if (_prismState === 'loading') return;
        _prismState = 'loading';

        // CSS
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
        document.head.appendChild(link);

        // JS - load core, then language components in order
        var scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-hlsl.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js'
        ];
        var i = 0;
        function loadNext() {
            if (i >= scripts.length) {
                _prismState = 'ready';
                extendPrismLanguages();
                _prismQueue.forEach(function (cb) { cb(); });
                _prismQueue = [];
                return;
            }
            var s = document.createElement('script');
            s.src = scripts[i++];
            s.onload = loadNext;
            s.onerror = loadNext;
            document.head.appendChild(s);
        }
        loadNext();
    }

    // Shared fetch: returns cached HTML or reuses an in-flight request.
    // Includes a timeout so fetches never hang indefinitely.
    // priority: true = user-initiated (abort any in-flight prefetch and restart fresh)
    var pendingControllers = {}; // slug -> AbortController
    var pendingPriority = {};    // slug -> boolean (true = user click, false = prefetch)

    function fetchProject(slug, timeoutMs, priority) {
        if (contentCache[slug]) return Promise.resolve(contentCache[slug]);

        // If a low-priority (prefetch) request is in-flight and a high-priority
        // (user click) comes in, abort the prefetch and start fresh
        if (pendingFetches[slug] && priority && !pendingPriority[slug]) {
            if (pendingControllers[slug]) pendingControllers[slug].abort();
            delete pendingFetches[slug];
            delete pendingControllers[slug];
            delete pendingPriority[slug];
        }

        if (pendingFetches[slug]) return pendingFetches[slug];

        var ms = timeoutMs || 8000;
        var controller = window.AbortController ? new AbortController() : null;
        pendingControllers[slug] = controller;
        pendingPriority[slug] = !!priority;

        var timer = setTimeout(function () {
            if (controller) controller.abort();
        }, ms);

        var opts = controller ? { signal: controller.signal } : {};
        // Capture reference to this specific promise so cleanup only
        // removes its own entry (not a newer replacement after abort)
        var promise = fetch('projects/' + slug + '.html', opts)
            .then(function (res) {
                clearTimeout(timer);
                if (!res.ok) throw new Error('Not found');
                return res.text();
            })
            .then(function (html) {
                // If a full HTML page was returned, extract just the article fragment
                if (/^\s*<!DOCTYPE/i.test(html) || /^\s*<html/i.test(html)) {
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var article = doc.querySelector('article.project-detail');
                    if (article) html = article.outerHTML;
                }
                contentCache[slug] = html;
                if (pendingFetches[slug] === promise) {
                    delete pendingFetches[slug];
                    delete pendingControllers[slug];
                    delete pendingPriority[slug];
                }
                return html;
            })
            .catch(function (err) {
                clearTimeout(timer);
                // Only clean up if this is still the active fetch for this slug
                if (pendingFetches[slug] === promise) {
                    delete pendingFetches[slug];
                    delete pendingControllers[slug];
                    delete pendingPriority[slug];
                }
                throw err;
            });
        pendingFetches[slug] = promise;
        return promise;
    }

    var activeModalSlug = null; // tracks which project the modal is currently showing

    function openModal(projectSlug) {
        activeModalSlug = projectSlug;
        history.pushState({ project: projectSlug }, '', '#project/' + projectSlug);

        var card = document.querySelector('[data-project="' + projectSlug + '"]');
        var projectTitle = card ? card.dataset.title : projectSlug;
        document.title = projectTitle + ' | Efrem Torrisi';

        // Only show loading spinner if content isn't already cached
        if (!contentCache[projectSlug]) {
            modalContent.innerHTML = '<div class="modal-loading"><div class="modal-spinner"></div>Loading\u2026</div>';
        }
        document.body.classList.add('modal-open');
        modalOverlay.classList.add('is-active');
        modalOverlay.setAttribute('aria-hidden', 'false');

        modalOverlay._previousFocus = document.activeElement;
        modalClose.focus();

        function swapModalVideos() {
            modalContent.querySelectorAll('.project-gallery img, .contrib-media-item img, .tech-breakdown-figure img').forEach(function (img) {
                if (!videoExts.test(img.getAttribute('src'))) return;
                var video = imgToVideo(img);
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
            });
        }

        function lazyLoadModalVideos() {
            var videos = modalContent.querySelectorAll('.contrib-media-item video, .tech-breakdown-figure video, .project-detail-trailer--inline video');
            if (!videos.length) return;

            var container = modalContainer();
            var videoObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var video = entry.target;
                    if (entry.isIntersecting) {
                        if (video.preload === 'none') {
                            video.preload = 'auto';
                            video.muted = true;
                            video.loop = true;
                            video.load();
                        }
                        video.play().catch(function () {});
                    } else {
                        video.pause();
                    }
                });
            }, { root: container, rootMargin: '200px 0px' });

            videos.forEach(function (video) {
                video.preload = 'none';
                video.removeAttribute('autoplay');
                video.disablePictureInPicture = true;
                video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
                video.setAttribute('data-lazy-managed', '');
                videoObserver.observe(video);
            });

            // Store observer so we can disconnect on modal close
            modalOverlay._videoObserver = videoObserver;
        }

        function addVideoStallRecovery(video) {
            var retries = 0;
            var maxRetries = 3;
            function retryLoad() {
                if (retries >= maxRetries) return;
                retries++;
                var savedTime = video.currentTime;
                video.load();
                video.addEventListener('loadeddata', function () {
                    if (savedTime > 0) video.currentTime = savedTime;
                    video.play().catch(function () {});
                }, { once: true });
            }
            video.addEventListener('stalled', retryLoad);
            video.addEventListener('error', function () {
                setTimeout(retryLoad, 1000);
            });
        }

        function hideVideosUntilReady() {
            modalContent.querySelectorAll('video').forEach(function (video) {
                addVideoStallRecovery(video);

                function onReady() {
                    video.classList.add('is-ready');
                }

                if (video.hasAttribute('data-lazy-managed')) {
                    // Managed by IntersectionObserver — skip eager loading
                    onReady();
                } else if (video.hasAttribute('controls') && video.hasAttribute('poster')) {
                    // Results showcase videos: autoplay muted, hide until ready
                    video.muted = true;
                    video.loop = true;
                    video.autoplay = true;
                    video.preload = 'auto';
                    video.load();
                    if (video.readyState >= 3) {
                        onReady();
                    } else {
                        video.addEventListener('canplay', onReady, { once: true });
                    }
                } else if (video.readyState >= 3) {
                    onReady();
                } else {
                    video.addEventListener('canplay', onReady, { once: true });
                }
            });
        }

        function initModalContent() {
            modalContainer().scrollTop = 0;
            initMobileVideoControls();
            swapModalVideos();
            lazyLoadModalVideos();
            hideVideosUntilReady();
            initCodeTabs();
            initReadMore();
            var isLight = document.documentElement.getAttribute('data-theme') === 'light';
            window.swapIcons(isLight);

            // Highlight code blocks — load Prism on demand if needed
            if (modalContent.querySelector('pre code')) {
                loadPrism(function () {
                    Prism.highlightAllUnder(modalContent);
                });
            }
        }

        function initMobileVideoControls() {
            if (!window.matchMedia('(max-width: 768px)').matches) return;
            modalContent.querySelectorAll('video').forEach(function (video) {
                var hadControls = video.hasAttribute('controls');
                video.controls = false;
                video.removeAttribute('controls');
                if (!hadControls) return;
                var hideTimer;
                function showControls() {
                    video.controls = true;
                    video.setAttribute('controls', '');
                    clearTimeout(hideTimer);
                    hideTimer = setTimeout(function () {
                        video.controls = false;
                        video.removeAttribute('controls');
                    }, 3000);
                }
                video.addEventListener('pointerdown', showControls);
                video.addEventListener('click', showControls);
            });
        }

        function initReadMore() {
            function applyReadMore(text) {
                if (text.querySelector('.read-more-toggle')) return;
                var inner = document.createElement('div');
                inner.className = 'tech-breakdown-text-inner';
                while (text.firstChild) inner.appendChild(text.firstChild);
                text.appendChild(inner);

                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'read-more-toggle';
                btn.textContent = 'Read more';
                btn.setAttribute('aria-expanded', 'false');
                btn.addEventListener('click', function () {
                    var expanded = text.classList.toggle('is-expanded');
                    btn.textContent = expanded ? 'Read less' : 'Read more';
                    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                });
                text.appendChild(btn);
                text.classList.add('is-collapsible');
            }

            // Case 1: existing .tech-breakdown-text paired with a media sibling
            modalContent.querySelectorAll('.tech-breakdown-text').forEach(function (text) {
                var parent = text.parentElement;
                if (!parent) return;
                var hasMedia = parent.querySelector('.tech-breakdown-figure, .compute-diagram, .code-embed, .compute-media-row, .contrib-media, video');
                if (!hasMedia) return;
                applyReadMore(text);
            });

            // Case 2: .tech-breakdown-block with direct <p> children + any media
            modalContent.querySelectorAll('.tech-breakdown-block').forEach(function (block) {
                var hasMedia = block.querySelector('.tech-breakdown-figure, .project-detail-trailer, .contrib-media, video');
                if (!hasMedia) return;
                var ps = [];
                for (var i = 0; i < block.children.length; i++) {
                    if (block.children[i].tagName === 'P') ps.push(block.children[i]);
                }
                if (!ps.length) return;
                var totalLen = ps.reduce(function (sum, p) { return sum + p.textContent.length; }, 0);
                if (totalLen < 140) return;
                var wrap = document.createElement('div');
                wrap.className = 'tech-breakdown-text';
                block.insertBefore(wrap, ps[0]);
                ps.forEach(function (p) { wrap.appendChild(p); });
                applyReadMore(wrap);
            });

            // Case 3: .project-detail-section with 2+ direct <p> children (e.g. Overview)
            modalContent.querySelectorAll('.project-detail-section').forEach(function (section) {
                var ps = [];
                for (var i = 0; i < section.children.length; i++) {
                    if (section.children[i].tagName === 'P') ps.push(section.children[i]);
                }
                if (!ps.length) return;
                var totalLen = ps.reduce(function (sum, p) { return sum + p.textContent.length; }, 0);
                if (totalLen < 140) return;
                var wrap = document.createElement('div');
                wrap.className = 'tech-breakdown-text';
                section.insertBefore(wrap, ps[0]);
                ps.forEach(function (p) { wrap.appendChild(p); });
                applyReadMore(wrap);
            });
        }

        function initCodeTabs() {
            modalContent.querySelectorAll('.code-embed').forEach(function (embed) {
                embed.querySelectorAll('.code-tab').forEach(function (tab) {
                    tab.addEventListener('click', function () {
                        embed.querySelectorAll('.code-tab').forEach(function (t) { t.classList.remove('active'); });
                        embed.querySelectorAll('.code-panel').forEach(function (p) { p.classList.remove('active'); });
                        tab.classList.add('active');
                        var target = document.getElementById(tab.getAttribute('data-target'));
                        if (target) target.classList.add('active');
                    });
                });
            });
        }

        if (contentCache[projectSlug]) {
            modalContent.innerHTML = contentCache[projectSlug];
            initModalContent();
        } else {
            function renderIfActive(html) {
                if (modalOverlay.classList.contains('is-active') && activeModalSlug === projectSlug) {
                    modalContent.innerHTML = html;
                    initModalContent();
                }
            }
            fetchProject(projectSlug, 6000, true)
                .then(renderIfActive)
                .catch(function () {
                    // Retry once on timeout/failure with longer timeout
                    fetchProject(projectSlug, 10000, true)
                        .then(renderIfActive)
                        .catch(function () {
                            if (modalOverlay.classList.contains('is-active') && activeModalSlug === projectSlug) {
                                modalContent.innerHTML =
                                    '<div class="modal-error">' +
                                    '<p>Could not load project content. Please try again.</p>' +
                                    '</div>';
                            }
                        });
                });
        }
    }

    function modalContainer() {
        return modalOverlay.querySelector('.modal-container');
    }

    function closeModal() {
        if (modalOverlay._videoObserver) {
            modalOverlay._videoObserver.disconnect();
            modalOverlay._videoObserver = null;
        }

        // If there's a stacked modal, pop back to it instead of closing
        if (modalStack.length > 0) {
            var prev = modalStack.pop();
            activeModalSlug = prev.slug;
            modalContent.innerHTML = prev.html;
            history.pushState({ project: prev.slug }, '', '#project/' + prev.slug);
            document.title = prev.title;
            modalContainer().scrollTop = prev.scrollTop;
            var isLight = document.documentElement.getAttribute('data-theme') === 'light';
            window.swapIcons(isLight);
            return;
        }

        activeModalSlug = null;
        modalOverlay.classList.remove('is-active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        modalStack = [];
        history.pushState(null, '', window.location.pathname);
        document.title = originalTitle;

        if (modalOverlay._previousFocus) {
            modalOverlay._previousFocus.focus();
        }

        setTimeout(function () {
            if (!modalOverlay.classList.contains('is-active')) {
                modalContent.innerHTML = '';
            }
        }, 400);
    }

    // Click on inline project link inside modal (stacked modal)
    modalContent.addEventListener('click', function (e) {
        var link = e.target.closest('a[href^="#project/"]');
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        var slug = link.getAttribute('href').replace('#project/', '');
        // Push current state onto stack
        modalStack.push({
            html: modalContent.innerHTML,
            scrollTop: modalContainer().scrollTop,
            slug: window.location.hash.replace('#project/', ''),
            title: document.title
        });
        openModal(slug);
    });

    // Click on any project card (event delegation)
    document.addEventListener('click', function (e) {
        var card = e.target.closest('[data-project]');
        if (card) {
            e.preventDefault();
            openModal(card.dataset.project);
        }
    });

    // Keyboard activation on project cards
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            var card = e.target.closest('[data-project]');
            if (card) {
                e.preventDefault();
                openModal(card.dataset.project);
            }
        }
    });

    // Close button
    modalClose.addEventListener('click', closeModal);

    // Click on backdrop to close
    modalBackdrop.addEventListener('click', closeModal);

    // Escape to close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalOverlay.classList.contains('is-active')) {
            closeModal();
        }
    });

    // Browser back / forward
    var ignoreNextPop = false;
    window.addEventListener('popstate', function () {
        if (ignoreNextPop) {
            ignoreNextPop = false;
            return;
        }
        var hash = window.location.hash;
        if (hash.indexOf('#project/') === 0) {
            var slug = hash.replace('#project/', '');
            openModal(slug);
        } else if (modalOverlay.classList.contains('is-active')) {
            activeModalSlug = null;
            modalOverlay.classList.remove('is-active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            document.title = originalTitle;
            if (modalOverlay._previousFocus) {
                modalOverlay._previousFocus.focus();
            }
            setTimeout(function () {
                if (!modalOverlay.classList.contains('is-active')) {
                    modalContent.innerHTML = '';
                }
            }, 400);
        }
    });

    // On page load: check for direct project link
    (function checkInitialHash() {
        var hash = window.location.hash;
        if (hash.indexOf('#project/') === 0) {
            var slug = hash.replace('#project/', '');
            requestAnimationFrame(function () {
                openModal(slug);
            });
        }
    })();

    /* ========================================
       PREFETCH — Silently preload solo project
       subpage HTML + hero media so modals open
       instantly without a loading screen.
       ======================================== */

    (function prefetchSoloProjects() {
        var soloSlugs = [];
        document.querySelectorAll('.piece[data-project]').forEach(function (card) {
            soloSlugs.push(card.dataset.project);
        });
        if (!soloSlugs.length) return;

        function prefetchMedia(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');

            // Video poster images (shown immediately when modal opens)
            doc.querySelectorAll('video[poster]').forEach(function (v) {
                var poster = v.getAttribute('poster');
                if (poster) new Image().src = poster;
            });

            // Gallery thumbnail strip (visible above the fold)
            doc.querySelectorAll('.project-gallery img').forEach(function (img) {
                var src = img.getAttribute('src');
                if (src) new Image().src = src;
            });
        }

        // Prefetch solo project HTML with staggered starts to avoid
        // saturating the browser's connection pool on page load.
        // Uses shared fetchProject() so clicks never create duplicate requests.
        setTimeout(function () {
            var i = 0;
            function prefetchNext() {
                if (i >= soloSlugs.length) return;
                var slug = soloSlugs[i++];
                fetchProject(slug, 10000, false)
                    .then(function (html) { if (html) prefetchMedia(html); })
                    .catch(function () {})
                    .then(function () {
                        // Stagger: wait 300ms before starting the next prefetch
                        setTimeout(prefetchNext, 300);
                    });
            }
            prefetchNext();
        }, 2500);
    })();

    // Dynamic copyright year
    var footerP = document.querySelector('.footer p');
    if (footerP) {
        footerP.innerHTML = 'Designed & built by Efrem Torrisi &copy; ' + new Date().getFullYear();
    }


    /* ========================================
       LIGHTBOX — Full-size media viewer
       ======================================== */

    (function initLightbox() {
        // Create overlay with nav arrows
        var overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML =
            '<button class="lightbox-close" aria-label="Close">&times;</button>' +
            '<button class="lightbox-arrow lightbox-prev" aria-label="Previous">&#8249;</button>' +
            '<button class="lightbox-arrow lightbox-next" aria-label="Next">&#8250;</button>';
        document.body.appendChild(overlay);

        var closeBtn = overlay.querySelector('.lightbox-close');
        var prevBtn = overlay.querySelector('.lightbox-prev');
        var nextBtn = overlay.querySelector('.lightbox-next');
        var currentMedia = null;
        var currentCaption = null;
        var galleryItems = [];
        var galleryIndex = -1;

        function showMedia(sourceEl) {
            if (currentMedia) {
                if (currentMedia.tagName === 'VIDEO') currentMedia.pause();
                currentMedia.remove();
                currentMedia = null;
            }
            if (currentCaption) {
                currentCaption.remove();
                currentCaption = null;
            }

            var el;
            var fullVideo = sourceEl.getAttribute && sourceEl.getAttribute('data-full-video');
            if (sourceEl.tagName === 'VIDEO' || fullVideo) {
                el = document.createElement('video');
                el.src = fullVideo || sourceEl.src;
                el.autoplay = true;
                el.loop = true;
                el.muted = sourceEl.tagName === 'VIDEO' ? sourceEl.muted : false;
                el.controls = true;
                el.playsInline = true;
            } else {
                el = document.createElement('img');
                el.src = sourceEl.getAttribute('data-full-src') || sourceEl.src;
                el.alt = sourceEl.alt || '';
            }

            el.className = 'lightbox-content';
            currentMedia = el;
            overlay.appendChild(el);

            var captionText = sourceEl.getAttribute('data-caption');
            if (captionText) {
                var caption = document.createElement('div');
                caption.className = 'lightbox-caption';
                caption.textContent = captionText;
                currentCaption = caption;
                overlay.appendChild(caption);
            }
        }

        function updateArrows() {
            var hasGallery = galleryItems.length > 1;
            prevBtn.style.display = hasGallery ? '' : 'none';
            nextBtn.style.display = hasGallery ? '' : 'none';
        }

        function openLightbox(sourceEl) {
            // Check if source is inside a gallery
            var gallery = sourceEl.closest('.project-gallery');
            if (gallery) {
                galleryItems = Array.from(gallery.querySelectorAll('img, video'));
                galleryIndex = galleryItems.indexOf(sourceEl);
            } else {
                galleryItems = [];
                galleryIndex = -1;
            }

            showMedia(sourceEl);
            updateArrows();
            overlay.classList.add('is-active');
        }

        function navigate(direction) {
            if (galleryItems.length < 2) return;
            galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
            showMedia(galleryItems[galleryIndex]);
        }

        function closeLightbox() {
            overlay.classList.remove('is-active');
            if (currentMedia && currentMedia.tagName === 'VIDEO') {
                currentMedia.pause();
            }
            setTimeout(function () {
                if (!overlay.classList.contains('is-active')) {
                    if (currentMedia) {
                        currentMedia.remove();
                        currentMedia = null;
                    }
                    if (currentCaption) {
                        currentCaption.remove();
                        currentCaption = null;
                    }
                }
                galleryItems = [];
                galleryIndex = -1;
            }, 300);
        }

        prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navigate(-1);
        });

        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navigate(1);
        });

        // Click on backdrop (not on media or arrows) to close
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeLightbox();
        });

        closeBtn.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', function (e) {
            if (!overlay.classList.contains('is-active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        // Delegate clicks on contrib-media items
        document.addEventListener('click', function (e) {
            var media = e.target.closest('.contrib-media-item img, .contrib-media-item video');
            if (!media) return;
            openLightbox(media);
        });

        // Also handle tech-breakdown figures and compute diagrams
        document.addEventListener('click', function (e) {
            var media = e.target.closest('.tech-breakdown-figure img, .compute-diagram img');
            if (!media) return;
            openLightbox(media);
        });

        // Handle project-gallery images
        document.addEventListener('click', function (e) {
            var media = e.target.closest('.project-gallery img, .project-gallery video');
            if (!media) return;
            openLightbox(media);
        });
    })();


    /* ========================================
       SCROLL REVEAL — Apple-style fade in/out
       ======================================== */

    (function initScrollReveal() {
        // Also apply data-reveal to each card with staggered delays
        var pieces = document.querySelectorAll('.piece');

        pieces.forEach(function (el, i) {
            el.setAttribute('data-reveal', '');
            el.style.transitionDelay = (i * 0.1) + 's';
        });

        // Reveal the carousel as a whole unit
        var carousel = document.querySelector('.projects-carousel');
        if (carousel) {
            carousel.setAttribute('data-reveal', '');
        }

        var revealElements = document.querySelectorAll('[data-reveal]');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Entering viewport — fade in
                    entry.target.classList.remove('is-past');
                    entry.target.classList.add('is-visible');
                } else {
                    // Leaving viewport — determine direction
                    var rect = entry.boundingClientRect;
                    if (rect.bottom < 0) {
                        // Element scrolled above viewport — fade out upward
                        entry.target.classList.remove('is-visible');
                        entry.target.classList.add('is-past');
                    } else {
                        // Element is below viewport — reset to initial hidden
                        entry.target.classList.remove('is-visible');
                        entry.target.classList.remove('is-past');
                    }
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    })();


    /* ========================================
       PROJECTS ACCORDION
       ======================================== */

    (function initAccordion() {
        var cards = document.querySelectorAll('.carousel-track .project');
        if (!cards.length) return;

        var track = document.querySelector('.carousel-track');
        var dotsContainer = document.querySelector('.carousel-dots');
        var MOBILE_BP = 1024;
        var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        function useDesktopCarousel() {
            if (isCoarsePointer) return false;
            return window.innerWidth > MOBILE_BP;
        }
        var AUTO_INTERVAL = 4000;
        var autoTimer = null;
        var INITIAL_INDEX = 3; // Captain Hornswaggle
        var currentIndex = INITIAL_INDEX;

        /* --- Desktop accordion --- */

        var hoverVideoTimer = null;   // delay before video starts
        var userHasInteracted = false; // suppress video on initial load

        function setFocused(focusedCard, fromUser) {
            if (hoverVideoTimer) {
                clearTimeout(hoverVideoTimer);
                hoverVideoTimer = null;
            }

            cards.forEach(function (card) {
                var wasFocused = card.classList.contains('is-focused');
                var isFocused = card === focusedCard;

                if (isFocused) {
                    card.classList.add('is-focused');
                } else {
                    card.classList.remove('is-focused');
                }

                var hoverEl = card.querySelector('.preview-hover');
                if (!hoverEl) return;

                if (!isFocused && wasFocused) {
                    // Leaving this card — hide video immediately
                    hoverEl.classList.remove('is-hover-active');
                    if (hoverEl.tagName === 'VIDEO') {
                        hoverEl.pause();
                    }
                }
            });

            // Only start hover video when triggered by actual user interaction
            if (!fromUser) return;

            // Priority-load this card's videos if not yet loaded
            priorityLoadCard(focusedCard);

            var hoverEl = focusedCard.querySelector('.preview-hover');
            if (!hoverEl) return;

            // Delay video playback to match the CSS transition
            hoverVideoTimer = setTimeout(function () {
                // Verify the card is still focused
                if (!focusedCard.classList.contains('is-focused')) return;
                hoverEl.classList.add('is-hover-active');
                if (hoverEl.tagName === 'VIDEO') {
                    hoverEl.currentTime = 0;
                    hoverEl.play();
                }
            }, 600);
        }

        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                if (useDesktopCarousel()) {
                    userHasInteracted = true;
                    setFocused(card, true);
                }
            });
        });

        track.addEventListener('mouseleave', function () {
            if (useDesktopCarousel()) {
                // Keep the last focused card, just stop the video
                if (hoverVideoTimer) {
                    clearTimeout(hoverVideoTimer);
                    hoverVideoTimer = null;
                }
                cards.forEach(function (card) {
                    var hoverEl = card.querySelector('.preview-hover');
                    if (hoverEl) {
                        hoverEl.classList.remove('is-hover-active');
                        if (hoverEl.tagName === 'VIDEO') hoverEl.pause();
                    }
                });
            }
        });

        cards.forEach(function (card) {
            card.addEventListener('click', function (e) {
                if (useDesktopCarousel() && !card.classList.contains('is-focused')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setFocused(card, true);
                }
            });
        });

        setFocused(cards[INITIAL_INDEX], false);

        /* --- Mobile swipe carousel --- */

        // Build dots
        cards.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === INITIAL_INDEX ? ' is-active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.addEventListener('click', function () {
                goToSlide(i);
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        });

        var dots = dotsContainer.querySelectorAll('.carousel-dot');

        // Show/hide hover video on the active carousel card (mobile)
        var mobileVideoTimer = null;
        var carouselInView = true; // assume visible until observer says otherwise
        var carouselVideoPlaying = false; // tracks if a video preview is actively playing

        // Mobile only: play carousel videos only when the carousel is the focus of the viewport
        if ('IntersectionObserver' in window) {
            var carouselEl = document.querySelector('.projects-carousel');
            if (carouselEl) {
                carouselInView = false;
                var carouselObserver = new IntersectionObserver(function (entries) {
                    if (useDesktopCarousel()) return;
                    entries.forEach(function (entry) {
                        var wasInView = carouselInView;
                        carouselInView = entry.isIntersecting;
                        if (!carouselInView && wasInView) {
                            // Left focus — stop all videos, cancel pending timers, stop auto-swipe
                            stopCarouselVideos();
                            stopAutoPlay();
                        } else if (carouselInView && !wasInView) {
                            // Entered focus — start auto-scroll and the delayed video play
                            resetAutoPlay();
                            mobileCarouselVideo(cards[currentIndex]);
                        }
                    });
                }, { threshold: 0.6 });
                carouselObserver.observe(carouselEl);
            }
        }

        function stopCarouselVideos() {
            if (mobileVideoTimer) {
                clearTimeout(mobileVideoTimer);
                mobileVideoTimer = null;
            }
            carouselVideoPlaying = false;
            cards.forEach(function (card) {
                var hoverEl = card.querySelector('.preview-hover');
                if (hoverEl) {
                    hoverEl.classList.remove('is-hover-active');
                    if (hoverEl.tagName === 'VIDEO') hoverEl.pause();
                }
            });
        }

        // Check if a card has a real video (not just a duplicate static image)
        function cardHasVideo(card) {
            var hoverEl = card.querySelector('.preview-hover');
            if (!hoverEl) return false;
            if (hoverEl.tagName === 'VIDEO') return true;
            // If it's still an img, check if src is a video extension
            var src = hoverEl.getAttribute('src') || '';
            return videoExts.test(src);
        }

        function mobileCarouselVideo(activeCard) {
            if (useDesktopCarousel()) return;
            stopCarouselVideos();
            if (!activeCard || !carouselInView) return;
            // Priority load and play the active card's video after a delay
            var hoverEl = activeCard.querySelector('.preview-hover');
            if (!hoverEl) return;
            // Only do video preview if this card actually has a video
            if (!cardHasVideo(activeCard)) return;
            priorityLoadCard(activeCard);
            mobileVideoTimer = setTimeout(function () {
                if (!activeCard.classList.contains('carousel-active')) return;
                if (!carouselInView) return;
                hoverEl.classList.add('is-hover-active');
                if (hoverEl.tagName === 'VIDEO') {
                    hoverEl.currentTime = 0;
                    hoverEl.play();
                    carouselVideoPlaying = true;
                    // Stop auto-swipe while video is playing
                    stopAutoPlay();
                }
            }, 600);
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, cards.length - 1));

            if (!useDesktopCarousel()) {
                cards.forEach(function (card, i) {
                    card.classList.remove('carousel-prev', 'carousel-active', 'carousel-next');
                    if (i === currentIndex) {
                        card.classList.add('carousel-active');
                    } else if (i === currentIndex - 1 || (currentIndex === 0 && i === cards.length - 1)) {
                        card.classList.add('carousel-prev');
                    } else if (i === currentIndex + 1 || (currentIndex === cards.length - 1 && i === 0)) {
                        card.classList.add('carousel-next');
                    }
                });
                // Play video on newly active card
                mobileCarouselVideo(cards[currentIndex]);
            } else {
                track.style.transform = '';
            }

            dots.forEach(function (d, i) {
                d.classList.toggle('is-active', i === currentIndex);
            });
        }

        function nextSlide() {
            goToSlide((currentIndex + 1) % cards.length);
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoTimer = setInterval(nextSlide, AUTO_INTERVAL);
        }

        function stopAutoPlay() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        function resetAutoPlay() {
            if (!useDesktopCarousel()) {
                // Don't auto-swipe if a video preview is playing or carousel is offscreen
                if (carouselVideoPlaying) return;
                if (!carouselInView) return;
                startAutoPlay();
            }
        }

        // Touch swipe with live drag
        var touchStartX = 0;
        var touchStartY = 0;
        var touchDeltaX = 0;
        var isSwiping = false;
        var swipeLocked = false;

        // Interpolation helpers
        function lerp(a, b, t) { return a + (b - a) * t; }

        // Compute visual props for a card at a given position offset from center
        // Uses eased curves so the transition through the midpoint feels smooth
        function easeInOut(t) {
            return t * t * (3 - 2 * t); // smoothstep
        }

        function getCardProps(pos) {
            var absPos = Math.abs(pos);
            if (absPos > 1.5) {
                return {
                    tx: pos > 0 ? 100 : -100,
                    sc: 0.8,
                    br: 0.3,
                    op: 0,
                    zi: 0
                };
            }
            var t = Math.min(absPos, 1);
            var eased = easeInOut(t);
            return {
                tx: pos * 28,
                sc: lerp(1, 0.82, eased),
                br: lerp(1, 0.35, eased),
                op: absPos > 1 ? lerp(1, 0, (absPos - 1) * 2) : 1,
                // Very late z-index swap — only the card nearly at center gets z3
                zi: absPos < 0.15 ? 3 : (absPos < 1 ? 2 : 1)
            };
        }

        function applyCardProps(card, props) {
            card.style.transform = 'translateX(' + props.tx.toFixed(1) + '%) scale(' + props.sc.toFixed(3) + ')';
            card.style.filter = 'brightness(' + props.br.toFixed(2) + ')';
            card.style.opacity = props.op.toFixed(2);
            card.style.zIndex = '' + props.zi;
        }

        function getRelIndex(i, center) {
            var rel = i - center;
            var half = cards.length / 2;
            if (rel > half) rel -= cards.length;
            if (rel < -half) rel += cards.length;
            return rel;
        }

        function applyDragTransforms(progress) {
            // progress: +1 = next card should be at center (dragged left)
            var p = Math.max(-1, Math.min(1, progress));

            cards.forEach(function (card, i) {
                var rel = getRelIndex(i, currentIndex);
                // Subtract progress so dragging left (p>0) pulls next card (rel=1) toward center
                var pos = rel - p;
                applyCardProps(card, getCardProps(pos));
            });
        }

        function clearInlineStyles() {
            cards.forEach(function (card) {
                card.style.transform = '';
                card.style.filter = '';
                card.style.opacity = '';
                card.style.zIndex = '';
                card.style.transition = '';
            });
        }

        // Click prev/next cards to navigate in mobile carousel
        track.addEventListener('click', function (e) {
            if (useDesktopCarousel()) return;
            var card = e.target.closest('.project');
            if (!card) return;
            if (card.classList.contains('carousel-prev')) {
                e.preventDefault();
                e.stopPropagation();
                goToSlide((currentIndex - 1 + cards.length) % cards.length);
                resetAutoPlay();
            } else if (card.classList.contains('carousel-next')) {
                e.preventDefault();
                e.stopPropagation();
                goToSlide((currentIndex + 1) % cards.length);
                resetAutoPlay();
            }
        });

        track.addEventListener('touchstart', function (e) {
            if (useDesktopCarousel()) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchDeltaX = 0;
            isSwiping = true;
            swipeLocked = false;
            // Hide all hover videos during drag — show static thumbnails
            mobileCarouselVideo(null);
            // Kill transitions for instant response
            cards.forEach(function (card) {
                card.style.transition = 'none';
            });
        }, { passive: true });

        track.addEventListener('touchmove', function (e) {
            if (!isSwiping || useDesktopCarousel()) return;
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;

            if (!swipeLocked) {
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                    swipeLocked = true;
                    if (Math.abs(dx) <= Math.abs(dy)) {
                        isSwiping = false;
                        clearInlineStyles();
                        return;
                    }
                }
                return;
            }

            e.preventDefault();
            touchDeltaX = dx;
            // Negate so dragging left = positive progress = next card
            var dragRange = track.offsetWidth * 0.45;
            var progress = -touchDeltaX / dragRange;
            applyDragTransforms(progress);
        }, { passive: false });

        track.addEventListener('touchend', function () {
            if (!isSwiping || useDesktopCarousel()) return;
            isSwiping = false;

            // Determine which card is closest to center based on drag progress
            var dragRange = track.offsetWidth * 0.45;
            var progress = -touchDeltaX / dragRange;
            var offset = Math.round(progress);
            // Clamp to ±1 so we only ever move one card at a time
            offset = Math.max(-1, Math.min(1, offset));
            var targetIndex = ((currentIndex + offset) % cards.length + cards.length) % cards.length;

            // Animate from current inline position to target position:
            // 1. Re-enable transitions on all cards
            var transVal = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s ease, opacity 0.4s ease';
            cards.forEach(function (card) {
                card.style.transition = transVal;
            });

            // 2. Set inline styles for the final target positions
            //    (relative to targetIndex as center)
            requestAnimationFrame(function () {
                cards.forEach(function (card, i) {
                    var rel = getRelIndex(i, targetIndex);
                    applyCardProps(card, getCardProps(rel));
                });

                // 3. After transition completes, clean up and hand off to CSS classes
                setTimeout(function () {
                    currentIndex = targetIndex;
                    clearInlineStyles();
                    goToSlide(targetIndex);
                }, 420);
            });

            resetAutoPlay();
        });

        // Start auto-play on mobile (only if in view)
        function handleResize() {
            if (!useDesktopCarousel()) {
                goToSlide(currentIndex);
                if (carouselInView) startAutoPlay();
            } else {
                cards.forEach(function (card) {
                    card.classList.remove('carousel-prev', 'carousel-active', 'carousel-next');
                });
                track.style.transform = '';
                stopAutoPlay();
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize();
    })();


    /* ========================================
       THREE.JS — INTERACTIVE PARTICLE FIELD
       Emissive HDR-style glow (no post-processing)
       ======================================== */

    if (typeof THREE === 'undefined') return;

    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    var PARTICLE_COUNT = 1000;
    var clock = new THREE.Clock();

    // Renderer
    var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false
    });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    // Scene & Camera
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.z = 18;

    // Particles
    var geometry = new THREE.BufferGeometry();
    var positions  = new Float32Array(PARTICLE_COUNT * 3);
    var basePositions = new Float32Array(PARTICLE_COUNT * 3);
    var sizes      = new Float32Array(PARTICLE_COUNT);
    var opacities  = new Float32Array(PARTICLE_COUNT);
    var speeds     = new Float32Array(PARTICLE_COUNT);

    for (var i = 0; i < PARTICLE_COUNT; i++) {
        var i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 40;
        positions[i3 + 1] = (Math.random() - 0.5) * 25;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;

        basePositions[i3]     = positions[i3];
        basePositions[i3 + 1] = positions[i3 + 1];
        basePositions[i3 + 2] = positions[i3 + 2];

        sizes[i]     = Math.random() * 3.0 + 1.0;
        opacities[i] = Math.random() * 0.25 + 0.05;
        speeds[i]    = Math.random() * 0.2 + 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    // Shader with dual mode: bright stars (dark theme) / dark motes (light theme)
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    var material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: {
            uPixelRatio: { value: renderer.getPixelRatio() },
            uDarkMode: { value: isDark ? 1.0 : 0.0 }
        },
        vertexShader: [
            'attribute float aSize;',
            'attribute float aOpacity;',
            'varying float vOpacity;',
            'uniform float uPixelRatio;',
            'void main() {',
            '    vOpacity = aOpacity;',
            '    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
            '    gl_PointSize = aSize * uPixelRatio * (40.0 / -mvPos.z);',
            '    gl_Position = projectionMatrix * mvPos;',
            '}'
        ].join('\n'),
        fragmentShader: [
            'varying float vOpacity;',
            'uniform float uDarkMode;',
            'void main() {',
            '    float d = length(gl_PointCoord - vec2(0.5));',
            '    if (d > .7) discard;',
            '',
            '    float glow = 1.0 - smoothstep(0.0, 1.0, d);',
            '    float core = pow(glow, 10.0);',
            '',
            '    // Dark mode: bright blue-white emissive stars',
            '    float intensityD = core * 2.0 + glow * 0.1;',
            '    float alphaD = core + glow * vOpacity * 0.5;',
            '    vec3 colorD = vec3(0.4, 0.62, 0.9) * intensityD;',
            '',
            '    // Light mode: smooth circular motes',
            '    float softGlow = pow(glow, 3.0);',
            '    float alphaL = softGlow * vOpacity * 0.7;',
            '    vec3 colorL = vec3(0.15, 0.18, 0.25);',
            '',
            '    vec3 color = mix(colorL, colorD, uDarkMode);',
            '    float alpha = mix(alphaL, alphaD, uDarkMode);',
            '    gl_FragColor = vec4(color, alpha);',
            '}'
        ].join('\n')
    });

    var points = new THREE.Points(geometry, material);
    scene.add(points);

    // Sizing — full viewport
    function resizeRenderer() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resizeRenderer();

    // Mouse tracking — global
    window.addEventListener('mousemove', function (e) {
        mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Animation loop with adaptive frame skipping
    var isVisible = true;
    var lastFrameTime = 0;
    var particlesPaused = false;
    var slowFrameCount = 0;

    function animate(timestamp) {
        requestAnimationFrame(animate);

        if (!isVisible) return;

        // Adaptive: if frames are taking > 50ms (< 20fps), skip particles
        var delta = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        if (delta > 50) {
            slowFrameCount++;
            // After 10 consecutive slow frames, pause particles entirely
            if (slowFrameCount > 10) {
                if (!particlesPaused) {
                    particlesPaused = true;
                    canvas.style.display = 'none';
                }
                return;
            }
            // Skip every other frame when slow
            if (slowFrameCount % 2 === 0) return;
        } else {
            slowFrameCount = 0;
            if (particlesPaused) {
                particlesPaused = false;
                canvas.style.display = '';
            }
        }

        var elapsed = clock.getElapsedTime();
        var posArr = geometry.attributes.position.array;

        // Smooth mouse
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        for (var i = 0; i < PARTICLE_COUNT; i++) {
            var i3 = i * 3;
            var sp = speeds[i];

            posArr[i3]     = basePositions[i3]     + Math.sin(elapsed * sp + i) * 2;
            posArr[i3 + 1] = basePositions[i3 + 1] + Math.cos(elapsed * sp * 0.7 + i * 0.5) * 2;
            posArr[i3 + 2] = basePositions[i3 + 2] + Math.sin(elapsed * sp * 0.5 + i * 0.3) * 1.5;

            posArr[i3]     += mouse.x * 1.2 * sp;
            posArr[i3 + 1] += mouse.y * 0.8 * sp;
        }

        geometry.attributes.position.needsUpdate = true;

        camera.position.x = mouse.x * 0.5;
        camera.position.y = mouse.y * 0.3;
        camera.lookAt(0, 0, 0);

        // Check for theme changes and update particle mode
        var nowDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var currentMode = material.uniforms.uDarkMode.value > 0.5;
        if (nowDark !== currentMode) {
            material.uniforms.uDarkMode.value = nowDark ? 1.0 : 0.0;
            material.blending = nowDark ? THREE.AdditiveBlending : THREE.NormalBlending;
            material.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // Resize handler
    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeRenderer, 100);
    });

    // Pause when tab not visible
    document.addEventListener('visibilitychange', function () {
        isVisible = !document.hidden;
        if (isVisible) clock.getDelta();
    });

})();
