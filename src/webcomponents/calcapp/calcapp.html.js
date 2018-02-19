import CalcDisplay from '../calcdisplay/calcdisplay.js';
import CalcButtonPanel from '../calcbuttonpanel/calcbuttonpanel.js';

export default {
    get(params) {
        return `<calc-display></calc-display>
                <calc-buttonpanel></calc-buttonpanel>`;
    }
}
