import CalcButton from '../calcbutton/calcbutton.js';

export default class CalcButtonPanel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
                <div>
                  <calc-button name="AC" class="component-button"></calc-button>
                  <calc-button name="+/-" class="component-button"></calc-button>
                  <calc-button name="%" class="component-button"></calc-button>
                  <calc-button name="÷" class="component-button orange"></calc-button>
                </div>
                <div>
                  <calc-button name="7" class="component-button"></calc-button>
                  <calc-button name="8" class="component-button"></calc-button>
                  <calc-button name="9" class="component-button"></calc-button>
                  <calc-button name="x" class="component-button orange"></calc-button>
                </div>
                <div>
                  <calc-button name="4" class="component-button"></calc-button>
                  <calc-button name="5" class="component-button"></calc-button>
                  <calc-button name="6" class="component-button"></calc-button>
                  <calc-button name="-" class="component-button orange"></calc-button>
                </div>
                <div>
                  <calc-button name="1" class="component-button"></calc-button>
                  <calc-button name="2" class="component-button"></calc-button>
                  <calc-button name="3" class="component-button"></calc-button>
                  <calc-button name="+" class="component-button orange"></calc-button>
                </div>
                <div>
                  <calc-button name="0" class="component-button wide"></calc-button>
                  <calc-button name="." class="component-button"></calc-button>
                  <calc-button name="=" class="component-button orange"></calc-button>
                </div>
                
                <style>
                    .component-button-panel {
                      background-color: #858694;
                      display: flex;
                      flex-direction: row;
                      flex-wrap: wrap;
                      flex: 1 0 auto;
                    }
                    
                    .component-button-panel > div {
                      width: 100%;
                      margin-bottom: 1px;
                      flex: 1 0 auto;
                      display: flex;
                    }
                </style>`;
    }
}

if (!customElements.get('calc-buttonpanel')) {
    customElements.define('calc-buttonpanel', CalcButtonPanel);
}
