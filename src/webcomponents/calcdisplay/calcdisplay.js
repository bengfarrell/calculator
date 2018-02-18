// Webpack just bundles this in, no problem - but typcially module imports don't work with CSS
import '../../component/Display.css';

export default class CalcDisplay extends HTMLElement {
    set value(val) {
        this.dom.displayText.innerText = val;
    }

    connectedCallback() {
        this.innerHTML = '<div class="display-text">0</div>';
        this.dom = {
            displayText: this.querySelector('.display-text')
        };
    }
}

if (!customElements.get('calc-display')) {
    customElements.define('calc-display', CalcDisplay);
}
