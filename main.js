/**
 * Portfolio — Modal System + Three.js Particle Field
 * Efrem Torrisi | Technical Artist
 */
(function () {
    'use strict';

    /* ========================================
       PAGE INTRO ANIMATION
       ======================================== */

    // Activate entrance animation immediately
    document.body.classList.add('is-intro');

    // Remove intro class after all entrance animations complete (~2.6s),
    // letting the scroll-reveal system take over.
    setTimeout(function () {
        document.body.classList.remove('is-intro');
    }, 2600);

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

        if (contentCache[projectSlug]) {
            modalContent.innerHTML = contentCache[projectSlug];
            modalContainer().scrollTop = 0;
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
        var projects = document.querySelectorAll('.project');

        pieces.forEach(function (el, i) {
            el.setAttribute('data-reveal', '');
            el.style.transitionDelay = (i * 0.1) + 's';
        });

        projects.forEach(function (el, i) {
            el.setAttribute('data-reveal', '');
            el.style.transitionDelay = (i * 0.06) + 's';
        });

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
