// For syntax highlighting only
const html = String.raw;

class ThemeToggle extends HTMLElement {
  constructor() {
    super();

    this.STORAGE_KEY = 'user-color-scheme';
    this.THEME_ATTRIBUTE = 'data-theme';
  }

  connectedCallback() {
    this.render();
  }

  // The theme in effect: the visitor's saved choice if they have made
  // one (re-applied to <html> before first paint by the inline script
  // in base.njk), otherwise the system preference.
  getEffectiveSetting() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Record the choice so it persists across pages, apply it to <html>,
  // and update the button label and status.
  applySetting(setting) {
    localStorage.setItem(this.STORAGE_KEY, setting);
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, setting);
    this.setButtonLabelAndStatus(setting);
  }

  toggleSetting() {
    this.applySetting(this.getEffectiveSetting() === 'dark' ? 'light' : 'dark');
  }

  setButtonLabelAndStatus(setting) {
    this.modeToggleButton.innerText = `${setting === 'dark' ? 'Light' : 'Dark'} theme`;
    this.modeStatusElement.innerText = `Color mode is now "${setting}"`;
  }

  render() {
    this.innerHTML = html`
      <div class="[ theme-toggle ] [ md:ta-right gap-top-500 ]">
        <div role="status" class="[ visually-hidden ][ js-mode-status ]"></div>
        <button class="[ button ] [ font-base text-base weight-bold ] [ js-mode-toggle ]">
          Dark theme
        </button>
      </div>
    `;

    this.afterRender();
  }

  afterRender() {
    this.modeToggleButton = document.querySelector('.js-mode-toggle');
    this.modeStatusElement = document.querySelector('.js-mode-status');

    this.modeToggleButton.addEventListener('click', evt => {
      evt.preventDefault();

      this.toggleSetting();
    });

    this.setButtonLabelAndStatus(this.getEffectiveSetting());
  }
}

if ('customElements' in window) {
  customElements.define('theme-toggle', ThemeToggle);
}

export default ThemeToggle;
