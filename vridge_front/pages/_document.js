import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      }
    } finally {
      sheet.seal()
    }
  }

  render() {
    return (
      <Html lang="ko">
        <Head>
          {/* Global polyfill for self - MUST be first */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof self === 'undefined') {
                  try {
                    self = window || {};
                  } catch (e) {
                    self = {};
                  }
                }
                if (typeof global === 'undefined') {
                  try {
                    global = window || {};
                  } catch (e) {
                    global = {};
                  }
                }
              `,
            }}
          />
          <meta charSet="utf-8" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#1631F8" />
          <meta name="description" content="VideoPlanet - 영상 제작 프로젝트 관리 플랫폼" />
          
          {/* PWA 메타 태그 */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="VideoPlanet" />
          
          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/icon-120x120.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/icon-114x114.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/icon-76x76.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/icon-60x60.png" />
          <link rel="apple-touch-icon" sizes="57x57" href="/icon-57x57.png" />
          
          {/* 성능 최적화를 위한 리소스 힌트 */}
          <link rel="preconnect" href="https://videoplanet.up.railway.app" />
          <link rel="dns-prefetch" href="https://videoplanet.up.railway.app" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          
          {/* Critical CSS 인라인 (프로덕션에서) */}
          {process.env.NODE_ENV === 'production' && (
            <style jsx>{`
              .app-loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                z-index: 9999;
              }
              .route-loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #1631F8 0%, #0F23C9 100%);
                z-index: 9999;
                animation: loading 2s ease-in-out infinite;
              }
              @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100vw); }
              }
            `}</style>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
