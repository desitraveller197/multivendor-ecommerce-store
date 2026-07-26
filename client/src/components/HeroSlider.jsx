import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosConfig'

const FALLBACK_POSTERS = [
  {
    id: 'fb1',
    imageUrl: '/images/hero_default.png',
    linkUrl: '/products',
  },
]

function HeroSlider() {
  const [posters, setPosters] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    axiosInstance
      .get('/posters')
      .then((res) => {
        if (res.data && res.data.length > 0) setPosters(res.data)
        else setPosters(FALLBACK_POSTERS)
      })
      .catch(() => setPosters(FALLBACK_POSTERS))
      .finally(() => setLoaded(true))
  }, [])

  const slides = posters.length > 0 ? posters : FALLBACK_POSTERS
  const totalSlides = slides.length

  const safeIndex = totalSlides > 0 ? ((current % totalSlides) + totalSlides) % totalSlides : 0
  const slide = slides[safeIndex] || slides[0] || FALLBACK_POSTERS[0]

  const goTo = useCallback(
    (idx, dir = 1) => {
      if (isTransitioning || totalSlides <= 1) return
      setDirection(dir)
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(idx)
        setIsTransitioning(false)
      }, 400)
    },
    [isTransitioning, totalSlides]
  )

  const prev = (e) => {
    e.stopPropagation()
    goTo((safeIndex - 1 + totalSlides) % totalSlides, -1)
  }

  const next = useCallback(() => {
    goTo((safeIndex + 1) % totalSlides, 1)
  }, [safeIndex, totalSlides, goTo])

  const nextWithStop = (e) => {
    e.stopPropagation()
    next()
  }

  // Auto-advance timer
  useEffect(() => {
    if (totalSlides <= 1) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 5500)
    return () => clearInterval(timerRef.current)
  }, [next, totalSlides])

  const destination = slide.linkUrl || '/products'
  const displayImage = slide.imageUrl || slide.mobileImageUrl || ''

  const handleBannerClick = () => {
    navigate(destination)
  }

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    if (diff > 40) {
      next()
    } else if (diff < -40) {
      goTo((safeIndex - 1 + totalSlides) % totalSlides, -1)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  if (!loaded) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-slate-100 to-slate-200 h-[180px] xs:h-[220px] sm:h-[300px] md:h-[360px] lg:h-[400px]"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      onClick={handleBannerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative overflow-hidden rounded-2xl shadow-xl cursor-pointer w-full h-[180px] xs:h-[220px] sm:h-[300px] md:h-[360px] lg:h-[400px] bg-slate-900"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleBannerClick()}
      aria-label="Go to products"
    >
      {/* Background image layer */}
      <div
        key={safeIndex}
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          isTransitioning
            ? direction > 0 ? 'opacity-0 scale-105' : 'opacity-0 scale-95'
            : 'opacity-100 scale-100'
        }`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Hero Banner"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-950" />
        )}
      </div>

      {/* Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white opacity-0 sm:opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 hover:bg-black/50 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextWithStop}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white opacity-0 sm:opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 hover:bg-black/50 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-5 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo(i, i > safeIndex ? 1 : -1) }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === safeIndex ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroSlider
