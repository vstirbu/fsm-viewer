/* global dagreD3 */

module.exports = function final(parent, bbox, node) {
  const r = 15;
  const outerShapeSvg = parent
    .insert("circle", ":first-child")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r)
    .classed('outer', true);

  parent
    .append("circle")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r - 5)
    .classed("inner", true);

  parent
    .classed('final', true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return outerShapeSvg;
}
