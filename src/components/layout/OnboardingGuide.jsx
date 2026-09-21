import { useState } from 'react'
import Icon from '../ui/Icon'

const steps = [
  { eyebrow: '01 · 전국 지도', title: '먼저 색으로 취약 신호를 봅니다.', body: '전국 화면에서는 시도별 색상과 취약도만 빠르게 읽습니다. 관심 지역을 클릭하면 해당 시도의 시군구 지도로 확대됩니다.' },
  { eyebrow: '02 · 상세 분석', title: '왜 취약한지 근거를 확인합니다.', body: '편의점 중심 소비, 신선 유통 소비, 1인가구 규모와 생활폐기물 통계를 함께 보며 인프라 결핍의 방향을 확인합니다.' },
  { eyebrow: '03 · 정책 결론', title: '마지막에 실행 순서를 얻습니다.', body: '정책 제안 리포트를 생성하면 우선순위, 판정 근거, 500m 회수 거점 검토와 현장 확인 순서가 정리됩니다.' },
]

export default function OnboardingGuide() {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const close = (event) => event.currentTarget.closest('.guide-backdrop')?.remove()
  return <div className="guide-backdrop"><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title"><button type="button" className="guide-close" aria-label="사용법 안내 닫기" onClick={close}><Icon name="close" size={20} /></button><div className="guide-progress"><span>{current.eyebrow}</span><b>{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</b></div><h2 id="guide-title">{current.title}</h2><p>{current.body}</p><div className="guide-dots" aria-hidden="true">{steps.map((item, index) => <i className={index === step ? 'active' : ''} key={item.eyebrow} />)}</div><div className="guide-actions"><button type="button" className="guide-prev" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><Icon name="arrow" size={16} /> 이전</button>{step < steps.length - 1 ? <button type="button" className="guide-next" onClick={() => setStep((value) => value + 1)}>다음 <Icon name="arrow" size={16} /></button> : <button type="button" className="guide-next" onClick={close}>시작하기 <Icon name="arrow" size={16} /></button>}</div></section></div>
}
