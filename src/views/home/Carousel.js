import React, { useState, useCallback, useRef, useEffect } from 'react';

const Carousel = ({ children, show }) => {
    const [leftDisabled, setLeftDisabled] = useState(true);
    const [rightDisabled, setRightDisabled] = useState(false);
    const carouselRef = useRef(null);

    // Update button disabled state based on the scroll position
    const updateDisabledButtons = () => {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setLeftDisabled(scrollLeft === 0);
        setRightDisabled(scrollLeft + clientWidth >= scrollWidth);
    };

    // Scroll to the next/prev item
    const carouselNext = () => {
        const { clientWidth } = carouselRef.current;
        const carouselWidth = carouselRef.current.scrollWidth;
        // snap to the next item
        let scrollAmount = Math.ceil(carouselWidth / show);
        carouselRef.current.scrollBy({ left: clientWidth / show, behavior: 'smooth' });    
    };

    const carouselPrev = () => {
        const { clientWidth } = carouselRef.current;
        carouselRef.current.scrollBy({ left: -clientWidth / show, behavior: 'smooth' });
    };

    // Handle horizontal scroll with trackpad/mouse wheel
    const onWheel = useCallback((e) => {
        if (e.deltaX !== 0) {
            let scrollAmount = e.deltaX * 4;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            e.preventDefault();
        }
    }, []);

    // Handle horizontal scroll with touch events
    const touchStart = (e) => {
        let touchStartX = e.touches[0].clientX;
        let touchStartY = e.touches[0].clientY;
        const content = carouselRef.current;
        const touchMove = (e) => {
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                content.scrollLeft += diffX;
            }
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        };
        const touchEnd = () => {
            content.removeEventListener('touchmove', touchMove);
            content.removeEventListener('touchend', touchEnd);
        };
        content.addEventListener('touchmove', touchMove);
        content.addEventListener('touchend', touchEnd);
    };

    useEffect(() => {
        const content = carouselRef.current;
        content.addEventListener('wheel', onWheel, { passive: false });
        content.addEventListener('scroll', updateDisabledButtons);
        // mobile touch events
        content.addEventListener('touchstart', touchStart, { passive: false });
        

        // Initial button state update
        updateDisabledButtons();

        // Cleanup event listeners on component unmount
        return () => {
            content.removeEventListener('wheel', onWheel);
            content.removeEventListener('scroll', updateDisabledButtons);
        };
    }, [onWheel]);

    return (
        <div>
            <div className="portfolio-header-container">
                <h2 className="section-title">Project Portfolio</h2>
            </div>
            <div className="carousel-container">
                <div className="carousel-wrapper">
                    <div
                        className="carousel-content-wrapper"
                        ref={carouselRef}  // Attach the ref to the scrollable div
                    >
                        <div className={`carousel-content show-${show}`}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
            <div className="portfolio-carousel-nav">
                <div className={`carousel-nav-button prev-button ${leftDisabled ? 'disabled' : ''}`} aria-label="Previous" onClick={carouselPrev}>
                    &lt;
                </div>
                <div className={`carousel-nav-button next-button ${rightDisabled ? 'disabled' : ''}`} aria-label="Next" onClick={carouselNext}>
                    &gt;
                </div>
            </div>
        </div>
    );
};

export default Carousel;
