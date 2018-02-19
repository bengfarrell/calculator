export default {
    get(params) {
        return `
                <style>
                    calc-buttonpanel {
                      background-color: #858694;
                      display: flex;
                      flex-direction: row;
                      flex-wrap: wrap;
                      flex: 1 0 auto;
                    }
                    
                    calc-buttonpanel > div {
                      width: 100%;
                      margin-bottom: 1px;
                      flex: 1 0 auto;
                      display: flex;
                    }
                </style>`;
    }
}
