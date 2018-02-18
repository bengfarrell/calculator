import '../../component/ButtonPanel.css';
import CalcButton from '../calcbutton/calcbutton.js';

export default class CalcButtonPanel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
                <div>
                  <calc-button name="AC"></calc-button>
                  <calc-button name="+/-"></calc-button>
                  <calc-button name="%"></calc-button>
                  <calc-button name="÷" orange></calc-button>
                </div>
                <div>
                  <calc-button name="7"></calc-button>
                  <calc-button name="8"></calc-button>
                  <calc-button name="9"></calc-button>
                  <calc-button name="x" orange></calc-button>
                </div>
                <div>
                  <calc-button name="4"></calc-button>
                  <calc-button name="5"></calc-button>
                  <calc-button name="6"></calc-button>
                  <calc-button name="-" orange></calc-button>
                </div>
                <div>
                  <calc-button name="1"></calc-button>
                  <calc-button name="2"></calc-button>
                  <calc-button name="3"></calc-button>
                  <calc-button name="+" orange></calc-button>
                </div>
                <div>
                  <calc-button name="0" wide></calc-button>
                  <calc-button name="."></calc-button>
                  <calc-button name="=" orange></calc-button>
                </div>`;

        this.classList.add('component-button-panel');
    }
}

if (!customElements.get('calc-buttonpanel')) {
    customElements.define('calc-buttonpanel', CalcButtonPanel);
}
