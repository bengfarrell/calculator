//import Button from './Button';
import CalcButton from '../webcomponents/calcbutton/calcbutton.js';
import React from 'react';
import PropTypes from 'prop-types';

import './ButtonPanel.css';

class ButtonPanel extends React.Component {
    handleClick = (buttonName) => {
        this.props.clickHandler(buttonName);
    }

    componentDidMount() {
        this.buttonPanelEl.addEventListener(CalcButton.CALC_BUTTON_PRESS, e => this.handleClick(e.detail.name));
    }

    render() {
        return (
          <div ref={(el) => { this.buttonPanelEl = el; }} className="component-button-panel">
            <div>
              <calc-button name="AC" />
              <calc-button name="+/-" />
              <calc-button name="%" />
              <calc-button name="÷" orange />
            </div>
            <div>
              <calc-button name="7" />
              <calc-button name="8" />
              <calc-button name="9" />
              <calc-button name="x" orange />
            </div>
            <div>
              <calc-button name="4" />
              <calc-button name="5" />
              <calc-button name="6" />
              <calc-button name="-" orange />
            </div>
            <div>
              <calc-button name="1" />
              <calc-button name="2" />
              <calc-button name="3" />
              <calc-button name="+" orange />
            </div>
            <div>
              <calc-button name="0" wide />
              <calc-button name="." />
              <calc-button name="=" orange />
            </div>
          </div>
        );
    }
}
ButtonPanel.propTypes = {
  clickHandler: PropTypes.func,
};
export default ButtonPanel;
