export default class CalcButton extends HTMLElement {
    static get CALC_BUTTON_PRESS() { return 'onCalcButtonPress'; }

    connectedCallback() {
        this.innerHTML = `<button>${this.getAttribute('name')}</button>
                            <style>
                                .component-button {
                                  display: inline-flex;
                                  width: 25%;
                                  flex: 1 0 auto;
                                }
                                
                                .component-button.wide {
                                  width: 50%;
                                }
                                
                                .component-button button {
                                  background-color: #E0E0E0;
                                  border: 0;
                                  font-size: 12px;
                                  margin: 0 1px 0 0;
                                  flex: 1 0 auto;
                                  padding: 0;
                                }
                                
                                .component-button:last-child button {
                                  margin-right: 0;
                                }
                                
                                .component-button.orange button {
                                  background-color: #F5923E;
                                  color: white;
                                }
                                
                                @media (min-width: 200px) and (min-height: 200px) {
                                  .component-button button {
                                    font-size: 25px;
                                  }
                                }
                                
                                @media (min-width: 300px) and (min-height: 300px) {
                                  .component-button button {
                                    font-size: 30px;
                                  }
                                }
                                
                                @media (min-width: 400px) and (min-height: 400px) {
                                  .component-button button {
                                    font-size: 35px;
                                  }
                                }
                                
                                @media (min-width: 500px) and (min-height: 500px) {
                                  .component-button button {
                                    font-size: 40px;
                                  }
                                }
                                
                                @media (min-width: 600px) and (min-height: 600px) {
                                  .component-button button {
                                    font-size: 60px;
                                  }
                                }
                                
                                @media (min-width: 800px) and (min-height: 800px) {
                                  .component-button button {
                                    font-size: 70px;
                                  }
                                }
                            </style>`;
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
