import HTML from './calcdisplay.html.js';
import CSS from './calcdisplay.css.js';

export default class CalcDisplay extends HTMLElement {
    set value(val) {
        this.dom.displayText.innerText = val;
    }

    connectedCallback() {
        this.innerHTML = `${HTML.get()} ${CSS.get()}`;
        this.dom = {
            displayText: this.querySelector('.display-text')
        };
    }
}

if (!customElements.get('calc-display')) {
    customElements.define('calc-display', CalcDisplay);
}
