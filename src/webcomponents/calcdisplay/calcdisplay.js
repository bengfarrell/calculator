export default class CalcDisplay extends HTMLElement {
    set value(val) {
        this.dom.displayText.innerText = val;
    }

    connectedCallback() {
        this.innerHTML = `<div class="display-text">0</div>
                <style>
                    calc-display {
                      background-color: #858694;
                      color: white;
                      text-align: right;
                      font-weight: 200;
                      flex: 0 0 auto;
                      width: 100%;
                    }
                    
                    calc-display > div {
                      font-size: 20px;
                      padding: 8px 4px 0 4px;
                    }
                    
                    @media (min-width: 200px) and (min-height: 200px) {
                      calc-display > div {
                        font-size: 60px;
                        padding: 20px 16px 0 10px;
                      }
                    }
                    
                    @media (min-width: 300px) and (min-height: 200px) {
                      calc-display > div {
                        font-size: 70px;
                        padding: 20px 22px 0 10px;
                      }
                    }
                    
                    @media (min-width: 600px) and (min-height: 600px) {
                      calc-display > div {
                        font-size: 80px;
                        padding: 20px 30px 0 15px;
                      }
                    }
                    
                    @media (min-width: 800px) and (min-height: 800px) {
                      calc-display > div {
                        font-size: 100px;
                        padding: 20px 40px 0 20px;
                      }
                    }
                </style>`;

        this.dom = {
            displayText: this.querySelector('.display-text')
        };
    }
}

if (!customElements.get('calc-display')) {
    customElements.define('calc-display', CalcDisplay);
}
