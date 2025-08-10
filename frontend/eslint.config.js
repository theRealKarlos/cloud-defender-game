const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'vendor/**'
        ]
    },
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
                
                // Browser APIs
                fetch: 'readonly',
                AbortController: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URLSearchParams: 'readonly',
                FormData: 'readonly',
                navigator: 'readonly',
                screen: 'readonly',
                
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
                
                // Game engine classes (dynamically loaded via main.js initialisation)
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
                GameEngine: 'readonly',
                WaveManager: 'readonly',
                GameConditions: 'readonly',
                GameSecurity: 'readonly',
                Target: 'readonly',
                Missile: 'readonly',
                ExplosiveBomb: 'readonly',
                AWSIcons: 'readonly',
                
                // Application services (loaded via main.js initialisation)
                ApiService: 'readonly',
                initializeGame: 'readonly'
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
            // 'indent': ['error', 2], // Disabled - Prettier handles indentation
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            // 'comma-dangle': ['error', 'always-multiline'], // Disabled - Prettier handles trailing commas
            
            // Best practices
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-duplicate-imports': 'error',
            
            // Game-specific rules - more lenient for game coordinates and timing
            'no-magic-numbers': ['warn', { 
                'ignore': [
                    // Common numbers
                    -1, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 20, 24, 25, 30, 32, 35, 36, 40, 48, 50, 60, 64, 70, 75, 80, 82, 84, 100, 108, 120, 125, 150, 200, 250, 300, 350, 500, 600, 800, 1000, 1500, 2000, 5000, 10000, 20000, 30000, 60000, 1000000,
                    // Negative coordinates (common in games)
                    -2, -4, -6, -8, -10, -12, -25, -100,
                    // Decimal values (common in games)
                    0.01, 0.016, 0.05, 0.08, 0.1, 0.2, 0.25, 0.3, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.2, 1.5
                ],
                'ignoreArrayIndexes': true,
                'ignoreDefaultValues': true,
                'detectObjects': false
            }],
            
            // Performance considerations
            'no-loop-func': 'error',
            'no-inner-declarations': 'error'
        }
    },
    {
        // Specific rules for test files - corrected path pattern
        files: ['__tests__/**/*.test.js'],
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
            'no-magic-numbers': 'off', // Allow magic numbers in tests - testing often requires specific values
            'max-lines-per-function': 'off', // Allow longer test functions
            'no-unused-vars': 'off' // Allow unused vars in test setup
        }
    },
    {
        // Specific rules for game graphics/coordinate files
        files: ['js/aws-icons.js', 'js/renderer.js', 'js/target.js', 'js/missile.js'],
        rules: {
            'no-magic-numbers': 'off' // Allow magic numbers for coordinates and graphics
        }
    }
];