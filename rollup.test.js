import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

export default {
    entry: 'src/Queue.js',
    format: 'umd',
    moduleName: 'Queue',
    plugins: [
      eslint({ exclude: 'node_modules/**' }),
      babel({
        exclude: 'node_modules/**',
      })
    ],
    dest: 'test/Queue.js',
};
