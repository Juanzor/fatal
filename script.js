/* ==========================================================================
   FATAL — METAL — INTERACTIVE SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Lenis Smooth Scroll Integration (Portfolio Reference)
    // ----------------------------------------------------------------------
    const lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.2,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // ----------------------------------------------------------------------
    // 2. Navigation Header & Menu Logic
    // ----------------------------------------------------------------------
    const header = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-item');

    // Sticky transparent navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Scroll Spy (Navbar Active State) linked with Lenis
    function scrollSpy() {
        let current = "";
        const headerOffset = header.offsetHeight + 100;
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - headerOffset) {
                current = section.getAttribute("id");
            }
        });

        // Force active on fechas if scrolled to the absolute bottom
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) {
            current = "fechas";
        }

        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    }

    lenis.on('scroll', scrollSpy);
    window.addEventListener("load", scrollSpy);

    // Mobile Hamburger Toggle
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.contains('open');
            navMenu.classList.toggle('open');
            menuToggle.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', !isOpen);
        });
    }

    // Smooth scroll navigation clicks using Lenis scrollTo
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            // Calculate active header height offset
            const offset = header.offsetHeight + 8;
            lenis.scrollTo(target, { offset: -offset });

            // Close mobile menu if open
            if (navMenu && menuToggle) {
                navMenu.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // ----------------------------------------------------------------------
    // 3. Scroll Reveal Animations (Portfolio Reference)
    // ----------------------------------------------------------------------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible'); // portfolio reveals class
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -45px 0px' 
    });

    document.querySelectorAll('.animate-up').forEach(el => {
        revealObserver.observe(el);
    });

    // GSAP Enhancement for Hero logo
    if (window.gsap) {
        gsap.from('#hero-logo-img', {
            opacity: 0,
            scale: 0.85,
            duration: 1.6,
            ease: 'power4.out',
            delay: 0.2
        });
        
        gsap.to('.hero-bg-overlay', {
            backgroundPosition: '15px 15px',
            duration: 12,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    // ----------------------------------------------------------------------
    // 4. Real HTML5 Audio Player System
    // ----------------------------------------------------------------------
    const playlist = [
        { id: 1, title: 'El Falcon Verde', durationStr: '03:05', durationSec: 185, src: 'audio/falcon_verde.mp3' },
        { id: 2, title: 'Recuerdos Desoladores', durationStr: '02:25', durationSec: 145, src: 'audio/recuerdos_desoladores.mp3' },
        { id: 3, title: 'Ciudad a Ciegas', durationStr: '04:04', durationSec: 244, src: 'audio/ciudad_a_ciegas.mp3' }
    ];

    let currentTrackIndex = null;
    let isPlaying = false;
    let currentAudio = null;

    // UI Element Selectors
    const trackItems = document.querySelectorAll('.track-item');
    const stickyPlayer = document.getElementById('sticky-player');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const playerPrevBtn = document.getElementById('player-prev-btn');
    const playerNextBtn = document.getElementById('player-next-btn');
    const playerCloseBtn = document.getElementById('player-close-btn');
    const playerProgressBar = document.getElementById('player-progress-bar');
    const playerTimeCurrent = document.querySelector('.player-time-current');
    const playerTimeDuration = document.querySelector('.player-time-duration');
    const playerSongTitle = document.querySelector('.player-song-title');
    const playerEQ = document.querySelector('.player-visual-equalizer');
    const progressWrapper = document.querySelector('.player-progress-bar-wrapper');

    // Attach click events to tracklist rows
    trackItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-track-index'));
            selectAndPlayTrack(index);
        });
        
        // Prevent action bubbling inside track rows
        const btn = item.querySelector('.track-play-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.getAttribute('data-track-index'));
                selectAndPlayTrack(index);
            });
        }
    });

    // Player Play/Pause trigger
    playerPlayBtn.addEventListener('click', togglePlayState);

    // Prev/Next track handlers
    playerPrevBtn.addEventListener('click', playPreviousTrack);
    playerNextBtn.addEventListener('click', playNextTrack);

    // Close reproducer action
    if (playerCloseBtn) {
        playerCloseBtn.addEventListener('click', () => {
            if (currentAudio) {
                currentAudio.pause();
            }
            isPlaying = false;
            
            // Hide player bar
            stickyPlayer.classList.remove('visible');
            stickyPlayer.setAttribute('aria-hidden', 'true');
            
            // Reset track selectors
            currentTrackIndex = null;
            updateTrackListUI();
            updateControlsUI(false);
        });
    }

    // Audio progress bar scrubbing
    if (progressWrapper) {
        progressWrapper.addEventListener('click', (e) => {
            if (currentTrackIndex === null || !currentAudio) return;
            const rect = progressWrapper.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
            
            // Set playback timing based on click percentage
            if (!isNaN(currentAudio.duration)) {
                currentAudio.currentTime = percent * currentAudio.duration;
            } else {
                const track = playlist[currentTrackIndex - 1];
                currentAudio.currentTime = percent * track.durationSec;
            }
        });
    }

    // Select and play a track
    function selectAndPlayTrack(index) {
        if (currentTrackIndex === index) {
            togglePlayState();
        } else {
            currentTrackIndex = index;
            const track = playlist[currentTrackIndex - 1];

            // 1. Stop current audio stream if active
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            // 2. Initialize new HTML5 Audio object
            currentAudio = new Audio(track.src);
            currentAudio.volume = 0.6; // comfortable base volume

            // 3. Audio stream Event Listeners
            currentAudio.addEventListener('timeupdate', () => {
                if (!currentAudio || currentTrackIndex !== index) return;
                const progress = currentAudio.currentTime;
                const duration = currentAudio.duration || track.durationSec;
                if (!isNaN(duration) && duration > 0) {
                    const percent = (progress / duration) * 100;
                    playerProgressBar.style.width = `${percent}%`;
                    playerTimeCurrent.textContent = formatTime(Math.floor(progress));
                }
            });

            currentAudio.addEventListener('loadedmetadata', () => {
                if (!currentAudio) return;
                playerTimeDuration.textContent = formatTime(Math.floor(currentAudio.duration));
            });

            currentAudio.addEventListener('ended', () => {
                playNextTrack(); // autoplay next
            });

            // 4. Update UI details
            playerSongTitle.textContent = track.title;
            playerTimeDuration.textContent = track.durationStr;
            playerTimeCurrent.textContent = '00:00';
            playerProgressBar.style.width = '0%';
            
            // 5. Open player bar and begin play
            isPlaying = true;
            stickyPlayer.classList.add('visible');
            stickyPlayer.removeAttribute('aria-hidden');

            currentAudio.play().catch(err => {
                console.log("Audio playback blocked. Waiting for user click event.", err);
            });

            updateTrackListUI();
            updateControlsUI(true);
        }
    }

    // Toggle playing state
    function togglePlayState() {
        if (currentTrackIndex === null) {
            selectAndPlayTrack(1);
            return;
        }

        if (!currentAudio) {
            const track = playlist[currentTrackIndex - 1];
            currentAudio = new Audio(track.src);
        }

        if (isPlaying) {
            currentAudio.pause();
            isPlaying = false;
        } else {
            currentAudio.play().catch(err => console.log("Audio block", err));
            isPlaying = true;
        }
        
        updateControlsUI(isPlaying);
        updateTrackListUI();
    }

    function playNextTrack() {
        if (currentTrackIndex === null) return;
        let nextIndex = currentTrackIndex + 1;
        if (nextIndex > playlist.length) {
            nextIndex = 1;
        }
        selectAndPlayTrack(nextIndex);
    }

    function playPreviousTrack() {
        if (currentTrackIndex === null) return;
        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 1) {
            prevIndex = playlist.length;
        }
        selectAndPlayTrack(prevIndex);
    }

    // UI Updates
    function updateControlsUI(playing) {
        const playIcon = playerPlayBtn.querySelector('i');
        if (playing) {
            playIcon.className = 'fa-solid fa-pause';
            playerEQ.classList.add('playing');
        } else {
            playIcon.className = 'fa-solid fa-play';
            playerEQ.classList.remove('playing');
        }
    }

    function updateTrackListUI() {
        trackItems.forEach(item => {
            const index = parseInt(item.getAttribute('data-track-index'));
            const playBtnIcon = item.querySelector('.track-play-btn i');
            const visualizer = item.querySelector('.equalizer-visualizer');
            
            if (index === currentTrackIndex) {
                item.classList.add('playing');
                if (isPlaying) {
                    playBtnIcon.className = 'fa-solid fa-pause';
                    if (visualizer) visualizer.style.display = 'flex';
                } else {
                    playBtnIcon.className = 'fa-solid fa-play';
                    if (visualizer) visualizer.style.display = 'none';
                }
            } else {
                item.classList.remove('playing');
                playBtnIcon.className = 'fa-solid fa-play';
                if (visualizer) visualizer.style.display = 'none';
            }
        });
    }

    // Time Formatter
    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // ----------------------------------------------------------------------
    // 5. Interactive Date Gallery Carousel Modal System
    // ----------------------------------------------------------------------
    const galleryModal = document.getElementById('gallery-modal');
    const galleryCloseBtn = document.getElementById('gallery-close-btn');
    const galleryVenueName = document.getElementById('gallery-venue-name');
    const galleryLocation = document.getElementById('gallery-location');
    const galleryCounter = document.getElementById('gallery-counter');
    const galleryImg = document.getElementById('gallery-img');
    const galleryVideo = document.getElementById('gallery-video');
    const galleryPrevBtn = document.getElementById('gallery-prev-btn');
    const galleryNextBtn = document.getElementById('gallery-next-btn');
    const galleryThumbnails = document.getElementById('gallery-thumbnails');
    const dateRows = document.querySelectorAll('.date-row[data-media]');

    let currentGalleryMedia = [];
    let currentGalleryIndex = 0;

    if (dateRows.length > 0 && galleryModal) {
        dateRows.forEach(row => {
            row.addEventListener('click', () => {
                const venue = row.getAttribute('data-venue');
                const location = row.getAttribute('data-location');
                const date = row.getAttribute('data-date');
                const mediaJson = row.getAttribute('data-media');

                try {
                    currentGalleryMedia = JSON.parse(mediaJson);
                } catch (e) {
                    currentGalleryMedia = [];
                }

                if (currentGalleryMedia.length === 0) return;

                galleryVenueName.textContent = venue;
                galleryLocation.innerHTML = `${location} &bull; ${date}`;
                currentGalleryIndex = 0;

                openGalleryModal();
            });
        });
    }

    function openGalleryModal() {
        galleryModal.classList.add('open');
        galleryModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        renderGallerySlide();
        renderGalleryThumbnails();
    }

    function closeGalleryModal() {
        if (!galleryModal) return;
        galleryModal.classList.remove('open');
        galleryModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (galleryVideo) {
            galleryVideo.pause();
            galleryVideo.src = '';
        }
    }

    if (galleryCloseBtn) {
        galleryCloseBtn.addEventListener('click', closeGalleryModal);
    }

    const backdrop = document.querySelector('.gallery-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeGalleryModal);
    }

    if (galleryPrevBtn) {
        galleryPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateGallery(-1);
        });
    }

    if (galleryNextBtn) {
        galleryNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateGallery(1);
        });
    }

    function navigateGallery(direction) {
        if (currentGalleryMedia.length <= 1) return;
        currentGalleryIndex = (currentGalleryIndex + direction + currentGalleryMedia.length) % currentGalleryMedia.length;
        renderGallerySlide();
        updateActiveThumbnail();
    }

    function renderGallerySlide() {
        const itemSrc = currentGalleryMedia[currentGalleryIndex];
        galleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryMedia.length}`;

        if (galleryVideo) {
            galleryVideo.pause();
        }

        const isVideo = itemSrc.endsWith('.mp4') || itemSrc.endsWith('.webm');

        if (isVideo) {
            galleryImg.style.display = 'none';
            galleryVideo.style.display = 'block';
            galleryVideo.src = itemSrc;
        } else {
            galleryVideo.style.display = 'none';
            galleryImg.style.display = 'block';
            galleryImg.src = itemSrc;
        }
    }

    function renderGalleryThumbnails() {
        galleryThumbnails.innerHTML = '';
        currentGalleryMedia.forEach((src, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `gallery-thumb ${idx === currentGalleryIndex ? 'active' : ''}`;
            
            if (src.endsWith('.mp4') || src.endsWith('.webm')) {
                thumb.innerHTML = `<video src="${src}#t=0.5" muted preload="metadata"></video>`;
            } else {
                thumb.innerHTML = `<img src="${src}" alt="Thumb ${idx + 1}">`;
            }

            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                currentGalleryIndex = idx;
                renderGallerySlide();
                updateActiveThumbnail();
            });

            galleryThumbnails.appendChild(thumb);
        });
    }

    function updateActiveThumbnail() {
        const thumbs = galleryThumbnails.querySelectorAll('.gallery-thumb');
        thumbs.forEach((t, i) => {
            if (i === currentGalleryIndex) {
                t.classList.add('active');
                t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                t.classList.remove('active');
            }
        });
    }

    // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
    document.addEventListener('keydown', (e) => {
        if (!galleryModal || !galleryModal.classList.contains('open')) return;
        if (e.key === 'Escape') {
            closeGalleryModal();
        } else if (e.key === 'ArrowLeft') {
            navigateGallery(-1);
        } else if (e.key === 'ArrowRight') {
            navigateGallery(1);
        }
    });
});
