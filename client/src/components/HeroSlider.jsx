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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  // Filter slides strictly by device mode:
  // On Mobile: ONLY use posters that have a dedicated mobileImageUrl
  // On Desktop: ONLY use posters that have an imageUrl
  const slides = useMemo(() => {
    const raw = posters.length > 0 ? posters : FALLBACK_POSTERS
    if (isMobile) {
      const mobilePosters = raw.filter((p) => p.mobileImageUrl && p.mobileImageUrl.trim() !== '')
      return mobilePosters.length > 0 ? mobilePosters : raw
    } else {
      const desktopPosters = raw.filter((p) => p.imageUrl && p.imageUrl.trim() !== '')
      return desktopPosters.length > 0 ? desktopPosters : raw
    }
  }, [posters, isMobile])

  // Reset index if slides change
  useEffect(() => {
    setCurrent(0)
  }, [slides.length, isMobile])

  const goTo = useCallback(
    (idx, dir = 1) => {
      if (isTransitioning || idx === current) return
      setDirection(dir)
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(idx)
        setIsTransitioning(false)
      }, 400)
    },
    [isTransitioning, current]
  )

  const prev = (e) => {
    e.stopPropagation()
    goTo((current - 1 + slides.length) % slides.length, -1)
  }
  const next = useCallback(() => goTo((current + 1) % slides.length, 1), [current, goTo, slides.length])
  const nextWithStop = (e) => {
    e.stopPropagation()
    next()
  }

  // Auto-advance timer
  useEffect(() => {
    if (slides.length <= 1) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 5500)
    return () => clearInterval(timerRef.current)
  }, [next, slides.length, current])

  const slide = slides[current % slides.length] || slides[0] || {}
  const destination = slide.linkUrl || '/products'

  // Determine current image strictly based on device
  const displayImage = isMobile
    ? (slide.mobileImageUrl || slide.imageUrl || '')
    : (slide.imageUrl || slide.mobileImageUrl || '')

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
      goTo((current - 1 + slides.length) % slides.length, -1)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  if (!loaded) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-slate-100 to-slate-200 h-[200px] sm:h-[280px] md:h-[340px]"
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
      className="group relative overflow-hidden rounded-2xl shadow-xl cursor-pointer h-[200px] sm:h-[280px] md:h-[340px]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleBannerClick()}
      aria-label="Go to products"
    >
      {/* Background image layer */}
      <div
        key={`${current}-${isMobile ? 'mob' : 'desk'}`}
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          isTransitioning
            ? direction > 0 ? 'opacity-0 scale-105' : 'opacity-0 scale-95'
            : 'opacity-100 scale-100'
        }`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={isMobile ? 'Mobile Event Poster' : 'Desktop Event Poster'}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-950" />
        )}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
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
      {slides.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-5 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo(i, i > current ? 1 : -1) }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default HeroSlider
