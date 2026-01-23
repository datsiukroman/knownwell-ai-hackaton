import React, { useState } from 'react'
import foodImg from '../assets/food.svg'

// Realistic nutrition-related achievements
const MOCK = [
  { id: 1, name: 'Green Machine', pct: 1.0, status: 'complete', img: foodImg, description: 'Eat a large serving of leafy greens in a meal.' },
  { id: 2, name: '7-Day Veggies Streak', pct: 0.75, status: 'in-progress', img: foodImg, description: 'Log at least one serving of vegetables every day for 7 days.' },
  { id: 3, name: 'Protein Power (20g+ / meal)', pct: 0.45, status: 'in-progress', img: foodImg, description: 'Consume 20g or more protein in a single meal.' },
  { id: 4, name: 'Hydration Hero (8 cups)', pct: 0.6, status: 'in-progress', img: foodImg, description: 'Drink 8 cups (≈2L) of fluids in one day.' },
  { id: 5, name: 'Fiber Focus (25g+ / day)', pct: 0.2, status: 'in-progress', img: foodImg, description: 'Reach 25g or more of fiber across a day.' },
  { id: 6, name: 'Breakfast Regular (21 days)', pct: 0.0, status: 'locked', img: foodImg, description: 'Have breakfast consistently for 21 days to unlock.' },
  { id: 7, name: 'Mindful Eating 3x Week', pct: 0.35, status: 'in-progress', img: foodImg, description: 'Practice a mindful meal (no distractions) at least 3 times this week.' },
  { id: 8, name: 'Whole Grains Champion', pct: 0.55, status: 'in-progress', img: foodImg, description: 'Include whole grains (e.g., oats, brown rice) in your meals regularly.' },
  { id: 9, name: 'Sugar Cutback (reduce sweets)', pct: 0.12, status: 'in-progress', img: foodImg, description: 'Reduce sugary snacks/soft drinks compared to your baseline week.' },
  { id: 10, name: 'Meal Prep Starter', pct: 0.0, status: 'locked', img: foodImg, description: 'Prepare at least one home-cooked meal in advance this week.' }
]

export default function Achievements() {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  function showTip(e: React.MouseEvent | React.FocusEvent, a: any) {
    const target = e.currentTarget as HTMLElement
    // prefer the image bounds so tooltip sits close to the icon, fall back to card
    const imgEl = target.querySelector('.inner img') as HTMLElement | null
    const rect = imgEl ? imgEl.getBoundingClientRect() : target.getBoundingClientRect()
    // position slightly to the right of the image (shifted 25px further)
    setTip({ x: rect.right + 33, y: rect.top + rect.height / 2, text: a.description })
  }
  function hideTip() {
    setTip(null)
  }

  return (
    <div className="achievements-grid">
      {MOCK.map((a) => (
        <div
          key={a.id}
          className={`achievement-card ${a.status}`}
          tabIndex={0}
          onMouseEnter={(e) => showTip(e, a)}
          onMouseLeave={hideTip}
          onFocus={(e) => showTip(e, a)}
          onBlur={hideTip}
        >
          <div className="ring" style={{ ['--pct' as any]: a.pct }} aria-hidden>
            <div className="inner">
              <img src={a.img} alt={a.name} />
            </div>
          </div>
          <div className="label">{a.name}</div>
        </div>
      ))}

      {tip && (
        <div
          className="achievement-tooltip"
          role="tooltip"
          style={{ left: tip.x, top: tip.y, position: 'fixed' }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}
