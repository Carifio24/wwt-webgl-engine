export function LevenbergMarquardt() {
  this._jacobian = null;
  this._residuals = null;
  this._regressionParameters0 = null;
  this._derivatives = null;
  this._regressionParameters = [];
  this._observedParameters = [];

  this._regressionFunction = null;
  this._data = [];
  this._l0 = 100;
  this._v = 10;
}

LevenbergMarquardt.create = function(regressionFunction, regressionParameters, observedParameters, data, numberOfDerivativePoints) {
  // NB: Should have data.length === observerParameters.length + 1
  var temp = LevenbergMarquardt();
  this._data = data;
  this._observedParameters = observedParameters;
  this._regressionParameters = regressionParameters;
  this._regressionFunction = regressionFunction;
  var numberOfParameters = this._regressionParameters.length;
  var numberOfPoints = data[0].length;


  return temp;
}
