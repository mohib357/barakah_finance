// ============================================
// Animation Control - Developer Version
// ============================================
(function () {
    'use strict';

    // Developer controls - change these values directly in code
    const DEVELOPER_SETTINGS = {
        animations: false,     // true/false - Enable/disable all animations
        neumorphism: true,     // true/false - Enable/disable neumorphism effects
        rainbow: true,         // true/false - Enable/disable rainbow hover effect
        rainbowSpeed: 'slow'   // 'slow', 'medium', 'fast' - Rainbow animation speed
    };

    class AnimationControl {
        constructor() {
            this.settings = { ...DEVELOPER_SETTINGS };
            this.init();
        }

        init() {
            this.applyDeveloperSettings();
            this.listenForAdminChanges();
        }

        applyDeveloperSettings() {
            const body = document.body;

            // Remove existing classes
            body.classList.remove('no-animation', 'no-neumorphism', 'rainbow-enabled');

            // Apply developer settings
            if (!this.settings.animations) {
                body.classList.add('no-animation');
            }

            if (!this.settings.neumorphism) {
                body.classList.add('no-neumorphism');
            }

            if (this.settings.rainbow) {
                body.classList.add('rainbow-enabled');
                let animationName = 'rainbowSlow';
                let duration = '3s';

                switch (this.settings.rainbowSpeed) {
                    case 'fast':
                        animationName = 'rainbowFast';
                        duration = '1.2s';
                        break;
                    case 'medium':
                        animationName = 'rainbowMedium';
                        duration = '2s';
                        break;
                    case 'slow':
                    default:
                        animationName = 'rainbowSlow';
                        duration = '3s';
                        break;
                }

                body.style.setProperty('--rainbow-animation', `${animationName} ${duration} ease-in-out infinite`);
            }
        }

        listenForAdminChanges() {
            // Listen for settings updates from admin panel
            window.addEventListener('settingsUpdated', (e) => {
                if (e.detail) {
                    // Admin settings override developer settings
                    this.settings = { ...this.settings, ...e.detail };
                    this.applyDeveloperSettings();
                }
            });
        }

        // Manual override for testing
        forceSettings(settings) {
            this.settings = { ...this.settings, ...settings };
            this.applyDeveloperSettings();
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.animationControl = new AnimationControl();
        console.log('Animation Control initialized with developer settings');
    });
})();