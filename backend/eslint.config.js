const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                
                // Jest globals (for test files)
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly'
            }
        },
        rules: {
            // Code quality rules
            'no-unused-vars': ['error', { 
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_' 
            }],
            'no-console': 'off', // Allow console for Lambda logging
            'no-debugger': 'error',
            
            // Style consistency
            'indent': ['error', 4],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            
            // Best practices
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-duplicate-imports': 'error',
            
            // Security rules
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            
            // Lambda-specific rules
            'no-process-exit': 'error', // Use proper error handling instead
            'no-sync': 'warn', // Prefer async operations in Lambda
            
            // Performance considerations
            'no-loop-func': 'error',
            'no-inner-declarations': 'error'
        }
    },
    {
        // Specific rules for test files
        files: ['**/*.test.js'],
        rules: {
            'no-magic-numbers': 'off', // Allow magic numbers in tests
            'max-lines-per-function': 'off', // Allow longer test functions
            'no-unused-vars': 'off' // Allow unused vars in test setup
        }
    }
];