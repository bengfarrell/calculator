import React from 'react';
//import Display from './Display';
//import ButtonPanel from './ButtonPanel';
import CalcButtonPanel from '../webcomponents/calcbuttonpanel/calcbuttonpanel.js';
import CalcButton from '../webcomponents/calcbutton/calcbutton.js';
import CalcDisplay from '../webcomponents/calcdisplay/calcdisplay.js';
import calculate from '../logic/calculate';
import './App.css';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            total: null,
            next: null,
            operation: null,
        };
    }

    componentDidMount() {
        this.buttonPanelEl.addEventListener(CalcButton.CALC_BUTTON_PRESS, e => this.handleClick(e.detail.name));
        this.displayEl = this.state.next || this.state.total || '0';
    }

    handleClick = (buttonName) => {
        this.setState(calculate(this.state, buttonName));
        this.displayEl.value = this.state.next || this.state.total || '0';
    }

    render() {
        return (
            <div className="component-app">
                <calc-display ref={(el) => { this.displayEl = el; }}></calc-display>
                <calc-buttonpanel ref={(el) => { this.buttonPanelEl = el; }} />
            </div>
        );
    }
}
export default App;
