import CalcDisplay from '../calcdisplay/calcdisplay.js';
import CalcButtonPanel from '../calcbuttonpanel/calcbuttonpanel.js';
import CalcButton from '../calcbutton/calcbutton.js';
import Calculate from '../../logic/calculate.js';

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
        this.innerHTML = `
                <calc-display></calc-display>
                <calc-buttonpanel></calc-buttonpanel>
                
                <style>
                    calc-app {
                      display: flex;
                      flex-direction: column;;
                      flex-wrap: wrap;
                      height: 100%;
                    }
                </style>`;

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
