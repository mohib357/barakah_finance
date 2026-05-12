// C: \Project\Barakah_Finance\js\admin - settings.js

// ════════ Admin Settings ════════
class AdminHeroSettings {
    constructor() {
        this.settings = {
            animations: true,
            neumorphism: true,
            rainbow: false,
            rainbowSpeed: 'slow'
        };
        this.loadFromStorage();
        this.applySettings();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('barakah_admin_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('barakah_admin_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        const body = document.body;
        body.classList.remove('no-animation', 'no-neumorphism', 'rainbow-enabled');
        if (!this.settings.animations) {
            body.classList.add('no-animation');
        }
        if (!this.settings.neumorphism) {
            body.classList.add('no-neumorphism');
        }
        if (this.settings.rainbow) {
            body.classList.add('rainbow-enabled');
            // Set rainbow speed as CSS variable
            let animationName = 'rainbowSlow';
            let duration = '4s';

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
                    duration = '4s';
                    break;
            }

            body.style.setProperty('--rainbow-animation', `${animationName} ${duration} ease-in-out infinite`);
        } else {
            body.style.removeProperty('--rainbow-animation');
        }
    }

    //   ════════ Public Methods ════════
    updateSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveToStorage();
            this.applySettings();
            window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: this.settings }));
        }
    }

    updateMultipleSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.saveToStorage();
        this.applySettings();
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: this.settings }));
    }

    getSettings() {
        return { ...this.settings };
    }
}

// ════════ Initialize Admin Settings ════════
document.addEventListener('DOMContentLoaded', () => {
    window.adminHeroSettings = new AdminHeroSettings();
    console.log('Admin Hero Settings initialized:', window.adminHeroSettings.getSettings());
});