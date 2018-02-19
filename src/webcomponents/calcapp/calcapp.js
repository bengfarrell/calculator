import CalcButton from '../calcbutton/calcbutton.js';
import Calculate from '../../logic/calculate.js';
import HTML from './calcapp.html.js';
import CSS from './calcapp.css.js';

export default class CalcApp extends HTMLElement {
    constructor() {
        super();
        this.state = {
            total: null,
            next: null,
            operation: null,
        };
    }

    connectedCallback() {
        this.innerHTML = `${HTML.get()} ${CSS.get()}`;

        this.dom = {
            buttonpanel: this.querySelector('calc-buttonpanel'),
            display: this.querySelector('calc-display')
        };

        this.dom.buttonpanel.addEventListener(CalcButton.CALC_BUTTON_PRESS, e => this.onButtonPress(e));
    }

    onButtonPress(event) {
        // React's setState overlaid return values over the original - a simple for loop can do the same
        let calc = Calculate(this.state, event.detail.name);
        for (let c in calc) {
            this.state[c] = calc[c];
        }
        this.dom.display.value = this.state.next || this.state.total || '0';
    }
}

if (!customElements.get('calc-app')) {
    customElements.define('calc-app', CalcApp);
}
