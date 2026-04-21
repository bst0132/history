
import path = require('path');
import { NodeConfigTSPlugin } from 'node-config-ts/webpack';

const BUILD_ROOT = path.join(__dirname, '../dist/server');

module.exports = NodeConfigTSPlugin({
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: 'production',

  target: 'node',

  node: {
    __dirname: false,
    __filename: false
  },

  entry: path.resolve('server','app.ts'),

  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.server.json',
          }
        }
      },
    ],
  },
  // import 文で .ts ファイルを解決するため
  // これを定義しないと import 文で拡張子を書く必要が生まれる。
  // フロントエンドの開発では拡張子を省略することが多いので、
  // 記載したほうがトラブルに巻き込まれにくい。
  resolve: {
    // 拡張子を配列で指定
    extensions: [
      '.ts', '.js', '.json'
    ],
  },

  output: {
    filename: 'server.js',
    path: BUILD_ROOT,
  }
});
