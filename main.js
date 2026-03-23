/**
 * Portfolio — Modal System + Three.js Particle Field
 * Efrem Torrisi | Technical Artist
 */
// ── Work In Progress Gate ─────────────────────────────────────
const WIP_MODE = true; // set to false to disable

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
        img.parentNode.replaceChild(video, img);
        return video;
    }

    // Solo projects (.piece) — force preload immediately
    document.querySelectorAll('.piece img').forEach(function (img) {
        if (!videoExts.test(img.getAttribute('src'))) return;
        var isHover = img.classList.contains('preview-hover');
        var video = imgToVideo(img, 'auto');
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
    document.querySelectorAll('.piece').forEach(function (card) {
        var hoverEl = card.querySelector('.preview-hover');
        if (!hoverEl) return;

        card.addEventListener('mouseenter', function () {
            hoverEl.classList.add('is-hover-active');
            if (hoverEl.tagName === 'VIDEO') {
                hoverEl.currentTime = 0;
                hoverEl.play();
            }
        });

        card.addEventListener('mouseleave', function () {
            hoverEl.classList.remove('is-hover-active');
            if (hoverEl.tagName === 'VIDEO') {
                hoverEl.pause();
            }
        });
    });

    /* ========================================
       PAGE INTRO ANIMATION
       ======================================== */

    // Activate entrance animation immediately
    document.body.classList.add('is-intro');

    // Remove intro class after all entrance animations complete (~2.6s),
    // letting the scroll-reveal system take over.
    setTimeout(function () {
        document.body.classList.remove('is-intro');
    }, 3200);

    /* ========================================
       MODAL SYSTEM
       ======================================== */

    var modalOverlay = document.getElementById('project-modal');
    var modalContent = document.getElementById('modal-content');
    var modalClose   = modalOverlay.querySelector('.modal-close');
    var modalBackdrop = modalOverlay.querySelector('.modal-backdrop');
    var contentCache  = {};
    var originalTitle = document.title;

    function openModal(projectSlug) {
        history.pushState({ project: projectSlug }, '', '#project/' + projectSlug);

        var card = document.querySelector('[data-project="' + projectSlug + '"]');
        var projectTitle = card ? card.dataset.title : projectSlug;
        document.title = projectTitle + ' | Efrem Torrisi';

        modalContent.innerHTML = '<div class="modal-loading">Loading\u2026</div>';
        document.body.classList.add('modal-open');
        modalOverlay.classList.add('is-active');
        modalOverlay.setAttribute('aria-hidden', 'false');

        modalOverlay._previousFocus = document.activeElement;
        modalClose.focus();

        function swapModalVideos() {
            modalContent.querySelectorAll('.project-gallery img').forEach(function (img) {
                if (!videoExts.test(img.getAttribute('src'))) return;
                var video = imgToVideo(img);
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
            });
        }

        if (contentCache[projectSlug]) {
            modalContent.innerHTML = contentCache[projectSlug];
            modalContainer().scrollTop = 0;
            swapModalVideos();
        } else {
            fetch('projects/' + projectSlug + '.html')
                .then(function (res) {
                    if (!res.ok) throw new Error('Not found');
                    return res.text();
                })
                .then(function (html) {
                    contentCache[projectSlug] = html;
                    if (modalOverlay.classList.contains('is-active')) {
                        modalContent.innerHTML = html;
                        modalContainer().scrollTop = 0;
                        swapModalVideos();
                    }
                })
                .catch(function () {
                    modalContent.innerHTML =
                        '<div class="modal-error">' +
                        '<p>Could not load project content.</p>' +
                        '</div>';
                });
        }
    }

    function modalContainer() {
        return modalOverlay.querySelector('.modal-container');
    }

    function closeModal() {
        modalOverlay.classList.remove('is-active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

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

    // Dynamic copyright year
    var footerP = document.querySelector('.footer p');
    if (footerP) {
        footerP.innerHTML = '&copy; ' + new Date().getFullYear() + ' Efrem. All rights reserved.';
    }


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
        var MOBILE_BP = 768;
        var AUTO_INTERVAL = 4000;
        var autoTimer = null;
        var currentIndex = 0;

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
                if (window.innerWidth > MOBILE_BP) {
                    userHasInteracted = true;
                    setFocused(card, true);
                }
            });
        });

        track.addEventListener('mouseleave', function () {
            if (window.innerWidth > MOBILE_BP) {
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
                if (window.innerWidth > MOBILE_BP && !card.classList.contains('is-focused')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setFocused(card, true);
                }
            });
        });

        setFocused(cards[0], false);

        /* --- Mobile swipe carousel --- */

        // Build dots
        cards.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.addEventListener('click', function () {
                goToSlide(i);
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        });

        var dots = dotsContainer.querySelectorAll('.carousel-dot');

        // Mobile: show/hide hover video on the active carousel card
        var mobileVideoTimer = null;

        function mobileCarouselVideo(activeCard) {
            if (window.innerWidth > MOBILE_BP) return;
            // Clear any pending timer
            if (mobileVideoTimer) {
                clearTimeout(mobileVideoTimer);
                mobileVideoTimer = null;
            }
            // Pause all project hover videos
            cards.forEach(function (card) {
                var hoverEl = card.querySelector('.preview-hover');
                if (hoverEl) {
                    hoverEl.classList.remove('is-hover-active');
                    if (hoverEl.tagName === 'VIDEO') hoverEl.pause();
                }
            });
            if (!activeCard) return;
            // Priority load and play the active card's video after a short delay
            var hoverEl = activeCard.querySelector('.preview-hover');
            if (!hoverEl) return;
            priorityLoadCard(activeCard);
            mobileVideoTimer = setTimeout(function () {
                if (!activeCard.classList.contains('carousel-active')) return;
                hoverEl.classList.add('is-hover-active');
                if (hoverEl.tagName === 'VIDEO') {
                    hoverEl.currentTime = 0;
                    hoverEl.play();
                }
            }, 500);
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, cards.length - 1));

            if (window.innerWidth <= MOBILE_BP) {
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
            if (window.innerWidth <= MOBILE_BP) {
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

        track.addEventListener('touchstart', function (e) {
            if (window.innerWidth > MOBILE_BP) return;
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
            if (!isSwiping || window.innerWidth > MOBILE_BP) return;
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
            if (!isSwiping || window.innerWidth > MOBILE_BP) return;
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

        // Start auto-play on mobile
        function handleResize() {
            if (window.innerWidth <= MOBILE_BP) {
                goToSlide(currentIndex);
                startAutoPlay();
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    // Emissive HDR-style shader — bright core with soft radial falloff
    // Uses color values > 1.0 so additive blending creates natural glow
    var material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uPixelRatio: { value: renderer.getPixelRatio() }
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
            'void main() {',
            '    float d = length(gl_PointCoord - vec2(0.5));',
            '    if (d > .7) discard;',
            '',
            '    // Soft radial falloff',
            '    float glow = 1.0 - smoothstep(0.0, 1.0, d);',
            '    // Concentrated bright core (emissive feel)',
            '    float core = pow(glow, 10.0);',
            '',
            '    // HDR intensity: core pushes values above 1.0',
            '    float intensity = core * 2.0 + glow * 0.1;',
            '    // Alpha peaks at 1.0 in the center, fades at edges',
            '    float alpha = core + glow * vOpacity * 0.5;',
            '',
            '    // Blue-white emissive color',
            '    vec3 color = vec3(0.4, 0.62, 0.9) * intensity;',
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

    // Animation loop
    var isVisible = true;

    function animate() {
        if (!isVisible) {
            requestAnimationFrame(animate);
            return;
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

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

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
