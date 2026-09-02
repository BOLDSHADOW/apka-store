document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    //   SEARCH FILTER LOGIC
    // =========================================
    const searchInput = document.getElementById('searchInput');
    const menuItems = document.querySelectorAll('.menu-item');
    const noResultsMsg = document.getElementById('noResultsMsg');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        let hasVisibleItems = false;

        menuItems.forEach(item => {
            const itemName = item.querySelector('.item-name').innerText.toLowerCase();
            if (itemName.includes(query)) {
                item.style.display = 'flex';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/Hide "No Results Found" message
        if (hasVisibleItems) {
            noResultsMsg.style.display = 'none';
        } else {
            noResultsMsg.style.display = 'block';
        }
    });

    // =========================================
    //   SLIDER & DOTS LOGIC
    // =========================================
    const visualBoxes = document.querySelectorAll('.item-visuals');

    visualBoxes.forEach(box => {
        const track = box.querySelector('.slider-track');
        let slides = Array.from(track.children);
        
        if(slides.length === 0) return;

        let originalSlideCount = slides.length;

        // Create Dots
        const dotsContainer = box.querySelector('.slider-dots');
        for (let i = 0; i < originalSlideCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active'); 
            dotsContainer.appendChild(dot);
        }
        const dots = Array.from(dotsContainer.children);

        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slides.length - 1].cloneNode(true);
        
        track.appendChild(firstClone);
        track.insertBefore(lastClone, slides[0]);
        
        let currentIndex = 1; 
        let isTransitioning = false;
        
        const updatePosition = (smooth = true) => {
            track.style.transition = smooth ? 'transform 0.4s ease-in-out' : 'none';
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            dots.forEach(d => d.classList.remove('active'));
            let activeIndex = currentIndex - 1; 
            
            if (activeIndex < 0) activeIndex = originalSlideCount - 1;
            if (activeIndex >= originalSlideCount) activeIndex = 0;
            
            if(dots[activeIndex]) {
                dots[activeIndex].classList.add('active');
            }
        };
        
        updatePosition(false);
        
        const moveNext = () => {
            if (isTransitioning) return;
            currentIndex++;
            updatePosition(true);
        };
        
        const movePrev = () => {
            if (isTransitioning) return;
            currentIndex--;
            updatePosition(true);
        };
        
        track.addEventListener('transitionstart', () => { isTransitioning = true; });
        track.addEventListener('transitionend', () => {
            isTransitioning = false;
            const totalSlides = track.children.length;
            
            if (currentIndex === totalSlides - 1) {
                currentIndex = 1;
                updatePosition(false);
            }
            if (currentIndex === 0) {
                currentIndex = totalSlides - 2;
                updatePosition(false);
            }
        });
        
        let autoPlay = setInterval(moveNext, 3000);
        
        let startX = 0;
        let diff = 0;
        
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            clearInterval(autoPlay); 
        }, { passive: true });
        
        track.addEventListener('touchmove', (e) => {
            let currentX = e.touches[0].clientX;
            diff = startX - currentX;
            if (Math.abs(diff) > 15) {
                e.preventDefault();
            }
        }, { passive: false });
        
        track.addEventListener('touchend', () => {
            if (diff > 30) {
                moveNext(); 
            } else if (diff < -30) {
                movePrev(); 
            }
            diff = 0;
            autoPlay = setInterval(moveNext, 3000); 
        });
    });

    // --- ADD (+) Button Event ---
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('Item added to your cart!');
        });
    });

    // =========================================
    //   OFFERS MODAL (POPUP) LOGIC
    // =========================================
    const offersBtn = document.getElementById('offersBtn');
    const modal = document.getElementById('offersModal');
    const closeBtn = document.getElementById('closeModalBtn');

    offersBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-content')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});