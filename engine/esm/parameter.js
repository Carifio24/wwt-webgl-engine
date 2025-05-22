export var DerivativeStepType = {
    relative: 0,
    absolute: 1,
};

export function Parameter() {
    this.isSolvedFor = true;
    this.value = null;
    this.derivativeStep = 0.01;
    this.derivateStepType = 0; 
}
