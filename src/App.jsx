import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { initialCards } from './data/cards'
import { reorderList } from './utils/reorder'

const LONG_PRESS_MS = 260

function App() {
  const [cards, setCards] = useState(initialCards)
  const [activeIndex, setActiveIndex] = useState(2)
  const [dragState, setDragState] = useState(null)

  const railRef = useRef(null)
  const holdTimerRef = useRef(null)
  const pointerDataRef = useRef(null)
  const dragStateRef = useRef(dragState)

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const visibleCards = useMemo(() => cards, [cards])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const handleScroll = () => {
      const center = rail.scrollLeft + rail.clientWidth / 2
      const items = [...rail.querySelectorAll('[data-card-index]')]
      let bestIndex = 0
      let bestDistance = Number.POSITIVE_INFINITY

      items.forEach((item) => {
        const itemCenter = item.offsetLeft + item.clientWidth / 2
        const distance = Math.abs(center - itemCenter)
        const index = Number(item.dataset.cardIndex)
        if (distance < bestDistance) {
          bestDistance = distance
          bestIndex = index
        }
      })

      setActiveIndex(bestIndex)
    }

    handleScroll()
    rail.addEventListener('scroll', handleScroll, { passive: true })
    return () => rail.removeEventListener('scroll', handleScroll)
  }, [cards.length])

  useEffect(() => {
    const onPointerMove = (event) => {
      const pointer = pointerDataRef.current
      const activeDrag = dragStateRef.current
      if (!pointer || !activeDrag) return

      const deltaX = event.clientX - pointer.startX
      const deltaY = event.clientY - pointer.startY
      const rail = railRef.current
      if (!rail) return

      const elements = [...rail.querySelectorAll('[data-card-index]')]
      let overIndex = activeDrag.overIndex
      let overElement = null

      for (const element of elements) {
        const rect = element.getBoundingClientRect()
        if (event.clientX >= rect.left && event.clientX <= rect.right) {
          overIndex = Number(element.dataset.cardIndex)
          overElement = rect
          break
        }
      }

      if (overElement) {
        const beforeMid = event.clientX < overElement.left + overElement.width / 2
        overIndex = beforeMid ? overIndex : Math.min(cards.length - 1, overIndex + 1)
      }

      const nextPreview = reorderList(cards, activeDrag.fromIndex, Math.max(0, Math.min(cards.length - 1, overIndex)))

      setDragState({
        ...activeDrag,
        x: deltaX,
        y: deltaY,
        overIndex: Math.max(0, Math.min(cards.length - 1, overIndex)),
        previewCards: nextPreview,
      })

      if (Math.abs(deltaX) > 20 && rail) {
        const threshold = 96
        const railRect = rail.getBoundingClientRect()
        if (event.clientX > railRect.right - threshold) {
          rail.scrollBy({ left: 18, behavior: 'auto' })
        } else if (event.clientX < railRect.left + threshold) {
          rail.scrollBy({ left: -18, behavior: 'auto' })
        }
      }
    }

    const finishDrag = () => {
      const activeDrag = dragStateRef.current
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
      pointerDataRef.current = null

      if (!activeDrag) return

      const toIndex = Math.max(0, Math.min(cards.length - 1, activeDrag.overIndex))
      setCards((current) => reorderList(current, activeDrag.fromIndex, toIndex))
      setActiveIndex(toIndex)
      setDragState(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [cards])

  const startHold = (event, index) => {
    if (dragStateRef.current) return

    pointerDataRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
    }

    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => {
      const previewCards = reorderList(cards, index, index)
      setDragState({
        cardId: cards[index].id,
        fromIndex: index,
        overIndex: index,
        x: 0,
        y: 0,
        previewCards,
      })
    }, LONG_PRESS_MS)
  }

  const cancelHold = () => {
    if (!dragStateRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
      pointerDataRef.current = null
    }
  }

  const renderedCards = dragState?.previewCards ?? visibleCards

  return (
    <main className="app-shell">
      <div className="app-bg app-bg-a" />
      <div className="app-bg app-bg-b" />

      <header className="topbar">
        <div>
          <p className="eyebrow">Elegant Deck</p>
          <h1>Deck gallery prototype</h1>
        </div>
        <p className="topbar-copy">
          Swipe through the deck. Long-press a card, drag, slide, and release to reorder.
        </p>
      </header>

      <section className="deck-stage" aria-label="Card deck gallery">
        <div className="deck-frame">
          <div className="deck-highlight" />
          <div className="deck-rail" ref={railRef}>
            {renderedCards.map((card, index) => {
              const isDragged = dragState?.cardId === card.id
              const displayIndex = dragState && index >= dragState.overIndex && index < dragState.fromIndex ? index + 1 : index
              const distance = Math.abs(activeIndex - displayIndex)
              const depth = Math.max(0, 10 - distance)

              return (
                <article
                  key={card.id}
                  className={[
                    'deck-card',
                    index === activeIndex ? 'is-active' : '',
                    isDragged ? 'is-dragged' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-card-index={index}
                  style={{
                    zIndex: isDragged ? 30 : depth,
                    '--drag-x': isDragged ? `${dragState?.x ?? 0}px` : '0px',
                    '--drag-y': isDragged ? `${dragState?.y ?? 0}px` : '0px',
                  }}
                  onPointerDown={(event) => startHold(event, index)}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                >
                  <div className="card-sheen" />
                  <div className="card-number">{card.number}</div>
                  <div className="card-icons" aria-hidden="true">
                    {card.icons.map((icon) => (
                      <span key={icon}>{icon}</span>
                    ))}
                  </div>
                  <div className="card-body">
                    <h2>{card.title}</h2>
                    <p>{card.effect}</p>
                  </div>
                  <div className="card-footer">
                    <span>Hold</span>
                    <span>Drag</span>
                    <span>Place</span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="bottom-copy">
        <div>
          <span className="stat-label">Cards</span>
          <strong>{cards.length}</strong>
        </div>
        <div>
          <span className="stat-label">Focus</span>
          <strong>{cards[activeIndex]?.title ?? cards[0].title}</strong>
        </div>
      </footer>
    </main>
  )
}

export default App
