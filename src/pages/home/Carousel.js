import React, {useState, useEffect} from 'react';

const Carousel = (props) => {
    const {children, show} = props;

    const [currentIndex, setCurrentIndex] = useState(0)
    const [length, setLength] = useState(children.length)
    const [rightDisabled, setRightDisabled] = useState(false);
    const [leftDisabled, setLeftDisabled] = useState(true);
    const [touchPosition, setTouchPosition] = useState(null);

    // Set the length to match current children from props
    useEffect(() => {
        setLength(children.length)
    }, [children])

    // Set the rightDisabled state
    useEffect(() => {
        if (currentIndex === length - show + 1) {
            setRightDisabled(true);
        } else {
            setRightDisabled(false);
        }
    }, [currentIndex, length, show])

    // Set the leftDisabled state
    useEffect(() => {
        if (currentIndex <= 0) {
            setLeftDisabled(true);
        } else {
            setLeftDisabled(false);
        }
    }, [currentIndex])

    function carouselPrev() {
        if (currentIndex > 0) {
            setCurrentIndex(prevState => prevState - 1)
        }
    }

    function carouselNext() {
        if (currentIndex < (length - show + 1)) {
            setCurrentIndex(prevState => prevState + 1)
        }
    }

    const handleTouchStart = (e) => {
        const touchDown = e.touches[0].clientX
        setTouchPosition(touchDown)
    }

    const handleTouchMove = (e) => {
        const touchDown = touchPosition
    
        if(touchDown === null) {
            return
        }
    
        const currentTouch = e.touches[0].clientX
        const diff = touchDown - currentTouch
    
        if (diff > 5) {
            carouselNext()
        }
    
        if (diff < -5) {
            carouselPrev()
        }
    
        setTouchPosition(null)
    }


    return (
        <div>
            <div className="portfolio-header-container">
                <h2 className="section-title">Project Portfolio</h2>
                <div className="portfolio-carousel-nav">
                    <div className={`carousel-nav-button prev-button ${leftDisabled ? 'disabled' : ''}`} aria-label="Previous" onClick={() => carouselPrev()}>&lt;</div>
                    <div className={`carousel-nav-button next-button ${rightDisabled ? 'disabled' : ''}`} aria-label="Next" onClick={() => carouselNext()}>&gt;</div>
                </div>
            </div>
            <div className="carousel-container">
                <div className="carousel-wrapper">
                    <div className="carousel-content-wrapper" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
                        <div className={`carousel-content show-${show}`}
                            style={{ transform: `translateX(-${currentIndex * 100 / show}%)` }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Carousel;