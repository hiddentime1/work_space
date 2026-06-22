import type { Config } from 'tailwindcss'

/**
 * Toss(TDS) 디자인 토큰을 Tailwind 팔레트로 리매핑.
 * 기존 코드의 gray/blue/red/green 등 클래스가 자동으로 Toss 톤을 갖도록 한다.
 * 출처: .claude/data/references/toss/DESIGN.md
 */

// Toss 따뜻한 그레이 스케일 (grey50 → grey900)
const tossGray = {
  50: '#f9fafb',
  100: '#f2f4f6',
  200: '#e5e8eb',
  300: '#d1d6db',
  400: '#b0b8c1',
  500: '#8b95a1',
  600: '#6b7684',
  700: '#4e5968',
  800: '#333d4b',
  900: '#191f28',
}

// Toss Blue (blue500 #3182f6) — 유일한 인터랙션 색
const tossBlue = {
  50: '#e8f3ff',
  100: '#c9e2ff',
  200: '#9dc9ff',
  300: '#69aaff',
  400: '#4593fc',
  500: '#3182f6',
  600: '#2272eb',
  700: '#1b64da',
  800: '#1957c2',
  900: '#194aa6',
}

// Toss Green (success #03b26c)
const tossGreen = {
  50: '#e7f9f1',
  100: '#c3f0dd',
  200: '#8fe3bf',
  300: '#4fd09b',
  400: '#1fbe81',
  500: '#03b26c',
  600: '#029a5d',
  700: '#027e4c',
  800: '#02633c',
  900: '#014b2e',
}

// Toss Red (error #f04452)
const tossRed = {
  50: '#fdecee',
  100: '#fbd5d9',
  200: '#f8aeb6',
  300: '#f57f8c',
  400: '#f25e6e',
  500: '#f04452',
  600: '#e42939',
  700: '#c41f2d',
  800: '#9c1b27',
  900: '#7a1820',
}

// Toss Orange (warning #fe9800)
const tossOrange = {
  50: '#fff4e5',
  100: '#ffe2bf',
  200: '#ffcd8c',
  300: '#ffb558',
  400: '#fea62e',
  500: '#fe9800',
  600: '#e08400',
  700: '#bd6e00',
  800: '#965700',
  900: '#754400',
}

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: tossGray,
        // Toss: blue는 유일한 인터랙션 색. 기존의 무지개(purple/pink/cyan) 사용처를
        // 모두 blue/green으로 수렴시켜 그라데이션을 차분하게 만든다.
        blue: tossBlue,
        indigo: tossBlue,
        purple: tossBlue,
        violet: tossBlue,
        pink: tossBlue,
        green: tossGreen,
        emerald: tossGreen,
        teal: tossGreen,
        cyan: tossBlue,
        red: tossRed,
        rose: tossRed,
        orange: tossOrange,
        amber: tossOrange,
        // 토스 브랜드/시맨틱 별칭
        toss: {
          blue: '#3182f6',
          'blue-hover': '#2272eb',
          'blue-light': '#e8f3ff',
          ink: '#191f28',
          surface: '#f2f4f6',
        },
      },
      fontFamily: {
        sans: [
          'Toss Product Sans',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        // Toss radius scale: 8 inputs · 12 cards · 16 sheets/featured
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        // Toss는 단일 레이어 순수 블랙, 낮은 투명도
        sm: '0px 1px 3px rgba(0,0,0,0.06)',
        DEFAULT: '0px 2px 8px rgba(0,0,0,0.08)',
        md: '0px 2px 8px rgba(0,0,0,0.08)',
        lg: '0px 4px 12px rgba(0,0,0,0.12)',
        xl: '0px 8px 24px rgba(0,0,0,0.16)',
        '2xl': '0px 8px 24px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
export default config
