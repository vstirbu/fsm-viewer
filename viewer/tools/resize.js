/* global window, d3 */

module.exports = function resize() {
  const svg = d3.select('svg');

  svg.attr('height', window.innerHeight - 5);
  svg.attr('width', window.innerWidth - 5);
};
