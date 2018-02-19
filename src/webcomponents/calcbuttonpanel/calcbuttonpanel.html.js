import CalcButton from '../calcbutton/calcbutton.js';

export default {
    get(params) {
        return `<div>
                  <calc-button name="AC"></calc-button>
                  <calc-button name="+/-"></calc-button>
                  <calc-button name="%"></calc-button>
                  <calc-button name="÷" class="orange"></calc-button>
                </div>
                <div>
                  <calc-button name="7"></calc-button>
                  <calc-button name="8"></calc-button>
                  <calc-button name="9"></calc-button>
                  <calc-button name="x" class="orange"></calc-button>
                </div>
                <div>
                  <calc-button name="4"></calc-button>
                  <calc-button name="5"></calc-button>
                  <calc-button name="6"></calc-button>
                  <calc-button name="-" class="orange"></calc-button>
                </div>
                <div>
                  <calc-button name="1"></calc-button>
                  <calc-button name="2"></calc-button>
                  <calc-button name="3"></calc-button>
                  <calc-button name="+" class="orange"></calc-button>
                </div>
                <div>
                  <calc-button name="0" class="wide"></calc-button>
                  <calc-button name="."></calc-button>
                  <calc-button name="=" class="orange"></calc-button>
                </div>`;
    }
}
