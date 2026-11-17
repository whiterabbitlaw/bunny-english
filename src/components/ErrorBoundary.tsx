import { Component, type ReactNode } from 'react'
import { buttonClass } from '../lib/button-style.ts'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
        <h1 className="font-display text-4xl text-ink">小兔绊了一下</h1>
        <p className="text-lg leading-8 text-ink-soft">页面出错了。已经记下的星星还在这台设备上，刷新后可以继续。</p>
        <button type="button" className={buttonClass()} onClick={() => window.location.reload()}>
          重新打开
        </button>
      </div>
    )
  }
}
