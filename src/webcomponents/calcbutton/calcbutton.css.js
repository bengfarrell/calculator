export default {
    get(params) {
        return `<style>
                    calc-button {
                      display: inline-flex;
                      width: 25%;
                      flex: 1 0 auto;
                    }
                    
                    calc-button.wide {
                      width: 50%;
                    }
                    
                    calc-button button {
                      background-color: #E0E0E0;
                      border: 0;
                      font-size: 12px;
                      margin: 0 1px 0 0;
                      flex: 1 0 auto;
                      padding: 0;
                    }
                    
                    calc-button:last-child button {
                      margin-right: 0;
                    }
                    
                    calc-button.orange button {
                      background-color: #F5923E;
                      color: white;
                    }
                    
                    @media (min-width: 200px) and (min-height: 200px) {
                      calc-button button {
                        font-size: 25px;
                      }
                    }
                    
                    @media (min-width: 300px) and (min-height: 300px) {
                      calc-button button {
                        font-size: 30px;
                      }
                    }
                    
                    @media (min-width: 400px) and (min-height: 400px) {
                      calc-button button {
                        font-size: 35px;
                      }
                    }
                    
                    @media (min-width: 500px) and (min-height: 500px) {
                      calc-button button {
                        font-size: 40px;
                      }
                    }
                    
                    @media (min-width: 600px) and (min-height: 600px) {
                      calc-button button {
                        font-size: 60px;
                      }
                    }
                    
                    @media (min-width: 800px) and (min-height: 800px) {
                      calc-button button {
                        font-size: 70px;
                      }
                    }
                </style>`
    }
}
