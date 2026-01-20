import { registerType, registerEnum } from "./typesystem.js";

export var DerivativeStepType = {
    relative: 0,
    absolute: 1,
};

registerType("DerivativeStepType", DerivativeStepType);
registerEnum("DerivativeStepType", DerivativeStepType);


export function Parameter() {
    this.isSolvedFor = true;
    this.value = null;
    this.derivativeStep = 0.01;
    this.derivateStepType = 0; 
}

Parameter.createWithValue = function(value) {
  var temp = new Parameter();
  temp.value = value;
  return temp;
}

var Parameter$ = {
  derivativeStepSize: function() {
    if (this.derivativeStepType === DerivativeStepType.absolute) {
      return this.derivativeStep;
    } else {
      if (this.value === 0) {
        return this.derivativeStep * Math.abs(this.value);
      } else {
        return this.derivativeStep;
      }
    }
  }
};

registerType("Parameter", [Parameter, Parameter$, null]);
