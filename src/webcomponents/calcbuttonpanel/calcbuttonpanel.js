import HTML from './calcbuttonpanel.html.js';
import CSS from './calcbuttonpanel.css.js';

export default class CalcButtonPanel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `${HTML.get()} ${CSS.get()}`;
    }
}

if (!customElements.get('calc-buttonpanel')) {
    customElements.define('calc-buttonpanel', CalcButtonPanel);
}
