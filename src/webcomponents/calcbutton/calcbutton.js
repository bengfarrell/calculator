import HTML from './calcbutton.html.js';
import CSS from './calcbutton.css.js';

export default class CalcButton extends HTMLElement {
    static get CALC_BUTTON_PRESS() { return 'onCalcButtonPress'; }

    connectedCallback() {
        this.innerHTML = `  ${HTML.get(
                                {name: this.getAttribute('name')} 
                            )} 
                            ${CSS.get()}`;
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
