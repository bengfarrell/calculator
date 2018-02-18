// Webpack just bundles this in, no problem - but typcially module imports don't work with CSS
import '../../component/Button.css';

export default class CalcButton extends HTMLElement {
    static get CALC_BUTTON_PRESS() { return 'onCalcButtonPress'; }
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = '<button>' + this.getAttribute('name') + ' </button>';
        this.classList.add('component-button');
        if (this.hasAttribute('orange')) {
            this.classList.add('orange');
        }
        if (this.hasAttribute('wide')) {
            this.classList.add('wide');
        }
        this.querySelector('button').addEventListener('click', e => this.onButtonClick(e));
    }

    onButtonClick(e) {
        let ce = new CustomEvent(CalcButton.CALC_BUTTON_PRESS,
            {   bubbles: true,
                cancelable: false,
                detail: { name: this.getAttribute('name') }});
        this.dispatchEvent(ce);
    }
}

if (!customElements.get('calc-button')) {
    customElements.define('calc-button', CalcButton);
}
