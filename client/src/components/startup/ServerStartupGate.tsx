import {
  ArrowRight,
  Check,
  Cloud,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import griffinRunnerUrl from '@/assets/startup/griffin-runner.png'
import { apiBaseUrl } from '@/services/api'

const RECENTLY_READY_KEY = 'siteao-server-ready-at'
const HIGH_SCORE_KEY = 'siteao-supply-sprint-high-score'
const RECENTLY_READY_WINDOW_MS = 5 * 60 * 1000
const SLOW_START_NOTICE_MS = 10 * 1000
const STARTUP_DEMO_READY_MS = 15 * 1000
const HEALTH_REQUEST_TIMEOUT_MS = 12 * 1000
const RETRY_DELAY_MS = 1200

interface ServerStartupGateProps {
  children: ReactNode
}

interface SupplySprintProps {
  serverReady: boolean
}

type GameStatus = 'idle' | 'running' | 'gameover'
type ObstacleKind = 'single-crate' | 'stacked-crates' | 'double-crates'

interface SprintObstacle {
  x: number
  width: number
  height: number
  counted: boolean
  kind: ObstacleKind
}

export function SupplySprint({ serverReady }: SupplySprintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const actionRef = useRef<() => void>(() => undefined)
  const releaseRef = useRef<() => void>(() => undefined)
  const statusRef = useRef<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try {
      const storedScore = Number(localStorage.getItem(HIGH_SCORE_KEY))
      return Number.isFinite(storedScore) && storedScore > 0 ? Math.floor(storedScore) : 0
    } catch {
      return 0
    }
  })
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle')

  const gameAction = useCallback(() => {
    actionRef.current()
  }, [])

  const releaseJump = useCallback(() => {
    releaseRef.current()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d') as CanvasRenderingContext2D

    if (!context) {
      return
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const griffinImage = new Image()
    griffinImage.src = griffinRunnerUrl
    let width = 0
    let height = 0
    let animationFrame = 0
    let previousTime = performance.now()
    let scoreValue = 0
    let scoreUpdateAt = 0
    let obstacleTimer = 0
    let playerY = 0
    let playerVelocity = 0
    let grounded = true
    let jumpHeld = false
    let jumpHoldTime = 0
    let autoHopMode = false
    let worldDistance = 0
    let obstacles: SprintObstacle[] = []

    function resize() {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    function drawCloud(x: number, y: number, scale: number) {
      context.fillStyle = 'rgba(255, 255, 255, 0.82)'
      context.beginPath()
      context.arc(x, y, 10 * scale, 0, Math.PI * 2)
      context.arc(x + 13 * scale, y - 5 * scale, 13 * scale, 0, Math.PI * 2)
      context.arc(x + 29 * scale, y, 10 * scale, 0, Math.PI * 2)
      context.fill()
    }

    function drawFallbackGriffin(x: number, groundY: number, time: number) {
      const runBounce =
        statusRef.current === 'running' && grounded ? Math.abs(Math.sin(time / 85)) * 2 : 0
      const y = groundY - 43 - playerY - runBounce

      context.save()
      context.translate(x, y)
      context.lineJoin = 'round'
      context.lineCap = 'round'

      // Sweeping lion tail.
      context.beginPath()
      context.moveTo(10, 25)
      context.bezierCurveTo(-7, 20, -10, 8, 1, 4)
      context.bezierCurveTo(-3, 12, 3, 17, 13, 17)
      context.strokeStyle = '#e84b0f'
      context.lineWidth = 5
      context.stroke()
      context.beginPath()
      context.moveTo(-1, 4)
      context.lineTo(-7, 1)
      context.lineTo(-5, 9)
      context.closePath()
      context.fillStyle = '#fbbf24'
      context.fill()

      // Feathered wing.
      const wingLift = statusRef.current === 'running' ? Math.sin(time / 105) * 3 : 0
      context.beginPath()
      context.moveTo(19, 22)
      context.bezierCurveTo(12, 5 + wingLift, 21, -4 + wingLift, 31, 11)
      context.bezierCurveTo(30, 2 + wingLift, 39, 5 + wingLift, 36, 19)
      context.bezierCurveTo(32, 25, 25, 28, 19, 22)
      context.closePath()
      context.fillStyle = '#ff8a2a'
      context.fill()
      context.strokeStyle = '#0c1a4d'
      context.lineWidth = 1.8
      context.stroke()
      context.beginPath()
      context.moveTo(22, 20)
      context.quadraticCurveTo(25, 10 + wingLift, 31, 8 + wingLift)
      context.moveTo(25, 22)
      context.quadraticCurveTo(30, 14 + wingLift, 35, 13 + wingLift)
      context.strokeStyle = 'rgba(12, 26, 77, 0.38)'
      context.lineWidth = 1.4
      context.stroke()

      // Lion body.
      context.beginPath()
      context.ellipse(24, 27, 18, 12, -0.08, 0, Math.PI * 2)
      context.fillStyle = '#f97316'
      context.fill()
      context.strokeStyle = '#0c1a4d'
      context.lineWidth = 2
      context.stroke()

      // Eagle neck and head.
      context.beginPath()
      context.moveTo(31, 25)
      context.bezierCurveTo(32, 14, 34, 7, 42, 6)
      context.bezierCurveTo(50, 5, 53, 11, 49, 17)
      context.bezierCurveTo(45, 22, 41, 25, 37, 29)
      context.closePath()
      context.fillStyle = '#ff9b35'
      context.fill()
      context.stroke()
      context.beginPath()
      context.moveTo(38, 8)
      context.lineTo(36, -1)
      context.lineTo(43, 6)
      context.closePath()
      context.fillStyle = '#f97316'
      context.fill()
      context.stroke()

      // Beak, eye, and brow.
      context.beginPath()
      context.moveTo(48, 11)
      context.lineTo(58, 14)
      context.lineTo(49, 18)
      context.closePath()
      context.fillStyle = '#fbbf24'
      context.fill()
      context.stroke()
      context.beginPath()
      context.arc(44, 10, 3, 0, Math.PI * 2)
      context.fillStyle = '#ffffff'
      context.fill()
      context.beginPath()
      context.arc(45, 10, 1.35, 0, Math.PI * 2)
      context.fillStyle = '#0c1a4d'
      context.fill()
      context.beginPath()
      context.moveTo(40, 7)
      context.lineTo(47, 6)
      context.strokeStyle = '#0c1a4d'
      context.lineWidth = 1.7
      context.stroke()

      // Running legs and talons.
      const stride = statusRef.current === 'running' && grounded ? Math.sin(time / 85) * 3 : 0
      context.strokeStyle = '#d97706'
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(18, 35)
      context.lineTo(17 + stride, 42)
      context.moveTo(34, 35)
      context.lineTo(35 - stride, 42)
      context.stroke()
      context.strokeStyle = '#0c1a4d'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(12 + stride, 42)
      context.lineTo(20 + stride, 42)
      context.moveTo(30 - stride, 42)
      context.lineTo(39 - stride, 42)
      context.stroke()

      context.restore()
    }

    function drawGriffin(x: number, groundY: number, time: number) {
      if (!griffinImage.complete || griffinImage.naturalWidth === 0) {
        drawFallbackGriffin(x, groundY, time)
        return
      }

      const isRunning = statusRef.current === 'running'
      const strideCycle = Math.sin(time / 72)
      const runBounce = isRunning && grounded ? Math.abs(strideCycle) * 3.5 : 0
      const griffinWidth = 100
      const griffinHeight = 80
      const y = groundY - griffinHeight - playerY - runBounce + 7
      const runningTilt = isRunning ? strideCycle * 0.035 : -0.015
      const horizontalStretch = isRunning ? 1 + Math.abs(strideCycle) * 0.025 : 1
      const verticalSquash = isRunning ? 1 - Math.abs(strideCycle) * 0.035 : 1

      // A soft shadow anchors the griffin while shrinking naturally during jumps.
      const shadowScale = Math.max(0.55, 1 - playerY / 150)
      context.save()
      context.translate(x + 51, groundY + 1)
      context.scale(shadowScale, 1)
      context.fillStyle = 'rgba(12, 26, 77, 0.16)'
      context.beginPath()
      context.ellipse(0, 0, 33, 5, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()

      if (isRunning && grounded) {
        // Dust puffs and short speed streaks make the single-frame mascot feel in motion.
        const dustPhase = (time / 8) % 28
        context.fillStyle = 'rgba(255, 255, 255, 0.58)'
        for (let puff = 0; puff < 3; puff += 1) {
          const puffX = x + 22 - ((dustPhase + puff * 11) % 31)
          const puffY = groundY - 4 - puff * 2
          context.beginPath()
          context.arc(puffX, puffY, 3.5 - puff * 0.55, 0, Math.PI * 2)
          context.fill()
        }

        context.strokeStyle = 'rgba(12, 26, 77, 0.2)'
        context.lineWidth = 2
        context.lineCap = 'round'
        for (let streak = 0; streak < 3; streak += 1) {
          const streakY = y + 24 + streak * 13
          const pulse = (time / 5 + streak * 14) % 24
          context.beginPath()
          context.moveTo(x - 12 - pulse, streakY)
          context.lineTo(x - 29 - pulse, streakY)
          context.stroke()
        }
      }

      context.save()
      context.translate(x + griffinWidth / 2, y + griffinHeight / 2)
      context.rotate(runningTilt)
      context.scale(horizontalStretch, verticalSquash)
      context.drawImage(
        griffinImage,
        -griffinWidth / 2,
        -griffinHeight / 2,
        griffinWidth,
        griffinHeight,
      )
      context.restore()
    }

    function drawCrate(x: number, y: number, crateWidth: number, crateHeight: number) {
      const wood = context.createLinearGradient(x, y, x + crateWidth, y + crateHeight)
      wood.addColorStop(0, '#f2a341')
      wood.addColorStop(0.52, '#d97721')
      wood.addColorStop(1, '#b95718')

      context.fillStyle = wood
      context.beginPath()
      context.roundRect(x, y, crateWidth, crateHeight, 3)
      context.fill()
      context.strokeStyle = '#713113'
      context.lineWidth = 2
      context.stroke()

      context.strokeStyle = 'rgba(113, 49, 19, 0.72)'
      context.lineWidth = 2.5
      context.beginPath()
      context.moveTo(x + 5, y + 5)
      context.lineTo(x + crateWidth - 5, y + crateHeight - 5)
      context.moveTo(x + crateWidth - 5, y + 5)
      context.lineTo(x + 5, y + crateHeight - 5)
      context.stroke()

      context.fillStyle = '#8d431b'
      context.fillRect(x, y + 5, crateWidth, 3)
      context.fillRect(x, y + crateHeight - 8, crateWidth, 3)
      context.fillStyle = '#ffd28b'
      context.fillRect(x + crateWidth * 0.36, y + crateHeight * 0.4, crateWidth * 0.28, 5)

      context.fillStyle = '#f6c36d'
      const cornerSize = Math.min(4, crateWidth * 0.13)
      context.fillRect(x + 2, y + 2, cornerSize, cornerSize)
      context.fillRect(x + crateWidth - cornerSize - 2, y + 2, cornerSize, cornerSize)
      context.fillRect(x + 2, y + crateHeight - cornerSize - 2, cornerSize, cornerSize)
      context.fillRect(
        x + crateWidth - cornerSize - 2,
        y + crateHeight - cornerSize - 2,
        cornerSize,
        cornerSize,
      )
    }

    function drawObstacle(obstacle: SprintObstacle, groundY: number) {
      if (obstacle.kind === 'stacked-crates') {
        const crateHeight = obstacle.height / 2
        drawCrate(obstacle.x + 2, groundY - crateHeight, obstacle.width - 2, crateHeight)
        drawCrate(obstacle.x, groundY - obstacle.height, obstacle.width - 2, crateHeight)
        return
      }

      if (obstacle.kind === 'double-crates') {
        const crateWidth = obstacle.width / 2
        drawCrate(obstacle.x, groundY - obstacle.height, crateWidth, obstacle.height)
        drawCrate(
          obstacle.x + crateWidth,
          groundY - obstacle.height,
          crateWidth,
          obstacle.height,
        )
        return
      }

      drawCrate(obstacle.x, groundY - obstacle.height, obstacle.width, obstacle.height)
    }

    function resetRun() {
      scoreValue = 0
      scoreUpdateAt = 0
      obstacleTimer = 0
      playerY = 0
      playerVelocity = 0
      grounded = true
      jumpHeld = false
      jumpHoldTime = 0
      autoHopMode = false
      obstacles = []
      setScore(0)
    }

    function setStatus(nextStatus: GameStatus) {
      statusRef.current = nextStatus
      setGameStatus(nextStatus)
    }

    function reportScore(nextScore: number) {
      setScore(nextScore)
      setHighScore((currentHighScore) => {
        if (nextScore <= currentHighScore) {
          return currentHighScore
        }

        try {
          localStorage.setItem(HIGH_SCORE_KEY, String(nextScore))
        } catch {
          // The score still works for this session if browser storage is unavailable.
        }

        return nextScore
      })
    }

    function startRun() {
      resetRun()
      obstacleTimer = 0.9
      setStatus('running')
    }

    actionRef.current = () => {
      if (statusRef.current !== 'running') {
        startRun()
        return
      }

      if (grounded) {
        playerVelocity = -410
        grounded = false
        jumpHeld = true
        jumpHoldTime = 0
        autoHopMode = false
      }
    }

    releaseRef.current = () => {
      jumpHeld = false
      autoHopMode = false

      // Releasing quickly trims the ascent into a shorter, predictable hop.
      if (playerVelocity < -340) {
        playerVelocity = -340
      }
    }

    function drawGamePrompt(title: string, subtitle: string) {
      const panelWidth = Math.min(250, width - 40)
      const panelX = (width - panelWidth) / 2
      const panelY = Math.max(38, height * 0.28)

      context.fillStyle = 'rgba(12, 26, 77, 0.9)'
      context.beginPath()
      context.roundRect(panelX, panelY, panelWidth, 74, 16)
      context.fill()
      context.textAlign = 'center'
      context.fillStyle = '#ffffff'
      context.font = '700 16px Montserrat, Poppins, sans-serif'
      context.fillText(title, width / 2, panelY + 29)
      context.fillStyle = '#bdeaf1'
      context.font = '600 11px Poppins, sans-serif'
      context.fillText(subtitle, width / 2, panelY + 52)
      context.textAlign = 'start'
    }

    function frame(time: number) {
      const delta = Math.min((time - previousTime) / 1000, 0.034)
      previousTime = time
      const groundY = height - 31
      const runnerX = Math.max(34, width * 0.14)

      if (statusRef.current === 'running' && !reduceMotion) {
        if (jumpHeld && !autoHopMode && jumpHoldTime < 0.19 && playerVelocity < 0) {
          playerVelocity -= 650 * delta
          jumpHoldTime += delta
        }

        playerVelocity += 1250 * delta
        playerY -= playerVelocity * delta
        worldDistance += delta * 95

        if (playerY <= 0) {
          playerY = 0

          if (jumpHeld) {
            // Holding through a landing chains quick, shorter hops until release.
            playerVelocity = -340
            grounded = false
            jumpHoldTime = 0.19
            autoHopMode = true
          } else {
            playerVelocity = 0
            grounded = true
          }
        }

        obstacleTimer -= delta
        if (obstacleTimer <= 0 && width > 0) {
          const obstacleRoll = Math.random()
          const canSpawnAdvancedObstacle = scoreValue >= 6
          const kind: ObstacleKind =
            canSpawnAdvancedObstacle && obstacleRoll > 0.78
              ? 'stacked-crates'
              : canSpawnAdvancedObstacle && obstacleRoll > 0.52
                ? 'double-crates'
                : 'single-crate'
          const obstacleSize =
            kind === 'stacked-crates'
              ? { width: 36, height: 58 }
              : kind === 'double-crates'
                ? { width: 64, height: 32 }
                : { width: 30 + Math.random() * 7, height: 29 + Math.random() * 8 }

          obstacles.push({
            x: width + 30,
            ...obstacleSize,
            counted: false,
            kind,
          })
          obstacleTimer = 1.35 + Math.random() * 1.15
        }

        const speedLevel = Math.floor(scoreValue / 10)
        const speed = 205 + speedLevel * 22
        obstacles.forEach((obstacle) => {
          obstacle.x -= speed * delta

          if (!obstacle.counted && obstacle.x + obstacle.width < runnerX) {
            obstacle.counted = true
            scoreValue += 1
            reportScore(scoreValue)
          }
        })
        obstacles = obstacles.filter((obstacle) => obstacle.x > -80)

        const collision = obstacles.some((obstacle) => {
          // Only the torso and legs count. The long tail, wings, and beak are forgiving.
          const runnerLeft = runnerX + 33
          const runnerRight = runnerX + 77
          const runnerBottom = groundY - playerY - 4
          const runnerTop = runnerBottom - 42
          const obstacleTop = groundY - obstacle.height

          return (
            runnerRight > obstacle.x + 3 &&
            runnerLeft < obstacle.x + obstacle.width - 3 &&
            runnerBottom > obstacleTop + 4 &&
            runnerTop < groundY
          )
        })

        if (collision) {
          setStatus('gameover')
        } else if (time - scoreUpdateAt > 150) {
          scoreUpdateAt = time
          reportScore(scoreValue)
        }
      }

      context.clearRect(0, 0, width, height)

      const sky = context.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, '#bfeaf3')
      sky.addColorStop(0.58, '#edf8ef')
      sky.addColorStop(1, '#fff4dc')
      context.fillStyle = sky
      context.fillRect(0, 0, width, height)

      context.fillStyle = 'rgba(252, 224, 3, 0.72)'
      context.beginPath()
      context.arc(width * 0.82, 42, 22, 0, Math.PI * 2)
      context.fill()
      drawCloud(width * 0.12, 39, 0.78)
      drawCloud(width * 0.53, 63, 0.92)

      context.fillStyle = '#9fd5bf'
      context.beginPath()
      context.moveTo(0, groundY)
      context.quadraticCurveTo(width * 0.18, groundY - 80, width * 0.38, groundY - 24)
      context.quadraticCurveTo(width * 0.65, groundY - 96, width, groundY - 42)
      context.lineTo(width, groundY)
      context.closePath()
      context.fill()

      context.fillStyle = '#65ad9f'
      context.beginPath()
      context.moveTo(0, groundY)
      context.quadraticCurveTo(width * 0.24, groundY - 48, width * 0.5, groundY - 12)
      context.quadraticCurveTo(width * 0.76, groundY - 64, width, groundY - 18)
      context.lineTo(width, groundY)
      context.closePath()
      context.fill()

      const depotOffset = -(worldDistance * 0.22) % 180
      context.fillStyle = 'rgba(12, 26, 77, 0.18)'
      for (let x = depotOffset - 80; x < width + 80; x += 180) {
        context.fillRect(x, groundY - 31, 58, 31)
        context.beginPath()
        context.moveTo(x - 5, groundY - 31)
        context.lineTo(x + 29, groundY - 48)
        context.lineTo(x + 63, groundY - 31)
        context.closePath()
        context.fill()
        context.fillStyle = 'rgba(255, 255, 255, 0.38)'
        context.fillRect(x + 10, groundY - 18, 12, 18)
        context.fillStyle = 'rgba(12, 26, 77, 0.18)'
      }

      context.fillStyle = '#f7dfb9'
      context.fillRect(0, groundY, width, height - groundY)
      context.fillStyle = 'rgba(12, 26, 77, 0.1)'
      const trackOffset = -(worldDistance * 1.8) % 42
      for (let x = trackOffset - 42; x < width; x += 42) {
        context.fillRect(x, groundY + 15, 23, 3)
      }

      context.fillStyle = '#0c1a4d'
      context.fillRect(0, groundY, width, 3)

      obstacles.forEach((obstacle) => drawObstacle(obstacle, groundY))
      drawGriffin(runnerX, groundY, time)

      if (statusRef.current === 'idle') {
        drawGamePrompt('Ready, Griffin?', 'Press SPACE to start')
      } else if (statusRef.current === 'gameover') {
        drawGamePrompt('Run over!', 'Press SPACE to restart')
      }

      animationFrame = requestAnimationFrame(frame)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space') {
        event.preventDefault()
        actionRef.current()
      } else if (event.code === 'ArrowUp' && statusRef.current === 'running') {
        event.preventDefault()
        actionRef.current()
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        releaseRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    animationFrame = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/60 shadow-[0_24px_80px_rgba(12,26,77,0.16)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-brand-navy/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#ff5a1f]" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-navy/70">
            Supply Sprint
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fce003]/25 px-2.5 py-1 font-mono text-[11px] font-bold text-brand-navy">
            <Trophy className="size-3 text-[#b66b00]" aria-hidden="true" />
            Best {highScore.toString().padStart(2, '0')}
          </span>
          <span className="rounded-full bg-brand-light-blue/15 px-2.5 py-1 font-mono text-[11px] font-bold text-brand-navy">
            Pace {Math.floor(score / 10) + 1}
          </span>
          <span className="rounded-full bg-brand-navy px-3 py-1 font-mono text-xs font-bold text-white">
            Score {score.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="block w-full cursor-pointer touch-manipulation text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35"
        onPointerDown={gameAction}
        onPointerUp={releaseJump}
        onPointerCancel={releaseJump}
        onPointerLeave={releaseJump}
        aria-label={`Supply Sprint game is ${gameStatus}. Press or tap to ${
          gameStatus === 'running' ? 'jump, and hold for a longer jump' : 'start the game'
        }.`}
      >
        <canvas ref={canvasRef} className="block h-60 w-full sm:h-72" />
      </button>

      <div className="flex items-center justify-between gap-3 bg-white/75 px-4 py-3 text-xs text-brand-navy/65 sm:px-5">
        <span>
          {serverReady
            ? 'Server ready—keep playing or continue to OpsTracker.'
            : gameStatus === 'gameover'
              ? 'Nice run. Press Space when you are ready to try again.'
              : gameStatus === 'idle'
                ? 'Press Space to begin your supply run.'
                : 'Tap for a short hop. Hold for a long jump, then keep hopping.'}
        </span>
        <button
          type="button"
          onPointerDown={gameAction}
          onPointerUp={releaseJump}
          onPointerCancel={releaseJump}
          onPointerLeave={releaseJump}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.repeat) {
              event.preventDefault()
              gameAction()
            }
          }}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              releaseJump()
            }
          }}
          className="shrink-0 rounded-full border border-brand-navy/15 bg-white px-3 py-1.5 font-bold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {gameStatus === 'idle' ? 'Start' : gameStatus === 'gameover' ? 'Restart' : 'Jump'}
        </button>
      </div>
    </div>
  )
}

