import Head from 'next/head'
import { Tetris } from '../components/Tetris'

export const Home = (): JSX.Element => (
  <div className="container">
    <Head>
      <title>Tetris</title>
      <link rel="icon" href="/favicon.ico" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"
      ></meta>
    </Head>

    <main>
      <Tetris />
    </main>

    <style jsx global>{`
      html,
      body {
        background-color: #555555;
        color: #f0f0f0;
        text-align: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `}</style>
  </div>
)

export default Home
