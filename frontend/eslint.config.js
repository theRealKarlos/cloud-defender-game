const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                
                // Canvas API
                CanvasRenderingContext2D: 'readonly',
                HTMLCanvasElement: 'readonly',
                
                // Performance API
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                
                // Jest globals (for test files)
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
                
                // Node.js globals (for test files)
                module: 'readonly',
                require: 'readonly',
                global: 'readonly',
                
                // Game engine classes (loaded via script tags)
                Entity: 'readonly',
                EntityManager: 'readonly',
                SpatialGrid: 'readonly',
                InputManager: 'readonly',
                GameState: 'readonly',
                GameStateManager: 'readonly',
                Renderer: 'readonly',
                UIManager: 'readonly',
                GameLoop: 'readonly',
                EventHandler: 'readonly',
                GameEngine: 'readonly'
            }
        },
        rules: {
            // Code quality rules
            'no-unused-vars': ['error', { 
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_' 
            }],
            'no-console': 'off', // Allow console for game debugging
            'no-debugger': 'warn',
            'no-alert': 'off', // Allow alerts for error handling
            
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
            
            // Game-specific rules
            'no-magic-numbers': ['warn', { 
                'ignore': [0, 1, -1, 2, 5, 9, 10, 16, 20, 30, 32, 35, 36, 40, 48, 50, 60, 64, 100, 120, 150, 200, 1000],
                'ignoreArrayIndexes': true 
            }],
            
            // Performance considerations
            'no-loop-func': 'error',
            'no-inner-declarations': 'error'
        }
    },
    {
        // Specific rules for test files
        files: ['tests/**/*.test.js'],
        languageOptions: {
            globals: {
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
                
                // Node.js globals (for test files)
                module: 'readonly',
                require: 'readonly',
                global: 'readonly'
            }
        },
        rules: {
            'no-magic-numbers': 'off', // Allow magic numbers in tests
            'max-lines-per-function': 'off', // Allow longer test functions
            'no-unused-vars': 'off' // Allow unused vars in test setup
        }
    }
];