export function ServerStartupGate({ children }: ServerStartupGateProps) {
  const searchParams = new URLSearchParams(window.location.search)
  const startupDemo = import.meta.env.DEV && searchParams.get('startupDemo') === '1'
  const playGame = searchParams.get('playGame') === '1'
  const [canEnterApp, setCanEnterApp] = useState(() => {
    if (startupDemo || playGame) {
      return false
    }

    const lastReadyAt = Number(sessionStorage.getItem(RECENTLY_READY_KEY))
    return Number.isFinite(lastReadyAt) && Date.now() - lastReadyAt < RECENTLY_READY_WINDOW_MS
  })
  const [serverReady, setServerReady] = useState(false)
  const [showSlowStartNotice, setShowSlowStartNotice] = useState(false)
  const [attempt, setAttempt] = useState(1)

  useEffect(() => {
    if (canEnterApp) {
      return
    }

    let active = true
    let retryTimer: number | undefined
    let demoReadyTimer: number | undefined

    const slowStartTimer = window.setTimeout(() => {
      if (active) {
        setShowSlowStartNotice(true)
      }
    }, SLOW_START_NOTICE_MS)

    if (startupDemo) {
      demoReadyTimer = window.setTimeout(() => {
        if (active) {
          setServerReady(true)
        }
      }, STARTUP_DEMO_READY_MS)

      return () => {
        active = false
        window.clearTimeout(slowStartTimer)
        window.clearTimeout(demoReadyTimer)
      }
    }

    async function checkServer() {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), HEALTH_REQUEST_TIMEOUT_MS)

      try {
        const response = await fetch(`${apiBaseUrl}/health?startup=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Health check returned ${response.status}`)
        }

        if (active) {
          sessionStorage.setItem(RECENTLY_READY_KEY, String(Date.now()))
          setServerReady(true)
        }
      } catch {
        if (active) {
          setAttempt((currentAttempt) => currentAttempt + 1)
          retryTimer = window.setTimeout(checkServer, RETRY_DELAY_MS)
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void checkServer()

    return () => {
      active = false
      window.clearTimeout(slowStartTimer)
      window.clearTimeout(retryTimer)
      window.clearTimeout(demoReadyTimer)
    }
  }, [canEnterApp, startupDemo])

  if (canEnterApp) {
    return children
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-8 text-brand-navy sm:px-6 lg:py-10">
      <div
        className="pointer-events-none absolute -left-24 -top-32 size-96 rounded-full bg-[#48adbf]/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 size-[28rem] rounded-full bg-[#ff9a52]/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <section className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-navy/10 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-navy/70 shadow-sm backdrop-blur">
            {serverReady ? (
              <Check className="size-4 text-[#178452]" aria-hidden="true" />
            ) : (
              <Cloud className="size-4 text-brand-light-blue" aria-hidden="true" />
            )}
            SITEAO OpsTracker
          </div>

          <p className="mb-3 font-subheading text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {serverReady ? 'Connection established' : 'Preparing your workspace'}
          </p>
          <h1 className="font-heading text-4xl font-extrabold tracking-[-0.04em] text-brand-navy sm:text-5xl">
            {serverReady ? 'Server is up!' : 'Warming things up.'}
          </h1>
          <p className="mt-4 text-base leading-7 text-brand-navy/65">
            {serverReady
              ? 'Everything is ready. Your inventory workspace is waiting for you.'
              : showSlowStartNotice
                ? 'This may take a while since the free server is starting. You can keep playing while we finish connecting.'
                : 'We’re checking the inventory server. Play a quick round while you wait.'}
          </p>

          <div
            className="mt-7 flex min-h-12 items-center justify-center lg:justify-start"
            aria-live="polite"
            aria-atomic="true"
          >
            {serverReady ? (
              <button
                type="button"
                onClick={() => setCanEnterApp(true)}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(217,54,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#bd3005] hover:shadow-[0_16px_34px_rgba(217,54,0,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                Continue to OpsTracker
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-navy/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-brand-navy/65 shadow-sm backdrop-blur">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-light-blue opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-brand-light-blue" />
                </span>
                Connecting to server
                <span className="sr-only">, attempt {attempt}</span>
              </div>
            )}
          </div>
        </section>

        <section className="relative">
          <div
            className="absolute -right-2 -top-5 z-20 hidden rotate-3 items-center gap-2 rounded-xl bg-[#fce003] px-3 py-2 text-xs font-extrabold text-brand-navy shadow-lg sm:flex"
            aria-hidden="true"
          >
            <Sparkles className="size-4" />
            SERVER WARM-UP MODE
          </div>
          <SupplySprint serverReady={serverReady} />
        </section>
      </div>
    </main>
  )
}
